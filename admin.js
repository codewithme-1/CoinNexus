const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwCXNZl7U58qfnGezEJWc6RczN48PYUa5yGYz8DtWt3JtLp3rPlK4bze5pGRKDPio7Wbg/exec";
const EXCHANGE_RATE = 129.50;
let adminSession = null;
let currentView = 'queue';
let pollingInterval = null;

document.addEventListener("DOMContentLoaded", () => {
    initAdminGate();
});

// --- AUTHENTICATION & SECURITY (THE LOCK SCREEN) ---
function initAdminGate() {
    // Check if we already have a valid session in memory
    const userStr = localStorage.getItem("nexus_user");
    const token = localStorage.getItem("nexus_session");
    const masterPass = sessionStorage.getItem("nexus_admin_master");

    if (userStr && token && masterPass) {
        adminSession = { id: JSON.parse(userStr).id, token: token, password: masterPass };
        unlockDashboard();
    } else {
        renderLockScreen();
    }
}

function renderLockScreen() {
    // Generate the Fullscreen Lock Overlay dynamically
    const overlay = document.createElement('div');
    overlay.id = "adminLockOverlay";
    overlay.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:var(--bg-dark);z-index:9999;display:flex;align-items:center;justify-content:center;";
    
    overlay.innerHTML = `
        <div style="background:var(--bg-card);padding:40px;border-radius:12px;border:1px solid var(--border);width:90%;max-width:400px;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,0.5);">
            <div style="font-size:3rem;color:var(--primary);margin-bottom:15px;"><i class="fa-solid fa-shield-halved"></i></div>
            <h2 style="margin-bottom:5px;">Admin Gateway</h2>
            <p style="color:var(--text-muted);margin-bottom:25px;font-size:0.9rem;">Strict authorization required.</p>
            
            <input type="email" id="adminEmail" placeholder="Account Email" style="width:100%;padding:12px;margin-bottom:15px;background:var(--bg-dark);border:1px solid var(--border);color:white;border-radius:8px;outline:none;">
            <input type="password" id="adminAuthPass" placeholder="Account Password" style="width:100%;padding:12px;margin-bottom:15px;background:var(--bg-dark);border:1px solid var(--border);color:white;border-radius:8px;outline:none;">
            <input type="password" id="adminMasterPass" placeholder="Master Admin PIN" style="width:100%;padding:12px;margin-bottom:25px;background:rgba(255,165,0,0.1);border:1px solid orange;color:white;border-radius:8px;outline:none;">
            
            <button id="adminLoginBtn" style="width:100%;padding:12px;background:var(--primary);color:black;border:none;border-radius:8px;font-weight:bold;cursor:pointer;font-size:1rem;transition:0.2s;">Authenticate & Unlock</button>
            <p id="adminLoginError" style="color:var(--danger);margin-top:15px;font-size:0.85rem;display:none;"></p>
        </div>
    `;
    
    document.body.appendChild(overlay);

    document.getElementById('adminLoginBtn').addEventListener('click', async (e) => {
        const email = document.getElementById('adminEmail').value;
        const pass = document.getElementById('adminAuthPass').value;
        const master = document.getElementById('adminMasterPass').value;
        const errEl = document.getElementById('adminLoginError');
        
        if(!email || !pass || !master) {
            errEl.textContent = "All fields are required.";
            errEl.style.display = "block";
            return;
        }

        e.target.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Verifying...';
        e.target.disabled = true;
        errEl.style.display = "none";

        try {
            // 1. Authenticate with Supabase via your backend
            const authRes = await fetch(GAS_WEB_APP_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ action: 'login', payload: { email: email, password: pass } })
            });
            const authData = await authRes.json();

            if (!authData.success) {
                throw new Error(authData.message || "Invalid account credentials.");
            }

            // 2. Test Admin Access (Checks Master PIN AND Supabase Role)
            const testSession = { id: authData.user.id, token: authData.token, password: master };
            
            const testRes = await fetch(GAS_WEB_APP_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ 
                    action: 'admin_fetch_queue', 
                    payload: { adminId: testSession.id, adminToken: testSession.token, adminPassword: testSession.password } 
                })
            });
            const testData = await testRes.json();

            if (!testData.success) {
                throw new Error("Access Denied: Master PIN incorrect OR your Supabase profile lacks the 'admin' role.");
            }

            // SUCCESS: Save tokens and unlock
            localStorage.setItem("nexus_user", JSON.stringify(authData.user));
            localStorage.setItem("nexus_session", authData.token);
            sessionStorage.setItem("nexus_admin_master", master);
            
            adminSession = testSession;
            overlay.remove();
            unlockDashboard();

        } catch (err) {
            errEl.textContent = err.message;
            errEl.style.display = "block";
            e.target.innerHTML = 'Authenticate & Unlock';
            e.target.disabled = false;
        }
    });
}

