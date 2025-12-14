import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { SchoolData, User } from '../../types';
import Spinner from '../Spinner';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, BarController } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, BarController);

// Helper for dynamic class names
const cn = (...classes: (string | boolean)[]) => classes.filter(Boolean).join(' ');

interface PrincipalDashboardProps {
  user: User;
  data: SchoolData;
  onUpdate: (action: string) => Promise<any>;
  onLogout: () => void;
  onGoHome: () => void;
  isUpdating: boolean;
  updateError: string | null;
}

// A generic Modal component
const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-slate-800">{title}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div>{children}</div>
            </div>
        </div>
    );
};

type NavLinkProps = {
  view: string;
  activeView: string;
  setActiveView: (v: string) => void;
  children?: React.ReactNode;
};
const NavLink: React.FC<NavLinkProps> = ({ view, activeView, setActiveView, children }) => (
  <a href="#" onClick={(e) => { e.preventDefault(); setActiveView(view); }} className={cn("flex items-center gap-3 py-2.5 px-4 rounded-lg transition duration-200", activeView === view ? 'bg-sky-100 text-sky-700 font-semibold' : 'text-slate-600 hover:bg-slate-100')}>
    {children}
  </a>
);

type StatCardProps = {
  title: string;
  value: string | number;
  icon: React.ReactNode;
};
const StatCard: React.FC<StatCardProps> = ({ title, value, icon }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
    <div className="bg-sky-100 text-sky-600 p-3 rounded-full">
        {icon}
    </div>
    <div>
        <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
        <p className="text-3xl font-bold text-slate-800">{value}</p>
    </div>
    </div>
);

