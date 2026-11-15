/**
 * DAFE.ILD Studio - Shared Catalog of AI Video Models (including Google Flow / Gemini Omni 1.2 Flash
 * & Free AI Studio Models), Higgsfield Camera Rigs, Cinema Optics, Motion Presets, VFX Mixes, and Soul IDs.
 * Supports Long-Form AI Video Generation up to 5 Minutes (300 seconds).
 */

const VIDEO_MODELS = [
  // ==================== HIGGSFIELD AI CINEMA PLATFORM MODELS ====================
  {
    id: "higgsfield-dop-1.5",
    name: "Higgsfield DoP (Director of Photography) v1.5 — Camera & Soul Rig",
    provider: "Higgsfield AI Cinema Engine / Free Cloud Router",
    platformGroup: "higgsfield",
    tier: "free",
    costPerClipUsd: 0.0,
    speedSec: 9,
    maxResolution: "1920x1080 (1080p CinemaScope)",
    maxDurationSec: 300,
    license: "Higgsfield Studio / Free Community Router",
    vramRequired: "0GB (Cloud GPU / Free Engine)",
    badges: ["HIGGSFIELD FLAGSHIP", "50+ CAMERA RIGS", "SOUL ID v3 LOCK"],
    capabilities: ["text-to-video", "image-to-video", "camera-control", "soul-id", "bullet-time", "snorricam", "fpv-drone", "long-form-5m"],
    qualityScore: 9.9,
    falEndpoint: "https://fal.run/fal-ai/wan-t2v",
    hfRepo: "Higgsfield/DoP-Cinema-v1.5",
    description: "Higgsfield's flagship Director of Photography model. Purpose-built for stacked mechanical camera trajectories (Bullet-Time, SnorriCam, FPV Dive, Crash Zoom, 360° Orbit) and persistent Soul ID character identity lock."
  },
  {
    id: "higgsfield-reelmagic-vfx",
    name: "Higgsfield ReelMagic VFX & Stunt Action Engine",
    provider: "Higgsfield AI VFX Mix / Free Cloud Router",
    platformGroup: "higgsfield",
    tier: "free",
    costPerClipUsd: 0.0,
    speedSec: 10,
    maxResolution: "1920x1080 (1080p Full HD)",
    maxDurationSec: 300,
    license: "Higgsfield ReelMagic / Free Community Router",
    vramRequired: "0GB (Cloud GPU / Free Engine)",
    badges: ["HIGGSFIELD VFX MIX", "LIQUID & PLASMA", "STUNT PHYSICS"],
    capabilities: ["text-to-video", "image-to-video", "vfx-mix", "camera-control", "soul-id", "long-form-5m"],
    qualityScore: 9.7,
    falEndpoint: "https://fal.run/fal-ai/hunyuan-video",
    hfRepo: "Higgsfield/ReelMagic-VFX-1.0",
    description: "Higgsfield's specialized visual-effects and high-energy stunt choreography model for liquid-gold morphs, volumetric embers, plasma arcs, zero-G rain, and explosive action cuts."
  },
  {
    id: "higgsfield-speak-act1",
    name: "Higgsfield Speak & Act-One Expressive Lip-Sync",
    provider: "Higgsfield Audio-Driven Performance Router",
    platformGroup: "higgsfield",
    tier: "cheap",
    costPerClipUsd: 0.03,
    speedSec: 8,
    maxResolution: "1280x720 (720p) / 1080p",
    maxDurationSec: 300,
    license: "Higgsfield Performance API",
    vramRequired: "0GB (Cloud API / Free Fallback)",
    badges: ["HIGGSFIELD LIP-SYNC", "FACIAL ACTING", "VISEME LOCK"],
    capabilities: ["lip-sync", "text-to-video", "image-to-video", "soul-id", "expressive-talk", "long-form-5m"],
    qualityScore: 9.6,
    falEndpoint: "https://fal.run/fal-ai/ltx-video",
    hfRepo: "Higgsfield/Speak-ActOne",
    description: "Higgsfield's expressive character dialogue and facial micro-expression engine with frame-locked phoneme visemes, eye-gaze control, and emotional performance transfer."
  },

  // ====================GOOGLE GEMINI & 100% FREE TIER ($0.00) ====================
  {
    id: "google-gemini-omni-free",
    name: "Google Gemini Omni 1.2 Flash — Cloud Free Tier",
    provider: "Google Cloud Engine / Gemini Interactions API",
    platformGroup: "movie-platform",
    tier: "free",
    costPerClipUsd: 0.0,
    speedSec: 8,
    maxResolution: "1280x720 (720p) / 1080p",
    maxDurationSec: 300,
    license: "Google Cloud Free Tier",
    vramRequired: "0GB (Google Cloud / Free Fallback)",
    badges: ["GOOGLE CLOUD TIER", "UP TO 5 MINS", "SCENE CONTINUITY"],
    capabilities: ["text-to-video", "image-to-video", "ingredients-r2v", "first-last-frame", "scene-extend", "camera-control", "soul-id", "long-form-5m"],
    qualityScore: 9.6,
    geminiModel: "gemini-3.1-flash-lite-image",
    hfRepo: "google/gemini-omni-1.2-flash",
    description: "Google Cloud's multimodal video engine paired with DAFE.ILD's 5-minute MP4 scene stitcher and automatic story continuity."
  },
  {
    id: "skyreels-v1-human",
    name: "SkyReels V1 — Hollywood Human Drama (Open Free)",
    provider: "Skywork AI Open / Free Cinema Router",
    platformGroup: "open-free",
    tier: "free",
    costPerClipUsd: 0.0,
    speedSec: 11,
    maxResolution: "1280x720 (720p Cinema)",
    maxDurationSec: 300,
    license: "Apache 2.0",
    vramRequired: "0GB Cloud Free / 12GB Local",
    badges: ["100% FREE", "HOLLYWOOD ACTING", "MOVIE BLOCKING"],
    capabilities: ["text-to-video", "image-to-video", "soul-id", "camera-control", "long-form-5m"],
    qualityScore: 9.4,
    hfRepo: "Skywork/SkyReels-V1-Hunyuan-T2V",
    description: "Open-source human-centric movie foundation model fine-tuned on ten million Hollywood film shots for realistic actor micro-expressions and multi-actor staging."
  },
  {
    id: "step-video-t2v-30b",
    name: "Step-Video-T2V 30B — Open Foundation Cinema",
    provider: "StepFun Open / Free Inference Router",
    platformGroup: "open-free",
    tier: "free",
    costPerClipUsd: 0.0,
    speedSec: 13,
    maxResolution: "1280x720 (720p)",
    maxDurationSec: 300,
    license: "MIT / Open Weights",
    vramRequired: "0GB Cloud Free",
    badges: ["100% FREE", "30B PARAMETERS", "EPIC SCALE"],
    capabilities: ["text-to-video", "camera-control", "soul-id", "long-form-5m"],
    qualityScore: 9.3,
    hfRepo: "stepfun-ai/stepvideo-t2v",
    description: "Massive 30-billion parameter open-weights video foundation model delivering sweeping cinematic landscapes and high-motion dynamics at $0 cost."
  },
  {
    id: "wan-2.1-free-1.3b",
    name: "Wan 2.1 (1.3B Lite) — Free Community",
    provider: "HuggingFace Free / Pollinations / Local ComfyUI",
    platformGroup: "open-free",
    tier: "free",
    costPerClipUsd: 0.0,
    speedSec: 12,
    maxResolution: "832x480 (480p)",
    maxDurationSec: 300,
    license: "Apache 2.0",
    vramRequired: "8GB (or Cloud Free)",
    badges: ["100% FREE", "UP TO 5 MINS", "OPEN WEIGHTS"],
    capabilities: ["text-to-video", "image-to-video", "camera-control", "soul-id", "vfx-mix", "long-form-5m"],
    qualityScore: 9.1,
    hfRepo: "Wan-AI/Wan2.1-T2V-1.3B",
    description: "Alibaba's compact 1.3B open-weights marvel with long-form scene chaining up to 5 minutes (300s) at $0 cost."
  },
  {
    id: "ltx-video-2b-free",
    name: "LTX-Video 2B Realtime — Free Tier",
    provider: "Lightricks Open / HF Space / Local Bridge",
    platformGroup: "open-free",
    tier: "free",
    costPerClipUsd: 0.0,
    speedSec: 6,
    maxResolution: "768x512",
    maxDurationSec: 300,
    license: "Open Weights",
    vramRequired: "8GB (or Cloud Free)",
    badges: ["100% FREE", "UP TO 5 MINS", "REALTIME PREVIEW"],
    capabilities: ["text-to-video", "image-to-video", "camera-control", "motion-brush", "first-last-frame", "long-form-5m"],
    qualityScore: 8.7,
    hfRepo: "Lightricks/LTX-Video",
    description: "Designed for real-time storyboard generation and rapid 5-minute continuous scene blocking."
  },
  {
    id: "cogvideox-2b-free",
    name: "CogVideoX-2B — Open Free",
    provider: "Zhipu AI Open / Free Inference Router",
    platformGroup: "open-free",
    tier: "free",
    costPerClipUsd: 0.0,
    speedSec: 14,
    maxResolution: "720x480",
    maxDurationSec: 300,
    license: "Apache 2.0",
    vramRequired: "10GB (or Cloud Free)",
    badges: ["100% FREE", "UP TO 5 MINS", "OPEN WEIGHTS"],
    capabilities: ["text-to-video", "prompt-adherence", "soul-id", "long-form-5m"],
    qualityScore: 8.6,
    hfRepo: "THUDM/CogVideoX-2b",
    description: "Strong narrative prompt adherence for multi-minute storytelling without spending a cent."
  },
  {
    id: "mochi-1-preview-free",
    name: "Mochi 1 Preview — Open Source Free",
    provider: "Genmo Open / Community Node",
    platformGroup: "open-free",
    tier: "free",
    costPerClipUsd: 0.0,
    speedSec: 18,
    maxResolution: "848x480",
    maxDurationSec: 300,
    license: "Apache 2.0",
    vramRequired: "16GB (FP8) / Cloud Free",
    badges: ["100% FREE", "UP TO 5 MINS", "30 FPS"],
    capabilities: ["text-to-video", "camera-control", "motion-presets", "long-form-5m"],
    qualityScore: 8.8,
    hfRepo: "genmo/mochi-1-preview",
    description: "Asymmetric Diffusion Transformer (AsymmDiT) with natural 30fps human motion and 5-minute sequence chaining."
  },

  // ==================== MAJOR MOVIE PLATFORMS & ULTRA-CHEAP TIER ====================
  {
    id: "google-gemini-omni-1.2-flash",
    name: "Google Flow / Veo 3.1 (Gemini Omni 1.2 Flash 1080p + Audio)",
    provider: "Google Gemini API (v1beta Interactions)",
    platformGroup: "movie-platform",
    tier: "cheap",
    costPerClipUsd: 0.04,
    speedSec: 14,
    maxResolution: "1920x1080 (1080p Full HD)",
    maxDurationSec: 300,
    license: "Google Gemini API",
    vramRequired: "Google Cloud TPU",
    badges: ["GOOGLE FLOW / VEO", "NATIVE AUDIO", "5 MIN EXTEND"],
    capabilities: ["text-to-video", "image-to-video", "ingredients-r2v", "first-last-frame", "scene-extend", "native-audio", "camera-control", "soul-id", "long-form-5m"],
    qualityScore: 9.9,
    geminiModel: "gemini-omni-1.2-flash",
    hfRepo: "google/gemini-omni-1.2-flash",
    description: "Google's flagship multimodal video & synchronized sound generator (powers Google Flow & Veo 3.1). Supports Text-to-Video, Reference Ingredients, First/Last Frame, and 5-minute video extension."
  },
  {
    id: "google-veo-3-pro",
    name: "Google Veo 3.0 Cinema + Native Audio (Paid Pro)",
    provider: "Google Cloud / Fal.ai Veo 3 Router",
    platformGroup: "movie-platform",
    tier: "pro",
    costPerClipUsd: 0.40,
    speedSec: 18,
    maxResolution: "1920x1080 (1080p Cinema + Stereo Audio)",
    maxDurationSec: 300,
    license: "Google Veo 3 Commercial API",
    vramRequired: "Cloud TPU",
    badges: ["GOOGLE VEO 3", "TOP-TIER PAID", "NATIVE AUDIO"],
    capabilities: ["text-to-video", "image-to-video", "native-audio", "camera-control", "soul-id", "long-form-5m"],
    qualityScore: 10.0,
    geminiModel: "veo-3.0-generate-preview",
    falEndpoint: "https://fal.run/fal-ai/veo3",
    hfRepo: "google/veo-3.0",
    description: "Google DeepMind's flagship Veo 3 paid cinema model with photorealistic physics, dialogue, and synchronized sound effects."
  },
  {
    id: "kling-2.1-master",
    name: "Kling 2.1 Master Cinema (Top-Tier Paid)",
    provider: "Kuaishou Kling / Fal.ai Serverless",
    platformGroup: "movie-platform",
    tier: "pro",
    costPerClipUsd: 0.28,
    speedSec: 16,
    maxResolution: "1920x1080 (1080p 30fps Master)",
    maxDurationSec: 300,
    license: "Kling 2.1 Commercial API",
    vramRequired: "Cloud GPU",
    badges: ["KLING 2.1 MASTER", "TOP-TIER PAID", "FLUID ACTION"],
    capabilities: ["text-to-video", "image-to-video", "camera-control", "soul-id", "first-last-frame", "long-form-5m"],
    qualityScore: 9.9,
    falEndpoint: "https://fal.run/fal-ai/kling-video/v2.1/master/text-to-video",
    hfRepo: "Kuaishou/Kling-2.1-Master",
    description: "Kuaishou's top-tier Kling 2.1 Master model with unmatched martial arts, facial acting, and complex camera choreography."
  },
  {
    id: "kling-2.0-master",
    name: "Kling 2.0 Master Cinema (Kuaishou Movie Platform)",
    provider: "Kling AI / Fal.ai Serverless Router",
    platformGroup: "movie-platform",
    tier: "pro",
    costPerClipUsd: 0.14,
    speedSec: 18,
    maxResolution: "1920x1080 (1080p 30fps Cinema)",
    maxDurationSec: 300,
    license: "Kling Cinema API / Free Fallback",
    vramRequired: "Cloud GPU",
    badges: ["KLING 2.0 MASTER", "MULTI-ELEMENT LOCK", "MARTIAL & DRAMA"],
    capabilities: ["text-to-video", "image-to-video", "camera-control", "soul-id", "first-last-frame", "motion-brush", "long-form-5m"],
    qualityScore: 9.9,
    falEndpoint: "https://fal.run/fal-ai/kling-video/v1.6/pro/text-to-video",
    hfRepo: "Kuaishou/Kling-2.0-Master",
    description: "Kling 2.0 Master from Kuaishou's movie platform. Industry-leading complex human motion, multi-character interaction, 6-axis camera trajectory control, and 1080p temporal coherence."
  },
  {
    id: "runway-gen4-turbo",
    name: "Runway Gen-4 Turbo + Director Mode",
    provider: "RunwayML Movie Platform / Cloud Router",
    platformGroup: "movie-platform",
    tier: "pro",
    costPerClipUsd: 0.15,
    speedSec: 12,
    maxResolution: "1920x1080 (1080p Anamorphic)",
    maxDurationSec: 300,
    license: "Runway Gen-4 / Free Fallback",
    vramRequired: "Cloud GPU",
    badges: ["RUNWAY GEN-4", "WORLD CONSISTENCY", "MULTI-MOTION BRUSH"],
    capabilities: ["text-to-video", "image-to-video", "camera-control", "soul-id", "motion-brush", "first-last-frame", "long-form-5m"],
    qualityScore: 9.8,
    runwayModel: "gen4_turbo",
    falEndpoint: "https://fal.run/fal-ai/runway-gen3/turbo/image-to-video",
    hfRepo: "RunwayML/Gen-4-Turbo",
    description: "Runway's Gen-4 Turbo cinema engine with persistent world geometry, Multi-Motion Brush trajectory control, and consistent character styling across any camera angle."
  },
  {
    id: "openai-sora-2-pro",
    name: "OpenAI Sora Turbo — Storyboard & Recut Pro",
    provider: "OpenAI Sora Cinema Router",
    platformGroup: "movie-platform",
    tier: "pro",
    costPerClipUsd: 0.20,
    speedSec: 16,
    maxResolution: "1920x1080 (1080p Widescreen)",
    maxDurationSec: 300,
    license: "OpenAI Sora / Free Fallback",
    vramRequired: "Cloud GPU",
    badges: ["OPENAI SORA", "STORYBOARD RECUT", "3D WORLD PHYSICS"],
    capabilities: ["text-to-video", "image-to-video", "first-last-frame", "camera-control", "soul-id", "long-form-5m"],
    qualityScore: 9.8,
    openaiModel: "sora-2",
    falEndpoint: "https://fal.run/fal-ai/sora-2/text-to-video",
    hfRepo: "OpenAI/Sora-Turbo",
    description: "OpenAI Sora storyboard engine designed for multi-shot timeline recuts, seamless scene blending, and long-horizon 3D world permanence."
  },
  {
    id: "luma-ray-2-dream-machine",
    name: "Luma Ray 2 — Dream Machine HDR Cinema",
    provider: "Luma Labs / Fal.ai Serverless",
    platformGroup: "movie-platform",
    tier: "cheap",
    costPerClipUsd: 0.08,
    speedSec: 10,
    maxResolution: "1920x1080 (1080p HDR)",
    maxDurationSec: 300,
    license: "Luma Ray 2 / Free Fallback",
    vramRequired: "Cloud GPU",
    badges: ["LUMA RAY 2", "START/END KEYFRAME", "NATURAL PHYSICS"],
    capabilities: ["text-to-video", "image-to-video", "first-last-frame", "camera-control", "soul-id", "long-form-5m"],
    qualityScore: 9.7,
    falEndpoint: "https://fal.run/fal-ai/luma-dream-machine/ray-2",
    hfRepo: "LumaLabs/Ray-2",
    description: "Luma Labs' next-generation Ray 2 architecture with ultra-fast keyframe-to-keyframe transitions, natural fluid/cloth physics, and cinematic anamorphic lighting."
  },
  {
    id: "hailuo-minimax-director",
    name: "Hailuo MiniMax T2V-01-Director (Camera Command Model)",
    provider: "MiniMax Hailuo Video / Fal.ai",
    platformGroup: "movie-platform",
    tier: "cheap",
    costPerClipUsd: 0.07,
    speedSec: 13,
    maxResolution: "1280x720 (720p 25fps)",
    maxDurationSec: 300,
    license: "MiniMax Hailuo / Free Fallback",
    vramRequired: "Cloud GPU",
    badges: ["HAILUO DIRECTOR", "CAMERA BRACKETS", "CINEMA DRAMA"],
    capabilities: ["text-to-video", "image-to-video", "camera-control", "soul-id", "long-form-5m"],
    qualityScore: 9.6,
    falEndpoint: "https://fal.run/fal-ai/minimax/video-01-director",
    hfRepo: "MiniMax/T2V-01-Director",
    description: "Hailuo MiniMax's dedicated Director model trained for explicit camera movement combinations ([Push in + Orbit], [Pan left + Tilt up]) and dramatic film lighting."
  },
  {
    id: "pika-2.2-cinema",
    name: "Pika 2.2 Cinema + Pikaframes & Scene Ingredients",
    provider: "Pika Labs / Fal.ai Router",
    platformGroup: "movie-platform",
    tier: "cheap",
    costPerClipUsd: 0.06,
    speedSec: 11,
    maxResolution: "1920x1080 (1080p Full HD)",
    maxDurationSec: 300,
    license: "Pika 2.2 / Free Fallback",
    vramRequired: "Cloud GPU",
    badges: ["PIKA 2.2 1080P", "PIKAFRAMES", "SCENE INGREDIENTS"],
    capabilities: ["text-to-video", "image-to-video", "first-last-frame", "vfx-mix", "soul-id", "long-form-5m"],
    qualityScore: 9.5,
    falEndpoint: "https://fal.run/fal-ai/pika/v2.2/text-to-video",
    hfRepo: "PikaLabs/Pika-2.2",
    description: "Pika 2.2 with 1080p Pikaframes keyframe transitions, Scene Ingredients subject injection, and surreal VFX transformations."
  },
  {
    id: "wan-2.2-14b-cheap",
    name: "Wan 2.2 (14B MoE TeaCache)",
    provider: "WaveSpeedAI / Fal.ai / Segmind",
    platformGroup: "open-free",
    tier: "cheap",
    costPerClipUsd: 0.05,
    speedSec: 15,
    maxResolution: "1280x720 (720p) / 1080p",
    maxDurationSec: 300,
    license: "Apache 2.0",
    vramRequired: "Serverless API (24GB FP8)",
    badges: ["#1 VALUE KING", "$0.05 / SHOT", "5 MIN LONG-FORM"],
    capabilities: ["text-to-video", "image-to-video", "camera-control", "soul-id", "motion-brush", "lip-sync", "first-last-frame", "vfx-mix", "long-form-5m"],
    qualityScore: 9.7,
    falEndpoint: "https://fal.run/fal-ai/wan-t2v",
    hfRepo: "Wan-AI/Wan2.1-T2V-14B",
    description: "14B parameter Mixture-of-Experts accelerated with TeaCache. Supports full 5-minute (300s) MP4 film generation."
  },
  {
    id: "ltx-2.5-audio-cheap",
    name: "LTX-Video 2.5 Turbo + Native Audio",
    provider: "Fal.ai / Replicate Serverless",
    platformGroup: "open-free",
    tier: "cheap",
    costPerClipUsd: 0.02,
    speedSec: 4,
    maxResolution: "1280x720 (720p)",
    maxDurationSec: 300,
    license: "Open Weights",
    vramRequired: "Serverless API",
    badges: ["CHEAPEST API ($0.02)", "5 MIN CAPABLE", "AUDIO SYNC"],
    capabilities: ["text-to-video", "image-to-video", "camera-control", "audio-sync", "first-last-frame", "long-form-5m"],
    qualityScore: 9.0,
    falEndpoint: "https://fal.run/fal-ai/ltx-video",
    hfRepo: "Lightricks/LTX-Video",
    description: "Ultra-fast inference with synchronized ambient audio and continuous scene extension up to 5 minutes."
  },
  {
    id: "hunyuan-video-13b-cheap",
    name: "HunyuanVideo 13B FP8 Cinema",
    provider: "Segmind / Fal.ai / RunPod Serverless",
    platformGroup: "open-free",
    tier: "cheap",
    costPerClipUsd: 0.14,
    speedSec: 22,
    maxResolution: "1280x720 (720p HD)",
    maxDurationSec: 300,
    license: "Apache 2.0",
    vramRequired: "Serverless API",
    badges: ["HOLLYWOOD REALISM", "$0.14 / SHOT", "5 MIN CINEMA"],
    capabilities: ["text-to-video", "image-to-video", "camera-control", "soul-id", "cinema-optics", "vfx-mix", "long-form-5m"],
    qualityScore: 9.6,
    falEndpoint: "https://fal.run/fal-ai/hunyuan-video",
    hfRepo: "tencent/HunyuanVideo",
    description: "Tencent's 13B powerhouse. Unmatched cinematic lighting, skin textures, lens flare physics, and 5-minute MP4 output."
  },
  {
    id: "cogvideox-5b-i2v-cheap",
    name: "CogVideoX-5B Image-to-Video",
    provider: "Replicate / WaveSpeedAI",
    platformGroup: "open-free",
    tier: "cheap",
    costPerClipUsd: 0.06,
    speedSec: 16,
    maxResolution: "1360x768",
    maxDurationSec: 300,
    license: "Apache 2.0",
    vramRequired: "Serverless API",
    badges: ["$0.06 / SHOT", "CHARACTER LOCK", "5 MIN I2V"],
    capabilities: ["image-to-video", "soul-id", "camera-control", "first-last-frame", "long-form-5m"],
    qualityScore: 9.2,
    falEndpoint: "https://fal.run/fal-ai/cogvideox-5b",
    hfRepo: "THUDM/CogVideoX-5b-I2V",
    description: "Ideal for animating Soul ID character keyframes across 5-minute long-form sequences."
  },
  {
    id: "seedance-1.0-pro",
    name: "ByteDance Seedance 1.0 & OmniHuman Motion Pro",
    provider: "ByteDance Cinema Router / Fal.ai",
    platformGroup: "movie-platform",
    tier: "pro",
    costPerClipUsd: 0.28,
    speedSec: 25,
    maxResolution: "1920x1080 (1080p Full HD)",
    maxDurationSec: 300,
    license: "Commercial API",
    vramRequired: "Cloud API",
    badges: ["BYTEDANCE SEEDANCE", "OMNIHUMAN", "GESTURE LOCK"],
    capabilities: ["text-to-video", "image-to-video", "camera-control", "soul-id", "motion-brush", "lip-sync", "vfx-mix", "long-form-5m"],
    qualityScore: 9.8,
    falEndpoint: "https://fal.run/fal-ai/wan-t2v",
    hfRepo: "ByteDance/Seedance-1.0",
    description: "Full-body choreography, OmniHuman expressive hand gestures, and 5-minute (300s) 1080p MP4 master rendering."
  }
];

const CAMERA_PRESETS = [
  { id: "dolly-in", name: "Dolly In", category: "Depth", icon: "↗", vec: { x: 0, y: 0, z: 1.4, rot: 0 }, promptTag: "smooth mechanical camera dolly-in push toward subject, shallow depth of field shift" },
  { id: "dolly-out", name: "Dolly Out", category: "Depth", icon: "↙", vec: { x: 0, y: 0, z: -1.4, rot: 0 }, promptTag: "cinematic dolly-out pull back revealing wide environment around subject" },
  { id: "fpv-drone", name: "FPV Drone", category: "Dynamic", icon: "⋙", vec: { x: 0.4, y: -0.8, z: 2.2, rot: 12 }, promptTag: "high-speed FPV drone dive sweeping through scene with banking roll and dynamic motion blur" },
  { id: "orbit-360", name: "360° Orbit", category: "Radial", icon: "↻", vec: { x: 1.5, y: 0.1, z: 0.3, rot: 0 }, promptTag: "smooth 360-degree circular parallax orbit around the central character" },
  { id: "crane-up", name: "Crane Rise", category: "Vertical", icon: "↑", vec: { x: 0, y: 1.5, z: -0.4, rot: -8 }, promptTag: "sweeping crane jib rising vertically upward while tilting down on the hero" },
  { id: "whip-pan", name: "Whip Pan", category: "Dynamic", icon: "⇄", vec: { x: 2.4, y: 0, z: 0, rot: 3 }, promptTag: "fast kinetic lateral whip-pan with directional motion streak settling sharply on subject" },
  { id: "dutch-roll", name: "Dutch Roll", category: "Rotation", icon: "⟳", vec: { x: 0.1, y: 0, z: 0.4, rot: 25 }, promptTag: "dramatic Z-axis Dutch angle barrel roll creating psychological tension" },
  { id: "handheld-doc", name: "Handheld", category: "Organic", icon: "≈", vec: { x: 0.25, y: 0.25, z: 0.2, rot: 2 }, promptTag: "organic Easyrig handheld camera breathing and subtle micro-shake for gritty realism" },
  { id: "bullet-time", name: "Bullet-Time", category: "Radial", icon: "◎", vec: { x: 1.8, y: 0.2, z: 0.5, rot: -5 }, promptTag: "frozen time-slice bullet-time camera arc rotating rapidly around suspended airborne particles" },
  { id: "snorricam", name: "SnorriCam", category: "Specialty", icon: "⊕", vec: { x: 0, y: 0, z: 0.1, rot: 4 }, promptTag: "chest-mounted SnorriCam locked rigidly onto actor's face while background rushes past wildly" },
  { id: "crash-zoom", name: "Crash Zoom", category: "Depth", icon: "⌖", vec: { x: 0, y: 0, z: 2.8, rot: 0 }, promptTag: "snap telephoto crash-zoom punching directly into extreme close-up on eyes" },
  { id: "parallax-slide", name: "Truck Left", category: "Lateral", icon: "←", vec: { x: -1.3, y: 0, z: 0, rot: 0 }, promptTag: "smooth lateral dolly-track trucking shot with foreground elements passing in rich parallax" }
];

