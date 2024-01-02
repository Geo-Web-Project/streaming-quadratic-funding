export function weightedPick(items: any[], weights: number[]) {
  let i;

  for (i = 1; i < weights.length; i++) {
    weights[i] += weights[i - 1];
  }

  const chance = Math.random() * weights[weights.length - 1];

  for (i = 0; i < weights.length; i++) {
    if (weights[i] > chance) {
      break;
    }
  }

  return items[i];
}

export function getRandomNumberInRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export function perSecondToPerMonth(amount: number) {
  return amount * 2628000;
}

export function fromTimeUnitsToSeconds(units: number, type: string) {
  let result = units;

  switch (type) {
    case "minutes":
      result = units * 60;
      break;
    case "hours":
      result = units * 3600;
      break;
    case "days":
      result = units * 86400;
      break;
    case "weeks":
      result = units * 604800;
      break;
    case "months":
      result = units * 2628000;
      break;
    case "years":
      result = units * 31536000;
      break;
    default:
      break;
  }

  return result;
}

export function isNumber(value: string) {
  return !isNaN(Number(value)) && !isNaN(parseFloat(value));
}

export function truncateStr(str: string, strLen: number) {
  if (str.length <= strLen) {
    return str;
  }

  const separator = "...";

  const sepLen = separator.length,
    charsToShow = strLen - sepLen,
    frontChars = Math.ceil(charsToShow / 2),
    backChars = Math.floor(charsToShow / 2);

  return (
    str.substr(0, frontChars) + separator + str.substr(str.length - backChars)
  );
}
