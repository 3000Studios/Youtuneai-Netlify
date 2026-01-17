const state = {
  eyebrow: 'AI-Driven Growth Stack',
  headline: 'Build a revenue engine that learns every visit.',
  subhead: 'Launch a conversion-obsessed experience in days: adaptive messaging, lightning-fast experiments, and a dashboard that shows impact in real time.',
  cta: 'Start the Revenue Pilot',
  price: '$149',
  metric1: '+38%',
  metric2: '2.6x',
  metric3: '10 days',
  theme: 'ember',
  testimonialsVisible: true,
};

const storageKey = 'youtuneai-state';
const controlKey = 'youtuneai-control-unlocked';
const controlPassword = '5555';
const audioTracks = [
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3',
];

const elements = {
  eyebrow: document.getElementById('eyebrow'),
  headline: document.getElementById('headline'),
  subhead: document.getElementById('subhead'),
  cta: document.getElementById('cta'),
  price: document.getElementById('price'),
  metric1: document.getElementById('metric1'),
  metric2: document.getElementById('metric2'),
  metric3: document.getElementById('metric3'),
  testimonials: document.getElementById('testimonials'),
  transcript: document.getElementById('transcript'),
  contactModal: document.getElementById('contact-modal'),
  contactClose: document.getElementById('contact-close'),
  contactLink: document.getElementById('contact-link'),
  contactFooter: document.getElementById('contact-footer'),
  contactLinkMobile: document.getElementById('contact-link-mobile'),
  cursorDot: document.getElementById('cursor-dot'),
  ticker: document.getElementById('ticker'),
  tickerData: document.getElementById('ticker-data'),
  avatar: document.getElementById('avatar'),
  menuToggle: document.getElementById('menu-toggle'),
  mobileDrawer: document.getElementById('mobile-drawer'),
  mobileLinks: document.querySelectorAll('.mobile-drawer a'),
  controlLock: document.getElementById('control-lock'),
  controlGrid: document.getElementById('control-grid'),
  controlPassword: document.getElementById('control-password'),
  controlUnlock: document.getElementById('unlock-control'),
  controlNote: document.getElementById('control-lock-note'),
  inputs: {
    headline: document.getElementById('headline-input'),
    subhead: document.getElementById('subhead-input'),
    cta: document.getElementById('cta-input'),
    price: document.getElementById('price-input'),
    theme: document.getElementById('theme-input'),
    metric1: document.getElementById('metric1-input'),
    metric2: document.getElementById('metric2-input'),
    metric3: document.getElementById('metric3-input'),
  },
};

const setText = (el, value) => {
  if (el) el.textContent = value;
};

const setInputValue = (el, value) => {
  if (el) el.value = value;
};

const applyTheme = (theme) => {
  document.documentElement.dataset.theme = theme === 'ember' ? '' : theme;
};

const isControlUnlocked = () => sessionStorage.getItem(controlKey) === 'true';

const setControlVisibility = () => {
  const unlocked = isControlUnlocked();
  if (elements.controlLock) elements.controlLock.style.display = unlocked ? 'none' : 'block';
  if (elements.controlGrid) elements.controlGrid.style.display = unlocked ? 'grid' : 'none';
};

const applyState = () => {
  setText(elements.eyebrow, state.eyebrow);
  setText(elements.headline, state.headline);
  setText(elements.subhead, state.subhead);
  setText(elements.cta, state.cta);
  setText(elements.price, state.price);
  setText(elements.metric1, state.metric1);
  setText(elements.metric2, state.metric2);
  setText(elements.metric3, state.metric3);
  if (elements.testimonials) {
    elements.testimonials.style.display = state.testimonialsVisible ? 'grid' : 'none';
  }
  applyTheme(state.theme);

  setInputValue(elements.inputs.headline, state.headline);
  setInputValue(elements.inputs.subhead, state.subhead);
  setInputValue(elements.inputs.cta, state.cta);
  setInputValue(elements.inputs.price, state.price);
  setInputValue(elements.inputs.theme, state.theme);
  setInputValue(elements.inputs.metric1, state.metric1);
  setInputValue(elements.inputs.metric2, state.metric2);
  setInputValue(elements.inputs.metric3, state.metric3);
};

