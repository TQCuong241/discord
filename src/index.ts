import { Client, GatewayIntentBits, Interaction, Message } from "discord.js";
import dotenv from "dotenv";

import ping from "./commands/ping";
import lucky from "./commands/lucky";
import link from "./commands/link";
import linkBot from "./commands/linkBot";
import locTV from "./commands/locTV";
import khiSanSang from "./events/ready";
import playLenh from "./commands/play";
import deleteMusic from "./commands/deleteMusic";
import skipMusic from "./commands/skip";
import stopMusic from "./commands/stop";
import pauseMusic from "./commands/pause";
import resumeMusic from "./commands/resume";
import Cuongbro from "./console/cuongbro";
import { filterBadWords } from "./middleware/filterBadWords";
import setupWelcome from "./events/welcomeMember";
import help from "./commands/help";
import { vlr } from "./commands/vlr";
import sayTTS from "./commands/sayTTS";
import chatGPT from "./commands/chatgpt";
import image from "./commands/image";
import serverInfo from "./commands/serverinfo";
import deleteTV from "./commands/deleteTV";
import clearBotMsg from "./commands/clearBotMsg";
import * as checkvlr from "./commands/checkvlr";
import * as updatekey from "./commands/updatekey";
import { initializeVLR } from "./tool";
import mtc from "./commands/mtc";
import tangthuvien from "./commands/tangthuvien";

dotenv.config();

// Xóa log .env
const oldConsole = console.log;
console.log = (...args) => {
  if (typeof args[0] === "string" && args[0].startsWith("[dotenv@")) return;
  oldConsole(...args);
};

process.on("warning", () => {});

const PREFIX = "!";
const bot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
  ],
});

// =========================================================
// BOT READY
// =========================================================
Cuongbro();
bot.once("clientReady", () => khiSanSang(bot));
setupWelcome(bot);

bot.once("clientReady", async () => {
  console.log(`${bot.user?.tag} đã đăng nhập`);
  console.log("Đang khởi động tool VLR...");
  try {
    await initializeVLR();
    console.log("Tool VLR đã sẵn sàng");
  } catch (error) {
    console.error("Lỗi khởi động tool VLR:", error);
  }
});

// =========================================================
// 📜 LỆNH PREFIX (!)
// =========================================================
bot.on("messageCreate", async (msg: Message) => {
  if (msg.author.bot) return;
  if (!msg.content.startsWith(PREFIX)) return;
  if (await filterBadWords(msg)) return;

  const args = msg.content.slice(PREFIX.length).trim().split(/\s+/);
  const cmd = args.shift()?.toLowerCase();

  try {
    switch (cmd) {
      case "ping":
        await ping.executeMessage(msg);
        break;
      case "lucky":
        await lucky.executeMessage(msg);
        break;
      case "link":
        await link.executeMessage(msg);
        break;
      case "linkbot":
        await linkBot.executeMessage(msg);
        break;
      case "loctv":
        await msg.reply("Lệnh này chỉ dùng dưới dạng slash: `/loctv`.");
        break;
      case "vlr":
        await vlr(msg, args);
        break;
      case "saytts":
        await sayTTS.executeMessage(msg, args);
        break;
      case "chatgpt":
        await chatGPT.executeMessage(msg, args);
        break;
      case "image":
        await image.executeMessage(msg, args);
        break;
      case "serverinfo":
        await serverInfo.executeMessage(msg);
        break;
      case "play":
        await playLenh(msg);
        break;
      case "deletemusic":
        await deleteMusic.executeMessage(msg);
        break;
      case "skip":
        await skipMusic(msg);
        break;
      case "stop":
        await stopMusic(msg);
        break;
      case "pause":
        await pauseMusic(msg);
        break;
      case "resume":
        await resumeMusic(msg);
        break;
      case "deletetv":
        await deleteTV.executeMessage(msg);
        break;
      case "clearbotmsg":
        await clearBotMsg.executeMessage(msg);
        break;
      case "mtc":
        await mtc.executeMessage(msg, args);
        break;
      case "help":
      case "menu":
        await help.executeMessage(msg);
        break;
      default:
        await msg.reply("Lệnh không hợp lệ. Hãy thử `!ping` hoặc `!menu`.");
        break;
    }
  } catch (err) {
    console.error("Lỗi khi xử lý prefix:", err);
  }
});

// =========================================================
// ⚡ SLASH COMMANDS (/)
// =========================================================
bot.on("interactionCreate", async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;

  try {
    switch (interaction.commandName) {
      case "ping":
        await ping.execute(interaction);
        break;
      case "lucky":
        await lucky.execute(interaction);
        break;
      case "link":
        await link.execute(interaction);
        break;
      case "linkbot":
        await linkBot.execute(interaction);
        break;
      case "loctv":
        await locTV.execute(interaction);
        break;
      case "saytts":
        await sayTTS.execute(interaction);
        break;
      case "chatgpt":
        await interaction.deferReply();
        await chatGPT.execute(interaction);
        break;
      case "image":
        await interaction.deferReply();
        await image.execute(interaction);
        break;
      case "serverinfo":
        await serverInfo.execute(interaction);
        break;
      case "vlr":
        await interaction.deferReply();
        await vlr(interaction, [
          interaction.options.getString("code", true),
          "+",
          String(interaction.options.getInteger("count", true)),
          interaction.options.getString("rank", true),
        ]);
        break;
      case "play":
        await interaction.deferReply();
        await playLenh(interaction);
        break;
      case "deletemusic":
        await interaction.deferReply();
        await deleteMusic.execute(interaction);
        break;
      case "skip":
        await interaction.deferReply();
        await skipMusic(interaction);
        break;
      case "stop":
        await interaction.deferReply();
        await stopMusic(interaction);
        break;
      case "pause":
        await pauseMusic(interaction);
        break;
      case "resume":
        await interaction.deferReply();
        await resumeMusic(interaction);
        break;
      case "deletetv":
        await deleteTV.execute(interaction);
        break;
      case "clearbotmsg":
        await clearBotMsg.execute(interaction);
        break;
      case "checkvlr":
        await checkvlr.execute(interaction);
        break;

      // ⭐ NEW: /mtc có speed + chapterStart
      case "mtc":
        await mtc.execute(interaction, {
          ten: interaction.options.getString("ten", true),
          chapterStart: interaction.options.getInteger("chuong", true),
          speed: interaction.options.getNumber("speed") ?? 1,
        });
        break;

      case "tangthuvien":
        await tangthuvien.execute(interaction, {
          ten: interaction.options.getString("ten", true),
          chapterStart: interaction.options.getInteger("chuong", true),
          speed: interaction.options.getNumber("speed") ?? 1,
        });
        break;

      case "help":
      case "menu":
        await help.execute(interaction);
        break;

      default:
        await interaction.reply({
          content: "Lệnh không hợp lệ.",
          ephemeral: true,
        });
        break;
    }
  } catch (err) {
    console.error("Lỗi khi xử lý slash command:", err);

    if (interaction.replied || interaction.deferred)
      await interaction.followUp({
        content: "Đã xảy ra lỗi khi xử lý lệnh này.",
        ephemeral: true,
      });
    else
      await interaction.reply({
        content: "Đã xảy ra lỗi khi xử lý lệnh này.",
        ephemeral: true,
      });
  }
});

bot.login(process.env.DISCORD_TOKEN);
