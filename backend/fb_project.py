import time
import numpy as np
import threading
import os
import shutil
import json

import forcebalance

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


    def get_input_params(self):
        """ Info for frontend JobInput.jsx """
        return {
            'projectName': self.name,
            'jobType': 'Single',
        }

    def load_fb_options(self, options):
        pass

    def load_forcefield(self, ff):
        pass

    def create_objective(self):
        self._objective = None

    def create_optimizer(self):
        self._optimizer = None

    def launch_optimizer(self):
        self.update_status('running')
        t = threading.Thread(target=self.exec_launch_optimizer)
        t.start()

    def exec_launch_optimizer(self):
        with self.lock:
            time.sleep(5)
            self.update_status('finished')

    def update_status(self, statusName):
        assert self._manager is not None, 'This project has not been connected to a manager yet'
        assert statusName in self.project_status, f'Invalid statusName {statusName}'
        self.status = self.project_status[statusName]
        self._manager.update_status(self._name)

    def reset_optimizer(self):
        self.update_status('idle')
