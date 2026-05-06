// knappen som hopper til neste random track (trigger event som player lytter på)
export function initPdaRefreshButton() {
  const refreshButton = document.querySelector("[data-pda-refresh]");
  if (!(refreshButton instanceof HTMLButtonElement)) return;

  // sender event som pdaPlayer.js bruker for å bytte låt
  refreshButton.addEventListener("click", () => {
    window.dispatchEvent(new CustomEvent("pda:randomize-track"));
  });
}
