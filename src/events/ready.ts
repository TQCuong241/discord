import { Client } from "discord.js";

export default function khiSanSang(bot: Client) {
  console.log(`Bot đã đăng nhập: ${bot.user?.tag}`);
}
