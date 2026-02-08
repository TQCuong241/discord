import { Client } from "discord.js";
import Cuongbro from "../utils/console/cuongbro";
import khiSanSang from "../events/ready";
import setupWelcome from "../events/welcomeMember";
// import { setupVLRInitializer } from "./vlrInitializer";

/**
 * Đăng ký các event handlers cho bot
 */
export function setupEventHandlers(bot: Client): void {
  // Console banner
  Cuongbro();

  // Bot ready event
  bot.once("clientReady", () => khiSanSang(bot));
  
  // Welcome member event
  setupWelcome(bot);

  // Initialize VLR tool - ĐÃ TẮT
  // setupVLRInitializer(bot);
}

