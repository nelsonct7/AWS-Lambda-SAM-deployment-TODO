# Todo App - Full Stack Serverless Application

A production-ready full-stack todo application demonstrating modern serverless architecture on AWS.

## Why This Project?

This project serves as a **learning reference** for building:

1. **Serverless Backend** - AWS Lambda functions with API Gateway
2. **Database Integration** - MongoDB Atlas for persistent storage
3. **JWT Authentication** - Secure token-based auth without traditional servers
4. **React Frontend** - Modern SPA with routing and state management
5. **Infrastructure as Code** - AWS SAM templates for deployment
6. **Cloud Security** - SSM Parameter Store for secrets management

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   React SPA     │────▶│   API Gateway   │────▶│  Lambda         │
│   (Frontend)    │     │                 │     │  Functions      │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
        │                                                 │
        │                                                 ▼
        │                                       ┌─────────────────┐
        │                                       │                 │
        └──────────────────────────────────────▶│   MongoDB       │
                    CORS                         │   Atlas         │
                                                │                 │
                                                └─────────────────┘
```

## Components

### Frontend (`todo-front-end/`)
- **Framework**: React 19 + Vite
- **Features**: Login, Signup, Todo CRUD
- **Auth**: JWT stored in localStorage, sent via `x-auth-token` header

### Backend (`todo-back-end/`)
- **Runtime**: Node.js 20 on AWS Lambda
- **API**: API Gateway with Lambda proxy integration
- **Database**: MongoDB Atlas (NoSQL)
- **Secrets**: AWS SSM Parameter Store
- **Framework**: SAM (Serverless Application Model)

## API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/auth/register` | POST | No | Register new user |
| `/auth/login` | POST | No | Login and get token |
| `/todos` | GET | Yes | Get all user todos |
| `/todos` | POST | Yes | Create new todo |
| `/todos/:id` | PUT | Yes | Update todo |
| `/todos/:id` | DELETE | Yes | Delete todo |

## Authentication Flow

```
User registers/logs in → Server validates → Returns JWT token
                                                        ↓
Frontend stores token in localStorage
                                                        ↓
All subsequent requests include: x-auth-token: <jwt-token>
                                                        ↓
Lambda validates token → Extracts userId → Queries MongoDB
```

## Security Features

1. **Password Hashing** - bcrypt with salt rounds
2. **JWT Tokens** - 7-day expiry, signed with secret key
3. **Secret Management** - SSM Parameter Store (not in code/env)
4. **CORS** - Configurable allowed origins
5. **User Isolation** - Users can only access their own todos

## Getting Started

### Prerequisites
- Node.js 20.x
- AWS CLI configured
- MongoDB Atlas account
- npm or yarn

### Backend Setup

```bash
cd todo-back-end
npm install

# Create SSM parameters
aws ssm put-parameter --name /todoapp/JWT_SECRET --value "your-secret" --type SecureString
aws ssm put-parameter --name /todoapp/MONGODB_URI --value "mongodb+srv://..." --type String

# Deploy
npm run build
aws cloudformation package --s3-bucket your-bucket --template template.yaml --output-template packaged.yaml
aws cloudformation deploy --template-file packaged.yaml --stack-name todo-api --capabilities CAPABILITY_IAM
```

### Frontend Setup

```bash
cd todo-front-end
npm install
echo "VITE_API_URL=https://your-api-id.execute-api.ap-south-2.amazonaws.com/Prod" > .env
npm run dev
```

## Key Learnings

This project demonstrates:

### Backend
- Lambda cold starts and optimization
- API Gateway routing and CORS configuration
- MongoDB connection pooling
- SSM Parameter Store vs Secrets Manager
- IAM roles and permissions for Lambda

### Frontend
- React Context for auth state
- Axios interceptors for token injection
- Protected routes with React Router
- Local storage for persistence

### DevOps
- Infrastructure as Code with SAM
- CloudFormation deployment
- Environment-specific configurations
- CORS and origin policies

## Deployment URL

- **Frontend**: http://localhost:5173 (dev) / Deploy to Vercel/Netlify
- **Backend**: https://zhkm1nnz26.execute-api.ap-south-2.amazonaws.com/Prod

## Future Improvements

- [ ] Add TypeScript to frontend
- [ ] Implement refresh tokens
- [ ] Add input validation (Zod/Joi)
- [ ] Rate limiting on API Gateway
- [ ] CloudWatch dashboards
- [ ] DynamoDB instead of MongoDB
- [ ] Cognito for authentication
- [ ] CI/CD with GitHub Actions

## License

MIT
