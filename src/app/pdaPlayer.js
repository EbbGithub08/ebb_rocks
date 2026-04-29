import { pdaTracks } from "./pdaTracks.js";

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "--:--";
  const whole = Math.floor(seconds);
  const mins = Math.floor(whole / 60);
  const secs = whole % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function paintRangeProgress(rangeInput, percent) {
  if (!(rangeInput instanceof HTMLInputElement)) return;
  const clamped = Math.max(0, Math.min(100, percent));
  rangeInput.style.setProperty("--range-progress", `${clamped}%`);
}

function getToggleIconSvg(isPlaying) {
  if (isPlaying) {
    return `
      <svg class="pda-player__toggle-icon" viewBox="0 0 24 24" focusable="false" aria-hidden="true">
        <rect x="6" y="5" width="4.2" height="14" rx="1.4"></rect>
        <rect x="13.8" y="5" width="4.2" height="14" rx="1.4"></rect>
      </svg>
    `;
  }
  return `
    <svg class="pda-player__toggle-icon" viewBox="0 0 24 24" focusable="false" aria-hidden="true">
      <path d="M8 6.5a1 1 0 0 1 1.53-.85l8.3 5.5a1 1 0 0 1 0 1.7l-8.3 5.5A1 1 0 0 1 8 17.5z"></path>
    </svg>
  `;
}

export function initPdaPlayer() {
  const playerRoot = document.querySelector("[data-pda-player]");
  if (!(playerRoot instanceof HTMLElement)) return;

  const coverNode = playerRoot.querySelector("[data-pda-cover]");
  const titleNode = playerRoot.querySelector("[data-pda-title]");
  const durationNode = playerRoot.querySelector("[data-pda-duration]");
  const remainingNode = playerRoot.querySelector("[data-pda-remaining]");
  const progressNode = playerRoot.querySelector("[data-pda-progress]");
  const toggleButton = playerRoot.querySelector("[data-pda-toggle]");
  const audioNode = playerRoot.querySelector("[data-pda-audio]");
  if (pdaTracks.length === 0) return;

  if (
    !(coverNode instanceof HTMLImageElement) ||
    !(titleNode instanceof HTMLElement) ||
    !(durationNode instanceof HTMLElement) ||
    !(remainingNode instanceof HTMLElement) ||
    !(progressNode instanceof HTMLInputElement) ||
    !(toggleButton instanceof HTMLButtonElement) ||
    !(audioNode instanceof HTMLAudioElement)
  ) {
    return;
  }

  audioNode.volume = 0.55;
  let currentTrackIndex = -1;

  function getRandomTrackIndex(excludeIndex = -1) {
    if (pdaTracks.length <= 1) return 0;
    let nextIndex = excludeIndex;
    while (nextIndex === excludeIndex) {
      nextIndex = Math.floor(Math.random() * pdaTracks.length);
    }
    return nextIndex;
  }

  async function loadTrack(index, { autoplay = false } = {}) {
    const track = pdaTracks[index];
    if (!track) return;
    currentTrackIndex = index;
    titleNode.textContent = track.title;
    coverNode.src = track.coverSrc;
    coverNode.alt = `${track.title} cover art`;
    audioNode.src = track.audioSrc;
    audioNode.currentTime = 0;
    progressNode.value = "0";
    paintRangeProgress(progressNode, 0);
    updateTimes();
    if (!autoplay) {
      setButtonState();
      return;
    }
    try {
      await audioNode.play();
    } catch {
      setButtonState();
    }
  }

  function updateTimes() {
    const duration = audioNode.duration;
    const current = audioNode.currentTime;
    durationNode.textContent = formatTime(duration);
    remainingNode.textContent = formatTime(duration - current);
    if (Number.isFinite(duration) && duration > 0) {
      const progressPercent = (current / duration) * 100;
      progressNode.value = progressPercent.toFixed(3);
      paintRangeProgress(progressNode, progressPercent);
    } else {
      progressNode.value = "0";
      paintRangeProgress(progressNode, 0);
    }
  }

  function setButtonState() {
    const isPlaying = !audioNode.paused;
    toggleButton.innerHTML = getToggleIconSvg(isPlaying);
    toggleButton.setAttribute("aria-label", isPlaying ? "Pause track" : "Play track");
  }

  async function randomizeTrack() {
    const wasPlaying = !audioNode.paused;
    const nextIndex = getRandomTrackIndex(currentTrackIndex);
    await loadTrack(nextIndex, { autoplay: wasPlaying });
  }

  toggleButton.addEventListener("click", async () => {
    try {
      if (audioNode.paused) {
        await audioNode.play();
      } else {
        audioNode.pause();
      }
    } catch {
      // Browser autoplay policies may block playback until direct interaction.
    }
    setButtonState();
  });

  progressNode.addEventListener("input", () => {
    const duration = audioNode.duration;
    if (!Number.isFinite(duration) || duration <= 0) return;
    const progressPercent = Number.parseFloat(progressNode.value);
    audioNode.currentTime = (progressPercent / 100) * duration;
    paintRangeProgress(progressNode, progressPercent);
    updateTimes();
  });

  progressNode.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    const duration = audioNode.duration;
    if (!Number.isFinite(duration) || duration <= 0) return;
    event.preventDefault();
    const delta = event.key === "ArrowRight" ? 10 : -10;
    const nextTime = Math.min(duration, Math.max(0, audioNode.currentTime + delta));
    audioNode.currentTime = nextTime;
    updateTimes();
  });

  audioNode.addEventListener("loadedmetadata", updateTimes);
  audioNode.addEventListener("timeupdate", updateTimes);
  audioNode.addEventListener("play", setButtonState);
  audioNode.addEventListener("pause", setButtonState);
  audioNode.addEventListener("ended", () => {
    audioNode.currentTime = 0;
    setButtonState();
    updateTimes();
  });
  window.addEventListener("pda:randomize-track", randomizeTrack);

  loadTrack(getRandomTrackIndex())
    .catch(() => {
      // Keep player responsive even if the chosen file fails.
    })
    .finally(() => {
      setButtonState();
      updateTimes();
    });
  updateTimes();
  setButtonState();
}
