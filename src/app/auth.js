import { supabase } from "./supabase.js";

// starter auth-panelet og kobler alt sammen
export function initAuthPanel() {
  const panel = document.querySelector("[data-auth-panel]");
  const form = document.querySelector("[data-auth-form]");
  const statusNode = document.querySelector("[data-auth-status]");
  const dbWarningNode = document.querySelector("[data-db-warning]");
  const scrollNav = document.querySelector("[data-scroll-nav]");
  const scrollUserNode = document.querySelector("[data-scroll-user]");
  const scrollLogoutButton = document.querySelector("[data-scroll-logout]");
  if (!panel || !form || !statusNode) return;

  const emailInput = form.elements.namedItem("email");
  const passwordInput = form.elements.namedItem("password");
  const emailField = emailInput instanceof HTMLInputElement ? emailInput.closest(".auth-panel__field") : null;
  const passwordField = passwordInput instanceof HTMLInputElement ? passwordInput.closest(".auth-panel__field") : null;
  const loginButton = form.querySelector('[data-auth-action="login"]');
  const registerButton = form.querySelector('[data-auth-action="register"]');
  const logoutButton = form.querySelector('[data-auth-action="logout"]');
  const authButtons = [loginButton, registerButton, logoutButton].filter(
    (button) => button instanceof HTMLButtonElement,
  );
  let currentUser = null;
  let authInFlight = false;
  let authLockTimerId = null;

  if (!(emailInput instanceof HTMLInputElement) || !(passwordInput instanceof HTMLInputElement)) {
    return;
  }

  // viser en enkel statusmelding i ui
  function setStatus(message) {
    statusNode.textContent = message;
  }

  // viser hvem som er logget inn i scroll-nav
  function setScrollUserText(user) {
    if (!(scrollUserNode instanceof HTMLElement)) return;
    scrollUserNode.textContent = user?.email ? `Logged in: ${user.email}` : "Not logged in";
  }

  // viser eller skjuler felter og knapper ut fra login-status / KI generert
  function syncAuthVisibility(user) {
    currentUser = user ?? null;
    const loggedIn = Boolean(user);
    panel.hidden = loggedIn;
    if (emailField instanceof HTMLElement) {
      emailField.hidden = loggedIn;
    }
    if (passwordField instanceof HTMLElement) {
      passwordField.hidden = loggedIn;
    }
    if (loginButton instanceof HTMLButtonElement) {
      loginButton.hidden = loggedIn;
    }
    if (registerButton instanceof HTMLButtonElement) {
      registerButton.hidden = loggedIn;
    }
    if (logoutButton instanceof HTMLButtonElement) {
      logoutButton.hidden = !loggedIn;
    }
    if (scrollLogoutButton instanceof HTMLButtonElement) {
      scrollLogoutButton.hidden = !loggedIn;
    }
    setScrollUserText(user);
  }

  // skrur av eller på auth-knapper mens noe kjører / KI forslag
  function setAuthControlsDisabled(disabled) {
    for (const button of authButtons) {
      button.disabled = disabled;
    }
    if (scrollLogoutButton instanceof HTMLButtonElement) {
      scrollLogoutButton.disabled = disabled;
    }
  }

  // viser scroll-nav når siden er scrollet nok / KI generert
  function syncScrollNavVisibility() {
    if (!(scrollNav instanceof HTMLElement)) return;
    const shouldShow = window.scrollY > 120;
    scrollNav.classList.toggle("scroll-nav--visible", shouldShow);
    scrollNav.setAttribute("aria-hidden", shouldShow ? "false" : "true");
    if (scrollLogoutButton instanceof HTMLButtonElement) {
      scrollLogoutButton.tabIndex = shouldShow && Boolean(currentUser) ? 0 : -1;
    }
  }

  // starter en auth-operasjon og låser ui midlertidig
  function beginAuthOperation() {
    authInFlight = true;
    setAuthControlsDisabled(true);
    if (authLockTimerId !== null) {
      window.clearTimeout(authLockTimerId);
    }
    // KI forslag for å unngå permanent UI-låsning hvis provider kaller hang.
    authLockTimerId = window.setTimeout(() => {
      authInFlight = false;
      setAuthControlsDisabled(false);
      setStatus("Auth request took too long. Please try again.");
      authLockTimerId = null;
    }, 20000);
  }

  // avslutter auth-operasjon og åpner ui igjen
  function endAuthOperation() {
    authInFlight = false;
    setAuthControlsDisabled(false);
    if (authLockTimerId !== null) {
      window.clearTimeout(authLockTimerId);
      authLockTimerId = null;
    }
  }

  // kjører et kall med timeout så det ikke henger for lenge
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

  // viser eller skjuler advarsel om backend/auth
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

  // henter innlogget bruker fra nåværende sesjon
  async function getCurrentUser() {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      throw new Error(error.message || "Could not contact auth service.");
    }
    return data?.session?.user ?? null;
  }

  // håndterer login eller registrering
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

  // logger ut brukeren
  async function handleLogout() {
    if (authInFlight) {
      setStatus("Please wait...");
      return;
    }
    beginAuthOperation();
    try {
      const user = await withTimeout(getCurrentUser(), 8000);
      if (!user) {
        setStatus("Already logged out");
        return;
      }
      const { error } = await withTimeout(supabase.auth.signOut({ scope: "global" }), 8000);
      if (error) {
        setStatus(error.message || "Logout failed");
      } else {
        setStatus("Not logged in");
      }
    } catch (error) {
      setStatus(error.message || "Logout failed");
    } finally {
      endAuthOperation();
    }
  }

  logoutButton?.addEventListener("click", handleLogout);
  scrollLogoutButton?.addEventListener("click", handleLogout);

  window.addEventListener("scroll", syncScrollNavVisibility, { passive: true });
  syncScrollNavVisibility();

  supabase.auth.onAuthStateChange((_event, session) => {
    const user = session?.user ?? null;
    setDbWarningVisible(false);
    syncAuthVisibility(user);
    setStatus(user ? "" : "Not logged in");
  });

  getCurrentUser()
    .then((user) => {
      syncAuthVisibility(user);
      setStatus(user ? "" : "Not logged in");
    })
    .catch(() => {
      syncAuthVisibility(null);
      setStatus("Not logged in");
    });
}
