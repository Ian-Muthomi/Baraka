// ==========================================
// BARAKA ERP - CORE APPLICATION LOGIC
// ==========================================

// Global state variables
let state = {
    inventory: [],
    sales: [],
    expenses: [],
    peakPlanner: {
        uniformsMultiplier: 1.5,
        utensilsMultiplier: 1.8,
        checklist: []
    },
    attendance: [],
    notifications: []
};

let currentUser = null;
let currentTab = 'alice-dashboard';
let revenueExpensesChartInstance = null;
let shopShareChartInstance = null;

// ==========================================
// 1. DATA SEEDER & INITIALIZATION
// ==========================================

// Helper to format currency in KSh
function formatCurrency(amount) {
    return 'KSh ' + amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Update real-time date and time display
function updateDateTime() {
    const dateBadge = document.getElementById('current-date-badge');
    if (!dateBadge) return;

    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false
    };
    const formattedDate = now.toLocaleDateString('en-KE', options);
    dateBadge.innerHTML = `<i data-lucide="clock" style="width: 16px; height:16px; display:inline-block; margin-right: 6px;"></i>${formattedDate}`;
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Start the date/time update interval
let dateTimeInterval = null;
function startDateTimeUpdater() {
    updateDateTime();
    if (dateTimeInterval) clearInterval(dateTimeInterval);
    dateTimeInterval = setInterval(updateDateTime, 1000);
}

// SVG image constants for uniforms and utensils
const UNIFORM_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 100 100"%3E%3Crect fill="%231a1a1a" width="100" height="100"/%3E%3Ctext x="50" y="60" text-anchor="middle" font-size="40"%3E👕%3C/text%3E%3C/svg%3E';
const UTENSIL_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 100 100"%3E%3Crect fill="%231a1a1a" width="100" height="100"/%3E%3Ctext x="50" y="60" text-anchor="middle" font-size="40"%3E🍳%3C/text%3E%3C/svg%3E';

// School list for uniform orders
const schools = [
    { id: 'school-001', name: 'Meru High School' },
    { id: 'school-002', name: 'Kaaga Girls High School' },
    { id: 'school-003', name: 'Kiengu Primary School' },
    { id: 'school-004', name: 'St. Teresa Primary School' },
    { id: 'school-005', name: 'Kanyakine Boys High School' },
    { id: 'school-006', name: 'Muthambi Girls High School' },
    { id: 'school-007', name: 'Gatimbi Primary School' },
    { id: 'school-008', name: 'Chogoria Girls High School' },
    { id: 'school-009', name: 'Kibirichia Boys High School' },
    { id: 'school-010', name: 'Ruiri Girls High School' },
    { id: 'school-other', name: 'Other (No School)' }
];

// Default inventory items (with real Kenyan products from Tekiria & curated Utensils)
const defaultInventory = [
    // ============ Baraka Uniforms Front (from Tekiria.co.ke)
    { id: 'unif-001', name: 'Blue and White Sports Jersey', front: 'uniforms', sku: 'UNIF-JRSY-BLU', quantity: 45, threshold: 10, retailPrice: 1200, unitCost: 600, images: ['img/uniform/shirts.avif'], sizes: ['S', 'M', 'L', 'XL'], colors: ['Blue/White', 'Red/White', 'Green/White'] },
    { id: 'unif-002', name: 'Designed P.E Kit', front: 'uniforms', sku: 'UNIF-PE-KIT', quantity: 50, threshold: 15, retailPrice: 850, unitCost: 425, images: ['img/uniform/shorts.webp'], sizes: ['S', 'M', 'L', 'XL'], colors: ['Blue', 'Red', 'Green', 'Yellow'] },
    { id: 'unif-003', name: 'Designed Tracksuit', front: 'uniforms', sku: 'UNIF-TRK-SUIT', quantity: 30, threshold: 8, retailPrice: 1450, unitCost: 725, images: ['img/uniform/tracksuit.jpg'], sizes: ['S', 'M', 'L', 'XL'], colors: ['Navy Blue', 'Black', 'Grey'] },
    { id: 'unif-004', name: 'Black School Shorts', front: 'uniforms', sku: 'UNIF-SHORT-BLK', quantity: 100, threshold: 20, retailPrice: 450, unitCost: 225, images: ['img/uniform/shorts.webp'], sizes: ['XS', 'S', 'M', 'L', 'XL'], colors: ['Black', 'Navy Blue', 'Grey'] },
    { id: 'unif-005', name: 'Navy Blue School Trousers', front: 'uniforms', sku: 'UNIF-TR-NVY', quantity: 80, threshold: 15, retailPrice: 650, unitCost: 325, images: ['img/uniform/trousers.webp'], sizes: ['XS', 'S', 'M', 'L', 'XL'], colors: ['Navy Blue', 'Black', 'Grey'] },
    { id: 'unif-006', name: 'Purple School Fleece Jacket', front: 'uniforms', sku: 'UNIF-FLCE-PUR', quantity: 35, threshold: 10, retailPrice: 1500, unitCost: 750, images: ['img/uniform/fleece.jpg'], sizes: ['S', 'M', 'L', 'XL'], colors: ['Purple', 'Navy Blue', 'Black'] },
    { id: 'unif-007', name: 'School Tie with Stripes', front: 'uniforms', sku: 'UNIF-TIE-STR', quantity: 120, threshold: 30, retailPrice: 150, unitCost: 75, images: ['img/uniform/tie.webp'], sizes: [], colors: ['Blue/White', 'Red/White', 'Green/White'] },
    { id: 'unif-008', name: 'School Socks', front: 'uniforms', sku: 'UNIF-SOCKS', quantity: 200, threshold: 50, retailPrice: 200, unitCost: 100, images: ['img/uniform/socks.webp'], sizes: ['Small', 'Medium', 'Large'], colors: ['White', 'Navy Blue', 'Black'] },
    { id: 'unif-009', name: 'White School Shirt', front: 'uniforms', sku: 'UNIF-SHIRT-WH', quantity: 150, threshold: 30, retailPrice: 500, unitCost: 250, images: ['img/uniform/shirts.avif'], sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], colors: ['White', 'Sky Blue', 'Light Pink'] },
    
    // ============ Baraka Utensils Front (curated Kenyan kitchen products)
    { id: 'uten-001', name: 'Jikokoa Classic Charcoal Stove', front: 'utensils', sku: 'UTEN-JIKOKOA', quantity: 25, threshold: 8, retailPrice: 8500, unitCost: 4200, images: ['img/utensils/jikokoa.jpg'], sizes: [], colors: [] },
    { id: 'uten-002', name: 'Stainless Steel Cookware Set (10pc)', front: 'utensils', sku: 'UTEN-COOK-10', quantity: 18, threshold: 5, retailPrice: 18000, unitCost: 8250, images: ['img/utensils/cookware set.jpeg'], sizes: [], colors: [] },
    { id: 'uten-003', name: 'Ceramic Dinnerware Set (16pc)', front: 'utensils', sku: 'UTEN-DINE-16', quantity: 22, threshold: 5, retailPrice: 12750, unitCost: 5700, images: ['img/utensils/ceramic dinnerware set.jpg'], sizes: [], colors: [] },
    { id: 'uten-004', name: 'Non-Stick Frying Pan (12-inch)', front: 'utensils', sku: 'UTEN-PAN-12', quantity: 25, threshold: 8, retailPrice: 5250, unitCost: 2250, images: ['img/utensils/pan.jpg'], sizes: [], colors: [] },
    { id: 'uten-005', name: 'Electric Kettle (1.7L)', front: 'utensils', sku: 'UTEN-KTL-17', quantity: 18, threshold: 6, retailPrice: 6000, unitCost: 2700, images: ['img/utensils/kettle.webp'], sizes: [], colors: [] },
    { id: 'uten-006', name: 'Chef\'s Knife Set (6pc)', front: 'utensils', sku: 'UTEN-KNFE-6', quantity: 15, threshold: 4, retailPrice: 9750, unitCost: 4200, images: ['img/utensils/cutlery set.webp'], sizes: [], colors: [] },
    { id: 'uten-007', name: 'Heavy Duty Blender', front: 'utensils', sku: 'UTEN-BLND-HD', quantity: 30, threshold: 6, retailPrice: 14250, unitCost: 6300, images: ['img/utensils/blender.jpg'], sizes: [], colors: [] },
    { id: 'uten-008', name: 'Stainless Steel Coffee Maker', front: 'utensils', sku: 'UTEN-CFMK', quantity: 20, threshold: 7, retailPrice: 7500, unitCost: 3750, images: ['img/utensils/kettle.webp'], sizes: [], colors: [] },
    { id: 'uten-009', name: 'Wooden Cutting Board (Set of 3)', front: 'utensils', sku: 'UTEN-CUT-BOARD', quantity: 28, threshold: 10, retailPrice: 3500, unitCost: 1750, images: ['img/utensils/cutting board.webp'], sizes: [], colors: [] }
];

