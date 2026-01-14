import {
  joinVoiceChannel,
  createAudioPlayer,
  entersState,
  VoiceConnectionStatus,
  VoiceConnection,
} from "@discordjs/voice";
import { VoiceChannel } from "discord.js";

export function joinVoice(channel: VoiceChannel) {
  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guild.id,
    adapterCreator: channel.guild.voiceAdapterCreator,
  });
  const player = createAudioPlayer();

  connection.subscribe(player);
  entersState(connection, VoiceConnectionStatus.Ready, 5_000);
  return { connection, player };
}
