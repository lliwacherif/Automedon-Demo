import { defineStore } from 'pinia';
import { ref } from 'vue';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'vue-router';
import type { User } from '@supabase/supabase-js';

async function hashPassword(password: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const useAuthStore = defineStore('auth', () => {
    const user = ref<User | null>(null);
    const loading = ref(true);
    const router = useRouter();

    const role = ref<string>('');
    const currentAdminId = ref<number | null>(null);

    async function initializeAuth() {
        loading.value = true;
        const { data } = await supabase.auth.getUser();
        user.value = data.user;

        // Check if we have a stored admin session
        const storedAdmin = localStorage.getItem('admin_session');
        if (storedAdmin === 'true') {
            const storedRole = localStorage.getItem('admin_role');
            const storedId = localStorage.getItem('admin_id');

            isAdmin.value = true;
            if (storedRole) role.value = storedRole;
            if (storedId) currentAdminId.value = parseInt(storedId);
        }

        loading.value = false;

        supabase.auth.onAuthStateChange((_event, session) => {
            user.value = session?.user || null;
        });
    }

    async function checkAdminSetup() {
        const { data, error } = await supabase
            .from('admin_settings')
            .select('id')
            .limit(1);

        if (error) {
            console.error('Error checking admin setup:', error);
            return;
        }

        isSetup.value = data && data.length > 0;
        return isSetup.value;
    }

    async function setupAdminPassword(password: string) {
        const hash = await hashPassword(password);

        const { error } = await supabase
            .from('admin_settings')
            .insert([{
                username: 'admin',
                password_hash: hash,
                role: 'admin'
            }]);

        if (error) throw error;

        isSetup.value = true;
        // Auto login after setup
        await loginAdmin('admin', password);
    }

    async function login(email: string, password: string) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
        user.value = data.user;
        isAdmin.value = false;
        role.value = '';
        currentAdminId.value = null;
        router.push('/');
    }

    async function loginAdmin(username: string, pass: string) {
        const hash = await hashPassword(pass);

        const { data, error } = await supabase
            .from('admin_settings')
            .select('id, password_hash, role')
            .eq('username', username)
            .single();

        if (error || !data) {
            throw new Error('Invalid credentials');
        }

        if (data.password_hash === hash) {
            isAdmin.value = true;
            role.value = data.role;
            currentAdminId.value = data.id;

            localStorage.setItem('admin_session', 'true');
            localStorage.setItem('admin_role', data.role);
            localStorage.setItem('admin_id', data.id.toString());

            if (data.role === 'admin') {
                router.push({ name: 'admin.kpi.index' }); // Main landing for Admin
            } else {
                router.push({ name: 'admin.reservations.index' }); // Main landing for Assistant
            }
            return true;
        } else {
            throw new Error('Invalid password');
        }
    }

    async function changeAdminPassword(currentPass: string, newPass: string) {
        if (!currentAdminId.value) throw new Error('Not authenticated');

        const currentHash = await hashPassword(currentPass);

        // Verify current password first
        const { data, error: fetchError } = await supabase
            .from('admin_settings')
            .select('password_hash')
            .eq('id', currentAdminId.value)
            .single();

        if (fetchError || !data || data.password_hash !== currentHash) {
            throw new Error('Current password is incorrect');
        }

        const newHash = await hashPassword(newPass);

        const { error: updateError } = await supabase
            .from('admin_settings')
            .update({ password_hash: newHash, updated_at: new Date().toISOString() })
            .eq('id', currentAdminId.value);

        if (updateError) throw updateError;
    }

    async function signOut() {
        if (isAdmin.value) {
            isAdmin.value = false;
            role.value = '';
            currentAdminId.value = null;

            localStorage.removeItem('admin_session');
            localStorage.removeItem('admin_role');
            localStorage.removeItem('admin_id');

            router.push('/admin');
        } else {
            await supabase.auth.signOut();
            user.value = null;
            router.push({ name: 'login' });
        }
    }

    async function register(email: string, password: string) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });
        if (error) throw error;
        user.value = data.user;
        isAdmin.value = false;
        router.push('/');
    }

    return {
        user,
        isAdmin,
        role,
        isSetup,
        loading,
        initializeAuth,
        checkAdminSetup,
        setupAdminPassword,
        login,
        loginAdmin,
        changeAdminPassword,
        register,
        signOut,
    };
});
