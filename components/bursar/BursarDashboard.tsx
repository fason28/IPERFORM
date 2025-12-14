
import React, { useState, useMemo } from 'react';
import type { SchoolData, User, FeeAccount } from '../../types';
import Spinner from '../Spinner';

// Helper for dynamic class names
const cn = (...classes: (string | boolean)[]) => classes.filter(Boolean).join(' ');

interface BursarDashboardProps {
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

const BursarDashboard: React.FC<BursarDashboardProps> = ({ user, data, onUpdate, onLogout, onGoHome, isUpdating, updateError }) => {
    const [activeView, setActiveView] = useState('dashboard');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalView, setModalView] = useState<'recordPayment' | 'generateReport' | 'recordExpense' | 'addStaff' | 'tax' | 'communication' | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [reportContent, setReportContent] = useState('');

    // Form state for payment
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank Transfer' | 'Mobile Money' | 'Cheque'>('Cash');
    const [paymentType, setPaymentType] = useState<'Tuition' | 'Boarding' | 'Exam' | 'Transport' | 'Other'>('Tuition');
    const [paymentReference, setPaymentReference] = useState('');

    // Form state for expenses
    const [expenseDesc, setExpenseDesc] = useState('');
    const [expenseAmount, setExpenseAmount] = useState('');
    const [expenseCategory, setExpenseCategory] = useState<'Salaries' | 'Supplies' | 'Maintenance' | 'Utilities' | 'Events' | 'Tax' | 'Other'>('Supplies');

    // Form state for staff
    const [newStaffName, setNewStaffName] = useState('');
    const [newStaffUsername, setNewStaffUsername] = useState('');
    
    // Form state for tax
    const [taxBaseAmount, setTaxBaseAmount] = useState('');
    const [taxDescription, setTaxDescription] = useState('Monthly VAT');

    // Communication Form State
    const [commType, setCommType] = useState<'all' | 'class' | 'single'>('all');
    const [commTarget, setCommTarget] = useState(''); // Class name or Student ID
    const [commMessage, setCommMessage] = useState('');

    const financialStats = useMemo(() => {
        if (!data) return { totalExpected: 0, totalCollected: 0, totalOutstanding: 0, totalExpenses: 0, netBalance: 0 };
        const totalExpected = (data.feeAccounts || []).reduce((sum, acc) => sum + acc.totalFees, 0);
        const totalCollected = (data.feeAccounts || []).reduce((sum, acc) => sum + acc.amountPaid, 0);
        const totalOutstanding = totalExpected - totalCollected;
        const totalExpenses = (data.expenses || []).reduce((sum, exp) => sum + exp.amount, 0);
        const netBalance = totalCollected - totalExpenses;
        return { totalExpected, totalCollected, totalOutstanding, totalExpenses, netBalance };
    }, [data]);

    const openModal = (view: 'recordPayment' | 'generateReport' | 'recordExpense' | 'addStaff' | 'tax' | 'communication', studentId?: string) => {
        setModalView(view);
        setIsModalOpen(true);
        if (view === 'recordPayment') {
            setSelectedStudentId(studentId || (data.students && data.students.length > 0 ? data.students[0].studentId : ''));
        }
        if (view === 'communication' && data.classes && data.classes.length > 0) {
            setCommTarget(data.classes[0].name);
        }
    };
    
    const closeModal = () => {
        setIsModalOpen(false);
        setModalView(null);
        setReportContent('');
        // Reset forms
        setSelectedStudentId('');
        setPaymentAmount('');
        setPaymentMethod('Cash');
        setPaymentType('Tuition');
        setPaymentReference('');
        setExpenseDesc('');
        setExpenseAmount('');
        setExpenseCategory('Supplies');
        setNewStaffName('');
        setNewStaffUsername('');
        setTaxBaseAmount('');
        setTaxDescription('Monthly VAT');
        setCommMessage('');
        setCommTarget('');
        setCommType('all');
    };
    
    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const student = (data.students || []).find(s => s.studentId === selectedStudentId);
        if (!student) return;