// Default peak planner checklist
const defaultChecklist = [
    { id: 'todo-1', text: 'Pre-order surplus uniform fabrics for the January rush', front: 'uniforms', completed: true },
    { id: 'todo-2', text: 'Initiate bulk discount negotiation with shoe supplier', front: 'uniforms', completed: false },
    { id: 'todo-3', text: 'Set up temporary display racks in uniforms shop front', front: 'uniforms', completed: false },
    { id: 'todo-4', text: 'Secure premium kitchen gift crates for holiday packaging', front: 'utensils', completed: true },
    { id: 'todo-5', text: 'Launch social media campaign for Thanksgiving dinnerware sales', front: 'utensils', completed: false },
    { id: 'todo-6', text: 'Hire 2 temporary staff members for November-December logistics', front: 'shared', completed: false },
    { id: 'todo-7', text: 'Run physical audit of existing storage bins to clear shelf space', front: 'shared', completed: true }
];

const DATA_VERSION = 11; // Increment when inventory changes
// Initialize database (without demo stats)
function initializeDatabase() {
    const localData = localStorage.getItem('baraka_erp_state');
    let shouldReset = false;
    if (localData) {
        const existingState = JSON.parse(localData);
        if (!existingState.dataVersion || existingState.dataVersion < DATA_VERSION) {
            shouldReset = true;
            console.log('Updating to new data version...');
        } else {
            state = existingState;
            return;
        }
    }

    state.inventory = [...defaultInventory];
    state.peakPlanner.checklist = [...defaultChecklist];
    state.peakPlanner.uniformsMultiplier = 1.5;
    state.peakPlanner.utensilsMultiplier = 1.8;
    state.sales = [];
    state.expenses = [];
    state.attendance = [];
    state.notifications = [];

    saveToLocalStorage();
}

function saveToLocalStorage() {
    state.dataVersion = DATA_VERSION;
    localStorage.setItem('baraka_erp_state', JSON.stringify(state));
}

// ==========================================
// 2. AUTHENTICATION & ACCESS CONTROL
// ==========================================

const mockCredentials = {
    alice: { password: 'alice123', name: 'Alice', role: 'management' },
    uniforms: { password: 'uniforms123', name: 'Uniforms Front Desk', role: 'uniforms' },
    utensils: { password: 'utensils123', name: 'Utensils Shop Clerk', role: 'utensils' }
};

let selectedRoleType = '';

function selectRole(role) {
    selectedRoleType = role;
    
    // UI active buttons
    document.querySelectorAll('.role-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.${role}-btn`).classList.add('active');
    
    // Setup login form display
    const form = document.getElementById('login-form');
    form.style.display = 'flex';
    form.className = 'auth-form ' + role + '-login';
    
    // Hinters and values helper
    const hintSpan = document.getElementById('password-hint');
    hintSpan.innerText = `Hint: Use "${mockCredentials[role].password}"`;
    
    const pwInput = document.getElementById('password-input');
    pwInput.value = mockCredentials[role].password; // Prefill to simplify navigation
    pwInput.focus();
    
    // Change submit button coloring
    const submitBtn = document.getElementById('login-submit-btn');
    submitBtn.className = 'btn-primary ' + role + '-btn-submit';
}

function handleLogin(e) {
    e.preventDefault();
    const pwInput = document.getElementById('password-input').value;
    
    if (pwInput === mockCredentials[selectedRoleType].password) {
        currentUser = {
            id: selectedRoleType,
            name: mockCredentials[selectedRoleType].name,
            role: mockCredentials[selectedRoleType].role
        };
        
        sessionStorage.setItem('baraka_erp_user', JSON.stringify(currentUser));
        loadDashboard();
    } else {
        alert('Authentication failed. Incorrect passcode entered.');
    }
}

function handleLogout() {
    currentUser = null;
    sessionStorage.removeItem('baraka_erp_user');
    
    // Toggle screens
    document.getElementById('auth-page').style.display = 'flex';
    document.getElementById('system-dashboard').style.display = 'none';
}

function checkActiveSession() {
    // Only check session if we're on the ERP page (index.html)
    if (window.location.pathname.includes('store.html')) {
        return;
    }
    
    const session = sessionStorage.getItem('baraka_erp_user');
    if (session) {
        currentUser = JSON.parse(session);
        loadDashboard();
    } else if (document.getElementById('auth-page')) {
        // Default to showing auth selector
        selectRole('alice');
    }
}

// ==========================================
// 3. DASHBOARD RENDERING & STATE SWITCHING
// ==========================================

function loadDashboard() {
    // Check if we're on the ERP page
    if (!document.getElementById('auth-page')) return;
    
    // Start real-time date/time
    startDateTimeUpdater();
    
    // Hide auth page, display ERP dashboard grid
    document.getElementById('auth-page').style.display = 'none';
    document.getElementById('system-dashboard').style.display = 'flex';

    // Set user profile footer details
    document.getElementById('user-profile-name').innerText = currentUser.name;
    document.getElementById('user-profile-role').innerText = currentUser.role === 'management' ? 'Management (Alice)' : 'Staff Account';
    document.getElementById('user-profile-avatar').innerText = currentUser.name.charAt(0);
    
    // Style brand indicator icon
    const indicator = document.getElementById('brand-indicator');
    indicator.className = 'sidebar-brand-icon';
    if (currentUser.role === 'management') {
        indicator.classList.add('brand-alice');
        indicator.innerText = 'A';
    } else if (currentUser.role === 'uniforms') {
        indicator.classList.add('brand-uniforms');
        indicator.innerText = 'U';
    } else {
        indicator.classList.add('brand-utensils');
        indicator.innerText = 'K'; // Kitchen/Utensils
    }

    // Role-Based Navigation menu visibility
    const aliceNavs = document.querySelectorAll('.alice-link');
    const staffSalesNav = document.getElementById('nav-staff-sales');
    
    if (currentUser.role === 'management') {
        // Show Alice controls
        aliceNavs.forEach(nav => nav.style.display = 'flex');
        staffSalesNav.style.display = 'none'; // Alice logs sales via stock sheets or views logs
        
        // Show front filter in stock catalog
        document.getElementById('inventory-filter-front').style.display = 'block';
        
        // Welcome Header
        document.getElementById('page-welcome-title').innerText = 'Welcome Back, Alice';
        document.getElementById('page-subtitle').innerText = 'Here is the consolidated business overview for Baraka operations.';
        
        // Default tab for Alice
        switchTab('alice-dashboard');
    } else {
        // Hide Alice controls
        aliceNavs.forEach(nav => nav.style.display = 'none');
        staffSalesNav.style.display = 'flex';
        
        // Hide front filter in stock catalog (forced to their respective front)
        document.getElementById('inventory-filter-front').style.display = 'none';
        
        // Welcome Header
        document.getElementById('page-welcome-title').innerText = currentUser.role === 'uniforms' ? 'Baraka Uniforms Dashboard' : 'Baraka Utensils Dashboard';
        document.getElementById('page-subtitle').innerText = `Sales logs, revenue metrics, and inventory ledger for the ${currentUser.role} division.`;
        
        // Default tab for staff is inventory catalogue
        switchTab('shared-inventory');
    }

    // Show/hide staff clock controls
    const staffClockControls = document.getElementById('staff-clock-controls');
    if (currentUser.role !== 'management') {
        staffClockControls.style.display = 'flex';
        // Check if user is currently clocked in
        const lastAttendance = state.attendance.filter(a => a.userId === currentUser.id).slice(-1)[0];
        if (lastAttendance && !lastAttendance.clockOutTime) {
            document.getElementById('btn-clock-in').style.display = 'none';
            document.getElementById('btn-clock-out').style.display = 'flex';
        } else {
            document.getElementById('btn-clock-in').style.display = 'flex';
            document.getElementById('btn-clock-out').style.display = 'none';
        }
    } else {
        staffClockControls.style.display = 'none';
    }
    
    // Dynamic initializations
    updateStockAlertsBanner();
    renderInventoryTable();
    
    if (currentUser.role === 'management') {
        updateChartsAndKPIs();
        renderExpenseLedgerTable();
        generateProfitLossStatement();
        renderPeakPlannerChecklist();
        renderNotifications();
    } else {
        // Initialize staff sales dropdown and daily logs
        populateSalesProductDropdown();
        renderStaffSalesLogs();
    }

    // Initialize lucide icons rendering
    lucide.createIcons();
}

function switchTab(tabId) {
    currentTab = tabId;
    
    // Update active nav links styling
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.remove('active');
    });
    
    const activeLink = document.getElementById(`nav-${tabId}`);
    if (activeLink) activeLink.classList.add('active');

    // Update visibility of panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    
    document.getElementById(`tab-${tabId}`).classList.add('active');

    // Re-render context depending on current tab
    if (tabId === 'shared-inventory') {
        renderInventoryTable();
    } else if (tabId === 'staff-sales') {
        populateSalesProductDropdown();
        renderStaffSalesLogs();
    } else if (tabId === 'alice-dashboard') {
        updateChartsAndKPIs();
    } else if (tabId === 'alice-expenses') {
        renderExpenseLedgerTable();
    } else if (tabId === 'alice-pl') {
        generateProfitLossStatement();
    } else if (tabId === 'alice-peak') {
        renderPeakPlannerChecklist();
    }
}

