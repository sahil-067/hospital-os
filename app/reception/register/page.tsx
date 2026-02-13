'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ClipboardList, UserPlus, ArrowRight, CheckCircle, Calendar, Phone, Mail, Activity, Microscope, Stethoscope, BriefcaseMedical } from 'lucide-react';
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
            // Reset form or keep it open for next patient? usually keep/reset.
            // (event.target as HTMLFormElement).reset(); 
        } else {
            alert('Error: ' + result.error);
        }
        setIsSubmitting(false);
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white px-6 py-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-6">
                    <Link href="/login" className="flex items-center gap-2 text-teal-600 hover:opacity-80 transition-opacity">
                        <Activity className="h-8 w-8" />
                        <h1 className="text-xl font-bold tracking-tight text-slate-900">Avani <span className="text-teal-600">OS</span></h1>
                    </Link>
                    <nav className="hidden md:flex items-center gap-6 ml-4">
                        <a href="#" className="text-sm font-semibold text-teal-600 border-b-2 border-teal-600 pb-1">Registration</a>
                        <a href="#" className="text-sm font-medium text-slate-500 hover:text-teal-600 transition-colors">Appointments</a>
                        <a href="#" className="text-sm font-medium text-slate-500 hover:text-teal-600 transition-colors">Billing</a>
                    </nav>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                        <div className="text-right hidden lg:block">
                            <p className="text-sm font-semibold leading-none text-slate-700">Reception Desk</p>
                            <p className="text-xs text-slate-500 mt-1">OPD Intake</p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-700 font-bold border border-teal-100">
                            RD
                        </div>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-4 py-10 flex flex-col items-center">
                {/* Page Title */}
                <div className="w-full max-w-2xl mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-teal-50 rounded-lg text-teal-600">
                            <UserPlus className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 leading-none">Patient Registration (OPD)</h2>
                            <p className="text-slate-500 mt-1">Register new patients to the Hospital Information System</p>
                        </div>
                    </div>
                </div>

                {/* Registration Form Card */}
                <div className="w-full max-w-2xl bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-8">
                        {!successData ? (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                                        <input name="full_name" className="w-full rounded-lg border-slate-300 focus:border-teal-500 focus:ring-teal-500 py-3 transition-all" placeholder="e.g., John Doe" required type="text" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                                            <input name="phone" className="w-full pl-10 rounded-lg border-slate-300 focus:border-teal-500 focus:ring-teal-500 py-3 transition-all" placeholder="10-digit mobile" required type="tel" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Age</label>
                                            <input name="age" className="w-full rounded-lg border-slate-300 focus:border-teal-500 focus:ring-teal-500 py-3 transition-all" placeholder="Years" required type="number" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Gender</label>
                                            <select name="gender" className="w-full rounded-lg border-slate-300 focus:border-teal-500 focus:ring-teal-500 py-3 transition-all">
                                                <option>Male</option>
                                                <option>Female</option>
                                                <option>Other</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Department</label>
                                        <select name="department" className="w-full rounded-lg border-slate-300 focus:border-teal-500 focus:ring-teal-500 py-3 transition-all">
                                            <option>General</option>
                                            <option>Cardiology</option>
                                            <option>Orthopedics</option>
                                            <option>Pediatrics</option>
                                            <option>Dermatology</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Aadhar Card Number (Optional)</label>
                                        <input name="aadhar" className="w-full rounded-lg border-slate-300 focus:border-teal-500 focus:ring-teal-500 py-3 transition-all" placeholder="12-digit UIDAI Number" type="text" maxLength={12} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Email (Optional)</label>
                                        <input name="email" className="w-full rounded-lg border-slate-300 focus:border-teal-500 focus:ring-teal-500 py-3 transition-all" placeholder="john.doe@example.com" type="email" />
                                    </div>
                                </div>

                                <div className="pt-6 mt-6 border-t border-slate-100">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-teal-600/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
                                    >
                                        <span>{isSubmitting ? 'Registering...' : 'Register Patient'}</span>
                                        {!isSubmitting && <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="bg-teal-50 border border-teal-100 rounded-xl p-8 py-12 flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
                                <div className="h-16 w-16 bg-teal-600 rounded-full flex items-center justify-center text-white mb-6 shadow-lg shadow-teal-600/20">
                                    <CheckCircle className="h-8 w-8" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">Registration Successful!</h3>
                                <p className="text-slate-500 mb-8 max-w-sm">Patient has been registered and a digital ID has been sent to their mobile number.</p>

                                <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-1">Patient ID</p>
                                <p className="text-3xl font-black text-teal-600 tracking-tight">{successData.patient_id}</p>

                                {successData.user_type && (
                                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 shadow-sm w-full max-w-xs mb-4">
                                        <p className="text-xs uppercase tracking-widest text-blue-500 font-semibold mb-1">Patient Type</p>
                                        <p className="text-xl font-bold text-blue-700 tracking-tight">{successData.user_type}</p>
                                    </div>
                                )}

                                {successData.appointment_id && (
                                    <div className="bg-purple-50 p-3 rounded-lg border border-purple-100 shadow-sm w-full max-w-xs mb-8">
                                        <p className="text-xs uppercase tracking-widest text-purple-500 font-semibold mb-1">Appointment ID</p>
                                        <p className="text-xl font-bold text-purple-700 tracking-tight">{successData.appointment_id}</p>
                                    </div>
                                )}

                                <button
                                    onClick={() => { setSuccessData(null); setIsSubmitting(false); }}
                                    className="text-teal-600 font-semibold hover:text-teal-700 hover:underline"
                                >
                                    Register Another Patient
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Success Toast / Status Bar (if needed specifically separate) */}

                </div>

                {/* Feature Highlights */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-2xl text-center">
                    <div className="p-4 rounded-xl border border-dashed border-slate-300 flex flex-col items-center">
                        <ClipboardList className="h-6 w-6 text-slate-400 mb-2" />
                        <p className="text-xs font-medium text-slate-500">Auto-generates digital record</p>
                    </div>
                    <div className="p-4 rounded-xl border border-dashed border-slate-300 flex flex-col items-center">
                        <Mail className="h-6 w-6 text-slate-400 mb-2" />
                        <p className="text-xs font-medium text-slate-500">SMS/Email confirmation sent</p>
                    </div>
                    <div className="p-4 rounded-xl border border-dashed border-slate-300 flex flex-col items-center">
                        <Activity className="h-6 w-6 text-slate-400 mb-2" />
                        <p className="text-xs font-medium text-slate-500">Vitals tracking enabled</p>
                    </div>
                </div>

            </main >

            <footer className="mt-auto w-full py-6 text-center text-slate-400 text-xs border-t border-slate-100 bg-white">
                <p>© 2024 Avani Enterprise Hospital OS. All patient data is encrypted and secure.</p>
            </footer>
        </div >
    );
}
