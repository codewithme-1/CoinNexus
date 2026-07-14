const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwCXNZl7U58qfnGezEJWc6RczN48PYUa5yGYz8DtWt3JtLp3rPlK4bze5pGRKDPio7Wbg/exec";
let userSession = null;

document.addEventListener("DOMContentLoaded", () => {
    userSession = JSON.parse(localStorage.getItem("nexus_user"));
    const token = localStorage.getItem("nexus_session");
    
    if (!userSession || !token) {
        window.location.href = "index.html";
        return;
    }

    // Initialize Language from local storage
    const savedLang = localStorage.getItem("nexus_lang") || "en";
    applyLanguage(savedLang);
    document.getElementById("selectLanguage").value = savedLang;

    // Fetch live data from Database
    fetchLiveProfile(token);

    // Bind Forms
    document.getElementById("editInfoForm").addEventListener("submit", handleInfoSave);
    document.getElementById("preferencesForm").addEventListener("submit", handlePreferencesSave);
});

// --- Database Fetch Engine ---
async function fetchLiveProfile(token) {
    try {
        const response = await fetch(GAS_WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'fetch_profile',
                payload: { userId: userSession.id, userToken: token }
            })
        });

        const result = await response.json();
        
        if (result.success) {
            // Update local session with fresh database data
            userSession = { ...userSession, ...result.profile };
            localStorage.setItem("nexus_user", JSON.stringify(userSession));
            populateProfileUI();
        } else {
            showToast("Failed to sync live profile data.", "fa-triangle-exclamation");
            populateProfileUI(); // Fallback to local storage
        }
    } catch (err) {
        showToast("Network error syncing profile.", "fa-wifi");
        populateProfileUI();
    }
}

// --- Data Population ---
function populateProfileUI() {
    const name = userSession.full_name || "User";
    const email = userSession.email || "";
    const phone = userSession.phone_number || "";
    const createdAt = userSession.created_at ? new Date(userSession.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : "Jul 2026";

    // Set Display Fields
    document.getElementById("displayFullName").textContent = name;
    document.getElementById("avatarInitial").textContent = name.charAt(0).toUpperCase();
    document.getElementById("displayMemberSince").textContent = createdAt;
    
    document.getElementById("infoFullName").textContent = name;
    document.getElementById("infoEmail").textContent = email;
    document.getElementById("infoPhone").textContent = phone;

    // Set Modal Form Inputs
    document.getElementById("editFullName").value = name;
    document.getElementById("editEmail").value = email; 
    document.getElementById("editPhone").value = phone;
}

// --- Form Handlers ---
async function handleInfoSave(e) {
    e.preventDefault();
    const btn = document.getElementById("saveInfoBtn");
    const newName = document.getElementById("editFullName").value;
    const newPhone = document.getElementById("editPhone").value;
    const token = localStorage.getItem("nexus_session");

    btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Saving...`;
    btn.disabled = true;

    try {
        const response = await fetch(GAS_WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'update_profile',
                payload: { userId: userSession.id, userToken: token, full_name: newName, phone_number: newPhone }
            })
        });

        const result = await response.json();
        
        if (result.success) {
            // Re-fetch to ensure sync
            await fetchLiveProfile(token);
            closeModals();
            showToast("Profile updated successfully.", "fa-check");
        } else {
            showToast(result.message, "fa-triangle-exclamation");
        }
    } catch (err) {
        showToast("Network error updating profile.", "fa-wifi");
    } finally {
        const currentLang = localStorage.getItem("nexus_lang") || "en";
        btn.innerHTML = `<span>${translations[currentLang].saveChanges}</span>`;
        btn.disabled = false;
    }
}

function handlePreferencesSave(e) {
    e.preventDefault();
    const selectedLang = document.getElementById("selectLanguage").value;
    
    localStorage.setItem("nexus_lang", selectedLang);
    applyLanguage(selectedLang);
    
    closeModals();
    showToast("Preferences saved globally.", "fa-globe");
}

function logout() {
    localStorage.removeItem("nexus_session");
    localStorage.removeItem("nexus_user");
    window.location.href = "index.html";
}

// --- Modals & Toasts ---
function openModal(id) {
    const modal = document.getElementById(id);
    if(modal) modal.classList.add("active");
}

function closeModals() {
    document.querySelectorAll('.modal-overlay').forEach(el => el.classList.remove('active'));
}

document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
        if(e.target === overlay) closeModals();
    });
});

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