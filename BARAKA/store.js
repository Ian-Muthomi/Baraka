// Africa's Talking Configuration
// Get these from https://account.africastalking.com/
const smsConfig = {
    apiKey: 'YOUR_AT_API_KEY', // Replace with your actual API key
    username: 'sandbox', // Use 'sandbox' for testing, or your live username
    senderId: 'BARAKA' // Optional, use your approved sender ID (or leave blank for sandbox)
};

// Store state
let storeCart = [];
const storeState = {
    currentCategory: 'all',
    searchQuery: '',
    selectedProduct: null, // Product selected for modal
    currentImageIndex: 0, // Current image index in product modal
    currentReceipt: '',
    currentCustomerPhone: '',
    currentCustomerEmail: ''
};

// Toggle cart sidebar
function toggleCart() {
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartOverlay = document.getElementById('cart-overlay');
    if (cartSidebar.style.right === '0px' || cartSidebar.style.transform === 'translateX(0px)') {
        cartSidebar.style.right = '-400px';
        cartOverlay.style.display = 'none';
    } else {
        cartSidebar.style.right = '0px';
        cartOverlay.style.display = 'block';
    }
}

// Close checkout modal
function closeCheckout() {
    document.getElementById('checkout-modal').style.display = 'none';
}

// Open product selection modal
function openProductModal(productId) {
    const product = state.inventory.find(p => p.id === productId);
    if (!product) return;
    
    storeState.selectedProduct = product;
    storeState.currentImageIndex = 0; // Reset to first image
    
    // Populate modal
    document.getElementById('product-modal-title').innerText = product.name;
    renderProductCarousel(product);
    
    // Handle colors
    const colorGroup = document.getElementById('color-group');
    const colorSelect = document.getElementById('product-color');
    
    if (product.colors && product.colors.length > 0) {
        colorGroup.style.display = 'block';
        colorSelect.innerHTML = product.colors.map(color => `<option value="${color}">${color}</option>`).join('');
    } else {
        colorGroup.style.display = 'none';
    }
    
    // Handle sizes
    const sizeGroup = document.getElementById('size-group');
    const sizeSelect = document.getElementById('product-size');
    
    if (product.sizes && product.sizes.length > 0) {
        sizeGroup.style.display = 'block';
        sizeSelect.innerHTML = product.sizes.map(size => `<option value="${size}">${size}</option>`).join('');
    } else {
        sizeGroup.style.display = 'none';
    }
    
    // Handle schools (only for uniforms)
    const schoolGroup = document.getElementById('school-group');
    const schoolSelect = document.getElementById('product-school');
    
    if (product.front === 'uniforms') {
        schoolGroup.style.display = 'block';
        schoolSelect.innerHTML = schools.map(school => `<option value="${school.id}">${school.name}</option>`).join('');
    } else {
        schoolGroup.style.display = 'none';
    }
    
    // Set quantity and stock
    document.getElementById('product-quantity').value = 1;
    document.getElementById('product-stock').innerText = `(${product.quantity} in stock)`;
    updateProductModalTotal();
    
    document.getElementById('product-modal').style.display = 'flex';
    lucide.createIcons();
}

// Render product image carousel
function renderProductCarousel(product) {
    let images = product.images || [];
    if (images.length === 0 && product.image) {
        images = [product.image];
    }
    const carouselContainer = document.getElementById('product-carousel-container');
    
    // If no images, use default emojis
    const displayImages = images.length > 0 ? images : [getProductEmoji(product)];
    
    carouselContainer.innerHTML = `
        <div class="carousel-main" style="width: 100%; height: 250px; border-radius: 8px; overflow: hidden; position: relative;">
            <img id="carousel-main-image" src="${displayImages[storeState.currentImageIndex]}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover;">
            ${displayImages.length > 1 ? `
                <button class="carousel-btn carousel-btn-prev" onclick="prevImage()" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); width: 40px; height: 40px; border-radius: 50%; background: rgba(0,0,0,0.5); border: none; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                    <i data-lucide="chevron-left"></i>
                </button>
                <button class="carousel-btn carousel-btn-next" onclick="nextImage()" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); width: 40px; height: 40px; border-radius: 50%; background: rgba(0,0,0,0.5); border: none; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                    <i data-lucide="chevron-right"></i>
                </button>
            ` : ''}
        </div>
        ${displayImages.length > 1 ? `
            <div class="carousel-thumbnails" style="display: flex; gap: 10px; margin-top: 10px; overflow-x: auto; padding-bottom: 5px;">
                ${displayImages.map((img, idx) => `
                    <div class="carousel-thumbnail ${idx === storeState.currentImageIndex ? 'active' : ''}" onclick="setCurrentImage(${idx})" style="width: 60px; height: 60px; border-radius: 8px; overflow: hidden; cursor: pointer; border: 2px solid ${idx === storeState.currentImageIndex ? '#ff8c00' : 'transparent'};">
                        <img src="${img}" alt="Thumbnail ${idx+1}" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                `).join('')}
            </div>
        ` : ''}
    `;
    lucide.createIcons();
}

