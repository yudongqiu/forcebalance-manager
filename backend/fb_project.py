import time
import threading
import os
import shutil
import json
import copy
import tempfile

import forcebalance

from backend.target_validators import new_validator
from backend.fb_executor import FBExecutor

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
        self._manager = None
        self.lock = threading.Lock()
        self.project_folder = None
        self.ff_folder = 'forcefield'
        self.conf_folder = 'config'
        self.targets_folder = 'targets'
        self.fb_targets = dict()
        # some default optimizer options that matches forcebalance.parser.gen_opts_types
        self.optimizer_options = {
            'jobtype': 'OPTIMIZE',
            'maxstep': 10,
            'penalty_type': 'L2',
            'convergence_objective': 1e-4,
            'convergence_step': 1e-4,
            'convergence_gradient': 1e-3,
            'trust0': 0.1,
            'finite_difference_h': 1e-3,
            'asynchronous': False,
            'wq_port': 0,
        }
        self.opt_state = dict()
        # temporary dict to hold the target validators
        self.target_validators = dict()

    def register_manager(self, manager):
        """ Register the FBmanager instance for callback functions """
        self._manager = manager

    def observe_executor(self, event):
        """ Observe events from executor and perform actions """
        if event == 'status_update':
            self.update_status()
        elif event == 'iter_update':
            self.update_opt_state()
        elif event == 'work_queue_update':
            self._manager.update_work_queue_status(self._name)
        else:
            print(f"Observed unrecognized event {event}")

    def in_project_folder(func):
        "Decorator for functions to run in project folder"
        def new_func(self, *args, **kwargs):
            assert self.project_folder, 'project_folder is not setup correctly'
            # check the project folder exist
            assert os.path.exists(self.project_folder), f'project_folder {self.project_folder} does not exist'
            # make sure we're at the project folder
            os.chdir(self.project_folder)
            return func(self, *args, **kwargs)
        return new_func

    def create_project_folder(self, project_folder):
        """ create project folder as part of the initialization called by FBmanager """
        assert not os.path.exists(project_folder)
        os.makedirs(project_folder)
        self.project_folder = project_folder
        # create fbexecutor
        self._fbexecutor = FBExecutor(self.project_folder, prefix='fb')
        self._fbexecutor.register_observer(self.observe_executor)

    def load_from_project_folder(self, project_folder):
        """ Load the project data from the project folder """
        self.project_folder = project_folder
        os.chdir(project_folder)
        # create fbexecutor
        self._fbexecutor = FBExecutor(self.project_folder, prefix='fb')
        self._fbexecutor.register_observer(self.observe_executor)
        # load optimizer_options
        self.load_optimizer_options()
        # load self.force_field
        if os.path.exists(self.ff_folder):
            ff_fnames = self.optimizer_options['forcefield'] if 'forcefield' in self.optimizer_options else os.listdir(self.ff_folder)
            self.ff_options = {'forcefield': ff_fnames}
            self.force_field = forcebalance.forcefield.FF(self.ff_options)
            # load priors
            self.load_ff_prior()
            # load previous opt_state
            self.update_opt_state()
        if os.path.exists(self.targets_folder):
            # load fb_targets
            self.load_fb_targets()
        # update status
        self.update_status()

    @in_project_folder
    def setup_forcefield(self, data):
        """ Setup self.force_field """
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

    @in_project_folder
    def load_ff_prior(self):
        """ Load the prior settings from JSON file or an existing input file """
        prior_fn = os.path.join(self.conf_folder, 'ff_priors.json')
        if os.path.exists(prior_fn):
            with open(prior_fn) as jfile:
                self.force_field.priors = json.load(jfile)
        else:
            # if the json file does not exist, try to load from the input file through executor
            self.force_field.priors = copy.deepcopy(self._fbexecutor.input_options['priors'])
        self.force_field.rsmake()

    @in_project_folder
    def save_ff_prior(self):
        """ Save the prior settings as a JSON file """
        assert hasattr(self, 'force_field'), 'self.force_field not created yet'
        if not os.path.exists(self.conf_folder):
            os.mkdir(self.conf_folder)
        prior_fn = os.path.join(self.conf_folder, 'ff_priors.json')
        with open(prior_fn, 'w') as jfile:
            json.dump(self.force_field.priors, jfile, indent=4)
        print(f"force field priors of project <{self.name}> saved as {prior_fn}")

    @in_project_folder
    def get_forcefield_info(self):
        """ return some information about self.force_field """
        if not hasattr(self, 'force_field'):
            return None
        # get content of all files
        raw_text = ''
        for filename in self.ff_options['forcefield']:
            with open(os.path.join(self.ff_folder, filename)) as ff_file:
                raw_text += f'[ {filename} ]\n'
                raw_text += ff_file.read()
        return {
            'filenames': self.ff_options['forcefield'],
            'plist': list(self.force_field.plist),
            'pvals': list(self.force_field.pvals0),
            'priors': list(self.force_field.rs),
            'raw_text': raw_text,
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

    @in_project_folder
    def create_fitting_target(self, data):
        """ Add a fitting target to this project """
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
            },
            'ABINITIO_SMIRNOFF': {
                'energy': True,
                'force': True,
                'w_energy': 1.0,
                'w_force': 1.0,
                'attenuate': True,
                'energy_denom': 2.0,
                'energy_upper': 10.0,
                'force_rms_override': 100.0,
            }
        }
        target_options = default_target_options[target_type]
        if target_type == 'ABINITIO_GMX':
            gro_filename,qdata_filename,top_filename,mdp_filename = data['fileNames']
            target_options.update({
                'name': target_name,
                'type': target_type,
                'weight': 1.0,
                'coords': gro_filename,
                'gmx_top': top_filename,
                'gmx_mdp': mdp_filename,
            })
        elif target_type == 'ABINITIO_SMIRNOFF':
            coords_filename,qdata_filename,mol2_filename,pdb_filename = data['fileNames']
            target_options.update({
                'name': target_name,
                'type': target_type,
                'weight': 1.0,
                'coords': coords_filename,
                'mol2': [mol2_filename],
                'pdb': pdb_filename,
            })
        self.fb_targets[target_name] = target_options
        self.save_fb_targets()

    def validate_target_file(self, data):
        """ Validate file for a fitting target before adding to this project """
        # parse input data
        target_name = data['targetName']
        target_type = data['targetType']
        file_type = data['fileType']
        file_names = data['fileNames']
        file_datas = data['fileDatas']
        # create a new target validator if not exist, else continue to use existing one
        validator = self.target_validators.get(target_name, None)
        if validator is None:
            self.target_validators[target_name] = validator = new_validator(target_type, target_name)
        # validate the files
        ret = validator.validate(file_type, file_names, file_datas)
        # return
        return ret

    def validate_target_create(self, data):
        """ Final test to see if a target is able to be created """
        # check if force field is created
        assert hasattr(self, 'force_field'), 'self.force_field need to be created before testing create targets'
        # parse input data
        target_name = data['targetName']
        # get validator for this target
        validator = self.target_validators.get(target_name, None)
        assert validator is not None, 'validator should already exist for this target before final test create'
        # copy the forcefield folder to validator's tmp root
        validator.copy_ffdir(self.project_folder, self.ff_folder)
        # run test create
        return validator.test_create(self.force_field)

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

    def get_all_targets_info(self):
        return self.fb_targets

    def get_target_options(self, target_name):
        return self.fb_targets[target_name]

    def set_target_options(self, target_name, options):
        self.fb_targets[target_name].update(options)
        # save target configure on disk
        self.save_fb_targets()

    @in_project_folder
    def save_fb_targets(self):
        """ Save the fb_targets as a JSON file """
        if not os.path.exists(self.conf_folder):
            os.mkdir(self.conf_folder)
        targets_fn = os.path.join(self.conf_folder, 'fb_targets.json')
        with open(targets_fn, 'w') as jfile:
            json.dump(self.fb_targets, jfile, indent=4)
        print(f"Targets of project <{self.name}> saved as {targets_fn}")

    @in_project_folder
    def load_fb_targets(self):
        """ Load the fb_targets from JSON file """
        targets_fn = os.path.join(self.conf_folder, 'fb_targets.json')
        if os.path.exists(targets_fn):
            with open(targets_fn) as jfile:
                self.fb_targets = json.load(jfile)
        else:
            # get target options from input file through executor
            self.fb_targets = copy.deepcopy(self._fbexecutor.input_options['tgt_opts'])
        # make sure each existing target has its own folder
        assert os.path.exists(self.targets_folder), 'targets/ folder missing!'
        missing_targets = set(self.fb_targets.keys()) - set(os.listdir(self.targets_folder))
        assert len(missing_targets) == 0 , f'targets missing:\n {missing_targets}'

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

    @in_project_folder
    def save_optimizer_options(self):
        """ Save self.optimizer_options as a JSON file """
        if not os.path.exists(self.conf_folder):
            os.mkdir(self.conf_folder)
        fn = os.path.join(self.conf_folder, 'optimizer_options.json')
        with open(fn, 'w') as jfile:
            json.dump(self.optimizer_options, jfile, indent=4)
        print(f"Optimizer options of project <{self.name}> saved as {fn}")

    @in_project_folder
    def load_optimizer_options(self):
        """ Load self.optimizer_options from a JSON file """
        fn = os.path.join(self.conf_folder, 'optimizer_options.json')
        if os.path.exists(fn):
            with open(fn) as jfile:
                self.optimizer_options = json.load(jfile)
        else:
            # get optimizer options from input files through executor
            self.optimizer_options.update(self._fbexecutor.input_options['gen_opt'])

    @in_project_folder
    def save_input_file(self):
        # set target option "remote" to True if using async evaluation
        if self.optimizer_options.get('asynchronous'):
            for tgt_opts in self.fb_targets.values():
                tgt_opts['remote'] = True
        # set forcefield in optimizer options
        self.optimizer_options['forcefield'] = self.ff_options['forcefield']
        # write the input file
        self._fbexecutor.set_input_options(self.optimizer_options, self.force_field.priors, self.fb_targets)
        self._fbexecutor.write_input_file()

    @in_project_folder
    def launch_optimizer(self):
        # make sure optimizer is not running now
        assert self.status != self.project_status['running'], 'Optimizer is running, wait to finish before launching new'
        # clean up old runs
        self.opt_state = {}
        self._fbexecutor.clean_up()
        # generate input file
        self.save_input_file()
        # run the executor
        self._fbexecutor.run()


    def update_status(self):
        assert self._manager is not None, 'This project has not been connected to a manager yet'
        status = self._fbexecutor.status.lower()
        assert status in self.project_status, f'Invalid statusName {status}'
        self.status = self.project_status[status]
        self._manager.update_status(self._name)

    def reset_optimizer(self):
        self._fbexecutor.kill()
        self._fbexecutor.clean_up()
        self.update_status('idle')

    def update_opt_state(self):
        """ Update self.opt_state when notified by executor """
        p_names = self.force_field.plist
        for opt_iter in sorted(self._fbexecutor.obj_hist):
            obj_dict = self._fbexecutor.obj_hist[opt_iter]
            if opt_iter not in self.opt_state:
                # compute param_updates
                mvals = self._fbexecutor.mvals_hist[opt_iter]
                pvals = self.force_field.create_pvals(mvals)
                param_updates = {p_name: {'pval': v} for p_name, v in zip(p_names, pvals)}
                for i_p, p_name in enumerate(p_names):
                    param_updates[p_name]['prev_pval'] = self.force_field.pvals0[i_p] if opt_iter == 0 else self.opt_state[opt_iter-1]['paramUpdates'][p_name]['pval']
                # compute "Total" for obj dict
                obj_dict = copy.deepcopy(obj_dict)
                obj_dict['Total'] = sum(v['x'] * v['w'] for v in obj_dict.values())
                self.opt_state[opt_iter] = {
                    'iteration': opt_iter,
                    'objdict': copy.deepcopy(obj_dict),
                    'paramUpdates': param_updates,
                }
        # notify the frontend about opt_iter + 1
        self._manager.update_opt_state(self._name)

    def get_target_objective_data(self, target_name, opt_iter):
        return self._fbexecutor.get_target_objective_data(target_name, opt_iter)

    def collect_optimize_results(self):
        """ Aggregate and return optimize results after finish """
        assert self.status == self.project_status['finished']
        converged = not (self._fbexecutor.not_converged) if hasattr(self._fbexecutor, 'not_converged') else True
        optimize_results = {
            'converged': converged,
            'iteration': len(self.opt_state),
            'obj_values': [self.opt_state[i]['objdict']['Total'] for i in range(len(self.opt_state))],
        }
        return optimize_results

    @in_project_folder
    def get_final_forcefield_info(self):
        """ return some information about self.force_field """
        if not hasattr(self, 'force_field'):
            return None
        raw_text = ''
        for f in self.ff_options['forcefield']:
            result_folder = os.path.join('result', 'fb')
            with open(os.path.join(result_folder, f)) as ff_file:
                raw_text += ff_file.read() + '\n\n'
        last_opt_iter = len(self.opt_state) - 1
        return {
            'filenames': self.ff_options['forcefield'],
            'plist': list(self.force_field.plist),
            'pvals': [self.opt_state[last_opt_iter]['paramUpdates'][pname]['pval'] for pname in self.force_field.plist],
            'priors': list(self.force_field.rs),
            'raw_text': raw_text,
            'prior_rules': list(self.force_field.priors.items()),
        }

    def get_workqueue_status(self):
        """ return the status of work queue system """
        # check if work queue is installed
        try:
            import work_queue
        except ImportError:
            data = {
                'code': 'not_installed',
                'description': 'work_queue module is not installed, please try forcebalance/tools/install-cctools-62.sh'
            }
        if self.status == self.project_status['running']:
            code = 'running'
            description = 'work queue is in use.'
        else:
            code = 'ready'
            description = 'work queue is ready.'
        data = {
            'code': code,
            'description': description,
        }
        data.update(self._fbexecutor.get_workqueue_status())
        return data

    # @staticmethod
    # def merge_options(source_dict, dest_dict):
    #     """ merge all key-value pairs from source_dict to dest_dict, keep type consistent """
    #     for key,value in dest_dict.items():
    #         if key in source_dict:
    #             vtype = type(value)
    #             new_value = vtype(source_dict[key])
    #             dest_dict[key] = new_value