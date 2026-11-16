/**
 * Dafeild Studio — Master Application Engine
 * Google Flow & Free AI Video Generation, 2.5D Higgsfield Camera Motion Synthesizer,
 * Native 5-Minute (.MP4) Video Disk Persistence, Soul ID Vault & Live MCP Inspector
 */

const state = {
  models: [],
  cameraPresets: [],
  lensOptics: [],
  motionPresets: [],
  vfxPresets: [],
  physicsGuardrails: [],
  colorGradingLuts: [],
  audioSoundscapes: [],
  soulIds: [],
  generations: [],
  timeline: [],
  mcpTools: [],
  connectedMcpServers: [],
  mcpServerConfigPath: "",

  // Director Controls
  selectedModelId: "google-gemini-omni-free",
  generationMode: "text-to-video",
  freeOnly: false,
  cameraStack: ["dolly-in", "orbit-360"],
  cameraIntensity: 0.85,
  selectedLensId: "cooke-anamorphic",
  selectedMotionId: "hero-walk",
  selectedVfxId: "cyber-glitch",
  selectedSoulId: "soul-kaelen",
  selectedSecondarySoulId: "",
  selectedPhysicsId: "rigid-realism",
  selectedLutId: "kodak-2383",
  selectedSoundscapeId: "rain-neon",
  isMuted: false,
  dialogueText: "The signal originates beneath Sector Nine.",
  aspectRatio: "2.39:1",
  durationSec: 300,

  // Viewport & Real Asset Cache
  showGrid: true,
  isPlaying: true,
  playheadTime: 0,
  motionBrushEnabled: false,
  isDrawingBrush: false,
  motionTrajectory: [],
  keyframeImage: null,
  keyframeDataUrl: null,
  isSpeakingLipSync: false,

  // Cache of loaded Image / Video DOM elements by clip.id
  loadedImages: {},
  loadedVideos: {},

  // Current Clip
  activeClip: null,
  apiKeys: JSON.parse(localStorage.getItem("dafeild_api_keys") || "{}")
};

function updateMasterSoundUI() {
  const btn = document.getElementById("masterSoundToggleBtn");
  const icon = document.getElementById("masterSoundIcon");
  const label = document.getElementById("masterSoundLabel");
  if (!btn) return;
  if (state.isMuted) {
    btn.classList.remove("active");
    if (icon) icon.textContent = "🔇";
    if (label) label.textContent = "Muted";
  } else {
    btn.classList.add("active");
    if (icon) icon.textContent = "🔊";
    if (label) label.textContent = "Sound ON";
  }
}

let audioGestureBound = false;
function bindFirstGestureAudioUnlock() {
  if (audioGestureBound) return;
  audioGestureBound = true;
  const unlock = () => {
    if (!state.isMuted) {
      const videoEl = document.getElementById("cinemaVideoPlayer");
      if (videoEl) {
        videoEl.muted = false;
        videoEl.volume = 0.88;
        if (state.isPlaying && videoEl.paused) {
          videoEl.play().catch(() => {});
        }
      }
      if (state.selectedSoundscapeId && state.selectedSoundscapeId !== "none" && activeAudioNodes.length === 0) {
        toggleProceduralSoundscape(state.selectedSoundscapeId);
      }
    }
    updateMasterSoundUI();
  };
  window.addEventListener("pointerdown", unlock, { passive: true });
  window.addEventListener("keydown", unlock, { passive: true });
}

// ==================== ASSET PRELOADER & REAL H.264 <VIDEO> PLAYER ====================
function syncNativeVideoPlayer(mp4UrlOverride = null, forceReload = false) {
  const videoEl = document.getElementById("cinemaVideoPlayer");
  if (!videoEl) return;

  bindFirstGestureAudioUnlock();

  const clip = state.activeClip;
  const targetUrl =
    mp4UrlOverride ||
    clip?.mp4Url ||
    (clip?.videoUrl && clip.videoUrl.endsWith(".mp4") ? clip.videoUrl : null) ||
    (clip ? `/renders/${clip.id}.mp4` : null);

  if (!targetUrl) return;

  // Never keep a static poster attribute once the video loads; respect user's Sound ON state
  videoEl.removeAttribute("poster");
  videoEl.volume = 0.88;
  videoEl.muted = Boolean(state.isMuted);
  videoEl.autoplay = true;
  videoEl.loop = true;

  if (forceReload || videoEl.getAttribute("data-src") !== targetUrl) {
    videoEl.setAttribute("data-src", targetUrl);
    videoEl.src = forceReload ? `${targetUrl}?t=${Date.now()}` : targetUrl;
    videoEl.load();
    const tryPlay = () => {
      videoEl.muted = Boolean(state.isMuted);
      videoEl.play().catch(() => {
        // Browser blocked unmuted autoplay before first user click; start playing and unmute on next click
        videoEl.muted = true;
        videoEl.play().catch(() => {});
      });
    };
    videoEl.onloadeddata = tryPlay;
    tryPlay();
  } else if (videoEl.paused && state.isPlaying) {
    videoEl.play().catch(() => {});
  }
}

function ensureClipMediaLoaded(clip) {
  if (!clip) return;

  // If clip has a cloud MP4 video URL, load a hidden <video> element to draw into the cinema monitor
  if (clip.videoUrl && clip.videoUrl.endsWith(".mp4") && !state.loadedVideos[clip.id]) {
    const vid = document.createElement("video");
    vid.src = clip.videoUrl;
    vid.muted = true;
    vid.loop = true;
    vid.playsInline = true;
    vid.crossOrigin = "anonymous";
    vid.play().catch(() => {});
    state.loadedVideos[clip.id] = vid;
  }

  // If clip has a real AI-generated frameUrl (/renders/clip-xxx.jpg), preload Image
  if (clip.frameUrl && !state.loadedImages[clip.id]) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      state.loadedImages[clip.id] = img;
    };
    img.src = clip.frameUrl;
  }
}

// ==================== INITIALIZATION ====================
async function initStudio() {
  try {
    const res = await fetch("/api/catalog");
    const data = await res.json();

    state.models = data.models || [];
    state.cameraPresets = data.cameraPresets || [];
    state.lensOptics = data.lensOptics || [];
    state.motionPresets = data.motionPresets || [];
    state.vfxPresets = data.vfxPresets || [];
    state.physicsGuardrails = data.physicsGuardrails || [];
    state.colorGradingLuts = data.colorGradingLuts || [];
    state.audioSoundscapes = data.audioSoundscapes || [];
    state.soulIds = data.soulIds || [];
    state.generations = data.generations || [];
    state.timeline = data.timeline || [];
    state.alignmentReport = data.alignmentReport || null;
    if (data.originalStory && document.getElementById("originalStoryInput")) {
      document.getElementById("originalStoryInput").value = data.originalStory;
    }
    state.mcpTools = data.mcpTools || [];
    state.connectedMcpServers = data.connectedMcpServers || [];
    state.mcpServerConfigPath = data.mcpServerConfigPath || "mcp-server.js";

    state.generations.forEach(ensureClipMediaLoaded);

    if (state.generations.length > 0) {
      state.activeClip = state.generations[0];
    }

    bindNavigation();
    bindDirectorControls();
    renderCameraGrid();
    renderGallery();
    renderTimeline();
    if (state.alignmentReport) {
      renderAlignmentReport(state.alignmentReport);
    }
    renderModelsMatrix("all");
    renderSoulVault();
    renderMcpHub();
    initCostCalculator();
    initApiKeysModal();
    initReferenceUploader();
    initPricingPlansModal();
    initCamera3dGizmo();
    initSplitCompareModal();
    initKeyboardShortcuts();
    initCinemaViewport();
    syncNativeVideoPlayer();

    // Poll once after 4s in case background AI frame hydration finished for initial demo clips
    setTimeout(refreshCatalogAssetsSilently, 4500);
    setTimeout(refreshCatalogAssetsSilently, 10000);
  } catch (err) {
    console.error("Failed to initialize Dafeild Studio:", err);
  }
}

async function refreshCatalogAssetsSilently() {
  try {
    const res = await fetch("/api/catalog");
    const data = await res.json();
    if (data.generations) {
      state.generations = data.generations;
      state.generations.forEach(ensureClipMediaLoaded);
      if (state.activeClip) {
        const updated = state.generations.find((g) => g.id === state.activeClip.id);
        if (updated) state.activeClip = updated;
      }
      syncNativeVideoPlayer();
      renderGallery();
    }
  } catch (_) {}
}

// ==================== NAVIGATION TABS ====================
function bindNavigation() {
  document.querySelectorAll(".nav-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-tab").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      const tabId = btn.getAttribute("data-tab");
      document.getElementById(`tab-${tabId}`).classList.add("active");
    });
  });

  document.getElementById("headerActiveModelChip").addEventListener("click", () => {
    document.querySelector('.nav-tab[data-tab="models"]').click();
  });

  document.getElementById("jumpToSoulTabBtn").addEventListener("click", () => {
    document.querySelector('.nav-tab[data-tab="soul"]').click();
  });
}

