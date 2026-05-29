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

Promise.all([pageReady, authReady]).then(() => {
  loadingScreen?.remove();
});