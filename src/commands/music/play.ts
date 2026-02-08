import { Message, ChatInputCommandInteraction } from "discord.js";
import { searchSong } from "./helpers/searchSong";
import { handlePlayLogic } from "./helpers/handlePlayLogic";
import { colorLog } from "../../utils/icons";

async function safeReply(
  ctx: Message | ChatInputCommandInteraction,
  msg: string,
  ephemeral = false,
  deleteAfterMs = 10_000
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

    setTimeout(async () => {
      try {
        if (ctx instanceof Message) {
          (replyObj as Message)?.delete?.().catch(() => {});
        } else {
          if (!ephemeral && "deleteReply" in ctx) {
            await ctx.deleteReply().catch(() => {});
          }
        }
      } catch {}
    }, deleteAfterMs);

    return replyObj;
  } catch (err) {
    console.error(colorLog("[Music] safeReply lỗi:", "red"), err);
  }
}

export default async function playLenh(ctx: Message | ChatInputCommandInteraction) {
  try {
    let query = "";

    if (ctx instanceof Message) {
      const args = ctx.content.trim().split(/\s+/);
      query = args.slice(1).join(" ");
    } else {
      query = ctx.options.getString("query", true);
    }

    if (!query) {
      await safeReply(
        ctx,
        ctx instanceof Message
          ? "Gõ `!play [tên bài hát, link YouTube hoặc Spotify]`\nVí dụ: `!play Em của ngày hôm qua` hoặc `!play https://open.spotify.com/track/...`"
          : "Gõ `/play [tên bài hát, link YouTube hoặc Spotify]` để phát nhạc.",
        false
      );
      return;
    }

    const member =
      ctx instanceof Message
        ? ctx.member
        : ctx.guild?.members.cache.get(ctx.user.id);
    const voiceChannel = member?.voice?.channel;

    if (!voiceChannel) {
      await safeReply(ctx, "Bạn cần vào voice channel trước khi dùng lệnh này!", false);
      return;
    }

    const result = await searchSong(query);
    if (!result) {
      await safeReply(ctx, "Không tìm thấy bài hát nào phù hợp!", false);
      return;
    }

    await handlePlayLogic(ctx, member, result.url, result.title);

    if (ctx instanceof Message) {
      setTimeout(() => ctx.delete().catch(() => {}), 10_000);
    } else {
      setTimeout(async () => {
        try {
          if ("deleteReply" in ctx) await ctx.deleteReply().catch(() => {});
        } catch {}
      }, 10_000);
    }
  } catch (err) {
    console.error(colorLog("[Music] Lỗi khi phát nhạc:", "red"), err);
  }
}
