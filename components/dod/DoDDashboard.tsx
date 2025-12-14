
import React, { useState, useMemo } from 'react';
import type { SchoolData, User, Announcement } from '../../types';
import Spinner from '../Spinner';

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

interface DoDDashboardProps {
  user: User;
  data: SchoolData;
  onUpdate: (action: string) => Promise<any>;
  onLogout: () => void;
  onGoHome: () => void;
  isUpdating: boolean;
  updateError: string | null;
}

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
  subtext?: string;
};
const StatCard: React.FC<StatCardProps> = ({ title, value, icon, subtext }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
    <div className="bg-sky-100 text-sky-600 p-3 rounded-full">
        {icon}
    </div>
    <div>
        <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
        <p className="text-3xl font-bold text-slate-800">{value}</p>
        {subtext && <p className="text-xs text-slate-500">{subtext}</p>}
    </div>
    </div>
);


const DoDDashboard: React.FC<DoDDashboardProps> = ({ user, data, onUpdate, onLogout, onGoHome, isUpdating, updateError }) => {
  const [activeView, setActiveView] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalView, setModalView] = useState<'announcement' | 'permission' | 'communication' | 'suspension'>('announcement');
  const [newAnnouncement, setNewAnnouncement] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Leadership assignment
  const [studentToAssign, setStudentToAssign] = useState('');
  const [roleToAssign, setRoleToAssign] = useState<'head_boy' | 'head_girl'>('head_boy');

  // Permission State
  const [permStudent, setPermStudent] = useState('');
  const [permType, setPermType] = useState('Exit');
  const [permDest, setPermDest] = useState('');
  const [permReason, setPermReason] = useState('');

  // Suspension State
  const [suspStudent, setSuspStudent] = useState('');
  const [suspReason, setSuspReason] = useState('');
  const [suspDuration, setSuspDuration] = useState('1');

  // Communication Form State
  const [commType, setCommType] = useState<'all' | 'class' | 'single'>('all');
  const [commTarget, setCommTarget] = useState(''); 
  const [commMessage, setCommMessage] = useState('');

  // Robust null filtering with useMemo to ensure stability
  const conductEvents = useMemo(() => (data?.conductEvents || []).filter(e => e !== null && e !== undefined), [data]);
  const students = useMemo(() => (data?.students || []).filter(e => e !== null && e !== undefined), [data]);
  const announcements = useMemo(() => (data?.announcements || []).filter(e => e !== null && e !== undefined), [data]);
  const users = useMemo(() => (data?.users || []).filter(e => e !== null && e !== undefined), [data]);
  const permissions = useMemo(() => (data?.permissions || []).filter(e => e !== null && e !== undefined), [data]);
  const diningHallSeating = useMemo(() => (data?.diningHallSeating || []).filter(e => e !== null && e !== undefined), [data]);
  const dormitoryAllocation = useMemo(() => (data?.dormitoryAllocation || []).filter(e => e !== null && e !== undefined), [data]);
  const messages = useMemo(() => (data?.messages || []).filter(e => e !== null && e !== undefined), [data]);
  const classes = useMemo(() => (data?.classes || []).filter(e => e !== null && e !== undefined), [data]);

  const stats = useMemo(() => {
    if (!data) return { sentOut: 0, majorIncidents: 0, topOffenders: [] };
    const sentOut = conductEvents.filter(e => e.status === 'sent_out').length;
    const majorIncidents = conductEvents.filter(e => e.severity === 'major').length;
    
    const studentIncidents: {[key: string]: number} = {};
    conductEvents.forEach(event => {
        if(event && event.studentName) {
            studentIncidents[event.studentName] = (studentIncidents[event.studentName] || 0) + 1;
        }
    });
    
    const topOffenders = Object.entries(studentIncidents)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
        
    return { sentOut, majorIncidents, topOffenders };
  }, [conductEvents, data]); // Depends on filtered list

  const openModal = (type: 'announcement' | 'permission' | 'communication' | 'suspension') => {
      setModalView(type);
      setIsModalOpen(true);
      if (type === 'communication' && classes.length > 0) {
        setCommTarget(classes[0]?.name || '');
      }
  }
  const closeModal = () => {
    setIsModalOpen(false);
    setNewAnnouncement('');
    setPermStudent('');
    setPermDest('');
    setPermReason('');
    setCommMessage('');
    setCommTarget('');
    setCommType('all');
    setSuspStudent('');
    setSuspReason('');
    setSuspDuration('1');
  };

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    const action = `Post a new announcement or order as 'dod' (Director of Discipline) with the text: "${newAnnouncement}"`;
    await onUpdate(action);
    closeModal();
  };

  const handleGrantPermission = async (e: React.FormEvent) => {
      e.preventDefault();
      const student = students.find(s => s.studentId === permStudent);
      if(!student) return;
      const action = `Grant a '${permType}' permission to student '${student.name}' (ID: ${student.studentId}). Destination: "${permDest}", Reason: "${permReason}", Granted by: '${user.name}'.`;
      await onUpdate(action);
      closeModal();
  }

  const handleSuspendStudent = async (e: React.FormEvent) => {
      e.preventDefault();
      const student = students.find(s => s.studentId === suspStudent);
      if (!student) return;
      // This creates a major conduct event, a permission to leave, and implies a notification
      const action = `Issue a major penalty (Send Home / Suspension) to student '${student.name}' (ID: ${student.studentId}). Duration: ${suspDuration} days. Reason: ${suspReason}. Create a major conduct event, grant an 'Exit' permission, and send a message to the parent notifying them of the suspension.`;
      await onUpdate(action);
      closeModal();
  }
  
  const handleGenerateAllocation = async (type: 'dining' | 'dormitory') => {
      let action = '';
      if (type === 'dining') {
          action = "Generate a random dining hall seating arrangement for all students across 50 tables. Try to balance genders at tables. Populate the 'diningHallSeating' data."
      } else {
          action = "Generate a random dormitory allocation for all students. Assign all male students to 'Alpha' or 'Bravo' dormitories and all female students to 'Charlie' or 'Delta' dormitories. Each dormitory has 25 chambers. Populate the 'dormitoryAllocation' data."
      }
      await onUpdate(action);
  }

  const handleAssignRole = async () => {
      if (!studentToAssign) {
          alert("Please select a student.");
          return;
      }
      const action = `Assign the role of '${roleToAssign}' to the student with ID '${studentToAssign}'. Update their user record accordingly.`;
      await onUpdate(action);
      setStudentToAssign('');
  };
  
  const handleSendReport = async (studentName: string, incidentCount: number) => {
      const student = students.find(s => s.name === studentName);
      if (!student) return;
      const action = `Send a disciplinary report message to parent of '${student.name}' (Parent ID: ${student.parentId}) regarding ${incidentCount} recorded incidents.`;
      await onUpdate(action);
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    let action = '';
    if (commType === 'all') {
        action = `Send a message to ALL parents from DoD. Content: "${commMessage}"`;
    } else if (commType === 'class') {
        action = `Send a message to parents of Class '${commTarget}' from DoD. Content: "${commMessage}"`;
    } else {
        const student = students.find(s => s.studentId === commTarget);
        if (student) {
            action = `Send a message to parent of student '${student.name}' (Parent ID: ${student.parentId}) from DoD. Content: "${commMessage}"`;
        }
    }
    if (action) await onUpdate(action);
    closeModal();
};

  const renderModalContent = () => {
      if (modalView === 'announcement') {
          return (
            <form onSubmit={handlePostAnnouncement}>
                <textarea value={newAnnouncement} onChange={e => setNewAnnouncement(e.target.value)} rows={5} className="shadow-sm appearance-none border border-slate-300 rounded-lg w-full py-3 px-4 text-slate-700 leading-tight focus:outline-none focus:ring-2 focus:ring-sky-500" placeholder="Type your message here..." required />
                <button type="submit" disabled={isUpdating} className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline mt-6 transition-colors disabled:bg-sky-300">
                    {isUpdating ? 'Posting...' : 'Post'}
                </button>
            </form>
          )
      }
      if (modalView === 'permission') {
          return (
            <form onSubmit={handleGrantPermission} className="space-y-4">
                <div>
                    <label className="block text-slate-700 text-sm font-bold mb-2">Student</label>
                    <select value={permStudent} onChange={e => setPermStudent(e.target.value)} className="shadow-sm appearance-none border border-slate-300 rounded-lg w-full py-3 px-4 text-slate-700 leading-tight focus:outline-none focus:ring-2 focus:ring-sky-500" required>
                        <option value="" disabled>Select Student</option>
                        {students.map(s => <option key={s.id} value={s.studentId}>{s.name} ({s.class})</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-slate-700 text-sm font-bold mb-2">Type</label>
                    <select value={permType} onChange={e => setPermType(e.target.value)} className="shadow-sm appearance-none border border-slate-300 rounded-lg w-full py-3 px-4 text-slate-700 leading-tight focus:outline-none focus:ring-2 focus:ring-sky-500">
                        <option value="Exit">Exit (Outside School)</option>
                        <option value="Temporary">Temporary (Short Task)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-slate-700 text-sm font-bold mb-2">Destination/Task</label>
                    <input type="text" value={permDest} onChange={e => setPermDest(e.target.value)} className="shadow-sm appearance-none border border-slate-300 rounded-lg w-full py-3 px-4 text-slate-700 leading-tight focus:outline-none focus:ring-2 focus:ring-sky-500" required />
                </div>
                <div>
                    <label className="block text-slate-700 text-sm font-bold mb-2">Reason</label>
                    <input type="text" value={permReason} onChange={e => setPermReason(e.target.value)} className="shadow-sm appearance-none border border-slate-300 rounded-lg w-full py-3 px-4 text-slate-700 leading-tight focus:outline-none focus:ring-2 focus:ring-sky-500" required />
                </div>
                <button type="submit" disabled={isUpdating} className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline mt-6 transition-colors disabled:bg-sky-300">
                    {isUpdating ? 'Granting...' : 'Grant Permission'}
                </button>
            </form>
          )
      }
      if (modalView === 'suspension') {
          return (
              <form onSubmit={handleSuspendStudent} className="space-y-4">
                  <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-sm text-red-800 mb-4">
                      <h4 className="font-bold mb-1">Warning: Sending Student Home</h4>
                      <p>This action will issue a major penalty, grant an exit permission, and automatically notify the parent.</p>
                  </div>
                  <div>
                    <label className="block text-slate-700 text-sm font-bold mb-2">Student</label>
                    <select value={suspStudent} onChange={e => setSuspStudent(e.target.value)} className="shadow-sm appearance-none border border-slate-300 rounded-lg w-full py-3 px-4 text-slate-700" required>
                        <option value="" disabled>Select Student</option>
                        {students.map(s => <option key={s.id} value={s.studentId}>{s.name} ({s.class})</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-slate-700 text-sm font-bold mb-2">Duration (Days)</label>
                    <input type="number" min="1" value={suspDuration} onChange={e => setSuspDuration(e.target.value)} className="shadow-sm appearance-none border border-slate-300 rounded-lg w-full py-3 px-4 text-slate-700" required />
                </div>
                <div>
                    <label className="block text-slate-700 text-sm font-bold mb-2">Reason for Sending Home</label>
                    <input type="text" value={suspReason} onChange={e => setSuspReason(e.target.value)} className="shadow-sm appearance-none border border-slate-300 rounded-lg w-full py-3 px-4 text-slate-700" placeholder="e.g. Gross Misconduct, Fees Default" required />
                </div>
                <button type="submit" disabled={isUpdating} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline mt-6 transition-colors disabled:bg-red-300">
                    {isUpdating ? 'Processing...' : 'Send Student Home'}
                </button>
              </form>
          );
      }
      if (modalView === 'communication') {
        return (
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
        )
      }
      return null;
  }

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return (
            <div>
                <h2 className="text-3xl font-bold text-slate-800 mb-6">Director of Discipline Dashboard</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <StatCard title="Currently Sent Out" value={stats.sentOut} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>} subtext="students"/>
                    <StatCard title="Major Incidents" value={stats.majorIncidents} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>} subtext="total logged"/>
                    <StatCard title="Total Events Logged" value={conductEvents.length} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>} subtext="all time" />
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Students with Most Incidents</h3>
                    {stats.topOffenders.length > 0 ? (
                        <ul className="space-y-2">
                        {stats.topOffenders.map(([name, count]) => (
                            <li key={name} className="flex justify-between items-center p-3 bg-slate-50 rounded-md">
                                <span className="font-medium text-slate-700">{name}</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-red-600 bg-red-100 px-2 py-1 rounded-md text-sm">{count} incidents</span>
                                    <button onClick={() => handleSendReport(name, count)} className="text-xs text-sky-600 hover:underline">Report to Parent</button>
                                </div>
                            </li>
                        ))}
                        </ul>
                    ) : <p className="text-slate-500">No repeat incidents recorded yet.</p>}
                </div>
            </div>
        );
      case 'leadership':
          const currentHeadBoy = users.find(u => u.role === 'head_boy');
          const currentHeadGirl = users.find(u => u.role === 'head_girl');
          return (
              <div>
                  <h2 className="text-3xl font-bold text-slate-800 mb-6">Student Leadership</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                       <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center text-center">
                           <div className="bg-blue-100 text-blue-600 p-4 rounded-full mb-4">
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                           </div>
                           <h3 className="text-lg font-bold text-slate-800">Head Boy</h3>
                           <p className="text-xl text-blue-600 mt-2 font-semibold">{currentHeadBoy ? currentHeadBoy.name : 'Not Assigned'}</p>
                       </div>
                       <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center text-center">
                           <div className="bg-pink-100 text-pink-600 p-4 rounded-full mb-4">
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                           </div>
                           <h3 className="text-lg font-bold text-slate-800">Head Girl</h3>
                           <p className="text-xl text-pink-600 mt-2 font-semibold">{currentHeadGirl ? currentHeadGirl.name : 'Not Assigned'}</p>
                       </div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                      <h3 className="text-lg font-semibold text-slate-800 mb-4">Assign Role</h3>
                      <div className="flex flex-col md:flex-row items-end gap-4">
                          <div className="flex-1 w-full">
                              <label className="block text-sm font-medium text-slate-600 mb-1">Student</label>
                              <select value={studentToAssign} onChange={e => setStudentToAssign(e.target.value)} className="shadow-sm appearance-none border border-slate-300 rounded-lg w-full py-2 px-3 text-slate-700 leading-tight focus:outline-none focus:ring-2 focus:ring-sky-500">
                                  <option value="" disabled>Select student</option>
                                  {students.map(s => <option key={s.id} value={s.studentId}>{s.name} ({s.class})</option>)}
                              </select>
                          </div>
                          <div className="flex-1 w-full">
                              <label className="block text-sm font-medium text-slate-600 mb-1">Role</label>
                              <select value={roleToAssign} onChange={e => setRoleToAssign(e.target.value as any)} className="shadow-sm appearance-none border border-slate-300 rounded-lg w-full py-2 px-3 text-slate-700 leading-tight focus:outline-none focus:ring-2 focus:ring-sky-500">
                                  <option value="head_boy">Head Boy</option>
                                  <option value="head_girl">Head Girl</option>
                              </select>
                          </div>
                          <button onClick={handleAssignRole} disabled={isUpdating} className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-6 rounded-lg disabled:bg-sky-300 w-full md:w-auto">
                              Assign
                          </button>
                      </div>
                  </div>
              </div>
          );
      case 'conduct':
        const filteredEvents = conductEvents.filter(event => 
            (event.studentName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (event.teacherName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (event.reason || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
        return (
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-slate-800">Conduct Log</h2>
                    <input 
                        type="text" 
                        placeholder="Search students, teachers, reasons..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="shadow-sm appearance-none border border-slate-300 rounded-lg w-1/3 py-2 px-4 text-slate-700 leading-tight focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm text-left text-slate-500">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                            <tr>
                                <th scope="col" className="px-6 py-3">Student</th>
                                <th scope="col" className="px-6 py-3">Class</th>
                                <th scope="col" className="px-6 py-3">Teacher</th>
                                <th scope="col" className="px-6 py-3">Reason & Severity</th>
                                <th scope="col" className="px-6 py-3">Status</th>
                                <th scope="col" className="px-6 py-3">Time</th>
                                <th scope="col" className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                        {[...filteredEvents].reverse().map(event => (
                            <tr key={event.id} className="bg-white border-b border-slate-200 last:border-b-0 hover:bg-slate-50">
                                <td className="px-6 py-4 font-medium text-slate-900">{event.studentName}</td>
                                <td className="px-6 py-4">{event.className}</td>
                                <td className="px-6 py-4">{event.teacherName}</td>
                                <td className="px-6 py-4">{event.reason} <span className={cn("font-semibold", event.severity === 'major' ? 'text-red-600' : 'text-amber-600')}>({event.severity})</span></td>
                                <td className="px-6 py-4">
                                    <span className={cn("px-2 py-1 text-xs font-medium rounded-full", event.status === 'sent_out' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800')}>{event.status === 'sent_out' ? 'Sent Out' : 'Returned'}</span>
                                </td>
                                <td className="px-6 py-4 text-xs">
                                    <p>Sent: {formatDate(event.sentAt)}</p>
                                    {event.returnedAt && <p>Ret: {formatDate(event.returnedAt)}</p>}
                                </td>
                                <td className="px-6 py-4">
                                    <button onClick={() => onUpdate(`Delete conduct event with id ${event.id}`)} className="font-medium text-red-600 hover:underline">Remove</button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    {filteredEvents.length === 0 && <p className="text-center p-6 text-slate-500">No conduct events match your search.</p>}
                </div>
            </div>
        );
     case 'allocations':
        return (
            <div>
                 <h2 className="text-3xl font-bold text-slate-800 mb-6">Facility Allocations</h2>
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-slate-800">Dining Hall Seating</h3>
                            <button onClick={() => handleGenerateAllocation('dining')} disabled={isUpdating} className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-lg text-sm disabled:bg-sky-300">Generate New Seating</button>
                        </div>
                        <div className="h-96 overflow-y-auto border rounded-lg">
                           <table className="w-full text-sm text-left text-slate-500">
                                <thead className="text-xs text-slate-700 uppercase bg-slate-100 sticky top-0"><tr><th className="px-4 py-2">Student Name</th><th className="px-4 py-2">Table #</th></tr></thead>
                                <tbody>
                                    {diningHallSeating.map(s => <tr key={s.studentId} className="border-b"><td className="px-4 py-2 font-medium">{s.studentName}</td><td className="px-4 py-2">{s.tableNumber}</td></tr>)}
                                </tbody>
                           </table>
                           {diningHallSeating.length === 0 && <p className="text-center p-6 text-slate-500">No dining hall seating has been generated.</p>}
                        </div>
                    </div>
                     <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-slate-800">Dormitory Allocation</h3>
                             <button onClick={() => handleGenerateAllocation('dormitory')} disabled={isUpdating} className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-lg text-sm disabled:bg-sky-300">Generate New Allocation</button>
                        </div>
                         <div className="h-96 overflow-y-auto border rounded-lg">
                           <table className="w-full text-sm text-left text-slate-500">
                                <thead className="text-xs text-slate-700 uppercase bg-slate-100 sticky top-0"><tr><th className="px-4 py-2">Student Name</th><th className="px-4 py-2">Dormitory</th><th className="px-4 py-2">Chamber #</th></tr></thead>
                                <tbody>
                                     {dormitoryAllocation.map(s => <tr key={s.studentId} className="border-b"><td className="px-4 py-2 font-medium">{s.studentName}</td><td className="px-4 py-2">{s.dormitory}</td><td className="px-4 py-2">{s.chamber}</td></tr>)}
                                </tbody>
                           </table>
                           {dormitoryAllocation.length === 0 && <p className="text-center p-6 text-slate-500">No dormitory allocation has been generated.</p>}
                        </div>
                    </div>
                 </div>
            </div>
        );
    case 'permissions':
        return (
            <div>
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-slate-800">Student Permissions & Penalties</h2>
                    <div className="flex gap-4">
                         <button onClick={() => openModal('suspension')} className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700 transition-colors">Send Home / Suspend</button>
                         <button onClick={() => openModal('permission')} className="bg-sky-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-sky-700 transition-colors">Grant Permission</button>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm text-left text-slate-500">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                            <tr>
                                <th scope="col" className="px-6 py-3">Student</th>
                                <th scope="col" className="px-6 py-3">Type</th>
                                <th scope="col" className="px-6 py-3">Destination</th>
                                <th scope="col" className="px-6 py-3">Reason</th>
                                <th scope="col" className="px-6 py-3">Granted By</th>
                                <th scope="col" className="px-6 py-3">Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {permissions.map(p => (
                                <tr key={p.id} className="bg-white border-b border-slate-200 last:border-b-0 hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-900">{p.studentName}</td>
                                    <td className="px-6 py-4"><span className={cn("px-2 py-1 text-xs rounded-full", p.type === 'Exit' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800')}>{p.type}</span></td>
                                    <td className="px-6 py-4">{p.destination}</td>
                                    <td className="px-6 py-4">{p.reason}</td>
                                    <td className="px-6 py-4">{p.grantedBy}</td>
                                    <td className="px-6 py-4">{formatDate(p.issuedAt)}</td>
                                </tr>
                            ))}
                             {permissions.length === 0 && <tr><td colSpan={6} className="text-center p-6">No active permissions.</td></tr>}
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
                    <button onClick={() => openModal('communication')} className="bg-sky-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-sky-700 transition-colors">Send Message</button>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                     <h3 className="text-lg font-semibold text-slate-800 mb-4">Message History</h3>
                     <div className="space-y-4">
                        {messages.filter(m => m.senderId === user.username).slice().reverse().map(msg => (
                            <div key={msg.id} className="border-b pb-4 last:border-b-0">
                                <div className="flex justify-between items-start">
                                    <span className="font-bold text-slate-700">{msg.recipientRole} ({msg.recipientId || 'All'})</span>
                                    <span className="text-xs text-slate-500">{formatDate(msg.sentAt)}</span>
                                </div>
                                <p className="text-slate-600 mt-1">{msg.content}</p>
                            </div>
                        ))}
                         {messages.filter(m => m.senderId === user.username).length === 0 && <p className="text-slate-500">No messages sent yet.</p>}
                     </div>
                </div>
            </div>
        );
    case 'announcements':
        return (
             <div>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-slate-800">Issue Orders & Announcements</h2>
                     <button onClick={() => openModal('announcement')} className="bg-sky-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-sky-700 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                        New Post
                    </button>
                </div>
                <div className="space-y-4">
                {announcements.length > 0 ? [...announcements].reverse().map(a => (
                    <div key={a.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex justify-between items-start">
                        <div>
                            <p className="text-slate-700">{a.text}</p>
                            <p className="text-xs text-slate-500 mt-2">Posted by <span className="font-medium">{a.postedBy} ({a.role})</span> on {formatDate(a.postedAt)}</p>
                        </div>
                        {a.role === 'dod' && <button onClick={() => onUpdate(`Delete announcement with id ${a.id}`)} className="font-medium text-red-500 hover:text-red-700 text-sm">Delete</button>}
                    </div>
                )) : <div className="text-center py-10 bg-white rounded-xl border border-slate-200"><p className="text-slate-500">No announcements have been posted yet.</p></div>}
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
      {isModalOpen && <Modal title={modalView === 'announcement' ? "New Announcement/Order" : modalView === 'communication' ? "Send Message" : modalView === 'suspension' ? "Suspend Student" : "Grant Permission"} onClose={closeModal}>
        {renderModalContent()}
      </Modal>}
      <div className="flex h-screen bg-slate-50 text-slate-800">
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
          <div className="p-6 text-center border-b border-slate-200">
            <h1 className="text-2xl font-bold text-sky-600">I Perform</h1>
            <p className="text-sm text-slate-500">DoD Portal</p>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            <NavLink view="dashboard" activeView={activeView} setActiveView={setActiveView}><span>Dashboard</span></NavLink>
            <NavLink view="leadership" activeView={activeView} setActiveView={setActiveView}><span>Student Leadership</span></NavLink>
            <NavLink view="conduct" activeView={activeView} setActiveView={setActiveView}><span>Conduct Log</span></NavLink>
            <NavLink view="permissions" activeView={activeView} setActiveView={setActiveView}><span>Permissions & Penalties</span></NavLink>
            <NavLink view="allocations" activeView={activeView} setActiveView={setActiveView}><span>Allocations</span></NavLink>
            <NavLink view="communication" activeView={activeView} setActiveView={setActiveView}><span>Communication</span></NavLink>
            <NavLink view="announcements" activeView={activeView} setActiveView={setActiveView}><span>Announcements</span></NavLink>
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

export default DoDDashboard;
