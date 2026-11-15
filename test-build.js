/**
 * DAFEILD Studio — Build, Google Gemini Omni, Story Auto-Patcher & Full Movie Stitcher Verification
 */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { handleMcpJsonRpc, loadState, saveState } = require("./mcp-server");
const { RENDERS_DIR } = require("./ai-engine");

async function runTests() {
  console.log("1. Testing DAFEILD MCP Server JSON-RPC 2.0 protocol...");

  const initRes = await handleMcpJsonRpc({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {}
  });
  assert.strictEqual(initRes.result.serverInfo.name, "dafeild-video-mcp");
  console.log("   ✓ MCP initialize OK (dafeild-video-mcp)");

  const toolsRes = await handleMcpJsonRpc({
    jsonrpc: "2.0",
    id: 2,
    method: "tools/list",
    params: {}
  });
  assert(toolsRes.result.tools.length >= 11, "Expected at least 11 MCP tools (including script-to-movie & surgical retake)");
  console.log(`   ✓ MCP tools/list OK (${toolsRes.result.tools.length} tools registered)`);

  const freeModelsRes = await handleMcpJsonRpc({
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: {
      name: "list_video_models",
      arguments: { tier: "free" }
    }
  });
  const freeModels = freeModelsRes.result.structuredContent.models;
  assert(freeModels.some((m) => m.id === "google-gemini-omni-free"), "Expected Google Gemini Omni Free model");
  assert(freeModels.every((m) => m.costPerClipUsd === 0));
  console.log(`   ✓ MCP list_video_models (tier=free) OK (${freeModels.length} free models verified)`);

  const genRes = await handleMcpJsonRpc({
    jsonrpc: "2.0",
    id: 4,
    method: "tools/call",
    params: {
      name: "generate_ai_video",
      arguments: {
        prompt: "Kaelen walking through neon rain in Neo-Tokyo",
        modelId: "google-gemini-omni-free",
        cameraStack: ["dolly-in", "orbit-360"],
        lensId: "cooke-anamorphic",
        vfxId: "cyber-glitch",
        soulId: "soul-kaelen",
        durationSec: 300
      }
    }
  });
  const clip = genRes.result.structuredContent.clip;
  assert(clip && clip.id, "Expected generated clip with ID");
  assert.strictEqual(clip.durationSec, 300, "Expected 5-minute (300s) duration");
  const mp4DiskPath = path.join(RENDERS_DIR, `${clip.id}.mp4`);
  assert(fs.existsSync(mp4DiskPath), "Expected real .mp4 file on disk");
  const mp4Bytes = fs.readFileSync(mp4DiskPath);
  assert(mp4Bytes.includes(Buffer.from("avc1")), "Expected real H.264 (avc1) codec in MP4 file");
  assert(mp4Bytes.includes(Buffer.from("mp4a")), "Expected real Stereo AAC (mp4a) audio in MP4 file");
  console.log(`   ✓ MCP generate_ai_video (Real H.264 avc1 + AAC .MP4, ${mp4Bytes.length} bytes) OK: ${mp4DiskPath}`);

  const patchRes = await handleMcpJsonRpc({
    jsonrpc: "2.0",
    id: 5,
    method: "tools/call",
    params: {
      name: "auto_patch_story_continuity",
      arguments: {
        originalStory: "Detective Kaelen traces a signal from Neo-Tokyo to the Solarpunk Conservatory",
        clipIds: [clip.id],
        generateBridgeClip: true
      }
    }
  });
  const patchData = patchRes.result.structuredContent;
  assert(patchData.recognizedScenes.length >= 1, "Expected recognized scenes");
  assert(patchData.bridgeClip && patchData.bridgeClip.id, "Expected auto-patched bridge clip");
  console.log(`   ✓ MCP auto_patch_story_continuity OK (Bridge clip: ${patchData.bridgeClip.id})`);

  const stitchRes = await handleMcpJsonRpc({
    jsonrpc: "2.0",
    id: 6,
    method: "tools/call",
    params: {
      name: "stitch_full_movie",
      arguments: {
        title: "DAFEILD Test Full Movie"
      }
    }
  });
  const movie = stitchRes.result.structuredContent.movie;
  assert(movie && movie.id && movie.mp4Url, "Expected stitched full movie .mp4");
  assert(fs.existsSync(path.join(RENDERS_DIR, `${movie.id}.mp4`)), "Expected stitched movie .mp4 on disk");
  console.log(`   ✓ MCP stitch_full_movie OK (${movie.clipsCount} clips -> ${movie.mp4Url}, ${movie.totalDurationSec}s)`);

  const retakeRes = await handleMcpJsonRpc({
    jsonrpc: "2.0",
    id: 7,
    method: "tools/call",
    params: {
      name: "surgical_scene_retake",
      arguments: {
        clipId: clip.id,
        startSec: 4,
        endSec: 12,
        retakeInstruction: "Fix hand grip on holographic artifact with strict 5-finger anatomy"
      }
    }
  });
  const patchedClip = retakeRes.result.structuredContent.patchedClip;
  assert(patchedClip && patchedClip.surgicalRetakeHistory.length === 1, "Expected surgical retake history");
  console.log(`   ✓ MCP surgical_scene_retake OK (Patched segment 4s-12s on ${patchedClip.id})`);

  const scriptMovieRes = await handleMcpJsonRpc({
    jsonrpc: "2.0",
    id: 8,
    method: "tools/call",
    params: {
      name: "generate_movie_from_script",
      arguments: {
        scriptText: "Kaelen inspects a clue in Neo-Tokyo. He rises to the Solarpunk Biodome to meet Elara.",
        durationPerSceneSec: 60
      }
    }
  });
  const scriptData = scriptMovieRes.result.structuredContent;
  assert(scriptData.scenesGenerated >= 2 && scriptData.movie.mp4Url, "Expected script-to-movie stitched MP4");
  console.log(`   ✓ MCP generate_movie_from_script OK (${scriptData.scenesGenerated} scenes -> ${scriptData.movie.mp4Url})`);

  // Reset generations array so server.js populates clean initial demo clips on startup
  const st = loadState();
  st.generations = [];
  st.timeline = [];
  st.movies = [];
  saveState(st);

  console.log("\n✅ All DAFEILD build, Story Auto-Patcher & Full Movie MP4 Stitcher checks passed!");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