const persistState = () => {
  localStorage.setItem(storageKey, JSON.stringify(state));
};

const loadState = () => {
  const saved = localStorage.getItem(storageKey);
  if (!saved) return;
  try {
    const parsed = JSON.parse(saved);
    Object.assign(state, parsed);
  } catch (err) {
    console.warn('Failed to parse saved state', err);
  }
};

const setValue = (key, value) => {
  if (!value) return;
  state[key] = value.trim();
  applyState();
  persistState();
};

const logTranscript = (text) => {
  if (elements.transcript) {
    elements.transcript.textContent = text;
  }
};

const updateFromInputs = () => {
  const read = (input, fallback) => (input ? input.value.trim() || fallback : fallback);
  state.headline = read(elements.inputs.headline, state.headline);
  state.subhead = read(elements.inputs.subhead, state.subhead);
  state.cta = read(elements.inputs.cta, state.cta);
  state.price = read(elements.inputs.price, state.price);
  state.theme = elements.inputs.theme?.value || state.theme;
  state.metric1 = read(elements.inputs.metric1, state.metric1);
  state.metric2 = read(elements.inputs.metric2, state.metric2);
  state.metric3 = read(elements.inputs.metric3, state.metric3);
  applyState();
  persistState();
};

const parseCommand = (command) => {
  const text = command.toLowerCase();

  if (text.includes('hide testimonials')) {
    state.testimonialsVisible = false;
    applyState();
    persistState();
    return;
  }
  if (text.includes('show testimonials')) {
    state.testimonialsVisible = true;
    applyState();
    persistState();
    return;
  }

  const mappings = [
    { regex: /headline to (.*)/, key: 'headline' },
    { regex: /subhead to (.*)/, key: 'subhead' },
    { regex: /cta to (.*)/, key: 'cta' },
    { regex: /price to (.*)/, key: 'price' },
    { regex: /metric one to (.*)/, key: 'metric1' },
    { regex: /metric two to (.*)/, key: 'metric2' },
    { regex: /metric three to (.*)/, key: 'metric3' },
    { regex: /theme to (ember|ocean|volt|midnight)/, key: 'theme' },
  ];

  for (const mapping of mappings) {
    const match = command.match(mapping.regex);
    if (match && match[1]) {
      setValue(mapping.key, match[1]);
      return;
    }
  }
};

const setupVoice = () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    logTranscript('Speech recognition not supported in this browser.');
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.lang = 'en-US';
  recognition.interimResults = false;

  recognition.onresult = (event) => {
    const last = event.results[event.results.length - 1];
    if (!last.isFinal) return;
    const transcript = last[0].transcript.trim();
    logTranscript(transcript);
    parseCommand(transcript);
  };

  recognition.onerror = (event) => {
    logTranscript(`Voice error: ${event.error}`);
  };

  return recognition;
};

const setupReveal = () => {
  const sections = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.2 });
  sections.forEach((section) => observer.observe(section));
};

const setupCursor = () => {
  if (!elements.cursorDot) return;
  window.addEventListener('pointermove', (e) => {
    elements.cursorDot.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
  });
};

const setupContactModal = () => {
  const open = () => elements.contactModal?.classList.add('show');
  const close = () => elements.contactModal?.classList.remove('show');
  elements.contactLink?.addEventListener('click', (e) => { e.preventDefault(); open(); });
  elements.contactFooter?.addEventListener('click', (e) => { e.preventDefault(); open(); });
  elements.contactLinkMobile?.addEventListener('click', (e) => { e.preventDefault(); open(); });
  elements.contactClose?.addEventListener('click', close);
  elements.contactModal?.addEventListener('click', (e) => {
    if (e.target === elements.contactModal) close();
  });
};

const setupAudio = () => {
  if (!audioTracks.length) return;
  const audio = new Audio();
  const pick = () => audioTracks[Math.floor(Math.random() * audioTracks.length)];
  audio.src = pick();
  audio.loop = true;
  audio.volume = 0.15;
  audio.autoplay = true;
  audio.addEventListener('ended', () => {
    audio.src = pick();
    audio.play().catch(() => {});
  });
  audio.play().catch(() => {});
};

const setupTicker = () => {
  if (!elements.ticker || !elements.tickerData) return;
  const url = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd';
  const update = async () => {
    try {
      const res = await fetch(url);
      const data = await res.json();
      const items = Object.entries(data).map(([k, v]) => `${k.toUpperCase()}: $${(v.usd || 0).toLocaleString()}`);
      elements.tickerData.textContent = items.join('   |   ');
    } catch (e) {
      elements.tickerData.textContent = 'Live market data unavailable';
    }
  };
  update();
  setInterval(update, 45000);
};

const setupAvatar = () => {
  const avatar = elements.avatar;
  if (!avatar) return;
  let dragging = false;
  let offsetX = 0;
  let offsetY = 0;

  const start = (e) => {
    dragging = true;
    avatar.style.cursor = 'grabbing';
    offsetX = e.clientX - avatar.offsetLeft;
    offsetY = e.clientY - avatar.offsetTop;
  };
  const move = (e) => {
    if (!dragging) return;
    avatar.style.left = `${e.clientX - offsetX}px`;
    avatar.style.top = `${e.clientY - offsetY}px`;
  };
  const end = () => {
    dragging = false;
    avatar.style.cursor = 'grab';
  };
  avatar.addEventListener('pointerdown', start);
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', end);

  window.addEventListener('deviceorientation', (e) => {
    const tiltX = e.gamma || 0;
    const tiltY = e.beta || 0;
    avatar.style.transform = `rotateX(${tiltY * 0.02}deg) rotateY(${tiltX * 0.02}deg)`;
  });
};

const setupMobileNav = () => {
  if (!elements.menuToggle || !elements.mobileDrawer) return;
  const toggle = () => elements.mobileDrawer.classList.toggle('show');
  const close = () => elements.mobileDrawer.classList.remove('show');
  elements.menuToggle.addEventListener('click', toggle);
  elements.mobileDrawer.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') close();
  });
  elements.mobileLinks.forEach((link) => link.addEventListener('click', close));
};

const init = () => {
  loadState();
  applyState();
  setupReveal();
  setControlVisibility();
  setupCursor();
  setupContactModal();
  setupAudio();
  setupTicker();
  setupAvatar();
  setupMobileNav();

  const recognition = setupVoice();
  const startButton = document.getElementById('start-voice');
  const stopButton = document.getElementById('stop-voice');
  const applyButton = document.getElementById('apply');

  if (startButton && recognition) {
    startButton.addEventListener('click', () => {
      recognition.start();
      logTranscript('Listening...');
    });
  }

  if (stopButton && recognition) {
    stopButton.addEventListener('click', () => {
      recognition.stop();
      logTranscript('Stopped.');
    });
  }

  if (applyButton) {
    applyButton.addEventListener('click', updateFromInputs);
  }

  if (elements.controlUnlock && elements.controlPassword && elements.controlNote) {
    elements.controlUnlock.addEventListener('click', () => {
      const value = elements.controlPassword.value.trim();
      if (value === controlPassword) {
        sessionStorage.setItem(controlKey, 'true');
        elements.controlPassword.value = '';
        elements.controlNote.textContent = '';
        setControlVisibility();
        return;
      }
      elements.controlNote.textContent = 'Incorrect access code.';
    });
  }
};

init();
