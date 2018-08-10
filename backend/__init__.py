from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO

app = Flask(__name__, static_folder='../frontend/build')
app.config['SECRET_KEY'] = 'secret!'
CORS(app)
socketio = SocketIO(app)

from backend import endpoints