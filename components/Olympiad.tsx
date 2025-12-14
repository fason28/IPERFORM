
import React, { useState, useEffect, Suspense } from 'react';
import Spinner from './Spinner';

type Role = 'participant' | 'inspector' | 'coordinator';

// Lazy load dashboards for better initial load performance
const ParticipantDashboard = React.lazy(() => import('./olympiad/ParticipantDashboard'));
const InspectorDashboard = React.lazy(() => import('./olympiad/InspectorDashboard'));
const CoordinatorDashboard = React.lazy(() => import('./olympiad/CoordinatorDashboard'));

const RoleCard = ({ role, description, icon, onClick }: { role: string; description: string; icon: React.ReactElement, onClick: () => void }) => {
    return (
        <button onClick={onClick} className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-xl shadow-lg border border-white/50 dark:border-slate-700/50 p-8 flex flex-col items-center text-center transform transition-all duration-300 hover:scale-105 hover:shadow-2xl group w-full">
            <div className="bg-amber-500 text-white rounded-full p-4 mb-4 group-hover:scale-110 transition-transform duration-300">{icon}</div>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2 capitalize">{role}</h3>
            <p className="text-slate-600 dark:text-slate-400">{description}</p>
        </button>
    );
}

const LoginModal = ({ role, defaultPass, onClose, onLogin }: { role: string, defaultPass: string, onClose: () => void, onLogin: () => void }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (username && password === defaultPass) {
            onLogin();
        } else {
            setError('Invalid credentials. Use the hint.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-8 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white capitalize">Login as {role}</h3>
                    <p className="text-slate-500 dark:text-slate-400">Please enter your credentials</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Username</label>
                        <input 
                            type="text" 
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
                        <input 
                            type="password" 
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Hint: {defaultPass}</p>
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-lg transition-colors">
                        Login
                    </button>
                </form>
                <button onClick={onClose} className="mt-4 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 w-full text-center">Cancel</button>
            </div>
        </div>
    );
};

const Olympiad: React.FC<{ onNavigate: (destination: 'homepage') => void }> = ({ onNavigate }) => {
    const [role, setRole] = useState<Role | null>(null);
    const [loginRole, setLoginRole] = useState<Role | null>(null);
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        const root = window.document.documentElement;
        if (isDarkMode) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [isDarkMode]);

    const handleLogout = () => {
        setRole(null);
    };

    const getRolePass = (r: Role) => {
        switch(r) {
            case 'participant': return 'participant123';
            case 'inspector': return 'inspector123';
            case 'coordinator': return 'coordinator123';
            default: return '';
        }
    };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-slate-900 dark:to-slate-800 flex flex-col items-center p-4 sm:p-8 transition-colors duration-300">
        {loginRole && (
            <LoginModal 
                role={loginRole} 
                defaultPass={getRolePass(loginRole)} 
                onClose={() => setLoginRole(null)}
                onLogin={() => { setRole(loginRole); setLoginRole(null); }}
            />
        )}
        
        <div className="w-full max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                 <div className="flex items-center gap-3">
                     <div className="bg-amber-500 text-white rounded-full p-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-12v4m-2-2h4m5 4v4m-2-2h4M17 3l-1.17.585A2 2 0 0015 5.414V7a2 2 0 002 2h0a2 2 0 002-2V5.414a2 2 0 00-.83-1.586L17 3zM7 3l-1.17.585A2 2 0 005 5.414V7a2 2 0 002 2h0a2 2 0 002-2V5.414a2 2 0 00-.83-1.586L7 3zm10 10l-1.17.585a2 2 0 00-.83 1.586V19a2 2 0 002 2h0a2 2 0 002-2v-1.586a2 2 0 00-.83-1.586L17 13zm-10 0l-1.17.585a2 2 0 00-.83 1.586V19a2 2 0 002 2h0a2 2 0 002-2v-1.586a2 2 0 00-.83-1.586L7 13z" /></svg>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">Olympiad Portal</h1>
                </div>
                <div className="flex items-center gap-4">
                    <label htmlFor="dark-mode-toggle" className="flex items-center cursor-pointer">
                        <div className="relative">
                            <input type="checkbox" id="dark-mode-toggle" className="sr-only" checked={isDarkMode} onChange={() => setIsDarkMode(!isDarkMode)} />
                            <div className="block bg-slate-300 dark:bg-slate-700 w-14 h-8 rounded-full"></div>
                            <div className="dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition transform dark:translate-x-full"></div>
                        </div>
                    </label>
                    <button onClick={() => onNavigate('homepage')} className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-all text-sm hidden sm:block">
                        Back to Home
                    </button>
                    {role && (
                         <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-all text-sm">
                            Logout
                        </button>
                    )}
                </div>
            </div>
            
            <main>
               {!role ? (
                    <div className="w-full max-w-5xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-4xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Welcome Back</h2>
                            <p className="text-slate-600 dark:text-slate-400 mt-2 text-lg">Select your role to proceed.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <RoleCard 
                                role="participant" 
                                description="Take tests, view results, and manage your profile."
                                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
                                onClick={() => setLoginRole('participant')}
                            />
                            <RoleCard 
                                role="inspector" 
                                description="Monitor exams, mark attendance, and report issues."
                                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
                                onClick={() => setLoginRole('inspector')}
                            />
                            <RoleCard 
                                role="coordinator" 
                                description="Create events, manage centers, and view analytics."
                                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                                onClick={() => setLoginRole('coordinator')}
                            />
                        </div>
                    </div>
                ) : (
                    <Suspense fallback={
                        <div className="flex justify-center items-center min-h-[500px]">
                            <Spinner size="lg"/>
                        </div>
                    }>
                        {role === 'participant' && <ParticipantDashboard onLogout={handleLogout} />}
                        {role === 'inspector' && <InspectorDashboard onLogout={handleLogout} />}
                        {role === 'coordinator' && <CoordinatorDashboard onLogout={handleLogout} />}
                    </Suspense>
                )}
            </main>
        </div>
    </div>
  );
};

export default Olympiad;
