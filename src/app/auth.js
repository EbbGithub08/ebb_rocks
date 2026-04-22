import { apiFetch } from "./api.js";

async function parseJson(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

async function postAuth(path, body) {
  const res = await apiFetch(path, {
    method: "POST",
    credentials: "include",
    body,
  });
  const payload = await parseJson(res);
  if (!res.ok) {
    throw new Error(payload.error || "Authentication request failed");
  }
  return payload;
}

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

  function setDbWarningVisible(visible) {
    if (!dbWarningNode) return;
    dbWarningNode.hidden = !visible;
  }

  async function checkDatabaseHealth() {
    try {
      const res = await apiFetch("/api/db/health");
      if (res.ok) {
        setDbWarningVisible(false);
        return true;
      }
      setDbWarningVisible(true);
      return false;
    } catch {
      setDbWarningVisible(true);
      return false;
    }
  }

  async function refreshCurrentUser() {
    const dbOk = await checkDatabaseHealth();
    if (!dbOk) {
      setStatus("Database offline - login disabled");
      return;
    }

    const res = await apiFetch("/api/auth/me", { credentials: "include" });
    const payload = await parseJson(res);
    if (!res.ok) {
      setStatus("Not logged in");
      return;
    }
    setStatus(`Logged in as ${payload.user.email}`);
  }

  async function handleAuth(action) {
    const dbOk = await checkDatabaseHealth();
    if (!dbOk) {
      setStatus("Cannot login while database is offline");
      return;
    }

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (!email || !password) {
      setStatus("Enter email and password");
      return;
    }

    setStatus("Working...");
    try {
      const endpoint = action === "register" ? "/api/auth/register" : "/api/auth/login";
      const payload = await postAuth(endpoint, { email, password });
      setStatus(`Logged in as ${payload.user.email}`);
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
    const res = await apiFetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    if (res.ok) {
      setStatus("Logged out");
      return;
    }
    const payload = await parseJson(res);
    setStatus(payload.error || "Logout failed");
  });

  refreshCurrentUser().catch(() => setStatus("Not logged in"));
}
