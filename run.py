#!/usr/bin/env python
from backend import app

if __name__ == "__main__":
    app.run(debug=True, use_reloader=False, port=5005)
