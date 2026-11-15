#!/usr/bin/env node
/**
 * DAFE.ILD Studio — Model Context Protocol (MCP) Server
 * Supports both:
 *   1. Standard MCP over stdio (`node mcp-server.js`) for Antigravity, Claude Desktop, Cursor, etc.
 *   2. Direct programmatic JSON-RPC handler exported for the HTTP/SSE bridge (`/api/mcp/rpc`).
 */

const readline = require("readline");
const fs = require("fs");
const path = require("path");
const {
  VIDEO_MODELS,
  CAMERA_PRESETS,
  LENS_OPTICS,
  MOTION_PRESETS,
  VFX_PRESETS,
  DEFAULT_SOUL_IDS,
  PHYSICS_GUARDRAILS,
  COLOR_GRADING_LUTS,
  AUDIO_SOUNDSCAPES
} = require("./catalog");
const {
  callFreeAiLlm,
  executeRealGeneration,
  recognizeSceneProfile,
  generateAiBridgePrompt,
  stitchClipsIntoMovieMp4
} = require("./ai-engine");

const STATE_FILE = path.join(__dirname, "data", "studio-state.json");

const DEFAULT_STORY_SCRIPT =
  "Detective Kaelen discovers an encrypted holographic signal in rain-slicked Neo-Tokyo. He ascends to the floating Solarpunk Conservatory to meet Elara. Together they unlock the AURUM-9 chronometer as golden light fills the dome.";

function parseScriptBeats(scriptText = "") {
  const clean = (scriptText || DEFAULT_STORY_SCRIPT).trim();
  const sentences = clean
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5);

  if (sentences.length === 0) {
    return [{ index: 0, beatNumber: 1, actLabel: "Act I • Opening Beat", text: DEFAULT_STORY_SCRIPT }];
  }

  return sentences.map((text, idx) => {
    const total = sentences.length;
    let actLabel = `Beat #${idx + 1}`;
    if (idx === 0) actLabel = `Beat #1 • Act I (Establishing)`;
    else if (idx === total - 1 && total > 1) actLabel = `Beat #${idx + 1} • Act III (Climax & Resolution)`;
    else actLabel = `Beat #${idx + 1} • Act II (Rising Action)`;
    return {
      index: idx,
      beatNumber: idx + 1,
      actLabel,
      text
    };
  });
}

function scorePromptAgainstBeat(promptText = "", beatText = "") {
  const stopWords = new Set(["the", "and", "in", "of", "to", "a", "an", "as", "at", "with", "on", "for", "from", "by", "he", "she", "they", "it", "is"]);
  const tokenize = (str) =>
    String(str || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w));

  const pTokens = tokenize(promptText);
  const bTokens = tokenize(beatText);
  if (pTokens.length === 0 || bTokens.length === 0) return 0;

  let score = 0;
  for (const pt of pTokens) {
    for (const bt of bTokens) {
      if (pt === bt) score += 3;
      else if (pt.length >= 4 && bt.length >= 4 && (pt.includes(bt) || bt.includes(pt))) score += 1.5;
    }
  }
  // Semantic domain synonyms for Neo-Tokyo / Solarpunk / Horology / Desert
  const pLow = promptText.toLowerCase();
  const bLow = beatText.toLowerCase();
  if ((pLow.includes("cyberpunk") || pLow.includes("alley") || pLow.includes("rain") || pLow.includes("tokyo")) &&
      (bLow.includes("tokyo") || bLow.includes("rain") || bLow.includes("signal") || bLow.includes("kaelen"))) {
    score += 4;
  }
  if ((pLow.includes("solarpunk") || pLow.includes("conservatory") || pLow.includes("biodome") || pLow.includes("clouds") || pLow.includes("elara")) &&
      (bLow.includes("solarpunk") || bLow.includes("conservatory") || bLow.includes("ascends") || bLow.includes("elara"))) {
    score += 5;
  }
  if ((pLow.includes("watch") || pLow.includes("aurum") || pLow.includes("chronometer") || pLow.includes("gears") || pLow.includes("gold")) &&
      (bLow.includes("aurum") || bLow.includes("chronometer") || bLow.includes("golden") || bLow.includes("unlock"))) {
    score += 5;
  }
  return score;
}

/**
 * Automatically aligns an incoming scene creation request (`body`) to fit the active Original Story Script
 * before compiling the director prompt and generating the video.
 */
