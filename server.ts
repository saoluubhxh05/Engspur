import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory cache for generated TTS audio to maximize performance
const ttsBufferCache = new Map<string, Buffer>();

// Curated list of high quality Edge Neural voices
const CURATED_EDGE_VOICES = [
  { id: "en-US-JennyNeural", name: "Jenny (Nữ Mỹ - Tự nhiên, ngọt ngào, chuẩn)", lang: "en-US", gender: "Female" },
  { id: "en-US-GuyNeural", name: "Guy (Nam Mỹ - Trầm ấm, dứt khoát, chuẩn)", lang: "en-US", gender: "Male" },
  { id: "en-US-AriaNeural", name: "Aria (Nữ Mỹ - Chuyên nghiệp, bài giảng)", lang: "en-US", gender: "Female" },
  { id: "en-US-ChristopherNeural", name: "Christopher (Nam Mỹ - Tự nhiên, rõ chữ)", lang: "en-US", gender: "Male" },
  { id: "en-US-EricNeural", name: "Eric (Nam Mỹ - Năng động, trẻ trung)", lang: "en-US", gender: "Male" },
  { id: "en-US-MichelleNeural", name: "Michelle (Nữ Mỹ - Điềm tĩnh)", lang: "en-US", gender: "Female" },
  { id: "en-GB-SoniaNeural", name: "Sonia (Nữ Anh - Chuẩn BBC/Oxford)", lang: "en-GB", gender: "Female" },
  { id: "en-GB-RyanNeural", name: "Ryan (Nam Anh - Chuẩn BBC/Oxford)", lang: "en-GB", gender: "Male" },
  { id: "en-GB-LibbyNeural", name: "Libby (Nữ Anh - Tự nhiên)", lang: "en-GB", gender: "Female" },
  { id: "en-AU-NatashaNeural", name: "Natasha (Nữ Úc)", lang: "en-AU", gender: "Female" },
  { id: "en-AU-WilliamNeural", name: "William (Nam Úc)", lang: "en-AU", gender: "Male" },
  { id: "en-CA-ClaraNeural", name: "Clara (Nữ Canada)", lang: "en-CA", gender: "Female" },
];

app.get("/api/tts/voices", (_req, res) => {
  res.json({ voices: CURATED_EDGE_VOICES });
});

async function handleTtsRequest(req: express.Request, res: express.Response) {
  const text = (req.query.text as string || req.body?.text as string || "").trim();
  if (!text) {
    return res.status(400).json({ error: "Văn bản phát âm không được để trống" });
  }

  let voice = (req.query.voice as string || req.body?.voice as string || "en-US-JennyNeural").trim();
  if (voice.startsWith("edge:")) {
    voice = voice.substring(5);
  }

  const rateNum = parseFloat(req.query.rate as string || req.body?.rate as string || "0.95");
  const ratePct = rateNum >= 1 ? `+${Math.round((rateNum - 1) * 100)}%` : `-${Math.round((1 - rateNum) * 100)}%`;

  const cacheKey = `${voice}__${ratePct}__${text}`;
  if (ttsBufferCache.has(cacheKey)) {
    const cachedBuf = ttsBufferCache.get(cacheKey)!;
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", cachedBuf.length);
    res.setHeader("Cache-Control", "public, max-age=86400");
    return res.send(cachedBuf);
  }

  let tts: MsEdgeTTS | null = null;
  try {
    tts = new MsEdgeTTS();
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const { audioStream } = tts.toStream(text, { rate: ratePct });

    const chunks: Buffer[] = [];
    audioStream.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    audioStream.on("end", () => {
      try { tts?.close(); } catch (_) {}
      const fullBuffer = Buffer.concat(chunks);
      if (ttsBufferCache.size > 200) {
        const firstKey = ttsBufferCache.keys().next().value;
        if (firstKey) ttsBufferCache.delete(firstKey);
      }
      ttsBufferCache.set(cacheKey, fullBuffer);

      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Content-Length", fullBuffer.length);
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.send(fullBuffer);
    });

    audioStream.on("error", (streamErr) => {
      console.error("Audio stream error:", streamErr);
      try { tts?.close(); } catch (_) {}
      if (!res.headersSent) {
        res.status(500).json({ error: "Lỗi luồng âm thanh TTS" });
      }
    });
  } catch (err: any) {
    console.error("TTS generation error:", err);
    try { tts?.close(); } catch (_) {}
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || "Không thể tổng hợp giọng đọc" });
    }
  }
}

app.get("/api/tts", handleTtsRequest);
app.post("/api/tts", handleTtsRequest);

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
