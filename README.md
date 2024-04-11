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