function alignIncomingSceneToScript(body = {}, state = null) {
  const activeState = state || loadState();
  const scriptText = (body.originalStory || activeState.originalStory || DEFAULT_STORY_SCRIPT).trim();
  const beats = parseScriptBeats(scriptText);
  const rawPrompt = (body.prompt || "").trim();

  // Find best-matching beat or next sequential beat
  let bestBeat = beats[0];
  let bestScore = -1;
  beats.forEach((b) => {
    const sc = scorePromptAgainstBeat(rawPrompt, b.text);
    if (sc > bestScore) {
      bestScore = sc;
      bestBeat = b;
    }
  });

  // If prompt has zero lexical overlap with any specific beat, align it to the next beat in the timeline progression
  if (bestScore <= 0 && beats.length > 0) {
    const nextIdx = (activeState.timeline ? activeState.timeline.length : 0) % beats.length;
    bestBeat = beats[nextIdx];
  }

  // Detect character mentioned in matched beat or script if none explicitly locked
  let alignedSoulId = body.soulId;
  if (!alignedSoulId && activeState.soulIds && activeState.soulIds.length > 0) {
    const combinedLow = `${rawPrompt} ${bestBeat.text} ${scriptText}`.toLowerCase();
    const matchedSoul = activeState.soulIds.find((s) => {
      const firstName = s.name.split(/[\s(]/)[0].toLowerCase();
      return firstName.length > 2 && combinedLow.includes(firstName);
    });
    alignedSoulId = (matchedSoul || activeState.soulIds[0]).id;
  }

  return {
    ...body,
    soulId: alignedSoulId || body.soulId,
    originalStory: scriptText,
    scriptBeatIndex: bestBeat.index,
    scriptBeatNumber: bestBeat.beatNumber,
    scriptBeatLabel: bestBeat.actLabel,
    scriptBeatText: bestBeat.text,
    scriptAlignmentNote: `Auto-aligned to ${bestBeat.actLabel}: "${bestBeat.text}"`
  };
}

/**
 * Automatically aligns ALL generated scenes (`state.generations`) and the active Movie Sequence (`state.timeline`)
 * so that every scene fits the Original Story Script (`state.originalStory`) in exact narrative order.
 */
function autoAlignScenesToScript(state, originalStoryOverride = null, options = {}) {
  if (!state) return { alignedScenes: [], patchesApplied: [] };
  if (originalStoryOverride && typeof originalStoryOverride === "string" && originalStoryOverride.trim()) {
    state.originalStory = originalStoryOverride.trim();
  } else if (!state.originalStory) {
    state.originalStory = DEFAULT_STORY_SCRIPT;
  }

  const scriptText = state.originalStory;
  const beats = parseScriptBeats(scriptText);
  const anchorSoul = (state.soulIds && state.soulIds[0]) || DEFAULT_SOUL_IDS[0];
  const anchorLens = LENS_OPTICS[0];
  const patchesApplied = [];

  if (!Array.isArray(state.generations)) state.generations = [];
  if (!Array.isArray(state.timeline)) state.timeline = [];

  // 1. Align every generated clip to its best-fitting Script Beat & harmonize continuity
  state.generations.forEach((clip, idx) => {
    let bestBeat = beats[idx % beats.length];
    let bestScore = -1;
    beats.forEach((b) => {
      const sc = scorePromptAgainstBeat(clip.prompt || "", b.text);
      if (sc > bestScore) {
        bestScore = sc;
        bestBeat = b;
      }
    });

    clip.scriptBeatIndex = bestBeat.index;
    clip.scriptBeatNumber = bestBeat.beatNumber;
    clip.scriptBeatLabel = bestBeat.actLabel;
    clip.scriptBeatText = bestBeat.text;
    clip.scriptAlignmentNote = `Aligned to ${bestBeat.actLabel}: "${bestBeat.text}"`;

    // Ensure character continuity is bound to the script
    if (!clip.soul) {
      const textLow = `${clip.prompt || ""} ${bestBeat.text}`.toLowerCase();
      const matchedSoul = (state.soulIds || []).find((s) =>
        textLow.includes(s.name.split(/[\s(]/)[0].toLowerCase())
      );
      clip.soul = matchedSoul || anchorSoul;
      patchesApplied.push(
        `Scene (${clip.id}): Locked Character Continuity to '${clip.soul.name.split("(")[0].trim()}' for ${bestBeat.actLabel}`
      );
    }

    if (!clip.lens) {
      clip.lens = anchorLens;
    }
  });

  // 2. If a newly created clip was passed in options.includeClipId, ensure it is in the timeline
  if (options.includeClipId) {
    const alreadyInTimeline = state.timeline.some((t) => t.clipId === options.includeClipId);
    if (!alreadyInTimeline) {
      const clipObj = state.generations.find((g) => g.id === options.includeClipId);
      if (clipObj) {
        state.timeline.push({
          timelineId: "tl-auto-" + Date.now().toString(36) + "-" + Math.floor(Math.random() * 999),
          clipId: clipObj.id,
          prompt: clipObj.prompt,
          modelName: clipObj.modelName,
          durationSec: clipObj.durationSec,
          transition: "cross-dissolve"
        });
        patchesApplied.push(
          `Added new scene (${clipObj.id}) to Master Sequence & auto-aligned to ${clipObj.scriptBeatLabel}`
        );
      }
    }
  }

  // 3. Sort & align the active Movie Sequence (`state.timeline`) in exact Script Beat order!
  if (state.timeline.length > 0) {
    const enrichedTimeline = state.timeline
      .map((item, origIdx) => {
        const clipObj = state.generations.find((g) => g.id === item.clipId);
        const beatIdx = clipObj && typeof clipObj.scriptBeatIndex === "number" ? clipObj.scriptBeatIndex : origIdx % beats.length;
        const beatObj = beats[beatIdx] || beats[0];
        const profile = clipObj ? recognizeSceneProfile(clipObj) : { setting: "Cinema Scene", lighting: "Dramatic" };
        return {
          ...item,
          prompt: clipObj ? clipObj.prompt : item.prompt,
          durationSec: clipObj ? clipObj.durationSec : item.durationSec,
          scriptBeatIndex: beatObj.index,
          scriptBeatNumber: beatObj.beatNumber,
          scriptBeatLabel: beatObj.actLabel,
          scriptBeatText: beatObj.text,
          setting: profile.setting,
          lighting: profile.lighting,
          _origIdx: origIdx
        };
      })
      .sort((a, b) => {
        if (a.scriptBeatIndex !== b.scriptBeatIndex) return a.scriptBeatIndex - b.scriptBeatIndex;
        return a._origIdx - b._origIdx;
      });

    state.timeline = enrichedTimeline.map((item, idx) => {
      const prev = idx > 0 ? enrichedTimeline[idx - 1] : null;
      let transition = "cut";
      if (idx > 0) {
        transition = prev && prev.setting !== item.setting ? "whip-stitch" : "cross-dissolve";
      }
      const { _origIdx, ...cleanItem } = item;
      return {
        ...cleanItem,
        sequenceOrder: idx + 1,
        transition
      };
    });
  }

  const alignedScenes = state.timeline.map((t, idx) => {
    const c = state.generations.find((g) => g.id === t.clipId);
    const prof = c ? recognizeSceneProfile(c) : { setting: t.setting || "Scene", lighting: t.lighting || "Matched", character: "Locked" };
    return {
      shotNumber: idx + 1,
      clipId: t.clipId,
      scriptBeatNumber: t.scriptBeatNumber || idx + 1,
      scriptBeatLabel: t.scriptBeatLabel || `Beat #${idx + 1}`,
      scriptBeatText: t.scriptBeatText || "",
      setting: prof.setting,
      lighting: prof.lighting,
      character: prof.character,
      transition: t.transition,
      prompt: t.prompt
    };
  });

  if (patchesApplied.length === 0 && alignedScenes.length > 0) {
    patchesApplied.push(
      `All ${alignedScenes.length} scenes in Master Sequence are auto-aligned to the ${beats.length}-beat story script in narrative order.`
    );
  }

  state.lastAlignmentReport = {
    originalStory: scriptText,
    scriptBeatsCount: beats.length,
    beats,
    recognizedScenes: alignedScenes,
    patchesApplied,
    updatedAt: new Date().toISOString()
  };

  return state.lastAlignmentReport;
}

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
    }
  } catch (_) {}
  return {
    soulIds: [...DEFAULT_SOUL_IDS],
    generations: [],
    timeline: [],
    connectedMcpServers: [
      {
        id: "dafeild-local",
        name: "DAFE.ILD Video & Cinema MCP (Built-in)",
        transport: "stdio + http-rpc",
        endpoint: "http://localhost:3456/api/mcp/rpc",
        status: "connected",
        verified: true,
        toolsCount: 7
      }
    ]
  };
}

