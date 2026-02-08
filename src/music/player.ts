import { GuildMember, VoiceChannel, TextChannel } from "discord.js";
import {
  AudioPlayer,
  AudioPlayerStatus,
  VoiceConnectionStatus,
} from "@discordjs/voice";
import { ICON, colorLog } from "../utils";
import { joinVoice } from "./connectionManager";
import { createStreamResource } from "./streamHandler";
import {
  handleIdleEvent,
  handleConnectionEvents,
  monitorChannelEmpty,
} from "./eventHandler";
import { createNewMusicMessage } from "./controller";
import { QueueManager } from "./queue";

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

  const { connection, player } = await joinVoice(channel);

  try {
    let resource: any;
    try {
      resource = await createStreamResource(url);
    } catch (err: any) {
      console.error(colorLog(`[Music] Không thể tạo stream resource:`, "red"), err);
      throw err;
    }
    
    player.play(resource);
    
    const allConnections = QueueManager.getAllConnections(guildId);
    const otherChannels: string[] = [];
    
    for (const vcConn of allConnections) {
      if (vcConn.channelId !== channel.id) {
        try {
          const resourceForOther = await createStreamResource(url);
          vcConn.player.play(resourceForOther);
          otherChannels.push(vcConn.channelId);
          console.log(colorLog(`[Music] Đang phát cho voice channel khác: ${vcConn.channelId}`, "cyan"));
        } catch (err) {
          console.error(colorLog(`[Music] Lỗi khi phát cho voice channel ${vcConn.channelId}:`, "red"), err);
        }
      }
    }
    
    const queue = QueueManager.getQueue(guildId);
    queue.currentTitle = title || url;
    
    if (otherChannels.length > 0) {
      console.log(colorLog(`[Music] Đang phát cho ${allConnections.length} voice channel trong guild`, "green"));
    }

    player.once(AudioPlayerStatus.Playing, async () => {
      console.log(colorLog(`[Music] Bot đang phát: ${title || url} (${allConnections.length} voice channel)`, "cyan"));

      try {
        const textChannel: TextChannel =
          replyTarget?.channel ||
          member.guild.channels.cache.find(
            (ch: any) =>
              ch.isTextBased() &&
              (ch as TextChannel).permissionsFor(member.guild.members.me!)?.has("SendMessages")
          ) as TextChannel;

        if (isAutoNext) {
          const oldMsg = QueueManager.getControlMessage(guildId);
          if (oldMsg) {
            try {
              await oldMsg.delete().catch(() => {});
            } catch (err) {
              console.warn(colorLog("[Music] Không thể xóa message điều khiển cũ:", "yellow"), err);
            }
          }
        }

        if (textChannel && !isAutoNext)
          await createNewMusicMessage(
            textChannel,
            player,
            connection,
            guildId,
            title || url
          );
      } catch (err) {
        console.error(colorLog("[Music] Không thể gửi giao diện điều khiển:", "red"), err);
      }
    });

    const mainPlayer = QueueManager.getMainPlayer(guildId);
    const isMainPlayer = !mainPlayer || mainPlayer === player;
    
    if (isMainPlayer) {
      handleIdleEvent(player, connection, guildId, replyTarget, member);
      handleConnectionEvents(connection, player, guildId);
      monitorChannelEmpty(member, player, connection, guildId, replyTarget);
    } else {
      handleConnectionEvents(connection, player, guildId);
      
      player.on(AudioPlayerStatus.Idle, () => {});
    }

    QueueManager.setPlaying(guildId, true);

    return { player, connection };
  } catch (err) {
    console.error(colorLog("[Music] Lỗi khi phát nhạc:", "red"), err);
    connection.destroy();
    QueueManager.removeConnection(guildId, channel.id);
    
    if (QueueManager.getAllConnections(guildId).length === 0) {
      QueueManager.setPlaying(guildId, false);
    }
    return null;
  }
}
