const instructionCarousel = document.querySelector(".instruction-carousel");

if (instructionCarousel) {
    const carouselTrack = instructionCarousel.querySelector(".carousel-track");
    const carouselSlides = instructionCarousel.querySelectorAll(".carousel-slide");
    const previousButton = instructionCarousel.querySelector("[data-carousel-prev]");
    const nextButton = instructionCarousel.querySelector("[data-carousel-next]");
    const dotsElement = instructionCarousel.querySelector(".carousel-dots");
    let currentSlide = 0;

    function showCarouselSlide(slideIndex) {
        if (slideIndex < 0) {
            slideIndex = carouselSlides.length - 1;
        }

        if (slideIndex >= carouselSlides.length) {
            slideIndex = 0;
        }

        currentSlide = slideIndex;
        carouselTrack.style.transform = `translateX(-${currentSlide * 100}%)`;

        const dots = dotsElement.querySelectorAll(".carousel-dot");
        dots.forEach((dot, index) => {
            if (index === currentSlide) {
                dot.classList.add("active");
            } else {
                dot.classList.remove("active");
            }
        });
    }

    carouselSlides.forEach((slide, index) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.classList.add("carousel-dot");
        dot.setAttribute("aria-label", `Go to instruction ${index + 1}`);
        dot.addEventListener("click", () => {
            showCarouselSlide(index);
        });
        dotsElement.appendChild(dot);
    });

    previousButton.addEventListener("click", () => {
        showCarouselSlide(currentSlide - 1);
    });

    nextButton.addEventListener("click", () => {
        showCarouselSlide(currentSlide + 1);
    });

    showCarouselSlide(0);
}
