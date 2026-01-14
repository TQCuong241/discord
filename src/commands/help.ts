import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  Message,
} from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("menu")
  .setDescription("Hiển thị danh sách các lệnh có thể sử dụng");

const commandList = [
  { name: "!ping", desc: "Kiểm tra độ trễ của bot" },
  { name: "!lucky", desc: "Xem số may mắn hôm nay" },
  { name: "!link", desc: "Tạo link mời Discord nhanh" },
  { name: "!linkbot", desc: "Lấy link mời bot vào server" },
  { name: "!loctv", desc: "Lọc thành viên không hoạt động (Admin-only)" },
  { name: "!saytts", desc: "Bot đọc tin nhắn bằng giọng nói (TTS)" },
  { name: "!chatgpt", desc: "Trò chuyện với ChatGPT" },
  { name: "!image", desc: "Tạo ảnh bằng AI từ mô tả" },
  { name: "!serverinfo", desc: "Xem thông tin chi tiết của server" },
  { name: "!vlr <code> + <số lượng> <rank>", desc: "Gửi mã tìm đồng đội Valorant" },
  { name: "!play", desc: "Phát nhạc từ YouTube" },
  { name: "!pause / !resume", desc: "Tạm dừng hoặc tiếp tục phát nhạc" },
  { name: "!skip / !stop", desc: "Bỏ qua hoặc dừng phát nhạc" },
  { name: "!deletemusic <index>", desc: "Xóa bài hát khỏi hàng đợi" },
];

// ===== Slash command (/menu) =====
export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    const embed = new EmbedBuilder()
      .setTitle("Danh sách lệnh của bot")
      .setColor(0x00aeff)
      .setDescription("Dưới đây là các lệnh bạn có thể sử dụng (prefix: `!`):")
      .addFields(
        commandList.map((cmd) => ({
          name: cmd.name,
          value: cmd.desc,
          inline: false,
        }))
      )
      .setFooter({ text: "Gõ !help hoặc /menu để xem lại danh sách này" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  } catch (err) {
    console.error("Lỗi khi hiển thị menu:", err);
    if (interaction.replied || interaction.deferred)
      await interaction.followUp({
        content: "Không thể hiển thị danh sách lệnh.",
        ephemeral: true,
      });
    else
      await interaction.reply({
        content: "Không thể hiển thị danh sách lệnh.",
        ephemeral: true,
      });
  }
}

// ===== Prefix command (!help hoặc !menu) =====
export async function executeMessage(msg: Message) {
  try {
    const embed = new EmbedBuilder()
      .setTitle("Danh sách lệnh của bot")
      .setColor(0x00aeff)
      .setDescription("Dưới đây là các lệnh bạn có thể sử dụng (prefix: `!`):")
      .addFields(
        commandList.map((cmd) => ({
          name: cmd.name,
          value: cmd.desc,
          inline: false,
        }))
      )
      .setFooter({ text: "Gõ !help hoặc /menu để xem lại danh sách này" })
      .setTimestamp();

    const reply = await msg.reply({ embeds: [embed] });
    setTimeout(() => reply.delete().catch(() => {}), 30_000); // tự xóa sau 30s
  } catch (err) {
    console.error("Lỗi khi hiển thị menu:", err);
    const errorMsg = await msg.reply("Không thể hiển thị danh sách lệnh.");
    setTimeout(() => errorMsg.delete().catch(() => {}), 10_000);
  }
}

export default { data, execute, executeMessage };