// ==========================================
// 4. STOCK & ALERTS SERVICE
// ==========================================

// Calculate threshold with dynamic multipliers if Alice sets seasonal buffers
function getDynamicThreshold(item) {
    if (item.front === 'uniforms') {
        return Math.round(item.threshold * state.peakPlanner.uniformsMultiplier);
    } else {
        return Math.round(item.threshold * state.peakPlanner.utensilsMultiplier);
    }
}

function updateStockAlertsBanner() {
    const lowStockItems = state.inventory.filter(item => {
        // If logged in as staff, filter to their department's alert, else Alice gets all
        if (currentUser.role !== 'management' && item.front !== currentUser.role) {
            return false;
        }
        const currentThreshold = getDynamicThreshold(item);
        return item.quantity <= currentThreshold;
    });

    const banner = document.getElementById('low-stock-banner');
    const bannerList = document.getElementById('low-stock-banner-list');
    
    if (lowStockItems.length > 0) {
        banner.style.display = 'flex';
        bannerList.innerHTML = '';
        lowStockItems.forEach(item => {
            const currentThreshold = getDynamicThreshold(item);
            const statusText = item.quantity === 0 ? 'OUT OF STOCK' : `CRITICAL (${item.quantity} left)`;
            const deptText = currentUser.role === 'management' ? `[${item.front.toUpperCase()}] ` : '';
            const li = document.createElement('li');
            li.innerHTML = `<strong>${deptText}${item.name}</strong> is currently ${statusText}. Standard restock limit is ${item.threshold} items (Peak Target: ${currentThreshold}).`;
            bannerList.appendChild(li);
        });
    } else {
        banner.style.display = 'none';
    }

    // Set badge counts in Alice dashboard widgets
    const badge = document.getElementById('low-stock-count-badge');
    const alertListCenter = document.getElementById('stock-alerts-list-center');
    
    if (badge) {
        badge.innerText = `${lowStockItems.length} Warnings`;
        if (lowStockItems.length > 0) {
            badge.className = 'badge badge-danger';
        } else {
            badge.className = 'badge badge-success';
            badge.innerText = 'Fully Stocked';
        }
    }

    if (alertListCenter) {
        alertListCenter.innerHTML = '';
        if (lowStockItems.length === 0) {
            alertListCenter.innerHTML = '<div style="color: var(--text-secondary); text-align: center; padding: 20px;">All stock levels are optimal. No alerts active.</div>';
        } else {
            lowStockItems.forEach(item => {
                const isOutOfStock = item.quantity === 0;
                const dynamicLimit = getDynamicThreshold(item);
                const card = document.createElement('div');
                card.className = `checklist-item ${isOutOfStock ? 'stock-alert-card' : 'stock-alert-card warning-level'}`;
                card.innerHTML = `
                    <div style="flex-grow: 1;">
                        <div style="font-weight:600; font-size: 0.9rem;">${item.name}</div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary);">SKU: ${item.sku} | Dept: ${item.front.toUpperCase()}</div>
                    </div>
                    <div style="text-align: right;">
                        <span class="badge ${isOutOfStock ? 'badge-danger' : 'badge-warning'}">${item.quantity} / ${dynamicLimit} units</span>
                        <div style="font-size: 0.7rem; color: var(--text-muted); margin-top:4px;">Target: ${dynamicLimit}</div>
                    </div>
                `;
                alertListCenter.appendChild(card);
            });
        }
    }
}

// ==========================================
// 5. STOCK CATALOGUE ACTIONS (CRUD)
// ==========================================

