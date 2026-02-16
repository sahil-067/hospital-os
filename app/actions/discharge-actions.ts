'use server';

import { PrismaClient } from '@prisma/client';

const WEBHOOK_DISCHARGE = 'https://n8n.srv1336142.hstgr.cloud/webhook/discharge-patient';

export async function dischargePatient(patientId: string) {
    try {
        console.log(`Initiating Discharge for Patient: ${patientId}`);


        // Update Local DB: Set Status and Discharge Date
        // We find the active admission for this patient
        const prisma = new PrismaClient(); // Import PrismaClient at top if not there, or generic import

        // Find the active admission
        const activeAdmission = await prisma.admissions.findFirst({
            where: {
                patient_id: patientId,
                status: 'Admitted'
            }
        });

        if (activeAdmission) {
            await prisma.admissions.update({
                where: { admission_id: activeAdmission.admission_id },
                data: {
                    status: 'Discharged',
                    discharge_date: new Date()
                }
            });


            // Also update appointment status if exists?
        }

        // Call n8n Webhook
        const response = await fetch(WEBHOOK_DISCHARGE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ patient_id: patientId }),
        });

        if (!response.ok) {
            throw new Error(`Webhook failed with status: ${response.status}`);
        }


        // User said they will update agent to "return the pdf file"
        // So we expect a binary stream (Buffer)
        const pdfArrayBuffer = await response.arrayBuffer();
        const base64Pdf = Buffer.from(pdfArrayBuffer).toString('base64');

        return {
            success: true,
            pdfBase64: base64Pdf
        };

    } catch (error: any) {
        console.error('Discharge Error:', error);
        return { success: false, error: error.message || 'Failed to generate discharge summary' };
    }
}
