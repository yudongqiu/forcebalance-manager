from flask import Flask
from flask_socketio import SocketIO

app = Flask(__name__, static_folder='../frontend/build')
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)

from backend import endpoints