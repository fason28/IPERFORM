
import React, { useState, useEffect } from 'react';

// Helper for dynamic class names
const cn = (...classes: (string | boolean)[]) => classes.filter(Boolean).join(' ');

// Mock Data
const userProfile = {
  name: 'Alex Johnson',
  school: 'Northwood High',
  category: 'Senior',
  subjects: ['Mathematics', 'Physics'],
  photoUrl: `https://api.dicebear.com/8.x/avataaars/svg?seed=alexjohnson`
};

const exams = [
  { id: 1, title: 'Mathematics Olympiad', date: '2024-07-30', time: '10:00 AM', status: 'Upcoming' },
  { id: 2, title: 'Physics Challenge', date: '2024-08-05', time: '02:00 PM', status: 'Upcoming' },
  { id: 3, title: 'Chemistry Prelims', date: '2024-07-15', time: '10:00 AM', status: 'Completed' },
];

const results = [
    { id: 3, title: 'Chemistry Prelims', score: 88, rank: 12, totalParticipants: 150 },
];

const mockTestQuestions = [
    { question: "What is the value of Pi to two decimal places?", options: ["3.12", "3.14", "3.16", "3.18"], answer: "3.14"},
    { question: "What is the square root of 144?", options: ["10", "11", "12", "13"], answer: "12"},
    { question: "Solve for x: 2x + 5 = 15", options: ["3", "4", "5", "6"], answer: "5"},
];

type NavLinkProps = {
  view: string;
  activeView: string;
  setActiveView: (v: string) => void;
  children?: React.ReactNode;
  icon: React.ReactElement;
};

