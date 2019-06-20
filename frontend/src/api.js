import io from 'socket.io-client';

class ForceBalanceAPI {
    socket = io('http://127.0.0.1:5005/api');
    projectName = null;
    eventCallbacks = {};
    onChangeCallbacks = [];

    checkProject() {
        this.socket.emit('list_projects', (data) => {
            if (data.length > 0) {
                this.setProject(data[0].projectName);
            }
        });
    }

    onChangeProjectName(callback) {
        if (this.onChangeCallbacks.indexOf(callback) === -1) {
            this.onChangeCallbacks.push(callback);
        }
    }

    removeOnChangeProjectName(callback) {
        const idx = this.onChangeCallbacks.indexOf(callback);
        if (idx !== -1) {
            this.onChangeCallbacks.splice(idx, 1);
        }
    }

    setProject(name) {
        if (this.projectName !== name) {
            this.projectName = name;
            this.onChangeCallbacks.forEach(callback => {
                callback(name);
            })
        }
    }

    createProject(name) {
        this.socket.emit('create_project', name);
        this.setProject(name);
    }

    listProjects(callback) {
        this.socket.emit('list_projects', (data) => {callback(data)});
    }

    getInputParams(callback) {
        if (this.projectName !== null) {
            this.socket.emit('get_input_params', this.projectName, (data) => {callback(data)});
        }
    }

    launchOptimizer() {
        if (this.projectName !== null) {
            this.socket.emit('launch_optimizer', this.projectName);
        }
    }

    resetOptimizer() {
        if (this.projectName !== null) {
            this.socket.emit('reset_optimizer', this.projectName);
        }
    }

    pullStatus() {
        if (this.projectName !== null) {
            this.socket.emit('pull_status', this.projectName);
        }
    }

    pullOptIter() {
        if (this.projectName !== null) {
            this.socket.emit('pull_opt_iter', this.projectName);
        }
    }

    getOptimizerState(callback) {
        if (this.projectName !== null) {
            this.socket.emit('get_optimizer_state', this.projectName, (data) => {callback(data)});
        }
    }

    uploadForceFieldFile(file) {
        if (this.projectName !== null) {
            this.socket.emit('upload_ff_file', this.projectName, {
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
                fileData: file
            });
        }
    }

    getForceFieldInfo(callback) {
        if (this.projectName !== null) {
            this.socket.emit('get_forcefield_info', this.projectName, (data) => {callback(data)});
        }
    }

    uploadPriorRules(rules) {
        if (this.projectName !== null) {
            this.socket.emit('set_forcefield_prior_rules', this.projectName, rules);
        }
    }

    createFittingTarget(targetName, targetType, files) {
        if (this.projectName !== null) {
            this.socket.emit('create_fitting_target', this.projectName, {
                targetName: targetName,
                targetType: targetType,
                fileNames: files.map(f => {return f.name}),
                fileDatas: files
            });
        }
    }

    getTargetNames(callback) {
        if (this.projectName !== null) {
            this.socket.emit('get_target_names', this.projectName, (data) => {callback(data)});
        }
    }

    getAllTargetsInfo(callback) {
        if (this.projectName !== null) {
            this.socket.emit('get_all_targets_info', this.projectName, (data) => {callback(data)});
        }
    }

    getTargetOptions(targetName, callback) {
        if (this.projectName !== null) {
            this.socket.emit('get_target_options', this.projectName, targetName, (data) => {callback(data)});
        }
    }

    setTargetOptions(targetName, targetOptions) {
        if (this.projectName !== null) {
            this.socket.emit('set_target_options', this.projectName, targetName, targetOptions);
        }
    }

    deleteFittingTarget(targetName) {
        if (this.projectName !== null) {
            this.socket.emit('delete_fitting_target', this.projectName, targetName);
        }
    }

    getOptimizerOptions(callback) {
        if (this.projectName !== null) {
            this.socket.emit('get_optimizer_options', this.projectName, (data) => {callback(data)});
        }
    }

    setOptimizerOptions(optimizerOptions) {
        if (this.projectName !== null) {
            this.socket.emit('set_optimizer_options', this.projectName, optimizerOptions);
        }
    }

    getOptimizeResults(callback) {
        if (this.projectName !== null) {
            this.socket.emit('get_optimize_results', this.projectName, (data) => {callback(data)});
        }
    }

    getTargetObjectiveData(targetName, optIter, callback) {
        if (this.projectName !== null) {
            this.socket.emit('get_target_objective_data', this.projectName, targetName, optIter, (data) => {callback(data)});
        }
    }

    getFinalForceFieldInfo(callback) {
        if (this.projectName !== null) {
            this.socket.emit('get_final_forcefield_info', this.projectName, (data) => {callback(data)});
        }
    }

    validate_target_file(targetName, targetType, files, fileType, callback) {
        if (this.projectName !== null) {
            this.socket.emit('validate_target_file', this.projectName, {
                targetName: targetName,
                targetType: targetType,
                fileType: fileType,
                fileNames: files.map(f => {return f.name}),
                fileDatas: files
            },
            (data) => {callback(data)});
        }
    }

    validate_target_create(targetName, callback) {
        if (this.projectName !== null) {
            this.socket.emit('validate_target_create', this.projectName, {
                targetName: targetName,
            },
            (data) => {callback(data)});
        }
    }

    getWorkQueueStatus(callback) {
        if (this.projectName !== null) {
            this.socket.emit('get_workqueue_status', this.projectName, (data) => {callback(data)});
        }
    }

    register(event, callback) {
        if (event in this.eventCallbacks) {
            // append this callback function only if it does not exist yet
            if (this.eventCallbacks[event].indexOf(callback) === -1) {
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

    unregister(event, callback) {
        if (event in this.eventCallbacks) {
            // append this callback function only if it does not exist yet
            const eventIdx = this.eventCallbacks[event].indexOf(callback);
            if (eventIdx !== -1) {
                this.eventCallbacks[event].splice(eventIdx, 1);
            }
        }
    }
}

const api = new ForceBalanceAPI();

export default api;