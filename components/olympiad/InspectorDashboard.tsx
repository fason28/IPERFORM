
import React, { useState } from 'react';

// Helper for dynamic class names
const cn = (...classes: (string | boolean)[]) => classes.filter(Boolean).join(' ');

// Mock Data
const assignedCenter = {
    name: 'City High School',
    address: '123 Learning Lane, Knowledge City',
    totalParticipants: 42,
};

const participants = [
    { id: 'P001', name: 'Emily Carter', status: 'Present' },
    { id: 'P002', name: 'Benjamin Lee', status: 'Absent' },
    { id: 'P003', name: 'Sophia Rodriguez', status: 'Present' },
    { id: 'P004', name: 'William Green', status: 'Not Marked' },
    { id: 'P005', name: 'Olivia Martinez', status: 'Not Marked' },
];

const submissions = [
    { id: 'P001', name: 'Emily Carter', file: 'P001_answers.pdf', timestamp: '11:32 AM' },
    { id: 'P003', name: 'Sophia Rodriguez', file: 'P003_answers.pdf', timestamp: '11:34 AM' },
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

const InspectorDashboard = ({ onLogout }: { onLogout: () => void }) => {
    const [activeView, setActiveView] = useState('dashboard');
    const [attendance, setAttendance] = useState(() => {
        const initial: { [key: string]: boolean } = {};
        participants.forEach(p => {
            if (p.status === 'Present') initial[p.id] = true;
            if (p.status === 'Absent') initial[p.id] = false;
        });
        return initial;
    });

    const handleAttendanceChange = (id: string, isPresent: boolean) => {
        setAttendance(prev => ({ ...prev, [id]: isPresent }));
    };

    const renderView = () => {
        switch(activeView) {
            case 'dashboard': return (
                 <div>
                    <h2 className="text-3xl font-bold mb-6">Inspector Dashboard</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                            <h3 className="font-semibold text-lg mb-2 text-slate-500 dark:text-slate-400">Assigned Center</h3>
                            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{assignedCenter.name}</p>
                            <p>{assignedCenter.address}</p>
                        </div>
                         <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                            <h3 className="font-semibold text-lg mb-2 text-slate-500 dark:text-slate-400">Participants</h3>
                            <p className="text-4xl font-bold">{Object.values(attendance).filter(v => v === true).length} / {participants.length}</p>
                            <p>Present Today</p>
                        </div>
                    </div>
                </div>
            );
            case 'attendance': return (
                <div>
                    <h2 className="text-3xl font-bold mb-6">Participant Attendance</h2>
                     <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-slate-900/50 text-sm text-slate-600 dark:text-slate-300">
                                <tr><th className="p-4">ID</th><th className="p-4">Name</th><th className="p-4">Status</th></tr>
                            </thead>
                            <tbody>
                                {participants.map(p => (
                                    <tr key={p.id} className="border-t border-slate-200 dark:border-slate-700">
                                        <td className="p-4 font-mono">{p.id}</td>
                                        <td className="p-4 font-semibold">{p.name}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-4">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input type="radio" name={`att-${p.id}`} checked={attendance[p.id] === true} onChange={() => handleAttendanceChange(p.id, true)} className="form-radio text-green-500" />
                                                    Present
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input type="radio" name={`att-${p.id}`} checked={attendance[p.id] === false} onChange={() => handleAttendanceChange(p.id, false)} className="form-radio text-red-500" />
                                                    Absent
                                                </label>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
            case 'submissions': return (
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-3xl font-bold">Answer Sheet Submissions</h2>
                        <label className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-lg cursor-pointer flex items-center gap-2">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                            <span>Upload Sheet</span>
                            <input type="file" className="hidden" />
                        </label>
                    </div>
                     <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-slate-900/50 text-sm text-slate-600 dark:text-slate-300">
                                <tr><th className="p-4">Participant ID</th><th className="p-4">Name</th><th className="p-4">File</th><th className="p-4">Timestamp</th></tr>
                            </thead>
                            <tbody>
                                {submissions.map(s => (
                                    <tr key={s.id} className="border-t border-slate-200 dark:border-slate-700">
                                        <td className="p-4 font-mono">{s.id}</td>
                                        <td className="p-4 font-semibold">{s.name}</td>
                                        <td className="p-4 text-sky-600 dark:text-sky-400">{s.file}</td>
                                        <td className="p-4">{s.timestamp}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                     </div>
                </div>
            );
            case 'report-issue': return (
                 <div>
                    <h2 className="text-3xl font-bold mb-6">Report an Issue</h2>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                        <form className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold mb-2">Issue Type</label>
                                <select className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700">
                                    <option>Participant Misconduct</option>
                                    <option>Technical Problem</option>
                                    <option>Missing Materials</option>
                                    <option>Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2">Description</label>
                                <textarea rows={5} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700" placeholder="Describe the issue in detail..."></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2">Attach Photo (optional)</label>
                                <input type="file" className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"/>
                            </div>
                            <div className="text-right">
                                <button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-6 rounded-lg">Submit Report</button>
                            </div>
                        </form>
                    </div>
                </div>
            );
            default: return null;
        }
    };

    return (
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-xl shadow-lg border border-white/50 dark:border-slate-700/50 text-slate-800 dark:text-slate-100">
            <div className="flex flex-col md:flex-row min-h-[600px]">
                {/* Sidebar */}
                 <aside className="w-full md:w-64 bg-slate-50/50 dark:bg-slate-900/50 p-4 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700 flex flex-row md:flex-col justify-center md:justify-start">
                     <div className="p-4 text-center border-b border-slate-200 dark:border-slate-700 mb-4 hidden md:block">
                        <h3 className="font-semibold">Inspector Portal</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{assignedCenter.name}</p>
                    </div>
                    <nav className="flex-1 space-y-1 flex flex-row md:flex-col items-center md:items-stretch justify-around md:justify-start">
                        <NavLink view="dashboard" activeView={activeView} setActiveView={setActiveView} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>}>Dashboard</NavLink>
                        <NavLink view="attendance" activeView={activeView} setActiveView={setActiveView} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}>Attendance</NavLink>
                        <NavLink view="submissions" activeView={activeView} setActiveView={setActiveView} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>}>Submissions</NavLink>
                        <NavLink view="report-issue" activeView={activeView} setActiveView={setActiveView} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}>Report Issue</NavLink>
                    </nav>
                </aside>
                {/* Main Content */}
                <main className="flex-1 p-6 md:p-10 overflow-y-auto">
                    {renderView()}
                </main>
            </div>
        </div>
    );
};

export default InspectorDashboard;