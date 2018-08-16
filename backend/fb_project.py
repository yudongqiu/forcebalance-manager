import time
import numpy as np
import threading
import os

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

    def register_manager(self, manager):
        self._manager = manager

    def create_project_folder(self, project_folder):
        assert not os.path.exists(project_folder)
        os.makedirs(project_folder)
        self.project_folder = project_folder

    def load_from_project_folder(self, project_folder):
        """ Load the project data from the project folder """
        pass

    def setup_forcefield(self, data):
        assert self.project_folder, 'project_folder is not setup correctly'
        ff_folder = os.path.join(self.project_folder, 'forcefield')
        if not os.path.exists(ff_folder):
            os.makedirs(ff_folder)
        filename = data['fileName']
        with open(os.path.join(ff_folder, filename), 'wb') as byte_f:
            byte_f.write(data['fileData'])



    def get_input_params(self):
        """ Info for frontend JobInput.jsx """
        return {
            'projectName': self.name,
            'fileName': '123.txt',
            'JobType': 'Single',
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
