import {
  Message,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import { QueueManager } from "../music/queue";
import { updateMusicControls } from "../music/controller";

/** 🧩 Gửi phản hồi an toàn cho cả Message và Interaction (tự xóa sau thời gian) */
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
          if ("deleteReply" in ctx) await ctx.deleteReply().catch(() => {});
        }
      } catch {}
    }, deleteAfterMs);

    return replyObj;
  } catch (err) {
    console.error("safeReply lỗi:", err);
  }
}

export const data = new SlashCommandBuilder()
  .setName("deletemusic")
  .setDescription("Xóa một hoặc nhiều bài hát khỏi hàng đợi")
  .addStringOption((opt) =>
    opt
      .setName("index")
      .setDescription("Số thứ tự bài hát cần xóa (VD: 1,3,5)")
      .setRequired(true)
  );

/** ⚙️ Slash Command (/deletemusic) */
export async function execute(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guild?.id || "unknown";
  const queue = QueueManager.getQueue(guildId);
  const input = interaction.options.getString("index", true);

  try {
    if (!queue?.songs || queue.songs.length === 0) {
      await safeReply(interaction, "Hàng đợi trống, không có gì để xóa.");
      return;
    }

    const songs = queue.songs as any[];
    const indexes = input
      .split(",")
      .map((x) => parseInt(x.trim(), 10) - 1)
      .filter((x) => !isNaN(x) && x >= 0 && x < songs.length);

    if (indexes.length === 0) {
      await safeReply(interaction, "Không có số bài hợp lệ để xóa.");
      return;
    }

    const removed: string[] = [];
    for (const i of indexes.sort((a, b) => b - a)) {
      const [song] = songs.splice(i, 1);
      if (song) removed.push(song.title);
    }

    await updateMusicControls(guildId);

    await safeReply(
      interaction,
      `Đã xóa ${removed.length} bài khỏi hàng đợi:\n${removed
        .map((t) => `- ${t}`)
        .join("\n")}`
    );
  } catch (err) {
    console.error("Lỗi khi xóa bài hát:", err);
    await safeReply(interaction, "Đã xảy ra lỗi khi xóa bài hát.");
  }
}

/** ⚙️ Prefix Command (!deletemusic) */
export async function executeMessage(msg: Message) {
  try {
    const args = msg.content.trim().split(/\s+/);

    if (args.length < 2 || !args[1]) {
      await safeReply(msg, "Gõ `!deletemusic [số]`. Ví dụ: `!deletemusic 1,3`");
      setTimeout(() => msg.delete().catch(() => {}), 20_000);
      return;
    }

    const guildId = msg.guild?.id || "unknown";
    const queue = QueueManager.getQueue(guildId);

    if (!queue?.songs || queue.songs.length === 0) {
      await safeReply(msg, "Hàng đợi trống, không có gì để xóa.");
      setTimeout(() => msg.delete().catch(() => {}), 20_000);
      return;
    }

    const songs = queue.songs as any[];
    const indexes = args[1]
      .split(",")
      .map((x) => parseInt(x.trim(), 10) - 1)
      .filter((x) => !isNaN(x) && x >= 0 && x < songs.length);

    if (indexes.length === 0) {
      await safeReply(msg, "Không có số bài hợp lệ để xóa.");
      setTimeout(() => msg.delete().catch(() => {}), 20_000);
      return;
    }

    const removed: string[] = [];
    for (const i of indexes.sort((a, b) => b - a)) {
      const [song] = songs.splice(i, 1);
      if (song) removed.push(song.title);
    }

    await updateMusicControls(guildId);

    await safeReply(
      msg,
      `Đã xóa ${removed.length} bài khỏi hàng đợi:\n${removed
        .map((t) => `- ${t}`)
        .join("\n")}`
    );

    // 🕒 Xóa tin nhắn người dùng sau 20s
    setTimeout(() => msg.delete().catch(() => {}), 20_000);
  } catch (err) {
    console.error("Lỗi khi xử lý lệnh !deletemusic:", err);
    await safeReply(msg, "Đã xảy ra lỗi khi xóa bài hát.");
  }
}

export default { data, execute, executeMessage };
