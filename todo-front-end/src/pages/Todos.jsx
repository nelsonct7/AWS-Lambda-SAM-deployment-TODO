import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Todos.css';

export default function Todos() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const { logout } = useAuth();

  const fetchTodos = useCallback(async () => {
    try {
      const res = await api.get('/todos');
      setTodos(res.data);
    } catch (err) {
      console.error('Failed to fetch todos:', err);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTodos();
  }, [fetchTodos]);

  const addTodo = async (e) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    try {
      const res = await api.post('/todos', { title: newTodo });
      setTodos(prev => [...prev, res.data]);
      setNewTodo('');
    } catch (err) {
      console.error('Failed to add todo:', err);
    }
  };

  const toggleTodo = async (id, completed) => {
    try {
      await api.put(`/todos/${id}`, { completed: !completed });
      setTodos(prev => prev.map(todo => 
        todo._id === id ? { ...todo, completed: !completed } : todo
      ));
    } catch (err) {
      console.error('Failed to update todo:', err);
    }
  };

  const deleteTodo = async (id) => {
    try {
      await api.delete(`/todos/${id}`);
      setTodos(prev => prev.filter(todo => todo._id !== id));
    } catch (err) {
      console.error('Failed to delete todo:', err);
    }
  };

  return (
    <div className="todos-container">
      <header className="todos-header">
        <h1>My Todos</h1>
        <button onClick={logout} className="logout-btn">Logout</button>
      </header>
      
      <form className="add-todo-form" onSubmit={addTodo}>
        <input
          type="text"
          placeholder="Add a new todo..."
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
        />
        <button type="submit">Add</button>
      </form>

      <ul className="todo-list">
        {todos.map(todo => (
          <li key={todo._id} className={todo.completed ? 'completed' : ''}>
            <label>
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo._id, todo.completed)}
              />
              <span>{todo.title}</span>
            </label>
            <button onClick={() => deleteTodo(todo._id)} className="delete-btn">
              Delete
            </button>
          </li>
        ))}
      </ul>
      
      {todos.length === 0 && (
        <p className="empty-state">No todos yet. Add one above!</p>
      )}
    </div>
  );
}
