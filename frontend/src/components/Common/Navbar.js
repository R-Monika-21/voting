import React from 'react';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ role }) => {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <nav className="bg-blue-600 p-4 text-white flex justify-between">
      <div>Smart Online Voting System</div>
      <div>
        {role === 'admin' && (
          <>
            <button onClick={() => navigate('/admin-dashboard')} className="mr-4">Dashboard</button>
            {/* Add more admin links if needed */}
          </>
        )}
        {role === 'voter' && (
          <>
            <button onClick={() => navigate('/voter-dashboard')} className="mr-4">Dashboard</button>
            {/* Add more voter links if needed */}
          </>
        )}
        <button onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;