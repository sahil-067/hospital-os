'use client';

import React, { useState, useEffect } from 'react';
import {
    Users, Activity, Clock, Plus, Search,
    FileText, FlaskConical, Pill, AlertTriangle, Save,
    Stethoscope, User, RefreshCw, X, History, Clipboard,
    Printer, CheckCircle2, Loader2
} from 'lucide-react';
import { getPatientQueue, admitPatient, saveClinicalNotes, orderLabTest, getPatientLabOrders, updateAppointmentStatus, getMedicineList, createPharmacyOrder, getPatientHistory, saveMedicalNote } from '@/app/actions/doctor-actions';
import { dischargePatient } from '@/app/actions/discharge-actions';
import { registerPatient } from '@/app/actions/register-patient';

// Types
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

type EHRRecord = {
    appointment_id: string;
    doctor_name: string;
    diagnosis: string;
    doctor_notes: string;
    created_at: string;
};

export default function DoctorDashboard() {
    const [queue, setQueue] = useState<Patient[]>([]);
    const [activePatient, setActivePatient] = useState<Patient | null>(null);
    const [activeTab, setActiveTab] = useState<'notes' | 'lab' | 'pharmacy' | 'history'>('notes');
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false); // Global Loading State

    // Filter State
    const [searchTerm, setSearchTerm] = useState('');

    // Form States
    const [diagnosis, setDiagnosis] = useState('');
    const [notes, setNotes] = useState('');
    const [selectedTest, setSelectedTest] = useState('');

    // Admitted / Medical Notes State
    const [medicalNoteType, setMedicalNoteType] = useState('Routine Check');
    const [medicalNoteDetails, setMedicalNoteDetails] = useState('');

    // Modals
    const [showAdmitModal, setShowAdmitModal] = useState(false);
    const [admitDiagnosis, setAdmitDiagnosis] = useState('');
    const [showWalkinModal, setShowWalkinModal] = useState(false);
    const [walkinFormData, setWalkinFormData] = useState({
        full_name: '', phone: '', age: '', gender: 'Male', department: 'General', address: ''
    });

    // Prescription View Logic
    const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);

    // Lab Orders State
    const [labOrders, setLabOrders] = useState<LabOrder[]>([]);
    const [loadingLabs, setLoadingLabs] = useState(false);

    // History State
    const [history, setHistory] = useState<EHRRecord[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Pharmacy State
    const [medicines, setMedicines] = useState<{ id: number, brand_name: string, price_per_unit: number }[]>([]);
    const [pharmacyCart, setPharmacyCart] = useState<{ name: string, qty: number, price: number }[]>([]);
    const [selectedMedicine, setSelectedMedicine] = useState('');
    const [medicineQty, setMedicineQty] = useState(1);
    const [pharmacyOrderResult, setPharmacyOrderResult] = useState<any>(null);

    // Discharge Logic
    const [isDischarging, setIsDischarging] = useState(false);
    const [showDischargeModal, setShowDischargeModal] = useState(false);
    const [dischargePdfUrl, setDischargePdfUrl] = useState<string | null>(null);

    // --- INITIAL DATA FETCHING ---
    useEffect(() => {
        async function fetchQueue() {
            try {
                const res = await getPatientQueue();
                if (res.success) {
                    setQueue(res.data as any);
                    if (res.data.length > 0 && !activePatient) setActivePatient(res.data[0] as any);
                }
            } finally {
                setLoading(false);
            }
        }
        fetchQueue();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        async function loadMeds() {
            const res = await getMedicineList();
            if (res.success) setMedicines(res.data as any);
        }
        loadMeds();
    }, []);

    useEffect(() => {
        if (activePatient && activeTab === 'history') {
            async function loadHistory() {
                setLoadingHistory(true);
                const res = await getPatientHistory(activePatient!.patient_id);
                if (res.success) setHistory(res.data as any);
                setLoadingHistory(false);
            }
            loadHistory();
        }
    }, [activePatient, activeTab]);

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

    // --- BUTTON LOCKING WRAPPER ---
    const withSubmission = async (fn: () => Promise<void>) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await fn();
        } catch (error) {
            console.error(error);
            alert('An unexpected error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- ACTIONS ---

    const handleSaveNotes = () => withSubmission(async () => {
        if (!activePatient?.appointment_id) return alert('Error: No Appointment ID.');

        if (activePatient.status === 'Admitted') {
            await saveMedicalNote({
                admission_id: 'LOOKUP_BY_PATIENT:' + activePatient.patient_id,
                note_type: medicalNoteType,
                details: medicalNoteDetails
            });
            alert('Medical Note Saved');
            setMedicalNoteDetails('');
        } else {
            await saveClinicalNotes({
                patient_id: activePatient.patient_id,
                appointment_id: activePatient.appointment_id,
                diagnosis,
                notes,
                doctor: 'Dr. Sarah'
            });
            alert('Clinical Notes Saved');
        }
    });

    const handleOrderLab = () => withSubmission(async () => {
        if (!activePatient) return;
        await orderLabTest({
            patient_id: activePatient.patient_id,
            test_type: selectedTest,
            doctor_id: 'doc1'
        });
        alert(`Ordered ${selectedTest}`);
        fetchLabs(activePatient.patient_id);
    });

    const handleAdmitSubmit = () => withSubmission(async () => {
        if (!activePatient) return;
        await admitPatient(activePatient.patient_id, 'Dr. Sarah', admitDiagnosis);
        alert('Patient Admitted');
        setShowAdmitModal(false);
        handleStatusUpdate('Admitted');
    });

    const handleWalkinSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            Object.entries(walkinFormData).forEach(([k, v]) => formData.append(k, v));
            const res = await registerPatient(formData);
            if (res.success) {
                alert(`Walk-in Registered! Patient ID: ${res.patient_id}`);
                setShowWalkinModal(false);
                const q = await getPatientQueue();
                if (q.success) setQueue(q.data as any);
            } else {
                alert('Registration Failed: ' + res.error);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStatusUpdate = async (newStatus: string) => {
        if (!activePatient?.appointment_id || isSubmitting) return;

        // Optimistic UI Update
        const updatedQueue = queue.map(p =>
            p.appointment_id === activePatient.appointment_id ? { ...p, status: newStatus } : p
        );
        setQueue(updatedQueue);
        setActivePatient(prev => prev ? { ...prev, status: newStatus } : null);

        await updateAppointmentStatus(activePatient.appointment_id, newStatus);
    };

    // Pharmacy Logic
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

    const handlePlaceOrder = () => withSubmission(async () => {
        if (!activePatient || pharmacyCart.length === 0) return;
        const res = await createPharmacyOrder(activePatient.patient_id, 'Dr. Sarah', pharmacyCart);
        if (res.success) {
            setPharmacyOrderResult(res.agentResponse);
            setPharmacyCart([]);
            alert('Order Sent to Pharmacy! You can verify status in the result panel.');
        } else {
            alert('Order Failed');
        }
    });

    const handlePrintPrescription = () => {
        if (pharmacyCart.length === 0) return alert("Add medicines to cart first!");
        setShowPrescriptionModal(true);
    };

    // --- UTILS ---
    const filteredQueue = queue.filter(p =>
        p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.digital_id && p.digital_id.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const getStatusColor = (status?: string) => {
        switch (status?.toLowerCase()) {
            case 'in progress': return 'border-l-4 border-l-blue-500 bg-blue-50/50';
            case 'completed': return 'border-l-4 border-l-emerald-500 opacity-60 bg-emerald-50/30';
            case 'cancelled': return 'border-l-4 border-l-rose-500 opacity-60 bg-rose-50/30';
            case 'admitted': return 'border-l-4 border-l-rose-600 bg-rose-100/50';
            default: return 'border-l-4 border-l-amber-400 bg-amber-50/30';
        }
    };

    const handleDischarge = async () => {
        if (!activePatient || activePatient.status !== 'Admitted') return;
        if (!confirm(`Are you sure you want to discharge ${activePatient.full_name}?`)) return;

        setIsDischarging(true);
        try {
            const res = await dischargePatient(activePatient.patient_id);
            if (res.success && res.pdfBase64) {
                // Convert Base64 to Blob URL
                const byteCharacters = atob(res.pdfBase64);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);

                setDischargePdfUrl(url);
                setShowDischargeModal(true);
                handleStatusUpdate('Completed'); // Mark as discharged/completed
                alert('Discharge Summary Generated Successfully!');
            } else {
                alert('Failed to generate discharge summary: ' + res.error);
            }
        } catch (e) {
            console.error(e);
            alert('An error occurred during discharge.');
        } finally {
            setIsDischarging(false);
        }
    };

    return (
        <div className="flex h-screen bg-slate-50 font-sans overflow-hidden text-slate-800">
            {/* ... other modals ... */}

            {/* DISCHARGE PDF MODAL */}
            {showDischargeModal && dischargePdfUrl && (
                <div className="fixed inset-0 z-[60] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-4xl h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                        <div className="px-6 py-4 bg-slate-800 text-white flex justify-between items-center shrink-0">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <FileText className="h-5 w-5" /> Discharge Summary
                            </h3>
                            <button onClick={() => setShowDischargeModal(false)} className="hover:bg-white/20 p-1.5 rounded-full transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="flex-1 bg-slate-100 p-0 relative">
                            <iframe src={dischargePdfUrl} className="w-full h-full" title="Discharge Summary PDF"></iframe>
                        </div>
                        <div className="p-4 bg-white border-t border-slate-200 flex justify-end gap-3 shrink-0">
                            <button onClick={() => setShowDischargeModal(false)} className="px-6 py-2.5 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                                Close
                            </button>
                            <a href={dischargePdfUrl} download={`Discharge_Summary_${activePatient?.full_name}.pdf`} className="px-6 py-2.5 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 shadow-lg shadow-teal-500/20 flex items-center gap-2">
                                <Clipboard className="h-4 w-4" /> Download PDF
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* WALK-IN MODAL */}
            {showWalkinModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-gradient-to-r from-teal-600 to-teal-800 px-6 py-4 flex justify-between items-center text-white">
                            <h3 className="font-bold text-lg flex items-center gap-2"><Plus className="h-5 w-5" /> Walk-in Registration</h3>
                            <button onClick={() => setShowWalkinModal(false)} className="hover:bg-white/20 p-1 rounded-full"><X className="h-5 w-5" /></button>
                        </div>
                        <form onSubmit={handleWalkinSubmit} className="p-6 space-y-4">
                            <input required placeholder="Full Name" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" value={walkinFormData.full_name} onChange={e => setWalkinFormData({ ...walkinFormData, full_name: e.target.value })} />
                            <div className="grid grid-cols-2 gap-4">
                                <input required placeholder="Phone" className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" value={walkinFormData.phone} onChange={e => setWalkinFormData({ ...walkinFormData, phone: e.target.value })} />
                                <input required placeholder="Age" type="number" min="0" className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" value={walkinFormData.age} onChange={e => setWalkinFormData({ ...walkinFormData, age: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <select className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" value={walkinFormData.gender} onChange={e => setWalkinFormData({ ...walkinFormData, gender: e.target.value })}>
                                    <option>Male</option><option>Female</option><option>Other</option>
                                </select>
                                <select className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" value={walkinFormData.department} onChange={e => setWalkinFormData({ ...walkinFormData, department: e.target.value })}>
                                    <option>General</option><option>Cardiology</option><option>Orthopedics</option>
                                </select>
                            </div>
                            <textarea placeholder="Address" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" rows={2} value={walkinFormData.address} onChange={e => setWalkinFormData({ ...walkinFormData, address: e.target.value })} />
                            <button type="submit" disabled={isSubmitting} className="w-full bg-teal-600 text-white font-bold py-3.5 rounded-xl hover:bg-teal-700 disabled:opacity-70 flex justify-center items-center gap-2">
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Register Patient'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ADMIT MODAL */}
            {showAdmitModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-gradient-to-r from-rose-500 to-rose-700 px-6 py-4 flex justify-between items-center text-white">
                            <h3 className="font-bold text-lg flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Admit Patient</h3>
                            <button onClick={() => setShowAdmitModal(false)} className="hover:bg-white/20 p-1 rounded-full"><X className="h-5 w-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-slate-600">Please enter the provisional diagnosis to admit <strong>{activePatient?.full_name}</strong>.</p>
                            <textarea
                                autoFocus
                                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
                                rows={4}
                                placeholder="Provisional Diagnosis..."
                                value={admitDiagnosis}
                                onChange={e => setAdmitDiagnosis(e.target.value)}
                            />
                            <button
                                onClick={handleAdmitSubmit}
                                disabled={!admitDiagnosis.trim() || isSubmitting}
                                className="w-full bg-rose-600 text-white font-bold py-3 rounded-xl hover:bg-rose-700 disabled:opacity-50 flex justify-center items-center gap-2"
                            >
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Admission'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PRESCRIPTION PREVIEW MODAL */}
            {showPrescriptionModal && activePatient && (
                <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden print-area">
                        <div className="p-8 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">Rx Prediction</h2>
                                <p className="text-sm text-slate-500">Official Prescription</p>
                            </div>
                            <div className="text-right">
                                <h3 className="font-bold text-lg">Avani Hospital</h3>
                                <p className="text-xs text-slate-500">Dr. Sarah • General Medicine</p>
                                <p className="text-xs text-slate-500">{new Date().toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase">Patient Name</p>
                                    <p className="font-bold text-lg text-slate-800">{activePatient.full_name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-slate-400 uppercase">Patient ID</p>
                                    <p className="font-mono text-slate-800">{activePatient.digital_id || activePatient.patient_id}</p>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><Pill className="h-4 w-4" /> Medicines Prescribed</h4>
                                <ul className="divide-y divide-dashed divide-slate-300">
                                    {pharmacyCart.map((item, i) => (
                                        <li key={i} className="py-2 flex justify-between">
                                            <span className="font-medium text-slate-700">{item.name}</span>
                                            <span className="font-bold text-slate-900">Qty: {item.qty}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="mt-8 pt-8 border-t border-slate-200">
                                <p className="text-sm text-slate-500 italic text-center">Take exactly as prescribed.</p>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end gap-3 no-print">
                            <button
                                onClick={() => setShowPrescriptionModal(false)}
                                className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-lg"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => window.print()}
                                className="px-6 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 flex items-center gap-2"
                            >
                                <Printer className="h-4 w-4" /> Print
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* LEFT SIDEBAR - QUEUE */}
            <aside className="w-80 flex flex-col border-r border-slate-200 bg-white">
                <div className="p-5 border-b border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                            <Users className="h-5 w-5 text-teal-600" />
                            Patient Queue
                        </h3>
                        <span className="bg-teal-50 text-teal-700 text-xs px-2.5 py-1 rounded-full font-bold shadow-sm">{filteredQueue.length}</span>
                    </div>
                    {/* Search Bar */}
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search patient..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Queue List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2 scroller">
                    {loading ? <div className="text-center p-8 text-slate-400 animate-pulse">Loading queue...</div> : (
                        filteredQueue.length === 0 ? (
                            <div className="text-center p-12 text-slate-400 text-sm flex flex-col items-center gap-2">
                                <Users className="h-8 w-8 text-slate-200" />
                                No patients found
                            </div>
                        ) : (
                            filteredQueue.map((p) => (
                                <div
                                    key={p.patient_id}
                                    onClick={isSubmitting ? undefined : () => setActivePatient(p)}
                                    className={`p-4 rounded-xl cursor-pointer transition-all border shadow-sm group ${activePatient?.patient_id === p.patient_id
                                        ? 'bg-teal-50 border-teal-500 ring-1 ring-teal-500 hover:shadow-md scale-[1.02]'
                                        : 'bg-white hover:border-teal-300 border-slate-200 hover:shadow-md'
                                        } ${getStatusColor(p.status)} ${isSubmitting ? 'opacity-50 pointer-events-none' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${p.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                            p.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                                                p.status === 'Admitted' ? 'bg-rose-100 text-rose-700' :
                                                    'bg-amber-100 text-amber-700'
                                            }`}>
                                            {p.status || 'Pending'}
                                        </span>
                                        <span className="text-xs text-slate-400 font-mono">
                                            #{p.digital_id ? p.digital_id : p.patient_id.slice(0, 4)}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-base truncate text-slate-800 group-hover:text-teal-700 transition-colors">{p.full_name}</h4>
                                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                        {p.department || 'General'}
                                    </p>
                                </div>
                            ))
                        )
                    )}
                </div>

                <div className="p-4 border-t border-slate-100">
                    <button
                        onClick={() => setShowWalkinModal(true)}
                        disabled={isSubmitting}
                        className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-bold hover:bg-slate-50 hover:text-teal-600 hover:border-teal-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <Plus className="h-4 w-4" /> Add Walk-in
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 flex flex-col min-w-0 bg-slate-50/50 relative">
                {/* Decorative background pattern */}
                <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #0f766e 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>

                {/* Header */}
                <header className="bg-white border-b border-slate-200 h-16 px-6 flex items-center justify-between shrink-0 z-10 shadow-sm relative">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-teal-500 to-teal-700 p-2 rounded-lg text-white shadow-lg shadow-teal-500/30">
                            <Activity className="h-5 w-5" />
                        </div>
                        <h1 className="font-bold text-xl text-slate-800 tracking-tight">Doctor's Console</h1>
                    </div>
                </header>

                {activePatient ? (
                    <div className="flex-1 overflow-y-auto p-6 z-10 relative">

                        {/* ACTIVE PATIENT HEADER */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-5">
                                <div className="h-16 w-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl border border-slate-200 flex items-center justify-center text-slate-400 shadow-inner">
                                    <User className="h-8 w-8" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h1 className="text-2xl font-bold text-slate-900">{activePatient.full_name}</h1>
                                        <span className="bg-teal-50 text-teal-700 border border-teal-100 text-xs font-bold px-2 py-1 rounded-md shadow-sm">
                                            ID: {activePatient.digital_id ? activePatient.digital_id : activePatient.patient_id}
                                        </span>
                                    </div>
                                    <div className="flex gap-4 mt-2 text-sm text-slate-500">
                                        <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded border border-slate-100"><Clock className="h-3.5 w-3.5" /> {new Date(activePatient.created_at).toLocaleTimeString()}</span>
                                        <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded border border-slate-100"><Stethoscope className="h-3.5 w-3.5" /> {activePatient.department}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 items-center">
                                {/* Status Dropdown */}
                                <select
                                    value={activePatient.status || 'Pending'}
                                    onChange={(e) => handleStatusUpdate(e.target.value)}
                                    disabled={isSubmitting}
                                    className="bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded-xl focus:ring-teal-500 focus:border-teal-500 block p-2.5 font-bold shadow-sm outline-none"
                                >
                                    <option value="Scheduled">Scheduled</option>
                                    <option value="Checked In">Checked In</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Cancelled">Cancelled</option>
                                    <option value="Admitted">Admitted</option>
                                </select>

                                {activePatient.status === 'Admitted' ? (
                                    <button
                                        onClick={handleDischarge}
                                        disabled={isDischarging}
                                        className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-sm rounded-xl hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
                                    >
                                        {isDischarging ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="h-4 w-4" /> DISCHARGE</>}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setShowAdmitModal(true)}
                                        disabled={isSubmitting}
                                        className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-rose-600 text-white font-bold text-sm rounded-xl hover:from-rose-600 hover:to-rose-700 shadow-lg shadow-rose-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
                                    >
                                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><AlertTriangle className="h-4 w-4" /> ADMIT</>}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* TABS & WORKSPACE */}
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm min-h-[500px] flex flex-col overflow-hidden">
                            <div className="flex border-b border-slate-200 px-2 pt-2 bg-slate-50/50">
                                {['notes', 'history', 'lab', 'pharmacy'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab as any)}
                                        className={`px-6 py-4 text-sm font-bold border-b-[3px] flex items-center gap-2 transition-all outline-none ${activeTab === tab
                                            ? 'border-teal-600 text-teal-700 bg-teal-50/50 rounded-t-lg'
                                            : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50 rounded-t-lg'
                                            }`}
                                    >
                                        {tab === 'notes' && <FileText className="h-4 w-4" />}
                                        {tab === 'history' && <History className="h-4 w-4" />}
                                        {tab === 'lab' && <FlaskConical className="h-4 w-4" />}
                                        {tab === 'pharmacy' && <Pill className="h-4 w-4" />}

                                        {tab === 'notes' ? (activePatient.status === 'Admitted' ? 'Medical Notes' : 'Clinical Notes') :
                                            tab === 'history' ? 'History' :
                                                tab === 'lab' ? 'Labs' : 'Pharmacy'}
                                    </button>
                                ))}
                            </div>

                            <div className="p-8 flex-1 bg-white">
                                {activeTab === 'notes' && (
                                    <div className="max-w-3xl space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        {activePatient.status === 'Admitted' ? (
                                            /* ADMITTED PATIENT VIEW */
                                            <>
                                                <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-center gap-3">
                                                    <div className="bg-blue-100 p-2 rounded-lg"><Clipboard className="h-5 w-5 text-blue-600" /></div>
                                                    <div>
                                                        <span className="text-blue-900 text-sm font-bold block">Admitted Patient Record</span>
                                                        <span className="text-blue-700 text-xs">Document routine checks and nursing notes here.</span>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-bold text-slate-700">Note Type</label>
                                                    <select
                                                        value={medicalNoteType} onChange={e => setMedicalNoteType(e.target.value)}
                                                        className="w-full bg-slate-50 border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                                                    >
                                                        <option>Routine Check</option>
                                                        <option>Admission Note</option>
                                                        <option>Nursing</option>
                                                        <option>Discharge Advice</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-bold text-slate-700">Details</label>
                                                    <textarea
                                                        value={medicalNoteDetails} onChange={e => setMedicalNoteDetails(e.target.value)}
                                                        className="w-full bg-slate-50 border-slate-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                                                        placeholder="Enter routine check details or nursing notes..."
                                                        rows={8}
                                                    ></textarea>
                                                </div>
                                            </>
                                        ) : (
                                            /* NORMAL OPD VIEW */
                                            <>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-bold text-slate-700">Diagnosis</label>
                                                    <input
                                                        value={diagnosis} onChange={e => setDiagnosis(e.target.value)}
                                                        className="w-full bg-slate-50 border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                                                        placeholder="Primary Diagnosis..."
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-bold text-slate-700">Doctor Notes & Observations</label>
                                                    <textarea
                                                        value={notes} onChange={e => setNotes(e.target.value)}
                                                        className="w-full bg-slate-50 border-slate-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                                                        placeholder="Enter clinical observations..."
                                                        rows={8}
                                                    ></textarea>
                                                </div>
                                            </>
                                        )}

                                        <div className="flex justify-end pt-4">
                                            <button
                                                onClick={handleSaveNotes}
                                                disabled={isSubmitting}
                                                className="px-8 py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 flex items-center gap-2 shadow-lg shadow-teal-500/20 disabled:opacity-50 transition-all"
                                            >
                                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Save Record</>}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'history' && (
                                    <div className="max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-lg">
                                            <div className="bg-slate-100 p-1.5 rounded-lg"><History className="h-5 w-5 text-slate-600" /></div> Patient History
                                        </h3>
                                        {loadingHistory ? (
                                            <div className="text-center py-12 text-slate-400">Loading history...</div>
                                        ) : history.length === 0 ? (
                                            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-8 text-center text-slate-500 text-sm">No previous records found.</div>
                                        ) : (
                                            <div className="space-y-4">
                                                {history.map((record, i) => (
                                                    <div key={i} className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div>
                                                                <p className="font-bold text-teal-700 text-base">{record.diagnosis || 'No Diagnosis'}</p>
                                                                <p className="text-xs text-slate-500 mt-1">{new Date(record.created_at).toLocaleDateString()} • {record.doctor_name || 'Dr. Unknown'}</p>
                                                            </div>
                                                            <div className="bg-slate-100 text-slate-600 text-[10px] uppercase font-bold px-2 py-1 rounded">
                                                                #{record.appointment_id}
                                                            </div>
                                                        </div>
                                                        <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{record.doctor_notes}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'lab' && (
                                    <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        {/* New Order Form */}
                                        <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100">
                                            <h3 className="font-bold text-indigo-900 mb-4 flex items-center gap-2">
                                                <FlaskConical className="h-5 w-5 text-indigo-600" /> Order New Test
                                            </h3>
                                            <div className="flex gap-4">
                                                <select
                                                    value={selectedTest} onChange={e => setSelectedTest(e.target.value)}
                                                    className="flex-1 bg-white border-slate-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"
                                                >
                                                    <option value="">Select Test Type...</option>
                                                    <option value="Complete Blood Count (CBC)">Complete Blood Count (CBC)</option>
                                                    <option value="Lipid Profile">Lipid Profile</option>
                                                    <option value="Dengue NS1 Antigen">Dengue NS1 Antigen</option>
                                                    <option value="Liver Function Test">Liver Function Test</option>
                                                </select>
                                                <button
                                                    onClick={handleOrderLab}
                                                    disabled={!selectedTest || isSubmitting}
                                                    className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 shadow-md shadow-indigo-500/20 flex items-center gap-2"
                                                >
                                                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Order Test'}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Existing Orders List */}
                                        <div>
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="font-bold text-slate-800 text-lg">Lab History</h3>
                                                <button onClick={() => fetchLabs(activePatient.patient_id)} className="text-teal-600 hover:bg-teal-50 p-2 rounded-lg transition-colors">
                                                    <RefreshCw className={`h-4 w-4 ${loadingLabs ? 'animate-spin' : ''}`} />
                                                </button>
                                            </div>

                                            <div className="space-y-3">
                                                {labOrders.length === 0 ? (
                                                    <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-8 text-center text-slate-400 text-sm">No lab orders found.</div>
                                                ) : (
                                                    labOrders.map(order => (
                                                        <div key={order.id} className="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:border-slate-300 transition-all">
                                                            <div className="flex items-center gap-4">
                                                                <div className={`h-3 w-3 rounded-full ring-2 ring-white shadow-sm ${order.status === 'Completed' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                                                <div>
                                                                    <p className="font-bold text-slate-900">{order.test_type}</p>
                                                                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                                        {order.barcode ? <span className="font-mono bg-slate-100 px-1 rounded">#{order.barcode}</span> : ''}
                                                                        <span className="text-slate-300">•</span>
                                                                        {new Date(order.created_at).toLocaleDateString()}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide ${order.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                                    {order.status}
                                                                </span>
                                                                {order.result_value && (
                                                                    <p className="text-xs text-slate-600 mt-1 font-mono font-medium bg-slate-50 px-2 py-0.5 rounded border border-slate-100 inline-block">{order.result_value}</p>
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
                                        <div className="flex gap-8">
                                            {/* Order Form */}
                                            <div className="flex-1 space-y-6">
                                                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                                    <div className="flex justify-between items-center mb-6">
                                                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                                            <Pill className="h-5 w-5 text-teal-600" /> Prescribe Medicine
                                                        </h3>
                                                        {pharmacyCart.length > 0 && (
                                                            <button
                                                                onClick={handlePrintPrescription}
                                                                className="text-xs font-bold text-slate-500 flex items-center gap-1 hover:text-slate-800"
                                                            >
                                                                <Printer className="h-3 w-3" /> Preview Rx
                                                            </button>
                                                        )}
                                                    </div>

                                                    <div className="flex gap-3 mb-4">
                                                        <select
                                                            value={selectedMedicine} onChange={e => setSelectedMedicine(e.target.value)}
                                                            className="flex-[2] bg-white border-slate-300 rounded-xl text-sm p-3 outline-none focus:ring-2 focus:ring-teal-500"
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
                                                            className="w-20 bg-white border-slate-300 rounded-xl text-sm p-3 outline-none focus:ring-2 focus:ring-teal-500 text-center"
                                                        />
                                                        <button
                                                            onClick={addToCart}
                                                            disabled={!selectedMedicine}
                                                            className="bg-teal-600 hover:bg-teal-700 text-white p-3 rounded-xl shadow-md active:scale-95 transition-transform"
                                                        >
                                                            <Plus className="h-5 w-5" />
                                                        </button>
                                                    </div>

                                                    {/* Cart */}
                                                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                                        <div className="bg-slate-100 px-4 py-3 text-xs font-bold text-slate-500 uppercase flex justify-between border-b border-slate-200">
                                                            <span>Current Rx Cart</span>
                                                            <span>{pharmacyCart.length} Items</span>
                                                        </div>
                                                        {pharmacyCart.length === 0 ? (
                                                            <div className="p-8 text-center text-slate-400 text-sm italic">Add medicines to create prescription</div>
                                                        ) : (
                                                            <div className="divide-y divide-slate-100">
                                                                {pharmacyCart.map((item, idx) => (
                                                                    <div key={idx} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                                                                        <div>
                                                                            <span className="font-bold text-slate-800 text-sm block">{item.name}</span>
                                                                            <span className="text-xs text-slate-500">Qty: {item.qty}</span>
                                                                        </div>
                                                                        <button onClick={() => removeFromCart(item.name)} className="text-red-400 hover:text-red-600 text-xs font-bold bg-red-50 px-2 py-1 rounded hover:bg-red-100 transition-colors">REMOVE</button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                        {pharmacyCart.length > 0 && (
                                                            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                                                                <button
                                                                    onClick={handlePlaceOrder}
                                                                    disabled={isSubmitting}
                                                                    className="bg-teal-600 text-white text-sm font-bold px-6 py-3 rounded-xl hover:bg-teal-700 shadow-lg shadow-teal-500/20 w-full flex justify-center items-center gap-2 disabled:opacity-50"
                                                                >
                                                                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send to Pharmacy'}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Order Result / Bill Preview */}
                                            {pharmacyOrderResult && (
                                                <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-lg p-6 h-fit animate-in fade-in slide-in-from-right-4 duration-500">
                                                    <div className="flex items-center gap-3 mb-6 text-emerald-600 font-bold border-b border-slate-100 pb-4">
                                                        <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                                            <CheckCircle2 className="h-6 w-6" />
                                                        </div>
                                                        <div>
                                                            <span className="block text-lg">Order Processed</span>
                                                            <span className="text-xs text-emerald-600/70 font-normal">Sent to Pharmacy Queue</span>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-4 text-sm">
                                                        <div className="flex justify-between py-2 border-b border-slate-100">
                                                            <span className="text-slate-500 font-medium">Total Requested</span>
                                                            <span className="font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-700">{pharmacyOrderResult.bill_summary?.total_items_requested}</span>
                                                        </div>
                                                        <div className="flex justify-between py-2 border-b border-slate-100">
                                                            <span className="text-slate-500 font-medium">Items Dispensed</span>
                                                            <span className="font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded">{pharmacyOrderResult.bill_summary?.items_dispensed}</span>
                                                        </div>
                                                        <div className="flex justify-between py-2 border-b border-slate-100">
                                                            <span className="text-slate-500 font-medium">Unavailable</span>
                                                            <span className="font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded">{pharmacyOrderResult.bill_summary?.items_missing}</span>
                                                        </div>
                                                        <div className="pt-6 flex justify-between items-end">
                                                            <span className="font-bold text-slate-400 uppercase text-[10px] tracking-widest mb-1 block">Total Bill Amount</span>
                                                            <span className="text-3xl font-black text-slate-800 tracking-tight">₹{pharmacyOrderResult.bill_summary?.total_amount_to_collect}</span>
                                                        </div>

                                                        <button
                                                            onClick={handlePrintPrescription}
                                                            className="w-full mt-4 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2"
                                                        >
                                                            <Printer className="h-4 w-4" /> Print Receipt
                                                        </button>

                                                        <button
                                                            onClick={() => setPharmacyOrderResult(null)}
                                                            className="w-full py-3 text-slate-400 hover:text-slate-600 text-xs font-bold"
                                                        >
                                                            New Order
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
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 relative">
                        {/* Decorative background */}
                        <div className="absolute inset-0 z-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #0f766e 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>

                        <div className="z-10 flex flex-col items-center animate-in zoom-in-95 duration-500">
                            <div className="h-24 w-24 bg-white rounded-full mb-6 shadow-sm border border-slate-100 flex items-center justify-center">
                                <Users className="h-10 w-10 text-slate-300" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-700 mb-2">Ready for Consultation</h2>
                            <p className="text-slate-500 max-w-xs text-center">Select a patient from the queue on the left to view their details and start consultation.</p>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}
