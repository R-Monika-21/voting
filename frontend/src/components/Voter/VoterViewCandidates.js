// src/components/VoterViewCandidates.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const VoterViewCandidates = () => {
  const navigate = useNavigate();

  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchElectionsWithCandidates = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token') || '';

        const response = await axios.get(
          'http://localhost:5000/api/voter/elections-with-candidates',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = Array.isArray(response.data) ? response.data : [];
        setElections(data);
        setError(null);
      } catch (err) {
        console.error("Failed to load dashboard:", err);
        setError(
          err.response?.data?.message ||
          err.response?.data?.error ||
          "Could not load election data. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchElectionsWithCandidates();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading elections...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">!</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/voter-dashboard')}
            className="flex items-center text-blue-600 hover:text-blue-800 font-medium transition"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Candidate List for Elections
          </h1>
          <p className="text-lg text-gray-600">
            View all candidates for the elections and make informed decisions when you vote.
          </p>
        </div>

        {elections.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-10 text-center">
            <p className="text-gray-500 text-lg">
              No elections found at the moment.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {elections.map((election) => (
              <div
                key={election.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100"
              >
                {/* Election Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
                  <h2 className="text-2xl font-bold text-white">
                    {election.election_name || "Unnamed Election"}
                  </h2>
                </div>

                {/* Candidates */}
                <div className="p-6">
                  {election.candidates?.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {election.candidates.map((candidate) => (
                        <div
                          key={candidate.id}
                          className="bg-gray-50 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-200 flex flex-col"
                        >
                          {/* Symbol / Image */}
                          <div className="h-48 bg-gray-200 flex items-center justify-center relative">
                            {candidate.symbol_url ? (
                              <img
                                src={`http://localhost:5000${candidate.symbol_url}`}
                                alt={`${candidate.name} symbol`}
                                className="max-h-full max-w-full object-contain p-4"
                                onError={(e) => {
                                  e.target.src = '/default-symbol.png';
                                  e.target.onerror = null;
                                }}
                              />
                            ) : (
                              <div className="text-gray-400 text-6xl">🗳️</div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="p-5 flex flex-col flex-grow">
                            <h3 className="text-xl font-semibold text-gray-900 mb-1 truncate">
                              {candidate.name}
                            </h3>
                            <p className="text-gray-600 mb-3 font-medium">
                              {candidate.roll_no}
                            </p>

                            <div className="space-y-1 text-sm text-gray-600 flex-grow">
                              <p>
                                <span className="font-medium">Course:</span>{' '}
                                {candidate.course}
                              </p>
                              <p>
                                <span className="font-medium">Major:</span>{' '}
                                {candidate.major}
                              </p>
                              <p>
                                <span className="font-medium">Year:</span>{' '}
                                {candidate.year}
                              </p>
                            </div>

                            {candidate.count !== undefined && (
                              <div className="mt-4 pt-3 border-t border-gray-200">
                                <p className="text-center text-lg font-bold text-indigo-700">
                                  {candidate.count} votes
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8 italic">
                      No candidates registered for this election yet.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VoterViewCandidates;
