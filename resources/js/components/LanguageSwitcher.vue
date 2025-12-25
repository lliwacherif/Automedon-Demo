<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { locale } = useI18n();

function toggleLanguage() {
    locale.value = locale.value === 'en' ? 'fr' : 'en';
}
</script>

<template>
    <button 
        @click="toggleLanguage" 
        class="flex items-center text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium focus:outline-none"
        title="Switch Language"
    >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span class="uppercase">{{ locale }}</span>
    </button>
</template>
