// Cliente simplificado de Supabase para evitar problemas de WebSocket en build
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ovmodvuelqasgsdrbptk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92bW9kdnVlbHFhc2dzZHJicHRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MDUzNjYsImV4cCI6MjA2NjI4MTM2Nn0.OAey7qYJ23NVJycRs2fslqQ1eHcMIhY98P1NQfW9Th4';

// Cliente básico sin realtime para evitar problemas de build
export const supabaseSimple = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
    },
    // Desactivar realtime para evitar problemas de WebSocket
    realtime: {
        params: {
            eventsPerSecond: 0,
        },
    },
});

// Funciones helper simplificadas
export const uploadFileSimple = async (
    file: File,
    path: string,
    bucket: string = 'ares-files'
) => {
    try {
        const { data, error } = await supabaseSimple.storage
            .from(bucket)
            .upload(path, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            throw error;
        }

        return data;
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
};

export const getPublicUrlSimple = (path: string, bucket: string = 'ares-files') => {
    try {
        const { data } = supabaseSimple.storage
            .from(bucket)
            .getPublicUrl(path);

        return data.publicUrl;
    } catch (error) {
        console.error('Error getting public URL:', error);
        return '';
    }
};

export const downloadFileSimple = async (path: string, bucket: string = 'ares-files') => {
    try {
        const { data, error } = await supabaseSimple.storage
            .from(bucket)
            .download(path);

        if (error) {
            throw error;
        }

        return data;
    } catch (error) {
        console.error('Error downloading file:', error);
        throw error;
    }
};

export const deleteFileSimple = async (path: string, bucket: string = 'ares-files') => {
    try {
        const { error } = await supabaseSimple.storage
            .from(bucket)
            .remove([path]);

        if (error) {
            throw error;
        }

        return true;
    } catch (error) {
        console.error('Error deleting file:', error);
        throw error;
    }
};

export const listFilesSimple = async (path: string = '', bucket: string = 'ares-files') => {
    try {
        const { data, error } = await supabaseSimple.storage
            .from(bucket)
            .list(path, {
                limit: 100,
                offset: 0,
            });

        if (error) {
            throw error;
        }

        return data;
    } catch (error) {
        console.error('Error listing files:', error);
        return [];
    }
};