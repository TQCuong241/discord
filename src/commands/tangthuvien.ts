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

import { getFullChapter } from "../apiTTV/index";

export default {
  name: "tangthuvien",

  // TẠO THƯ MỤC LƯU FILE TTS
  createFolder(truyenSlug: string, chuongSlug: string) {
    const base = path.join("tangthuvien", truyenSlug, chuongSlug);
    if (!fs.existsSync(base)) fs.mkdirSync(base, { recursive: true });
    return base;
  },

  // ===============================
  // PREFIX !tangthuvien
  // ===============================
  async executeMessage(msg: Message, args: string[]) {
    if (args.length < 2) {
      return msg.reply("Dùng: `!tangthuvien <tên truyện> <chương> [speed]`");
    }

    const tenTruyen = args.slice(0, -2).join(" ");
    const chapter = args[args.length - 2];
    const speedArg = args[args.length - 1];
    const speed = isNaN(Number(speedArg)) ? 1 : Number(speedArg);

    const slug = slugify(tenTruyen, { lower: true, strict: true });
    const chuongSlug = `chuong-${chapter}`;

    const vc = (msg.member as GuildMember).voice.channel as VoiceBasedChannel;
    if (!vc) return msg.reply("Bạn phải vào voice channel!");

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
    const ten =
      options?.ten ?? interaction.options.getString("ten", true);
    const chapter =
      options?.chapterStart ?? interaction.options.getInteger("chuong", true);
    const speed =
      options?.speed ?? interaction.options.getNumber("speed") ?? 1;

    const slug = slugify(ten, { lower: true });
    const chuongSlug = `chuong-${chapter}`;

    const vc = (interaction.member as GuildMember).voice
      .channel as VoiceBasedChannel;

    if (!vc) return interaction.reply("Vào voice trước!");

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

    // TÍNH FILTER TĂNG TỐC
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
    let currentChapter = chuongSlug;

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
    const tryLoadNextChapter = async (): Promise<boolean> => {
      const currentNum = Number(currentChapter.replace("chuong-", ""));
      const nextChapterNum = currentNum + 1;
      const nextSlug = `chuong-${nextChapterNum}`;

      console.log("AUTO NEXT → Tải chương:", nextSlug);

      const textNext = await getFullChapter(truyenSlug, nextSlug);

      if (!textNext) {
        console.log("Không tìm thấy chương tiếp theo, kết thúc.");
        return false;
      }

      // Tạo thông báo chuyển chương
      const chapterTransitionText = `Hết chương ${currentNum}, chuẩn bị qua chương ${nextChapterNum}`;
      const transitionFile = await this.googleTTS(
        chapterTransitionText,
        speed,
        -1, // index đặc biệt cho thông báo
        folder
      );
      
      // Chèn thông báo vào đầu queue
      queue.unshift(transitionFile);

      const newChunks = this.splitBySentences(textNext, 180);

      // đổi sang thư mục chương mới
      folder = this.createFolder(truyenSlug, nextSlug);
      currentChapter = nextSlug;

      // merge vào chunks (giữ nguyên index hiện tại)
      chunks = chunks.concat(newChunks);
      return true;
    };

    // ===============================
    // PLAY STREAM
    // ===============================
    let hasNextChapter = true;

    while (queue.length > 0) {
      const file = queue.shift();

      // Kiểm tra và tải chương mới khi gần hết
      if (hasNextChapter && queue.length <= 2 && index >= chunks.length - 10) {
        hasNextChapter = await tryLoadNextChapter();
      }

      // Tải thêm batch nếu còn
      if (queue.length <= 2 && index < chunks.length) {
        await loadBatch();
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
      } catch (err) {
        console.error("Lỗi xoá file:", err);
      }
    }

    conn.destroy();
    console.log("Đọc xong toàn bộ!");

    // Xóa file trong thư mục chương sau khi phát xong
    try {
      const files = fs.readdirSync(folder);
      for (const file of files) {
        const filePath = path.join(folder, file);
        fs.unlinkSync(filePath);
      }
      console.log(`Đã xoá tất cả file trong thư mục chương: ${folder}`);
    } catch (err) {
      console.error("Lỗi xoá file trong thư mục chương:", err);
    }
  },

  // TỐI ƯU CHIA VĂN BẢN TIẾNG VIỆT
  splitBySentences(text: string, maxLen = 180) {
    // Chuẩn hóa văn bản tiếng Việt
    const normalizedText = text
      .replace(/\n+/g, " ")                    // Gộp multiple newlines
      .replace(/\s+/g, " ")                    // Chuẩn hóa khoảng trắng
      .replace(/(?<=[^.!?])\.\.\./g, "…")     // Xử lý dấu ba chấm
      .trim();

    // Tách câu với các dấu kết thúc câu tiếng Việt
    const sentenceEnders = /([.!?…]+[\"']?)\s+/;
    const sentences = normalizedText
      .split(sentenceEnders)
      .reduce<string[]>((acc, part, index) => {
        if (index % 2 === 0) {
          // Phần nội dung câu
          acc.push(part.trim());
        } else {
          // Phần dấu kết thúc câu, gộp với câu trước
          if (acc.length > 0) {
            acc[acc.length - 1] += part;
          }
        }
        return acc;
      }, [])
      .filter(s => s.length > 0);

    const result: string[] = [];
    let currentChunk = "";

    for (const sentence of sentences) {
      const sentenceTrimmed = sentence.trim();
      
      // Nếu câu quá dài, chia nhỏ theo từ
      if (sentenceTrimmed.length > maxLen) {
        // Đẩy chunk hiện tại nếu có
        if (currentChunk.length > 0) {
          result.push(currentChunk);
          currentChunk = "";
        }
        
        // Chia câu dài thành các đoạn nhỏ
        const words = sentenceTrimmed.split(/\s+/);
        let tempChunk = "";
        
        for (const word of words) {
          const potentialChunk = tempChunk ? `${tempChunk} ${word}` : word;
          
          if (potentialChunk.length <= maxLen) {
            tempChunk = potentialChunk;
          } else {
            if (tempChunk.length > 0) {
              result.push(tempChunk);
            }
            tempChunk = word;
          }
        }
        
        if (tempChunk.length > 0) {
          result.push(tempChunk);
        }
        continue;
      }

      // Gộp câu ngắn
      const potentialChunk = currentChunk ? `${currentChunk} ${sentenceTrimmed}` : sentenceTrimmed;
      
      if (potentialChunk.length <= maxLen) {
        currentChunk = potentialChunk;
      } else {
        if (currentChunk.length > 0) {
          result.push(currentChunk);
        }
        currentChunk = sentenceTrimmed;
      }
    }

    // Thêm chunk cuối cùng
    if (currentChunk.length > 0) {
      result.push(currentChunk);
    }

    // Lọc kết quả cuối cùng
    return result
      .map(chunk => chunk.trim())
      .filter(chunk => chunk.length > 0 && chunk.length <= 200);
  }
};