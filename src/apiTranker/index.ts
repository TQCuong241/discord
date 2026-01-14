import puppeteer, { Browser } from "puppeteer";

export interface TrackerStats {
  name: string;
  rank: string;
  rankIcon: string;
  level: string;
  kd: string;
  kda: string;
  hs: string;
  winrate: string;
  kills: string;
  deaths: string;
  assists: string;
  acs: string;
  damagePerRound: string;
  cardImage: string;
  recentMatches: {
    map: string;
    agent: string;
    agentIcon: string;
    kd: string;
    result: string;
    kills: number;
    deaths: number;
    assists: number;
    acs: string;
    hs: string; // ✅ Tỷ lệ headshot của từng trận
    roundsWon: number; // ✅ Round thắng
    roundsLost: number; // ✅ Round thua
  }[];
}

export async function getTrackerStats(name: string, tag: string): Promise<TrackerStats> {
  const encoded = encodeURIComponent(`${name}#${tag}`);
  const profileURL = `https://api.tracker.gg/api/v2/valorant/standard/profile/riot/${encoded}`;
  const matchesURL = `https://api.tracker.gg/api/v2/valorant/standard/matches/riot/${encoded}`;

  let browser: Browser | null = null;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
    );

    // === 1️⃣ Lấy profile chính ===
    await page.goto(profileURL, { waitUntil: "networkidle2", timeout: 20000 });
    const preTextProfile = await page.$eval("pre", (el: any) => el.textContent?.trim() || "");
    const profile = JSON.parse(preTextProfile);

    const user = profile.data?.userInfo || {};
    const stats = profile.data?.segments?.[0]?.stats || {};
    const platform = profile.data?.platformInfo || {};
    const meta = profile.data?.segments?.[0]?.metadata || {};

    const playerName =
      user.platformUserHandle ||
      user.platformUserIdentifier ||
      platform.platformUserHandle ||
      `${name}#${tag}`;

    const rank = stats.rank?.metadata?.tierName || "Unranked";
    const rankIcon = stats.rank?.metadata?.iconUrl || "";
    const level = stats.level?.displayValue || "-";
    const kd = stats.kDRatio?.displayValue || "-";
    const kda = stats.kADRatio?.displayValue || "-";
    const hs = stats.headshotsPercentage?.displayValue || "-";
    const winrate = stats.matchesWinPct?.displayValue || "-";
    const kills = stats.kills?.displayValue || "-";
    const deaths = stats.deaths?.displayValue || "-";
    const assists = stats.assists?.displayValue || "-";
    const acs = stats.scorePerRound?.displayValue || "-";
    const damagePerRound = stats.damagePerRound?.displayValue || "-";
    const cardImage = meta.card?.small || meta.imageUrl || "";

    // === 2️⃣ Lấy lịch sử 10 trận gần nhất ===
    await page.goto(matchesURL, { waitUntil: "networkidle2", timeout: 20000 });
    const preTextMatches = await page.$eval("pre", (el: any) => el.textContent?.trim() || "");
    const matchData = JSON.parse(preTextMatches);
    const matches = matchData.data?.matches || [];

    const recentMatches = matches.slice(0, 10).map((m: any) => {
      const meta = m.metadata || {};
      const segMeta = m.segments?.[0]?.metadata || {};
      const s = m.segments?.[0]?.stats || {};

      const map = meta.mapName || "Unknown";
      const result = meta.result || "-";
      const agent = segMeta.agentName || meta.agentName || "Unknown";
      const agentIcon =
        segMeta.agentImageUrl ||
        segMeta.agentIconUrl ||
        meta.agentImageUrl ||
        meta.agentIconUrl ||
        "";

      const kills = s.kills?.value ?? 0;
      const deaths = s.deaths?.value ?? 0;
      const assists = s.assists?.value ?? 0;
      const kd = deaths > 0 ? (kills / deaths).toFixed(2) : kills.toString();
      const acs = s.scorePerRound?.displayValue || "-";
      const hs = s.headshotsPercentage?.displayValue || "-";

      // ✅ Lấy round thắng / thua (có trong metadata hoặc stats)
      const roundsWon =
        meta.roundsWon ??
        s.roundsWon?.value ??
        s.roundsWon?.displayValue ??
        0;
      const roundsLost =
        meta.roundsLost ??
        s.roundsLost?.value ??
        s.roundsLost?.displayValue ??
        0;

      return {
        map,
        agent,
        agentIcon,
        kd,
        result,
        kills,
        deaths,
        assists,
        acs,
        hs,
        roundsWon,
        roundsLost,
      };
    });

    return {
      name: playerName,
      rank,
      rankIcon,
      level,
      kd,
      kda,
      hs,
      winrate,
      kills,
      deaths,
      assists,
      acs,
      damagePerRound,
      cardImage,
      recentMatches,
    };
  } catch (err: any) {
    console.error("Lỗi khi lấy Tracker.gg:", err);
    throw new Error(err.message || "Không thể lấy dữ liệu Tracker.gg");
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}
