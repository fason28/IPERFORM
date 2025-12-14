
import React, { useState, useEffect, useCallback, ReactNode, ErrorInfo, Component } from 'react';
import type { User, SchoolData } from './types';
import { generateInitialData, updateDataWithGemini } from './services/geminiService';
import Login from './components/Login';
import Spinner from './components/Spinner';
import Homepage from './components/Homepage';
import Olympiad from './components/Olympiad';
import SchoolRegistration from './components/SchoolRegistration';

// Lazy load dashboards for better initial load performance
const DOSDashboard = React.lazy(() => import('./components/dos/DOSDashboard'));
const DoDDashboard = React.lazy(() => import('./components/dod/DoDDashboard'));
const TeacherDashboard = React.lazy(() => import('./components/teacher/TeacherDashboard'));
const StudentDashboard = React.lazy(() => import('./components/student/StudentDashboard'));
const LibrarianDashboard = React.lazy(() => import('./components/librarian/LibrarianDashboard'));
const BursarDashboard = React.lazy(() => import('./components/bursar/BursarDashboard'));
const PrincipalDashboard = React.lazy(() => import('./components/principal/PrincipalDashboard'));
const PrefectDashboard = React.lazy(() => import('./components/prefect/PrefectDashboard'));
const ParentDashboard = React.lazy(() => import('./components/parent/ParentDashboard'));
const StockKeeperDashboard = React.lazy(() => import('./components/stock/StockKeeperDashboard'));
const SecretaryDashboard = React.lazy(() => import('./components/secretary/SecretaryDashboard'));


