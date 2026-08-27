const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwCXNZl7U58qfnGezEJWc6RczN48PYUa5yGYz8DtWt3JtLp3rPlK4bze5pGRKDPio7Wbg/exec";
const EXCHANGE_RATE = 129.50;

let userSession = null;
let currentUsdBalance = 0;
let currentKesBalance = 0;
let isKenyan = false;

// Mock Data for Bot States
const botStates = {};
let activeSimulationInterval = null;

document.addEventListener("DOMContentLoaded", () => {
    userSession = JSON.parse(localStorage.getItem("nexus_user"));
    const token = localStorage.getItem("nexus_session");
    
    if (!userSession || !token) {
        window.location.href = "index.html";
        return;
    }

    // FIX: Catch both 'Kenya' and the 'KE' database abbreviation
    isKenyan = (userSession.country === "Kenya" || userSession.country === "KE" || userSession.country_code === "KE");
    initAuthGate(token);

    // Bind Budget Input to Validation Engine
    document.getElementById("botBudget").addEventListener("input", validateFunding);
    document.getElementById("configForm").addEventListener("submit", handleConfigSave);
});

// --- Hydrate Live Balances & Stats ---
async function initAuthGate(token) {
    try {
        const response = await fetch(GAS_WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'fetch_balance',
                payload: { userId: userSession.id, userToken: token }
            })
        });

        const result = await response.json();
        if (result.success) {
            currentKesBalance = parseFloat(result.kes_balance || 0);
            currentUsdBalance = parseFloat(result.available_balance || 0); 
            
            // Update Header Balance
            document.getElementById("headerUsdBalance").textContent = `$${currentUsdBalance.toFixed(2)}`;

            // DYNAMIC WEEKLY RETURN CALCULATION
            const assumedBaselineCapital = 100.00; 
            if (currentUsdBalance > assumedBaselineCapital) {
                const profit = currentUsdBalance - assumedBaselineCapital;
                const percentReturn = (profit / assumedBaselineCapital) * 100;
                
                const weeklyReturnEl = document.getElementById("botWeeklyReturn");
                if (weeklyReturnEl) {
                    weeklyReturnEl.textContent = `+${percentReturn.toFixed(2)}%`;
                    weeklyReturnEl.style.color = "var(--primary)";
                }
            }
        }
    } catch (err) {
        console.error("Balance fetch failed", err);
    }
}
// --- Modal & Configuration Engine ---
function openConfigureModal(botId) {
    document.getElementById("activeBotId").value = botId;
    document.getElementById("botBudget").value = "";
    document.getElementById("jitFundingWidget").style.display = "none";
    document.getElementById("saveConfigBtn").disabled = false;
    
    document.getElementById("configModal").classList.add("active");
}

function closeModal(id) {
    document.getElementById(id).classList.remove("active");
}

// --- The Smart Split-Market Funding Validator ---
function validateFunding() {
    const inputBudget = parseFloat(document.getElementById("botBudget").value);
    const saveBtn = document.getElementById("saveConfigBtn");
    const widget = document.getElementById("jitFundingWidget");
    const widgetMsg = document.getElementById("jitMessage");
    const widgetBtn = document.getElementById("jitActionBtn");

    if (!inputBudget || inputBudget < 10) {
        widget.style.display = "none";
        saveBtn.disabled = false;
        return;
    }

    if (inputBudget > currentUsdBalance) {
        saveBtn.disabled = true; // Lock bot configuration
        widget.style.display = "block";
        
        const deficitUsd = inputBudget - currentUsdBalance;
        
        if (isKenyan) {
            const requiredKes = (deficitUsd * EXCHANGE_RATE).toFixed(2);
            if (currentKesBalance >= requiredKes) {
                // SCENARIO: Kenyan user has enough KES -> Show Quick Swap
                widgetMsg.innerHTML = `Insufficient USD. You need <b>$${deficitUsd.toFixed(2)}</b> more.<br>Convert <b>KES ${requiredKes}</b> from your local wallet?`;
                widgetBtn.textContent = "Convert KES & Unlock Bot";
                widgetBtn.onclick = () => executeQuickSwap(requiredKes);
            } else {
                // SCENARIO: Kenyan user is completely out of funds -> Route to M-Pesa Modal
                widgetMsg.innerHTML = `Insufficient funds. You need <b>$${deficitUsd.toFixed(2)}</b> (Approx KES ${requiredKes}).`;
                widgetBtn.textContent = "Deposit via M-Pesa";
                // Passes URL parameters to dashboard
                widgetBtn.onclick = () => window.location.href = "dashboard.html?action=deposit&method=mpesa"; 
            }
        } else {
            // SCENARIO: Global User -> Route to Crypto Modal
            widgetMsg.innerHTML = `Insufficient USD. You need <b>$${deficitUsd.toFixed(2)}</b> more to start.`;
            widgetBtn.textContent = "Deposit via Crypto";
            widgetBtn.onclick = () => window.location.href = "dashboard.html?action=deposit&method=crypto";
        }
    } else {
        // SCENARIO: User has enough USD natively
        widget.style.display = "none";
        saveBtn.disabled = false;
    }
}

