'use client';

import React, { useState, useEffect } from 'react';
import {
    Users, Activity, Clock, Plus, Search,
    FileText, FlaskConical, Pill, AlertTriangle, Save,
    Stethoscope, User, RefreshCw
} from 'lucide-react';
import { getPatientQueue, admitPatient, saveClinicalNotes, orderLabTest, getPatientLabOrders, updateAppointmentStatus, getMedicineList, createPharmacyOrder } from '@/app/actions/doctor-actions';

// Mock types for UI state
type Patient = {
    patient_id: string;
    digital_id?: string;
    full_name: string;
    age?: string;
    gender?: string;
    department?: string;
    created_at: Date;
    status?: string;
    appointment_id?: string;
};

type LabOrder = {
    id: string;
    test_type: string;
    status: string;
    result_value?: string;
    created_at: Date;
    barcode?: string;
};

export default function DoctorDashboard() {
    const [queue, setQueue] = useState<Patient[]>([]);
    const [activePatient, setActivePatient] = useState<Patient | null>(null);
    const [activeTab, setActiveTab] = useState<'notes' | 'lab' | 'pharmacy'>('notes');
    const [loading, setLoading] = useState(true);

    // Filter State
    const [searchTerm, setSearchTerm] = useState('');

    // Form States
    const [diagnosis, setDiagnosis] = useState('');
    const [notes, setNotes] = useState('');
    const [selectedTest, setSelectedTest] = useState('');

    // Lab Orders State
    const [labOrders, setLabOrders] = useState<LabOrder[]>([]);
    const [loadingLabs, setLoadingLabs] = useState(false);

    // Pharmacy State
    const [medicines, setMedicines] = useState<{ id: number, brand_name: string, price_per_unit: number }[]>([]);
    const [pharmacyCart, setPharmacyCart] = useState<{ name: string, qty: number, price: number }[]>([]);
    const [selectedMedicine, setSelectedMedicine] = useState('');
    const [medicineQty, setMedicineQty] = useState(1);
    const [pharmacyOrderResult, setPharmacyOrderResult] = useState<any>(null);

    useEffect(() => {
        async function fetchQueue() {
            const res = await getPatientQueue();
            if (res.success) {
                setQueue(res.data as any);
                if (res.data.length > 0) setActivePatient(res.data[0] as any);
            }
            setLoading(false);
        }
        fetchQueue();
    }, []);

    // Fetch Medicines on Load
    useEffect(() => {
        async function loadMeds() {
            const res = await getMedicineList();
            if (res.success) setMedicines(res.data as any);
        }
        loadMeds();
    }, []);

    // Fetch Lab Orders when Active Patient Changes or Tab switches to Labs
    useEffect(() => {
        if (activePatient && activeTab === 'lab') {
            fetchLabs(activePatient.patient_id);
        }
    }, [activePatient, activeTab]);

    async function fetchLabs(patientId: string) {
        setLoadingLabs(true);
        const res = await getPatientLabOrders(patientId);
        if (res.success) setLabOrders(res.data as any);
        setLoadingLabs(false);
    }

    const handleSaveNotes = async () => {
        if (!activePatient?.appointment_id) {
            alert('Error: No Appointment ID found for this patient.');
            return;
        }

        await saveClinicalNotes({
            patient_id: activePatient.patient_id,
            appointment_id: activePatient.appointment_id,
            diagnosis,
            notes,
            doctor: 'Dr. Sarah'
        });
        alert('Notes Saved');
    };

    const handleOrderLab = async () => {
        if (!activePatient) return;

        await orderLabTest({
            patient_id: activePatient.patient_id,
            test_type: selectedTest,
            doctor_id: 'doc1'
        });
        alert(`Ordered ${selectedTest}`);
        fetchLabs(activePatient.patient_id);
    };

    const handleAdmit = async () => {
        if (!activePatient) return;
        if (confirm(`Are you sure you want to ADMIT ${activePatient.full_name}?`)) {
            await admitPatient(activePatient.patient_id, 'Dr. Sarah', diagnosis || 'Emergency Admission');
            alert('Patient Admitted Successfully');
        }
    };

    const handleStatusUpdate = async (newStatus: string) => {
        if (!activePatient?.appointment_id) return;

        // Optimistic UI Update
        const updatedQueue = queue.map(p =>
            p.appointment_id === activePatient.appointment_id ? { ...p, status: newStatus } : p
        );
        setQueue(updatedQueue);
        setActivePatient(prev => prev ? { ...prev, status: newStatus } : null);

        await updateAppointmentStatus(activePatient.appointment_id, newStatus);
        await updateAppointmentStatus(activePatient.appointment_id, newStatus);
    };

    // Pharmacy Functions
    const addToCart = () => {
        if (!selectedMedicine) return;
        const med = medicines.find(m => m.brand_name === selectedMedicine);
        if (!med) return;

        setPharmacyCart(prev => {
            const existing = prev.find(i => i.name === selectedMedicine);
            if (existing) {
                return prev.map(i => i.name === selectedMedicine ? { ...i, qty: i.qty + medicineQty } : i);
            }
            return [...prev, { name: selectedMedicine, qty: medicineQty, price: med.price_per_unit }];
        });
        setMedicineQty(1);
        setSelectedMedicine('');
    };

    const removeFromCart = (name: string) => {
        setPharmacyCart(prev => prev.filter(i => i.name !== name));
    };

    const handlePlaceOrder = async () => {
        if (!activePatient || pharmacyCart.length === 0) return;

        // Optimistic / Loading state could be added here
        const res = await createPharmacyOrder(activePatient.patient_id, 'Dr. Sarah', pharmacyCart);

        if (res.success) {
            setPharmacyOrderResult(res.agentResponse); // { status, bill_summary, ... }
            setPharmacyCart([]); // Clear cart
            alert('Pharmacy Order Sent!');
        } else {
            alert('Order Failed');
        }
    };

    const filteredQueue = queue.filter(p =>
        p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.digital_id && p.digital_id.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const getStatusColor = (status?: string) => {
        switch (status?.toLowerCase()) {
            case 'in progress': return 'border-l-4 border-l-blue-500';
            case 'completed': return 'border-l-4 border-l-green-500 opacity-60';
            case 'cancelled': return 'border-l-4 border-l-red-500 opacity-60';
            default: return 'border-l-4 border-l-amber-400'; // Pending/Scheduled
        }
    };

    return (
        <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">

            {/* LEFT SIDEBAR - QUEUE */}
            <aside className="w-80 flex flex-col border-r border-slate-200 bg-white">
                <div className="p-4 border-b border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                            <Users className="h-5 w-5 text-teal-600" />
                            Patient Queue
                        </h3>
                        <span className="bg-teal-50 text-teal-700 text-xs px-2 py-1 rounded-full font-bold">{filteredQueue.length}</span>
                    </div>
                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search patient..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {loading ? <div className="text-center p-4 text-slate-400">Loading queue...</div> : (
                        filteredQueue.length === 0 ? (
                            <div className="text-center p-8 text-slate-400 text-sm">No patients found</div>
                        ) : (
                            filteredQueue.map((p) => (
                                <div
                                    key={p.patient_id}
                                    onClick={() => setActivePatient(p)}
                                    className={`p-4 rounded-xl cursor-pointer transition-all border shadow-sm ${activePatient?.patient_id === p.patient_id
                                        ? 'bg-teal-50 border-teal-500 ring-1 ring-teal-500' // Active State
                                        : 'bg-white hover:border-teal-300 border-slate-200'
                                        } ${getStatusColor(p.status)}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${p.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                            p.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                                'bg-amber-100 text-amber-700'
                                            }`}>
                                            {p.status || 'Pending'}
                                        </span>
                                        <span className="text-xs text-slate-400">
                                            #{p.digital_id ? p.digital_id : p.patient_id.slice(0, 4)}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-base truncate text-slate-800">{p.full_name}</h4>
                                    <p className="text-sm text-slate-500">
                                        {p.department || 'General'}
                                    </p>
                                </div>
                            ))
                        )
                    )}
                </div>

                <div className="p-4 border-t border-slate-100">
                    <button className="w-full py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 font-medium hover:bg-slate-50 hover:text-teal-600 transition-colors flex items-center justify-center gap-2">
                        <Plus className="h-4 w-4" /> Add Walk-in
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 flex flex-col min-w-0">

                {/* HEADER */}
                <header className="bg-white border-b border-slate-200 h-16 px-6 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="bg-teal-600 p-1.5 rounded text-white">
                            <Activity className="h-5 w-5" />
                        </div>
                        <h1 className="font-bold text-lg text-slate-800">Doctor's Console</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden md:block">
                            <p className="text-sm font-bold text-slate-800">Dr. Sarah Smith</p>
                            <p className="text-xs text-slate-500">Cardiology</p>
                        </div>
                        <div className="h-9 w-9 bg-slate-200 rounded-full border border-slate-300 overflow-hidden">
                            <div className="w-full h-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold">DS</div>
                        </div>
                    </div>
                </header>

                {activePatient ? (
                    <div className="flex-1 overflow-y-auto p-6">

                        {/* ACTIVE PATIENT HEADER */}
                        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex items-center gap-4">
                                <div className="h-16 w-16 bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-center text-slate-400">
                                    <User className="h-8 w-8" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h1 className="text-2xl font-bold text-slate-900">{activePatient.full_name}</h1>
                                        <span className="bg-teal-50 text-teal-700 text-xs font-bold px-2 py-1 rounded">
                                            ID: {activePatient.digital_id ? activePatient.digital_id : activePatient.patient_id}
                                        </span>
                                    </div>
                                    <div className="flex gap-4 mt-1 text-sm text-slate-500">
                                        <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {new Date(activePatient.created_at).toLocaleTimeString()}</span>
                                        <span className="flex items-center gap-1"><Stethoscope className="h-4 w-4" /> {activePatient.department}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 items-center">
                                {/* Status Dropdown */}
                                <select
                                    value={activePatient.status || 'Pending'}
                                    onChange={(e) => handleStatusUpdate(e.target.value)}
                                    className="bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-teal-500 focus:border-teal-500 block p-2.5 font-bold"
                                >
                                    <option value="Scheduled">Scheduled</option>
                                    <option value="Checked In">Checked In</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>

                                <button
                                    onClick={handleAdmit}
                                    className="px-4 py-2 bg-red-500 text-white font-bold text-sm rounded-lg hover:bg-red-600 shadow-lg shadow-red-500/20 flex items-center gap-2"
                                >
                                    <AlertTriangle className="h-4 w-4" /> ADMIT PATIENT
                                </button>
                            </div>
                        </div>

                        {/* TABS & WORKSPACE */}
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm min-h-[500px] flex flex-col">
                            <div className="flex border-b border-slate-200 px-2 pt-2">
                                <button
                                    onClick={() => setActiveTab('notes')}
                                    className={`px-6 py-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-colors ${activeTab === 'notes' ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                                >
                                    <FileText className="h-4 w-4" /> Clinical Notes
                                </button>
                                <button
                                    onClick={() => setActiveTab('lab')}
                                    className={`px-6 py-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-colors ${activeTab === 'lab' ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                                >
                                    <FlaskConical className="h-4 w-4" /> Labs
                                </button>
                                <button
                                    onClick={() => setActiveTab('pharmacy')}
                                    className={`px-6 py-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-colors ${activeTab === 'pharmacy' ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                                >
                                    <Pill className="h-4 w-4" /> Pharmacy
                                </button>
                            </div>

                            <div className="p-8 flex-1">
                                {activeTab === 'notes' && (
                                    <div className="max-w-3xl space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700">Diagnosis</label>
                                            <input
                                                value={diagnosis} onChange={e => setDiagnosis(e.target.value)}
                                                className="w-full bg-slate-50 border-slate-300 rounded-lg p-3 text-sm focus:ring-teal-500 focus:border-teal-500"
                                                placeholder="Primary Diagnosis..."
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700">Doctor Notes & Observations</label>
                                            <textarea
                                                value={notes} onChange={e => setNotes(e.target.value)}
                                                className="w-full bg-slate-50 border-slate-300 rounded-lg p-4 text-sm focus:ring-teal-500 focus:border-teal-500"
                                                placeholder="Enter clinical observations..."
                                                rows={8}
                                            ></textarea>
                                        </div>
                                        <div className="flex justify-end">
                                            <button
                                                onClick={handleSaveNotes}
                                                className="px-6 py-2 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 flex items-center gap-2"
                                            >
                                                <Save className="h-4 w-4" /> Save Record
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'lab' && (
                                    <div className="max-w-3xl space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

                                        {/* New Order Form */}
                                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                                <FlaskConical className="h-5 w-5 text-teal-600" /> Order New Test
                                            </h3>
                                            <div className="flex gap-4">
                                                <select
                                                    value={selectedTest} onChange={e => setSelectedTest(e.target.value)}
                                                    className="flex-1 bg-white border-slate-300 rounded-lg"
                                                >
                                                    <option value="">Select Test...</option>
                                                    <option value="Complete Blood Count (CBC)">Complete Blood Count (CBC)</option>
                                                    <option value="Lipid Profile">Lipid Profile</option>
                                                    <option value="Dengue NS1 Antigen">Dengue NS1 Antigen</option>
                                                    <option value="Liver Function Test">Liver Function Test</option>
                                                </select>
                                                <button
                                                    onClick={handleOrderLab}
                                                    disabled={!selectedTest}
                                                    className="px-6 py-2 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 disabled:opacity-50"
                                                >
                                                    Order Test
                                                </button>
                                            </div>
                                        </div>

                                        {/* Existing Orders List */}
                                        <div>
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="font-bold text-slate-800">Lab History</h3>
                                                <button onClick={() => fetchLabs(activePatient.patient_id)} className="text-teal-600 hover:bg-teal-50 p-2 rounded-full">
                                                    <RefreshCw className={`h-4 w-4 ${loadingLabs ? 'animate-spin' : ''}`} />
                                                </button>
                                            </div>

                                            <div className="space-y-3">
                                                {labOrders.length === 0 ? (
                                                    <p className="text-slate-400 italic text-sm">No lab orders found for this patient.</p>
                                                ) : (
                                                    labOrders.map(order => (
                                                        <div key={order.id} className="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
                                                            <div className="flex items-center gap-4">
                                                                <div className={`h-2 w-2 rounded-full ${order.status === 'Completed' ? 'bg-green-500' : 'bg-amber-500'}`} />
                                                                <div>
                                                                    <p className="font-bold text-slate-900">{order.test_type}</p>
                                                                    <p className="text-xs text-slate-500 flex items-center gap-1">
                                                                        {order.barcode ? `Barcode: ${order.barcode} • ` : ''}
                                                                        {new Date(order.created_at).toLocaleDateString()}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className={`px-2 py-1 rounded text-xs font-bold ${order.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                                    {order.status}
                                                                </span>
                                                                {order.result_value && (
                                                                    <p className="text-xs text-slate-600 mt-1 font-mono">{order.result_value}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'pharmacy' && (
                                    <div className="max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="flex gap-6">
                                            {/* Order Form */}
                                            <div className="flex-1 space-y-6">
                                                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                                        <Pill className="h-5 w-5 text-teal-600" /> Prescribe Medicine
                                                    </h3>
                                                    <div className="flex gap-3 mb-4">
                                                        <select
                                                            value={selectedMedicine} onChange={e => setSelectedMedicine(e.target.value)}
                                                            className="flex-[2] bg-white border-slate-300 rounded-lg text-sm"
                                                        >
                                                            <option value="">Select Medicine...</option>
                                                            {medicines.map(m => (
                                                                <option key={m.id} value={m.brand_name}>{m.brand_name} (₹{m.price_per_unit})</option>
                                                            ))}
                                                        </select>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={medicineQty} onChange={e => setMedicineQty(parseInt(e.target.value) || 1)}
                                                            className="w-20 bg-white border-slate-300 rounded-lg text-sm"
                                                        />
                                                        <button
                                                            onClick={addToCart}
                                                            disabled={!selectedMedicine}
                                                            className="bg-teal-600 hover:bg-teal-700 text-white p-2 rounded-lg"
                                                        >
                                                            <Plus className="h-5 w-5" />
                                                        </button>
                                                    </div>

                                                    {/* Cart */}
                                                    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                                                        <div className="bg-slate-100 px-4 py-2 text-xs font-bold text-slate-500 uppercase flex justify-between">
                                                            <span>Prescription Cart</span>
                                                            <span>{pharmacyCart.length} Items</span>
                                                        </div>
                                                        {pharmacyCart.length === 0 ? (
                                                            <div className="p-4 text-center text-slate-400 text-sm">No medicines added</div>
                                                        ) : (
                                                            <div className="divide-y divide-slate-100">
                                                                {pharmacyCart.map((item, idx) => (
                                                                    <div key={idx} className="p-3 flex justify-between items-center">
                                                                        <div>
                                                                            <span className="font-bold text-slate-800 text-sm">{item.name}</span>
                                                                            <span className="text-xs text-slate-500 ml-2">x {item.qty}</span>
                                                                        </div>
                                                                        <button onClick={() => removeFromCart(item.name)} className="text-red-400 hover:text-red-600 text-xs font-bold">REMOVE</button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                        {pharmacyCart.length > 0 && (
                                                            <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
                                                                <button
                                                                    onClick={handlePlaceOrder}
                                                                    className="bg-teal-600 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-teal-700 shadow-md"
                                                                >
                                                                    Send to Pharmacy
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Order Result / Bill Preview */}
                                            {pharmacyOrderResult && (
                                                <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm p-6 h-fit">
                                                    <div className="flex items-center gap-2 mb-4 text-green-600 font-bold">
                                                        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                                                            <Activity className="h-4 w-4" />
                                                        </div>
                                                        Order Processed
                                                    </div>

                                                    <div className="space-y-4 text-sm">
                                                        <div className="flex justify-between py-2 border-b border-slate-100">
                                                            <span className="text-slate-500">Total Requested</span>
                                                            <span className="font-bold">{pharmacyOrderResult.bill_summary?.total_items_requested}</span>
                                                        </div>
                                                        <div className="flex justify-between py-2 border-b border-slate-100">
                                                            <span className="text-slate-500">Items Dispensed</span>
                                                            <span className="font-bold text-teal-600">{pharmacyOrderResult.bill_summary?.items_dispensed}</span>
                                                        </div>
                                                        <div className="flex justify-between py-2 border-b border-slate-100">
                                                            <span className="text-slate-500">Unavailable</span>
                                                            <span className="font-bold text-red-500">{pharmacyOrderResult.bill_summary?.items_missing}</span>
                                                        </div>
                                                        <div className="pt-4 flex justify-between items-center">
                                                            <span className="font-bold text-slate-800 uppercase text-xs">Total Bill Amount</span>
                                                            <span className="text-2xl font-extrabold text-teal-600">₹{pharmacyOrderResult.bill_summary?.total_amount_to_collect}</span>
                                                        </div>

                                                        <button
                                                            onClick={() => setPharmacyOrderResult(null)}
                                                            className="w-full mt-4 py-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                                                        >
                                                            Clear Result
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                        <div className="p-6 bg-slate-50 rounded-full mb-4">
                            <Users className="h-10 w-10 text-slate-300" />
                        </div>
                        <p>Select a patient from the queue to start consultation</p>
                    </div>
                )}

            </main>
        </div>
    );
}
