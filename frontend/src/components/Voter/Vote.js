import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';

const Vote = () => {
  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [canVote, setCanVote] = useState(false);
  const electionId = '1'; // Assume or select

  useEffect(() => {
    const fetchElection = async () => {
      const res = await axios.get(`http://localhost:5000/api/election/${electionId}`);
      setElection(res.data);
      const now = moment();
      const startTime = moment(`${res.data.election_date} ${res.data.election_time}`);
      if (now.isAfter(startTime)) {
        setCanVote(true);
        // Fetch candidates
        const candRes = await axios.get(`http://localhost:5000/api/candidates/${electionId}`);
        setCandidates(candRes.data);
      }
    };
    fetchElection();
    const interval = setInterval(fetchElection, 60000); // Poll every min
    return () => clearInterval(interval);
  }, []);

  const handleVote = async () => {
    if (!selectedCandidate) return;
    try {
      const token = localStorage.getItem('token');
      const voterId = localStorage.getItem('userId');
      await axios.post('http://localhost:5000/api/vote', { voter_id: voterId, candidate_id: selectedCandidate, election_id: electionId }, { headers: { Authorization: `Bearer ${token}` } });
      alert('Vote submitted');
      setCanVote(false);
    } catch (err) {
      alert('Error voting');
    }
  };

  if (!election) return <div>Loading...</div>;

  return (
    <div className="bg-white p-4 rounded shadow-md">
      <h2 className="text-xl mb-2">Election Tab</h2>
      {!canVote ? (
        <p>The Election starts at {election.election_time} {election.election_date}</p>
      ) : (
        <>
          <ul>
            {candidates.map((cand) => (
              <li key={cand.id} onClick={() => setSelectedCandidate(cand.id)} className={`cursor-pointer mb-2 ${selectedCandidate === cand.id ? 'bg-blue-200' : ''}`}>
                {cand.name} - {cand.roll_no} ...
              </li>
            ))}
          </ul>
          <button onClick={handleVote} className="bg-blue-500 text-white p-2">Submit Vote</button>
        </>
      )}
    </div>
  );
};

export default Vote;