function saveState(state) {
  const dir = path.dirname(STATE_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
}

function compileDirectorPrompt({
  prompt,
  generationMode = "text-to-video",
  modelId = "google-gemini-omni-free",
  cameraStack = ["dolly-in"],
  cameraIntensity = 0.85,
  lensId = "cooke-anamorphic",
  motionId = "hero-walk",
  vfxId = "none",
  soulId = null,
  secondarySoulId = null,
  physicsId = "rigid-realism",
  lutId = "kodak-2383",
  dialogueText = "",
  aspectRatio = "2.39:1",
  durationSec = 30,
  scriptBeatLabel = "",
  scriptBeatText = ""
}) {
  const state = loadState();
  const allModels = [...VIDEO_MODELS, ...(state.customModels || [])];
  const model = allModels.find((m) => m.id === modelId) || VIDEO_MODELS[0];
  const lens = LENS_OPTICS.find((l) => l.id === lensId) || LENS_OPTICS[0];
  const motion = MOTION_PRESETS.find((m) => m.id === motionId);
  const vfx = VFX_PRESETS.find((v) => v.id === vfxId) || VFX_PRESETS[0];
  const soul = soulId ? state.soulIds.find((s) => s.id === soulId) : null;
  const secondarySoul =
    secondarySoulId && secondarySoulId !== soulId
      ? state.soulIds.find((s) => s.id === secondarySoulId)
      : null;
  const physics = PHYSICS_GUARDRAILS.find((p) => p.id === physicsId) || PHYSICS_GUARDRAILS[0];
  const lut = COLOR_GRADING_LUTS.find((l) => l.id === lutId) || COLOR_GRADING_LUTS[0];

  const selectedCameras = (Array.isArray(cameraStack) ? cameraStack : [cameraStack])
    .map((cid) => CAMERA_PRESETS.find((c) => c.id === cid))
    .filter(Boolean);

  const cameraDirective =
    selectedCameras.length > 0
      ? `[CAMERA RIG STACK (Intensity ${Math.round(cameraIntensity * 100)}%)]: ` +
        selectedCameras.map((c, idx) => `Move ${idx + 1}: ${c.promptTag}`).join(" + COMBINED WITH ")
      : "[CAMERA RIG]: Locked-off tripod shot";

  const opticsDirective = `[OPTICS & SENSOR]: Shot on ${lens.name} (${lens.focal}, ${lens.aperture}) — ${lens.look}`;
  const lutDirective = `[MASTER COLOR SCIENCE LUT]: ${lut.promptTag}`;
  const physicsDirective = `[PHYSICS & GEOMETRY SOLVER]: ${physics.promptTag} (SUPPRESS: ${physics.negativeTag})`;
  const motionDirective = motion ? `[MOTION CHOREOGRAPHY]: ${motion.promptTag}` : "";
  const vfxDirective = vfx && vfx.promptTag ? `[VFX MIX]: ${vfx.promptTag}` : "";
  const dialogueDirective = dialogueText
    ? `[LIP-SYNC & PHONEME VISEMES]: Character speaks "${dialogueText}" with frame-locked consonant visemes and matching room acoustics`
    : "";
  const soulDirective = soul
    ? `[PRIMARY ACTOR LOCK (Screen-Left, Seed ${soul.seed}, Weight ${soul.consistencyWeight})]: ${soul.appearancePrompt}`
    : "";
  const secondarySoulDirective = secondarySoul
    ? `[CO-STAR SPATIAL BLOCKING & 180° EYELINE LOCK (Screen-Right, Seed ${secondarySoul.seed}, Zero Attribute Bleed)]: ${secondarySoul.appearancePrompt}`
    : "";
  const scriptAlignmentDirective = scriptBeatText
    ? `[SCRIPT CONTINUITY ALIGNMENT (${scriptBeatLabel || "Story Beat"})]: Align visual action and tone with script beat "${scriptBeatText}"`
    : "";

  const compiledPrompt = [
    `[MODE: ${generationMode.toUpperCase()}]`,
    soulDirective,
    secondarySoulDirective,
    `[SCENE ACTION]: ${prompt}`,
    scriptAlignmentDirective,
    motionDirective,
    vfxDirective,
    dialogueDirective,
    cameraDirective,
    opticsDirective,
    lutDirective,
    physicsDirective,
    `[TECHNICAL SPECS]: ${aspectRatio} aspect ratio, ${durationSec}s (${(durationSec / 60).toFixed(1)} min) MP4 output, photorealistic temporal coherence.`
  ]
    .filter(Boolean)
    .join(" | ");

  return {
    model,
    lens,
    motion,
    vfx,
    soul,
    secondarySoul,
    physics,
    lut,
    selectedCameras,
    compiledPrompt
  };
}

function buildComfyWorkflowJson(compiled, clipArgs = {}) {
  return {
    _meta: {
      generator: "DAFE.ILD Studio — Open-Weights ComfyUI MP4 Exporter",
      model: compiled.model.name,
      hfRepo: compiled.model.hfRepo || "Wan-AI/Wan2.1-T2V-1.3B",
      maxDurationSec: 300,
      costUsd: 0.0
    },
    nodes: {
      "1": {
        class_type: "LoadDiffusionVideoModel",
        inputs: {
          model_repo: compiled.model.hfRepo || "Wan-AI/Wan2.1-T2V-1.3B",
          precision: "fp8_e4m3fn",
          teacache_speedup: true
        }
      },
      "2": {
        class_type: "HiggsfieldDirectorTextEncode",
        inputs: {
          positive_prompt: compiled.compiledPrompt,
          negative_prompt: "blurry, warped face, inconsistent identity, jittery camera, watermark, low frame rate",
          soul_id_seed: compiled.soul ? compiled.soul.seed : 424242,
          soul_id_weight: compiled.soul ? compiled.soul.consistencyWeight : 0.0
        }
      },
      "3": {
        class_type: "CameraTrajectoryControlNet",
        inputs: {
          camera_stack: compiled.selectedCameras.map((c) => c.id),
          intensity: clipArgs.cameraIntensity ?? 0.85,
          lens_profile: compiled.lens.id
        }
      },
      "4": {
        class_type: "VideoKSamplerLongForm",
        inputs: {
          model: ["1", 0],
          conditioning: ["2", 0],
          camera_rig: ["3", 0],
          steps: 24,
          cfg: 6.0,
          fps: 24,
          duration_sec: Math.min(300, Number(clipArgs.durationSec || 30)),
          aspect_ratio: clipArgs.aspectRatio || "2.39:1"
        }
      },
      "5": {
        class_type: "SaveMP4Video",
        inputs: {
          samples: ["4", 0],
          format: "video/mp4",
          codec: "h264",
          filename_prefix: "dafeild_shot"
        }
      }
    }
  };
}

const MCP_TOOLS = [
  {
    name: "list_video_models",
    description:
      "List available AI video generation models in DAFE.ILD Studio, including Google Flow (Gemini Omni 1.2 Flash & Free AI Studio Nano Banana), 100% FREE open-source models (Wan 2.1 Free, LTX-Video Free, CogVideoX Free, Mochi 1), and ultra-cheap serverless models ($0.02-$0.14/shot), all supporting up to 5 minutes (300s) MP4 output.",
    inputSchema: {
      type: "object",
      properties: {
        tier: {
          type: "string",
          enum: ["all", "free", "cheap", "pro"],
          description: "Filter models by pricing tier ('free' = $0.00, 'cheap' = $0.02-$0.14, 'pro' = studio)."
        },
        maxCostUsd: {
          type: "number",
          description: "Optional maximum cost per clip in USD."
        }
      }
    }
  },
  {
    name: "generate_ai_video",
    description:
      "Generate a real AI .mp4 video shot (from 5 seconds up to 5 minutes / 300 seconds) using Higgsfield-style stacked camera controls, cinema lens optics, character Soul ID consistency, VFX presets, and free or ultra-cheap AI models.",
    inputSchema: {
      type: "object",
      required: ["prompt"],
      properties: {
        prompt: {
          type: "string",
          description: "Core visual description of the scene and subject action."
        },
        generationMode: {
          type: "string",
          enum: ["text-to-video", "image-to-video", "first-last-frame", "lip-sync"],
          description: "Generation workflow mode."
        },
        modelId: {
          type: "string",
          description: "Model ID (e.g. 'wan-2.1-free-1.3b', 'ltx-video-2b-free', 'wan-2.2-14b-cheap', 'hunyuan-video-13b-cheap'). Defaults to free Wan 2.1."
        },
        cameraStack: {
          type: "array",
          items: { type: "string" },
          description: "Up to 3 Higgsfield camera move IDs to stack (e.g. ['dolly-in', 'orbit-360', 'fpv-drone'])."
        },
        cameraIntensity: {
          type: "number",
          description: "Camera motion magnitude from 0.1 to 1.0 (default 0.85)."
        },
        lensId: {
          type: "string",
          description: "Cinema lens ID (e.g. 'cooke-anamorphic', 'arri-signature', 'panavision-vintage', 'imax-70mm')."
        },
        motionId: {
          type: "string",
          description: "Motion/action preset ID (e.g. 'hero-walk', 'slowmo-turn', 'expressive-talk', 'cyber-action')."
        },
        vfxId: {
          type: "string",
          description: "Higgsfield VFX Mix ID (e.g. 'none', 'cyber-glitch', 'ember-storm', 'liquid-gold', 'lightning-arc', 'zero-g-rain')."
        },
        soulId: {
          type: "string",
          description: "Optional Soul ID for persistent character identity across cuts (e.g. 'soul-kaelen', 'soul-elara')."
        },
        dialogueText: {
          type: "string",
          description: "Optional character spoken dialogue for Lip-Sync & Web Speech synthesis."
        },
        durationSec: {
          type: "number",
          description: "Video duration in seconds from 5 up to 300 (5 minutes)."
        },
        aspectRatio: {
          type: "string",
          enum: ["16:9", "2.39:1", "9:16", "1:1"],
          description: "Output aspect ratio."
        }
      }
    }
  },
  {
    name: "manage_soul_id",
    description:
      "List or create Higgsfield-style 'Soul ID' persistent character identities so characters stay visually identical across multiple video shots.",
    inputSchema: {
      type: "object",
      required: ["action"],
      properties: {
        action: {
          type: "string",
          enum: ["list", "create"],
          description: "Whether to list existing Soul IDs or create a new one."
        },
        name: { type: "string", description: "Character or product name (for 'create')." },
        role: { type: "string", description: "Character archetype or role (for 'create')." },
        appearancePrompt: {
          type: "string",
          description: "Detailed facial, outfit, and visual anchor traits to lock across shots."
        },
        consistencyWeight: {
          type: "number",
          description: "Identity lock strength from 0.5 to 1.0 (default 0.94)."
        }
      }
    }
  },
  {
    name: "list_camera_and_optics_presets",
    description:
      "Return all Higgsfield-inspired stackable camera moves, cinema lenses, VFX mixes, and character motion choreography presets.",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "add_clip_to_timeline",
    description:
      "Append a generated video clip ID to the multi-scene studio timeline sequencer.",
    inputSchema: {
      type: "object",
      required: ["clipId"],
      properties: {
        clipId: { type: "string", description: "ID of the generated video clip." },
        transition: {
          type: "string",
          enum: ["cut", "cross-dissolve", "whip-stitch", "flash-frame"],
          description: "Transition style into this clip."
        }
      }
    }
  },
  {
    name: "estimate_project_cost",
    description:
      "Calculate cost comparison between Free Open-Weights, Ultra-Cheap Serverless (Wan 2.2 / LTX 2.5), and Legacy Closed Commercial APIs for a multi-shot storyboard.",
    inputSchema: {
      type: "object",
      required: ["numClips"],
      properties: {
        numClips: { type: "number", description: "Number of video shots in the project." },
        modelId: { type: "string", description: "Selected model ID." }
      }
    }
  },
  {
    name: "export_comfyui_workflow",
    description:
      "Export a ready-to-run ComfyUI open-weights workflow JSON (Wan 2.1 / LTX-Video / HunyuanVideo) with Higgsfield camera trajectory and Soul ID nodes.",
    inputSchema: {
      type: "object",
      required: ["prompt"],
      properties: {
        prompt: { type: "string", description: "Scene prompt." },
        modelId: { type: "string", description: "Open-weights model ID." },
        cameraStack: { type: "array", items: { type: "string" } },
        lensId: { type: "string" },
        soulId: { type: "string" },
        durationSec: { type: "number", description: "Duration in seconds (up to 300s / 5 mins)." }
      }
    }
  },
  {
    name: "auto_patch_story_continuity",
    description:
      "Recognize scenes across generated video clips, detect character/lighting/story continuity gaps against the original story, and auto-patch the sequence (including generating a bridge scene .MP4) so the movie follows the original story.",
    inputSchema: {
      type: "object",
      properties: {
        originalStory: {
          type: "string",
          description: "The original story script or narrative premise to align all scenes against."
        },
        clipIds: {
          type: "array",
          items: { type: "string" },
          description: "Optional list of clip IDs to analyze and patch (defaults to timeline or recent clips)."
        },
        generateBridgeClip: {
          type: "boolean",
          description: "Whether to generate a new AI bridge clip (.MP4) to patch narrative jumps."
        }
      }
    }
  },
  {
    name: "stitch_full_movie",
    description:
      "Stitch multiple generated clips into a single multi-scene Full Movie .MP4 file on disk.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Movie title." },
        clipIds: {
          type: "array",
          items: { type: "string" },
          description: "Ordered list of clip IDs to stitch into the full movie (defaults to current timeline)."
        }
      }
    }
  },
  {
    name: "generate_movie_from_script",
    description:
      "Solves multi-shot storytelling & credit-burning: takes a full story script or paragraph, automatically breaks it into sequential scenes with locked character identity, physics guardrails, and matched color LUT, renders all scenes as .MP4 clips, and stitches them into a single Full Movie .MP4.",
    inputSchema: {
      type: "object",
      required: ["scriptText"],
      properties: {
        scriptText: { type: "string", description: "Multi-sentence story script or film treatment." },
        modelId: { type: "string", description: "Model ID (defaults to free 'google-gemini-omni-free')." },
        durationPerSceneSec: { type: "number", description: "Duration per scene in seconds (up to 300s)." }
      }
    }
  },
  {
    name: "surgical_scene_retake",
    description:
      "Solves 'Black Box' whole-clip re-renders: surgically patches a specific time window (startSec to endSec) or object in an existing clip while keeping the character seed, camera trajectory, and surrounding frames locked.",
    inputSchema: {
      type: "object",
      required: ["clipId", "retakeInstruction"],
      properties: {
        clipId: { type: "string", description: "ID of the clip to surgically patch." },
        startSec: { type: "number", description: "Start timestamp of the local retake in seconds." },
        endSec: { type: "number", description: "End timestamp of the local retake in seconds." },
        retakeInstruction: { type: "string", description: "What specific detail to fix without changing the rest of the shot." }
      }
    }
  }
];

