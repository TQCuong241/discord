import { Message } from "discord.js";
import { PREFIX } from "../config/constants";
import { filterBadWords } from "../middleware/filterBadWords";
import { prefixCommands } from "../config/commandRegistry";
import { handlePrefixError } from "../utils/errorHandler";

/**
 * Xử lý các lệnh prefix (!)
 */
export async function handlePrefixCommand(msg: Message): Promise<void> {
  if (msg.author.bot) return;
  if (!msg.content.startsWith(PREFIX)) return;
  if (await filterBadWords(msg)) return;

  const args = msg.content.slice(PREFIX.length).trim().split(/\s+/);
  const cmd = args.shift()?.toLowerCase();

  if (!cmd) return;

  const commandHandler = prefixCommands.get(cmd);

  if (commandHandler) {
    try {
      await commandHandler(msg, args);
    } catch (err) {
      await handlePrefixError(msg, err, cmd);
    }
  } else {
    await msg.reply("Lệnh không hợp lệ. Hãy thử `!ping` hoặc `!menu`.");
  }
}

