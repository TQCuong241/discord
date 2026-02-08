import dotenv from "dotenv";

/**
 * Cấu hình console và dotenv
 */
export function setupConsole(): void {
  dotenv.config();

  // Xóa log .env
  const oldConsole = console.log;
  console.log = (...args) => {
    if (typeof args[0] === "string" && args[0].startsWith("[dotenv@")) return;
    oldConsole(...args);
  };

  process.on("warning", () => {});
}

