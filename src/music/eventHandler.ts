import {
  AudioPlayer,
  AudioPlayerStatus,
  VoiceConnection,
  VoiceConnectionStatus,
} from "@discordjs/voice";
import { GuildMember, TextChannel, VoiceChannel } from "discord.js";
import { ICON } from "../utils/icons";
import { QueueManager } from "./queue";
import { playMusic } from "./player";

/**
 * Khi bài hát kết thúc
 */
export function handleIdleEvent(
  player: AudioPlayer,
  connection: VoiceConnection,
  guildId: string,
  replyTarget: any,
  member: GuildMember
) {
  player.on(AudioPlayerStatus.Idle, async () => {
    const next = QueueManager.getNextSong(guildId);
    if (next) {
      console.log(`${ICON.play} Chuyển sang bài kế: ${next.title}`);
      await playMusic(next.member, next.url, next.title, replyTarget, true);
      QueueManager.getQueue(guildId).currentTitle = next.title;
    } else {
      console.log(`${ICON.success} Hết hàng đợi, rời kênh.`);
      QueueManager.setPlaying(guildId, false);

      try {
        const textChannel: TextChannel = replyTarget?.channel;
        if (textChannel){
            const notify = await textChannel.send(
            `${ICON.info} **Hết hàng đợi, bot rời kênh.**`
            );

            setTimeout(() => {
            notify.delete().catch(() => {});
            }, 10_000);
        }
      } catch {}

      //  Xóa message điều khiển
      const controlMsg = QueueManager.getControlMessage(guildId);
      if (controlMsg) {
        try {
          await controlMsg.edit({
            content: " **Bot đã rời phòng.**",
            components: [],
          });
          setTimeout(async () => {
            await controlMsg.delete().catch(() => {});
          }, 10_000);
        } catch {}
      }

      connection.destroy();
    }
  });
}

/**
 *  Khi bot bị ngắt kết nối hoặc kick khỏi voice
 */
export function handleConnectionEvents(
  connection: VoiceConnection,
  player: AudioPlayer,
  guildId: string
) {
  connection.on(VoiceConnectionStatus.Disconnected, async () => {
    console.warn(`${ICON.warn} Bot bị ngắt kết nối hoặc bị kick khỏi kênh.`);
    try {
      player.stop();
      QueueManager.setPlaying(guildId, false);

      //  Xóa message điều khiển
      const controlMsg = QueueManager.getControlMessage(guildId);
      if (controlMsg) {
        try {
          await controlMsg.edit({
            content: " **Bot đã bị ngắt kết nối khỏi kênh.**",
            components: [],
          });
          setTimeout(async () => {
            await controlMsg.delete().catch(() => {});
          }, 10_000);
        } catch {}
      }

      connection.destroy();
    } catch (err) {
      console.error(" Lỗi khi xử lý disconnect:", err);
    }
  });
}

/**
 * Theo dõi khi voice channel trống → bot rời kênh
 */
export function monitorChannelEmpty(
  member: GuildMember,
  player: AudioPlayer,
  connection: VoiceConnection,
  guildId: string,
  replyTarget: any
) {
  const checkEmptyInterval = setInterval(async () => {
    try {
      const currentChannel = member.guild.members.me?.voice?.channel as VoiceChannel;
      if (!currentChannel) {
        console.log(`${ICON.warn} Bot bị kick khỏi voice channel, dừng phát.`);
        player.stop();
        QueueManager.setPlaying(guildId, false);
        clearInterval(checkEmptyInterval);

        //  Xóa message điều khiển
        const controlMsg = QueueManager.getControlMessage(guildId);
        if (controlMsg) {
          try {
            await controlMsg.edit({
              content: " **Bot đã bị kick khỏi kênh.**",
              components: [],
            });
            setTimeout(async () => {
              await controlMsg.delete().catch(() => {});
            }, 10_000);
          } catch {}
        }

        connection.destroy();
        return;
      }

      const listeners = currentChannel.members.filter((m) => !m.user.bot);
      if (listeners.size === 0) {
        console.log(`${ICON.warn} Voice channel trống, dừng phát và rời phòng.`);
        player.stop();
        QueueManager.setPlaying(guildId, false);
        clearInterval(checkEmptyInterval);

        try {
          const textChannel: TextChannel = replyTarget?.channel;
          if (textChannel)
            await textChannel.send(`${ICON.info} **Không còn ai trong kênh, bot rời phòng.**`);
        } catch {}

        //  Xóa message điều khiển
        const controlMsg = QueueManager.getControlMessage(guildId);
        if (controlMsg) {
          try {
            await controlMsg.edit({
              content: "👋 **Bot đã rời kênh vì không còn ai.**",
              components: [],
            });
            setTimeout(async () => {
              await controlMsg.delete().catch(() => {});
            }, 10_000);
          } catch {}
        }

        connection.destroy();
      }
    } catch (err) {
    //   console.error(" Lỗi khi kiểm tra voice channel:", err);
    }
  }, 5000);
}
