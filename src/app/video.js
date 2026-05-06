/** Max wait before showing the site even if the video never signals ready (slow network / missing file). */
const LOADING_FALLBACK_MS = 12_000;

// starter bakgrunnsvideoen og fjerner loading-overlay når den er “klar nok”
export function initBackgroundVideo() {
  const video = document.querySelector("#bg-video");
  const loading = document.querySelector("#loading");

  // skjuler overlay og oppdaterer aria
  function hideLoading() {
    if (!loading) return;
    loading.classList.add("loading-overlay--done");
    loading.setAttribute("aria-busy", "false");
  }

  let loadingHidden = false;

  // gjør at vi bare skjuler én gang (uansett hvilke events som fyrer)
  function hideLoadingOnce() {
    if (loadingHidden) return;
    loadingHidden = true;
    hideLoading();
  }

  // sett opp events + fallback timeout
  if (video) {
    video.addEventListener("loadeddata", () => hideLoadingOnce(), { once: true });
    video.addEventListener("canplay", () => hideLoadingOnce(), { once: true });
    video.addEventListener("error", () => hideLoadingOnce(), { once: true });

    const readyEnough = () => video.readyState >= 3;
    if (video.error != null || readyEnough()) {
      hideLoadingOnce();
    } else {
      // microtask: sjekk igjen etter at browser har fått “pustet”
      queueMicrotask(() => {
        if (video.error != null || readyEnough()) hideLoadingOnce();
      });
    }

    // fallback: ikke la loading bli permanent på treig mobil/nett
    window.setTimeout(() => hideLoadingOnce(), LOADING_FALLBACK_MS);
  } else {
    hideLoadingOnce();
  }
}
