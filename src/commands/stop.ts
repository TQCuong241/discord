import { Message, ChatInputCommandInteraction } from "discord.js";
import { QueueManager } from "../music/queue";

export default async function stopMusic(ctx: Message | ChatInputCommandInteraction) {
  const guildId = ctx.guild?.id || "unknown";
  const queue = QueueManager.getQueue(guildId);

  // Hàm reply tự động tương thích cả Message và Interaction
  const reply = async (msg: string) => {
    if ("reply" in ctx) {
      // Nếu là Message
      return await ctx.reply(msg);
    } else if ("replied" in ctx || "deferred" in ctx) {
      // Interaction đã reply
      return await (ctx as ChatInputCommandInteraction).followUp(msg);
    } else {
      // Interaction chưa reply
      return await (ctx as ChatInputCommandInteraction).reply(msg);
    }
  };

  // Không có nhạc đang phát
  if (!queue?.player || !queue.connection) {
    await reply("Không có bài nào đang phát để dừng.");
    return;
  }

  try {
    queue.player.stop();
    queue.connection.destroy();
    QueueManager.setPlaying(guildId, false);

    const res = await reply("Đã dừng phát nhạc và rời phòng.");

    // Nếu là Message thì mới có thể xóa sau thời gian
    if ("delete" in ctx) {
      setTimeout(() => {
        (res as Message).delete().catch(() => {});
      }, 10_000);

      setTimeout(() => {
        (ctx as Message).delete().catch(() => {});
      }, 20_000);
    }
  } catch (err) {
    console.error("Lỗi khi dừng nhạc:", err);
    await reply("Đã xảy ra lỗi khi dừng nhạc.");
  }
}
