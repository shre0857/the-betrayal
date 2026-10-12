/**
 * THE BETRAYAL — DARK FANTASY MYSTERY CARD GAME
 * Core Game Engine: State Machine, Audio Synthesizer, 3D Card Interactivity,
 * Dynamic SVG Portraits, and Deductive Investigation Flow.
 */

// =============================================================================
// 1. GAME CONSTANTS & REPOSITORY DATA
// =============================================================================

const SUSPECTS = {
  aldric: {
    id: 'aldric',
    name: 'Lord Aldric',
    title: 'The Northern Lord',
    house: 'HOUSE OF THE NORTH',
    badge: 'NORTH',
    badgeClass: 'northern',
    trait: 'Honourable, reserved, and fiercely protective of his territory.',
    initialAlibi: '“I was inspecting the northern gate on the King\'s final night.”',
    fullTestimony: '“Two guards were stationed at the northern gate. They may confirm my presence there. I had disagreements with the King regarding border garrisons, but I would never spill royal blood in secret cowardice.”',
    analysisKnown: 'Two outpost sentries verify a tall cloaked figure was seen near the outer battlements at 11:15 PM.',
    analysisUncertain: 'The sentries cannot confirm if he left the gatehouse between 10:45 PM and 11:00 PM.',
    exoneration: 'Northern guards provided a sealed log confirming Lord Aldric remained at the battlement gatehouse until midnight. He held neither the chamber key nor any connection to treasury funds.'
  },
  seraphine: {
    id: 'seraphine',
    name: 'Lady Seraphine',
    title: 'The Royal Advisor',
    house: 'COUNCIL OF WHISPERS',
    badge: 'COUNCIL',
    badgeClass: 'crown',
    trait: 'Intelligent, highly persuasive, and relentlessly ambitious.',
    initialAlibi: '“I was reading in the royal library. I heard an argument nearby, but I saw no one.”',
    fullTestimony: '“I was studying historical treaties in the royal library. Around 10:45 PM, I heard a heated argument echoing through the corridor near the royal wing. I stepped out to look, but whoever argued had already disappeared into the shadows.”',
    analysisKnown: 'Corridor acoustics corroborate that voices in the royal antechamber can be heard from the library balcony.',
    analysisUncertain: 'She cannot confirm whether the argument involved one voice or two, or whose footsteps followed.',
    exoneration: 'The Royal Librarian confirmed Lady Seraphine was studying archives under candlelight until the bells tolled midnight. She had no motive of theft and had no access to the King\'s treasury keys.'
  },
  malrec: {
    id: 'malrec',
    name: 'Lord Malrec',
    title: 'The Royal Treasurer',
    house: 'ROYAL EXCHEQUER',
    badge: 'TREASURY',
    badgeClass: 'treasury',
    trait: 'Vastly wealthy, secretive, and obsessed with the crown’s gold.',
    initialAlibi: '“I never entered the King\'s chambers. The treasury key was accessible to several officials.”',
    fullTestimony: '“The treasury key was available to several officials. Its presence proves nothing about who entered the chambers. The King demanded an emergency audit of the war chest that evening, but I spent the night balancing ledgers in the vault vaults below.”',
    analysisKnown: 'Auditors confirmed severe discrepancies totaling thousands of royal gold sovereigns.',
    analysisUncertain: 'A servant saw a cloaked man carrying a locked satchel leaving the royal wing toward the exchequer.',
    isCulprit: true
  }
};

const EVIDENCE = {
  1: {
    id: 1,
    title: 'THE BLOODY DAGGER',
    category: 'WEAPON',
    icon: '🗡️',
    description: '“A dagger was discovered near the King\'s private chambers. Its decorative handle bears the royal treasury\'s insignia.”',
    deductionNote: 'The murder weapon originated directly from the Royal Treasury armoury.'
  },
  2: {
    id: 2,
    title: 'THE MISSING KEY',
    category: 'OPPORTUNITY',
    icon: '🗝️',
    description: '“The key to the King\'s private chambers was signed out from the treasury shortly before the murder.”',
    deductionNote: 'The killer unlocked the private chambers using the key requisitioned from the treasury.'
  },
  3: {
    id: 3,
    title: 'THE SERVANT’S TESTIMONY',
    category: 'TIMELINE',
    icon: '🕯️',
    description: '“A servant heard footsteps near the royal chambers around 11 PM but could not identify the person.”',
    deductionNote: 'Establishes the exact window of regicide at 11:00 PM.'
  },
  4: {
    id: 4,
    title: 'THE TORN LEDGER',
    category: 'MOTIVE',
    icon: '📖',
    description: '“A damaged financial record reveals missing royal funds. The record contains the Treasurer\'s signature.”',
    deductionNote: 'Proves massive royal embezzlement signed and sealed by Lord Malrec.'
  },
  5: {
    id: 5,
    title: 'THE SECRET LETTER',
    category: 'SMOKING GUN',
    icon: '✉️',
    description: '“A recovered letter reveals that the Treasurer planned to enter the King\'s chambers to destroy evidence of financial theft.”',
    deductionNote: 'Conclusive premeditation: Malrec entered the chambers to burn proof of his theft.'
  }
};

// =============================================================================
// 2. CENTRAL GAME STATE (SINGLE SOURCE OF TRUTH)
// =============================================================================

const gameState = {
  currentScreen: 'screen-landing',
  attemptsRemaining: 3,
  maxAttempts: 3,
  score: 0,
  bestScore: 0,
  revealedClues: new Set(),
  investigatedSuspects: new Set(),
  selectedAccusation: null,
  activeInterrogationId: null,
  soundEnabled: false
};

// =============================================================================
// 3. PROCEDURAL WEB AUDIO SYNTHESIZER (NO EXTERNAL MP3 DEPENDENCIES)
// =============================================================================

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

