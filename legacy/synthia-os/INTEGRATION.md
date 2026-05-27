# Synthia OS integration checkpoint

This file records the uploaded Synthia OS source modules and how they should be merged into the current `didactic-octo-disco` React/Vite morph substrate.

## Uploaded modules to preserve

- `file-ingestor.js` — original ingestion pipeline: Upload → Analyze → Understand → Address → Mount.
- `cognitive-engine.js` — semantic analysis, meaning extraction, color/motivation/environment mapping, generation hooks.
- `mrnn-engine.js` — 128-node, 9-cluster, 13-layer, 5D MRNN mesh.
- `app-manager.js` — app lifecycle, install/mount/unmount/execute, app center, widgets.
- `main.js` — Synthia OS boot/controller layer joining MRNN, cognitive engine, file ingestor, app manager, UI and visualizer.
- `config.js` — Synthia server endpoints, HuggingFace references, Supabase placeholders, theme defaults, MRNN defaults, ingestion stages.
- `package.json` — static Synthia OS build/deploy script.
- `netlify.toml` — static Netlify config from the uploaded OS bundle.
- `README.md` — original Synthia OS documentation.
- `SchedulerPage.tsx` — scheduler UI concept for in-app job queue.
- `autonomous-scheduler.ts` — backend/autonomous task runner concept.
- `synth_scheduler.py` — Body/Mind/Heart tri-scheduler and questioning orchestrator.

## Current app role

The current root React/Vite app remains the visible morph substrate. Do not blindly paste the old global JS files into `src/`; several expect browser globals and static HTML IDs.

## Merge path

1. Keep the current app deployable and visible.
2. Add ZIP/project ingestion to the current substrate.
3. Add an in-app task queue based on `SchedulerPage.tsx` and `autonomous-scheduler.ts`.
4. Port `file-ingestor.js` as typed ingestion services.
5. Port `cognitive-engine.js` and `mrnn-engine.js` as substrate services.
6. Port `app-manager.js` as the sandbox/app mounting layer.
7. Use `synth_scheduler.py` concepts for report/understanding orchestration.
8. Assign ontological addresses only after analysis/understanding.

## Immediate priority

Make the app visible, then make ZIP ingestion produce a real understanding report and regeneration target.
