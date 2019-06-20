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

    def on_upload_ff_file(self, projectName, data):
        print(f"socketIO: Received upload_ff_file command for project {projectName}")
        print(f"  file name: {data['fileName']}")
        print(f"  file type: {data['fileType']}")
        print(f"  file size: {data['fileSize']}")
        return self._manager.upload_ff_file(projectName, data)

    def on_get_forcefield_info(self, projectName):
        print(f"socketIO: Received get_forcefield_info command for project {projectName}")
        return self._manager.get_forcefield_info(projectName)

    def on_set_forcefield_prior_rules(self, projectName, data):
        print(f"socketIO: Received set_forcefield_prior_rules command for project {projectName}")
        return self._manager.set_forcefield_prior_rules(projectName, data)

    def on_create_fitting_target(self, projectName, data):
        print(f"socketIO: Received create_fitting_target command for project {projectName}")
        return self._manager.create_fitting_target(projectName, data)

    def on_delete_fitting_target(self, projectName, targetName):
        print(f"socketIO: Received delete_fitting_target command for project {projectName} target <{targetName}>")
        return self._manager.delete_fitting_target(projectName, targetName)

    def on_get_target_names(self, projectName):
        print(f"socketIO: Received command get_target_names for project <{projectName}>")
        return self._manager.get_target_names(projectName)

    def on_get_all_targets_info(self, projectName):
        print(f"socketIO: Received command get_all_targets_info for project <{projectName}>")
        return self._manager.get_all_targets_info(projectName)

    def on_get_target_options(self, projectName, targetName):
        print(f"socketIO: Received command get_target_options for project <{projectName}> target <{targetName}>")
        return self._manager.get_target_options(projectName, targetName)

    def on_set_target_options(self, projectName, targetName, targetOptions):
        print(f"socketIO: Received command set_target_options for project <{projectName}> target <{targetName}>")
        return self._manager.set_target_options(projectName, targetName, targetOptions)

    def on_get_optimizer_options(self, projectName):
        print(f"socketIO: Received command get_optimizer_options for project <{projectName}>")
        return self._manager.get_optimizer_options(projectName)

    def on_set_optimizer_options(self, projectName, optimizerOptions):
        print(f"socketIO: Received command set_optimizer_options for project <{projectName}>")
        return self._manager.set_optimizer_options(projectName, optimizerOptions)

    def on_get_optimizer_state(self, projectName):
        print(f"socketIO: Received get_optimizer_state command for project {projectName}")
        return self._manager.get_optimizer_state(projectName)

    def on_get_target_objective_data(self, projectName, targetName, optIter):
        print(f"socketIO: Received command get_target_objective_data for project <{projectName}> target <{targetName}> iteration <{optIter}>")
        return self._manager.get_target_objective_data(projectName, targetName, optIter)

    def on_get_optimize_results(self, projectName):
        print(f"socketIO: Received get_optimize_results command for project {projectName}")
        return self._manager.get_optimize_results(projectName)

    def on_get_final_forcefield_info(self, projectName):
        print(f"socketIO: Received get_final_forcefield_info command for project {projectName}")
        return self._manager.get_final_forcefield_info(projectName)

    def on_validate_target_file(self, projectName, data):
        print(f"socketIO: Received validate_target_file command for project {projectName}")
        return self._manager.validate_target_file(projectName, data)

    def on_validate_target_create(self, projectName, data):
        print(f"socketIO: Received validate_target_create command for project {projectName}")
        return self._manager.validate_target_create(projectName, data)

    def on_get_workqueue_status(self, projectName):
        print(f"socketIO: Received get_workqueue_status command for project {projectName}")
        return self._manager.get_workqueue_status(projectName)



fb_ns = FBNamespace('/api')

socketio.on_namespace(fb_ns)