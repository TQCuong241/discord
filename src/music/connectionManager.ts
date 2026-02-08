import {
  joinVoiceChannel,
  createAudioPlayer,
  entersState,
  VoiceConnectionStatus,
  VoiceConnection,
} from "@discordjs/voice";
import { VoiceChannel } from "discord.js";

export async function joinVoice(channel: VoiceChannel) {
  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guild.id,
    adapterCreator: channel.guild.voiceAdapterCreator,
  });
  const player = createAudioPlayer();

  connection.subscribe(player);
  
  // Xử lý timeout với try-catch để tránh AbortError
  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 10_000);
  } catch (error) {
    console.warn("Voice connection timeout, nhưng vẫn tiếp tục...");
    // Vẫn trả về connection và player để không làm gián đoạn
  }
  
  return { connection, player };
}
