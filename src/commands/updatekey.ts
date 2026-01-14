import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import fs from "fs";
import path from "path";

const keyPath = path.join(__dirname, "../apiValorant/riotKey.json");

export const data = new SlashCommandBuilder()
  .setName("updatekey")
  .setDescription("🔑 Cập nhật Riot API Key mới")
  .addStringOption(opt =>
    opt
      .setName("key")
      .setDescription("Dán key mới (VD: RGAPI-xxxx-xxxx-xxxx)")
      .setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const newKey = interaction.options.getString("key", true);

  try {
    fs.writeFileSync(keyPath, JSON.stringify({ RIOT_API_KEY: newKey }, null, 2), "utf8");
    await interaction.reply("✅ Riot API key đã được cập nhật thành công!");
  } catch (err: any) {
    await interaction.reply(`Lỗi khi cập nhật key: ${err.message}`);
  }
}
