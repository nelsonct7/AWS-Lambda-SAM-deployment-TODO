# Todo Frontend

React frontend for the Todo API with authentication.

## Tech Stack

- React 19
- Vite
- React Router DOM
- Axios

## Project Structure

```
todo-front-end/
├── src/
│   ├── context/
│   │   └── AuthContext.jsx   # Authentication state management
│   ├── pages/
│   │   ├── Login.jsx         # Login page
│   │   ├── Signup.jsx        # Signup page
│   │   └── Todos.jsx         # Todo list page
│   ├── services/
│   │   └── api.js            # Axios API client
│   ├── App.jsx               # Main app with routing
│   └── main.jsx              # Entry point
└── index.html
```

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` file:
   ```bash
   echo "VITE_API_URL=https://your-api-url/Prod" > .env
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| VITE_API_URL | Backend API URL | `http://localhost:5000/api` |

## Authentication

The app uses JWT authentication with a custom header `x-auth-token`.

- Token is stored in `localStorage`
- Automatically added to all API requests via Axios interceptor
- Protected routes redirect to login if not authenticated

## Features

- **Login/Signup**: Email and password authentication
- **Todo List**: View all todos
- **Create Todo**: Add new todos
- **Toggle Complete**: Mark todos as complete/incomplete
- **Delete Todo**: Remove todos

## API Integration

The frontend connects to the backend API:

| Action | Endpoint | Method |
|--------|----------|--------|
| Login | /auth/login | POST |
| Signup | /auth/register | POST |
| Get Todos | /todos | GET |
| Create Todo | /todos | POST |
| Update Todo | /todos/:id | PUT |
| Delete Todo | /todos/:id | DELETE |

## Build

```bash
npm run build
```

Output is in the `dist/` folder.

## Preview Production Build

```bash
npm run preview
```

## Lint

```bash
npm run lint
```

## Deployment

The app can be deployed to any static hosting service:

- Vercel
- Netlify
- AWS S3 + CloudFront
- GitHub Pages

Set `VITE_API_URL` environment variable to your deployed backend URL.
