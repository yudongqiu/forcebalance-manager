from flask_socketio import Namespace
from backend import socketio

class FBNamespace(Namespace):
    def register_manager(self, manager):
        self._manager = manager

    def on_create_project(self, projectName):
        """ receiver for 'create_project' event) """
        assert hasattr(self, '_manager'), 'Manager is not registered yet'
        print(f"socketIO: Received create_project command for project {projectName}")
        self._manager.create_project(projectName)

    def on_list_projects(self):
        assert hasattr(self, '_manager'), 'Manager is not registered yet'
        print(f"socketIO: Received list_projects command")
        return self._manager.list_projects()

    def on_launch_optimizer(self, projectName):
        """ receiver for 'launch_optimizer' event """
        print(f"socketIO: Received launch_optimizer command for project {projectName}")
        self._manager.launch_optimizer(projectName)

    def on_reset_optimizer(self, projectName):
        print(f"socketIO: Received reset command for project {projectName}")
        self._manager.reset_optimizer(projectName)

    def on_pull_status(self, projectName):
        """ Trigger from frontend to update the status """
        print(f"socketIO: Received pull_status command for project {projectName}")
        self._manager.update_status(projectName)

    def on_get_input_params(self, projectName):
        return self._manager.get_input_params(projectName)

fb_ns = FBNamespace('/api')

socketio.on_namespace(fb_ns)