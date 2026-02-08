// @ts-ignore
import ytSearch from "yt-search";
import { getSpotifyMetadata, createYouTubeQuery } from "../../../services/spotify";

export interface SongResult {
  url: string;
  title: string;
}

export async function searchSong(query: string): Promise<SongResult | null> {
  // 🔍 Nếu là link Spotify
  if (query.includes("spotify.com")) {
    const spotifyData = await getSpotifyMetadata(query);
    if (spotifyData) {
      const track = spotifyData;
      const searchQuery = createYouTubeQuery(track);
      
      if (!searchQuery) {
        return null;
      }

      const artistStr = track.artists.length > 0 ? track.artists.join(", ") : "";
      const displayTitle = artistStr ? `${track.name} - ${artistStr}` : track.name;

      // Tìm trên YouTube
      const result = await ytSearch(searchQuery);
      const video = result.videos && result.videos.length > 0 ? result.videos[0] : null;
      if (video?.url) {
        return { url: video.url, title: displayTitle };
      }

      // Nếu không tìm thấy trên YouTube, thử tìm lại với tên bài hát đơn giản
      if (track.name) {
        const fallbackResult = await ytSearch(track.name);
        const fallbackVideo = fallbackResult.videos && fallbackResult.videos.length > 0 ? fallbackResult.videos[0] : null;
        if (fallbackVideo?.url) {
          return { url: fallbackVideo.url, title: displayTitle };
        }
      }

      return null;
    }
  }

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
