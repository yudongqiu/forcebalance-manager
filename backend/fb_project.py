import time
import numpy as np
import threading
import os
import shutil
import json
import copy
import tempfile

import forcebalance

from backend.target_validators import new_validator

class FBProject(object):
    project_status = {'idle': 0, 'running':1, 'finished': 2, 'error': 3}

    @property
    def status(self):
        return self._status

    @status.setter
    def status(self, value):
        assert value in self.project_status.values(), 'Invalid status value.'
        self._status = value

    @property
    def name(self):
        return self._name

    def __init__(self, name='Project'):
        self._name = name
        self.status = self.project_status['idle']
        self._options = dict()
        self._manager = None
        self.lock = threading.Lock()
        self.project_folder = None
        self.ff_folder = 'forcefield'
        self.conf_folder = 'config'
        self.targets_folder = 'targets'
        self.fb_targets = dict()
        # some default optimizer options that matches forcebalance.parser.gen_opts_types
        self.optimizer_options = {
            'jobtype': 'NEWTON',
            'maxstep': 10,
            'penalty_type': 'L2',
            'convergence_objective': 1e-4,
            'convergence_step': 1e-4,
            'convergence_gradient': 1e-3,
            'trust0': 0.1,
            'finite_difference_h': 1e-3,
        }
        self.input_filename = 'fb.in'
        self.opt_state = dict()
        self.out_folder = 'outputs'
        self.optimize_results = None
        # following the rule of ForceBalance choosing where to put the result force field
        self.result_folder = os.path.join('result', self.input_filename.split('.')[0])
        # temporary dict to hold the target validators
        self.target_validators = dict()

    def register_manager(self, manager):
        """ Register the FBmanager instance for callback functions """
        self._manager = manager

    def create_project_folder(self, project_folder):
        """ create project folder as part of the initialization called by FBmanager """
        assert not os.path.exists(project_folder)
        os.makedirs(project_folder)
        self.project_folder = project_folder

    def load_from_project_folder(self, project_folder):
        """ Load the project data from the project folder """
        self.project_folder = project_folder
        # forcebalance constructor only works in project folder
        os.chdir(self.project_folder)
        # load self.force_field
        if os.path.exists(self.ff_folder):
            ff_fnames = os.listdir(self.ff_folder)
            self.ff_options = {'forcefield': ff_fnames}
            self.force_field = forcebalance.forcefield.FF(self.ff_options)
            # load priors
            self.load_ff_prior()
            # load fb_targets
            self.load_fb_targets()
            # load optimizer_options
            self.load_optimizer_options()
            # load previous opt_state
            self.load_opt_state()
            # load status
            self.load_status()
            # load optimize results
            self.load_optimize_results()

    def setup_forcefield(self, data):
        """ Setup self.force_field """
        assert self.project_folder, 'project_folder is not setup correctly'
        # make sure we're at the project folder
        os.chdir(self.project_folder)
        # create the "forcefield" folder if not exist
        if os.path.exists(self.ff_folder):
            shutil.rmtree(self.ff_folder)
        os.mkdir(self.ff_folder)
        filename = data['fileName']
        # write the forcefield file inside the folder
        with open(os.path.join(self.ff_folder, filename), 'wb') as byte_f:
            byte_f.write(data['fileData'])
        # create a simple options dict for interfacting with forcebalance.forcefield.FF
        self.ff_options = {'forcefield': [filename]}
        self.force_field = forcebalance.forcefield.FF(self.ff_options)
        # return success
        return 0

    def load_ff_prior(self):
        """ Load the prior settings from JSON file """
        assert self.project_folder != None, 'self.project_folder not setup yet'
        os.chdir(self.project_folder)
        prior_fn = os.path.join(self.conf_folder, 'ff_priors.json')
        if os.path.exists(prior_fn):
            with open(prior_fn) as jfile:
                self.force_field.priors = json.load(jfile)
            self.force_field.rsmake()

    def save_ff_prior(self):
        """ Save the prior settings as a JSON file """
        assert self.project_folder != None, 'self.project_folder not setup yet'
        assert hasattr(self, 'force_field'), 'self.force_field not created yet'
        os.chdir(self.project_folder)
        if not os.path.exists(self.conf_folder):
            os.mkdir(self.conf_folder)
        prior_fn = os.path.join(self.conf_folder, 'ff_priors.json')
        with open(prior_fn, 'w') as jfile:
            json.dump(self.force_field.priors, jfile, indent=4)
        print(f"force field priors of project <{self.name}> saved as {prior_fn}")

    def get_forcefield_info(self):
        """ return some information about self.force_field """
        if not hasattr(self, 'force_field'):
            return None
        return {
            'filenames': self.ff_options['forcefield'],
            'plist': list(self.force_field.plist),
            'pvals': list(self.force_field.pvals0),
            'priors': list(self.force_field.rs),
            'raw_text': self.force_field.ffdata[self.ff_options['forcefield'][0]],
            'prior_rules': list(self.force_field.priors.items()),
        }

    def set_forcefield_prior_rules(self, data):
        """ apply the prior rules from frontend """
        assert hasattr(self, 'force_field'), 'self.force_field is not created yet'
        self.force_field.priors = {rule[0]: float(rule[1]) for rule in data}
        self.force_field.rsmake()
        # save prior rules to file
        self.save_ff_prior()
        return 0

    def create_fitting_target(self, data):
        """ Add a fitting target to this project """
        assert self.project_folder != None, 'self.project_folder not setup yet'
        # make sure we're at the project folder
        os.chdir(self.project_folder)
        # create the "targets" folder if not exist
        if not os.path.exists(self.targets_folder):
            os.mkdir(self.targets_folder)
        # create a new folder for the target
        target_name = data['targetName']
        target_type = data['targetType']
        target_folder = os.path.join(self.targets_folder, target_name)
        os.mkdir(target_folder)
        # write the uploaded file in this folder
        for fname, fdata in zip(data['fileNames'], data['fileDatas']):
            with open(os.path.join(target_folder, fname), 'wb') as byte_f:
                byte_f.write(fdata)
        assert target_name not in self.fb_targets, f'Target {target_name} already exists!'
        # use default options of each type
        default_target_options = {
            'ABINITIO_GMX': {
                'energy': True,
                'force': True,
                'w_energy': 1.0,
                'w_force': 1.0,
            }
        }
        target_options = default_target_options[target_type]
        target_options.update({
            'name': target_name,
            'type': target_type,
            'fileNames': data['fileNames'],
        })
        self.fb_targets[target_name] = target_options
        self.save_fb_targets()

    def validate_target_file(self, data):
        """ Validate file for a fitting target before adding to this project """
        # parse input data
        target_name = data['targetName']
        target_type = data['targetType']
        file_type = data['fileType']
        # write the files in a temporary folder
        folder = tempfile.mkdtemp(prefix='validator_')
        fileuris = []
        for fname, fdata in zip(data['fileNames'], data['fileDatas']):
            fileuri = os.path.join(folder, fname)
            with open(fileuri, 'wb') as byte_f:
                byte_f.write(fdata)
            fileuris.append(fileuri)
        # create a new target validator if not exist, else continue to use existing one
        validator = self.target_validators.setdefault(target_name, new_validator(target_type))
        # validate the files
        return validator.validate(file_type, fileuris)

    def delete_fitting_target(self, target_name):
        """ Delete a fitting target from this project """
        assert target_name in self.fb_targets, f'Target {target_name} not found'
        self.fb_targets.pop(target_name)
        self.save_fb_targets()
        # remove the target folder
        assert self.project_folder != None, 'self.project_folder not setup yet'
        os.chdir(self.project_folder)
        target_folder = os.path.join(self.targets_folder, target_name)
        if os.path.exists(target_folder):
            shutil.rmtree(target_folder)
        else:
            print("Warning! Deleting target {target_name} but folder not found.")

    def get_target_names(self):
        return list(self.fb_targets.keys())

    def get_target_options(self, target_name):
        return self.fb_targets[target_name]

    def set_target_options(self, target_name, options):
        self.fb_targets[target_name].update(options)
        # save target configure on disk
        self.save_fb_targets()

    def save_fb_targets(self):
        """ Save the fb_targets as a JSON file """
        assert self.project_folder != None, 'self.project_folder not setup yet'
        os.chdir(self.project_folder)
        if not os.path.exists(self.conf_folder):
            os.mkdir(self.conf_folder)
        targets_fn = os.path.join(self.conf_folder, 'fb_targets.json')
        with open(targets_fn, 'w') as jfile:
            json.dump(self.fb_targets, jfile, indent=4)
        print(f"Targets of project <{self.name}> saved as {targets_fn}")

    def load_fb_targets(self):
        """ Load the fb_targets from JSON file """
        assert self.project_folder != None, 'self.project_folder not setup yet'
        os.chdir(self.project_folder)
        targets_fn = os.path.join(self.conf_folder, 'fb_targets.json')
        if os.path.exists(targets_fn):
            with open(targets_fn) as jfile:
                self.fb_targets = json.load(jfile)
            # make sure each existing target has its own folder
            assert os.path.exists(self.targets_folder), 'targets/ folder missing!'
            assert set(os.listdir(self.targets_folder)) == set(self.fb_targets.keys()), 'targets/ folder contents does not match configure!'

    def get_optimizer_options(self):
        return self.optimizer_options

    def set_optimizer_options(self, data):
        for key, value in self.optimizer_options.items():
            if key in data:
                try:
                    self.optimizer_options[key] = type(value)(data[key])
                except Exception as e:
                    print(e)
        self.save_optimizer_options()

    def save_optimizer_options(self):
        """ Save self.optimizer_options as a JSON file """
        assert self.project_folder != None, 'self.project_folder not setup yet'
        os.chdir(self.project_folder)
        if not os.path.exists(self.conf_folder):
            os.mkdir(self.conf_folder)
        fn = os.path.join(self.conf_folder, 'optimizer_options.json')
        with open(fn, 'w') as jfile:
            json.dump(self.optimizer_options, jfile, indent=4)
        print(f"Optimizer options of project <{self.name}> saved as {fn}")

    def load_optimizer_options(self):
        """ Load self.optimizer_options from a JSON file """
        assert self.project_folder != None, 'self.project_folder not setup yet'
        os.chdir(self.project_folder)
        fn = os.path.join(self.conf_folder, 'optimizer_options.json')
        if os.path.exists(fn):
            with open(fn) as jfile:
                self.optimizer_options = json.load(jfile)

    def save_input_file(self):
        # make sure we're in the project folder
        assert self.project_folder != None, 'self.project_folder not setup yet'
        os.chdir(self.project_folder)
        # write the input file
        with open(self.input_filename, 'w') as f:
            f.write('$options\n')
            for key, value in self.optimizer_options.items():
                f.write(f"{key} {value}\n")
            f.write('$end\n\n')
            for tgt_opts in self.fb_targets.values():
                f.write('$target\n')
                for key, value in tgt_opts.items():
                    f.write(f"{key} {value}\n")
                f.write('$end\n\n')

    def launch_optimizer(self):
        # make sure we're in the project folder
        assert self.project_folder != None, 'self.project_folder not setup yet'
        os.chdir(self.project_folder)
        # build objective
        target_options = []
        for opt in self.fb_targets.values():
            tgt_opt = forcebalance.parser.tgt_opts_defaults.copy()
            tgt_opt.update(opt)
            target_options.append(tgt_opt)
        gen_options = forcebalance.parser.gen_opts_defaults.copy()
        gen_options.update(self.optimizer_options)
        gen_options['root'] = self.project_folder
        gen_options['input_file'] = self.input_filename
        self.objective = forcebalance.objective.Objective(gen_options, target_options, self.force_field)
        self.optimizer = forcebalance.optimizer.Optimizer(gen_options, self.objective, self.force_field)
        # make sure optimizer.writechk() function is called, and make a breakpoint to save an opt state
        self.optimizer.wchk_step = True
        self.optimizer.writechk = self.notify_me(self.optimizer.writechk, 'writechk')
        # generate input file for reproducibility
        self.save_input_file()
        # reset opt state
        self.opt_state = dict()
        # run optimizer
        self.update_status('running')
        t = threading.Thread(target=self.exec_launch_optimizer)
        t.start()

    def exec_launch_optimizer(self):
        assert hasattr(self, 'optimizer'), 'self.optimizer not setup correctly'
        with self.lock:
            self.optimizer.Run()
            self.update_status('finished')
            self.collect_optimize_results()

    def notify_me(self, func, msg):
        """ Wrapper function to let self get notified when another function is called """
        def f(*args, **kwargs):
            self.notified(msg)
            return func(*args, **kwargs)
        return f

    def notified(self, msg):
        if msg == 'writechk':
            print(f"@@@@ Notified by optimizer.writechk()")
            self.update_opt_state()
        else:
            print(f"@@@@ NOTIFIED by {msg}")

    def update_status(self, statusName):
        assert self._manager is not None, 'This project has not been connected to a manager yet'
        assert statusName in self.project_status, f'Invalid statusName {statusName}'
        self.status = self.project_status[statusName]
        self.save_status()
        self._manager.update_status(self._name)

    def save_status(self):
        """ Save current self.status as a JSON file in outputs folder """
        assert self.out_folder != None, 'self.out_folder not setup yet'
        assert hasattr(self, 'status'), 'self.status not created yet'
        os.chdir(self.project_folder)
        if not os.path.exists(self.out_folder):
            os.mkdir(self.out_folder)
        fn = os.path.join(self.out_folder, 'status.json')
        with open(fn, 'w') as jfile:
            json.dump(self.status, jfile, indent=4)
        print(f"status of project <{self.name}> saved as {fn}")

    def load_status(self):
        """ Load the status from JSON file """
        assert self.project_folder != None, 'self.project_folder not setup yet'
        os.chdir(self.project_folder)
        fn = os.path.join(self.out_folder, 'status.json')
        if os.path.exists(fn):
            with open(fn) as jfile:
                self.status = json.load(jfile)

    def reset_optimizer(self):
        self.update_status('idle')

    def update_opt_state(self):
        """ Update self.opt_iter and self.opt_state when notified by forcebalance """
        self.opt_iter = self.optimizer.iteration
        if self.opt_iter not in self.opt_state:
            obj_dict = copy.deepcopy(self.objective.ObjDict)
            chk = copy.deepcopy(self.optimizer.chk)
            pvals = self.force_field.create_pvals(chk['xk'])
            p_names = self.force_field.plist
            prev_pvals = self.force_field.pvals0 if self.opt_iter == 1 else [self.opt_state[self.opt_iter-1]['paramUpdates'][p]['pval'] for p in p_names]
            param_updates = {p_name: {'gradient': g, 'prev_pval': prev_v, 'pval': v} for p_name, g, prev_v, v in zip(p_names, chk['G'], prev_pvals, pvals)}
            self.opt_state[self.opt_iter] = {
                'iteration': self.opt_iter,
                'objdict': obj_dict,
                'paramUpdates': param_updates,
            }
            self.save_opt_state()
            # notify the frontend about opt_iter + 1
            self._manager.update_opt_state(self._name)

    def save_opt_state(self):
        """ Save current self.opt_state as a JSON file in outputs folder """
        assert self.out_folder != None, 'self.out_folder not setup yet'
        assert hasattr(self, 'opt_state'), 'self.opt_state not created yet'
        os.chdir(self.project_folder)
        if not os.path.exists(self.out_folder):
            os.mkdir(self.out_folder)
        fn = os.path.join(self.out_folder, 'opt_state.json')
        with open(fn, 'w') as jfile:
            json.dump(self.opt_state, jfile, indent=4)
        print(f"opt_state of project <{self.name}> saved as {fn}")

    def load_opt_state(self):
        """ Load the opt_state from JSON file and set current iter """
        assert self.project_folder != None, 'self.project_folder not setup yet'
        os.chdir(self.project_folder)
        fn = os.path.join(self.out_folder, 'opt_state.json')
        if os.path.exists(fn):
            with open(fn) as jfile:
                self.opt_state = json.load(jfile)
        if self.opt_state:
            self.opt_iter = max(self.opt_state.keys())

    def collect_optimize_results(self):
        """ Aggregate and return optimize results after finish """
        assert self.status == self.project_status['finished']
        converged = not (self.optimizer.iteration >= self.optimizer.maxstep)
        self.optimize_results = {
            'converged': converged,
            'iteration': self.opt_iter,
            'obj_values': [self.opt_state[i]['objdict']['Total'] for i in range(1, self.opt_iter+1)],
        }
        self.save_optimize_results()

    def save_optimize_results(self):
        assert self.out_folder != None, 'self.out_folder not setup yet'
        assert hasattr(self, 'optimize_results'), 'self.optimize_results not created yet'
        os.chdir(self.project_folder)
        if not os.path.exists(self.out_folder):
            os.mkdir(self.out_folder)
        fn = os.path.join(self.out_folder, 'optimize_results.json')
        with open(fn, 'w') as jfile:
            json.dump(self.optimize_results, jfile, indent=4)
        print(f"optimize_results of project <{self.name}> saved as {fn}")

    def load_optimize_results(self):
        """ Load the optimize_results from JSON file """
        assert self.project_folder != None, 'self.project_folder not setup yet'
        os.chdir(self.project_folder)
        fn = os.path.join(self.out_folder, 'optimize_results.json')
        if os.path.exists(fn):
            with open(fn) as jfile:
                self.optimize_results = json.load(jfile)

    def get_final_forcefield_info(self):
        """ return some information about self.force_field """
        if not hasattr(self, 'force_field'):
            return None
        raw_text = ''
        for f in self.ff_options['forcefield']:
            with open(os.path.join(self.result_folder, f)) as ff_file:
                raw_text += ff_file.read() + '\n\n'
        return {
            'filenames': self.ff_options['forcefield'],
            'plist': list(self.force_field.plist),
            'pvals': [self.opt_state[self.opt_iter]['paramUpdates'][pname]['pval'] for pname in self.force_field.plist],
            'priors': list(self.force_field.rs),
            'raw_text': raw_text,
            'prior_rules': list(self.force_field.priors.items()),
        }