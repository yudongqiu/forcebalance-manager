
from backend.fb_namespace import fb_ns
from backend.fb_project import FBProject

class FBManager:
    def __init__(self):
        self._projects = dict()
        fb_ns.register_manager(self)

    def create_project(self, projectName):
        # assert projectName not in self._projects, f'Project name {projectName} is taken'
        project = FBProject(projectName)
        project.register_manager(self)
        self._projects[projectName]  = project

    def list_projects(self):
        return list(self._projects.keys())

    def launch_optimizer(self, projectName):
        project = self._projects[projectName]
        project.launch_optimizer()

    def reset_optimizer(self, projectName):
        project = self._projects[projectName]
        project.reset_optimizer()

    def update_status(self, projectName):
        project = self._projects[projectName]
        print(f"socketIO: updating project {projectName} status {project.status}")
        fb_ns.emit('update_status', {
            'projectName': projectName,
            'status': project.status
        })

manager = FBManager()
