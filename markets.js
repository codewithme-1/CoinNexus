document.addEventListener("DOMContentLoaded", () => {
    const userSession = JSON.parse(localStorage.getItem("nexus_user"));
    const token = localStorage.getItem("nexus_session");
    
    if (!userSession || !token) {
        window.location.href = "index.html";
        return;
    }

    // Apply Language
    if (typeof applyLanguage === 'function') {
        applyLanguage(localStorage.getItem("nexus_lang") || "en");
    }

    // Initialize TradingView Widget
    initTradingView();
});

function initTradingView() {
    new TradingView.widget({
        "autosize": true,
        "symbol": "BINANCE:BTCUSDT", // Default market pair
        "interval": "15",            // 15 minute candles
        "timezone": "Etc/UTC",
        "theme": "dark",
        "style": "1",                // 1 = Candles
        "locale": "en",
        "enable_publishing": false,
        "backgroundColor": "#121418",// Matches var(--bg-color)
        "gridColor": "#1e222d",      // Matches var(--surface)
        "hide_top_toolbar": false,
        "hide_legend": false,
        "save_image": false,
        "container_id": "tradingview_chart"
    });
}

function logout() {
    localStorage.removeItem("nexus_session");
    localStorage.removeItem("nexus_user");
    window.location.href = "index.html";
}