// ==================== DIRECTOR CONTROLS ====================
function bindDirectorControls() {
  const modelSelect = document.getElementById("studioModelSelect");
  const freeToggle = document.getElementById("freeOnlyToggle");

  function refreshModelDropdown() {
    const list = state.freeOnly
      ? state.models.filter((m) => m.tier === "free")
      : state.models;

    if (!list.some((m) => m.id === state.selectedModelId) && list.length > 0) {
      state.selectedModelId = list[0].id;
    }

    const groups = [
      { key: "higgsfield", label: "★ Higgsfield AI Cinema Models" },
      { key: "movie-platform", label: "★ Major Movie Platforms (Kling, Runway, Sora, Veo, Luma, Hailuo, Pika)" },
      { key: "open-free", label: "★ Free & Open-Weights Cinema Models (Wan, SkyReels, Step-Video, LTX, Hunyuan)" },
      { key: "custom", label: "★ Custom Imported Models" }
    ];

    const renderOption = (m) => {
      const cost = m.costPerClipUsd === 0 ? "FREE ($0.00)" : `$${m.costPerClipUsd.toFixed(2)}`;
      return `<option value="${m.id}" ${m.id === state.selectedModelId ? "selected" : ""}>${m.name} — ${cost}</option>`;
    };

    const groupedHtml = groups
      .map((g) => {
        const items = list.filter((m) => (m.platformGroup || "open-free") === g.key);
        if (items.length === 0) return "";
        return `<optgroup label="${g.label}">${items.map(renderOption).join("")}</optgroup>`;
      })
      .filter(Boolean)
      .join("");

    modelSelect.innerHTML = groupedHtml || list.map(renderOption).join("");
    updateModelMetadata();
  }

  freeToggle.onchange = (e) => {
    state.freeOnly = e.target.checked;
    refreshModelDropdown();
  };

  modelSelect.onchange = (e) => {
    state.selectedModelId = e.target.value;
    updateModelMetadata();
  };

  refreshModelDropdown();

  // Toggle Fine-Tune Director Drawer
  const drawerBtn = document.getElementById("toggleDirectorDrawerBtn");
  const drawerEl = document.getElementById("directorDrawer");
  if (drawerBtn && drawerEl) {
    drawerBtn.onclick = () => {
      drawerEl.classList.toggle("hidden");
      drawerBtn.classList.toggle("active", !drawerEl.classList.contains("hidden"));
    };
  }

  // Workflow Mode Select
  const dropzone = document.getElementById("keyframeDropzone");
  const modeSelect = document.getElementById("generationModeSelect");
  if (modeSelect) {
    modeSelect.onchange = (e) => {
      const mode = e.target.value;
      state.generationMode = mode;
      if (mode === "image-to-video" || mode === "first-last-frame") {
        dropzone.classList.remove("hidden");
      } else {
        dropzone.classList.add("hidden");
      }
      updateStreamTicker();
    };
  }

  // Dropzone file handling (Saves real base64 image for backend + live viewport)
  const fileInput = document.getElementById("keyframeFileInput");
  dropzone.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      state.keyframeDataUrl = ev.target.result;
      const img = new Image();
      img.onload = () => {
        state.keyframeImage = img;
        document.getElementById("dropzoneLabel").textContent = `Loaded: ${file.name.slice(0, 24)}`;
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });

  // Cinema Lens Selector
  const lensSelect = document.getElementById("studioLensSelect");
  lensSelect.innerHTML = state.lensOptics
    .map((l) => `<option value="${l.id}" ${l.id === state.selectedLensId ? "selected" : ""}>${l.name}</option>`)
    .join("");
  lensSelect.onchange = (e) => {
    state.selectedLensId = e.target.value;
    updateLensMetadata();
  };
  updateLensMetadata();

  // Motion Choreography Selector
  const motionSelect = document.getElementById("studioMotionSelect");
  motionSelect.innerHTML = state.motionPresets
    .map((m) => `<option value="${m.id}" ${m.id === state.selectedMotionId ? "selected" : ""}>${m.name} (${m.category})</option>`)
    .join("");
  motionSelect.onchange = (e) => {
    state.selectedMotionId = e.target.value;
    updateStreamTicker();
  };

  // ReelMagic VFX Selector
  const vfxSelect = document.getElementById("studioVfxSelect");
  vfxSelect.innerHTML = state.vfxPresets
    .map((v) => `<option value="${v.id}" ${v.id === state.selectedVfxId ? "selected" : ""}>${v.icon} ${v.name}</option>`)
    .join("");
  vfxSelect.onchange = (e) => {
    state.selectedVfxId = e.target.value;
    updateStreamTicker();
  };

  // Dialogue & Lip-Sync Voice Preview
  const dialogueInput = document.getElementById("dialogueTextInput");
  dialogueInput.oninput = (e) => {
    state.dialogueText = e.target.value;
  };

  document.getElementById("speakDialogueBtn").onclick = () => {
    const text = dialogueInput.value.trim();
    if (!text) return;
    state.isSpeakingLipSync = true;
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.pitch = 0.94;
      utter.rate = 0.96;
      utter.onend = () => { state.isSpeakingLipSync = false; };
      window.speechSynthesis.speak(utter);
    }
    setTimeout(() => { state.isSpeakingLipSync = false; }, Math.max(2000, text.length * 70));
  };

  // Soul ID Dropdown
  refreshSoulDropdown();

  // Intensity Slider
  const intSlider = document.getElementById("cameraIntensitySlider");
  const intVal = document.getElementById("cameraIntensityVal");
  intSlider.oninput = (e) => {
    state.cameraIntensity = Number(e.target.value) / 100;
    intVal.textContent = `${e.target.value}%`;
    updateStreamTicker();
  };

  // Aspect Ratio & Duration Capsule Selectors
  document.getElementById("aspectRatioSelect").onchange = (e) => {
    state.aspectRatio = e.target.value;
    document.getElementById("hudAspectBadge").textContent = `${state.aspectRatio} SCOPE`;
    updateStreamTicker();
  };

  document.getElementById("durationSelect").onchange = (e) => {
    state.durationSec = Number(e.target.value);
    updateStreamTicker();
  };

  // Template Quick Prompt Chips
  document.querySelectorAll(".chip-template").forEach((chip) => {
    chip.addEventListener("click", () => {
      document.getElementById("scenePromptInput").value = chip.getAttribute("data-prompt");
      const cams = chip.getAttribute("data-cams");
      if (cams) state.cameraStack = cams.split(",").filter(Boolean);
      const lens = chip.getAttribute("data-lens");
      if (lens) {
        state.selectedLensId = lens;
        document.getElementById("studioLensSelect").value = lens;
        updateLensMetadata();
      }
      const vfx = chip.getAttribute("data-vfx");
      if (vfx) {
        state.selectedVfxId = vfx;
        document.getElementById("studioVfxSelect").value = vfx;
      }
      const soul = chip.getAttribute("data-soul");
      state.selectedSoulId = soul || "";
      document.getElementById("studioSoulSelect").value = state.selectedSoulId;
      updateSoulMetadata();
      renderCameraGrid();
      updateStreamTicker();
    });
  });

  // Render Scene Action Buttons (Toolbar + Inline Enter Button)
  document.getElementById("generateVideoBtn").addEventListener("click", executeRenderScene);
  const promptEnterBtn = document.getElementById("promptEnterBtn");
  if (promptEnterBtn) {
    promptEnterBtn.addEventListener("click", executeRenderScene);
  }

  // Clear Prompt Button
  const clearPromptBtn = document.getElementById("clearPromptBtn");
  if (clearPromptBtn) {
    clearPromptBtn.addEventListener("click", () => {
      const promptInput = document.getElementById("scenePromptInput");
      if (promptInput) {
        promptInput.value = "";
        promptInput.focus();
      }
    });
  }

  // Video Class / Aesthetic Style Selector
  const classSelect = document.getElementById("videoClassSelect");
  if (classSelect) {
    classSelect.onchange = (e) => {
      const cls = e.target.value;
      state.videoClass = cls;
      if (cls === "commercial-luxury") {
        state.selectedLensId = "laowa-probe";
        state.selectedLutId = "solarpunk-gold";
        state.cameraStack = ["orbit-360", "dolly-in"];
      } else if (cls === "anime-shinkai") {
        state.selectedLensId = "cooke-anamorphic";
        state.selectedLutId = "cyber-teal-amber";
        state.cameraStack = ["crane-up", "whip-pan"];
      } else if (cls === "scifi-vfx") {
        state.selectedLensId = "cooke-anamorphic";
        state.selectedVfxId = "cyber-glitch";
        state.cameraStack = ["dolly-in", "orbit-360"];
      } else if (cls === "nature-imax") {
        state.selectedLensId = "imax-70mm";
        state.selectedLutId = "arri-logc3";
        state.cameraStack = ["fpv-drone", "crane-up"];
      } else if (cls === "viral-music") {
        state.aspectRatio = "9:16";
        const arEl = document.getElementById("aspectRatioSelect");
        if (arEl) arEl.value = "9:16";
        const arBadge = document.getElementById("hudAspectBadge");
        if (arBadge) arBadge.textContent = "9:16 VERTICAL";
        state.cameraStack = ["whip-pan", "crash-zoom"];
      } else if (cls === "horror-noir") {
        state.selectedLensId = "panavision-vintage";
        state.selectedLutId = "bleach-bypass";
        state.cameraStack = ["handheld-doc", "dolly-in"];
      } else if (cls === "cgi-unreal") {
        state.selectedLensId = "imax-70mm";
        state.selectedLutId = "cyber-teal-amber";
        state.cameraStack = ["bullet-time", "orbit-360"];
      }
      const lensEl = document.getElementById("studioLensSelect");
      if (lensEl) lensEl.value = state.selectedLensId;
      const lutEl = document.getElementById("studioLutSelect");
      if (lutEl) lutEl.value = state.selectedLutId;
      updateLensMetadata();
      renderCameraGrid();
      updateStreamTicker();
    };
  }

  // Magic Director Polish: 🪄 Enhance Prompt Button
  const enhancePromptBtn = document.getElementById("enhancePromptBtn");
  if (enhancePromptBtn) {
    enhancePromptBtn.addEventListener("click", () => {
      const promptInput = document.getElementById("scenePromptInput");
      if (!promptInput) return;
      const raw = promptInput.value.trim() || "cinematic movie scene";
      const cls = (classSelect ? classSelect.value : "cinema-blockbuster");

      const enhancements = {
        "cinema-blockbuster": "Master cinematic 35mm Hollywood Panavision anamorphic shot, chiaroscuro lighting, deep natural atmospheric depth, rich film grain, authentic actor emotional micro-expressions",
        "commercial-luxury": "Ultra-glossy luxury commercial cinematography, macro probe lens detail, high-speed 120fps fluid slow-motion, specular lighting reflections, pristine studio elegance",
        "anime-shinkai": "Iconic Studio Ghibli and Makoto Shinkai cel-shaded anime aesthetic, vibrant cumulus clouds, hand-drawn keyframe animation style, emotional golden-hour backlight",
        "scifi-vfx": "Cyberpunk blockbuster sci-fi choreography, anamorphic lens flares, volumetric neon haze, dynamic stunt motion, digital particle trails",
        "nature-imax": "Epic IMAX 70mm natural history documentary, soaring aerial dynamic drone tracking, crystal-clear high dynamic range, golden twilight rim-light",
        "viral-music": "High-octane viral music video cinematography, kinetic whip-pan camera snap, beat-matched choreography, hyper-stylized saturated grade, 9:16 vertical framing",
        "horror-noir": "Atmospheric psychological horror cinematography, deep shadow occlusion, low-key single-source spotlighting, slow creeping dread push-in, unsettling tension",
        "cgi-unreal": "Unreal Engine 5 hyper-realistic 3D CGI cinematic render, raytraced lumen global illumination, nanite physical geometry, photoreal surface micro-displacement"
      };

      const tag = enhancements[cls] || enhancements["cinema-blockbuster"];
      let clean = raw.replace(/\b(Master cinematic|Ultra-glossy|Iconic Studio|Cyberpunk blockbuster|Epic IMAX|High-octane|Atmospheric psychological|Unreal Engine 5)[\w\s,-]*/gi, "").trim();
      promptInput.value = `${clean.replace(/,\s*$/, "")}, ${tag}`;
      promptInput.focus();

      enhancePromptBtn.textContent = "✓ Enhanced!";
      setTimeout(() => { enhancePromptBtn.textContent = "🪄 Enhance"; }, 1600);
    });
  }

  // Story Script Inline Enter Button + Live Auto-Alignment on Script Edit
  const storyEnterBtn = document.getElementById("storyEnterBtn");
  if (storyEnterBtn) {
    storyEnterBtn.addEventListener("click", () => {
      const scriptBtn = document.getElementById("generateMovieFromScriptBtn");
      if (scriptBtn) scriptBtn.click();
    });
  }

  const storyInputEl = document.getElementById("originalStoryInput");
  if (storyInputEl) {
    let alignDebounce = null;
    storyInputEl.addEventListener("input", () => {
      clearTimeout(alignDebounce);
      alignDebounce = setTimeout(async () => {
        try {
          const res = await fetch("/api/movie/align-script", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ originalStory: storyInputEl.value.trim() })
          });
          const data = await res.json();
          if (data.generations) state.generations = data.generations;
          if (data.timeline) state.timeline = data.timeline;
          if (data.alignmentReport) {
            state.alignmentReport = data.alignmentReport;
            renderAlignmentReport(data.alignmentReport);
          }
          renderGallery();
          renderTimeline();
        } catch (_) {}
      }, 450);
    });
  }

  // ComfyUI Workflow JSON Exporter
  document.getElementById("exportComfyBtn").addEventListener("click", async () => {
    const prompt = document.getElementById("scenePromptInput").value.trim();
    const res = await fetch("/api/comfy-workflow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        modelId: state.selectedModelId,
        cameraStack: state.cameraStack,
        cameraIntensity: state.cameraIntensity,
        lensId: state.selectedLensId,
        motionId: state.selectedMotionId,
        vfxId: state.selectedVfxId,
        soulId: state.selectedSoulId || null,
        durationSec: state.durationSec,
        aspectRatio: state.aspectRatio
      })
    });
    const wf = await res.json();
    const blob = new Blob([JSON.stringify(wf, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dafeild-${state.selectedModelId}-workflow.json`;
    a.click();
  });
}

function refreshSoulDropdown() {
  const soulSelect = document.getElementById("studioSoulSelect");
  soulSelect.innerHTML =
    `<option value="">None (Unbound)</option>` +
    state.soulIds
      .map((s) => `<option value="${s.id}" ${s.id === state.selectedSoulId ? "selected" : ""}>${s.name.split("(")[0].trim()}</option>`)
      .join("");
  soulSelect.onchange = (e) => {
    state.selectedSoulId = e.target.value;
    updateSoulMetadata();
  };

  // Co-Star 180-Degree Eyeline Lock Dropdown
  const secSoulSelect = document.getElementById("studioSecondarySoulSelect");
  if (secSoulSelect) {
    secSoulSelect.innerHTML =
      `<option value="">— Single Actor (No Co-Star) —</option>` +
      state.soulIds
        .map((s) => `<option value="${s.id}" ${s.id === state.selectedSecondarySoulId ? "selected" : ""}>Co-Star: ${s.name.split("(")[0].trim()} (180° Eyeline Lock)</option>`)
        .join("");
    secSoulSelect.onchange = (e) => {
      state.selectedSecondarySoulId = e.target.value;
      updateStreamTicker();
    };
  }

  // Physics Guardrails Dropdown
  const physSelect = document.getElementById("studioPhysicsSelect");
  if (physSelect && state.physicsGuardrails.length > 0) {
    physSelect.innerHTML = state.physicsGuardrails
      .map((p) => `<option value="${p.id}" ${p.id === state.selectedPhysicsId ? "selected" : ""}>${p.name}</option>`)
      .join("");
    physSelect.onchange = (e) => {
      state.selectedPhysicsId = e.target.value;
      updateStreamTicker();
    };
  }

  // Master Color LUT Select (Real-Time Canvas Color Science)
  const lutSelect = document.getElementById("studioLutSelect");
  if (lutSelect) {
    lutSelect.onchange = (e) => {
      state.selectedLutId = e.target.value;
      const lutObj = state.colorGradingLuts.find((l) => l.id === state.selectedLutId);
      const canvas = document.getElementById("cinemaCanvas");
      if (canvas && lutObj) {
        canvas.style.filter = lutObj.cssFilter || "none";
      }
      updateStreamTicker();
    };
  }

  // Procedural WebAudio Ambient Soundscape Select & Master Sound Toggle
  const soundSelect = document.getElementById("studioSoundscapeSelect");
  if (soundSelect) {
    soundSelect.value = state.selectedSoundscapeId || "rain-neon";
    soundSelect.onchange = (e) => {
      state.selectedSoundscapeId = e.target.value;
      if (state.selectedSoundscapeId === "none") {
        toggleProceduralSoundscape("none");
      } else {
        state.isMuted = false;
        const videoEl = document.getElementById("cinemaVideoPlayer");
        if (videoEl) videoEl.muted = false;
        updateMasterSoundUI();
        toggleProceduralSoundscape(state.selectedSoundscapeId);
      }
    };
  }

  const masterSoundBtn = document.getElementById("masterSoundToggleBtn");
  if (masterSoundBtn) {
    masterSoundBtn.onclick = () => {
      state.isMuted = !state.isMuted;
      const videoEl = document.getElementById("cinemaVideoPlayer");
      if (videoEl) {
        videoEl.muted = state.isMuted;
        videoEl.volume = 0.88;
        if (!state.isMuted && videoEl.paused && state.isPlaying) {
          videoEl.play().catch(() => {});
        }
      }
      if (state.isMuted) {
        toggleProceduralSoundscape("none");
      } else {
        if (!state.selectedSoundscapeId || state.selectedSoundscapeId === "none") {
          state.selectedSoundscapeId = "rain-neon";
          if (soundSelect) soundSelect.value = "rain-neon";
        }
        toggleProceduralSoundscape(state.selectedSoundscapeId);
      }
      updateMasterSoundUI();
    };
  }

  // Toggle between Native H.264 <video> MP4 Player and Interactive Director Rig HUD Canvas
  const toggleNativeBtn = document.getElementById("toggleNativeVideoBtn");
  if (toggleNativeBtn) {
    toggleNativeBtn.onclick = () => {
      const videoEl = document.getElementById("cinemaVideoPlayer");
      const canvasEl = document.getElementById("cinemaCanvas");
      if (!videoEl || !canvasEl) return;
      const isShowingVideo = !videoEl.classList.contains("hidden");
      if (isShowingVideo) {
        videoEl.classList.add("hidden");
        canvasEl.classList.remove("hidden");
        toggleNativeBtn.classList.remove("active");
        const span = toggleNativeBtn.querySelector("span");
        if (span) span.textContent = "Director HUD";
      } else {
        videoEl.classList.remove("hidden");
        canvasEl.classList.add("hidden");
        toggleNativeBtn.classList.add("active");
        const span = toggleNativeBtn.querySelector("span");
        if (span) span.textContent = "H.264 Player";
        syncNativeVideoPlayer();
      }
    };
  }

  // Surgical Frame-Range Retake Bar Toggle & Action
  const openRetakeBtn = document.getElementById("openSurgicalRetakeBtn");
  const retakeBar = document.getElementById("surgicalRetakeBar");
  if (openRetakeBtn && retakeBar) {
    openRetakeBtn.onclick = () => {
      retakeBar.classList.toggle("hidden");
      openRetakeBtn.classList.toggle("active", !retakeBar.classList.contains("hidden"));
    };
  }

  const applyRetakeBtn = document.getElementById("applySurgicalRetakeBtn");
  if (applyRetakeBtn) {
    applyRetakeBtn.onclick = async () => {
      const clipId = state.activeClip?.id || (state.generations[0] && state.generations[0].id);
      if (!clipId) return;
      const startSec = Number(document.getElementById("retakeStartSec").value || 0);
      const endSec = Number(document.getElementById("retakeEndSec").value || 10);
      const retakeInstruction = document.getElementById("retakeInstructionInput").value.trim();
      if (!retakeInstruction) return;

      applyRetakeBtn.disabled = true;
      applyRetakeBtn.textContent = "Patching Segment...";
      try {
        const res = await fetch("/api/movie/surgical-retake", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clipId,
            startSec,
            endSec,
            retakeInstruction,
            apiKeys: state.apiKeys
          })
        });
        const data = await res.json();
        if (data.generations) {
          state.generations = data.generations;
          state.generations.forEach(ensureClipMediaLoaded);
        }
        if (data.patchedClip) {
          state.activeClip = data.patchedClip;
          delete state.loadedImages[data.patchedClip.id];
          ensureClipMediaLoaded(data.patchedClip);
          syncNativeVideoPlayer(null, true);
        }
        renderGallery();
      } catch (err) {
        console.error("Surgical retake error:", err);
      } finally {
        applyRetakeBtn.disabled = false;
        applyRetakeBtn.textContent = "Patch Segment ($0)";
      }
    };
  }

  // Monitor HUD "Remove Scene" button for discarding scenes the user does not like
  const deleteActiveSceneBtn = document.getElementById("deleteActiveSceneBtn");
  if (deleteActiveSceneBtn) {
    deleteActiveSceneBtn.onclick = async () => {
      if (!state.activeClip) return;
      const preview = state.activeClip.prompt ? state.activeClip.prompt.slice(0, 38) : "this scene";
      if (!confirm(`Are you sure you want to remove "${preview}..."?`)) return;
      await removeSceneById(state.activeClip.id);
    };
  }

  updateSoulMetadata();
}

async function removeSceneById(clipId) {
  if (!clipId) return;
  try {
    const res = await fetch(`/api/generations/${encodeURIComponent(clipId)}`, {
      method: "DELETE"
    });
    const data = await res.json();
    if (data.generations) {
      state.generations = data.generations;
    } else {
      state.generations = state.generations.filter((g) => g.id !== clipId);
    }
    if (data.timeline) {
      state.timeline = data.timeline;
    } else {
      state.timeline = state.timeline.filter((t) => t.clipId !== clipId);
    }

    // Clean up cached media
    delete state.loadedImages[clipId];
    delete state.loadedVideos[clipId];

    // If the active clip was the deleted one, switch to next available scene
    if (state.activeClip && state.activeClip.id === clipId) {
      state.activeClip = state.generations[0] || null;
      if (state.activeClip) {
        ensureClipMediaLoaded(state.activeClip);
        syncNativeVideoPlayer(state.activeClip.mp4Url, true);
        const pInput = document.getElementById("scenePromptInput");
        if (pInput) pInput.value = state.activeClip.prompt || "";
      } else {
        const vidEl = document.getElementById("cinemaVideoPlayer");
        if (vidEl) {
          vidEl.pause();
          vidEl.removeAttribute("src");
          vidEl.load();
        }
      }
    }

    renderGallery();
    renderTimeline();
  } catch (err) {
    console.error("Failed to remove scene:", err);
  }
}

let activeAudioCtx = null;
let activeAudioNodes = [];
function toggleProceduralSoundscape(soundId) {
  if (activeAudioNodes.length > 0) {
    activeAudioNodes.forEach((n) => {
      try { n.stop && n.stop(); n.disconnect && n.disconnect(); } catch (_) {}
    });
    activeAudioNodes = [];
  }
  if (!soundId || soundId === "none" || state.isMuted) return;
  // Never layer Web Audio noise/synth on top of the native MP4 player (prevents double-audio gabble)
  if (state.useNativeVideoPlayer) return;

  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    if (!activeAudioCtx) activeAudioCtx = new AudioContextClass();
    if (activeAudioCtx.state === "suspended") activeAudioCtx.resume();

    const baseFreq = 55; // Grounded 55Hz cinematic sub drone

    // Pure warm cinematic orchestra pad (fundamental A1 55Hz + perfect fifth E2 82.5Hz + octave A2 110Hz)
    const osc1 = activeAudioCtx.createOscillator();
    const osc2 = activeAudioCtx.createOscillator();
    const oscSub = activeAudioCtx.createOscillator();
    const masterGain = activeAudioCtx.createGain();

    osc1.type = "sine";
    osc1.frequency.value = baseFreq;
    osc2.type = "sine";
    osc2.frequency.value = baseFreq * 1.5;
    oscSub.type = "sine";
    oscSub.frequency.value = baseFreq * 2.0;

    // Smooth cinematic swell with zero noise buffers or gabble
    masterGain.gain.setValueAtTime(0.001, activeAudioCtx.currentTime);
    masterGain.gain.exponentialRampToValueAtTime(0.06, activeAudioCtx.currentTime + 1.2);

    osc1.connect(masterGain);
    osc2.connect(masterGain);
    oscSub.connect(masterGain);
    masterGain.connect(activeAudioCtx.destination);

    osc1.start();
    osc2.start();
    oscSub.start();
    activeAudioNodes.push(osc1, osc2, oscSub, masterGain);
  } catch (_) {}
}

function updateModelMetadata() {
  const model = state.models.find((m) => m.id === state.selectedModelId) || state.models[0];
  if (!model) return;
  const isFree = model.costPerClipUsd === 0;

  document.getElementById("headerModelName").textContent = model.name.split("—")[0].trim();
  document.getElementById("headerModelCost").textContent = isFree ? "FREE" : `$${model.costPerClipUsd.toFixed(2)}`;
  document.getElementById("generateCostLabel").textContent = isFree ? "$0.00" : `$${model.costPerClipUsd.toFixed(2)}`;

  const metaEl = document.getElementById("selectedModelMeta");
  if (metaEl) {
    metaEl.innerHTML = `<div>${model.provider} • ${model.maxResolution}</div>`;
  }
  updateStreamTicker();
}

function updateLensMetadata() {
  const lens = state.lensOptics.find((l) => l.id === state.selectedLensId) || state.lensOptics[0];
  if (!lens) return;
  document.getElementById("selectedLensMeta").innerHTML = `
    <strong>${lens.focal} • ${lens.aperture}</strong> — ${lens.look}
  `;
  const brandShort = lens.name.split(" ")[0].trim();
  document.getElementById("hudLensBadge").textContent = `${brandShort} ${lens.focal}`;
  updateStreamTicker();
}

function updateSoulMetadata() {
  const soul = state.soulIds.find((s) => s.id === state.selectedSoulId);
  const box = document.getElementById("selectedSoulPreview");
  const badge = document.getElementById("hudSoulBadge");
  if (!soul) {
    box.innerHTML = `<em>Character identity unbound. Appearance naturally varies per prompt.</em>`;
    badge.textContent = "Unbound";
  } else {
    box.innerHTML = `
      <div style="color:${soul.avatarColor};font-weight:700;">${soul.name} • Lock ${Math.round(soul.consistencyWeight * 100)}%</div>
      <div>${soul.appearancePrompt}</div>
    `;
    badge.textContent = `${soul.name.split("(")[0].trim()}`;
  }
  updateStreamTicker();
}

function renderCameraGrid() {
  const stackBar = document.getElementById("activeCameraStackBar");
  const grid = document.getElementById("cameraPresetGrid");
  const overlay = document.getElementById("cameraVectorOverlay");

  if (state.cameraStack.length === 0) {
    stackBar.innerHTML = `<span style="font-size:11px;color:#64748b;">Locked-off Tripod (Select presets below to stack)</span>`;
  } else {
    stackBar.innerHTML = state.cameraStack
      .map((cid, idx) => {
        const cam = state.cameraPresets.find((c) => c.id === cid);
        return cam ? `<span class="rig-chip">${idx + 1}. ${cam.name}</span>` : "";
      })
      .join("");
  }

  overlay.innerHTML = state.cameraStack
    .map((cid) => {
      const cam = state.cameraPresets.find((c) => c.id === cid);
      return cam ? `<span class="hud-param">${cam.name}</span>` : "";
    })
    .join("");

  grid.innerHTML = state.cameraPresets
    .map((cam) => {
      const isSel = state.cameraStack.includes(cam.id);
      return `
        <button class="cam-tile ${isSel ? "selected" : ""}" data-cam="${cam.id}">
          <span class="cam-tile-icon">${cam.icon}</span>
          <span>${cam.name}</span>
        </button>
      `;
    })
    .join("");

  grid.querySelectorAll(".cam-tile").forEach((tile) => {
    tile.addEventListener("click", () => {
      const cid = tile.getAttribute("data-cam");
      if (state.cameraStack.includes(cid)) {
        state.cameraStack = state.cameraStack.filter((x) => x !== cid);
      } else {
        if (state.cameraStack.length >= 3) state.cameraStack.shift();
        state.cameraStack.push(cid);
      }
      renderCameraGrid();
      updateStreamTicker();
    });
  });

  document.getElementById("clearCameraStackBtn").onclick = () => {
    state.cameraStack = [];
    renderCameraGrid();
    updateStreamTicker();
  };
}

function updateStreamTicker() {
  const model = state.models.find((m) => m.id === state.selectedModelId);
  const cams = state.cameraStack
    .map((cid) => state.cameraPresets.find((c) => c.id === cid)?.name)
    .filter(Boolean)
    .join(" + ");
  const lens = state.lensOptics.find((l) => l.id === state.selectedLensId);
  const soul = state.soulIds.find((s) => s.id === state.selectedSoulId);

  document.getElementById("compiledPromptTicker").textContent =
    `[${state.generationMode.toUpperCase()}] ${model ? model.name.split("—")[0].trim() : "Model"} • RIG: ${cams || "Tripod"} (${Math.round(state.cameraIntensity * 100)}%) • OPTICS: ${lens ? lens.name.split("(")[0].trim() : ""} • ${soul ? "SOUL LOCK: " + soul.name.split("(")[0] : "SOUL: Unbound"}`;
}

// ==================== AUTOMATIC WEBM VIDEO RECORDING & SERVER PERSISTENCE ====================
async function autoRecordAndPersistWebm(clipId, durationSec = 4) {
  const canvas = document.getElementById("cinemaCanvas");
  if (!canvas || !canvas.captureStream || typeof MediaRecorder === "undefined") return;

  try {
    const stream = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    const chunks = [];
    recorder.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) chunks.push(ev.data);
    };
    recorder.onstop = async () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const saveRes = await fetch("/api/save-video", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              clipId,
              videoBase64: reader.result
            })
          });
          const savedData = await saveRes.json();
          if (savedData.videoUrl) {
            const target = state.generations.find((g) => g.id === clipId);
            if (target) target.videoUrl = savedData.videoUrl;
            renderGallery();
          }
        } catch (_) {}
      };
      reader.readAsDataURL(blob);
    };
    recorder.start();
    setTimeout(() => {
      if (recorder.state === "recording") recorder.stop();
    }, Math.min(4500, durationSec * 900));
  } catch (_) {}
}

// ==================== RENDER SCENE ACTION (REAL AI EXECUTION) ====================
let isCreatingScene = false;
window.triggerSceneCreation = function (ev) {
  if (ev && typeof ev.preventDefault === "function") ev.preventDefault();
  executeRenderScene();
};

async function executeRenderScene() {
  if (isCreatingScene) return;

  const btn = document.getElementById("generateVideoBtn");
  const enterBtn = document.getElementById("promptEnterBtn");
  const statusStrip = document.getElementById("promptCreationStatus");
  const statusText = document.getElementById("promptCreationStatusText");
  const overlay = document.getElementById("sceneCreationOverlay");
  const overlayPrompt = document.getElementById("sceneCreationPromptPreview");
  const overlayBar = document.getElementById("sceneCreationProgressBar");
  const overlayStage = document.getElementById("sceneCreationStageText");
  const overlayTimer = document.getElementById("sceneCreationTimer");
  const promptInput = document.getElementById("scenePromptInput");

  const prompt = (promptInput ? promptInput.value.trim() : "") || "Cinematic tracking shot in rain-slicked Neo-Tokyo alley at night";

  isCreatingScene = true;
  if (btn) {
    btn.disabled = true;
    btn.style.opacity = "0.75";
  }
  const origHtml = btn ? btn.innerHTML : "";
  if (btn) {
    btn.innerHTML = `<div class="render-text"><span class="render-title">Creating New Scene...</span><span class="render-sub">Encoding 24fps H.264 .MP4</span></div>`;
  }

  let origEnterHtml = "";
  if (enterBtn) {
    enterBtn.disabled = true;
    origEnterHtml = enterBtn.innerHTML;
    enterBtn.innerHTML = `<span class="enter-btn-main"><span class="status-spinner"></span><span>Creating...</span></span><span class="enter-btn-sub">New Scene .MP4</span>`;
  }

  if (statusStrip) {
    statusStrip.classList.remove("hidden");
    if (statusText) {
      statusText.textContent = `Initiated New Scene Creation: "${prompt.slice(0, 72)}${prompt.length > 72 ? "..." : ""}" — Synthesizing AI motion & encoding 24fps H.264 .MP4...`;
    }
  }

  // Show immediate full-viewport Scene Creation Overlay on the Cinema Monitor
  if (overlay) {
    overlay.classList.remove("hidden");
    if (overlayPrompt) overlayPrompt.textContent = `"${prompt}"`;
    if (overlayBar) overlayBar.style.width = "14%";
    if (overlayStage) overlayStage.textContent = "Stage 1/3: Compiling Director Prompt, Camera Rig & Optics...";
    if (overlayTimer) overlayTimer.textContent = "0.0s";
  }

  // Insert an immediate "Creating New Scene..." card at the top of the Generated Clips Library
  const galleryList = document.getElementById("clipGalleryList");
  if (galleryList) {
    const pendingCard = document.createElement("div");
    pendingCard.className = "shot-card active";
    pendingCard.id = "pendingSceneCard";
    pendingCard.innerHTML = `
      <div>
        <div style="width:100%;height:110px;border-radius:6px;margin-bottom:8px;background:rgba(245,158,11,0.1);border:1px dashed rgba(245,158,11,0.5);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;">
          <span class="status-spinner"></span>
          <span style="font-family:var(--font-mono);font-size:10.5px;color:#fbbf24;font-weight:700;">CREATING NEW SCENE (.MP4)...</span>
        </div>
        <div class="shot-top-row">
          <span class="shot-model-name">Rendering New Scene</span>
          <span class="shot-price-pill free">LIVE</span>
        </div>
        <div class="shot-prompt-text">${prompt}</div>
      </div>
    `;
    galleryList.prepend(pendingCard);
  }

  const startTs = performance.now();
  const progressInterval = setInterval(() => {
    const elapsed = (performance.now() - startTs) / 1000;
    if (overlayTimer) overlayTimer.textContent = `${elapsed.toFixed(1)}s`;
    const pct = Math.min(92, Math.round(14 + elapsed * 9.5));
    if (overlayBar) overlayBar.style.width = `${pct}%`;
    if (overlayStage) {
      if (elapsed < 2.2) {
        overlayStage.textContent = "Stage 1/3: Compiling Director Prompt, Camera Rig & Character Lock...";
      } else if (elapsed < 5.5) {
        overlayStage.textContent = "Stage 2/3: Synthesizing Multi-Beat AI Text-to-Video Frames...";
      } else {
        overlayStage.textContent = "Stage 3/3: Encoding 24fps H.264 (avc1) + Stereo AAC .MP4 Video...";
      }
    }
  }, 120);

  try {
    const originalStory = document.getElementById("originalStoryInput")?.value.trim() || "";
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        originalStory,
        generationMode: state.generationMode,
        modelId: state.selectedModelId,
        cameraStack: state.cameraStack,
        cameraIntensity: state.cameraIntensity,
        lensId: state.selectedLensId,
        motionId: state.selectedMotionId,
        vfxId: state.selectedVfxId,
        soulId: state.selectedSoulId || null,
        secondarySoulId: state.selectedSecondarySoulId || null,
        physicsId: state.selectedPhysicsId || "rigid-realism",
        lutId: state.selectedLutId || "kodak-2383",
        dialogueText: document.getElementById("dialogueTextInput")?.value.trim() || "",
        keyframeDataUrl: state.referenceImageDataUrl || state.keyframeDataUrl || null,
        aspectRatio: state.aspectRatio,
        durationSec: state.durationSec,
        motionTrajectory: state.motionTrajectory,
        apiKeys: state.apiKeys
      })
    });
    const data = await res.json();
    if (data.clip) {
      if (overlayBar) overlayBar.style.width = "100%";
      if (overlayStage) {
        const beatLabel = data.clip.scriptBeatLabel || "Story Script";
        overlayStage.textContent = `✓ New Scene Created & Auto-Aligned to ${beatLabel}! Loading H.264 .MP4...`;
      }

      state.generations = data.generations;
      if (data.timeline) state.timeline = data.timeline;
      if (data.alignmentReport) {
        state.alignmentReport = data.alignmentReport;
        renderAlignmentReport(data.alignmentReport);
      }
      state.activeClip = data.clip;
      state.playheadTime = 0;

      // Load the newly generated real AI frame and FFmpeg H.264 .MP4 into the viewport
      ensureClipMediaLoaded(data.clip);
      syncNativeVideoPlayer(data.clip.mp4Url || `/renders/${data.clip.id}.mp4`, true);

      renderGallery();
      renderTimeline();
      const monitorFrame = document.querySelector(".monitor-frame");
      if (monitorFrame) {
        monitorFrame.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  } catch (err) {
    console.error("Render failed:", err);
  } finally {
    clearInterval(progressInterval);
    isCreatingScene = false;
    if (btn) {
      btn.disabled = false;
      btn.style.opacity = "1";
      if (origHtml) btn.innerHTML = origHtml;
    }
    if (enterBtn && origEnterHtml) {
      enterBtn.disabled = false;
      enterBtn.innerHTML = origEnterHtml;
    }
    if (statusStrip) {
      statusStrip.classList.add("hidden");
    }
    if (overlay) {
      setTimeout(() => overlay.classList.add("hidden"), 350);
    }
    updateModelMetadata();
  }
}

// ==================== SHOTS GALLERY, SCRIPT AUTO-ALIGNMENT & TIMELINE ====================
function renderAlignmentReport(report) {
  const reportBox = document.getElementById("continuityReportBox");
  if (!reportBox || !report) return;
  const scenes = report.recognizedScenes || [];
  const patches = report.patchesApplied || [];
  if (scenes.length === 0) return;

  reportBox.classList.remove("hidden");
  const scenesHtml = scenes
    .map(
      (s) =>
        `<li><strong>Scene #${s.shotNumber} (${s.scriptBeatLabel || "Beat #" + s.shotNumber}):</strong> Aligned to <em>"${(s.scriptBeatText || "").slice(0, 78)}${(s.scriptBeatText || "").length > 78 ? "..." : ""}"</em> • ${s.setting} (${s.lighting}) • Actor: ${s.character} • Transition: <code>${s.transition || "cut"}</code></li>`
    )
    .join("");
  const patchesHtml = patches
    .slice(0, 4)
    .map((p) => `<li style="color:var(--accent-emerald);">✓ ${p}</li>`)
    .join("");

  reportBox.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;flex-wrap:wrap;gap:6px;">
      <span style="font-weight:700;color:var(--accent-gold);font-family:var(--font-mono);font-size:11px;">✓ LIVE SCRIPT AUTO-ALIGNMENT ACTIVE (${scenes.length} SCENES FIT TO SCRIPT)</span>
      <span style="font-size:10.5px;color:var(--accent-emerald);font-family:var(--font-mono);">Always Synced</span>
    </div>
    <ul style="margin-left:16px;margin-bottom:6px;font-size:11.5px;color:var(--text-secondary);">${scenesHtml}</ul>
    ${patchesHtml ? `<ul style="margin-left:16px;font-size:11px;">${patchesHtml}</ul>` : ""}
  `;
}

function renderGallery() {
  const list = document.getElementById("clipGalleryList");
  document.getElementById("clipCountBadge").textContent = state.generations.length;

  list.innerHTML = state.generations
    .map((clip) => {
      const isAct = state.activeClip && state.activeClip.id === clip.id;
      const isFree = clip.costUsd === 0;
      const costStr = isFree ? "FREE" : `$${clip.costUsd.toFixed(2)}`;
      const cams = (clip.cameraStack || []).map((c) => c.name).join(" + ") || "Static";

      const mp4Href = clip.mp4Url || (clip.videoUrl && clip.videoUrl.endsWith(".mp4") ? clip.videoUrl : `/renders/${clip.id}.mp4`);
      const durLabel = clip.durationSec >= 60 ? `${Math.round(clip.durationSec / 60)}m` : `${clip.durationSec}s`;
      const beatBadge = clip.scriptBeatLabel || `Beat #${clip.scriptBeatNumber || 1}`;

      const thumbHtml = clip.frameUrl
        ? `<div style="width:100%;height:110px;border-radius:6px;overflow:hidden;margin-bottom:8px;background:#05070c;border:1px solid rgba(255,255,255,0.07);position:relative;">
             <img src="${clip.frameUrl}" alt="AI Frame" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy" />
             <span style="position:absolute;top:4px;left:5px;background:rgba(15,19,28,0.86);border:1px solid rgba(245,158,11,0.45);color:#fbbf24;font-family:var(--font-mono);font-size:9px;font-weight:700;padding:1px 6px;border-radius:3px;">✓ ${beatBadge}</span>
             <span style="position:absolute;bottom:4px;right:5px;background:rgba(0,0,0,0.78);color:#10b981;font-family:var(--font-mono);font-size:9.5px;padding:1px 6px;border-radius:3px;">${durLabel} H.264 MP4</span>
           </div>`
        : "";

      const downloadLinksHtml = `
        <div style="display:flex;gap:10px;margin-bottom:6px;font-size:10.5px;">
          <a href="${mp4Href}" download="${clip.id}.mp4" style="color:var(--accent-emerald);font-weight:600;text-decoration:none;">Download .MP4</a>
          ${clip.frameUrl ? `<a href="${clip.frameUrl}" target="_blank" style="color:var(--text-tertiary);text-decoration:none;">Frame .JPG</a>` : ""}
        </div>
      `;

      return `
        <div class="shot-card ${isAct ? "active" : ""}" data-clip-id="${clip.id}">
          <div>
            ${thumbHtml}
            <div class="shot-top-row">
              <span class="shot-model-name">${clip.modelName.split("—")[0]}</span>
              <span class="shot-price-pill ${isFree ? "free" : "cheap"}">${costStr}</span>
            </div>
            <div class="shot-prompt-text">${clip.prompt}</div>
            <div class="shot-tags-row">
              <span class="shot-tag" style="color:#fbbf24;border-color:rgba(245,158,11,0.35);">✓ ${beatBadge}</span>
              <span class="shot-tag">${cams}</span>
              ${clip.soul ? `<span class="shot-tag" style="color:var(--accent-gold);">${clip.soul.name.split("(")[0]}</span>` : ""}
              <span class="shot-tag">${durLabel}</span>
            </div>
          </div>
          <div>
            ${downloadLinksHtml}
            <div class="shot-footer">
              <span>${clip.providerUsed ? clip.providerUsed.slice(0, 26) : "Dafeild H.264 MP4"}</span>
              <div style="display:flex;gap:6px;align-items:center;">
                <button class="btn-delete-shot" data-del-id="${clip.id}" title="Remove this scene from studio">✕ Remove</button>
                <button class="btn-add-timeline" data-add-id="${clip.id}">+ Add to Movie</button>
              </div>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  list.querySelectorAll(".shot-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.classList.contains("btn-add-timeline") || e.target.classList.contains("btn-delete-shot") || e.target.tagName === "A") return;
      const cid = card.getAttribute("data-clip-id");
      const found = state.generations.find((g) => g.id === cid);
      if (found) {
        state.activeClip = found;
        ensureClipMediaLoaded(found);
        syncNativeVideoPlayer();
        state.playheadTime = 0;
        document.getElementById("scenePromptInput").value = found.prompt;
        if (found.cameraStack && found.cameraStack.length) {
          state.cameraStack = found.cameraStack.map((c) => c.id);
          renderCameraGrid();
        }
        if (found.vfx) {
          state.selectedVfxId = found.vfx.id;
          document.getElementById("studioVfxSelect").value = found.vfx.id;
        }
        renderGallery();
      }
    });
  });

  list.querySelectorAll(".btn-delete-shot").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const clipId = btn.getAttribute("data-del-id");
      const found = state.generations.find((g) => g.id === clipId);
      const title = found ? found.prompt.slice(0, 36) : "this scene";
      if (!confirm(`Are you sure you want to remove "${title}..."?`)) return;
      await removeSceneById(clipId);
    });
  });

  list.querySelectorAll(".btn-add-timeline").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const clipId = btn.getAttribute("data-add-id");
      const res = await fetch("/api/timeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clipId, transition: "cut" })
      });
      const data = await res.json();
      if (data.timeline) {
        state.timeline = data.timeline;
        renderTimeline();
      }
    });
  });
}

function renderTimeline() {
  const track = document.getElementById("timelineTrack");
  const totalSec = state.timeline.reduce((acc, item) => acc + (item.durationSec || 5), 0);
  const mins = Math.floor(totalSec / 60);
  const secs = Math.floor(totalSec % 60);
  document.getElementById("timelineSummaryText").textContent =
    `${state.timeline.length} shots • ${mins > 0 ? `${mins}m ${secs}s` : `${secs}s`} total`;

  if (state.timeline.length === 0) {
    track.innerHTML = `<div style="color:var(--text-muted);font-size:11.5px;padding:6px;">Movie sequence empty. Click "+ Add to Movie" on any clip below, or click "Recognize Scenes & Auto-Patch Story".</div>`;
  } else {
    track.innerHTML = state.timeline
      .map((item, idx) => `
        <div class="timeline-clip-card" data-tl-clip="${item.clipId}">
          <div class="clip-head-row">
            <span class="clip-index">Scene #${idx + 1} • ${item.scriptBeatLabel ? item.scriptBeatLabel.split("•")[0].trim() : "Beat #" + (idx + 1)} (${item.durationSec >= 60 ? Math.round(item.durationSec / 60) + 'm' : item.durationSec + 's'})</span>
            <div style="display:flex;align-items:center;gap:6px;">
              <span class="clip-trans">${item.transition}</span>
              <button class="btn-remove-tl" data-remove-tl="${item.timelineId}" title="Remove from movie timeline">✕</button>
            </div>
          </div>
          <div class="clip-title-single">${item.prompt}</div>
        </div>
      `)
      .join("");
  }

  track.querySelectorAll(".timeline-clip-card").forEach((el) => {
    el.addEventListener("click", () => {
      const cid = el.getAttribute("data-tl-clip");
      const found = state.generations.find((g) => g.id === cid);
      if (found) {
        state.activeClip = found;
        ensureClipMediaLoaded(found);
        syncNativeVideoPlayer();
        state.playheadTime = 0;
        renderGallery();
      }
    });
  });

  track.querySelectorAll(".btn-remove-tl").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const tlId = btn.getAttribute("data-remove-tl");
      const res = await fetch("/api/timeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove", timelineId: tlId })
      });
      const data = await res.json();
      state.timeline = data.timeline || [];
      renderTimeline();
    });
  });

  document.getElementById("clearTimelineBtn").onclick = async () => {
    const res = await fetch("/api/timeline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "clear" })
    });
    const data = await res.json();
    state.timeline = data.timeline || [];
    renderTimeline();
  };

  document.getElementById("playFullTimelineBtn").onclick = () => {
    if (state.timeline.length === 0) return;
    let idx = 0;
    const playNext = () => {
      if (idx >= state.timeline.length) return;
      const cid = state.timeline[idx].clipId;
      const found = state.generations.find((g) => g.id === cid);
      if (found) {
        state.activeClip = found;
        ensureClipMediaLoaded(found);
        syncNativeVideoPlayer();
        state.playheadTime = 0;
        renderGallery();
      }
      idx++;
      if (idx < state.timeline.length) {
        setTimeout(playNext, 4500);
      }
    };
    playNext();
  };

  // 1-Click Script -> Full Movie (.MP4) Autonomous Director Button
  const scriptMovieBtn = document.getElementById("generateMovieFromScriptBtn");
  if (scriptMovieBtn) {
    scriptMovieBtn.onclick = async () => {
      const storyInput = document.getElementById("originalStoryInput");
      const scriptText = storyInput ? storyInput.value.trim() : "";
      if (!scriptText) return;

      scriptMovieBtn.disabled = true;
      scriptMovieBtn.textContent = "Directing Multi-Scene Movie (.MP4)...";
      const banner = document.getElementById("stitchedMovieBanner");

      try {
        const res = await fetch("/api/movie/from-script", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scriptText,
            modelId: state.selectedModelId,
            soulId: state.selectedSoulId || "soul-kaelen",
            secondarySoulId: state.selectedSecondarySoulId || "soul-elara",
            lensId: state.selectedLensId,
            lutId: state.selectedLutId,
            physicsId: state.selectedPhysicsId,
            durationPerSceneSec: state.durationSec || 60,
            apiKeys: state.apiKeys
          })
        });
        const data = await res.json();
        if (data.generations) {
          state.generations = data.generations;
          state.generations.forEach(ensureClipMediaLoaded);
        }
        if (data.timeline) {
          state.timeline = data.timeline;
        }
        if (data.clips && data.clips.length > 0) {
          state.activeClip = data.clips[0];
        }
        if (data.movie && banner) {
          const m = data.movie;
          const mMins = Math.floor(m.totalDurationSec / 60);
          const mSecs = m.totalDurationSec % 60;
          banner.classList.remove("hidden");
          banner.innerHTML = `
            <div>
              <strong style="color:var(--accent-emerald);font-size:13px;">✓ Script-to-Movie Complete (${m.clipsCount} Scenes Generated &amp; Stitched • ${mMins}m ${mSecs}s Total)</strong>
              <div style="font-size:11px;color:var(--text-secondary);">Encoded as a real multi-scene H.264 + AAC .MP4 movie with locked Character Soul ID, 180° Eyeline, Physics &amp; Master Color LUT.</div>
            </div>
            <div style="display:flex;gap:8px;">
              <button class="btn-ghost" onclick="syncNativeVideoPlayer('${m.mp4Url}', true)">Play Stitched Movie</button>
              <a href="${m.mp4Url}" download="${m.id}.mp4" class="btn-primary" style="text-decoration:none;display:inline-block;">Download Full Movie (.MP4)</a>
            </div>
          `;
          syncNativeVideoPlayer(m.mp4Url, true);
        }
        renderGallery();
        renderTimeline();
      } catch (err) {
        console.error("Script-to-movie failed:", err);
      } finally {
        scriptMovieBtn.disabled = false;
        scriptMovieBtn.textContent = "1-Click Script → Full Movie (.MP4)";
      }
    };
  }

  // Recognize Scenes & Auto-Patch Story Continuity Button
  const autoPatchBtn = document.getElementById("autoPatchStoryBtn");
  if (autoPatchBtn) {
    autoPatchBtn.onclick = async () => {
      const storyInput = document.getElementById("originalStoryInput");
      const originalStory = storyInput ? storyInput.value.trim() : "";
      const reportBox = document.getElementById("continuityReportBox");
      autoPatchBtn.disabled = true;
      autoPatchBtn.textContent = "Recognizing Scenes & Auto-Patching...";

      try {
        const res = await fetch("/api/movie/auto-patch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            originalStory,
            modelId: state.selectedModelId,
            generateBridgeClip: true,
            apiKeys: state.apiKeys
          })
        });
        const data = await res.json();
        if (data.generations) {
          state.generations = data.generations;
          state.generations.forEach(ensureClipMediaLoaded);
        }
        if (data.timeline) {
          state.timeline = data.timeline;
        }
        if (data.bridgeClip) {
          state.activeClip = data.bridgeClip;
          syncNativeVideoPlayer(null, true);
        }

        if (reportBox && data.recognizedScenes) {
          reportBox.classList.remove("hidden");
          const scenesHtml = data.recognizedScenes
            .map((s) => `<li><strong>Scene #${s.shotNumber}:</strong> Recognized <em>${s.setting}</em> (${s.lighting}) • Character: ${s.character}</li>`)
            .join("");
          const patchesHtml = (data.patchesApplied || [])
            .map((p) => `<li style="color:var(--accent-emerald);">✓ ${p}</li>`)
            .join("");
          reportBox.innerHTML = `
            <div style="font-weight:700;color:var(--accent-gold);margin-bottom:6px;">SCENE RECOGNITION &amp; STORY AUTO-PATCH COMPLETE</div>
            <ul style="margin-left:16px;margin-bottom:8px;font-size:11.5px;color:var(--text-secondary);">${scenesHtml}</ul>
            <div style="font-weight:600;margin-bottom:4px;font-size:11.5px;">Continuity Patches Applied for Original Story:</div>
            <ul style="margin-left:16px;font-size:11.5px;">${patchesHtml}</ul>
          `;
        }

        renderGallery();
        renderTimeline();
      } catch (err) {
        console.error("Auto-patch failed:", err);
      } finally {
        autoPatchBtn.disabled = false;
        autoPatchBtn.textContent = "Recognize Scenes & Auto-Patch Story";
      }
    };
  }

  // Stitch Full Movie (.MP4) Button
  const stitchBtn = document.getElementById("stitchMovieBtn");
  if (stitchBtn) {
    stitchBtn.onclick = async () => {
      stitchBtn.disabled = true;
      stitchBtn.textContent = "Stitching Full Movie (.MP4)...";
      const banner = document.getElementById("stitchedMovieBanner");

      try {
        const res = await fetch("/api/movie/stitch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "Dafeild Master Movie"
          })
        });
        const data = await res.json();
        if (data.movie && banner) {
          const m = data.movie;
          const mMins = Math.floor(m.totalDurationSec / 60);
          const mSecs = m.totalDurationSec % 60;
          banner.classList.remove("hidden");
          banner.innerHTML = `
            <div>
              <strong style="color:var(--accent-emerald);font-size:13px;">✓ Full Movie Stitched (${m.clipsCount} Scenes • ${mMins}m ${mSecs}s Total)</strong>
              <div style="font-size:11px;color:var(--text-secondary);">All scenes combined into a single multi-scene H.264 (avc1) + Stereo AAC .MP4 movie file on disk.</div>
            </div>
            <div style="display:flex;gap:8px;">
              <button class="btn-ghost" onclick="syncNativeVideoPlayer('${m.mp4Url}', true)">Play Stitched Movie</button>
              <a href="${m.mp4Url}" download="${m.id}.mp4" class="btn-primary" style="text-decoration:none;display:inline-block;">Download Full Movie (.MP4)</a>
            </div>
          `;
          syncNativeVideoPlayer(m.mp4Url, true);
        }
      } catch (err) {
        console.error("Stitch movie failed:", err);
      } finally {
        stitchBtn.disabled = false;
        stitchBtn.textContent = "Stitch Full Movie (.MP4)";
      }
    };
  }
}

