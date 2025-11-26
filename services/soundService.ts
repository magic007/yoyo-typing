
// Simple sound synthesizer using Web Audio API to avoid external assets

let audioCtx: AudioContext | null = null;

const getCtx = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

const createOscillator = (type: OscillatorType, freq: number, startTime: number, duration: number, vol: number = 0.1) => {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);

  // Envelope
  gainNode.gain.setValueAtTime(vol, startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

  osc.start(startTime);
  osc.stop(startTime + duration);
  
  return { osc, gainNode };
};

export const playClick = () => {
  try {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();

    // Mechanical click simulation: A short high-pitch pop
    const t = ctx.currentTime;
    
    // Main "click"
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.03);
    
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.03);

    osc.start(t);
    osc.stop(t + 0.03);

  } catch (e) {
    // Ignore audio errors (e.g. context not started)
  }
};

export const playError = () => {
  try {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();

    const t = ctx.currentTime;
    
    // Low frequency "thud" or "buzz"
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.linearRampToValueAtTime(100, t + 0.15);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.linearRampToValueAtTime(0.01, t + 0.15);

    osc.start(t);
    osc.stop(t + 0.15);

  } catch (e) {
    console.error(e);
  }
};

export const playSuccess = () => {
  try {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();

    const t = ctx.currentTime;
    // C Major Arpeggio
    const notes = [523.25, 659.25, 783.99, 1046.50]; 
    
    notes.forEach((freq, i) => {
      createOscillator('sine', freq, t + i * 0.1, 0.4, 0.15);
    });

  } catch (e) {
    console.error(e);
  }
};
