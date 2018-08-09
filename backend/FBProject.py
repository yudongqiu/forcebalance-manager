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

    def load_fb_options(self, options):
        pass

    def load_forcefield(self, ff):
        pass

    def create_objective(self):
        self._objective = None

    def create_optimizer(self):
        self._optimizer = None

    def run_optimizer(self):
        self.status = self.project_status['running']
        time.sleep(5)
        self.status = self.project_status['finished']

    def reset(self):
        self.status = self.project_status['idle']



