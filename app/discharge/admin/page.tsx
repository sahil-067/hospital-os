'use client';

import React, { useState, useEffect } from 'react';
import {
    Building, Users, LogOut, DollarSign, TrendingUp, Search,
    Settings, Bell, FileText, CheckSquare, X, Activity, ChevronLeft, ChevronRight
} from 'lucide-react';
import { getAdmittedPatients, processDischarge } from '@/app/actions/discharge-actions';

type Patient = {
    id: string;
    patient_name: string;
    doctor: string;
    diagnosis: string;
    days: number;
    status: string;
};

export default function DischargePage() {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [notes, setNotes] = useState('');
    const [checklist, setChecklist] = useState({
        medical: true,
        meds: true,
        billing: false,
        followup: false
    });

    useEffect(() => {
        async function init() {
            const res = await getAdmittedPatients();
            if (res.success) setPatients(res.data);
        }
        init();
    }, []);

    const handleOpenDischarge = (p: Patient) => {
        setSelectedPatient(p);
        setChecklist({ medical: true, meds: true, billing: false, followup: false });
        setNotes('');
    };

    const handleConfirmDischarge = async () => {
        if (!selectedPatient) return;
        if (!checklist.billing) return alert('Final Bill must be cleared!');

        await processDischarge(selectedPatient.id, selectedPatient.patient_name, notes);
        alert('Discharge Summary Generated & Sent');
        setSelectedPatient(null);
        // Mock refresh
        setPatients(prev => prev.filter(p => p.id !== selectedPatient.id));
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800">

            {/* HEADER */}
            <header className="bg-white px-6 py-4 flex items-center justify-between border-b border-slate-200 sticky top-0 z-40">
                <div className="flex items-center gap-2">
                    <div className="bg-teal-600 p-1.5 rounded-lg text-white">
                        <Building className="h-6 w-6" />
                    </div>
                    <h1 className="text-lg font-bold text-slate-900">Avani Hospital OS</h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center bg-slate-100 rounded-xl px-3 py-2 w-64">
                        <Search className="text-slate-400 h-4 w-4 mr-2" />
                        <input className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-slate-400 p-0" placeholder="Search patient..." />
                    </div>
                    <div className="h-10 w-10 rounded-full bg-slate-200" />
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">

                {/* DASHBOARD HEADER */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 mb-1">Discharge & Administration</h1>
                        <p className="text-slate-500">Manage patient status and hospital discharge workflows.</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50 shadow-sm flex items-center gap-2">
                            <FileText className="h-4 w-4" /> Export CSV
                        </button>
                    </div>
                </div>

                {/* KPI CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Admissions</p>
                            <Users className="h-5 w-5 text-teal-600 bg-teal-50 p-1 rounded" />
                        </div>
                        <p className="text-3xl font-bold text-slate-900">124</p>
                        <div className="flex items-center text-teal-500 text-xs font-bold mt-1">
                            <TrendingUp className="h-3 w-3 mr-1" /> 12% vs last month
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Pending Discharges</p>
                            <LogOut className="h-5 w-5 text-orange-500 bg-orange-50 p-1 rounded" />
                        </div>
                        <p className="text-3xl font-bold text-slate-900">{patients.filter(p => p.status.includes('Ready')).length + 14}</p> {/* Mock count */}
                        <div className="flex items-center text-teal-500 text-xs font-bold mt-1">
                            <TrendingUp className="h-3 w-3 mr-1" /> 5% critical
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Revenue Today</p>
                            <DollarSign className="h-5 w-5 text-blue-500 bg-blue-50 p-1 rounded" />
                        </div>
                        <p className="text-3xl font-bold text-slate-900">$12,450</p>
                        <p className="text-slate-400 text-xs mt-1">Updated 5 mins ago</p>
                    </div>
                </div>

                {/* PATIENTS TABLE */}
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-slate-900">Admitted Patients</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-slate-500 text-xs font-bold uppercase tracking-wider">Patient Name</th>
                                    <th className="px-6 py-3 text-slate-500 text-xs font-bold uppercase tracking-wider">Attending Doctor</th>
                                    <th className="px-6 py-3 text-slate-500 text-xs font-bold uppercase tracking-wider">Diagnosis</th>
                                    <th className="px-6 py-3 text-slate-500 text-xs font-bold uppercase tracking-wider">Stay Duration</th>
                                    <th className="px-6 py-3 text-slate-500 text-xs font-bold uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-slate-500 text-xs font-bold uppercase tracking-wider text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {patients.map(patient => (
                                    <tr key={patient.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                                    {patient.patient_name.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <span className="text-sm font-semibold text-slate-900">{patient.patient_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{patient.doctor}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{patient.diagnosis}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{patient.days} Days</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${patient.status === 'Admitted'
                                                ? 'bg-teal-600 text-white'
                                                : 'border-2 border-teal-600 text-teal-600'
                                                }`}>
                                                {patient.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleOpenDischarge(patient)}
                                                className="text-teal-600 text-sm font-bold hover:underline"
                                            >
                                                Process Discharge
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination Mock */}
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-xs text-slate-500">Showing {patients.length} of 124 patients</p>
                        <div className="flex gap-2">
                            <button disabled className="h-8 w-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 disabled:opacity-50">
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button className="h-8 w-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50">
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>

            </main>

            {/* DISCHARGE MODAL */}
            {selectedPatient && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <CheckSquare className="h-6 w-6 text-teal-600" /> Discharge Checklist
                            </h3>
                            <button onClick={() => setSelectedPatient(null)} className="text-slate-400 hover:text-slate-600">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="bg-slate-50 p-4 rounded-lg flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold">
                                    {selectedPatient.patient_name[0]}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900">{selectedPatient.patient_name}</p>
                                    <p className="text-xs text-slate-500">Admitted for: {selectedPatient.diagnosis}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input type="checkbox" checked={checklist.medical} disabled className="h-5 w-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
                                    <span className="text-sm font-medium text-slate-700">Medical Clearance Approved</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input type="checkbox" checked={checklist.meds} disabled className="h-5 w-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
                                    <span className="text-sm font-medium text-slate-700">Medications Prepared</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={checklist.billing}
                                        onChange={(e) => setChecklist(prev => ({ ...prev, billing: e.target.checked }))}
                                        className="h-5 w-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                                    />
                                    <span className="text-sm font-medium text-slate-900">Final Bill Cleared?</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={checklist.followup}
                                        onChange={(e) => setChecklist(prev => ({ ...prev, followup: e.target.checked }))}
                                        className="h-5 w-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                                    />
                                    <span className="text-sm font-medium text-slate-900">Follow-up Scheduled</span>
                                </label>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Special Instructions</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full bg-slate-100 border-none rounded-lg text-sm focus:ring-teal-500 placeholder:text-slate-400 p-3"
                                    placeholder="Enter discharge notes..."
                                    rows={2}
                                />
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 flex flex-col gap-3">
                            <button
                                onClick={handleConfirmDischarge}
                                className="w-full py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 shadow-lg flex items-center justify-center gap-2"
                            >
                                <FileText className="h-5 w-5" /> Generate Discharge Summary
                            </button>
                            <button onClick={() => setSelectedPatient(null)} className="w-full py-2 text-slate-500 font-semibold text-sm hover:text-slate-700">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
