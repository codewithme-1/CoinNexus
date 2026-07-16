const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwCXNZl7U58qfnGezEJWc6RczN48PYUa5yGYz8DtWt3JtLp3rPlK4bze5pGRKDPio7Wbg/exec";

document.addEventListener("DOMContentLoaded", () => {
    initAuthGate();
    initClock();
    renderWatchlist();
    renderUserAssets();
    initLiveChat();
    initMpesaCalculator();
    
    // Bind Logout Logic
    const logoutAction = () => {
        localStorage.removeItem("nexus_session");
        localStorage.removeItem("nexus_user");
        window.location.href = "index.html";
    };
    document.getElementById("logoutBtnDesk").addEventListener("click", logoutAction);
    document.getElementById("logoutBtnMob").addEventListener("click", logoutAction);

    // --- Cross-Page URL Modal Trigger ---
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    const method = urlParams.get('method');

    if (action === 'deposit') {
        openModal('depositModal'); 
        
        if (method === 'mpesa') {
            switchDepMethod('mpesa');
        } else if (method === 'crypto') {
            switchDepMethod('crypto');
        }
        
        // Clean the URL so the modal doesn't re-open if the user hits refresh
        window.history.replaceState({}, document.title, window.location.pathname);
    }
});

// --- User Initialization & Secure Live Hydration ---
async function initAuthGate() {
    const userData = JSON.parse(localStorage.getItem("nexus_user"));
    const token = localStorage.getItem("nexus_session");
    
    if (!userData || !token) return;

    try {
        // Fetch securely through your Google Apps Script proxy
        const response = await fetch(GAS_WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'fetch_balance',
                payload: { userId: userData.id, userToken: token }
            })
        });

        const result = await response.json();
        
        if (result.success) {
            const usdBalance = parseFloat(result.available_balance || 0);
            
            // 1. UPDATE PORTFOLIO TO USD DISPLAY
            document.getElementById("totalBalance").textContent = `$${usdBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

            // 2. DYNAMIC PERCENTAGE RETURN CALCULATION
            const assumedBaselineCapital = 100.00; 
            
            if (usdBalance > assumedBaselineCapital) {
                const profit = usdBalance - assumedBaselineCapital;
                const percentReturn = (profit / assumedBaselineCapital) * 100;
                
                const returnEl = document.getElementById("portfolioReturn");
                if (returnEl) {
                    returnEl.innerHTML = `<i class="fa-solid fa-arrow-trend-up"></i> +${percentReturn.toFixed(2)}%`;
                    returnEl.style.color = "#00e676"; // Green
                }
            }
        } else {
            console.error("Backend rejected balance fetch:", result.message);
        }
    } catch (err) {
        console.error("Could not reach backend for live balance:", err);
    }
}

// --- SMART BALANCE POLLING ENGINE ---
let isPolling = false;
async function pollForBalanceUpdate() {
    if (isPolling) return;
    isPolling = true;
    
    let attempts = 0;
    const maxAttempts = 6; // Will check every 3 seconds for 18 seconds max
    
    // Capture the balance before the STK push clears
    const startingText = document.getElementById("totalBalance").textContent;

    const interval = setInterval(async () => {
        attempts++;
        await initAuthGate(); // Silently pull the latest balance
        
        const newText = document.getElementById("totalBalance").textContent;
        
        // If the balance changes, or we time out, kill the loop
        if (startingText !== newText || attempts >= maxAttempts) {
            clearInterval(interval);
            isPolling = false;
            
            // If it actually changed, notify the user
            if (startingText !== newText) {
                showToast("Deposit received! Wallet updated.", "fa-wallet");
            }
        }
    }, 3000); // 3000ms = 3 seconds
}

// --- Live Clock Engine ---
function initClock() {
    const timeEl = document.getElementById("liveTime");
    const dateEl = document.getElementById("liveDate");

    function updateTime() {
        const now = new Date();
        // Time Formatting
        let h = now.getHours().toString().padStart(2, '0');
        let m = now.getMinutes().toString().padStart(2, '0');
        let s = now.getSeconds().toString().padStart(2, '0');
        timeEl.textContent = `${h} : ${m} : ${s}`;

        // Date Formatting
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateEl.textContent = now.toLocaleDateString('en-US', options);
    }
    
    updateTime();
    setInterval(updateTime, 1000);
}

// --- Dynamic Mock Data Renderers ---
function renderWatchlist() {
    const container = document.getElementById("watchlistContainer");
    const list = [
        { sym: "ETH", name: "Ethereum", price: "1,814.21", change: "-0.54%", up: false, class: "eth", icon: "fa-brands fa-ethereum" },
        { sym: "BTC", name: "Bitcoin", price: "64,062.00", change: "-0.39%", up: false, class: "btc", icon: "fa-brands fa-btc" },
        { sym: "USDC", name: "USDC", price: "1.00", change: "+0.00%", up: true, class: "usdc", icon: "fa-solid fa-dollar-sign" }
    ];

    let html = list.map(coin => `
        <div class="list-item">
            <div class="asset-left">
                <div class="asset-icon ${coin.class}"><i class="${coin.icon}"></i></div>
                <div class="asset-info">
                    <h4>${coin.sym}</h4>
                    <p>${coin.name}</p>
                </div>
            </div>
            <div class="asset-right">
                <h4>$${coin.price}</h4>
                <p class="${coin.up ? 'up' : 'down'}">${coin.change}</p>
            </div>
        </div>
    `).join('');

    html += `<button class="list-footer-btn" onclick="showToast('Connecting to CoinGecko oracle...', 'fa-rotate')">Refresh Prices</button>`;
    container.innerHTML = html;
}

function renderUserAssets() {
    const container = document.getElementById("assetsContainer");
    const assets = [
        { sym: "BTC", amt: "0.00", val: "0.00", change: "-0.39%", icon: "fa-brands fa-btc", class: "btc" },
        { sym: "ETH", amt: "0.00", val: "0.00", change: "-0.54%", icon: "fa-brands fa-ethereum", class: "eth" }
    ];

    const timeString = new Date().toLocaleTimeString();

    let html = assets.map(asset => `
        <div class="crypto-card">
            <div class="crypto-card-top">
                <div class="crypto-badge">
                    <span class="asset-icon ${asset.class}" style="width:20px; height:20px; font-size:0.7rem;"><i class="${asset.icon}"></i></span>
                    ${asset.sym}
                </div>
                <div class="crypto-change-pill">${asset.change}</div>
            </div>
            <div class="crypto-card-middle">
                <h2>$${asset.val}</h2>
                <p>Amount: ${asset.amt} ${asset.sym}</p>
            </div>
            <div class="crypto-card-bottom">
                <button class="btn-trade" onclick="showToast('Liquidity insufficient for trade routing.', 'fa-triangle-exclamation')"><i class="fa-solid fa-bolt"></i> Trade</button>
                <span class="last-updated">Last updated: ${timeString}</span>
            </div>
        </div>
    `).join('');

    // --- Inject Telegram Community Card ---
    html += `
        <div class="crypto-card" style="background: linear-gradient(135deg, #2AABEE 0%, #229ED9 100%); border: none; text-align: center; padding: 25px 20px;">
            <div style="font-size: 3rem; color: white; margin-bottom: 10px;"><i class="fa-brands fa-telegram"></i></div>
            <h3 style="color: white; margin-bottom: 5px;">Join the Community</h3>
            <p style="color: #E2F3FC; font-size: 0.9rem; margin-bottom: 15px;">Connect with other traders, get live updates, and access exclusive signals.</p>
            <a href="https://t.me/+uhjl6N7fJ3UyOTU0" target="_blank" style="display: inline-block; background: white; color: #229ED9; padding: 10px 20px; border-radius: 8px; font-weight: bold; text-decoration: none; width: 100%;">Join Telegram</a>
        </div>
    `;

    container.innerHTML = html;
}
// --- UI Interaction & Modals ---
function openModal(id) {
    const modal = document.getElementById(id);
    if(modal) modal.classList.add("active");
}

function closeModals() {
    document.querySelectorAll('.modal-overlay').forEach(el => el.classList.remove('active'));
    initAuthGate(); // Auto-refresh balance whenever a modal is closed
}

// Close modal if clicking outside the box
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
        if(e.target === overlay) closeModals();
    });
});

function handleTransaction(e, type) {
    e.preventDefault();
    closeModals();
    
    if (type === 'deposit') {
        showToast("Generating secure deposit node address...", "fa-qrcode");
    } else {
        showToast("Withdrawal flagged for Admin validation.", "fa-shield-halved");
    }
    
    e.target.reset();
}

// --- Toast notification ---
function showToast(message, icon = "fa-circle-check") {
    const container = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    
    container.appendChild(toast);
    
    // Force reflow for animation
    void toast.offsetWidth;
    toast.classList.add("active");

    setTimeout(() => {
        toast.classList.remove("active");
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// --- Modal Form Toggles ---
function switchDepMethod(method) {
    document.getElementById("depMpesaBtn").classList.toggle("active", method === 'mpesa');
    document.getElementById("depCryptoBtn").classList.toggle("active", method === 'crypto');
    document.getElementById("depMpesaForm").style.display = method === 'mpesa' ? "block" : "none";
    document.getElementById("depCryptoForm").style.display = method === 'crypto' ? "block" : "none";
}

function switchWithMethod(method) {
    document.getElementById("withMpesaBtn").classList.toggle("active", method === 'mpesa');
    document.getElementById("withCryptoBtn").classList.toggle("active", method === 'crypto');
    document.getElementById("withMpesaForm").style.display = method === 'mpesa' ? "block" : "none";
    document.getElementById("withCryptoForm").style.display = method === 'crypto' ? "block" : "none";
}

// --- SWAP / CONVERSION ENGINE ---
const EXCHANGE_RATE = 129.50; 

function calculateSwap() {
    const kesInput = document.getElementById("swapKesAmount").value;
    const usdOutput = document.getElementById("swapUsdAmount");
    
    if (kesInput && kesInput > 0) {
        const usdValue = (kesInput / EXCHANGE_RATE).toFixed(2);
        usdOutput.value = usdValue;
    } else {
        usdOutput.value = "";
    }
}

async function handleSwap(e) {
    e.preventDefault();
    const actionBtn = document.getElementById("swapBtn");
    const amount = document.getElementById("swapKesAmount").value;
    
    const userSession = JSON.parse(localStorage.getItem("nexus_user"));
    const userToken = localStorage.getItem("nexus_session");
    
    actionBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Swapping...`;
    actionBtn.disabled = true;

    try {
        const response = await fetch(GAS_WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'swap_kes_to_usd',
                payload: { userId: userSession.id, userToken: userToken, amount: amount }
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            closeModals();
            showToast(result.message, "fa-arrow-right-arrow-left");
            initAuthGate(); // Refresh display
            e.target.reset();
        } else {
            showToast(result.message, "fa-triangle-exclamation");
        }
    } catch (err) {
        showToast("Swap service unavailable.", "fa-wifi");
    } finally {
        actionBtn.textContent = "Convert to USD";
        actionBtn.disabled = false;
    }
}

