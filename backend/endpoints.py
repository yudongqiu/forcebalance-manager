from flask import send_from_directory

from backend import app
from backend.fb_manager import manager

@app.route('/')
def index():
    print(f"Loading index")
    return send_from_directory('../frontend/build', 'index.html')

@app.route('/<path:path>')
def send_file(path):
    return app.send_static_file(path)
