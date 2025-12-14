
import React, { useState } from 'react';
import type { SchoolData, User } from '../../types';
import Spinner from '../Spinner';

const SecretaryDashboard: React.FC<{ user: User; data: SchoolData; onUpdate: (action: string) => Promise<any>; onLogout: () => void; onGoHome: () => void; isUpdating: boolean; updateError: string | null; }> = ({ user, data, onUpdate, onLogout, onGoHome, isUpdating, updateError }) => {
    const [conductStudent, setConductStudent] = useState('');
    const [conductScore, setConductScore] = useState('');
    const [conductReason, setConductReason] = useState('');

    const handleConductUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        const action = `Record a conduct mark/score for student ID '${conductStudent}'. Score change: ${conductScore}. Reason: "${conductReason}". Recorded by Secretary '${user.name}'.`;
        await onUpdate(action);
        setConductStudent(''); setConductScore(''); setConductReason('');
    }

    return (
        <div className="flex h-screen bg-slate-50 text-slate-800">
            <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
                <div className="p-6 text-center border-b border-slate-200">
                    <h1 className="text-2xl font-bold text-sky-600">I Perform</h1>
                    <p className="text-sm text-slate-500">Secretary</p>
                </div>
                <div className="p-4 mt-auto border-t border-slate-200 space-y-2">
                     <button onClick={onGoHome} className="w-full bg-slate-100 text-slate-600 font-semibold py-2.5 px-4 rounded-lg hover:bg-sky-100 hover:text-sky-700 transition-colors">Back to Home</button>
                    <button onClick={onLogout} className="w-full bg-slate-100 text-slate-600 font-semibold py-2.5 px-4 rounded-lg hover:bg-red-100 hover:text-red-700 transition-colors">Logout</button>
                </div>
            </aside>
            <main className="flex-1 p-10 overflow-y-auto relative">
                {isUpdating && <div className="absolute top-4 right-10 bg-sky-500 text-white p-3 rounded-lg shadow-lg z-50 flex items-center gap-2"><Spinner size="sm" /> <span>Updating...</span></div>}
                
                <h2 className="text-3xl font-bold text-slate-800 mb-6">School Overview</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
                        <ul className="space-y-4">
                            {(data.announcements || []).slice().reverse().slice(0, 5).map(a => (
                                <li key={a.id} className="border-b pb-2">
                                    <p className="text-sm font-semibold">{a.postedBy} ({a.role})</p>
                                    <p className="text-slate-600">{a.text}</p>
                                    <p className="text-xs text-slate-400">{new Date(a.postedAt).toLocaleString()}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                    
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="text-lg font-bold mb-4">Manage Conduct</h3>
                        <form onSubmit={handleConductUpdate} className="space-y-4">
                             <div><label className="block text-slate-700 text-sm font-bold mb-2">Student</label><select value={conductStudent} onChange={e => setConductStudent(e.target.value)} className="w-full border p-2 rounded" required><option value="">Select Student</option>{data.students.map(s => <option key={s.id} value={s.studentId}>{s.name}</option>)}</select></div>
                            <div><label className="block text-slate-700 text-sm font-bold mb-2">Score Change</label><input type="number" value={conductScore} onChange={e => setConductScore(e.target.value)} className="w-full border p-2 rounded" required /></div>
                            <div><label className="block text-slate-700 text-sm font-bold mb-2">Reason</label><input type="text" value={conductReason} onChange={e => setConductReason(e.target.value)} className="w-full border p-2 rounded" required /></div>
                            <button disabled={isUpdating} className="w-full bg-sky-600 text-white py-2 rounded font-bold hover:bg-sky-700 disabled:opacity-50">Update Conduct</button>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default SecretaryDashboard;
