const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');

const root = path.resolve(process.argv[2]);
const matrix = JSON.parse(fs.readFileSync(path.join(root, 'run-matrix.json')));
assert.equal(matrix.runs.length, 3, 'Supply desktop, portrait and landscape evidence');
for (const name of new Set(matrix.runs.map(run => run.manifest))) {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, name)));
  for (const file of manifest.files) {
    const bytes = fs.readFileSync(path.join(manifest.build, file.path));
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), file.sha256, file.path + ': candidate changed');
  }
}
const percentile = (values, p) => {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  return Math.round(sorted[Math.floor((sorted.length - 1) * p)] * 100) / 100;
};
const results = matrix.runs.map(({ result: file, manifest }) => {
  const result = JSON.parse(fs.readFileSync(path.join(root, file)));
  assert.equal(result.status, 'PASS');
  assert.equal(result.completed.completed.length, 12);
  assert.equal(result.completed.status, 'completed');
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.failed, []);
  const pages = new Map(), resources = new Map();
  let transferBytes = 0;
  for (const document of result.documents) {
    const page = new URL(document.url).pathname;
    if (!pages.has(page)) pages.set(page, { intervals: [], drawCalls: [], triangles: [] });
    const group = pages.get(page), frames = document.frames;
    for (let i = 1; i < frames.length; i++) {
      const a = frames[i - 1], b = frames[i];
      if (a.segment === b.segment && a.mode === b.mode) group.intervals.push(b.at - a.at);
    }
    for (const frame of frames) if (frame.stats) {
      group.drawCalls.push(frame.stats.drawCalls);
      group.triangles.push(frame.stats.triangles);
    }
    for (const resource of document.resources) {
      resources.set(resource.url, Math.max(resources.get(resource.url) || 0, resource.encodedBytes));
      transferBytes += resource.transferBytes;
    }
  }
  return {
    status: 'PASS', layout: result.layout, evidence: file, manifest, browser: result.browser,
    objectives: 12, attempt: result.completed.attempt, defeats: result.completed.defeats,
    launchToChapterOneReadyMs: result.events.find(e => e.label === 'startup').ms,
    handoffs: result.events.filter(e => e.label === 'handoff ready'),
    routes: result.events.filter(e => 'walkingSeconds' in e),
    uniqueEncodedResourceBytes: [...resources.values()].reduce((a, b) => a + b, 0),
    observedTransferBytesAcrossNavigations: transferBytes,
    renderer: result.documents.find(d => d.renderer)?.renderer,
    framePacing: [...pages].filter(([, g]) => g.intervals.length).map(([page, g]) => ({
      page, samples: g.intervals.length, medianMs: percentile(g.intervals, .5),
      p95Ms: percentile(g.intervals, .95), maxMs: Math.round(Math.max(...g.intervals) * 100) / 100,
      over50Ms: g.intervals.filter(ms => ms > 50).length,
      p95DrawCalls: percentile(g.drawCalls, .95), p95Triangles: percentile(g.triangles, .95),
    })),
  };
});
assert.deepEqual(results.map(r => r.layout).sort(), ['desktop', 'landscape', 'portrait']);
const summary = { status: 'PASS', candidate: 'CTRL-07', provenance: matrix.basis,
  basis: 'Local Chrome with read-only inspector instrumentation; mobile layouts use real emulated touch. Frame intervals exclude paused and mode-boundary gaps by segment; long intervals within a segment are retained. Local ready timings include episode entry/navigation, not internet cold-start measurements. Resource bytes are observed browser entries, not the export directory size.', results };
fs.writeFileSync(path.join(root, 'verified-summary.json'), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
