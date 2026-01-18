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
const lockScreen = document.getElementById("lock-screen");
const lockInput = document.getElementById("lock-input");
const lockButton = document.getElementById("lock-button");
const lockError = document.getElementById("lock-error");
const adminShell = document.querySelector(".admin-shell");
const previewStage = document.getElementById("preview-stage");
const previewHeadline = document.getElementById("preview-headline");
const previewSubhead = document.getElementById("preview-subhead");
const previewEyebrow = document.getElementById("preview-eyebrow");
const previewCta = document.getElementById("preview-cta");
const previewReset = document.getElementById("preview-reset");
const previewSpeak = document.getElementById("preview-speak");
const previewExtras = document.getElementById("preview-extras");

let recognition;
let lastPlan = null;
const PASSCODE = "5555";
const UNLOCK_KEY = "yt-admin-unlocked";
const positiveWords = ["apply now", "ship it", "go ahead", "do it", "yes", "confirm", "send it"];

const colors = new Set([
  "red",
  "blue",
  "green",
  "yellow",
  "purple",
  "orange",
  "pink",
  "teal",
  "cyan",
  "white",
  "black",
  "gray",
  "grey",
]);

const setStatus = (text) => {
  statusEl.textContent = text;
};

const setResponse = (payload) => {
  responseEl.textContent = JSON.stringify(payload, null, 2);
};

const speak = (text) => {
  if (!("speechSynthesis" in window)) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 1;
  speechSynthesis.cancel();
  speechSynthesis.speak(utter);
};

const resetPreview = () => {
  if (!previewStage) return;
  previewEyebrow.textContent = "AI-Driven Growth Stack";
  previewHeadline.textContent = "Build a revenue engine that learns every visit.";
  previewSubhead.textContent = "Adaptive messaging, live experiments, and telemetry built in.";
  previewCta.textContent = "Start the Revenue Pilot";
  previewStage.style.background = "";
  previewHeadline.style.color = "";
  previewHeadline.style.borderRadius = "";
  previewStage.classList.remove("hover-spin");
};

