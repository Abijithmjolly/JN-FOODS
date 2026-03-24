// src/js/stores.js
import { getStores } from './supabase.js';

document.addEventListener('DOMContentLoaded', async () => {
    const storesGrid = document.getElementById('stores-grid');
    if (!storesGrid) return;

    storesGrid.innerHTML = `
        <div class="col-span-full flex justify-center py-12">
            <span class="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
        </div>
    `;

    try {
        const stores = await getStores();
        if (!stores || stores.length === 0) {
            storesGrid.innerHTML = `
                <div class="col-span-full text-center py-12 text-on-surface-variant">
                    <p class="font-headline text-xl">No stores found.</p>
                </div>
            `;
            return;
        }

        storesGrid.innerHTML = stores.map(store => `
<div class="bg-surface-container-lowest p-8 rounded-xl flex flex-col justify-between min-h-[220px] group hover:shadow-[0_20px_50px_rgba(0,0,0,0.04)] transition-all duration-300">
    <div>
        <div class="flex justify-between items-start mb-6">
            <h3 class="text-2xl font-bold text-on-surface leading-tight">${store.name}</h3>
            <span class="${store.status === 'Active' ? 'bg-primary-fixed text-on-primary-fixed' : 'bg-surface-container-high text-on-surface-variant'} px-4 py-1.5 rounded-full text-[0.7rem] font-bold uppercase tracking-widest">${store.status}</span>
        </div>
        <div class="space-y-1">
            <p class="text-on-surface-variant text-sm font-medium">Credit Balance</p>
            <p class="text-3xl font-headline font-extrabold ${store.credit_balance > 10000 ? 'text-on-surface' : 'text-tertiary'}">₹ ${parseFloat(store.credit_balance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
    </div>
    <div class="mt-8">
        <button onclick="window.location.href='driver_entry.html?store_id=${store.id}'" class="w-full h-[60px] bg-primary text-on-primary font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-[#0a4f15] active:scale-[0.98] transition-all">
            <span class="material-symbols-outlined text-xl" data-icon="local_shipping">local_shipping</span>
            Record Delivery
        </button>
    </div>
</div>
        `).join('');

    } catch (err) {
        console.error("Error loading stores:", err);
        storesGrid.innerHTML = `
            <div class="col-span-full text-center py-12 text-error">
                <p class="font-headline text-xl font-bold">Failed to load stores.</p>
            </div>
        `;
    }
});
