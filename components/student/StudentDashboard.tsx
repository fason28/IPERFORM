
import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { SchoolData, User, Student } from '../../types';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, BarController } from 'chart.js';
import Spinner from '../Spinner';
import Lab from '../Lab';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, BarController);

// Helper for dynamic class names
const cn = (...classes: (string | boolean)[]) => classes.filter(Boolean).join(' ');

interface StudentDashboardProps {
  user: User;
  data: SchoolData;
  onUpdate: (action: string) => Promise<any>;
  onLogout: () => void;
  onGoHome: () => void;
  isUpdating: boolean;
}

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
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

const StudentDashboard: React.FC<StudentDashboardProps> = ({ user, data, onUpdate, onLogout, onGoHome, isUpdating }) => {
    const [activeView, setActiveView] = useState('dashboard');
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const performanceChartRef = useRef<HTMLCanvasElement>(null);
    const comparisonChartRef = useRef<HTMLCanvasElement>(null);

    const studentInfo = useMemo(() => {
        if (!data || !data.students) return null;
        return data.students.find(s => s.username === user.username);
    }, [data, user.username]);

    const studentMarks = useMemo(() => {
        if (!data || !data.marks || !studentInfo) return [];
        return data.marks.filter(m => m.studentId === studentInfo.studentId);
    }, [data, studentInfo]);
    
    const classMarks = useMemo(() => {
        if (!data || !data.marks || !studentInfo) return [];
        return data.marks.filter(m => m.className === studentInfo.class);
    }, [data, studentInfo]);

    const averageScore = useMemo(() => {
        if (studentMarks.length === 0) return 0;
        const total = studentMarks.reduce((sum, m) => sum + m.mark, 0);
        return parseFloat((total / studentMarks.length).toFixed(2));
    }, [studentMarks]);
    
    const classAverage = useMemo(() => {
        if(classMarks.length === 0) return 0;
        const total = classMarks.reduce((sum, m) => sum + m.mark, 0);
        return parseFloat((total / classMarks.length).toFixed(2));
    }, [classMarks]);

    const leaderboard = useMemo(() => {
        if (!data || !data.students || !studentInfo) return [];
        const classStudents = data.students.filter(s => s.class === studentInfo?.class);
        const studentAverages = classStudents.map(student => {
            const marks = (data.marks || []).filter(m => m.studentId === student.studentId);
            if (marks.length === 0) return { name: student.name, studentId: student.studentId, average: 0 };
            const total = marks.reduce((sum, m) => sum + m.mark, 0);
            return { name: student.name, studentId: student.studentId, average: parseFloat((total / marks.length).toFixed(2)) };
        });
        return studentAverages.sort((a, b) => b.average - a.average);
    }, [data, studentInfo]);

    const classRank = useMemo(() => leaderboard.findIndex(s => s.studentId === studentInfo?.studentId) + 1, [leaderboard, studentInfo]);

    useEffect(() => {
        if (activeView !== 'dashboard') return;

        const destroyChart = (canvas: HTMLCanvasElement | null) => {
             if (canvas) {
                const existingChart = ChartJS.getChart(canvas);
                if (existingChart) existingChart.destroy();
             }
        }

        const initCharts = () => {
             // 1. Performance Chart
            if (performanceChartRef.current) {
                destroyChart(performanceChartRef.current);
                const ctx = performanceChartRef.current.getContext('2d');
                if (ctx) {
                    const subjects = [...new Set(studentMarks.map(m => m.subject))];
                    const marksBySubject = subjects.map(subject => studentMarks.find(m => m.subject === subject)?.mark || 0);
                    
                    new ChartJS(ctx, {
                        type: 'bar',
                        data: {
                            labels: subjects,
                            datasets: [{ label: 'Your Score', data: marksBySubject, backgroundColor: '#38bdf8', borderRadius: 4, }]
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
            
            // 2. Comparison Chart
            if (comparisonChartRef.current) {
                destroyChart(comparisonChartRef.current);
                const ctx = comparisonChartRef.current.getContext('2d');
                if (ctx) {
                    new ChartJS(ctx, {
                        type: 'bar',
                        data: {
                            labels: ['Average Score'],
                            datasets: [
                                { label: 'Your Average', data: [averageScore], backgroundColor: '#0ea5e9', borderRadius: 4, },
                                { label: 'Class Average', data: [classAverage], backgroundColor: '#a5f3fc', borderRadius: 4, }
                            ]
                        },
                        options: { 
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } }}, 
                            scales: { y: { beginAtZero: true, max: 100, grid: { color: '#e2e8f0' } }, x: { grid: { display: false } } } 
                        }
                    });
                }
            }
        };

        const timer = setTimeout(initCharts, 50);
        
        return () => {
            clearTimeout(timer);
            destroyChart(performanceChartRef.current);
            destroyChart(comparisonChartRef.current);
        };
    }, [activeView, studentMarks, averageScore, classAverage]);
    
    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        // This is a simulation. In a real app, you'd get data from the form.
        await onUpdate(`As student ${user.username}, update my profile to add a new bio: "Eager to learn and participate in school activities."`);
        setIsModalOpen(false);
    }

    if (!data) return <div className="p-10 flex justify-center"><Spinner /></div>;
    if (!studentInfo) return <div className="p-10 text-center">Student record not found. Please contact administration.</div>

    const renderView = () => {
        switch(activeView) {
            case 'dashboard':
                return (
                    <div>
                        <div className="mb-8">
                            <h2 className="text-3xl font-bold text-slate-800">Welcome, {user.name}!</h2>
                            <p className="text-slate-600">Class: {studentInfo.class} | Student ID: {studentInfo.studentId}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center"><h3 className="text-slate-500 text-sm font-medium">Your Average</h3><p className="text-4xl font-bold text-sky-600 mt-1">{averageScore}%</p></div>
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center"><h3 className="text-slate-500 text-sm font-medium">Class Rank</h3><p className="text-4xl font-bold text-green-600 mt-1">#{classRank > 0 ? classRank : 'N/A'}</p></div>
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center"><h3 className="text-slate-500 text-sm font-medium">Class Average</h3><p className="text-4xl font-bold text-amber-600 mt-1">{classAverage}%</p></div>
                        </div>
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col min-h-[300px]">
                                <h3 className="text-xl font-semibold mb-4 text-slate-800">Performance by Subject</h3>
                                <div className="w-full h-64 relative">
                                    <canvas ref={performanceChartRef}></canvas>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col min-h-[300px]">
                                <h3 className="text-xl font-semibold mb-4 text-slate-800">You vs. Class Average</h3>
                                <div className="w-full h-64 relative">
                                    <canvas ref={comparisonChartRef}></canvas>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                            <h3 className="text-xl font-semibold mb-4 p-6 pb-0 text-slate-800">Class Leaderboard</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-slate-500">
                                    <thead className="text-xs text-slate-700 uppercase bg-slate-100"><tr className=""><th scope="col" className="px-6 py-3">Rank</th><th scope="col" className="px-6 py-3">Name</th><th scope="col" className="px-6 py-3">Average</th></tr></thead>
                                    <tbody>
                                        {leaderboard.map((s, i) => (
                                            <tr key={s.studentId} className={cn("bg-white border-b border-slate-200", s.studentId === studentInfo.studentId ? 'bg-sky-50' : '')}>
                                                <td className="px-6 py-4 font-medium text-slate-900">{i+1}</td>
                                                <td className="px-6 py-4 font-medium text-slate-900">{s.name}</td>
                                                <td className="px-6 py-4 font-semibold text-slate-700">{s.average}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );
             case 'marks':
                return (
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800 mb-6">Your Marks</h2>
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                          <table className="w-full text-sm text-left text-slate-500">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Subject</th>
                                    <th scope="col" className="px-6 py-3">Mark</th>
                                    <th scope="col" className="px-6 py-3">Uploaded By</th>
                                    <th scope="col" className="px-6 py-3">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                            {studentMarks.map((mark) => (
                                <tr key={mark.id} className="bg-white border-b border-slate-200 last:border-b-0 hover:bg-slate-50">
                                  <td className="px-6 py-4 font-medium text-slate-900">{mark.subject}</td>
                                  <td className="px-6 py-4 font-bold">{mark.mark}%</td>
                                  <td className="px-6 py-4">{mark.uploadedBy}</td>
                                  <td className="px-6 py-4">{new Date(mark.uploadedAt).toLocaleDateString()}</td>
                                </tr>
                            ))}
                            </tbody>
                          </table>
                           {studentMarks.length === 0 && <p className="p-6 text-center text-slate-500">No marks have been entered for you yet.</p>}
                        </div>
                    </div>
                );
            case 'conduct': {
                const myConductEvents = (data.conductEvents || []).filter(e => e.studentId === studentInfo.studentId);
                return (
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800 mb-6">Conduct History</h2>
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                          <table className="w-full text-sm text-left text-slate-500">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Date</th>
                                    <th scope="col" className="px-6 py-3">Teacher</th>
                                    <th scope="col" className="px-6 py-3">Reason</th>
                                    <th scope="col" className="px-6 py-3">Severity</th>
                                    <th scope="col" className="px-6 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                            {[...myConductEvents].reverse().map((event) => (
                                <tr key={event.id} className="bg-white border-b border-slate-200 last:border-b-0 hover:bg-slate-50">
                                  <td className="px-6 py-4 font-medium text-slate-900">{new Date(event.sentAt).toLocaleDateString()}</td>
                                  <td className="px-6 py-4">{event.teacherName}</td>
                                  <td className="px-6 py-4">{event.reason}</td>
                                  <td className="px-6 py-4"><span className={cn(event.severity === 'major' ? 'font-bold text-red-600' : '')}>{event.severity}</span></td>
                                  <td className="px-6 py-4">
                                     <span className={cn("px-2 py-1 text-xs font-medium rounded-full", event.status === 'sent_out' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800')}>{event.status === 'sent_out' ? 'Sent Out' : 'Returned'}</span>
                                  </td>
                                </tr>
                            ))}
                            </tbody>
                          </table>
                           {myConductEvents.length === 0 && <p className="p-6 text-center text-slate-500">You have no conduct events on record.</p>}
                        </div>
                    </div>
                );
            }
            case 'profile':
                return (
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800 mb-6">My Profile</h2>
                        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div><p className="text-sm text-slate-500">Full Name</p><p className="font-semibold text-lg">{studentInfo.name}</p></div>
                                    <div><p className="text-sm text-slate-500">Student ID</p><p className="font-semibold text-lg">{studentInfo.studentId}</p></div>
                                    <div><p className="text-sm text-slate-500">Class</p><p className="font-semibold text-lg">{studentInfo.class}</p></div>
                                </div>
                                <div className="space-y-4">
                                     <div><p className="text-sm text-slate-500">Username</p><p className="font-semibold text-lg">{studentInfo.username}</p></div>
                                     <div><p className="text-sm text-slate-500">Gender</p><p className="font-semibold text-lg">{studentInfo.gender}</p></div>
                                     <div><p className="text-sm text-slate-500">Parent ID</p><p className="font-semibold text-lg">{studentInfo.parentId}</p></div>
                                </div>
                            </div>
                            <div className="mt-8 pt-6 border-t border-slate-200">
                                 <button onClick={() => setIsModalOpen(true)} className="bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors">Update Profile</button>
                            </div>
                        </div>
                    </div>
                );
            case 'notes':
            case 'tests':
                const isNotes = activeView === 'notes';
                const items = isNotes ? (data.notes || []).filter(n => n.className === studentInfo.class) : (data.tests || []).filter(t => t.className === studentInfo.class);
                const title = isNotes ? 'Class Notes' : 'Class Tests';
                 return (
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800 mb-6">{title}</h2>
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                          <table className="w-full text-sm text-left text-slate-500">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Title</th>
                                    <th scope="col" className="px-6 py-3">Description</th>
                                    <th scope="col" className="px-6 py-3">Uploaded By</th>
                                    <th scope="col" className="px-6 py-3">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                            {items.map((item) => (
                                <tr key={item.id} className="bg-white border-b border-slate-200 last:border-b-0 hover:bg-slate-50">
                                  <td className="px-6 py-4 font-medium text-slate-900">{item.title}</td>
                                  <td className="px-6 py-4 text-slate-600">{item.description}</td>
                                  <td className="px-6 py-4">{item.uploadedBy}</td>
                                  <td className="px-6 py-4">{new Date(item.uploadedAt).toLocaleDateString()}</td>
                                </tr>
                            ))}
                            </tbody>
                          </table>
                          {items.length === 0 && <p className="p-6 text-center text-slate-500">No {isNotes ? 'notes' : 'tests'} have been uploaded for your class.</p>}
                        </div>
                    </div>
                );
            case 'announcements':
                return (
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800 mb-6">Announcements</h2>
                        <div className="space-y-4">
                        {[...(data.announcements || [])].reverse().map(a => (
                            <div key={a.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                                <p className="text-slate-700">{a.text}</p>
                                <p className="text-xs text-slate-500 mt-2">Posted by <span className="font-medium">{a.postedBy}</span> on {new Date(a.postedAt).toLocaleString()}</p>
                            </div>
                        ))}
                        {(data.announcements || []).length === 0 && <div className="text-center py-10 bg-white rounded-xl border border-slate-200"><p className="text-slate-500">No announcements have been posted yet.</p></div>}
                        </div>
                    </div>
                );
            case 'lab':
                return <Lab />;
            default: return <div>Select a view.</div>;
        }
    };
    

     return (
        <>
            {isModalOpen && (
                <Modal title="Update Your Profile" onClose={() => setIsModalOpen(false)}>
                    <form onSubmit={handleProfileUpdate}>
                        <p className="text-slate-600 mb-4">This is a demonstration. Clicking update will add a sample bio to your profile.</p>
                        <div className="mb-4">
                            <label className="block text-slate-700 text-sm font-bold mb-2">Bio</label>
                            <textarea defaultValue="Eager to learn and participate in school activities." rows={3} className="shadow-sm appearance-none border border-slate-300 rounded-lg w-full py-3 px-4 text-slate-700" />
                        </div>
                         <button type="submit" disabled={isUpdating} className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline mt-6 transition-colors disabled:bg-sky-300">
                           {isUpdating ? 'Updating...' : 'Save Changes'}
                        </button>
                    </form>
                </Modal>
            )}
            <div className="flex h-screen bg-slate-50 text-slate-800">
              <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
                <div className="p-6 text-center border-b border-slate-200">
                  <h1 className="text-2xl font-bold text-sky-600">I Perform</h1>
                  <p className="text-sm text-slate-500">Student Portal</p>
                  <p className="font-semibold text-slate-700 mt-2">{user.name}</p>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                  <NavLink view="dashboard" activeView={activeView} setActiveView={setActiveView}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg><span>Dashboard</span></NavLink>
                  <NavLink view="profile" activeView={activeView} setActiveView={setActiveView}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg><span>My Profile</span></NavLink>
                  <NavLink view="marks" activeView={activeView} setActiveView={setActiveView}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg><span>Marks</span></NavLink>
                  <NavLink view="lab" activeView={activeView} setActiveView={setActiveView}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg><span>Science Lab</span></NavLink>
                  <NavLink view="conduct" activeView={activeView} setActiveView={setActiveView}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><span>Conduct History</span></NavLink>
                  <NavLink view="notes" activeView={activeView} setActiveView={setActiveView}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg><span>Notes</span></NavLink>
                  <NavLink view="tests" activeView={activeView} setActiveView={setActiveView}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg><span>Tests</span></NavLink>
                  <NavLink view="announcements" activeView={activeView} setActiveView={setActiveView}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-2.236 9.168-5.514C18.358 1.84 19.17 1 20.243 1c.577 0 1.045.467 1.045 1.045v3.1c0 .72-.37 1.35-.943 1.705l-2.096 1.397c-.573.384-1.31.59-2.068.59H13a5.98 5.98 0 00-4.564 2.123" /></svg><span>Announcements</span></NavLink>
                </nav>
                <div className="p-4 mt-auto border-t border-slate-200 space-y-2">
                     <button onClick={onGoHome} className="w-full bg-slate-100 text-slate-600 font-semibold py-2.5 px-4 rounded-lg hover:bg-sky-100 hover:text-sky-700 transition-colors flex items-center gap-3 justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                        <span>Back to Home</span>
                    </button>
                    <button onClick={onLogout} className="w-full bg-slate-100 text-slate-600 font-semibold py-2.5 px-4 rounded-lg hover:bg-red-100 hover:text-red-700 transition-colors flex items-center gap-3 justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        <span>Logout</span>
                    </button>
                </div>
              </aside>
              <main className="flex-1 p-10 overflow-y-auto">
                {renderView()}
              </main>
            </div>
        </>
    );
};

export default StudentDashboard;
