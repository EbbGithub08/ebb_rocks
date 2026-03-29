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
  // Hide as soon as the first frame exists (`loadeddata`), or when playback can start (`canplay`).
  // We intentionally avoid `canplaythrough` — it waits for full-file buffer and keeps the overlay up much longer.
  video.addEventListener("loadeddata", () => hideLoadingOnce(), { once: true });
  video.addEventListener("canplay", () => hideLoadingOnce(), { once: true });
  video.addEventListener("error", () => hideLoadingOnce(), { once: true });

  // Deferred module scripts run after parse; the video may already have errored or buffered.
  const readyEnough = () => video.readyState >= 3; // HAVE_FUTURE_DATA — enough to show/play, not full buffer
  if (video.error != null || readyEnough()) {
    hideLoadingOnce();
  } else {
    queueMicrotask(() => {
      if (video.error != null || readyEnough()) hideLoadingOnce();
    });
  }

  window.setTimeout(() => hideLoadingOnce(), LOADING_FALLBACK_MS);
} else {
  hideLoadingOnce();
}
