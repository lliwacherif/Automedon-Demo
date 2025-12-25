import { ref } from 'vue';
import { supabase } from '@/lib/supabase';
import { useFileUpload } from './useFileUpload';

export interface ReservationDocument {
    id: string;
    reservation_id: number;
    file_url: string;
    file_name: string;
    uploaded_at: string;
}

export function useReservationDocuments() {
    const documents = ref<ReservationDocument[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);
    const { uploadFile: uploadToStorage, deleteFile: deleteFromStorage } = useFileUpload();

    async function fetchDocuments(reservationId: number) {
        loading.value = true;
        error.value = null;
        try {
            const { data, error: supabaseError } = await supabase
                .from('reservation_documents')
                .select('*')
                .eq('reservation_id', reservationId)
                .order('uploaded_at', { ascending: false });

            if (supabaseError) throw supabaseError;
            documents.value = data as ReservationDocument[];
        } catch (e: any) {
            error.value = e.message;
            console.error('Error fetching documents:', e);
        } finally {
            loading.value = false;
        }
    }

    async function uploadDocument(reservationId: number, file: File) {
        loading.value = true;
        error.value = null;
        try {
            // 1. Upload to Storage
            const publicUrl = await uploadToStorage(file, 'contracts', `reservation-${reservationId}`);
            if (!publicUrl) throw new Error('Failed to upload file to storage');

            // 2. Insert into Database
            const { data, error: dbError } = await supabase
                .from('reservation_documents')
                .insert({
                    reservation_id: reservationId,
                    file_url: publicUrl,
                    file_name: file.name,
                } as any)
                .select()
                .single();

            if (dbError) {
                // Cleanup storage if DB insert fails
                await deleteFromStorage(publicUrl, 'contracts');
                throw dbError;
            }

            // 3. Update local state
            if (data) {
                documents.value.unshift(data as ReservationDocument);
            }
            return data;
        } catch (e: any) {
            error.value = e.message;
            console.error('Error uploading document:', e);
            throw e;
        } finally {
            loading.value = false;
        }
    }

    async function deleteDocument(id: string, fileUrl: string) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) return;

        loading.value = true;
        error.value = null;
        try {
            // 1. Delete from Storage
            const deleted = await deleteFromStorage(fileUrl, 'contracts');
            if (!deleted) throw new Error('Failed to delete file from storage');

            // 2. Delete from Database
            const { error: dbError } = await supabase
                .from('reservation_documents')
                .delete()
                .eq('id', id);

            if (dbError) throw dbError;

            // 3. Update local state
            documents.value = documents.value.filter(doc => doc.id !== id);
        } catch (e: any) {
            error.value = e.message;
            console.error('Error deleting document:', e);
            alert('Erreur lors de la suppression du document');
        } finally {
            loading.value = false;
        }
    }

    return {
        documents,
        loading,
        error,
        fetchDocuments,
        uploadDocument,
        deleteDocument
    };
}
