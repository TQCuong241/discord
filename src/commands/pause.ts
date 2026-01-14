import { Message, ChatInputCommandInteraction } from "discord.js";
import { QueueManager } from "../music/queue";

export default async function pauseMusic(ctx: Message | ChatInputCommandInteraction) {
  const guildId = ctx.guild?.id || "unknown";
  const queue = QueueManager.getQueue(guildId);

  // ✅ Hàm reply tương thích Message / Interaction
  const reply = async (msg: string) => {
    if (ctx instanceof Message) {
      return await ctx.reply(msg);
    } else if (ctx.replied || ctx.deferred) {
      return await ctx.followUp(msg);
    } else {
      return await ctx.reply(msg);
    }
  };

  // Không có bài nào để tạm dừng
  if (!queue?.player) {
    await reply("Không có bài nào đang phát để tạm dừng.");
    return;
  }

  try {
    queue.player.pause(true);
    const res = await reply("Đã tạm dừng phát nhạc.");

    // Nếu là prefix (Message) → tự xóa sau vài giây
    if (ctx instanceof Message) {
      setTimeout(() => {
        (res as Message).delete().catch(() => {});
      }, 10_000);

      setTimeout(() => {
        ctx.delete().catch(() => {});
      }, 20_000);
    }
  } catch (err) {
    console.error("Lỗi khi tạm dừng nhạc:", err);
    await reply("Đã xảy ra lỗi khi tạm dừng nhạc.");
  }
}
