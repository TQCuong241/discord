import { Message, TextChannel } from "discord.js";
import { AudioPlayer, VoiceConnection } from "@discordjs/voice";
import { createMusicControls } from "./musicControls";
import { QueueManager } from "../queue";

/**
 * Collector xử lý khi người dùng bấm nút điều khiển
 */
export function setupMusicCollector(
  msg: Message,
  player: AudioPlayer,
  connection: VoiceConnection,
  guildId: string,
  channel: TextChannel
) {
  //  Hết hạn collector sau 100 phút
  const collector = msg.createMessageComponentCollector({
    time: 10 * 60 * 10000,
  });

  collector.on("collect", async (i) => {
    if (!i.isButton()) return;

    // 🔹 Lấy queue theo guild
    const queue = QueueManager.getQueue(guildId);

    try {
      switch (i.customId) {
        // Tạm dừng
        case "pause":
          if (player.state.status !== "paused") {
            player.pause(true);
            const pauseControls = createMusicControls(true, guildId);
            await i.update({
              components: pauseControls,
            });
          }
          break;

        // Tiếp tục
        case "resume":
          if (player.state.status === "paused") {
            player.unpause();
            const resumeControls = createMusicControls(false, guildId);
            await i.update({
              components: resumeControls,
            });
          }
          break;

        // Bỏ qua
        case "skip":
          await i.reply({
            content: "**Đang chuyển bài...**",
            ephemeral: true,
          });

          player.stop(true);

          setTimeout(async () => {
            try {
              await msg.delete();
            } catch {}
          }, 5000);

          setTimeout(async () => {
            try {
              await i.deleteReply();
            } catch {}
          }, 10_000);
          break;

        // Dừng
        case "stop":
          if (player.state.status !== "idle") player.stop();
          if (connection) connection.destroy();

          QueueManager.setPlaying(guildId, false);

          await i.update({
            content: ` **Đã dừng phát nhạc.**`,
            components: [],
          });

          collector.stop();
          break;

        // Danh sách bài hát
        case "list":
          const list = queue.songs;
          if (!list || list.length === 0) {
            await i.reply({
              content: "📭 **Hàng đợi trống!**",
              ephemeral: true,
            });
          } else {
            const display = list
              .slice(0, 10)
              .map(
                (s, idx) =>
                  `**${idx + 1}.** ${s.title} ${
                    s.member ? `— *${s.member.displayName}*` : ""
                  }`
              )
              .join("\n");

            const reply = await i.reply({
              content: ` **Hàng chờ (${list.length} bài):**\n${display}${
                list.length > 10 ? "\n...và nhiều hơn nữa." : ""
              }`,
              ephemeral: true, // chỉ người bấm thấy
            });

            //  Tự động xóa phản hồi sau 1 phút
            setTimeout(async () => {
              try {
                await i.deleteReply();
              } catch {}
            }, 60_000);
          }
          break;

        // Xóa bài hát
        case "delete":
          await i.reply({
            content:
              "🗑️ **Gõ lệnh** `!deleteMusic [số bài]` **để xóa bài khỏi hàng đợi.**\n" +
              "Ví dụ: `!deleteMusic 1,3` để xóa bài số 1 và 3.",
            ephemeral: true,
          });
                      //  Tự động xóa phản hồi sau 1 phút
        setTimeout(async () => {
            try {
            await i.deleteReply();
            } catch {}
        }, 60_000);

        break;
        
      }
    } catch (err) {
      console.error(" Lỗi khi xử lý nút:", err);
    }
  });

  // ⌛ Khi collector hết hạn
  collector.on("end", async () => {
    try {
      await msg.edit({
        content: `${msg.content}\n⌛ **Hết thời gian điều khiển.**`,
        components: [],
      });
    } catch {}
  });
}
