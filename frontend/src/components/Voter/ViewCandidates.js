import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment'; // For time formatting

const ViewCandidates = () => {
  const [candidates, setCandidates] = useState([]);
  const [electionId, setElectionId] = useState(''); // Assume select election

  useEffect(() => {
    if (electionId) {
      const fetchCandidates = async () => {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:5000/api/candidates/${electionId}`, { headers: { Authorization: `Bearer ${token}` } });
        setCandidates(res.data);
      };
      fetchCandidates();
    }
  }, [electionId]);

  return (
    <div className="bg-white p-4 rounded shadow-md">
      <h2 className="text-xl mb-2">View Candidates</h2>
      {/* Input for electionId */}
      <input placeholder="Election ID" onChange={(e) => setElectionId(e.target.value)} className="mb-2 p-2 border w-full" />
      <ul>
        {candidates.map((cand) => (
          <li key={cand.id} className="mb-2">
            {cand.name} - {cand.roll_no} - {cand.major} - {cand.course} - {cand.year}
            <img src={`http://localhost:5000/${cand.symbol}`} alt="Symbol" className="w-10 h-10" />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ViewCandidates;