// src/components/Admin/CreateElection.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const CreateElection = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    election_name: '',
    election_date: '',
    election_time: '',
    end_date: '',
    end_time: '',
    result_date: '',
    result_time: '',
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const res = await axios.post('/api/admin/elections', formData);

      if (res.status === 201 || res.data?.success) {
        setMessage('Election created successfully!');
        setFormData({
          election_name: '',
          election_date: '',
          election_time: '',
          end_date: '',
          end_time: '',
          result_date: '',
          result_time: '',
        });
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to create election');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl -mt-12 mx-auto bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="bg-indigo-600 px-8 py-6 relative">
          <h1 className="text-2xl md:text-3xl font-bold text-white text-center">
            Create New Election
          </h1>

          {/* Back button - top right */}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-6 left-8 text-white hover:text-indigo-200 transition-colors flex items-center gap-2 text-lg font-medium"
          >
            ← Back
          </button>
        </div>

        {/* Messages */}
        <div className="px-8 pt-6">
          {message && (
            <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded mb-6">
              {message}
            </div>
          )}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6">
              {error}
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-6">
          {/* Election Name */}
          <div>
            <label
              htmlFor="election_name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Election Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              id="election_name"
              name="election_name"
              value={formData.election_name}
              onChange={handleChange}
              required
              maxLength={100}
              placeholder="e.g. Student Council Election 2026"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white"
            />
          </div>

          {/* Start Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="election_date"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Start Date <span className="text-red-600">*</span>
              </label>
              <input
                type="date"
                id="election_date"
                name="election_date"
                value={formData.election_date}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              />
            </div>
            <div>
              <label
                htmlFor="election_time"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Start Time <span className="text-red-600">*</span>
              </label>
              <input
                type="time"
                id="election_time"
                name="election_time"
                value={formData.election_time}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              />
            </div>
          </div>

          {/* End Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="end_date"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                End Date <span className="text-red-600">*</span>
              </label>
              <input
                type="date"
                id="end_date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              />
            </div>
            <div>
              <label
                htmlFor="end_time"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                End Time <span className="text-red-600">*</span>
              </label>
              <input
                type="time"
                id="end_time"
                name="end_time"
                value={formData.end_time}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              />
            </div>
          </div>

          {/* Result Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="result_date"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Result Date <span className="text-red-600">*</span>
              </label>
              <input
                type="date"
                id="result_date"
                name="result_date"
                value={formData.result_date}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              />
            </div>
            <div>
              <label
                htmlFor="result_time"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Result Time <span className="text-red-600">*</span>
              </label>
              <input
                type="time"
                id="result_time"
                name="result_time"
                value={formData.result_time}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-6">
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors shadow-md
                ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'
                }`}
            >
              {loading ? 'Creating...' : 'Create Election'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateElection;