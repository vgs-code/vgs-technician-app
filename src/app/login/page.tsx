"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Mail, ShieldCheck } from "lucide-react";

export default function LoginPage() {
 const [email,setEmail]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 async function sendLink(e:React.FormEvent){
  e.preventDefault();setBusy(true);setError("");setNotice("");
  const normalized=email.trim().toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)){setError("Enter a valid email address.");setBusy(false);return;}
  const {error}=await supabase.auth.signInWithOtp({email:normalized,options:{emailRedirectTo:window.location.origin+"/technician"}});
  if(error)setError(error.message);
  else setNotice("Sign-in link sent. Open the email on this device to securely access your technician workspace. Only active VGS technicians can sign in.");
  setBusy(false);
 }
 return <main className="flex min-h-screen items-center justify-center bg-[#f4f7fb] p-4"><section className="w-full max-w-md rounded-3xl border bg-white p-7 shadow-sm"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#102c46] text-white"><ShieldCheck size={28}/></div><p className="mt-5 text-xs font-bold tracking-wide text-cyan-800">VASHISHTH HOME SERVICE</p><h1 className="mt-2 text-2xl font-bold text-slate-900">Technician sign in</h1><p className="mt-2 text-sm leading-6 text-slate-600">Sign in using your registered email address. We will email you a secure magic link instead of sending an SMS OTP. Only active technicians approved by VGS can access assigned jobs.</p><form onSubmit={sendLink} className="mt-6 space-y-4"><label className="block text-sm font-semibold">Registered email address</label><div className="flex items-center gap-2 rounded-xl border px-3"><Mail size={18} className="text-slate-400"/><input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="technician@example.com" className="w-full py-3 outline-none"/></div><button disabled={busy} className="w-full rounded-xl bg-[#087e8b] py-3.5 font-bold text-white disabled:opacity-60">{busy?"Sending link...":"Email me a sign-in link"}</button></form>{notice&&<p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm leading-6 text-emerald-800">{notice}</p>}{error&&<p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}<p className="mt-5 text-xs leading-5 text-slate-500">No SMS OTP is used on this page. Your email must be registered to an active technician profile in the VGS system. If the link does not work, the production URL may need to be added to Supabase Auth redirect URL settings.</p></section></main>;
}
