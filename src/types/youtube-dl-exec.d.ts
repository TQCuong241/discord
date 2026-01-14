declare module "youtube-dl-exec" {
  import { ChildProcess } from "child_process";

  interface YoutubeDl {
    exec(url: string, options?: Record<string, any>): ChildProcess;
  }

  const youtubedl: YoutubeDl;
  export default youtubedl;
}
