import "./style.css";

const video = document.querySelector("#bg-video");
const loading = document.querySelector("#loading");

function hideLoading() {
  if (!loading) return;
  loading.classList.add("loading-overlay--done");
  loading.setAttribute("aria-busy", "false");
}

if (video) {
  video.addEventListener("canplaythrough", hideLoading, { once: true });
  video.addEventListener("error", hideLoading, { once: true });

  if (video.readyState >= 4) {
    hideLoading();
  }
} else {
  hideLoading();
}
