from flask import Flask
from flask_cors import CORS

app = Flask(__name__, static_folder='../frontend/build')
CORS(app)

from backend import endpoints