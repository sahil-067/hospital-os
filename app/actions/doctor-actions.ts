'use server';

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

const WEBHOOK_EHR_SAVE = 'https://n8n.srv1336142.hstgr.cloud/webhook-test/doctor-visit';
const WEBHOOK_LAB_ORDER = 'https://n8n.srv1336142.hstgr.cloud/webhook/create-lab-order';

export async function getPatientQueue() {
    try {
        // Fetch appointments joined with patient details
        const appointments = await prisma.appointments.findMany({
            where: {
                status: {
                    in: ['Pending', 'Scheduled', 'Checked In', 'In Progress'] // Adjust status as needed
                },
                appointment_date: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0)), // Today's appointments
                    lt: new Date(new Date().setHours(23, 59, 59, 999))
                }
            },
            include: {
                patient: true // Relation to OPD_REG
            },
            orderBy: { appointment_date: 'asc' },
        });

        // Map to flat structure for UI
        // UI expects: patient_id, full_name, digital_id, etc.
        const queue = appointments.map(appt => ({
            ...appt.patient,
            status: appt.status,
            appointment_id: appt.appointment_id, // String User ID (APP-...)
            internal_id: appt.id, // Int ID
            // OPD_REG doesn't have digital_id field per say, but patient_id IS the digital ID?
            // User schema: patient_id (Unique Text, e.g., PAT-2026...)
            digital_id: appt.patient.patient_id
        }));

        return { success: true, data: queue };
    } catch (error) {
        console.error('Queue Fetch Error:', error);
        return { success: false, data: [] };
    }
}

export async function admitPatient(patientId: string, doctorName: string, diagnosis: string) {
    try {
        await prisma.admissions.create({
            data: {
                patient_id: patientId,
                doctor_name: doctorName,
                diagnosis: diagnosis,
                status: 'Admitted',
                admission_date: new Date(),
            },
        });
        revalidatePath('/doctor/dashboard');
        return { success: true };
    } catch (error) {
        console.error('Admission Error:', error);
        return { success: false, error: 'Admission failed' };
    }
}

export async function saveClinicalNotes(data: any) {
    try {
        // 1. Save to Local DB (Clinical_EHR)
        // Schema: appointment_id (PK), patient_id, doctor_notes, diagnosis
        // Note: Prisma create needs unique ID. appointment_id is PK.
        // We use upsert to handle re-saves for same appointment

        await prisma.clinical_EHR.upsert({
            where: { appointment_id: data.appointment_id },
            update: {
                doctor_notes: data.notes,
                diagnosis: data.diagnosis,
                doctor_name: data.doctor_name
            },
            create: {
                appointment_id: data.appointment_id, // PK
                patient_id: data.patient_id,
                doctor_notes: data.notes,
                diagnosis: data.diagnosis,
                doctor_name: data.doctor_name
            }
        });

        // 2. Post to Webhook (EHR Agent)
        await fetch(WEBHOOK_EHR_SAVE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        }).catch(e => console.error("Webhook Error", e));

        revalidatePath('/doctor/dashboard');
        return { success: true };
    } catch (error) {
        console.error('EHR Save Error:', error);
        return { success: false, error: 'Failed to save notes' };
    }
}

