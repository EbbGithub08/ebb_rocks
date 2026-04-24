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
  const authButtons = [loginButton, registerButton, logoutButton].filter(
    (button) => button instanceof HTMLButtonElement,
  );
  let authInFlight = false;

  if (!(emailInput instanceof HTMLInputElement) || !(passwordInput instanceof HTMLInputElement)) {
    return;
  }

  function setStatus(message) {
    statusNode.textContent = message;
  }

  function setAuthControlsDisabled(disabled) {
    for (const button of authButtons) {
      button.disabled = disabled;
    }
  }

  async function withTimeout(promise, timeoutMs) {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = window.setTimeout(() => {
        reject(new Error("Auth request timed out. Check connection and try again."));
      }, timeoutMs);
    });
    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      window.clearTimeout(timeoutId);
    }
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
    try {
      const { data, error } = await withTimeout(supabase.auth.getSession(), 8000);
      if (error) {
        throw new Error(error.message || "Failed to read auth session");
      }
      const user = data?.session?.user ?? null;
      setDbWarningVisible(false);
      if (!user) {
        setStatus("Not logged in");
        return;
      }
      setStatus(`Logged in as ${user.email || "your account"}`);
    } catch (error) {
      setDbWarningVisible(true, "Auth service is not responding right now. Try again in a moment.");
      setStatus(error.message || "Could not check login status");
    }
  }

  async function handleAuth(action) {
    if (authInFlight) return;
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (!email || !password) {
      setStatus("Enter email and password");
      return;
    }

    authInFlight = true;
    setAuthControlsDisabled(true);
    setStatus("Working...");
    try {
      const response = await withTimeout(
        action === "register"
          ? supabase.auth.signUp({ email, password })
          : supabase.auth.signInWithPassword({ email, password }),
        15000,
      );

      if (response.error) {
        throw new Error(response.error.message || "Authentication failed");
      }

      const session = response.data?.session ?? null;
      const user = response.data?.user ?? null;

      if (action === "register") {
        passwordInput.value = "";
        if (!session) {
          setStatus("Account created. Check your email to confirm before logging in.");
          return;
        }
        setStatus(`Logged in as ${user?.email || email}`);
        return;
      }

      if (!session || !user) {
        throw new Error("Login did not create a session. Check email confirmation and try again.");
      }

      setStatus(`Logged in as ${user.email || email}`);
      passwordInput.value = "";
    } catch (error) {
      setStatus(error.message || "Login failed");
    } finally {
      authInFlight = false;
      setAuthControlsDisabled(false);
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
    if (authInFlight) return;
    authInFlight = true;
    setAuthControlsDisabled(true);
    setStatus("Working...");
    try {
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (!error) {
        setStatus("Logged out");
        return;
      }
      setStatus(error.message || "Logout failed");
    } catch (error) {
      setStatus(error.message || "Logout failed");
    } finally {
      authInFlight = false;
      setAuthControlsDisabled(false);
    }
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    setDbWarningVisible(false);
    const user = session?.user ?? null;
    if (!user) {
      setStatus("Not logged in");
      return;
    }
    setStatus(`Logged in as ${user.email || "your account"}`);
  });

  setStatus("Checking login status...");
  refreshCurrentUser().catch(() => setStatus("Not logged in"));
}
