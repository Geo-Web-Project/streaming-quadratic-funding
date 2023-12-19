export function weightedPick(items: any[], weights: number[]) {
  let i;

  for (i = 1; i < weights.length; i++) weights[i] += weights[i - 1];

  const chance = Math.random() * weights[weights.length - 1];

  for (i = 0; i < weights.length; i++) if (weights[i] > chance) break;

  return items[i];
}

export function getRandomNumberInRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export function perSecondToPerMonth(amount: number) {
  return amount * 2628000;
}
