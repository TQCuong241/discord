import { GuildMember, Message } from "discord.js";
import { AudioPlayer, VoiceConnection } from "@discordjs/voice";

export interface QueueItem {
  title: string;
  url: string;
  member: GuildMember;
}

export interface VoiceChannelConnection {
  channelId: string;
  connection: VoiceConnection;
  player: AudioPlayer;
}

export interface GuildQueue {
  // Hỗ trợ nhiều voice channel trong cùng một guild
  connections: Map<string, VoiceChannelConnection>; // Map<channelId, {connection, player}>
  songs: QueueItem[];
  playing: boolean;
  message?: Message;
  currentTitle?: string;
  
  // Giữ lại để tương thích với code cũ (sẽ deprecated)
  connection?: VoiceConnection | null;
  player?: AudioPlayer | null;
}
