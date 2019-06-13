import tempfile
import os
import shutil
import atexit

class TargetValidator:
    """ The TargetValidator class is built for validating ForceBalance targets
    prior to running optimization.

    This is the base class of all target-specific validators
    """
    def __init__(self, name='unamed_target'):
        self.name = name
        self._tempd = tempfile.mkdtemp(prefix='validator_')
        self._folder = os.path.join(self._tempd, 'targets', self.name)
        os.makedirs(self._folder)
        # make sure folder gets deleted when program exits
        atexit.register(self.__del__)

    def __del__(self):
        if os.path.isdir(self._tempd):
            shutil.rmtree(self._tempd)

    def copy_ffdir(self, orig_root, ffdir):
        shutil.copytree(os.path.join(orig_root, ffdir), os.path.join(self._tempd, ffdir))