function unlockDashboard() {
    bindUIEvents();
    startLivePolling();
}

// --- UI & EVENT BINDINGS ---
function bindUIEvents() {
    document.querySelectorAll('.nav-link').forEach(link => {
        if(link.id === 'adminLogoutBtn') return;
        link.addEventListener('click', (e) => {
            const target = e.currentTarget.getAttribute('data-target');
            switchAdminView(target, e.currentTarget);
            closeMobileMenu();
        });
    });

    document.getElementById('menuToggle').addEventListener('click', openMobileMenu);
    document.getElementById('mobileOverlay').addEventListener('click', closeMobileMenu);

    document.getElementById('adminLogoutBtn').addEventListener('click', () => {
        localStorage.removeItem("nexus_session");
        localStorage.removeItem("nexus_user");
        sessionStorage.removeItem("nexus_admin_master");
        window.location.reload();
    });
}

function switchAdminView(viewId, element) {
    currentView = viewId;
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    element.classList.add('active');

    document.querySelectorAll('.view-section').forEach(section => section.classList.remove('active'));
    document.getElementById(viewId + '-view').classList.add('active');
    
    fetchModuleData(viewId);
}

function openMobileMenu() {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('mobileOverlay').classList.add('active');
}

function closeMobileMenu() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('mobileOverlay').classList.remove('active');
}

// --- REAL-TIME DATA ENGINE ---
function startLivePolling() {
    fetchModuleData(currentView);
    if (pollingInterval) clearInterval(pollingInterval);
    // Increased to 60 seconds (60000ms) to stop the browser from aggressively blocking requests as "trackers"
    pollingInterval = setInterval(() => fetchModuleData(currentView), 60000);
}

async function fetchModuleData(view) {
    if(!adminSession) return;
    
    let actionType = '';
    let targetBody = '';
    
    if (view === 'queue') {
        actionType = 'admin_fetch_queue';
        targetBody = 'queueTableBody';
    } else if (view === 'ledger') {
        actionType = 'admin_fetch_ledger';
        targetBody = 'ledgerTableBody';
    } else if (view === 'users') {
        actionType = 'admin_fetch_users';
        targetBody = 'usersTableBody';
    }

    try {
        const response = await fetch(GAS_WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: actionType,
                payload: { 
                    adminId: adminSession.id, 
                    adminToken: adminSession.token,
                    adminPassword: adminSession.password 
                }
            })
        });

        const result = await response.json();
        
        if (result.success) {
            if (view === 'queue') renderQueue(result.data, targetBody);
            if (view === 'ledger') renderLedger(result.data, targetBody);
            if (view === 'users') renderUsers(result.data, targetBody);
        } else if (result.message === "Unauthorized admin access.") {
            // Force logout if session was revoked mid-use
            document.getElementById('adminLogoutBtn').click(); 
        }
    } catch (err) {
        console.error(`Fetch error (Safe to ignore if browser blocked tracking):`, err);
    }
}