function renderInventoryTable() {
    const searchVal = document.getElementById('inventory-search').value.toLowerCase();
    const filterStatus = document.getElementById('inventory-filter-status').value;
    const filterFront = document.getElementById('inventory-filter-front').value;
    
    const tbody = document.getElementById('inventory-table-body');
    tbody.innerHTML = '';
    
    // Set style theme for Add Button based on role
    const addButton = document.getElementById('btn-add-inventory');
    if (currentUser.role === 'management') {
        addButton.className = 'btn-primary alice-btn-submit';
    } else if (currentUser.role === 'uniforms') {
        addButton.className = 'btn-primary uniforms-btn-submit';
    } else {
        addButton.className = 'btn-primary utensils-btn-submit';
    }

    // Filter stock inventory items based on authentication limits
    let items = state.inventory;
    
    if (currentUser.role !== 'management') {
        // Staff can only view their own items
        items = items.filter(x => x.front === currentUser.role);
    } else {
        // Alice can filter by fronts using dropdown controls
        if (filterFront !== 'all') {
            items = items.filter(x => x.front === filterFront);
        }
    }

    // Status filter constraints
    items = items.filter(item => {
        const threshold = getDynamicThreshold(item);
        const isLowStock = item.quantity <= threshold;
        const isOutOfStock = item.quantity === 0;

        if (filterStatus === 'low-stock') return isLowStock && !isOutOfStock;
        if (filterStatus === 'out-of-stock') return isOutOfStock;
        if (filterStatus === 'in-stock') return !isLowStock;
        return true; // "all"
    });

    // Search query constraint
    if (searchVal) {
        items = items.filter(x => x.name.toLowerCase().includes(searchVal) || x.sku.toLowerCase().includes(searchVal));
    }

    if (items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--text-secondary); padding: 30px;">No items found matching the filter criteria.</td></tr>`;
        return;
    }

    // Write table rows
    items.forEach(item => {
        const dynamicLimit = getDynamicThreshold(item);
        let badgeHTML = '';
        if (item.quantity === 0) {
            badgeHTML = `<span class="badge badge-danger">Out of Stock</span>`;
        } else if (item.quantity <= dynamicLimit) {
            badgeHTML = `<span class="badge badge-warning">Low Stock Alert</span>`;
        } else {
            badgeHTML = `<span class="badge badge-success">Optimal</span>`;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><code>${item.sku}</code></td>
            <td><strong>${item.name}</strong></td>
            <td><span class="season-badge ${item.front === 'utensils' ? 'utensils' : ''}">${item.front.toUpperCase()}</span></td>
            <td><strong>${item.quantity} pcs</strong></td>
            <td>${dynamicLimit} pcs <span style="font-size:0.75rem; color:var(--text-muted);">(${item.threshold} base)</span></td>
            <td>${formatCurrency(item.retailPrice)}</td>
            <td>${formatCurrency(item.unitCost)}</td>
            <td>${badgeHTML}</td>
            <td style="text-align: right; white-space: nowrap;">
                <button class="btn-secondary" style="padding: 6px 10px; font-size: 0.8rem; display: inline-flex;" onclick="openInventoryModal('${item.id}')">
                    <i data-lucide="edit-3" style="width: 14px; height: 14px; margin-right: 4px;"></i> Edit
                </button>
                <button class="btn-secondary" style="padding: 6px 10px; font-size: 0.8rem; display: inline-flex; border-color: rgba(239,68,68,0.2); color: var(--danger); margin-left: 6px;" onclick="handleDeleteInventory('${item.id}')">
                    <i data-lucide="trash-2" style="width: 14px; height: 14px; margin-right: 4px;"></i> Delete
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    lucide.createIcons();
}

function openInventoryModal(itemId = null) {
    const modal = document.getElementById('inventory-modal');
    const form = document.getElementById('inventory-modal-form');
    const modalTitle = document.getElementById('inventory-modal-title');
    const saveButton = document.getElementById('btn-save-inventory');
    const departmentGroup = document.getElementById('inv-front');

    // Apply color schemes to Modal Save Button
    if (currentUser.role === 'management') {
        saveButton.className = 'btn-primary alice-btn-submit';
        departmentGroup.disabled = false;
    } else {
        departmentGroup.value = currentUser.role;
        departmentGroup.disabled = true; // Lock staff to their own department
        saveButton.className = `btn-primary ${currentUser.role}-btn-submit`;
    }

    form.reset();

    if (itemId) {
        // Edit Mode
        const item = state.inventory.find(x => x.id === itemId);
        if (!item) return;
        
        modalTitle.innerText = 'Edit Inventory Item';
        document.getElementById('inventory-modal-id').value = item.id;
        document.getElementById('inv-name').value = item.name;
        document.getElementById('inv-front').value = item.front;
        document.getElementById('inv-sku').value = item.sku;
        document.getElementById('inv-qty').value = item.quantity;
        document.getElementById('inv-threshold').value = item.threshold;
        document.getElementById('inv-retail').value = item.retailPrice;
        document.getElementById('inv-cost').value = item.unitCost;
    } else {
        // Add Mode
        modalTitle.innerText = 'Add New Inventory Item';
        document.getElementById('inventory-modal-id').value = '';
        if (currentUser.role !== 'management') {
            document.getElementById('inv-front').value = currentUser.role;
        }
    }

    modal.style.display = 'flex';
}

function closeInventoryModal() {
    document.getElementById('inventory-modal').style.display = 'none';
}

let currentProductImages = []; // For multi-image upload

function setupImageUploadListener() {
    const imageInput = document.getElementById('inv-image');
    if (imageInput) {
        imageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    currentProductImageData = event.target.result;
                    const preview = document.getElementById('inv-image-preview');
                    const img = document.getElementById('inv-image-preview-img');
                    img.src = currentProductImageData;
                    preview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

function setupMultiImageUploadListener() {
    const imageInput = document.getElementById('inv-images');
    const previewContainer = document.getElementById('inv-images-preview');
    if (!imageInput || !previewContainer) return;

    imageInput.addEventListener('change', function(e) {
        const files = e.target.files;
        if (!files.length) return;

        // Process each file
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = function(event) {
                currentProductImages.push(event.target.result);
                renderMultiImagePreview();
            };
            reader.readAsDataURL(file);
        });

        // Clear input to allow re-selecting same files
        imageInput.value = '';
    });
}

function renderMultiImagePreview() {
    const previewContainer = document.getElementById('inv-images-preview');
    if (!previewContainer) return;

    previewContainer.innerHTML = currentProductImages.map((imgData, index) => `
        <div style="position: relative; display: inline-block;">
            <img src="${imgData}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">
            <button type="button" onclick="removeProductImage(${index})" style="position: absolute; top: -8px; right: -8px; width: 24px; height: 24px; border-radius: 50%; background: var(--danger); border: none; color: white; cursor: pointer; font-size: 12px; display: flex; align-items: center; justify-content: center;">×</button>
        </div>
    `).join('');
}

function removeProductImage(index) {
    currentProductImages.splice(index, 1);
    renderMultiImagePreview();
}

function handleSaveInventory(e) {
    e.preventDefault();

    const id = document.getElementById('inventory-modal-id').value;
    const name = document.getElementById('inv-name').value;
    const front = document.getElementById('inv-front').value;
    const sku = document.getElementById('inv-sku').value;
    const quantity = parseInt(document.getElementById('inv-qty').value);
    const threshold = parseInt(document.getElementById('inv-threshold').value);
    const retailPrice = parseFloat(document.getElementById('inv-retail').value);
    const unitCost = parseFloat(document.getElementById('inv-cost').value);

    if (id) {
        // Update existing item
        const item = state.inventory.find(x => x.id === id);
        if (item) {
            item.name = name;
            item.front = front;
            item.sku = sku;
            item.quantity = quantity;
            item.threshold = threshold;
            item.retailPrice = retailPrice;
            item.unitCost = unitCost;
            // Only update images if new ones were uploaded
            if (currentProductImages.length > 0) {
                item.images = [...currentProductImages];
            }
            // Also support legacy `image` field for backwards compatibility
            if (item.image) {
                if (!item.images || item.images.length === 0) {
                    item.images = [item.image];
                }
                delete item.image;
            }
        }
    } else {
        // Create new item
        const newItem = {
            id: `ITEM-${Date.now()}`,
            name,
            front,
            sku,
            quantity,
            threshold,
            retailPrice,
            unitCost,
            images: [...currentProductImages],
            sizes: [],
            colors: []
        };
        state.inventory.push(newItem);
    }

    saveToLocalStorage();
    closeInventoryModal();
    renderInventoryTable();
    updateStockAlertsBanner();
    
    if (currentUser.role === 'management') {
        updateChartsAndKPIs();
        generateProfitLossStatement();
    }
    
    // Reset currentProductImages
    currentProductImages = [];
}

function handleDeleteInventory(itemId) {
    if (confirm('Are you sure you want to remove this item from the catalog? This will not erase past sales logs but deletes active stock tracking.')) {
        state.inventory = state.inventory.filter(x => x.id !== itemId);
        saveToLocalStorage();
        renderInventoryTable();
        updateStockAlertsBanner();
        
        if (currentUser.role === 'management') {
            updateChartsAndKPIs();
            generateProfitLossStatement();
        }
    }
}

// Update openInventoryModal to handle images
const originalOpenInventoryModal = openInventoryModal;
window.openInventoryModal = function(itemId = null) {
    currentProductImages = [];
    const previewContainer = document.getElementById('inv-images-preview');
    const imageInput = document.getElementById('inv-images');
    
    if (previewContainer) previewContainer.innerHTML = '';
    if (imageInput) imageInput.value = '';
    
    // Call original function
    originalOpenInventoryModal(itemId);
    
    // If editing, load existing images
    if (itemId) {
        const item = state.inventory.find(x => x.id === itemId);
        if (item) {
            // Load from `images` array, or from legacy `image`
            if (item.images && item.images.length > 0) {
                currentProductImages = [...item.images];
            } else if (item.image) {
                currentProductImages = [item.image];
            }
            renderMultiImagePreview();
        }
    }
};

// ==========================================
// 6. RECORD SALES (STAFF INTERFACE)
// ==========================================

function populateSalesProductDropdown() {
    const select = document.getElementById('sale-product-select');
    select.innerHTML = '<option value="">-- Choose Stock Item --</option>';
    
    // Filter items based on current staff role (Uniforms or Utensils)
    const items = state.inventory.filter(x => x.front === currentUser.role);
    
    items.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.innerText = `${item.name} (${item.sku})`;
        select.appendChild(option);
    });

    updateSalePriceDetails();
}

function updateSalePriceDetails() {
    const select = document.getElementById('sale-product-select');
    const qtyInput = document.getElementById('sale-quantity');
    const discountInput = document.getElementById('sale-discount');
    
    const availStockSpan = document.getElementById('sale-avail-stock');
    const unitPriceSpan = document.getElementById('sale-unit-retail');
    const totalPriceSpan = document.getElementById('sale-calculated-total');

    // Theme style setup
    const themeColor = currentUser.role === 'uniforms' ? 'var(--accent-uniforms)' : 'var(--accent-utensils)';
    totalPriceSpan.style.color = themeColor;
    
    const submitBtn = document.getElementById('btn-submit-sale');
    submitBtn.className = `btn-primary ${currentUser.role}-btn-submit`;

    const itemId = select.value;
    if (!itemId) {
        availStockSpan.innerText = '0 units';
        availStockSpan.className = 'badge badge-success';
        unitPriceSpan.innerText = formatCurrency(0);
        totalPriceSpan.innerText = formatCurrency(0);
        return;
    }

    const item = state.inventory.find(x => x.id === itemId);
    if (!item) return;

    const dynamicLimit = getDynamicThreshold(item);
    availStockSpan.innerText = `${item.quantity} units`;
    if (item.quantity === 0) {
        availStockSpan.className = 'badge badge-danger';
    } else if (item.quantity <= dynamicLimit) {
        availStockSpan.className = 'badge badge-warning';
    } else {
        availStockSpan.className = 'badge badge-success';
    }

    unitPriceSpan.innerText = formatCurrency(item.retailPrice);

    const qty = parseInt(qtyInput.value) || 0;
    const discount = parseFloat(discountInput.value) || 0;
    const orderTotal = Math.max(0, (item.retailPrice * qty) - discount);
    
    totalPriceSpan.innerText = formatCurrency(orderTotal);
}

