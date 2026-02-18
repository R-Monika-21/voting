// src/components/Admin/ResultManagement.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import API from '../../api';
import { jsPDF } from 'jspdf';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ResultManagement = () => {
  const navigate = useNavigate();

  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const userType = localStorage.getItem('userType'); // 'voter' or 'admin'

  useEffect(() => {
    fetchClosedElections();
  }, []);

  const fetchClosedElections = async () => {
    try {
      setLoading(true);
      const url =
        userType === 'admin'
          ? '/api/admin/elections/results/closed'
          : '/api/elections/results/closed';
      const res = await API.get(url);
      setElections(res.data);
    } catch (err) {
      setError('Failed to load election results');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectElection = async (electionId) => {
    try {
      setLoading(true);
      const url =
        userType === 'admin'
          ? `/api/admin/elections/${electionId}/results`
          : `/api/elections/${electionId}/results`;
      const res = await API.get(url);
      setSelectedElection(res.data);
    } catch (err) {
      setError('Failed to load election details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => setSelectedElection(null);
  const exportPDF = () => {
  if (!selectedElection) return;

  const doc = new jsPDF();

  const { election, candidates, winner } = selectedElection;

  let y = 10;
  doc.setFontSize(16);
  doc.text(`Election: ${election.title}`, 10, y);
  y += 8;
  doc.setFontSize(12);
  doc.text(`End Date: ${new Date(election.end_date).toLocaleDateString()}`, 10, y);
  y += 6;
  const totalVotes = candidates.reduce((sum, c) => sum + c.vote_count, 0);
  doc.text(`Total Votes: ${totalVotes}`, 10, y);
  y += 8;

  // Table Header
  doc.setFont(undefined, 'bold');
  doc.text('Candidate', 10, y);
  doc.text('Course/Major', 70, y);
  doc.text('Votes', 120, y);
  doc.text('Percentage', 150, y);
  doc.text('Winner', 180, y);
  doc.setFont(undefined, 'normal');
  y += 6;

  candidates.forEach((c) => {
    doc.text(c.name, 10, y);
    doc.text(c.course || c.major || '—', 70, y);
    doc.text(`${c.vote_count}`, 120, y);
    doc.text(`${c.percentage?.toFixed(2)}%`, 150, y);
    const status = c.is_winner && !winner?.tie ? '🏆' : '';
    doc.text(status, 180, y);
    y += 6;
  });

  y += 4;
  if (winner?.tie) {
    doc.text(`Result: Tie between ${winner.names.join(', ')}`, 10, y);
  } else if (winner) {
    doc.text(
      `Winner: ${winner.name} 🏆 with ${winner.vote_count} votes (${winner.percentage?.toFixed(2)}%)`,
      10,
      y
    );
  } else {
    doc.text('No votes cast.', 10, y);
  }

  doc.save(`${election.title}-summary.pdf`);
};

  if (loading && !selectedElection) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-600 p-6">{error}</div>;
  }

  // ────────────────────────────────────────────────
  // LIST OF CLOSED ELECTIONS
  // ────────────────────────────────────────────────
  if (!selectedElection) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <button
          onClick={() =>
            navigate(userType === 'admin' ? '/admin-dashboard' : '/voter-dashboard')
          }
          className="mb-6 text-blue-600 hover:text-blue-800 font-medium flex items-center"
        >
          ← Back to Dashboard
        </button>

        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          Election Results
        </h1>
        

        {elections.length === 0 ? (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded">
            <p className="text-yellow-700">No completed elections available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {elections.map((election) => (
              <div
                key={election.id}
                onClick={() => handleSelectElection(election.id)}
                className="bg-white shadow-md rounded-xl overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer border border-gray-200"
              >
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-2 line-clamp-2">
                    {election.title}
                  </h2>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Ended: {new Date(election.end_date).toLocaleDateString()}</p>
                    <p className="font-medium text-green-600">
                      Total votes: {election.total_votes || '—'}
                    </p>
                  </div>
                </div>
                <div className="bg-gray-50 px-6 py-4 text-right">
                  <button className="text-blue-600 font-medium hover:text-blue-800">
                    View Results →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ────────────────────────────────────────────────
  // DETAILED RESULTS VIEW
  // ────────────────────────────────────────────────
  const { election, candidates, winner } = selectedElection;
  const totalVotes = candidates.reduce((sum, c) => sum + c.vote_count, 0);

  const chartData = {
    labels: candidates.map((c) => c.name),
    datasets: [
      {
        label: 'Votes',
        data: candidates.map((c) => c.vote_count),
        backgroundColor: [
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 99, 132, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(153, 102, 255, 0.7)',
          'rgba(255, 159, 64, 0.7)',
        ],
        borderColor: [
          'rgb(54, 162, 235)',
          'rgb(255, 99, 132)',
          'rgb(75, 192, 192)',
          'rgb(255, 206, 86)',
          'rgb(153, 102, 255)',
          'rgb(255, 159, 64)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Vote Distribution', font: { size: 18 } },
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Number of Votes' } },
    },
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <button
        onClick={goBack}
        className="mb-6 text-blue-600 hover:text-blue-800 font-medium flex items-center"
      >
        ← Back to all results
      </button>

      {/* ✅ Export / Summary Buttons */}
      

      {/* Election Summary */}
      <div className="bg-white shadow-lg rounded-xl p-8 mb-8 border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{election.title}</h1>
        {/* ... rest of summary and chart / table as before ... */}
        
      </div>

      {/* Vote Distribution Chart */}
      <div className="bg-white shadow-lg rounded-xl p-8 mb-10">
        <h2 className="text-2xl font-semibold mb-6 text-center">Vote Distribution</h2>
        <div className="h-96">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Candidate Table */}
      <div className="bg-white shadow-lg rounded-xl overflow-hidden">
        <h2 className="text-2xl font-semibold p-6 bg-gray-50 border-b">Candidate Results</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Symbol</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Candidate</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Course / Major</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Votes</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Percentage</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {candidates.map((candidate) => (
                <tr key={candidate.id} className="hover:bg-gray-50">
                  <td className="px-6 py-5">
                    {candidate.symbol_url ? (
                      <img src={candidate.symbol_url} alt="symbol" className="h-12 w-12 object-contain rounded" />
                    ) : (
                      <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center text-gray-500">—</div>
                    )}
                  </td>
                  <td className="px-6 py-5 font-medium text-gray-900">{candidate.name}</td>
                  <td className="px-6 py-5 text-gray-600">{candidate.course || candidate.major || '—'}</td>
                  <td className="px-6 py-5 text-right font-medium">{candidate.vote_count}</td>
                  <td className="px-6 py-5 text-right font-medium">{candidate.percentage?.toFixed(1)}%</td>
                  <td className="px-6 py-5 text-center">
                    {candidate.is_winner && !winner?.tie && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">Winner 🏆</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
};

export default ResultManagement;
