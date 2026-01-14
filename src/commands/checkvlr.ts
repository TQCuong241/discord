import { getTrackerStats } from "../apiTranker/index";
import {
  EmbedBuilder,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";

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

    // ===== BẢNG LỊCH SỬ 10 TRẬN GẦN NHẤT =====
    const header = "#    Agent    Map      K/D/A      Round     ";
    const underline = "─".repeat(header.length); // Dòng gạch chân
    const lines = s.recentMatches.slice(0, 10).map((m, i) => {
      const resultEmoji = m.result === "victory" ? "🟢" : "🔴";
      
      // Format STT với số 0 ở trước
      const formattedIndex = i < 9 ? `0${i + 1}` : `${i + 1}`;
      
      // Format Round với số 0 ở trước
      const formattedRoundsWon = m.roundsWon < 10 ? `0${m.roundsWon}` : `${m.roundsWon}`;
      const formattedRoundsLost = m.roundsLost < 10 ? `0${m.roundsLost}` : `${m.roundsLost}`;
      const rounds = m.roundsWon && m.roundsLost ? `${formattedRoundsWon}-${formattedRoundsLost}` : "-";
      
      // Format K/D/A với số 0 ở trước cho tất cả
      const formattedKills = m.kills < 10 ? `0${m.kills}` : `${m.kills}`;
      const formattedDeaths = m.deaths < 10 ? `0${m.deaths}` : `${m.deaths}`;
      const formattedAssists = m.assists < 10 ? `0${m.assists}` : `${m.assists}`;
      const kdaString = `${formattedKills}/${formattedDeaths}/${formattedAssists}`;
      
      // Format từng cột với độ dài cố định
      const agentCol = (m.agent || "-").substring(0, 8).padEnd(8);
      const mapCol = (m.map || "-").substring(0, 8).padEnd(8);
      const kdaCol = kdaString.padEnd(10);
      const roundsCol = rounds.padEnd(7);

      return `${formattedIndex}   ${agentCol} ${mapCol} ${kdaCol} ${roundsCol} ${resultEmoji}`;
    });

    const matchTable = "```\n" + [header, underline, ...lines].join("\n") + "\n```";

    // ===== EMBED CHÍNH =====
    const embed = new EmbedBuilder()
      .setColor(0x00ffff)
      .setTitle(`${s.name}`)
      .setThumbnail(s.rankIcon)
      .addFields(
        { name: "Rank", value: s.rank, inline: true },
        { name: "Win Rate", value: s.winrate, inline: true },
        { name: "K/D Ratio", value: s.kd, inline: true },
        { name: "KDA Ratio", value: s.kda, inline: true },
        { name: "Headshot %", value: s.hs, inline: true },
        { name: "ACS", value: s.acs, inline: true },
        { name: "Kills", value: s.kills, inline: true },
        { name: "Deaths", value: s.deaths, inline: true },
        { name: "Assists", value: s.assists, inline: true },
        { name: "Damage/Round", value: s.damagePerRound, inline: true },
        {
          name: "Lịch sử 10 trận gần đây",
          value: matchTable || "Không có dữ liệu gần đây.",
        }
      )
      .setFooter({ text: "Nguồn: Tracker.gg" })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (err: any) {
    await interaction.editReply(`Người chơi không tồn tại hoặc chưa liên kết với Tracker.gg.`);
  }
}