// Navigate to previous image
function prevImage() {
    const product = storeState.selectedProduct;
    if (!product) return;
    let images = product.images || [];
    if (images.length === 0 && product.image) {
        images = [product.image];
    }
    if (images.length === 0) images = [getProductEmoji(product)];
    storeState.currentImageIndex = (storeState.currentImageIndex - 1 + images.length) % images.length;
    renderProductCarousel(product);
}

// Navigate to next image
function nextImage() {
    const product = storeState.selectedProduct;
    if (!product) return;
    let images = product.images || [];
    if (images.length === 0 && product.image) {
        images = [product.image];
    }
    if (images.length === 0) images = [getProductEmoji(product)];
    storeState.currentImageIndex = (storeState.currentImageIndex + 1) % images.length;
    renderProductCarousel(product);
}

// Set current image index
function setCurrentImage(idx) {
    storeState.currentImageIndex = idx;
    renderProductCarousel(storeState.selectedProduct);
}

// Close product modal
function closeProductModal() {
    document.getElementById('product-modal').style.display = 'none';
    storeState.selectedProduct = null;
    storeState.currentImageIndex = 0;
}

// Change quantity in modal
function changeModalQty(delta) {
    const input = document.getElementById('product-quantity');
    let qty = parseInt(input.value) + delta;
    
    if (qty < 1) qty = 1;
    if (storeState.selectedProduct && qty > storeState.selectedProduct.quantity) {
        qty = storeState.selectedProduct.quantity;
    }
    
    input.value = qty;
    updateProductModalTotal();
}

// Update total cost in product modal
function updateProductModalTotal() {
    if (!storeState.selectedProduct) return;
    
    const qty = parseInt(document.getElementById('product-quantity').value) || 0;
    const total = storeState.selectedProduct.retailPrice * qty;
    document.getElementById('product-modal-total').innerText = formatCurrency(total);
}

// Confirm and add product to cart
function confirmAddToCart() {
    if (!storeState.selectedProduct) return;
    
    const qty = parseInt(document.getElementById('product-quantity').value) || 0;
    const sizeSelect = document.getElementById('size-group').style.display !== 'none' ? document.getElementById('product-size').value : null;
    const colorSelect = document.getElementById('color-group').style.display !== 'none' ? document.getElementById('product-color').value : null;
    const schoolSelect = document.getElementById('school-group').style.display !== 'none' ? document.getElementById('product-school').value : null;
    
    addToCart(storeState.selectedProduct.id, qty, sizeSelect, colorSelect, schoolSelect);
    closeProductModal();
}

// --- Cart Management ---
function addToCart(productId, qty, size = null, color = null, school = null) {
    const product = state.inventory.find(p => p.id === productId);
    if (!product) return;
    
    qty = qty || 1;
    
    // Check if same product with same size, color, school is already in cart
    const existingIndex = storeCart.findIndex(item => 
        item.productId === productId && 
        item.size === size && 
        item.color === color && 
        item.school === school
    );
    
    if (existingIndex !== -1) {
        const newQty = storeCart[existingIndex].quantity + qty;
        if (newQty > product.quantity) {
            alert(`Only ${product.quantity} in stock!`);
            return;
        }
        storeCart[existingIndex].quantity = newQty;
    } else {
        storeCart.push({
            productId: productId,
            quantity: qty,
            size: size,
            color: color,
            school: school
        });
    }
    
    saveCartToStorage();
    updateCartUI();
}

// Helper function to get school name from id
function getSchoolName(schoolId) {
    const school = schools.find(s => s.id === schoolId);
    return school ? school.name : '';
}

// Helper function to get product's display image (first image or emoji)
function getProductDisplayImage(product) {
    if (product.images && product.images.length > 0) {
        return product.images[0];
    }
    if (product.image) {
        return product.image;
    }
    return getProductEmoji(product);
}

