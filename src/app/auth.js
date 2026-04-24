import { supabase } from "./supabase.js";

export function initAuthPanel() {
  const panel = document.querySelector("[data-auth-panel]");
  const form = document.querySelector("[data-auth-form]");
  const statusNode = document.querySelector("[data-auth-status]");
  const dbWarningNode = document.querySelector("[data-db-warning]");
  if (!panel || !form || !statusNode) return;

  const emailInput = form.elements.namedItem("email");
  const passwordInput = form.elements.namedItem("password");
  const loginButton = form.querySelector('[data-auth-action="login"]');
  const registerButton = form.querySelector('[data-auth-action="register"]');
  const logoutButton = form.querySelector('[data-auth-action="logout"]');

  if (!(emailInput instanceof HTMLInputElement) || !(passwordInput instanceof HTMLInputElement)) {
    return;
  }

  function setStatus(message) {
    statusNode.textContent = message;
  }

  function setDbWarningVisible(visible, message = "Login backend is unavailable right now.") {
    if (!dbWarningNode) return;
    dbWarningNode.textContent = message;
    dbWarningNode.hidden = !visible;
  }

  if (!supabase) {
    setDbWarningVisible(true, "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
    setStatus("Login is disabled");
    return;
  }

  async function refreshCurrentUser() {
    setDbWarningVisible(false);
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      setStatus("Not logged in");
      return;
    }
    setStatus(`Logged in as ${data.user.email}`);
  }

  async function handleAuth(action) {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (!email || !password) {
      setStatus("Enter email and password");
      return;
    }

    setStatus("Working...");
    try {
      const response =
        action === "register"
          ? await supabase.auth.signUp({ email, password })
          : await supabase.auth.signInWithPassword({ email, password });

      if (response.error) {
        throw new Error(response.error.message || "Authentication failed");
      }

      const userEmail = response.data.user?.email || email;
      setStatus(`Logged in as ${userEmail}`);
      passwordInput.value = "";
    } catch (error) {
      setStatus(error.message || "Login failed");
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    await handleAuth("login");
  });

  loginButton?.addEventListener("click", async () => {
    await handleAuth("login");
  });

  registerButton?.addEventListener("click", async () => {
    await handleAuth("register");
  });

  logoutButton?.addEventListener("click", async () => {
    setStatus("Working...");
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setStatus("Logged out");
      return;
    }
    setStatus(error.message || "Logout failed");
  });

  refreshCurrentUser().catch(() => setStatus("Not logged in"));
}
