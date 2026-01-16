const statusEl = document.getElementById("status");
const micStateEl = document.getElementById("mic-state");
const commandEl = document.getElementById("command");
const responseEl = document.getElementById("response");
const loginBtn = document.getElementById("login");
const logoutBtn = document.getElementById("logout");
const startBtn = document.getElementById("start");
const stopBtn = document.getElementById("stop");
const planBtn = document.getElementById("plan");
const applyBtn = document.getElementById("apply");
const rollbackBtn = document.getElementById("rollback");

let recognition;
let lastPlan = null;
const PASSCODE = "5555";
const UNLOCK_KEY = "yt-admin-unlocked";

const setStatus = (text) => {
  statusEl.textContent = text;
};

const setResponse = (payload) => {
  responseEl.textContent = JSON.stringify(payload, null, 2);
};

const getUserToken = async () => {
  const user = window.netlifyIdentity?.currentUser();
  if (!user) return null;
  return user.jwt();
};

const callOrchestrator = async (payload) => {
  const token = await getUserToken();
  const res = await fetch("/.netlify/functions/orchestrator", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
};

const initIdentity = () => {
  if (!window.netlifyIdentity) {
    setStatus("Netlify Identity not available.");
    return;
  }

  window.netlifyIdentity.on("init", (user) => {
    setStatus(user ? `Authenticated as ${user.email}` : "Not authenticated.");
  });

  window.netlifyIdentity.on("login", (user) => {
    setStatus(`Authenticated as ${user.email}`);
    window.netlifyIdentity.close();
  });

  window.netlifyIdentity.on("logout", () => {
    setStatus("Not authenticated.");
  });

  window.netlifyIdentity.init();
};

const setLockedUI = (locked) => {
  lockScreen.style.display = locked ? "grid" : "none";
  adminShell.style.filter = locked ? "blur(8px)" : "none";
  [startBtn, stopBtn, planBtn, applyBtn, rollbackBtn, commandEl].forEach((el) => {
    el.disabled = locked;
  });
};

const initPasscodeGate = () => {
  const unlocked = sessionStorage.getItem(UNLOCK_KEY) === "true";
  setLockedUI(!unlocked);

  const unlock = () => {
    if (lockInput.value.trim() === PASSCODE) {
      sessionStorage.setItem(UNLOCK_KEY, "true");
      lockError.textContent = "";
      setLockedUI(false);
      return;
    }
    lockError.textContent = "Incorrect code.";
  };

  lockButton.addEventListener("click", unlock);
  lockInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") unlock();
  });
};

const initSpeech = () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    micStateEl.textContent = "Speech recognition not supported in this browser.";
    return;
  }

  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.lang = "en-US";
  recognition.interimResults = false;

  recognition.onresult = (event) => {
    const last = event.results[event.results.length - 1];
    if (!last.isFinal) return;
    const transcript = last[0].transcript.trim();
    commandEl.value = transcript;
    micStateEl.textContent = `Captured: "${transcript}"`;
  };

  recognition.onerror = (event) => {
    micStateEl.textContent = `Mic error: ${event.error}`;
  };
};

loginBtn.addEventListener("click", () => {
  window.netlifyIdentity?.open();
});

logoutBtn.addEventListener("click", () => {
  window.netlifyIdentity?.logout();
});

startBtn.addEventListener("click", () => {
  if (!recognition) return;
  recognition.start();
  micStateEl.textContent = "Listening...";
});

stopBtn.addEventListener("click", () => {
  if (!recognition) return;
  recognition.stop();
  micStateEl.textContent = "Microphone idle.";
});

planBtn.addEventListener("click", async () => {
  try {
    const command = commandEl.value.trim();
    if (!command) return;
    setResponse({ status: "Planning..." });
    const data = await callOrchestrator({ mode: "plan", command });
    lastPlan = data;
    setResponse(data);
  } catch (err) {
    setResponse({ error: err.message });
  }
});

applyBtn.addEventListener("click", async () => {
  try {
    if (!lastPlan) {
      setResponse({ error: "Generate a plan first." });
      return;
    }
    setResponse({ status: "Creating PR..." });
    const data = await callOrchestrator({ mode: "apply", plan: lastPlan.plan, command: lastPlan.command });
    setResponse(data);
  } catch (err) {
    setResponse({ error: err.message });
  }
});

rollbackBtn.addEventListener("click", async () => {
  try {
    setResponse({ status: "Creating rollback PR..." });
    const data = await callOrchestrator({ mode: "rollback" });
    setResponse(data);
  } catch (err) {
    setResponse({ error: err.message });
  }
});

initIdentity();
initPasscodeGate();
initSpeech();
const lockScreen = document.getElementById("lock-screen");
const lockInput = document.getElementById("lock-input");
const lockButton = document.getElementById("lock-button");
const lockError = document.getElementById("lock-error");
const adminShell = document.querySelector(".admin-shell");
