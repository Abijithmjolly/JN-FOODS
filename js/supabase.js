// src/js/supabase.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://ffhhqtuajqpvwqqvbfqt.supabase.co';
// Using the legacy anon key for compatibility with standard CDN imports
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmaGhxdHVhanFwdndxcXZiZnF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNDE4ODUsImV4cCI6MjA4OTkxNzg4NX0.CWVuVP5TjC1XcQsdiwgiEhIvLaUgipegfCDgvsL4ni8';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Utility functions
export async function getStores() {
    const { data, error } = await supabase.from('stores').select('*');
    if (error) console.error('Error fetching stores:', error);
    return data;
}

export async function getProducts() {
    const { data, error } = await supabase.from('products').select('*');
    if (error) console.error('Error fetching products:', error);
    return data;
}
