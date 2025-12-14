
import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { SchoolData, User, Mark, Student, ConductEvent, Note } from '../../types';
import Spinner from '../Spinner';
import Lab from '../Lab';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, BarController } from 'chart.js';

// Ensure all controllers are registered
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, BarController);

// Helper for dynamic class names
const cn = (...classes: (string | boolean)[]) => classes.filter(Boolean).join(' ');

interface TeacherDashboardProps {
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

type StatCardProps = {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  colorClass?: string;
};

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, colorClass = "bg-sky-100 text-sky-600" }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
    <div className={`${colorClass} p-3 rounded-full`}>
        {icon}
    </div>
    <div>
        <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
        <p className="text-3xl font-bold text-slate-800">{value}</p>
    </div>
    </div>
);

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ user, data, onUpdate, onLogout, onGoHome, isUpdating, updateError }) => {
    const [activeView, setActiveView] = useState('dashboard');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalView, setModalView] = useState<string | null>(null);
    
    // Form state
    const [newAnnouncement, setNewAnnouncement] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [newSubject, setNewSubject] = useState('');
    const [newMark, setNewMark] = useState('');
    const [conductStudent, setConductStudent] = useState<Student | null>(null);
    const [conductReason, setConductReason] = useState('Restroom');
    const [conductSeverity, setConductSeverity] = useState<'minor' | 'major'>('minor');
    
    // Attendance State
    const [attendanceClass, setAttendanceClass] = useState('');
    const [attendanceState, setAttendanceState] = useState<{[key: string]: boolean}>({});

    // Conduct Mark State
    const [cMarkScore, setCMarkScore] = useState('');
    const [cMarkReason, setCMarkReason] = useState('');

    // Resources State
    const [resTitle, setResTitle] = useState('');
    const [resDesc, setResDesc] = useState('');
    const [resType, setResType] = useState('Note');
    const [resClass, setResClass] = useState('');

    const chartRef = useRef<HTMLCanvasElement>(null);

    const teacherInfo = useMemo(() => data.teachers.find(t => t.username === user.username), [data.teachers, user.username]);
    
    const myStudents = useMemo(() => {
        if (!teacherInfo) return [];
        return data.students.filter(s => teacherInfo.classes.includes(s.class));
    }, [data.students, teacherInfo]);

    const stats = useMemo(() => {
        const studentCount = myStudents.length;
        const classCount = teacherInfo?.classes.length || 0;
        
        // Calculate average mark for students in my classes
        const relevantMarks = data.marks.filter(m => teacherInfo?.classes.includes(m.className));
        const averageMark = relevantMarks.length > 0 
            ? (relevantMarks.reduce((sum, m) => sum + m.mark, 0) / relevantMarks.length).toFixed(1) 
            : 'N/A';

        return { studentCount, classCount, averageMark };
    }, [myStudents, teacherInfo, data.marks]);

    // Chart Effect
    useEffect(() => {
        if (activeView !== 'dashboard' || !teacherInfo) return;

        let chartInstance: ChartJS | null = null;

        const initChart = () => {
            if (chartRef.current && teacherInfo.classes.length > 0) {
                // Ensure canvas context is available
                const ctx = chartRef.current.getContext('2d');
                if (ctx) {
                    // Destroy any existing chart instance on this canvas
                    const existingChart = ChartJS.getChart(chartRef.current);
                    if (existingChart) existingChart.destroy();

                    const classLabels = teacherInfo.classes;
                    const classAverages = classLabels.map(cls => {
                        const marks = data.marks.filter(m => m.className === cls);
                        if (marks.length === 0) return 0;
                        return marks.reduce((sum, m) => sum + m.mark, 0) / marks.length;
                    });

                    chartInstance = new ChartJS(ctx, {
                        type: 'bar',
                        data: {
                            labels: classLabels,
                            datasets: [{
                                label: 'Class Average (%)',
                                data: classAverages,
                                backgroundColor: '#0ea5e9',
                                borderRadius: 6,
                                barThickness: 40
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false } },
                            scales: {
                                y: { beginAtZero: true, max: 100, grid: { color: '#f1f5f9' } },
                                x: { grid: { display: false } }
                            }
                        }
                    });
                }
            }
        };

        const timer = setTimeout(initChart, 50);
        return () => {
            clearTimeout(timer);
            if (chartInstance) {
                chartInstance.destroy();
            }
        };
    }, [activeView, teacherInfo, data.marks]);
    
    if (!teacherInfo) {
        return <div className="p-8">Error: Teacher profile not found.</div>;
    }
    
    const openModal = (view: string, student?: Student) => {
        setModalView(view);
        setIsModalOpen(true);
        if (view === 'addMark' && myStudents.length > 0) {
            setSelectedStudentId(myStudents[0].studentId);
        }
        if (view === 'goAndMark' && student) {
            setConductStudent(student);
        }
        if (view === 'conductMark' && student) {
            setConductStudent(student);
        }
        if (view === 'addResource' && teacherInfo.classes.length > 0) {
            setResClass(teacherInfo.classes[0]);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setModalView(null);
        // Reset forms
        setNewAnnouncement('');
        setSelectedStudentId('');
        setNewSubject('');
        setNewMark('');
        setConductStudent(null);
        setConductReason('Restroom');
        setConductSeverity('minor');
        setCMarkScore('');
        setCMarkReason('');
        setResTitle('');
        setResDesc('');
        setResType('Note');
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        let action = '';
        if (modalView === 'addAnnouncement') {
            action = `Post a new announcement as 'teacher' by '${user.name}' with the text: "${newAnnouncement}"`;
        } else if (modalView === 'addMark') {
            const student = myStudents.find(s => s.studentId === selectedStudentId);
            if (!student) return;
            action = `Add a mark of ${newMark} in subject '${newSubject}' for student '${student.name}' (ID: ${student.studentId}), uploaded by teacher '${user.name}'.`;
        } else if (modalView === 'goAndMark' && conductStudent) {
            action = `Create a new 'sent_out' conduct event for student '${conductStudent.name}' (ID: ${conductStudent.studentId}) in class '${conductStudent.class}' by teacher '${user.name}'. Reason: ${conductReason}, Severity: ${conductSeverity}.`;
        } else if (modalView === 'conductMark' && conductStudent) {
            action = `Record a conduct mark/score for student '${conductStudent.name}' (ID: ${conductStudent.studentId}). Score change: ${cMarkScore}. Reason: "${cMarkReason}". Recorded by teacher '${user.name}'.`;
        } else if (modalView === 'addResource') {
            action = `Upload a new academic resource. Title: "${resTitle}". Type: "${resType}". Class: "${resClass}". Description: "${resDesc}". Uploaded by: '${user.name}'. Store the Type in the filename field.`;
        }

        if (action) {
            await onUpdate(action);
        }
        closeModal();
    };
    
    const handleAttendanceSubmit = async () => {
        if (!attendanceClass) return;
        const presentIds = Object.entries(attendanceState).filter(([_, present]) => present).map(([id, _]) => id);
        const action = `Record attendance for class '${attendanceClass}'. Date: ${new Date().toISOString()}. Present Student IDs: ${JSON.stringify(presentIds)}. Recorded by '${user.name}'.`;
        await onUpdate(action);
        setAttendanceClass('');
        setAttendanceState({});
    }
    
    const initializeAttendance = (cls: string) => {
        setAttendanceClass(cls);
        const classStudents = data.students.filter(s => s.class === cls);
        const initial: {[key: string]: boolean} = {};
        classStudents.forEach(s => initial[s.studentId] = true); // Default all present
        setAttendanceState(initial);
    }

    const isAttendanceTakenToday = (className: string) => {
        const today = new Date().toDateString();
        return (data.attendances || []).some(a => a.className === className && new Date(a.date).toDateString() === today);
    };

    const renderModalContent = () => {
        if (modalView === 'conductMark') {
            return (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <p>Student: <strong>{conductStudent?.name}</strong></p>
                    <div><label className="block text-slate-700 text-sm font-bold mb-2">Score Change (+/-)</label><input value={cMarkScore} onChange={e => setCMarkScore(e.target.value)} type="number" className="shadow-sm appearance-none border border-slate-300 rounded-lg w-full py-3 px-4 text-slate-700" required /></div>
                    <div><label className="block text-slate-700 text-sm font-bold mb-2">Reason</label><input value={cMarkReason} onChange={e => setCMarkReason(e.target.value)} type="text" className="shadow-sm appearance-none border border-slate-300 rounded-lg w-full py-3 px-4 text-slate-700" required /></div>
                    <button type="submit" disabled={isUpdating} className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-4 rounded-lg mt-6 disabled:bg-sky-300">{isUpdating ? 'Updating...' : 'Update Score'}</button>
                </form>
            )
        }
        if (modalView === 'addMark') {
             return (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-slate-700 text-sm font-bold mb-2">Student</label>
                        <select value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)} className="shadow-sm border border-slate-300 rounded-lg w-full py-2 px-3" required>
                             <option value="">Select Student</option>
                             {myStudents.map(s => <option key={s.studentId} value={s.studentId}>{s.name} ({s.class})</option>)}
                        </select>
                    </div>
                    <div><label className="block text-slate-700 text-sm font-bold mb-2">Subject</label><input value={newSubject} onChange={e => setNewSubject(e.target.value)} type="text" className="shadow-sm border border-slate-300 rounded-lg w-full py-2 px-3" required /></div>
                    <div><label className="block text-slate-700 text-sm font-bold mb-2">Mark (%)</label><input value={newMark} onChange={e => setNewMark(e.target.value)} type="number" max="100" className="shadow-sm border border-slate-300 rounded-lg w-full py-2 px-3" required /></div>
                    <button type="submit" disabled={isUpdating} className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-4 rounded-lg mt-6 disabled:bg-sky-300">{isUpdating ? 'Saving...' : 'Add Mark'}</button>
                </form>
            )
        }
        if (modalView === 'addResource') {
            return (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div><label className="block text-slate-700 text-sm font-bold mb-2">Title</label><input value={resTitle} onChange={e => setResTitle(e.target.value)} type="text" className="shadow-sm border border-slate-300 rounded-lg w-full py-2 px-3" required /></div>
                    <div>
                        <label className="block text-slate-700 text-sm font-bold mb-2">Type</label>
                        <select value={resType} onChange={e => setResType(e.target.value)} className="shadow-sm border border-slate-300 rounded-lg w-full py-2 px-3">
                            <option value="Note">Class Note</option>
                            <option value="Holiday Package">Holiday Package</option>
                            <option value="Past Paper">Past Paper</option>
                            <option value="Assignment">Assignment</option>
                        </select>
                    </div>
                     <div>
                        <label className="block text-slate-700 text-sm font-bold mb-2">Class</label>
                        <select value={resClass} onChange={e => setResClass(e.target.value)} className="shadow-sm border border-slate-300 rounded-lg w-full py-2 px-3">
                            {teacherInfo.classes.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div><label className="block text-slate-700 text-sm font-bold mb-2">Description / Link</label><textarea value={resDesc} onChange={e => setResDesc(e.target.value)} rows={3} className="shadow-sm border border-slate-300 rounded-lg w-full py-2 px-3" placeholder="Enter description or link to file" required /></div>
                    <button type="submit" disabled={isUpdating} className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-4 rounded-lg mt-6 disabled:bg-sky-300">{isUpdating ? 'Uploading...' : 'Upload Resource'}</button>
                </form>
            )
        }
        return null;
    }

    const renderView = () => {
        switch (activeView) {
            case 'dashboard':
                return (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                             <h2 className="text-3xl font-bold text-slate-800">Teacher Dashboard</h2>
                             <button onClick={() => openModal('addMark')} className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
                                 + Add Marks
                             </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <StatCard title="My Classes" value={stats.classCount} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>} />
                            <StatCard title="Total Students" value={stats.studentCount} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} colorClass="bg-emerald-100 text-emerald-600" />
                            <StatCard title="Avg Student Score" value={`${stats.averageMark}%`} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>} colorClass="bg-amber-100 text-amber-600" />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col min-h-[350px]">
                                <h3 className="text-lg font-semibold text-slate-800 mb-4">Performance by Class</h3>
                                <div className="w-full flex-1 relative">
                                    <canvas ref={chartRef}></canvas>
                                </div>
                            </div>
                             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col min-h-[350px]">
                                <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Marks Added</h3>
                                <div className="overflow-y-auto flex-1">
                                    <table className="w-full text-sm text-left text-slate-500">
                                        <thead className="text-xs text-slate-700 uppercase bg-slate-50 sticky top-0"><tr><th className="px-4 py-2">Student</th><th className="px-4 py-2">Subject</th><th className="px-4 py-2">Mark</th></tr></thead>
                                        <tbody>
                                            {data.marks.filter(m => m.uploadedBy === user.name).slice().reverse().slice(0, 6).map(m => (
                                                <tr key={m.id} className="border-b last:border-0 hover:bg-slate-50">
                                                    <td className="px-4 py-3 font-medium">{m.studentName}</td>
                                                    <td className="px-4 py-3">{m.subject}</td>
                                                    <td className="px-4 py-3 font-bold text-sky-600">{m.mark}</td>
                                                </tr>
                                            ))}
                                            {data.marks.filter(m => m.uploadedBy === user.name).length === 0 && <tr><td colSpan={3} className="text-center py-4">No marks recorded recently.</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'classes':
                 return (
                     <div>
                         <h2 className="text-3xl font-bold text-slate-800 mb-6">My Classes</h2>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             {teacherInfo.classes.map(cls => (
                                 <div key={cls} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden">
                                     <div className="flex justify-between items-start mb-4">
                                         <h3 className="text-xl font-bold text-slate-800">{cls}</h3>
                                         {isAttendanceTakenToday(cls) && (
                                             <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                                 Done Today
                                             </span>
                                         )}
                                     </div>
                                     <div className="flex gap-2 mb-4">
                                         <button onClick={() => initializeAttendance(cls)} className="bg-sky-100 text-sky-700 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-sky-200 flex items-center gap-2">
                                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                             Take Attendance
                                         </button>
                                     </div>
                                     <h4 className="font-semibold text-sm text-slate-500 mb-2">Students ({data.students.filter(s => s.class === cls).length})</h4>
                                     <ul className="space-y-2 h-64 overflow-y-auto pr-2">
                                         {data.students.filter(s => s.class === cls).map(s => (
                                             <li key={s.id} className="flex justify-between items-center p-2 bg-slate-50 rounded-md border border-slate-100">
                                                 <span className="text-sm font-medium">{s.name}</span>
                                                 <button onClick={() => openModal('conductMark', s)} className="text-xs text-amber-600 hover:text-amber-700 font-medium">Conduct</button>
                                             </li>
                                         ))}
                                     </ul>
                                 </div>
                             ))}
                         </div>
                         {attendanceClass && (
                             <div className="mt-8 bg-white p-6 rounded-xl shadow-lg border border-sky-200 animate-in fade-in slide-in-from-bottom-4">
                                 <div className="flex justify-between items-center mb-6">
                                     <div>
                                         <h3 className="text-xl font-bold text-slate-800">Attendance for {attendanceClass}</h3>
                                         <p className="text-slate-500 text-sm">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                     </div>
                                     <button onClick={() => setAttendanceClass('')} className="text-slate-400 hover:text-slate-600">
                                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                     </button>
                                 </div>
                                 
                                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                                     {data.students.filter(s => s.class === attendanceClass).map(s => {
                                         const isPresent = attendanceState[s.studentId] ?? true;
                                         return (
                                             <div 
                                                 key={s.id} 
                                                 onClick={() => setAttendanceState(prev => ({...prev, [s.studentId]: !isPresent}))}
                                                 className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all duration-200 select-none ${isPresent ? 'bg-green-50 border-green-200 hover:bg-green-100' : 'bg-red-50 border-red-200 hover:bg-red-100'}`}
                                             >
                                                 <div className="flex items-center gap-3">
                                                     <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg ${isPresent ? 'bg-green-500' : 'bg-red-500'}`}>
                                                         {s.name.charAt(0)}
                                                     </div>
                                                     <div>
                                                         <p className={`font-semibold ${isPresent ? 'text-green-900' : 'text-red-900'}`}>{s.name}</p>
                                                         <p className="text-xs text-slate-500">{s.studentId}</p>
                                                     </div>
                                                 </div>
                                                 <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isPresent ? 'border-green-500 bg-green-500' : 'border-red-400 bg-white'}`}>
                                                     {isPresent && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                                 </div>
                                             </div>
                                         );
                                     })}
                                 </div>
                                 
                                 <div className="flex justify-end gap-4">
                                     <button onClick={() => setAttendanceClass('')} className="px-6 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium">Cancel</button>
                                     <button onClick={handleAttendanceSubmit} disabled={isUpdating} className="bg-sky-600 text-white px-8 py-2 rounded-lg font-bold hover:bg-sky-700 disabled:bg-sky-300 shadow-lg shadow-sky-200 transition-all transform active:scale-95 flex items-center gap-2">
                                         {isUpdating ? <Spinner size="sm" /> : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                                         Submit Attendance
                                     </button>
                                 </div>
                             </div>
                         )}
                     </div>
                 );
            case 'resources':
                 const myResources = (data.notes || []).filter(n => n.uploadedBy === user.name);
                 return (
                     <div>
                         <div className="flex justify-between items-center mb-6">
                             <h2 className="text-3xl font-bold text-slate-800">Resources & Holiday Packages</h2>
                             <button onClick={() => openModal('addResource')} className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
                                 Upload Resource
                             </button>
                         </div>
                         <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                             <table className="w-full text-sm text-left text-slate-500">
                                 <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                                     <tr>
                                         <th className="px-6 py-3">Title</th>
                                         <th className="px-6 py-3">Type</th>
                                         <th className="px-6 py-3">Class</th>
                                         <th className="px-6 py-3">Description</th>
                                         <th className="px-6 py-3">Date</th>
                                         <th className="px-6 py-3">Action</th>
                                     </tr>
                                 </thead>
                                 <tbody>
                                     {myResources.map(res => (
                                         <tr key={res.id} className="bg-white border-b hover:bg-slate-50">
                                             <td className="px-6 py-4 font-medium text-slate-900">{res.title}</td>
                                             <td className="px-6 py-4"><span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs">{res.filename || 'Resource'}</span></td>
                                             <td className="px-6 py-4">{res.className}</td>
                                             <td className="px-6 py-4">{res.description}</td>
                                             <td className="px-6 py-4">{new Date(res.uploadedAt).toLocaleDateString()}</td>
                                             <td className="px-6 py-4">
                                                 <button onClick={() => onUpdate(`Delete note with id ${res.id}`)} className="text-red-600 hover:underline">Delete</button>
                                             </td>
                                         </tr>
                                     ))}
                                     {myResources.length === 0 && <tr><td colSpan={6} className="text-center p-6 text-slate-500">No resources uploaded yet.</td></tr>}
                                 </tbody>
                             </table>
                         </div>
                     </div>
                 );
            case 'lab':
                return <Lab />;
            default: return <div>Select a view</div>;
        }
    }

    return (
        <>
            {isModalOpen && <Modal title="Action" onClose={closeModal}>{renderModalContent()}</Modal>}
            <div className="flex h-screen bg-slate-50 text-slate-800">
                <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
                    <div className="p-6 text-center border-b border-slate-200">
                        <h1 className="text-2xl font-bold text-sky-600">I Perform</h1>
                        <p className="text-sm text-slate-500">Teacher Portal</p>
                    </div>
                    <nav className="flex-1 p-4 space-y-2">
                        <NavLink view="dashboard" activeView={activeView} setActiveView={setActiveView}><span>Dashboard</span></NavLink>
                        <NavLink view="classes" activeView={activeView} setActiveView={setActiveView}><span>My Classes & Attendance</span></NavLink>
                        <NavLink view="resources" activeView={activeView} setActiveView={setActiveView}><span>Resources & Packages</span></NavLink>
                        <NavLink view="lab" activeView={activeView} setActiveView={setActiveView}><span>Science Lab</span></NavLink>
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

export default TeacherDashboard;
