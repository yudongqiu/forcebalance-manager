from flask import abort, request, send_from_directory
import json
from backend import app
from backend.FBProject import FBProject

project = FBProject()

@app.route('/')
def index():
    print(f"Loading index")
    return send_from_directory('../frontend/build', 'index.html')

@app.route('/<path:path>')
def send_file(path):
    return app.send_static_file(path)

@app.route('/api/status')
def getStatus():
    return json.dumps({
        'work_queue': {
            'running': 10,
            'finished': 20,
            'total': 30,
        },
        'status': project.status
    })