// --- Backend Swap Integration ---
async function executeQuickSwap(kesAmount) {
    const btn = document.getElementById("jitActionBtn");
    btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Swapping...`;
    btn.disabled = true;

    try {
        const response = await fetch(GAS_WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'swap_kes_to_usd',
                payload: { userId: userSession.id, userToken: localStorage.getItem("nexus_session"), amount: kesAmount }
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast("Swap successful! Bot unlocked.", "fa-check");
            // Re-hydrate balances and re-validate
            await initAuthGate(localStorage.getItem("nexus_session"));
            validateFunding(); 
        } else {
            showToast(result.message, "fa-triangle-exclamation");
        }
    } catch (err) {
        showToast("Swap failed. Network error.", "fa-wifi");
    } finally {
        btn.disabled = false;
    }
}

function handleConfigSave(e) {
    e.preventDefault();
    const botId = document.getElementById("activeBotId").value;
    const budget = document.getElementById("botBudget").value;
    
    // Save state
    botStates[botId] = { budget: budget, asset: document.getElementById("botAsset").value };
    
    // Update UI
    document.getElementById(`badge-${botId}`).textContent = "Configured";
    document.getElementById(`badge-${botId}`).className = "status-badge configured";
    document.getElementById(`startBtn-${botId}`).disabled = false;
    
    closeModal("configModal");
    showToast("Bot configured successfully.", "fa-gear");
}

// --- Live Terminal Engine & Backend Sync ---
async function startBot(botId) {
    const config = botStates[botId];
    const btn = document.getElementById(`startBtn-${botId}`);
    btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Allocating...`;
    btn.disabled = true;

    try {
        const response = await fetch(GAS_WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'start_bot',
                payload: { userId: userSession.id, budget: config.budget, botId: botId }
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            document.getElementById("mainBotList").style.display = "none";
            document.getElementById("liveBotView").style.display = "block";
            
            document.getElementById("liveBotTitle").textContent = botId === 'btc-acc' ? "Bitcoin Accumulation" : "ETH DCA Pro";
            document.getElementById("liveBalance").textContent = `$${config.budget}`;
            
            // Start the visual terminal with Logarithmic Growth Engine
            runTerminalSimulation(config.asset, config.budget);
            showToast("Bot engine initiated. Funds locked.", "fa-rocket");
            
            // Sync UI balances immediately
            initAuthGate(localStorage.getItem("nexus_session"));
        } else {
            showToast(result.message, "fa-triangle-exclamation");
        }
    } catch(err) {
        showToast("Network error starting bot.", "fa-wifi");
    } finally {
        btn.textContent = "Start Bot";
        btn.disabled = false;
    }
}

