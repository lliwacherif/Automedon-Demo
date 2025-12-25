<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
    modelValue: string | undefined;
    required?: boolean;
}>();

const emit = defineEmits(['update:modelValue']);

// Hours (00-23)
const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
// Minutes (00, 30)
const minutes = ['00', '30'];

const localDate = ref('');
const localHour = ref('09');
const localMinute = ref('00');

// Initialize local refs from modelValue
function initFromModel() {
    if (props.modelValue) {
        // modelValue is typically "YYYY-MM-DDTHH:mm:..."
        const parts = props.modelValue.split('T');
        if (parts.length >= 2) {
            localDate.value = parts[0];
            const timeParts = parts[1].split(':');
            if (timeParts.length >= 2) {
                localHour.value = timeParts[0];
                // Snap to nearest allowed minute if needed? Or just take it. 
                // For now, let's just take it or default to 00 if invalid in our list
                localMinute.value = minutes.includes(timeParts[1].substring(0, 2)) ? timeParts[1].substring(0, 2) : '00';
            }
        } else if (parts.length === 1 && parts[0]) {
             localDate.value = parts[0];
             localHour.value = '09';
             localMinute.value = '00';
        }
    } else {
        localDate.value = '';
        localHour.value = '09';
        localMinute.value = '00';
    }
}

watch(() => props.modelValue, () => {
    const composed = localDate.value ? `${localDate.value}T${localHour.value}:${localMinute.value}` : '';
    // If external value is different (ignoring seconds), sync.
    // Fix: explicitly check if composed is empty to force init
    if (props.modelValue && (!composed || !props.modelValue.startsWith(composed))) {
         initFromModel();
    }
}, { immediate: true });

// Emit updates
watch([localDate, localHour, localMinute], ([newDate, newHour, newMinute]) => {
    if (newDate && newHour && newMinute) {
        emit('update:modelValue', `${newDate}T${newHour}:${newMinute}`);
    } else {
        emit('update:modelValue', '');
    }
});
</script>

<template>
    <div class="flex space-x-2">
        <!-- Date Input -->
        <input 
            v-model="localDate"
            type="date"
            :required="required"
            class="block w-1/2 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
        >
        
        <!-- Time Inputs Wrapper -->
        <div class="flex w-1/2 items-center gap-1">
            <!-- Hour -->
            <select
                v-model="localHour"
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-0 py-2 border text-center"
            >
                <option v-for="h in hours" :key="h" :value="h">{{ h }}</option>
            </select>
            
            <span class="text-gray-500 font-bold">:</span>
            
            <!-- Minute -->
            <select
                v-model="localMinute"
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-0 py-2 border text-center"
            >
                <option v-for="m in minutes" :key="m" :value="m">{{ m }}</option>
            </select>
        </div>
    </div>
</template>

