# Todo Backend API

Serverless Todo API built with AWS Lambda, API Gateway, and MongoDB.

## Architecture

```
Frontend (React) → API Gateway → Lambda Functions → MongoDB Atlas
                              ↓
                    SSM Parameter Store
                    (JWT_SECRET, MONGODB_URI)
```

## Prerequisites

- Node.js 20.x
- AWS CLI
- MongoDB Atlas account
- AWS account with appropriate permissions

## Project Structure

```
todo-back-end/
├── src/
│   └── handlers/
│       ├── auth.ts      # Login/Register Lambda handler
│       └── todos.ts     # Todo CRUD Lambda handler
├── template.yaml       # SAM template
├── Makefile            # Build/deploy commands
└── package.json
```

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create SSM Parameters:
   ```bash
   aws ssm put-parameter --name /todoapp/JWT_SECRET --value "your-secret-key-min-32-chars" --type SecureString
   aws ssm put-parameter --name /todoapp/MONGODB_URI --value "mongodb+srv://..." --type String
   ```

3. Create MongoDB Atlas database:
   - Create a cluster (free tier available)
   - Create database: `aws-todo`
   - Create collections: `users`, `todos`
   - Whitelist IP: `0.0.0.0/0` (for development)

## Deploy to AWS

1. Build the project:
   ```bash
   npm run build
   ```

2. Package for deployment:
   ```bash
   aws cloudformation package \
     --s3-bucket your-s3-bucket-name \
     --template template.yaml \
     --output-template packaged.yaml
   ```

3. Deploy:
   ```bash
   aws cloudformation deploy \
     --template-file packaged.yaml \
     --stack-name todo-api \
     --capabilities CAPABILITY_IAM \
     --parameter-overrides \
       JwtSecret="your-secret-key" \
       MongoDbUri="mongodb+srv://..."
   ```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /auth/register | No | Register new user |
| POST | /auth/login | No | Login user |
| GET | /todos | Yes | Get all todos |
| POST | /todos | Yes | Create todo |
| PUT | /todos/{id} | Yes | Update todo |
| DELETE | /todos/{id} | Yes | Delete todo |

## Authentication

This API uses a custom header `x-auth-token` (NOT `Authorization: Bearer`):

```
x-auth-token: <jwt-token>
```

## Local Development

1. Create `env.json`:
   ```json
   {
     "AuthFunction": {
       "JWT_SECRET": "your-local-secret",
       "MONGODB_URI": "mongodb://localhost:27017"
     },
     "TodosFunction": {
       "JWT_SECRET": "your-local-secret",
       "MONGODB_URI": "mongodb://localhost:27017"
     }
   }
   ```

2. Build:
   ```bash
   npm run build
   ```

3. Run with SAM local:
   ```bash
   sam local start-api --env-vars env.json
   ```

## API Usage Examples

### Register
```bash
curl -X POST https://your-api-url/Prod/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

**Response:**
```json
{"token": "eyJhbGciOiJIUzI1Ni..."}
```

### Login
```bash
curl -X POST https://your-api-url/Prod/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

### Get Todos
```bash
curl -X GET https://your-api-url/Prod/todos \
  -H "Content-Type: application/json" \
  -H "x-auth-token: eyJhbGciOiJIUzI1Ni..."
```

**Response:**
```json
[
  {"_id":"69d8cea59786c8c78...","title":"My todo","completed":false,"createdAt":"...","updatedAt":"..."}
]
```

### Create Todo
```bash
curl -X POST https://your-api-url/Prod/todos \
  -H "Content-Type: application/json" \
  -H "x-auth-token: eyJhbGciOiJIUzI1Ni..." \
  -d '{"title": "New todo"}'
```

### Update Todo
```bash
curl -X PUT https://your-api-url/Prod/todos/69d8cea59786c8c78... \
  -H "Content-Type: application/json" \
  -H "x-auth-token: eyJhbGciOiJIUzI1Ni..." \
  -d '{"completed": true}'
```

### Delete Todo
```bash
curl -X DELETE https://your-api-url/Prod/todos/69d8cea59786c8c78... \
  -H "x-auth-token: eyJhbGciOiJIUzI1Ni..."
```

## Environment Variables

| Variable | Description | Source |
|----------|-------------|--------|
| JWT_SECRET | Secret key for JWT signing | SSM: `/todoapp/JWT_SECRET` |
| MONGODB_URI | MongoDB connection string | SSM: `/todoapp/MONGODB_URI` |

## Update Secrets

```bash
aws ssm put-parameter --name /todoapp/JWT_SECRET --value "new-secret" --type SecureString --overwrite
aws ssm put-parameter --name /todoapp/MONGODB_URI --value "new-mongodb-uri" --type String --overwrite
```

## CORS

CORS is configured to allow all origins (`*`) for development. Update `template.yaml` to restrict:

```yaml
Cors:
  AllowOrigin: "'https://your-domain.com'"
```

## Get API URL

```bash
aws cloudformation describe-stacks \
  --stack-name todo-api \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
  --output text
```

## Cleanup

```bash
aws cloudformation delete-stack --stack-name todo-api
```
