import { Message, ChatInputCommandInteraction } from "discord.js";
import { searchSong } from "./helpers/searchSong";
import { handlePlayLogic } from "./helpers/handlePlayLogic";

/** 🧩 Hàm phản hồi an toàn cho cả Message và Interaction (tự xóa sau thời gian) */
async function safeReply(
  ctx: Message | ChatInputCommandInteraction,
  msg: string,
  ephemeral = false,
  deleteAfterMs = 10_000
) {
  try {
    let replyObj: any;

    // 📨 Gửi tin nhắn
    if (ctx instanceof Message) {
      replyObj = await ctx.reply(msg);
    } else if (ctx.deferred && !ctx.replied) {
      replyObj = await ctx.editReply({ content: msg });
    } else if (ctx.replied) {
      replyObj = await ctx.followUp({ content: msg, ephemeral });
    } else {
      replyObj = await ctx.reply({ content: msg, ephemeral });
    }

    // ⏳ Xóa tin nhắn sau thời gian quy định
    setTimeout(async () => {
      try {
        if (ctx instanceof Message) {
          (replyObj as Message)?.delete?.().catch(() => {});
        } else {
          // Slash: chỉ xóa được nếu không ephemeral
          if (!ephemeral && "deleteReply" in ctx) {
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
 * 🎵 Lệnh phát nhạc (hỗ trợ cả !play và /play)
 */
export default async function playLenh(ctx: Message | ChatInputCommandInteraction) {
  try {
    let query = "";

    // === Xác định nội dung người dùng nhập ===
    if (ctx instanceof Message) {
      const args = ctx.content.trim().split(/\s+/);
      query = args.slice(1).join(" ");
    } else {
      query = ctx.options.getString("query", true);
    }

    // === Kiểm tra có nhập tên bài hát hay không ===
    if (!query) {
      await safeReply(
        ctx,
        ctx instanceof Message
          ? "Gõ `!play [tên bài hát hoặc link YouTube]`\nVí dụ: `!play Em của ngày hôm qua`"
          : "Gõ `/play [tên bài hát hoặc link YouTube]` để phát nhạc.",
        false
      );
      return;
    }

    // === Lấy voice channel ===
    const member =
      ctx instanceof Message
        ? ctx.member
        : ctx.guild?.members.cache.get(ctx.user.id);
    const voiceChannel = member?.voice?.channel;

    if (!voiceChannel) {
      await safeReply(ctx, "Bạn cần vào voice channel trước khi dùng lệnh này!", false);
      return;
    }

    // === Tìm bài hát ===
    const result = await searchSong(query);
    if (!result) {
      await safeReply(ctx, "Không tìm thấy bài hát nào phù hợp!", false);
      return;
    }

    // === Thực thi logic phát nhạc ===
    await handlePlayLogic(ctx, member, result.url, result.title);

    // ⏳ Xóa tin nhắn gốc (chỉ với !play)
    if (ctx instanceof Message) {
      setTimeout(() => ctx.delete().catch(() => {}), 10_000);
    } else {
      // Slash: xóa reply sau 10s
      setTimeout(async () => {
        try {
          if ("deleteReply" in ctx) await ctx.deleteReply().catch(() => {});
        } catch {}
      }, 10_000);
    }
  } catch (err) {
    console.error("Lỗi khi phát nhạc:", err);
  }
}
