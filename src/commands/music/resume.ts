import { Message, ChatInputCommandInteraction } from "discord.js";
import { QueueManager } from "../../music/queue";
import { createMusicControls } from "../../music/controller";
import { colorLog } from "../../utils/icons";

export default async function resumeMusic(ctx: Message | ChatInputCommandInteraction) {
  const guildId = ctx.guild?.id || "unknown";
  const queue = QueueManager.getQueue(guildId);

  const reply = async (msg: string, ephemeral = true) => {
    if (ctx instanceof Message) {
      return await ctx.reply(msg);
    } else if (ctx.replied || ctx.deferred) {
      return await ctx.followUp({ content: msg, ephemeral });
    } else {
      return await ctx.reply({ content: msg, ephemeral });
    }
  };

  const mainPlayer = QueueManager.getMainPlayer(guildId);
  if (!queue || !mainPlayer) {
    await reply("Không có bài nào để tiếp tục.");
    return;
  }

  if (mainPlayer.state.status !== "paused") {
    await reply("Nhạc không ở trạng thái tạm dừng.");
    return;
  }

  try {
    const allConnections = QueueManager.getAllConnections(guildId);
    for (const vcConn of allConnections) {
      try {
        if (vcConn.player.state.status === "paused") {
          vcConn.player.unpause();
        }
      } catch (err) {
        console.error(`[Music] Lỗi khi resume player cho channel ${vcConn.channelId}:`, err);
      }
    }
    
    const connectionCount = allConnections.length;
    const res = await reply(
      `▶️ **Tiếp tục phát nhạc.**${connectionCount > 1 ? ` (${connectionCount} voice channel)` : ""}`
    );

    const controlMsg = QueueManager.getControlMessage(guildId);
    if (controlMsg) {
      try {
        const resumeControls = createMusicControls(false, guildId);
        await controlMsg.edit({ components: resumeControls });
      } catch (err) {
        console.error(colorLog("[Music] Lỗi khi cập nhật control buttons:", "red"), err);
      }
    }

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
            await ctx.editReply({ content: "*(Đã tiếp tục)*" }).catch(() => {});
          }
        } catch {}
      }, 8_000);
    }
  } catch (err) {
    console.error(colorLog("[Music] Lỗi khi tiếp tục phát nhạc:", "red"), err);
    await reply("Đã xảy ra lỗi khi tiếp tục phát nhạc.");
  }
}
