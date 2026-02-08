import {
  AudioPlayer,
  AudioPlayerStatus,
  VoiceConnection,
  VoiceConnectionStatus,
} from "@discordjs/voice";
import { GuildMember, TextChannel, VoiceChannel } from "discord.js";
import { ICON, colorLog } from "../utils";
import { QueueManager } from "./queue";
import { playMusic } from "./player";
import { VoiceChannelConnection } from "./queue/queueTypes";

const registeredIdleHandlers = new WeakSet<AudioPlayer>();

export function handleIdleEvent(
  player: AudioPlayer,
  connection: VoiceConnection,
  guildId: string,
  replyTarget: any,
  member: GuildMember
) {
  if (registeredIdleHandlers.has(player)) {
    return;
  }
  
  registeredIdleHandlers.add(player);
  
  player.on(AudioPlayerStatus.Idle, async () => {
    try {
      const next = QueueManager.getNextSong(guildId);
      if (next) {
        console.log(colorLog(`[Music] Chuyển sang bài kế: ${next.title}`, "cyan"));
        
        let validMember = next.member;
        
        if (!validMember || !validMember.voice?.channel) {
          const allConnections = QueueManager.getAllConnections(guildId);
          let guild = member?.guild || replyTarget?.guild;
          
          if (!guild && replyTarget?.channel) {
            guild = replyTarget.channel.guild;
          }
          
          if (guild) {
            for (const vcConn of allConnections) {
              try {
                const channel = guild.channels.cache.get(vcConn.channelId) as VoiceChannel;
                if (channel) {
                  const membersInChannel = channel.members.filter(m => !m.user.bot);
                  if (membersInChannel.size > 0) {
                    validMember = membersInChannel.first()!;
                    break;
                  }
                }
              } catch (err) {
                console.error(colorLog(`[Music] Lỗi khi tìm member hợp lệ từ channel ${vcConn.channelId}:`, "red"), err);
              }
            }
          }
        }
        
        if (!validMember || !validMember.voice?.channel) {
          console.error(colorLog(`[Music] Không tìm thấy member hợp lệ để phát bài tiếp theo`, "red"));
          QueueManager.setPlaying(guildId, false);
          return;
        }
        
        const result = await playMusic(validMember, next.url, next.title, replyTarget, true);
        if (result) {
          QueueManager.getQueue(guildId).currentTitle = next.title;
        } else {
          console.error(colorLog(`[Music] Không thể phát bài tiếp theo`, "red"));
        }
      } else {
      console.log(colorLog(`[Music] Hết hàng đợi, rời kênh.`, "green"));
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

      const allConnections = QueueManager.getAllConnections(guildId);
      for (const vcConn of allConnections) {
        try {
          vcConn.connection.destroy();
        } catch (err) {
          console.error(colorLog(`[Music] Lỗi khi destroy connection ${vcConn.channelId}:`, "red"), err);
        }
      }
      QueueManager.getQueue(guildId).connections.clear();
      }
    } catch (err) {
      console.error(colorLog("[Music] Lỗi khi xử lý idle event:", "red"), err);
      QueueManager.setPlaying(guildId, false);
    }
  });
}

export function handleConnectionEvents(
  connection: VoiceConnection,
  player: AudioPlayer,
  guildId: string
) {
  connection.on(VoiceConnectionStatus.Disconnected, async () => {
    console.warn(colorLog(`[Music] Bot bị ngắt kết nối hoặc bị kick khỏi kênh.`, "yellow"));
    try {
      player.stop();
      
      const allConnections = QueueManager.getAllConnections(guildId);
      const channelId = allConnections.find((vc: VoiceChannelConnection) => vc.connection === connection)?.channelId;
      if (channelId) {
        QueueManager.removeConnection(guildId, channelId);
      }
      
      if (QueueManager.getAllConnections(guildId).length === 0) {
        QueueManager.setPlaying(guildId, false);
        
        const controlMsg = QueueManager.getControlMessage(guildId);
        if (controlMsg) {
          try {
            await controlMsg.edit({
              content: " **Bot đã bị ngắt kết nối khỏi tất cả kênh.**",
              components: [],
            });
            setTimeout(async () => {
              await controlMsg.delete().catch(() => {});
            }, 10_000);
          } catch {}
        }
      }

      connection.destroy();
    } catch (err) {
      console.error(colorLog("[Music] Lỗi khi xử lý disconnect:", "red"), err);
    }
  });
}

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
        console.log(colorLog(`[Music] Bot bị kick khỏi voice channel, dừng phát.`, "yellow"));
        player.stop();
        QueueManager.setPlaying(guildId, false);
        clearInterval(checkEmptyInterval);

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
        console.log(colorLog(`[Music] Voice channel trống, dừng phát và rời phòng.`, "yellow"));
        player.stop();
        QueueManager.setPlaying(guildId, false);
        clearInterval(checkEmptyInterval);

        try {
          const textChannel: TextChannel = replyTarget?.channel;
          if (textChannel)
            await textChannel.send(`${ICON.info} **Không còn ai trong kênh, bot rời phòng.**`);
        } catch {}

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
    } catch (err) {}
  }, 5000);
}
