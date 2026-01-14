// @ts-ignore
import ytSearch from "yt-search";

export interface SongResult {
  url: string;
  title: string;
}

export async function searchSong(query: string): Promise<SongResult | null> {
  // 🔍 Nếu là link YouTube
  if (/^https?:\/\//i.test(query)) {
    const videoId = getVideoIdFromUrl(query ?? "");
    if (videoId) {
      const info = await ytSearch({ videoId });
      if (info && info.title) return { url: query, title: info.title };
    }
    return { url: query, title: query };
  }

  // 🔍 Nếu là từ khóa
  const result = await ytSearch(query);
  const video = result.videos && result.videos.length > 0 ? result.videos[0] : null;
  if (!video?.url) return null;

  return { url: video.url, title: video.title };
}

/**  Lấy videoId từ URL YouTube */
function getVideoIdFromUrl(url: any): string | null {
  const match = url.match(/[?&]v=([^&]+)/);
  if (match) return match[1];
  const short = url.match(/youtu\.be\/([^?]+)/);
  return short ? short[1] : null;
}
