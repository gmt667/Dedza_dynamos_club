"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type StaffRole = "owner" | "editor" | "viewer";
type Update = {
  id: string;
  title: string;
  summary: string;
  status: "draft" | "published";
  updatedAt: string;
};
type Match = {
  id: string;
  date: string;
  time: string;
  home: string;
  away: string;
  venue: string;
  competition: string;
  status: "upcoming" | "full_time" | "postponed";
  score: string;
  round?: string | null;
};
type LiveFootball = {
  matches: Match[];
  table?: unknown[];
  dedza: null | { position: number; played: number; points: number; won: number; drawn: number; lost: number };
  source?: { name: string; checkedAt: string; clubUrl: string; tableUrl: string; matchesAvailable: boolean; tableAvailable: boolean };
  freshness?: { checkedAt: string; fixturesAvailable: boolean; tableAvailable: boolean; fixturesOverridden: boolean; tableOverridden: boolean };
  error?: string;
};
type MediaClip = { id: string; title: string; category: string; url: string; thumbnailUrl?: string | null; date?: string | null };

async function readJson<T>(response: Response): Promise<T> {
  const data = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(data.error ?? `Request failed with HTTP ${response.status}.`);
  return data;
}

export default function StaffDashboard({ userName, role }: { userName: string; role: StaffRole }) {
  const [updates, setUpdates] = useState<Update[]>([]);
  const [liveFootball, setLiveFootball] = useState<LiveFootball | null>(null);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [managedMatches, setManagedMatches] = useState<Match[]>([]);
  const [mediaClips, setMediaClips] = useState<MediaClip[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [clipDraft, setClipDraft] = useState({ title: "", category: "match", url: "", thumbnailUrl: "", date: new Date().toISOString().slice(0, 10) });
  const [tableOverride, setTableOverride] = useState("");
  const [matchDraft, setMatchDraft] = useState({ date: "", time: "14:30", home: "Goshen City Dedza Dynamos", away: "", venue: "Dedza Stadium", competition: "FDH Bank Premiership", status: "upcoming", score: "" });
  const [busy, setBusy] = useState(false);
  const [sourceBusy, setSourceBusy] = useState(false);
  const [notice, setNotice] = useState("Loading club data...");

  const refreshUpdates = useCallback(async () => {
    const data = await readJson<{ updates: Update[] }>(await fetch("/api/updates", { cache: "no-store" }));
    setUpdates(data.updates ?? []);
  }, []);

  const refreshSource = useCallback(async () => {
    setSourceBusy(true);
    try {
      const data = await readJson<LiveFootball>(await fetch("/api/football-source", { cache: "no-store" }));
      setLiveFootball(data);
    } finally {
      setSourceBusy(false);
    }
  }, []);

  const refreshManagedFootball = useCallback(async () => {
    const [matchesData, settingsData] = await Promise.all([
      readJson<{ matches: Match[] }>(await fetch("/api/matches", { cache: "no-store" })),
      readJson<{ settings: Record<string, string> }>(await fetch("/api/settings", { cache: "no-store" })),
    ]);
    setManagedMatches(matchesData.matches ?? []);
    setTableOverride(settingsData.settings?.football_table_override ?? "");
  }, []);

  const refreshMedia = useCallback(async () => {
    const data = await readJson<{ media: MediaClip[] }>(await fetch("/api/media", { cache: "no-store" }));
    setMediaClips(data.media ?? []);
  }, []);

  useEffect(() => {
    let active = true;
    void Promise.all([refreshUpdates(), refreshSource(), refreshManagedFootball(), refreshMedia()])
      .then(() => { if (active) setNotice(""); })
      .catch((error: Error) => { if (active) setNotice(error.message); });
    return () => { active = false; };
  }, [refreshManagedFootball, refreshMedia, refreshSource, refreshUpdates]);

  const publishClip = async () => {
    setBusy(true);
    try {
      let url = clipDraft.url.trim();
      if (videoFile) {
        const form = new FormData(); form.append("video", videoFile);
        const uploaded = await readJson<{ url: string }>(await fetch("/api/media-upload", { method: "POST", body: form }));
        url = uploaded.url;
      }
      if (!url) throw new Error("Choose a clip or enter a hosted video URL.");
      await readJson(await fetch("/api/media", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...clipDraft, url }) }));
      setClipDraft({ title: "", category: "match", url: "", thumbnailUrl: "", date: new Date().toISOString().slice(0, 10) }); setVideoFile(null);
      setNotice("Video clip published to the fan Video page."); await refreshMedia();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not publish clip."); }
    finally { setBusy(false); }
  };

  const removeClip = async (id: string) => {
    setBusy(true);
    try { await readJson(await fetch("/api/media", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) })); setNotice("Video removed from the public library."); await refreshMedia(); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Could not remove clip."); }
    finally { setBusy(false); }
  };

  const addMatch = async () => {
    setBusy(true);
    try {
      await readJson(await fetch("/api/matches", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(matchDraft) }));
      setMatchDraft({ ...matchDraft, date: "", away: "", score: "" });
      setNotice("Match saved. It now takes priority over a fetched match with the same date and teams.");
      await Promise.all([refreshManagedFootball(), refreshSource()]);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not save match."); }
    finally { setBusy(false); }
  };

  const removeMatch = async (id: string) => {
    setBusy(true);
    try {
      await readJson(await fetch("/api/matches", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) }));
      setNotice("Staff match removed.");
      await Promise.all([refreshManagedFootball(), refreshSource()]);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not remove match."); }
    finally { setBusy(false); }
  };

  const saveTableOverride = async () => {
    setBusy(true);
    try {
      if (tableOverride.trim()) {
        const parsed = JSON.parse(tableOverride);
        if (!Array.isArray(parsed)) throw new Error("The table override must be a JSON array.");
      }
      await readJson(await fetch("/api/settings", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ football_table_override: tableOverride.trim() }) }));
      setNotice(tableOverride.trim() ? "League table override published." : "Table override cleared; the fetched table is active.");
      await refreshSource();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not save table override."); }
    finally { setBusy(false); }
  };

  const save = async (publish: boolean) => {
    setBusy(true);
    setNotice("");
    try {
      await readJson(await fetch("/api/updates", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, summary, publish }),
      }));
      setTitle("");
      setSummary("");
      setNotice(publish ? "Update published to the public News page." : "Draft saved in D1.");
      await refreshUpdates();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not save update.");
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (update: Update) => {
    setBusy(true);
    setNotice("");
    try {
      await readJson(await fetch("/api/updates", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: update.id, publish: update.status !== "published" }),
      }));
      setNotice(update.status === "published" ? "Update returned to draft." : "Update published to fans.");
      await refreshUpdates();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not change publication status.");
    } finally {
      setBusy(false);
    }
  };

  const editUpdate = async (update: Update) => {
    const nextTitle = window.prompt("Update headline", update.title);
    if (nextTitle === null) return;
    const nextSummary = window.prompt("Update summary", update.summary);
    if (nextSummary === null) return;
    setBusy(true);
    try {
      await readJson(await fetch("/api/updates", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: update.id, title: nextTitle, summary: nextSummary }) }));
      setNotice("Update edited. Published content will refresh on the fan site.");
      await refreshUpdates();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not edit update."); }
    finally { setBusy(false); }
  };

  const published = updates.filter((update) => update.status === "published").length;
  const nextMatch = useMemo(() => liveFootball?.matches.filter((match) => match.status === "upcoming").sort((a, b) => a.date.localeCompare(b.date))[0], [liveFootball]);
  const latestResult = useMemo(() => liveFootball?.matches.filter((match) => match.status === "full_time").sort((a, b) => b.date.localeCompare(a.date))[0], [liveFootball]);
  const canPublish = role === "owner" || role === "editor";

  return <main className="min-h-screen bg-[#061a38] text-slate-950">
    <header className="border-b border-white/10 bg-[#082650] text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3"><img src="/dedza-dynamos-logo.png" alt="Dedza Dynamos official crest" width={52} height={52} className="h-[52px] w-[52px] object-contain" /><div><p className="text-xs font-bold uppercase tracking-[.22em] text-[#f4ca29]">Dedza Dynamos FC</p><h1 className="text-2xl font-black tracking-tight">Staff operations dashboard</h1></div></div>
        <div className="flex flex-wrap items-center gap-2 text-sm"><span className="rounded-full bg-[#f4ca29] px-3 py-1 font-black uppercase text-[#12213c]">{role}</span><span className="rounded-full bg-white/10 px-4 py-2">{userName}</span></div>
      </div>
    </header>

    <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatusCard label="Published updates" value={String(published)} detail="Public D1 news feed" />
        <StatusCard label="League position" value={liveFootball?.dedza ? String(liveFootball.dedza.position) : "--"} detail={liveFootball?.dedza ? `${liveFootball.dedza.points} points from ${liveFootball.dedza.played}` : "Waiting for SULOM"} />
        <StatusCard label="Next official match" value={nextMatch ? nextMatch.date.slice(5) : "--"} detail={nextMatch ? `${nextMatch.home} vs ${nextMatch.away}` : "No fixture returned"} />
        <StatusCard label="Latest result" value={latestResult?.score || "--"} detail={latestResult ? `${latestResult.home} vs ${latestResult.away}` : "No result returned"} />
      </div>
    </section>

    <section className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1.05fr_.95fr]">
      <div className="rounded-2xl bg-white p-5 shadow-2xl shadow-black/20 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-[#315d9c]">Club-owned content</p>
        <h2 className="mt-2 text-2xl font-black">Publish an update</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Published items are written to D1 and appear on the fan News page. Staff-managed football changes take priority over fetched records.</p>
        <form className="mt-6 space-y-4" onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); void save(false); }}>
          <label className="block text-sm font-bold">Headline<input required maxLength={140} value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 font-normal outline-none focus:border-[#1d66c9]" placeholder="Dedza Dynamos club update" /></label>
          <label className="block text-sm font-bold">Summary<textarea required maxLength={2000} value={summary} onChange={(event) => setSummary(event.target.value)} className="mt-1 min-h-36 w-full rounded-lg border border-slate-300 px-3 py-3 font-normal outline-none focus:border-[#1d66c9]" placeholder="Write the verified update fans should see." /></label>
          <div className="flex flex-col gap-3 sm:flex-row"><button disabled={busy} className="rounded-lg border border-[#0a3470] px-4 py-3 font-bold text-[#0a3470] disabled:opacity-50">Save draft</button><button disabled={busy || !canPublish} type="button" onClick={() => void save(true)} className="rounded-lg bg-[#f4ca29] px-4 py-3 font-bold text-[#12213c] disabled:opacity-50">Publish update</button></div>
          {!canPublish && <p className="text-xs text-amber-700">Viewer accounts may save drafts but cannot publish.</p>}
        </form>
        {notice && <p role="status" className="mt-4 rounded-lg bg-slate-100 px-3 py-3 text-sm text-slate-700">{notice}</p>}
      </div>

      <aside className="rounded-2xl bg-[#0c346b] p-5 text-white sm:p-6">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#f4ca29]">Official source monitor</p><h2 className="mt-2 text-2xl font-black">SULOM live feed</h2></div><button onClick={() => void refreshSource().catch((error: Error) => setNotice(error.message))} disabled={sourceBusy} className="rounded-lg border border-white/30 px-3 py-2 text-xs font-bold disabled:opacity-50">{sourceBusy ? "Checking..." : "Refresh"}</button></div>
        <div className="mt-6 space-y-3 text-sm text-blue-100">
          <SourceLine label="Fixtures and results" ok={Boolean(liveFootball?.freshness?.fixturesAvailable ?? liveFootball?.source?.matchesAvailable)} />
          <SourceLine label="Premiership table" ok={Boolean(liveFootball?.freshness?.tableAvailable ?? liveFootball?.source?.tableAvailable)} />
          <p className="border-t border-white/15 pt-4">Last checked: <strong className="text-white">{liveFootball?.source?.checkedAt ? new Date(liveFootball.source.checkedAt).toLocaleString() : "Not yet checked"}</strong></p>
          {liveFootball?.source && <div className="flex flex-wrap gap-3 pt-2"><a className="font-bold text-[#f4ca29] underline" href={liveFootball.source.clubUrl} target="_blank" rel="noreferrer">Club source</a><a className="font-bold text-[#f4ca29] underline" href={liveFootball.source.tableUrl} target="_blank" rel="noreferrer">Table source</a></div>}
        </div>
        <p className="mt-8 border-t border-white/15 pt-5 text-sm leading-6 text-blue-100"><strong className="text-white">Protected staff tools.</strong><br />The dashboard requires platform sign-in. Only read-only public API routes are available to the fan site.</p>
      </aside>
    </section>

    <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-6 sm:px-6 lg:grid-cols-2">
      <div className="rounded-2xl bg-white p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-[#315d9c]">Football control</p><h2 className="mt-1 text-2xl font-black">Add an official match override</h2>
        <p className="mt-2 text-sm text-slate-600">Use the same date and teams to replace a fetched fixture, or add a new club-confirmed match.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {([['date','Date','date'],['time','Kick-off','time'],['home','Home team','text'],['away','Away team','text'],['venue','Venue','text'],['competition','Competition','text'],['score','Score','text']] as const).map(([key,label,type]) => <label key={key} className="text-sm font-bold">{label}<input type={type} value={matchDraft[key]} onChange={(event) => setMatchDraft({ ...matchDraft, [key]: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" /></label>)}
          <label className="text-sm font-bold">Status<select value={matchDraft.status} onChange={(event) => setMatchDraft({ ...matchDraft, status: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"><option value="upcoming">Upcoming</option><option value="full_time">Full time</option><option value="postponed">Postponed</option></select></label>
        </div>
        <button type="button" disabled={busy || !canPublish || !matchDraft.date || !matchDraft.home || !matchDraft.away} onClick={() => void addMatch()} className="mt-4 rounded-lg bg-[#f4ca29] px-4 py-3 font-bold disabled:opacity-50">Save match</button>
        <div className="mt-5 divide-y divide-slate-200">{managedMatches.map((match) => <div key={match.id} className="flex items-center justify-between gap-3 py-3 text-sm"><span><strong>{match.date}</strong> · {match.home} vs {match.away}</span><button disabled={busy || !canPublish} onClick={() => void removeMatch(match.id)} className="font-bold text-red-700 disabled:opacity-50">Remove</button></div>)}</div>
      </div>
      <div className="rounded-2xl bg-white p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-[#315d9c]">Table control</p><h2 className="mt-1 text-2xl font-black">League table override</h2>
        <p className="mt-2 text-sm text-slate-600">Owners can paste a complete verified JSON table. Leave blank to resume the automatic fetched table.</p>
        <textarea value={tableOverride} onChange={(event) => setTableOverride(event.target.value)} spellCheck={false} className="mt-5 min-h-80 w-full rounded-lg border border-slate-300 p-3 font-mono text-xs" placeholder='[{"position":1,"club":"Club name","played":1,"won":1,"drawn":0,"lost":0,"goalsFor":2,"goalsAgainst":0,"goalDifference":2,"points":3}]' />
        <button type="button" disabled={busy || role !== "owner"} onClick={() => void saveTableOverride()} className="mt-4 rounded-lg bg-[#0a3470] px-4 py-3 font-bold text-white disabled:opacity-50">Save table control</button>
      </div>
    </section>

    <section className="mx-auto max-w-7xl px-4 pb-6 sm:px-6">
      <div className="rounded-2xl bg-white p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-[#315d9c]">Club media</p><h2 className="mt-1 text-2xl font-black">Publish a short video clip</h2>
        <p className="mt-2 text-sm text-slate-600">Upload news clips, stadium arrivals, goals, penalties, match moments, training, interviews, or meeting highlights. Maximum upload size: 80 MB.</p>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <label className="text-sm font-bold">Title<input value={clipDraft.title} onChange={(event) => setClipDraft({ ...clipDraft, title: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" /></label>
          <label className="text-sm font-bold">Category<select value={clipDraft.category} onChange={(event) => setClipDraft({ ...clipDraft, category: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"><option value="news">News</option><option value="stadium">Stadium arrival</option><option value="goal">Goals</option><option value="penalty">Penalties</option><option value="match">Match moments</option><option value="training">Training</option><option value="meeting">Meetings</option><option value="interview">Interviews</option></select></label>
          <label className="text-sm font-bold">Video file<input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={(event) => setVideoFile(event.target.files?.[0] ?? null)} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" /></label>
          <label className="text-sm font-bold">Or hosted video URL<input type="url" value={clipDraft.url} onChange={(event) => setClipDraft({ ...clipDraft, url: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" placeholder="https://.../clip.mp4" /></label>
          <label className="text-sm font-bold">Thumbnail URL (optional)<input type="url" value={clipDraft.thumbnailUrl} onChange={(event) => setClipDraft({ ...clipDraft, thumbnailUrl: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" /></label>
          <label className="text-sm font-bold">Date<input type="date" value={clipDraft.date} onChange={(event) => setClipDraft({ ...clipDraft, date: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" /></label>
        </div>
        <button type="button" disabled={busy || !canPublish || !clipDraft.title || (!videoFile && !clipDraft.url)} onClick={() => void publishClip()} className="mt-4 rounded-lg bg-[#f4ca29] px-4 py-3 font-bold disabled:opacity-50">Publish video</button>
        <div className="mt-5 grid gap-3 md:grid-cols-2">{mediaClips.map((clip) => <article key={clip.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3"><div><span className="text-xs font-bold uppercase text-[#315d9c]">{clip.category}</span><h3 className="font-bold">{clip.title}</h3></div><button disabled={busy || !canPublish} onClick={() => void removeClip(clip.id)} className="text-sm font-bold text-red-700 disabled:opacity-50">Remove</button></article>)}</div>
      </div>
    </section>

    <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
      <div className="rounded-2xl bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#315d9c]">Content register</p><h2 className="mt-1 text-2xl font-black">Saved updates</h2></div><button onClick={() => void refreshUpdates().catch((error: Error) => setNotice(error.message))} className="self-start text-sm font-bold text-[#0a4a99]">Refresh content</button></div>
        <div className="mt-5 divide-y divide-slate-200">{updates.length === 0 ? <p className="py-6 text-slate-500">No updates have been saved yet.</p> : updates.map((update) => <article key={update.id} className="flex flex-col gap-4 py-5 sm:flex-row sm:items-start sm:justify-between"><div><div className="mb-2 flex flex-wrap items-center gap-2"><span className={update.status === "published" ? "rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-800" : "rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800"}>{update.status}</span><span className="text-xs text-slate-500">{new Date(update.updatedAt).toLocaleString()}</span></div><h3 className="font-black">{update.title}</h3><p className="mt-1 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-slate-600">{update.summary}</p></div><div className="flex shrink-0 gap-2"><button disabled={busy || !canPublish} onClick={() => void editUpdate(update)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold disabled:opacity-50">Edit</button><button disabled={busy || !canPublish} onClick={() => void toggle(update)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold disabled:opacity-50">{update.status === "published" ? "Unpublish" : "Publish"}</button></div></article>)}</div>
      </div>
    </section>
  </main>;
}

function StatusCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <article className="rounded-xl border border-white/10 bg-[#0c346b] p-4 text-white"><p className="text-[11px] font-bold uppercase tracking-[.14em] text-blue-200">{label}</p><p className="mt-2 text-3xl font-black text-[#f4ca29]">{value}</p><p className="mt-1 truncate text-xs text-blue-100" title={detail}>{detail}</p></article>;
}

function SourceLine({ label, ok }: { label: string; ok: boolean }) {
  return <div className="flex items-center justify-between gap-4 rounded-lg bg-white/5 px-3 py-3"><span>{label}</span><span className={ok ? "font-bold text-emerald-300" : "font-bold text-amber-300"}>{ok ? "Connected" : "Unavailable"}</span></div>;
}
