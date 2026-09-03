const fs = require('node:fs');
const path = require('node:path');

const SHEET_ID = '1Jhq2peaMHRiLI9Ke9RLQS-PjIetZOMtIJSxb58Laf-I';
const DEFAULT_SHEET_NAME = 'Aktivitetslogg';
const DEFAULT_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(DEFAULT_SHEET_NAME)}`;
const CHALLENGE_START = '2026-09-01';
const CHALLENGE_END = '2026-12-20';

const projectRoot = path.join(__dirname, '..');
const seedPath = path.join(projectRoot, 'src', 'seedData.ts');
const reportPath = path.join(projectRoot, 'data', 'sheet-import-report.json');

function parseArgs(argv) {
  const args = { url: process.env.PEAK25_SHEET_CSV_URL || DEFAULT_CSV_URL, csv: null };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === '--csv') args.csv = argv[index + 1];
    if (item === '--url') args.url = argv[index + 1];
  }
  return args;
}

function parseCsv(input) {
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];

    if (quoted) {
      if (char === '"' && next === '"') {
        value += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        value += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(value);
      value = '';
    } else if (char === '\n') {
      row.push(value);
      rows.push(row);
      row = [];
      value = '';
    } else if (char !== '\r') {
      value += char;
    }
  }

  row.push(value);
  rows.push(row);
  return rows.filter((cells) => cells.some((cell) => cell.trim().length > 0));
}

function normalizeHeader(value) {
  return cleanText(value).replace(/[^a-z0-9]/g, '');
}

function cleanText(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function tableFromCsv(csv) {
  const rows = parseCsv(csv);
  const headers = (rows.shift() || []).map(normalizeHeader);
  return rows.map((cells, rowIndex) => ({
    rowNumber: rowIndex + 2,
    values: Object.fromEntries(headers.map((header, index) => [header, cells[index]?.trim() || ''])),
  }));
}

function get(row, names) {
  for (const name of names) {
    const value = row.values[normalizeHeader(name)];
    if (value) return value;
  }
  return '';
}

function normalizePlayer(value) {
  const normalized = cleanText(value);
  if (normalized.includes('vlad')) return 'vlad';
  if (normalized.includes('simon')) return 'simon';
  if (normalized.includes('ali')) return 'ali';
  if (normalized.includes('loren')) return 'loren';
  return null;
}

function normalizeActivity(value, row) {
  const normalized = cleanText(value);
  const legSets = parseNumber(get(row, ['ben-set', 'ben set', 'benset', 'leg sets'])) || 0;
  const markedLegDay = parseBoolean(get(row, ['benpass', 'leg day']), false);
  if (markedLegDay || normalized.includes('leg') || normalized.includes('benpass')) return 'leg-day';
  if (normalized.includes('gym') || normalized.includes('lift') || normalized.includes('workout')) return 'gym';
  if (normalized.includes('run') || normalized.includes('lopning')) return 'running';
  if (normalized.includes('stair')) return 'stairmaster';
  if (normalized.includes('cycl') || normalized.includes('cykl') || normalized.includes('bike')) return 'cycling';
  if (normalized.includes('swim') || normalized.includes('simning')) return 'swimming';
  if (normalized.includes('golf')) return 'golf';
  if (normalized.includes('tennis')) return 'tennis';
  if (normalized.includes('padel') || normalized.includes('paddle')) return 'padel';
  if (normalized.includes('sport') || normalized.includes('other') || normalized.includes('annan') || normalized.includes('pulshojande')) return 'other';
  if (legSets >= 8) return 'leg-day';
  if (get(row, ['holes', 'golf holes'])) return 'golf';
  return null;
}

function parseNumber(value) {
  if (!value) return undefined;
  const parsed = Number(String(value).replace(',', '.').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseBoolean(value, defaultValue = false) {
  if (!value) return defaultValue;
  const normalized = cleanText(value);
  if (['yes', 'ja', 'y', 'true', '1', 'walked', 'walking', 'bar bag', 'bar', 'trolley', 'pushcart', 'push cart'].some((item) => normalized.includes(item))) return true;
  if (['no', 'nej', 'n', 'false', '0', 'cart', 'buggy'].some((item) => normalized.includes(item))) return false;
  return defaultValue;
}

function parseDateKey(value) {
  const raw = value.trim();
  if (!raw) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const serial = Number(raw.replace(',', '.'));
  if (Number.isFinite(serial) && serial > 40000 && serial < 70000) {
    const date = new Date(Date.UTC(1899, 11, 30 + serial));
    return date.toISOString().slice(0, 10);
  }

  const dayMonthYear = raw.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (dayMonthYear) {
    const year = dayMonthYear[3].length === 2 ? `20${dayMonthYear[3]}` : dayMonthYear[3];
    const day = dayMonthYear[1].padStart(2, '0');
    const month = dayMonthYear[2].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return null;
}

function isActivityValid(activity) {
  const duration = activity.durationMinutes || 0;
  if (activity.type === 'gym') return duration > 30 && (activity.workingSets || 0) > 8;
  if (activity.type === 'leg-day') return duration > 30 && (activity.workingSets || 0) >= 8;
  if (activity.type === 'running') return duration >= 30 || (activity.distanceKm || 0) >= 5;
  if (['stairmaster', 'cycling', 'swimming', 'tennis', 'padel'].includes(activity.type)) return duration >= 30;
  if (activity.type === 'golf') return (activity.golfHoles || 0) >= 9 && Boolean(activity.walkedGolf);
  if (activity.type === 'other') return duration >= 30;
  return false;
}

function toActivity(row) {
  const playerId = normalizePlayer(get(row, ['participant', 'player', 'name', 'person', 'who', 'deltagare']));
  const date = parseDateKey(get(row, ['activity date', 'activitydate', 'aktivitetsdatum', 'date', 'day', 'datum']));
  const type = normalizeActivity(get(row, ['activity type', 'activity', 'type', 'sport', 'workout', 'aktivitetstyp']), row);
  const totalSets = parseNumber(get(row, ['working sets', 'sets', 'total sets', 'totala set', 'totala set 0 om ej gym']));
  const legSets = parseNumber(get(row, ['leg sets', 'ben-set', 'ben set', 'benset', 'ben-set valfritt 0 om ej benpass']));
  const golfFormat = get(row, ['golf format', 'golfformat']);
  const durationMinutes = parseNumber(get(row, ['duration minutes', 'duration', 'minutes', 'mins', 'min', 'time', 'minuter']));
  const workingSets = type === 'leg-day' ? legSets : totalSets;
  const distanceKm = parseNumber(get(row, ['distance km', 'distance', 'km']));
  const golfHoles = parseNumber(get(row, ['golf holes', 'holes', 'hal', 'hål'])) || (type === 'golf' ? parseNumber(golfFormat) : undefined);
  const walkedGolf = type === 'golf' ? parseBoolean(get(row, ['walked golf', 'walked', 'walking', 'carried', 'trolley']) || golfFormat, true) : undefined;

  if (!playerId) return { error: 'Missing or unknown participant' };
  if (!date) return { error: 'Missing or invalid date' };
  if (date < CHALLENGE_START || date > CHALLENGE_END) return { error: `Date outside challenge period: ${date}` };
  if (!type) return { error: 'Missing or unknown activity type' };

  const activity = {
    id: `sheet-${playerId}-${date}`,
    playerId,
    date,
    type,
    durationMinutes,
    workingSets,
    distanceKm,
    golfHoles,
    walkedGolf,
    pulseRaising: true,
  };
  const countedActivityDay = parseBoolean(get(row, ['activity day', 'aktivitetsdag']), false);

  if (!isActivityValid(activity)) return { error: `Activity does not meet app rules: ${type} on ${date}` };
  return { activity, priority: (type === 'leg-day' ? 2 : 0) + (countedActivityDay ? 1 : 0) };
}

async function loadCsv(args) {
  if (args.csv) return fs.readFileSync(path.resolve(args.csv), 'utf8');

  const response = await fetch(args.url);
  if (!response.ok) {
    throw new Error(`Could not read Google Sheet CSV (${response.status}). In Google Sheets, set General access to "Anyone with the link can view", then retry.`);
  }
  return response.text();
}

function writeSeedData({ source, rows, activities, rejected }) {
  const module = `import type { Activity } from './types';\n\nexport const seedActivities: Activity[] = ${JSON.stringify(activities, null, 2)};\n\nexport const seedImportMeta = ${JSON.stringify({
    source,
    importedAt: new Date().toISOString(),
    rowCount: rows.length,
    acceptedCount: activities.length,
    rejectedCount: rejected.length,
  }, null, 2)};\n`;

  fs.mkdirSync(path.dirname(seedPath), { recursive: true });
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(seedPath, module);
  fs.writeFileSync(reportPath, JSON.stringify({ source, rows: rows.length, accepted: activities.length, rejected }, null, 2));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const source = args.csv ? path.resolve(args.csv) : args.url;
  const csv = await loadCsv(args);
  const rows = tableFromCsv(csv);
  const rejected = [];
  const byPlayerDate = new Map();

  for (const row of rows) {
    const result = toActivity(row);
    if (result.error) {
      rejected.push({ rowNumber: row.rowNumber, error: result.error, row: row.values });
    } else {
      const key = `${result.activity.playerId}:${result.activity.date}`;
      const existing = byPlayerDate.get(key);
      if (!existing || result.priority >= existing.priority) {
        byPlayerDate.set(key, { activity: result.activity, priority: result.priority });
      }
    }
  }

  const activities = [...byPlayerDate.values()].map((item) => item.activity).sort((a, b) => a.date.localeCompare(b.date) || a.playerId.localeCompare(b.playerId));
  writeSeedData({ source, rows, activities, rejected });

  console.log(`Imported ${activities.length} activities from ${rows.length} rows.`);
  if (rejected.length) console.log(`Rejected ${rejected.length} rows. See ${path.relative(projectRoot, reportPath)}.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