// ==================== REAL AI 2.5D CINEMA VIEWPORT & WEBM RECORDER ====================
function initCinemaViewport() {
  const canvas = document.getElementById("cinemaCanvas");
  const ctx = canvas.getContext("2d");

  const playBtn = document.getElementById("playPauseBtn");
  const playIcon = document.getElementById("playIconSvg");

  function togglePlay() {
    state.isPlaying = !state.isPlaying;
    const videoEl = document.getElementById("cinemaVideoPlayer");
    if (state.isPlaying) {
      playIcon.innerHTML = `<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>`;
      if (videoEl && !videoEl.classList.contains("hidden")) {
        videoEl.play().catch(() => {});
      }
    } else {
      playIcon.innerHTML = `<polygon points="5 3 19 12 5 21 5 3"/>`;
      if (videoEl && !videoEl.classList.contains("hidden")) {
        videoEl.pause();
      }
    }
  }
  playBtn.onclick = togglePlay;

  document.getElementById("stepBackBtn").onclick = () => {
    state.playheadTime = Math.max(0, state.playheadTime - 1 / 24);
    const videoEl = document.getElementById("cinemaVideoPlayer");
    if (videoEl) videoEl.currentTime = Math.max(0, (videoEl.currentTime || 0) - 0.5);
  };
  document.getElementById("stepForwardBtn").onclick = () => {
    const dur = state.activeClip?.durationSec || state.durationSec || 5;
    state.playheadTime = Math.min(dur, state.playheadTime + 1 / 24);
    const videoEl = document.getElementById("cinemaVideoPlayer");
    if (videoEl) videoEl.currentTime = Math.min(videoEl.duration || 10, (videoEl.currentTime || 0) + 0.5);
  };

  const gridBtn = document.getElementById("toggleGridBtn");
  gridBtn.onclick = () => {
    state.showGrid = !state.showGrid;
    gridBtn.classList.toggle("active", state.showGrid);
  };

  const brushBtn = document.getElementById("toggleMotionBrushBtn");
  brushBtn.onclick = () => {
    state.motionBrushEnabled = !state.motionBrushEnabled;
    brushBtn.classList.toggle("active", state.motionBrushEnabled);
  };

  canvas.addEventListener("mousedown", (e) => {
    if (!state.motionBrushEnabled) return;
    state.isDrawingBrush = true;
    state.motionTrajectory = [];
    const rect = canvas.getBoundingClientRect();
    state.motionTrajectory.push({
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height
    });
  });

  canvas.addEventListener("mousemove", (e) => {
    if (!state.isDrawingBrush || !state.motionBrushEnabled) return;
    const rect = canvas.getBoundingClientRect();
    state.motionTrajectory.push({
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height
    });
  });

  window.addEventListener("mouseup", () => {
    state.isDrawingBrush = false;
  });

  // Direct .MP4 Download + Optional Live Canvas Capture
  const exportWebmBtn = document.getElementById("exportWebmBtn");
  exportWebmBtn.onclick = () => {
    const clip = state.activeClip;
    if (clip && (clip.mp4Url || clip.videoUrl)) {
      const a = document.createElement("a");
      a.href = clip.mp4Url || clip.videoUrl;
      a.download = `${clip.id}.mp4`;
      a.click();
      return;
    }
    if (!canvas.captureStream) return;
    exportWebmBtn.disabled = true;
    exportWebmBtn.querySelector("span").textContent = "Saving MP4...";
    const mime = MediaRecorder.isTypeSupported("video/mp4") ? "video/mp4" : "video/webm";
    const stream = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream, { mimeType: mime });
    const chunks = [];
    recorder.ondataavailable = (ev) => {
      if (ev.data.size > 0) chunks.push(ev.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const clipId = state.activeClip?.id || "dafeild-scene";
      a.download = `${clipId}.mp4`;
      a.click();
      exportWebmBtn.disabled = false;
      exportWebmBtn.querySelector("span").textContent = "Download .MP4";
    };
    recorder.start();
    setTimeout(() => recorder.stop(), 4000);
  };

  const particles = Array.from({ length: 75 }, (_, i) => ({
    x: (Math.sin(i * 77.7) * 0.5 + 0.5) * 960,
    y: (Math.cos(i * 33.3) * 0.5 + 0.5) * 500,
    z: (i % 6) * 0.18 + 0.2,
    size: (i % 3) + 1.2
  }));

  let lastTs = performance.now();

  function renderCinemaFrame(now) {
    const dt = (now - lastTs) / 1000;
    lastTs = now;

    const clip = state.activeClip;
    const duration = clip?.durationSec || state.durationSec || 5;

    if (state.isPlaying) {
      state.playheadTime = (state.playheadTime + dt) % duration;
    }

    // Use a 6-second kinetic motion cycle so camera sweeps & VFX particles move dynamically even on 300s (5-min) shots!
    const progress = (state.playheadTime % 6) / 6;
    const smoothP = 0.5 - 0.5 * Math.cos(progress * Math.PI * 2);

    // Stacked Camera Movement Vector Math
    const activeCams = state.cameraStack
      .map((cid) => state.cameraPresets.find((c) => c.id === cid))
      .filter(Boolean);

    let camX = 0,
      camY = 0,
      camZoom = 1.08, // Slight overscan so pans/rotations never show empty edges
      camRot = 0;

    const intensity = state.cameraIntensity || 0.85;
    activeCams.forEach((c) => {
      camX += (c.vec.x || 0) * smoothP * 72 * intensity;
      camY += (c.vec.y || 0) * smoothP * 44 * intensity;
      camZoom += (c.vec.z || 0) * smoothP * 0.26 * intensity;
      camRot += (c.vec.rot || 0) * Math.sin(progress * Math.PI) * intensity;
    });

    // Organic handheld breathing if handheld preset is active
    if (state.cameraStack.includes("handheld-doc")) {
      camX += Math.sin(now * 0.005) * 6 * intensity;
      camY += Math.cos(now * 0.007) * 5 * intensity;
      camRot += Math.sin(now * 0.004) * 0.8 * intensity;
    }

    camZoom = Math.max(0.85, Math.min(2.35, camZoom));

    const W = canvas.width;
    const H = canvas.height;
    ctx.save();
    ctx.clearRect(0, 0, W, H);

    // Check if we have a real cloud MP4 video or real AI-generated photorealistic frame for this clip!
    const realVideoEl = clip && state.loadedVideos[clip.id];
    const realAiImg = (clip && state.loadedImages[clip.id]) || state.keyframeImage;

    // Apply Physical Camera Rig Transform (Gimbal Pivot)
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate((camRot * Math.PI) / 180);
    ctx.scale(camZoom, camZoom);
    ctx.translate(-W / 2 - camX, -H / 2 + camY);

    if (realVideoEl && realVideoEl.readyState >= 2) {
      // Draw real cloud-generated MP4 video
      ctx.drawImage(realVideoEl, -40, -25, W + 80, H + 50);
    } else if (realAiImg) {
      // Draw REAL AI-Generated Photorealistic Frame with 2.5D Multi-Layer Parallax!
      ctx.drawImage(realAiImg, -60, -35, W + 120, H + 70);

      // Subtle foreground depth-of-field parallax layer for 3D stereo feel
      if (state.cameraStack.includes("orbit-360") || state.cameraStack.includes("dolly-in") || state.cameraStack.includes("fpv-drone")) {
        ctx.save();
        ctx.globalAlpha = 0.16;
        ctx.translate(camX * 0.35, -camY * 0.25);
        ctx.scale(1.04, 1.04);
        ctx.drawImage(realAiImg, -60, -35, W + 120, H + 70);
        ctx.restore();
      }
    } else {
      // Loading indicator while real AI frame is being fetched from Flux API
      const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
      skyGrad.addColorStop(0, "#090b10");
      skyGrad.addColorStop(1, "#121722");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(-200, -200, W + 400, H + 400);

      ctx.fillStyle = "rgba(245, 158, 11, 0.9)";
      ctx.font = "600 13px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText("FETCHING REAL AI FRAME FROM FLUX ENGINE...", W / 2, H / 2);
      ctx.textAlign = "left";
    }

    // ReelMagic VFX Overlay Layer (Particles / Rain / Embers / Gold / Lightning)
    const vfxId = state.selectedVfxId || "none";
    if (vfxId !== "none") {
      particles.forEach((p, idx) => {
        const px = (p.x - camX * p.z + progress * 90 * p.z + W) % W;
        const py = (p.y + camY * p.z + H) % H;

        if (vfxId === "ember-storm") {
          ctx.fillStyle = idx % 2 === 0 ? "rgba(249, 115, 22, 0.85)" : "rgba(250, 204, 21, 0.85)";
          ctx.beginPath();
          ctx.arc(px, H - ((py + progress * 220) % H), p.size * 1.8, 0, Math.PI * 2);
          ctx.fill();
        } else if (vfxId === "liquid-gold") {
          ctx.fillStyle = "rgba(251, 191, 36, 0.7)";
          ctx.beginPath();
          ctx.arc(
            W / 2 + Math.cos(progress * Math.PI * 2 + idx) * 140,
            H / 2 + Math.sin(progress * Math.PI * 4 + idx) * 75,
            (idx % 4) + 1.8,
            0,
            Math.PI * 2
          );
          ctx.fill();
        } else if (vfxId === "zero-g-rain") {
          ctx.strokeStyle = "rgba(186, 230, 253, 0.55)";
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px - 2, py + 12);
          ctx.stroke();
        } else if (vfxId === "cyber-glitch" && Math.sin(now * 0.018 + idx) > 0.92) {
          ctx.fillStyle = "rgba(6, 182, 212, 0.18)";
          ctx.fillRect(px - 40, py, 85, 3);
        }
      });

      if (vfxId === "lightning-arc") {
        ctx.strokeStyle = "rgba(147, 197, 253, 0.85)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(W / 2, 40);
        for (let s = 1; s <= 6; s++) {
          ctx.lineTo(W / 2 + Math.sin(now * 0.06 + s * 10) * 75, 40 + s * 55);
        }
        ctx.stroke();
      }
    }

    // Cooke Anamorphic Optical Streak Flare
    if (state.selectedLensId === "cooke-anamorphic") {
      const flareY = H * 0.42;
      const streakGrad = ctx.createLinearGradient(0, flareY, W, flareY);
      streakGrad.addColorStop(0, "transparent");
      streakGrad.addColorStop(0.5, "rgba(56, 189, 248, 0.22)");
      streakGrad.addColorStop(1, "transparent");
      ctx.fillStyle = streakGrad;
      ctx.fillRect(0, flareY - 3, W, 6);
    }

    ctx.restore(); // End Camera Gimbal Transform

    // User Motion Brush Vector Overlay
    if (state.motionTrajectory.length > 1) {
      ctx.save();
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 2.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      state.motionTrajectory.forEach((pt, i) => {
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();
      ctx.restore();
    }

    // Viewfinder Rule of Thirds Framing Grid
    if (state.showGrid) {
      ctx.save();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(W / 3, 0); ctx.lineTo(W / 3, H);
      ctx.moveTo((2 * W) / 3, 0); ctx.lineTo((2 * W) / 3, H);
      ctx.moveTo(0, H / 3); ctx.lineTo(W, H / 3);
      ctx.moveTo(0, (2 * H) / 3); ctx.lineTo(W, (2 * H) / 3);
      ctx.stroke();

      ctx.strokeStyle = "rgba(245, 158, 11, 0.32)";
      ctx.beginPath();
      ctx.moveTo(W / 2 - 10, H / 2); ctx.lineTo(W / 2 + 10, H / 2);
      ctx.moveTo(W / 2, H / 2 - 10); ctx.lineTo(W / 2, H / 2 + 10);
      ctx.stroke();
      ctx.restore();
    }

    // 2.39:1 CinemaScope Letterbox Matte
    if (state.aspectRatio === "2.39:1") {
      ctx.fillStyle = "#020306";
      ctx.fillRect(0, 0, W, 36);
      ctx.fillRect(0, H - 36, W, 36);
    }

    // Spoken Dialogue Subtitle + Audio Waveform Visualizer
    const line = clip?.dialogueText || document.getElementById("dialogueTextInput")?.value;
    if (line && (state.isSpeakingLipSync || state.generationMode === "lip-sync")) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.76)";
      ctx.fillRect(W / 2 - 220, H - 72, 440, 28);
      ctx.fillStyle = "#fef08a";
      ctx.font = "600 12.5px 'Plus Jakarta Sans', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`"${line}"`, W / 2, H - 54);
      ctx.textAlign = "left";
    }

    ctx.restore();

    // Update SMPTE Timecode HUD (Supports up to 05:00 / 300s)
    const totalSec = Math.floor(state.playheadTime);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    const durMins = Math.floor(duration / 60);
    const durSecs = Math.floor(duration % 60);
    const pad = (n) => String(n).padStart(2, "0");
    document.getElementById("timecodeDisplay").textContent =
      `00:${pad(mins)}:${pad(secs)} / 00:${pad(durMins)}:${pad(durSecs)}`;

    requestAnimationFrame(renderCinemaFrame);
  }

  requestAnimationFrame(renderCinemaFrame);
}

