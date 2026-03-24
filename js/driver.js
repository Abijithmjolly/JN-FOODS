import { supabase } from './supabase.js';
import { getRedirectPage } from './auth.js';

let storeId = null;
let products = [];
let currentIndex = 0;
let quantities = {}; // { productId: qty }

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    storeId = params.get('store_id');

    if (!storeId) {
        alert("No store selected!");
        window.location.href = 'stores_management.html';
        return;
    }

    await loadData();
    initUI();
});

async function loadData() {
    // Load store info
    const { data: store, error: storeError } = await supabase.from('stores').select('name').eq('id', storeId).single();
    if (storeError) console.error(storeError);
    if (store) {
        document.getElementById('display-store-name').textContent = store.name;
    }

    // Load products
    const { data: prods, error: prodError } = await supabase.from('products').select('*');
    if (prodError) console.error(prodError);
    products = prods || [];
    
    // Initialize quantities
    products.forEach(p => quantities[p.id] = 0);
}

function initUI() {
    updateItemDisplay();

    // Numpad logic
    const qtyInput = document.getElementById('qty-input');
    document.querySelectorAll('.numpad-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const val = btn.textContent.trim();
            if (val === 'C') {
                qtyInput.value = '';
            } else if (btn.querySelector('.material-symbols-outlined')) { // Backspace
                qtyInput.value = qtyInput.value.slice(0, -1);
            } else {
                if (qtyInput.value.length < 3) {
                    qtyInput.value = (qtyInput.value === '0' ? '' : qtyInput.value) + val;
                }
            }
            quantities[products[currentIndex].id] = parseInt(qtyInput.value) || 0;
        });
    });

    // Navigation
    document.getElementById('prev-item-btn').addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
            updateItemDisplay();
        }
    });

    const nextBtn = document.getElementById('next-item-btn');
    nextBtn.addEventListener('click', async () => {
        if (currentIndex < products.length - 1) {
            currentIndex++;
            updateItemDisplay();
        } else {
            await completeDelivery();
        }
    });

    // Close btn
    document.getElementById('close-btn').addEventListener('click', async () => {
        if (confirm("Cancel delivery recording? Data will be lost.")) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
                window.location.href = getRedirectPage(profile);
            } else {
                window.location.href = 'login.html';
            }
        }
    });
}

function updateItemDisplay() {
    const product = products[currentIndex];
    if (!product) return;

    document.getElementById('item-progress').textContent = `Item ${currentIndex + 1} of ${products.length}`;
    document.getElementById('display-item-name').textContent = product.name;
    document.getElementById('display-item-price').textContent = `₹ ${product.price} / unit`;
    document.getElementById('qty-input').value = quantities[product.id] || 0;

    const nextBtnSpan = document.querySelector('#next-item-btn span');
    if (currentIndex === products.length - 1) {
        nextBtnSpan.textContent = "Finish Delivery";
    } else {
        nextBtnSpan.textContent = "Next Item";
    }
}

async function completeDelivery() {
    const totalAmount = products.reduce((acc, p) => acc + (p.price * quantities[p.id]), 0);
    const invoiceNo = 'INV-' + Math.floor(Math.random() * 90000 + 10000);

    try {
        // 1. Create Delivery
        const { data: { session } } = await supabase.auth.getSession();
        const { data: delivery, error: delError } = await supabase.from('deliveries').insert({
            store_id: storeId,
            invoice_no: invoiceNo,
            total_amount: totalAmount,
            status: 'Delivered',
            driver_name: session?.user?.email || 'Unknown Driver',
            delivery_time: new Date().toISOString()
        }).select().single();

        if (delError) throw delError;

        // 2. Create Delivery Items
        const itemsToInsert = products
            .filter(p => quantities[p.id] > 0)
            .map(p => ({
                delivery_id: delivery.id,
                product_id: p.id,
                quantity: quantities[p.id],
                price: p.price
            }));

        if (itemsToInsert.length > 0) {
            const { error: itemsError } = await supabase.from('delivery_items').insert(itemsToInsert);
            if (itemsError) throw itemsError;
        }

        // 3. Update Store Credit
        const { data: storeData } = await supabase.from('stores').select('credit_balance').eq('id', storeId).single();
        const newBalance = parseFloat(storeData.credit_balance) + totalAmount;
        await supabase.from('stores').update({ credit_balance: newBalance }).eq('id', storeId);

        window.location.href = `billing.html?delivery_id=${delivery.id}`;
    } catch (err) {
        console.error("Error saving delivery:", err);
        alert("Failed to save delivery: " + err.message);
    }
}