// Helper function to get product emoji
function getProductEmoji(product) {
    if (product.front === 'uniforms') {
        return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 100 100"%3E%3Crect fill="%231a1a1a" width="100" height="100"/%3E%3Ctext x="50" y="60" text-anchor="middle" font-size="40"%3E👕%3C/text%3E%3C/svg%3E';
    } else {
        return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 100 100"%3E%3Crect fill="%231a1a1a" width="100" height="100"/%3E%3Ctext x="50" y="60" text-anchor="middle" font-size="40"%3E🍳%3C/text%3E%3C/svg%3E';
    }
}

function updateCartUI() {
    const cartItemsEl = document.getElementById('cart-items');
    const cartCountEl = document.getElementById('cart-count');
    const cartTotalEl = document.getElementById('cart-total');
    
    let totalCount = 0;
    let totalCost = 0;
    
    if (storeCart.length === 0) {
        cartItemsEl.innerHTML = '<div style="color: #888; padding: 2rem; text-align: center;">Your cart is empty</div>';
    } else {
        cartItemsEl.innerHTML = storeCart.map((cartItem, idx) => {
            const product = state.inventory.find(p => p.id === cartItem.productId);
            if (!product) return '';
            
            const itemTotal = product.retailPrice * cartItem.quantity;
            totalCount += cartItem.quantity;
            totalCost += itemTotal;
            
            // Build details string
            let details = [];
            if (cartItem.size) details.push(`Size: ${cartItem.size}`);
            if (cartItem.color) details.push(`Color: ${cartItem.color}`);
            if (cartItem.school) details.push(`School: ${getSchoolName(cartItem.school)}`);
            
            return `
                <div class="cart-item">
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: #fff;">${product.name}</div>
                        <div style="font-size: 0.85rem; color: #aaa;">
                            ${details.length > 0 ? details.join(' • ') + ' • ' : ''}
                            ${formatCurrency(product.retailPrice)} each
                        </div>
                        <div class="qty-controls">
                            <button class="qty-btn" onclick="updateCartQty(${idx}, -1)">-</button>
                            <span style="padding: 0 0.75rem; color: #fff; font-weight: bold;">${cartItem.quantity}</span>
                            <button class="qty-btn" onclick="updateCartQty(${idx}, 1)">+</button>
                        </div>
                    </div>
                    <div style="text-align: right; display: flex; flex-direction: column; justify-content: space-between;">
                        <div style="font-weight: bold; color: #fbbf24;">${formatCurrency(itemTotal)}</div>
                        <button onclick="removeFromCart(${idx})" style="background: none; border: none; color: #ef4444; cursor: pointer;">
                            <i data-lucide="trash-2" style="width: 18px; height: 18px;"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    cartCountEl.innerText = totalCount;
    cartTotalEl.innerText = formatCurrency(totalCost);
    lucide.createIcons();
}

// --- Other functions (render products, etc.) ---

function renderProducts() {
    const productsGrid = document.getElementById('products-grid');
    if (!productsGrid) return;
    
    let filteredProducts = state.inventory;
    
    if (storeState.currentCategory !== 'all') {
        filteredProducts = filteredProducts.filter(p => p.front === storeState.currentCategory);
    }
    
    if (storeState.searchQuery) {
        const q = storeState.searchQuery.toLowerCase();
        filteredProducts = filteredProducts.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    }
    
    productsGrid.innerHTML = filteredProducts.map(product => {
        const isInStock = product.quantity > 0;
        const isLowStock = product.quantity <= product.threshold;
        
        return `
            <div class="product-card">
                <div class="product-image">
                    <img src="${getProductDisplayImage(product)}" alt="${product.name}">
                </div>
                <div class="product-info">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                        <div class="product-name">${product.name}</div>
                        <span class="stock-badge ${isInStock ? (isLowStock ? 'low' : 'in') : 'out'}">
                            ${!isInStock ? 'Out of Stock' : (isLowStock ? 'Low Stock' : 'In Stock')}
                        </span>
                    </div>
                    <div class="product-price">${formatCurrency(product.retailPrice)}</div>
                    <button 
                        onclick="openProductModal('${product.id}')" 
                        class="add-to-cart-btn"
                        ${!isInStock ? 'disabled' : ''}
                        style="opacity: ${!isInStock ? '0.5' : '1'}; cursor: ${!isInStock ? 'not-allowed' : 'pointer'}"
                    >
                        <i data-lucide="shopping-cart"></i> Add to Cart
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    lucide.createIcons();
}

// --- Checkout and receipts ---
// Generate receipt text
function generateReceiptText(checkoutData) {
    const itemsText = storeCart.map(cartItem => {
        const product = state.inventory.find(p => p.id === cartItem.productId);
        const itemTotal = product.retailPrice * cartItem.quantity;
        
        // Build details string
        let details = [];
        if (cartItem.size) details.push(cartItem.size);
        if (cartItem.color) details.push(cartItem.color);
        if (cartItem.school) details.push(getSchoolName(cartItem.school));
        
        const detailsStr = details.length > 0 ? ` (${details.join(', ')})` : '';
        
        return `${product.name}${detailsStr} x${cartItem.quantity} = ${formatCurrency(itemTotal)}`;
    }).join('\n');
    
    const total = storeCart.reduce((sum, cartItem) => {
        const product = state.inventory.find(p => p.id === cartItem.productId);
        return sum + (product.retailPrice * cartItem.quantity);
    }, 0);
    
    return `
BARAKA STORES - PURCHASE RECEIPT
================================
Date: ${new Date().toLocaleString('en-KE')}
Customer: ${checkoutData.customerName}
Phone: ${checkoutData.customerPhone}
${checkoutData.customerEmail ? `Email: ${checkoutData.customerEmail}` : ''}
Payment Method: ${checkoutData.paymentMethod}
--------------------------------
ITEMS PURCHASED:
${itemsText}
--------------------------------
TOTAL: ${formatCurrency(total)}
================================
Thank you for shopping with Baraka!
For inquiries: +254 700 123 456
`;
}

// Close receipt modal
function closeReceiptModal() {
    document.getElementById('receipt-modal').style.display = 'none';
}

// Download receipt
function downloadReceipt() {
    const blob = new Blob([storeState.currentReceipt], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'baraka-receipt.txt';
    a.click();
    window.URL.revokeObjectURL(url);
}

// Copy receipt to clipboard
function copyReceipt() {
    navigator.clipboard.writeText(storeState.currentReceipt).then(() => {
        alert('Receipt copied to clipboard!');
    }).catch(() => alert('Failed to copy receipt!'));
}

// WhatsApp receipt
function whatsAppReceipt() {
    const whatsappUrl = `https://wa.me/${normalizePhone(storeState.currentCustomerPhone)}?text=${encodeURIComponent(storeState.currentReceipt)}`;
    window.open(whatsappUrl, '_blank');
}

// Email receipt
function emailReceipt() {
    const subject = encodeURIComponent('Baraka Stores Purchase Receipt');
    const body = encodeURIComponent(storeState.currentReceipt);
    const to = storeState.currentCustomerEmail || '';
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
}

// Send SMS via Africa's Talking API
async function sendSMS(phone, message) {
    try {
        const normalizedPhone = normalizePhone(phone);
        console.log('Sending SMS to:', normalizedPhone);
        console.log('Using username:', smsConfig.username);

        const response = await fetch('https://api.africastalking.com/version1/messaging', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'apiKey': smsConfig.apiKey
            },
            body: new URLSearchParams({
                username: smsConfig.username,
                to: normalizedPhone,
                message: message.substring(0, 1600),
                from: smsConfig.senderId
            })
        });

        if (!response.ok) {
            console.error('API request failed:', response.status, response.statusText);
            return { success: false, error: `API Error: ${response.status} ${response.statusText}` };
        }

        const result = await response.json();
        console.log('SMS API Response:', result);

        if (result.SMSMessageData && result.SMSMessageData.Recipients && result.SMSMessageData.Recipients.length > 0) {
            const recipient = result.SMSMessageData.Recipients[0];
            if (recipient.status === 'Success') {
                return { success: true, result };
            } else {
                return { success: false, error: recipient.status };
            }
        } else {
            return { success: false, error: 'Invalid response from API' };
        }
    } catch (error) {
        console.error('Failed to send SMS:', error);
        return { success: false, error };
    }
}

// SMS receipt (via API or fallback to device SMS)
async function smsReceipt() {
    const result = await sendSMS(storeState.currentCustomerPhone, storeState.currentReceipt);
    if (result.success) {
        alert('Receipt sent via SMS successfully!');
    } else {
        // Fallback to device SMS if API fails
        const smsBody = encodeURIComponent(storeState.currentReceipt.substring(0, 1600));
        const phone = normalizePhone(storeState.currentCustomerPhone);
        window.location.href = `sms:${phone}?body=${smsBody}`;
    }
}

// --- Other existing functions ---
function setStoreCategory(category) {
    storeState.currentCategory = category;
    const tabs = document.querySelectorAll('.category-tab');
    tabs.forEach(tab => {
        if (tab.dataset.category === category) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    renderProducts();
}

function searchProducts(query) {
    storeState.searchQuery = query;
    renderProducts();
}

function updateCartQty(idx, delta) {
    const product = state.inventory.find(p => p.id === storeCart[idx].productId);
    const newQty = storeCart[idx].quantity + delta;
    
    if (newQty < 1) {
        removeFromCart(idx);
        return;
    }
    
    if (newQty > product.quantity) {
        alert(`Only ${product.quantity} in stock!`);
        return;
    }
    
    storeCart[idx].quantity = newQty;
    saveCartToStorage();
    updateCartUI();
}

function removeFromCart(idx) {
    storeCart.splice(idx, 1);
    saveCartToStorage();
    updateCartUI();
}

function saveCartToStorage() {
    if (window.sessionStorage) {
        sessionStorage.setItem('barakaStoreCart', JSON.stringify(storeCart));
    }
}

function loadCartFromStorage() {
    if (window.sessionStorage) {
        try {
            const saved = JSON.parse(sessionStorage.getItem('barakaStoreCart'));
            if (saved) storeCart = saved;
        } catch (e) {
            console.error('Failed to load cart:', e);
        }
    }
}

function normalizePhone(phone) {
    let normalized = phone.replace(/\D/g, '');
    if (normalized.startsWith('0')) normalized = '254' + normalized.substring(1);
    if (!normalized.startsWith('254')) normalized = '254' + normalized;
    return '+' + normalized;
}

// Initialize store
function initializeStore() {
    if (!state.inventory || state.inventory.length === 0) {
        initializeDatabase();
    }
    
    renderProducts();
    loadCartFromStorage();
    updateCartUI();
    lucide.createIcons();
    
    setTimeout(() => lucide.createIcons(), 100);
}

// Setup checkout form
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('store.html')) {
        const checkoutForm = document.getElementById('checkout-form');
        if (checkoutForm) {
            checkoutForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                if (storeCart.length === 0) {
                    alert('Your cart is empty!');
                    return;
                }
                
                const checkoutData = {
                    customerName: document.getElementById('customer-name').value,
                    customerPhone: document.getElementById('customer-phone').value,
                    customerEmail: document.getElementById('customer-email') ? document.getElementById('customer-email').value : '',
                    paymentMethod: document.getElementById('payment-method').value
                };
                
                const phoneRegex = /^(\+?254|0)?[17]\d{8}$/;
                if (!phoneRegex.test(checkoutData.customerPhone)) {
                    alert('Please enter a valid Kenyan phone number!');
                    return;
                }
                
                storeCart.forEach(cartItem => {
                    const product = state.inventory.find(p => p.id === cartItem.productId);
                    if (cartItem.quantity > product.quantity) {
                        alert(`Not enough stock for ${product.name}!`);
                        return;
                    }
                    product.quantity -= cartItem.quantity;
                });
                
                saveToLocalStorage();
                
                const total = storeCart.reduce((sum, cartItem) => {
                    const product = state.inventory.find(p => p.id === cartItem.productId);
                    return sum + (product.retailPrice * cartItem.quantity);
                }, 0);
                
                state.sales.unshift({
                    id: 'sale-' + Date.now(),
                    date: new Date().toISOString(),
                    items: storeCart.map(cartItem => ({
                        productId: cartItem.productId,
                        quantity: cartItem.quantity,
                        size: cartItem.size,
                        color: cartItem.color,
                        school: cartItem.school,
                        price: state.inventory.find(p => p.id === cartItem.productId).retailPrice
                    })),
                    total: total,
                    paymentMethod: checkoutData.paymentMethod,
                    customerInfo: {
                        name: checkoutData.customerName,
                        phone: checkoutData.customerPhone,
                        email: checkoutData.customerEmail
                    }
                });
                
                saveToLocalStorage();
                
                storeState.currentReceipt = generateReceiptText(checkoutData);
                storeState.currentCustomerPhone = checkoutData.customerPhone;
                storeState.currentCustomerEmail = checkoutData.customerEmail;
                
                // Automatically send SMS receipt
                const smsResult = await sendSMS(checkoutData.customerPhone, storeState.currentReceipt);
                
                document.getElementById('receipt-preview').innerText = storeState.currentReceipt;
                document.getElementById('receipt-modal').style.display = 'flex';
                lucide.createIcons();
                
                if (smsResult.success) {
                    setTimeout(() => {
                        alert('Receipt has been sent to your phone via SMS!');
                    }, 500);
                }
                
                storeCart = [];
                saveCartToStorage();
                updateCartUI();
                renderProducts();
                checkoutForm.reset();
            });
        }
        
        initializeStore();
    }
});

if (document.readyState !== 'loading' && window.location.pathname.includes('store.html')) {
    initializeStore();
}

if (window.location.pathname.includes('store.html')) {
    window.addEventListener('load', () => {
        lucide.createIcons();
    });
}
