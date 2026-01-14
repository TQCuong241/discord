import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
  GuildMember,
} from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("loctv")
  .setDescription("Lọc thành viên không hoạt động quá X tháng")
  .addIntegerOption((option) =>
    option
      .setName("thang")
      .setDescription("Số tháng không hoạt động (ví dụ: 6)")
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
  const months = interaction.options.getInteger("thang", true);

  if (!interaction.guild) {
    await interaction.reply({
      content: "Lệnh này chỉ có thể dùng trong server.",
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });
  const guild = interaction.guild;

  try {
    // Lấy danh sách thành viên
    const members = await guild.members.fetch({ withPresences: true });

    // Tính mốc cutoff
    const now = Date.now();
    const cutoff = now - months * 30 * 24 * 60 * 60 * 1000; // số tháng tính theo ms

    const inactiveMembers: GuildMember[] = [];

    members.forEach((member) => {
      if (member.user.bot) return; // bỏ qua bot
      const joinedAt = member.joinedTimestamp || 0;

      // Nếu không có presence và tham gia đã lâu => inactives
      if (!member.presence && joinedAt < cutoff) {
        inactiveMembers.push(member);
      }
    });

    if (inactiveMembers.length === 0) {
      await interaction.editReply(
        `Không có thành viên nào không hoạt động quá ${months} tháng.`
      );
      return;
    }

    // Danh sách hiển thị tối đa 30 người
    const list = inactiveMembers
      .map((m) => `- ${m.user.tag}`)
      .slice(0, 30)
      .join("\n");

    await interaction.editReply({
      content:
        `Tìm thấy ${inactiveMembers.length} thành viên không hoạt động trong ${months} tháng gần đây:\n\n${list}` +
        (inactiveMembers.length > 30
          ? `\n\n(Chỉ hiển thị 30 người đầu tiên.)`
          : ""),
    });

    /*
    // Nếu muốn kick tự động, bật đoạn này:
    for (const member of inactiveMembers) {
      try {
        await member.kick(`Không hoạt động quá ${months} tháng`);
      } catch (err) {
        console.warn(`Không thể kick ${member.user.tag}:`, err);
      }
    }
    */
  } catch (err) {
    console.error("Lỗi khi lọc thành viên:", err);
    await interaction.editReply("Đã xảy ra lỗi khi lọc thành viên.");
  }
}

export default { data, execute };
