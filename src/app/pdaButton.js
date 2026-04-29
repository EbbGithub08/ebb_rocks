export function initPdaRefreshButton() {
  const refreshButton = document.querySelector("[data-pda-refresh]");
  if (!(refreshButton instanceof HTMLButtonElement)) return;

  refreshButton.addEventListener("click", () => {
    window.dispatchEvent(new CustomEvent("pda:randomize-track"));
  });
}
