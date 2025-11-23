import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import StudentDashboard from './components/StudentDashboard';
import ParentDashboard from './components/ParentDashboard';

// Set up axios defaults
axios.defaults.baseURL = 'http://localhost:8000/api';
const token = localStorage.getItem('token');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const response = await axios.get('user');
          setUser(response.data);
        } catch {
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    // Set axios authorization header with the new token
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const getDashboardRoute = (role) => {
    switch (role) {
      case 'admin':
        return '/admin';
      case 'student':
        return '/student';
      case 'parent':
        return '/parent';
      default:
        return '/login';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App min-h-screen bg-gray-50">
        <Routes>
          <Route path="/login" element={user ? <Navigate to={getDashboardRoute(user.role)} /> : <Login onLogin={handleLogin} />} />
          <Route path="/admin" element={user && user.role === 'admin' ? <AdminDashboard onLogout={handleLogout} /> : <Navigate to="/login" />} />
          <Route path="/student" element={user && user.role === 'student' ? <StudentDashboard user={user} setUser={setUser} onLogout={handleLogout} /> : <Navigate to="/login" />} />
          <Route path="/parent" element={user && user.role === 'parent' ? <ParentDashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
