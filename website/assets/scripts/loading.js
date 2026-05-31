const loadingScreen = document.querySelector(".loading-screen");

const pageReady = new Promise((resolve) => {
    if (document.readyState === "complete") {
        resolve();
    } else {
        window.addEventListener("load", resolve, { once: true });
    }
});

const authReady = new Promise((resolve) => {
    window.markAuthReady = resolve;
});

const dashboardReady = new Promise((resolve) => {
    window.markDashboardReady = resolve;
});


if (!window.location.pathname.endsWith("dashboard.html")) {
    window.markDashboardReady?.();
}

Promise.all([pageReady, authReady, dashboardReady]).then(() => {
    loadingScreen?.remove();
});