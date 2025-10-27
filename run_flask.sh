#!/bin/bash
source venv/bin/activate
pip install -r requirements.txt
flask --app api/index --debug run -p 5175

# # Windows users:
# @echo off
# call venv\Scripts\activate
# pip install -r requirements.txt
# flask --app api/index run -p 5328

    # // "flask-dev": "./run_flask.sh",
    # // "dev": "concurrently \"vite\" \"pnpm run flask-dev\"",