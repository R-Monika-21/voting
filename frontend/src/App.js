// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import VoterRegister from './pages/VoterRegister';
import AdminDashboard from './pages/AdminDashboard';
import VoterDashboard from './pages/VoterDashboard';
import ProtectedRoute from './components/Common/ProtectedRoute';

// Admin components
import CreateElection from './components/Admin/CreateElection';
import AddCandidate from './components/Admin/AddCandidate';
import ViewElections from './components/Admin/ViewElections';
import ViewVoters from './components/Admin/ViewVoters';
import ResultManagement from './components/Admin/ResultManagement';
import VoterViewElections from './components/Voter/VoterViewElections';
import VoterViewCandidates from './components/Voter/VoterViewCandidates';
import VoterViewResults from './components/Voter/VoterViewResults'; 
// src/App.js
// ... imports ...

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<VoterRegister />} />

        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<CreateElection />} />
          <Route path="create-election" element={<CreateElection />} />
          <Route path="add-candidate" element={<AddCandidate />} />
          <Route path="view-elections" element={<ViewElections />} />
          <Route path="view-voters" element={<ViewVoters />} />
          <Route path="result-management" element={<ResultManagement />} />
        </Route>

        <Route
          path="/voter-dashboard"
          element={
            <ProtectedRoute role="voter">
              <VoterDashboard />
            </ProtectedRoute>
          }
        >
        <Route index element={<VoterViewElections />} />
        <Route path="view-elections" element={<VoterViewElections />} />
        <Route path="view-candidates" element={<VoterViewCandidates />} />
        <Route path="view-results" element={<VoterViewResults />} />
        </Route>
     

        <Route path="*" element={<div className="p-10 text-center">404 - Page Not Found</div>} />
      </Routes>
    </Router>
  );
}

export default App;