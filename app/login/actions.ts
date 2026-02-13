'use server';

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const prisma = new PrismaClient();

export async function login(prevState: any, formData: FormData) {
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    if (!username || !password) {
        return { success: false, error: 'Username and password are required' };
    }

    try {
        const user = await prisma.user.findUnique({
            where: { username },
        });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return { success: false, error: 'Invalid credentials' };
        }

        // Set Session Cookie (Next.js 15+ needs await)
        const cookieStore = await cookies();
        cookieStore.set('session', JSON.stringify({
            id: user.id,
            username: user.username,
            role: user.role,
            name: user.name
        }), { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: 'Internal server error' };
    }

    // Redirect based on role (must be outside try/catch because redirects throw errors)
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return { success: false, error: 'User not found' }; // Should not happen

    switch (user.role) {
        case 'receptionist': redirect('/reception/register');
        case 'doctor': redirect('/doctor/dashboard');
        case 'lab_technician': redirect('/lab/technician');
        case 'pharmacist': redirect('/pharmacy/billing');
        case 'admin': redirect('/discharge/admin');
        default: redirect('/');
    }
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete('session');
    redirect('/login');
}
