import React from "react";
import { Link } from "react-router-dom";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-800 text-white">
      {/* Navbar */}
      <nav className="flex justify-between items-center px-8 py-4">
        <h1 className="text-2xl font-bold">
          Smart Online Voting
        </h1>

        <div className="space-x-4">
          <Link to="/login">
            <button className="px-4 py-2 border border-white rounded hover:bg-white hover:text-blue-700 transition">
              Login
            </button>
          </Link>

          <Link to="/register">
            <button className="px-4 py-2 bg-white text-blue-700 rounded hover:bg-gray-200 transition">
              Register
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center text-center mt-24 px-4">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-6">
          Secure & Transparent Online Voting
        </h2>

        <p className="text-lg md:text-xl max-w-2xl mb-8 text-gray-200">
          A modern online voting platform that ensures secure authentication,
          transparent elections, and easy participation for voters and admins.
        </p>

        <div className="space-x-4">
          <Link to="/register">
            <button className="px-6 py-3 bg-green-500 rounded text-lg font-semibold hover:bg-green-600 transition">
              Get Started
            </button>
          </Link>

          <Link to="/login">
            <button className="px-6 py-3 border border-white rounded text-lg hover:bg-white hover:text-blue-700 transition">
              Already a User?
            </button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-4 w-full text-center text-sm text-gray-300">
        © {new Date().getFullYear()} Smart Online Voting System. All rights reserved.
      </footer>
    </div>
  );
};

export default LandingPage;
