import { ref } from 'vue';
import { supabase } from '@/lib/supabase';

export function useFileUpload() {
    const uploading = ref(false);
    const uploadError = ref<string | null>(null);

    /**
     * Upload a file to Supabase Storage
     * @param file - The file to upload
     * @param bucket - The storage bucket name (default: 'car-images')
     * @param folder - Optional folder path within the bucket
     * @returns The public URL of the uploaded file, or null if upload failed
     */
    async function uploadFile(
        file: File,
        bucket: string = 'car-images',
        folder: string = ''
    ): Promise<string | null> {
        uploading.value = true;
        uploadError.value = null;

        try {
            // Generate unique filename
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = folder ? `${folder}/${fileName}` : fileName;

            // Upload file to Supabase Storage
            const { data, error } = await supabase.storage
                .from(bucket)
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                console.error('Supabase Storage Upload Error:', error);
                throw error;
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (e: any) {
            uploadError.value = e.message;
            console.error('Error uploading file:', e);
            return null;
        } finally {
            uploading.value = false;
        }
    }

    /**
     * Delete a file from Supabase Storage
     * @param url - The public URL of the file to delete
     * @param bucket - The storage bucket name (default: 'car-images')
     */
    async function deleteFile(url: string, bucket: string = 'car-images'): Promise<boolean> {
        try {
            // Extract file path from URL
            const urlParts = url.split(`/storage/v1/object/public/${bucket}/`);
            if (urlParts.length < 2) {
                throw new Error('Invalid file URL');
            }
            const filePath = urlParts[1];

            const { error } = await supabase.storage
                .from(bucket)
                .remove([filePath]);

            if (error) throw error;

            return true;
        } catch (e: any) {
            uploadError.value = e.message;
            console.error('Error deleting file:', e);
            return false;
        }
    }

    return {
        uploading,
        uploadError,
        uploadFile,
        deleteFile
    };
}
