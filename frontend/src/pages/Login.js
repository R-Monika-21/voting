// src/pages/Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API from "../api";

const Login = () => {
  const navigate = useNavigate();

  const [loginType, setLoginType] = useState('voter'); // 'voter' or 'admin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const payload = { email, password };

    try {
      if (loginType === 'voter') {
        const response = await API.post('/api/voter/login', payload);

        if (response.data.success) {
          localStorage.setItem('userType', 'voter');
          localStorage.setItem("token", response.data.token);
          localStorage.setItem('user', JSON.stringify({
            id: response.data.voter.id,
            email: response.data.voter.email,
            name: response.data.voter.name || email.split('@')[0], // fallback
          }));
          // localStorage.setItem('token', response.data.token || ''); // if you add JWT later

          navigate('/voter-dashboard', { replace: true });
        }
      } 
      else if (loginType === 'admin') {
        const response = await API.post('/api/admin/login', payload);

        if (response.data.success) {
          localStorage.setItem('userType', 'admin');
          localStorage.setItem('user', JSON.stringify({
            id: response.data.admin.id,
            name: response.data.admin.name,
            email: response.data.admin.email,
          }));

          navigate('/admin-dashboard', { replace: true });
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-800 dark:text-white">
          Login to Voting System
        </h2>

        <div className="flex justify-center gap-4 mb-8">
          <button
            type="button"
            onClick={() => setLoginType('voter')}
            className={`px-6 py-3 rounded-lg font-medium transition ${
              loginType === 'voter'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300'
            }`}
          >
            Voter Login
          </button>
          <button
            type="button"
            onClick={() => setLoginType('admin')}
            className={`px-6 py-3 rounded-lg font-medium transition ${
              loginType === 'admin'
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300'
            }`}
          >
            Admin Login
          </button>
        </div>

        {error && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value.trim().toLowerCase())}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-medium text-white transition ${
              loginType === 'voter' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'
            } disabled:opacity-50`}
          >
            {loading ? 'Logging in...' : `Login as ${loginType === 'voter' ? 'Voter' : 'Admin'}`}
          </button>
        </form>

        {loginType === 'voter' && (
          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Register here
            </button>
          </p>
        )}
      </div>
    </div>
  );
};

export default Login;