const LENS_OPTICS = [
  { id: "cooke-anamorphic", name: "Cooke Anamorphic/i 2x (40mm)", focal: "40mm", aperture: "T2.3", look: "Oval bokeh, horizontal cyan lens flare, warm skin tones, 2.39:1 widescreen cinema look" },
  { id: "arri-signature", name: "ARRI Alexa 65 + Prime DNA (50mm)", focal: "50mm", aperture: "T1.8", look: "Large-format razor sharpness with ultra-creamy falloff and natural dynamic range" },
  { id: "panavision-vintage", name: "Panavision C-Series 1970s (35mm)", focal: "35mm", aperture: "T2.0", look: "Halation around highlights, vintage organic film grain, subtle edge aberration" },
  { id: "imax-70mm", name: "IMAX 15/70mm Hasselblad (28mm)", focal: "28mm", aperture: "T2.8", look: "Expansive towering scale, zero distortion, edge-to-edge visceral clarity" },
  { id: "bolex-16mm", name: "Bolex 16mm Kodak Vision3 500T", focal: "24mm", aperture: "f/1.4", look: "Textured 16mm celluloid grain, nostalgic tungsten warmth, indie A24 aesthetic" },
  { id: "laowa-probe", name: "Laowa 24mm Macro Probe Lens", focal: "24mm", aperture: "f/14", look: "Extreme bug-eye wide macro perspective gliding millimeters through miniature details" }
];

