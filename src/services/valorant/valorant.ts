import fs from "fs";
import path from "path";
import fetch from "node-fetch";

const keyPath = path.join(__dirname, "riotKey.json");

function getApiKey(): string {
  if (!fs.existsSync(keyPath)) throw new Error("riotKey.json chưa tồn tại.");
  const data = JSON.parse(fs.readFileSync(keyPath, "utf8"));
  if (!data.RIOT_API_KEY) throw new Error("riotKey.json thiếu trường RIOT_API_KEY.");
  return data.RIOT_API_KEY;
}

const REGION = "asia";

export interface RiotAccount {
  puuid: string;
  gameName: string;
  tagLine: string;
}

export async function getAccountByRiotId(
  gameName: string,
  tagLine: string
): Promise<RiotAccount> {
  const API_KEY = getApiKey();
  const encodedName = encodeURIComponent(gameName);
  const encodedTag = encodeURIComponent(tagLine);
  const url = `https://${REGION}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodedName}/${encodedTag}`;

  const res = await fetch(url, { headers: { "X-Riot-Token": API_KEY } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<RiotAccount>;
}

