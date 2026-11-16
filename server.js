/**
 * Dafeild Studio — Main Web & API Server + Real AI MP4 Engine + MCP Bridge
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const {
  VIDEO_MODELS,
  CAMERA_PRESETS,
  LENS_OPTICS,
  MOTION_PRESETS,
  VFX_PRESETS,
  PHYSICS_GUARDRAILS,
  COLOR_GRADING_LUTS,
  AUDIO_SOUNDSCAPES
} = require("./catalog");
const {
  MCP_TOOLS,
  handleMcpJsonRpc,
  compileDirectorPrompt,
  buildComfyWorkflowJson,
  alignIncomingSceneToScript,
  autoAlignScenesToScript,
  performSceneRecognitionAndAutoPatch,
  performStitchFullMovie,
  performScriptToFullMovie,
  performSurgicalSceneRetake,
  loadState,
  saveState
} = require("./mcp-server");
const {
  RENDERS_DIR,
  executeRealGeneration,
  generateFreeKeylessAiFrameAndMp4,
  probeExternalMcpServer
} = require("./ai-engine");
const { encodeRealH264Mp4FromFrames, cropToVerticalMp4, buildTrailerMp4 } = require("./ffmpeg-engine");
const https = require("https");

const PORT = process.env.PORT || 3456;
const PUBLIC_DIR = path.join(__dirname, "public");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".webm": "video/webm",
  ".mp4": "video/mp4"
};

function sendJson(res, statusCode, payload) {
  if (res.headersSent) return;
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  });
  res.end(body);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 50 * 1024 * 1024) {
        reject(new Error("Payload too large"));
      }
    });
    req.on("end", () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function ensureInitialDemoClips() {
  const state = loadState();
  if (state.generations && state.generations.length > 0) return state;

  const demo1 = compileDirectorPrompt({
    prompt: "Cyberpunk rain-slicked alley in Neo-Tokyo at night, neon reflections rippling in wet asphalt puddles as detective Kaelen inspects a glowing holographic clue",
    modelId: "google-gemini-omni-free",
    cameraStack: ["dolly-in", "orbit-360"],
    cameraIntensity: 0.88,
    lensId: "cooke-anamorphic",
    motionId: "hero-walk",
    vfxId: "cyber-glitch",
    soulId: "soul-kaelen",
    dialogueText: "The signal originates beneath Sector Nine.",
    aspectRatio: "2.39:1",
    durationSec: 300
  });

  const demo2 = compileDirectorPrompt({
    prompt: "Floating solarpunk glass botanical conservatory above golden clouds at sunrise, wind turbines spinning gently in warm volumetric god rays",
    modelId: "google-gemini-omni-1.2-flash",
    cameraStack: ["fpv-drone", "crane-up"],
    cameraIntensity: 0.92,
    lensId: "imax-70mm",
    motionId: "slowmo-turn",
    vfxId: "none",
    soulId: "soul-elara",
    aspectRatio: "16:9",
    durationSec: 180
  });

  const demo3 = compileDirectorPrompt({
    prompt: "Extreme macro close-up of luxury rose-gold skeleton tourbillon wristwatch gears spinning in zero gravity amidst golden light sparks",
    modelId: "ltx-2.5-audio-cheap",
    cameraStack: ["bullet-time", "crash-zoom"],
    cameraIntensity: 0.95,
    lensId: "laowa-probe",
    motionId: "product-float",
    vfxId: "liquid-gold",
    soulId: "soul-aurum",
    aspectRatio: "16:9",
    durationSec: 300
  });

  state.generations = [
    {
      id: "clip-demo-1",
      createdAt: new Date(Date.now() - 360000).toISOString(),
      prompt: "Cyberpunk rain-slicked alley in Neo-Tokyo at night, neon reflections rippling in wet asphalt puddles as detective Kaelen inspects a glowing holographic clue",
      generationMode: "text-to-video",
      compiledPrompt: demo1.compiledPrompt,
      modelId: demo1.model.id,
      modelName: demo1.model.name,
      tier: demo1.model.tier,
      costUsd: demo1.model.costPerClipUsd,
      cameraStack: demo1.selectedCameras.map((c) => ({ id: c.id, name: c.name, vec: c.vec })),
      cameraIntensity: 0.88,
      lens: demo1.lens,
      motion: demo1.motion,
      vfx: demo1.vfx,
      soul: demo1.soul,
      dialogueText: "The signal originates beneath Sector Nine.",
      durationSec: 300,
      aspectRatio: "2.39:1",
      status: "completed",
      providerUsed: "Dafeild Free AI + Google Flow MP4 Engine ($0.00)"
    },
    {
      id: "clip-demo-2",
      createdAt: new Date(Date.now() - 180000).toISOString(),
      prompt: "Floating solarpunk glass botanical conservatory above golden clouds at sunrise, wind turbines spinning gently in warm volumetric god rays",
      generationMode: "text-to-video",
      compiledPrompt: demo2.compiledPrompt,
      modelId: demo2.model.id,
      modelName: demo2.model.name,
      tier: demo2.model.tier,
      costUsd: demo2.model.costPerClipUsd,
      cameraStack: demo2.selectedCameras.map((c) => ({ id: c.id, name: c.name, vec: c.vec })),
      cameraIntensity: 0.92,
      lens: demo2.lens,
      motion: demo2.motion,
      vfx: demo2.vfx,
      soul: demo2.soul,
      dialogueText: "",
      durationSec: 180,
      aspectRatio: "16:9",
      status: "completed",
      providerUsed: "Dafeild + Google Flow Gemini Omni 1.2 Flash ($0.04)"
    },
    {
      id: "clip-demo-3",
      createdAt: new Date(Date.now() - 60000).toISOString(),
      prompt: "Extreme macro close-up of luxury rose-gold skeleton tourbillon wristwatch gears spinning in zero gravity amidst golden light sparks",
      generationMode: "image-to-video",
      compiledPrompt: demo3.compiledPrompt,
      modelId: demo3.model.id,
      modelName: demo3.model.name,
      tier: demo3.model.tier,
      costUsd: demo3.model.costPerClipUsd,
      cameraStack: demo3.selectedCameras.map((c) => ({ id: c.id, name: c.name, vec: c.vec })),
      cameraIntensity: 0.95,
      lens: demo3.lens,
      motion: demo3.motion,
      vfx: demo3.vfx,
      soul: demo3.soul,
      dialogueText: "",
      durationSec: 300,
      aspectRatio: "16:9",
      status: "completed",
      providerUsed: "Dafeild Free AI + LTX-2.5 5-Min MP4 Engine ($0.02)"
    }
  ];

  state.timeline = [
    {
      timelineId: "tl-demo-1",
      clipId: "clip-demo-1",
      prompt: state.generations[0].prompt,
      modelName: state.generations[0].modelName,
      durationSec: 60,
      transition: "cut"
    },
    {
      timelineId: "tl-demo-2",
      clipId: "clip-demo-2",
      prompt: state.generations[1].prompt,
      modelName: state.generations[1].modelName,
      durationSec: 120,
      transition: "whip-stitch"
    },
    {
      timelineId: "tl-demo-3",
      clipId: "clip-demo-3",
      prompt: state.generations[2].prompt,
      modelName: state.generations[2].modelName,
      durationSec: 300,
      transition: "cross-dissolve"
    }
  ];

  saveState(state);
  return state;
}

let isHydrating = false;
async function hydrateMissingFramesAndMp4InBackground() {
  if (isHydrating) return;
  isHydrating = true;
  try {
    const state = loadState();
    let changed = false;
    for (const clip of state.generations) {
      const expectedJpg = path.join(RENDERS_DIR, `${clip.id}.jpg`);
      const expectedJpg2 = path.join(RENDERS_DIR, `${clip.id}-beat2.jpg`);
      const expectedMp4 = path.join(RENDERS_DIR, `${clip.id}.mp4`);

      // Check if existing MP4 is an older non-H.264 (non-avc1) file; if so, re-encode with FFmpeg H.264!
      let hasValidH264 = false;
      if (fs.existsSync(expectedMp4)) {
        try {
          const headBuf = fs.readFileSync(expectedMp4);
          hasValidH264 = headBuf.includes(Buffer.from("avc1"));
        } catch (_) {}
      }

      if (fs.existsSync(expectedJpg) && !hasValidH264) {
        try {
          const frames = [expectedJpg];
          if (fs.existsSync(expectedJpg2)) frames.push(expectedJpg2);
          await encodeRealH264Mp4FromFrames({
            framePaths: frames,
            destMp4Path: expectedMp4,
            durationSec: Math.min(10, Math.max(5, Number(clip.durationSec || 8))),
            cameraStack: (clip.cameraStack || []).map((c) => c.id || c),
            lutId: clip.lut?.id || "kodak-2383",
            aspectRatio: clip.aspectRatio || "2.39:1"
          });
          hasValidH264 = true;
        } catch (_) {}
      }

      if (fs.existsSync(expectedJpg) && hasValidH264) {
        if (clip.frameUrl !== `/renders/${clip.id}.jpg` || clip.mp4Url !== `/renders/${clip.id}.mp4`) {
          clip.frameUrl = `/renders/${clip.id}.jpg`;
          clip.mp4Url = `/renders/${clip.id}.mp4`;
          clip.videoUrl = `/renders/${clip.id}.mp4`;
          changed = true;
        }
        continue;
      }

      try {
        const compiled = compileDirectorPrompt({
          prompt: clip.prompt,
          modelId: clip.modelId,
          cameraStack: (clip.cameraStack || []).map((c) => c.id),
          lensId: clip.lens?.id,
          soulId: clip.soul?.id,
          aspectRatio: clip.aspectRatio,
          durationSec: clip.durationSec || 30
        });
        const res = await generateFreeKeylessAiFrameAndMp4(clip.id, compiled, clip);
        if (res.frameUrl) {
          clip.frameUrl = res.frameUrl;
          clip.videoUrl = res.videoUrl;
          clip.mp4Url = res.mp4Url;
          clip.providerUsed = res.providerUsed;
          changed = true;
          saveState(state);
        }
      } catch (_) {}
    }
    if (changed) saveState(state);
  } finally {
    isHydrating = false;
  }
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = parsedUrl.pathname;

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    });
    return res.end();
  }

  try {
    // 1. Studio Full Catalog & State
    if (pathname === "/api/catalog" && req.method === "GET") {
      const state = ensureInitialDemoClips();
      state.generations.forEach((g) => {
        if (!g.frameUrl && fs.existsSync(path.join(RENDERS_DIR, `${g.id}.jpg`))) {
          g.frameUrl = `/renders/${g.id}.jpg`;
        }
        if (fs.existsSync(path.join(RENDERS_DIR, `${g.id}.mp4`))) {
          g.mp4Url = `/renders/${g.id}.mp4`;
          if (!g.videoUrl) g.videoUrl = `/renders/${g.id}.mp4`;
        }
        if (fs.existsSync(path.join(RENDERS_DIR, `${g.id}.webm`))) {
          g.webmUrl = `/renders/${g.id}.webm`;
        }
      });
      const alignmentReport = autoAlignScenesToScript(state);
      saveState(state);
      hydrateMissingFramesAndMp4InBackground();
      return sendJson(res, 200, {
        models: [...VIDEO_MODELS, ...(state.customModels || [])],
        cameraPresets: CAMERA_PRESETS,
        lensOptics: LENS_OPTICS,
        motionPresets: MOTION_PRESETS,
        vfxPresets: VFX_PRESETS,
        physicsGuardrails: PHYSICS_GUARDRAILS,
        colorGradingLuts: COLOR_GRADING_LUTS,
        audioSoundscapes: AUDIO_SOUNDSCAPES,
        soulIds: state.soulIds,
        generations: state.generations,
        timeline: state.timeline,
        originalStory: state.originalStory,
        alignmentReport,
        movies: state.movies || [],
        mcpTools: MCP_TOOLS,
        connectedMcpServers: state.connectedMcpServers || [],
        mcpServerConfigPath: path.join(__dirname, "mcp-server.js")
      });
    }

    // 2. Real AI Generation Endpoint (Supports 5s up to 300s / 5 Minutes MP4 + Always Auto-Aligned to Script)
    if (pathname === "/api/generate" && req.method === "POST") {
      const body = await readJsonBody(req);
      if (!body.prompt || !body.prompt.trim()) {
        return sendJson(res, 400, { error: "Please provide a scene prompt." });
      }

      const state = loadState();
      const durationSec = Math.min(300, Math.max(5, Number(body.durationSec || 30)));
      const alignedBody = alignIncomingSceneToScript({ ...body, durationSec }, state);

      const compiled = compileDirectorPrompt(alignedBody);
      const clipId = "clip-" + Date.now().toString(36);

      const genResult = await executeRealGeneration(
        clipId,
        compiled,
        alignedBody,
        buildComfyWorkflowJson
      );

      const newClip = {
        id: clipId,
        createdAt: new Date().toISOString(),
        prompt: body.prompt.trim(),
        generationMode: body.generationMode || "text-to-video",
        compiledPrompt: compiled.compiledPrompt,
        modelId: compiled.model.id,
        modelName: compiled.model.name,
        tier: compiled.model.tier,
        costUsd: compiled.model.costPerClipUsd,
        cameraStack: compiled.selectedCameras.map((c) => ({ id: c.id, name: c.name, vec: c.vec })),
        cameraIntensity: Number(body.cameraIntensity ?? 0.85),
        lens: compiled.lens,
        motion: compiled.motion || null,
        vfx: compiled.vfx || VFX_PRESETS[0],
        soul: compiled.soul || null,
        dialogueText: (body.dialogueText || "").trim(),
        frameUrl: genResult.frameUrl || null,
        videoUrl: genResult.videoUrl || `/renders/${clipId}.mp4`,
        mp4Url: genResult.mp4Url || `/renders/${clipId}.mp4`,
        durationSec,
        aspectRatio: body.aspectRatio || "2.39:1",
        motionTrajectory: body.motionTrajectory || [],
        scriptBeatIndex: alignedBody.scriptBeatIndex,
        scriptBeatNumber: alignedBody.scriptBeatNumber,
        scriptBeatLabel: alignedBody.scriptBeatLabel,
        scriptBeatText: alignedBody.scriptBeatText,
        scriptAlignmentNote: alignedBody.scriptAlignmentNote,
        status: "completed",
        providerUsed: genResult.providerUsed,
        logs: genResult.logs || []
      };

      state.generations.unshift(newClip);
      // Always auto-align all scenes & insert the new scene into the Master Sequence in exact script order!
      const alignmentReport = autoAlignScenesToScript(state, alignedBody.originalStory, {
        includeClipId: clipId
      });
      saveState(state);

      return sendJson(res, 200, {
        clip: newClip,
        generations: state.generations,
        timeline: state.timeline,
        alignmentReport
      });
    }

    // 2b. Save Recorded Video File (.mp4 or .webm) to Disk
    if (pathname === "/api/save-video" && req.method === "POST") {
      const body = await readJsonBody(req);
      const { clipId, videoBase64, mimeType = "video/mp4" } = body;
      if (!clipId || !videoBase64) {
        return sendJson(res, 400, { error: "Missing clipId or videoBase64" });
      }
      const isMp4 = mimeType.includes("mp4");
      const cleanB64 = videoBase64.replace(/^data:video\/[a-zA-Z0-9+-]+(;codecs=[^;]+)?;base64,/, "");
      const ext = isMp4 ? "mp4" : "webm";
      const filename = `${clipId}.${ext}`;
      const destPath = path.join(RENDERS_DIR, filename);
      fs.writeFileSync(destPath, Buffer.from(cleanB64, "base64"));

      const state = loadState();
      const target = state.generations.find((g) => g.id === clipId);
      if (target) {
        if (isMp4) {
          target.mp4Url = `/renders/${filename}`;
          target.videoUrl = `/renders/${filename}`;
        } else {
          target.webmUrl = `/renders/${filename}`;
          if (!target.mp4Url) target.videoUrl = `/renders/${filename}`;
        }
        saveState(state);
      }

      return sendJson(res, 200, {
        saved: true,
        videoUrl: `/renders/${filename}`,
        mp4Url: target?.mp4Url || `/renders/${clipId}.mp4`,
        diskPath: destPath
      });
    }

    // 2c. Export ComfyUI Open-Weights Workflow JSON
    if (pathname === "/api/comfy-workflow" && req.method === "POST") {
      const body = await readJsonBody(req);
      const compiled = compileDirectorPrompt(body);
      const workflow = buildComfyWorkflowJson(compiled, body);
      return sendJson(res, 200, workflow);
    }

    // 2d. Delete / Discard a Scene That User Does Not Like
    if (pathname.startsWith("/api/generations/") && req.method === "DELETE") {
      const clipId = pathname.replace("/api/generations/", "").trim();
      const state = loadState();
      const clipIdx = state.generations.findIndex((g) => g.id === clipId);
      if (clipIdx === -1) {
        return sendJson(res, 404, { error: `Scene ${clipId} not found` });
      }

      // Remove from generations array
      state.generations.splice(clipIdx, 1);

      // Also remove from timeline sequence if present
      state.timeline = state.timeline.filter((t) => t.clipId !== clipId);

      // Clean up files on disk asynchronously
      const filesToDelete = [
        path.join(RENDERS_DIR, `${clipId}.mp4`),
        path.join(RENDERS_DIR, `${clipId}.jpg`),
        path.join(RENDERS_DIR, `${clipId}-beat2.jpg`),
        path.join(RENDERS_DIR, `${clipId}-beat3.jpg`),
        path.join(RENDERS_DIR, `${clipId}.webm`),
        path.join(RENDERS_DIR, `${clipId}-raw.mp4`)
      ];
      filesToDelete.forEach((f) => {
        try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch (_) {}
      });

      saveState(state);
      return sendJson(res, 200, {
        deleted: true,
        clipId,
        generations: state.generations,
        timeline: state.timeline
      });
    }

    // 2e. Update / Rename Scene Title (Prompt) Endpoint
    if (pathname.startsWith("/api/generations/") && req.method === "PATCH") {
      const clipId = pathname.replace("/api/generations/", "").trim();
      const body = await readJsonBody(req);
      const state = loadState();
      const target = state.generations.find((g) => g.id === clipId);
      if (!target) {
        return sendJson(res, 404, { error: `Scene ${clipId} not found` });
      }
      if (body.prompt && body.prompt.trim()) {
        target.prompt = body.prompt.trim();
      }
      state.timeline.forEach((t) => {
        if (t.clipId === clipId && body.prompt) t.prompt = body.prompt.trim();
      });
      saveState(state);
      return sendJson(res, 200, {
        updated: true,
        clip: target,
        generations: state.generations,
        timeline: state.timeline
      });
    }

    // 3. Soul ID Management
    if (pathname === "/api/soul-id" && req.method === "POST") {
      const body = await readJsonBody(req);
      const state = loadState();
      const newSoul = {
        id: "soul-" + Date.now().toString(36),
        name: (body.name || "Untitled Character").trim(),
        role: (body.role || "Protagonist").trim(),
        seed: Number(body.seed) || Math.floor(1000000 + Math.random() * 9000000),
        consistencyWeight: Number(body.consistencyWeight ?? 0.94),
        avatarColor: body.avatarColor || "#f59e0b",
        appearancePrompt: (body.appearancePrompt || "Consistent character appearance across scenes").trim(),
        voiceProfile: body.voiceProfile || "Cinematic Studio Sync",
        referenceTags: body.referenceTags || ["Face Lock v3", "Outfit Lock", "Seed Lock"]
      };
      state.soulIds.unshift(newSoul);
      saveState(state);
      return sendJson(res, 200, { soul: newSoul, soulIds: state.soulIds });
    }

    if (pathname.startsWith("/api/soul-id/") && req.method === "DELETE") {
      const soulId = pathname.replace("/api/soul-id/", "");
      const state = loadState();
      state.soulIds = state.soulIds.filter((s) => s.id !== soulId);
      saveState(state);
      return sendJson(res, 200, { soulIds: state.soulIds });
    }

    // 3b. Import / Register Custom Video Model (Higgsfield / Movie Platforms / HuggingFace / Fal)
    if (pathname === "/api/models" && req.method === "POST") {
      const body = await readJsonBody(req);
      const state = loadState();
      if (!Array.isArray(state.customModels)) state.customModels = [];

      const rawName = (body.name || "Custom Cinema Video Model").trim();
      const customId =
        (body.id || rawName.toLowerCase().replace(/[^a-z0-9]+/g, "-")).replace(/^-|-$/g, "") +
        "-" +
        Date.now().toString(36).slice(-4);
      const costNum = Math.max(0, Number(body.costPerClipUsd || 0));

      const newModel = {
        id: customId,
        name: rawName,
        provider: (body.provider || "Custom Movie Platform / HF Router").trim(),
        platformGroup: body.platformGroup || "custom",
        tier: costNum === 0 ? "free" : costNum <= 0.15 ? "cheap" : "pro",
        costPerClipUsd: costNum,
        speedSec: Number(body.speedSec || 12),
        maxResolution: (body.maxResolution || "1920x1080 (1080p Full HD)").trim(),
        maxDurationSec: 300,
        license: body.license || "Custom / Open Router",
        vramRequired: "0GB Cloud Router",
        badges: ["CUSTOM IMPORTED", body.platformGroup === "higgsfield" ? "HIGGSFIELD" : "MOVIE PLATFORM", "5 MIN MP4"],
        capabilities: ["text-to-video", "image-to-video", "camera-control", "soul-id", "long-form-5m"],
        qualityScore: 9.6,
        hfRepo: (body.hfRepo || "Lightricks/LTX-Video").trim(),
        falEndpoint: (body.falEndpoint || "https://fal.run/fal-ai/wan-t2v").trim(),
        description: (body.description || `Custom imported model (${rawName}) routed through Dafeild's 24fps H.264 + AAC .MP4 cinema engine.`).trim()
      };

      state.customModels.unshift(newModel);
      saveState(state);
      return sendJson(res, 200, {
        model: newModel,
        models: [...VIDEO_MODELS, ...state.customModels]
      });
    }

    // 4. Storyboard Timeline Sequencer (Always Auto-Aligned to Script)
    if (pathname === "/api/timeline" && req.method === "POST") {
      const body = await readJsonBody(req);
      const state = loadState();
      if (body.action === "clear") {
        state.timeline = [];
        saveState(state);
        return sendJson(res, 200, { timeline: state.timeline });
      }
      if (body.action === "remove" && body.timelineId) {
        state.timeline = state.timeline.filter((t) => t.timelineId !== body.timelineId);
        const alignmentReport = autoAlignScenesToScript(state, body.originalStory);
        saveState(state);
        return sendJson(res, 200, { timeline: state.timeline, generations: state.generations, alignmentReport });
      }
      const clip = state.generations.find((g) => g.id === body.clipId);
      if (!clip) return sendJson(res, 404, { error: "Clip not found" });
      const alignmentReport = autoAlignScenesToScript(state, body.originalStory, {
        includeClipId: clip.id
      });
      saveState(state);
      return sendJson(res, 200, { timeline: state.timeline, generations: state.generations, alignmentReport });
    }

    // 4a. Instant Auto-Align All Scenes to Script Endpoint
    if (pathname === "/api/movie/align-script" && req.method === "POST") {
      const body = await readJsonBody(req);
      const state = loadState();
      const alignmentReport = autoAlignScenesToScript(state, body.originalStory);
      saveState(state);
      return sendJson(res, 200, {
        timeline: state.timeline,
        generations: state.generations,
        alignmentReport
      });
    }

    // 4b. Scene Recognition & Story Continuity Auto-Patcher
    if (pathname === "/api/movie/auto-patch" && req.method === "POST") {
      const body = await readJsonBody(req);
      const patchResult = await performSceneRecognitionAndAutoPatch(body);
      return sendJson(res, 200, patchResult);
    }

    // 4c. Stitch Multiple Clips into a Single Full Movie (.MP4)
    if (pathname === "/api/movie/stitch" && req.method === "POST") {
      const body = await readJsonBody(req);
      const stitchResult = await performStitchFullMovie(body);
      return sendJson(res, 200, stitchResult);
    }

    // 4d. 1-Click Script-to-Full-Movie Autonomous Director
    if (pathname === "/api/movie/from-script" && req.method === "POST") {
      const body = await readJsonBody(req);
      const scriptMovieRes = await performScriptToFullMovie(body);
      return sendJson(res, 200, scriptMovieRes);
    }

    // 4e. Surgical Scene Frame-Range Retake (No Full Re-Render Required)
    if (pathname === "/api/movie/surgical-retake" && req.method === "POST") {
      const body = await readJsonBody(req);
      const retakeRes = await performSurgicalSceneRetake(body);
      return sendJson(res, 200, retakeRes);
    }

    // 4f. Real Stripe Checkout (requires STRIPE_SECRET_KEY + STRIPE_PRICE_PRO / STRIPE_PRICE_STUDIO)
    if (pathname === "/api/billing/checkout" && req.method === "POST") {
      const body = await readJsonBody(req);
      const planId = body.planId === "studio" ? "studio" : body.planId === "pro" ? "pro" : "free";
      if (planId === "free") return sendJson(res, 200, { ok: true, plan: "free" });

      const secret = process.env.STRIPE_SECRET_KEY;
      const priceId = planId === "studio" ? process.env.STRIPE_PRICE_STUDIO : process.env.STRIPE_PRICE_PRO;
      if (!secret || !priceId) {
        return sendJson(res, 501, {
          ok: false,
          error: "Payments not configured. Set STRIPE_SECRET_KEY, STRIPE_PRICE_PRO and STRIPE_PRICE_STUDIO."
        });
      }
      const origin = `http://${req.headers.host}`;
      const form = new URLSearchParams({
        mode: "subscription",
        "line_items[0][price]": priceId,
        "line_items[0][quantity]": "1",
        success_url: `${origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/?checkout=cancel`,
        "metadata[planId]": planId
      }).toString();

      const stripeRes = await new Promise((resolve, reject) => {
        const r = https.request(
          "https://api.stripe.com/v1/checkout/sessions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${secret}`,
              "Content-Type": "application/x-www-form-urlencoded",
              "Content-Length": Buffer.byteLength(form)
            }
          },
          (sr) => {
            let d = "";
            sr.on("data", (c) => (d += c));
            sr.on("end", () => resolve({ status: sr.statusCode, json: JSON.parse(d || "{}") }));
          }
        );
        r.on("error", reject);
        r.write(form);
        r.end();
      });
      if (stripeRes.status >= 300 || !stripeRes.json.url) {
        return sendJson(res, 502, { ok: false, error: stripeRes.json.error?.message || "Stripe error" });
      }
      // Credits are NOT granted here — only after Stripe confirms payment (webhook, to be added with user accounts).
      return sendJson(res, 200, { ok: true, checkoutUrl: stripeRes.json.url });
    }

    // 4g. Real 9:16 vertical crop of a clip
    if (pathname === "/api/export/vertical" && req.method === "POST") {
      const body = await readJsonBody(req);
      const state = loadState();
      const clip = state.generations.find((g) => g.id === body.clipId);
      const src = clip && (clip.mp4Url || clip.videoUrl);
      if (!src) return sendJson(res, 404, { error: "Clip has no MP4" });
      const srcPath = path.join(PUBLIC_DIR, src.split("?")[0]);
      const outName = `${clip.id}-9x16.mp4`;
      await cropToVerticalMp4({ srcMp4Path: srcPath, destMp4Path: path.join(RENDERS_DIR, outName) });
      return sendJson(res, 200, { ok: true, mp4Url: `/renders/${outName}` });
    }

    // 4h. Real 15s trailer from timeline clips (falls back to latest generations)
    if (pathname === "/api/export/trailer" && req.method === "POST") {
      const state = loadState();
      const ids = state.timeline.length ? state.timeline.map((t) => t.clipId) : state.generations.slice(0, 5).map((g) => g.id);
      const paths = ids
        .map((id) => state.generations.find((g) => g.id === id))
        .filter((g) => g && (g.mp4Url || g.videoUrl))
        .map((g) => path.join(PUBLIC_DIR, (g.mp4Url || g.videoUrl).split("?")[0]));
      const outName = `trailer-${Date.now()}.mp4`;
      const r = await buildTrailerMp4({ clipMp4Paths: paths, destMp4Path: path.join(RENDERS_DIR, outName), totalSec: 15 });
      return sendJson(res, 200, { ok: true, mp4Url: `/renders/${outName}`, clipsUsed: r.clipsUsed });
    }

    // 5. MCP JSON-RPC 2.0 Endpoint (/api/mcp/rpc)
    if (pathname === "/api/mcp/rpc" && req.method === "POST") {
      const rpcReq = await readJsonBody(req);
      const rpcRes = await handleMcpJsonRpc(rpcReq);
      return sendJson(res, 200, rpcRes || { jsonrpc: "2.0", status: "ok" });
    }

    // 6. Real External MCP Server Probe & Connection
    if (pathname === "/api/mcp/servers" && req.method === "POST") {
      const body = await readJsonBody(req);
      const state = loadState();
      if (!state.connectedMcpServers) state.connectedMcpServers = [];

      let probeResult = { verified: false, toolsCount: 0, tools: [], error: null };
      try {
        probeResult = await probeExternalMcpServer({
          name: body.name,
          endpoint: body.endpoint,
          transport: body.transport || "http-rpc"
        });
      } catch (err) {
        probeResult.error = err.message;
      }

      const srv = {
        id: "mcp-" + Date.now().toString(36),
        name: body.name || "External MCP Server",
        transport: body.endpoint.startsWith("http") ? "http-rpc" : "stdio",
        endpoint: body.endpoint,
        status: probeResult.verified ? "connected" : "unreachable",
        verified: probeResult.verified,
        toolsCount: probeResult.toolsCount,
        tools: probeResult.tools,
        error: probeResult.error
      };
      state.connectedMcpServers.push(srv);
      saveState(state);
      return sendJson(res, 200, {
        server: srv,
        connectedMcpServers: state.connectedMcpServers
      });
    }

    // 7. Static File Serving (with HTTP 206 Range Support for native HTML5 <video> MP4 playback)
    let filePath = pathname === "/" ? path.join(PUBLIC_DIR, "index.html") : path.join(PUBLIC_DIR, pathname);
    if (!filePath.startsWith(PUBLIC_DIR)) {
      res.writeHead(403);
      return res.end("Forbidden");
    }
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const stat = fs.statSync(filePath);
      if (stat.size === 0) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        return res.end("Empty file");
      }
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || "application/octet-stream";
      const range = req.headers.range;

      if (range && (ext === ".mp4" || ext === ".webm")) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = Math.max(0, parseInt(parts[0], 10) || 0);
        const end = parts[1] ? Math.min(stat.size - 1, parseInt(parts[1], 10)) : stat.size - 1;
        if (start > end || start >= stat.size) {
          res.writeHead(416, { "Content-Range": `bytes */${stat.size}` });
          return res.end();
        }
        const chunksize = end - start + 1;
        res.writeHead(206, {
          "Content-Range": `bytes ${start}-${end}/${stat.size}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunksize,
          "Content-Type": contentType,
          "Cache-Control": "no-store"
        });
        const stream = fs.createReadStream(filePath, { start, end });
        stream.on("error", () => { try { res.end(); } catch (_) {} });
        return stream.pipe(res);
      }

      res.writeHead(200, {
        "Content-Type": contentType,
        "Content-Length": stat.size,
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-store"
      });
      const stream = fs.createReadStream(filePath);
      stream.on("error", () => { try { res.end(); } catch (_) {} });
      return stream.pipe(res);
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  } catch (err) {
    sendJson(res, 500, { error: err.message || "Internal server error" });
  }
});

server.listen(PORT, () => {
  ensureInitialDemoClips();
  hydrateMissingFramesAndMp4InBackground();
  console.log(`\n==================================================================`);
  console.log(`🎬 Dafeild AI Video Studio + Real MP4 Engine running at:`);
  console.log(`   👉 Web Studio:   http://localhost:${PORT}`);
  console.log(`   🔌 MCP JSON-RPC: http://localhost:${PORT}/api/mcp/rpc`);
  console.log(`   💻 MCP Stdio:    node "${path.join(__dirname, "mcp-server.js")}"`);
  console.log(`==================================================================\n`);
});
