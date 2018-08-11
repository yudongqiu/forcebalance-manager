import io from 'socket.io-client';

class ForceBalanceAPI {
    socket = io('http://127.0.0.1:5005/api');
    projectName = null;
    eventCallbacks = {};

    setProject(name) {
        this.projectName = name;
    }

    createProject(name) {
        this.socket.emit('create_project', name);
        this.setProject(name);
    }

    listProjects() {
        this.socket.emit('list_projects', (data) => {return data;});
    }

    launchOptimizer() {
        this.socket.emit('launch_optimizer', this.projectName);
    }

    resetOptimizer() {
        this.socket.emit('reset_optimizer', this.projectName);
    }

    pullStatus() {
        this.socket.emit('pull_status', this.projectName);
    }

    register(event, callback) {
        if (event in this.eventCallbacks) {
            // append this callback function only if it does not exist yet
            if (this.eventCallbacks[event].indexOf(callback) !== -1) {
                this.eventCallbacks[event].push(callback);
            }
        } else {
            // new event is created, together with a socket listener
            this.eventCallbacks[event] = [callback];
            this.socket.on(event, (data) => {
                // Only call the function if return projectName matches the current one
                if (data.projectName === this.projectName) {
                    this.eventCallbacks[event].forEach(callback => {
                        callback(data);
                    })
                }
            });
        }
    }
}

const api = new ForceBalanceAPI();

export default api;