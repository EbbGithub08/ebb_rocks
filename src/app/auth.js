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
  let authLockTimerId = null;

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

  function beginAuthOperation() {
    authInFlight = true;
    setAuthControlsDisabled(true);
    if (authLockTimerId !== null) {
      window.clearTimeout(authLockTimerId);
    }
    // Prevent permanent UI lock if provider calls hang.
    authLockTimerId = window.setTimeout(() => {
      authInFlight = false;
      setAuthControlsDisabled(false);
      setStatus("Auth request took too long. Please try again.");
      authLockTimerId = null;
    }, 20000);
  }

  function endAuthOperation() {
    authInFlight = false;
    setAuthControlsDisabled(false);
    if (authLockTimerId !== null) {
      window.clearTimeout(authLockTimerId);
      authLockTimerId = null;
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
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      setDbWarningVisible(true, error.message || "Could not contact auth service.");
      setStatus("Not logged in");
      return;
    }
    const user = data?.session?.user ?? null;
    setDbWarningVisible(false);
    if (!user) {
      setStatus("Not logged in");
      return;
    }
    setStatus(`Logged in as ${user.email || "your account"}`);
  }

  async function handleAuth(action) {
    if (authInFlight) return;
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (!email || !password) {
      setStatus("Enter email and password");
      return;
    }

    beginAuthOperation();
    setStatus("Working...");
    try {
      if (action === "register") {
        const signUp = await withTimeout(supabase.auth.signUp({ email, password }), 15000);
        if (signUp.error) {
          throw new Error(signUp.error.message || "Registration failed");
        }
      }

      const login = await withTimeout(supabase.auth.signInWithPassword({ email, password }), 15000);
      if (login.error) {
        throw new Error(login.error.message || "Login failed");
      }

      const loggedInEmail = login.data?.user?.email || email;
      setStatus(`Logged in as ${loggedInEmail}`);
      passwordInput.value = "";
    } catch (error) {
      setStatus(error.message || "Authentication failed");
    } finally {
      endAuthOperation();
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
    if (authInFlight) {
      setStatus("Please wait...");
      return;
    }
    try {
      const { data } = await supabase.auth.getSession();
      if (!data?.session?.user) {
        setStatus("Already logged out");
        return;
      }
      beginAuthOperation();
      setStatus("Not logged in");
      const { error } = await withTimeout(supabase.auth.signOut({ scope: "local" }), 8000);
      if (error) {
        setStatus(error.message || "Logout failed");
      }
    } catch (error) {
      setStatus("Logout failed");
    } finally {
      if (authInFlight) {
        endAuthOperation();
      }
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
