'use client';

import React, { useState, useEffect } from 'react';
import {
    Pill, Search, Plus, Minus, Receipt, ShoppingCart,
    Trash2, AlertTriangle, CheckCircle, Package
} from 'lucide-react';
import { getInventory, generateInvoice, getPharmacyQueue, markOrderAsPaid } from '@/app/actions/pharmacy-actions';

// ... (in component)



// ... (in JSX)
// Mock types
type InventoryItem = {
    batch_id: string;
    medicine_name: string;
    expiry_date: Date;
    stock_count: number;
    unit_price: number;
};

type CartItem = InventoryItem & { quantity: number };

export default function PharmacyPage() {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [search, setSearch] = useState('');
    const [patientId, setPatientId] = useState('');
    const [loading, setLoading] = useState(true);

    // Order Queue State
    const [activeTab, setActiveTab] = useState<'billing' | 'orders'>('billing');
    const [orderQueue, setOrderQueue] = useState<any[]>([]);

    // Mock initial data if DB is empty
    const mockInventory: InventoryItem[] = [
        { batch_id: 'B101', medicine_name: 'Paracetamol 500mg', expiry_date: new Date('2025-12-01'), stock_count: 500, unit_price: 1.5 },
        { batch_id: 'A202', medicine_name: 'Amoxicillin 250mg', expiry_date: new Date('2024-05-20'), stock_count: 50, unit_price: 12.0 },
        { batch_id: 'C303', medicine_name: 'Cetirizine 10mg', expiry_date: new Date('2026-01-15'), stock_count: 200, unit_price: 5.0 },
        { batch_id: 'D404', medicine_name: 'Ibuprofen 400mg', expiry_date: new Date('2025-08-10'), stock_count: 150, unit_price: 3.0 },
        { batch_id: 'I505', medicine_name: 'Insulin Glargine', expiry_date: new Date('2024-11-30'), stock_count: 20, unit_price: 450.0 },
    ];

    useEffect(() => {
        async function fetchData() {
            const res = await getInventory();
            if (res.success) {
                // Map DB fields to UI fields
                const mappedData = res.data.map((item: any) => ({
                    batch_id: item.batch_no,
                    medicine_name: item.medicine?.brand_name || 'Unknown Medicine',
                    expiry_date: item.expiry_date,
                    stock_count: item.current_stock,
                    unit_price: item.medicine?.price_per_unit || 0
                }));
                setInventory(mappedData);
            }
            setLoading(false);
        }
        fetchData();
    }, []);

    // Fetch Pharmacy Queue
    useEffect(() => {
        async function fetchQueue() {
            const res = await getPharmacyQueue();
            if (res.success) setOrderQueue(res.data);
        }
        if (activeTab === 'orders') {
            fetchQueue();
            const interval = setInterval(fetchQueue, 5000); // Poll every 5s
            return () => clearInterval(interval);
        }
    }, [activeTab]);

    const addToCart = (item: InventoryItem) => {
        setCart(prev => {
            const existing = prev.find(i => i.batch_id === item.batch_id);
            if (existing) {
                if (existing.quantity < item.stock_count) {
                    return prev.map(i => i.batch_id === item.batch_id ? { ...i, quantity: i.quantity + 1 } : i);
                }
                return prev;
            }
            return [...prev, { ...item, quantity: 1 }];
        });
    };

    const updateQty = (batchId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.batch_id === batchId) {
                const newQty = item.quantity + delta;
                if (newQty <= 0) return null; // Filter out later
                if (newQty > item.stock_count) return item;
                return { ...item, quantity: newQty };
            }
            return item;
        }).filter(Boolean) as CartItem[]);
    };

    const removeFromCart = (batchId: string) => {
        setCart(prev => prev.filter(i => i.batch_id !== batchId));
    };

    const totalAmount = cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);

    const handleMarkAsPaid = async (orderId: number) => {
        if (confirm('Mark this order as Paid & Delivered?')) {
            const res = await markOrderAsPaid(orderId);
            if (res.success) {
                // Optimistic update
                setOrderQueue(prev => prev.filter(o => o.id !== orderId));
            } else {
                alert('Failed to update order');
            }
        }
    };

    const handleCheckout = async () => {
        if (!patientId) return alert('Please enter Patient ID');
        if (cart.length === 0) return alert('Cart is empty');

        // Map UI batch_id back to DB batch_no for the action
        const payload = cart.map(item => ({
            ...item,
            batch_no: item.batch_id
        }));

        const res = await generateInvoice(patientId, payload);
        if (res.success) {
            alert('Invoice Generated & Stock Updated');
            setCart([]);
            setPatientId('');
            // Refresh inventory
            const invRes = await getInventory();
            if (invRes.success && invRes.data.length > 0) setInventory(invRes.data as any);
        } else {
            alert('Checkout Failed');
        }
    };

    const filteredInventory = inventory.filter(i =>
        (i.medicine_name && i.medicine_name.toLowerCase().includes(search.toLowerCase())) ||
        (i.batch_id && i.batch_id.toString().toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">

            {/* HEADER */}
            {/* Integrated into main layout or separate as needed, keeping simple here */}

            {/* LEFT PANEL - INVENTORY */}
            <section className="flex-[3] flex flex-col min-w-0 bg-white border-r border-slate-200">
                <div className="p-6 border-b border-slate-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-teal-50 p-2 rounded-lg text-teal-600">
                            <Pill className="h-6 w-6" />
                        </div>
                        <div className="bg-teal-50 p-2 rounded-lg text-teal-600">
                            <Pill className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800">Pharmacy & Billing</h1>
                            <div className="flex gap-4 mt-2 text-sm font-bold text-slate-500">
                                <button
                                    onClick={() => setActiveTab('billing')}
                                    className={`pb-1 border-b-2 transition-colors ${activeTab === 'billing' ? 'text-teal-600 border-teal-600' : 'border-transparent hover:text-slate-700'}`}
                                >
                                    Billing & Inventory
                                </button>
                                <button
                                    onClick={() => setActiveTab('orders')}
                                    className={`pb-1 border-b-2 transition-colors ${activeTab === 'orders' ? 'text-teal-600 border-teal-600' : 'border-transparent hover:text-slate-700'}`}
                                >
                                    Doctor Orders <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full text-[10px] ml-1">{orderQueue.length}</span>
                                </button>
                            </div>
                        </div>

                    </div>

                    {activeTab === 'billing' && (
                        <div className="relative w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                            <input
                                value={search} onChange={e => setSearch(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-sm transition-all"
                                placeholder="Search medicine by name, category, or batch ID..."
                            />
                        </div>
                    )}
                </div>

                {activeTab === 'orders' ? (
                    <div className="flex-1 overflow-auto p-6 bg-slate-50">
                        {orderQueue.length === 0 ? (
                            <div className="text-center p-12 text-slate-400">No incoming orders</div>
                        ) : (
                            <div className="space-y-4 max-w-3xl mx-auto">
                                {orderQueue.map(order => (
                                    <div key={order.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${order.status === 'Processed' ? 'bg-green-100 text-green-700' :
                                                        order.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                                                        }`}>
                                                        {order.status}
                                                    </span>
                                                    <span className="text-xs text-slate-400">#{order.id}</span>
                                                    <span className="text-xs text-slate-400">• {new Date(order.created_at).toLocaleString()}</span>
                                                </div>
                                                <h3 className="font-bold text-slate-800 text-lg">Patient: {order.patient_id}</h3>
                                                <p className="text-sm text-slate-500">{order.doctor_id}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-bold text-teal-600">₹{order.total_amount}</div>
                                                <div className="text-xs text-slate-500">Total Bill</div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 rounded-lg p-4 mb-4 border border-slate-100">
                                            <div className="grid grid-cols-3 gap-4 text-center text-sm mb-2">
                                                <div>
                                                    <p className="text-slate-400 text-xs uppercase font-bold">Requested</p>
                                                    <p className="font-bold">{order.total_items_requested}</p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-400 text-xs uppercase font-bold">Dispensed</p>
                                                    <p className="font-bold text-green-600">{order.items_dispensed}</p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-400 text-xs uppercase font-bold">Unavailable</p>
                                                    <p className="font-bold text-red-500">{order.items_missing}</p>
                                                </div>
                                            </div>

                                            {/* Items List */}
                                            <div className="mt-4 space-y-2">
                                                {order.items?.map((item: any, idx: number) => (
                                                    <div key={idx} className="flex justify-between items-center text-sm border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                                                        <div className="flex items-center gap-2">
                                                            {item.status === 'Dispensed' ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertTriangle className="h-4 w-4 text-red-400" />}
                                                            <span className={item.status === 'Dispensed' ? 'text-slate-700' : 'text-slate-400 line-through'}>{item.medicine_name}</span>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="font-mono text-xs text-slate-500">x{item.quantity_requested}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-3">
                                            <button className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-bold">Print Invoice</button>
                                            <button
                                                onClick={() => handleMarkAsPaid(order.id)}
                                                className="px-6 py-2 bg-teal-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-teal-700"
                                            >
                                                Mark as Paid & Delivered
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-slate-50 text-slate-500 text-xs uppercase tracking-wider z-10">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Medicine Name</th>
                                    <th className="px-6 py-4 font-semibold">Batch ID</th>
                                    <th className="px-6 py-4 font-semibold">Expiry Date</th>
                                    <th className="px-6 py-4 font-semibold text-center">Stock</th>
                                    <th className="px-6 py-4 font-semibold">Unit Price</th>
                                    <th className="px-6 py-4 font-semibold text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {filteredInventory.map(item => (
                                    <tr key={item.batch_id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-800">{item.medicine_name}</div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-slate-500">{item.batch_id}</td>
                                        <td className="px-6 py-4">
                                            <span className={new Date(item.expiry_date) < new Date('2024-12-31') ? 'text-red-500 font-bold flex items-center gap-1' : 'text-slate-600'}>
                                                {new Date(item.expiry_date) < new Date('2024-12-31') && <AlertTriangle className="h-3 w-3" />}
                                                {new Date(item.expiry_date).toLocaleDateString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`font-medium ${item.stock_count < 50 ? 'text-amber-600' : 'text-teal-600'}`}>
                                                {item.stock_count}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium">₹{item.unit_price}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => addToCart(item)}
                                                className="bg-teal-600 hover:bg-teal-700 text-white p-2 rounded-lg transition-all shadow-md active:scale-95 inline-flex items-center justify-center"
                                            >
                                                <Plus className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                )
                }
            </section >

            {/* RIGHT PANEL - BILLING CART */}
            < aside className="flex-[1.2] flex flex-col bg-slate-50 border-l border-slate-200 min-w-[380px] shadow-xl z-20" >
                <div className="p-6 border-b border-slate-200 bg-white">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5 text-teal-600" /> Current Bill
                    </h2>
                    <div className="relative">
                        <input
                            value={patientId} onChange={e => setPatientId(e.target.value)}
                            className="w-full pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-teal-500 outline-none"
                            placeholder="Enter Patient ID / Name"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-4 space-y-3">
                    {cart.length === 0 ? (
                        <div className="text-center py-20 text-slate-400 flex flex-col items-center">
                            <Package className="h-12 w-12 mb-2 opacity-50" />
                            <p>Cart is empty</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.batch_id} className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm flex justify-between items-center group">
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-semibold text-slate-800 truncate">{item.medicine_name}</h4>
                                    <p className="text-xs text-slate-500 mt-0.5">₹{item.unit_price} x {item.quantity}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center bg-slate-100 rounded-lg border border-slate-200 p-1">
                                        <button onClick={() => updateQty(item.batch_id, -1)} className="h-6 w-6 flex items-center justify-center hover:bg-white rounded text-slate-500">
                                            <Minus className="h-3 w-3" />
                                        </button>
                                        <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                                        <button onClick={() => updateQty(item.batch_id, 1)} className="h-6 w-6 flex items-center justify-center hover:bg-white rounded text-slate-500">
                                            <Plus className="h-3 w-3" />
                                        </button>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-sm">₹{item.unit_price * item.quantity}</div>
                                        <button onClick={() => removeFromCart(item.batch_id)} className="text-red-400 hover:text-red-500 text-[10px] uppercase font-bold mt-1">Remove</button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-6 bg-white border-t border-slate-200">
                    <div className="space-y-2 mb-6 text-sm">
                        <div className="flex justify-between text-slate-500">
                            <span>Subtotal</span>
                            <span>₹{totalAmount}</span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                            <span>Tax (0%)</span>
                            <span>₹0.00</span>
                        </div>
                        <div className="flex justify-between items-end pt-4 border-t border-slate-100">
                            <span className="font-bold text-slate-800 uppercase text-xs tracking-wider">Total Amount</span>
                            <span className="text-3xl font-extrabold text-teal-600">₹{totalAmount}</span>
                        </div>
                    </div>

                    <button
                        onClick={handleCheckout}
                        disabled={cart.length === 0 || !patientId}
                        className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-teal-600/20 transition-all flex items-center justify-center gap-2 group"
                    >
                        <Receipt className="h-5 w-5" />
                        Generate Invoice & Dispense
                    </button>
                </div>

            </aside >
        </div >
    );
}
