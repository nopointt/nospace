import { Hono } from "hono"
import type { Env } from "../types/env"
import { runPipeline } from "../services/pipeline"
import { RagService } from "../services/rag"
import { EmbedderService } from "../services/embedder"
import { VectorStoreService } from "../services/vectorstore"

export const dev = new Hono<{ Bindings: Env }>()

// --- Dev UI page ---
dev.get("/", (c) => {
  return c.html(DEV_HTML)
})

// --- Pipeline: upload + process ---
dev.post("/pipeline", async (c) => {
  const formData = await c.req.formData()
  const file = formData.get("file") as File | null

  if (!file) {
    return c.json({ error: "No file provided" }, 400)
  }

  const documentId = crypto.randomUUID().slice(0, 8)
  const buffer = await file.arrayBuffer()

  const result = await runPipeline(
    documentId,
    {
      file: buffer,
      fileName: file.name,
      mimeType: (file.type && file.type !== "application/octet-stream") ? file.type : guessMimeType(file.name),
      fileSize: file.size,
    },
    c.env
  )

  return c.json(result)
})

// --- RAG query ---
dev.post("/query", async (c) => {
  const body = await c.req.json<{ query: string; topK?: number }>()

  if (!body.query) {
    return c.json({ error: "No query provided" }, 400)
  }

  const embedder = new EmbedderService(c.env.JINA_API_URL, c.env.JINA_API_KEY)
  const vectorStore = new VectorStoreService({
    db: c.env.DB,
    vectorIndex: c.env.VECTOR_INDEX,
  })
  const rag = new RagService({
    ai: c.env.AI,
    embedder,
    vectorStore,
  })

  try {
    const result = await rag.query({
      query: body.query,
      topK: body.topK ?? 5,
      scoreThreshold: 0,
    })
    return c.json(result)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return c.json({ error: msg, answer: "", sources: [], queryVariants: [], tokenUsage: { embeddingTokens: 0, llmPromptTokens: 0, llmCompletionTokens: 0 } }, 200)
  }
})

// --- Debug env ---
dev.get("/debug-env", (c) => {
  return c.json({
    hasJinaKey: !!c.env.JINA_API_KEY,
    jinaKeyPrefix: c.env.JINA_API_KEY?.slice(0, 10) ?? "MISSING",
    jinaKeyLength: c.env.JINA_API_KEY?.length ?? 0,
    jinaUrl: c.env.JINA_API_URL,
    hasGroqKey: !!c.env.GROQ_API_KEY,
  })
})

// --- State: counts ---
dev.get("/state", async (c) => {
  const docs = await c.env.DB.prepare("SELECT COUNT(*) as count FROM documents").first<{ count: number }>()
  const chunks = await c.env.DB.prepare("SELECT COUNT(*) as count FROM chunks").first<{ count: number }>()

  return c.json({
    documents: docs?.count ?? 0,
    chunks: chunks?.count ?? 0,
  })
})

function guessMimeType(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase()
  const map: Record<string, string> = {
    pdf: "application/pdf",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    csv: "text/csv",
    json: "application/json",
    txt: "text/plain",
    md: "text/markdown",
    html: "text/html",
    xml: "text/xml",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    svg: "image/svg+xml",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    m4a: "audio/x-m4a",
    ogg: "audio/ogg",
    mp4: "video/mp4",
    mov: "video/quicktime",
  }
  return map[ext ?? ""] ?? "application/octet-stream"
}