// --- Native KES M-Pesa API Controller ---
async function handleMpesaDeposit(e) {
    e.preventDefault();
    const actionBtn = document.getElementById("stkBtn");
    const amountKes = document.getElementById("depKesAmount").value;
    const phone = "254" + document.getElementById("depPhone").value;
    
    const userSession = JSON.parse(localStorage.getItem("nexus_user"));
    const userToken = localStorage.getItem("nexus_session"); // Added for RLS
    if (!userSession) return showToast("Session expired. Please log in.", "fa-triangle-exclamation");

    actionBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Processing...`;
    actionBtn.disabled = true;

    try {
        const response = await fetch(GAS_WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'initiate_deposit',
                payload: { userId: userSession.id, userToken: userToken, amount: amountKes, method: 'mpesa', phone: phone }
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            closeModals();
            document.getElementById("successModalMessage").textContent = `STK Push sent to +${phone}. Enter PIN on your phone to complete the deposit of KES ${amountKes}.`;
            openModal('successModal');
            e.target.reset();

            // Trigger the background check so the UI updates instantly when the webhook clears
            pollForBalanceUpdate();
        } else {
            showToast("Payment initiation failed. Please try again or contact support.", "fa-circle-xmark");
            console.error("Backend Error:", result.message);
        }
    } catch (err) {
        showToast("Network error. Could not reach payment gateway.", "fa-wifi");
    } finally {
        actionBtn.textContent = "Send STK Push";
        actionBtn.disabled = false;
    }
}

// NOWPayments Deposit Endpoint Hook
async function handleCryptoDeposit(e) {
    e.preventDefault();
    const network = document.getElementById("depCryptoNetwork").value;
    const btn = document.getElementById("generateAddressBtn");
    
    const userSession = JSON.parse(localStorage.getItem("nexus_user"));
    const token = localStorage.getItem("nexus_session");

    if (!userSession) return showToast("Session expired. Please log in.", "fa-triangle-exclamation");

    // Loading State
    btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Generating...`;
    btn.disabled = true;

    try {
        const response = await fetch(GAS_WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'generate_crypto_address',
                payload: { userId: userSession.id, userToken: token, network: network }
            })
        });

        const result = await response.json();

        if (result.success) {
            // Hide the dropdown input, reveal the address view
            document.getElementById("cryptoInputView").style.display = "none";
            document.getElementById("cryptoQrView").style.display = "block";

            // Inject the live address
            document.getElementById("generatedCryptoAddress").value = result.address;
            
            // Inject the strict minimum deposit warning to protect user funds
            const instructionEl = document.querySelector(".crypto-instruction");
            if (instructionEl) {
                const currencyName = result.currency ? result.currency.toUpperCase() : network;
                const minAmount = result.min_amount ? result.min_amount : '10';
                instructionEl.innerHTML = `Send funds exactly to this unique custodial address. <br><br><strong style="color: var(--warning);"><i class="fa-solid fa-triangle-exclamation"></i> Minimum deposit: ${minAmount} ${currencyName}</strong>. Amounts below this will be lost to network fees.`;
            }

            showToast("Address generated securely.", "fa-check");
        } else {
            showToast(result.message, "fa-triangle-exclamation");
        }
    } catch (err) {
        showToast("Network error generating address.", "fa-wifi");
    } finally {
        // Reset button state
        btn.innerHTML = `Generate Deposit Address`;
        btn.disabled = false;
    }
}


