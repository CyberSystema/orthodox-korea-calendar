<script lang="ts">
  type Particle = {
    left: string;
    size: number;
    delay: number;
    duration: number;
  };

  const particles: Particle[] = [
    { left: '14%', size: 6, delay: 0, duration: 3600 },
    { left: '24%', size: 4, delay: 1200, duration: 4200 },
    { left: '38%', size: 5, delay: 700, duration: 3900 },
    { left: '51%', size: 3, delay: 2000, duration: 3500 },
    { left: '63%', size: 6, delay: 900, duration: 4400 },
    { left: '76%', size: 4, delay: 1500, duration: 4100 },
    { left: '86%', size: 5, delay: 300, duration: 3700 },
  ];
</script>

<div class="splash" aria-hidden="true">
  <svg class="splash-bg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="splash-background" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="var(--wine-deep)" />
        <stop offset="0.45" stop-color="var(--wine)" />
        <stop offset="1" stop-color="var(--crimson)" />
      </linearGradient>
      <linearGradient id="splash-veil" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="var(--wine-deep)" stop-opacity="0" />
        <stop offset="1" stop-color="var(--wine-deep)" stop-opacity="0.45" />
      </linearGradient>
      <linearGradient id="splash-filigree" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="var(--gold-pale)" stop-opacity="0.12" />
        <stop offset="0.5" stop-color="var(--gold-bright)" stop-opacity="0.32" />
        <stop offset="1" stop-color="var(--gold-pale)" stop-opacity="0.12" />
      </linearGradient>
      <linearGradient id="splash-ring-gold" x1="72" y1="68" x2="148" y2="154">
        <stop offset="0" stop-color="var(--gold-pale)" />
        <stop offset="0.52" stop-color="var(--gold-bright)" />
        <stop offset="1" stop-color="var(--gold)" />
      </linearGradient>
      <linearGradient id="splash-calendar-face" x1="94" y1="96" x2="140" y2="140">
        <stop offset="0" stop-color="var(--surface-white)" />
        <stop offset="1" stop-color="var(--parchment-warm)" />
      </linearGradient>
      <linearGradient id="splash-calendar-header" x1="94" y1="98" x2="140" y2="98">
        <stop offset="0" stop-color="var(--wine-deep)" />
        <stop offset="1" stop-color="var(--crimson)" />
      </linearGradient>
      <linearGradient id="splash-calendar-mark" x1="111" y1="116" x2="124" y2="129">
        <stop offset="0" stop-color="var(--wine)" />
        <stop offset="1" stop-color="var(--crimson)" />
      </linearGradient>
    </defs>

    <rect x="0" y="0" width="100" height="100" fill="url(#splash-background)" />
    <path d="M0 18 C14 8, 28 8, 42 18 C56 28, 70 28, 84 18 C91 13, 96 11, 100 12 V0 H0 Z" fill="var(--wine-soft)" opacity="0.3" />
    <path d="M0 82 C14 72, 28 72, 42 82 C56 92, 70 92, 84 82 C91 77, 96 75, 100 76 V100 H0 Z" fill="var(--wine-deep)" opacity="0.24" />

    <g opacity="0.18" stroke="url(#splash-filigree)" stroke-width="0.5" fill="none">
      <path d="M0 18 H100" />
      <path d="M0 82 H100" />
      <path d="M18 0 V100" />
      <path d="M82 0 V100" />
      <path d="M8 50 Q16 42 24 50 T40 50 T56 50 T72 50 T88 50" />
    </g>

    <g opacity="0.7" stroke="var(--gold-pale)" stroke-width="0.45" fill="none">
      <path d="M11 14 C17 7, 25 7, 31 14 C37 21, 45 21, 51 14" />
      <path d="M49 14 C55 7, 63 7, 69 14 C75 21, 83 21, 89 14" />
      <path d="M11 86 C17 93, 25 93, 31 86 C37 79, 45 79, 51 86" />
      <path d="M49 86 C55 93, 63 93, 69 86 C75 79, 83 79, 89 86" />
    </g>

    <rect x="0" y="0" width="100" height="100" fill="url(#splash-veil)" />
  </svg>

  {#each particles as particle}
    <span
      class="particle"
      style={`left:${particle.left};width:${particle.size}px;height:${particle.size}px;border-radius:${particle.size / 2}px;animation-delay:${particle.delay}ms;animation-duration:${particle.duration}ms;`}
    ></span>
  {/each}

  <div class="halo"></div>

  <div class="ring-layer ring-layer-slow">
    <svg width="360" height="360" viewBox="0 0 360 360">
      <circle cx="180" cy="180" r="150" fill="none" stroke="var(--gold-dim)" stroke-width="1.2" />
      <circle cx="180" cy="180" r="128" fill="none" stroke="var(--gold-dim)" stroke-width="1.1" stroke-dasharray="3 9" />
      <circle cx="180" cy="30" r="4" fill="var(--gold-bright)" />
      <circle cx="330" cy="180" r="4" fill="var(--gold-bright)" />
      <circle cx="180" cy="330" r="4" fill="var(--gold-bright)" />
      <circle cx="30" cy="180" r="4" fill="var(--gold-bright)" />
    </svg>
  </div>

  <div class="ring-layer ring-layer-fast">
    <svg width="300" height="300" viewBox="0 0 300 300">
      <g opacity="0.72" stroke="var(--gold-pale)" stroke-width="1.2" fill="none" stroke-linecap="round">
        <path d="M150 18 L150 48" />
        <path d="M150 282 L150 252" />
        <path d="M18 150 L48 150" />
        <path d="M282 150 L252 150" />
        <path d="M56 56 L76 76" />
        <path d="M244 244 L224 224" />
        <path d="M56 244 L76 224" />
        <path d="M244 56 L224 76" />
      </g>
      <g opacity="0.34" stroke="var(--gold-bright)" stroke-width="1" fill="none">
        <circle cx="150" cy="150" r="102" />
        <path d="M150 48 C178 84, 214 122, 252 150 C214 178, 178 216, 150 252 C122 216, 86 178, 48 150 C86 122, 122 84, 150 48 Z" />
      </g>
    </svg>
  </div>

  <div class="emblem-wrap">
    <svg class="emblem" width="246" height="246" viewBox="0 0 220 220">
      <circle cx="110" cy="110" r="98" fill="none" stroke="url(#splash-ring-gold)" stroke-width="4" />
      <circle cx="110" cy="110" r="86" fill="none" stroke="var(--gold-pale)" stroke-width="1.8" />

      <g opacity="0.92" stroke="url(#splash-ring-gold)" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="M110 18 L110 34" />
        <path d="M110 186 L110 202" />
        <path d="M18 110 L34 110" />
        <path d="M186 110 L202 110" />
      </g>

      <g opacity="0.9" fill="var(--gold-pale)">
        <circle cx="110" cy="24" r="3.4" />
        <circle cx="196" cy="110" r="3.4" />
        <circle cx="110" cy="196" r="3.4" />
        <circle cx="24" cy="110" r="3.4" />
      </g>

      <rect x="62" y="66" width="96" height="92" rx="20" fill="url(#splash-calendar-face)" />
      <rect x="62" y="66" width="96" height="24" rx="20" fill="url(#splash-calendar-header)" />
      <line x1="84" y1="66" x2="84" y2="46" stroke="var(--gold-bright)" stroke-width="4" stroke-linecap="round" />
      <line x1="136" y1="66" x2="136" y2="46" stroke="var(--gold-bright)" stroke-width="4" stroke-linecap="round" />
      <rect x="80" y="102" width="60" height="42" rx="12" fill="var(--surface)" />

      <g stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round" fill="none">
        <path d="M110 108 L110 136" stroke="url(#splash-calendar-mark)" />
        <path d="M96 122 L124 122" stroke="url(#splash-calendar-mark)" />
        <path d="M93 150 L104 162 L128 138" stroke="var(--gold)" />
      </g>

      <g opacity="0.92" stroke="var(--gold-bright)" stroke-width="2.2" fill="none" stroke-linecap="round">
        <path d="M74 83 C80 76, 86 74, 93 76" />
        <path d="M126 76 C133 74, 139 76, 145 83" />
      </g>
    </svg>
  </div>

  <div class="text-wrap">
    <h1 class="title">ORTHODOX KOREA</h1>
    <p class="subtitle">CALENDAR OF FEASTS, FASTS, AND LITURGICAL MEMORY</p>
  </div>

  <div class="progress-track">
    <div class="progress-fill"></div>
  </div>
</div>

<style>
  .splash {
    position: fixed;
    inset: 0;
    z-index: 2000;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background: var(--wine-deep);
    pointer-events: auto;
  }

  .splash-bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .halo {
    position: absolute;
    width: min(46vw, 270px);
    aspect-ratio: 1;
    border-radius: 999px;
    background: rgba(212, 175, 82, 0.12);
    animation: splash-halo 2600ms ease-in-out infinite alternate;
  }

  .ring-layer {
    position: absolute;
    display: grid;
    place-items: center;
    transform-origin: center;
  }

  .ring-layer-slow {
    animation: splash-spin 18s linear infinite;
  }

  .ring-layer-fast {
    animation: splash-spin-reverse 11s linear infinite;
  }

  .emblem-wrap {
    position: relative;
    z-index: 2;
    display: grid;
    place-items: center;
    animation: splash-float 3000ms ease-in-out infinite alternate;
  }

  .emblem {
    width: min(48vw, 246px);
    height: auto;
  }

  .text-wrap {
    position: absolute;
    bottom: clamp(7rem, 17vh, 10rem);
    z-index: 2;
    width: min(90vw, 360px);
    text-align: center;
    animation: splash-rise 2400ms cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  .title {
    margin: 0;
    color: #eedfae;
    font-family: var(--serif);
    font-size: clamp(1.6rem, 4vw, 1.9rem);
    letter-spacing: 0.18em;
  }

  .subtitle {
    margin: 0.8rem 0 0;
    color: var(--gold-pale);
    font-size: clamp(0.68rem, 1.8vw, 0.82rem);
    letter-spacing: 0.12em;
    line-height: 1.6;
    opacity: 0;
    animation: splash-rise 2800ms 500ms cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  .progress-track {
    position: absolute;
    left: 50%;
    bottom: clamp(2.4rem, 8vh, 4rem);
    z-index: 2;
    width: min(76vw, 320px);
    height: 4px;
    border-radius: 999px;
    overflow: hidden;
    transform: translateX(-50%);
    background: rgba(240, 232, 216, 0.18);
  }

  .progress-fill {
    width: 100%;
    height: 100%;
    transform-origin: left center;
    transform: scaleX(0.06);
    border-radius: 999px;
    background: var(--gold-bright);
    animation: splash-progress 5000ms cubic-bezier(0.65, 0, 0.35, 1) forwards;
  }

  .particle {
    position: absolute;
    bottom: clamp(12rem, 24vh, 170px);
    background: var(--gold-pale);
    box-shadow: 0 0 10px rgba(212, 175, 82, 0.45);
    opacity: 0;
    animation-name: splash-particle;
    animation-timing-function: linear;
    animation-iteration-count: infinite;
  }

  @keyframes splash-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes splash-spin-reverse {
    from { transform: rotate(0deg); }
    to { transform: rotate(-360deg); }
  }

  @keyframes splash-halo {
    from {
      opacity: 0.18;
      transform: scale(0.92);
    }
    to {
      opacity: 0.55;
      transform: scale(1.06);
    }
  }

  @keyframes splash-float {
    from { transform: translateY(4px); }
    to { transform: translateY(-6px); }
  }

  @keyframes splash-rise {
    from {
      opacity: 0;
      transform: translateY(18px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes splash-progress {
    from { transform: scaleX(0.06); }
    to { transform: scaleX(1); }
  }

  @keyframes splash-particle {
    0% {
      opacity: 0;
      transform: translateY(140px) scale(0.6);
    }
    15% {
      opacity: 0.85;
    }
    75% {
      opacity: 0.3;
    }
    100% {
      opacity: 0;
      transform: translateY(-160px) scale(1.2);
    }
  }

  @media (max-width: 640px) {
    .ring-layer-slow svg {
      width: min(82vw, 320px);
      height: auto;
    }

    .ring-layer-fast svg {
      width: min(68vw, 270px);
      height: auto;
    }

    .text-wrap {
      bottom: 7.2rem;
    }
  }
</style>