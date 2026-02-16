'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ClipboardList, UserPlus, ArrowRight, CheckCircle, Phone, Activity, LogOut } from 'lucide-react';
import { registerPatient } from '@/app/actions/register-patient';

export default function ReceptionPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successData, setSuccessData] = useState<{ patient_id: string; appointment_id?: string; user_type?: string } | null>(null);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(event.currentTarget);
        const result = await registerPatient(formData);

        if (result.success) {
            setSuccessData({
                patient_id: result.patient_id!,
                appointment_id: result.appointment_id,
                user_type: result.user_type
            });
            (event.target as HTMLFormElement).reset();
        } else {
            alert('Error: ' + result.error);
        }
        setIsSubmitting(false);
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
            {/* Compact Header */}
            <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md px-6 py-2 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <Link href="/login" className="flex items-center gap-2 text-teal-600 hover:opacity-80 transition-opacity">
                        <Activity className="h-6 w-6" />
                        <h1 className="text-lg font-bold tracking-tight text-slate-900">Avani <span className="text-teal-600">OS</span></h1>
                    </Link>
                    <span className="text-xs font-semibold text-slate-400 border-l border-slate-200 pl-4 py-1">Reception Desk</span>
                </div>
                <Link href="/login" className="flex items-center gap-1 text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-full transition-colors">
                    <LogOut className="h-3 w-3" /> Logout
                </Link>
            </header>

            <main className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-6xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col md:flex-row">

                    {/* Left Side: Branding / Info (Hidden on Mobile) */}
                    <div className="hidden md:flex flex-col justify-between bg-teal-600 w-1/4 p-8 text-white relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white to-transparent pointer-events-none" />
                        <div>
                            <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center mb-6 backdrop-blur-sm">
                                <UserPlus className="h-6 w-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">New Patient</h2>
                            <p className="text-teal-100 text-sm">Register incoming patients quickly. Digital IDs are generated automatically.</p>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-sm text-teal-100">
                                <ClipboardList className="h-4 w-4" /> <span>Digital Record</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-teal-100">
                                <Activity className="h-4 w-4" /> <span>Vitals Tracking</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Form */}
                    <div className="flex-1 p-6 md:p-8 relative">
                        {successData ? (
                            <div className="absolute inset-0 bg-white z-10 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300">
                                <div className="h-20 w-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-green-200">
                                    <CheckCircle className="h-10 w-10" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900">Registration Complete</h3>
                                <div className="my-6 bg-slate-50 p-6 rounded-xl border border-slate-200 w-full max-w-sm">
                                    <p className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-1">Patient ID</p>
                                    <p className="text-3xl font-black text-teal-600 tracking-tight font-mono">{successData.patient_id}</p>
                                </div>
                                <button
                                    onClick={() => setSuccessData(null)}
                                    className="px-8 py-3 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 transition-all shadow-md hover:shadow-lg"
                                >
                                    Register Next Patient
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="h-full flex flex-col justify-center">
                                <div className="mb-6">
                                    <h3 className="text-xl font-bold text-slate-800">Patient Details</h3>
                                </div>

                                {/* Compact Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                    {/* Row 1 */}
                                    <div className="md:col-span-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
                                        <input name="full_name" className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none font-semibold text-slate-800" placeholder="e.g. John Doe" required />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Phone</label>
                                        <div className="relative">
                                            <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                            <input name="phone" className="w-full mt-1 pl-8 p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none font-semibold text-slate-800" placeholder="Mobile" required />
                                        </div>
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Age</label>
                                        <input name="age" type="number" min="0" className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none font-semibold text-slate-800" placeholder="Yrs" required />
                                    </div>

                                    {/* Row 2 */}
                                    <div className="md:col-span-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Gender</label>
                                        <select name="gender" className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none font-semibold text-slate-800">
                                            <option>Male</option><option>Female</option><option>Other</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Department</label>
                                        <select name="department" className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none font-semibold text-slate-800">
                                            <option>General</option><option>Cardiology</option><option>Orthopedics</option><option>Pediatrics</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Aadhaar (Optional)</label>
                                        <input
                                            name="aadhar"
                                            className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none font-semibold text-slate-800 tracking-wider"
                                            placeholder="xxxx-xxxx-xxxx"
                                            maxLength={14}
                                            onChange={(e) => {
                                                let val = e.target.value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1-');
                                                e.target.value = val;
                                            }}
                                        />
                                    </div>

                                    {/* Row 3 */}
                                    <div className="md:col-span-4">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Address</label>
                                        <input name="address" className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none font-semibold text-slate-800" placeholder="House No, Street, City..." required />
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4 border-t border-slate-100">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-teal-600/20 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        <span>{isSubmitting ? 'Processing...' : 'Register Patient'}</span>
                                        {!isSubmitting && <ArrowRight className="h-5 w-5" />}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
