'use server';

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();
const WEBHOOK_RESULT_UPLOAD = 'https://n8n.srv1336142.hstgr.cloud/webhook/submit-lab-result';

export async function getPendingOrders() {
    try {
        const orders = await prisma.lab_orders.findMany({
            where: { status: { in: ['Pending', 'Processing'] } },
            orderBy: { created_at: 'desc' },
        });

        // Enrich with Patient Names
        const patientIds = Array.from(new Set(orders.map(o => o.patient_id)));
        const patients = await prisma.oPD_REG.findMany({
            where: { patient_id: { in: patientIds } },
            select: { patient_id: true, full_name: true }
        });

        const patientMap = new Map(patients.map(p => [p.patient_id, p.full_name]));

        const enrichedOrders = orders.map(order => ({
            order_id: order.barcode, // Map barcode to order_id for UI
            patient_name: patientMap.get(order.patient_id) || 'Unknown',
            test_type: order.test_type,
            doctor_name: order.doctor_id, // We don't have a Doctor table name lookup yet, so use ID
            status: order.status,
            created_at: order.created_at
        }));

        return { success: true, data: enrichedOrders };
    } catch (error) {
        console.error('Lab Orders Fetch Error:', error);
        return { success: false, data: [] };
    }
}

export async function uploadResult(barcode: string, resultValue: string, remarks: string) {
    try {
        // 1. Update Local DB
        const order = await prisma.lab_orders.update({
            where: { barcode: barcode },
            data: {
                status: 'Completed',
                result_value: resultValue,
                // technician_remarks: remarks // Add to schema if needed, for now just result_value
            },
        });

        // 2. Notify Webhook (AI Analysis & PDF Generation)
        // The Agent expects: { barcode, result_value }
        fetch(WEBHOOK_RESULT_UPLOAD, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                body: { // The Agent structure seems to expect 'body' nested or flat? 
                    // Looking at 'Lab Order.json', "Webhook1" uses $json.body.result_value
                    // So we should send { barcode, result_value } directly, n8n parses body.
                    barcode,
                    result_value: resultValue,
                    remarks
                }
            }),
        }).catch(err => console.error('Webhook Error:', err));

        revalidatePath('/lab/technician');
        return { success: true };
    } catch (error) {
        console.error('Upload Error:', error);
        return { success: false, error: 'Failed to upload result' };
    }
}
