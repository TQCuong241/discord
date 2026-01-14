import { Message, ChatInputCommandInteraction } from "discord.js";
import { QueueManager } from "../music/queue";

/** 🧩 Hàm phản hồi an toàn cho cả Message và Interaction (tự xóa sau thời gian) */
async function safeReply(
  ctx: Message | ChatInputCommandInteraction,
  msg: string,
  deleteAfterMs = 10_000
) {
  try {
    let replyObj: any;

    if (ctx instanceof Message) {
      replyObj = await ctx.reply(msg);
    } else if (ctx.deferred && !ctx.replied) {
      replyObj = await ctx.editReply({ content: msg });
    } else if (ctx.replied) {
      replyObj = await ctx.followUp({ content: msg });
    } else {
      replyObj = await ctx.reply({ content: msg });
    }

    // ⏳ Xóa tin nhắn sau thời gian quy định
    setTimeout(async () => {
      try {
        if (ctx instanceof Message) {
          (replyObj as Message)?.delete?.().catch(() => {});
        } else {
          if ("deleteReply" in ctx) {
            await ctx.deleteReply().catch(() => {});
          }
        }
      } catch {}
    }, deleteAfterMs);

    return replyObj;
  } catch (err) {
    console.error("safeReply lỗi:", err);
  }
}

/**
 * ⏭️ Lệnh bỏ qua bài hát (hỗ trợ cả !skip và /skip)
 */
export default async function skipMusic(ctx: Message | ChatInputCommandInteraction) {
  try {
    const guildId = ctx.guild?.id || "unknown";
    const queue = QueueManager.getQueue(guildId);

    if (!queue || !queue.player) {
      await safeReply(ctx, "Không có bài nào đang phát để bỏ qua.");
      return;
    }

    // Dừng player → tự phát bài kế tiếp
    queue.player.stop(true);

    await safeReply(ctx, "Đang chuyển sang bài kế tiếp...");

    // Nếu là message thì xóa tin nhắn gốc của người dùng sau 20s
    if (ctx instanceof Message) {
      setTimeout(() => ctx.delete().catch(() => {}), 20_000);
    } else {
      // Với slash command → xóa reply sau 10s đã có trong safeReply
    }
  } catch (err) {
    console.error("Lỗi khi bỏ qua bài hát:", err);
    await safeReply(ctx, "Đã xảy ra lỗi khi bỏ qua bài hát.");
  }
}
