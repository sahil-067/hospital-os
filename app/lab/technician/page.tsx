'use client';

import React, { useState, useEffect } from 'react';
import {
    Microscope, Search, Filter, Plus, Clock, AlertTriangle, CheckCircle,
    FileText, Upload, X, Send, Cloud, LogOut, ArrowRight, RefreshCw, Loader2
} from 'lucide-react';
import { getLabOrders, getLabStats, uploadResult } from '@/app/actions/lab-actions';
import Link from 'next/link';

type LabOrder = {
    order_id: string;
    patient_name: string;
    test_type: string;
    doctor_name: string;
    status: string;
    result_value?: string;
    created_at: Date;
    barcode?: string;
};

export default function LabPage() {
    const [orders, setOrders] = useState<LabOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'Pending' | 'Completed'>('Pending');
    const [stats, setStats] = useState({ pendingCount: 0, completedToday: 0 });

    // Modal State
    const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null);
    const [resultValue, setResultValue] = useState('');
    const [remarks, setRemarks] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch Data
    const loadData = async () => {
        setLoading(true);
        const [ordersRes, statsRes] = await Promise.all([
            getLabOrders(activeTab),
            getLabStats()
        ]);

        if (ordersRes.success) setOrders(ordersRes.data as any);
        if (statsRes.success) setStats(statsRes as any);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const handleOpenUpload = (order: LabOrder) => {
        setSelectedOrder(order);
        setResultValue('');
        setRemarks('');
    };

    const handleSubmitResult = async () => {
        if (!selectedOrder) return;
        setIsSubmitting(true);
        try {
            const res = await uploadResult(selectedOrder.order_id, resultValue || 'Result File Uploaded', remarks);
            if (res.success) {
                setSelectedOrder(null);
                loadData();
            } else {
                alert('Error: ' + res.error);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            'Pending': 'bg-amber-100 text-amber-700 border-amber-200',
            'Processing': 'bg-blue-100 text-blue-700 border-blue-200',
            'Completed': 'bg-emerald-100 text-emerald-700 border-emerald-200',
            'Cancelled': 'bg-rose-100 text-rose-700 border-rose-200'
        };
        const colorClass = styles[status as keyof typeof styles] || 'bg-slate-100 text-slate-700 border-slate-200';
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${colorClass}`}>
                {status}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-50/50 via-slate-50 to-slate-100">
            {/* HEADER */}
            <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-3 sticky top-0 z-40 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3 text-teal-700">
                    <div className="bg-teal-600 p-2 rounded-lg text-white shadow-lg shadow-teal-500/20">
                        <Microscope className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="font-bold text-lg tracking-tight text-slate-800 leading-tight">Avani Hospital</h2>
                        <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">Laboratory</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 px-4 py-1.5 bg-slate-100 rounded-full border border-slate-200/50 shadow-inner">
                        <div className="h-7 w-7 bg-gradient-to-br from-teal-500 to-teal-700 rounded-full flex items-center justify-center text-white font-bold text-xs ring-2 ring-white">
                            LT
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-700">Technician</span>
                            <span className="text-[10px] text-slate-400 font-medium">Lab Operations</span>
                        </div>
                    </div>
                    <Link href="/login" className="flex items-center gap-2 text-xs font-bold text-rose-500 hover:bg-rose-50 px-4 py-2 rounded-full transition-all hover:pr-5 group">
                        <LogOut className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" /> Logout
                    </Link>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">

                {/* TITLE & ACTIONS */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Worklist Dashboard</h1>
                        <p className="text-slate-500 mt-1 font-medium">Manage test orders and processing queue</p>
                    </div>
                    <button
                        onClick={() => loadData()}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:text-teal-600 hover:border-teal-200 shadow-sm transition-all"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
                    </button>
                </div>

                {/* STATS CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="absolute right-0 top-0 h-full w-1.5 bg-gradient-to-b from-amber-400 to-orange-500" />
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Pending Orders</span>
                            <div className="bg-amber-100 p-2 rounded-lg">
                                <Clock className="h-5 w-5 text-amber-600" />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-3">
                            <p className="text-4xl font-black text-slate-900 tracking-tight">{stats.pendingCount}</p>
                            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">Requires Attention</span>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="absolute right-0 top-0 h-full w-1.5 bg-gradient-to-b from-emerald-400 to-teal-500" />
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Completed Today</span>
                            <div className="bg-emerald-100 p-2 rounded-lg">
                                <CheckCircle className="h-5 w-5 text-emerald-600" />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-3">
                            <p className="text-4xl font-black text-slate-900 tracking-tight">{stats.completedToday}</p>
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">Processed</span>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-300 shadow-sm relative overflow-hidden opacity-70">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Urgent Requests</span>
                            <div className="bg-rose-100 p-2 rounded-lg">
                                <AlertTriangle className="h-5 w-5 text-rose-500" />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-3">
                            <p className="text-4xl font-black text-slate-400">0</p>
                            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">Normal Load</span>
                        </div>
                    </div>
                </div>

                {/* TABS & FILTERS */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-1.5 flex items-center justify-between mb-6">
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setActiveTab('Pending')}
                            className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center gap-2 ${activeTab === 'Pending' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                        >
                            <Clock className="h-4 w-4" /> Pending
                        </button>
                        <button
                            onClick={() => setActiveTab('Completed')}
                            className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center gap-2 ${activeTab === 'Completed' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                        >
                            <CheckCircle className="h-4 w-4" /> Completed
                        </button>
                    </div>
                    <div className="relative hidden md:block mr-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                        <input className="bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-teal-500 w-64 outline-none transition-all placeholder:font-medium" placeholder="Search orders..." />
                    </div>
                </div>

                {/* MAIN TABLE */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 border-b border-slate-200">
                                <tr>
                                    {['Order ID', 'Patient Name', 'Test Type', 'Status', ...(activeTab === 'Completed' ? ['Result'] : []), 'Action'].map((head) => (
                                        <th key={head} className="px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-400 first:pl-8 last:pr-8 last:text-right">
                                            {head}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr><td colSpan={6} className="text-center py-16 text-slate-400 animate-pulse font-medium">Fetching orders...</td></tr>
                                ) : orders.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-20">
                                            <div className="flex flex-col items-center justify-center opacity-40">
                                                <Microscope className="h-12 w-12 text-slate-400 mb-3" />
                                                <p className="text-slate-500 font-bold">No {activeTab.toLowerCase()} orders found</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    orders.map((order) => (
                                        <tr key={order.order_id} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="px-6 py-5 pl-8 text-sm font-bold text-slate-900 font-mono">#{String(order.order_id).slice(0, 8)}</td>
                                            <td className="px-6 py-5">
                                                <div className="font-bold text-slate-800">{order.patient_name}</div>
                                                <div className="text-xs text-slate-400 font-medium">{new Date(order.created_at).toLocaleDateString()}</div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-bold border border-slate-200">{order.test_type}</span>
                                            </td>
                                            <td className="px-6 py-5">{getStatusBadge(order.status)}</td>
                                            {activeTab === 'Completed' && (
                                                <td className="px-6 py-5 text-sm text-slate-600 font-mono font-medium">{order.result_value || '-'}</td>
                                            )}
                                            <td className="px-6 py-5 pr-8 text-right">
                                                {activeTab === 'Pending' ? (
                                                    <button
                                                        onClick={() => handleOpenUpload(order)}
                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700 transition-all shadow-md shadow-teal-500/20 hover:shadow-lg hover:-translate-y-0.5"
                                                    >
                                                        <Upload className="h-3.5 w-3.5" /> Process Order
                                                    </button>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-400 rounded-lg text-xs font-bold border border-slate-200">
                                                        <CheckCircle className="h-3.5 w-3.5" /> Archived
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </main>

            {/* UPLOAD MODAL */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className="bg-teal-100 p-2 rounded-lg">
                                    <Cloud className="h-5 w-5 text-teal-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-800 leading-none">Upload Results</h3>
                                    <p className="text-xs font-bold text-slate-400 mt-1">Order #{String(selectedOrder.order_id).slice(0, 8)}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600 transition-colors bg-white rounded-full p-2 hover:bg-slate-100 border border-transparent hover:border-slate-200">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100 flex items-center justify-between relative overflow-hidden">
                                <div className="absolute left-0 top-0 h-full w-1 bg-blue-400" />
                                <div>
                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Patient</p>
                                    <p className="text-base font-bold text-slate-900">{selectedOrder.patient_name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Test Requested</p>
                                    <p className="text-base font-bold text-teal-700">{selectedOrder.test_type}</p>
                                </div>
                            </div>

                            <div className="xyz-in-study">
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-2 ml-1">Result Value / File</label>
                                <div className="relative group">
                                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors h-4 w-4" />
                                    <input
                                        value={resultValue}
                                        onChange={(e) => setResultValue(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none font-bold text-slate-800 transition-all focus:bg-white"
                                        placeholder="Enter numeric result (e.g. 12.5 g/dL)"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-2 ml-1">Technician Remarks</label>
                                <textarea
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-teal-500 outline-none resize-none transition-all focus:bg-white font-medium"
                                    placeholder="Add clinical observations or notes..."
                                    rows={3}
                                ></textarea>
                            </div>
                        </div>

                        <div className="px-6 py-5 bg-slate-50 flex gap-3 justify-end border-t border-slate-100">
                            <button onClick={() => setSelectedOrder(null)} className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitResult}
                                disabled={isSubmitting}
                                className="px-8 py-3 bg-teal-600 text-white text-sm font-bold rounded-xl hover:bg-teal-700 shadow-xl shadow-teal-500/20 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-95 transition-all"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-4 w-4" /> Finalize Results
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