const MOTION_PRESETS = [
  { id: "hero-walk", name: "Confident Hero Stride", category: "Locomotion", promptTag: "character walking forward with purposeful cinematic stride, coat/fabric billowing naturally in wind" },
  { id: "slowmo-turn", name: "120fps Over-Shoulder Turn", category: "Dramatic", promptTag: "120fps slow-motion over-the-shoulder head turn with hair and dust particles catching rim light" },
  { id: "expressive-talk", name: "Expressive Dialogue & Lip-Sync", category: "Performance", promptTag: "naturalistic facial micro-expressions, synchronized lip movement, and expressive hand gestures" },
  { id: "cyber-action", name: "Kinetic Parkour / Dodge", category: "Action", promptTag: "acrobatic dodge and fluid martial movement with sparks and secondary cloth physics" },
  { id: "product-float", name: "Zero-G Product Hero Reveal", category: "Commercial", promptTag: "weightless zero-gravity rotation of hero object with droplets and volumetric light beams orbiting" },
  { id: "emotional-gaze", name: "Subtle Micro-Expression Shift", category: "Performance", promptTag: "intimate close-up breathing, subtle eye dilation, emotional shift from stoic to awe" }
];

const VFX_PRESETS = [
  { id: "none", name: "Natural Scene (No VFX)", icon: "—", promptTag: "" },
  { id: "cyber-glitch", name: "Anamorphic Glitch", icon: "◈", promptTag: "chromatic aberration pulse, holographic scanlines, digital voxel disintegration trails" },
  { id: "ember-storm", name: "Volumetric Embers", icon: "▴", promptTag: "swirling volumetric fire embers, heat haze distortion, glowing orange cinders rising in slow motion" },
  { id: "liquid-gold", name: "Liquid Gold Morph", icon: "◉", promptTag: "reflective liquid gold and ferrofluid tendrils morphing weightlessly around subject" },
  { id: "lightning-arc", name: "Plasma Arcs", icon: "⚡", promptTag: "crackling blue high-voltage plasma arcs branching across subject with interactive rim illumination" },
  { id: "zero-g-rain", name: "Suspended Rain", icon: "⋮", promptTag: "thousands of crystal-clear raindrops suspended mid-air refracting neon city lights" }
];