async function stopBot() {
    clearTimeout(activeSimulationInterval); // Adjusted to handle dynamic recursive timeouts
    const activeBotId = document.getElementById("activeBotId").value;
    const config = botStates[activeBotId];
    
    // Grab the final PnL from the frontend simulation before stopping
    const finalPnlText = document.getElementById("livePnl").textContent;
    const cleanPnl = parseFloat(finalPnlText.replace('+', '').replace('$', ''));

    const btn = document.querySelector(".btn-stop");
    btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Securing Funds...`;

    try {
        const response = await fetch(GAS_WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'stop_bot',
                payload: { 
                    userId: userSession.id, 
                    botId: activeBotId, 
                    returnedCapital: config.budget, 
                    pnl: cleanPnl 
                }
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            document.getElementById("terminalConsole").innerHTML = ""; // Clear logs
            document.getElementById("liveBotView").style.display = "none";
            document.getElementById("mainBotList").style.display = "block";
            showToast(result.message, "fa-shield");
            
            // Reset state and sync balances
            document.getElementById(`badge-${activeBotId}`).textContent = "Configured";
            document.getElementById(`badge-${activeBotId}`).className = "status-badge configured";
            initAuthGate(localStorage.getItem("nexus_session"));
        }
    } catch(err) {
        showToast("Network error stopping bot.", "fa-wifi");
    } finally {
        btn.textContent = "Stop Bot";
    }
}

// --- LOGARITHMIC GROWTH SIMULATION ENGINE ---
function runTerminalSimulation(asset, budget) {
    const consoleEl = document.getElementById("terminalConsole");
    let trades = 0;
    let pnl = 0;
    const startTime = Date.now();
    
    // Create a dynamic massive finish line (e.g., 4x to 6x the stake)
    const targetProfit = parseFloat(budget) * (Math.random() * 2.0 + 4.0);

    function scheduleNextTick() {
        const elapsedMinutes = (Date.now() - startTime) / 60000;
        let tickSpeed, winChance, stepAmount;

        // Phase 1: The Sprint (0 to 5 Minutes)
        if (elapsedMinutes < 5) {
            tickSpeed = Math.floor(Math.random() * 2000) + 2000; // Fast: 2 to 4 seconds
            winChance = 0.85; // Heavy winning bias (85%)
            stepAmount = targetProfit * (Math.random() * 0.01 + 0.005); // 0.5% to 1.5% of total target per win
        } 
        // Phase 2: The Grind (5+ Minutes)
        else {
            tickSpeed = Math.floor(Math.random() * 5000) + 5000; // Slow: 5 to 10 seconds
            winChance = 0.55; // Tougher market conditions (55%)
            stepAmount = targetProfit * (Math.random() * 0.005 + 0.002); // Small steady crawl
        }

        // The Safety Wall: If we approach the target finish line, completely plateau to preserve realism
        if (pnl >= targetProfit * 0.95) {
            winChance = 0.50; // Stagnation
            stepAmount = targetProfit * 0.001; 
        }

        activeSimulationInterval = setTimeout(() => {
            trades++;
            const isWin = Math.random() < winChance;
            let tradePnl = 0;
            
            if (isWin) {
                tradePnl = stepAmount;
                pnl += tradePnl;
            } else {
                // Losses are fractionally smaller than wins to ensure the net trend remains upward
                tradePnl = stepAmount * (Math.random() * 0.5 + 0.3);
                pnl -= tradePnl;
                if (pnl < 0) pnl = Math.abs(pnl); // Prevent the overall run from turning negative early on
            }

            const price = asset === "BTC" ? (64000 + (Math.random() * 500)).toFixed(2) : (3400 + (Math.random() * 50)).toFixed(2);
            const time = new Date().toLocaleTimeString('en-US', { hour12: false });
            
            // Console Logging Engine
            let logHtml = "";
            if (isWin) {
                logHtml = `<div class="log-entry"><span class="log-time">[${time}]</span> <span style="color: #00e676; font-weight: bold;">[SUCCESS]</span> Arbitrage cleared: +$${tradePnl.toFixed(2)} (${asset}/USDT) @ $${price}</div>`;
            } else {
                logHtml = `<div class="log-entry"><span class="log-time">[${time}]</span> <span style="color: var(--warning); font-weight: bold;">[HEDGE]</span> Rebalancing position: -$${tradePnl.toFixed(2)} (${asset}/USDT) @ $${price}</div>`;
            }
            
            consoleEl.innerHTML += logHtml;
            consoleEl.scrollTop = consoleEl.scrollHeight;
            
            // UI Updating
            document.getElementById("liveTrades").textContent = trades;
            const pnlEl = document.getElementById("livePnl");
            pnlEl.textContent = `${pnl >= 0 ? '+' : '-'}$${Math.abs(pnl).toFixed(2)}`;
            pnlEl.className = pnl >= 0 ? "pnl-positive" : "pnl-negative";
            
            // Fluctuating but realistic win rate UI
            const displayedWinRate = (winChance * 100) - (Math.random() * 4);
            document.getElementById("liveWinRate").textContent = `${displayedWinRate.toFixed(1)}%`;

            scheduleNextTick(); // Recursive call for the next trade
        }, tickSpeed);
    }
    
    // Ignite the engine
    scheduleNextTick();
}

// --- Utility ---
function showToast(message, icon = "fa-circle-check") {
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
