
import React, { useState, useEffect, useRef } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, DoughnutController, BarController } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, DoughnutController, BarController);

// Helper for dynamic class names
const cn = (...classes: (string | boolean)[]) => classes.filter(Boolean).join(' ');

// Mock Data
const stats = {
  events: 3,
  participants: 1254,
  inspectors: 28,
  centers: 35,
};

const events = [
  { id: 1, title: 'National Mathematics Olympiad', date: '2024-07-30', status: 'Upcoming' },
  { id: 2, title: 'State Physics Challenge', date: '2024-08-05', status: 'Upcoming' },
  { id: 3, title: 'Regional Chemistry Prelims', date: '2024-07-15', status: 'Completed' },
];

type NavLinkProps = {
  view: string;
  activeView: string;
  setActiveView: (v: string) => void;
  children?: React.ReactNode;
  icon: React.ReactElement;
};

const NavLink: React.FC<NavLinkProps> = ({ view, activeView, setActiveView, children, icon }) => (
  <a href="#" onClick={(e) => { e.preventDefault(); setActiveView(view); }} className={cn("flex items-center gap-3 py-2.5 px-4 rounded-lg transition duration-200", activeView === view ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 font-semibold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700')}>
    {icon}
    <span className="hidden md:inline">{children}</span>
  </a>
);

type StatCardProps = {
  title: string;
  value: string | number;
  icon: React.ReactNode;
};
const StatCard: React.FC<StatCardProps> = ({ title, value, icon }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
       <div className="bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300 p-3 rounded-full">
           {icon}
       </div>
       <div>
           <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">{title}</h3>
           <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
       </div>
    </div>
  );

const CoordinatorDashboard = ({ onLogout }: { onLogout: () => void }) => {
    const [activeView, setActiveView] = useState('dashboard');
    const barChartRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
      if (activeView === 'dashboard' && barChartRef.current) {
          // Destroy existing chart to prevent "Canvas is already in use" error
          const existingChart = ChartJS.getChart(barChartRef.current);
          if (existingChart) {
              existingChart.destroy();
          }

          const barChart = new ChartJS(barChartRef.current, {
              type: 'bar',
              data: {
                  labels: ['Math', 'Physics', 'Chemistry', 'Biology'],
                  datasets: [{
                      label: 'Participants per Subject',
                      data: [520, 380, 210, 144],
                      backgroundColor: '#f59e0b',
                      borderRadius: 4,
                  }]
              },
              options: {
                  responsive: true,
                  plugins: { legend: { display: false }},
                  scales: { y: { beginAtZero: true, grid: { color: '#e2e8f0' } }, x: { grid: { display: false } } }
              }
          });
          return () => barChart.destroy();
      }
    }, [activeView]);

    const renderView = () => {
        switch(activeView) {
            case 'dashboard': return (
                <div>
                    <h2 className="text-3xl font-bold mb-6">Coordinator Dashboard</h2>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatCard title="Total Events" value={stats.events} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} />
                        <StatCard title="Participants" value={stats.participants.toLocaleString()} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
                        <StatCard title="Inspectors" value={stats.inspectors} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>} />
                        <StatCard title="Test Centers" value={stats.centers} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>} />
                    </div>
                     <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                        <h3 className="text-lg font-semibold mb-4">Registration Analytics</h3>
                        <canvas ref={barChartRef}></canvas>
                    </div>
                </div>
            );
            case 'events': return (
                <div>
                     <div className="flex justify-between items-center mb-6">
                        <h2 className="text-3xl font-bold">Manage Events</h2>
                        <button className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                            <span>Create Event</span>
                        </button>
                    </div>
                     <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-slate-900/50 text-sm text-slate-600 dark:text-slate-300">
                                <tr><th className="p-4">Title</th><th className="p-4">Date</th><th className="p-4">Status</th><th className="p-4">Actions</th></tr>
                            </thead>
                            <tbody>
                                {events.map(event => (
                                     <tr key={event.id} className="border-t border-slate-200 dark:border-slate-700">
                                        <td className="p-4 font-semibold">{event.title}</td>
                                        <td className="p-4">{event.date}</td>
                                        <td className="p-4"><span className={cn("px-2 py-1 text-xs font-medium rounded-full", event.status === 'Upcoming' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' : 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300')}>{event.status}</span></td>
                                        <td className="p-4 space-x-2">
                                            <button className="font-medium text-sky-600 dark:text-sky-400 hover:underline">Edit</button>
                                            <button className="font-medium text-red-600 dark:text-red-400 hover:underline">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
            case 'notifications': return (
                 <div>
                    <h2 className="text-3xl font-bold mb-6">Send Notifications</h2>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                        <form className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold mb-2">Recipient Group</label>
                                <select className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700">
                                    <option>All Participants</option>
                                    <option>All Inspectors</option>
                                    <option>Participants (Mathematics)</option>
                                    <option>Inspectors (City High School)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2">Subject</label>
                                <input type="text" className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700" placeholder="Notification Subject" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2">Message</label>
                                <textarea rows={8} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700" placeholder="Type your message here..."></textarea>
                            </div>
                            <div className="text-right">
                                <button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-6 rounded-lg">Send Notification</button>
                            </div>
                        </form>
                    </div>
                </div>
            );
            default: return <div>Select a view</div>;
        }
    };
    
    return (
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-xl shadow-lg border border-white/50 dark:border-slate-700/50 text-slate-800 dark:text-slate-100">
            <div className="flex flex-col md:flex-row min-h-[600px]">
                {/* Sidebar */}
                 <aside className="w-full md:w-64 bg-slate-50/50 dark:bg-slate-900/50 p-4 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700 flex flex-row md:flex-col justify-center md:justify-start">
                     <div className="p-4 text-center border-b border-slate-200 dark:border-slate-700 mb-4 hidden md:block">
                        <h3 className="font-semibold">Coordinator</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Admin Panel</p>
                    </div>
                    <nav className="flex-1 space-y-1 flex flex-row md:flex-col items-center md:items-stretch justify-around md:justify-start">
                        <NavLink view="dashboard" activeView={activeView} setActiveView={setActiveView} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>}>Dashboard</NavLink>
                        <NavLink view="events" activeView={activeView} setActiveView={setActiveView} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}>Events</NavLink>
                        <NavLink view="users" activeView={activeView} setActiveView={() => alert('Users view not implemented.')} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21v-1a6 6 0 00-5.176-5.97m8.352 5.97l-2.4-2.4A1.5 1.5 0 0115 13.535V12a3 3 0 00-3-3H9a3 3 0 00-3 3v1.536c0 .413.166.81.464 1.109l2.4 2.4m-1.85-5.97a3 3 0 00-3-3H9a3 3 0 00-3 3v1.536c0 .413.166.81.464 1.109l2.4 2.4" /></svg>}>Users</NavLink>
                        <NavLink view="results" activeView={activeView} setActiveView={() => alert('Results view not implemented.')} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}>Results</NavLink>
                        <NavLink view="notifications" activeView={activeView} setActiveView={setActiveView} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>}>Notifications</NavLink>
                    </nav>
                </aside>
                {/* Main Content */}
                <main className="flex-1 p-6 md:p-10 overflow-y-auto">
                    {renderView()}
                </main>
            </div>
        </div>
    );
};

export default CoordinatorDashboard;
