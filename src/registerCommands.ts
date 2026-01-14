import { REST, Routes, SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

console.log("Kiểm tra biến môi trường:");
console.log("TOKEN:", TOKEN ? "Có" : "Thiếu");
console.log("CLIENT_ID:", CLIENT_ID || "undefined");
console.log("GUILD_ID:", GUILD_ID || "Không có (sẽ đăng ký global)");

if (!TOKEN || !CLIENT_ID) {
  console.error("Thiếu DISCORD_TOKEN hoặc DISCORD_CLIENT_ID trong .env!");
  process.exit(1);
}

// ======================================================
// 🧩 Danh sách Slash Commands
// ======================================================
const commands = [
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Kiểm tra độ trễ giữa bot và Discord"),

  new SlashCommandBuilder()
    .setName("play")
    .setDescription("Phát nhạc từ YouTube hoặc từ khóa")
    .addStringOption(opt =>
      opt.setName("query")
        .setDescription("Từ khóa hoặc link YouTube")
        .setRequired(true)
    ),
  new SlashCommandBuilder().setName("skip").setDescription("Bỏ qua bài hiện tại"),
  new SlashCommandBuilder().setName("stop").setDescription("Dừng phát nhạc"),
  new SlashCommandBuilder().setName("pause").setDescription("Tạm dừng nhạc"),
  new SlashCommandBuilder().setName("resume").setDescription("Tiếp tục nhạc"),

  new SlashCommandBuilder()
    .setName("deletemusic")
    .setDescription("Xóa bài trong hàng đợi")
    .addStringOption(opt =>
      opt.setName("index")
        .setDescription("Số bài cần xóa (vd: 1,3,5)")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("link")
    .setDescription("Tạo link mời Discord nhanh cho server hiện tại"),

  new SlashCommandBuilder()
    .setName("linkbot")
    .setDescription("Lấy link mời bot vào server Discord"),

  new SlashCommandBuilder()
    .setName("loctv")
    .setDescription("Lọc thành viên không hoạt động quá X tháng (Admin only)")
    .addIntegerOption(opt =>
      opt.setName("thang")
        .setDescription("Số tháng không hoạt động (ví dụ: 6)")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  // ✅ Thêm lệnh xóa thành viên không hoạt động
  new SlashCommandBuilder()
    .setName("deletetv")
    .setDescription("Xóa các thành viên không hoạt động quá X tháng (Admin only)")
    .addIntegerOption(opt =>
      opt.setName("thang")
        .setDescription("Số tháng không hoạt động (ví dụ: 6)")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  // ✅ Thêm lệnh xóa tin nhắn bot
  new SlashCommandBuilder()
    .setName("clearbotmsg")
    .setDescription("Xóa tất cả tin nhắn của bot trong một kênh (Admin only)")
    .addChannelOption(opt =>
      opt.setName("kenh")
        .setDescription("Chọn kênh cần xóa tin nhắn bot (mặc định: kênh hiện tại)")
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
new SlashCommandBuilder()
  .setName("mtc")
  .setDescription("Đọc truyện bằng bot")
  .addStringOption(opt =>
    opt.setName("ten")
      .setDescription("Tên truyện")
      .setRequired(true)
  )
  .addIntegerOption(opt =>
    opt.setName("chuong")
      .setDescription("Số chương bắt đầu")
      .setRequired(true)
  )
  .addNumberOption(opt =>
    opt.setName("speed")
      .setDescription("Tốc độ đọc (mặc định 1.0)")
      .setRequired(false)
  ),

  new SlashCommandBuilder()
  .setName("tangthuvien")
  .setDescription("Đọc truyện từ TangThuvien bằng bot")
  .addStringOption(opt =>
    opt.setName("ten")
      .setDescription("Tên truyện")
      .setRequired(true)
  )
  .addIntegerOption(opt =>
    opt.setName("chuong")
      .setDescription("Số chương bắt đầu")
      .setRequired(true)
  )
  .addNumberOption(opt =>
    opt.setName("speed")
      .setDescription("Tốc độ đọc (mặc định 1.0)")
      .setRequired(false)
  ),


  new SlashCommandBuilder()
    .setName("saytts")
    .setDescription("Để bot nói bằng giọng nói (Text-to-Speech)")
    .addStringOption(opt =>
      opt.setName("message")
        .setDescription("Nội dung mà bot sẽ đọc bằng TTS")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("chatgpt")
    .setDescription("Trò chuyện với ChatGPT")
    .addStringOption(opt =>
      opt.setName("message")
        .setDescription("Nội dung bạn muốn hỏi ChatGPT")
        .setRequired(true)
    ),

  // ✅ Thêm lệnh kiểm tra thông tin Valorant (Tracker.gg)
    new SlashCommandBuilder()
        .setName("checkvlr")
        .setDescription("🔍 Xem thông tin Valorant của người chơi")
        .addStringOption(opt =>
        opt
            .setName("name")
            .setDescription("Tên người chơi (ví dụ: TRQ Bro)")
            .setRequired(true)
        )
        .addStringOption(opt =>
        opt
            .setName("tag")
            .setDescription("Tag của người chơi (ví dụ: cuong)")
            .setRequired(true)
        ),


  new SlashCommandBuilder()
    .setName("image")
    .setDescription("Tạo ảnh bằng AI từ mô tả")
    .addStringOption(opt =>
      opt.setName("prompt")
        .setDescription("Mô tả nội dung bức ảnh bạn muốn tạo")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription("Xem thông tin server hiện tại"),

  new SlashCommandBuilder()
    .setName("menu")
    .setDescription("Hiển thị danh sách tất cả lệnh có thể sử dụng (tương tự !help)"),

  new SlashCommandBuilder()
    .setName("vlr")
    .setDescription("Gửi mã VLR nhanh vào kênh Valorant Việt Nam")
    .addStringOption(opt =>
      opt.setName("code")
        .setDescription("Mã code (6 ký tự, ví dụ: ABC123)")
        .setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName("count")
        .setDescription("Số lượng slot (1–4)")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(4)
    )
    .addStringOption(opt =>
      opt.setName("rank")
        .setDescription("Chọn rank Valorant của bạn (bằng tiếng Anh)")
        .setRequired(true)
        .addChoices(
          { name: "Iron", value: "Iron" },
          { name: "Bronze", value: "Bronze" },
          { name: "Silver", value: "Silver" },
          { name: "Gold", value: "Gold" },
          { name: "Platinum", value: "Platinum" },
          { name: "Diamond", value: "Diamond" },
          { name: "Ascendant", value: "Ascendant" },
          { name: "Immortal", value: "Immortal" },
          { name: "Radiant", value: "Radiant" }
        )
    ),
].map(cmd => cmd.toJSON());

// ======================================================
// Gửi lên Discord API
// ======================================================
const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    console.log("Đang đăng ký slash commands...");

    if (GUILD_ID) {
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
      console.log("Slash commands đăng ký GUILD thành công!");
    } else {
      await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
      console.log("Slash commands đăng ký GLOBAL thành công!");
    }
  } catch (error) {
    console.error("Lỗi khi đăng ký slash commands:", error);
  }
})();
