# AetherField Studio — Higgsfield-Inspired AI Video Director + Free/Cheap Model Router + MCP Server

A full-stack AI Video Generation & Cinema Direction Studio inspired by **Higgsfield AI**, built with:
1. **100% Free & Ultra-Cheap Open-Weights Model Router** (`Wan 2.1 Free`, `LTX-Video 2B Free`, `CogVideoX-2B Free`, `Mochi 1 Free`, plus `$0.02–$0.14/clip` serverless `Wan 2.2 14B MoE`, `LTX 2.5 Audio`, and `HunyuanVideo 13B`).
2. **Higgsfield Mechanical Cinema Controls**:
   - **Stacked Camera Moves**: Combine up to 3 physical camera vectors (`Dolly In`, `360° Hero Orbit`, `FPV Drone Dive`, `Jib/Crane Rise`, `Kinetic Whip Pan`, `Dutch Angle Roll`, `Matrix Bullet-Time`, `SnorriCam`, `Crash Zoom`, `Truck Parallax`) with adjustable motion intensity.
   - **Cinema Optics & Lenses**: `Cooke Anamorphic/i 2x (40mm)`, `ARRI Alexa 65 + Prime DNA (50mm)`, `Panavision C-Series 1970s (35mm)`, `IMAX 15/70mm (28mm)`, `Bolex 16mm Kodak 500T`, `Laowa 24mm Macro Probe`.
   - **Action Choreography & Interactive Motion Brush**: Draw custom subject trajectories directly on the cinema viewport canvas and export real `.webm` video files.
   - **Soul ID Vault**: Persistent character & product identity locks (Seed Lock, Face Lock, Outfit Lock, Consistency Weight) across cuts.
3. **Native Model Context Protocol (MCP) Server & Client Hub**:
   - Standard JSON-RPC 2.0 MCP Server over `stdio` ([`mcp-server.js`](./mcp-server.js)) and HTTP (`POST /api/mcp/rpc`).

## Quick Start

```bash
cd C:\Users\Dell\.gemini\antigravity\scratch\aetherfield-studio
node server.js
```

Then open **http://localhost:3456** in your browser.
