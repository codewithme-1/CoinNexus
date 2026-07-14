document.addEventListener("DOMContentLoaded", () => {
    initLiveTickers();
    initMarketTable();
    initFaqAccordion();
    initAuthFlow();
    initMobileMenu();
});

function initLiveTickers() {
    const tickerContainer = document.getElementById("tickerContainer");
    const activeBots = [
        { pair: "BTC/USDT Bot", profit: "+$82.21", isUp: true },
        { pair: "ETH/USDT Bot", profit: "+$202.66", isUp: true },
        { pair: "SOL/USDT Bot", profit: "-$14.11", isUp: false }
    ];

    tickerContainer.innerHTML = activeBots.map(bot => `
        <div class="stream-pill">
            <i class="fa-solid ${bot.isUp ? 'fa-arrow-trend-up up' : 'fa-arrow-trend-down down'}"></i>
            <span>${bot.pair}: <b class="${bot.isUp ? 'up' : 'down'}">${bot.profit}</b></span>
        </div>
    `).join('');
}

function initMarketTable() {
    const tableBody = document.getElementById("marketTableBody");
    const marketPairs = [
        { name: "BTC / USDT", price: "63,789.54", change: "-0.42%", isUp: false },
        { name: "ETH / USDT", price: "1,784.97", change: "+0.31%", isUp: true },
        { name: "TRX / USDT", price: "0.329600", change: "-0.18%", isUp: false },
        { name: "USDC / USDT", price: "1.0002", change: "+0.00%", isUp: true }
    ];

    tableBody.innerHTML = marketPairs.map(item => `
        <tr>
            <td><strong>${item.name}</strong></td>
            <td>$ ${item.price}</td>
            <td class="${item.isUp ? 'up' : 'down'}">${item.change}</td>
            <td><span class="badge" style="margin:0; padding:4px 10px; font-size:0.75rem;">Active Node</span></td>
        </tr>
    `).join('');
}

function initFaqAccordion() {
    const items = document.querySelectorAll(".faq-item");
    items.forEach(item => {
        const trigger = item.querySelector(".faq-trigger");
        trigger.addEventListener("click", () => {
            const isActive = item.classList.contains("active");
            items.forEach(i => i.classList.remove("active"));
            if (!isActive) item.classList.add("active");
        });
    });
}

function showToast(message, icon = "fa-circle-check") {
    const container = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    
    container.appendChild(toast);
    setTimeout(() => toast.classList.add("active"), 50);

    setTimeout(() => {
        toast.classList.remove("active");
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}


const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwCXNZl7U58qfnGezEJWc6RczN48PYUa5yGYz8DtWt3JtLp3rPlK4bze5pGRKDPio7Wbg/exec";

function initAuthFlow() {
    const modal = document.getElementById("authModal");
    const closeBtn = document.getElementById("modalClose");
    const toggleLink = document.getElementById("authToggle");
    const form = document.getElementById("authForm");
    
    const title = document.getElementById("modalTitle");
    const subtext = document.getElementById("modalSubtext");
    const submitBtn = document.getElementById("submitBtn");
    const footerText = document.getElementById("footerText");
    const signupFields = document.querySelectorAll(".signup-fields");
    const passwordGroup = document.getElementById("authPassword").closest(".form-group");

    let isLoginState = false;

    function updateModalState(toLogin) {
        isLoginState = toLogin;
        
        if (isLoginState) {
            title.textContent = "Welcome Back";
            subtext.textContent = "Enter your credentials to access your node.";
            submitBtn.textContent = "Log In";
            footerText.textContent = "Don't have an account?";
            toggleLink.textContent = "Sign up";
            
            signupFields.forEach(el => el.style.display = "none");
            passwordGroup.classList.add("full-width");
            
            document.getElementById("authName").removeAttribute("required");
            document.getElementById("authConfirmPassword").removeAttribute("required");
        } else {
            title.textContent = "Create an account";
            subtext.textContent = "Enter your details to deploy a new custodial node.";
            submitBtn.textContent = "Create Account";
            footerText.textContent = "Already registered?";
            toggleLink.textContent = "Log in";
            
            signupFields.forEach(el => el.style.display = "contents");
            document.querySelectorAll('.form-group.signup-fields').forEach(el => el.style.display = "flex");
            passwordGroup.classList.remove("full-width");
            
            document.getElementById("authName").setAttribute("required", "true");
            document.getElementById("authConfirmPassword").setAttribute("required", "true");
        }
    }

    document.getElementById("loginTrigger").addEventListener("click", () => {
        updateModalState(true);
        modal.classList.add("active");
    });

    document.getElementById("signupTrigger").addEventListener("click", () => {
        updateModalState(false);
        modal.classList.add("active");
    });

    closeBtn.addEventListener("click", () => modal.classList.remove("active"));
    
    toggleLink.addEventListener("click", (e) => {
        e.preventDefault();
        updateModalState(!isLoginState);
    });

    // Form Submission Logic
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const email = document.getElementById("authEmail").value;
        const password = document.getElementById("authPassword").value;
        
        let payload = { email, password };
        let action = isLoginState ? "login" : "signup";

        if (!isLoginState) {
            const name = document.getElementById("authName").value;
            const confirmPass = document.getElementById("authConfirmPassword").value;
            const phoneCode = document.getElementById("authPhoneCode").value;
            const phone = document.getElementById("authPhone").value;
            const country = document.getElementById("authCountry").value;
            
            if (password !== confirmPass) {
                showToast("Passwords do not match. Please verify.", "fa-triangle-exclamation");
                return;
            }

            payload = { ...payload, name, phone: phoneCode + phone, country };
        }
        
        // UI Loading State
        const originalBtnText = submitBtn.textContent;
        submitBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Processing...`;
        submitBtn.disabled = true;

        try {
            const response = await fetch(GAS_WEB_APP_URL, {
                method: 'POST',
                body: JSON.stringify({ action, payload })
            });
            
            const result = await response.json();

            if (result.success) {
                if (action === "signup") {
                    showToast("Node provisioned successfully. Please log in.", "fa-check");
                    form.reset();
                    updateModalState(true); // Switch to login view automatically
                } else if (action === "login") {
                    showToast("Authentication successful. Initializing matrix...", "fa-unlock");
                    // Securely store the token
                    localStorage.setItem("nexus_session", result.token);
                    localStorage.setItem("nexus_user", JSON.stringify(result.user));
                    
                    // Redirect to the dashboard
                    setTimeout(() => {
                        window.location.href = "dashboard.html";
                    }, 1000);
                }
            } else {
                showToast(result.message, "fa-triangle-exclamation");
            }
        } catch (error) {
            showToast("Network routing failed. Check your connection.", "fa-wifi");
        } finally {
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
        }
    });
}
// Add this line inside your DOMContentLoaded event:
function initMobileMenu() {
    const menuBtn = document.getElementById("mobileMenuBtn");
    const navMenu = document.getElementById("navMenu");
    const icon = menuBtn.querySelector("i");

    // Toggle menu state and swap icon (Hamburger to X)
    menuBtn.addEventListener("click", () => {
        navMenu.classList.toggle("active-menu");
        if(navMenu.classList.contains("active-menu")) {
            icon.classList.remove("fa-bars");
            icon.classList.add("fa-xmark");
        } else {
            icon.classList.remove("fa-xmark");
            icon.classList.add("fa-bars");
        }
    });

    // Auto-close the menu when a mobile navigation link is clicked
    navMenu.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            navMenu.classList.remove("active-menu");
            icon.classList.remove("fa-xmark");
            icon.classList.add("fa-bars");
        });
    });
}