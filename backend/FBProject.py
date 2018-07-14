import enum

class RunningStatus:
    idle = 0
    running = 1
    finished = 2
    error = 3

class FBProject(object):

    @property
    def status(self):
        return RunningStatus.idle
