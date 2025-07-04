const banner = document.getElementById("cookie-banner");
const acceptBtn = document.getElementById("accept-cookies");


if (localStorage.getItem("cookiesAccepted")) {
    banner.classList.add("hidden");
}

acceptBtn.addEventListener("click", () => {
    localStorage.setItem("cookiesAccepted", "true");
    banner.classList.add("hidden");
    enableVideos();
});

function enableVideos() {
    console.log("Itt engedelyezzuk a videokat");
}