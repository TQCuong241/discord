import { Message, TextChannel } from "discord.js";

const forbiddenWords = [
  // 🇻🇳 Tiếng Việt
  "dm", "ditme", "dit", "concho", "lon", "cac", "buoi",
  "loz", "cailon", "dmm", "cc", "đm", "địt", "đụ", "mẹ",
  "mày", "ngu", "clm", "cl", "ml", "vkl",

  // 🇺🇸 Tiếng Anh
  "fuck", "fck", "fucking", "motherfucker", "mf", "shit",
  "bitch", "asshole", "bastard", "dick", "pussy",
  "cock", "slut", "whore", "niga", "nigger", "nigga",
  "cunt", "retard", "idiot", "stupid"
];


function containsBadWord(content: string): boolean {
  const lower = content.toLowerCase();
  return forbiddenWords.some((word) => lower.includes(word));
}

export async function filterBadWords(msg: Message) {
  if (msg.author.bot) return false;
  if (!msg.guild) return false;

  if (containsBadWord(msg.content)) {
    try {
      await msg.delete();

      //  Ép kiểu channel về TextChannel để TypeScript hiểu có .send()
      const textChannel = msg.channel as TextChannel;

      const warnMsg = await textChannel.send(
        `${msg.author}, vui lòng không sử dụng ngôn từ không phù hợp.`
      );

      setTimeout(() => warnMsg.delete().catch(() => {}), 10000);
    } catch (err) {
      console.error("Không thể xóa tin nhắn chứa từ cấm:", err);
    }
    return true;
  }

  return false;
}
