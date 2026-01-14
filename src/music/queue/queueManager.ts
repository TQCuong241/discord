import { createAudioResource, AudioPlayer, VoiceConnection } from "@discordjs/voice";
import { createMusicControls } from "../controller";
import { queues, controlMessages } from "./queueStorage";
import { QueueItem, GuildQueue } from "./queueTypes";
import { Message } from "discord.js";

/**
 * Quản lý toàn bộ queue bằng hướng đối tượng (OOP)
 */
export class GuildQueueManager {
  getQueue(guildId: string): GuildQueue {
    if (!queues.has(guildId)) {
      queues.set(guildId, {
        connection: null,
        player: null,
        songs: [],
        playing: false,
      });
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
    if (msg)
      msg.edit({ components: [createMusicControls(false, guildId)] }).catch(() => {});
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

  async playNextSong(guildId: string, player: AudioPlayer, connection: VoiceConnection) {
    const queue = this.getQueue(guildId);
    const next = this.getNextSong(guildId);
    const msg = this.getControlMessage(guildId);

    if (!next) {
      if (msg)
        msg.edit({ components: [createMusicControls(false, guildId)] }).catch(() => {});
      return null;
    }

    const resource = createAudioResource(next.url);
    player.play(resource);
    queue.connection = connection;
    queue.player = player;
    queue.playing = true;

    if (msg)
      msg.edit({ components: [createMusicControls(false, guildId)] }).catch(() => {});
    return next;
  }
}

export const QueueManager = new GuildQueueManager();
