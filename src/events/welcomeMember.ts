import { Client, GuildMember, TextChannel, EmbedBuilder } from "discord.js";

/**
 * Sự kiện chào mừng thành viên mới (với ảnh GIF)
 */
export default function setupWelcome(bot: Client) {
  bot.on("guildMemberAdd", async (member: GuildMember) => {
    try {
      const WELCOME_CHANNEL_ID = "welcome"; // thay ID kênh chào mừng thật vào đây

      const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID) as TextChannel;
      if (!channel) return;

      // Một số GIF chào mừng ngẫu nhiên
      const welcomeGifs: any = [
        "https://media.tenor.com/wnLRhF8LqR8AAAAM/welcome-anime.gif",
        "https://media.tenor.com/VVg5PZP6mAIAAAAM/anime-hi.gif",
        "https://media.tenor.com/9vVvXChb2W4AAAAM/welcome-waving.gif",
        "https://media.tenor.com/8h4GgYHukxEAAAAM/hello.gif",
        "https://media.tenor.com/yGJ8BtF3vK4AAAAM/cute-anime-wave.gif",
      ];
      const randomGif = welcomeGifs[Math.floor(Math.random() * welcomeGifs.length)];

      // Fix lỗi TS bằng cách ép kiểu null-safe
      const avatarUrl = member.user.displayAvatarURL() ?? null;

      const embed = new EmbedBuilder()
        .setColor(0x00aaff)
        .setTitle("Chào mừng thành viên mới")
        .setDescription(
          `Xin chào **${member.user.username}**\nChúc bạn có những phút giây vui vẻ và gắn bó cùng **${member.guild.name}**.`
        )
        .setThumbnail(avatarUrl) // ép null-safe
        .setImage(randomGif)
        .setFooter({ text: `ID người dùng: ${member.id}` });

      await channel.send({ embeds: [embed] });
    } catch (error) {
      console.error("Lỗi khi gửi lời chào:", error);
    }
  });
}
