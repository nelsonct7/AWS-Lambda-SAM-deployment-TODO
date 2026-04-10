import jwt from 'jsonwebtoken';
import { MongoClient, Collection, ObjectId } from 'mongodb';

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

interface Todo {
  _id?: ObjectId;
  userId: string;
  title: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

let client: MongoClient | null = null;
let todosCollection: Collection<Todo> | null = null;

async function getTodosCollection(): Promise<Collection<Todo>> {
  if (!todosCollection) {
    if (!client) {
      client = new MongoClient(MONGODB_URI);
      await client.connect();
    }
    todosCollection = client.db('aws-todo').collection<Todo>('todos'); // ✅ added db name
  }
  return todosCollection;
}

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,x-auth-token',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  };
}

function getUserId(event: APIGatewayProxyEvent): string | null {
  const token = event.headers?.['x-auth-token'] || event.headers?.['X-Auth-Token'];
  
  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const headers = getHeaders();

  // ✅ Handle OPTIONS preflight BEFORE anything else
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const method = event.httpMethod;
    const userId = getUserId(event);

    if (!userId) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ message: 'Unauthorized' }),
      };
    }

    // ✅ Normalize path - remove trailing slash
    const path = (event.path || '').replace(/\/$/, '');

    console.log(`Method: ${method}, Path: ${path}`); // helpful for debugging

    if (path === '/todos' && method === 'GET') {
      return await getTodos(userId, headers);
    }

    if (path === '/todos' && method === 'POST') {
      return await createTodo(event, userId, headers);
    }

    const todoIdMatch = path.match(/^\/todos\/([a-f\d]{24})$/i);
    if (todoIdMatch) {
      const todoId = todoIdMatch[1];

      if (method === 'PUT') {
        return await updateTodo(todoId, event, userId, headers);
      }

      if (method === 'DELETE') {
        return await deleteTodo(todoId, userId, headers);
      }
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

async function getTodos(userId: string, headers: Record<string, string>) {
  const todos = await getTodosCollection();
  
  const userTodos = await todos
    .find({ userId })
    .sort({ createdAt: -1 })
    .toArray();

  const formattedTodos = userTodos.map(todo => ({
    _id: todo._id?.toString(),
    title: todo.title,
    completed: todo.completed,
    createdAt: todo.createdAt,
    updatedAt: todo.updatedAt,
  }));

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(formattedTodos),
  };
}

async function createTodo(event: APIGatewayProxyEvent, userId: string, headers: Record<string, string>) {
  if (!event.body) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: 'Request body is required' }),
    };
  }

  const { title } = JSON.parse(event.body);

  if (!title || !title.trim()) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: 'Title is required' }),
    };
  }

  const todos = await getTodosCollection();
  const now = new Date();

  const result = await todos.insertOne({
    userId,
    title: title.trim(),
    completed: false,
    createdAt: now,
    updatedAt: now,
  });

  const newTodo = {
    _id: result.insertedId.toString(),
    title: title.trim(),
    completed: false,
    createdAt: now,
    updatedAt: now,
  };

  return {
    statusCode: 201,
    headers,
    body: JSON.stringify(newTodo),
  };
}

async function updateTodo(todoId: string, event: APIGatewayProxyEvent, userId: string, headers: Record<string, string>) {
  if (!event.body) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: 'Request body is required' }),
    };
  }

  const { title, completed } = JSON.parse(event.body);

  const todos = await getTodosCollection();
  
  const todo = await todos.findOne({
    _id: new ObjectId(todoId),
    userId,
  });

  if (!todo) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ message: 'Todo not found' }),
    };
  }

  const updateFields: Partial<Todo> = { updatedAt: new Date() };
  
  if (title !== undefined) {
    updateFields.title = title.trim();
  }
  if (completed !== undefined) {
    updateFields.completed = completed;
  }

  await todos.updateOne(
    { _id: new ObjectId(todoId) },
    { $set: updateFields }
  );

  const updatedTodo = {
    _id: todoId,
    title: updateFields.title ?? todo.title,
    completed: updateFields.completed ?? todo.completed,
    createdAt: todo.createdAt,
    updatedAt: updateFields.updatedAt,
  };

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(updatedTodo),
  };
}

async function deleteTodo(todoId: string, userId: string, headers: Record<string, string>) {
  const todos = await getTodosCollection();

  const result = await todos.deleteOne({
    _id: new ObjectId(todoId),
    userId,
  });

  if (result.deletedCount === 0) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ message: 'Todo not found' }),
    };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ message: 'Todo deleted' }),
  };
}

export { handler };