import { getLoLStats } from "../../services/tracker/lol";
import {
  EmbedBuilder,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  AttachmentBuilder,
} from "discord.js";
import { createLoLMatchHistoryBanner } from "../../utils/lolMatchHistoryBanner";

export const data = new SlashCommandBuilder()
  .setName("checklol")
  .setDescription("Xem thông tin LoL (League of Legends) chi tiết từ Tracker.gg")
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
    const s = await getLoLStats(name, tag);

    // ===== TẠO BANNER LỊCH SỬ TRẬN ĐẤU =====
    const matchHistoryBuffer = await createLoLMatchHistoryBanner(
      s.recentMatches.slice(0, 10).map(m => ({
        champion: m.champion || "-",
        championIcon: m.championIcon || "",
        result: m.result || "defeat",
        kills: m.kills || 0,
        deaths: m.deaths || 0,
        assists: m.assists || 0,
        kda: m.kda || "0.00",
        duration: m.duration || "-",
      }))
    );
    const matchHistoryAttachment = new AttachmentBuilder(matchHistoryBuffer, {
      name: "lol_match_history.png",
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
      .setDescription(`📊 **Thống kê League of Legends**`)
      .addFields(
        {
          name: "🏆 Rank & Performance",
          value: `**Rank:** ${s.rank} ${s.tier ? `(${s.tier})` : ""}\n**LP:** ${s.lp}\n**Win Rate:** ${s.winrate}\n**Recent WR:** ${recentWinRate} (${winCount}W-${lossCount}L)`,
          inline: false,
        },
        {
          name: "⚔️ Combat Stats",
          value: `**KDA:** ${s.kda}\n**Kills:** ${s.kills}\n**Deaths:** ${s.deaths}\n**Assists:** ${s.assists}`,
          inline: true,
        },
        {
          name: "📈 Match Stats",
          value: `**Wins:** ${s.wins}\n**Losses:** ${s.losses}\n**Total:** ${parseInt(s.wins || "0") + parseInt(s.losses || "0")} matches`,
          inline: true,
        },
        {
          name: "📋 Recent Matches (10 trận gần nhất)",
          value: `\`\`\`\n${s.recentMatches.slice(0, 5).map((m, i) => {
            const result = m.result === "victory" ? "🟢 Win" : "🔴 Loss";
            return `${i + 1}. ${m.champion} | ${m.kills}/${m.deaths}/${m.assists} | ${result}`;
          }).join("\n")}\`\`\``,
          inline: false,
        }
      )
      .setImage("attachment://lol_match_history.png")
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

