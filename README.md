# STATUS: 80% complete

# Converse Hono Backend 

The serverless backend for a complete customer support platform, powering a real-time chat and agent dashboard. This API is built with Hono and designed to run on Cloudflare Workers with a D1 database.

## Features

* **User Authentication:** Secure signup and login for "agent" and "customer" roles.
* **Password Hashing:** Uses `@node-rs/argon2` for robust password security.
* **Auth Middleware:** Protects routes using JWT (jose).
* **Chat API:** Create new chat threads, send messages, and load chat history.
* **Serverless:** Built to be fast, scalable, and cost-effective on the Cloudflare global network.

## Tech Stack

* **Framework:** [Hono](https://hono.dev/)
* **Platform:** [Cloudflare Workers](https://workers.cloudflare.com/)
* **Database:** [Cloudflare D1](https://developers.cloudflare.com/d1/)
* **Authentication:** [jose (JWT)](https://github.com/panva/jose)
* **Password Hashing:** [bcrypt-ts](https://github.com/dcodeIO/bcrypt.js)
* **Tooling:** [Vite](https://vitejs.dev/) & [Wrangler](https://developers.cloudflare.com/workers/wrangler/)

---

## ⚠️ A Note on Password Hashing

This project uses **`@node-rs/argon2`** for password hashing.

`@node-rs/argon2` **will not deploy** to Cloudflare Workers because it relies on Node.js-specific native bindings. To solve the build and deployment errors, I ended up using `bcrypt-ts` instead, which is pure TypeScript and fully compatible with the Cloudflare runtime, that implementation is not in this repository.

---

## Getting Started: Local Setup

Follow these steps to get the project running on your local machine.

### 1. Prerequisites

* [Node.js](https://nodejs.org/en) (v18 or later)
* An active Cloudflare account.

### 2. Initial Setup

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/SamuelAyibatarri/converse.git
    cd backend
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Authenticate with Cloudflare**
    This is required to use Wrangler and D1.
    ```bash
    npx wrangler login
    ```

### 3. Local Database Setup

You must create a local D1 database and apply the schema.

1.  **Create the Local Database**
    This command will create a local D1 database instance named `chat-db` (as defined in `wrangler.jsonc`) and create the `.wrangler` directory to store it.
    ```bash
    # This command reads schema.sql and applies it to the --local database
    npx wrangler d1 execute chat-db --local --file=./schema.sql
    ```

2.  **Create Local Secrets**
    The application requires a `JWT_SECRET` to run. We will store this in a `.dev.vars` file for local development.

    ```bash
    # This creates a new file named .dev.vars with a secure, random secret
    echo "JWT_SECRET=$(openssl rand -hex 32)" > .dev.vars
    ```

    If this doesn't work, then a simpler alternative would be to add `	"vars": {
		"JWT_SECRET": "your-super-sexy-secret-key"
	}, ` to your `wrangler.jsonc` file.

### 4. Run the Development Server

Now you can start the local server, which is powered by Vite and Hono.

```bash
npm run dev
```


# Converse Hono Frontend ( ReactJS, Typescript and Shadcn ) -> In active development. 

<img width="1366" height="658" alt="image" src="https://github.com/user-attachments/assets/cfc4c705-fcc5-4369-b6ff-370e68f0c9fb" />

<img width="1366" height="702" alt="image" src="https://github.com/user-attachments/assets/4ce4767c-2c41-4f0f-9a51-d2059db3765d" />

<img width="1365" height="701" alt="Screenshot From 2025-10-25 15-00-31" src="https://github.com/user-attachments/assets/91abd9f0-c2b7-40ca-a364-8f019fe8d34a" />

<img width="1366" height="768" alt="Screenshot From 2025-11-16 17-10-00" src="https://github.com/user-attachments/assets/417987fc-06df-4cec-900a-257877c70e7b" />
