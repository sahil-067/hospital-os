'use server';

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();
const WEBHOOK_OPD_REG = 'https://n8n.srv1336142.hstgr.cloud/webhook/hospital-reg';

export async function registerPatient(formData: FormData) {
    const rawData = {
        full_name: formData.get('full_name') as string,
        phone: formData.get('phone') as string,
        age: formData.get('age') as string,
        gender: formData.get('gender') as string,
        department: formData.get('department') as string,
        email: (formData.get('email') as string) || "not given",
        address: (formData.get('address') as string) || "not given",
        aadhar: formData.get('aadhar') as string,
    };

    try {
        let agentPatientId = null;
        let appointmentId = null;

        // 1. Send to Webhook FIRST to get the official ID
        try {
            const webhookRes = await fetch(WEBHOOK_OPD_REG, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...rawData }),
            });

            if (webhookRes.ok) {
                const result = await webhookRes.json();
                if (result.patient_id || result.id || result.digital_id) {
                    agentPatientId = result.patient_id || result.id || result.digital_id;
                    appointmentId = result.appointment_id;
                }
            } else {
                throw new Error(`Agent Webhook failed with status: ${webhookRes.status}`);
            }
        } catch (webhookErr) {
            console.error('Webhook failed:', webhookErr);
            throw new Error(`Agent Connection Failed: ${webhookErr instanceof Error ? webhookErr.message : 'Unknown Error'}`);
        }

        if (!agentPatientId || !appointmentId) {
            throw new Error("Agent did not return valid Patient ID or Appointment ID");
        }

        // 2. Create/Update Patient in DB
        const existingPatient = await prisma.oPD_REG.findUnique({
            where: { patient_id: agentPatientId }
        });

        if (!existingPatient) {
            await prisma.oPD_REG.create({
                data: {
                    patient_id: agentPatientId,
                    full_name: rawData.full_name,
                    phone: rawData.phone,
                    age: rawData.age,
                    department: rawData.department,
                    email: rawData.email,
                    // @ts-ignore
                    address: rawData.address,
                    aadhar_card: rawData.aadhar,
                },
            });
        }

        // 3. Create Appointment (If not exists)
        const existingAppt = await prisma.appointments.findUnique({
            where: { appointment_id: appointmentId }
        });

        if (!existingAppt) {
            await prisma.appointments.create({
                data: {
                    appointment_id: appointmentId,
                    patient_id: agentPatientId, // FK to OPD_REG
                    status: 'Pending',
                    department: rawData.department,
                    reason_for_visit: 'Initial Consultation'
                }
            });
        }

        revalidatePath('/doctor/dashboard');
        return {
            success: true,
            patient_id: agentPatientId,
            appointment_id: appointmentId,
            user_type: 'OPD'
        };

    } catch (error) {
        console.error('Registration Error:', error);
        let errorMessage = 'Failed to register patient';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        return { success: false, error: errorMessage };
    }
}