// ==================== KEYBOARD SHORTCUTS ====================
function initKeyboardShortcuts() {
  const promptInput = document.getElementById("scenePromptInput");
  if (promptInput) {
    promptInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        executeRenderScene();
      }
    });
  }

  const storyInput = document.getElementById("originalStoryInput");
  if (storyInput) {
    storyInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const scriptBtn = document.getElementById("generateMovieFromScriptBtn");
        if (scriptBtn) scriptBtn.click();
      }
    });
  }

  window.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      executeRenderScene();
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      const tag = (e.target && e.target.tagName) || "";
      const id = (e.target && e.target.id) || "";
      if (id === "originalStoryInput") {
        e.preventDefault();
        const scriptBtn = document.getElementById("generateMovieFromScriptBtn");
        if (scriptBtn) scriptBtn.click();
        return;
      }
      if (id === "scenePromptInput" || (tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "BUTTON" && tag !== "SELECT")) {
        const directorTab = document.getElementById("tab-director");
        if (directorTab && directorTab.classList.contains("active")) {
          e.preventDefault();
          executeRenderScene();
          return;
        }
      }
    }
    if (e.key === " " && e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA") {
      e.preventDefault();
      state.isPlaying = !state.isPlaying;
    }
    if (e.key === "ArrowLeft" && e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA") {
      state.playheadTime = Math.max(0, state.playheadTime - 1 / 24);
    }
    if (e.key === "ArrowRight" && e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA") {
      const dur = state.activeClip?.durationSec || state.durationSec || 5;
      state.playheadTime = Math.min(dur, state.playheadTime + 1 / 24);
    }
  });
}