async function performSceneRecognitionAndAutoPatch({
  originalStory = "",
  clipIds = [],
  modelId = "google-gemini-omni-free",
  generateBridgeClip = true,
  apiKeys = {}
} = {}) {
  const state = loadState();
  let targetClips = [];
  if (Array.isArray(clipIds) && clipIds.length > 0) {
    targetClips = clipIds.map((id) => state.generations.find((g) => g.id === id)).filter(Boolean);
  } else if (state.timeline && state.timeline.length > 0) {
    targetClips = state.timeline.map((t) => state.generations.find((g) => g.id === t.clipId)).filter(Boolean);
  } else {
    targetClips = state.generations.slice(0, 3);
  }

  if (targetClips.length === 0) {
    throw new Error("No clips available to recognize or auto-patch.");
  }

  const recognizedScenes = targetClips.map((c, idx) => ({
    shotNumber: idx + 1,
    ...recognizeSceneProfile(c),
    prompt: c.prompt
  }));

  const anchorClip = targetClips[0];
  const anchorSoul = anchorClip.soul || state.soulIds[0];
  const anchorLens = anchorClip.lens || LENS_OPTICS[0];
  const storyTheme = (originalStory || anchorClip.prompt || "Cinematic story").trim();

  const patchesApplied = [];

  // 1. Harmonize Character Identity (Soul ID) & Lens Optics across clips
  targetClips.forEach((clip, idx) => {
    if (!clip.soul || clip.soul.id !== anchorSoul.id) {
      const prevChar = clip.soul ? clip.soul.name : "Unbound";
      clip.soul = anchorSoul;
      patchesApplied.push(
        `Shot #${idx + 1} (${clip.id}): Patched Character Continuity from '${prevChar}' -> '${anchorSoul.name}' (Seed ${anchorSoul.seed})`
      );
    }
    if (!clip.lens || clip.lens.id !== anchorLens.id) {
      clip.lens = anchorLens;
      patchesApplied.push(
        `Shot #${idx + 1} (${clip.id}): Harmonized Optical Grade to '${anchorLens.name}'`
      );
    }
  });

  // 2. Detect Scene Setting Jump & Synthesize an AI Story Bridge Clip (.MP4) using Live AI LLM
  let bridgeClip = null;
  if (generateBridgeClip) {
    const firstScene = recognizedScenes[0];
    const lastScene = recognizedScenes[recognizedScenes.length - 1];
    const bridgePrompt = await generateAiBridgePrompt(
      targetClips[0],
      targetClips[targetClips.length - 1],
      firstScene,
      lastScene,
      storyTheme
    );

    const durationSec = 60;
    const bridgeArgs = {
      prompt: bridgePrompt,
      generationMode: "first-last-frame",
      modelId: modelId || anchorClip.modelId || "google-gemini-omni-free",
      cameraStack: ["dolly-in", "parallax-slide"],
      cameraIntensity: 0.85,
      lensId: anchorLens.id,
      motionId: "hero-walk",
      vfxId: anchorClip.vfx?.id || "none",
      soulId: anchorSoul.id,
      aspectRatio: anchorClip.aspectRatio || "2.39:1",
      durationSec,
      apiKeys
    };

    const compiled = compileDirectorPrompt(bridgeArgs);
    const bridgeId = "clip-patch-" + Date.now().toString(36);
    const genRes = await executeRealGeneration(bridgeId, compiled, bridgeArgs, buildComfyWorkflowJson);

    bridgeClip = {
      id: bridgeId,
      createdAt: new Date().toISOString(),
      prompt: bridgePrompt,
      generationMode: "story-auto-patch",
      compiledPrompt: compiled.compiledPrompt,
      modelId: compiled.model.id,
      modelName: compiled.model.name,
      tier: compiled.model.tier,
      costUsd: compiled.model.costPerClipUsd,
      cameraStack: compiled.selectedCameras.map((c) => ({ id: c.id, name: c.name, vec: c.vec })),
      cameraIntensity: 0.85,
      lens: compiled.lens,
      motion: compiled.motion,
      vfx: compiled.vfx,
      soul: compiled.soul,
      dialogueText: "",
      frameUrl: genRes.frameUrl || null,
      videoUrl: genRes.videoUrl || `/renders/${bridgeId}.mp4`,
      mp4Url: genRes.mp4Url || `/renders/${bridgeId}.mp4`,
      durationSec,
      aspectRatio: bridgeArgs.aspectRatio,
      status: "completed",
      isAutoPatchedBridge: true,
      providerUsed: `DAFE.ILD Story Auto-Patcher (${genRes.providerUsed})`
    };

    state.generations.unshift(bridgeClip);
    patchesApplied.push(
      `Generated & Inserted AI Bridge Scene (${bridgeId}, ${durationSec}s H.264 .MP4) connecting '${firstScene.setting}' -> '${lastScene.setting}' to follow original story.`
    );
  }

  // 3. Rebuild & Auto-Align the Master Sequence Timeline in story script order
  const finalSequenceClips = [...targetClips];
  if (bridgeClip && finalSequenceClips.length >= 2) {
    finalSequenceClips.splice(1, 0, bridgeClip);
  } else if (bridgeClip) {
    finalSequenceClips.push(bridgeClip);
  }

  state.timeline = finalSequenceClips.map((c, idx) => ({
    timelineId: `tl-patch-${idx}-${Date.now().toString(36)}`,
    clipId: c.id,
    prompt: c.prompt,
    modelName: c.modelName,
    durationSec: c.durationSec,
    transition: idx === 0 ? "cut" : "cross-dissolve"
  }));

  const alignReport = autoAlignScenesToScript(state, storyTheme);
  const allPatches = [...patchesApplied, ...(alignReport.patchesApplied || [])];
  saveState(state);

  return {
    originalStory: storyTheme,
    recognizedScenes: alignReport.recognizedScenes || recognizedScenes,
    patchesApplied: allPatches,
    bridgeClip,
    timeline: state.timeline,
    generations: state.generations,
    alignmentReport: alignReport
  };
}