const PrincipalDashboard: React.FC<PrincipalDashboardProps> = ({ user, data, onUpdate, onLogout, onGoHome, isUpdating, updateError }) => {
    const [activeView, setActiveView] = useState('dashboard');
    const [studentToAssign, setStudentToAssign] = useState('');
    const [roleToAssign, setRoleToAssign] = useState<'head_boy' | 'head_girl'>('head_boy');
    const chartRef = useRef<HTMLCanvasElement>(null);

    // Communication State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [commType, setCommType] = useState<'all' | 'class' | 'single'>('all');
    const [commTarget, setCommTarget] = useState(''); 
    const [commMessage, setCommMessage] = useState('');

    const principalStats = useMemo(() => {
        if (!data) return { totalStudents: 0, averageMark: 'N/A', totalCollected: 0, activeDiscipline: 0 };
        const totalStudents = data.students?.length || 0;
        const totalMarks = (data.marks || []).reduce((sum, mark) => sum + mark.mark, 0);
        const averageMark = (data.marks || []).length > 0 ? (totalMarks / data.marks.length).toFixed(2) + '%' : 'N/A';
        const totalCollected = (data.feeAccounts || []).reduce((sum, acc) => sum + acc.amountPaid, 0);
        const activeDiscipline = (data.conductEvents || []).filter(e => e.status === 'sent_out').length;
        return { totalStudents, averageMark, totalCollected, activeDiscipline };
    }, [data]);
    
    const handleAssignRole = async () => {
        if (!studentToAssign) {
            alert("Please enter a student username to assign the role.");
            return;
        }
        const action = `Assign the role of '${roleToAssign}' to the user with username '${studentToAssign}'. Update their user record.`;
        await onUpdate(action);
        setStudentToAssign('');
    };
    
    // Robust Chart Effect
    useEffect(() => {
        if (activeView !== 'academics') return;
        
        let chartInstance: ChartJS | null = null;

        const initChart = () => {
            if (chartRef.current && (data?.marks || []).length > 0) {
                 const ctx = chartRef.current.getContext('2d');
                 if (ctx) {
                    const existingChart = ChartJS.getChart(chartRef.current);
                    if (existingChart) existingChart.destroy();

                    const subjects = [...new Set((data.marks || []).map(m => m.subject))];
                    const subjectAverages = subjects.map(subject => {
                        const subjectMarks = (data.marks || []).filter(m => m.subject === subject);
                        const total = subjectMarks.reduce((sum, m) => sum + m.mark, 0);
                        return subjectMarks.length ? total / subjectMarks.length : 0;
                    });

                    chartInstance = new ChartJS(ctx, {
                        type: 'bar',
                        data: {
                            labels: subjects,
                            datasets: [{
                                label: 'Average Score by Subject',
                                data: subjectAverages,
                                backgroundColor: '#0ea5e9',
                                borderRadius: 4,
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false }},
                            scales: { y: { beginAtZero: true, max: 100, grid: { color: '#e2e8f0' } }, x: { grid: { display: false } } }
                        }
                    });
                 }
            }
        };

        const timer = setTimeout(initChart, 50);
        return () => {
            clearTimeout(timer);
            if (chartInstance) chartInstance.destroy();
        };
    }, [activeView, data.marks]); 

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        let action = '';
        if (commType === 'all') {
            action = `Send a message to ALL parents from Principal. Content: "${commMessage}"`;
        } else if (commType === 'class') {
            action = `Send a message to parents of Class '${commTarget}' from Principal. Content: "${commMessage}"`;
        } else {
            const student = (data.students || []).find(s => s.studentId === commTarget);
            if (student) {
                action = `Send a message to parent of student '${student.name}' (Parent ID: ${student.parentId}) from Principal. Content: "${commMessage}"`;
            }
        }
        if (action) await onUpdate(action);
        setIsModalOpen(false);
        setCommMessage('');
        setCommTarget('');
        setCommType('all');
    };

    const renderModalContent = () => (
        <form onSubmit={handleSendMessage} className="space-y-4">
            <div>
                <label className="block text-slate-700 text-sm font-bold mb-2">To</label>
                <select value={commType} onChange={e => setCommType(e.target.value as any)} className="shadow-sm border border-slate-300 rounded-lg w-full py-2 px-3">
                    <option value="all">All Parents</option>
                    <option value="class">Parents of Specific Class</option>
                    <option value="single">Single Parent (via Student)</option>
                </select>
            </div>
            {commType === 'class' && (
                    <div>
                    <label className="block text-slate-700 text-sm font-bold mb-2">Select Class</label>
                    <select value={commTarget} onChange={e => setCommTarget(e.target.value)} className="shadow-sm border border-slate-300 rounded-lg w-full py-2 px-3">
                        <option value="">Select...</option>
                        {(data.classes || []).map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                </div>
            )}
            {commType === 'single' && (
                <div>
                    <label className="block text-slate-700 text-sm font-bold mb-2">Select Student</label>
                    <select value={commTarget} onChange={e => setCommTarget(e.target.value)} className="shadow-sm border border-slate-300 rounded-lg w-full py-2 px-3">
                        <option value="">Select...</option>
                        {(data.students || []).map(s => <option key={s.id} value={s.studentId}>{s.name} ({s.class})</option>)}
                    </select>
                </div>
            )}
            <div>
                <label className="block text-slate-700 text-sm font-bold mb-2">Message</label>
                <textarea value={commMessage} onChange={e => setCommMessage(e.target.value)} rows={4} className="shadow-sm border border-slate-300 rounded-lg w-full py-2 px-3" required />
            </div>
            <button type="submit" disabled={isUpdating} className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-4 rounded-lg mt-2 disabled:bg-sky-300">{isUpdating ? 'Sending...' : 'Send Message'}</button>
        </form>
    );

    const renderView = () => {
        switch (activeView) {
            case 'dashboard':
                return (
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800 mb-6">Principal's Dashboard</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <StatCard title="Total Students" value={principalStats.totalStudents} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} />
                            <StatCard title="School Average" value={principalStats.averageMark} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>} />
                            <StatCard title="Total Fees Collected" value={`Ksh ${principalStats.totalCollected.toLocaleString()}`} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>} />
                            <StatCard title="Active Discipline" value={principalStats.activeDiscipline} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>} />
                        </div>
                    </div>
                );
            case 'academics':
                 const reportData = (data.classes || []).map(cls => {
                    const classMarks = (data.marks || []).filter(m => m.className === cls.name);
                    if (classMarks.length === 0) return { name: cls.name, avg: 0 };
                    const total = classMarks.reduce((sum, m) => sum + m.mark, 0);
                    return { name: cls.name, avg: parseFloat((total / classMarks.length).toFixed(2)) };
                });

                return (
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800 mb-6">Academic Overview</h2>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                <h3 className="text-lg font-semibold text-slate-800 mb-4">Class Performance</h3>
                                <div className="space-y-4">
                                    {reportData.map(row => (
                                        <div key={row.name}>
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm font-medium text-slate-700">{row.name}</span>
                                                <span className="text-sm font-medium text-slate-700">{row.avg}%</span>
                                            </div>
                                            <div className="w-full bg-slate-200 rounded-full h-2.5">
                                                <div className="bg-sky-600 h-2.5 rounded-full" style={{ width: `${row.avg}%` }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col min-h-[300px]">
                                <h3 className="text-lg font-semibold text-slate-800 mb-4">Subject Analysis</h3>
                                <div className="w-full h-64 relative">
                                    <canvas ref={chartRef}></canvas>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'discipline': // Same as DoD conduct log
                return (
                     <div>
                        <h2 className="text-3xl font-bold text-slate-800 mb-6">Full Conduct Log</h2>
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <table className="w-full text-sm text-left text-slate-500">
                                <thead className="text-xs text-slate-700 uppercase bg-slate-100"><tr><th className="px-6 py-3">Student</th><th className="px-6 py-3">Reason & Severity</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Time</th></tr></thead>
                                <tbody>
                                    {[...(data.conductEvents || [])].reverse().map(event => (<tr key={event.id} className="bg-white border-b hover:bg-slate-50"><td className="px-6 py-4 font-medium text-slate-900">{event.studentName}</td><td className="px-6 py-4">{event.reason} <span className={cn(event.severity === 'major' ? 'font-bold text-red-600' : '')}>({event.severity})</span></td><td className="px-6 py-4"><span className={cn("px-2 py-1 text-xs rounded-full", event.status === 'sent_out' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800')}>{event.status}</span></td><td className="px-6 py-4 text-xs">{new Date(event.sentAt).toLocaleString()}</td></tr>))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
             case 'finance': // Same as Bursar fee accounts
                return (
                     <div>
                        <h2 className="text-3xl font-bold text-slate-800 mb-6">Financial Overview</h2>
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <table className="w-full text-sm text-left text-slate-500">
                                <thead className="text-xs text-slate-700 uppercase bg-slate-100"><tr><th className="px-6 py-3">Student</th><th className="px-6 py-3">Balance</th><th className="px-6 py-3">Status</th></tr></thead>
                                <tbody>{(data.feeAccounts || []).map(acc => (<tr key={acc.id} className="bg-white border-b hover:bg-slate-50"><td className="px-6 py-4 font-medium text-slate-900">{acc.studentName}</td><td className="px-6 py-4 font-bold text-red-600">Ksh {acc.balance.toLocaleString()}</td><td className="px-6 py-4"><span className={cn("px-2 py-1 text-xs rounded-full", acc.status === 'Paid' ? 'bg-green-100 text-green-800' : acc.status === 'Partial' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800')}>{acc.status}</span></td></tr>))}</tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'users':
                return (
                    <div>
                         <h2 className="text-3xl font-bold text-slate-800 mb-6">User Management</h2>
                         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
                            <h3 className="text-lg font-semibold text-slate-800 mb-4">Assign Student Leadership</h3>
                            <div className="flex items-end gap-4">
                                <div className="flex-1"><label className="block text-sm font-medium text-slate-600 mb-1">Student Username</label><input type="text" value={studentToAssign} onChange={e => setStudentToAssign(e.target.value)} placeholder="e.g., student.name" className="shadow-sm appearance-none border border-slate-300 rounded-lg w-full py-2 px-3 text-slate-700 leading-tight focus:outline-none focus:ring-2 focus:ring-sky-500"/></div>
                                <div className="flex-1"><label className="block text-sm font-medium text-slate-600 mb-1">Role</label><select value={roleToAssign} onChange={e => setRoleToAssign(e.target.value as any)} className="shadow-sm appearance-none border border-slate-300 rounded-lg w-full py-2 px-3 text-slate-700 leading-tight focus:outline-none focus:ring-2 focus:ring-sky-500"><option value="head_boy">Head Boy</option><option value="head_girl">Head Girl</option></select></div>
                                <button onClick={handleAssignRole} disabled={isUpdating} className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-sky-300">Assign Role</button>
                            </div>
                         </div>
                         <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                             <table className="w-full text-sm text-left text-slate-500">
                                <thead className="text-xs text-slate-700 uppercase bg-slate-100"><tr><th className="px-6 py-3">Name</th><th className="px-6 py-3">Username</th><th className="px-6 py-3">Role</th></tr></thead>
                                <tbody>
                                    {(data.users || []).map(u => <tr key={u.username} className="bg-white border-b hover:bg-slate-50"><td className="px-6 py-4 font-medium">{u.name}</td><td className="px-6 py-4">{u.username}</td><td className="px-6 py-4 capitalize">{u.role.replace('_', ' ')}</td></tr>)}
                                </tbody>
                             </table>
                         </div>
                    </div>
                );
            case 'parents':
                const parents = data.users.filter(u => u.role === 'parent');
                return (
                     <div>
                         <h2 className="text-3xl font-bold text-slate-800 mb-6">Registered Parents</h2>
                         <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                             <table className="w-full text-sm text-left text-slate-500">
                                <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                                    <tr>
                                        <th className="px-6 py-3">Parent Name</th>
                                        <th className="px-6 py-3">Username</th>
                                        <th className="px-6 py-3">Linked Student(s)</th>
                                        <th className="px-6 py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {parents.map(p => {
                                        const linkedStudents = data.students.filter(s => s.parentId === p.username);
                                        return (
                                            <tr key={p.username} className="bg-white border-b hover:bg-slate-50">
                                                <td className="px-6 py-4 font-medium text-slate-900">{p.name}</td>
                                                <td className="px-6 py-4">{p.username}</td>
                                                <td className="px-6 py-4">
                                                    {linkedStudents.length > 0 ? (
                                                        <div className="flex flex-wrap gap-2">
                                                            {linkedStudents.map(s => (
                                                                <span key={s.id} className="bg-sky-100 text-sky-700 text-xs px-2 py-1 rounded-full">{s.name} ({s.class})</span>
                                                            ))}
                                                        </div>
                                                    ) : <span className="text-slate-400 italic">No students linked</span>}
                                                </td>
                                                <td className="px-6 py-4">
                                                     <button onClick={() => {
                                                        setCommTarget(linkedStudents[0]?.studentId || '');
                                                        setCommType('single');
                                                        setIsModalOpen(true);
                                                     }} className="text-sky-600 hover:underline font-medium text-sm">
                                                         Message
                                                     </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {parents.length === 0 && <tr><td colSpan={4} className="text-center p-6 text-slate-500">No parent accounts found.</td></tr>}
                                </tbody>
                             </table>
                         </div>
                    </div>
                );
             case 'communication':
                return (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-3xl font-bold text-slate-800">Communication Center</h2>
                            <button onClick={() => setIsModalOpen(true)} className="bg-sky-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-sky-700 transition-colors">Send Message</button>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                             <h3 className="text-lg font-semibold text-slate-800 mb-4">Message History</h3>
                             <div className="space-y-4">
                                {(data.messages || []).filter(m => m.senderId === user.username).slice().reverse().map(msg => (
                                    <div key={msg.id} className="border-b pb-4 last:border-b-0">
                                        <div className="flex justify-between items-start">
                                            <span className="font-bold text-slate-700">{msg.recipientRole} ({msg.recipientId || 'All'})</span>
                                            <span className="text-xs text-slate-500">{new Date(msg.sentAt).toLocaleString()}</span>
                                        </div>
                                        <p className="text-slate-600 mt-1">{msg.content}</p>
                                    </div>
                                ))}
                                 {(data.messages || []).filter(m => m.senderId === user.username).length === 0 && <p className="text-slate-500">No messages sent yet.</p>}
                             </div>
                        </div>
                    </div>
                );
            default: return <div>Select a view.</div>;
        }
    };
    
    if (!data) return <div className="p-10 flex justify-center"><Spinner /></div>;

    return (
        <>
            {isModalOpen && <Modal title="Send Message" onClose={() => setIsModalOpen(false)}>{renderModalContent()}</Modal>}
            <div className="flex h-screen bg-slate-50 text-slate-800">
                <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
                    <div className="p-6 text-center border-b border-slate-200">
                        <h1 className="text-2xl font-bold text-sky-600">I Perform</h1>
                        <p className="text-sm text-slate-500">Principal Portal</p>
                    </div>
                    <nav className="flex-1 p-4 space-y-2">
                        <NavLink view="dashboard" activeView={activeView} setActiveView={setActiveView}><span>Dashboard</span></NavLink>
                        <NavLink view="academics" activeView={activeView} setActiveView={setActiveView}><span>Academics</span></NavLink>
                        <NavLink view="discipline" activeView={activeView} setActiveView={setActiveView}><span>Discipline</span></NavLink>
                        <NavLink view="finance" activeView={activeView} setActiveView={setActiveView}><span>Finance</span></NavLink>
                        <NavLink view="communication" activeView={activeView} setActiveView={setActiveView}><span>Communication</span></NavLink>
                        <NavLink view="parents" activeView={activeView} setActiveView={setActiveView}><span>Parents</span></NavLink>
                        <NavLink view="users" activeView={activeView} setActiveView={setActiveView}><span>User Management</span></NavLink>
                    </nav>
                    <div className="p-4 mt-auto border-t border-slate-200 space-y-2">
                        <button onClick={onGoHome} className="w-full bg-slate-100 text-slate-600 font-semibold py-2.5 px-4 rounded-lg hover:bg-sky-100 hover:text-sky-700 transition-colors">Back to Home</button>
                        <button onClick={onLogout} className="w-full bg-slate-100 text-slate-600 font-semibold py-2.5 px-4 rounded-lg hover:bg-red-100 hover:text-red-700 transition-colors">Logout</button>
                    </div>
                </aside>
                <main className="flex-1 p-10 overflow-y-auto relative">
                    {isUpdating && <div className="absolute top-4 right-10 bg-sky-500 text-white p-3 rounded-lg shadow-lg z-50 flex items-center gap-2"><Spinner size="sm" /> <span>Updating...</span></div>}
                    {updateError && <div className="fixed top-4 right-4 bg-red-500 text-white p-3 rounded-lg shadow-lg z-50">Error: {updateError}</div>}
                    {renderView()}
                </main>
            </div>
        </>
    );
};

export default PrincipalDashboard;