<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';

import { Loader2 } from 'lucide-vue-next';

const authStore = useAuthStore();
const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const error = ref('');
const success = ref('');

const handleChangePassword = async () => {
    error.value = '';
    success.value = '';

    if (newPassword.value !== confirmPassword.value) {
        error.value = 'New passwords do not match';
        return;
    }

    if (newPassword.value.length < 6) {
        error.value = 'Password must be at least 6 characters';
        return;
    }

    loading.value = true;

    try {
        await authStore.changeAdminPassword(currentPassword.value, newPassword.value);
        success.value = 'Password changed successfully';
        currentPassword.value = '';
        newPassword.value = '';
        confirmPassword.value = '';
    } catch (e: any) {
        error.value = e.message || 'Failed to change password';
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <div class="p-6">
        <h1 class="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">Settings</h1>

        <div class="max-w-md bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 class="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200">Change Admin Password</h2>

            <form @submit.prevent="handleChangePassword" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
                    <input 
                        v-model="currentPassword"
                        type="password"
                        required
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Enter current password"
                    />
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                    <input 
                        v-model="newPassword"
                        type="password"
                        required
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Enter new password"
                    />
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
                    <input 
                        v-model="confirmPassword"
                        type="password"
                        required
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Confirm new password"
                    />
                </div>

                <div v-if="error" class="text-red-600 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                    {{ error }}
                </div>

                <div v-if="success" class="text-green-600 text-sm bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
                    {{ success }}
                </div>

                <button 
                    type="submit" 
                    :disabled="loading"
                    class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Loader2 v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Change Password
                </button>
            </form>
        </div>
    </div>
</template>