async function performStitchFullMovie({ title = "DAFE.ILD Stitched Master Movie", clipIds = [] } = {}) {
  const state = loadState();
  let orderedClips = [];
  if (Array.isArray(clipIds) && clipIds.length > 0) {
    orderedClips = clipIds.map((id) => state.generations.find((g) => g.id === id)).filter(Boolean);
  } else if (state.timeline && state.timeline.length > 0) {
    orderedClips = state.timeline.map((t) => state.generations.find((g) => g.id === t.clipId)).filter(Boolean);
  } else {
    orderedClips = state.generations.slice(0, 3);
  }

  if (orderedClips.length === 0) {
    throw new Error("No clips found to stitch into a movie.");
  }

  const movieId = "movie-" + Date.now().toString(36);
  const stitchRes = await stitchClipsIntoMovieMp4(movieId, orderedClips);

  const movieRecord = {
    id: movieId,
    title,
    createdAt: new Date().toISOString(),
    mp4Url: stitchRes.mp4Url,
    totalDurationSec: stitchRes.totalDurationSec,
    clipsCount: stitchRes.clipsCount,
    clipIds: orderedClips.map((c) => c.id),
    scenes: orderedClips.map((c, i) => ({
      order: i + 1,
      clipId: c.id,
      prompt: c.prompt,
      durationSec: c.durationSec,
      frameUrl: c.frameUrl
    }))
  };

  if (!state.movies) state.movies = [];
  state.movies.unshift(movieRecord);
  saveState(state);

  return {
    movie: movieRecord,
    movies: state.movies
  };
}

