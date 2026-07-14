// i18n.js - Global Translation Engine
const translations = {
    en: {
        // Navigation
        navHome: "Home", navMarkets: "Markets", navTrade: "Trade", navBots: "Bots", navProfile: "Profile",
        // Dashboard
        realPortfolio: "Real Portfolio", deposit: "Deposit", withdraw: "Withdraw", watchlist: "Watchlist",
        seeAll: "See All", yourCrypto: "Your Crypto", trade: "Trade", amount: "Amount", refreshPrices: "Refresh Prices",
        // Bots
        automatedTrading: "Automated Trading", createManage: "Create and manage algorithmic strategies.",
        totalBots: "Total Bots", active: "Active", weeklyReturn: "Weekly Return", createNewBot: "Create New Bot",
        dcaBots: "Dollar-Cost Averaging Bots", notConfigured: "Not Configured", configure: "Configure", startBot: "Start Bot",
        // Profile
        personalInfo: "Personal Information", editInfo: "Edit Information", accountSecurity: "Account Security",
        preferences: "Preferences", editPreferences: "Edit Preferences", saveChanges: "Save Changes", savePreferences: "Save Preferences",
        fullName: "Full Name", emailAddress: "Email Address", phoneNumber: "Phone Number", accountType: "Account Type",
        lastPasswordChange: "Last password change: Never", twoFactor: "Two-Factor Authentication", 
        disabled: "Disabled", language: "Language", memberSince: "Member since"
    },
    es: {
        navHome: "Inicio", navMarkets: "Mercados", navTrade: "Operar", navBots: "Bots", navProfile: "Perfil",
        realPortfolio: "Portafolio Real", deposit: "Depositar", withdraw: "Retirar", watchlist: "Lista de Seguimiento",
        seeAll: "Ver Todo", yourCrypto: "Tu Cripto", trade: "Operar", amount: "Cantidad", refreshPrices: "Actualizar Precios",
        automatedTrading: "Trading Automatizado", createManage: "Crea y gestiona estrategias algorítmicas.",
        totalBots: "Bots Totales", active: "Activo", weeklyReturn: "Retorno Semanal", createNewBot: "Crear Nuevo Bot",
        dcaBots: "Bots de DCA", notConfigured: "No Configurado", configure: "Configurar", startBot: "Iniciar Bot",
        personalInfo: "Información Personal", editInfo: "Editar Información", accountSecurity: "Seguridad de la Cuenta",
        preferences: "Preferencias", editPreferences: "Editar Preferencias", saveChanges: "Guardar Cambios", savePreferences: "Guardar Preferencias",
        fullName: "Nombre Completo", emailAddress: "Correo Electrónico", phoneNumber: "Número de Teléfono", accountType: "Tipo de Cuenta",
        lastPasswordChange: "Último cambio: Nunca", twoFactor: "Autenticación 2FA", disabled: "Desactivado", language: "Idioma", memberSince: "Miembro desde"
    },
    fr: {
        navHome: "Accueil", navMarkets: "Marchés", navTrade: "Trader", navBots: "Bots", navProfile: "Profil",
        realPortfolio: "Portefeuille Réel", deposit: "Dépôt", withdraw: "Retrait", watchlist: "Liste de Suivi",
        seeAll: "Voir Tout", yourCrypto: "Vos Cryptos", trade: "Trader", amount: "Montant", refreshPrices: "Actualiser les Prix",
        automatedTrading: "Trading Automatisé", createManage: "Créez et gérez des stratégies algorithmiques.",
        totalBots: "Total Bots", active: "Actif", weeklyReturn: "Rendement Hebdo", createNewBot: "Créer un Bot",
        dcaBots: "Bots DCA", notConfigured: "Non Configuré", configure: "Configurer", startBot: "Démarrer Bot",
        personalInfo: "Informations Personnelles", editInfo: "Modifier", accountSecurity: "Sécurité",
        preferences: "Préférences", editPreferences: "Modifier", saveChanges: "Enregistrer", savePreferences: "Enregistrer",
        fullName: "Nom Complet", emailAddress: "Adresse E-mail", phoneNumber: "Téléphone", accountType: "Type de Compte",
        lastPasswordChange: "Dernier changement: Jamais", twoFactor: "Authentification 2FA", disabled: "Désactivé", language: "Langue", memberSince: "Membre depuis"
    },
    de: {
        navHome: "Start", navMarkets: "Märkte", navTrade: "Handeln", navBots: "Bots", navProfile: "Profil",
        realPortfolio: "Echtes Portfolio", deposit: "Einzahlen", withdraw: "Abheben", watchlist: "Beobachtungsliste",
        seeAll: "Alle ansehen", yourCrypto: "Deine Krypto", trade: "Handeln", amount: "Menge", refreshPrices: "Preise aktualisieren",
        automatedTrading: "Automatisierter Handel", createManage: "Erstelle und verwalte algorithmische Strategien.",
        totalBots: "Gesamt Bots", active: "Aktiv", weeklyReturn: "Wöchentliche Rendite", createNewBot: "Neuen Bot erstellen",
        dcaBots: "DCA Bots", notConfigured: "Nicht Konfiguriert", configure: "Konfigurieren", startBot: "Bot Starten",
        personalInfo: "Persönliche Infos", editInfo: "Bearbeiten", accountSecurity: "Kontosicherheit",
        preferences: "Präferenzen", editPreferences: "Bearbeiten", saveChanges: "Speichern", savePreferences: "Speichern",
        fullName: "Vollständiger Name", emailAddress: "E-Mail-Adresse", phoneNumber: "Telefonnummer", accountType: "Kontotyp",
        lastPasswordChange: "Letzte Passwortänderung: Nie", twoFactor: "Zwei-Faktor-Auth", disabled: "Deaktiviert", language: "Sprache", memberSince: "Mitglied seit"
    },
    sw: {
        navHome: "Nyumbani", navMarkets: "Masoko", navTrade: "Biashara", navBots: "Boti", navProfile: "Wasifu",
        realPortfolio: "Kwingineko Halisi", deposit: "Weka Pesa", withdraw: "Toa Pesa", watchlist: "Orodha ya Kufuatilia",
        seeAll: "Ona Zote", yourCrypto: "Kripto Yako", trade: "Biashara", amount: "Kiasi", refreshPrices: "Sasisha Bei",
        automatedTrading: "Biashara ya Kiotomatiki", createManage: "Unda na udhibiti mikakati.",
        totalBots: "Jumla ya Boti", active: "Inayofanya kazi", weeklyReturn: "Mapato ya Wiki", createNewBot: "Unda Boti Mpya",
        dcaBots: "Boti za DCA", notConfigured: "Haijasanidiwa", configure: "Sanidi", startBot: "Anzisha Boti",
        personalInfo: "Maelezo Binafsi", editInfo: "Hariri", accountSecurity: "Usalama wa Akaunti",
        preferences: "Mapendeleo", editPreferences: "Hariri Mapendeleo", saveChanges: "Hifadhi", savePreferences: "Hifadhi",
        fullName: "Jina Kamili", emailAddress: "Barua Pepe", phoneNumber: "Nambari ya Simu", accountType: "Aina ya Akaunti",
        lastPasswordChange: "Nenosiri lilibadilishwa: Kamwe", twoFactor: "Uthibitishaji 2FA", disabled: "Imezimwa", language: "Lugha", memberSince: "Mwanachama tangu"
    }
};

function applyLanguage(lang) {
    const dict = translations[lang] || translations['en'];
    
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) {
            el.textContent = dict[key];
        }
    });

    // Handle Profile Language Dropdown Label specifically
    const langDropdown = document.getElementById("prefLanguage");
    if (langDropdown) {
        const langNames = { en: "English", es: "Español", fr: "Français", sw: "Kiswahili", de: "Deutsch" };
        langDropdown.textContent = langNames[lang];
    }
}

// Auto-run translations when any page loads
document.addEventListener("DOMContentLoaded", () => {
    const savedLang = localStorage.getItem("nexus_lang") || "en";
    applyLanguage(savedLang);
});