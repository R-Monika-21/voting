import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';

const Result = () => {
  const [election, setElection] = useState(null);
  const [winner, setWinner] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const electionId = '1'; // Assume

  useEffect(() => {
    const fetchResult = async () => {
      const res = await axios.get(`http://localhost:5000/api/election/${electionId}`);
      setElection(res.data);
      const now = moment();
      const resultTime = moment(`${res.data.result_date} ${res.data.result_time}`);
      if (now.isAfter(resultTime)) {
        setShowResult(true);
        const winRes = await axios.get(`http://localhost:5000/api/result/${electionId}`);
        setWinner(winRes.data.winner);
      }
    };
    fetchResult();
    const interval = setInterval(fetchResult, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!election) return <div>Loading...</div>;

  return (
    <div className="bg-white p-4 rounded shadow-md">
      <h2 className="text-xl mb-2">Result</h2>
      {!showResult ? (
        <p>Results are out at {election.result_time} {election.result_date}</p>
      ) : (
        <p>Winner: {winner.name}</p>
      )}
    </div>
  );
};

export default Result;