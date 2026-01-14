import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  Message,
  Guild,
} from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("serverinfo")
  .setDescription("Xem thông tin chi tiết của server hiện tại");

// ===== Slash command =====
export async function execute(interaction: ChatInputCommandInteraction) {
  const guild = interaction.guild;
  if (!guild) {
    await interaction.reply("Lệnh này chỉ hoạt động trong server.");
    return;
  }
  await sendServerInfo(guild, async (embed) => {
    if (interaction.replied || interaction.deferred)
      await interaction.followUp({ embeds: [embed] });
    else
      await interaction.reply({ embeds: [embed] });
  });
}

// ===== Prefix command (!serverinfo) =====
export async function executeMessage(message: Message) {
  const guild = message.guild;
  if (!guild) {
    await message.reply("Lệnh này chỉ hoạt động trong server.");
    return;
  }
  await sendServerInfo(guild, (embed) => message.reply({ embeds: [embed] }));
}

// ===== Hàm chung để gửi Embed =====
async function sendServerInfo(
  guild: Guild,
  sendReply: (embed: EmbedBuilder) => Promise<any>
) {
  try {
    const owner = await guild.fetchOwner();
    const totalMembers = guild.memberCount;
    const textChannels = guild.channels.cache.filter((c) => c.type === 0).size;  // GuildText
    const voiceChannels = guild.channels.cache.filter((c) => c.type === 2).size; // GuildVoice
    const createdAt = guild.createdAt.toLocaleString("vi-VN");

    const embed = new EmbedBuilder()
      .setTitle(`Thông tin server: ${guild.name}`)
      .setThumbnail(guild.iconURL({ size: 1024 }))
      .addFields(
        { name: "Chủ server", value: owner.user.tag, inline: true },
        { name: "Tổng thành viên", value: String(totalMembers), inline: true },
        { name: "Kênh văn bản", value: String(textChannels), inline: true },
        { name: "Kênh thoại", value: String(voiceChannels), inline: true },
        { name: "Ngày tạo", value: createdAt, inline: false },
        { name: "ID Server", value: guild.id, inline: false },
      )
      .setColor(0x0099ff)
      .setTimestamp();

    await sendReply(embed);
  } catch (error) {
    console.error("Lỗi khi lấy thông tin server:", error);
    const embedError = new EmbedBuilder()
      .setTitle("Lỗi")
      .setDescription("Không thể lấy thông tin server. Vui lòng thử lại sau.")
      .setColor(0xff0000);
    await sendReply(embedError);
  }
}

export default { data, execute, executeMessage };
