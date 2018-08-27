import os

from backend.fb_namespace import fb_ns
from backend.fb_project import FBProject

this_folder = os.path.dirname(os.path.realpath(__file__))
FB_ROOT = os.environ.get('FB_ROOT', os.path.realpath(os.path.join(this_folder, '../projects')))

class FBManager:
    def __init__(self):
        self._projects = dict()
        fb_ns.register_manager(self)
        self.root = FB_ROOT
        if not os.path.exists(self.root):
            os.makedirs(self.root)

    def load_existing_projects(self):
        for projectName in os.listdir(self.root):
            pfolder = os.path.join(self.root, projectName)
            print(f"Found existing project at <{pfolder}>")
            project = FBProject(projectName)
            project.load_from_project_folder(pfolder)
            project.register_manager(self)
            self._projects[projectName] = project

    def create_project(self, projectName):
        assert projectName not in self._projects, f'Project name {projectName} is taken'
        project = FBProject(projectName)
        project.register_manager(self)
        projectFolder = os.path.join(self.root, projectName)
        project.create_project_folder(projectFolder)
        self._projects[projectName] = project

    def list_projects(self):
        return [{'projectName': p.name, 'status': p.status} for p in self._projects.values()]

    def launch_optimizer(self, projectName):
        project = self._projects[projectName]
        project.launch_optimizer()

    def reset_optimizer(self, projectName):
        project = self._projects[projectName]
        project.reset_optimizer()

    def update_status(self, projectName):
        project = self._projects[projectName]
        print(f"socketIO: updating project <{projectName}> status {project.status}")
        fb_ns.emit('update_status', {
            'projectName': projectName,
            'status': project.status
        })

    def get_input_params(self, projectName):
        project = self._projects[projectName]
        return project.get_input_params()

    def upload_ff_file(self, projectName, data):
        project = self._projects[projectName]
        return project.setup_forcefield(data)

    def get_forcefield_info(self, projectName):
        project = self._projects[projectName]
        return project.get_forcefield_info()

    def set_forcefield_prior_rules(self, projectName, data):
        project = self._projects[projectName]
        return project.set_forcefield_prior_rules(data)


manager = FBManager()
manager.load_existing_projects()