const DEV_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Contexter · Dev UI</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, sans-serif; background: #f8f9fa; color: #1a1a1a; padding: 24px; max-width: 960px; margin: 0 auto; }
  h1 { font-size: 20px; font-weight: 600; margin-bottom: 24px; }
  h2 { font-size: 15px; font-weight: 600; margin-bottom: 12px; color: #555; text-transform: uppercase; letter-spacing: 0.5px; }
  .card { background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 16px; }
  .drop-zone { border: 2px dashed #ccc; border-radius: 8px; padding: 40px; text-align: center; cursor: pointer; transition: all 0.2s; }
  .drop-zone:hover, .drop-zone.dragover { border-color: #2563eb; background: #eff6ff; }
  .drop-zone input { display: none; }
  .stages { display: flex; gap: 8px; margin: 16px 0; flex-wrap: wrap; }
  .stage { padding: 6px 12px; border-radius: 16px; font-size: 13px; font-weight: 500; }
  .stage.pending { background: #f1f1f1; color: #888; }
  .stage.running { background: #fef3c7; color: #92400e; animation: pulse 1s infinite; }
  .stage.done { background: #d1fae5; color: #065f46; }
  .stage.error { background: #fee2e2; color: #991b1b; }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
  pre { background: #f5f5f5; border: 1px solid #e0e0e0; border-radius: 6px; padding: 12px; font-size: 12px; overflow-x: auto; white-space: pre-wrap; word-break: break-word; max-height: 400px; overflow-y: auto; }
  .query-row { display: flex; gap: 8px; }
  .query-row input { flex: 1; padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; }
  .query-row button, .upload-btn { padding: 8px 16px; background: #2563eb; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; }
  .query-row button:hover, .upload-btn:hover { background: #1d4ed8; }
  .query-row button:disabled, .upload-btn:disabled { background: #93c5fd; cursor: not-allowed; }
  .stats { display: flex; gap: 24px; }
  .stat { text-align: center; }
  .stat-value { font-size: 28px; font-weight: 700; color: #2563eb; }
  .stat-label { font-size: 12px; color: #888; }
  .source { border-left: 3px solid #2563eb; padding: 8px 12px; margin: 8px 0; background: #f8fafc; border-radius: 0 6px 6px 0; font-size: 13px; }
  .source .score { font-weight: 600; color: #2563eb; }
  .source .type { font-size: 11px; color: #888; margin-left: 8px; }
  .file-info { font-size: 13px; color: #666; margin: 8px 0; }
  .duration { font-size: 12px; color: #888; margin-left: 8px; }
  .section-output { margin-top: 12px; }
</style>
</head>
<body>
<h1>Contexter · Dev UI</h1>

<div class="card">
  <h2>Upload & Process</h2>
  <div class="drop-zone" id="dropZone" onclick="document.getElementById('fileInput').click()">
    Drop file here or click to browse
    <input type="file" id="fileInput">
  </div>
  <div class="file-info" id="fileInfo"></div>
  <div class="stages" id="stages"></div>
  <div class="section-output" id="pipelineOutput"></div>
</div>

<div class="card">
  <h2>Query</h2>
  <div class="query-row">
    <input type="text" id="queryInput" placeholder="Ask a question about your documents..." onkeydown="if(event.key==='Enter')doQuery()">
    <button onclick="doQuery()" id="queryBtn">Search</button>
  </div>
  <div class="section-output" id="queryOutput"></div>
</div>

<div class="card">
  <h2>State</h2>
  <div class="stats" id="stateStats">
    <div class="stat"><div class="stat-value" id="docCount">-</div><div class="stat-label">Documents</div></div>
    <div class="stat"><div class="stat-value" id="chunkCount">-</div><div class="stat-label">Chunks</div></div>
  </div>
</div>

<script>
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');

['dragenter','dragover'].forEach(e => dropZone.addEventListener(e, ev => { ev.preventDefault(); dropZone.classList.add('dragover'); }));
['dragleave','drop'].forEach(e => dropZone.addEventListener(e, ev => { ev.preventDefault(); dropZone.classList.remove('dragover'); }));

dropZone.addEventListener('drop', (e) => { if (e.dataTransfer.files.length) processFile(e.dataTransfer.files[0]); });
fileInput.addEventListener('change', (e) => { if (e.target.files.length) processFile(e.target.files[0]); });

async function processFile(file) {
  document.getElementById('fileInfo').textContent = file.name + ' · ' + (file.size / 1024).toFixed(1) + ' KB · ' + (file.type || 'unknown type');

  const stagesEl = document.getElementById('stages');
  stagesEl.innerHTML = ['Parse','Chunk','Embed','Index'].map(s =>
    '<span class="stage pending">' + s + '</span>'
  ).join('');

  document.getElementById('pipelineOutput').innerHTML = '<pre>Processing...</pre>';

  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch('/dev/pipeline', { method: 'POST', body: formData });
    const result = await res.json();

    const stageNames = ['Parse','Chunk','Embed','Index'];
    stagesEl.innerHTML = result.stages.map((s, i) =>
      '<span class="stage ' + s.status + '">' + stageNames[i] +
      (s.durationMs ? '<span class="duration">' + s.durationMs + 'ms</span>' : '') +
      (s.error ? ' ✗' : '') + '</span>'
    ).join('');

    let output = '';
    for (const stage of result.stages) {
      output += '=== ' + stage.stage.toUpperCase() + ' [' + stage.status + ']';
      if (stage.durationMs) output += ' ' + stage.durationMs + 'ms';
      output += ' ===\\n';
      if (stage.error) output += 'ERROR: ' + stage.error + '\\n';
      if (stage.data) output += JSON.stringify(stage.data, null, 2) + '\\n';
      output += '\\n';
    }
    document.getElementById('pipelineOutput').innerHTML = '<pre>' + escapeHtml(output) + '</pre>';
    refreshState();
  } catch (err) {
    document.getElementById('pipelineOutput').innerHTML = '<pre>Error: ' + escapeHtml(err.message) + '</pre>';
  }
}

async function doQuery() {
  const input = document.getElementById('queryInput');
  const btn = document.getElementById('queryBtn');
  const query = input.value.trim();
  if (!query) return;

  btn.disabled = true;
  btn.textContent = 'Searching...';
  document.getElementById('queryOutput').innerHTML = '<pre>Searching...</pre>';

  try {
    const res = await fetch('/dev/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    const result = await res.json();

    let html = '';

    if (result.answer) {
      html += '<h3 style="margin:12px 0 8px">Answer</h3><pre>' + escapeHtml(result.answer) + '</pre>';
    }

    if (result.queryVariants && result.queryVariants.length > 1) {
      html += '<h3 style="margin:12px 0 8px">Query Variants</h3><pre>' + escapeHtml(result.queryVariants.join('\\n')) + '</pre>';
    }

    if (result.sources && result.sources.length > 0) {
      html += '<h3 style="margin:12px 0 8px">Sources (' + result.sources.length + ')</h3>';
      for (const src of result.sources) {
        html += '<div class="source"><span class="score">' + src.score.toFixed(4) + '</span><span class="type">' + src.source + '</span><br>' + escapeHtml(src.content.slice(0, 300)) + '</div>';
      }
    }

    if (result.tokenUsage) {
      html += '<h3 style="margin:12px 0 8px">Token Usage</h3><pre>Embedding: ' + result.tokenUsage.embeddingTokens + '\\nLLM Prompt: ' + result.tokenUsage.llmPromptTokens + '\\nLLM Completion: ' + result.tokenUsage.llmCompletionTokens + '</pre>';
    }

    if (result.error) {
      html = '<pre>Error: ' + escapeHtml(result.error) + '</pre>';
    }

    document.getElementById('queryOutput').innerHTML = html || '<pre>No results</pre>';
  } catch (err) {
    document.getElementById('queryOutput').innerHTML = '<pre>Error: ' + escapeHtml(err.message) + '</pre>';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Search';
  }
}

async function refreshState() {
  try {
    const res = await fetch('/dev/state');
    const state = await res.json();
    document.getElementById('docCount').textContent = state.documents;
    document.getElementById('chunkCount').textContent = state.chunks;
  } catch {}
}

function escapeHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

refreshState();
</script>
</body>
</html>`
