
import React, { useState } from 'react';

interface SchoolRegistrationProps {
    onRegister: (schoolName: string, address: string, adminName: string, adminEmail: string, adminPass: string) => void;
    onCancel: () => void;
    isLoading: boolean;
}

const SchoolRegistration: React.FC<SchoolRegistrationProps> = ({ onRegister, onCancel, isLoading }) => {
    const [schoolName, setSchoolName] = useState('');
    const [address, setAddress] = useState('');
    const [adminName, setAdminName] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        onRegister(schoolName, address, adminName, adminEmail, password);
    };

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden">
                <div className="bg-sky-600 p-6 text-center">
                    <h2 className="text-3xl font-bold text-white">Register Your School</h2>
                    <p className="text-sky-100 mt-2">Join the I Perform network and digitize your institution.</p>
                </div>
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">School Details</h3>
                            <div>
                                <label className="block text-slate-600 text-sm font-bold mb-1">School Name</label>
                                <input required type="text" value={schoolName} onChange={e => setSchoolName(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 outline-none" placeholder="e.g. Green Valley High" />
                            </div>
                            <div>
                                <label className="block text-slate-600 text-sm font-bold mb-1">Address</label>
                                <input required type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 outline-none" placeholder="City, Country" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">Administrator (Principal)</h3>
                            <div>
                                <label className="block text-slate-600 text-sm font-bold mb-1">Full Name</label>
                                <input required type="text" value={adminName} onChange={e => setAdminName(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 outline-none" placeholder="Your Name" />
                            </div>
                            <div>
                                <label className="block text-slate-600 text-sm font-bold mb-1">Email</label>
                                <input required type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 outline-none" placeholder="admin@school.com" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-100">
                        <h3 className="text-lg font-semibold text-slate-700">Security</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-slate-600 text-sm font-bold mb-1">Password</label>
                                <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 outline-none" placeholder="••••••" />
                            </div>
                            <div>
                                <label className="block text-slate-600 text-sm font-bold mb-1">Confirm Password</label>
                                <input required type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 outline-none" placeholder="••••••" />
                            </div>
                        </div>
                    </div>

                    {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm font-medium">{error}</div>}

                    <div className="flex gap-4 pt-4">
                        <button type="button" onClick={onCancel} className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-3 px-4 rounded-lg transition-colors">Cancel</button>
                        <button type="submit" disabled={isLoading} className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-sky-300 flex justify-center items-center gap-2">
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Setting up School...
                                </>
                            ) : "Register School"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SchoolRegistration;
