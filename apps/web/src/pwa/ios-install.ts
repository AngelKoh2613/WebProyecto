export function offersIosInstall(input: {
  userAgent: string;
  platform: string;
  maxTouchPoints: number;
  standalone: boolean;
}): boolean {
  if (input.standalone) return false;
  if (/iPhone|iPad|iPod/i.test(input.userAgent)) return true;
  return input.platform === "MacIntel" && input.maxTouchPoints > 1;
}
