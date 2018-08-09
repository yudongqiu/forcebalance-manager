import axios from "axios";

class ForceBalanceAPI {
    backendUrl = 'http://127.0.0.1:5005';
    getStatus() {
        return axios.get(`${this.backendUrl}/api/status`).then(data => {
            return data.data;
        });
    }

    runOptimizer() {
        return axios.get(`${this.backendUrl}/api/launch`).then(data => {
            return data.data;
        });
    }

    resetOptimizer() {
        return axios.get(`${this.backendUrl}/api/reset`).then(data => {
            return data.data;
        });
    }
}

const api = new ForceBalanceAPI();

export default api;