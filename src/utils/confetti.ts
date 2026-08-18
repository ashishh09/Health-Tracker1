import confetti from 'canvas-confetti';

export function triggerCompletionConfetti() {
  try {
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.65 },
      colors: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#06b6d4'],
    });
  } catch {
    // Ignore if not supported
  }
}

export function triggerWaterCelebration() {
  try {
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#0284c7', '#38bdf8', '#7dd3fc', '#bae6fd'],
    });
  } catch {
    // Ignore
  }
}
