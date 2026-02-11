import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeftIcon } from '@heroicons/react/24/outline'; // install: npm install @heroicons/react

const ViewVoter = () => {
  const [voters, setVoters] = useState([]);
  const [selectedVoter, setSelectedVoter] = useState(null);
  const [filters, setFilters] = useState({
    student_name: '',
    roll_no: '',
    year: '',
    major: '',
    course: '',
  });

  useEffect(() => {
    if (!selectedVoter) {
      fetchVoters();
    }
  }, [filters, selectedVoter]);

  const fetchVoters = async () => {
    try {
      const params = new URLSearchParams(
        Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
      );
      const response = await axios.get('http://localhost:5000/api/voter/voters', { params });
      setVoters(response.data);
    } catch (error) {
      console.error('Error fetching voters:', error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      student_name: '',
      roll_no: '',
      year: '',
      major: '',
      course: '',
    });
  };

  const handleSelectVoter = (voter) => {
    setSelectedVoter(voter);
  };

  const handleBack = () => {
    setSelectedVoter(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Always visible header with Back button */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button
              onClick={handleBack}
              className={`flex items-center text-gray-700 hover:text-gray-900 transition mr-4 ${
                !selectedVoter ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={!selectedVoter}
            >
              <ArrowLeftIcon className="w-6 h-6 mr-2" />
              Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              {selectedVoter ? 'Voter Details' : 'View All Voters'}
            </h1>
          </div>
        </div>

        {/* Show filters and list only when no voter is selected */}
        {!selectedVoter && (
          <>
            {/* Filters */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <input
                  type="text"
                  name="student_name"
                  placeholder="Search by Name"
                  value={filters.student_name}
                  onChange={handleFilterChange}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                />
                <input
                  type="text"
                  name="roll_no"
                  placeholder="Search by Roll No"
                  value={filters.roll_no}
                  onChange={handleFilterChange}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                />
                <select
                  name="year"
                  value={filters.year}
                  onChange={handleFilterChange}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">Year (1-5)</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </select>
                <input
                  type="text"
                  name="major"
                  placeholder="Major (B.E / B.Tech / M.E ...)"
                  value={filters.major}
                  onChange={handleFilterChange}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                />
                <input
                  type="text"
                  name="course"
                  placeholder="Course / Dept (CSE, IT, MBA...)"
                  value={filters.course}
                  onChange={handleFilterChange}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                />
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="px-6 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition font-medium"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Voter Cards */}
            <div className="space-y-4">
              {voters.length === 0 ? (
                <p className="text-center text-gray-500 py-12">
                  No voters found matching the filters.
                </p>
              ) : (
                voters.map((voter) => (
                  <div
                    key={voter.id}
                    onClick={() => handleSelectVoter(voter)}
                    className="flex items-center p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-blue-400 hover:shadow-md transition cursor-pointer"
                  >
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                        voter.student_name
                      )}&background=random&size=128`}
                      alt={`${voter.student_name} profile`}
                      className="w-16 h-16 rounded-full mr-4 object-cover border border-gray-300"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/64?text=User';
                      }}
                    />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {voter.student_name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Roll No: {voter.roll_no} • {voter.course} • Year {voter.year}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* Selected Voter Details */}
        {selectedVoter && (
          <div className="bg-white p-8 rounded-xl shadow-md border border-gray-200">
            <div className="flex items-center gap-6 mb-8">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                  selectedVoter.student_name
                )}&background=random&size=128`}
                alt={`${selectedVoter.student_name} profile`}
                className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 shadow-sm"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/128?text=User';
                }}
              />
              <div>
                <h2 className="text-3xl font-bold text-gray-900">
                  {selectedVoter.student_name}
                </h2>
                <p className="text-lg text-gray-600 mt-1">
                  Roll No: {selectedVoter.roll_no}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="text-gray-500 text-sm">Year</p>
                <p className="text-lg font-medium">{selectedVoter.year}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Major</p>
                <p className="text-lg font-medium">{selectedVoter.major}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Course / Department</p>
                <p className="text-lg font-medium">{selectedVoter.course}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Email</p>
                <p className="text-lg font-medium break-all">{selectedVoter.email}</p>
              </div>
            </div>

            <div className="mt-10">
              <button
                onClick={handleBack}
                className="px-8 py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition font-medium shadow-sm"
              >
                Back to List
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewVoter;