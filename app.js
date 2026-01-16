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

const applyTheme = (theme) => {
  document.documentElement.dataset.theme = theme === 'ember' ? '' : theme;
};

const isControlUnlocked = () => sessionStorage.getItem(controlKey) === 'true';

const setControlVisibility = () => {
  const unlocked = isControlUnlocked();
  elements.controlLock.style.display = unlocked ? 'none' : 'block';
  elements.controlGrid.style.display = unlocked ? 'grid' : 'none';
};

const applyState = () => {
  elements.eyebrow.textContent = state.eyebrow;
  elements.headline.textContent = state.headline;
  elements.subhead.textContent = state.subhead;
  elements.cta.textContent = state.cta;
  elements.price.textContent = state.price;
  elements.metric1.textContent = state.metric1;
  elements.metric2.textContent = state.metric2;
  elements.metric3.textContent = state.metric3;
  elements.testimonials.style.display = state.testimonialsVisible ? 'grid' : 'none';
  applyTheme(state.theme);

  elements.inputs.headline.value = state.headline;
  elements.inputs.subhead.value = state.subhead;
  elements.inputs.cta.value = state.cta;
  elements.inputs.price.value = state.price;
  elements.inputs.theme.value = state.theme;
  elements.inputs.metric1.value = state.metric1;
  elements.inputs.metric2.value = state.metric2;
  elements.inputs.metric3.value = state.metric3;
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

const updateFromInputs = () => {
  state.headline = elements.inputs.headline.value.trim() || state.headline;
  state.subhead = elements.inputs.subhead.value.trim() || state.subhead;
  state.cta = elements.inputs.cta.value.trim() || state.cta;
  state.price = elements.inputs.price.value.trim() || state.price;
  state.theme = elements.inputs.theme.value;
  state.metric1 = elements.inputs.metric1.value.trim() || state.metric1;
  state.metric2 = elements.inputs.metric2.value.trim() || state.metric2;
  state.metric3 = elements.inputs.metric3.value.trim() || state.metric3;
  applyState();
  persistState();
};

const logTranscript = (text) => {
  elements.transcript.textContent = text;
};

const setValue = (key, value) => {
  if (!value) return;
  state[key] = value.trim();
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

const init = () => {
  loadState();
  applyState();
  setupReveal();
  setControlVisibility();

  const recognition = setupVoice();
  const startButton = document.getElementById('start-voice');
  const stopButton = document.getElementById('stop-voice');
  const applyButton = document.getElementById('apply');

  startButton.addEventListener('click', () => {
    if (!recognition) return;
    recognition.start();
    logTranscript('Listening...');
  });

  stopButton.addEventListener('click', () => {
    if (!recognition) return;
    recognition.stop();
    logTranscript('Stopped.');
  });

  applyButton.addEventListener('click', updateFromInputs);

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
};

init();