const applyLocalPreview = (command) => {
  if (!command || !previewStage) return;
  if (previewExtras) previewExtras.innerHTML = "";
  const text = command.toLowerCase();
  const urlMatch = command.match(/https?:\/\/\S+/);
  const hexMatch = command.match(/#([0-9a-fA-F]{3,6})/);
  const sayMatch = command.match(/say\s+(.+)/i);
  const fontMatch = command.match(/font\s+(to|is|=)?\s*([a-zA-Z0-9\s-]+)/i);

  // headline changes
  if (text.includes("headline") || text.includes("top text")) {
    previewHeadline.textContent = command;
  }
  if (sayMatch) {
    previewHeadline.textContent = sayMatch[1].trim();
  }

  // subhead changes
  if (text.includes("subhead") || text.includes("subtitle")) {
    previewSubhead.textContent = command;
  }

  // CTA changes
  if (text.includes("cta") || text.includes("button")) {
    previewCta.textContent = command;
  }

  // colors
  colors.forEach((c) => {
    if (text.includes(c)) {
      previewHeadline.style.color = c;
      previewCta.style.background = c;
    }
  });
  if (hexMatch) {
    previewHeadline.style.color = `#${hexMatch[1]}`;
    previewCta.style.background = `#${hexMatch[1]}`;
  }

  // font changes
  if (fontMatch) {
    previewHeadline.style.fontFamily = `'${fontMatch[2].trim()}', "Playfair Display", serif`;
  }

  // circles / rounded
  if (text.includes("circle")) {
    previewHeadline.style.borderRadius = "50px";
    previewCta.style.borderRadius = "999px";
  }

  // hover effects
  if (text.includes("hover")) {
    previewStage.classList.add("hover-spin");
  }

  // background hue
  if (text.includes("blue")) {
    previewStage.style.background = "linear-gradient(135deg, rgba(80,120,255,0.15), rgba(20,30,60,0.6))";
  }

  if (previewExtras && urlMatch) {
    if (text.includes("video")) {
      const block = document.createElement("div");
      block.className = "preview-extra-card";
      block.innerHTML = `<h4>Video</h4><video controls muted playsinline style="width:100%;border-radius:12px;"><source src="${urlMatch[0]}" type="video/mp4"></video>`;
      previewExtras.appendChild(block);
    } else if (text.includes("music") || text.includes("audio")) {
      const block = document.createElement("div");
      block.className = "preview-extra-card";
      block.innerHTML = `<h4>Audio</h4><audio controls src="${urlMatch[0]}"></audio>`;
      previewExtras.appendChild(block);
    } else if (text.includes("image") || text.includes("picture")) {
      const block = document.createElement("div");
      block.className = "preview-extra-card";
      block.innerHTML = `<h4>Image</h4><img src="${urlMatch[0]}" style="width:100%;border-radius:12px;" alt="Preview image">`;
      previewExtras.appendChild(block);
    }
  }
};

const clearExtras = () => {
  if (previewExtras) previewExtras.innerHTML = "";
};

const applyActionsPreview = (actions = []) => {
  clearExtras();
  actions.forEach((action) => {
    if (action.type === "update_copy") {
      if (action.field === "headline") previewHeadline.textContent = action.value;
      if (action.field === "subhead") previewSubhead.textContent = action.value;
      if (action.field === "cta") previewCta.textContent = action.value;
    }
    if (action.type === "update_meta" && action.title) {
      previewEyebrow.textContent = action.title;
    }
    if (action.type === "update_theme") {
      previewStage.dataset.theme = action.theme;
    }
    if (action.type === "update_background_video") {
      previewStage.style.background = `linear-gradient(135deg, rgba(0,0,0,0.35), rgba(0,0,0,0.55)), url('${action.src}') center/cover`;
    }
    if (action.type === "update_wallpaper") {
      previewStage.style.background = `url('${action.src}') center/cover`;
    }
    if (action.type === "update_avatar") {
      if (previewExtras) {
        const img = document.createElement("img");
        img.src = action.src;
        img.alt = "Avatar";
        img.style.width = "120px";
        img.style.borderRadius = "16px";
        previewExtras.appendChild(img);
      }
    }
    if (action.type === "insert_section") {
      if (previewExtras) {
        const block = document.createElement("div");
        block.className = "preview-extra-card";
        block.innerHTML = `<h4>${action.title || action.id || "Section"}</h4><p>${action.body || ""}</p>`;
        previewExtras.appendChild(block);
      }
    }
    if (action.type === "insert_video") {
      if (previewExtras) {
        const block = document.createElement("div");
        block.className = "preview-extra-card";
        block.innerHTML = `<h4>${action.title || "Video"}</h4><video controls muted playsinline style="width:100%;border-radius:12px;"><source src="${action.src}" type="video/mp4"></video>`;
        previewExtras.appendChild(block);
      }
    }
    if (action.type === "insert_stream") {
      if (previewExtras) {
        const block = document.createElement("div");
        block.className = "preview-extra-card";
        block.innerHTML = `<h4>${action.title || "Livestream"}</h4><div class="embed"><iframe src="${action.url}" style="width:100%;height:200px;border:0;border-radius:12px;" allowfullscreen></iframe></div>`;
        previewExtras.appendChild(block);
      }
    }
    if (action.type === "add_product") {
      if (previewExtras) {
        const block = document.createElement("div");
        block.className = "preview-extra-card";
        block.innerHTML = `<h4>${action.name || "Product"}</h4><p>${action.description || ""}</p><strong>${action.price || ""}</strong>`;
        previewExtras.appendChild(block);
      }
    }
    if (action.type === "insert_monetization") {
      if (previewExtras) {
        const block = document.createElement("div");
        block.className = "preview-extra-card";
        block.innerHTML = `<h4>${action.headline || "Monetize"}</h4><p>${action.description || ""}</p><button class="primary">${action.cta || "Get the offer"}</button>`;
        previewExtras.appendChild(block);
      }
    }
  });
  speak("Preview updated");
};

const callOrchestrator = async (payload) => {
  const res = await fetch("/.netlify/functions/orchestrator", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
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
  setStatus("Cloudflare mode: use the access code to unlock controls.");
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
      speak("Controls unlocked");
      return;
    }
    lockError.textContent = "Incorrect code.";
    speak("Incorrect code");
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

    const lower = transcript.toLowerCase();
    if (positiveWords.some((p) => lower.includes(p)) && lastPlan) {
      applyBtn.click();
    }
  };

  recognition.onerror = (event) => {
    micStateEl.textContent = `Mic error: ${event.error}`;
  };
};

if (loginBtn) {
  loginBtn.addEventListener("click", () => {
    setStatus("Cloudflare mode active; login not required.");
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    setStatus("Cloudflare mode active; login not required.");
  });
}

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
    applyLocalPreview(command);
    const data = await callOrchestrator({ mode: "plan", command });
    lastPlan = data;
    setResponse(data);
    if (data.plan?.actions) {
      applyActionsPreview(data.plan.actions);
    }
    speak("Plan ready. Say apply now to ship it.");
  } catch (err) {
    setResponse({ error: err.message });
    speak("Planning failed");
  }
});

applyBtn.addEventListener("click", async () => {
  try {
    if (!lastPlan) {
      // If no plan yet, run a quick plan with the current command value.
      const fallbackCommand = commandEl.value.trim();
      if (!fallbackCommand) {
        setResponse({ error: "Provide a command first." });
        return;
      }
      const data = await callOrchestrator({ mode: "plan", command: fallbackCommand });
      lastPlan = data;
    }
    setResponse({ status: "Applying live to production..." });
    const data = await callOrchestrator({ mode: "apply", plan: lastPlan.plan, command: lastPlan.command });
    setResponse(data);
    speak("Applied live");
  } catch (err) {
    setResponse({ error: err.message });
    speak("Apply failed");
  }
});

rollbackBtn.addEventListener("click", async () => {
  try {
    setResponse({ status: "Rollback disabled in live mode." });
    speak("Rollback disabled");
  } catch (err) {
    setResponse({ error: err.message });
    speak("Rollback failed");
  }
});

initIdentity();
initPasscodeGate();
initSpeech();

if (previewReset) {
  previewReset.addEventListener("click", () => resetPreview());
}

if (previewSpeak) {
  previewSpeak.addEventListener("click", () => {
    const summary = `${previewHeadline.textContent}. ${previewSubhead.textContent}. Call to action: ${previewCta.textContent}`;
    speak(summary);
  });
}