const NavLink: React.FC<NavLinkProps> = ({ view, activeView, setActiveView, children, icon }) => (
  <a href="#" onClick={(e) => { e.preventDefault(); setActiveView(view); }} className={cn("flex items-center gap-3 py-2.5 px-4 rounded-lg transition duration-200", activeView === view ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 font-semibold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700')}>
    {icon}
    <span className="hidden md:inline">{children}</span>
  </a>
);

const TestModal = ({ onClose }: { onClose: () => void }) => {
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds

    useEffect(() => {
        if (timeLeft === 0) return;
        const timer = setInterval(() => setTimeLeft(timeLeft - 1), 1000);
        return () => clearInterval(timer);
    }, [timeLeft]);

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-8 w-full max-w-2xl text-slate-800 dark:text-slate-100">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold">Mathematics Olympiad</h3>
                    <div className="text-xl font-mono bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300 px-3 py-1 rounded-md">{formatTime(timeLeft)}</div>
                </div>
                <div className="space-y-6">
                    {mockTestQuestions.map((q, index) => (
                        <div key={index}>
                            <p className="font-semibold mb-2">{index + 1}. {q.question}</p>
                            <div className="grid grid-cols-2 gap-2">
                                {q.options.map(opt => (
                                    <label key={opt} className="flex items-center gap-2 p-3 rounded-md bg-slate-100 dark:bg-slate-700 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/50">
                                        <input type="radio" name={`question-${index}`} className="form-radio text-amber-500" />
                                        <span>{opt}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                 <div className="flex justify-end gap-4 mt-8">
                    <button onClick={onClose} className="bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 font-bold py-2 px-6 rounded-lg">Quit</button>
                    <button onClick={onClose} className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-6 rounded-lg">Submit Answers</button>
                </div>
            </div>
        </div>
    );
};

const ParticipantDashboard = ({ onLogout }: { onLogout: () => void }) => {
    const [activeView, setActiveView] = useState('dashboard');
    const [isTestModalOpen, setIsTestModalOpen] = useState(false);

    const renderView = () => {
        switch(activeView) {
            case 'dashboard': return (
                <div>
                    <h2 className="text-3xl font-bold mb-6">Dashboard</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                            <h3 className="font-semibold text-lg mb-2">Upcoming Exam</h3>
                            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{exams[0].title}</p>
                            <p className="text-slate-500 dark:text-slate-400">{exams[0].date} at {exams[0].time}</p>
                        </div>
                         <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                            <h3 className="font-semibold text-lg mb-2">Last Result</h3>
                            <p className="text-2xl font-bold text-sky-600 dark:text-sky-400">{results[0].score}/100 in {results[0].title}</p>
                            <p className="text-slate-500 dark:text-slate-400">Rank: {results[0].rank}</p>
                        </div>
                    </div>
                </div>
            );
            case 'my-exams': return (
                 <div>
                    <h2 className="text-3xl font-bold mb-6">My Exams</h2>
                     <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-slate-900/50 text-sm text-slate-600 dark:text-slate-300">
                                <tr><th className="p-4">Title</th><th className="p-4">Date & Time</th><th className="p-4">Status</th><th className="p-4"></th></tr>
                            </thead>
                            <tbody>
                                {exams.map(exam => (
                                    <tr key={exam.id} className="border-t border-slate-200 dark:border-slate-700">
                                        <td className="p-4 font-semibold">{exam.title}</td>
                                        <td className="p-4">{exam.date} at {exam.time}</td>
                                        <td className="p-4"><span className={cn("px-2 py-1 text-xs font-medium rounded-full", exam.status === 'Upcoming' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' : 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300')}>{exam.status}</span></td>
                                        <td className="p-4 text-right">
                                            {exam.status === 'Upcoming' && <button onClick={() => setIsTestModalOpen(true)} className="bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold py-2 px-4 rounded-lg">Take Test</button>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
            case 'results': return (
                <div>
                    <h2 className="text-3xl font-bold mb-6">Results & Certificates</h2>
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <table className="w-full text-left">
                             <thead className="bg-slate-50 dark:bg-slate-900/50 text-sm text-slate-600 dark:text-slate-300">
                                <tr><th className="p-4">Exam Title</th><th className="p-4">Score</th><th className="p-4">Rank</th><th className="p-4"></th></tr>
                            </thead>
                             <tbody>
                                {results.map(res => (
                                    <tr key={res.id} className="border-t border-slate-200 dark:border-slate-700">
                                        <td className="p-4 font-semibold">{res.title}</td>
                                        <td className="p-4">{res.score}/100</td>
                                        <td className="p-4 font-bold">{res.rank} <span className="text-sm font-normal text-slate-500">/ {res.totalParticipants}</span></td>
                                        <td className="p-4 text-right"><button className="bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold py-2 px-4 rounded-lg">Download Certificate</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
             case 'profile': return (
                <div>
                    <h2 className="text-3xl font-bold mb-6">My Profile</h2>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-center gap-6">
                       <img src={userProfile.photoUrl} alt="User Profile" className="w-32 h-32 rounded-full border-4 border-amber-300" />
                       <div className="text-center md:text-left">
                           <h3 className="text-2xl font-bold">{userProfile.name}</h3>
                           <p className="text-slate-500 dark:text-slate-400">{userProfile.school} - {userProfile.category} Category</p>
                           <div className="mt-4 flex gap-2 justify-center md:justify-start">
                               {userProfile.subjects.map(sub => <span key={sub} className="bg-slate-200 dark:bg-slate-700 text-sm font-medium px-3 py-1 rounded-full">{sub}</span>)}
                           </div>
                       </div>
                       <button className="bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 font-bold py-2 px-4 rounded-lg ml-auto mt-4 md:mt-0">Edit Profile</button>
                    </div>
                </div>
            );
            default: return null;
        }
    };

    return (
        <>
            {isTestModalOpen && <TestModal onClose={() => setIsTestModalOpen(false)} />}
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-xl shadow-lg border border-white/50 dark:border-slate-700/50 text-slate-800 dark:text-slate-100">
                <div className="flex flex-col md:flex-row min-h-[600px]">
                    {/* Sidebar */}
                    <aside className="w-full md:w-64 bg-slate-50/50 dark:bg-slate-900/50 p-4 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700 flex flex-row md:flex-col justify-center md:justify-start">
                         <div className="p-4 text-center border-b border-slate-200 dark:border-slate-700 mb-4 hidden md:block">
                            <img src={userProfile.photoUrl} alt="User Profile" className="w-16 h-16 rounded-full mx-auto mb-2" />
                            <h3 className="font-semibold">{userProfile.name}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Participant</p>
                        </div>
                        <nav className="flex-1 space-y-1 flex flex-row md:flex-col items-center md:items-stretch justify-around md:justify-start">
                            <NavLink view="dashboard" activeView={activeView} setActiveView={setActiveView} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>}>Dashboard</NavLink>
                            <NavLink view="my-exams" activeView={activeView} setActiveView={setActiveView} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>}>My Exams</NavLink>
                            <NavLink view="results" activeView={activeView} setActiveView={setActiveView} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}>Results</NavLink>
                            <NavLink view="profile" activeView={activeView} setActiveView={setActiveView} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}>Profile</NavLink>
                        </nav>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 p-6 md:p-10 overflow-y-auto">
                        {renderView()}
                    </main>
                </div>
            </div>
        </>
    );
};

export default ParticipantDashboard;