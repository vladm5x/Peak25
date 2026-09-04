const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT || 8787);
const rootDir = path.resolve(__dirname, '..');
const statePath = path.join(rootDir, 'data', 'shared-sync-state.json');
const seedPath = path.join(rootDir, 'src', 'seedData.ts');

function readSeedActivities() {
  try {
    const source = fs.readFileSync(seedPath, 'utf8');
    const match = source.match(/export const seedActivities: Activity\[] = (\[[\s\S]*?\]);/);
    return match ? JSON.parse(match[1]) : [];
  } catch {
    return [];
  }
}

function initialState() {
  return {
    revision: 0,
    updatedAt: new Date().toISOString(),
    activities: readSeedActivities(),
    exclusions: [],
    sportResults: [],
  };
}

function readState() {
  if (!fs.existsSync(statePath)) {
    const state = initialState();
    writeState(state);
    return state;
  }
  return JSON.parse(fs.readFileSync(statePath, 'utf8'));
}

function writeState(state) {
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);
}

function recordKey(record) {
  return `${record.playerId}:${record.date}`;
}

function mergeRecords(current, incoming) {
  const activities = new Map(current.activities.map((activity) => [activity.id || recordKey(activity), activity]));
  const exclusions = new Map(current.exclusions.map((exclusion) => [recordKey(exclusion), exclusion]));
  const sportResults = new Map((current.sportResults || []).map((result) => [result.id, result]));

  for (const activity of incoming.activities || []) {
    activities.set(activity.id || recordKey(activity), activity);
    exclusions.delete(recordKey(activity));
  }

  for (const exclusion of incoming.exclusions || []) {
    exclusions.set(recordKey(exclusion), exclusion);
    for (const [activityId, activity] of activities) {
      if (recordKey(activity) === recordKey(exclusion)) activities.delete(activityId);
    }
  }

  for (const result of incoming.sportResults || []) {
    sportResults.set(result.id, result);
  }

  return {
    revision: current.revision + 1,
    updatedAt: new Date().toISOString(),
    activities: [...activities.values()],
    exclusions: [...exclusions.values()],
    sportResults: [...sportResults.values()],
  };
}

function send(response, status, payload) {
  response.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  response.end(JSON.stringify(payload));
}

const server = http.createServer((request, response) => {
  if (request.method === 'OPTIONS') {
    send(response, 204, {});
    return;
  }

  if (request.url === '/health' && request.method === 'GET') {
    send(response, 200, { ok: true });
    return;
  }

  if (request.url === '/state' && request.method === 'GET') {
    send(response, 200, readState());
    return;
  }

  if (request.url === '/state' && request.method === 'PUT') {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) request.destroy();
    });
    request.on('end', () => {
      try {
        const incoming = JSON.parse(body);
        if (!Array.isArray(incoming.activities) || !Array.isArray(incoming.exclusions) || !Array.isArray(incoming.sportResults || [])) {
          send(response, 400, { error: 'Expected activities, exclusions, and sportResults arrays' });
          return;
        }
        const next = mergeRecords(readState(), incoming);
        writeState(next);
        send(response, 200, next);
      } catch (error) {
        send(response, 400, { error: error instanceof Error ? error.message : 'Invalid JSON' });
      }
    });
    return;
  }

  send(response, 404, { error: 'Not found' });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Peak 25 sync server listening on http://localhost:${PORT}`);
  console.log(`Shared data file: ${statePath}`);
});
