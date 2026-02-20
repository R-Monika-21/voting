// src/components/Register.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from "../api";

const Register = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [studentName, setStudentName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [major, setMajor] = useState('B.E');
  const [course, setCourse] = useState('');
  const [year, setYear] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const checkRes = await API.post('/api/voter/check-email', { email });

      if (checkRes.data.exists) {
        setError("Email already registered");
        setLoading(false);
        return;
      }

      setStudentName(name);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const voterData = {
      student_name: studentName.trim(),
      roll_no: rollNo.trim().toUpperCase(),
      major,
      course: course.trim(),
      year: parseInt(year),
      email: email.trim().toLowerCase(),
      password,
    };

    try {
      const response = await API.post('/api/voter/register', voterData);

      if (response.data.success) {
        alert("Registration successful! Please login.");
        navigate('/voter-dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-100 px-4 py-10">

      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold text-blue-700">
            Smart Online Voting
          </h1>
          <p className="text-gray-600 mt-2">
            Secure Registration • Honest Elections
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-lg border border-gray-200 rounded-2xl shadow-2xl p-8 transition-all duration-300">

          {/* Step Indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm ${
              step === 1 ? "bg-blue-600 text-white" : "bg-green-500 text-white"
            }`}>
              1
            </div>

            <div className={`flex-1 h-1 mx-2 ${
              step === 2 ? "bg-green-500" : "bg-gray-300"
            }`} />

            <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm ${
              step === 2 ? "bg-green-600 text-white" : "bg-gray-300 text-gray-600"
            }`}>
              2
            </div>
          </div>

          <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
            {step === 1 ? "Create Your Account" : "Complete Your Profile"}
          </h2>

          {error && (
            <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-5">

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Full Name"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition outline-none"
              />

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Email Address"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition outline-none"
              />

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Password (min 6 characters)"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition outline-none"
              />

              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm Password"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition outline-none"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition shadow-md disabled:opacity-50"
              >
                {loading ? "Checking..." : "Continue"}
              </button>

              <p className="text-center text-sm text-gray-600">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-blue-600 font-medium hover:underline"
                >
                  Login
                </button>
              </p>
            </form>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <form onSubmit={handleFinalSubmit} className="space-y-5">

              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                required
                placeholder="Student Name"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition outline-none"
              />

              <input
                type="text"
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value)}
                required
                placeholder="Roll Number (e.g., 21CS045)"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition outline-none"
              />

              <select
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition outline-none"
              >
                <option value="B.E">B.E</option>
                <option value="B.Tech">B.Tech</option>
                <option value="M.E">M.E</option>
                <option value="M.Tech">M.Tech</option>
                <option value="MBA">MBA</option>
              </select>

              <input
                type="text"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                required
                placeholder="Course / Department"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition outline-none"
              />

              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                required
                min="1"
                max="5"
                placeholder="Year of Study (1-5)"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition outline-none"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition shadow-md disabled:opacity-50"
              >
                {loading ? "Registering..." : "Complete Registration"}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-gray-500 hover:text-gray-800 mt-2"
              >
                ← Back to Account Details
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          One Person • One Vote • Secure Digital Elections
        </p>

      </div>
    </div>
  );
};

export default Register;