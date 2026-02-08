import { Client } from "discord.js";
import { setupConsole } from "./utils/consoleSetup";
import { BOT_INTENTS } from "./config/botConfig";
import { setupEventHandlers } from "./handlers/eventHandlers";
import { handlePrefixCommand } from "./handlers/prefixCommands";
import { handleSlashCommand } from "./handlers/slashCommands";

// Cấu hình console và dotenv
setupConsole();

// Khởi tạo bot
const bot = new Client({
  intents: BOT_INTENTS,
});

// Đăng ký event handlers
setupEventHandlers(bot);

// Đăng ký command handlers
bot.on("messageCreate", handlePrefixCommand);
bot.on("interactionCreate", handleSlashCommand);

// Đăng nhập bot
bot.login(process.env.DISCORD_TOKEN);