// --- MODULE A: CLEARANCE QUEUE RENDERER ---
function renderQueue(data, containerId) {
    const container = document.getElementById(containerId);
    if (!data || data.length === 0) {
        container.innerHTML = `<tr><td colspan="7" class="loading-state"><i class="fa-solid fa-check-double"></i> Queue is empty. All withdrawals cleared.</td></tr>`;
        return;
    }

    container.innerHTML = data.map(tx => {
        const isMpesa = tx.method.toLowerCase() === 'mpesa';
        const methodIcon = isMpesa ? '<i class="fa-solid fa-mobile-screen" style="color: #00e676;"></i> M-Pesa' : '<i class="fa-brands fa-bitcoin" style="color: #f7931a;"></i> Crypto';
        const deduction = parseFloat(tx.amount).toFixed(2);
        const payout = isMpesa ? `KES ${(deduction * EXCHANGE_RATE).toLocaleString('en-KE', {minimumFractionDigits: 2})}` : `$${deduction} (${tx.network || 'Crypto'})`;
        const dateStr = new Date(tx.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

        // Added data-label for mobile view compatibility
        return `
            <tr>
                <td data-label="Date">${dateStr}</td>
                <td data-label="User ID" style="font-family: monospace; color: var(--text-muted);">${tx.user_id.substring(0,8)}...</td>
                <td data-label="Method">${methodIcon}</td>
                <td data-label="Destination">${tx.destination}</td>
                <td data-label="Deduction (USD)">$${deduction}</td>
                <td data-label="Payout Amount" style="color: #00e676; font-weight: bold;">${payout}</td>
                <td data-label="Actions">
                    <button class="action-btn btn-approve" onclick="processWithdrawal('${tx.id}', 'approve')"><i class="fa-solid fa-check"></i></button>
                    <button class="action-btn btn-reject" onclick="processWithdrawal('${tx.id}', 'reject')"><i class="fa-solid fa-xmark"></i></button>
                </td>
            </tr>
        `;
    }).join('');
}

// --- MODULE B: GLOBAL LEDGER RENDERER ---
function renderLedger(data, containerId) {
    const container = document.getElementById(containerId);
    if (!data || data.length === 0) {
        container.innerHTML = `<tr><td colspan="6" class="loading-state">No transaction history found.</td></tr>`;
        return;
    }

    container.innerHTML = data.map(tx => {
        const isDeposit = tx.tx_type.toLowerCase() === 'deposit';
        const sign = isDeposit ? '+' : '-';
        const color = isDeposit ? '#00e676' : 'var(--danger)';
        const amount = parseFloat(tx.amount).toFixed(2);
        const dateStr = new Date(tx.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        
        let statusClass = 'badge-pending';
        if (tx.status.toLowerCase() === 'completed') statusClass = 'badge-completed';
        if (tx.status.toLowerCase() === 'failed' || tx.status.toLowerCase() === 'rejected') statusClass = 'badge-rejected';

        // Added data-label for mobile view compatibility
        return `
            <tr>
                <td data-label="Tx ID" style="font-family: monospace;">${tx.id.substring(0,10)}</td>
                <td data-label="Date">${dateStr}</td>
                <td data-label="Type">${tx.tx_type.toUpperCase()}</td>
                <td data-label="Method">${tx.method.toUpperCase()}</td>
                <td data-label="Net Value (USD)" style="color: ${color}; font-weight: 600;">${sign}$${amount}</td>
                <td data-label="Status"><span class="badge ${statusClass}">${tx.status.toUpperCase()}</span></td>
            </tr>
        `;
    }).join('');
}

// --- MODULE C: USER MANAGEMENT RENDERER ---
function renderUsers(data, containerId) {
    const container = document.getElementById(containerId);
    if (!data || data.length === 0) {
        container.innerHTML = `<tr><td colspan="5" class="loading-state">No users registered.</td></tr>`;
        return;
    }

    container.innerHTML = data.map(user => {
        const balance = parseFloat(user.available_balance || 0).toLocaleString('en-US', {minimumFractionDigits: 2});
        const dateStr = new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        
        // Fixed undefined email bug. If email is hidden in auth, fallback to phone or ID.
        const contactInfo = user.email || user.phone || `ID: ${user.id.substring(0,8)}`;

        // Added data-label for mobile view compatibility
        return `
            <tr>
                <td data-label="Name / Contact">
                    <div style="font-weight: 600;">${user.full_name || 'CoinNexus User'}</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">${contactInfo}</div>
                </td>
                <td data-label="Joined">${dateStr}</td>
                <td data-label="Available Balance" style="font-size: 1.1rem; font-weight: 800;">$${balance}</td>
                <td data-label="Status"><span class="badge badge-completed">ACTIVE</span></td>
                <td data-label="Manage">
                    <button class="action-btn btn-edit" onclick="triggerManualAdjustment('${user.id}')"><i class="fa-solid fa-pen-to-square"></i> Edit Balance</button>
                </td>
            </tr>
        `;
    }).join('');
}

// --- CUSTOM MODAL PROMISE WRAPPERS ---
function showCustomConfirm(title, message) {
    return new Promise((resolve) => {
        const modal = document.getElementById('customConfirmModal');
        document.getElementById('confirmTitle').textContent = title;
        document.getElementById('confirmMessage').textContent = message;
        
        modal.classList.add('active');

        const btnOk = document.getElementById('confirmOkBtn');
        const btnCancel = document.getElementById('confirmCancelBtn');

        const cleanup = () => {
            modal.classList.remove('active');
            btnOk.removeEventListener('click', onOk);
            btnCancel.removeEventListener('click', onCancel);
        };

        const onOk = () => { cleanup(); resolve(true); };
        const onCancel = () => { cleanup(); resolve(false); };

        btnOk.addEventListener('click', onOk);
        btnCancel.addEventListener('click', onCancel);
    });
}

function showCustomPrompt(title, message) {
    return new Promise((resolve) => {
        const modal = document.getElementById('customPromptModal');
        document.getElementById('promptTitle').textContent = title;
        document.getElementById('promptMessage').textContent = message;
        
        const input = document.getElementById('promptInput');
        input.value = ''; // Reset input
        modal.classList.add('active');
        input.focus();

        const btnOk = document.getElementById('promptSubmitBtn');
        const btnCancel = document.getElementById('promptCancelBtn');

        const cleanup = () => {
            modal.classList.remove('active');
            btnOk.removeEventListener('click', onOk);
            btnCancel.removeEventListener('click', onCancel);
        };

        const onOk = () => { cleanup(); resolve(input.value); };
        const onCancel = () => { cleanup(); resolve(null); };

        btnOk.addEventListener('click', onOk);
        btnCancel.addEventListener('click', onCancel);
    });
}

// --- ADMIN ACTION HANDLERS ---
async function processWithdrawal(txId, actionCommand) {
    const isConfirmed = await showCustomConfirm(
        "Confirm Action",
        `Are you sure you want to ${actionCommand} this withdrawal request?`
    );

    if (!isConfirmed) return;

    try {
        const response = await fetch(GAS_WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'admin_process_withdrawal',
                payload: { 
                    adminId: adminSession.id, 
                    adminToken: adminSession.token, 
                    adminPassword: adminSession.password, 
                    txId: txId, 
                    command: actionCommand 
                }
            })
        });

        const result = await response.json();
        
        if (result.success) {
            showAdminToast(`Withdrawal successfully ${actionCommand}ed.`, "fa-check");
            fetchModuleData('queue'); 
        } else {
            showAdminToast(result.message, "fa-triangle-exclamation");
        }
    } catch (err) {
        showAdminToast("Network error communicating with core.", "fa-wifi");
    }
}

