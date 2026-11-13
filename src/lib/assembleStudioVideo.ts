import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";
import coreURL from "./studio-ffmpeg-core.js?url";
import wasmAsset from "@/assets/studio-ffmpeg-core.wasm.asset.json";

export async function assembleStudioVideo(urls: string[], duration: number, onProgress: (message: string) => void): Promise<Blob> {
  const ffmpeg = new FFmpeg();
  const blobs: string[] = [];
  try {
    onProgress("Loading video joiner…");
    const core = await toBlobURL(coreURL, "text/javascript"); blobs.push(core);
    const wasm = await toBlobURL(wasmAsset.url, "application/wasm"); blobs.push(wasm);
    await ffmpeg.load({ coreURL: core, wasmURL: wasm });
    const files: string[] = [];
    // Download and normalize one scene at a time, releasing each source immediately.
    for (let i = 0; i < urls.length; i++) {
      onProgress(`Preparing scene ${i + 1} of ${urls.length}…`);
      const response = await fetch(urls[i]);
      if (!response.ok) throw new Error("Scene download expired. Refresh your clips and try again.");
      await ffmpeg.writeFile("input.mp4", new Uint8Array(await response.arrayBuffer()));
      const name = `scene${i}.ts`;
      const result = await ffmpeg.exec(["-i", "input.mp4", "-map", "0:v:0", "-map", "0:a:0?", "-c:v", "copy", "-c:a", "aac", "-ar", "48000", "-ac", "2", "-bsf:v", "h264_mp4toannexb", "-f", "mpegts", name]);
      if (result !== 0) throw new Error("Could not prepare this video scene.");
      files.push(name); await ffmpeg.deleteFile("input.mp4");
    }
    onProgress("Joining video…");
    await ffmpeg.writeFile("scenes.txt", files.map(name => `file '${name}'`).join("\n"));
    const result = await ffmpeg.exec(["-f", "concat", "-safe", "0", "-i", "scenes.txt", "-t", String(duration), "-c", "copy", "-bsf:a", "aac_adtstoasc", "-movflags", "+faststart", "output.mp4"]);
    if (result !== 0) throw new Error("Video joining failed. Your generated scenes are still saved.");
    const data = await ffmpeg.readFile("output.mp4");
    if (typeof data === "string") throw new Error("Invalid video output.");
    return new Blob([new Uint8Array(data)], { type: "video/mp4" });
  } finally { ffmpeg.terminate(); blobs.forEach(url => URL.revokeObjectURL(url)); }
}