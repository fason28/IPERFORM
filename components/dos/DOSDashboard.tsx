
import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { SchoolData, User } from '../../types';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, DoughnutController, BarController } from 'chart.js';
import Spinner from '../Spinner';
import { generateTimetable } from '../../services/geminiService';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, DoughnutController, BarController);

// Helper for dynamic class names
const cn = (...classes: (string | boolean)[]) => classes.filter(Boolean).join(' ');

// Safe date formatter
const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'N/A';
    try {
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return 'N/A';
        return d.toLocaleString();
    } catch (e) {
        return 'N/A';
    }
};

interface DOSDashboardProps {
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
            <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-lg overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
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

const DOSDashboard: React.FC<DOSDashboardProps> = ({ user, data, onUpdate, onLogout, onGoHome, isUpdating, updateError }) => {
  const [activeView, setActiveView] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalView, setModalView] = useState<string | null>(null);
  
  // Form state
  const [newClassName, setNewClassName] = useState('');
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherPhone, setNewTeacherPhone] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [newAnnouncement, setNewAnnouncement] = useState('');
  
  // Communication Form State
  const [commType, setCommType] = useState<'all' | 'class' | 'single'>('all');
  const [commTarget, setCommTarget] = useState('');
  const [commMessage, setCommMessage] = useState('');

  // Timetable State
  const [timetableConstraints, setTimetableConstraints] = useState('');
  const [timetableResult, setTimetableResult] = useState('');
  const [isGeneratingTimetable, setIsGeneratingTimetable] = useState(false);

  // Staff Creation
  const [newStaffRole, setNewStaffRole] = useState<'librarian' | 'secretary' | 'stock_keeper'>('secretary');
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffUsername, setNewStaffUsername] = useState('');
  
  // Conduct Mark
  const [conductStudent, setConductStudent] = useState('');
  const [conductScore, setConductScore] = useState('');
  const [conductReason, setConductReason] = useState('');

  const doughnutChartRef = useRef<HTMLCanvasElement>(null);
  const barChartRef = useRef<HTMLCanvasElement>(null);
  
  // Safe data accessors with filtering to remove nulls
  const classes = useMemo(() => (data?.classes || []).filter(item => item !== null && item !== undefined), [data]);
  const students = useMemo(() => (data?.students || []).filter(item => item !== null && item !== undefined), [data]);
  const teachers = useMemo(() => (data?.teachers || []).filter(item => item !== null && item !== undefined), [data]);
  const marks = useMemo(() => (data?.marks || []).filter(item => item !== null && item !== undefined), [data]);
  const users = useMemo(() => (data?.users || []).filter(item => item !== null && item !== undefined), [data]);
  const conductMarks = useMemo(() => (data?.conductMarks || []).filter(item => item !== null && item !== undefined), [data]);

  // Robust Chart.js Lifecycle Management
  useEffect(() => {
    if (activeView !== 'dashboard') return;

    let dChart: ChartJS | null = null;
    let bChart: ChartJS | null = null;

    const initCharts = () => {
        try {
            // 1. Doughnut Chart
            if (doughnutChartRef.current && classes.length > 0) {
                 const ctx = doughnutChartRef.current.getContext('2d');
                 if (ctx) {
                    // Destroy previous instance if it exists
                    const existing = ChartJS.getChart(doughnutChartRef.current);
                    if (existing) existing.destroy();

                    const studentCounts = classes.map(cls => 
                        students.filter(s => s && s.class === cls?.name).length
                    );
                    
                    dChart = new ChartJS(ctx, {
                        type: 'doughnut',
                        data: {
                            labels: classes.map(c => c?.name || 'Unknown'),
                            datasets: [{
                                data: studentCounts,
                                backgroundColor: ['#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd', '#e0f2fe'],
                                borderColor: '#fff',
                                hoverOffset: 4
                            }]
                        },
                        options: { 
                            responsive: true, 
                            maintainAspectRatio: false,
                            plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } } } 
                        }
                    });
                 }
            }

            // 2. Bar Chart
            if (barChartRef.current && classes.length > 0) {
                 const ctx = barChartRef.current.getContext('2d');
                 if (ctx) {
                    // Destroy previous instance if it exists
                    const existing = ChartJS.getChart(barChartRef.current);
                    if (existing) existing.destroy();

                    const classAverages = classes.map(cls => {
                        if (!cls?.name) return 0;
                        const classMarks = marks.filter(m => m && m.className === cls.name);
                        if (classMarks.length === 0) return 0;
                        const total = classMarks.reduce((sum, m) => sum + m.mark, 0);
                        return total / classMarks.length;
                    });

                    bChart = new ChartJS(ctx, {
                        type: 'bar',
                        data: {
                            labels: classes.map(c => c?.name || 'Unknown'),
                            datasets: [{
                                label: 'Average Mark',
                                data: classAverages,
                                backgroundColor: '#38bdf8',
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
        } catch (error) {
            console.error("Failed to initialize charts", error);
        }
    };

    const timer = setTimeout(initCharts, 100);

    return () => {
        clearTimeout(timer);
        if (dChart) dChart.destroy();
        if (bChart) bChart.destroy();
    };
  }, [activeView, classes, students, marks]); 
   
    const openModal = (view: string) => {
        setModalView(view);
        setIsModalOpen(true);
        if (view === 'addStudent' && classes.length > 0) {
            setSelectedClass(classes[0]?.name || '');
        }
        if (view === 'communication' && classes.length > 0) {
            setCommTarget(classes[0]?.name || '');
        }
    };
    
    const closeModal = () => {
        setIsModalOpen(false);
        setModalView(null);
        // Reset form fields
        setNewClassName('');
        setNewTeacherName('');
        setNewTeacherPhone('');
        setNewStudentName('');
        setSelectedClass('');
        setNewAnnouncement('');
        setNewStaffName('');
        setNewStaffUsername('');
        setConductStudent('');
        setConductScore('');
        setConductReason('');
        setCommMessage('');
        setCommTarget('');
        setCommType('all');
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        let action = '';
        switch(modalView) {
            case 'addClass':
                action = `Add a new class named '${newClassName}' with status 'Active'`;
                break;
            case 'addTeacher':
                action = `Add a new teacher named '${newTeacherName}' with phone number '${newTeacherPhone}'. Do not assign any classes yet.`;
                break;
            case 'addStudent':
                if (!selectedClass) { alert("Please select a class"); return; }
                action = `Add a new student named '${newStudentName}' to the class '${selectedClass}'.`;
                break;
            case 'addAnnouncement':
                action = `Post a new announcement as 'dos' (Director of Studies) with the text: "${newAnnouncement}"`;
                break;
            case 'addStaff':
                let pass = newStaffRole === 'librarian' ? 'lib123' : newStaffRole === 'secretary' ? 'sec123' : 'stock123';
                action = `Create a new user with role '${newStaffRole}'. Name: '${newStaffName}', Username: '${newStaffUsername}', Password: '${pass}', mustChangePassword: true.`;
                break;
            case 'conductMark':
                action = `Record a conduct mark/score for student ID '${conductStudent}'. Score change: ${conductScore} (this can be negative to remove marks). Reason: "${conductReason}". Recorded by DOS.`;
                break;
            case 'communication':
                if (commType === 'all') {
                    action = `Send a message to ALL parents from DOS. Content: "${commMessage}"`;
                } else if (commType === 'class') {
                    action = `Send a message to parents of Class '${commTarget}' from DOS. Content: "${commMessage}"`;
                } else {
                    const student = students.find(s => s.studentId === commTarget);
                    if (student) {
                        action = `Send a message to parent of student '${student.name}' (Parent ID: ${student.parentId}) from DOS. Content: "${commMessage}"`;
                    }
                }
                break;
        }
        if (action) {
            await onUpdate(action);
        }
        closeModal();
    };

    const handleGenerateTimetable = async () => {
        if (!timetableConstraints) return;
        setIsGeneratingTimetable(true);
        try {
             const result = await generateTimetable(timetableConstraints);
             setTimetableResult(result);
        } catch (e) {
            setTimetableResult("Failed to generate timetable. Please try again.");
        }
        setIsGeneratingTimetable(false);
    };

    const renderModalContent = () => {
        switch(modalView) {
            case 'addClass': return (
                <form onSubmit={handleSubmit}>
                    <label className="block text-slate-700 text-sm font-bold mb-2">Class Name</label>
                    <input value={newClassName} onChange={e => setNewClassName(e.target.value)} type="text" className="shadow-sm appearance-none border border-slate-300 rounded-lg w-full py-3 px-4 text-slate-700 leading-tight focus:outline-none focus:ring-2 focus:ring-sky-500" required />
                    <button type="submit" disabled={isUpdating} className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline mt-6 transition-colors disabled:bg-sky-300">{isUpdating ? 'Adding...' : 'Add Class'}</button>
                </form>
            );
            case 'addTeacher': return (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div><label className="block text-slate-700 text-sm font-bold mb-2">Teacher Name</label><input value={newTeacherName} onChange={e => setNewTeacherName(e.target.value)} type="text" className="shadow-sm appearance-none border border-slate-300 rounded-lg w-full py-3 px-4 text-slate-700" required /></div>
                    <div><label className="block text-slate-700 text-sm font-bold mb-2">Phone Number</label><input value={newTeacherPhone} onChange={e => setNewTeacherPhone(e.target.value)} type="tel" className="shadow-sm appearance-none border border-slate-300 rounded-lg w-full py-3 px-4 text-slate-700" required /></div>
                    <button type="submit" disabled={isUpdating} className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-4 rounded-lg mt-6 disabled:bg-sky-300">{isUpdating ? 'Adding...' : 'Add Teacher'}</button>
                </form>
            );
            case 'addStudent': return (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div><label className="block text-slate-700 text-sm font-bold mb-2">Student Name</label><input value={newStudentName} onChange={e => setNewStudentName(e.target.value)} type="text" className="shadow-sm appearance-none border border-slate-300 rounded-lg w-full py-3 px-4 text-slate-700" required /></div>
                    <div>
                        <label className="block text-slate-700 text-sm font-bold mb-2">Assign to Class</label>
                        <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="shadow-sm appearance-none border border-slate-300 rounded-lg w-full py-3 px-4 text-slate-700" required>
                             {classes.length === 0 && <option value="">No classes available</option>}
                             {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                    </div>
                    <button type="submit" disabled={isUpdating} className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-4 rounded-lg mt-6 disabled:bg-sky-300">{isUpdating ? 'Adding...' : 'Add Student'}</button>
                </form>
            );
            case 'communication': return (
                <form onSubmit={handleSubmit} className="space-y-4">
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
                                {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>
                    )}
                    {commType === 'single' && (
                        <div>
                            <label className="block text-slate-700 text-sm font-bold mb-2">Select Student</label>
                            <select value={commTarget} onChange={e => setCommTarget(e.target.value)} className="shadow-sm border border-slate-300 rounded-lg w-full py-2 px-3">
                                <option value="">Select...</option>
                                {students.map(s => <option key={s.id} value={s.studentId}>{s.name} ({s.class})</option>)}
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
            case 'addAnnouncement': return (
                <form onSubmit={handleSubmit}>
                    <label className="block text-slate-700 text-sm font-bold mb-2">Announcement Text</label>
                    <textarea value={newAnnouncement} onChange={e => setNewAnnouncement(e.target.value)} rows={4} className="shadow-sm appearance-none border border-slate-300 rounded-lg w-full py-3 px-4 text-slate-700" required />
                    <button type="submit" disabled={isUpdating} className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-4 rounded-lg mt-6 disabled:bg-sky-300">{isUpdating ? 'Posting...' : 'Post Announcement'}</button>
                </form>
            );
            case 'addStaff': return (
                 <form onSubmit={handleSubmit} className="space-y-4">
                    <div><label className="block text-slate-700 text-sm font-bold mb-2">Role</label><select value={newStaffRole} onChange={e => setNewStaffRole(e.target.value as any)} className="shadow-sm appearance-none border border-slate-300 rounded-lg w-full py-3 px-4 text-slate-700"><option value="secretary">Secretary</option><option value="librarian">Librarian</option><option value="stock_keeper">Stock Keeper</option></select></div>
                    <div><label className="block text-slate-700 text-sm font-bold mb-2">Name</label><input value={newStaffName} onChange={e => setNewStaffName(e.target.value)} type="text" className="shadow-sm appearance-none border border-slate-300 rounded-lg w-full py-3 px-4 text-slate-700" required /></div>
                    <div><label className="block text-slate-700 text-sm font-bold mb-2">Username</label><input value={newStaffUsername} onChange={e => setNewStaffUsername(e.target.value)} type="text" className="shadow-sm appearance-none border border-slate-300 rounded-lg w-full py-3 px-4 text-slate-700" required /></div>
                    <button type="submit" disabled={isUpdating} className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-4 rounded-lg mt-6 disabled:bg-sky-300">{isUpdating ? 'Adding...' : 'Add Staff'}</button>
                </form>
            );
             case 'conductMark': return (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div><label className="block text-slate-700 text-sm font-bold mb-2">Student</label><select value={conductStudent} onChange={e => setConductStudent(e.target.value)} className="shadow-sm appearance-none border border-slate-300 rounded-lg w-full py-3 px-4 text-slate-700" required><option value="">Select Student</option>{students.map(s => <option key={s.id} value={s.studentId}>{s.name}</option>)}</select></div>
                    <div><label className="block text-slate-700 text-sm font-bold mb-2">Score Modification (+/-)</label><input value={conductScore} onChange={e => setConductScore(e.target.value)} type="number" placeholder="e.g. -5 or 10" className="shadow-sm appearance-none border border-slate-300 rounded-lg w-full py-3 px-4 text-slate-700" required /></div>
                    <div><label className="block text-slate-700 text-sm font-bold mb-2">Reason</label><input value={conductReason} onChange={e => setConductReason(e.target.value)} type="text" className="shadow-sm appearance-none border border-slate-300 rounded-lg w-full py-3 px-4 text-slate-700" required /></div>
                    <button type="submit" disabled={isUpdating} className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-4 rounded-lg mt-6 disabled:bg-sky-300">{isUpdating ? 'Updating...' : 'Update Conduct Mark'}</button>
                </form>
            );
            default: return null;
        }
    }

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return (
            <div>
                <h2 className="text-3xl font-bold text-slate-800 mb-6">DOS Dashboard</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard title="Total Classes" value={classes.length} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>} />
                    <StatCard title="Total Teachers" value={teachers.length} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21v-1a6 6 0 00-5.176-5.97m8.352 5.97l-2.4-2.4A1.5 1.5 0 0115 13.535V12a3 3 0 00-3-3H9a3 3 0 00-3 3v1.536c0 .413.166.81.464 1.109l2.4 2.4m-1.85-5.97a3 3 0 00-3-3H9a3 3 0 00-3 3v1.536c0 .413.166.81.464 1.109l2.4 2.4" /></svg>} />
                    <StatCard title="Total Students" value={students.length} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} />
                    <StatCard title="Marks Entered" value={marks.length} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>} />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center min-h-[300px]">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4 self-start">Class Distribution</h3>
                        <div className="w-full h-64 relative">
                             <canvas ref={doughnutChartRef}></canvas>
                        </div>
                    </div>
                    <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col min-h-[300px]">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Average Marks per Class</h3>
                        <div className="w-full h-64 relative">
                            <canvas ref={barChartRef}></canvas>
                        </div>
                    </div>
                </div>
            </div>
        );
      case 'classes':
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-slate-800">Manage Classes</h2>
                <button onClick={() => openModal('addClass')} className="bg-sky-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-sky-700 transition-colors">Add Class</button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-sm text-left text-slate-500">
                <thead className="text-xs text-slate-700 uppercase bg-slate-100"><tr className=""><th scope="col" className="px-6 py-3">Name</th><th scope="col" className="px-6 py-3">Status</th><th scope="col" className="px-6 py-3">Students</th><th scope="col" className="px-6 py-3">Actions</th></tr></thead>
                <tbody>
                  {classes.map((cls) => (
                    <tr key={cls.id} className="bg-white border-b border-slate-200 last:border-b-0 hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900">{cls.name}</td>
                      <td className="px-6 py-4"><span className={cn("px-2 py-1 text-xs font-medium rounded-full", cls.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-600')}>{cls.status}</span></td>
                      <td className="px-6 py-4">{students.filter(s => s && s.class === cls.name).length}</td>
                      <td className="px-6 py-4"><button onClick={() => onUpdate(`Delete class with id ${cls.id}`)} className="font-medium text-red-600 hover:underline">Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
    case 'students':
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-slate-800">Manage Students</h2>
                <button onClick={() => openModal('addStudent')} className="bg-sky-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-sky-700 transition-colors">Add Student</button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-sm text-left text-slate-500">
                <thead className="text-xs text-slate-700 uppercase bg-slate-100"><tr className=""><th scope="col" className="px-6 py-3">Name</th><th scope="col" className="px-6 py-3">ID</th><th scope="col" className="px-6 py-3">Class</th><th scope="col" className="px-6 py-3">Parent ID</th><th scope="col" className="px-6 py-3">Actions</th></tr></thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id} className="bg-white border-b border-slate-200 last:border-b-0 hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900">{s.name}</td>
                      <td className="px-6 py-4">{s.studentId}</td>
                      <td className="px-6 py-4">{s.class}</td>
                      <td className="px-6 py-4">{s.parentId}</td>
                      <td className="px-6 py-4"><button onClick={() => onUpdate(`Delete student with id ${s.id}`)} className="font-medium text-red-600 hover:underline">Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
     case 'teachers':
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-slate-800">Manage Teachers</h2>
                <button onClick={() => openModal('addTeacher')} className="bg-sky-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-sky-700 transition-colors">Add Teacher</button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-sm text-left text-slate-500">
                <thead className="text-xs text-slate-700 uppercase bg-slate-100"><tr className=""><th scope="col" className="px-6 py-3">Name</th><th scope="col" className="px-6 py-3">Username</th><th scope="col" className="px-6 py-3">Phone</th><th scope="col" className="px-6 py-3">Classes</th><th scope="col" className="px-6 py-3">Actions</th></tr></thead>
                <tbody>
                  {teachers.map((t) => (
                    <tr key={t.id} className="bg-white border-b border-slate-200 last:border-b-0 hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900">{t.name}</td>
                      <td className="px-6 py-4">{t.username}</td>
                      <td className="px-6 py-4">{t.phone}</td>
                      <td className="px-6 py-4">{t.classes.join(', ') || 'N/A'}</td>
                      <td className="px-6 py-4"><button onClick={() => onUpdate(`Delete teacher with id ${t.id}`)} className="font-medium text-red-600 hover:underline">Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
    case 'staff':
        const supportStaff = users.filter(u => ['secretary', 'librarian', 'stock_keeper'].includes(u.role));
        return (
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-slate-800">Manage Support Staff</h2>
                    <button onClick={() => openModal('addStaff')} className="bg-sky-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-sky-700 transition-colors">Add Staff</button>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm text-left text-slate-500">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-100"><tr><th className="px-6 py-3">Name</th><th className="px-6 py-3">Role</th><th className="px-6 py-3">Username</th></tr></thead>
                        <tbody>
                            {supportStaff.map(s => (
                                <tr key={s.username} className="bg-white border-b border-slate-200 last:border-b-0 hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium">{s.name}</td>
                                    <td className="px-6 py-4 capitalize">{s.role.replace('_', ' ')}</td>
                                    <td className="px-6 py-4">{s.username}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    case 'conductMarks':
        return (
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-slate-800">Manage Conduct Marks</h2>
                    <button onClick={() => openModal('conductMark')} className="bg-sky-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-sky-700 transition-colors">Add/Remove Marks</button>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm text-left text-slate-500">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-100"><tr><th className="px-6 py-3">Student</th><th className="px-6 py-3">Score</th><th className="px-6 py-3">Reason</th><th className="px-6 py-3">Recorded By</th></tr></thead>
                        <tbody>
                            {conductMarks.slice().reverse().map(m => (
                                <tr key={m.id} className="bg-white border-b border-slate-200 last:border-b-0 hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium">{m.studentName}</td>
                                    <td className="px-6 py-4 font-bold" style={{color: m.score > 0 ? 'green' : 'red'}}>{m.score > 0 ? '+' : ''}{m.score}</td>
                                    <td className="px-6 py-4">{m.reason}</td>
                                    <td className="px-6 py-4">{m.recordedBy}</td>
                                </tr>
                            ))}
                            {conductMarks.length === 0 && <tr><td colSpan={4} className="text-center p-4">No conduct marks recorded.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    case 'timetable':
        return (
            <div>
                <h2 className="text-3xl font-bold text-slate-800 mb-6">Timetable Generator</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="text-lg font-bold mb-4">Constraints & Requests</h3>
                        <p className="text-sm text-slate-600 mb-2">Describe the classes, subjects, teachers, and any specific rules (e.g., "Maths in morning for Class A").</p>
                        <textarea
                            value={timetableConstraints}
                            onChange={(e) => setTimetableConstraints(e.target.value)}
                            rows={10}
                            placeholder="e.g. Create a timetable for Class S1 and S2. Subjects: Math, Eng, Sci. Teachers: Mr. Smith (Math), Mrs. Jones (Eng). Science lab on Friday only."
                            className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                        ></textarea>
                        <button
                            onClick={handleGenerateTimetable}
                            disabled={isGeneratingTimetable || !timetableConstraints}
                            className="mt-4 w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 rounded-lg disabled:bg-sky-300 transition-colors"
                        >
                            {isGeneratingTimetable ? 'Generating with AI...' : 'Generate Timetable'}
                        </button>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 overflow-y-auto max-h-[600px]">
                        <h3 className="text-lg font-bold mb-4">Generated Timetable</h3>
                        {timetableResult ? (
                            <div className="prose prose-sm max-w-none">
                                <pre className="whitespace-pre-wrap font-sans bg-slate-50 p-4 rounded-md">{timetableResult}</pre>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-64 text-slate-400 border-2 border-dashed rounded-lg">
                                Timetable will appear here...
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    case 'communication':
        return (
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-slate-800">Communication Center</h2>
                    <button onClick={() => openModal('communication')} className="bg-sky-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-sky-700 transition-colors">Send Message</button>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                     <h3 className="text-lg font-semibold text-slate-800 mb-4">Message History</h3>
                     <div className="space-y-4">
                        {(data.messages || []).filter(m => m.senderId === user.username).slice().reverse().map(msg => (
                            <div key={msg.id} className="border-b pb-4 last:border-b-0">
                                <div className="flex justify-between items-start">
                                    <span className="font-bold text-slate-700">{msg.recipientRole} ({msg.recipientId || 'All'})</span>
                                    <span className="text-xs text-slate-500">{formatDate(msg.sentAt)}</span>
                                </div>
                                <p className="text-slate-600 mt-1">{msg.content}</p>
                            </div>
                        ))}
                         {(data.messages || []).filter(m => m.senderId === user.username).length === 0 && <p className="text-slate-500">No messages sent yet.</p>}
                     </div>
                </div>
            </div>
        );
    default:
        return <div>Select a view</div>;
    }
  };
  
  // Safe exit if data is missing
  if (!data) return <div className="p-10 flex justify-center"><Spinner /></div>;

  return (
    <>
      {isModalOpen && <Modal title={modalView?.replace('add', 'Add ').replace('conductMark', 'Update Conduct Mark').replace('communication', 'Send Message') || ''} onClose={closeModal}>{renderModalContent()}</Modal>}
      <div className="flex h-screen bg-slate-50 text-slate-800">
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
          <div className="p-6 text-center border-b border-slate-200">
            <h1 className="text-2xl font-bold text-sky-600">I Perform</h1>
            <p className="text-sm text-slate-500">DOS Portal</p>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            <NavLink view="dashboard" activeView={activeView} setActiveView={setActiveView}><span>Dashboard</span></NavLink>
            <NavLink view="classes" activeView={activeView} setActiveView={setActiveView}><span>Classes</span></NavLink>
            <NavLink view="students" activeView={activeView} setActiveView={setActiveView}><span>Students</span></NavLink>
            <NavLink view="teachers" activeView={activeView} setActiveView={setActiveView}><span>Teachers</span></NavLink>
            <NavLink view="staff" activeView={activeView} setActiveView={setActiveView}><span>Support Staff</span></NavLink>
            <NavLink view="conductMarks" activeView={activeView} setActiveView={setActiveView}><span>Conduct Marks</span></NavLink>
            <NavLink view="communication" activeView={activeView} setActiveView={setActiveView}><span>Communication</span></NavLink>
            <NavLink view="timetable" activeView={activeView} setActiveView={setActiveView}><span>Timetable</span></NavLink>
          </nav>
          <div className="p-4 mt-auto border-t border-slate-200 space-y-2">
            <button onClick={onGoHome} className="w-full bg-slate-100 text-slate-600 font-semibold py-2.5 px-4 rounded-lg hover:bg-sky-100 hover:text-sky-700 transition-colors flex items-center gap-3 justify-center">Back to Home</button>
            <button onClick={onLogout} className="w-full bg-slate-100 text-slate-600 font-semibold py-2.5 px-4 rounded-lg hover:bg-red-100 hover:text-red-700 transition-colors flex items-center gap-3 justify-center">Logout</button>
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

export default DOSDashboard;
