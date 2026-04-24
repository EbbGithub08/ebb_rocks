import { supabase } from "./supabase.js";

const ADMIN_EMAIL = "ebbe.gaston.zelow@gmail.com";

function displayNameFromEmail(email) {
  if (!email) return "Unknown user";
  return email.split("@")[0];
}

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
}

async function withTimeout(promise, timeoutMs, message) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => {
      reject(new Error(message));
    }, timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export function initComments() {
  const list = document.querySelector("#comments-thread");
  const form = document.querySelector("[data-comments-form]");
  const status = document.querySelector("[data-comments-status]");
  if (!list || !form || !status) return;

  const commentInput = form.elements.namedItem("comment");
  if (!(commentInput instanceof HTMLTextAreaElement)) return;

  let currentUser = null;

  function setStatus(message) {
    status.textContent = message;
  }

  function isAdmin(user) {
    return user?.email?.toLowerCase() === ADMIN_EMAIL;
  }

  function canPost() {
    return Boolean(supabase && currentUser);
  }

  function syncComposerState() {
    const enabled = canPost();
    commentInput.disabled = !enabled;
    const submit = form.querySelector('button[type="submit"]');
    if (submit instanceof HTMLButtonElement) {
      submit.disabled = !enabled;
    }
    if (!supabase) {
      setStatus("Comments are unavailable: Supabase is not configured.");
      return;
    }
    if (!currentUser) {
      setStatus("Login to post a comment.");
      return;
    }
    setStatus("Ready to post.");
  }

  function renderComments(items) {
    list.textContent = "";
    if (!items.length) {
      const empty = document.createElement("li");
      empty.className = "comment-item comment-item--empty";
      empty.textContent = "No comments yet.";
      list.append(empty);
      return;
    }

    for (const item of items) {
      const li = document.createElement("li");
      li.className = "comment-item";

      const header = document.createElement("div");
      header.className = "comment-item__header";

      const name = document.createElement("p");
      name.className = "comment-item__name";
      name.textContent = item.author_name || displayNameFromEmail(item.author_email);
      header.append(name);

      const meta = document.createElement("p");
      meta.className = "comment-item__meta";
      meta.textContent = formatTime(item.created_at);
      header.append(meta);

      if (isAdmin(currentUser)) {
        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "comment-item__delete";
        deleteBtn.textContent = "Delete";
        deleteBtn.addEventListener("click", async () => {
          const { error } = await supabase.from("comments").delete().eq("id", item.id);
          if (error) {
            setStatus(error.message || "Delete failed");
            return;
          }
          setStatus("Comment deleted.");
          await loadComments();
        });
        header.append(deleteBtn);
      }

      const body = document.createElement("p");
      body.className = "comment-item__body";
      body.textContent = item.body;

      li.append(header, body);
      list.append(li);
    }
  }

  async function loadComments() {
    if (!supabase) return;
    const { data, error } = await withTimeout(
      supabase.from("comments").select("id, author_email, author_name, body, created_at").order("created_at", { ascending: true }),
      12000,
      "Comments request timed out. Please refresh and try again.",
    );
    if (error) {
      setStatus(error.message || "Failed to load comments");
      renderComments([]);
      return;
    }
    renderComments(data || []);
  }

  async function refreshCurrentUser() {
    if (!supabase) {
      currentUser = null;
      syncComposerState();
      return;
    }
    const { data } = await supabase.auth.getSession();
    currentUser = data?.session?.user ?? null;
    syncComposerState();
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!supabase || !currentUser) {
      setStatus("Login to post a comment.");
      return;
    }
    const body = commentInput.value.trim();
    if (!body) {
      setStatus("Comment cannot be empty.");
      return;
    }

    setStatus("Posting...");
    const authorEmail = currentUser.email || "";
    const authorName = currentUser.user_metadata?.name || displayNameFromEmail(authorEmail);
    const { error } = await supabase.from("comments").insert({
      user_id: currentUser.id,
      author_email: authorEmail,
      author_name: authorName,
      body,
    });
    if (error) {
      setStatus(error.message || "Failed to post comment.");
      return;
    }
    commentInput.value = "";
    setStatus("Comment posted.");
    await loadComments();
  });

  if (supabase) {
    supabase.auth.onAuthStateChange(async () => {
      await refreshCurrentUser();
      await loadComments();
    });
  }

  refreshCurrentUser().then(loadComments);
}
