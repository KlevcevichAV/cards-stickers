<script setup lang="ts">
const EMOJI = ['🎉', '🎊', '⭐️', '🏆', '⚽️', '✨']
const PARTICLE_COUNT = 28

interface Particle {
  id: number
  emoji: string
  left: number
  delay: number
  duration: number
  drift: number
  rotate: number
  size: number
}

const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, (_, id) => ({
  id,
  emoji: EMOJI[Math.floor(Math.random() * EMOJI.length)],
  left: Math.random() * 100,
  delay: Math.random() * 0.4,
  duration: 1.6 + Math.random() * 1.2,
  drift: (Math.random() - 0.5) * 120,
  rotate: (Math.random() - 0.5) * 540,
  size: 14 + Math.random() * 14,
}))
</script>

<template>
  <div class="confetti" aria-hidden="true">
    <span
      v-for="p in particles"
      :key="p.id"
      class="particle"
      :style="{
        left: `${p.left}%`,
        animationDelay: `${p.delay}s`,
        animationDuration: `${p.duration}s`,
        fontSize: `${p.size}px`,
        '--drift': `${p.drift}px`,
        '--rotate': `${p.rotate}deg`,
      }"
    >
      {{ p.emoji }}
    </span>
  </div>
</template>

<style scoped>
.confetti {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.particle {
  position: absolute;
  top: -10%;
  animation-name: fall;
  animation-timing-function: ease-in;
  animation-fill-mode: forwards;
}

@keyframes fall {
  0% {
    transform: translate(0, 0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translate(var(--drift), 130vh) rotate(var(--rotate));
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .particle {
    display: none;
  }
}
</style>
