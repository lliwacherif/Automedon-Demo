<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useCars, type Car, type CarBrand, type CarStatus } from '@/composables/useCars';
import { useFileUpload } from '@/composables/useFileUpload';
import { useRoute, useRouter } from 'vue-router';

const { fetchCarById, createCar, updateCar } = useCars();
const { uploadFile, uploading: uploadingFile } = useFileUpload();
const route = useRoute();
const router = useRouter();

const isEditing = ref(false);
const loading = ref(false);
const error = ref('');
const selectedFile = ref<File | null>(null);
const previewUrl = ref<string>('');

const brands: CarBrand[] = ['Renault', 'Dacia', 'Skoda', 'Hyundai'];

const form = ref({
    brand: '' as CarBrand,
    model: '',
    plate_prefix: '', // e.g., "245"
    plate_suffix: '', // e.g., "4521"
    status: 'disponible' as CarStatus, // Default status
    image_url: '', // Will store the uploaded image URL
    auto_manage_status: true // Auto-manage status by default
});

const fullPlateNumber = computed(() => {
    if (form.value.plate_prefix && form.value.plate_suffix) {
        return `${form.value.plate_prefix}TN${form.value.plate_suffix}`;
    }
    return '';
});

onMounted(async () => {
    if (route.params.id) {
        isEditing.value = true;
        const car = await fetchCarById(Number(route.params.id));
        if (car) {
            // Parse plate number: ***TN****
            const match = car.plate_number.match(/^(\d+)TN(\d+)$/);
            const platePrefix = match ? match[1] : '';
            const plateSuffix = match ? match[2] : '';
            
            form.value.brand = car.brand;
            form.value.model = car.model;
            form.value.plate_prefix = platePrefix;
            form.value.plate_suffix = plateSuffix;
            form.value.status = car.status;
            form.value.image_url = car.image_url || '';
            form.value.auto_manage_status = car.auto_manage_status !== false; // Default to true
            previewUrl.value = car.image_url || '';
        }
    }
});

function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            error.value = 'Veuillez sélectionner une image valide';
            return;
        }
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            error.value = 'L\'image ne doit pas dépasser 5 MB';
            return;
        }
        
        selectedFile.value = file;
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            previewUrl.value = e.target?.result as string;
        };
        reader.readAsDataURL(file);
        
        error.value = '';
    }
}

function removeImage() {
    selectedFile.value = null;
    previewUrl.value = '';
    form.value.image_url = '';
    
    // Reset file input
    const fileInput = document.getElementById('car-image') as HTMLInputElement;
    if (fileInput) {
        fileInput.value = '';
    }
}

function validatePlateNumber(prefix: string, suffix: string): boolean {
    // Tunisian plate format: ***TN**** (flexible digit count)
    return /^\d{1,3}$/.test(prefix) && /^\d{1,4}$/.test(suffix);
}

async function handleSubmit() {
    loading.value = true;
    error.value = '';

    // Validate plate number parts
    if (!validatePlateNumber(form.value.plate_prefix, form.value.plate_suffix)) {
        error.value = 'Format de plaque invalide. Utilisez uniquement des chiffres (ex: 245 TN 4521)';
        loading.value = false;
        return;
    }

    try {
        let imageUrl = form.value.image_url;
        
        // Upload new image if selected
        if (selectedFile.value) {
            const uploadedUrl = await uploadFile(selectedFile.value, 'car-images', 'cars');
            if (uploadedUrl) {
                imageUrl = uploadedUrl;
            } else {
                console.error('Upload returned null');
                throw new Error('Échec du téléchargement de l\'image (URL manquante)');
            }
        }

        const carData = {
            brand: form.value.brand,
            model: form.value.model,
            plate_number: fullPlateNumber.value,
            status: form.value.status,
            image_url: imageUrl || undefined,
            auto_manage_status: form.value.auto_manage_status
        };

        if (isEditing.value) {
            await updateCar(Number(route.params.id), carData);
        } else {
            await createCar(carData);
        }
        router.push('/admin/cars');
    } catch (e: any) {
        console.error('Error saving car:', e);
        error.value = e.message || 'Une erreur est survenue lors de l\'enregistrement';
    } finally {
        loading.value = false;
    }
}
</script>