function handleRecordSale(e) {
    e.preventDefault();
    
    const select = document.getElementById('sale-product-select');
    const qtyInput = document.getElementById('sale-quantity');
    const discountInput = document.getElementById('sale-discount');
    
    const itemId = select.value;
    const qty = parseInt(qtyInput.value);
    const discount = parseFloat(discountInput.value) || 0;

    if (!itemId) {
        alert('Please select a product from the list.');
        return;
    }

    const item = state.inventory.find(x => x.id === itemId);
    if (!item) return;

    if (qty > item.quantity) {
        alert(`Insufficient stock! You are attempting to sell ${qty} units, but only ${item.quantity} units are in stock.`);
        return;
    }

    // Deduct stock levels
    item.quantity -= qty;

    // Record sales receipt
    const orderTotal = Math.max(0, (item.retailPrice * qty) - discount);
    const newSale = {
        id: `REC-${Date.now()}`,
        productId: item.id,
        productName: item.name,
        front: currentUser.role,
        quantity: qty,
        retailPrice: item.retailPrice,
        unitCost: item.unitCost,
        discount: discount,
        totalPrice: orderTotal,
        date: new Date().toISOString()
    };

    state.sales.push(newSale);
    saveToLocalStorage();

    // Reset Form & Update View
    select.value = '';
    qtyInput.value = '1';
    discountInput.value = '0';
    
    updateSalePriceDetails();
    updateStockAlertsBanner();
    renderStaffSalesLogs();

    alert(`Receipt ${newSale.id} created successfully. Total: ${formatCurrency(orderTotal)}`);
}

