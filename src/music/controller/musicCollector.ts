import { Message, TextChannel } from "discord.js";
import { AudioPlayer, VoiceConnection } from "@discordjs/voice";
import { createMusicControls } from "./musicControls";
import { QueueManager } from "../queue";
import { colorLog } from "../../utils";

export function setupMusicCollector(
  msg: Message,
  player: AudioPlayer,
  connection: VoiceConnection,
  guildId: string,
  channel: TextChannel
) {
  const collector = msg.createMessageComponentCollector({
    time: 10 * 60 * 10000,
  });

  collector.on("collect", async (i) => {
    if (!i.isButton()) return;

    const queue = QueueManager.getQueue(guildId);
    const allConnections = QueueManager.getAllConnections(guildId);

    try {
      switch (i.customId) {
        case "pause":
          if (player.state.status !== "paused") {
            for (const vcConn of allConnections) {
              try {
                if (vcConn.player.state.status !== "paused") {
                  vcConn.player.pause(true);
                }
              } catch (err) {
                console.error(colorLog(`[Music] Lỗi khi pause player cho channel ${vcConn.channelId}:`, "red"), err);
              }
            }
            const pauseControls = createMusicControls(true, guildId);
            await i.update({
              components: pauseControls,
            });
          }
          break;

        case "resume":
          if (player.state.status === "paused") {
            for (const vcConn of allConnections) {
              try {
                if (vcConn.player.state.status === "paused") {
                  vcConn.player.unpause();
                }
              } catch (err) {
                console.error(colorLog(`[Music] Lỗi khi resume player cho channel ${vcConn.channelId}:`, "red"), err);
              }
            }
            const resumeControls = createMusicControls(false, guildId);
            await i.update({
              components: resumeControls,
            });
          }
          break;

        case "skip":
          await i.reply({
            content: "⚠️ **Chức năng skip đang tạm thời bị tắt.**",
            ephemeral: true,
          });
          break;
          
          // Tạm thời tắt chức năng skip
          // const nextSong = queue.songs.length > 0 ? queue.songs[0] : null;
          // const currentTitle = queue.currentTitle || "Bài hát hiện tại";

          // let skipMessage = `⏭️ **Đang bỏ qua:** ${currentTitle}`;
          // if (nextSong) {
          //   skipMessage += `\n🎵 **Bài tiếp theo:** ${nextSong.title}`;
          // } else {
          //   skipMessage += `\n📭 **Không còn bài nào trong hàng đợi.**`;
          // }

          // await i.reply({
          //   content: skipMessage,
          //   ephemeral: true,
          // });

          // for (const vcConn of allConnections) {
          //   try {
          //     vcConn.player.stop(true);
          //   } catch (err) {
          //     console.error(colorLog(`[Music] Lỗi khi stop player cho channel ${vcConn.channelId}:`, "red"), err);
          //   }
          // }

          // setTimeout(async () => {
          //   try {
          //     const { updateMusicControls } = await import("./index");
          //     await updateMusicControls(guildId);
          //   } catch (err) {
          //     console.error(colorLog("[Music] Lỗi khi cập nhật control:", "red"), err);
          //   }
          // }, 1000);

          // setTimeout(async () => {
          //   try {
          //     await i.deleteReply();
          //   } catch {}
          // }, 8_000);
          // break;

        case "stop":
          for (const vcConn of allConnections) {
            try {
              if (vcConn.player.state.status !== "idle") {
                vcConn.player.stop();
              }
              vcConn.connection.destroy();
            } catch (err) {
              console.error(`[Music] Lỗi khi stop/destroy cho channel ${vcConn.channelId}:`, err);
            }
          }
          
          queue.connections.clear();
          QueueManager.setPlaying(guildId, false);

          await i.update({
            content: ` **Đã dừng phát nhạc.**`,
            components: [],
          });

          collector.stop();
          break;

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
              ephemeral: true,
            });

            setTimeout(async () => {
              try {
                await i.deleteReply();
              } catch {}
            }, 60_000);
          }
          break;

        case "delete":
          await i.reply({
            content:
              "🗑️ **Gõ lệnh** `!deleteMusic [số bài]` **để xóa bài khỏi hàng đợi.**\n" +
              "Ví dụ: `!deleteMusic 1,3` để xóa bài số 1 và 3.",
            ephemeral: true,
          });
        setTimeout(async () => {
            try {
            await i.deleteReply();
            } catch {}
        }, 60_000);

        break;
        
      }
    } catch (err) {
      console.error(colorLog("[Music] Lỗi khi xử lý nút:", "red"), err);
    }
  });

  collector.on("end", async () => {
    try {
      await msg.edit({
        content: `${msg.content}\n⌛ **Hết thời gian điều khiển.**`,
        components: [],
      });
    } catch {}
  });
}