<template>
    <div class="p-6">
        <h1 class="text-2xl font-semibold text-gray-900 mb-6">
            {{ isEditing ? $t('admin.fleet.edit_car') : $t('admin.fleet.create_car') }}
        </h1>

        <form @submit.prevent="handleSubmit" class="bg-white shadow sm:rounded-lg p-6 space-y-6">
            <div v-if="error" class="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
                {{ error }}
            </div>

            <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <div>
                    <label class="block text-sm font-medium text-gray-700">
                        {{ $t('admin.fleet.brand') }}
                    </label>
                    <select 
                        v-model="form.brand" 
                        required 
                        class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                        <option value="" disabled>{{ $t('admin.fleet.select_brand') }}</option>
                        <option v-for="brand in brands" :key="brand" :value="brand">
                            {{ brand }}
                        </option>
                    </select>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700">
                        {{ $t('admin.fleet.model') }}
                    </label>
                    <input 
                        v-model="form.model" 
                        type="text" 
                        required 
                        class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                </div>

                <div class="sm:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        {{ $t('admin.fleet.plate_number') }}
                    </label>
                    <div class="flex items-center gap-2">
                        <input 
                            v-model="form.plate_prefix" 
                            type="text" 
                            required 
                            placeholder="245"
                            maxlength="3"
                            pattern="\d{1,3}"
                            class="block w-24 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                        <span class="text-lg font-bold text-gray-700">TN</span>
                        <input 
                            v-model="form.plate_suffix" 
                            type="text" 
                            required 
                            placeholder="4521"
                            maxlength="4"
                            pattern="\d{1,4}"
                            class="block w-28 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                        <span v-if="fullPlateNumber" class="ml-4 text-sm text-gray-500">
                            Aperçu: <span class="font-mono font-bold">{{ fullPlateNumber }}</span>
                        </span>
                    </div>
                    <p class="mt-1 text-sm text-gray-500">{{ $t('admin.fleet.plate_format') }}</p>
                </div>

                <div class="sm:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        {{ $t('admin.fleet.status') }}
                    </label>
                    
                    <!-- Auto-manage toggle -->
                    <div class="mb-3 flex items-center">
                        <input 
                            id="auto-manage-toggle"
                            v-model="form.auto_manage_status" 
                            type="checkbox"
                            class="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        >
                        <label for="auto-manage-toggle" class="ml-2 block text-sm text-gray-700">
                            Gestion automatique du statut
                            <span class="text-xs text-gray-500 block">
                                Le statut sera automatiquement mis à jour selon les réservations
                            </span>
                        </label>
                    </div>
                    
                    <!-- Status selector -->
                    <select 
                        v-model="form.status" 
                        :disabled="form.auto_manage_status || form.status !== 'maintenance'"
                        class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                        <option value="disponible">{{ $t('admin.fleet.disponible') }}</option>
                        <option value="loue">{{ $t('admin.fleet.loue') }}</option>
                        <option value="maintenance">{{ $t('admin.fleet.maintenance') }}</option>
                    </select>
                    
                    <p v-if="form.auto_manage_status" class="mt-1 text-xs text-indigo-600">
                        ℹ️ Le statut sera automatiquement défini selon les réservations actives
                    </p>
                    <div v-else class="mt-1 space-y-1">
                        <p class="text-xs text-amber-600">
                            ⚠️ Le statut est contrôlé manuellement.
                        </p>
                        <p v-if="form.status !== 'maintenance'" class="text-xs text-gray-500">
                            🔒 Le statut ne peut être modifié manuellement que si le véhicule est en maintenance.
                        </p>
                    </div>
                </div>

                <div class="sm:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Image de la voiture (optionnel)
                    </label>
                    
                    <!-- Image Preview -->
                    <div v-if="previewUrl" class="mb-4 relative inline-block">
                        <img 
                            :src="previewUrl" 
                            alt="Aperçu" 
                            class="h-40 w-auto rounded-lg shadow-md object-cover"
                        >
                        <button
                            type="button"
                            @click="removeImage"
                            class="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    
                    <!-- File Input -->
                    <input 
                        id="car-image"
                        type="file" 
                        accept="image/*"
                        @change="handleFileSelect"
                        class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    >
                    <p class="mt-1 text-sm text-gray-500">
                        PNG, JPG, JPEG jusqu'à 5MB
                    </p>
                </div>
            </div>

            <div class="flex justify-end space-x-3">
                <RouterLink 
                    to="/admin/cars" 
                    class="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    {{ $t('admin.fleet.cancel') }}
                </RouterLink>
                <button 
                    type="submit" 
                    :disabled="loading || uploadingFile" 
                    class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                    {{ loading || uploadingFile ? 'Chargement...' : $t('admin.fleet.save') }}
                </button>
            </div>
        </form>
    </div>
</template>