        const action = `Record a payment for student '${student.name}' (ID: ${student.studentId}). Amount: ${paymentAmount}, Method: ${paymentMethod}, Type: ${paymentType}, Reference: ${paymentReference || 'N/A'}. The payment was received by '${user.name}'.`;
        await onUpdate(action);
        closeModal();
    };

    const handleExpenseSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const action = `Record a school expense. Category: ${expenseCategory}, Description: "${expenseDesc}", Amount: ${expenseAmount}, Recorded by: '${user.name}'.`;
        await onUpdate(action);
        closeModal();
    };

    const handleAddStaffSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const action = `Create a new user with role 'bursar'. Name: '${newStaffName}', Username: '${newStaffUsername}', Password: 'bur123', mustChangePassword: true.`;
        await onUpdate(action);
        closeModal();
    };
    
    const handleTaxSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const action = `Record a tax payment expense. Category: 'Tax', Description: "${taxDescription}", Amount: ${taxBaseAmount}, Recorded by: '${user.name}'.`;
        await onUpdate(action);
        closeModal();
    }
    
    const autoCalculateTax = () => {
        if (!taxBaseAmount) return;
        const amount = parseFloat(taxBaseAmount);
        // Assume 16% Tax
        setTaxBaseAmount((amount * 0.16).toFixed(2));
    }

    const handleGenerateReport = async (reportType: 'defaulters' | 'daily' | 'monthly') => {
        let action = '';
        switch(reportType) {
            case 'defaulters':
                action = "Generate a fee defaulters list for all classes, formatted as a markdown report.";
                break;
            case 'daily':
                action = `Generate a daily collection report for today, received by '${user.name}', formatted as markdown.`;
                break;
            case 'monthly':
                 action = `Generate a monthly financial summary for the current month, generated by '${user.name}', formatted as markdown.`;
                 break;
        }
        
        openModal('generateReport');
        setReportContent(''); // Clear previous report
        const updatedData = await onUpdate(action);
        const bursarAnnouncements = updatedData.announcements.filter((a: any) => a.role === 'bursar');
        const lastReport = bursarAnnouncements[bursarAnnouncements.length - 1]?.text || 'No report generated.';
        setReportContent(lastReport);
    };
    
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        let action = '';
        if (commType === 'all') {
            action = `Send a message to ALL parents from Bursar. Content: "${commMessage}"`;
        } else if (commType === 'class') {
            action = `Send a message to parents of Class '${commTarget}' from Bursar. Content: "${commMessage}"`;
        } else {
            const student = (data.students || []).find(s => s.studentId === commTarget);
            if (student) {
                action = `Send a message to parent of student '${student.name}' (Parent ID: ${student.parentId}) from Bursar. Content: "${commMessage}"`;
            }
        }
        if (action) await onUpdate(action);
        closeModal();
    };

    const handleSendParentReport = async (account: FeeAccount) => {
        const student = (data.students || []).find(s => s.studentId === account.studentId);
        if(!student || !student.parentId) {
            alert("Parent account not found for this student.");
            return;
        }
        const action = `Send a message to parent '${student.parentId}' regarding the fee status of '${student.name}'. Status: ${account.status}, Paid: ${account.amountPaid}, Balance: ${account.balance}.`;
        await onUpdate(action);
    }

    const renderModalContent = () => {
        if (modalView === 'recordPayment') {
            return (
                 <form onSubmit={handlePaymentSubmit} className="space-y-4">
                    <div>
                        <label className="block text-slate-700 text-sm font-bold mb-2">Student</label>
                         <select value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)} className="shadow-sm appearance-none border border-slate-300 rounded-lg w-full py-3 px-4 text-slate-700 leading-tight focus:outline-none focus:ring-2 focus:ring-sky-500" required>
                            <option value="" disabled>Select a student</option>
                            {(data.students || []).map(s => <option key={s.id} value={s.studentId}>{s.name} ({s.studentId})</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-slate-700 text-sm font-bold mb-2">Amount Paid</label>
                        <input value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} type="number" min="1" className="shadow-sm appearance-none border border-slate-300 rounded-lg w-full py-3 px-4 text-slate-700 leading-tight focus:outline-none focus:ring-2 focus:ring-sky-500" required />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-slate-700 text-sm font-bold mb-2">Payment Method</label>
                             <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)} className="shadow-sm appearance-none border border-slate-300 rounded-lg w-full py-3 px-4 text-slate-700 leading-tight focus:outline-none focus:ring-2 focus:ring-sky-500">
                                <option>Cash</option>
                                <option>Bank Transfer</option>
                                <option>Mobile Money</option>
                                <option>Cheque</option>
                            </select>
                        </div>
                         <div>
                            <label className="block text-slate-700 text-sm font-bold mb-2">Payment Type</label>
                             <select value={paymentType} onChange={e => setPaymentType(e.target.value as any)} className="shadow-sm appearance-none border border-slate-300 rounded-lg w-full py-3 px-4 text-slate-700 leading-tight focus:outline-none focus:ring-2 focus:ring-sky-500">
                                <option>Tuition</option>
                                <option>Boarding</option>
                                <option>Exam</option>
                                <option>Transport</option>
                                <option>Other</option>
                            </select>
                        </div>
                    </div>
                     <div>
                        <label className="block text-slate-700 text-sm font-bold mb-2">Reference (Optional)</label>
                        <input value={paymentReference} onChange={e => setPaymentReference(e.target.value)} type="text" className="shadow-sm appearance-none border border-slate-300 rounded-lg w-full py-3 px-4 text-slate-700 leading-tight focus:outline-none focus:ring-2 focus:ring-sky-500" />
                    </div>
                    <button type="submit" disabled={isUpdating} className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline mt-6 transition-colors disabled:bg-sky-300">
                       {isUpdating ? 'Recording...' : 'Record Payment'}
                    </button>
                </form>
            );
        }
        if (modalView === 'recordExpense') {
            return (
                <form onSubmit={handleExpenseSubmit} className="space-y-4">
                     <div>
                        <label className="block text-slate-700 text-sm font-bold mb-2">Category</label>
                         <select value={expenseCategory} onChange={e => setExpenseCategory(e.target.value as any)} className="shadow-sm appearance-none border border-slate-300 rounded-lg w-full py-3 px-4 text-slate-700 leading-tight focus:outline-none focus:ring-2 focus:ring-sky-500">
                            <option>Salaries</option>
                            <option>Supplies</option>
                            <option>Maintenance</option>
                            <option>Utilities</option>
                            <option>Events</option>
                            <option>Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-slate-700 text-sm font-bold mb-2">Description</label>
                        <input value={expenseDesc} onChange={e => setExpenseDesc(e.target.value)} type="text" placeholder="e.g., Monthly Staff Salaries" className="shadow-sm appearance-none border border-slate-300 rounded-lg w-full py-3 px-4 text-slate-700 leading-tight focus:outline-none focus:ring-2 focus:ring-sky-500" required />
                    </div>
                    <div>
                        <label className="block text-slate-700 text-sm font-bold mb-2">Amount</label>
                        <input value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} type="number" min="1" className="shadow-sm appearance-none border border-slate-300 rounded-lg w-full py-3 px-4 text-slate-700 leading-tight focus:outline-none focus:ring-2 focus:ring-sky-500" required />
                    </div>
                    <button type="submit" disabled={isUpdating} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline mt-6 transition-colors disabled:bg-red-300">
                       {isUpdating ? 'Recording...' : 'Record Expense'}
                    </button>
                </form>
            );
        }
        if (modalView === 'tax') {
            return (
                <form onSubmit={handleTaxSubmit} className="space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-sm text-yellow-800 mb-4">
                        <h4 className="font-bold mb-1">Tax Calculator</h4>
                        <p>Use this form to calculate and record tax. Enter the base amount and click "Auto Calculate" to apply standard tax rate (16%).</p>
                    </div>
                     <div>
                        <label className="block text-slate-700 text-sm font-bold mb-2">Tax Description</label>
                        <input value={taxDescription} onChange={e => setTaxDescription(e.target.value)} type="text" placeholder="e.g., Monthly VAT Remittance" className="shadow-sm appearance-none border border-slate-300 rounded-lg w-full py-3 px-4 text-slate-700 leading-tight focus:outline-none focus:ring-2 focus:ring-sky-500" required />
                    </div>
                    <div>
                        <label className="block text-slate-700 text-sm font-bold mb-2">Amount (Ksh)</label>
                        <div className="flex gap-2">
                             <input value={taxBaseAmount} onChange={e => setTaxBaseAmount(e.target.value)} type="number" min="1" className="shadow-sm appearance-none border border-slate-300 rounded-lg w-full py-3 px-4 text-slate-700 leading-tight focus:outline-none focus:ring-2 focus:ring-sky-500" required />
                             <button type="button" onClick={autoCalculateTax} className="bg-amber-500 text-white px-3 rounded-lg text-sm font-bold hover:bg-amber-600">Auto Calc</button>
                        </div>
                    </div>
                    <button type="submit" disabled={isUpdating} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline mt-6 transition-colors disabled:bg-slate-600">
                       {isUpdating ? 'Recording...' : 'Record Tax Payment'}
                    </button>
                </form>
            )
        }
        if (modalView === 'addStaff') {
            return (
                 <form onSubmit={handleAddStaffSubmit} className="space-y-4">
                    <div>
                        <label className="block text-slate-700 text-sm font-bold mb-2">Full Name</label>
                        <input value={newStaffName} onChange={e => setNewStaffName(e.target.value)} type="text" className="shadow-sm appearance-none border border-slate-300 rounded-lg w-full py-3 px-4 text-slate-700 leading-tight focus:outline-none focus:ring-2 focus:ring-sky-500" required />
                    </div>
                    <div>
                        <label className="block text-slate-700 text-sm font-bold mb-2">Username</label>
                        <input value={newStaffUsername} onChange={e => setNewStaffUsername(e.target.value)} type="text" className="shadow-sm appearance-none border border-slate-300 rounded-lg w-full py-3 px-4 text-slate-700 leading-tight focus:outline-none focus:ring-2 focus:ring-sky-500" required />
                    </div>
                    <p className="text-sm text-slate-500">Default password will be set to 'bur123'.</p>
                    <button type="submit" disabled={isUpdating} className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline mt-6 transition-colors disabled:bg-sky-300">
                       {isUpdating ? 'Creating...' : 'Create Staff Account'}
                    </button>
                </form>
            );
        }
        if (modalView === 'generateReport') {
            return (
                <div className="prose prose-sm max-w-none text-slate-700">
                    {isUpdating && !reportContent ? (
                        <div className="flex justify-center items-center h-48"><Spinner /></div>
                    ) : (
                        <pre className="whitespace-pre-wrap bg-slate-50 p-4 rounded-md">{reportContent}</pre>
                    )}
                </div>
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
        }
        return null;
    }


    const renderView = () => {
        switch (activeView) {
            case 'dashboard':
                return (
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800 mb-6">Bursar Dashboard</h2>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <StatCard title="Total Collected" value={`Ksh ${financialStats.totalCollected.toLocaleString()}`} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>} />
                            <StatCard title="Total Expenses" value={`Ksh ${financialStats.totalExpenses.toLocaleString()}`} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>} />
                            <StatCard title="Net Balance" value={`Ksh ${financialStats.netBalance.toLocaleString()}`} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
                             <StatCard title="Outstanding" value={`Ksh ${financialStats.totalOutstanding.toLocaleString()}`} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                 <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Payments</h3>
                                 <table className="w-full text-sm text-left text-slate-500">
                                    <thead className="text-xs text-slate-700 uppercase bg-slate-100"><tr><th scope="col" className="px-6 py-3">Student</th><th scope="col" className="px-6 py-3">Amount</th><th scope="col" className="px-6 py-3">Date</th></tr></thead>
                                    <tbody>
                                      {[...(data.payments || [])].reverse().slice(0, 5).map(p => (
                                        <tr key={p.id} className="bg-white border-b border-slate-200 last:border-b-0 hover:bg-slate-50">
                                          <td className="px-6 py-4 font-medium text-slate-900">{p.studentName}</td>
                                          <td className="px-6 py-4 text-green-600 font-semibold">+{p.amount.toLocaleString()}</td>
                                          <td className="px-6 py-4">{new Date(p.paidAt).toLocaleDateString()}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                            </div>
                             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                 <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Expenses</h3>
                                 <table className="w-full text-sm text-left text-slate-500">
                                    <thead className="text-xs text-slate-700 uppercase bg-slate-100"><tr><th scope="col" className="px-6 py-3">Description</th><th scope="col" className="px-6 py-3">Amount</th><th scope="col" className="px-6 py-3">Date</th></tr></thead>
                                    <tbody>
                                      {(data.expenses || []).slice().reverse().slice(0, 5).map(e => (
                                        <tr key={e.id} className="bg-white border-b border-slate-200 last:border-b-0 hover:bg-slate-50">
                                          <td className="px-6 py-4 font-medium text-slate-900">{e.description}</td>
                                          <td className="px-6 py-4 text-red-600 font-semibold">-{e.amount.toLocaleString()}</td>
                                          <td className="px-6 py-4">{new Date(e.date).toLocaleDateString()}</td>
                                        </tr>
                                      ))}
                                       {(!data.expenses || data.expenses.length === 0) && <tr><td colSpan={3} className="text-center p-4">No expenses recorded</td></tr>}
                                    </tbody>
                                  </table>
                            </div>
                        </div>
                    </div>
                );
             case 'fees':
                const filteredAccounts = (data.feeAccounts || []).filter(acc => 
                    acc.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    acc.studentId.toLowerCase().includes(searchTerm.toLowerCase())
                );
                 return (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-3xl font-bold text-slate-800">Student Fee Accounts</h2>
                            <div className="flex items-center gap-4">
                                <input 
                                    type="text" 
                                    placeholder="Search by name or ID..." 
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="shadow-sm appearance-none border border-slate-300 rounded-lg w-72 py-2 px-4 text-slate-700 leading-tight focus:outline-none focus:ring-2 focus:ring-sky-500"
                                />
                                <button onClick={() => openModal('recordPayment')} className="bg-sky-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-sky-700 transition-colors">Record Payment</button>
                            </div>
                        </div>
                         <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <table className="w-full text-sm text-left text-slate-500">
                                <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">Student</th>
                                        <th scope="col" className="px-6 py-3">Balance</th>
                                        <th scope="col" className="px-6 py-3">Status</th>
                                        <th scope="col" className="px-6 py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                {filteredAccounts.map(acc => (
                                    <tr key={acc.id} className="bg-white border-b border-slate-200 last:border-b-0 hover:bg-slate-50">
                                      <td className="px-6 py-4 font-medium text-slate-900">{acc.studentName} <span className="text-slate-500 font-normal">({acc.studentId})</span></td>
                                      <td className="px-6 py-4 font-bold text-red-600">Ksh {acc.balance.toLocaleString()}</td>
                                      <td className="px-6 py-4"><span className={cn("px-2 py-1 text-xs font-medium rounded-full", acc.status === 'Paid' ? 'bg-green-100 text-green-800' : acc.status === 'Partial' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800')}>{acc.status}</span></td>
                                      <td className="px-6 py-4 space-x-2">
                                          <button onClick={() => openModal('recordPayment', acc.studentId)} className="font-medium text-sky-600 hover:underline">Add Payment</button>
                                          <button onClick={() => handleSendParentReport(acc)} className="font-medium text-amber-600 hover:underline">Send Report</button>
                                      </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                         </div>
                    </div>
                );
            case 'expenses':
                 return (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-3xl font-bold text-slate-800">Expenses & Budget</h2>
                            <button onClick={() => openModal('recordExpense')} className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700 transition-colors">Record Expense</button>
                        </div>
                         <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <table className="w-full text-sm text-left text-slate-500">
                                <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">Date</th>
                                        <th scope="col" className="px-6 py-3">Category</th>
                                        <th scope="col" className="px-6 py-3">Description</th>
                                        <th scope="col" className="px-6 py-3">Amount</th>
                                        <th scope="col" className="px-6 py-3">Recorded By</th>
                                    </tr>
                                </thead>
                                <tbody>
                                {(data.expenses || []).map(exp => (
                                    <tr key={exp.id} className="bg-white border-b border-slate-200 last:border-b-0 hover:bg-slate-50">
                                      <td className="px-6 py-4">{new Date(exp.date).toLocaleDateString()}</td>
                                      <td className="px-6 py-4"><span className={cn("px-2 py-1 rounded-md text-xs font-medium", exp.category === 'Tax' ? 'bg-yellow-100 text-yellow-800' : 'bg-slate-100 text-slate-800')}>{exp.category}</span></td>
                                      <td className="px-6 py-4 font-medium text-slate-900">{exp.description}</td>
                                      <td className="px-6 py-4 font-bold text-red-600">Ksh {exp.amount.toLocaleString()}</td>
                                      <td className="px-6 py-4">{exp.recordedBy}</td>
                                    </tr>
                                ))}
                                 {(!data.expenses || data.expenses.length === 0) && <tr><td colSpan={5} className="text-center p-8 text-slate-500">No expenses recorded.</td></tr>}
                                </tbody>
                            </table>
                         </div>
                    </div>
                );
            case 'tax':
                return (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-3xl font-bold text-slate-800">Tax & Deductions</h2>
                            <button onClick={() => openModal('tax')} className="bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-900 transition-colors">Record Tax Payment</button>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
                            <h3 className="text-lg font-semibold text-slate-800 mb-4">Tax Summary</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-slate-50 p-4 rounded-lg">
                                    <p className="text-slate-500 text-sm">Total Tax Paid</p>
                                    <p className="text-2xl font-bold text-slate-800">Ksh {(data.expenses || []).filter(e => e.category === 'Tax').reduce((sum, e) => sum + e.amount, 0).toLocaleString()}</p>
                                </div>
                                 <div className="bg-slate-50 p-4 rounded-lg">
                                    <p className="text-slate-500 text-sm">Last Remittance</p>
                                    <p className="text-xl font-bold text-slate-800">
                                        {(data.expenses || []).filter(e => e.category === 'Tax').length > 0 ? new Date((data.expenses || []).filter(e => e.category === 'Tax').reverse()[0].date).toLocaleDateString() : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <h3 className="text-lg font-semibold text-slate-800 p-6 pb-0">Tax Payment History</h3>
                             <table className="w-full text-sm text-left text-slate-500 mt-4">
                                <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">Date</th>
                                        <th scope="col" className="px-6 py-3">Description</th>
                                        <th scope="col" className="px-6 py-3">Amount</th>
                                        <th scope="col" className="px-6 py-3">Recorded By</th>
                                    </tr>
                                </thead>
                                <tbody>
                                {(data.expenses || []).filter(e => e.category === 'Tax').map(exp => (
                                    <tr key={exp.id} className="bg-white border-b border-slate-200 last:border-b-0 hover:bg-slate-50">
                                      <td className="px-6 py-4">{new Date(exp.date).toLocaleDateString()}</td>
                                      <td className="px-6 py-4 font-medium text-slate-900">{exp.description}</td>
                                      <td className="px-6 py-4 font-bold text-slate-800">Ksh {exp.amount.toLocaleString()}</td>
                                      <td className="px-6 py-4">{exp.recordedBy}</td>
                                    </tr>
                                ))}
                                 {(!data.expenses || data.expenses.filter(e => e.category === 'Tax').length === 0) && <tr><td colSpan={4} className="text-center p-8 text-slate-500">No tax payments recorded.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'staff':
                const bursars = (data.users || []).filter(u => u.role === 'bursar');
                 return (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-3xl font-bold text-slate-800">Manage Bursar Staff</h2>
                            <button onClick={() => openModal('addStaff')} className="bg-sky-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-sky-700 transition-colors">Add New Bursar</button>
                        </div>
                         <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <table className="w-full text-sm text-left text-slate-500">
                                <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">Name</th>
                                        <th scope="col" className="px-6 py-3">Username</th>
                                        <th scope="col" className="px-6 py-3">Role</th>
                                    </tr>
                                </thead>
                                <tbody>
                                {bursars.map(staff => (
                                    <tr key={staff.username} className="bg-white border-b border-slate-200 last:border-b-0 hover:bg-slate-50">
                                      <td className="px-6 py-4 font-medium text-slate-900">{staff.name}</td>
                                      <td className="px-6 py-4">{staff.username}</td>
                                      <td className="px-6 py-4 capitalize">{staff.role}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                         </div>
                    </div>
                );
             case 'reports':
                return (
                    <div>
                         <h2 className="text-3xl font-bold text-slate-800 mb-6">Financial Reports</h2>
                         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="text-lg font-semibold text-slate-800 mb-4">Generate AI Report</h3>
                            <p className="text-slate-600 mb-4">Select a report to generate using Gemini. The formatted report will be generated as a bursar announcement which you can then copy or distribute.</p>
                            <div className="flex gap-4">
                                <button onClick={() => handleGenerateReport('defaulters')} disabled={isUpdating} className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-sky-300">Generate Defaulters List</button>
                                <button onClick={() => handleGenerateReport('daily')} disabled={isUpdating} className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-sky-300">Generate Daily Collection</button>
                                <button onClick={() => handleGenerateReport('monthly')} disabled={isUpdating} className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-sky-300">Generate Monthly Summary</button>
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
            default: return <div>Select a view.</div>
        }
    }
    
    if (!data) return <div className="p-10 flex justify-center"><Spinner /></div>;

    return (
    <>
        {isModalOpen && <Modal title={modalView === 'recordPayment' ? 'Record New Payment' : modalView === 'recordExpense' ? 'Record Expense' : modalView === 'tax' ? 'Record Tax' : modalView === 'addStaff' ? 'Add Staff Member' : modalView === 'communication' ? 'Send Message' : 'Generated Report'} onClose={closeModal}>{renderModalContent()}</Modal>}
        <div className="flex h-screen bg-slate-50 text-slate-800">
            <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
                <div className="p-6 text-center border-b border-slate-200">
                    <h1 className="text-2xl font-bold text-sky-600">I Perform</h1>
                    <p className="text-sm text-slate-500">Bursar Portal</p>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <NavLink view="dashboard" activeView={activeView} setActiveView={setActiveView}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg><span>Dashboard</span></NavLink>
                    <NavLink view="fees" activeView={activeView} setActiveView={setActiveView}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg><span>Fee Accounts</span></NavLink>
                    <NavLink view="expenses" activeView={activeView} setActiveView={setActiveView}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg><span>Expenses & Budget</span></NavLink>
                    <NavLink view="tax" activeView={activeView} setActiveView={setActiveView}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg><span>Tax & Deductions</span></NavLink>
                    <NavLink view="communication" activeView={activeView} setActiveView={setActiveView}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg><span>Communication</span></NavLink>
                    <NavLink view="staff" activeView={activeView} setActiveView={setActiveView}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21v-1a6 6 0 00-5.176-5.97m8.352 5.97l-2.4-2.4A1.5 1.5 0 0115 13.535V12a3 3 0 00-3-3H9a3 3 0 00-3 3v1.536c0 .413.166.81.464 1.109l2.4 2.4m-1.85-5.97a3 3 0 00-3-3H9a3 3 0 00-3 3v1.536c0 .413.166.81.464 1.109l2.4 2.4" /></svg><span>Manage Staff</span></NavLink>
                    <NavLink view="reports" activeView={activeView} setActiveView={setActiveView}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg><span>Reports</span></NavLink>
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
            <main className="flex-1 p-10 overflow-y-auto relative">
                {isUpdating && <div className="absolute top-4 right-10 bg-sky-500 text-white p-3 rounded-lg shadow-lg z-50 flex items-center gap-2"><Spinner size="sm" /> <span>Updating...</span></div>}
                {updateError && <div className="fixed top-4 right-4 bg-red-500 text-white p-3 rounded-lg shadow-lg z-50">Error: {updateError}</div>}
                {renderView()}
            </main>
        </div>
    </>
    );
};

export default BursarDashboard;
