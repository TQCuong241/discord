import { Message, ChatInputCommandInteraction } from "discord.js";
import { QueueManager } from "../music/queue";

export default async function resumeMusic(ctx: Message | ChatInputCommandInteraction) {
  const guildId = ctx.guild?.id || "unknown";
  const queue = QueueManager.getQueue(guildId);

  // Hàm reply tự nhận biết Message hoặc Interaction
  const reply = async (msg: string) => {
    if (ctx instanceof Message) {
      return await ctx.reply(msg);
    } else if (ctx.replied || ctx.deferred) {
      return await ctx.followUp(msg);
    } else {
      return await ctx.reply(msg);
    }
  };

  // Không có bài nào đang phát
  if (!queue?.player) {
    await reply("Không có bài nào để tiếp tục.");
    return;
  }

  try {
    queue.player.unpause();
    const res = await reply("Tiếp tục phát nhạc.");

    // Nếu là Message → tự xóa sau thời gian
    if (ctx instanceof Message) {
      setTimeout(() => {
        (res as Message).delete().catch(() => {});
      }, 10_000);

      setTimeout(() => {
        ctx.delete().catch(() => {});
      }, 20_000);
    }
  } catch (err) {
    console.error("Lỗi khi tiếp tục phát nhạc:", err);
    await reply("Đã xảy ra lỗi khi tiếp tục phát nhạc.");
  }
}