function renderStaffSalesLogs() {
    const tbody = document.getElementById('staff-sales-table-body');
    const revBadge = document.getElementById('staff-daily-revenue-badge');
    
    tbody.innerHTML = '';
    
    // Filter transactions occurring TODAY for current staff shop front
    const startOfToday = new Date();
    startOfToday.setHours(0,0,0,0);
    
    const dailySales = state.sales.filter(sale => {
        return sale.front === currentUser.role && new Date(sale.date) >= startOfToday;
    });

    // Sort showing newest first
    dailySales.sort((a,b) => new Date(b.date) - new Date(a.date));

    let dailyRevenueTotal = 0;
    
    if (dailySales.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-secondary); padding: 20px;">No sales recorded yet today.</td></tr>`;
        revBadge.innerText = `Daily Revenue: ${formatCurrency(0)}`;
        return;
    }

    dailySales.forEach(sale => {
        dailyRevenueTotal += sale.totalPrice;
        
        // Calculate gross profit for this sale
        const baseCost = sale.unitCost * sale.quantity;
        const grossProfit = sale.totalPrice - baseCost;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><code>${sale.id}</code></td>
            <td>${new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
            <td><strong>${sale.productName}</strong></td>
            <td>${sale.quantity} pcs</td>
            <td>${formatCurrency(sale.discount)}</td>
            <td><strong>${formatCurrency(sale.totalPrice)}</strong></td>
            <td class="${grossProfit >= 0 ? 'positive-profit' : 'negative-profit'}">${formatCurrency(grossProfit)}</td>
        `;
        tbody.appendChild(tr);
    });

    revBadge.innerText = `Daily Revenue: ${formatCurrency(dailyRevenueTotal)}`;
}

// ==========================================
// 7. EXPENSE LEDGER (ALICE INTERFACE)
// ==========================================

function handleRecordExpense(e) {
    e.preventDefault();
    
    const title = document.getElementById('expense-title').value;
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const date = document.getElementById('expense-date').value;
    const category = document.getElementById('expense-category').value;
    const front = document.getElementById('expense-front').value;

    const newExpense = {
        id: `EXP-${Date.now()}`,
        title,
        amount,
        date,
        category,
        front
    };

    state.expenses.push(newExpense);
    saveToLocalStorage();

    // Reset Form
    document.getElementById('record-expense-form').reset();
    document.getElementById('expense-date').value = new Date().toISOString().split('T')[0];

    renderExpenseLedgerTable();
    updateChartsAndKPIs();
    generateProfitLossStatement();

    alert(`Expense of ${formatCurrency(amount)} added to ${front.toUpperCase()} ledger.`);
}

function renderExpenseLedgerTable() {
    const filterFront = document.getElementById('expense-filter-front').value;
    const tbody = document.getElementById('expense-table-body');
    
    tbody.innerHTML = '';
    
    // Sort expenses newest first
    let expenses = [...state.expenses];
    expenses.sort((a,b) => new Date(b.date) - new Date(a.date));

    if (filterFront !== 'all') {
        expenses = expenses.filter(x => x.front === filterFront);
    }

    if (expenses.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-secondary); padding: 20px;">No expenses recorded.</td></tr>`;
        return;
    }

    expenses.forEach(exp => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${new Date(exp.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</td>
            <td><strong>${exp.title}</strong></td>
            <td><span class="season-badge ${exp.front === 'utensils' ? 'utensils' : exp.front === 'shared' ? 'alice' : ''}">${exp.front.toUpperCase()}</span></td>
            <td><code>${exp.category}</code></td>
            <td style="text-align: right; font-weight:600; color: #fca5a5;">-${formatCurrency(exp.amount)}</td>
            <td style="text-align: right;">
                <button class="btn-secondary" style="padding: 4px 8px; font-size: 0.75rem; color: var(--danger); border-color: rgba(239,68,68,0.15);" onclick="handleDeleteExpense('${exp.id}')">
                    Delete
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function handleDeleteExpense(expId) {
    if (confirm('Delete this expense entry? This will modify the financial analysis dashboards.')) {
        state.expenses = state.expenses.filter(x => x.id !== expId);
        saveToLocalStorage();
        renderExpenseLedgerTable();
        updateChartsAndKPIs();
        generateProfitLossStatement();
    }
}

// ==========================================
// 8. CONSOLIDATED PROFIT & LOSS GENERATOR
// ==========================================

function applyPLPreset() {
    const preset = document.getElementById('pl-preset-filter').value;
    const dateRow = document.getElementById('pl-custom-dates');
    
    if (preset === 'custom') {
        dateRow.style.display = 'flex';
        return;
    } else {
        dateRow.style.display = 'none';
    }

    generateProfitLossStatement();
}

function generateProfitLossStatement() {
    const preset = document.getElementById('pl-preset-filter').value;
    let startDate, endDate;
    
    const today = new Date('2026-06-10T12:00:00');

    if (preset === 'this-month') {
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else if (preset === 'last-month') {
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
    } else if (preset === 'ytd') {
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = today;
    } else {
        // Custom
        startDate = new Date(document.getElementById('pl-start-date').value || '2025-01-01');
        endDate = new Date(document.getElementById('pl-end-date').value || '2026-12-31');
    }

    // Format display range
    const formatOpts = { month: 'long', day: 'numeric', year: 'numeric' };
    const dateRangeStr = `${startDate.toLocaleDateString([], formatOpts)} to ${endDate.toLocaleDateString([], formatOpts)}`;

    // Set timestamps to include full boundary days
    const startTimestamp = startDate.setHours(0,0,0,0);
    const endTimestamp = endDate.setHours(23,59,59,999);

    // Calculate aggregated sales
    const filteredSales = state.sales.filter(sale => {
        const time = new Date(sale.date).getTime();
        return time >= startTimestamp && time <= endTimestamp;
    });

    // Calculate aggregated expenses
    const filteredExpenses = state.expenses.filter(exp => {
        const time = new Date(exp.date).getTime();
        return time >= startTimestamp && time <= endTimestamp;
    });

    // 1. Revenue accounts
    let uniformsRevenue = 0;
    let utensilsRevenue = 0;
    
    filteredSales.forEach(s => {
        if (s.front === 'uniforms') uniformsRevenue += s.totalPrice;
        else utensilsRevenue += s.totalPrice;
    });
    
    const totalRevenue = uniformsRevenue + utensilsRevenue;

    // 2. Cost of Goods Sold (COGS)
    // Note: COGS is computed based on cost of items sold, preventing discrepancy with wholesale purchases
    let uniformsCOGS = 0;
    let utensilsCOGS = 0;
    
    filteredSales.forEach(s => {
        const cost = s.unitCost * s.quantity;
        if (s.front === 'uniforms') uniformsCOGS += cost;
        else utensilsCOGS += cost;
    });
    
    const totalCOGS = uniformsCOGS + utensilsCOGS;
    const grossProfit = totalRevenue - totalCOGS;

    // 3. Operating Expenses (excluding any direct COGS restock logs if categorized as Cost of Goods Sold)
    const expenseCategories = {
        'Rent': 0,
        'Utilities': 0,
        'Wages': 0,
        'Marketing': 0,
        'Logistics': 0,
        'Other': 0
    };

    filteredExpenses.forEach(exp => {
        // Don't double count if logged as Cost of Goods Sold under custom expenses (since COGS is auto-derived from items sold)
        if (exp.category !== 'Cost of Goods Sold' && expenseCategories.hasOwnProperty(exp.category)) {
            expenseCategories[exp.category] += exp.amount;
        } else if (exp.category !== 'Cost of Goods Sold') {
            expenseCategories['Other'] += exp.amount;
        }
    });

    let totalOpExpenses = 0;
    for (const cat in expenseCategories) {
        totalOpExpenses += expenseCategories[cat];
    }

    const netProfit = grossProfit - totalOpExpenses;
    const netProfitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Render P&L content
    const container = document.getElementById('pl-statement-content');
    
    container.innerHTML = `
        <div style="text-align: center; margin-bottom: 24px; color: var(--text-secondary); font-size: 0.85rem;">
            Reporting Period: <strong>${dateRangeStr}</strong>
        </div>

        <div class="pl-row header">
            <span>REVENUE</span>
            <span></span>
        </div>
        <div class="pl-row indent">
            <span>Baraka Uniforms Sales Revenue</span>
            <span>${formatCurrency(uniformsRevenue)}</span>
        </div>
        <div class="pl-row indent">
            <span>Baraka Utensils Sales Revenue</span>
            <span>${formatCurrency(utensilsRevenue)}</span>
        </div>
        <div class="pl-row subtotal">
            <span>Total Revenue</span>
            <span>${formatCurrency(totalRevenue)}</span>
        </div>

        <div class="pl-row header" style="margin-top: 12px;">
            <span>COST OF GOODS SOLD (COGS)</span>
            <span></span>
        </div>
        <div class="pl-row indent">
            <span>Uniforms Cost of Goods</span>
            <span>-${formatCurrency(uniformsCOGS)}</span>
        </div>
        <div class="pl-row indent">
            <span>Utensils Cost of Goods</span>
            <span>-${formatCurrency(utensilsCOGS)}</span>
        </div>
        <div class="pl-row subtotal">
            <span>Total Cost of Goods Sold</span>
            <span>-${formatCurrency(totalCOGS)}</span>
        </div>

        <div class="pl-row total" style="margin-top: 12px; font-size: 1.15rem; border-top: 1px solid #fff; border-bottom: 1px solid #fff;">
            <span>GROSS PROFIT</span>
            <span>${formatCurrency(grossProfit)}</span>
        </div>

        <div class="pl-row header">
            <span>OPERATING EXPENSES</span>
            <span></span>
        </div>
        <div class="pl-row indent">
            <span>Rent & Office Space</span>
            <span>-${formatCurrency(expenseCategories['Rent'])}</span>
        </div>
        <div class="pl-row indent">
            <span>Utilities & Communications</span>
            <span>-${formatCurrency(expenseCategories['Utilities'])}</span>
        </div>
        <div class="pl-row indent">
            <span>Wages & Salaries</span>
            <span>-${formatCurrency(expenseCategories['Wages'])}</span>
        </div>
        <div class="pl-row indent">
            <span>Marketing & Publicity</span>
            <span>-${formatCurrency(expenseCategories['Marketing'])}</span>
        </div>
        <div class="pl-row indent">
            <span>Logistics & Freight delivery</span>
            <span>-${formatCurrency(expenseCategories['Logistics'])}</span>
        </div>
        <div class="pl-row indent">
            <span>Other Miscellaneous Spendings</span>
            <span>-${formatCurrency(expenseCategories['Other'])}</span>
        </div>
        <div class="pl-row subtotal">
            <span>Total Operating Expenses</span>
            <span>-${formatCurrency(totalOpExpenses)}</span>
        </div>

        <div class="pl-row total">
            <span>NET PROFIT / (LOSS)</span>
            <span class="${netProfit >= 0 ? 'positive-profit' : 'negative-profit'}">${formatCurrency(netProfit)}</span>
        </div>
        <div class="flex-row-center" style="margin-top: 8px; font-size: 0.9rem; color: var(--text-secondary); padding: 0 4px;">
            <span>Calculated Profit Margin:</span>
            <strong class="${netProfit >= 0 ? 'positive-profit' : 'negative-profit'}">${netProfitMargin.toFixed(1)}%</strong>
        </div>
    `;
}

// ==========================================
// 9. DYNAMIC CHARTS & FINANCIAL VARIANCES
// ==========================================

function updateChartsAndKPIs() {
    const variance = document.getElementById('variance-selector').value;
    
    // Base KPIs bounds: default is Year-To-Date (2026-01-01 to 2026-06-10)
    const today = new Date('2026-06-10T12:00:00');
    const startOfYear = new Date('2026-01-01T00:00:00');
    const endOfToday = new Date('2026-06-10T23:59:59');

    // Aggregate YTD totals for cards
    const ytdSales = state.sales.filter(s => new Date(s.date) >= startOfYear && new Date(s.date) <= endOfToday);
    const ytdExpenses = state.expenses.filter(e => new Date(e.date) >= startOfYear && new Date(e.date) <= endOfToday);

    let totalRevenue = 0;
    let totalCOGS = 0;
    ytdSales.forEach(s => {
        totalRevenue += s.totalPrice;
        totalCOGS += s.unitCost * s.quantity;
    });

    let totalOpExpenses = 0;
    ytdExpenses.forEach(e => {
        if (e.category !== 'Cost of Goods Sold') {
            totalOpExpenses += e.amount;
        }
    });

    // P&L Net profit YTD
    const consolidatedExpenses = totalCOGS + totalOpExpenses;
    const netProfit = totalRevenue - consolidatedExpenses;
    const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Set elements values
    document.getElementById('kpi-total-revenue').innerText = formatCurrency(totalRevenue);
    document.getElementById('kpi-total-expenses').innerText = formatCurrency(consolidatedExpenses);
    
    const profitEl = document.getElementById('kpi-net-profit');
    profitEl.innerText = formatCurrency(netProfit);
    profitEl.className = netProfit >= 0 ? 'positive-profit' : 'negative-profit';

    document.getElementById('kpi-profit-margin').innerText = `${margin.toFixed(1)}%`;

    // Process Chart Datasets based on variances
    let labels = [];
    let revenueData = [];
    let expensesData = [];

    let uniformsShare = 0;
    let utensilsShare = 0;

    if (variance === 'daily') {
        // Last 7 days daily aggregations
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const labelStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
            labels.push(labelStr);

            // Fetch metrics
            const dayStart = new Date(date).setHours(0,0,0,0);
            const dayEnd = new Date(date).setHours(23,59,59,999);

            const daySales = state.sales.filter(s => {
                const t = new Date(s.date).getTime();
                return t >= dayStart && t <= dayEnd;
            });
            const dayExpenses = state.expenses.filter(e => {
                const t = new Date(e.date).getTime();
                return t >= dayStart && t <= dayEnd;
            });

            let rev = 0;
            let cogs = 0;
            daySales.forEach(s => {
                rev += s.totalPrice;
                cogs += s.unitCost * s.quantity;
                
                // Track share
                if (s.front === 'uniforms') uniformsShare += s.totalPrice;
                else utensilsShare += s.totalPrice;
            });

            let opExp = 0;
            dayExpenses.forEach(e => {
                if (e.category !== 'Cost of Goods Sold') opExp += e.amount;
            });

            revenueData.push(rev);
            expensesData.push(cogs + opExp);
        }
    } else if (variance === 'weekly') {
        // Last 12 weeks
        for (let i = 11; i >= 0; i--) {
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - (i * 7) - today.getDay()); // Sunday bound
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);

            const labelStr = `Wk -${i}`;
            labels.push(labelStr);

            const weekStart = startOfWeek.setHours(0,0,0,0);
            const weekEnd = endOfWeek.setHours(23,59,59,999);

            const wkSales = state.sales.filter(s => {
                const t = new Date(s.date).getTime();
                return t >= weekStart && t <= weekEnd;
            });
            const wkExpenses = state.expenses.filter(e => {
                const t = new Date(e.date).getTime();
                return t >= weekStart && t <= weekEnd;
            });

            let rev = 0;
            let cogs = 0;
            wkSales.forEach(s => {
                rev += s.totalPrice;
                cogs += s.unitCost * s.quantity;
                
                // Track share
                if (s.front === 'uniforms') uniformsShare += s.totalPrice;
                else utensilsShare += s.totalPrice;
            });

            let opExp = 0;
            wkExpenses.forEach(e => {
                if (e.category !== 'Cost of Goods Sold') opExp += e.amount;
            });

            revenueData.push(rev);
            expensesData.push(cogs + opExp);
        }
    } else if (variance === 'monthly') {
        // Last 12 Months
        for (let i = 11; i >= 0; i--) {
            const date = new Date(today);
            date.setMonth(today.getMonth() - i);
            const labelStr = date.toLocaleDateString([], { month: 'short', year: '2-digit' });
            labels.push(labelStr);

            const mStart = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
            const mEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999).getTime();

            const mSales = state.sales.filter(s => {
                const t = new Date(s.date).getTime();
                return t >= mStart && t <= mEnd;
            });
            const mExpenses = state.expenses.filter(e => {
                const t = new Date(e.date).getTime();
                return t >= mStart && t <= mEnd;
            });

            let rev = 0;
            let cogs = 0;
            mSales.forEach(s => {
                rev += s.totalPrice;
                cogs += s.unitCost * s.quantity;
                
                // Track share
                if (s.front === 'uniforms') uniformsShare += s.totalPrice;
                else utensilsShare += s.totalPrice;
            });

            let opExp = 0;
            mExpenses.forEach(e => {
                if (e.category !== 'Cost of Goods Sold') opExp += e.amount;
            });

            revenueData.push(rev);
            expensesData.push(cogs + opExp);
        }
    } else {
        // Annual comparisons (e.g. 2025 vs 2026)
        labels = ['2025 Financial Year', '2026 Financial Year (YTD)'];
        
        const years = [2025, 2026];
        years.forEach(yr => {
            const yrStart = new Date(yr, 0, 1).getTime();
            const yrEnd = new Date(yr, 11, 31, 23, 59, 59, 999).getTime();

            const yrSales = state.sales.filter(s => {
                const t = new Date(s.date).getTime();
                return t >= yrStart && t <= yrEnd;
            });
            const yrExpenses = state.expenses.filter(e => {
                const t = new Date(e.date).getTime();
                return t >= yrStart && t <= yrEnd;
            });

            let rev = 0;
            let cogs = 0;
            yrSales.forEach(s => {
                rev += s.totalPrice;
                cogs += s.unitCost * s.quantity;
                
                // Track share
                if (s.front === 'uniforms') uniformsShare += s.totalPrice;
                else utensilsShare += s.totalPrice;
            });

            let opExp = 0;
            yrExpenses.forEach(e => {
                if (e.category !== 'Cost of Goods Sold') opExp += e.amount;
            });

            revenueData.push(rev);
            expensesData.push(cogs + opExp);
        });
    }

    // Render Recent Transactions panel list
    const transactionList = document.getElementById('recent-sales-log');
    transactionList.innerHTML = '';
    
    // Take the last 15 sales receipts
    const sortedRecentSales = [...state.sales].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 15);
    
    sortedRecentSales.forEach(sale => {
        const itemLog = document.createElement('div');
        itemLog.className = 'revenue-log-item';
        itemLog.innerHTML = `
            <div>
                <strong style="color:#fff;">${sale.productName}</strong>
                <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:2px;">
                    Qty: ${sale.quantity} | SKU: ${sale.productId.substring(0,6).toUpperCase()} | Front: ${sale.front.toUpperCase()}
                </div>
            </div>
            <div style="text-align: right;">
                <span class="amount">+${formatCurrency(sale.totalPrice)}</span>
                <div style="font-size:0.7rem; color:var(--text-muted); margin-top:2px;">
                    ${new Date(sale.date).toLocaleDateString([], {month:'short', day:'numeric'})} ${new Date(sale.date).toLocaleTimeString([], {hour:'numeric', minute:'2-digit'})}
                </div>
            </div>
        `;
        transactionList.appendChild(itemLog);
    });

    // Render Chart.js instances
    renderRevenueExpensesChart(labels, revenueData, expensesData);
    renderShopShareChart(uniformsShare, utensilsShare);
}

function renderRevenueExpensesChart(labels, revenueData, expensesData) {
    const ctx = document.getElementById('revenueExpensesChart').getContext('2d');
    
    if (revenueExpensesChartInstance) {
        revenueExpensesChartInstance.destroy();
    }

    revenueExpensesChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Gross Sales Revenue',
                    data: revenueData,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: '#10b981'
                },
                {
                    label: 'Operating Expenses & COGS',
                    data: expensesData,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.05)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.2,
                    pointBackgroundColor: '#ef4444'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#94a3b8', font: { family: 'Outfit', size: 12 } }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    titleFont: { family: 'Outfit' },
                    bodyFont: { family: 'Outfit' },
                    callbacks: {
                        label: function(context) {
                            return ` ${context.label}: ${formatCurrency(context.raw)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.03)' },
                    ticks: { color: '#94a3b8', font: { family: 'Outfit' } }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: {
                        color: '#94a3b8',
                        font: { family: 'Outfit' },
                        callback: function(value) { return formatCurrency(value); }
                    }
                }
            }
        }
    });
}

function renderShopShareChart(uniformsRev, utensilsRev) {
    const ctx = document.getElementById('shopShareChart').getContext('2d');

    if (shopShareChartInstance) {
        shopShareChartInstance.destroy();
    }

    const total = uniformsRev + utensilsRev;
    const unifPct = total > 0 ? ((uniformsRev / total) * 100).toFixed(0) : 0;
    const utenPct = total > 0 ? ((utensilsRev / total) * 100).toFixed(0) : 0;

    shopShareChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: [`Uniforms (${unifPct}%)`, `Utensils (${utenPct}%)`],
            datasets: [{
                data: [uniformsRev, utensilsRev],
                backgroundColor: ['#6366f1', '#f59e0b'],
                borderColor: '#0a0c16',
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#94a3b8', font: { family: 'Outfit', size: 11 } }
                },
                tooltip: {
                    titleFont: { family: 'Outfit' },
                    bodyFont: { family: 'Outfit' },
                    callbacks: {
                        label: function(context) {
                            return ` ${context.label}: ${formatCurrency(context.raw)}`;
                        }
                    }
                }
            },
            cutout: '65%'
        }
    });
}

// ==========================================
// 10. PEAK SEASONS OPERATIONS PLANNER
// ==========================================

function adjustPeakMultipliers() {
    const uniMult = parseFloat(document.getElementById('multiplier-uniforms-input').value) || 1.0;
    const uteMult = parseFloat(document.getElementById('multiplier-utensils-input').value) || 1.0;

    state.peakPlanner.uniformsMultiplier = uniMult;
    state.peakPlanner.utensilsMultiplier = uteMult;

    saveToLocalStorage();

    // Refresh UI values
    document.getElementById('peak-multiplier-uniforms-val').innerText = `${uniMult.toFixed(1)}x`;
    document.getElementById('peak-multiplier-utensils-val').innerText = `${uteMult.toFixed(1)}x`;

    updateStockAlertsBanner();
    renderInventoryTable();
}

function handleAddChecklistItem(e) {
    e.preventDefault();
    const text = document.getElementById('new-todo-text').value;
    const front = document.getElementById('new-todo-front').value;

    const newItem = {
        id: `todo-${Date.now()}`,
        text,
        front,
        completed: false
    };

    state.peakPlanner.checklist.push(newItem);
    saveToLocalStorage();

    document.getElementById('new-todo-text').value = '';
    
    renderPeakPlannerChecklist();
    alert('Peak preparation checklist task added.');
}

function toggleChecklistItem(todoId) {
    const todo = state.peakPlanner.checklist.find(x => x.id === todoId);
    if (todo) {
        todo.completed = !todo.completed;
        saveToLocalStorage();
        renderPeakPlannerChecklist();
        updateStockAlertsBanner();
    }
}

function deleteChecklistItem(todoId) {
    state.peakPlanner.checklist = state.peakPlanner.checklist.filter(x => x.id !== todoId);
    saveToLocalStorage();
    renderPeakPlannerChecklist();
}

function renderPeakPlannerChecklist() {
    const container = document.getElementById('peak-prep-checklist-container');
    container.innerHTML = '';

    const checklist = state.peakPlanner.checklist;

    if (checklist.length === 0) {
        container.innerHTML = '<div style="color: var(--text-secondary); text-align: center; padding: 20px;">No checklist tasks entered yet.</div>';
        updateReadinessMeter(0, 0);
        return;
    }

    let completedCount = 0;

    checklist.forEach(todo => {
        if (todo.completed) completedCount++;

        const div = document.createElement('div');
        div.className = `checklist-item ${todo.completed ? 'completed' : ''}`;
        
        const badgeClass = todo.front === 'utensils' ? 'utensils' : todo.front === 'shared' ? 'alice' : '';
        
        div.innerHTML = `
            <input type="checkbox" ${todo.completed ? 'checked' : ''} onclick="toggleChecklistItem('${todo.id}')">
            <span class="checklist-text">${todo.text}</span>
            <span class="season-badge ${badgeClass}">${todo.front.toUpperCase()}</span>
            <button class="modal-close" style="padding: 0 4px; font-size: 1rem;" onclick="deleteChecklistItem('${todo.id}')">&times;</button>
        `;
        container.appendChild(div);
    });

    updateReadinessMeter(completedCount, checklist.length);
}

function updateReadinessMeter(completed, total) {
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // Set circle offset stroke ring
    // Total circumference is 2 * PI * r = 2 * 3.14159 * 40 = 251.2
    const circle = document.getElementById('readiness-progress-ring');
    const offset = 251.2 - (percent / 100 * 251.2);
    circle.style.strokeDashoffset = offset;

    // Set textual indices
    document.getElementById('readiness-percent-val').innerText = `${percent}%`;
    document.getElementById('readiness-summary-desc').innerText = `Tasks completed: ${completed} of ${total} items`;

    // Dynamic coloring based on readiness
    if (percent < 40) {
        circle.style.stroke = 'var(--danger)';
    } else if (percent < 80) {
        circle.style.stroke = 'var(--warning)';
    } else {
        circle.style.stroke = 'var(--accent-alice)';
    }
}

function removeProductImage(index) {
    currentProductImages.splice(index, 1);
    renderMultiImagePreview();
}

function handleSaveInventory(e) {
    e.preventDefault();

    const id = document.getElementById('inventory-modal-id').value;
    const name = document.getElementById('inv-name').value;
    const front = document.getElementById('inv-front').value;
    const sku = document.getElementById('inv-sku').value;
    const quantity = parseInt(document.getElementById('inv-qty').value);
    const threshold = parseInt(document.getElementById('inv-threshold').value);
    const retailPrice = parseFloat(document.getElementById('inv-retail').value);
    const unitCost = parseFloat(document.getElementById('inv-cost').value);

    if (id) {
        // Update existing item
        const item = state.inventory.find(x => x.id === id);
        if (item) {
            item.name = name;
            item.front = front;
            item.sku = sku;
            item.quantity = quantity;
            item.threshold = threshold;
            item.retailPrice = retailPrice;
            item.unitCost = unitCost;
            // Only update images if new ones were uploaded
            if (currentProductImages.length > 0) {
                item.images = [...currentProductImages];
            }
            // Also support legacy `image` field for backwards compatibility
            if (item.image) {
                if (!item.images || item.images.length === 0) {
                    item.images = [item.image];
                }
                delete item.image;
            }
        }
    } else {
        // Create new item
        const newItem = {
            id: `ITEM-${Date.now()}`,
            name,
            front,
            sku,
            quantity,
            threshold,
            retailPrice,
            unitCost,
            images: [...currentProductImages],
            sizes: [],
            colors: []
        };
        state.inventory.push(newItem);
    }

    saveToLocalStorage();
    closeInventoryModal();
    renderInventoryTable();
    updateStockAlertsBanner();
    
    if (currentUser.role === 'management') {
        updateChartsAndKPIs();
        generateProfitLossStatement();
    }
    
    // Reset currentProductImages
    currentProductImages = [];
}

function handleDeleteInventory(itemId) {
    if (confirm('Are you sure you want to remove this item from the catalog? This will not erase past sales logs but deletes active stock tracking.')) {
        state.inventory = state.inventory.filter(x => x.id !== itemId);
        saveToLocalStorage();
        renderInventoryTable();
        updateStockAlertsBanner();
        
        if (currentUser.role === 'management') {
            updateChartsAndKPIs();
            generateProfitLossStatement();
        }
    }
}

function handleClockIn() {
    const now = new Date();
    const attendanceRecord = {
        id: `attendance-${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        role: currentUser.role,
        clockInTime: now.toISOString(),
        clockOutTime: null
    };
    state.attendance.push(attendanceRecord);
    
    // Add notification for Alice
    addNotification({
        id: `notif-${Date.now()}`,
        type: 'clock-in',
        message: `${currentUser.name} clocked in`,
        time: now.toISOString(),
        read: false
    });
    
    saveToLocalStorage();
    
    // Update UI
    document.getElementById('btn-clock-in').style.display = 'none';
    document.getElementById('btn-clock-out').style.display = 'flex';
    lucide.createIcons();
}

function handleClockOut() {
    const lastAttendance = state.attendance.filter(a => a.userId === currentUser.id && !a.clockOutTime).slice(-1)[0];
    if (lastAttendance) {
        const now = new Date();
        lastAttendance.clockOutTime = now.toISOString();
        
        // Add notification for Alice
        addNotification({
            id: `notif-${Date.now()}`,
            type: 'clock-out',
            message: `${currentUser.name} clocked out`,
            time: now.toISOString(),
            read: false
        });
        
        saveToLocalStorage();
        
        // Update UI
        document.getElementById('btn-clock-in').style.display = 'flex';
        document.getElementById('btn-clock-out').style.display = 'none';
        lucide.createIcons();
    }
}

function addNotification(notif) {
    state.notifications.unshift(notif); // Add new notifications to the beginning
    // Keep only last 50 notifications to prevent bloat
    if (state.notifications.length > 50) {
        state.notifications = state.notifications.slice(0, 50);
    }
    saveToLocalStorage();
    
    // If Alice is logged in, render notifications immediately
    if (currentUser && currentUser.role === 'management') {
        renderNotifications();
    }
}

function renderNotifications() {
    const notifListEl = document.getElementById('notifications-list');
    const unreadCountEl = document.getElementById('unread-notif-count');
    if (!notifListEl || !unreadCountEl) return;

    // Calculate unread count
    const unreadCount = state.notifications.filter(n => !n.read).length;
    unreadCountEl.innerText = `${unreadCount} New`;
    unreadCountEl.style.display = unreadCount > 0 ? 'flex' : 'none';

    if (state.notifications.length === 0) {
        notifListEl.innerHTML = '<div style="color: var(--text-secondary); text-align: center; padding: 20px;">No attendance notifications yet</div>';
        return;
    }

    notifListEl.innerHTML = state.notifications.map(notif => {
        const time = new Date(notif.time);
        const timeStr = time.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', hour12: false });
        const dateStr = time.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' });
        
        const icon = notif.type === 'clock-in' ? 'log-in' : 'log-out';
        const iconColor = notif.type === 'clock-in' ? 'color: var(--success)' : 'color: var(--accent-uniforms)';
        
        return `
            <div class="revenue-log-item ${notif.read ? '' : 'unread'}" style="cursor: pointer; border-left: ${notif.read ? '2px solid transparent' : '2px solid var(--accent-alice)'}" onclick="markNotificationRead('${notif.id}')">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <i data-lucide="${icon}" style="${iconColor}; width: 18px; height: 18px;"></i>
                    <div style="flex-grow: 1;">
                        <div style="font-weight: 600;">${notif.message}</div>
                        <div style="color: var(--text-secondary); font-size: 0.75rem;">${dateStr} at ${timeStr}</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    lucide.createIcons();
}

function markNotificationRead(notifId) {
    const notif = state.notifications.find(n => n.id === notifId);
    if (notif) {
        notif.read = true;
        saveToLocalStorage();
        renderNotifications();
    }
}

// ==========================================
// 11. INCEPTION ENGINE (ONLOAD INIT)
// ==========================================

window.onload = function() {
    initializeDatabase();
    
    // Only run ERP-specific logic if we're on index.html
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('BARAKA/')) {
        // Set default values in date fields
        const todayStr = new Date('2026-06-10T12:00:00').toISOString().split('T')[0];
        const expDate = document.getElementById('expense-date');
        if (expDate) expDate.value = todayStr;
        
        // Preset P&L dates
        const plStart = document.getElementById('pl-start-date');
        const plEnd = document.getElementById('pl-end-date');
        if (plStart) plStart.value = '2026-01-01';
        if (plEnd) plEnd.value = todayStr;
        
        setupMultiImageUploadListener();

        // Load active credentials session or render Login select page
        checkActiveSession();
    }
};
