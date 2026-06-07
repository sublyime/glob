# Futuristic Globe Heatmap

Interactive globe demo showing configurable heatmap-like points. Uses `three`, `three-globe`, and `vite`.

Quick start:

1. Install deps:

```bash
npm install
```

2. Run dev server:

```bash
npm run dev
```

3. Open http://localhost:5173

Usage:
- Use the sidebar to provide a JSON URL returning an array of objects with `lat`, `lng`, and `weight` fields.
- The example dataset `/data/airports_delay.json` demonstrates airports with delay counts.

Next steps:
- Add more visual layers (arcs, flow lines, hex-bins) using `three-globe` API.
- Swap in custom textures and postprocessing bloom for extra cinematic effects.
# glob