// ==================== TAB 2: MODEL ROUTER MATRIX ====================
function renderModelsMatrix(tierFilter = "all") {
  const grid = document.getElementById("modelsCatalogGrid");
  const filtered =
    tierFilter === "all"
      ? state.models
      : tierFilter === "higgsfield" || tierFilter === "movie-platform"
      ? state.models.filter((m) => m.platformGroup === tierFilter)
      : state.models.filter((m) => m.tier === tierFilter);

  grid.innerHTML = filtered
    .map((m) => {
      const isFree = m.costPerClipUsd === 0;
      const priceNum = isFree ? "$0.00" : `$${m.costPerClipUsd.toFixed(2)}`;
      const isAct = m.id === state.selectedModelId;

      return `
        <div class="matrix-model-card">
          <div>
            <div class="matrix-head">
              <div>
                <h3 class="matrix-model-title">${m.name}</h3>
                <span class="matrix-provider-tag">${m.provider} • ${m.license}</span>
              </div>
              <div>
                <strong class="matrix-price-num" style="color:${isFree ? 'var(--accent-emerald)' : 'var(--accent-gold)'}">${priceNum}</strong>
                <span style="font-size:10px;color:var(--text-tertiary);">per clip</span>
              </div>
            </div>

            <div class="matrix-badges-row">
              ${(m.badges || []).map((b) => `<span class="shot-tag">${b}</span>`).join("")}
            </div>

            <p class="matrix-desc">${m.description}</p>
          </div>

          <div>
            <div class="matrix-specs-grid" style="margin-bottom:12px;">
              <div><span>Max Res</span><strong>${m.maxResolution.split(" ")[0]}</strong></div>
              <div><span>Latency</span><strong>~${m.speedSec}s</strong></div>
              <div><span>VRAM</span><strong>${m.vramRequired.split(" ")[0]}</strong></div>
            </div>

            <button class="btn-primary full-width select-matrix-btn" data-model="${m.id}">
              ${isAct ? "✓ Active Engine in Studio" : "Deploy in Cinema Studio"}
            </button>
          </div>
        </div>
      `;
    })
    .join("");

  grid.querySelectorAll(".select-matrix-btn").forEach((btn) => {
    btn.onclick = () => {
      state.selectedModelId = btn.getAttribute("data-model");
      state.freeOnly = false;
      document.getElementById("freeOnlyToggle").checked = false;
      bindDirectorControls();
      document.querySelector('.nav-tab[data-tab="director"]').click();
    };
  });

  document.querySelectorAll(".tier-pill").forEach((pill) => {
    pill.onclick = () => {
      document.querySelectorAll(".tier-pill").forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      renderModelsMatrix(pill.getAttribute("data-tier"));
    };
  });

  // Bind 1-Click Quick Import Model Chips
  document.querySelectorAll(".quick-import-model-chip").forEach((chip) => {
    chip.onclick = async () => {
      const name = chip.getAttribute("data-name");
      const provider = chip.getAttribute("data-provider");
      const platformGroup = chip.getAttribute("data-group") || "movie-platform";
      const hfRepo = chip.getAttribute("data-repo") || "";
      await importNewModelToStudio({ name, provider, platformGroup, hfRepo });
    };
  });

  // Bind Custom Model Import Form
  const importForm = document.getElementById("importModelForm");
  if (importForm) {
    importForm.onsubmit = async (e) => {
      e.preventDefault();
      const name = document.getElementById("importModelName").value.trim();
      const platformGroup = document.getElementById("importModelGroup").value;
      const hfRepo = document.getElementById("importModelRepo").value.trim();
      if (!name) return;
      await importNewModelToStudio({
        name,
        provider: platformGroup === "higgsfield" ? "Higgsfield AI Cinema" : "Movie Platform Router",
        platformGroup,
        hfRepo
      });
      importForm.reset();
    };
  }
}

