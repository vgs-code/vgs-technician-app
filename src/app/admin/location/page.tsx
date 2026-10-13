"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { LogOut, MapPin, RefreshCw, ShieldCheck, Clock, Search, ExternalLink } from "lucide-react";

const ADMIN_EMAIL = "vashishthglobalsolutions@gmail.com";

type Punch = {
  id: string;
  technician_name: string;
  technician_code: string;
  latitude: number;
  longitude: number;
  accuracy_meters: number | null;
  punched_at: string;
  punch_type: string;
};

export default function AdminLocationPage() {
  const [email, setEmail] = useState("");
  const [sessionReady, setSessionReady] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [sending, setSending] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [punches, setPunches] = useState<Punch[]>([]);
  const [query, setQuery] = useState("");
  const [day, setDay] = useState("all");

  const checkSession = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const currentEmail = data.session?.user.email?.toLowerCase() || "";
    setEmail(currentEmail);
    setAuthorized(currentEmail === ADMIN_EMAIL);
    setSessionReady(true);
  }, []);

  const loadPunches = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user.email?.toLowerCase() !== ADMIN_EMAIL) {
      setAuthorized(false);
      return;
    }
    setBusy(true);
    setError("");
    const { data: rows, error: fetchError } = await supabase
      .from("technician_location_punches")
      .select("id,technician_name,technician_code,latitude,longitude,accuracy_meters,punched_at,punch_type")
      .order("punched_at", { ascending: false })
      .limit(500);
    if (fetchError) {
      setError("Could not load attendance. Confirm the admin email policy is active and the account has signed in.");
    } else {
      setPunches((rows || []) as Punch[]);
    }
    setBusy(false);
  }, []);

  useEffect(() => {
    void checkSession();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      void checkSession();
    });
    return () => listener.subscription.unsubscribe();
  }, [checkSession]);

  useEffect(() => {
    if (authorized) void loadPunches();
  }, [authorized, loadPunches]);

  async function sendLoginLink(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setNotice("");
    setError("");
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: ADMIN_EMAIL,
      options: { emailRedirectTo: window.location.origin + "/admin/location" },
    });
    if (authError) setError("Login link could not be sent. Check Supabase Auth email settings.");
    else setNotice("A secure sign-in link has been requested for " + ADMIN_EMAIL + ". Check that inbox and open the link on this device.");
    setSending(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setAuthorized(false);
    setEmail("");
    setPunches([]);
  }

  const visiblePunches = punches.filter((p) => {
    const q = query.trim().toLowerCase();
    const matches = !q || p.technician_name.toLowerCase().includes(q) || p.technician_code.toLowerCase().includes(q);
    if (!matches) return false;
    if (day === "all") return true;
    const date = new Date(p.punched_at);
    const now = new Date();
    if (day === "today") return date.toDateString() === now.toDateString();
    const cutoff = new Date();
    cutoff.setDate(now.getDate() - 7);
    return date >= cutoff;
  });

  if (!sessionReady) return <main className="min-h-screen bg-slate-50 p-8 text-slate-600">Checking secure admin session...</main>;

  if (!authorized) return <main className="min-h-screen bg-slate-50 px-4 py-10">
    <section className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
      <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-[#102c46] text-white"><ShieldCheck size={28}/></div>
      <p className="text-sm font-semibold text-cyan-800">VASHISHTH HOME SERVICE</p>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">Admin location dashboard</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">Sign in using a one-time secure email link. Only the configured VGS administrator account can view technician coordinates and attendance.</p>
      <div className="mt-5 rounded-xl bg-slate-50 p-3 text-sm text-slate-700"><span className="font-semibold">Administrator</span><br/>{ADMIN_EMAIL}</div>
      <form onSubmit={sendLoginLink} className="mt-5">
        <button disabled={sending} className="w-full rounded-xl bg-[#087e8b] px-4 py-3 font-semibold text-white disabled:opacity-60">{sending ? "Requesting sign-in link..." : "Email me a secure sign-in link"}</button>
      </form>
      {notice && <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
      {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {email && email !== ADMIN_EMAIL && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Signed in as {email}, but this account is not the configured administrator. Sign out before trying the administrator inbox.</p>}
      <p className="mt-5 text-xs leading-5 text-slate-500">Location records are sensitive. Share access only with authorized staff and use them according to your technician notice and company policy.</p>
    </section>
  </main>;

  return <main className="min-h-screen bg-slate-50 px-4 py-6 md:px-8">
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-col justify-between gap-4 rounded-3xl bg-[#102c46] p-6 text-white md:flex-row md:items-center">
        <div><div className="flex items-center gap-2 text-cyan-200"><ShieldCheck size={18}/><span className="text-xs font-bold tracking-wide">VGS SECURE ADMIN</span></div><h1 className="mt-2 text-2xl font-bold">Technician location dashboard</h1><p className="mt-1 text-sm text-slate-300">Signed in as {email}</p></div>
        <div className="flex gap-2"><button onClick={() => void loadPunches()} className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/20"><RefreshCw size={16}/>Refresh</button><button onClick={() => void signOut()} className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900"><LogOut size={16}/>Sign out</button></div>
      </header>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5"><p className="text-sm text-slate-500">Records loaded</p><p className="mt-2 text-3xl font-bold text-slate-900">{punches.length}</p></div>
        <div className="rounded-2xl border bg-white p-5"><p className="text-sm text-slate-500">Matching records</p><p className="mt-2 text-3xl font-bold text-slate-900">{visiblePunches.length}</p></div>
        <div className="rounded-2xl border bg-white p-5"><p className="text-sm text-slate-500">Data access</p><p className="mt-2 text-lg font-bold text-emerald-700">Admin authenticated</p></div>
      </div>
      <section className="mt-5 rounded-2xl border bg-white p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_180px]">
          <label className="flex items-center gap-2 rounded-xl border px-3"><Search size={18} className="text-slate-400"/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search technician name or ID" className="w-full py-3 outline-none"/></label>
          <select value={day} onChange={e => setDay(e.target.value)} className="rounded-xl border px-3 py-3"><option value="all">All loaded records</option><option value="today">Today</option><option value="week">Last 7 days</option></select>
        </div>
        {error && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        {busy ? <p className="p-8 text-center text-slate-500">Loading attendance...</p> : visiblePunches.length === 0 ? <div className="p-10 text-center"><MapPin className="mx-auto text-slate-300" size={34}/><p className="mt-3 font-semibold text-slate-800">No location records found</p><p className="mt-1 text-sm text-slate-500">Records will appear after technicians submit a location punch.</p></div> : <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr><th className="p-3">Technician</th><th className="p-3">Date and time</th><th className="p-3">Coordinates</th><th className="p-3">Accuracy</th><th className="p-3">Map</th></tr></thead><tbody>{visiblePunches.map(p => <tr key={p.id} className="border-t"><td className="p-3"><p className="font-semibold text-slate-900">{p.technician_name}</p><p className="text-xs text-slate-500">{p.technician_code}</p></td><td className="p-3"><span className="flex items-center gap-2"><Clock size={15} className="text-slate-400"/>{new Date(p.punched_at).toLocaleString("en-IN", {dateStyle:"medium",timeStyle:"short"})}</span></td><td className="p-3 font-mono text-xs">{p.latitude.toFixed(6)}, {p.longitude.toFixed(6)}</td><td className="p-3">{p.accuracy_meters == null ? "Not recorded" : "±" + Math.round(p.accuracy_meters) + " m"}</td><td className="p-3"><a className="inline-flex items-center gap-1 font-semibold text-cyan-800 underline" target="_blank" rel="noreferrer" href={`https://www.google.com/maps?q=${p.latitude},${p.longitude}`}>Open map <ExternalLink size={13}/></a></td></tr>)}</tbody></table></div>}
        <p className="mt-4 text-xs text-slate-500">Shows the latest 500 location punches. Coordinates are recorded only when a technician presses the punch button, not by continuous background tracking.</p>
      </section>
    </div>
  </main>;
}
