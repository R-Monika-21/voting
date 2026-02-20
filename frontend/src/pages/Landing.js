import React from "react";
import { Link } from "react-router-dom";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col">
      
      {/* Navbar */}
      <nav className="flex justify-between items-center px-10 py-5 bg-white shadow-md">
        <h1 className="text-2xl font-bold text-blue-700">
          Smart Online Voting
        </h1>

        <div className="space-x-4">
          <Link to="/login">
            <button className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition duration-300">
              Login
            </button>
          </Link>

          <Link to="/register">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300">
              Register
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center text-center flex-grow px-6 py-16">
        <h2 className="text-4xl md:text-5xl font-extrabold text-blue-700 mb-6">
          Secure & Transparent Online Voting
        </h2>

        <p className="text-lg md:text-xl max-w-3xl text-gray-600 mb-8">
          A modern digital voting platform designed to ensure secure authentication,
          fair elections, transparent results, and easy participation for both
          voters and administrators.
        </p>

        <div className="space-x-4 mb-12">
          <Link to="/register">
            <button className="px-6 py-3 bg-green-500 text-white rounded-lg text-lg font-semibold hover:bg-green-600 transition duration-300 shadow-md">
              Get Started
            </button>
          </Link>

          <Link to="/login">
            <button className="px-6 py-3 border border-blue-600 text-blue-600 rounded-lg text-lg hover:bg-blue-600 hover:text-white transition duration-300">
              Already a User?
            </button>
          </Link>
        </div>

        {/* Election Pledge Section */}
        <div className="bg-white shadow-lg rounded-2xl p-3 max-w-4xl border border-gray-200">
          <h3 className="text-2xl font-bold text-blue-600 mb-4">
            🗳️ Election Integrity Pledge
          </h3>
          <p className="text-gray-600 leading-relaxed">
            We are committed to conducting elections with honesty, transparency,
            and integrity. Every vote matters and every vote is protected.
            Our system ensures secure authentication, encrypted voting,
            and unbiased result calculation to uphold democratic values.
          </p>
          <p className="mt-4 font-semibold text-gray-700">
            "One Person. One Vote. Secure. Transparent. Fair."
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white shadow-inner py-4 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Smart Online Voting System. 
        <span className="ml-1 text-blue-600 font-medium">
          Ensuring Honest & Transparent Elections.
        </span>
      </footer>
    </div>
  );
};

export default LandingPage;