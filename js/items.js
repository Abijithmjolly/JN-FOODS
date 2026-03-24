// src/js/items.js
import { getProducts } from './supabase.js';

document.addEventListener('DOMContentLoaded', async () => {
    const itemsGrid = document.getElementById('items-grid');
    if (!itemsGrid) return;

    itemsGrid.innerHTML = `
        <div class="col-span-full flex justify-center py-12">
            <span class="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
        </div>
    `;

    try {
        const products = await getProducts();
        
        if (!products || products.length === 0) {
            itemsGrid.innerHTML = `
                <div class="col-span-full text-center py-12 text-on-surface-variant">
                    <p class="font-headline text-xl">No bakery products found.</p>
                </div>
            `;
            return;
        }

        renderProducts(products, itemsGrid);

        // Search functionalify
        const searchInput = document.querySelector('input[type="text"]');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                const filtered = products.filter(p => 
                    p.name.toLowerCase().includes(term) || 
                    p.category.toLowerCase().includes(term)
                );
                renderProducts(filtered, itemsGrid);
            });
        }

    } catch (err) {
        console.error("Error loading products:", err);
        itemsGrid.innerHTML = `
            <div class="col-span-full text-center py-12 text-error">
                <p class="font-headline text-xl font-bold">Failed to load items.</p>
            </div>
        `;
    }
});

function renderProducts(products, container) {
    if (products.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12 text-on-surface-variant">
                <p class="font-headline text-xl">No items match your search.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = products.map(product => {
        let categoryColorClass = 'bg-primary-fixed text-on-primary-fixed-variant';
        if (product.category === 'Viennoiserie') categoryColorClass = 'bg-tertiary-fixed text-on-tertiary-fixed-variant border-l-4 border-tertiary';
        if (product.category === 'Pastry') categoryColorClass = 'bg-secondary-fixed text-on-secondary-fixed-variant';

        return `
            <div class="bg-surface-container-lowest p-8 rounded-xl flex flex-col justify-between min-h-[220px] shadow-sm hover:shadow-xl transition-shadow duration-300">
                <div class="flex justify-between items-start gap-4">
                    <div class="flex-1 overflow-hidden">
                        <span class="inline-block px-3 py-1 ${categoryColorClass} rounded-full text-[0.7rem] font-bold uppercase tracking-widest mb-3">${product.category}</span>
                        <h3 class="font-headline text-2xl font-bold text-on-surface leading-tight truncate" title="${product.name}">${product.name}</h3>
                    </div>
                </div>
                <div class="flex items-center justify-between mt-8">
                    <div class="flex flex-col">
                        <span class="text-on-surface-variant text-xs font-label uppercase tracking-wider">Price per unit</span>
                        <span class="font-headline text-3xl font-extrabold text-primary">₹ ${product.price}</span>
                    </div>
                    <button class="bg-surface-container-high text-on-surface h-[56px] px-6 rounded-lg font-bold flex items-center gap-2 active:scale-95 transition-all">
                        <span class="material-symbols-outlined text-xl" data-icon="edit">edit</span>
                        Edit
                    </button>
                </div>
            </div>
        `;
    }).join('') + `
        <!-- Empty Placeholder / Suggestion Card -->
        <div class="border-2 border-dashed border-outline-variant p-8 rounded-xl flex flex-col items-center justify-center min-h-[220px] text-center opacity-60">
            <span class="material-symbols-outlined text-4xl mb-4" data-icon="inventory_2">inventory_2</span>
            <p class="font-headline text-lg font-bold text-on-surface-variant">Expand the Collection</p>
            <p class="text-sm font-body">Add new seasonal recipes here</p>
        </div>
    `;
}
