import time
import numpy as np

class FBProject(object):
    project_status = {'idle': 0, 'running':1, 'finished': 2, 'error': 3}

    @property
    def status(self):
        return self._status

    @status.setter
    def status(self, value):
        assert value in self.project_status.values(), 'Invalid status value.'
        self._status = value

    def __init__(self, name='Project'):
        self._name = name
        self.status = self.project_status['idle']
        self._options = dict()
        self._manager = None

    def register_manager(self, manager):
        self._manager = manager

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
        time.sleep(5)
        self.update_status('finished')

    def update_status(self, statusName):
        assert self._manager is not None, 'This project has not been connected to a manager yet'
        assert statusName in self.project_status, f'Invalid statusName {statusName}'
        self.status = self.project_status[statusName]
        self._manager.update_status(self._name)


    def reset_optimizer(self):
        self.update_status('idle')
