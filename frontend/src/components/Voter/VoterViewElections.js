// src/components/VoterViewElections.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const VoterViewElections = () => {
  const navigate = useNavigate();

  const [elections, setElections] = useState([]);
  const [filteredElections, setFilteredElections] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedElection, setSelectedElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [message, setMessage] = useState('');
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchElections();
  }, []);

  useEffect(() => {
    const term = searchTerm.toLowerCase().trim();
    const filtered = elections.filter(el =>
      el.election_name.toLowerCase().includes(term)
    );
    setFilteredElections(filtered);
  }, [searchTerm, elections]);

  const fetchElections = async () => {
    try {
      const res = await fetch('/api/admin/elections');
      const data = await res.json();

      const valid = data.filter(el => {
        const now = new Date();
        const end = new Date(`${el.end_date}T${el.end_time}:00`);
        return now <= end;
      });

      setElections(valid);
      setFilteredElections(valid);
    } catch {
      setMessage('Could not load elections.');
    }
  };

  const isActive = (el) => {
    const now = new Date();
    const start = new Date(`${el.election_date}T${el.election_time}:00`);
    const end = new Date(`${el.end_date}T${el.end_time}:00`);
    return now >= start && now <= end;
  };

  const isUpcoming = (el) => {
    const now = new Date();
    const start = new Date(`${el.election_date}T${el.election_time}:00`);
    return now < start;
  };

  const activeElections = filteredElections.filter(isActive);
  const upcomingElections = filteredElections.filter(isUpcoming);

  const handleSelectElection = async (election) => {
    setSelectedElection(election);
    setCandidates([]);
    setSelectedCandidateId(null);
    setHasVoted(false);
    setMessage('');
    setLoading(true);

    const now = new Date();
    const start = new Date(`${election.election_date}T${election.election_time}:00`);
    const end = new Date(`${election.end_date}T${election.end_time}:00`);

    if (now < start) {
      setMessage(`This election starts on ${election.election_date} at ${election.election_time}`);
      setLoading(false);
      return;
    }

    if (now > end) {
      setMessage('This election has already ended.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `/api/elections/${election.id}/candidates-and-vote-status`,
        { credentials: 'include' }
      );

      const data = await res.json();
      setCandidates(data.candidates || []);
      setHasVoted(!!data.has_voted);

      if (data.has_voted) {
        setMessage('You have already voted in this election.');
      }
    } catch {
      setMessage('Could not load candidates.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() =>
              selectedElection
                ? setSelectedElection(null)
                : navigate('/voter-dashboard')
            }
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← {selectedElection ? 'Back to Elections' : 'Back to Dashboard'}
          </button>
        </div>

        {!selectedElection && (
          <>
            {/* Title + Search */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
              <h2 className="text-4xl font-bold text-gray-800">
                Available Elections
              </h2>

              <input
                type="text"
                placeholder="Search by election name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-80 px-4 py-2 border rounded-lg"
              />
            </div>

            {/* Active Elections */}
            <section className="mb-16">
              <h3 className="text-2xl font-semibold mb-6 text-gray-900">

                Active Elections
              </h3>

              {activeElections.length === 0 ? (
                <p className="text-gray-500 text-center py-6">
                  No active elections.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeElections.map((el) => (
                    <ElectionCard
                      key={el.id}
                      election={el}
                      status="ACTIVE"
                      onClick={() => handleSelectElection(el)}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Upcoming Elections */}
            <section>
              <h3 className="text-2xl font-semibold mb-6 text-gray-900">

                Upcoming Elections
              </h3>

              {upcomingElections.length === 0 ? (
                <p className="text-gray-500 text-center py-6">
                  No upcoming elections.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcomingElections.map((el) => (
                    <ElectionCard
                      key={el.id}
                      election={el}
                      status="UPCOMING"
                      onClick={() => handleSelectElection(el)}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {/* Selected Election */}
        {selectedElection && (
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8">
            <h3 className="text-3xl font-bold text-center mb-6">
              {selectedElection.election_name}
            </h3>

            {message && (
              <div className="mb-6 p-4 bg-blue-50 text-blue-800 rounded-lg text-center">
                {message}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const ElectionCard = ({ election, onClick, status }) => (
  <div
    onClick={onClick}
    className="cursor-pointer rounded-xl p-6 border bg-white border-gray-200 hover:shadow-lg transition-shadow duration-300"
  >
    <h3 className="text-xl font-semibold text-indigo-700 mb-3">
      {election.election_name}
    </h3>

    <p className="text-sm text-gray-700">
      Starts: {election.election_date} {election.election_time}
    </p>
    <p className="text-sm text-gray-700">
      Ends: {election.end_date} {election.end_time}
    </p>

    {/* Status Badge */}
    <div className="mt-3">
      <span
        className={`px-3 py-1 text-sm font-semibold rounded-full ${
          status === 'ACTIVE'
            ? 'bg-green-100 text-green-700'
            : 'bg-orange-100 text-orange-700'
        }`}
      >
        {status}
      </span>
    </div>
  </div>
);

export default VoterViewElections;
