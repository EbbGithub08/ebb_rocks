import "./style.css";

const video = document.querySelector("#bg-video");
const loading = document.querySelector("#loading");

/** Max wait before showing the site even if the video never signals ready (slow network / missing file). */
const LOADING_FALLBACK_MS = 12_000;

function hideLoading() {
  if (!loading) return;
  loading.classList.add("loading-overlay--done");
  loading.setAttribute("aria-busy", "false");
}

let loadingHidden = false;

function hideLoadingOnce() {
  if (loadingHidden) return;
  loadingHidden = true;
  hideLoading();
}

if (video) {
  video.addEventListener("canplaythrough", () => hideLoadingOnce(), { once: true });
  video.addEventListener("error", () => hideLoadingOnce(), { once: true });
  video.addEventListener("loadeddata", () => hideLoadingOnce(), { once: true });

  // Deferred module scripts run after parse; the video may already have errored or buffered.
  if (video.error != null || video.readyState >= 4) {
    hideLoadingOnce();
  } else {
    queueMicrotask(() => {
      if (video.error != null || video.readyState >= 4) hideLoadingOnce();
    });
  }

  window.setTimeout(() => hideLoadingOnce(), LOADING_FALLBACK_MS);
} else {
  hideLoadingOnce();
}
