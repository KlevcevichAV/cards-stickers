/** Vibration-API substitute for the iOS app's UIImpactFeedbackGenerator calls. No-op where unsupported (desktop, iOS Safari). */
export type HapticStyle = 'light' | 'medium' | 'rigid'

const DURATIONS: Record<HapticStyle, number> = {
  light: 10,
  medium: 18,
  rigid: 25,
}

export function useHaptics() {
  function impact(style: HapticStyle = 'medium') {
    navigator.vibrate?.(DURATIONS[style])
  }

  return { impact }
}
