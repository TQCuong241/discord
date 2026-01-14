import {
  Message,
  ChatInputCommandInteraction,
  GuildMember,
  VoiceBasedChannel,
} from "discord.js";

import slugify from "slugify";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import { spawn } from "child_process";

import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
} from "@discordjs/voice";

import { getFullChapter } from "../apiMTC/index";

export default {
  name: "mtc",

  createFolder(truyenSlug: string, chuongSlug: string) {
    const base = path.join("tts_cache", truyenSlug, chuongSlug);
    if (!fs.existsSync(base)) fs.mkdirSync(base, { recursive: true });
    return base;
  },

  // ===============================
  // PREFIX !mtc
  // ===============================
  async executeMessage(msg: Message, args: string[]) {
    if (args.length < 2) {
      return msg.reply("Dùng: `!mtc <tên truyện> <chương> [speed]`");
    }

    const tenTruyen = args.slice(0, -2).join(" ");
    const chapter = args[args.length - 2];
    const speedArg = args[args.length - 1];
    const speed = isNaN(Number(speedArg)) ? 1 : Number(speedArg);

    const slug = slugify(tenTruyen, { lower: true, strict: true });
    const chuongSlug = `chuong-${chapter}`;

    const vc = (msg.member as GuildMember).voice.channel as VoiceBasedChannel;
    if (!vc) return msg.reply("Bạn phải vào voice channel!");

    // await msg.reply(`Đang tải chương **${slug} - ${chuongSlug}**...`);

    const text = await getFullChapter(slug, chuongSlug);
    await this.readTextInVoice(vc, text, speed, slug, chuongSlug);
  },

  // ===============================
  // SLASH CMD
  // ===============================
  async execute(
    interaction: ChatInputCommandInteraction,
    options?: { ten: string; chapterStart: number; speed: number }
  ) {
    const ten = options?.ten ?? interaction.options.getString("ten", true);
    const chapter =
      options?.chapterStart ?? interaction.options.getInteger("chuong", true);
    const speed =
      options?.speed ?? interaction.options.getNumber("speed") ?? 1;

    const slug = slugify(ten, { lower: true });
    const chuongSlug = `chuong-${chapter}`;

    const vc = (interaction.member as GuildMember).voice
      .channel as VoiceBasedChannel;

    if (!vc) return interaction.reply("Vào voice trước!");

    // await interaction.reply(
    //   `Đang tải chương **${slug} - ${chuongSlug}**...`
    // );

    const text = await getFullChapter(slug, chuongSlug);
    await this.readTextInVoice(vc, text, speed, slug, chuongSlug);
  },

  // ===============================
  // ⭐ GOOGLE TTS
  // ===============================
  async googleTTS(text: string, speed: number, index: number, folder: string) {
    const googleSpeed = Math.min(speed, 1.2);
    const url =
      "https://translate.googleapis.com/translate_tts?ie=UTF-8&q=" +
      encodeURIComponent(text) +
      `&tl=vi&client=tw-ob&ttsspeed=${googleSpeed}`;

    const res = await fetch(url);
    const buffer = Buffer.from(await res.arrayBuffer());

    const filePath = path.join(folder, `tts_${index}.mp3`);
    fs.writeFileSync(filePath, buffer);

    return filePath;
  },

  // ===============================
  // 🎧 AUTO STREAM + AUTO NEXT CHAPTER
  // ===============================
  async readTextInVoice(
    vc: VoiceBasedChannel,
    text: string,
    speed: number,
    truyenSlug: string,
    chuongSlug: string
  ) {
    let chunks: any = this.splitBySentences(text, 180);
    let folder = this.createFolder(truyenSlug, chuongSlug);

    console.log(`Chương có ${chunks.length} đoạn`);

    // JOIN VC
    const conn = joinVoiceChannel({
      channelId: vc.id,
      guildId: vc.guild.id,
      adapterCreator: vc.guild.voiceAdapterCreator,
      selfDeaf: false,
    });

    const player = createAudioPlayer();
    conn.subscribe(player);

    // Tính filter tăng tốc
    const googleSpeed = Math.min(speed, 1.2);
    let remainingSpeed = speed / googleSpeed;

    const filters: string[] = [];
    while (remainingSpeed > 2) {
      filters.push("atempo=2.0");
      remainingSpeed /= 2;
    }
    filters.push(`atempo=${remainingSpeed}`);

    let queue: string[] = [];
    let index = 0;

    // Load 5 đoạn đầu
    const loadBatch = async () => {
      const end = Math.min(index + 5, chunks.length);
      for (; index < end; index++) {
        const file = await this.googleTTS(
          chunks[index],
          speed,
          index,
          folder
        );
        queue.push(file);
      }
    };

    await loadBatch();

    // ===============================
    // AUTO LOAD CHƯƠNG TIẾP THEO
    // ===============================
    const tryLoadNextChapter = async () => {
      const currentNum = Number(chuongSlug.replace("chuong-", ""));
      const nextSlug = `chuong-${currentNum + 1}`;

      console.log("AUTO NEXT → Tải chương:", nextSlug);

      const textNext = await getFullChapter(truyenSlug, nextSlug);

      if (!textNext) return;

      const newChunks = this.splitBySentences(textNext, 180);

      // đổi sang thư mục chương mới
      folder = this.createFolder(truyenSlug, nextSlug);
      chuongSlug = nextSlug;

      // merge vào queue
      chunks = chunks.concat(newChunks);
    };

    // ===============================
    // PLAY STREAM
    // ===============================
    while (queue.length > 0) {
      const file = queue.shift();

      // Khi còn ≤ 2 đoạn + gần cuối chương → tải chương mới
      if (queue.length <= 2 && index >= chunks.length - 10) {
        tryLoadNextChapter();
      }

      // Tải thêm batch nếu còn
      if (queue.length <= 2 && index < chunks.length) {
        loadBatch();
      }

      // STREAM
      const ffmpeg = spawn("ffmpeg", [
        "-i",
        file!,
        "-filter:a",
        filters.join(","),
        "-f",
        "mp3",
        "pipe:1",
      ]);

      const resource = createAudioResource(ffmpeg.stdout);
      player.play(resource);

      await new Promise((resolve) =>
        player.once(AudioPlayerStatus.Idle, resolve)
      );

      // xoá file sau khi play
      try {
        fs.unlinkSync(file!);
      } catch {}
    }

    conn.destroy();

    console.log("Đọc xong toàn bộ!");
  },

  // ===============================
  // CHIA THEO CÂU + CHIA NHỎ
  // ===============================
  splitBySentences(text: string, maxLen = 180) {
    const sentences = text
      .replace(/\n+/g, " ")
      .split(/(?<=[.!?])/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const result: string[] = [];
    let current = "";

    for (const sentence of sentences) {
      if (sentence.length > maxLen) {
        const words = sentence.split(" ");
        let temp = "";

        for (const w of words) {
          if ((temp + " " + w).trim().length > maxLen) {
            result.push(temp.trim());
            temp = w;
          } else temp += " " + w;
        }
        if (temp.length) result.push(temp.trim());
        continue;
      }

      if ((current + " " + sentence).trim().length <= maxLen) {
        current += " " + sentence;
      } else {
        if (current.length) result.push(current.trim());
        current = sentence;
      }
    }

    if (current.length) result.push(current.trim());
    return result;
  },
};
