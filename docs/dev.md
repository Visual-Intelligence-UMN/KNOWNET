# Run Drava in Development Mode

> This page illustrates how to run KNOWNET in your local computer in the development mode.

First, download or clone our github repo at https://github.com/Visual-Intelligence-UMN/KNOWNET.

## Backend

The backend is developed and tested with `python@3.11`

- Go to the repo folder and install all dependent packages.
  To manage dependencies more effectively, you can create and use a virtrual environment using `python3 -m venv venv` command before installing all packages:

```bash
#!/bin/bash
source venv/bin/activate
pip install -r requirements.txt


# # Windows users:
# @echo off
# call venv\Scripts\activate
# pip install -r requirements.txt
```

- Start the flask server:

```bash
flask --app api/index --debug run -p 5328
```

The backend server should be running at `localhost:5328`.

## Frontend

The front-end visual interface is developed and tested using `node@v20.9.0` at Chrome web browser.

- Go to the repo front-end folder and install all dependent packages:

```
pnpm install
```

- Then, launch the Drava react application on the browser:

```
pnpm dev
```

Now you can open `localhost:3000` in your web browser and interact with KNOWNET in the development mode.
