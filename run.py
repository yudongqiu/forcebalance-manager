#!/usr/bin/env python
from backend import app, socketio

if __name__ == "__main__":
    #app.run(debug=True, use_reloader=False, port=5005)
    #socketio.run(app, debug=True, use_reloader=False, port=5005)
    socketio.run(app, debug=False, use_reloader=False, port=5005)