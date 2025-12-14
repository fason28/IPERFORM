
import React, { useState, useMemo } from 'react';
import type { SchoolData, User, Book, BorrowedBook, Fine } from '../../types';
import Spinner from '../Spinner';

// Helper for dynamic class names
const cn = (...classes: (string | boolean)[]) => classes.filter(Boolean).join(' ');

interface LibrarianDashboardProps {
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

const LibrarianDashboard: React.FC<LibrarianDashboardProps> = ({ user, data, onUpdate, onLogout, onGoHome, isUpdating, updateError }) => {
    const [activeView, setActiveView] = useState('dashboard');
    const [searchTerm, setSearchTerm] = useState('');
    
    // Borrowing State
    const [borrowerType, setBorrowerType] = useState<'Student' | 'Teacher' | 'Class'>('Student');
    const [selectedBookId, setSelectedBookId] = useState('');
    const [borrowerId, setBorrowerId] = useState('');

    const libraryStats = useMemo(() => {
        if (!data) return { totalBooks: 0, availableBooks: 0, borrowedBooks: 0, overdueBooks: 0 };
        const totalBooks = data.books?.length || 0;
        const availableBooks = (data.books || []).filter(b => b.isAvailable).length;
        const borrowedBooks = totalBooks - availableBooks;
        const overdueBooks = (data.borrowedBooks || []).filter(b => b.returnedAt === null && new Date(b.dueDate) < new Date()).length;
        return { totalBooks, availableBooks, borrowedBooks, overdueBooks };
    }, [data]);

    const handleBorrow = async (e: React.FormEvent) => {
        e.preventDefault();
        const book = data.books.find(b => b.bookId === selectedBookId);
        if (!book) {
            alert("Please select a valid book.");
            return;
        }
        if (!book.isAvailable) {
            alert("This book is already borrowed.");
            return;
        }
        
        let action = `Record a borrowed book. Book ID: ${selectedBookId}, Book Title: '${book.title}'. Borrower Type: '${borrowerType}'.`;
        
        if (borrowerType === 'Student') {
             const student = data.students.find(s => s.studentId === borrowerId);
             if (!student) { alert("Student not found"); return; }
             action += ` Borrower Name: '${student.name}', Borrower ID: '${student.studentId}'.`;
        } else if (borrowerType === 'Teacher') {
             const teacher = data.teachers.find(t => t.username === borrowerId); // Assuming teacher username is ID
             if (!teacher) { alert("Teacher not found"); return; }
             action += ` Borrower Name: '${teacher.name}', Borrower ID: '${teacher.username}'.`;
        } else {
            // Class borrow
             const cls = data.classes.find(c => c.name === borrowerId);
             if (!cls) { alert("Class not found"); return; }
             action += ` Borrower Name: 'Class ${cls.name}', Borrower ID: '${cls.name}'.`;
        }
        
        await onUpdate(action);
        setSelectedBookId('');
        setBorrowerId('');
    };
    
    const handleReportDamage = async (borrow: BorrowedBook) => {
        const reason = prompt("Enter damage description or reason for charge:");
        if (!reason) return;
        
        // Logic: Create a fine, and message the parent/borrower
        const action = `Report damaged/lost book '${borrow.bookTitle}'. Create a fine of 500 for student ID '${borrow.borrowerId}' reason: "${reason}". Send a message to parent of '${borrow.borrowerName}' about this damage.`;
        await onUpdate(action);
    }

    const sendOverdueNotice = async (borrow: BorrowedBook) => {
        const action = `Send a warning message to ${borrow.borrowerType} '${borrow.borrowerName}' (ID: ${borrow.borrowerId}) regarding OVERDUE book '${borrow.bookTitle}' which was due on ${borrow.dueDate}.`;
        await onUpdate(action);
    };

    const sendFineNotice = async (fine: Fine) => {
         const action = `Send a fine payment reminder to student '${fine.studentName}' (ID: ${fine.studentId}) for amount ${fine.amount}. Reason: ${fine.reason}.`;
         await onUpdate(action);
    }

    const handleBulkReports = async () => {
        const action = "Identify all students with overdue books or unpaid fines. For each such student, send a message to their parent detailing the specific books and fine amounts. The message should be polite but firm.";
        await onUpdate(action);
    };

    const renderView = () => {
        switch (activeView) {
            case 'dashboard':
                return (
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800 mb-6">Librarian Dashboard</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <StatCard title="Total Books" value={libraryStats.totalBooks} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>} />
                            <StatCard title="Available Books" value={libraryStats.availableBooks} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>} />
                            <StatCard title="Borrowed Books" value={libraryStats.borrowedBooks} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>} />
                            <StatCard title="Overdue Books" value={libraryStats.overdueBooks} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                             <h3 className="text-lg font-semibold text-slate-800 mb-4">Recently Borrowed</h3>
                              <table className="w-full text-sm text-left text-slate-500">
                                <thead className="text-xs text-slate-700 uppercase bg-slate-100"><tr><th scope="col" className="px-6 py-3">Book Title</th><th scope="col" className="px-6 py-3">Borrower</th><th scope="col" className="px-6 py-3">Type</th><th scope="col" className="px-6 py-3">Due Date</th></tr></thead>
                                <tbody>
                                  {[...(data.borrowedBooks || [])].filter(b => !b.returnedAt).reverse().slice(0, 5).map(b => (
                                    <tr key={b.id} className="bg-white border-b border-slate-200 last:border-b-0 hover:bg-slate-50">
                                      <td className="px-6 py-4 font-medium text-slate-900">{b.bookTitle}</td>
                                      <td className="px-6 py-4">{b.borrowerName}</td>
                                      <td className="px-6 py-4">{b.borrowerType}</td>
                                      <td className="px-6 py-4">{new Date(b.dueDate).toLocaleDateString()}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                        </div>
                    </div>
                );
            case 'books': {
                 const filteredBooks = (data.books || []).filter(book => 
                    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    book.bookId.toLowerCase().includes(searchTerm.toLowerCase())
                );
                return (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-3xl font-bold text-slate-800">Book Catalog</h2>
                            <input 
                                type="text" 
                                placeholder="Search by title, author, ID..." 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="shadow-sm appearance-none border border-slate-300 rounded-lg w-1/3 py-2 px-4 text-slate-700 leading-tight focus:outline-none focus:ring-2 focus:ring-sky-500"
                            />
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                          <table className="w-full text-sm text-left text-slate-500">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Book ID</th>
                                    <th scope="col" className="px-6 py-3">Title</th>
                                    <th scope="col" className="px-6 py-3">Author</th>
                                    <th scope="col" className="px-6 py-3">Status</th>
                                    <th scope="col" className="px-6 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                            {filteredBooks.map(book => (
                                <tr key={book.id} className="bg-white border-b border-slate-200 last:border-b-0 hover:bg-slate-50">
                                    <td className="px-6 py-4 font-mono text-slate-600">{book.bookId}</td>
                                    <td className="px-6 py-4 font-medium text-slate-900">{book.title}</td>
                                    <td className="px-6 py-4">{book.author}</td>
                                    <td className="px-6 py-4">
                                         <span className={cn("px-2 py-1 text-xs font-medium rounded-full", book.isAvailable ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800')}>{book.isAvailable ? 'Available' : 'Borrowed'}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button onClick={() => onUpdate(`Delete book with id ${book.id}`)} className="font-medium text-red-600 hover:underline">Delete</button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                          </table>
                          {filteredBooks.length === 0 && <p className="text-center p-6 text-slate-500">No books match your search.</p>}
                        </div>
                    </div>
                );
            }
            case 'borrow':
                 return (
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800 mb-6">Borrow / Return Books</h2>
                        
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
                            <h3 className="text-lg font-semibold text-slate-800 mb-4">Record New Borrow</h3>
                            <form onSubmit={handleBorrow} className="flex flex-wrap items-end gap-4">
                                <div className="flex-1 min-w-[200px]">
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Book ID</label>
                                    <select value={selectedBookId} onChange={e => setSelectedBookId(e.target.value)} className="shadow-sm appearance-none border border-slate-300 rounded-lg w-full py-2 px-3 text-slate-700" required>
                                        <option value="">Select Book</option>
                                        {(data.books || []).filter(b => b.isAvailable).map(b => <option key={b.id} value={b.bookId}>{b.title} ({b.bookId})</option>)}
                                    </select>
                                </div>
                                 <div className="flex-1 min-w-[150px]">
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Borrower Type</label>
                                    <select value={borrowerType} onChange={e => setBorrowerType(e.target.value as any)} className="shadow-sm appearance-none border border-slate-300 rounded-lg w-full py-2 px-3 text-slate-700">
                                        <option value="Student">Student</option>
                                        <option value="Teacher">Teacher</option>
                                        <option value="Class">Class</option>
                                    </select>
                                </div>
                                <div className="flex-1 min-w-[200px]">
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Borrower ID/Name</label>
                                    {borrowerType === 'Student' ? (
                                        <select value={borrowerId} onChange={e => setBorrowerId(e.target.value)} className="shadow-sm appearance-none border border-slate-300 rounded-lg w-full py-2 px-3 text-slate-700" required>
                                            <option value="">Select Student</option>
                                            {(data.students || []).map(s => <option key={s.id} value={s.studentId}>{s.name} ({s.studentId})</option>)}
                                        </select>
                                    ) : borrowerType === 'Teacher' ? (
                                        <select value={borrowerId} onChange={e => setBorrowerId(e.target.value)} className="shadow-sm appearance-none border border-slate-300 rounded-lg w-full py-2 px-3 text-slate-700" required>
                                            <option value="">Select Teacher</option>
                                            {(data.teachers || []).map(t => <option key={t.id} value={t.username}>{t.name}</option>)}
                                        </select>
                                    ) : (
                                        <select value={borrowerId} onChange={e => setBorrowerId(e.target.value)} className="shadow-sm appearance-none border border-slate-300 rounded-lg w-full py-2 px-3 text-slate-700" required>
                                            <option value="">Select Class</option>
                                            {(data.classes || []).map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                        </select>
                                    )}
                                </div>
                                <button type="submit" disabled={isUpdating} className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-6 rounded-lg disabled:bg-sky-300">Borrow Book</button>
                            </form>
                        </div>

                         <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <table className="w-full text-sm text-left text-slate-500">
                                <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">Book Title</th>
                                        <th scope="col" className="px-6 py-3">Borrower</th>
                                        <th scope="col" className="px-6 py-3">Type</th>
                                        <th scope="col" className="px-6 py-3">Due Date</th>
                                        <th scope="col" className="px-6 py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                {(data.borrowedBooks || []).filter(b => !b.returnedAt).map(borrow => (
                                    <tr key={borrow.id} className="bg-white border-b border-slate-200 last:border-b-0 hover:bg-slate-50">
                                      <td className="px-6 py-4 font-medium text-slate-900">{borrow.bookTitle}</td>
                                      <td className="px-6 py-4">{borrow.borrowerName}</td>
                                      <td className="px-6 py-4">{borrow.borrowerType}</td>
                                      <td className="px-6 py-4">{new Date(borrow.dueDate).toLocaleDateString()}</td>
                                      <td className="px-6 py-4 space-x-2">
                                          <button onClick={() => onUpdate(`Return book for borrow record id ${borrow.id}`)} className="bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded-lg text-xs">Return</button>
                                          <button onClick={() => handleReportDamage(borrow)} className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded-lg text-xs">Report Lost/Damaged</button>
                                      </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                            {(data.borrowedBooks || []).filter(b => !b.returnedAt).length === 0 && <p className="text-center p-6 text-slate-500">No books are currently borrowed.</p>}
                         </div>
                    </div>
                );
            case 'reports':
                const overdueBooks = (data.borrowedBooks || []).filter(b => !b.returnedAt && new Date(b.dueDate) < new Date());
                const unpaidFines = (data.fines || []).filter(f => !f.isPaid);
                return (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-3xl font-bold text-slate-800">Reports & Notices</h2>
                            <button onClick={handleBulkReports} disabled={isUpdating} className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors disabled:bg-sky-300">
                                Send Bulk Overdue/Fine Reports
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-4 bg-red-50 border-b border-red-100">
                                    <h3 className="font-bold text-red-800">Overdue Books</h3>
                                </div>
                                <table className="w-full text-sm text-left text-slate-500">
                                    <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                                        <tr>
                                            <th className="px-4 py-2">Book</th>
                                            <th className="px-4 py-2">Borrower</th>
                                            <th className="px-4 py-2">Due</th>
                                            <th className="px-4 py-2">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {overdueBooks.map(b => (
                                            <tr key={b.id} className="border-b last:border-0 hover:bg-slate-50">
                                                <td className="px-4 py-3">{b.bookTitle}</td>
                                                <td className="px-4 py-3">{b.borrowerName}</td>
                                                <td className="px-4 py-3 text-red-600">{new Date(b.dueDate).toLocaleDateString()}</td>
                                                <td className="px-4 py-3">
                                                    <button onClick={() => sendOverdueNotice(b)} disabled={isUpdating} className="text-xs bg-amber-500 hover:bg-amber-600 text-white px-2 py-1 rounded">
                                                        Send Notice
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {overdueBooks.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-slate-400">No overdue books.</td></tr>}
                                    </tbody>
                                </table>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-4 bg-amber-50 border-b border-amber-100">
                                    <h3 className="font-bold text-amber-800">Outstanding Fines</h3>
                                </div>
                                <table className="w-full text-sm text-left text-slate-500">
                                    <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                                        <tr>
                                            <th className="px-4 py-2">Student</th>
                                            <th className="px-4 py-2">Amount</th>
                                            <th className="px-4 py-2">Reason</th>
                                            <th className="px-4 py-2">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {unpaidFines.map(f => (
                                            <tr key={f.id} className="border-b last:border-0 hover:bg-slate-50">
                                                <td className="px-4 py-3">{f.studentName}</td>
                                                <td className="px-4 py-3 font-bold">Ksh {f.amount}</td>
                                                <td className="px-4 py-3">{f.reason}</td>
                                                <td className="px-4 py-3">
                                                    <button onClick={() => sendFineNotice(f)} disabled={isUpdating} className="text-xs bg-sky-500 hover:bg-sky-600 text-white px-2 py-1 rounded">
                                                        Send Notice
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {unpaidFines.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-slate-400">No outstanding fines.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );
            default: return <div>Select a view</div>;
        }
    }

    if (!data) return <div className="p-10 flex justify-center"><Spinner /></div>;

    return (
        <div className="flex h-screen bg-slate-50 text-slate-800">
            <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
                <div className="p-6 text-center border-b border-slate-200">
                    <h1 className="text-2xl font-bold text-sky-600">I Perform</h1>
                    <p className="text-sm text-slate-500">Librarian Portal</p>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <NavLink view="dashboard" activeView={activeView} setActiveView={setActiveView}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg><span>Dashboard</span></NavLink>
                    <NavLink view="books" activeView={activeView} setActiveView={setActiveView}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg><span>Manage Books</span></NavLink>
                    <NavLink view="borrow" activeView={activeView} setActiveView={setActiveView}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg><span>Borrow / Return</span></NavLink>
                    <NavLink view="reports" activeView={activeView} setActiveView={setActiveView}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg><span>Reports & Notices</span></NavLink>
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
    );
};

export default LibrarianDashboard;