const SoundFX = {
  // Wax seal break: parchment rustle + snap
  sealBreak() {
    if (!gameState.soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      
      const now = ctx.currentTime;
      // Low thud
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);

      // White noise rustle
      const bufferSize = ctx.sampleRate * 0.1;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(1200, now);
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.12, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(now);
    } catch (e) {
      console.warn('Audio synthesis warning:', e);
    }
  },

  // Mystical Golden Clue Discovery Chime
  clueChime() {
    if (!gameState.soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        gain.gain.setValueAtTime(0, now + idx * 0.06);
        gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.06 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.65);
      });
    } catch (e) {}
  },

  // Cathedral Interrogation Toll
  interrogationToll() {
    if (!gameState.soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now); // A3
      osc.frequency.exponentialRampToValueAtTime(216, now + 1.2);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.25);
    } catch (e) {}
  },

  // Button Hover Click
  subtleClick() {
    if (!gameState.soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {}
  },

  // Penalty / Disproven Buzz
  penaltyBuzzer() {
    if (!gameState.soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.linearRampToValueAtTime(85, now + 0.35);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.45);
    } catch (e) {}
  },

  // Triumphant Royal Fanfare
  victoryFanfare() {
    if (!gameState.soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const notes = [
        { f: 392.00, t: 0.0, d: 0.2 }, // G4
        { f: 523.25, t: 0.2, d: 0.2 }, // C5
        { f: 659.25, t: 0.4, d: 0.2 }, // E5
        { f: 783.99, t: 0.6, d: 0.6 }, // G5
        { f: 1046.5, t: 0.85, d: 0.9 } // C6
      ];
      notes.forEach(note => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.f, now + note.t);
        gain.gain.setValueAtTime(0, now + note.t);
        gain.gain.linearRampToValueAtTime(0.28, now + note.t + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + note.t + note.d);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + note.t);
        osc.stop(now + note.t + note.d + 0.1);
      });
    } catch (e) {}
  },

  // Hollow Ominous Defeat Gong
  defeatGong() {
    if (!gameState.soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.exponentialRampToValueAtTime(55, now + 1.6);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.9);
    } catch (e) {}
  }
};

// =============================================================================
// 4. ATMOSPHERIC PARTICLE SYSTEM (FLOATING EMBERS CANVAS)
// =============================================================================

