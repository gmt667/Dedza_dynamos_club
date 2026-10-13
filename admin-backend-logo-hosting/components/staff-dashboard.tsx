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
  status: "upcoming" | "full_time";
  score: string;
  sourceUrl: string;
};
type LiveFootball = {
  matches: Match[];
  dedza: null | { position: number; played: number; points: number; won: number; drawn: number; lost: number };
  source?: { name: string; checkedAt: string; clubUrl: string; tableUrl: string; matchesAvailable: boolean; tableAvailable: boolean };
  error?: string;
};

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
      const data = await readJson<LiveFootball>(await fetch("/api/public/live-football", { cache: "no-store" }));
      setLiveFootball(data);
    } finally {
      setSourceBusy(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void Promise.all([refreshUpdates(), refreshSource()])
      .then(() => { if (active) setNotice(""); })
      .catch((error: Error) => { if (active) setNotice(error.message); });
    return () => { active = false; };
  }, [refreshSource, refreshUpdates]);

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
        <p className="mt-2 text-sm leading-6 text-slate-600">Published items are written to D1 and appear on the fan News page. League data is never edited here; it comes from SULOM.</p>
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
          <SourceLine label="Fixtures and results" ok={Boolean(liveFootball?.source?.matchesAvailable)} />
          <SourceLine label="Premiership table" ok={Boolean(liveFootball?.source?.tableAvailable)} />
          <p className="border-t border-white/15 pt-4">Last checked: <strong className="text-white">{liveFootball?.source?.checkedAt ? new Date(liveFootball.source.checkedAt).toLocaleString() : "Not yet checked"}</strong></p>
          {liveFootball?.source && <div className="flex flex-wrap gap-3 pt-2"><a className="font-bold text-[#f4ca29] underline" href={liveFootball.source.clubUrl} target="_blank" rel="noreferrer">Club source</a><a className="font-bold text-[#f4ca29] underline" href={liveFootball.source.tableUrl} target="_blank" rel="noreferrer">Table source</a></div>}
        </div>
        <p className="mt-8 border-t border-white/15 pt-5 text-sm leading-6 text-blue-100"><strong className="text-white">Protected staff tools.</strong><br />The dashboard requires platform sign-in. Only read-only public API routes are available to the fan site.</p>
      </aside>
    </section>

    <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
      <div className="rounded-2xl bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#315d9c]">Content register</p><h2 className="mt-1 text-2xl font-black">Saved updates</h2></div><button onClick={() => void refreshUpdates().catch((error: Error) => setNotice(error.message))} className="self-start text-sm font-bold text-[#0a4a99]">Refresh content</button></div>
        <div className="mt-5 divide-y divide-slate-200">{updates.length === 0 ? <p className="py-6 text-slate-500">No updates have been saved yet.</p> : updates.map((update) => <article key={update.id} className="flex flex-col gap-4 py-5 sm:flex-row sm:items-start sm:justify-between"><div><div className="mb-2 flex flex-wrap items-center gap-2"><span className={update.status === "published" ? "rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-800" : "rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800"}>{update.status}</span><span className="text-xs text-slate-500">{new Date(update.updatedAt).toLocaleString()}</span></div><h3 className="font-black">{update.title}</h3><p className="mt-1 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-slate-600">{update.summary}</p></div><button disabled={busy || !canPublish} onClick={() => void toggle(update)} className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold disabled:opacity-50">{update.status === "published" ? "Unpublish" : "Publish"}</button></article>)}</div>
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
