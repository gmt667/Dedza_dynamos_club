import { getDb } from "../db";
import { clubSettings, matches as storedMatches } from "../db/schema";
import { getSulomLiveData, type OfficialMatch, type StandingRow } from "./sulom";

type StoredMatch = typeof storedMatches.$inferSelect;

const matchKey = (match: Pick<OfficialMatch, "date" | "home" | "away">) =>
  `${match.date}|${match.home.trim().toLowerCase()}|${match.away.trim().toLowerCase()}`;

function publicMatch(match: OfficialMatch | StoredMatch) {
  return {
    id: match.id,
    date: match.date,
    time: match.time ?? "14:30",
    home: match.home,
    away: match.away,
    venue: match.venue,
    competition: match.competition,
    status: match.status,
    score: match.score ?? "",
    round: match.round ?? null,
  };
}

function parseTableOverride(value?: string): StandingRow[] | null {
  if (!value?.trim()) return null;
  try {
    const parsed = JSON.parse(value) as StandingRow[];
    if (!Array.isArray(parsed) || !parsed.length) return null;
    return parsed
      .filter((row) => row && Number.isFinite(Number(row.position)) && String(row.club ?? "").trim())
      .map((row) => ({
        position: Number(row.position),
        club: String(row.club).trim(),
        played: Number(row.played) || 0,
        won: Number(row.won) || 0,
        drawn: Number(row.drawn) || 0,
        lost: Number(row.lost) || 0,
        goalsFor: Number(row.goalsFor) || 0,
        goalsAgainst: Number(row.goalsAgainst) || 0,
        goalDifference: Number(row.goalDifference) || 0,
        points: Number(row.points) || 0,
        logoUrl: null,
        clubUrl: null,
      }))
      .sort((a, b) => a.position - b.position);
  } catch {
    return null;
  }
}

export async function getMergedFootballData() {
  const [official, manualMatches, settingsRows] = await Promise.all([
    getSulomLiveData().catch(() => ({
      matches: [] as OfficialMatch[],
      table: [] as StandingRow[],
      dedza: null,
      source: {
        name: "Super League of Malawi",
        checkedAt: new Date().toISOString(),
        clubUrl: "https://sulommw.com/club/goshen-city-dedza-dynamos/",
        tableUrl: "https://sulommw.com/table/fdh-2026-27/",
        matchesAvailable: false,
        tableAvailable: false,
      },
    })),
    getDb().select().from(storedMatches),
    getDb().select().from(clubSettings),
  ]);
  const settings = Object.fromEntries(settingsRows.map((row) => [row.key, row.value]));
  const merged = new Map(official.matches.map((match) => [matchKey(match), publicMatch(match)]));
  for (const match of manualMatches) merged.set(matchKey(match as OfficialMatch), publicMatch(match));
  const matches = [...merged.values()].sort((a, b) => a.date.localeCompare(b.date));
  const tableOverride = parseTableOverride(settings.football_table_override);
  const table = tableOverride ?? official.table.map((row) => ({ ...row, logoUrl: null, clubUrl: null }));
  return {
    matches,
    table,
    dedza: table.find((row) => row.club.toLowerCase().includes("dedza")) ?? null,
    freshness: {
      checkedAt: official.source.checkedAt,
      fixturesAvailable: matches.length > 0,
      tableAvailable: table.length > 0,
      fixturesOverridden: manualMatches.length > 0,
      tableOverridden: Boolean(tableOverride),
    },
    staffSource: official.source,
  };
}
