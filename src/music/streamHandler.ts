import { Readable } from "stream";
// @ts-ignore
import youtubedl from "youtube-dl-exec";
import { createAudioResource } from "@discordjs/voice";
import { ICON } from "../utils/icons";

export async function createStreamResource(url: string) {
  const proc = (youtubedl as any).exec(
    url,
    {
      output: "-",
      quiet: true,
      format: "bestaudio/best",
    },
    { stdio: ["ignore", "pipe", "pipe"] }
  );

  if (!proc.stdout)
    throw new Error(`${ICON.error} Không lấy được stream từ yt-dlp!`);

  const stream = Readable.from(proc.stdout);
  return createAudioResource(stream);
}
