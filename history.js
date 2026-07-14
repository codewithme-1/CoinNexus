const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwCXNZl7U58qfnGezEJWc6RczN48PYUa5yGYz8DtWt3JtLp3rPlK4bze5pGRKDPio7Wbg/exec";
let userSession = null;
let allTransactions = [];

document.addEventListener("DOMContentLoaded", () => {
    userSession = JSON.parse(localStorage.getItem("nexus_user"));
    const token = localStorage.getItem("nexus_session");
    
    if (!userSession || !token) {
        window.location.href = "index.html";
        return;
    }

    // Apply Language
    if (typeof applyLanguage === 'function') {
        applyLanguage(localStorage.getItem("nexus_lang") || "en");
    }

    // Trigger live data fetch
    fetchTransactionHistory(token);
});

async function fetchTransactionHistory(token) {
    const depositsContainer = document.getElementById("view-deposits");
    depositsContainer.innerHTML = `<div class="empty-state"><i class="fa-solid fa-circle-notch fa-spin"></i><p>Loading ledger...</p></div>`;

    try {
        const response = await fetch(GAS_WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'fetch_history',
                payload: { userId: userSession.id, userToken: token }
            })
        });

        const result = await response.json();
        
        if (result.success) {
            allTransactions = result.transactions || [];
            renderHistory();
        } else {
            console.error("Failed to fetch history:", result.message);
            depositsContainer.innerHTML = `<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i><p>Could not load transactions.</p></div>`;
        }
    } catch (err) {
        console.error("Network error:", err);
        depositsContainer.innerHTML = `<div class="empty-state"><i class="fa-solid fa-wifi"></i><p>Network error loading history.</p></div>`;
    }
}

// ... (rest of your existing setup code)

function renderHistory() {
    const depositsContainer = document.getElementById("view-deposits");
    const withdrawalsContainer = document.getElementById("view-withdrawals");

    // FIX: Match the database column name 'tx_type'
    const deposits = allTransactions.filter(tx => tx.tx_type && tx.tx_type.toLowerCase() === 'deposit');
    const withdrawals = allTransactions.filter(tx => tx.tx_type && tx.tx_type.toLowerCase() === 'withdrawal');

    depositsContainer.innerHTML = deposits.length > 0 
        ? deposits.map(tx => generateTxCard(tx, true)).join('') 
        : `<div class="empty-state"><i class="fa-solid fa-money-bill-transfer"></i><p>No deposit history found.</p></div>`;

    withdrawalsContainer.innerHTML = withdrawals.length > 0 
        ? withdrawals.map(tx => generateTxCard(tx, false)).join('') 
        : `<div class="empty-state"><i class="fa-solid fa-money-bill-transfer"></i><p>No withdrawal history found.</p></div>`;
}

function generateTxCard(tx, isDeposit) {
    const iconClass = isDeposit ? 'deposit' : 'withdraw';
    const iconTag = isDeposit ? '<i class="fa-solid fa-arrow-down"></i>' : '<i class="fa-solid fa-arrow-up"></i>';
    const sign = isDeposit ? '+' : '-';
    
    // Format timestamp from your database
    const dateObj = new Date(tx.created_at);
    const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    // Determine Status
    let statusClass = 'status-pending';
    let statusText = tx.status ? tx.status.toUpperCase() : 'PENDING';
    if (statusText === 'COMPLETED') statusClass = 'status-approved';
    if (statusText === 'REJECTED') statusClass = 'status-rejected';

    // Use method from your database
    const methodText = tx.method ? tx.method.toUpperCase() : 'CRYPTO';
    const amount = Math.abs(parseFloat(tx.amount || 0)).toFixed(2);
    
    // Determine currency symbol based on method
    const currencySymbol = (tx.method && tx.method.toLowerCase() === 'mpesa') ? 'KES ' : '$';

    return `
        <div class="tx-card">
            <div class="tx-left">
                <div class="tx-icon ${iconClass}">${iconTag}</div>
                <div class="tx-info">
                    <h4>${methodText} ${isDeposit ? 'Deposit' : 'Withdrawal'}</h4>
                    <p>${dateStr} • ${timeStr}</p>
                </div>
            </div>
            <div class="tx-right">
                <h4>${sign}${currencySymbol}${amount}</h4>
                <span class="status-badge ${statusClass}">${statusText}</span>
            </div>
        </div>
    `;
}

function switchTab(tab) {
    // UI Toggle for Buttons
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    // UI Toggle for Lists
    document.getElementById('view-deposits').style.display = tab === 'deposits' ? 'flex' : 'none';
    document.getElementById('view-withdrawals').style.display = tab === 'withdrawals' ? 'flex' : 'none';
}