function copyAddress() {
    const field = document.getElementById("generatedCryptoAddress");
    field.select();
    document.execCommand("copy");
    showToast("Custodial hash copied to clipboard", "fa-copy");
}

async function pasteAddress() {
    try {
        const text = await navigator.clipboard.readText();
        document.getElementById("withCryptoAddress").value = text;
    } catch (err) {
        showToast("Clipboard access denied.", "fa-triangle-exclamation");
    }
}

// Safe Outbound Withdrawal Validation Mechanics
async function handleWithdrawal(e, method) {
    e.preventDefault();
    const elementTarget = method === 'mpesa' ? "withMpesaSubmit" : "withCryptoSubmit";
    const actionBtn = document.getElementById(elementTarget);
    
    const amount = method === 'mpesa' ? document.getElementById("withMpesaAmount").value : document.getElementById("withCryptoAmount").value;
    const destination = method === 'mpesa' ? "254" + document.getElementById("withPhone").value : document.getElementById("withCryptoAddress").value;
    
    const userSession = JSON.parse(localStorage.getItem("nexus_user"));
    const userToken = localStorage.getItem("nexus_session"); // Added for RLS
    if (!userSession) return showToast("Session expired. Please log in.", "fa-triangle-exclamation");

    actionBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Writing Ledger Entry...`;
    actionBtn.disabled = true;

    try {
        const response = await fetch(GAS_WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'request_withdrawal',
                payload: { userId: userSession.id, userToken: userToken, amount: amount, method: method, destination: destination }
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            closeModals();
            showToast(`Asset liquidation request recorded. Awaiting admin clearance.`, "fa-shield-halved");
            e.target.reset();
        } else {
            showToast(result.message || "Insufficient available liquidity.", "fa-triangle-exclamation");
        }
    } catch (err) {
        showToast("Network error.", "fa-wifi");
    } finally {
        actionBtn.textContent = "Submit Request to Pending";
        actionBtn.disabled = false;
    }
}

// Reset state flags on close
const baselineClose = closeModals;
closeModals = function() {
    baselineClose();
    setTimeout(() => {
        document.getElementById("cryptoInputView").style.display = "block";
        document.getElementById("cryptoQrView").style.display = "none";
        document.getElementById("generateAddressBtn").textContent = "Generate Deposit Address";
        document.getElementById("generateAddressBtn").disabled = false;
    }, 300);
};

// --- TAWK.TO SMART LIVE CHAT ENGINE ---
function initLiveChat() {
    // 1. Retrieve the logged-in user's session data
    const userData = JSON.parse(localStorage.getItem("nexus_user"));
    
    // 2. Initialize Tawk.to API
    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    // 3. Inject User Data so Andy knows exactly who is chatting
    if (userData) {
        window.Tawk_API.visitor = {
            name: userData.full_name || "CoinNexus User",
            email: userData.email || ""
        };
    }

    // --- FIX: Adjust widget position to clear the mobile nav bar ---
    window.Tawk_API.customStyle = {
        visibility: {
            desktop: {
                position: 'br', // Bottom Right
                xOffset: 20,
                yOffset: 20
            },
            mobile: {
                position: 'br', // Bottom Right
                xOffset: 15,
                yOffset: 85 // Pushes the widget up by 85px specifically on mobile screens
            }
        }
    };

    // 4. Inject the widget script into the DOM
    const s1 = document.createElement("script");
    const s0 = document.getElementsByTagName("script")[0];
    s1.async = true;
    
    // IMPORTANT: Replace the URL below with your actual Tawk.to embed URL
    s1.src = 'https://embed.tawk.to/6a57f84b7150471d4bbcee77/1jtjq3q22'; 
    
    s1.charset = 'UTF-8';
    s1.setAttribute('crossorigin', '*');
    
    if (s0 && s0.parentNode) {
        s0.parentNode.insertBefore(s1, s0);
    } else {
        document.head.appendChild(s1);
    }
}

// --- M-Pesa Withdrawal KES Calculator ---
function initMpesaCalculator() {
    const usdInput = document.getElementById("withMpesaAmount");
    
    if (usdInput) {
        // Set the parent container to relative so the text can dock absolutely
        const parent = usdInput.parentNode;
        parent.style.position = "relative"; 

        const kesDisplay = document.createElement("span");
        kesDisplay.style.position = "absolute";
        kesDisplay.style.right = "5px";
        kesDisplay.style.top = "0"; // Docks directly across from the label
        kesDisplay.style.fontSize = "0.85rem";
        kesDisplay.style.fontWeight = "600";
        kesDisplay.style.color = "#00e676";
        kesDisplay.style.pointerEvents = "none";
        
        parent.insertBefore(kesDisplay, usdInput);

        usdInput.addEventListener("input", (e) => {
            const usdValue = parseFloat(e.target.value);
            if (usdValue && usdValue > 0) {
                const kesValue = (usdValue * EXCHANGE_RATE).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                kesDisplay.innerHTML = `≈ KES ${kesValue}`;
            } else {
                kesDisplay.innerHTML = "";
            }
        });
    }
}
