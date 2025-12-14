
import React from 'react';

interface HomepageProps {
  onNavigate: (destination: 'iperform' | 'olympiad' | 'register') => void;
}

const Homepage: React.FC<HomepageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-200 text-slate-800 flex flex-col">
      {/* Header */}
      <header className="bg-white/30 backdrop-blur-lg shadow-sm p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="text-2xl font-bold text-sky-700">
            <i className="fas fa-graduation-cap mr-2"></i>
            I Perform
          </div>
          <button 
            onClick={() => onNavigate('register')}
            className="bg-white text-sky-600 font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-sky-50 transition-colors border border-sky-100"
          >
            Register Your School
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col justify-center items-center p-4">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 tracking-tight">
            The Complete Educational Ecosystem
          </h1>
          <p className="text-slate-600 mt-4 text-lg max-w-2xl mx-auto">
            A modern, secure, and efficient platform for students, teachers, and administrators. Choose your portal to get started.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          {/* I Perform Card */}
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-lg border border-white p-8 flex flex-col items-center text-center transform hover:-translate-y-2 transition-transform duration-300 group">
            <div className="bg-sky-500 text-white rounded-full p-5 mb-5 transition-transform duration-300 group-hover:scale-110">
              <i className="fas fa-school fa-2x"></i>
            </div>
            <h2 className="text-3xl font-bold text-slate-800 mb-3">School Management</h2>
            <p className="text-slate-600 mb-8 flex-grow">
              Access dashboards for Directors, Teachers, and Students. Manage classes, marks, and announcements seamlessly.
            </p>
            <button
              onClick={() => onNavigate('iperform')}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline transition-all duration-300 transform hover:scale-105"
            >
              Enter I Perform
            </button>
          </div>

          {/* Olympiad Card */}
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-lg border border-white p-8 flex flex-col items-center text-center transform hover:-translate-y-2 transition-transform duration-300 group">
            <div className="bg-amber-500 text-white rounded-full p-5 mb-5 transition-transform duration-300 group-hover:scale-110">
              <i className="fas fa-trophy fa-2x"></i>
            </div>
            <h2 className="text-3xl font-bold text-slate-800 mb-3">Olympiad Portal</h2>
            <p className="text-slate-600 mb-8 flex-grow">
              Participate in academic competitions, test your knowledge, and climb the leaderboards against fellow students.
            </p>
            <button
              onClick={() => onNavigate('olympiad')}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline transition-all duration-300 transform hover:scale-105"
            >
              Go to Olympiad
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/30 backdrop-blur-lg mt-12 p-4 text-center text-slate-600">
        <p>© {new Date().getFullYear()} I Perform. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Homepage;
