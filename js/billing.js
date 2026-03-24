import { supabase } from './supabase.js';
import { getRedirectPage } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const deliveryId = params.get('delivery_id');

    if (!deliveryId) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
            window.location.href = getRedirectPage(profile);
        } else {
            window.location.href = 'login.html';
        }
        return;
    }

    await loadInvoice(deliveryId);
});

async function loadInvoice(id) {
    try {
        const { data: delivery, error } = await supabase
            .from('deliveries')
            .select('*, stores(name, id), delivery_items(*, products(name))')
            .eq('id', id)
            .single();

        if (error) throw error;

        // Header Info
        document.getElementById('display-store-name').textContent = delivery.stores?.name || 'Unknown Store';
        document.getElementById('display-invoice-no').textContent = delivery.invoice_no || 'N/A';
        document.getElementById('display-date').textContent = new Date(delivery.created_at).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
        document.getElementById('display-driver-info').textContent = `${delivery.driver_name || 'Rajesh K.'} (Vehicle: AP-09-CD-4567)`;

        // Line Items
        const container = document.getElementById('line-items-container');
        if (delivery.delivery_items && delivery.delivery_items.length > 0) {
            container.innerHTML = delivery.delivery_items.map(item => `
                <div class="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 py-4 items-center border-b border-outline-variant/10">
                    <div class="col-span-1 sm:col-span-6">
                        <p class="font-headline font-bold text-on-surface">${item.products?.name || 'Unknown Item'}</p>
                    </div>
                    <div class="col-span-1 sm:col-span-2 text-center font-medium">
                        <span class="sm:hidden text-xs text-on-surface-variant mr-2 uppercase tracking-tighter">Qty:</span>
                        ${item.quantity}
                    </div>
                    <div class="col-span-1 sm:col-span-2 text-right text-on-surface-variant">
                        <span class="sm:hidden text-xs text-on-surface-variant mr-2 uppercase tracking-tighter">Rate:</span>
                        ₹ ${parseFloat(item.price).toLocaleString('en-IN')}
                    </div>
                    <div class="col-span-1 sm:col-span-2 text-right font-bold text-lg sm:text-base text-on-surface">
                        ₹ ${(item.quantity * item.price).toLocaleString('en-IN')}
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = `<p class="text-center py-6 text-on-surface-variant italic">No items found in this delivery.</p>`;
        }

        // Totals
        const subtotal = parseFloat(delivery.total_amount);
        const handling = 250; // Mock fixed handling for now
        document.getElementById('display-subtotal').textContent = `₹ ${subtotal.toLocaleString('en-IN')}`;
        document.getElementById('display-total').textContent = `₹ ${(subtotal + handling).toLocaleString('en-IN')}`;

        // Back button
        const backBtn = document.getElementById('back-btn');
        if (backBtn) {
            backBtn.onclick = async () => {
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
                    window.location.href = getRedirectPage(profile);
                } else {
                    window.location.href = 'login.html';
                }
            };
        }

    } catch (err) {
        console.error("Error loading invoice:", err);
        alert("Failed to load invoice details.");
    }
}
