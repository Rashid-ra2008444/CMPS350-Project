import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';

const Login = ({ setCurrentUser }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already logged in
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      const user = JSON.parse(currentUser);
      redirectBasedOnRole(user);
    }
  }, []);

  const redirectBasedOnRole = (user) => {
    if (user.status === 'admin') {
      navigate('/admin/courses');
    } else if (user.status === 'student') {
      navigate('/coursepage');
    } else if (user.status === 'instructor') {
      navigate('/instructor/classes');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      // In a real app, this would be an API call
      // Here we're simulating an API call by loading from a JSON file
      const response = await fetch('/data/login.json');
      const users = await response.json();
      
      const user = users.find(
        user => user.username === username && 
               user.password === parseInt(password, 10)
      );
      
      if (user) {
        // Store user info in localStorage
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        // Update context
        setCurrentUser(user);
        
        // Redirect based on role
        redirectBasedOnRole(user);
      } else {
        setError('Invalid username or password');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setError('Error loading user data');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <header>
        <h1>Qatar University</h1>
      </header>
      <main>
        <div className="login-form">
          <h2>Login</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username"><b>Username:</b></label>
              <input 
                type="text" 
                id="username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username" 
                required 
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password"><b>Password:</b></label>
              <input 
                type="password" 
                id="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password" 
                required 
              />
            </div>
            
            {error && <div id="error-message" className="error-message">{error}</div>}
            
            <button 
              type="submit" 
              disabled={isLoading}
              className="login-button"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Login;