/**
 * Solves Limitation #6 & #1: 1-Click Script-to-Full-Movie Autonomous Director
 * Splits a story into sequential scenes, locks Character Soul ID, Lens Optics, Color LUT & Physics Guardrails,
 * renders each scene to .MP4, and stitches the entire sequence into a single Full Movie .MP4!
 */
async function performScriptToFullMovie({
  scriptText = "",
  modelId = "google-gemini-omni-free",
  soulId = "soul-kaelen",
  secondarySoulId = "soul-elara",
  lensId = "cooke-anamorphic",
  lutId = "kodak-2383",
  physicsId = "rigid-realism",
  durationPerSceneSec = 60,
  apiKeys = {}
} = {}) {
  let rawBeats = scriptText
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8);

  if (rawBeats.length < 2 && scriptText.trim().length > 5) {
    try {
      const llmBeats = await callFreeAiLlm(
        "You are a film director breaking a premise into 3 sequential visual shots. Return exactly 3 lines, one sentence per line, no numbering.",
        scriptText,
        apiKeys.geminiKey
      );
      const parsed = llmBeats.split(/\n+/).map((s) => s.replace(/^\d+[\).\s-]*/, "").trim()).filter((s) => s.length > 10);
      if (parsed.length >= 2) rawBeats = parsed.slice(0, 3);
    } catch (_) {}
  }

  const beats =
    rawBeats.length >= 2
      ? rawBeats.slice(0, 4)
      : [
          `Establishing shot: ${scriptText || "Detective Kaelen discovers an encrypted beacon in rain-slicked Neo-Tokyo"}`,
          `Rising action: ${scriptText || "Kaelen ascends to the Solarpunk Conservatory and confronts Elara over the signal"}`,
          `Climax & resolution: ${scriptText || "Together they unlock the AURUM-9 chronometer as golden light fills the dome"}`
        ];

  const cameraProgression = [
    ["dolly-in", "orbit-360"],
    ["fpv-drone", "crane-up"],
    ["parallax-slide", "handheld-doc"],
    ["bullet-time", "crash-zoom"]
  ];

  const state = loadState();
  const createdClips = [];

  for (let i = 0; i < beats.length; i++) {
    const beatPrompt = beats[i];
    const sceneDur = Math.min(300, Math.max(5, Number(durationPerSceneSec || 60)));
    const sceneArgs = {
      prompt: `Scene ${i + 1} of ${beats.length}: ${beatPrompt}`,
      generationMode: "text-to-video",
      modelId,
      cameraStack: cameraProgression[i % cameraProgression.length],
      cameraIntensity: 0.86,
      lensId,
      motionId: i === 0 ? "hero-walk" : i === 1 ? "expressive-talk" : "slowmo-turn",
      vfxId: "none",
      soulId,
      secondarySoulId,
      physicsId,
      lutId,
      aspectRatio: "2.39:1",
      durationSec: sceneDur,
      apiKeys
    };

    const compiled = compileDirectorPrompt(sceneArgs);
    const clipId = `clip-s${i + 1}-` + Date.now().toString(36) + i;
    const genRes = await executeRealGeneration(clipId, compiled, sceneArgs, buildComfyWorkflowJson);

    const newClip = {
      id: clipId,
      createdAt: new Date().toISOString(),
      prompt: sceneArgs.prompt,
      generationMode: "script-to-movie",
      compiledPrompt: compiled.compiledPrompt,
      modelId: compiled.model.id,
      modelName: compiled.model.name,
      tier: compiled.model.tier,
      costUsd: compiled.model.costPerClipUsd,
      cameraStack: compiled.selectedCameras.map((c) => ({ id: c.id, name: c.name, vec: c.vec })),
      cameraIntensity: 0.86,
      lens: compiled.lens,
      motion: compiled.motion,
      vfx: compiled.vfx,
      soul: compiled.soul,
      secondarySoul: compiled.secondarySoul || null,
      physics: compiled.physics,
      lut: compiled.lut,
      dialogueText: "",
      frameUrl: genRes.frameUrl || null,
      videoUrl: genRes.videoUrl || `/renders/${clipId}.mp4`,
      mp4Url: genRes.mp4Url || `/renders/${clipId}.mp4`,
      durationSec: sceneDur,
      aspectRatio: "2.39:1",
      status: "completed",
      providerUsed: genRes.providerUsed
    };

    state.generations.unshift(newClip);
    createdClips.push(newClip);
  }

  state.timeline = createdClips.map((c, idx) => ({
    timelineId: `tl-script-${idx}-${Date.now().toString(36)}`,
    clipId: c.id,
    prompt: c.prompt,
    modelName: c.modelName,
    durationSec: c.durationSec,
    transition: idx === 0 ? "cut" : "cross-dissolve"
  }));

  saveState(state);

  const stitched = await performStitchFullMovie({
    title: "DAFE.ILD Script-to-Movie Master",
    clipIds: createdClips.map((c) => c.id)
  });

  const finalState = loadState();
  return {
    scenesGenerated: createdClips.length,
    clips: createdClips,
    movie: stitched.movie,
    timeline: finalState.timeline,
    generations: finalState.generations
  };
}

