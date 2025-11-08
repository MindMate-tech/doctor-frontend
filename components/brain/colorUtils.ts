import * as THREE from 'three';

/**
 * Converts a cognitive score (0-1) to a color gradient
 * 0.0-0.3: Red (severe decline)
 * 0.3-0.5: Orange (moderate decline)
 * 0.5-0.7: Yellow → Yellow-Green gradient (below average)
 * 0.7-0.9: Green (healthy)
 * 0.9-1.0: Cyan (excellent)
 */
export function scoreToColor(score: number): THREE.Color {
  const clampedScore = Math.max(0, Math.min(1, score));
  
  if (clampedScore < 0.3) {
    // Just red (no gradient)
    return new THREE.Color(0xff0000);  // Pure red
  } else if (clampedScore < 0.5) {
    // Just orange (no gradient)
    return new THREE.Color(0xff6600);  // Orange
  } else if (clampedScore < 0.7) {
    // Yellow to Yellow-Green
    const t = (clampedScore - 0.5) / 0.2;
    return new THREE.Color().lerpColors(
      new THREE.Color(0xffaa00),  // Yellow
      new THREE.Color(0xaaff00),  // Yellow-Green
      t
    );
  } else if (clampedScore < 0.9) {
    // Just green (no gradient)
    return new THREE.Color(0x00ff00);  // Green
  } else {
    // Cyan (no gradient)
    return new THREE.Color(0x00ffff);  // Cyan
  }
}

/**
 * Returns a human-readable label for a score
 */
export function scoreToLabel(score: number): string {
  if (score < 0.3) return 'Severe Decline';
  if (score < 0.5) return 'Moderate Decline';
  if (score < 0.7) return 'Below Average';
  if (score < 0.9) return 'Healthy';
  return 'Excellent';
}