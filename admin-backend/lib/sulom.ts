const CLUB_SOURCE_URL = "https://sulommw.com/club/goshen-city-dedza-dynamos/";
const TABLE_SOURCE_URL = "https://sulommw.com/table/fdh-2026-27/";

export type OfficialMatch = {
  id: string;
  date: string;
  time: string;
  home: string;
  away: string;
  venue: string;
  competition: string;
  status: "upcoming" | "full_time";
  score: string;
  round: string | null;
  sourceName: string;
  sourceUrl: string;
  sourceCheckedAt: string;
};

export type StandingRow = {
  position: number;
  club: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  logoUrl: string | null;
  clubUrl: string | null;
};

const decodeHtml = (value: string) =>
  value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#8211;|&ndash;/gi, "-")
    .replace(/&#8212;|&mdash;/gi, "-")
    .replace(/&#039;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();

const capture = (value: string, pattern: RegExp) => {
  const match = value.match(pattern);
  return match ? decodeHtml(match[1]) : "";
};

async function fetchOfficialPage(url: string) {
  const response = await fetch(url, {
    headers: {
      accept: "text/html,application/xhtml+xml",
      "user-agent": "DedzaDynamosOfficialSite/1.0 (+https://dedza-dynamos-staff-admin.mwalwandadesire5.chatgpt.site)",
    },
    signal: AbortSignal.timeout(25_000),
  });
  if (!response.ok) throw new Error(`SULOM returned HTTP ${response.status}.`);
  return response.text();
}

export function parseSulomMatches(html: string, checkedAt: string): OfficialMatch[] {
  const chunks = html.split(/(?=<div class="anwp-fl-game\s)/i).slice(1);
  const matches = new Map<string, OfficialMatch>();

  for (const chunk of chunks) {
    const id = capture(chunk, /data-anwp-match="(\d+)"/i);
    const dateTime = capture(chunk, /data-fl-game-datetime="([^"]+)"/i);
    const home = capture(chunk, /match-slim__team-home-title[^>]*>([\s\S]*?)<\/div>/i);
    const away = capture(chunk, /match-slim__team-away-title[^>]*>([\s\S]*?)<\/div>/i);
    if (!id || !dateTime || !home || !away || matches.has(id)) continue;

    const homeScore = capture(chunk, /match-slim__scores-home[^>]*>([\s\S]*?)<\/span>/i);
    const awayScore = capture(chunk, /match-slim__scores-away[^>]*>([\s\S]*?)<\/span>/i);
    const completed = /^\d+$/.test(homeScore) && /^\d+$/.test(awayScore);
    const sourceUrl = capture(chunk, /class="anwp-link-cover[^"]*"\s+href="([^"]+)"/i) || CLUB_SOURCE_URL;
    const competition = capture(chunk, /match-slim__competition-logo[^>]*data-tippy-content="([^"]+)"/i)
      || capture(chunk, /match-slim__competition-title[^>]*>([\s\S]*?)<\/div>/i)
      || "FDH Bank Premiership";

    matches.set(id, {
      id: `sulom-${id}`,
      date: dateTime.slice(0, 10),
      time: capture(chunk, /match__time-formatted[^>]*>([\s\S]*?)<\/span>/i) || dateTime.slice(11, 16),
      home,
      away,
      venue: capture(chunk, /match-slim__stadium[^>]*>([\s\S]*?)<\/div>/i) || "Venue to be confirmed",
      competition,
      status: completed ? "full_time" : "upcoming",
      score: completed ? `${homeScore}-${awayScore}` : "",
      round: null,
      sourceName: "Super League of Malawi",
      sourceUrl,
      sourceCheckedAt: checkedAt,
    });
  }

  return [...matches.values()].sort((a, b) => a.date.localeCompare(b.date));
}

const standingValue = (block: string, field: string) => {
  const value = capture(block, new RegExp(`standing-table__${field}[^>]*>([\\s\\S]*?)<\\/div>`, "i"));
  const parsed = Number.parseInt(value.replace(/[^\d-]/g, ""), 10);
  return Number.isFinite(parsed) ? parsed : 0;
};

export function parseSulomStandings(html: string): StandingRow[] {
  const rowPattern = /<div class="[^"]*standing-table__rank[^"]*club-(\d+)\s+place-(\d+)[^"]*"[^>]*>/gi;
  const rowStarts = [...html.matchAll(rowPattern)];
  const rows: StandingRow[] = [];

  for (let index = 0; index < rowStarts.length; index += 1) {
    const current = rowStarts[index];
    const start = current.index ?? 0;
    const end = rowStarts[index + 1]?.index ?? Math.min(html.length, start + 14_000);
    const block = html.slice(start, end);
    const clubId = current[1];
    const position = Number.parseInt(current[2], 10);
    const club = capture(block, /class="club__link[^"]*"[^>]*>([\s\S]*?)<\/a>/i);
    if (!club || rows.some((row) => row.position === position)) continue;

    rows.push({
      position,
      club,
      played: standingValue(block, "played"),
      won: standingValue(block, "won"),
      drawn: standingValue(block, "drawn"),
      lost: standingValue(block, "lost"),
      goalsFor: standingValue(block, "gf"),
      goalsAgainst: standingValue(block, "ga"),
      goalDifference: standingValue(block, "gd"),
      points: standingValue(block, "points"),
      logoUrl: capture(block, /standing-table__club[\s\S]*?<img[^>]*src="([^"]+)"/i) || null,
      clubUrl: capture(block, /class="club__link[^"]*"\s+href="([^"]+)"/i) || null,
    });

    if (clubId === "15555" && !club.toLowerCase().includes("dedza")) {
      rows.pop();
    }
  }

  return rows.sort((a, b) => a.position - b.position);
}

export async function getSulomLiveData() {
  const checkedAt = new Date().toISOString();
  const [clubResult, tableResult] = await Promise.allSettled([
    fetchOfficialPage(CLUB_SOURCE_URL),
    fetchOfficialPage(TABLE_SOURCE_URL),
  ]);

  const matches = clubResult.status === "fulfilled" ? parseSulomMatches(clubResult.value, checkedAt) : [];
  const table = tableResult.status === "fulfilled" ? parseSulomStandings(tableResult.value) : [];
  if (!matches.length && !table.length) {
    const reason = clubResult.status === "rejected" ? clubResult.reason : tableResult.status === "rejected" ? tableResult.reason : null;
    throw reason instanceof Error ? reason : new Error("Official SULOM data is temporarily unavailable.");
  }

  return {
    matches,
    table,
    dedza: table.find((row) => row.club.toLowerCase().includes("dedza")) ?? null,
    source: {
      name: "Super League of Malawi",
      checkedAt,
      clubUrl: CLUB_SOURCE_URL,
      tableUrl: TABLE_SOURCE_URL,
      matchesAvailable: matches.length > 0,
      tableAvailable: table.length > 0,
    },
  };
}
