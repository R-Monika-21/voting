import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api';

const ViewElections = () => {
  const [elections, setElections] = useState([]);
  const [filteredElections, setFilteredElections] = useState([]);
  const [selectedElectionId, setSelectedElectionId] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [showElectionModal, setShowElectionModal] = useState(false);
  const [currentElection, setCurrentElection] = useState(null);
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [currentCandidate, setCurrentCandidate] = useState(null);

  // Confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchElections();
  }, []);

  const fetchElections = async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/admin/elections');
let data = res.data;


      const now = new Date();
      data = data.map((election) => {
        const start = new Date(`${election.election_date}T${election.election_time}`);
        const result = new Date(`${election.result_date}T${election.result_time}`);
        let updatedStatus = election.election_status;

        if (now >= start && now <= result) updatedStatus = 'ACTIVE';
        else if (now > result) updatedStatus = 'CLOSED';

        if (updatedStatus !== election.election_status) {
          updateElectionStatus(election.id, updatedStatus);
        }

        return { ...election, election_status: updatedStatus };
      });

      data.sort((a, b) => {
        const order = { ACTIVE: 0, UPCOMING: 1, CLOSED: 2 };
        return order[a.election_status] - order[b.election_status];
      });

      setElections(data);
      setFilteredElections(data);
    } catch (err) {
      console.error(err);
      alert('Error loading elections');
    } finally {
      setLoading(false);
    }
  };

  const updateElectionStatus = async (id, status) => {
    try {
      await API.put(`/api/admin/elections/${id}`, {
  election_status: status,
});

    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const fetchCandidates = async (electionId) => {
    setLoading(true);
    try {
      const res = await API.get(`/api/candidates?election_id=${electionId}`);
const data = res.data;

      setCandidates(data);
    } catch (err) {
      console.error(err);
      alert('Error loading candidates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = [...elections];
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((e) => e.election_name.toLowerCase().includes(term));
    }
    if (statusFilter !== 'ALL') {
      result = result.filter((e) => e.election_status === statusFilter);
    }
    setFilteredElections(result);
  }, [searchTerm, statusFilter, elections]);

  const openUpdateElectionModal = (election) => {
    setCurrentElection({ ...election });
    setShowElectionModal(true);
  };

  const handleElectionChange = (e) => {
    const { name, value } = e.target;
    setCurrentElection((prev) => ({ ...prev, [name]: value }));
  };

  const saveElection = async () => {
    if (!currentElection) return;
    try {
      await API.put(`/api/admin/elections/${currentElection.id}`, currentElection);

      setShowElectionModal(false);
      fetchElections();
    } catch (err) {
      alert(`Failed to update election: ${err.message}`);
    }
  };

  const openUpdateCandidateModal = (candidate) => {
    setCurrentCandidate({ ...candidate });
    setShowCandidateModal(true);
  };

  const handleCandidateChange = (e) => {
    const { name, value } = e.target;
    setCurrentCandidate((prev) => ({ ...prev, [name]: value }));
  };

  const saveCandidate = async () => {
    if (!currentCandidate) return;
    try {
      await API.put(`/api/candidates/${currentCandidate.id}`, currentCandidate);

      setShowCandidateModal(false);
      fetchCandidates(selectedElectionId);
    } catch (err) {
      alert(`Failed to update candidate: ${err.message}`);
    }
  };

  const requestDelete = (type, id) => {
    setConfirmAction({ type, id });
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!confirmAction) return;
    const { type, id } = confirmAction;
    try {
      const url = type === 'election' ? `/api/admin/elections/${id}` : `/api/candidates/${id}`;
      await API.delete(url);

      if (type === 'election') {
        fetchElections();
      } else {
        fetchCandidates(selectedElectionId);
      }
    } catch (err) {
      alert('Failed to delete');
    } finally {
      setShowConfirmModal(false);
      setConfirmAction(null);
    }
  };

  const handleViewCandidates = (electionId) => {
    setSelectedElectionId(electionId);
    fetchCandidates(electionId);
  };

  const handleBackToDashboard = () => {
    navigate('/admin-dashboard');
  };

  const handleBackToElections = () => {
    setSelectedElectionId(null);
    setCandidates([]);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Election List View */}
      {!selectedElectionId && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <button
              onClick={handleBackToDashboard}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 shadow-sm"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Manage Elections</h1>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <input
              type="text"
              placeholder="Search by election name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            >
              <option value="ALL">All Statuses</option>
              <option value="UPCOMING">Upcoming</option>
              <option value="ACTIVE">Active</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredElections.map((election) => (
              <div
                key={election.id}
                className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 hover:border-blue-500 transition-all duration-200"
              >
                <div className="p-6">
                  <h3
                    className="text-xl font-semibold text-blue-600 cursor-pointer hover:text-blue-800 transition-colors mb-4"
                    onClick={() => handleViewCandidates(election.id)}
                  >
                    {election.election_name}
                  </h3>
                  <div className="space-y-2 text-gray-700 text-sm">
                    <p><span className="font-medium">Start:</span> {election.election_date} {election.election_time}</p>
                    <p><span className="font-medium">End:</span> {election.end_date || 'N/A'} {election.end_time || ''}</p>
                    <p><span className="font-medium">Result:</span> {election.result_date} {election.result_time}</p>
                    <p>
                      <span className="font-medium">Status:</span>{' '}
                      <span
                        className={`font-bold ${
                          election.election_status === 'ACTIVE'
                            ? 'text-green-600'
                            : election.election_status === 'CLOSED'
                            ? 'text-red-600'
                            : 'text-amber-600'
                        }`}
                      >
                        {election.election_status}
                      </span>
                    </p>
                  </div>
                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={() => openUpdateElectionModal(election)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg transition-colors font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => requestDelete('election', election.id)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg transition-colors font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredElections.length === 0 && (
            <p className="text-center text-gray-500 mt-12 text-lg">No elections found matching your filters.</p>
          )}
        </div>
      )}

      {/* Candidates View */}
      {selectedElectionId && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <button
              onClick={handleBackToElections}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors flex items-center gap-2 text-gray-800 font-medium"
            >
              ← Back to Elections
            </button>
            <h2 className="text-3xl font-bold text-gray-900">Candidates</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {candidates.map((candidate) => (
              <div
                key={candidate.id}
                className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 hover:border-blue-500 transition-all duration-200"
              >
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{candidate.name}</h3>
                  <div className="space-y-2 text-gray-700 text-sm">
                    <p><span className="font-medium">Roll No:</span> {candidate.roll_no}</p>
                    <p><span className="font-medium">Major:</span> {candidate.major}</p>
                    <p><span className="font-medium">Course:</span> {candidate.course}</p>
                    <p><span className="font-medium">Year:</span> {candidate.year}</p>
                    <p><span className="font-medium">Email:</span> {candidate.email}</p>

                    {candidate.symbol ? (
                      <div className="mt-4">
                        <p className="font-medium text-gray-700 mb-2">Symbol:</p>
                       {candidate.symbol ? (
  <div className="mt-4">
    
    <img
      src={`/uploads/${candidate.symbol}`}
      alt={`${candidate.name}'s election symbol`}
      className="w-28 h-28 object-contain rounded-lg border border-gray-300 bg-white"
      onError={(e) => {
        console.warn("Failed to load symbol:", candidate.symbol);
        e.target.onerror = null; // prevent infinite loop
        e.target.src = '/placeholder-symbol.png'; // fallback (place in public/)
        e.target.alt = 'Symbol failed to load';
      }}
    />
    
  </div>
) : (
  <p className="text-gray-500 mt-4">No symbol uploaded</p>
)}
                      </div>
                    ) : (
                      <p className="text-gray-500 mt-4">No symbol uploaded</p>
                    )}
                  </div>

                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={() => openUpdateCandidateModal(candidate)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg transition-colors font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => requestDelete('candidate', candidate.id)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg transition-colors font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {candidates.length === 0 && (
            <p className="text-center text-gray-500 mt-12 text-lg">No candidates found for this election.</p>
          )}
        </div>
      )}

      {/* Election Edit Modal */}
{showElectionModal && currentElection && (
  <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-gray-200">
      <div className="p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Election</h2>

        <div className="space-y-6">
          {/* Election Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Election Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              name="election_name"
              value={currentElection.election_name || ''}
              onChange={handleElectionChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          {/* Start Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Election Date <span className="text-red-600">*</span>
              </label>
              <input
                type="date"
                name="election_date"
                value={currentElection.election_date || ''}
                onChange={handleElectionChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time <span className="text-red-600">*</span>
              </label>
              <input
                type="time"
                name="election_time"
                value={currentElection.election_time || ''}
                onChange={handleElectionChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
          </div>

          {/* End Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date <span className="text-red-600">*</span>
              </label>
              <input
                type="date"
                name="end_date"
                value={currentElection.end_date || ''}
                onChange={handleElectionChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time <span className="text-red-600">*</span>
              </label>
              <input
                type="time"
                name="end_time"
                value={currentElection.end_time || ''}
                onChange={handleElectionChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
          </div>

          {/* Result Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Result Date <span className="text-red-600">*</span>
              </label>
              <input
                type="date"
                name="result_date"
                value={currentElection.result_date || ''}
                onChange={handleElectionChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Result Time <span className="text-red-600">*</span>
              </label>
              <input
                type="time"
                name="result_time"
                value={currentElection.result_time || ''}
                onChange={handleElectionChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
          </div>

          {/* Status (optional - you can allow changing it manually) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="election_status"
              value={currentElection.election_status || 'UPCOMING'}
              onChange={handleElectionChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="UPCOMING">Upcoming</option>
              <option value="ACTIVE">Active</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>

        <div className="mt-10 flex justify-end gap-4">
          <button
            onClick={() => setShowElectionModal(false)}
            className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={saveElection}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  </div>
)}
      {/* Candidate Edit Modal - NOW FULLY IMPLEMENTED */}
      {showCandidateModal && currentCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Candidate</h2>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={currentCandidate.name || ''}
                    onChange={handleCandidateChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Roll No</label>
                  <input
                    type="text"
                    name="roll_no"
                    value={currentCandidate.roll_no || ''}
                    onChange={handleCandidateChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Major</label>
                  <input
                    type="text"
                    name="major"
                    value={currentCandidate.major || ''}
                    onChange={handleCandidateChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                  <input
                    type="text"
                    name="course"
                    value={currentCandidate.course || ''}
                    onChange={handleCandidateChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <input
                    type="text"
                    name="year"
                    value={currentCandidate.year || ''}
                    onChange={handleCandidateChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={currentCandidate.email || ''}
                    onChange={handleCandidateChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                {/* Symbol preview & note (file upload would need separate handling) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Symbol</label>
                  
                  <p className="text-xs text-gray-500 mt-1">
                    Note: Changing symbol not allowed
                  </p>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-4">
                <button
                  onClick={() => setShowCandidateModal(false)}
                  className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveCandidate}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Deletion</h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this {confirmAction?.type === 'election' ? 'election' : 'candidate'}? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewElections;