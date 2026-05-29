const loadingScreen = document.querySelector(".loading-screen");
if (loadingScreen) {
    window.addEventListener("load", () => {
      loadingScreen.remove();
    });
}