async function importNewModelToStudio(payload) {
  try {
    const res = await fetch("/api/models", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.models) {
      state.models = data.models;
      if (data.model) {
        state.selectedModelId = data.model.id;
      }
      state.freeOnly = false;
      const freeToggle = document.getElementById("freeOnlyToggle");
      if (freeToggle) freeToggle.checked = false;
      bindDirectorControls();
      renderModelsMatrix("all");
    }
  } catch (err) {
    console.error("Failed to import model:", err);
  }
}

function initCostCalculator() {
  const slider = document.getElementById("calcClipsSlider");
  const countEl = document.getElementById("calcClipsCount");
  const cheapEl = document.getElementById("calcCheapTotal");
  const legacyEl = document.getElementById("calcLegacyTotal");

  slider.oninput = (e) => {
    const n = Number(e.target.value);
    countEl.textContent = `${n} shots`;
    cheapEl.textContent = `$${(n * 0.05).toFixed(2)}`;
    legacyEl.textContent = `$${(n * 1.2).toFixed(2)}`;
  };
}

// ==================== TAB 3: SOUL ID DOSSIER ====================
function renderSoulVault() {
  const grid = document.getElementById("soulVaultGrid");
  grid.innerHTML = state.soulIds
    .map((s) => `
      <div class="soul-dossier-card" style="--soul-color:${s.avatarColor}">
        <div class="soul-card-head">
          <div>
            <h4 class="soul-name-title">🧬 ${s.name}</h4>
            <span class="soul-seed-code">${s.role} • SEED: ${s.seed}</span>
          </div>
          <span class="soul-lock-pill">Lock ${Math.round(s.consistencyWeight * 100)}%</span>
        </div>

        <p class="soul-prompt-box">${s.appearancePrompt}</p>

        <div class="soul-tags-cluster">
          ${(s.referenceTags || []).map((t) => `<span class="shot-tag">${t}</span>`).join("")}
        </div>

        <div class="soul-foot-actions">
          <button class="btn-secondary select-soul-btn" data-soul="${s.id}">Lock in Cinema Rig</button>
          <button class="btn-text-action del-soul-btn" data-del="${s.id}" style="color:var(--accent-ruby)">Delete Profile</button>
        </div>
      </div>
    `)
    .join("");

  grid.querySelectorAll(".select-soul-btn").forEach((btn) => {
    btn.onclick = () => {
      state.selectedSoulId = btn.getAttribute("data-soul");
      refreshSoulDropdown();
      document.querySelector('.nav-tab[data-tab="director"]').click();
    };
  });

  grid.querySelectorAll(".del-soul-btn").forEach((btn) => {
    btn.onclick = async () => {
      const id = btn.getAttribute("data-del");
      const res = await fetch(`/api/soul-id/${id}`, { method: "DELETE" });
      const data = await res.json();
      state.soulIds = data.soulIds || [];
      refreshSoulDropdown();
      renderSoulVault();
    };
  });

  const weightSlider = document.getElementById("soulWeightInput");
  const weightVal = document.getElementById("soulWeightVal");
  weightSlider.oninput = (e) => { weightVal.textContent = e.target.value; };

  const form = document.getElementById("createSoulForm");
  form.onsubmit = async (e) => {
    e.preventDefault();
    const name = document.getElementById("soulNameInput").value;
    const role = document.getElementById("soulRoleInput").value;
    const appearancePrompt = document.getElementById("soulAppearanceInput").value;
    const consistencyWeight = Number(document.getElementById("soulWeightInput").value);
    const avatarColor = document.getElementById("soulColorInput").value;

    const res = await fetch("/api/soul-id", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, role, appearancePrompt, consistencyWeight, avatarColor })
    });
    const data = await res.json();
    if (data.soulIds) {
      state.soulIds = data.soulIds;
      state.selectedSoulId = data.soul.id;
      form.reset();
      refreshSoulDropdown();
      renderSoulVault();
    }
  };
}

