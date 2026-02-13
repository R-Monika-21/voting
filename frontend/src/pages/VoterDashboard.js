import React, { useEffect, useState, Fragment } from "react";
import axios from "axios";
import { Menu, Transition } from "@headlessui/react";
import {
  UserCircleIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { useNavigate, Outlet } from "react-router-dom";


const VoterDashboard = () => {
  const [voter, setVoter] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    student_name: "",
    email: "",
    roll_no: "",
    year: "",
    course: "",
    major: "",
  });

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    axios
      .get("http://localhost:5000/api/voter/profile", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setVoter(res.data);
        setFormData(res.data);
      })
      .catch(() => {
        localStorage.removeItem("token");
        navigate("/login");
      });
  }, [token, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdate = async () => {
    try {
      const res = await axios.put(
        "http://localhost:5000/api/voter/profile",
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const updatedVoter = res.data.voter || res.data;
      setVoter(updatedVoter);
      setFormData(updatedVoter);
      setEditMode(false);

      setSuccessMessage("Profile updated successfully ✅");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  if (!voter) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg font-semibold">Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Success Message */}
      {successMessage && (
        <div className="fixed top-5 right-5 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {successMessage}
        </div>
      )}

      {/* 🔷 Top Navbar */}
      <div className="bg-indigo-600 text-white px-6 py-4 flex justify-between items-center shadow-md">
        <h1 className="text-xl font-bold">Voter Dashboard</h1>

        <div className="flex items-center gap-8 font-medium">
          <button
            onClick={() => navigate("/voter-dashboard/view-elections")}
            className="hover:text-gray-200"
          >
            View Elections
          </button>

          <button
            onClick={() => navigate("/voter-dashboard/view-candidates")}
            className="hover:text-gray-200"
          >
            View Candidates
          </button>

          <button
            onClick={() => navigate("/voter-dashboard/view-results")}
            className="hover:text-gray-200"
          >
            Results
          </button>

          {/* Profile Dropdown */}
          <Menu as="div" className="relative inline-block text-left">
            <Menu.Button className="flex items-center gap-2 hover:text-gray-200">
              <UserCircleIcon className="h-8 w-8" />
              <ChevronDownIcon className="h-4 w-4" />
            </Menu.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 mt-2 w-64 bg-white text-black rounded-md shadow-lg p-4">
                <div className="border-b pb-2 mb-2">
                  <p className="font-semibold">{voter.student_name}</p>
                  <p className="text-sm text-gray-600">{voter.email}</p>
                </div>

                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => {
                        setShowProfile(true);
                        setEditMode(false);
                      }}
                      className={`${
                        active ? "bg-gray-100" : ""
                      } w-full text-left px-2 py-2 rounded`}
                    >
                      View Profile
                    </button>
                  )}
                </Menu.Item>

                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleLogout}
                      className={`${
                        active ? "bg-gray-100" : ""
                      } w-full text-left px-2 py-2 rounded text-red-600`}
                    >
                      Logout
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>

      {/* ✅ Big Welcome Section */}
      <div className="text-center mt-10">
        <h2 className="text-4xl font-extrabold text-indigo-700">
          Welcome, {voter.student_name} 👋
        </h2>
        <p className="text-gray-600 mt-3 text-lg">
          Your voice matters. Your vote shapes the future.
        </p>
      </div>

      {/* 🔷 Detailed Pledge Section */}
      <div className="flex justify-center mt-14 px-6">
        <div className="bg-white shadow-xl rounded-2xl p-12 max-w-5xl w-full border-t-4 border-indigo-600">
          <h2 className="text-3xl font-bold text-indigo-700 mb-10 text-center">
            Voter’s Declaration of Integrity
          </h2>

          
          <div className="space-y-6 text-gray-700 text-[17px] leading-relaxed">
            <p>
              ✔ I solemnly affirm that I shall exercise my right to vote with complete honesty,
              integrity, and responsibility. I understand that voting is not merely a right,
              but a significant civic duty that contributes directly to the strength and
              credibility of our democratic process.
            </p>

            <p>
              ✔ I pledge that I will cast my vote independently and without any form of
              coercion, manipulation, or external influence. My decision will be based
              solely on informed judgment, fairness, and the welfare of the institution
              and its members.
            </p>

            <p>
              ✔ I affirm that I will not accept, offer, or participate in any bribery,
              inducement, or unethical practice that may compromise the transparency
              and legitimacy of the election process.
            </p>

            <p>
              ✔ I commit to maintaining the secrecy of the ballot and respecting the
              confidentiality of every individual’s voting choice. I acknowledge
              that safeguarding electoral privacy is fundamental to ensuring fairness
              and equality in the democratic system.
            </p>

            <p>
              ✔ I pledge to refrain from impersonation, duplicate voting, digital
              manipulation, or any activity that may undermine the integrity of
              the online voting platform.
            </p>

            <p>
              ✔ I further promise to uphold the principles of accountability,
              transparency, and ethical conduct throughout the electoral process,
              and to report any irregularities or misconduct that I may observe.
            </p>

            <p className="font-semibold text-center text-indigo-700 mt-10">
              With full understanding of my civic responsibility, I make this pledge
              voluntarily and with sincere commitment to democratic values.
            </p>
          </div>
        </div>
      </div>
      <div className="mt-16 px-6">
  <Outlet />
</div>

      {/* 🔷 Profile Modal */}
      {showProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md mx-4">
            <h2 className="text-2xl font-bold mb-6 text-indigo-700 text-center">
              Voter Profile
            </h2>

            {editMode ? (
              <div className="space-y-4">
                {["student_name", "roll_no", "year", "course", "major"].map(
                  (field) => (
                    <input
                      key={field}
                      type="text"
                      name={field}
                      value={formData[field] || ""}
                      onChange={handleChange}
                      placeholder={field.replace("_", " ").toUpperCase()}
                      className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  )
                )}

                <div className="flex justify-end gap-4 mt-6">
                  <button
                    onClick={() => setEditMode(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdate}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p><strong>Name:</strong> {voter.student_name}</p>
                <p><strong>Email:</strong> {voter.email}</p>
                <p><strong>Roll No:</strong> {voter.roll_no}</p>
                <p><strong>Year:</strong> {voter.year}</p>
                <p><strong>Course:</strong> {voter.course}</p>
                <p><strong>Major:</strong> {voter.major}</p>

                <div className="flex justify-end gap-4 mt-6">
                  <button
                    onClick={() => setEditMode(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
                  >
                    Edit Profile
                  </button>
                  <button
                    onClick={() => setShowProfile(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VoterDashboard;
