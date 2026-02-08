import { Message, ChatInputCommandInteraction } from "discord.js";
import { QueueManager } from "../../music/queue";
import { updateMusicControls } from "../../music/controller";
import { colorLog } from "../../utils";

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
      replyObj = await ctx.followUp({ content: msg, ephemeral: true });
    } else {
      replyObj = await ctx.reply({ content: msg, ephemeral: true });
    }

    setTimeout(async () => {
      try {
        if (ctx instanceof Message) {
          (replyObj as Message)?.delete?.().catch(() => {});
        } else {
          if (ctx.replied || ctx.deferred) {
            await ctx.editReply({ content: "*(Đã xử lý)*" }).catch(() => {});
          }
        }
      } catch {}
    }, deleteAfterMs);

    return replyObj;
  } catch (err) {
    console.error(colorLog("[Music] safeReply lỗi:", "red"), err);
  }
}

export default async function skipMusic(ctx: Message | ChatInputCommandInteraction) {
  try {
    await safeReply(ctx, "⚠️ **Chức năng skip đang tạm thời bị tắt.**");
    return;
    
    // Tạm thời tắt chức năng skip
    /*
    const guildId = ctx.guild?.id || "unknown";
    const queue = QueueManager.getQueue(guildId);

    const mainPlayer = QueueManager.getMainPlayer(guildId);
    if (!queue || !mainPlayer) {
      await safeReply(ctx, "Không có bài nào đang phát để bỏ qua.");
      return;
    }

    if (mainPlayer.state.status === "idle") {
      await safeReply(ctx, "Player đang ở trạng thái idle, không có bài nào để bỏ qua.");
      return;
    }

    const currentTitle = queue.currentTitle || "Bài hát hiện tại";
    const nextSong = queue.songs.length > 0 ? queue.songs[0] : null;

    const allConnections = QueueManager.getAllConnections(guildId);
    let skipMessage = `⏭️ **Đang bỏ qua:** ${currentTitle}`;
    
    if (nextSong) {
      skipMessage += `\n🎵 **Bài tiếp theo:** ${nextSong.title}`;
    } else {
      skipMessage += `\n📭 **Không còn bài nào trong hàng đợi.**`;
    }
    
    if (allConnections.length > 1) {
      skipMessage += `\n🔊 **Đang phát cho ${allConnections.length} voice channel.**`;
    }

    await safeReply(ctx, skipMessage, 8000);

    for (const vcConn of allConnections) {
      try {
        if (vcConn.player.state.status !== "idle") {
          vcConn.player.stop(true);
        }
      } catch (err) {
        console.error(colorLog(`[Music] Lỗi khi stop player cho channel ${vcConn.channelId}:`, "red"), err);
      }
    }

    if (nextSong) {
      setTimeout(async () => {
        try {
          await updateMusicControls(guildId);
        } catch (err) {
          console.error(colorLog("[Music] Lỗi khi cập nhật control:", "red"), err);
        }
      }, 1000);
    }

    if (ctx instanceof Message) {
      setTimeout(() => ctx.delete().catch(() => {}), 20_000);
    }
    */
  } catch (err) {
    console.error(colorLog("[Music] Lỗi khi bỏ qua bài hát:", "red"), err);
    await safeReply(ctx, "Đã xảy ra lỗi khi bỏ qua bài hát.");
  }
}
