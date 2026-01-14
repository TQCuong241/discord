import { GuildMember, VoiceChannel, TextChannel } from "discord.js";
import {
  AudioPlayer,
  AudioPlayerStatus,
  VoiceConnectionStatus,
} from "@discordjs/voice";
import { ICON } from "../utils/icons";
import { joinVoice } from "./connectionManager";
import { createStreamResource } from "./streamHandler";
import {
  handleIdleEvent,
  handleConnectionEvents,
  monitorChannelEmpty,
} from "./eventHandler";
import { createNewMusicMessage } from "./controller";
import { QueueManager } from "./queue";

/**
 * Phát nhạc trong voice channel
 */
export async function playMusic(
  member: GuildMember,
  url: string,
  title?: string,
  replyTarget?: any,
  isAutoNext: boolean = false
) {
  const guildId = member.guild.id;
  const channel = member.voice.channel as VoiceChannel;
  if (!channel) throw new Error(`${ICON.warn} Bạn cần vào voice channel trước!`);

  //  Kết nối voice channel
  const { connection, player } = joinVoice(channel);

  try {
    // Tạo stream resource từ yt-dlp hoặc local
    const resource = await createStreamResource(url);
    player.play(resource);
    const queue = QueueManager.getQueue(guildId);
    queue.currentTitle = title || url;

    //  Khi bắt đầu phát
    player.once(AudioPlayerStatus.Playing, async () => {
      console.log(`${ICON.music} Bot đang phát: ${title || url}`);

      try {
        //  Tìm text channel để gửi giao diện điều khiển
        const textChannel: TextChannel =
          replyTarget?.channel ||
          member.guild.channels.cache.find(
            (ch: any) =>
              ch.isTextBased() &&
              (ch as TextChannel).permissionsFor(member.guild.members.me!)?.has("SendMessages")
          ) as TextChannel;

        //  Nếu là auto-next → xóa message cũ có nút điều khiển
        if (isAutoNext) {
          const oldMsg = QueueManager.getControlMessage(guildId);
          if (oldMsg) {
            try {
              await oldMsg.delete().catch(() => {});
            } catch (err) {
              console.warn(" Không thể xóa message điều khiển cũ:", err);
            }
          }
        }

        // Gửi message mới (hiển thị bài hiện tại)
        if (textChannel)
          await createNewMusicMessage(
            textChannel,
            player,
            connection,
            guildId,
            title || url
          );
      } catch (err) {
        console.error(" Không thể gửi giao diện điều khiển:", err);
      }
    });

    //  Đăng ký các sự kiện player
    handleIdleEvent(player, connection, guildId, replyTarget, member);
    handleConnectionEvents(connection, player, guildId);
    monitorChannelEmpty(member, player, connection, guildId, replyTarget);

    // Đánh dấu trạng thái đang phát
    QueueManager.setPlaying(guildId, true);

    return { player, connection };
  } catch (err) {
    console.error(`${ICON.error} Lỗi khi phát nhạc:`, err);
    connection.destroy();
    QueueManager.setPlaying(guildId, false);
    return null;
  }
}
