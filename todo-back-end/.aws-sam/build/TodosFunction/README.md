# Todo Backend API

Serverless Todo API built with AWS Lambda, API Gateway, and MongoDB with AWS Secrets Manager for secrets.

## Prerequisites

- Node.js 20.x
- AWS SAM CLI
- MongoDB Atlas account (or self-hosted MongoDB)
- AWS account with appropriate permissions

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create MongoDB database:
   - Create a MongoDB Atlas cluster (free tier available)
   - Create collections: `users` and `todos`
   - Get your connection string from Atlas

## Deploy to AWS

1. Build the project:
   ```bash
   npm run build
   ```

2. Package for deployment:
   ```bash
   sam package \
     --s3-bucket your-s3-bucket-name \
     --output-template-file packaged.yaml
   ```

3. Deploy with secrets:
   ```bash
   sam deploy \
     --template-file packaged.yaml \
     --stack-name todo-api \
     --capabilities CAPABILITY_IAM \
     --parameter-overrides \
       JwtSecret="your-super-secret-jwt-key-min-32-chars" \
       MongoDbUri="mongodb+srv://username:password@cluster.mongodb.net/todo?retryWrites=true&w=majority"
   ```

   Or use guided deploy:
   ```bash
   sam deploy --guided
   ```

   When prompted for parameters:
   - `JwtSecret`: Enter a secure random string (min 32 characters)
   - `MongoDbUri`: Enter your MongoDB Atlas connection string

## Secrets

Secrets are stored in AWS Secrets Manager and managed by CloudFormation:

- Secret Name: `todo-api`
- Stored keys: `JWT_SECRET`, `MONGODB_URI`
- Lambda functions have IAM permissions to read the secret at runtime
- Secrets are encrypted with AWS KMS

### Update Secrets After Deployment

```bash
# Update secret value
aws secretsmanager put-secret-value \
  --secret-id todo-api \
  --secret-string '{"JWT_SECRET":"new-secret","MONGODB_URI":"new-mongodb-uri"}'

# Force Lambda to reload (new invocation will get new value)
```

### Rotate Secrets

```bash
# Create new version
aws secretsmanager put-secret-value \
  --secret-id todo-api \
  --secret-string '{"JWT_SECRET":"new-secret","MONGODB_URI":"new-mongodb-uri"}'
```

## Local Development

1. Create `.env` file:
   ```bash
   cp .env.example .env
   # Edit with your values
   ```

2. Build:
   ```bash
   make build
   ```

3. Create `env.json`:
   ```bash
   cat > env.json << EOF
   {
     "AuthFunction": {
       "JWT_SECRET": "your-local-secret",
       "MONGODB_URI": "your-mongodb-uri"
     },
     "TodosFunction": {
       "JWT_SECRET": "your-local-secret",
       "MONGODB_URI": "your-mongodb-uri"
     }
   }
   EOF
   ```

4. Run locally:
   ```bash
   make local
   ```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/register | Register new user |
| POST | /auth/login | Login user |
| GET | /todos | Get all todos |
| POST | /todos | Create todo |
| PUT | /todos/{id} | Update todo |
| DELETE | /todos/{id} | Delete todo |

## Get API URL

After deployment, get the API URL from CloudFormation outputs:
```bash
aws cloudformation describe-stacks \
  --stack-name todo-api \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
  --output text
```

## Request/Response Examples

### Register
```bash
curl -X POST https://your-api-url/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

### Login
```bash
curl -X POST https://your-api-url/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

### Get Todos
```bash
curl https://your-api-url/todos \
  -H "Authorization: Bearer <token>"
```

### Create Todo
```bash
curl -X POST https://your-api-url/todos \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title": "My first todo"}'
```

### Update Todo
```bash
curl -X PUT https://your-api-url/todos/{id} \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'
```

### Delete Todo
```bash
curl -X DELETE https://your-api-url/todos/{id} \
  -H "Authorization: Bearer <token>"
```

## Cleanup

To delete the stack and all resources:
```bash
aws cloudformation delete-stack --stack-name todo-api
```

Note: This will also delete the Secrets Manager secret.
