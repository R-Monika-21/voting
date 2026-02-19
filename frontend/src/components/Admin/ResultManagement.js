import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import API from "../../api";

ChartJS.register(ArcElement, Tooltip, Legend, Title);

const ResultManagement = () => {
  const navigate = useNavigate();

  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState(null);
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState({});
  const [winner, setWinner] = useState(null);

  useEffect(() => {
    API.get("/api/elections/results/closed")
      .then((res) => setElections(res.data))
      .catch((err) => console.error(err));
  }, []);

  const fetchResults = async (electionId) => {
    try {
      const res = await API.get(`/api/elections/${electionId}/results`);
      setResults(res.data.candidates);
      setSummary(res.data.summary);
      setWinner(res.data.winner);
      setSelectedElection(electionId);
    } catch (err) {
      console.error(err);
    }
  };

  const pieData = {
    labels: results.map((c) => c.name),
    datasets: [
      {
        data: results.map((c) => c.vote_count),
        backgroundColor: [
          "#6366f1",
          "#10b981",
          "#f59e0b",
          "#ef4444",
          "#3b82f6",
        ],
      },
    ],
  };

  const pieOptions = {
    plugins: {
      title: {
        display: true,
        text: "Vote Distribution",
      },
      legend: {
        position: "bottom",
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  const downloadPDF = () => {
    window.open(
      `/api/elections/${selectedElection}/results/export/pdf`,
      "_blank"
    );
  };

  const exportCSV = () => {
    window.open(
      `/api/elections/${selectedElection}/results/export/csv`,
      "_blank"
    );
  };

  const printPage = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 py-10 px-6">
      <div className="max-w-7xl mx-auto">

        {!selectedElection && (
          <>
            <button
              onClick={() => navigate(-1)}
              className="mb-6 px-6 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg shadow"
            >
              ← Back
            </button>

            <h2 className="text-4xl font-bold text-center mb-10 text-gray-800">
              📊 Closed Elections
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {elections.map((e) => (
                <div
                  key={e.id}
                  onClick={() => fetchResults(e.id)}
                  className="cursor-pointer bg-white rounded-2xl shadow-lg hover:shadow-2xl transition p-6 border border-gray-100"
                >
                  <h3 className="text-xl font-semibold mb-3 text-indigo-600">
                    {e.title}
                  </h3>
                  <p className="text-gray-500">Click to View Results →</p>
                </div>
              ))}
            </div>
          </>
        )}

        {selectedElection && (
          <>
            <button
              onClick={() => {
                setSelectedElection(null);
                setResults([]);
                setSummary({});
              }}
              className="mb-6 px-6 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg shadow"
            >
              ← Back to Elections
            </button>

            <h2 className="text-4xl font-bold text-center mb-10 text-gray-800">
              🏆 Election Results
            </h2>

            {/* Winner Card */}
            {winner && !winner.tie && (
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center mb-10 border border-yellow-300">
                {winner.symbol_url && (
                  <img
                    src={winner.symbol_url}
                    alt="Winner Symbol"
                    className="w-24 h-24 mx-auto mb-4 object-contain"
                  />
                )}
                <h3 className="text-3xl font-bold text-indigo-600">
                  👑 {winner.name}
                </h3>
                <p className="text-gray-600 mt-2 text-lg">
                  Won by {winner.margin} votes
                </p>
              </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
              <div className="bg-white p-6 rounded-xl shadow text-center">
                <h4 className="text-gray-500">Total Voters</h4>
                <p className="text-3xl font-bold text-indigo-600">
                  {summary.total_registered_voters || 0}
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow text-center">
                <h4 className="text-gray-500">Total Votes</h4>
                <p className="text-3xl font-bold text-indigo-600">
                  {summary.total_votes || 0}
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow text-center">
                <h4 className="text-gray-500">Turnout</h4>
                <p className="text-3xl font-bold text-indigo-600">
                  {summary.turnout_percentage || 0}%
                </p>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-12">
              <table className="min-w-full text-sm">
                <thead className="bg-indigo-600 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left">Symbol</th>
                    <th className="px-6 py-4 text-left">Name</th>
                    <th className="px-6 py-4 text-left">Course</th>
                    <th className="px-6 py-4 text-left">Votes</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((c) => (
                    <tr
                      key={c.id}
                      className={`border-t hover:bg-gray-50 ${
                        c.is_winner ? "bg-yellow-100 font-semibold" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        {c.symbol_url && (
                          <img
                            src={c.symbol_url}
                            alt="symbol"
                            className="w-10 h-10 object-contain"
                          />
                        )}
                      </td>
                      <td className="px-6 py-4">{c.name}</td>
                      <td className="px-6 py-4">{c.course}</td>
                      <td className="px-6 py-4 text-indigo-600 font-bold">
                        {c.vote_count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Smaller Pie Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-lg mb-12 flex justify-center">
              <div style={{ width: "400px", height: "400px" }}>
                <Pie data={pieData} options={pieOptions} />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-wrap justify-center gap-6">
              <button
                onClick={exportCSV}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow"
              >
                Export CSV
              </button>

              <button
                onClick={downloadPDF}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow"
              >
                Download PDF
              </button>

              <button
                onClick={printPage}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-800 text-white rounded-lg shadow"
              >
                Print
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ResultManagement;