// Generic Modal for Password Change
const Modal: React.FC<{ title: string; children: React.ReactNode; footer?: React.ReactNode }> = ({ title, children, footer }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                 <div className="p-6 border-b">
                    <h3 className="text-xl font-bold text-slate-800">{title}</h3>
                </div>
                <div className="p-6">{children}</div>
                {footer && <div className="p-4 bg-slate-50 rounded-b-xl flex justify-end">{footer}</div>}
            </div>
        </div>
    );
};

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Error Boundary Component to prevent white screens
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Application Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 text-center">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-lg">
                <h2 className="text-2xl font-bold text-red-600 mb-2">Something went wrong</h2>
                <p className="text-slate-600 mb-6">The application encountered an unexpected error. This usually happens due to data synchronization issues.</p>
                <p className="text-xs text-slate-400 mb-6 font-mono bg-slate-100 p-2 rounded text-left overflow-auto max-h-32">
                    {this.state.error?.message}
                </p>
                <button 
                    onClick={() => window.location.reload()} 
                    className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                >
                    Reload Application
                </button>
            </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const App: React.FC = () => {
  const [view, setView] = useState<'homepage' | 'iperform' | 'olympiad' | 'register'>('homepage');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [pendingLogin, setPendingLogin] = useState<User | null>(null); // For forced password change
  const [schoolData, setSchoolData] = useState<SchoolData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to ensure data integrity
  const sanitizeSchoolData = useCallback((data: any): SchoolData => {
    if (!data) return data;
    
    // Deeply clean arrays to remove nulls/undefined/non-object items which cause crashes
    const cleanArray = (arr: any) => {
        if (!Array.isArray(arr)) return [];
        return arr.filter(item => item !== null && item !== undefined && typeof item === 'object');
    };

    // Normalize users specifically to handle role case sensitivity and verbose names from AI
    const users = cleanArray(data.users).map((u: any) => {
        let role = u.role ? u.role.toLowerCase().trim() : 'student';
        
        // Map verbose AI outputs to internal codes
        if (role === 'director of studies' || role === 'directorofstudies') role = 'dos';
        if (role === 'director of discipline' || role === 'directorofdiscipline' || role === 'dean of discipline') role = 'dod';
        if (role === 'head boy' || role === 'headboy') role = 'head_boy';
        if (role === 'head girl' || role === 'headgirl') role = 'head_girl';
        if (role === 'stock keeper' || role === 'stockkeeper') role = 'stock_keeper';
        
        return {
            ...u,
            role
        };
    });

    return {
        ...data,
        schoolProfile: data.schoolProfile || { name: 'I Perform Demo School', code: 'IP-DEMO', address: 'Digital Space', motto: 'Excellence' },
        users,
        classes: cleanArray(data.classes),
        teachers: cleanArray(data.teachers),
        students: cleanArray(data.students),
        marks: cleanArray(data.marks),
        conductMarks: cleanArray(data.conductMarks),
        notes: cleanArray(data.notes),
        tests: cleanArray(data.tests),
        announcements: cleanArray(data.announcements),
        conductEvents: cleanArray(data.conductEvents),
        permissions: cleanArray(data.permissions),
        attendances: cleanArray(data.attendances),
        books: cleanArray(data.books),
        borrowedBooks: cleanArray(data.borrowedBooks),
        fines: cleanArray(data.fines),
        librarianNotes: cleanArray(data.librarianNotes),
        feeAccounts: cleanArray(data.feeAccounts),
        payments: cleanArray(data.payments),
        expenses: cleanArray(data.expenses),
        stockItems: cleanArray(data.stockItems),
        diningHallSeating: cleanArray(data.diningHallSeating),
        dormitoryAllocation: cleanArray(data.dormitoryAllocation),
        messages: cleanArray(data.messages),
        groupMessages: cleanArray(data.groupMessages),
    };
  }, []);

  const loadInitialData = useCallback(async (schoolName?: string, adminDetails?: any) => {
    try {
      setError(null);
      setIsLoading(true);
      const data = await generateInitialData(schoolName, adminDetails);
      setSchoolData(sanitizeSchoolData(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [sanitizeSchoolData]);

  // Load default data on first entry to I Perform if no data exists
  useEffect(() => {
    if (view === 'iperform' && !schoolData && !error && !isLoading) {
        loadInitialData();
    }
  }, [view, schoolData, error, isLoading, loadInitialData]);
  
  const handleDataUpdate = useCallback(async (action: string) => {
    if (!schoolData) return;
    try {
        setIsUpdating(true);
        setError(null);
        const updatedData = await updateDataWithGemini(schoolData, action);
        const sanitized = sanitizeSchoolData(updatedData);
        setSchoolData(sanitized);
        return sanitized;
    } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred during update.');
        throw err;
    } finally {
        setIsUpdating(false);
    }
  }, [schoolData, sanitizeSchoolData]);

  const handleLogin = (user: User) => {
    if (user.mustChangePassword) {
        setPendingLogin(user);
    } else {
        setCurrentUser(user);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setPendingLogin(null);
  };
  
  const handlePasswordChange = async () => {
      if (!pendingLogin) return;
      try {
        await handleDataUpdate(`Update user '${pendingLogin.username}' to set mustChangePassword to false.`);
        // Update the local user object to reflect the change immediately
        setCurrentUser({ ...pendingLogin, mustChangePassword: false });
        setPendingLogin(null);
      } catch (err) {
        // Error is already set by handleDataUpdate
      }
  };

  const handleGoHome = () => {
    setView('homepage');
  };

  const handleSchoolRegistration = async (name: string, address: string, adminName: string, adminEmail: string, adminPass: string) => {
      // 1. Trigger loading state
      // 2. Call loadInitialData with specific params to generate a fresh school DB
      // 3. Switch view to iperform
      // 4. Log the user in as principal automatically
      
      try {
          setIsLoading(true);
          const data = await generateInitialData(name, { name: adminName, email: adminEmail, password: adminPass });
          const sanitized = sanitizeSchoolData(data);
          setSchoolData(sanitized);
          setView('iperform');
          
          // Auto login the principal
          const principal = sanitized.users.find(u => u.role === 'principal');
          if (principal) {
              setCurrentUser(principal);
          }
      } catch (e) {
          setError("Registration failed. Please try again.");
      } finally {
          setIsLoading(false);
      }
  };

  if (view === 'homepage') {
    return <Homepage onNavigate={setView} />;
  }
  
  if (view === 'olympiad') {
    return <Olympiad onNavigate={setView} />;
  }

  if (view === 'register') {
      return <SchoolRegistration onRegister={handleSchoolRegistration} onCancel={() => setView('homepage')} isLoading={isLoading} />;
  }
  
  // From here on, the view is 'iperform'
  if (pendingLogin) {
    return (
        <Modal title="Mandatory Password Change">
            <p className="text-slate-600 mb-4">For security reasons, you must change your password before you can proceed.</p>
             <div className="space-y-4">
                <div>
                    <label className="block text-slate-700 text-sm font-bold mb-2">New Password</label>
                    <input type="password" placeholder="******************" className="shadow-sm appearance-none border border-slate-300 rounded-lg w-full py-3 px-4 text-slate-700 leading-tight focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
                 <div>
                    <label className="block text-slate-700 text-sm font-bold mb-2">Confirm New Password</label>
                    <input type="password" placeholder="******************" className="shadow-sm appearance-none border border-slate-300 rounded-lg w-full py-3 px-4 text-slate-700 leading-tight focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
                {error && <p className="text-red-500 text-xs italic">{error}</p>}
             </div>
             <div className="flex items-center justify-between mt-6">
                <button
                    onClick={handleLogout}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors"
                    type="button"
                >
                    Cancel
                </button>
                 <button
                    onClick={handlePasswordChange}
                    className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors disabled:bg-sky-300"
                    type="button"
                    disabled={isUpdating}
                >
                    {isUpdating ? 'Updating...' : 'Set Password & Login'}
                </button>
             </div>
        </Modal>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center">
        <Spinner size="lg" />
        <p className="mt-4 text-slate-600">Initializing School Data with Gemini...</p>
        <p className="mt-2 text-slate-500">This might take a moment.</p>
      </div>
    );
  }

  if (error && !schoolData) {
    return (
       <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
        <div className="text-center text-red-800 bg-red-100 border border-red-300 rounded-xl p-8 max-w-lg shadow-md">
            <h2 className="text-2xl font-bold mb-2">Initialization Failed</h2>
            <p className="mb-4 text-red-700">{error}</p>
            <p className="text-sm mb-4">This could be due to a missing or invalid API key, or a problem with the AI service. Please check your setup and try again.</p>
            <button
                onClick={() => loadInitialData()}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition-transform transform hover:scale-105"
            >
                Retry
            </button>
        </div>
    </div>
    )
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} users={schoolData?.users ?? null} schoolProfile={schoolData?.schoolProfile} isLoading={isLoading} onGoHome={() => setView('homepage')} onRegister={() => setView('register')} />;
  }

  const commonProps = {
      user: currentUser,
      data: schoolData!,
      onUpdate: handleDataUpdate,
      onLogout: handleLogout,
      onGoHome: handleGoHome,
      isUpdating,
      updateError: error,
  };

  // Ensure role is compared case-insensitively for safety
  const role = currentUser.role ? currentUser.role.toLowerCase() : '';

  return (
    <ErrorBoundary>
        <React.Suspense fallback={
            <div className="min-h-screen bg-slate-50 flex justify-center items-center">
                <Spinner size="lg" />
            </div>
        }>
        {role === 'dos' && <DOSDashboard {...commonProps} />}
        {role === 'dod' && <DoDDashboard {...commonProps} />}
        {role === 'teacher' && <TeacherDashboard {...commonProps} />}
        {role === 'student' && <StudentDashboard {...commonProps} />}
        {role === 'librarian' && <LibrarianDashboard {...commonProps} />}
        {role === 'bursar' && <BursarDashboard {...commonProps} />}
        {role === 'principal' && <PrincipalDashboard {...commonProps} />}
        {(role === 'head_boy' || role === 'head_girl') && <PrefectDashboard {...commonProps} />}
        {role === 'parent' && <ParentDashboard {...commonProps} />}
        {role === 'stock_keeper' && <StockKeeperDashboard {...commonProps} />}
        {role === 'secretary' && <SecretaryDashboard {...commonProps} />}
        
        {/* Fallback for unknown roles to prevent blank screen */}
        {!['dos', 'dod', 'teacher', 'student', 'librarian', 'bursar', 'principal', 'head_boy', 'head_girl', 'parent', 'stock_keeper', 'secretary'].includes(role) && (
             <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-slate-50">
                <div className="bg-white p-8 rounded-xl shadow-lg">
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Access Issue</h2>
                    <p className="text-slate-600 mb-4">The role <span className="font-mono bg-slate-100 px-2 py-1 rounded">{role || 'unknown'}</span> is not recognized by the system.</p>
                    <button onClick={handleLogout} className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-6 rounded-lg transition-colors">Logout & Try Again</button>
                </div>
             </div>
        )}
        </React.Suspense>
    </ErrorBoundary>
  );
};

export default App;
