import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from "../../api";

function AddCandidate() {
  const navigate = useNavigate();

  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: 'success' });

  const [formData, setFormData] = useState({
    election_id: '',
    name: '',
    email: '',
    roll_no: '',
    year: '',
    course: '',
    major: '',
    symbol: null,
  });

  // Fetch upcoming elections
  useEffect(() => {
    const fetchElections = async () => {
      try {
        setLoading(true);
        setMessage({ text: '', type: 'success' });

        const response = await API.get('/api/admin/elections');
setElections(response.data || []);

      } catch (err) {
        console.error('Error fetching elections:', err);
        setMessage({
          text: 'Failed to load elections. Please try again later.',
          type: 'error',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchElections();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, symbol: file }));
    }
  };

  const resetForm = () => {
    setFormData({
      election_id: formData.election_id, // keep selected election
      name: '',
      email: '',
      roll_no: '',
      year: '',
      course: '',
      major: '',
      symbol: null,
    });
    const fileInput = document.getElementById('symbol');
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: 'success' });

    if (!formData.election_id) {
      setMessage({ text: 'Please select an election', type: 'error' });
      setLoading(false);
      return;
    }

    if (!formData.symbol) {
      setMessage({ text: 'Please upload a symbol image', type: 'error' });
      setLoading(false);
      return;
    }

    const data = new FormData();
    data.append('election_id', formData.election_id);
    data.append('name', formData.name.trim());
    data.append('email', formData.email.trim());
    data.append('roll_no', formData.roll_no.trim());
    data.append('year', formData.year);
    data.append('course', formData.course.trim());
    data.append('major', formData.major);
    data.append('symbol', formData.symbol);

    try {
      const res = await API.post('/api/candidates', data);

setMessage({
  text: res.data.message || 'Candidate added successfully!',
  type: 'success',
});

      resetForm();
    } catch (err) {
      console.error('Error adding candidate:', err);
      setMessage({ text: err.message || 'Error adding candidate', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="relative bg-indigo-600 text-white px-6 py-4">
          <button
            onClick={() => navigate(-1)}
            className="absolute left-5 top-1/2 -translate-y-1/2 text-white hover:text-gray-200 transition"
            title="Go back"
          >
            ← Back
          </button>
          <h1 className="text-xl md:text-2xl font-bold text-center">Add New Candidate</h1>
        </div>

        <div className="p-6 md:p-8">
          {/* Messages */}
          {message.text && (
            <div
              className={`mb-6 p-4 rounded-lg text-center ${
                message.type === 'success'
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Election Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Election <span className="text-red-500">*</span>
              </label>
              {loading ? (
                <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                  Loading elections...
                </div>
              ) : elections.length === 0 ? (
                <div className="w-full px-4 py-2 border border-red-300 rounded-lg bg-red-50 text-red-700">
                  No upcoming elections found
                </div>
              ) : (
                <select
                  name="election_id"
                  value={formData.election_id}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                >
                  <option value="">-- Select Upcoming Election --</option>
                  {elections.map((el) => (
                    <option key={el.id} value={el.id}>
                      {el.election_name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email ID <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>

            {/* Roll No */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Roll Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="roll_no"
                value={formData.roll_no}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>

            {/* Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year <span className="text-red-500">*</span>
              </label>
              <select
                name="year"
                value={formData.year}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              >
                <option value="">-- Select Year --</option>
                {[1, 2, 3, 4, 5].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Course & Major */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="course"
                  value={formData.course}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Computer Science"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Major <span className="text-red-500">*</span>
                </label>
                <select
                  name="major"
                  value={formData.major}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                >
                  <option value="">-- Select --</option>
                  <option value="B.E">B.E</option>
                  <option value="B.Tech">B.Tech</option>
                  <option value="M.E">M.E</option>
                  <option value="M.Tech">M.Tech</option>
                  <option value="MBA">MBA</option>
                </select>
              </div>
            </div>

            {/* Symbol Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Election Symbol (Image) <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                id="symbol"
                name="symbol"
                accept="image/png,image/jpeg,image/jpg,image/gif"
                onChange={handleFileChange}
                required
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-indigo-50 file:text-indigo-700
                  hover:file:bg-indigo-100
                  focus:outline-none"
              />
              <p className="mt-1 text-xs text-gray-500">
                Allowed: PNG, JPG, JPEG, GIF (max 2MB recommended)
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-6 rounded-lg text-white font-medium transition
                ${loading
                  ? 'bg-indigo-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'}`}
            >
              {loading ? 'Adding Candidate...' : 'Add Candidate'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddCandidate;