export const ICON = {
  info: "->",
  music: "->",
  play: "->",
  success: "->",
  error: "->",
  warn: "->",
  sad: "->",
  stop: "â¹",
  next: "â­",
  prev: "â®",
  loading: "@",
} as const;

export const COLORS = {
  reset: "\u001b[0m",
  bright: "\u001b[1m",
  dim: "\u001b[2m",
  red: "\u001b[31m",
  green: "\u001b[32m",
  yellow: "\u001b[33m",
  blue: "\u001b[34m",
  magenta: "\u001b[35m",
  cyan: "\u001b[36m",
  white: "\u001b[37m",
  gray: "\u001b[90m",
} as const;

export function colorLog(message: string, color: keyof typeof COLORS = "white"): string {
  return `${COLORS[color]}${message}${COLORS.reset}`;
}
