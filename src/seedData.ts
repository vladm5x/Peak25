import type { Activity } from './types';

export const seedActivities: Activity[] = [
  {
    "id": "sheet-ali-2026-09-01",
    "playerId": "ali",
    "date": "2026-09-01",
    "type": "running",
    "durationMinutes": 30,
    "workingSets": 0,
    "pulseRaising": true
  },
  {
    "id": "sheet-simon-2026-09-01",
    "playerId": "simon",
    "date": "2026-09-01",
    "type": "gym",
    "durationMinutes": 59,
    "workingSets": 13,
    "pulseRaising": true
  },
  {
    "id": "sheet-vlad-2026-09-01",
    "playerId": "vlad",
    "date": "2026-09-01",
    "type": "gym",
    "durationMinutes": 50,
    "workingSets": 9,
    "pulseRaising": true
  },
  {
    "id": "sheet-ali-2026-09-02",
    "playerId": "ali",
    "date": "2026-09-02",
    "type": "running",
    "durationMinutes": 53,
    "workingSets": 0,
    "pulseRaising": true
  },
  {
    "id": "sheet-simon-2026-09-02",
    "playerId": "simon",
    "date": "2026-09-02",
    "type": "other",
    "durationMinutes": 120,
    "workingSets": 0,
    "pulseRaising": true
  },
  {
    "id": "sheet-vlad-2026-09-02",
    "playerId": "vlad",
    "date": "2026-09-02",
    "type": "other",
    "durationMinutes": 120,
    "workingSets": 0,
    "pulseRaising": true
  },
  {
    "id": "sheet-ali-2026-09-03",
    "playerId": "ali",
    "date": "2026-09-03",
    "type": "leg-day",
    "durationMinutes": 63,
    "workingSets": 8,
    "pulseRaising": true
  }
];

export const seedImportMeta = {
  "source": "https://docs.google.com/spreadsheets/d/1Jhq2peaMHRiLI9Ke9RLQS-PjIetZOMtIJSxb58Laf-I/gviz/tq?tqx=out:csv&sheet=Aktivitetslogg",
  "importedAt": "2026-09-03T19:34:51.366Z",
  "rowCount": 10,
  "acceptedCount": 7,
  "rejectedCount": 0
};