// ==================== TAB 4: MCP PROTOCOL HUB ====================
function renderMcpHub() {
  const toolSelect = document.getElementById("mcpToolSelect");
  const argsBox = document.getElementById("mcpArgsTextarea");
  const outputPre = document.getElementById("mcpResponseOutput");

  const samplePayloads = {
    generate_ai_video: {
      prompt: "Orbiting shot of Kaelen standing on a neon rooftop in rain as drones fly past",
      generationMode: "text-to-video",
      modelId: "wan-2.1-free-1.3b",
      cameraStack: ["dolly-in", "orbit-360"],
      cameraIntensity: 0.9,
      lensId: "cooke-anamorphic",
      vfxId: "cyber-glitch",
      soulId: "soul-kaelen",
      dialogueText: "They never saw us coming.",
      durationSec: 5
    },
    list_video_models: { tier: "free", maxCostUsd: 0.05 },
    manage_soul_id: { action: "list" },
    list_camera_and_optics_presets: {},
    estimate_project_cost: { numClips: 25, modelId: "wan-2.2-14b-cheap" },
    add_clip_to_timeline: { clipId: "clip-demo-1", transition: "cut" },
    export_comfyui_workflow: {
      prompt: "Cyberpunk rain-slicked alley in Neo-Tokyo",
      modelId: "wan-2.1-free-1.3b",
      cameraStack: ["dolly-in", "orbit-360"],
      lensId: "cooke-anamorphic",
      soulId: "soul-kaelen"
    }
  };

  toolSelect.innerHTML = state.mcpTools
    .map((t) => `<option value="${t.name}">${t.name} — ${t.description.slice(0, 68)}...</option>`)
    .join("");

  function updateTemplate() {
    const t = toolSelect.value;
    argsBox.value = JSON.stringify(samplePayloads[t] || {}, null, 2);
  }
  toolSelect.onchange = updateTemplate;
  updateTemplate();

  document.getElementById("runMcpToolBtn").onclick = async () => {
    let parsed = {};
    try {
      parsed = JSON.parse(argsBox.value || "{}");
    } catch (e) {
      outputPre.textContent = "Error: Invalid JSON arguments: " + e.message;
      return;
    }

    outputPre.textContent = "Dispatching live JSON-RPC 2.0 call to MCP Server...";
    const res = await fetch("/api/mcp/rpc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now(),
        method: "tools/call",
        params: { name: toolSelect.value, arguments: parsed }
      })
    });
    const data = await res.json();
    outputPre.textContent = JSON.stringify(data, null, 2);

    const catRes = await fetch("/api/catalog");
    const catData = await catRes.json();
    state.generations = catData.generations || [];
    state.generations.forEach(ensureClipMediaLoaded);
    state.soulIds = catData.soulIds || [];
    state.timeline = catData.timeline || [];
    renderGallery();
    renderTimeline();
    renderSoulVault();
  };

  document.getElementById("listMcpResourcesBtn").onclick = async () => {
    const res = await fetch("/api/mcp/rpc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method: "resources/list", params: {} })
    });
    const data = await res.json();
    outputPre.textContent = JSON.stringify(data, null, 2);
  };

  const configSnippet = {
    mcpServers: {
      "dafeild-video-studio": {
        command: "node",
        args: [state.mcpServerConfigPath]
      }
    }
  };
  document.getElementById("mcpConfigSnippet").textContent = JSON.stringify(configSnippet, null, 2);
  document.getElementById("copyMcpConfigBtn").onclick = () => {
    navigator.clipboard.writeText(JSON.stringify(configSnippet, null, 2));
    const btn = document.getElementById("copyMcpConfigBtn");
    btn.textContent = "✓ Copied to Clipboard!";
    setTimeout(() => { btn.textContent = "Copy Configuration JSON"; }, 2000);
  };

  renderConnectedMcp();

  document.getElementById("connectExternalMcpForm").onsubmit = async (e) => {
    e.preventDefault();
    const name = document.getElementById("extMcpName").value;
    const endpoint = document.getElementById("extMcpUrl").value;
    const res = await fetch("/api/mcp/servers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, endpoint })
    });
    const data = await res.json();
    state.connectedMcpServers = data.connectedMcpServers || [];
    document.getElementById("connectExternalMcpForm").reset();
    renderConnectedMcp();
  };
}

function renderConnectedMcp() {
  const box = document.getElementById("connectedMcpServersList");
  box.innerHTML = state.connectedMcpServers
    .map((s) => {
      const ok = s.verified !== false && s.status === "connected";
      return `
        <div class="connected-item">
          <div>
            <strong style="color:var(--text-primary)">${s.name}</strong>
            <div style="font-size:10.5px;color:var(--text-tertiary);font-family:var(--font-mono);">${s.endpoint}</div>
            ${s.error ? `<div style="font-size:10px;color:var(--accent-ruby);">Probe: ${s.error}</div>` : ""}
          </div>
          <span class="shot-tag" style="color:${ok ? 'var(--accent-emerald)' : 'var(--accent-gold)'}">
            ${ok ? `Verified (${s.toolsCount || 0} tools)` : "Unverified"}
          </span>
        </div>
      `;
    })
    .join("");
}

// ==================== MODAL: HARDWARE & API KEYS ====================
function updateInlineTokenStatusUI() {
  const badge = document.getElementById("inlineTokenStatusBadge");
  const quickInput = document.getElementById("inlineQuickTokenInput");
  if (!badge) return;
  const hasHf = Boolean(state.apiKeys.hfToken);
  const hasGem = Boolean(state.apiKeys.geminiKey);
  const hasFal = Boolean(state.apiKeys.falKey);
  const hasOpenai = Boolean(state.apiKeys.openaiKey);
  const hasRunway = Boolean(state.apiKeys.runwayKey);
  const hasRep = Boolean(state.apiKeys.replicateKey);

  if (hasHf || hasGem || hasFal || hasOpenai || hasRunway || hasRep) {
    const activeList = [
      hasHf ? "HF ZeroGPU (25x Quota)" : null,
      hasGem ? "Gemini/Veo" : null,
      hasFal ? "Fal Cloud GPU" : null,
      hasOpenai ? "OpenAI Sora" : null,
      hasRunway ? "Runway Gen-4" : null,
      hasRep ? "Replicate" : null
    ].filter(Boolean).join(" + ");
    badge.textContent = `✓ Active: ${activeList}`;
    badge.style.background = "rgba(16,185,129,0.2)";
    badge.style.color = "#34d399";
    if (quickInput && !quickInput.value) {
      quickInput.value =
        state.apiKeys.hfToken ||
        state.apiKeys.geminiKey ||
        state.apiKeys.falKey ||
        state.apiKeys.openaiKey ||
        state.apiKeys.runwayKey ||
        state.apiKeys.replicateKey ||
        "";
    }
  } else {
    badge.textContent = "No token saved (Anonymous 60s/day)";
    badge.style.background = "rgba(255,255,255,0.06)";
    badge.style.color = "var(--text-tertiary)";
  }
}

function saveQuickInlineToken() {
  const quickInput = document.getElementById("inlineQuickTokenInput");
  if (!quickInput) return;
  const raw = quickInput.value.trim();
  if (!raw) return;

  // Auto-detect token type by prefix so user can drop any key in one box
  if (raw.startsWith("hf_")) {
    state.apiKeys.hfToken = raw;
  } else if (raw.startsWith("AIza")) {
    state.apiKeys.geminiKey = raw;
  } else if (raw.startsWith("sk-")) {
    state.apiKeys.openaiKey = raw;
  } else if (raw.startsWith("r8_")) {
    state.apiKeys.replicateKey = raw;
  } else if (raw.startsWith("key_")) {
    state.apiKeys.runwayKey = raw;
  } else if (raw.includes(":") && raw.length > 24) {
    state.apiKeys.falKey = raw;
  } else {
    // Default to HuggingFace token if not matching other prefixes
    state.apiKeys.hfToken = raw;
  }

  localStorage.setItem("dafeild_api_keys", JSON.stringify(state.apiKeys));
  updateInlineTokenStatusUI();

  const btn = document.getElementById("inlineSaveTokenBtn");
  if (btn) {
    const prev = btn.textContent;
    btn.textContent = "✓ Saved!";
    setTimeout(() => { btn.textContent = prev; }, 1800);
  }
}

function initApiKeysModal() {
  const modal = document.getElementById("apiKeysModal");
  updateInlineTokenStatusUI();

  const inlineSaveBtn = document.getElementById("inlineSaveTokenBtn");
  if (inlineSaveBtn) {
    inlineSaveBtn.onclick = saveQuickInlineToken;
  }
  const inlineInput = document.getElementById("inlineQuickTokenInput");
  if (inlineInput) {
    inlineInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        saveQuickInlineToken();
      }
    });
  }

  document.getElementById("openApiKeysBtn").onclick = () => {
    const gemInput = document.getElementById("geminiKeyInput");
    if (gemInput) gemInput.value = state.apiKeys.geminiKey || "";
    document.getElementById("hfTokenInput").value = state.apiKeys.hfToken || "";
    document.getElementById("falKeyInput").value = state.apiKeys.falKey || "";
    const openaiInput = document.getElementById("openaiKeyInput");
    if (openaiInput) openaiInput.value = state.apiKeys.openaiKey || "";
    const runwayInput = document.getElementById("runwayKeyInput");
    if (runwayInput) runwayInput.value = state.apiKeys.runwayKey || "";
    const repInput = document.getElementById("replicateKeyInput");
    if (repInput) repInput.value = state.apiKeys.replicateKey || "";
    document.getElementById("comfyUrlInput").value = state.apiKeys.comfyUrl || "";
    modal.classList.remove("hidden");
  };
  document.getElementById("closeApiKeysBtn").onclick = () => modal.classList.add("hidden");
  document.getElementById("saveApiKeysBtn").onclick = () => {
    const gemInput = document.getElementById("geminiKeyInput");
    const openaiInput = document.getElementById("openaiKeyInput");
    const runwayInput = document.getElementById("runwayKeyInput");
    const repInput = document.getElementById("replicateKeyInput");
    state.apiKeys = {
      geminiKey: gemInput ? gemInput.value.trim() : "",
      hfToken: document.getElementById("hfTokenInput").value.trim(),
      falKey: document.getElementById("falKeyInput").value.trim(),
      openaiKey: openaiInput ? openaiInput.value.trim() : "",
      runwayKey: runwayInput ? runwayInput.value.trim() : "",
      replicateKey: repInput ? repInput.value.trim() : "",
      comfyUrl: document.getElementById("comfyUrlInput").value.trim()
    };
    localStorage.setItem("dafeild_api_keys", JSON.stringify(state.apiKeys));
    updateInlineTokenStatusUI();
    modal.classList.add("hidden");
  };
}