const DEFAULT_SOUL_IDS = [
  {
    id: "soul-kaelen",
    name: "Kaelen Vance (Cyber-Noir Detective)",
    role: "Lead Protagonist",
    seed: 8849201,
    consistencyWeight: 0.92,
    avatarColor: "#00f0ff",
    appearancePrompt: "Kaelen Vance, 32-year-old East Asian man with sharp jawline, silver-streaked undercut hair, subtle cybernetic ocular scar over left eyebrow, wearing weathered charcoal trenchcoat with amber neon collar piping",
    voiceProfile: "Deep Baritone / Noir Narration",
    referenceTags: ["Face Lock v3", "Outfit Lock", "Iris Detail"]
  },
  {
    id: "soul-elara",
    name: "Elara Solis (Solarpunk Architect)",
    role: "Sci-Fi Explorer",
    seed: 4410928,
    consistencyWeight: 0.95,
    avatarColor: "#f59e0b",
    appearancePrompt: "Elara Solis, 27-year-old Mediterranean woman with warm olive skin, braided copper hair, freckles, expressive green eyes, wearing iridescent white linen-kevlar expedition suit with brass botanical clasps",
    voiceProfile: "Warm Alto / Cinematic",
    referenceTags: ["Face Lock v3", "Hair Physics Lock", "Lighting Match"]
  },
  {
    id: "soul-aurum",
    name: "AURUM-9 (Chrono Luxury Watch)",
    role: "Commercial Product ID",
    seed: 1928374,
    consistencyWeight: 0.98,
    avatarColor: "#a855f7",
    appearancePrompt: "AURUM-9 bespoke skeleton tourbillon wristwatch, brushed rose-gold octagonal bezel, exposed sapphire crystal gears glowing with faint blue tritium, matte obsidian alligator strap",
    voiceProfile: "Precision Foley Ticking",
    referenceTags: ["Product Geometry Lock", "Specular Metal Lock"]
  }
];

/**
 * Solves Limitation #3: Physics Violations, Morphing Objects & Occlusion Hallucinations
 */
const PHYSICS_GUARDRAILS = [
  {
    id: "rigid-realism",
    name: "Rigid-Body & Object Permanence Lock (Default)",
    promptTag: "strict Newtonian rigid-body physics, grounded foot contact with realistic weight distribution, persistent object geometry across occlusion, anatomically accurate 5-finger hands",
    negativeTag: "floating feet, morphing props, objects phasing through hands, extra fingers, disappearing background objects, liquid cloth warping"
  },
  {
    id: "fluid-aerodynamics",
    name: "Fluid & Cloth Aerodynamics Solver",
    promptTag: "physically conserved fluid viscosity, realistic rain splash collision and fabric wind drag inertia, consistent momentum",
    negativeTag: "upward falling water, frozen unnatural cloth, inconsistent wind direction"
  },
  {
    id: "architectural-parallax",
    name: "3D Spatial & Parallax Geometry Lock",
    promptTag: "Euclidean 3D perspective consistency, locked architectural vanishing points, realistic depth-of-field z-buffer occlusion",
    negativeTag: "warping buildings, shifting walls, impossible geometry, background melting"
  },
  {
    id: "zero-g-orbital",
    name: "Zero-G / Microgravity Physics",
    promptTag: "controlled orbital microgravity inertia, conservation of angular momentum, realistic specular reflections",
    negativeTag: "sudden gravity drops, jittery rotation"
  }
];

