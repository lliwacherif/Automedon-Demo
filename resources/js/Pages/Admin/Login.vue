<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { Loader2 } from 'lucide-vue-next';

const authStore = useAuthStore();
const username = ref('');
const password = ref('');
const setupPassword = ref('');
const setupConfirmPassword = ref('');
const error = ref('');
const loading = ref(false);

onMounted(async () => {
    try {
        await authStore.checkAdminSetup();
    } catch (e) {
        console.error('Failed to check checks setup', e);
    }
});

async function handleLogin() {
    error.value = '';
    loading.value = true;
    try {
        await authStore.loginAdmin(username.value, password.value);
    } catch (e: any) {
        error.value = e.message;
    } finally {
        loading.value = false;
    }
}

async function handleSetup() {
    error.value = '';
    
    if (setupPassword.value.length < 6) {
        error.value = 'Password must be at least 6 characters';
        return;
    }

    if (setupPassword.value !== setupConfirmPassword.value) {
        error.value = 'Passwords do not match';
        return;
    }

    loading.value = true;
    try {
        await authStore.setupAdminPassword(setupPassword.value);
    } catch (e: any) {
        error.value = e.message;
    } finally {
        loading.value = false;
    }
}
</script>

<template>
    <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div class="sm:mx-auto sm:w-full sm:max-w-md">
            <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
                {{ authStore.isSetup ? 'Admin Login' : 'Setup Admin Password' }}
            </h2>
            <p v-if="!authStore.isSetup" class="mt-2 text-center text-sm text-gray-600">
                Welcome! Please set your admin password to get started.
            </p>
        </div>

        <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                <!-- Login Form -->
                <form v-if="authStore.isSetup" class="space-y-6" @submit.prevent="handleLogin">
                    <div>
                        <label for="username" class="block text-sm font-medium text-gray-700">
                            Username
                        </label>
                        <div class="mt-1">
                            <input id="username" v-model="username" name="username" type="text" required class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                        </div>
                    </div>

                    <div>
                        <label for="password" class="block text-sm font-medium text-gray-700">
                            Password
                        </label>
                        <div class="mt-1">
                            <input id="password" v-model="password" name="password" type="password" required class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                        </div>
                    </div>

                    <div v-if="error" class="text-red-600 text-sm">
                        {{ error }}
                    </div>

                    <div>
                        <button type="submit" :disabled="loading" class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
                            <Loader2 v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4" />
                            Sign in
                        </button>
                    </div>
                </form>

                <!-- Setup Form -->
                <form v-else class="space-y-6" @submit.prevent="handleSetup">
                    <div>
                        <label for="setup-password" class="block text-sm font-medium text-gray-700">
                            New Password
                        </label>
                        <div class="mt-1">
                            <input id="setup-password" v-model="setupPassword" name="setup-password" type="password" required class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                        </div>
                    </div>

                    <div>
                        <label for="setup-confirm" class="block text-sm font-medium text-gray-700">
                            Confirm Password
                        </label>
                        <div class="mt-1">
                            <input id="setup-confirm" v-model="setupConfirmPassword" name="setup-confirm" type="password" required class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                        </div>
                    </div>

                    <div v-if="error" class="text-red-600 text-sm">
                        {{ error }}
                    </div>

                    <div>
                        <button type="submit" :disabled="loading" class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
                            <Loader2 v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4" />
                            Set Password & Login
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>
