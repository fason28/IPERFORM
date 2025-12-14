
import React, { useState } from 'react';
import type { SchoolData, User, ConductEvent } from '../../types';
import Spinner from '../Spinner';

// Helper for dynamic class names
const cn = (...classes: (string | boolean)[]) => classes.filter(Boolean).join(' ');

interface PrefectDashboardProps {
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

const PrefectDashboard: React.FC<PrefectDashboardProps> = ({ user, data, onUpdate, onLogout, onGoHome, isUpdating, updateError }) => {
    const [activeView, setActiveView] = useState('dashboard');

    if (!data) return <div className="p-10 flex justify-center"><Spinner /></div>;

    // Safe access to data arrays to prevent white screen crashes
    const sentOutStudents = (data.conductEvents || []).filter(e => e && e.status === 'sent_out');

    const handleMarkReturned = async (event: ConductEvent) => {
        await onUpdate(`Mark conduct event with id ${event.id} as 'returned'.`);
    };

    const renderView = () => {
        switch (activeView) {
            case 'dashboard':
                return (
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800 mb-6">Prefect's Dashboard</h2>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center">
                            <h3 className="text-slate-500 font-medium">Students Currently Sent Out</h3>
                            <p className="text-6xl font-bold text-sky-600 mt-2">{sentOutStudents.length}</p>
                        </div>
                    </div>
                );
            case 'tickets':
                return (
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800 mb-6">Ticket Correction</h2>
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                          <table className="w-full text-sm text-left text-slate-500">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Student Name</th>
                                    <th scope="col" className="px-6 py-3">Class</th>
                                    <th scope="col" className="px-6 py-3">Sent By</th>
                                    <th scope="col" className="px-6 py-3">Reason</th>
                                    <th scope="col" className="px-6 py-3">Time Sent</th>
                                    <th scope="col" className="px-6 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                            {sentOutStudents.map(event => (
                                <tr key={event.id} className="bg-white border-b border-slate-200 last:border-b-0 hover:bg-slate-50">
                                  <td className="px-6 py-4 font-medium text-slate-900">{event.studentName}</td>
                                  <td className="px-6 py-4">{event.className}</td>
                                  <td className="px-6 py-4">{event.teacherName}</td>
                                  <td className="px-6 py-4">{event.reason}</td>
                                  <td className="px-6 py-4">{new Date(event.sentAt).toLocaleTimeString()}</td>
                                  <td className="px-6 py-4">
                                    <button 
                                      onClick={() => handleMarkReturned(event)} 
                                      disabled={isUpdating} 
                                      className="bg-green-500 hover:bg-green-600 text-white text-sm font-bold py-1 px-3 rounded-lg disabled:bg-green-300">
                                        Mark Returned
                                    </button>
                                  </td>
                                </tr>
                            ))}
                            </tbody>
                          </table>
                          {sentOutStudents.length === 0 && <p className="p-6 text-center text-slate-500">No students are currently sent out of class.</p>}
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
                    <p className="text-sm text-slate-500 capitalize">{user.role.replace('_', ' ')} Portal</p>
                    <p className="font-semibold text-slate-700 mt-2">{user.name}</p>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <NavLink view="dashboard" activeView={activeView} setActiveView={setActiveView}><span>Dashboard</span></NavLink>
                    <NavLink view="tickets" activeView={activeView} setActiveView={setActiveView}><span>Ticket Correction</span></NavLink>
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

export default PrefectDashboard;
