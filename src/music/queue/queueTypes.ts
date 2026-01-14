import { GuildMember, Message } from "discord.js";
import { AudioPlayer, VoiceConnection } from "@discordjs/voice";

export interface QueueItem {
  title: string;
  url: string;
  member: GuildMember;
}

export interface GuildQueue {
  connection: VoiceConnection | null;
  player: AudioPlayer | null;
  songs: QueueItem[];
  playing: boolean;
  message?: Message;
  currentTitle?: string;
}