/**
 * Solves Limitation #4: Color Science & Relighting Drift Across Multi-Shot Cuts
 */
const COLOR_GRADING_LUTS = [
  {
    id: "kodak-2383",
    name: "Kodak Vision3 2383 Print LUT",
    cssFilter: "contrast(1.08) saturate(1.06)",
    tintColor: "rgba(245, 158, 11, 0.05)",
    promptTag: "Kodak Vision3 500T 2383 theatrical film print LUT, rich toe blacks, rolled-off highlight latitude, matched 35mm fine grain"
  },
  {
    id: "cyber-teal-amber",
    name: "Teal & Amber Noir Master Grade",
    cssFilter: "contrast(1.14) saturate(1.18)",
    tintColor: "rgba(6, 182, 212, 0.08)",
    promptTag: "anamorphic cyan-teal shadow split-toning with warm amber key highlights, unified neo-noir color science"
  },
  {
    id: "arri-logc3",
    name: "ARRI Alexa LogC3 Neutral Cinema",
    cssFilter: "contrast(1.02) saturate(0.96)",
    tintColor: "rgba(255, 255, 255, 0.02)",
    promptTag: "ARRI Alexa 65 Rec.709 natural skin-tone color science, 14-stop dynamic range, soft shadow falloff"
  },
  {
    id: "bleach-bypass",
    name: "A24 Gritty Bleach Bypass",
    cssFilter: "contrast(1.22) saturate(0.68)",
    tintColor: "rgba(148, 163, 184, 0.09)",
    promptTag: "silver-retention bleach bypass film grade, desaturated steely midtones, high-contrast metallic speculars"
  },
  {
    id: "solarpunk-gold",
    name: "Golden Hour Warmth LUT",
    cssFilter: "contrast(1.06) saturate(1.15) sepia(0.08)",
    tintColor: "rgba(251, 191, 36, 0.08)",
    promptTag: "warm golden-hour 5600K daylight grade, luminous volumetric halation, cohesive warm shadows"
  }
];

/**
 * Solves Limitation #5: Silent Video Generation -> Procedural Foley & Ambient Soundscapes
 */
const AUDIO_SOUNDSCAPES = [
  { id: "rain-neon", name: "Cyber Rain + Distant Synth Drone", baseFreq: 110, type: "rain" },
  { id: "solar-wind", name: "High-Altitude Wind + Harmonic Pad", baseFreq: 220, type: "wind" },
  { id: "horology-tick", name: "Mechanical Tourbillon Foley + Sub", baseFreq: 165, type: "clock" },
  { id: "desert-sub", name: "Turbine Rumble + Braaam Tension", baseFreq: 75, type: "rumble" },
  { id: "none", name: "Mute Ambient Soundscape", baseFreq: 0, type: "none" }
];

module.exports = {
  VIDEO_MODELS,
  CAMERA_PRESETS,
  LENS_OPTICS,
  MOTION_PRESETS,
  VFX_PRESETS,
  DEFAULT_SOUL_IDS,
  PHYSICS_GUARDRAILS,
  COLOR_GRADING_LUTS,
  AUDIO_SOUNDSCAPES
};
