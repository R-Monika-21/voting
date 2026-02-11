// src/pages/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  UserCircle,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  PlusSquare,
  Users,
  ListChecks,
  Vote,
  Award,
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [admin, setAdmin] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const userType = localStorage.getItem('userType');

    if (storedUser && userType === 'admin') {
      setAdmin(JSON.parse(storedUser));
    } else {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('userType');
    setAdmin(null);
    navigate('/', { replace: true });
  };

  const isDashboardHome =
    location.pathname === '/admin-dashboard' ||
    location.pathname === '/admin-dashboard/';

  if (!admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-xl text-gray-600">Loading...</p>
      </div>
    );
  }

  const tileClass = ({ isActive }) =>
    `group flex flex-col items-center justify-center p-10 bg-white rounded-2xl shadow-md border border-gray-200
     hover:shadow-xl hover:border-indigo-300 hover:-translate-y-1 transition-all duration-300 cursor-pointer
     ${isActive ? 'border-indigo-500 bg-indigo-50/50 shadow-xl' : ''}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <LayoutDashboard className="h-8 w-8 text-indigo-600" />
              <span className="ml-3 text-xl font-semibold text-gray-800">
                Admin Panel
              </span>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-3 hover:bg-gray-100 px-4 py-2 rounded-lg transition"
              >
                <UserCircle className="h-9 w-9 text-indigo-600" />
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">{admin.name || 'Admin'}</p>
                  <p className="text-xs text-gray-500">{admin.email}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                  <div className="py-2">
                    <div className="px-5 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{admin.name || 'Admin'}</p>
                      <p className="text-xs text-gray-500 truncate">{admin.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-5 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-20 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          {isDashboardHome ? (
            <>
              <div className="mb-10 text-center">
                <h1 className="text-3xl font-bold text-gray-800">
                  Welcome, {admin.name || 'Admin'}
                </h1>
                <p className="text-gray-600 mt-2">
                  Manage elections, candidates, voters, and results
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                <NavLink to="create-election" className={tileClass}>
                  <PlusSquare className="h-14 w-14 text-indigo-600 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Create Election</h3>
                  <p className="text-sm text-gray-500 text-center">
                    Set up a new voting event
                  </p>
                </NavLink>

                <NavLink to="add-candidate" className={tileClass}>
                  <Users className="h-14 w-14 text-indigo-600 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Add Candidates</h3>
                  <p className="text-sm text-gray-500 text-center">
                    Register candidates for elections
                  </p>
                </NavLink>

                <NavLink to="view-elections" className={tileClass}>
                  <ListChecks className="h-14 w-14 text-indigo-600 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">View Elections</h3>
                  <p className="text-sm text-gray-500 text-center">
                    See all created elections
                  </p>
                </NavLink>

                <NavLink to="view-voters" className={tileClass}>
                  <Vote className="h-14 w-14 text-indigo-600 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">View Voters</h3>
                  <p className="text-sm text-gray-500 text-center">
                    Manage registered voters
                  </p>
                </NavLink>

                <NavLink to="result-management" className={tileClass}>
                  <Award className="h-14 w-14 text-indigo-600 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Results</h3>
                  <p className="text-sm text-gray-500 text-center">
                    View and manage election results
                  </p>
                </NavLink>
              </div>
            </>
          ) : (
            // When NOT on home → show only the child page content
            <div className="mt-8">
              <Outlet />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;