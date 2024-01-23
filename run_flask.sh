#!/bin/bash
source venv/bin/activate
pip install -r requirements.txt
flask --app api/index run -p 5328

# # Windows users:
# @echo off
# call venv\Scripts\activate
# pip install -r requirements.txt
# flask --app api/index run -p 5328
