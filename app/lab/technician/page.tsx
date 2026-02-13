'use client';

import React, { useState, useEffect } from 'react';
import {
    Microscope, Search, Filter, Plus, Clock, AlertTriangle, CheckCircle,
    FileText, Upload, X, Send, Cloud
} from 'lucide-react';
import { getPendingOrders, uploadResult } from '@/app/actions/lab-actions';
import { Link } from 'lucide-react'; // Typo fix: Link is from next/link, reusing icons

type LabOrder = {
    order_id: string;
    patient_name: string;
    test_type: string;
    doctor_name: string;
    status: string;
    created_at: Date;
};

export default function LabPage() {
    const [orders, setOrders] = useState<LabOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null); // For Modal
    const [remarks, setRemarks] = useState('');

    useEffect(() => {
        async function fetchOrders() {
            const res = await getPendingOrders();
            if (res.success) {
                setOrders(res.data as any);
            }
            setLoading(false);
        }
        fetchOrders();
    }, []);

    const handleOpenUpload = (order: LabOrder) => {
        setSelectedOrder(order);
        setRemarks('');
    };

    const handleSubmitResult = async () => {
        if (!selectedOrder) return;

        // Mock file upload - in real app would upload to Storage first
        const mockFileUrl = `https://storage.avani.os/results/${selectedOrder.order_id}.pdf`;

        await uploadResult(selectedOrder.order_id, mockFileUrl, remarks);

        alert('Result Uploaded & Patient Notified');
        setSelectedOrder(null);

        // Refresh local state roughly
        const res = await getPendingOrders();
        if (res.success) {
            setOrders(res.data as any);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Pending': return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                    PENDING
                </span>
            );
            case 'Processing': return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                    PROCESSING
                </span>
            );
            default: return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                    {status}
                </span>
            );
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            {/* HEADER */}
            <header className="bg-white border-b border-slate-200 px-8 py-3 sticky top-0 z-40 flex items-center justify-between">
                <div className="flex items-center gap-2 text-teal-700">
                    <Microscope className="h-6 w-6" />
                    <h2 className="font-bold text-lg">Avani Hospital OS</h2>
                </div>
                <nav className="flex items-center gap-6 text-sm font-medium text-slate-500">
                    <a href="#" className="text-teal-700 border-b-2 border-teal-700 pb-1 font-bold">Worklist</a>
                    <a href="#" className="hover:text-teal-700 transition-colors">Archive</a>
                    <a href="#" className="hover:text-teal-700 transition-colors">Reports</a>
                </nav>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                        <input className="bg-slate-100 rounded-lg pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-teal-500 w-64 border-none" placeholder="Search orders..." />
                    </div>
                    <div className="h-8 w-8 bg-teal-100 rounded-full flex items-center justify-center text-teal-800 font-bold text-xs">
                        AR
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">

                {/* TITLE SECTION */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-teal-50 rounded-lg text-teal-600">
                            <Microscope className="h-8 w-8" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">Pathology Lab Worklist</h1>
                    </div>
                    <div className="flex gap-2">
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50">
                            <Filter className="h-4 w-4" /> Filter
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 shadow-sm">
                            <Plus className="h-4 w-4" /> New Order
                        </button>
                    </div>
                </div>

                {/* STATS CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Pending</span>
                            <Clock className="h-5 w-5 text-slate-400" />
                        </div>
                        <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-bold text-slate-900">{orders.length}</p>
                            <p className="text-xs text-slate-500 font-medium">Active Orders</p>
                        </div>
                    </div>
                    {/* Urgent Placeholder */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-red-500">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-red-500 uppercase tracking-wider">Urgent Orders</span>
                            <AlertTriangle className="h-5 w-5 text-red-500 animate-pulse" />
                        </div>
                        <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-bold text-red-600">0</p>
                            <p className="text-xs text-red-400 font-medium">Needs Action</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">Completed Today</span>
                            <CheckCircle className="h-5 w-5 text-teal-600" />
                        </div>
                        <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-bold text-slate-900">12</p>
                            <p className="text-xs text-teal-600 font-medium">+4 since noon</p>
                        </div>
                    </div>
                </div>

                {/* WORKLIST TABLE */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                        <div className="flex gap-4">
                            <button className="text-sm font-bold text-teal-700 border-b-2 border-teal-700 pb-1">All Worklist</button>
                            <button className="text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors">Pending</button>
                        </div>
                        <p className="text-xs text-slate-400 font-medium italic">Showing active orders</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Order ID</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Patient Name</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Test Type</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ordering Doctor</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr><td colSpan={6} className="text-center py-10 text-slate-400">Loading orders...</td></tr>
                                ) : orders.length === 0 ? (
                                    <tr><td colSpan={6} className="text-center py-10 text-slate-400">No pending orders found.</td></tr>
                                ) : (
                                    orders.map((order) => (
                                        <tr key={order.order_id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-bold text-slate-900">#{order.order_id ? String(order.order_id).slice(0, 6) : '---'}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-slate-700">{order.patient_name}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600">{order.test_type}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600">{order.doctor_name || 'Dr. Smith'}</td>
                                            <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleOpenUpload(order)}
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 border border-teal-600 text-teal-600 rounded-lg text-xs font-bold hover:bg-teal-600 hover:text-white transition-all"
                                                >
                                                    <Upload className="h-3 w-3" /> Upload Result
                                                </button>
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-teal-600" />
                                <h3 className="text-lg font-bold text-slate-900">Upload Test Results</h3>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-8">
                            <div className="mb-6 p-4 bg-teal-50 rounded-lg border border-teal-100">
                                <div className="flex justify-between mb-1">
                                    <span className="text-xs font-semibold text-slate-500">PATIENT</span>
                                    <span className="text-xs font-semibold text-slate-500">ORDER ID</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm font-bold text-slate-900">{selectedOrder.patient_name}</span>
                                    <span className="text-sm font-bold text-teal-700">#{selectedOrder.order_id}</span>
                                </div>
                                <p className="text-xs text-slate-500 mt-2">Test: <span className="text-slate-700 font-medium">{selectedOrder.test_type}</span></p>
                            </div>

                            <div className="border-2 border-dashed border-slate-300 rounded-xl p-10 flex flex-col items-center justify-center hover:border-teal-500 transition-colors bg-slate-50 cursor-pointer">
                                <div className="h-16 w-16 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 mb-4">
                                    <Cloud className="h-8 w-8" />
                                </div>
                                <p className="text-sm font-bold text-slate-900 mb-1">Click to upload result PDF</p>
                                <p className="text-xs text-slate-500">Max file size 5MB</p>
                            </div>

                            <div className="mt-6">
                                <label className="block text-sm font-bold text-slate-700 mb-2">Technician Remarks</label>
                                <textarea
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    className="w-full border-slate-200 rounded-lg p-3 text-sm focus:ring-teal-500 text-slate-900 resize-none"
                                    placeholder="Add observations..."
                                    rows={3}
                                ></textarea>
                            </div>
                        </div>

                        <div className="px-8 py-6 bg-slate-50 flex gap-4 justify-end border-t border-slate-100">
                            <button onClick={() => setSelectedOrder(null)} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleSubmitResult} className="px-8 py-2.5 bg-teal-600 text-white text-sm font-bold rounded-lg hover:bg-teal-700 shadow-md flex items-center gap-2">
                                <Send className="h-4 w-4" /> Submit Result
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