async function triggerManualAdjustment(userId) {
    const newBalance = await showCustomPrompt(
        "Manual Adjustment",
        "Enter the new EXACT USD balance for this user (Warning: This overrides the current balance):"
    );
    
    if (newBalance !== null && !isNaN(newBalance) && newBalance.trim() !== "") {
        executeBalanceUpdate(userId, parseFloat(newBalance));
    }
}

async function executeBalanceUpdate(userId, newBalance) {
    try {
        const response = await fetch(GAS_WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'admin_update_balance',
                payload: { 
                    adminId: adminSession.id, 
                    adminToken: adminSession.token, 
                    adminPassword: adminSession.password,
                    targetUserId: userId, 
                    newBalance: newBalance 
                }
            })
        });

        const result = await response.json();
        if (result.success) {
            showAdminToast(`Ledger adjusted. New balance applied.`, "fa-scale-balanced");
            fetchModuleData('users'); 
        } else {
            showAdminToast("Failed to update balance.", "fa-xmark");
        }
    } catch (err) {
        showAdminToast("Network error.", "fa-wifi");
    }
}

// --- ADMIN TOAST NOTIFICATIONS ---
function showAdminToast(message, icon) {
    const container = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    
    container.appendChild(toast);
    
    void toast.offsetWidth;
    toast.classList.add("active");

    setTimeout(() => {
        toast.classList.remove("active");
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}