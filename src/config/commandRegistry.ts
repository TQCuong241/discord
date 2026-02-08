import { Message, ChatInputCommandInteraction } from "discord.js";

// Fun commands
import ping from "../commands/fun/ping";
import lucky from "../commands/fun/lucky";
import sayTTS from "../commands/fun/sayTTS";

// Utility commands
import link from "../commands/utility/link";
import linkBot from "../commands/utility/linkBot";
import help from "../commands/utility/help";
import serverInfo from "../commands/utility/serverinfo";

// Admin commands
import locTV from "../commands/admin/locTV";
import deleteTV from "../commands/admin/deleteTV";
import clearBotMsg from "../commands/admin/clearBotMsg";

// Music commands
import playLenh from "../commands/music/play";
import deleteMusic from "../commands/music/deleteMusic";
import skipMusic from "../commands/music/skip";
import stopMusic from "../commands/music/stop";
import pauseMusic from "../commands/music/pause";
import resumeMusic from "../commands/music/resume";

// AI commands
import chatGPT from "../commands/ai/chatgpt";
import image from "../commands/ai/image";

// Game commands
import { vlr } from "../commands/game/vlr";
import * as checkvlr from "../commands/game/checkvlr";
import * as checktft from "../commands/game/checktft";
import * as checklol from "../commands/game/checklol";

// Story commands
import mtc from "../commands/story/mtc";
import tangthuvien from "../commands/story/tangthuvien";

/**
 * Registry chứa tất cả prefix commands
 */
export const prefixCommands = new Map<string, (msg: Message, args: string[]) => Promise<void>>([
  ["ping", async (msg) => { await ping.executeMessage(msg); }],
  ["lucky", async (msg) => { await lucky.executeMessage(msg); }],
  ["link", async (msg) => { await link.executeMessage(msg); }],
  ["linkbot", async (msg) => { await linkBot.executeMessage(msg); }],
  [
    "loctv",
    async (msg) => { await msg.reply("Lệnh này chỉ dùng dưới dạng slash: `/loctv`."); },
  ],
  ["vlr", async (msg, args) => { await vlr(msg, args); }],
  ["saytts", async (msg, args) => { await sayTTS.executeMessage(msg, args); }],
  ["chatgpt", async (msg, args) => { await chatGPT.executeMessage(msg, args); }],
  ["image", async (msg, args) => { await image.executeMessage(msg, args); }],
  ["serverinfo", async (msg) => { await serverInfo.executeMessage(msg); }],
  ["play", async (msg) => { await playLenh(msg); }],
  ["deletemusic", async (msg) => { await deleteMusic.executeMessage(msg); }],
  ["skip", async (msg) => { await skipMusic(msg); }],
  ["stop", async (msg) => { await stopMusic(msg); }],
  ["pause", async (msg) => { await pauseMusic(msg); }],
  ["resume", async (msg) => { await resumeMusic(msg); }],
  ["deletetv", async (msg) => { await deleteTV.executeMessage(msg); }],
  ["clearbotmsg", async (msg) => { await clearBotMsg.executeMessage(msg); }],
  ["mtc", async (msg, args) => { await mtc.executeMessage(msg, args); }],
  ["help", async (msg) => { await help.executeMessage(msg); }],
  ["menu", async (msg) => { await help.executeMessage(msg); }],
]);

/**
 * Registry chứa tất cả slash commands với metadata
 */
export const slashCommands = new Map<
  string,
  {
    handler: (interaction: ChatInputCommandInteraction) => Promise<void>;
    requiresDefer: boolean;
  }
>([
  ["ping", { handler: async (i) => await ping.execute(i), requiresDefer: false }],
  ["lucky", { handler: async (i) => await lucky.execute(i), requiresDefer: false }],
  ["link", { handler: async (i) => await link.execute(i), requiresDefer: false }],
  ["linkbot", { handler: async (i) => await linkBot.execute(i), requiresDefer: false }],
  ["loctv", { handler: async (i) => await locTV.execute(i), requiresDefer: false }],
  ["saytts", { handler: async (i) => await sayTTS.execute(i), requiresDefer: false }],
  [
    "chatgpt",
    {
      handler: async (i) => {
        await i.deferReply();
        await chatGPT.execute(i);
      },
      requiresDefer: true,
    },
  ],
  [
    "image",
    {
      handler: async (i) => {
        await i.deferReply();
        await image.execute(i);
      },
      requiresDefer: true,
    },
  ],
  ["serverinfo", { handler: async (i) => await serverInfo.execute(i), requiresDefer: false }],
  [
    "vlr",
    {
      handler: async (i) => {
        await i.deferReply();
        await vlr(i, [
          i.options.getString("code", true),
          "+",
          String(i.options.getInteger("count", true)),
          i.options.getString("rank", true),
        ]);
      },
      requiresDefer: true,
    },
  ],
  [
    "play",
    {
      handler: async (i) => {
        await i.deferReply();
        await playLenh(i);
      },
      requiresDefer: true,
    },
  ],
  [
    "deletemusic",
    {
      handler: async (i) => {
        await i.deferReply();
        await deleteMusic.execute(i);
      },
      requiresDefer: true,
    },
  ],
  [
    "skip",
    {
      handler: async (i) => {
        await i.deferReply();
        await skipMusic(i);
      },
      requiresDefer: true,
    },
  ],
  [
    "stop",
    {
      handler: async (i) => {
        await i.deferReply();
        await stopMusic(i);
      },
      requiresDefer: true,
    },
  ],
  ["pause", { handler: async (i) => await pauseMusic(i), requiresDefer: false }],
  [
    "resume",
    {
      handler: async (i) => {
        await i.deferReply();
        await resumeMusic(i);
      },
      requiresDefer: true,
    },
  ],
  ["deletetv", { handler: async (i) => await deleteTV.execute(i), requiresDefer: false }],
  ["clearbotmsg", { handler: async (i) => await clearBotMsg.execute(i), requiresDefer: false }],
  ["checkvlr", { handler: async (i) => await checkvlr.execute(i), requiresDefer: false }],
  ["checktft", { handler: async (i) => await checktft.execute(i), requiresDefer: false }],
  ["checklol", { handler: async (i) => await checklol.execute(i), requiresDefer: false }],
  [
    "mtc",
    {
      handler: async (i) => {
        await mtc.execute(i, {
          ten: i.options.getString("ten", true),
          chapterStart: i.options.getInteger("chuong", true),
          speed: i.options.getNumber("speed") ?? 1,
        });
      },
      requiresDefer: false,
    },
  ],
  [
    "tangthuvien",
    {
      handler: async (i) => {
        await tangthuvien.execute(i, {
          ten: i.options.getString("ten", true),
          chapterStart: i.options.getInteger("chuong", true),
          speed: i.options.getNumber("speed") ?? 1,
        });
      },
      requiresDefer: false,
    },
  ],
  ["help", { handler: async (i) => await help.execute(i), requiresDefer: false }],
  ["menu", { handler: async (i) => await help.execute(i), requiresDefer: false }],
]);

