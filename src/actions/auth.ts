'use server';

import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { User } from '@/lib/types';

export async function registerUser(formData: FormData) {
    try {
        const name = formData.get('name') as string;
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        if (!name || !email || !password) {
            return { error: 'Missing fields' };
        }

        // 1. Check if user exists
        const { data: existingUser, error: checkError } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            return { error: 'User already exists with this email' };
        }

        if (checkError && checkError.code !== 'PGRST116') {
            // PGRST116 means no rows returned, which is good. Otherwise it's a real error.
            console.error('Check user error:', checkError);
            return { error: 'Error checking user data' };
        }

        // 2. Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Insert user
        const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert([
                { name, email, password: hashedPassword },
            ])
            .select('id, name, email')
            .single();

        if (insertError) {
            console.error('Insert user error:', insertError);
            return { error: 'Error creating user' };
        }

        // 4. Set session cookie
        const cookieStore = await cookies();
        cookieStore.set('session_id', newUser.id.toString(), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/',
        });
        cookieStore.set('session_user', JSON.stringify(newUser), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/',
        });

        return { success: true, user: newUser };
    } catch (err: any) {
        console.error('Registration error:', err);
        return { error: 'Internal server error' };
    }
}

export async function loginUser(formData: FormData) {
    try {
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        if (!email || !password) {
            return { error: 'Missing fields' };
        }

        // 1. Fetch user by email
        const { data: user, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (fetchError || !user) {
            return { error: 'Invalid email or password' };
        }

        // 2. Verify password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return { error: 'Invalid email or password' };
        }

        // 3. Set session cookie
        const cookieStore = await cookies();
        cookieStore.set('session_id', user.id.toString(), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/',
        });

        cookieStore.set('session_user', JSON.stringify(user), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/',
        });

        return { success: true, user: { id: user.id, name: user.name, email: user.email } };
    } catch (err: any) {
        console.error('Login error:', err);
        return { error: 'Internal server error' };
    }
}

export async function logoutUser() {
    const cookieStore = await cookies();
    cookieStore.delete('session_id');
    cookieStore.delete('session_user');
}

export async function getCurrentUser() {
    const cookieStore = await cookies();
    const sessionUser = cookieStore.get('session_user')?.value;
    const currentUser = sessionUser
        ? JSON.parse(sessionUser)
        : { id: '', name: 'Guest', email: '', avatarUrl: '' };

    return currentUser as User;
}
