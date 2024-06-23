# Quick Start

The easiest way to run KNOWNET on your computer is to download the [zip file from Google Drive](https://drive.google.com/file/d/XXXX) and run it using Python.

1. Download and unzip the file to your local computer
2. Start a virtual environment and install dependency packages

   ```bash
    python3 -m venv venv
    pnpm install

   ```

> Note: For Windows users, please uncomment the command in `run_flask.sh` to set the flask environment variables before running the script. The `run_flask.sh` script should look like this after uncommenting the command:

```bash
        # Windows users:
        @echo off
        call venv\Scripts\activate
        pip install -r requirements.txt
        flask --app api/index run -p 5328
```

3. Setting up your environment variables
   You will need to use the environment variables defined in `.env.example` to run KNOWNET.

> Note: You should not commit your `.env` file or it will expose secrets that will allow others to control access to your various OpenAI and authentication provider accounts.

4. Run the demo
   ```bash
    pnpm preview
   ```
   Your app template should now be running on [localhost:3000](http://localhost:3000/).
