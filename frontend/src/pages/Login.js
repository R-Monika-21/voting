// src/pages/Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from "../api";

const Login = () => {
  const navigate = useNavigate();

  const [loginType, setLoginType] = useState('voter');
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
            name: response.data.voter.name || email.split('@')[0],
          }));

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-100 px-4">

      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-blue-700">
            Smart Online Voting
          </h1>
          <p className="text-gray-600 mt-2">
            Secure • Transparent • Trusted
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/80 backdrop-blur-lg border border-gray-200 rounded-2xl shadow-2xl p-8 transition-all duration-300">

          <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
            Login to Your Account
          </h2>

          {/* Toggle Buttons */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            <button
              type="button"
              onClick={() => setLoginType('voter')}
              className={`w-1/2 py-2 rounded-lg font-semibold transition-all duration-300 ${
                loginType === 'voter'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              🗳️ Voter
            </button>

            <button
              type="button"
              onClick={() => setLoginType('admin')}
              className={`w-1/2 py-2 rounded-lg font-semibold transition-all duration-300 ${
                loginType === 'admin'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              🛠 Admin
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-5 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value.trim().toLowerCase())}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-semibold text-white text-lg transition duration-300 shadow-md ${
                loginType === 'voter'
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-green-600 hover:bg-green-700'
              } disabled:opacity-50`}
            >
              {loading ? 'Logging in...' : `Login as ${loginType === 'voter' ? 'Voter' : 'Admin'}`}
            </button>
          </form>

          {/* Register Link */}
          {loginType === 'voter' && (
            <p className="text-center text-sm text-gray-600 mt-6">
              Don’t have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="text-blue-600 font-medium hover:underline"
              >
                Register here
              </button>
            </p>
          )}

        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-6">
          Every Vote Matters • Powered by Secure Authentication
        </p>

      </div>
    </div>
  );
};

export default Login;