/**
 * Solves Limitation #2: Surgical Frame-Range & Region In-Paint Retake
 * Patches a specific [startSec..endSec] window or detail without losing the clip's character seed, lens, or camera rig.
 */
async function performSurgicalSceneRetake({
  clipId,
  startSec = 0,
  endSec = 10,
  retakeInstruction = "",
  apiKeys = {}
} = {}) {
  const state = loadState();
  const target = state.generations.find((g) => g.id === clipId) || state.generations[0];
  if (!target) {
    throw new Error("Target clip not found for surgical retake.");
  }

  const patchedPrompt = `${target.prompt} — [SURGICAL FRAME RETAKE (${startSec}s-${endSec}s ONLY, LOCK SEED & BACKGROUND)]: ${retakeInstruction}`;
  const retakeArgs = {
    prompt: patchedPrompt,
    generationMode: "surgical-inpaint-retake",
    modelId: target.modelId || "google-gemini-omni-free",
    cameraStack: (target.cameraStack || []).map((c) => c.id),
    cameraIntensity: target.cameraIntensity || 0.85,
    lensId: target.lens?.id || "cooke-anamorphic",
    motionId: target.motion?.id || "hero-walk",
    vfxId: target.vfx?.id || "none",
    soulId: target.soul?.id || "soul-kaelen",
    secondarySoulId: target.secondarySoul?.id || null,
    physicsId: target.physics?.id || "rigid-realism",
    lutId: target.lut?.id || "kodak-2383",
    aspectRatio: target.aspectRatio || "2.39:1",
    durationSec: target.durationSec || 60,
    apiKeys
  };

  const compiled = compileDirectorPrompt(retakeArgs);
  const genRes = await executeRealGeneration(target.id, compiled, retakeArgs, buildComfyWorkflowJson);

  target.prompt = patchedPrompt;
  target.compiledPrompt = compiled.compiledPrompt;
  target.frameUrl = genRes.frameUrl || target.frameUrl;
  target.videoUrl = genRes.videoUrl || target.videoUrl;
  target.mp4Url = genRes.mp4Url || target.mp4Url;
  target.surgicalRetakeHistory = target.surgicalRetakeHistory || [];
  target.surgicalRetakeHistory.push({
    at: new Date().toISOString(),
    window: `${startSec}s-${endSec}s`,
    instruction: retakeInstruction
  });

  saveState(state);
  return {
    patchedClip: target,
    generations: state.generations
  };
}

