// src/js/dashboard.js
import { supabase } from './supabase.js';

document.addEventListener('DOMContentLoaded', async () => {
    const totalCreditEl = document.getElementById('total-outstanding-credit');
    const recentDeliveriesEl = document.getElementById('recent-deliveries-list');

    if (totalCreditEl) {
        updateTotalCredit(totalCreditEl);
    }

    if (recentDeliveriesEl) {
        updateRecentDeliveries(recentDeliveriesEl);
    }
});

async function updateTotalCredit(el) {
    try {
        const { data, error } = await supabase.from('stores').select('credit_balance');
        if (error) throw error;

        const total = data.reduce((acc, store) => acc + parseFloat(store.credit_balance), 0);
        el.textContent = `₹ ${total.toLocaleString('en-IN')}`;
    } catch (err) {
        console.error("Error calculating total credit:", err);
        el.textContent = "₹ ---";
    }
}

async function updateRecentDeliveries(el) {
    el.innerHTML = `
        <div class="flex justify-center py-12">
            <span class="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
        </div>
    `;

    try {
        const { data, error } = await supabase
            .from('deliveries')
            .select('*, stores(name)')
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) throw error;

        if (!data || data.length === 0) {
            el.innerHTML = `
                <div class="text-center py-12 text-on-surface-variant">
                    <p class="font-headline text-lg">No recent deliveries recorded.</p>
                </div>
            `;
            return;
        }

        el.innerHTML = data.map(delivery => `
            <div class="bg-surface-container-lowest rounded-lg p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:shadow-md">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 bg-surface-container rounded-full flex items-center justify-center">
                        <span class="material-symbols-outlined text-on-surface-variant">apartment</span>
                    </div>
                    <div>
                        <p class="font-headline font-bold text-lg text-on-surface">${delivery.stores?.name || 'Unknown Store'}</p>
                        <p class="text-sm font-label text-on-surface-variant">${new Date(delivery.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • ID: #${delivery.invoice_no || 'N/A'}</p>
                    </div>
                </div>
                <div class="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
                    <span class="text-xl font-headline font-bold text-on-surface">₹ ${parseFloat(delivery.total_amount).toLocaleString('en-IN')}</span>
                    <div class="h-10 px-6 rounded-full bg-primary-fixed flex items-center justify-center">
                        <span class="text-[0.65rem] font-bold uppercase tracking-widest text-on-primary-fixed-variant">${delivery.status.toUpperCase()}</span>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (err) {
        console.error("Error loading recent deliveries:", err);
        el.innerHTML = `<p class="text-error text-center py-4">Failed to load deliveries.</p>`;
    }
}
