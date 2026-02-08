import { getTrackerStats } from "../../services/valorant/tracker";
import {
  EmbedBuilder,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  AttachmentBuilder,
} from "discord.js";
import { createMatchHistoryBanner } from "../../utils/matchHistoryBanner";
import { createAgentBanner } from "../../utils/agentBanner";

export const data = new SlashCommandBuilder()
  .setName("checkvlr")
  .setDescription("Xem thông tin Valorant chi tiết từ Tracker.gg")
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
    const s = await getTrackerStats(name, tag);

    // ===== TẠO BANNER LỊCH SỬ TRẬN ĐẤU =====
    const matchHistoryBuffer = await createMatchHistoryBanner(
      s.recentMatches.slice(0, 10).map(m => ({
        agent: m.agent || "-",
        agentIcon: m.agentIcon || "",
        map: m.map || "-",
        kills: m.kills || 0,
        deaths: m.deaths || 0,
        assists: m.assists || 0,
        kd: m.kd || "0.00",
        hs: m.hs || "-",
        result: m.result || "defeat",
        roundsWon: m.roundsWon,
        roundsLost: m.roundsLost,
      }))
    );
    const matchHistoryAttachment = new AttachmentBuilder(matchHistoryBuffer, {
      name: "match_history.png",
    });

    // ===== TẠO BANNER AGENT =====
    const agentIcons = s.recentMatches
      .slice(0, 10)
      .map(m => m.agentIcon)
      .filter(Boolean);
    const agentBannerBuffer = await createAgentBanner(agentIcons);
    const agentBannerAttachment = new AttachmentBuilder(agentBannerBuffer, {
      name: "agents.png",
    });

    // ===== TÍNH TOÁN STATS =====
    const winCount = s.recentMatches.filter(m => m.result === "victory").length;
    const lossCount = s.recentMatches.filter(m => m.result === "defeat").length;
    const recentWinRate = s.recentMatches.length > 0
      ? `${Math.round((winCount / s.recentMatches.length) * 100)}%`
      : "N/A";

    // Màu sắc dựa trên rank
    const rankColors: { [key: string]: number } = {
      "Radiant": 0xffd700,
      "Immortal": 0xff5555,
      "Ascendant": 0x9d4edd,
      "Diamond": 0x4a90e2,
      "Platinum": 0x00d4aa,
      "Gold": 0xffd700,
      "Silver": 0xc0c0c0,
      "Bronze": 0xcd7f32,
      "Iron": 0x4a4a4a,
    };
    const rankKey = s.rank.split(" ")[0];
    const embedColor = (rankKey && rankColors[rankKey]) || 0x00ffff;

    // ===== EMBED CHÍNH - ĐƯỢC TỔ CHỨC LẠI =====
    const embed = new EmbedBuilder()
      .setColor(embedColor)
      .setAuthor({
        name: `${s.name}#${tag}`,
        iconURL: s.rankIcon,
      })
      .setTitle(`🎮 ${s.rank} ${s.level ? `• Level ${s.level}` : ""}`)
      .setThumbnail(s.cardImage || s.rankIcon)
      .setDescription(`📊 **Thống kê tổng quan**`)
      .addFields(
        {
          name: "🏆 Rank & Performance",
          value: `**Rank:** ${s.rank}\n**Win Rate:** ${s.winrate}\n**Recent WR:** ${recentWinRate} (${winCount}W-${lossCount}L)`,
          inline: false,
        },
        {
          name: "⚔️ Combat Stats",
          value: `**K/D:** ${s.kd}\n**KDA:** ${s.kda}\n**Headshot:** ${s.hs}\n**ACS:** ${s.acs}`,
          inline: true,
        },
        {
          name: "📈 Detailed Stats",
          value: `**Kills:** ${s.kills}\n**Deaths:** ${s.deaths}\n**Assists:** ${s.assists}\n**DMG/Round:** ${s.damagePerRound}`,
          inline: true,
        },
        {
          name: "📋 Recent Matches (10 trận gần nhất)",
          value: `\`\`\`\n${s.recentMatches.slice(0, 5).map((m, i) => {
            const result = m.result === "victory" ? "🟢 Win" : "🔴 Loss";
            return `${i + 1}. ${m.map || "-"} | ${m.kills}/${m.deaths}/${m.assists} | ${result}`;
          }).join("\n")}\`\`\``,
          inline: false,
        }
      )
      .setImage("attachment://match_history.png")
      .setFooter({
        text: "Nguồn: Tracker.gg • Dữ liệu được cập nhật theo thời gian thực",
        iconURL: "https://tracker.gg/favicon.ico",
      })
      .setTimestamp();

    await interaction.editReply({
      embeds: [embed],
      files: [matchHistoryAttachment, agentBannerAttachment],
    });
  } catch (err: any) {
    await interaction.editReply({
      content: `**Lỗi:** ${err.message || "Người chơi không tồn tại hoặc chưa liên kết với Tracker.gg."}`,
    });
  }
}