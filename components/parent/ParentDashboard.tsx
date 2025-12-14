
import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { SchoolData, User, Student, Mark, ConductEvent } from '../../types';
import Spinner from '../Spinner';

// Helper for dynamic class names
const cn = (...classes: (string | boolean)[]) => classes.filter(Boolean).join(' ');

interface ParentDashboardProps {
  user: User;
  data: SchoolData;
  onUpdate: (action: string) => Promise<any>;
  onLogout: () => void;
  onGoHome: () => void;
  isUpdating: boolean;
  updateError: string | null;
}

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

const StatCard: React.FC<{ title: string; value: string | number; }> = ({ title, value }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center">
        <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
        <p className="text-4xl font-bold text-sky-600 mt-1">{value}</p>
    </div>
);


const ParentDashboard: React.FC<ParentDashboardProps> = ({ user, data, onUpdate, onLogout, onGoHome, isUpdating, updateError }) => {
    const [activeView, setActiveView] = useState('dashboard');
    
    // Form state for messaging
    const [recipient, setRecipient] = useState<'principal' | 'dos' | 'dod'>('principal');
    const [messageContent, setMessageContent] = useState('');
    
    // Chat state
    const [groupMessageContent, setGroupMessageContent] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    const child = useMemo(() => data.students.find(s => s.parentId === user.username), [data.students, user.username]);
    
    const childStats = useMemo(() => {
        if (!child) return { average: 'N/A', conductEvents: 0 };
        const marks = data.marks.filter(m => m.studentId === child.studentId);
        const total = marks.reduce((sum, m) => sum + m.mark, 0);
        const average = marks.length > 0 ? (total / marks.length).toFixed(1) + '%' : 'N/A';
        const conductEvents = data.conductEvents.filter(c => c.studentId === child.studentId).length;
        return { average, conductEvents };
    }, [child, data.marks, data.conductEvents]);

    const groupMessages = useMemo(() => {
        if (!child) return [];
        return (data.groupMessages || []).filter(m => m.className === child.class);
    }, [data.groupMessages, child]);

    useEffect(() => {
        if (activeView === 'class-group' && chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [groupMessages, activeView]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!child) return;
        const action = `Parent '${user.name}' (ID: ${user.username}) is sending a message to the ${recipient}: "${messageContent}"`;
        await onUpdate(action);
        setMessageContent('');
    };

    const handleSendGroupMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!child) return;
        const action = `Parent '${user.name}' (ID: ${user.username}) is posting to the class group chat for '${child.class}'. Content: "${groupMessageContent}"`;
        await onUpdate(action);
        setGroupMessageContent('');
    };
    
    if (!child) {
        return <div className="p-8 text-center text-red-600">Could not find a student linked to your parent account ({user.username}). Please contact administration.</div>;
    }

    const renderView = () => {
        switch (activeView) {
            case 'dashboard':
                return (
                     <div>
                        <h2 className="text-3xl font-bold text-slate-800 mb-2">Parent Dashboard</h2>
                        <p className="text-slate-600 mb-6">Viewing records for: <span className="font-semibold">{child.name}</span></p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <StatCard title="Overall Average" value={childStats.average} />
                            <StatCard title="Conduct Events" value={childStats.conductEvents} />
                        </div>
                         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent School Announcements</h3>
                            <div className="space-y-3">
                                {[...data.announcements].reverse().slice(0,3).map(a => (
                                    <div key={a.id} className="p-3 bg-slate-50 rounded-md">
                                        <p className="text-sm text-slate-700">{a.text}</p>
                                        <p className="text-xs text-slate-500 mt-1">By {a.postedBy} on {new Date(a.postedAt).toLocaleDateString()}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 'academics':
                 const childMarks = data.marks.filter(m => m.studentId === child.studentId);
                 return (
                     <div>
                        <h2 className="text-3xl font-bold text-slate-800 mb-6">{child.name}'s Academic Report</h2>
                         <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <table className="w-full text-sm text-left text-slate-500">
                                <thead className="text-xs text-slate-700 uppercase bg-slate-100"><tr><th className="px-6 py-3">Subject</th><th className="px-6 py-3">Mark</th><th className="px-6 py-3">Uploaded By</th><th className="px-6 py-3">Date</th></tr></thead>
                                <tbody>
                                    {childMarks.map(mark => (
                                        <tr key={mark.id} className="bg-white border-b hover:bg-slate-50"><td className="px-6 py-4 font-medium">{mark.subject}</td><td className="px-6 py-4 font-bold">{mark.mark}%</td><td className="px-6 py-4">{mark.uploadedBy}</td><td className="px-6 py-4">{new Date(mark.uploadedAt).toLocaleDateString()}</td></tr>
                                    ))}
                                </tbody>
                            </table>
                             {childMarks.length === 0 && <p className="text-center p-6 text-slate-500">No marks have been recorded for {child.name} yet.</p>}
                        </div>
                    </div>
                 );
            case 'discipline':
                const childConduct = data.conductEvents.filter(e => e.studentId === child.studentId);
                 return (
                     <div>
                        <h2 className="text-3xl font-bold text-slate-800 mb-6">{child.name}'s Conduct History</h2>
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <table className="w-full text-sm text-left text-slate-500">
                                <thead className="text-xs text-slate-700 uppercase bg-slate-100"><tr><th className="px-6 py-3">Date</th><th className="px-6 py-3">Reason</th><th className="px-6 py-3">Severity</th><th className="px-6 py-3">Status</th></tr></thead>
                                <tbody>
                                    {[...childConduct].reverse().map(event => (<tr key={event.id} className="bg-white border-b hover:bg-slate-50"><td className="px-6 py-4">{new Date(event.sentAt).toLocaleString()}</td><td className="px-6 py-4">{event.reason}</td><td className="px-6 py-4 font-semibold">{event.severity}</td><td className="px-6 py-4">{event.status.replace('_', ' ')}</td></tr>))}
                                </tbody>
                            </table>
                            {childConduct.length === 0 && <p className="text-center p-6 text-slate-500">No conduct events recorded for {child.name}.</p>}
                        </div>
                    </div>
                 );
             case 'communication':
                const sentMessages = data.messages.filter(m => m.senderId === user.username);
                return (
                    <div>
                         <h2 className="text-3xl font-bold text-slate-800 mb-6">Communicate with School</h2>
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                <h3 className="text-lg font-semibold text-slate-800 mb-4">Send a New Message</h3>
                                <form onSubmit={handleSendMessage} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">Recipient</label>
                                        <select value={recipient} onChange={e => setRecipient(e.target.value as any)} className="shadow-sm appearance-none border border-slate-300 rounded-lg w-full py-2 px-3 text-slate-700">
                                            <option value="principal">Principal</option>
                                            <option value="dos">Director of Studies</option>
                                            <option value="dod">Dean of Discipline</option>
                                        </select>
                                    </div>
                                    <div>
                                         <label className="block text-sm font-medium text-slate-600 mb-1">Message</label>
                                         <textarea value={messageContent} onChange={e => setMessageContent(e.target.value)} rows={5} required className="shadow-sm appearance-none border border-slate-300 rounded-lg w-full py-2 px-3 text-slate-700" />
                                    </div>
                                    <button type="submit" disabled={isUpdating} className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-sky-300">
                                        {isUpdating ? 'Sending...' : 'Send Message'}
                                    </button>
                                </form>
                             </div>
                             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                 <h3 className="text-lg font-semibold text-slate-800 mb-4">Sent Messages</h3>
                                 <div className="space-y-3 h-96 overflow-y-auto">
                                     {sentMessages.length > 0 ? [...sentMessages].reverse().map(msg => (
                                         <div key={msg.id} className="p-3 bg-slate-50 rounded-md">
                                             <p className="text-sm text-slate-700">{msg.content}</p>
                                             <p className="text-xs text-slate-500 mt-1">To: {msg.recipientRole} on {new Date(msg.sentAt).toLocaleString()}</p>
                                         </div>
                                     )) : <p className="text-slate-500">You have not sent any messages.</p>}
                                 </div>
                             </div>
                         </div>
                    </div>
                );
            case 'class-group':
                return (
                    <div className="h-[calc(100vh-120px)] flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                             <h2 className="text-3xl font-bold text-slate-800">{child.class} Parent Group</h2>
                             <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">{groupMessages.length} messages</span>
                        </div>
                        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50">
                                {groupMessages.map((msg) => {
                                    const isMe = msg.senderId === user.username;
                                    return (
                                        <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                                            <div className={cn("max-w-[70%] rounded-lg p-3", isMe ? "bg-sky-100 text-slate-800" : "bg-white text-slate-800 border border-slate-200")}>
                                                {!isMe && <p className="text-xs font-bold text-sky-600 mb-1">{msg.senderName}</p>}
                                                <p className="text-sm">{msg.content}</p>
                                                <p className="text-[10px] text-slate-400 mt-1 text-right">{new Date(msg.sentAt).toLocaleTimeString()}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                                {groupMessages.length === 0 && <div className="text-center text-slate-500 mt-10">No messages in this group yet. Be the first to say hello!</div>}
                                <div ref={chatEndRef} />
                            </div>
                            <div className="p-4 bg-white border-t border-slate-200">
                                <form onSubmit={handleSendGroupMessage} className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={groupMessageContent} 
                                        onChange={(e) => setGroupMessageContent(e.target.value)} 
                                        placeholder="Type a message to the group..." 
                                        className="flex-1 border border-slate-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                                        required
                                    />
                                    <button type="submit" disabled={isUpdating} className="bg-sky-600 hover:bg-sky-700 text-white rounded-full p-2 px-4 disabled:bg-sky-300 transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                );
            default: return null;
        }
    }

    return (
        <div className="flex h-screen bg-slate-50 text-slate-800">
            <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
                <div className="p-6 text-center border-b border-slate-200">
                    <h1 className="text-2xl font-bold text-sky-600">I Perform</h1>
                    <p className="text-sm text-slate-500">Parent Portal</p>
                    <p className="font-semibold text-slate-700 mt-2">{user.name}</p>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <NavLink view="dashboard" activeView={activeView} setActiveView={setActiveView}><span>Dashboard</span></NavLink>
                    <NavLink view="academics" activeView={activeView} setActiveView={setActiveView}><span>Academics</span></NavLink>
                    <NavLink view="discipline" activeView={activeView} setActiveView={setActiveView}><span>Discipline</span></NavLink>
                    <NavLink view="communication" activeView={activeView} setActiveView={setActiveView}><span>Communication</span></NavLink>
                    <NavLink view="class-group" activeView={activeView} setActiveView={setActiveView}><span>Class Group</span></NavLink>
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
    );
};

export default ParentDashboard;
