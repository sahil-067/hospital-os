'use server';

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();
const WEBHOOK_DISCHARGE = 'https://n8n.srv1336142.hstgr.cloud/webhook/discharge-patient';

export async function getAdmittedPatients() {
    try {
        const patients = await prisma.admissions.findMany({
            where: { status: 'Admitted' },
            orderBy: { admission_date: 'asc' },
        });
        return { success: true, data: patients };
    } catch (e) {
        return { success: false, data: [] };
    }
}

export async function processDischarge(admissionId: string, patientName: string, summaryNotes: string) {
    try {
        // 1. Update DB Status
        await prisma.admissions.update({
            where: { admission_id: admissionId },
            data: {
                status: 'Discharged',
                discharge_date: new Date()
            }
        });

        // 2. Trigger Webhook for Summary Generation (AI)
        // Agent expects: { body: { patient_id } } usually, but we send notes too.
        // We'll send the full context.
        await fetch(WEBHOOK_DISCHARGE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                admission_id: admissionId,
                patient_name: patientName,
                summaryNotes,
                date: new Date()
            }),
        }).catch(err => console.error(err));

        revalidatePath('/discharge/admin');
        return { success: true };
    } catch (error) {
        console.error('Discharge Error:', error);
        return { success: false, error: 'Failed to process discharge' };
    }
}
