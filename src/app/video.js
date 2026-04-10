/** Max wait before showing the site even if the video never signals ready (slow network / missing file). */
const LOADING_FALLBACK_MS = 12_000;

export function initBackgroundVideo() {
  const video = document.querySelector("#bg-video");
  const loading = document.querySelector("#loading");

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
    video.addEventListener("loadeddata", () => hideLoadingOnce(), { once: true });
    video.addEventListener("canplay", () => hideLoadingOnce(), { once: true });
    video.addEventListener("error", () => hideLoadingOnce(), { once: true });

    const readyEnough = () => video.readyState >= 3;
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
}