function initEmbersCanvas() {
  const canvas = document.getElementById('canvas-embers');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particleCount = 45;
  const particles = [];

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.2 + 0.6,
      speedY: -(Math.random() * 0.45 + 0.2),
      speedX: (Math.random() - 0.5) * 0.35,
      alpha: Math.random() * 0.7 + 0.2,
      fadeRate: (Math.random() * 0.008 + 0.003) * (Math.random() > 0.5 ? 1 : -1)
    });
  }

  function renderEmbers() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.y += p.speedY;
      p.x += p.speedX;
      p.alpha += p.fadeRate;

      if (p.alpha <= 0.1 || p.alpha >= 0.85) {
        p.fadeRate = -p.fadeRate;
      }

      if (p.y < -10) {
        p.y = height + 10;
        p.x = Math.random() * width;
      }
      if (p.x < -10) p.x = width + 10;
      if (p.x > width + 10) p.x = -10;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(216, 175, 93, ${Math.max(0, p.alpha)})`;
      ctx.shadowBlur = 6;
      ctx.shadowColor = 'rgba(230, 203, 139, 0.6)';
      ctx.fill();
    }

    requestAnimationFrame(renderEmbers);
  }

  renderEmbers();
}

// =============================================================================
// 5. CUSTOM SVG CHARACTER PORTRAITS
// =============================================================================

function generateCharacterSVG(type) {
  if (type === 'aldric') {
    // Lord Aldric: Stern Northern Lord with fur cowl, steel gorget, and wolf crest
    return `
      <svg viewBox="0 0 100 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="aldric-bg" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stop-color="#2D3B4C"/>
            <stop offset="100%" stop-color="#0E1620"/>
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="50" fill="url(#aldric-bg)"/>
        <!-- Fur Mantle Backing -->
        <path d="M15 85 C25 65 75 65 85 85 L90 100 L10 100 Z" fill="#4B4846"/>
        <path d="M18 82 C30 68 70 68 82 82" stroke="#686562" stroke-width="4" stroke-linecap="round"/>
        <!-- Steel Gorget / Breastplate -->
        <path d="M30 80 L50 94 L70 80 L62 100 L38 100 Z" fill="#6B7886" stroke="#C5A15B" stroke-width="1.5"/>
        <circle cx="50" cy="87" r="3.5" fill="#C5A15B"/>
        <!-- Head and Face -->
        <ellipse cx="50" cy="46" rx="20" ry="24" fill="#C8A585"/>
        <!-- Grey Streaked Hair -->
        <path d="M28 42 C28 22 72 22 72 42 C72 30 65 24 50 24 C35 24 28 30 28 42 Z" fill="#5A5856"/>
        <path d="M26 44 C25 56 28 62 30 66" stroke="#484644" stroke-width="3" stroke-linecap="round"/>
        <path d="M74 44 C75 56 72 62 70 66" stroke="#484644" stroke-width="3" stroke-linecap="round"/>
        <!-- Rugged Beard -->
        <path d="M34 52 C34 72 66 72 66 52 C60 66 40 66 34 52 Z" fill="#484644"/>
        <path d="M42 62 L50 71 L58 62" stroke="#686562" stroke-width="1.5"/>
        <!-- Eyes & Stern Brow -->
        <path d="M36 41 L45 44" stroke="#2B2824" stroke-width="2.2" stroke-linecap="round"/>
        <path d="M64 41 L55 44" stroke="#2B2824" stroke-width="2.2" stroke-linecap="round"/>
        <ellipse cx="41" cy="47" rx="2.5" ry="2" fill="#587894"/>
        <ellipse cx="59" cy="47" rx="2.5" ry="2" fill="#587894"/>
        <circle cx="41" cy="47" r="1" fill="#000"/>
        <circle cx="59" cy="47" r="1" fill="#000"/>
        <!-- Nose & Mouth -->
        <path d="M50 46 L48 55 L52 55" stroke="#9E7859" stroke-width="1.5" stroke-linecap="round"/>
        <!-- Northern Wolf Emblem -->
        <polygon points="50,15 54,23 46,23" fill="#C5A15B"/>
      </svg>
    `;
  } else if (type === 'seraphine') {
    // Lady Seraphine: Royal Advisor with deep burgundy hooded cowl, emerald pendant, and sharp gaze
    return `
      <svg viewBox="0 0 100 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="seraphine-bg" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stop-color="#48182B"/>
            <stop offset="100%" stop-color="#18070F"/>
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="50" fill="url(#seraphine-bg)"/>
        <!-- Velvet Robes & Cloak -->
        <path d="M12 90 C22 68 78 68 88 90 L95 100 L5 100 Z" fill="#2E0A16"/>
        <path d="M22 84 L50 96 L78 84" stroke="#C5A15B" stroke-width="1.8" fill="none"/>
        <!-- Emerald Advisor Amulet -->
        <circle cx="50" cy="85" r="5" fill="#1A7B54" stroke="#C5A15B" stroke-width="1.5"/>
        <circle cx="50" cy="85" r="2" fill="#75E6B4"/>
        <!-- Face -->
        <ellipse cx="50" cy="48" rx="19" ry="23" fill="#DFC2A6"/>
        <!-- Dark Burgundy Hood Framing Face -->
        <path d="M24 50 C24 20 76 20 76 50 C76 75 70 82 70 82 C58 75 42 75 30 82 C30 82 24 75 24 50 Z" fill="#4B1224" stroke="#8F1D2C" stroke-width="1.2"/>
        <!-- Elegant Dark Hair -->
        <path d="M31 46 C36 30 64 30 69 46 C64 38 36 38 31 46 Z" fill="#1C1417"/>
        <!-- Expressive Eyes -->
        <path d="M36 44 Q42 41 46 45" stroke="#1A1115" stroke-width="2" fill="none"/>
        <path d="M64 44 Q58 41 54 45" stroke="#1A1115" stroke-width="2" fill="none"/>
        <ellipse cx="41" cy="47" rx="3" ry="2.2" fill="#2E7554"/>
        <ellipse cx="59" cy="47" rx="3" ry="2.2" fill="#2E7554"/>
        <circle cx="41.8" cy="46.6" r="1" fill="#FFF"/>
        <circle cx="59.8" cy="46.6" r="1" fill="#FFF"/>
        <!-- Sculpted Nose & Crimson Lips -->
        <path d="M50 46 L49 54 L52 54" stroke="#B08D72" stroke-width="1.3" stroke-linecap="round"/>
        <path d="M45 61 Q50 63 55 61" stroke="#8F1D2C" stroke-width="2" fill="none" stroke-linecap="round"/>
        <!-- Gold Filigree Brow Circlet -->
        <path d="M35 32 Q50 28 65 32" stroke="#C5A15B" stroke-width="2" fill="none"/>
        <circle cx="50" cy="29.5" r="2" fill="#C5A15B"/>
      </svg>
    `;
  } else if (type === 'malrec') {
    // Lord Malrec: Royal Treasurer with gold chain of office, velvet cowl, and calculating smirk
    return `
      <svg viewBox="0 0 100 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="malrec-bg" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stop-color="#3D3012"/>
            <stop offset="100%" stop-color="#140E04"/>
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="50" fill="url(#malrec-bg)"/>
        <!-- Opulent Velvet Mantle with Gold Trimming -->
        <path d="M12 88 C24 66 76 66 88 88 L95 100 L5 100 Z" fill="#221C16"/>
        <!-- Heavy Golden Chain of the Exchequer -->
        <path d="M22 84 C34 98 66 98 78 84" stroke="#C5A15B" stroke-width="3" fill="none" stroke-dasharray="3 2"/>
        <!-- Treasurer Coin Medallion -->
        <circle cx="50" cy="94" r="5.5" fill="#E6CB8B" stroke="#8F7238" stroke-width="1.5"/>
        <path d="M47 94 L53 94 M50 91 L50 97" stroke="#684E18" stroke-width="1.2"/>
        <!-- Head and Face -->
        <ellipse cx="50" cy="46" rx="20" ry="24" fill="#CBAA8C"/>
        <!-- Trimmed Aristocratic Beard & Moustache -->
        <path d="M38 52 C38 68 62 68 62 52 C58 63 42 63 38 52 Z" fill="#3D3228"/>
        <path d="M42 56 Q50 59 58 56" stroke="#2B2118" stroke-width="2" fill="none"/>
        <!-- Golden Trimmed Cap / Hood -->
        <path d="M28 38 C28 20 72 20 72 38 L75 42 L25 42 Z" fill="#381D1A"/>
        <path d="M25 41 L75 41" stroke="#C5A15B" stroke-width="2.5"/>
        <!-- Calculating Eyes & Raised Eyebrow -->
        <path d="M36 41 L45 42" stroke="#2B2118" stroke-width="2" stroke-linecap="round"/>
        <path d="M55 39 L64 42" stroke="#2B2118" stroke-width="2.2" stroke-linecap="round"/> <!-- arched -->
        <ellipse cx="41" cy="46" rx="2.5" ry="1.8" fill="#584838"/>
        <ellipse cx="59" cy="46" rx="2.5" ry="1.8" fill="#584838"/>
        <circle cx="41" cy="46" r="1" fill="#000"/>
        <circle cx="59" cy="46" r="1" fill="#000"/>
        <!-- Aquiline Nose & Subtle Sly Smirk -->
        <path d="M50 44 L48 53 L53 53" stroke="#9A7859" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M44 60 Q50 60 56 59" stroke="#2B2118" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      </svg>
    `;
  }
  return '';
}

function renderAllAvatars() {
  const mapping = [
    { id: 'avatar-aldric-briefing', type: 'aldric' },
    { id: 'avatar-seraphine-briefing', type: 'seraphine' },
    { id: 'avatar-malrec-briefing', type: 'malrec' },
    { id: 'avatar-aldric-arena', type: 'aldric' },
    { id: 'avatar-seraphine-arena', type: 'seraphine' },
    { id: 'avatar-malrec-arena', type: 'malrec' },
    { id: 'accuse-avatar-aldric', type: 'aldric' },
    { id: 'accuse-avatar-seraphine', type: 'seraphine' },
    { id: 'accuse-avatar-malrec', type: 'malrec' }
  ];

  mapping.forEach(item => {
    const el = document.getElementById(item.id);
    if (el) {
      el.innerHTML = generateCharacterSVG(item.type);
    }
  });
}

// =============================================================================
// 6. SCREEN TRANSITION & NAVIGATION CONTROLLER
// =============================================================================

function navigateToScreen(targetScreenId) {
  const allScreens = document.querySelectorAll('.game-screen');
  const targetScreen = document.getElementById(targetScreenId);
  if (!targetScreen) return;

  SoundFX.subtleClick();

  allScreens.forEach(screen => {
    if (screen.id === targetScreenId) {
      screen.classList.remove('hidden');
      screen.classList.remove('screen-exit');
      screen.classList.add('screen-active');
    } else {
      screen.classList.add('hidden');
      screen.classList.remove('screen-active');
    }
  });

  gameState.currentScreen = targetScreenId;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// =============================================================================
// 7. HUD & STATUS UPDATE LOGIC
// =============================================================================

function updateHUD() {
  // Update Attempts
  const valAttempts = document.getElementById('val-attempts');
  if (valAttempts) {
    valAttempts.textContent = gameState.attemptsRemaining;
  }

  const badges = document.querySelectorAll('#attempts-badges .attempt-badge');
  badges.forEach(badge => {
    const idx = parseInt(badge.getAttribute('data-index'), 10);
    if (idx <= gameState.attemptsRemaining) {
      badge.classList.add('active');
    } else {
      badge.classList.remove('active');
    }
  });

  // Update Clues Count & Progress
  const valClues = document.getElementById('val-clues-count');
  const cluesBar = document.getElementById('clues-progress-bar');
  const count = gameState.revealedClues.size;
  if (valClues) valClues.textContent = count;
  if (cluesBar) cluesBar.style.width = `${(count / 5) * 100}%`;

  // Update Score
  const valScore = document.getElementById('val-score');
  if (valScore) valScore.textContent = gameState.score;

  // Update Journal Tab Badges
  const jtabClues = document.getElementById('jtab-clues-count');
  const jtabTestimonies = document.getElementById('jtab-testimonies-count');
  if (jtabClues) jtabClues.textContent = count;
  if (jtabTestimonies) jtabTestimonies.textContent = gameState.investigatedSuspects.size;

  // Update Best Score in Landing Screen
  const landingBest = document.getElementById('landing-best-score');
  const valLandingBest = document.getElementById('val-best-score-landing');
  if (gameState.bestScore > 0) {
    if (landingBest) landingBest.classList.remove('hidden');
    if (valLandingBest) valLandingBest.textContent = gameState.bestScore;
  }
}

// =============================================================================
// 8. EVIDENCE CLUE REVELATION & JOURNAL SYNC
// =============================================================================

function handleEvidenceClick(cardEl) {
  const clueId = parseInt(cardEl.getAttribute('data-clue-id'), 10);
  const clueData = EVIDENCE[clueId];
  if (!clueData) return;

  const isAlreadyRevealed = gameState.revealedClues.has(clueId);

  if (!isAlreadyRevealed) {
    // Break seal & Reveal
    SoundFX.sealBreak();
    setTimeout(() => SoundFX.clueChime(), 180);

    gameState.revealedClues.add(clueId);
    gameState.score += 100;

    cardEl.classList.add('revealed');

    // Add to journal
    addClueToJournal(clueData);

    // Update checklist in deduction tab
    updateDeductionChecklist(clueId);

    updateHUD();
  } else {
    // Already revealed: provide interactive feedback
    SoundFX.subtleClick();
    cardEl.classList.add('revealed');
  }
}

function addClueToJournal(clue) {
  const journalList = document.getElementById('journal-clues-list');
  const emptyMsg = document.getElementById('journal-empty-msg');
  if (emptyMsg) emptyMsg.classList.add('hidden');

  const entry = document.createElement('div');
  entry.className = 'journal-entry-item';
  entry.setAttribute('id', `jentry-clue-${clue.id}`);
  entry.innerHTML = `
    <div class="jentry-header">
      <span class="jentry-title">${clue.icon} ${clue.title}</span>
      <span class="jentry-time">${clue.category}</span>
    </div>
    <p class="jentry-desc">${clue.description}</p>
  `;

  if (journalList) {
    journalList.appendChild(entry);
  }
}

function updateDeductionChecklist(clueId) {
  const mapping = {
    1: 'deduct-dagger',
    2: 'deduct-key',
    3: 'deduct-timeline',
    4: 'deduct-motive',
    5: 'deduct-intent'
  };

  const itemId = mapping[clueId];
  if (itemId) {
    const itemEl = document.getElementById(itemId);
    if (itemEl) {
      itemEl.classList.add('fulfilled');
      const box = itemEl.querySelector('.chk-box');
      if (box) box.textContent = '☑';
    }
  }
}

// =============================================================================
// 9. SUSPECT INTERROGATION SYSTEM
// =============================================================================

function handleInvestigateSuspect(suspectId) {
  const suspect = SUSPECTS[suspectId];
  if (!suspect) return;

  const isAlreadyInvestigated = gameState.investigatedSuspects.has(suspectId);

  if (!isAlreadyInvestigated) {
    if (gameState.attemptsRemaining <= 0) {
      alert('Your inquiry attempts are exhausted! Review your journal and proceed to Make Accusation.');
      return;
    }

    // Deduct 1 attempt
    gameState.attemptsRemaining--;
    gameState.investigatedSuspects.add(suspectId);

    SoundFX.interrogationToll();

    // Mark card as investigated
    const cardEl = document.getElementById(`card-suspect-${suspectId}`);
    if (cardEl) {
      cardEl.classList.add('investigated');
      const tag = document.getElementById(`status-tag-${suspectId}`);
      if (tag) {
        tag.className = 'investigation-status-tag is-investigated';
        tag.innerHTML = '<span class="dot"></span> QUESTIONED';
      }
      const btn = cardEl.querySelector('.btn-investigate');
      if (btn) {
        btn.innerHTML = `
          <span class="btn-content">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            REVIEW TESTIMONY
          </span>
        `;
      }
    }

    // Add to journal testimonies tab
    addTestimonyToJournal(suspect);
    updateHUD();
  } else {
    SoundFX.subtleClick();
  }

  // Open modal with testimony
  openInterrogationModal(suspect);
}

function openInterrogationModal(suspect) {
  gameState.activeInterrogationId = suspect.id;

  const modal = document.getElementById('modal-interrogation');
  const nameEl = document.getElementById('modal-suspect-name');
  const roleEl = document.getElementById('modal-suspect-role');
  const avatarEl = document.getElementById('modal-suspect-avatar');
  const testimonyEl = document.getElementById('modal-testimony-text');
  const knownEl = document.getElementById('modal-analysis-known');
  const uncertainEl = document.getElementById('modal-analysis-uncertain');

  if (nameEl) nameEl.textContent = suspect.name;
  if (roleEl) roleEl.textContent = `${suspect.title} • ${suspect.house}`;
  if (avatarEl) avatarEl.innerHTML = generateCharacterSVG(suspect.id);
  if (testimonyEl) testimonyEl.textContent = suspect.fullTestimony;
  if (knownEl) knownEl.textContent = suspect.analysisKnown;
  if (uncertainEl) uncertainEl.textContent = suspect.analysisUncertain;

  if (modal) modal.classList.remove('hidden');
}

function closeInterrogationModal() {
  const modal = document.getElementById('modal-interrogation');
  if (modal) modal.classList.add('hidden');
  SoundFX.subtleClick();
}

function addTestimonyToJournal(suspect) {
  const list = document.getElementById('journal-testimonies-list');
  const emptyMsg = document.getElementById('testimonies-empty-msg');
  if (emptyMsg) emptyMsg.classList.add('hidden');

  const entry = document.createElement('div');
  entry.className = 'journal-entry-item';
  entry.setAttribute('id', `jentry-testimony-${suspect.id}`);
  entry.innerHTML = `
    <div class="jentry-header">
      <span class="jentry-title">⚖️ ${suspect.name}</span>
      <span class="jentry-time">${suspect.badge}</span>
    </div>
    <p class="jentry-desc">${suspect.fullTestimony}</p>
  `;

  if (list) {
    list.appendChild(entry);
  }
}

// =============================================================================
// 10. ACCUSATION DIALOG & MECHANICS
// =============================================================================

function openAccusationModal() {
  SoundFX.subtleClick();
  gameState.selectedAccusation = null;

  // Clear selections
  const tiles = document.querySelectorAll('.accuse-tile');
  tiles.forEach(tile => {
    tile.classList.remove('selected');
    tile.setAttribute('aria-checked', 'false');
  });

  const errorBanner = document.getElementById('accuse-error-message');
  if (errorBanner) errorBanner.classList.add('hidden');

  const modal = document.getElementById('modal-accusation');
  if (modal) modal.classList.remove('hidden');
}

function closeAccusationModal() {
  const modal = document.getElementById('modal-accusation');
  if (modal) modal.classList.add('hidden');
  SoundFX.subtleClick();
}

function selectAccusationSuspect(tileEl) {
  SoundFX.subtleClick();
  const suspectId = tileEl.getAttribute('data-suspect');
  gameState.selectedAccusation = suspectId;

  const tiles = document.querySelectorAll('.accuse-tile');
  tiles.forEach(t => {
    t.classList.remove('selected');
    t.setAttribute('aria-checked', 'false');
  });

  tileEl.classList.add('selected');
  tileEl.setAttribute('aria-checked', 'true');

  const errorBanner = document.getElementById('accuse-error-message');
  if (errorBanner) errorBanner.classList.add('hidden');
}

function confirmAccusation() {
  if (!gameState.selectedAccusation) {
    const errorBanner = document.getElementById('accuse-error-message');
    if (errorBanner) {
      errorBanner.classList.remove('hidden');
      errorBanner.textContent = 'Please choose a suspect before sealing your royal accusation!';
    }
    SoundFX.penaltyBuzzer();
    return;
  }

  const chosenId = gameState.selectedAccusation;
  const suspect = SUSPECTS[chosenId];
  closeAccusationModal();

  if (suspect && suspect.isCulprit) {
    // CORRECT ACCUSATION: LORD MALREC
    handleVictory(suspect);
  } else {
    // INCORRECT ACCUSATION: ALDRIC OR SERAPHINE
    handleFalseAccusation(suspect);
  }
}

function handleVictory(culprit) {
  SoundFX.victoryFanfare();

  // Scoring Calculation
  // +150 for correct accusation
  // +25 bonus per remaining attempt
  const remainingAttempts = gameState.attemptsRemaining;
  const attemptsBonus = remainingAttempts * 25;
  gameState.score += 150 + attemptsBonus;

  // Save Best Score
  if (gameState.score > gameState.bestScore) {
    gameState.bestScore = gameState.score;
    try {
      localStorage.setItem('the_betrayal_best_score', gameState.bestScore);
    } catch (e) {}
  }

  // Populate Victory UI
  const banner = document.getElementById('results-banner');
  if (banner) {
    banner.className = 'results-header-banner victory';
  }
  const crestIcon = document.getElementById('results-crest-icon');
  if (crestIcon) crestIcon.textContent = '👑';

  const superTitle = document.getElementById('results-super-title');
  if (superTitle) superTitle.textContent = 'ROYAL JUSTICE RESTORED';

  const title = document.getElementById('results-title');
  if (title) title.textContent = 'THE TRAITOR HAS BEEN EXPOSED';

  const tagline = document.getElementById('results-tagline');
  if (tagline) tagline.textContent = 'Lord Malrec, Royal Treasurer, stands convicted of high treason and regicide.';

  // Stats
  const resScore = document.getElementById('res-val-score');
  if (resScore) resScore.textContent = gameState.score;

  const resBest = document.getElementById('res-best-score-label');
  if (resBest) resBest.textContent = `BEST: ${gameState.bestScore} PTS`;

  const resClues = document.getElementById('res-val-clues');
  if (resClues) resClues.textContent = gameState.revealedClues.size;

  const resAttemptsUsed = document.getElementById('res-val-attempts-used');
  if (resAttemptsUsed) resAttemptsUsed.textContent = (gameState.maxAttempts - remainingAttempts);

  const resAttemptsRemaining = document.getElementById('res-val-attempts-remaining');
  if (resAttemptsRemaining) resAttemptsRemaining.textContent = `+${attemptsBonus} BONUS PTS (${remainingAttempts} REMAINING)`;

  const resAccusedName = document.getElementById('res-val-accused-name');
  if (resAccusedName) resAccusedName.textContent = culprit.name;

  const resAccusedStatus = document.getElementById('res-val-accused-status');
  if (resAccusedStatus) resAccusedStatus.textContent = 'GUILTY OF REGICIDE';

  // Dossier Content
  const explanationTitle = document.getElementById('res-explanation-title');
  if (explanationTitle) explanationTitle.textContent = 'THE IRREFUTABLE CHAIN OF DEDUCTION';

  const explanationContent = document.getElementById('res-explanation-content');
  if (explanationContent) {
    explanationContent.innerHTML = `
      <p>
        Through your methodical inquest, every piece of evidence locked within the King's chambers coalesced into an unshakeable case against Lord Malrec:
      </p>
      <ul class="evidence-chain-list">
        <li class="chain-item">
          <span class="chain-step">1. THE WEAPON:</span>
          <span class="chain-desc">The ornate murder dagger discovered beside the royal bed chamber bore the official crest of the Royal Treasury.</span>
        </li>
        <li class="chain-item">
          <span class="chain-step">2. OPPORTUNITY:</span>
          <span class="chain-desc">Chamber records proved the private room key was signed out from the treasury vaults shortly before the murder took place.</span>
        </li>
        <li class="chain-item">
          <span class="chain-step">3. TIMELINE:</span>
          <span class="chain-desc">The royal servant heard footsteps outside the King’s room at 11:00 PM, aligning perfectly with the treasury sign-out record.</span>
        </li>
        <li class="chain-item">
          <span class="chain-step">4. MOTIVE:</span>
          <span class="chain-desc">The torn ledger discovered in the fireplace revealed massive embezzlement of royal gold bearing Lord Malrec's personal signature.</span>
        </li>
        <li class="chain-item">
          <span class="chain-step">5. PREMEDITATION:</span>
          <span class="chain-desc">The confidential letter confirmed Malrec’s desperate scheme: to infiltrate the King's chambers and burn all financial evidence before the dawn tribunal.</span>
        </li>
      </ul>
      <p style="margin-top: 16px; color: var(--color-gold-bright);">
        Lord Malrec has been placed in heavy irons in the deepest fortress dungeon. The Crown stands protected.
      </p>
    `;
  }

  navigateToScreen('screen-results');
}

function handleFalseAccusation(falselyAccused) {
  SoundFX.penaltyBuzzer();

  // Deduct 50 pts (minimum 0)
  gameState.score = Math.max(0, gameState.score - 50);

  // Consume 1 investigation attempt
  gameState.attemptsRemaining--;

  updateHUD();

  // Check if attempts exhausted
  if (gameState.attemptsRemaining <= 0) {
    // DEFEAT TRIGGERED
    handleDefeat(falselyAccused);
  } else {
    // Show Warning Modal & Allow Continued Investigation
    const modal = document.getElementById('modal-false-accusation');
    const explEl = document.getElementById('modal-false-explanation');
    const statusEl = document.getElementById('modal-false-status');

    if (explEl) {
      explEl.textContent = `The Royal Council cross-examined ${falselyAccused.name}. ${falselyAccused.exoneration}`;
    }
    if (statusEl) {
      statusEl.textContent = `You have ${gameState.attemptsRemaining} inquiry attempt(s) remaining. Inspect the evidence and uncover the true traitor.`;
    }
    if (modal) modal.classList.remove('hidden');
  }
}

function handleDefeat(lastAccused) {
  SoundFX.defeatGong();

  const banner = document.getElementById('results-banner');
  if (banner) {
    banner.className = 'results-header-banner defeat';
  }
  const crestIcon = document.getElementById('results-crest-icon');
  if (crestIcon) crestIcon.textContent = '🩸';

  const superTitle = document.getElementById('results-super-title');
  if (superTitle) superTitle.textContent = 'THE INQUEST HAS COLLAPSED';

  const title = document.getElementById('results-title');
  if (title) title.textContent = 'THE KINGDOM REMAINS IN DARKNESS';

  const tagline = document.getElementById('results-tagline');
  if (tagline) tagline.textContent = 'With your inquiry attempts exhausted, the real murderer slipped away as dawn broke.';

  // Stats
  const resScore = document.getElementById('res-val-score');
  if (resScore) resScore.textContent = gameState.score;

  const resBest = document.getElementById('res-best-score-label');
  if (resBest) resBest.textContent = `BEST: ${gameState.bestScore} PTS`;

  const resClues = document.getElementById('res-val-clues');
  if (resClues) resClues.textContent = gameState.revealedClues.size;

  const resAttemptsUsed = document.getElementById('res-val-attempts-used');
  if (resAttemptsUsed) resAttemptsUsed.textContent = gameState.maxAttempts;

  const resAttemptsRemaining = document.getElementById('res-val-attempts-remaining');
  if (resAttemptsRemaining) resAttemptsRemaining.textContent = '0 REMAINING (0 BONUS)';

  const resAccusedName = document.getElementById('res-val-accused-name');
  if (resAccusedName) resAccusedName.textContent = lastAccused ? lastAccused.name : 'Unknown';

  const resAccusedStatus = document.getElementById('res-val-accused-status');
  if (resAccusedStatus) resAccusedStatus.textContent = 'WRONGFULLY ACCUSED';

  // Dossier Content
  const explanationTitle = document.getElementById('res-explanation-title');
  if (explanationTitle) explanationTitle.textContent = 'POST-MORTEM: THE TRUTH BEHIND THE BETRAYAL';

  const explanationContent = document.getElementById('res-explanation-content');
  if (explanationContent) {
    explanationContent.innerHTML = `
      <p>
        The real regicide was <strong style="color: #FF8F9B;">Lord Malrec, the Royal Treasurer</strong>.
      </p>
      <p style="margin-top: 10px;">
        While ${lastAccused ? lastAccused.name : 'an innocent noble'} was wrongfully targeted, Malrec escaped across the southern sea with three chests of royal bullion.
      </p>
      <ul class="evidence-chain-list">
        <li class="chain-item">
          <span class="chain-step">THE MISSED WEAPON:</span>
          <span class="chain-desc">The dagger's hilt had the treasury stamp, linking directly to Malrec's vault armory.</span>
        </li>
        <li class="chain-item">
          <span class="chain-step">THE MISSED KEY:</span>
          <span class="chain-desc">Only Malrec signed out the King's private chamber key prior to the 11 PM strike.</span>
        </li>
        <li class="chain-item">
          <span class="chain-step">THE MOTIVE & LETTER:</span>
          <span class="chain-desc">The torn ledger and secret letter exposed Malrec's desperate coverup of embezzled war funds.</span>
        </li>
      </ul>
      <p style="margin-top: 16px; color: var(--color-parchment-light);">
        The realm now teeters on the brink of civil strife. Dare to retry your inquest and bring the true conspirator to justice.
      </p>
    `;
  }

  navigateToScreen('screen-results');
}

// =============================================================================
// 11. GAME RESET & REPLAY ENGINE
// =============================================================================

function resetGame() {
  SoundFX.subtleClick();

  // Reset State Variables
  gameState.attemptsRemaining = gameState.maxAttempts;
  gameState.score = 0;
  gameState.revealedClues.clear();
  gameState.investigatedSuspects.clear();
  gameState.selectedAccusation = null;
  gameState.activeInterrogationId = null;

  // Reset Evidence Cards
  const cards = document.querySelectorAll('.evidence-card');
  cards.forEach(card => {
    card.classList.remove('revealed');
  });

  // Reset Suspect Cards
  const suspectKeys = ['aldric', 'seraphine', 'malrec'];
  suspectKeys.forEach(key => {
    const cardEl = document.getElementById(`card-suspect-${key}`);
    if (cardEl) {
      cardEl.classList.remove('investigated');
      const tag = document.getElementById(`status-tag-${key}`);
      if (tag) {
        tag.className = 'investigation-status-tag not-investigated';
        tag.innerHTML = '<span class="dot"></span> NOT QUESTIONED';
      }
      const btn = cardEl.querySelector('.btn-investigate');
      if (btn) {
        btn.innerHTML = `
          <span class="btn-content">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            INVESTIGATE (1 ATTEMPT)
          </span>
        `;
      }
    }
  });

  // Reset Journal
  const cluesList = document.getElementById('journal-clues-list');
  if (cluesList) {
    cluesList.innerHTML = `
      <div class="journal-empty-state" id="journal-empty-msg">
        <span class="empty-icon">🔏</span>
        <p>No evidence has been discovered yet. Inspect the sealed cards in the chamber to document clues.</p>
      </div>
    `;
  }

  const testimoniesList = document.getElementById('journal-testimonies-list');
  if (testimoniesList) {
    testimoniesList.innerHTML = `
      <div class="journal-empty-state" id="testimonies-empty-msg">
        <span class="empty-icon">⚖️</span>
        <p>No suspects interrogated yet. Use your investigation attempts to question the three lords.</p>
      </div>
    `;
  }

  // Reset Deduction Checklist
  const checkItems = document.querySelectorAll('.deduction-checklist .checklist-item');
  checkItems.forEach(item => {
    item.classList.remove('fulfilled');
    const box = item.querySelector('.chk-box');
    if (box) box.textContent = '◻';
  });

  // Close Any Open Modals
  const modals = document.querySelectorAll('.modal-overlay');
  modals.forEach(modal => modal.classList.add('hidden'));

  updateHUD();
}

// =============================================================================
// 12. SOUND TOGGLE CONTROLLER
// =============================================================================

function toggleSound() {
  gameState.soundEnabled = !gameState.soundEnabled;

  const btn = document.getElementById('btn-sound-toggle');
  const iconOn = btn?.querySelector('.icon-sound-on');
  const iconOff = btn?.querySelector('.icon-sound-off');
  const label = document.getElementById('sound-state-label');

  if (gameState.soundEnabled) {
    getAudioContext();
    if (iconOn) iconOn.classList.remove('hidden');
    if (iconOff) iconOff.classList.add('hidden');
    if (label) label.textContent = 'ON';
    SoundFX.clueChime();
  } else {
    if (iconOn) iconOn.classList.add('hidden');
    if (iconOff) iconOff.classList.remove('hidden');
    if (label) label.textContent = 'OFF';
  }
}

// =============================================================================
// 13. JOURNAL TABS CONTROLLER
// =============================================================================

function setupJournalTabs() {
  const tabs = document.querySelectorAll('.jtab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      SoundFX.subtleClick();
      const targetPane = tab.getAttribute('data-tab');

      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const panes = document.querySelectorAll('.journal-tab-pane');
      panes.forEach(pane => {
        if (pane.id === `pane-${targetPane}`) {
          pane.classList.remove('hidden');
          pane.classList.add('active');
        } else {
          pane.classList.add('hidden');
          pane.classList.remove('active');
        }
      });
    });
  });
}

// =============================================================================
// 14. EVENT LISTENERS ATTACHMENT
// =============================================================================

function attachEventListeners() {
  // Sound Toggle
  const btnSound = document.getElementById('btn-sound-toggle');
  if (btnSound) {
    btnSound.addEventListener('click', toggleSound);
  }

  // Screen 1: Enter Kingdom
  const btnEnter = document.getElementById('btn-enter-kingdom');
  if (btnEnter) {
    btnEnter.addEventListener('click', () => {
      navigateToScreen('screen-briefing');
    });
  }

  // Screen 2: Case Briefing Back / Start
  const btnBackLanding = document.getElementById('btn-back-to-landing');
  if (btnBackLanding) {
    btnBackLanding.addEventListener('click', () => {
      navigateToScreen('screen-landing');
    });
  }

  const btnStartInvestigate = document.getElementById('btn-start-investigation');
  if (btnStartInvestigate) {
    btnStartInvestigate.addEventListener('click', () => {
      navigateToScreen('screen-arena');
    });
  }

  // Evidence Cards Click / Enter Key
  const evidenceCards = document.querySelectorAll('.evidence-card');
  evidenceCards.forEach(card => {
    card.addEventListener('click', () => handleEvidenceClick(card));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleEvidenceClick(card);
      }
    });
  });

  // Suspect Investigate Buttons
  const investigateBtns = document.querySelectorAll('.btn-investigate');
  investigateBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const suspectId = btn.getAttribute('data-suspect');
      handleInvestigateSuspect(suspectId);
    });
  });

  // Close Interrogation Modal
  const btnCloseInterrogation = document.getElementById('btn-close-interrogation');
  const btnConfirmTestimony = document.getElementById('btn-confirm-testimony');
  if (btnCloseInterrogation) btnCloseInterrogation.addEventListener('click', closeInterrogationModal);
  if (btnConfirmTestimony) btnConfirmTestimony.addEventListener('click', closeInterrogationModal);

  // Accusation Buttons (Header & Journal)
  const btnHeaderAccuse = document.getElementById('btn-header-accuse');
  const btnArenaAccuse = document.getElementById('btn-arena-accuse');
  if (btnHeaderAccuse) btnHeaderAccuse.addEventListener('click', openAccusationModal);
  if (btnArenaAccuse) btnArenaAccuse.addEventListener('click', openAccusationModal);

  // Accusation Modal Actions
  const btnCloseAccusation = document.getElementById('btn-close-accusation');
  const btnCancelAccusation = document.getElementById('btn-cancel-accusation');
  const btnConfirmAccusation = document.getElementById('btn-confirm-accusation');
  if (btnCloseAccusation) btnCloseAccusation.addEventListener('click', closeAccusationModal);
  if (btnCancelAccusation) btnCancelAccusation.addEventListener('click', closeAccusationModal);
  if (btnConfirmAccusation) btnConfirmAccusation.addEventListener('click', confirmAccusation);

  // Accusation Tiles Selection
  const accuseTiles = document.querySelectorAll('.accuse-tile');
  accuseTiles.forEach(tile => {
    tile.addEventListener('click', () => selectAccusationSuspect(tile));
    tile.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectAccusationSuspect(tile);
      }
    });
  });

  // Dismiss False Accusation Modal
  const btnDismissFalse = document.getElementById('btn-dismiss-false');
  if (btnDismissFalse) {
    btnDismissFalse.addEventListener('click', () => {
      const modal = document.getElementById('modal-false-accusation');
      if (modal) modal.classList.add('hidden');
      SoundFX.subtleClick();
    });
  }

  // Screen 4 Results: Play Again & Return to Kingdom
  const btnPlayAgain = document.getElementById('btn-play-again');
  if (btnPlayAgain) {
    btnPlayAgain.addEventListener('click', () => {
      resetGame();
      navigateToScreen('screen-arena');
    });
  }

  const btnReturnKingdom = document.getElementById('btn-return-kingdom');
  if (btnReturnKingdom) {
    btnReturnKingdom.addEventListener('click', () => {
      resetGame();
      navigateToScreen('screen-landing');
    });
  }

  // Keyboard Escape Key to close modals
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const openModals = document.querySelectorAll('.modal-overlay:not(.hidden)');
      openModals.forEach(modal => modal.classList.add('hidden'));
    }
  });

  // Setup tabs in journal
  setupJournalTabs();
}

// =============================================================================
// 15. INITIALIZATION SEQUENCE
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Load saved high score from localStorage
  try {
    const saved = localStorage.getItem('the_betrayal_best_score');
    if (saved) {
      gameState.bestScore = parseInt(saved, 10) || 0;
    }
  } catch (e) {
    console.warn('LocalStorage access unavailable:', e);
  }

  // Render SVG Character Portraits
  renderAllAvatars();

  // Initialize Animated Background Embers
  initEmbersCanvas();

  // Attach All Event Listeners
  attachEventListeners();

  // Initial HUD Update
  updateHUD();

  console.log('⚔️ THE BETRAYAL: Royal Inquest Initialized Successfully.');
});
