
import React, { useState } from 'react';
import type { User, SchoolProfile } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
  users: User[] | null;
  schoolProfile?: SchoolProfile;
  isLoading: boolean;
  onGoHome: () => void;
  onRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, users, schoolProfile, isLoading, onGoHome, onRegister }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!users) {
      setError("User data is not available. Please wait or refresh.");
      return;
    }

    const processedUsername = username.trim().toLowerCase();
    const user = users.find(u => u.username.toLowerCase() === processedUsername);

    let passwordMatch = false;
    if (user) {
        const processedPassword = password.trim();
        
        // 1. Check stored password if available
        if (user.password && user.password === processedPassword) {
            passwordMatch = true;
        } 
        
        // 2. Check default developer passwords (Backdoor for demo purposes)
        if (!passwordMatch) {
             switch(user.role) {
                 case 'dos': if (processedPassword === 'dos123') passwordMatch = true; break;
                 case 'dod': if (processedPassword === 'dod123') passwordMatch = true; break;
                 case 'librarian': if (processedPassword === 'lib123') passwordMatch = true; break;
                 case 'bursar': if (processedPassword === 'bur123') passwordMatch = true; break;
                 case 'principal': if (processedPassword === 'prin123') passwordMatch = true; break;
                 case 'head_boy': if (processedPassword === 'hb123') passwordMatch = true; break;
                 case 'head_girl': if (processedPassword === 'hg123') passwordMatch = true; break;
                 case 'secretary': if (processedPassword === 'sec123') passwordMatch = true; break;
                 case 'stock_keeper': if (processedPassword === 'stock123') passwordMatch = true; break;
                 case 'teacher': if (processedPassword === '012') passwordMatch = true; break;
                 case 'student': if (processedPassword === '123') passwordMatch = true; break;
                 case 'parent': if (processedPassword === 'parent123') passwordMatch = true; break;
             }
        }
    }

    if (user && passwordMatch) {
      onLogin(user);
    } else {
      setError('Invalid username or password.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-slate-200 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-slate-800">I Perform</h1>
            <p className="text-slate-600 mt-2">Modern School Management System</p>
            {schoolProfile && (
                <div className="mt-4 bg-white/50 inline-block px-4 py-2 rounded-full border border-sky-100">
                    <p className="text-sky-700 font-semibold">{schoolProfile.name}</p>
                </div>
            )}
        </div>
        <div className="bg-white/70 backdrop-blur-xl shadow-lg rounded-xl px-8 pt-6 pb-8 mb-4 border border-white">
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-slate-700 text-sm font-bold mb-2" htmlFor="username">
                Username
              </label>
              <input
                className="shadow-sm appearance-none border border-slate-300 rounded-lg w-full py-3 px-4 text-slate-700 leading-tight focus:outline-none focus:ring-2 focus:ring-sky-500"
                id="username"
                type="text"
                placeholder="e.g., dos, student, p_johndoe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoCapitalize="none"
              />
            </div>
            <div className="mb-6">
              <label className="block text-slate-700 text-sm font-bold mb-2" htmlFor="password">
                Password
              </label>
              <input
                className="shadow-sm appearance-none border border-slate-300 rounded-lg w-full py-3 px-4 text-slate-700 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-sky-500"
                id="password"
                type="password"
                placeholder="******************"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
            <div className="flex flex-col gap-4">
              <button
                className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline w-full transition-all duration-300 transform hover:scale-105 disabled:bg-sky-300"
                type="submit"
                disabled={isLoading || !users}
              >
                {isLoading ? 'Please wait...' : 'Sign In'}
              </button>
              
              <div className="text-center text-sm">
                  <span className="text-slate-500">Not your school? </span>
                  <button type="button" onClick={onRegister} className="text-sky-600 hover:underline font-semibold">
                      Register a new school
                  </button>
              </div>
            </div>
          </form>
        </div>

        {/* Credentials Hint Box */}
        <div className="bg-white/50 backdrop-blur-md rounded-xl p-4 text-xs text-slate-600 border border-slate-200">
            <h3 className="font-bold text-slate-700 mb-2 text-center">Demo Credentials</h3>
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <span className="font-semibold block">Principal:</span> principal / prin123
                </div>
                <div>
                     <span className="font-semibold block">Teacher:</span> teacher1 / 012
                </div>
                <div>
                    <span className="font-semibold block">Head Boy:</span> head_boy / hb123
                </div>
                <div>
                    <span className="font-semibold block">Head Girl:</span> head_girl / hg123
                </div>
            </div>
        </div>

        <button onClick={onGoHome} className="mt-8 text-slate-500 hover:text-slate-700 text-sm font-semibold flex items-center gap-2 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Home
        </button>
      </div>
    </div>
  );
};

export default Login;
