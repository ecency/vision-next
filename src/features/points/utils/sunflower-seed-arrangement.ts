interface Point {
  x: number;
  y: number;
  label: number;
}
const WEIGHT_CONSTANTS = {
  w1: 1, // Weight for numbers 0-9
  w2: 2, // Weight for numbers 10-99
  w3: 3 // Weight for numbers 100-999
};

function getWeight(num: number): number {
  if (isNaN(num)) return 1; // Non-numeric labels default to weight 1
  if (num >= 0 && num <= 9) return WEIGHT_CONSTANTS.w1;
  if (num >= 10 && num <= 99) return WEIGHT_CONSTANTS.w2;
  if (num >= 100 && num <= 999) return WEIGHT_CONSTANTS.w3;
  return 1; // Default weight for numbers outside 0-999
}

export function arrangeSunflowerSeeds(labels: number[], R: number, MIN_R: number): Point[] {
  const points: Point[] = [];
  const phi = (Math.sqrt(5) + 1) / 2; // Golden ratio
  const n = labels.length;

  // Calculate total weight sum for scaling
  const totalWeight = labels.reduce((sum, label) => sum + getWeight(label), 0);

  // Calculate maximum radius based on number of points
  const maxRadius = (Math.sqrt(n) * R) / Math.sqrt(labels.length);

  let cumulativeWeight = 0;

  for (let i = 0; i < n; i++) {
    const weight = getWeight(labels[i]);
    cumulativeWeight += weight;

    // Linear radius distribution adjusted by cumulative weight
    const r = MIN_R + (maxRadius - MIN_R) * (cumulativeWeight / totalWeight);
    // Calculate angle using golden angle
    const theta = (2 * Math.PI * i) / (phi * phi);

    // Convert polar to Cartesian coordinates
    const x = r * Math.cos(theta);
    const y = r * Math.sin(theta);

    points.push({ x, y, label: labels[i] });
  }

  return points;
}
