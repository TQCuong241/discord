import { Client } from "discord.js";
import { initializeVLR } from "../services/vlr";

/**
 * Khởi tạo tool VLR khi bot ready
 */
export function setupVLRInitializer(bot: Client): void {
  bot.once("clientReady", async () => {
    console.log(`${bot.user?.tag} đã đăng nhập`);
    console.log("Đang khởi động tool VLR...");
    try {
      await initializeVLR();
      console.log("Tool VLR đã sẵn sàng");
    } catch (error) {
      console.error("Lỗi khởi động tool VLR:", error);
    }
  });
}

