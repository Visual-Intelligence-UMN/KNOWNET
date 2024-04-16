# [Visualization Conversational Agent AI Chatbot](https://vis-con-agent.vercel.app)

An Visualization Conversational Agent AI Chatbot template built with Next.js, the Vercel AI SDK, OpenAI, and Vercel KV, using [Next.js AI chatbot template](https://github.com/vercel/ai-chatbot#nextjs-ai-chatbot).

## Features

- [Next.js](https://nextjs.org) App Router
- React Server Components (RSCs), Suspense, and Server Actions
- [Vercel AI SDK](https://sdk.vercel.ai/docs) for streaming chat UI
- Support for OpenAI (default), Anthropic, Cohere, Hugging Face, or custom AI chat models and/or LangChain
- [shadcn/ui](https://ui.shadcn.com)
  - Styling with [Tailwind CSS](https://tailwindcss.com)
  - [Radix UI](https://radix-ui.com) for headless component primitives
  - Icons from [Phosphor Icons](https://phosphoricons.com)
- Chat History, rate limiting, and session storage with [Vercel KV](https://vercel.com/storage/kv)
- [NextAuth.js](https://github.com/nextauthjs/next-auth) for authentication

## Model Providers

This template ships with OpenAI `gpt-3.5-turbo` as the default. However, thanks to the [Vercel AI SDK](https://sdk.vercel.ai/docs), you can switch LLM providers to [Anthropic](https://anthropic.com), [Cohere](https://cohere.com/), [Hugging Face](https://huggingface.co), or using [LangChain](https://js.langchain.com) with just a few lines of code.

## Creating a KV Database Instance

Follow the steps outlined in the [quick start guide](https://vercel.com/docs/storage/vercel-kv/quickstart#create-a-kv-database) provided by Vercel. This guide will assist you in creating and configuring your KV database instance on Vercel, enabling your application to interact with it.

Remember to update your environment variables (`KV_URL`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `KV_REST_API_READ_ONLY_TOKEN`) in the `.env` file with the appropriate credentials provided during the KV database setup.

## Running locally

You will need to use the environment variables [defined in `.env.example`](.env.example) to run Next.js AI Chatbot. It's recommended you use [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables) for this, but a `.env` file is all that is necessary.

> Note: You should not commit your `.env` file or it will expose secrets that will allow others to control access to your various OpenAI and authentication provider accounts.

1. Install Vercel CLI: `npm i -g vercel`
2. Link local instance with Vercel and GitHub accounts (creates `.vercel` directory): `vercel link`
3. Download your environment variables: `vercel env pull`

```bash
python3 -m venv venv
pnpm install
pnpm dev
```

Your app template should now be running on [localhost:3000](http://localhost:3000/).


## Opertaion on EC2

```bash
cd KNOWNET
pnpm install
```
### Execute the below code to run Next.js with PM2:
```bash
pm2 start npm --name nextjs-app -- run start -- -p 3000
pm2 list nextjs-app
```
### STOP the next.js
```bash
pm2 stop nextjs-app
```
### Flask backend
To keep your Flask app running in the background even after you close the terminal, you can use a tool like screen or tmux. These tools allow you to create a detached session that will continue running on the server even when you disconnect.

Here's how you can do it using screen:

Install screen (if it's not already installed):

```bash
sudo apt-get install screen  # For Debian/Ubuntu
sudo yum install screen      # For CentOS/RHEL
```

#### Start a new screen session:

```bash
screen
```
Run your Flask app within the screen session:

```bash
flask --app api/index --debug run -h 0.0.0.0 -p 5328
```

#### Detach from the screen session:

Press Ctrl + A, then D. This will detach you from the screen session and return you to your normal terminal, but your Flask app will continue running in the background.

#### Reattach to the screen session (if needed):

If you want to check on your Flask app or stop it, you can reattach to the screen session:

```bash
screen -r
```
#### Exit screen session:

When you're done and want to stop your Flask app, reattach to the screen session and stop your Flask app with Ctrl + C. Then, you can exit the screen session by typing exit.

Using screen allows you to keep your Flask app running in the background without needing to keep your terminal open.


## Nginx Set up on EC2
```
sudo ufw allow 'Nginx Full'
sudo ufw delete allow 'Nginx HTTP'
```

### Secure Your Domain with HTTPS Using Certbot

Great! Now that you have a domain, you can set it up to point to your AWS EC2 instance and configure HTTPS using Certbot. Here are the steps to configure your new domain and secure it:

#### Step 1: Point Your Domain to EC2
Find your EC2 Instance's Public IP Address: Log into your AWS Management Console, navigate to the EC2 Dashboard, and locate your instance to find its public IPv4 address.

Update DNS Records: Go to your domain registrar’s DNS management page (Cloudflare, for example). You will set an A record that points your domain to the EC2 instance's public IP address.

Log into your Cloudflare account.
Navigate to the DNS management section.
Add an A record:
Type: A
Name: @ (for the root domain like umn-visual-intelligence-lab.com) or you can use something like api for api.umn-visual-intelligence-lab.com.
IPv4 address: Enter the public IP address of your EC2 instance.
Make sure the proxy status is set to DNS only if you are setting up SSL/TLS via Certbot on the instance itself.
#### Step 2: Install and Configure Nginx
Since you might have already installed Nginx, ensure it’s configured to handle requests for your new domain.

Create or Modify Nginx Configuration:

sudo nano /etc/nginx/sites-available/umn-visual-intelligence-lab
Add the following configuration, adjusting it to serve your Flask app:

```nginx

server {
    listen 443 ssl http2;
    server_name umn-visual-intelligence-lab.com www.umn-visual-intelligence-lab.com;
    ssl_certificate /etc/letsencrypt/live/umn-visual-intelligence-lab.com/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/umn-visual-intelligence-lab.com/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # Managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # Managed by Certbot

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

 location /flask {
        proxy_pass http://localhost:5328; # Flask runs on this port
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }


}

server {
    if ($host = umn-visual-intelligence-lab.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot


    if ($host = www.umn-visual-intelligence-lab.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    listen 80;
    server_name umn-visual-intelligence-lab.com www.umn-visual-intelligence-lab.com;
    return 301 https://$server_name$request_uri;


}
```
Save and exit.

Enable the Site and Restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/umn-visual-intelligence-lab /etc/nginx/sites-enabled/
sudo nginx -t  # Test for syntax errors
sudo systemctl restart nginx
```

#### Step 3: Secure Your Domain with HTTPS Using Certbot
Install Certbot:

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
```

Run Certbot:

```bash
sudo certbot --nginx -d umn-visual-intelligence-lab.com -d www.umn-visual-intelligence-lab.com
```

Follow the prompts from Certbot to configure SSL. Certbot will automatically adjust your Nginx configuration to use HTTPS and set up auto-renewal for your certificates.

Verify Automatic Renewal:

```bash
sudo certbot renew --dry-run
```

#### Step 4: Test Your Setup
After Certbot configures everything, visit https://umn-visual-intelligence-lab.com in your browser to check if HTTPS is working correctly.

Ensure your Flask app is correctly receiving requests by checking logs or functionality through the browser or tools like Postman.
