# SafeDeck — n8n Workflows

Email ingestion and downstream notifications run through n8n.

**Location of workflow JSON files (to be exported from existing n8n instance):**
- `safedeck-engine.json` — Gmail trigger → Drive upload → Lambda invoke → Sheets append
- `safedeck-writer.json` — Sheets write-back (called by Lambda webhook)
- `my-workflow.json` — alternative simplified workflow

**Note:** These JSON files are managed by the n8n UI. To export:
1. Open n8n
2. Select workflow → ⋮ menu → "Download"
3. Replace the file in this folder
4. Commit