export async function orderLabTest(data: any) {
    console.log('--- orderLabTest Started ---');
    console.log('Data:', data);
    try {
        // 1. Call Webhook (Agent handles: Availability Check -> Assign Tech -> Generate Barcode -> Insert to DB)
        const WEBHOOK_LAB_ORDER = 'https://n8n.srv1336142.hstgr.cloud/webhook/create-lab-order';
        console.log('Calling Webhook:', WEBHOOK_LAB_ORDER);

        const response = await fetch(WEBHOOK_LAB_ORDER, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                patient_id: data.patient_id,
                doctor_id: data.doctor_id,
                test_type: data.test_type
            }),
        });
        console.log('Webhook Response Status:', response.status);

        if (!response.ok) {
            console.error('Lab Webhook Failed:', response.statusText);
            const text = await response.text();
            console.error('Response Body:', text);
            throw new Error(`Agent Webhook failed: ${response.statusText}`);
        }

        const result = await response.json();

        // Agent returns: { Order_Status, Technician, Barcode }
        const barcode = result.Barcode || result.barcode;
        const technician = result.Technician || result.technician;

        if (!barcode) {
            // Fallback or warning? User said "it will assign... and create barcode".
            // If it fails, maybe we shouldn't proceed?
            // But we can't rollback the Agent.
            console.warn("Agent returned no barcode", result);
        }

        // 2. No Local DB Creation (Agent does it)
        // We just return success so UI can update.
        // But we need to ensure the UI can see it immediately.
        // If the Agent takes time, revalidatePath might be too fast.
        // We might want to wait a bit or just return.

        revalidatePath('/lab/technician'); // Update Lab View
        revalidatePath('/doctor/dashboard'); // Update Doctor View (if showing orders)

        return { success: true, barcode, technician };

    } catch (error) {
        console.error('Lab Order Error:', error);
        return { success: false, error: 'Failed to create lab order via Agent' };
    }
}

export async function getPatientLabOrders(patientId: string) {
    try {
        const orders = await prisma.lab_orders.findMany({
            where: { patient_id: patientId },
            orderBy: { created_at: 'desc' },
        });
        return { success: true, data: orders };
    } catch (error) {
        console.error('Get Lab Orders Error:', error);
        return { success: false, data: [] };
    }
}

export async function updateAppointmentStatus(appointmentId: string, status: string) {
    try {
        // appointmentId is string (APP-...), schema uses 'appointment_id' as unique string, 
        // internal 'id' is Int.
        // So we update where appointment_id matches.

        await prisma.appointments.update({
            where: { appointment_id: appointmentId },
            data: { status: status }
        });
        revalidatePath('/doctor/dashboard');
        return { success: true };
    } catch (error) {
        console.error('Update Status Error:', error);
        return { success: false, error: 'Failed to update status' };
    }
}


export async function getMedicineList() {
    try {
        const medicines = await prisma.pharmacy_medicine_master.findMany({
            orderBy: { brand_name: 'asc' }
        });
        return { success: true, data: medicines };
    } catch (error) {
        console.error('Get Medicine List Error:', error);
        return { success: false, data: [] };
    }
}

