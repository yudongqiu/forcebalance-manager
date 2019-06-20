"""
fb_executor module

This is built for interfacing with the ForceBalance command line interface.
"""

import os
import shutil
import subprocess
import time
import copy
import numpy as np

from forcebalance.nifty import lp_load
from forcebalance.parser import gen_opts_types, tgt_opts_types

class FBExecutor:
    """ Class designed for executing ForceBalance in command line.
    1. Check the files in an existing project folder, find the status.
    2. Execute ForceBalance program in a subprocess.
    3. Monitor the output and tmp files, send callback signals to FBProject.
    """
    STATUS_SET = {'IDLE', 'RUNNING', 'FINISHED', 'ERROR'}

    @property
    def status(self):
        return self._status

    @status.setter
    def status(self, value):
        assert value in self.STATUS_SET, f'Invalid status value. Choices are: {self.STATUS_SET}'
        self._status = value
        if self.observer is not None:
            self.observer('status_update')

    def __init__(self, root_folder, interval=1, prefix='fb'):
        self.root_folder = root_folder
        self.interval = interval
        self.prefix = prefix
        self.observer = None
        # some file names
        self.checkpoint_fnm = 'checkpoint.p'
        self.input_file = os.path.join(self.root_folder, prefix+'.in')
        self.tmp_folder = os.path.join(self.root_folder, prefix+'.tmp')
        self.output_file = os.path.join(self.root_folder, prefix+'.out')
        self.result_folder = os.path.join(self.root_folder, 'result')
        self.files_to_clean = [os.path.join(self.root_folder, f) for f in [prefix+'.err', prefix+'.bak', prefix+'.sav', 'restart.p']]
        # input options
        self.input_options = {'gen_opt': {}, 'priors': {}, 'tgt_opts': {}}
        # try to load input file
        self.read_input_options()
        # try to load optimization state from output file and tmp folder
        self.read_tmp_folder()
        # read status from output file
        self.read_output_file()
        # store the status of work queue
        self._workqueue_status = {
            'worker_running': 0,
            'worker_total': 0,
            'job_finished': 0,
            'job_total': 0
        }

    def register_observer(self, observer):
        """ register an observer function to handle events """
        self.observer = observer

    def read_input_options(self):
        """ Read input options from self.input_file """
        if not os.path.exists(self.input_file): return
        # aggregate the option types
        gen_opt_type_mapping = {}
        for type_name, type_opts in gen_opts_types.items():
            for opt_name in type_opts:
                vtype = int if type_name == 'ints' else \
                        float if type_name == 'floats' else \
                        bool if type_name == 'bools' else \
                        str
                gen_opt_type_mapping[opt_name] = vtype
        tgt_opt_type_mapping = {}
        for type_name, type_opts in tgt_opts_types.items():
            for opt_name in type_opts:
                vtype = int if type_name == 'ints' else \
                        float if type_name == 'floats' else \
                        bool if type_name == 'bools' else \
                        str
                tgt_opt_type_mapping[opt_name] = vtype
        # start reading file
        with open(self.input_file) as f_in:
            reading_dest_name = None
            reading_dest = None
            tgt_opt_list = []
            for line in f_in:
                content = line.split('#', maxsplit=1)[0].strip()
                if content:
                    content_lower = content.lower()
                    if content_lower == '$options':
                        reading_dest_name = 'gen_opt'
                        reading_dest = self.input_options['gen_opt']
                    elif content_lower == 'priors':
                        reading_dest_name = 'priors'
                        reading_dest = self.input_options['priors']
                    elif content_lower == '/priors':
                        reading_dest_name = 'gen_opt'
                        reading_dest = self.input_options['gen_opt']
                    elif content_lower == '$target':
                        reading_dest_name = 'tgt_opt'
                        reading_dest = {}
                        tgt_opt_list.append(reading_dest)
                    elif content_lower == '$end':
                        reading_dest_name = None
                        reading_dest = None
                    else:
                        ls = content.split()
                        key = ls[0]
                        if reading_dest_name == 'priors':
                            value = float(ls[-1])
                        else:
                            if reading_dest_name == 'gen_opt':
                                vtype = gen_opt_type_mapping[key]
                            elif reading_dest_name == 'tgt_opt':
                                vtype = tgt_opt_type_mapping[key]
                            else:
                                raise ValueError(f"Input line not in any block:\n{line}")
                            if len(ls) == 1:
                                assert vtype == bool
                                value = True
                            elif len(ls) == 2:
                                if vtype == bool:
                                    value = not (ls[1].lower() in {'0', 'false', 'no', 'off'})
                                else:
                                    value = vtype(ls[1])
                            else:
                                value = list(map(vtype, ls[1:]))
                        reading_dest[key] = value
        # insert all options from tgt_opt_list to self.input_options
        for tgt_opts in tgt_opt_list:
            name = tgt_opts.get('name')
            assert name, f"target name missing in {tgt_opts}"
            self.input_options['tgt_opts'][name] = tgt_opts
        print(self.input_options['gen_opt'])

    def set_input_options(self, gen_opts, priors, tgt_opts):
        self.input_options['gen_opts'] = copy.deepcopy(gen_opts)
        self.input_options['priors'] = copy.deepcopy(priors)
        self.input_options['tgt_opts'] = copy.deepcopy(tgt_opts)

    def write_input_file(self):
        """ Write self.input_options as an input file """
        gen_opts = self.input_options['gen_opts'].copy()
        # add a few fields to ensure checkpoint writing
        gen_opts.update({
            'writechk_step': True,
            'writechk': self.checkpoint_fnm,
        })
        with open(self.input_file, 'w') as f:
            f.write('$options\n')
            # write general options
            for key, value in gen_opts.items():
                value_str = ' '.join(map(str, value)) if isinstance(value, (list, tuple)) else str(value)
                f.write(f"{key:<30s} {value_str}\n")
            # write the priors section
            f.write('priors\n')
            for rule, value in self.input_options['priors'].items():
                f.write(f"   {rule:<35s}  : {value:.1e}\n")
            f.write('/priors\n')
            f.write('$end\n\n')
            for tgt_opts in self.input_options['tgt_opts'].values():
                # make a copy and set a high writelevel for details
                tgt_opts = copy.deepcopy(tgt_opts)
                tgt_opts['writelevel'] = 3
                f.write('$target\n')
                for key, value in tgt_opts.items():
                    value_str = ' '.join(map(str, value)) if isinstance(value, (list, tuple)) else str(value)
                    f.write(f"{key:<30s} {value_str}\n")
                f.write('$end\n\n')

    def read_tmp_folder(self):
        """ Update self.obj_hist and self.mval_hist by reading tmp folder """
        self.obj_hist = {}
        self.mvals_hist = {}
        if not os.path.exists(self.tmp_folder): return
        for tgt_folder in os.listdir(self.tmp_folder):
            if tgt_folder == 'forcefield-remote': continue
            assert tgt_folder in self.input_options['tgt_opts'], f"Target {tgt_folder} in tmp folder not exist in {self.input_options['tgt_opts']}"
            tgt_folder_path = os.path.join(self.tmp_folder, tgt_folder)
            for iter_folder in os.listdir(tgt_folder_path):
                iter_folder_path = os.path.join(tgt_folder_path, iter_folder)
                if os.path.isdir(iter_folder_path) and iter_folder.startswith('iter_'):
                    opt_iter = int(iter_folder.split('_')[1])
                    # read objective.p
                    target_name = tgt_folder
                    target_objective = self.load_target_objective(target_name, opt_iter)
                    if target_objective is not None:
                        # create obj_hist item if not exist
                        self.obj_hist.setdefault(opt_iter, {})
                        # put targets objective value into opt_states
                        self.obj_hist[opt_iter][target_name] = {'x': target_objective['X'], 'w': float(self.input_options['tgt_opts'][target_name]['weight'])}
                        # load mval value into mval_hist if not exist
                        if opt_iter not in self.mvals_hist:
                            self.mvals_hist[opt_iter] = np.loadtxt(os.path.join(iter_folder_path, 'mvals.txt'))

    def read_output_file(self):
        """ Read output file to determine current status """
        if os.path.exists(self.output_file):
            with open(self.output_file) as fout:
                lines = fout.readlines()
                ending_content = '\n'.join(lines[-10:])
            if "Calculation Finished." in ending_content:
                self.status = 'FINISHED'
            elif "I have not failed." in ending_content:
                self.status = 'FINISHED'
                self.not_converged = True
            else:
                self.status = 'ERROR'
        else:
            self.status = 'IDLE'


    def clean_up(self):
        """ Remove ALL output and temporary files """
        for f in [self.output_file, self.tmp_folder, self.result_folder] + self.files_to_clean:
            if os.path.isfile(f):
                os.remove(f)
            elif os.path.isdir(f):
                shutil.rmtree(f)


    def run(self):
        """ Start the ForceBalance run in subprocess """
        assert os.path.exists(self.input_file), f'ForceBalance input file {self.input_file} does not exist'
        self.status = "RUNNING"
        self.proc = subprocess.Popen(['ForceBalance', f'{self.prefix}.in'], cwd=self.root_folder, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
        self.obj_hist = {}
        self.mvals_hist = {}
        self.monitor()

    def monitor(self):
        if not hasattr(self, 'proc'): return
        # check stdout and stderr pipes, send data to frontend
        for line in self.proc.stdout:
            line = line.decode()
            if 'Input file with saved parameters' in line:
                self.get_iter_update()
            elif "Calculation Finished." in line:
                self.status = 'FINISHED'
            elif "I have not failed." in line:
                self.status = 'FINISHED'
                self.not_converged = True
            elif "error" in line:
                self.status = 'ERROR'
            elif "workers busy" in line and "jobs complete" in line:
                self.update_workqueue_status(line)
        if self.proc.poll() is None:
            return
        # repeat the monitor
        time.sleep(self.interval)
        self.monitor()

    def kill(self):
        if not hasattr(self, 'proc'): return
        self.proc.kill()
        self.status = 'IDLE'

    def get_iter_update(self):
        """ Read the tmp folder during running, get updated information and trigger self.observer """
        # update self.obj_hist
        opt_iter = len(self.obj_hist)
        self.obj_hist[opt_iter] = {}
        for target_name, tgt_options in self.input_options['tgt_opts'].items():
            target_objective = self.load_target_objective(target_name, opt_iter)
            self.obj_hist[opt_iter][target_name] = {'x': target_objective['X'], 'w': float(tgt_options['weight'])}
        # update self.mvals_hist
        assert len(self.mvals_hist) == opt_iter, f'mvals_hist length {len(self.mvals_hist)} not consistent with obj_hist length {opt_iter}'
        first_target_name = next(iter(self.input_options['tgt_opts']))
        self.mvals_hist[opt_iter] = np.loadtxt(os.path.join(self.tmp_folder, first_target_name, f'iter_{opt_iter:04d}', 'mvals.txt'))
        # trigger observer
        if self.observer is not None:
            self.observer('iter_update')

    def load_target_objective(self, target_name, opt_iter):
        folder = os.path.join(self.tmp_folder, target_name, f'iter_{opt_iter:04d}')
        if not os.path.isdir(folder):
            raise RuntimeError(f"tmp folder {folder} does not exist")
        obj_file = os.path.join(folder, 'objective.p')
        if os.path.exists(obj_file):
            obj_data = lp_load(obj_file)
        else:
            obj_data = None
        return obj_data

    def get_workqueue_status(self):
        """ Get the number of running/total works of work queue """
        return self._workqueue_status.copy()

    def update_workqueue_status(self, line):
        worker_info = line[:line.index('workers busy')].rsplit(maxsplit=1)[-1]
        jobs_info = line[:line.index('jobs complete')].rsplit(maxsplit=1)[-1]
        busy_worker, total_worker = map(int, worker_info.split('/'))
        job_finished, job_total = map(int, jobs_info.split('/'))
        self._workqueue_status = {
            'worker_running': busy_worker,
            'worker_total': total_worker,
            'job_finished': job_finished,
            'job_total': job_total
        }
        print(f"work queue status updated {self._workqueue_status}")

    def get_target_objective_data(self, target_name, opt_iter):
        """ Read objective data for a target and an optimization iteration from the tmp folder """
        res = {}
        target_options = self.input_options['tgt_opts'].get(target_name, None)
        if target_options is None:
            res['error'] = f"target {target_name} not found"
            print(f"get_target_objective_data: {res['error']}")
            return res
        # check the tmp folder for this target
        folder = os.path.join(self.tmp_folder, target_name, f'iter_{opt_iter:04d}')
        if not os.path.isdir(folder):
            res['error'] = f"tmp folder {folder} not found"
            print(f"get_target_objective_data: {res['error']}")
            return res
        # get target type specific objective information
        target_type = target_options['type']
        if target_type.lower().startswith('abinitio'):
            energy_compare_file = os.path.join(folder, 'EnergyCompare.txt')
            if not os.path.isfile(energy_compare_file):
                res['error'] = f"file {energy_compare_file} not found"
                print(f"get_target_objective_data: {res['error']}")
                return res
            energy_compare_data = np.loadtxt(energy_compare_file)
            res['qm_energies'] = energy_compare_data[:, 0].tolist()
            res['mm_energies'] = energy_compare_data[:, 1].tolist()
            res['diff'] = energy_compare_data[:, 2].tolist()
            res['weights'] = energy_compare_data[:, 3].tolist()
        else:
            res['error'] = f"get objective data for target type {target_type} not implemented"
            print(f"get_target_objective_data: {res['error']}")
            return res
        return res
