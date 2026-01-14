import { Message, ChatInputCommandInteraction, GuildMember } from "discord.js";
import { playMusic } from "../../music/player";
import { updateMusicControls } from "../../music/controller";
import { QueueManager } from "../../music/queue";

/** 🧩 Hàm phản hồi an toàn cho cả Message và Interaction (có auto delete) */
async function safeReply(
  ctx: Message | ChatInputCommandInteraction,
  msg: string,
  ephemeral = true,
  deleteAfterMs = 10_000 // thời gian xóa mặc định 10 giây
) {
  try {
    let replyObj: any;

    if (ctx instanceof Message) {
      replyObj = await ctx.reply(msg);
    } else if (ctx.deferred && !ctx.replied) {
      replyObj = await ctx.editReply({ content: msg });
    } else if (ctx.replied) {
      replyObj = await ctx.followUp({ content: msg, ephemeral });
    } else {
      replyObj = await ctx.reply({ content: msg, ephemeral });
    }

    // 🕒 Auto delete / clear sau thời gian chỉ định
    setTimeout(async () => {
      try {
        if (ctx instanceof Message) {
          // Prefix command: xóa tin bot
          (replyObj as Message)?.delete?.().catch(() => {});
        } else {
          // Slash command: chỉnh lại nội dung (không thể "xóa" ephemeral)
          if (ctx.replied || ctx.deferred) {
            await ctx.editReply({ content: "*(Tin nhắn này đã được ẩn tự động)*" }).catch(() => {});
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
 * 🎵 Xử lý logic phát nhạc chính
 * - Nếu đã có nhạc đang phát → thêm vào hàng đợi
 * - Nếu chưa có → phát luôn
 */
export async function handlePlayLogic(
  ctx: Message | ChatInputCommandInteraction,
  member: GuildMember,
  url: string,
  title: string
) {
  const guildId = ctx.guild?.id || "unknown";

  // Nếu đang phát → thêm vào hàng đợi
  if (QueueManager.getPlaying(guildId)) {
    QueueManager.addSong(guildId, { member, url, title });
    const queue = QueueManager.getQueue(guildId);

    await safeReply(
      ctx,
      `🎶 Đã thêm **${title}** vào hàng đợi (hiện có ${queue.songs.length} bài).`
    );

    await updateMusicControls(guildId);
    return;
  }

  // Nếu chưa phát → phát luôn
  try {
    const result = await playMusic(member, url, title, ctx, false);
    if (!result) {
      await safeReply(ctx, "Không thể phát nhạc — có thể video bị chặn hoặc lỗi.");
      return;
    }

    const { player, connection } = result;
    QueueManager.setPlaying(guildId, true);

    const queue = QueueManager.getQueue(guildId);
    queue.connection = connection;
    queue.player = player;

    await safeReply(ctx, `Đang phát: **${title}**`);
  } catch (err) {
    console.error("Lỗi khi phát nhạc:", err);
    await safeReply(ctx, "Không thể phát nhạc — video không hợp lệ hoặc bị chặn.");
  }
}
