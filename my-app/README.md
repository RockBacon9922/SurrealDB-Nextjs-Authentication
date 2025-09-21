# SurrealDB Next.js Authentication Example

A simple example demonstrating how to implement direct client authentication with SurrealDB and Next.js.

## Features

- 🔐 **Direct Authentication**: Client-side authentication with SurrealDB
- 🍪 **Session Management**: Automatic token refresh and cookie handling
- 🔄 **Connection State**: Real-time connection status updates
- 🎨 **Simple UI**: Clean login form and dashboard interface
- 🛡️ **Route Protection**: Middleware-based authentication guards
- ⚡ **TypeScript**: Full type safety throughout the application

## Prerequisites

- Node.js 18+
- A SurrealDB instance (local or cloud)

## Setup

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**

   Create a `.env.local` file in the root directory:

   ```env
   # SurrealDB Configuration
   NEXT_PUBLIC_SURREAL_URL=your-surrealdb-host
   NEXT_PUBLIC_SURREAL_NS=your-namespace
   NEXT_PUBLIC_SURREAL_DB=your-database
   ```

   For local SurrealDB:
   ```env
   NEXT_PUBLIC_SURREAL_URL=localhost:8000
   NEXT_PUBLIC_SURREAL_NS=test
   NEXT_PUBLIC_SURREAL_DB=test
   ```

3. **Start SurrealDB:**

   If running locally:
   ```bash
   surreal start --user root --pass root
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)**

## How It Works

### Authentication Flow

1. **Login Form**: User enters email/password
2. **Token Request**: Server action requests authentication token from SurrealDB
3. **Cookie Storage**: Access and refresh tokens stored securely
4. **WebSocket Connection**: Client connects to SurrealDB via WebSocket
5. **Token Authentication**: Client authenticates using stored token
6. **Middleware Redirect**: Authenticated users redirected to dashboard
7. **Dashboard**: User sees successful connection status

### Route Protection

The app uses Next.js middleware to protect routes:

- **Public Routes**: `/` (login page) - accessible without authentication
- **Protected Routes**: `/dashboard` - requires valid session token
- **Automatic Redirects**:
  - Unauthenticated users → redirected to login page
  - Authenticated users on login page → redirected to dashboard

### Key Components

- **`middleware.ts`**: Route protection and authentication redirects
- **`SurrealProvider`**: Manages SurrealDB connection and authentication state
- **`LoginForm`**: Simple form for user credentials
- **`Dashboard`**: Shows connection status and logout functionality
- **`RequestSurrealToken`**: Server actions for secure token management

## Architecture

```
Client (Next.js) ↔ Server Actions ↔ SurrealDB
     ↓              ↓              ↓
  WebSocket     HTTP Requests   Auth Endpoint
  Connection    Cookie Mgmt     Token Refresh
```

## Development

```bash
# Development server
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Format code
npm run format
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SURREAL_URL` | SurrealDB host URL | `localhost:8000` |
| `NEXT_PUBLIC_SURREAL_NS` | Namespace | `test` |
| `NEXT_PUBLIC_SURREAL_DB` | Database name | `test` |

## Learn More

- [SurrealDB Documentation](https://surrealdb.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [SurrealDB JavaScript SDK](https://surrealdb.com/docs/sdk/javascript)
