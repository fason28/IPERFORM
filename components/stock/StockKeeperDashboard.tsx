
import React, { useState } from 'react';
import type { SchoolData, User, StockItem } from '../../types';
import Spinner from '../Spinner';

const cn = (...classes: (string | boolean)[]) => classes.filter(Boolean).join(' ');

interface StockKeeperDashboardProps {
  user: User;
  data: SchoolData;
  onUpdate: (action: string) => Promise<any>;
  onLogout: () => void;
  onGoHome: () => void;
  isUpdating: boolean;
  updateError: string | null;
}

const StockKeeperDashboard: React.FC<StockKeeperDashboardProps> = ({ user, data, onUpdate, onLogout, onGoHome, isUpdating, updateError }) => {
    const [itemName, setItemName] = useState('');
    const [itemCat, setItemCat] = useState('');
    const [itemQty, setItemQty] = useState('');
    const [itemUnit, setItemUnit] = useState('');

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        const action = `Add a new stock item. Name: '${itemName}', Category: '${itemCat}', Quantity: ${itemQty}, Unit: '${itemUnit}'.`;
        await onUpdate(action);
        setItemName(''); setItemCat(''); setItemQty(''); setItemUnit('');
    }
    
    const handleUpdateStock = async (id: number, change: number) => {
        const action = `Update stock quantity for item ID ${id}. Add ${change}.`;
        await onUpdate(action);
    }

    return (
        <div className="flex h-screen bg-slate-50 text-slate-800">
            <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
                <div className="p-6 text-center border-b border-slate-200">
                    <h1 className="text-2xl font-bold text-sky-600">I Perform</h1>
                    <p className="text-sm text-slate-500">Stock Keeper</p>
                </div>
                <div className="p-4 mt-auto border-t border-slate-200 space-y-2">
                    <button onClick={onGoHome} className="w-full bg-slate-100 text-slate-600 font-semibold py-2.5 px-4 rounded-lg hover:bg-sky-100 hover:text-sky-700 transition-colors">Back to Home</button>
                    <button onClick={onLogout} className="w-full bg-slate-100 text-slate-600 font-semibold py-2.5 px-4 rounded-lg hover:bg-red-100 hover:text-red-700 transition-colors">Logout</button>
                </div>
            </aside>
            <main className="flex-1 p-10 overflow-y-auto relative">
                {isUpdating && <div className="absolute top-4 right-10 bg-sky-500 text-white p-3 rounded-lg shadow-lg z-50 flex items-center gap-2"><Spinner size="sm" /> <span>Updating...</span></div>}
                
                <h2 className="text-3xl font-bold text-slate-800 mb-6">School Inventory</h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <table className="w-full text-sm text-left text-slate-500">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                                <tr>
                                    <th className="px-6 py-3">Item</th>
                                    <th className="px-6 py-3">Category</th>
                                    <th className="px-6 py-3">Quantity</th>
                                    <th className="px-6 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(data.stockItems || []).map(item => (
                                    <tr key={item.id} className="bg-white border-b hover:bg-slate-50">
                                        <td className="px-6 py-4 font-medium">{item.itemName}</td>
                                        <td className="px-6 py-4">{item.category}</td>
                                        <td className="px-6 py-4 font-bold">{item.quantity} {item.unit}</td>
                                        <td className="px-6 py-4 flex gap-2">
                                            <button onClick={() => handleUpdateStock(item.id, 1)} className="bg-green-100 text-green-700 px-2 rounded hover:bg-green-200">+</button>
                                            <button onClick={() => handleUpdateStock(item.id, -1)} className="bg-red-100 text-red-700 px-2 rounded hover:bg-red-200">-</button>
                                        </td>
                                    </tr>
                                ))}
                                {(data.stockItems || []).length === 0 && <tr><td colSpan={4} className="p-4 text-center">No stock items.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                    
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
                        <h3 className="text-lg font-bold mb-4">Add New Item</h3>
                        <form onSubmit={handleAddItem} className="space-y-4">
                            <div><label className="block text-xs font-bold text-slate-500 uppercase">Name</label><input value={itemName} onChange={e => setItemName(e.target.value)} className="w-full border p-2 rounded" required /></div>
                            <div><label className="block text-xs font-bold text-slate-500 uppercase">Category</label><input value={itemCat} onChange={e => setItemCat(e.target.value)} className="w-full border p-2 rounded" required /></div>
                            <div className="flex gap-2">
                                <div className="flex-1"><label className="block text-xs font-bold text-slate-500 uppercase">Qty</label><input type="number" value={itemQty} onChange={e => setItemQty(e.target.value)} className="w-full border p-2 rounded" required /></div>
                                <div className="flex-1"><label className="block text-xs font-bold text-slate-500 uppercase">Unit</label><input value={itemUnit} onChange={e => setItemUnit(e.target.value)} className="w-full border p-2 rounded" required placeholder="pcs, kg" /></div>
                            </div>
                            <button disabled={isUpdating} className="w-full bg-sky-600 text-white py-2 rounded font-bold hover:bg-sky-700 disabled:opacity-50">Add Item</button>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default StockKeeperDashboard;
