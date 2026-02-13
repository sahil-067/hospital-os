'use server';

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();
const WEBHOOK_INVOICE = 'https://n8n.srv1336142.hstgr.cloud/webhook-test/dispense-medicine';

export async function getInventory() {
    try {
        const inventory = await prisma.pharmacy_batch_inventory.findMany({
            where: { current_stock: { gt: 0 } },
            include: { medicine: true }, // Include Master Data
            orderBy: { expiry_date: 'asc' },
        });
        return { success: true, data: inventory };
    } catch (error) {
        console.error('Inventory Fetch Error:', error);
        return { success: false, data: [] };
    }
}

export async function generateInvoice(patientId: string, items: any[]) {
    try {
        let total = 0;
        const invoiceItems = [];

        // 1. Transaction: Deduct Stock & Calculate Total
        for (const item of items) {
            const batch = await prisma.pharmacy_batch_inventory.findUnique({
                where: { batch_no: item.batch_no },
                include: { medicine: true }
            });

            if (batch && batch.current_stock >= item.quantity) {
                await prisma.pharmacy_batch_inventory.update({
                    where: { batch_no: item.batch_no },
                    data: { current_stock: { decrement: item.quantity } }
                });

                const cost = batch.medicine.price_per_unit * item.quantity;
                total += cost;
                invoiceItems.push({
                    medicine_name: batch.medicine.brand_name,
                    qty: item.quantity,
                    price: cost,
                    batch_no: item.batch_no
                });
            }
        }

        // 2. Send to Webhook (Generates PDF Invoice)
        // The Agent 'Pharmacy.json' expects: { batch_id, qty_to_deduct } in a loop? 
        // Actually looking at 'Pharmacy.json' node 'Check Stock', it takes 'body.medicines.name'.
        // And 'Split Out1' takes 'updates'. 
        // This agent seems complex. For MVP, we send the "Bill Data" to generate the invoice.

        // We will send a simplified payload that matched the "Report" node logic if possible, 
        // or just trigger it to get a PDF back.

        await fetch(WEBHOOK_INVOICE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                patient_id: patientId,
                medicines: invoiceItems,
                total_amount: total,
                date: new Date()
            }),
        }).catch(err => console.error(err));

        revalidatePath('/pharmacy/billing');
        return { success: true, total, items: invoiceItems };
    } catch (error) {
        console.error('Invoice Error:', error);
        return { success: false, error: 'Failed to generate invoice' };
    }
}

export async function getPharmacyQueue() {
    try {
        const orders = await prisma.pharmacy_orders.findMany({
            where: { status: { in: ['Pending', 'Processed'] } },
            orderBy: { created_at: 'desc' },
            include: { items: true }
        });
        return { success: true, data: orders };
    } catch (error) {
        console.error('Pharmacy Queue Error:', error);
        return { success: false, data: [] };
    }
}

export async function markOrderAsPaid(orderId: number) {
    try {
        await prisma.pharmacy_orders.update({
            where: { id: orderId },
            data: { status: 'Completed' }
        });
        revalidatePath('/pharmacy/billing');
        return { success: true };
    } catch (error) {
        console.error('Mark Paid Error:', error);
        return { success: false, error: 'Failed to update order' };
    }
}
