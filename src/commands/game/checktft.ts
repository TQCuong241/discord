import { getTFTStats } from "../../services/tracker/tft";
import {
  EmbedBuilder,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  AttachmentBuilder,
} from "discord.js";
import { createTFTMatchHistoryBanner } from "../../utils/tftMatchHistoryBanner";

export const data = new SlashCommandBuilder()
  .setName("checktft")
  .setDescription("Xem thông tin TFT (Teamfight Tactics) chi tiết từ Tracker.gg")
  .addStringOption(o =>
    o.setName("name").setDescription("Tên người chơi (VD: TRQ Bro)").setRequired(true)
  )
  .addStringOption(o =>
    o.setName("tag").setDescription("Tag người chơi (VD: cuong)").setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const name = interaction.options.getString("name", true);
  const tag = interaction.options.getString("tag", true);

  await interaction.deferReply();

  try {
    const s = await getTFTStats(name, tag);

    // ===== TẠO BANNER LỊCH SỬ TRẬN ĐẤU =====
    const matchHistoryBuffer = await createTFTMatchHistoryBanner(
      s.recentMatches.slice(0, 10).map(m => ({
        placement: m.placement || 8,
        result: m.result || "defeat",
        duration: m.duration || "-",
        traits: m.traits || [],
        units: m.units || [],
      }))
    );
    const matchHistoryAttachment = new AttachmentBuilder(matchHistoryBuffer, {
      name: "tft_match_history.png",
    });

    // ===== TÍNH TOÁN STATS =====
    const winCount = s.recentMatches.filter(m => m.result === "victory").length;
    const lossCount = s.recentMatches.filter(m => m.result === "defeat").length;
    const recentWinRate = s.recentMatches.length > 0
      ? `${Math.round((winCount / s.recentMatches.length) * 100)}%`
      : "N/A";

    // Màu sắc dựa trên rank
    const rankColors: { [key: string]: number } = {
      "Challenger": 0xffd700,
      "Grandmaster": 0xff5555,
      "Master": 0x9d4edd,
      "Diamond": 0x4a90e2,
      "Platinum": 0x00d4aa,
      "Gold": 0xffd700,
      "Silver": 0xc0c0c0,
      "Bronze": 0xcd7f32,
      "Iron": 0x4a4a4a,
    };
    const rankKey = s.rank.split(" ")[0];
    const embedColor = (rankKey && rankColors[rankKey]) || 0x00ffff;

    // ===== EMBED CHÍNH =====
    const embed = new EmbedBuilder()
      .setColor(embedColor)
      .setAuthor({
        name: `${s.name}#${tag}`,
        iconURL: s.rankIcon,
      })
      .setTitle(`🎮 ${s.rank} ${s.lp ? `• ${s.lp} LP` : ""}`)
      .setThumbnail(s.rankIcon)
      .setDescription(`📊 **Thống kê TFT**`)
      .addFields(
        {
          name: "🏆 Rank & Performance",
          value: `**Rank:** ${s.rank} ${s.tier ? `(${s.tier})` : ""}\n**LP:** ${s.lp}\n**Win Rate:** ${s.winrate}\n**Recent WR:** ${recentWinRate} (${winCount}W-${lossCount}L)`,
          inline: false,
        },
        {
          name: "📈 Match Stats",
          value: `**Wins:** ${s.wins}\n**Losses:** ${s.losses}\n**Total:** ${parseInt(s.wins || "0") + parseInt(s.losses || "0")} matches`,
          inline: true,
        },
        {
          name: "📋 Recent Matches (10 trận gần nhất)",
          value: `\`\`\`\n${s.recentMatches.slice(0, 5).map((m, i) => {
            const result = m.result === "victory" ? "🟢 Top 4" : "🔴 Bottom 4";
            return `${i + 1}. Placement #${m.placement} | ${m.duration} | ${result}`;
          }).join("\n")}\`\`\``,
          inline: false,
        }
      )
      .setImage("attachment://tft_match_history.png")
      .setFooter({
        text: "Nguồn: Tracker.gg • Dữ liệu được cập nhật theo thời gian thực",
        iconURL: "https://tracker.gg/favicon.ico",
      })
      .setTimestamp();

    await interaction.editReply({
      embeds: [embed],
      files: [matchHistoryAttachment],
    });
  } catch (err: any) {
    await interaction.editReply({
      content: `**Lỗi:** ${err.message || "Người chơi không tồn tại hoặc chưa liên kết với Tracker.gg."}`,
    });
  }
}

