import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { MongoClient, Collection } from 'mongodb';

interface APIGatewayProxyEvent {
  httpMethod: string;
  path: string;
  headers?: Record<string, string | undefined>;
  body?: string | null;
}

interface APIGatewayProxyResult {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

const MONGODB_URI = process.env.MONGODB_URI || '';
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

interface User {
  _id?: string;
  email: string;
  password: string;
  createdAt: Date;
}

let client: MongoClient | null = null;
let usersCollection: Collection<User> | null = null;

async function getUsersCollection(): Promise<Collection<User>> {
  if (!usersCollection) {
    if (!client) {
      client = new MongoClient(MONGODB_URI);
      await client.connect();
    }
    usersCollection = client.db().collection<User>('users');
  }
  return usersCollection;
}

function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  };

  try {
    const path = event.path || '';
    const method = event.httpMethod;

    if (method === 'OPTIONS') {
      return { statusCode: 200, headers, body: '' };
    }

    if (path === '/auth/register' && method === 'POST') {
      return await register(event, headers);
    }

    if (path === '/auth/login' && method === 'POST') {
      return await login(event, headers);
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ message: 'Not found' }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
}

async function register(event: APIGatewayProxyEvent, headers: Record<string, string>) {
  if (!event.body) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: 'Request body is required' }),
    };
  }

  const { email, password } = JSON.parse(event.body);

  if (!email || !password) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: 'Email and password are required' }),
    };
  }

  if (password.length < 6) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: 'Password must be at least 6 characters' }),
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: 'Invalid email format' }),
    };
  }

  const users = await getUsersCollection();

  const existingUser = await users.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: 'Email already registered' }),
    };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await users.insertOne({
    email: email.toLowerCase(),
    password: hashedPassword,
    createdAt: new Date(),
  });

  const token = generateToken(result.insertedId.toString());

  return {
    statusCode: 201,
    headers,
    body: JSON.stringify({ token }),
  };
}

async function login(event: APIGatewayProxyEvent, headers: Record<string, string>) {
  if (!event.body) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: 'Request body is required' }),
    };
  }

  const { email, password } = JSON.parse(event.body);

  if (!email || !password) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: 'Email and password are required' }),
    };
  }

  const users = await getUsersCollection();
  const user = await users.findOne({ email: email.toLowerCase() });

  if (!user) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ message: 'Invalid credentials' }),
    };
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ message: 'Invalid credentials' }),
    };
  }

  const token = generateToken(user._id!);

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ token }),
  };
}

export { handler };