// ==================== 3D CAMERA TRAJECTORY GIZMO ====================
function initCamera3dGizmo() {
  const canvas = document.getElementById("camera3dGizmoCanvas");
  const telemetry = document.getElementById("gizmoTelemetryText");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const camState = {
    start: { x: -1.1, y: 0.45, z: 1.5 },
    end: { x: 0.9, y: 0.75, z: 0.7 },
    dragging: null
  };

  function project3D(p) {
    const yaw = 0.48;
    const pitch = 0.34;
    const x1 = p.x * Math.cos(yaw) - p.z * Math.sin(yaw);
    const z1 = p.x * Math.sin(yaw) + p.z * Math.cos(yaw);
    const y2 = p.y * Math.cos(pitch) - z1 * Math.sin(pitch);
    const z2 = p.y * Math.sin(pitch) + z1 * Math.cos(pitch) + 3.4;
    const scale = 210 / Math.max(0.8, z2);
    return {
      sx: canvas.width / 2 + x1 * scale,
      sy: canvas.height / 2 + 12 - y2 * scale,
      depth: z2
    };
  }

  function applyTrajectoryToRig() {
    const dx = camState.end.x - camState.start.x;
    const dy = camState.end.y - camState.start.y;
    const dz = camState.end.z - camState.start.z;
    const azDeg = Math.round(Math.atan2(dx, dz || 0.01) * (180 / Math.PI));
    const elDeg = Math.round(dy * 45);
    const dolly = Number((-dz).toFixed(2));

    if (telemetry) {
      telemetry.textContent = `Start -> End • Azimuth ${azDeg}° • Elev ${elDeg}° • Dolly ${dolly >= 0 ? "+" : ""}${dolly}`;
    }

    const nextStack = [];
    if (dolly > 0.25) nextStack.push("dolly-in");
    else if (dolly < -0.25) nextStack.push("dolly-out");
    if (Math.abs(azDeg) > 35) nextStack.push("orbit-360");
    if (elDeg > 15) nextStack.push("crane-up");
    if (nextStack.length === 0) nextStack.push("static-tripod");

    state.cameraStack = nextStack.slice(0, 3);
    state.motionTrajectory = { start: { ...camState.start }, end: { ...camState.end }, azDeg, elDeg, dolly };
    if (typeof renderCameraGrid === "function") renderCameraGrid();
    if (typeof updateStreamTicker === "function") updateStreamTicker();
  }

  function drawGizmo() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw 3D ground grid
    ctx.strokeStyle = "rgba(148, 163, 184, 0.16)";
    ctx.lineWidth = 1;
    for (let i = -2; i <= 2; i++) {
      const a = project3D({ x: i * 0.7, y: 0, z: -1.4 });
      const b = project3D({ x: i * 0.7, y: 0, z: 1.4 });
      ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy); ctx.stroke();

      const c = project3D({ x: -1.4, y: 0, z: i * 0.7 });
      const d = project3D({ x: 1.4, y: 0, z: i * 0.7 });
      ctx.beginPath(); ctx.moveTo(c.sx, c.sy); ctx.lineTo(d.sx, d.sy); ctx.stroke();
    }

    // Subject focal cube at origin
    const origin = project3D({ x: 0, y: 0.2, z: 0 });
    ctx.fillStyle = "rgba(245, 158, 11, 0.22)";
    ctx.strokeStyle = "rgba(251, 191, 36, 0.85)";
    ctx.beginPath();
    ctx.arc(origin.sx, origin.sy, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fde68a";
    ctx.font = "600 10px monospace";
    ctx.fillText("SUBJECT", origin.sx - 20, origin.sy + 19);

    const pStart = project3D(camState.start);
    const pEnd = project3D(camState.end);

    // Trajectory arc
    ctx.strokeStyle = "#34d399";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(pStart.sx, pStart.sy);
    ctx.quadraticCurveTo(origin.sx, Math.min(pStart.sy, pEnd.sy) - 24, pEnd.sx, pEnd.sy);
    ctx.stroke();
    ctx.setLineDash([]);

    // Sightlines to subject
    ctx.strokeStyle = "rgba(34, 211, 238, 0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pStart.sx, pStart.sy); ctx.lineTo(origin.sx, origin.sy); ctx.stroke();
    ctx.strokeStyle = "rgba(251, 191, 36, 0.35)";
    ctx.beginPath(); ctx.moveTo(pEnd.sx, pEnd.sy); ctx.lineTo(origin.sx, origin.sy); ctx.stroke();

    // Handles
    [
      { pt: pStart, color: "#22d3ee", label: "START" },
      { pt: pEnd, color: "#fbbf24", label: "END" }
    ].forEach(({ pt, color, label }) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(pt.sx, pt.sy, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#06070a";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.font = "700 10px monospace";
      ctx.fillText(label, pt.sx - 14, pt.sy - 11);
    });
  }

  function canvasPos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height
    };
  }

  canvas.addEventListener("pointerdown", (e) => {
    const pos = canvasPos(e);
    const pStart = project3D(camState.start);
    const pEnd = project3D(camState.end);
    const dStart = Math.hypot(pos.x - pStart.sx, pos.y - pStart.sy);
    const dEnd = Math.hypot(pos.x - pEnd.sx, pos.y - pEnd.sy);
    if (dStart < 22) camState.dragging = "start";
    else if (dEnd < 22) camState.dragging = "end";
    if (camState.dragging) canvas.setPointerCapture(e.pointerId);
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!camState.dragging) return;
    const pos = canvasPos(e);
    const target = camState[camState.dragging];
    target.x = Math.max(-1.6, Math.min(1.6, ((pos.x - canvas.width / 2) / 95)));
    target.y = Math.max(0.05, Math.min(1.6, ((canvas.height / 2 + 12 - pos.y) / 75)));
    target.z = Math.max(-1.4, Math.min(1.8, target.z));
    drawGizmo();
    applyTrajectoryToRig();
  });

  const endDrag = () => { camState.dragging = null; };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  document.querySelectorAll(".btn-gizmo-path").forEach((btn) => {
    btn.addEventListener("click", () => {
      const mode = btn.getAttribute("data-gizmo-path");
      if (mode === "dolly-in") {
        camState.start = { x: 0, y: 0.4, z: 1.7 };
        camState.end = { x: 0, y: 0.4, z: 0.4 };
      } else if (mode === "orbit-360") {
        camState.start = { x: -1.3, y: 0.5, z: 1.0 };
        camState.end = { x: 1.3, y: 0.5, z: 1.0 };
      } else if (mode === "crane-up") {
        camState.start = { x: 0.2, y: 0.15, z: 1.3 };
        camState.end = { x: 0.2, y: 1.35, z: 0.9 };
      }
      drawGizmo();
      applyTrajectoryToRig();
    });
  });

  // Higgsfield 360° Angle Compass Buttons
  document.querySelectorAll(".btn-angle-chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".btn-angle-chip").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const angle = btn.getAttribute("data-angle");
      state.selectedAngle = angle;
      if (angle === "front") {
        camState.start = { x: 0, y: 0.35, z: 1.6 };
        camState.end = { x: 0, y: 0.35, z: 0.8 };
      } else if (angle === "profile") {
        camState.start = { x: 1.5, y: 0.4, z: 0.1 };
        camState.end = { x: 0.9, y: 0.4, z: 0.1 };
      } else if (angle === "hero") {
        camState.start = { x: 1.1, y: 0.15, z: 1.1 };
        camState.end = { x: 0.7, y: 0.25, z: 0.7 };
      } else if (angle === "back") {
        camState.start = { x: 0, y: 0.45, z: -1.5 };
        camState.end = { x: 0, y: 0.45, z: -0.7 };
      } else if (angle === "overhead") {
        camState.start = { x: 0, y: 1.5, z: 0.3 };
        camState.end = { x: 0, y: 1.2, z: 0.1 };
      } else if (angle === "low") {
        camState.start = { x: 0, y: 0.05, z: 1.4 };
        camState.end = { x: 0, y: 0.35, z: 0.6 };
      }
      drawGizmo();
      applyTrajectoryToRig();

      // Automatically append or replace perspective tag in prompt
      const promptInput = document.getElementById("scenePromptInput");
      if (promptInput) {
        const labels = {
          front: "front 0° view",
          profile: "side profile 90° view",
          hero: "45° cinematic hero angle",
          back: "behind-the-back 180° view",
          overhead: "overhead bird's-eye view",
          low: "dramatic low-angle tilt"
        };
        const tag = labels[angle] || "cinematic camera";
        let val = promptInput.value.replace(/\s*\[(front 0°|side profile 90°|45° cinematic hero|behind-the-back 180°|overhead bird's-eye|dramatic low-angle)[^\]]*\]/gi, "").trim();
        promptInput.value = `${val} [${tag}]`;
        promptInput.focus();
      }
    });
  });

  drawGizmo();
}

// ==================== MULTI-MODEL SPLIT-SCREEN COMPARISON ====================
function initSplitCompareModal() {
  const openBtn = document.getElementById("openSplitCompareBtn");
  const modal = document.getElementById("splitCompareModal");
  const closeBtn = document.getElementById("closeSplitCompareBtn");
  const selA = document.getElementById("compareModelASelect");
  const selB = document.getElementById("compareModelBSelect");
  const runBtn = document.getElementById("runSplitCompareBtn");
  const statusEl = document.getElementById("compareStatusLine");
  const vidA = document.getElementById("compareVideoA");
  const vidB = document.getElementById("compareVideoB");
  const labelA = document.getElementById("compareModelALabel");
  const labelB = document.getElementById("compareModelBLabel");
  const pickA = document.getElementById("pickWinnerABtn");
  const pickB = document.getElementById("pickWinnerBBtn");
  if (!openBtn || !modal) return;

  let clipA = null;
  let clipB = null;

  function populateModelOptions() {
    const models = state.models && state.models.length ? state.models : [];
    const html = models.map((m) => `<option value="${m.id}">${m.name} (${m.provider})</option>`).join("");
    selA.innerHTML = html;
    selB.innerHTML = html;
    if (models.length > 1) {
      selA.selectedIndex = 0;
      selB.selectedIndex = 1;
    }
  }

  openBtn.onclick = () => {
    populateModelOptions();
    clipA = null;
    clipB = null;
    pickA.disabled = true;
    pickB.disabled = true;
    vidA.removeAttribute("src");
    vidB.removeAttribute("src");
    modal.classList.remove("hidden");
  };

  closeBtn.onclick = () => modal.classList.add("hidden");

  runBtn.onclick = async () => {
    const promptInput = document.getElementById("scenePromptInput");
    const prompt = (promptInput ? promptInput.value.trim() : "") || "Cinematic luxury studio reveal in 4K";
    const modelA = selA.value;
    const modelB = selB.value;
    labelA.textContent = selA.options[selA.selectedIndex]?.textContent || modelA;
    labelB.textContent = selB.options[selB.selectedIndex]?.textContent || modelB;

    runBtn.disabled = true;
    pickA.disabled = true;
    pickB.disabled = true;
    statusEl.innerHTML = "⚔️ Rendering <strong>Shot A</strong> &amp; <strong>Shot B</strong> in parallel...";

    const basePayload = {
      prompt,
      modelId: modelA,
      cameraStack: state.cameraStack || ["dolly-in"],
      lensId: state.selectedLensId || "cooke-anamorphic",
      vfxId: state.selectedVfxId || "none",
      soulId: state.selectedSoulId || "",
      aspectRatio: state.aspectRatio || "16:9",
      durationSec: state.durationSec || 5,
      cameraIntensity: state.cameraIntensity || 0.75,
      apiKeys: state.apiKeys || {}
    };

    try {
      const [resA, resB] = await Promise.all([
        fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...basePayload, modelId: modelA })
        }).then((r) => r.json()),
        fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...basePayload, modelId: modelB })
        }).then((r) => r.json())
      ]);

      clipA = resA.clip;
      clipB = resB.clip;
      if (clipA?.videoUrl) vidA.src = clipA.videoUrl;
      if (clipB?.videoUrl) vidB.src = clipB.videoUrl;

      vidA.currentTime = 0;
      vidB.currentTime = 0;
      vidA.play().catch(() => {});
      vidB.play().catch(() => {});

      pickA.disabled = !clipA;
      pickB.disabled = !clipB;
      statusEl.innerHTML = "✅ Both renders ready! Watch them side-by-side and pick the winner.";
      await refreshCatalogAssetsSilently();
    } catch (err) {
      statusEl.textContent = `❌ Comparison failed: ${err.message}`;
    } finally {
      runBtn.disabled = false;
    }
  };

  async function selectWinner(winner, loser) {
    if (loser && loser.id && typeof removeSceneById === "function") {
      await removeSceneById(loser.id);
    }
    if (winner) {
      state.activeClip = winner;
      if (typeof syncNativeVideoPlayer === "function") syncNativeVideoPlayer();
      if (typeof renderGallery === "function") renderGallery();
    }
    modal.classList.add("hidden");
  }

  pickA.onclick = () => selectWinner(clipA, clipB);
  pickB.onclick = () => selectWinner(clipB, clipA);
}

// ==================== HIGGSFIELD-STYLE REFERENCE CHARACTER & FACE UPLOADER ====================
function initReferenceUploader() {
  const pill = document.getElementById("referenceUploadPill");
  const fileInput = document.getElementById("referenceFileInput");
  const previewBox = document.getElementById("referencePreviewBox");
  const previewImg = document.getElementById("referencePreviewImg");
  const fileNameEl = document.getElementById("referenceFileName");
  const clearBtn = document.getElementById("clearReferenceBtn");

  if (!pill || !fileInput) return;

  pill.addEventListener("click", () => fileInput.click());

  function handleFile(file) {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      state.referenceImageDataUrl = dataUrl;
      state.keyframeDataUrl = dataUrl;
      state.referenceImageFileName = file.name;

      const img = new Image();
      img.onload = () => {
        state.keyframeImage = img;
      };
      img.src = dataUrl;

      if (previewImg) previewImg.src = dataUrl;
      if (fileNameEl) fileNameEl.textContent = file.name;
      if (previewBox) previewBox.classList.remove("hidden");
      pill.classList.add("hidden");
    };
    reader.readAsDataURL(file);
  }

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    handleFile(file);
  });

  // Drag and drop onto pill
  pill.addEventListener("dragover", (e) => {
    e.preventDefault();
    pill.style.borderColor = "var(--accent-gold)";
  });
  pill.addEventListener("dragleave", () => {
    pill.style.borderColor = "";
  });
  pill.addEventListener("drop", (e) => {
    e.preventDefault();
    pill.style.borderColor = "";
    const file = e.dataTransfer?.files?.[0];
    handleFile(file);
  });

  if (clearBtn) {
    clearBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      state.referenceImageDataUrl = null;
      state.keyframeDataUrl = null;
      state.keyframeImage = null;
      state.referenceImageFileName = "";
      fileInput.value = "";
      if (previewBox) previewBox.classList.add("hidden");
      pill.classList.remove("hidden");
    });
  }
}

// ==================== HIGGSFIELD VS DAFEILD PLANS & CREDITS MODAL ====================
function initPricingPlansModal() {
  const openBtn = document.getElementById("openPricingBtn");
  const modal = document.getElementById("pricingPlansModal");
  const closeBtn = document.getElementById("closePricingBtn");
  if (!modal) return;

  if (openBtn) {
    openBtn.onclick = () => {
      updateActivePlanUI();
      modal.classList.remove("hidden");
    };
  }

  if (closeBtn) {
    closeBtn.onclick = () => modal.classList.add("hidden");
  }

  function updateActivePlanUI() {
    const active = state.activePricingPlan || "free";
    document.querySelectorAll(".btn-tier-select").forEach((btn) => {
      const pid = btn.getAttribute("data-plan-id");
      if (pid === active) {
        btn.classList.add("active");
        btn.textContent = "✓ Current Active Plan";
      } else if (pid === "pro") {
        btn.classList.remove("active");
        btn.textContent = "Upgrade to Director ($49/mo)";
      } else if (pid === "studio") {
        btn.classList.remove("active");
        btn.textContent = "Get Studio Ultra ($149/mo)";
      } else {
        btn.classList.remove("active");
        btn.textContent = "Switch to Free Community";
      }
    });
  }

  document.querySelectorAll(".btn-tier-select").forEach((btn) => {
    btn.addEventListener("click", () => {
      const planId = btn.getAttribute("data-plan-id");
      state.activePricingPlan = planId;
      localStorage.setItem("dafeild_pricing_plan", planId);
      updateActivePlanUI();

      if (openBtn) {
        const labels = { free: "💎 Community Free", pro: "💎 Director Pro", studio: "💎 Studio Ultra" };
        openBtn.textContent = labels[planId] || "💎 Plans & Credits";
      }
    });
  });

  const savedPlan = localStorage.getItem("dafeild_pricing_plan");
  if (savedPlan && openBtn) {
    const labels = { free: "💎 Community Free", pro: "💎 Director Pro", studio: "💎 Studio Ultra" };
    openBtn.textContent = labels[savedPlan] || "💎 Plans & Credits";
  }
}

window.addEventListener("DOMContentLoaded", initStudio);
