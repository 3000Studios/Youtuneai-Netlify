(() => {
  const beep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      gain.gain.value = 0.08;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (_) {
      // ignore
    }
  };

  const links = document.querySelectorAll("nav a");
  links.forEach((link) => {
    link.addEventListener("mouseenter", beep);
  });
})();
