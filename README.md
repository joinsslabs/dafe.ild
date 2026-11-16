# Dafeild — AI Video Director + Multi-Model Router + MCP Server

A full-stack AI Video Generation & Cinema Direction Studio (**Dafeild**), built with:

1. **Free, Cheap & Top-Tier Paid Model Router**:
   - **100% Free & Open-Weights**: `Higgsfield DoP v1.5`, `Higgsfield ReelMagic VFX`, `Google Gemini Omni 1.2 Flash Free`, `SkyReels V1`, `Step-Video-T2V 30B`, `Wan 2.1`, `LTX-Video 2B`, `CogVideoX-2B`, `Mochi 1`.
   - **Top-Tier Paid Cinema Models**: `Google Veo 3 / Veo 3.1`, `OpenAI Sora 2 Pro`, `Runway Gen-4 Turbo`, `Kling 2.0 Master`, `Luma Ray 2`, `Hailuo MiniMax 02`, `ByteDance Seedance 1.0 Pro`, `Wan 2.2 14B`.
2. **Mechanical Cinema & Audio Controls**:
   - **Interactive 3D Camera Trajectory Gizmo** & stacked camera vectors (`Dolly In`, `360° Hero Orbit`, `FPV Drone Dive`, `Jib/Crane Rise`, `Whip Pan`, `Bullet-Time`, `SnorriCam`, `Crash Zoom`).
   - **Multi-Model Split-Screen Comparison ("Director's Pick")**: Render two models in parallel and pick the winning shot.
   - **Action-Matched Auto Sound FX / Foley**: Automatic stereo foley + score mixed directly into `.MP4` exports with zero gabble.
   - **Soul ID Vault**: Persistent character & product identity locks across cuts.
3. **Native Model Context Protocol (MCP) Server & Client Hub**:
   - Standard JSON-RPC 2.0 MCP Server over `stdio` ([`mcp-server.js`](./mcp-server.js)) and HTTP (`POST /api/mcp/rpc`).

## Quick Start

```bash
cd C:\Users\Dell\.gemini\antigravity\scratch\dafe.ild-studio
node server.js
```

Then open **http://localhost:3456** in your browser.