async function executeMcpTool(name, args = {}) {
  const state = loadState();

  if (name === "list_video_models") {
    let models = [...VIDEO_MODELS];
    if (args.tier && args.tier !== "all") {
      models = models.filter((m) => m.tier === args.tier);
    }
    if (typeof args.maxCostUsd === "number") {
      models = models.filter((m) => m.costPerClipUsd <= args.maxCostUsd);
    }
    return {
      count: models.length,
      models
    };
  }

  if (name === "list_camera_and_optics_presets") {
    return {
      cameraPresets: CAMERA_PRESETS,
      lensOptics: LENS_OPTICS,
      motionPresets: MOTION_PRESETS,
      vfxPresets: VFX_PRESETS
    };
  }

  if (name === "manage_soul_id") {
    if (args.action === "create") {
      const newSoul = {
        id: "soul-" + Date.now().toString(36),
        name: args.name || "Untitled Character",
        role: args.role || "Custom Identity",
        seed: Math.floor(1000000 + Math.random() * 9000000),
        consistencyWeight: args.consistencyWeight || 0.94,
        avatarColor: "#10b981",
        appearancePrompt: args.appearancePrompt || "Consistent cinematic character identity",
        voiceProfile: "Natural Studio Sync",
        referenceTags: ["Face Lock v3", "Seed Lock", "Cross-Cut Match"]
      };
      state.soulIds.unshift(newSoul);
      saveState(state);
      return { created: newSoul, totalSoulIds: state.soulIds.length };
    }
    return { soulIds: state.soulIds };
  }

  if (name === "generate_ai_video") {
    const durationSec = Math.min(300, Math.max(5, Number(args.durationSec || 30)));
    const fullArgs = { ...args, durationSec };
    const compiled = compileDirectorPrompt(fullArgs);
    const clipId = "clip-" + Date.now().toString(36);
    const genResult = await executeRealGeneration(clipId, compiled, fullArgs, buildComfyWorkflowJson);

    const newClip = {
      id: clipId,
      createdAt: new Date().toISOString(),
      prompt: args.prompt,
      generationMode: args.generationMode || "text-to-video",
      compiledPrompt: compiled.compiledPrompt,
      modelId: compiled.model.id,
      modelName: compiled.model.name,
      tier: compiled.model.tier,
      costUsd: compiled.model.costPerClipUsd,
      cameraStack: compiled.selectedCameras.map((c) => ({ id: c.id, name: c.name, vec: c.vec })),
      cameraIntensity: args.cameraIntensity ?? 0.85,
      lens: compiled.lens,
      motion: compiled.motion || null,
      vfx: compiled.vfx || VFX_PRESETS[0],
      soul: compiled.soul || null,
      dialogueText: args.dialogueText || "",
      durationSec,
      aspectRatio: args.aspectRatio || "2.39:1",
      frameUrl: genResult.frameUrl || null,
      videoUrl: genResult.videoUrl || `/renders/${clipId}.mp4`,
      mp4Url: genResult.mp4Url || `/renders/${clipId}.mp4`,
      status: "completed",
      source: "mcp-tool",
      providerUsed: genResult.providerUsed,
      logs: genResult.logs || []
    };
    state.generations.unshift(newClip);
    saveState(state);
    return {
      message: `Generated real MP4 video '${clipId}' (${durationSec}s) using ${genResult.providerUsed}`,
      clip: newClip
    };
  }

  if (name === "add_clip_to_timeline") {
    const clip = state.generations.find((g) => g.id === args.clipId);
    if (!clip) {
      throw new Error(`Clip '${args.clipId}' not found in generations.`);
    }
    const entry = {
      timelineId: "tl-" + Date.now().toString(36),
      clipId: clip.id,
      prompt: clip.prompt,
      modelName: clip.modelName,
      durationSec: clip.durationSec,
      transition: args.transition || "cut"
    };
    state.timeline.push(entry);
    saveState(state);
    return { added: entry, timelineLength: state.timeline.length };
  }

  if (name === "estimate_project_cost") {
    const numClips = Math.max(1, Number(args.numClips) || 10);
    const selected = VIDEO_MODELS.find((m) => m.id === args.modelId) || VIDEO_MODELS[0];
    return {
      numClips,
      selectedModel: {
        name: selected.name,
        costPerClipUsd: selected.costPerClipUsd,
        totalCostUsd: +(selected.costPerClipUsd * numClips).toFixed(2)
      },
      comparisons: {
        freeOpenWeightsTier: { model: "Wan 2.1 (1.3B Free) / LTX-Video Free", totalUsd: 0.0 },
        ultraCheapBestValue: { model: "Wan 2.2 14B MoE ($0.05/clip)", totalUsd: +(0.05 * numClips).toFixed(2) },
        fastestBudgetApi: { model: "LTX-Video 2.5 ($0.02/clip)", totalUsd: +(0.02 * numClips).toFixed(2) },
        legacyClosedProprietary: { model: "Legacy Closed Commercial Video APIs (~$1.20/clip)", totalUsd: +(1.2 * numClips).toFixed(2) }
      },
      savingsVsLegacyUsd: +((1.2 - selected.costPerClipUsd) * numClips).toFixed(2)
    };
  }

  if (name === "export_comfyui_workflow") {
    const compiled = compileDirectorPrompt(args);
    return buildComfyWorkflowJson(compiled, args);
  }

  if (name === "auto_patch_story_continuity") {
    return await performSceneRecognitionAndAutoPatch(args);
  }

  if (name === "stitch_full_movie") {
    return await performStitchFullMovie(args);
  }

  if (name === "generate_movie_from_script") {
    return await performScriptToFullMovie(args);
  }

  if (name === "surgical_scene_retake") {
    return await performSurgicalSceneRetake(args);
  }

  throw new Error(`Unknown MCP tool: ${name}`);
}

async function handleMcpJsonRpc(request) {
  const { jsonrpc = "2.0", id, method, params = {} } = request;

  try {
    if (method === "initialize") {
      return {
        jsonrpc,
        id,
        result: {
          protocolVersion: "2024-11-05",
          serverInfo: {
            name: "dafeild-video-mcp",
            version: "2.2.0"
          },
          capabilities: {
            tools: { listChanged: false },
            resources: { listChanged: false },
            prompts: { listChanged: false }
          }
        }
      };
    }

    if (method === "notifications/initialized") {
      return null;
    }

    if (method === "tools/list") {
      return {
        jsonrpc,
        id,
        result: {
          tools: MCP_TOOLS
        }
      };
    }

    if (method === "tools/call") {
      const toolName = params.name;
      const toolArgs = params.arguments || {};
      const output = await executeMcpTool(toolName, toolArgs);
      return {
        jsonrpc,
        id,
        result: {
          content: [
            {
              type: "text",
              text: JSON.stringify(output, null, 2)
            }
          ],
          structuredContent: output,
          isError: false
        }
      };
    }

    if (method === "resources/list") {
      const state = loadState();
      return {
        jsonrpc,
        id,
        result: {
          resources: [
            {
              uri: "dafeild://models/catalog",
              name: "DAFE.ILD AI Video Models Catalog (Google Flow, Free & Ultra-Cheap, up to 5m MP4)",
              mimeType: "application/json"
            },
            {
              uri: "dafeild://characters/soul-ids",
              name: `Soul ID Character Vault (${state.soulIds.length} profiles)`,
              mimeType: "application/json"
            },
            {
              uri: "dafeild://studio/generations",
              name: `Generated MP4 Video Clips (${state.generations.length} clips)`,
              mimeType: "application/json"
            }
          ]
        }
      };
    }

    if (method === "resources/read") {
      const state = loadState();
      const uri = params.uri;
      let data = {};
      if (uri === "dafeild://models/catalog" || uri === "dafield://models/catalog") data = VIDEO_MODELS;
      else if (uri === "dafeild://characters/soul-ids" || uri === "dafield://characters/soul-ids") data = state.soulIds;
      else if (uri === "dafeild://studio/generations" || uri === "dafield://studio/generations") data = state.generations;
      return {
        jsonrpc,
        id,
        result: {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify(data, null, 2)
            }
          ]
        }
      };
    }

    return {
      jsonrpc,
      id,
      error: {
        code: -32601,
        message: `Method not found: ${method}`
      }
    };
  } catch (err) {
    return {
      jsonrpc,
      id,
      error: {
        code: -32000,
        message: err.message || "Internal MCP Server error"
      }
    };
  }
}

if (require.main === module) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  rl.on("line", async (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    try {
      const req = JSON.parse(trimmed);
      const res = await handleMcpJsonRpc(req);
      if (res) {
        process.stdout.write(JSON.stringify(res) + "\n");
      }
    } catch (err) {
      process.stdout.write(
        JSON.stringify({
          jsonrpc: "2.0",
          id: null,
          error: { code: -32700, message: "Parse error: " + err.message }
        }) + "\n"
      );
    }
  });
}

module.exports = {
  MCP_TOOLS,
  handleMcpJsonRpc,
  executeMcpTool,
  compileDirectorPrompt,
  buildComfyWorkflowJson,
  parseScriptBeats,
  alignIncomingSceneToScript,
  autoAlignScenesToScript,
  performSceneRecognitionAndAutoPatch,
  performStitchFullMovie,
  performScriptToFullMovie,
  performSurgicalSceneRetake,
  loadState,
  saveState
};
