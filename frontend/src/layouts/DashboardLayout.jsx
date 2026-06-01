import React, { useContext } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { LayoutDashboard, Users, UserPlus, LogOut, FileText } from 'lucide-react';

const DashboardLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-indigo-800 text-white flex flex-col">
        <div className="p-4 font-bold text-xl border-b border-indigo-700">
          IMS Portal
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link to="/" className="flex items-center space-x-2 p-2 hover:bg-indigo-700 rounded">
            <LayoutDashboard size={20} /> <span>Dashboard</span>
          </Link>
          <Link to="/add-intern" className="flex items-center space-x-2 p-2 hover:bg-indigo-700 rounded">
            <UserPlus size={20} /> <span>Add Intern</span>
          </Link>
          <Link to="/internships" className="flex items-center space-x-2 p-2 hover:bg-indigo-700 rounded">
            <Users size={20} /> <span>Internships</span>
          </Link>
        </nav>
        <div className="p-4 border-t border-indigo-700">
          <button onClick={handleLogout} className="flex items-center space-x-2 w-full p-2 hover:bg-indigo-700 rounded text-left">
            <LogOut size={20} /> <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow p-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-800">Welcome, {user?.faculty_name}</h1>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
