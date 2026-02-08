import { Message, ChatInputCommandInteraction } from "discord.js";
import { QueueManager } from "../../music/queue";
import { colorLog } from "../../utils/icons";

export default async function stopMusic(ctx: Message | ChatInputCommandInteraction) {
  const guildId = ctx.guild?.id || "unknown";
  const queue = QueueManager.getQueue(guildId);

  const reply = async (msg: string, ephemeral = true) => {
    if (ctx instanceof Message) {
      return await ctx.reply(msg);
    } else if (ctx.replied || ctx.deferred) {
      return await (ctx as ChatInputCommandInteraction).followUp({ content: msg, ephemeral });
    } else {
      return await (ctx as ChatInputCommandInteraction).reply({ content: msg, ephemeral });
    }
  };

  const allConnections = QueueManager.getAllConnections(guildId);
  if (!queue || allConnections.length === 0) {
    await reply("Không có bài nào đang phát để dừng.");
    return;
  }

  try {
    const queueCount = queue.songs.length;
    const queueInfo = queueCount > 0 
      ? ` (đã xóa ${queueCount} bài trong hàng đợi)` 
      : "";

    for (const vcConn of allConnections) {
      try {
        vcConn.player.stop();
        vcConn.connection.destroy();
      } catch (err) {
        console.error(`[Music] Lỗi khi stop/destroy cho channel ${vcConn.channelId}:`, err);
      }
    }
    
    queue.connections.clear();
    QueueManager.clearQueue(guildId);
    QueueManager.setPlaying(guildId, false);

    const controlMsg = QueueManager.getControlMessage(guildId);
    if (controlMsg) {
      try {
        await controlMsg.edit({
          content: "⏹️ **Đã dừng phát nhạc và rời phòng.**",
          components: [],
          embeds: [],
        });
        setTimeout(async () => {
          try {
            await controlMsg.delete();
          } catch {}
        }, 10_000);
      } catch (err) {
        console.error(colorLog("[Music] Lỗi khi cập nhật control message:", "red"), err);
      }
    }

    const connectionCount = allConnections.length;
    const res = await reply(
      `⏹️ **Đã dừng phát nhạc và rời phòng.**${connectionCount > 1 ? ` (${connectionCount} voice channel)` : ""}${queueInfo}`
    );

    if (ctx instanceof Message) {
      setTimeout(() => {
        (res as Message).delete().catch(() => {});
      }, 10_000);

      setTimeout(() => {
        ctx.delete().catch(() => {});
      }, 20_000);
    } else {
      setTimeout(async () => {
        try {
          if (ctx.replied || ctx.deferred) {
            await ctx.editReply({ content: "*(Đã dừng)*" }).catch(() => {});
          }
        } catch {}
      }, 8_000);
    }
  } catch (err) {
    console.error(colorLog("[Music] Lỗi khi dừng nhạc:", "red"), err);
    await reply("Đã xảy ra lỗi khi dừng nhạc.");
  }
}