export async function createPharmacyOrder(patientId: string, doctorId: string, items: { name: string, qty: number }[]) {
    console.log('--- createPharmacyOrder Started ---');
    console.log('Patient:', patientId, 'Doctor:', doctorId);
    console.log('Items:', items);
    try {
        // 1. Create Local Order (Pending)
        const order = await prisma.pharmacy_orders.create({
            data: {
                patient_id: patientId,
                doctor_id: doctorId,
                status: 'Pending',
                total_items_requested: items.length,
                items: {
                    create: items.map(i => ({
                        medicine_name: i.name,
                        quantity_requested: i.qty,
                        status: 'Pending'
                    }))
                }
            },
            include: { items: true }
        });

        // 2. Call Webhook (Agent)
        const WEBHOOK_PHARMACY = 'https://n8n.srv1336142.hstgr.cloud/webhook/dispense-medicine';
        console.log('Calling Webhook:', WEBHOOK_PHARMACY);

        const response = await fetch(WEBHOOK_PHARMACY, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                patient_id: patientId,
                medicines: items
            })
        });
        console.log('Webhook Response Status:', response.status);

        if (!response.ok) {
            // If Agent fails, we leave order as Pending for manual pharmacist review?
            console.error('Agent Webhook Failed:', response.statusText);
            const text = await response.text();
            console.error('Response Body:', text);
            return { success: true, orderId: order.id, agentStatus: 'Failed', message: 'Order sent to pharmacy (Agent offline)' };
        }

        const text = await response.text();
        console.log('Raw Webhook Response:', text);

        // Debug full response
        import('fs').then(fs => {
            fs.appendFileSync('debug.log', `\n[${new Date().toISOString()}] FULL RECEIVED JSON:\n${text}\n`);
        });

        let result;
        try {
            const parsed = JSON.parse(text);
            // Handle Array response (e.g. [{"status": ...}])
            if (Array.isArray(parsed)) {
                result = parsed[0];
            } else {
                result = parsed;
            }
        } catch (e) {
            console.error('JSON Parse Error:', e);
            throw new Error(`Agent returned invalid JSON: "${text.substring(0, 100)}..."`);
        }

        // Result: { status, bill_summary, dispensed_medicines, unavailable_medicines }

        // 3. Update Order with Agent Results
        // We update the main order status and total amount
        const bill = result.bill_summary || {};

        await prisma.pharmacy_orders.update({
            where: { id: order.id },
            data: {
                status: 'Processed', // Processed by Agent
                total_amount: bill.total_amount_to_collect || 0,
                items_dispensed: bill.items_dispensed || 0,
                items_missing: bill.items_missing || 0
            }
        });

        // 4. Update Items (Dispensed vs Unavailable)
        // We need to map back to the created items. 
        // Since we don't have unique item IDs in the Agent response, we match by name.

        // Fix for nested n8n response structure
        let dispensed = result.dispensed_medicines || [];
        if (!Array.isArray(dispensed) && dispensed.dispensed_medicines) {
            dispensed = dispensed.dispensed_medicines;
        }

        let unavailable = result.unavailable_medicines || [];
        if (!Array.isArray(unavailable) && unavailable.unavailable_medicines) {
            unavailable = unavailable.unavailable_medicines;
        }

        for (const item of order.items) {
            const normalize = (s: string) => s ? s.trim().toLowerCase() : '';
            const itemName = normalize(item.medicine_name);

            // Debug matching
            import('fs').then(fs => {
                fs.appendFileSync('debug.log', `\n[${new Date().toISOString()}] MATCHING: "${item.medicine_name}" (norm: '${itemName}')\n`);
                fs.appendFileSync('debug.log', `AGAINST DISPENSED: ${JSON.stringify(dispensed.map((d: any) => normalize(d.medicine)))}\n`);
                fs.appendFileSync('debug.log', `AGAINST UNAVAILABLE: ${JSON.stringify(unavailable.map((u: any) => normalize(u.medicine)))}\n`);
            });

            console.log(`Matching Item: "${item.medicine_name}" (norm: ${itemName})`);

            const dispItem = dispensed.find((d: any) => normalize(d.medicine) === itemName);
            const unavItem = unavailable.find((u: any) => normalize(u.medicine) === itemName);

            if (dispItem) {
                console.log(`Matched Dispensed: ${item.medicine_name}`);
                await prisma.pharmacy_order_items.update({
                    where: { id: item.id },
                    data: {
                        status: 'Dispensed',
                        quantity_dispensed: item.quantity_requested,
                        unit_price: dispItem.price,
                        total_price: (dispItem.price || 0) * item.quantity_requested,
                        batch_id: dispItem.batch
                    }
                });
            } else if (unavItem) {
                console.log(`Matched Unavailable: ${item.medicine_name}`);
                await prisma.pharmacy_order_items.update({
                    where: { id: item.id },
                    data: {
                        status: 'Out of Stock',
                        quantity_dispensed: 0
                    }
                });
            } else {
                console.log(`No Match for: ${item.medicine_name}`);
            }
        }

        return { success: true, orderId: order.id, agentResponse: result };

    } catch (error) {
        console.error('Create Pharmacy Order Error:', error);
        import('fs').then(fs => {
            fs.appendFileSync('error.log', `[${new Date().toISOString()}] Pharmacy Order Error: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}\n`);
        });
        return { success: false, error: 'Failed to create pharmacy order' };
    }
}
