import { createAudioResource, AudioPlayer, VoiceConnection } from "@discordjs/voice";
import { createMusicControls } from "../controller";
import { queues, controlMessages } from "./queueStorage";
import { QueueItem, GuildQueue, VoiceChannelConnection } from "./queueTypes";
import { Message } from "discord.js";

export class GuildQueueManager {
  getQueue(guildId: string): GuildQueue {
    if (!queues.has(guildId)) {
      const newQueue: GuildQueue = {
        connections: new Map<string, VoiceChannelConnection>(),
        songs: [],
        playing: false,
        connection: null,
        player: null,
      };
      queues.set(guildId, newQueue);
    }
    return queues.get(guildId)!;
  }

  setControlMessage(guildId: string, msg: Message) {
    const queue = this.getQueue(guildId);
    queue.message = msg;
    controlMessages.set(guildId, msg);
  }

  getControlMessage(guildId: string) {
    const queue = this.getQueue(guildId);
    return queue.message || controlMessages.get(guildId);
  }

  addSong(guildId: string, song: QueueItem) {
    const queue = this.getQueue(guildId);
    queue.songs.push(song);
    const msg = this.getControlMessage(guildId);
    if (msg) {
      const controls = createMusicControls(false, guildId);
      msg.edit({ components: controls }).catch(() => {});
    }
  }

  getNextSong(guildId: string): QueueItem | undefined {
    const queue = this.getQueue(guildId);
    return queue.songs.shift();
  }

  clearQueue(guildId: string) {
    this.getQueue(guildId).songs = [];
  }

  isPlaying(guildId: string): boolean {
    return this.getQueue(guildId).playing;
  }

  setPlaying(guildId: string, state: boolean) {
    this.getQueue(guildId).playing = state;
  }

  getPlaying(guildId: string): boolean {
    return this.getQueue(guildId).playing || false;
  }

  addConnection(guildId: string, channelId: string, connection: VoiceConnection, player: AudioPlayer) {
    const queue = this.getQueue(guildId);
    queue.connections.set(channelId, { channelId, connection, player });
    
    if (!queue.connection) {
      queue.connection = connection;
      queue.player = player;
    }
  }

  getConnection(guildId: string, channelId: string): VoiceChannelConnection | undefined {
    const queue = this.getQueue(guildId);
    return queue.connections.get(channelId);
  }

  getAllConnections(guildId: string): VoiceChannelConnection[] {
    const queue = this.getQueue(guildId);
    return Array.from(queue.connections.values());
  }

  removeConnection(guildId: string, channelId: string) {
    const queue = this.getQueue(guildId);
    queue.connections.delete(channelId);
    
    const removed = queue.connections.get(channelId);
    if (removed && queue.connection === removed.connection) {
      const first = queue.connections.values().next().value;
      if (first) {
        queue.connection = first.connection;
        queue.player = first.player;
      } else {
        queue.connection = null;
        queue.player = null;
      }
    }
  }

  getMainPlayer(guildId: string): AudioPlayer | null {
    const queue = this.getQueue(guildId);
    if (queue.player) return queue.player;
    
    const first = queue.connections.values().next().value;
    return first ? first.player : null;
  }

  getMainConnection(guildId: string): VoiceConnection | null {
    const queue = this.getQueue(guildId);
    if (queue.connection) return queue.connection;
    
    const first = queue.connections.values().next().value;
    return first ? first.connection : null;
  }

  async playNextSong(guildId: string, player: AudioPlayer, connection: VoiceConnection) {
    const queue = this.getQueue(guildId);
    const next = this.getNextSong(guildId);
    const msg = this.getControlMessage(guildId);

    if (!next) {
      if (msg) {
        const controls = createMusicControls(false, guildId);
        msg.edit({ components: controls }).catch(() => {});
      }
      return null;
    }

    const resource = createAudioResource(next.url);
    player.play(resource);
    queue.connection = connection;
    queue.player = player;
    queue.playing = true;

    if (msg) {
      const controls = createMusicControls(false, guildId);
      msg.edit({ components: controls }).catch(() => {});
    }
    return next;
  }
}

export const QueueManager = new GuildQueueManager();

