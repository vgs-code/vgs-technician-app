"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Phone, ShieldCheck } from "lucide-react";

export default function LoginPage() {
 const [phone,setPhone]=useState("+91");
 const [otp,setOtp]=useState("");
 const [sent,setSent]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const router=useRouter();
 async function sendCode(e:React.FormEvent){e.preventDefault();setBusy(true);setError("");setNotice("");
  const normalized=phone.replace(/[\s()-]/g,"");
  if(!/^\+[1-9]\d{7,14}$/.test(normalized)){setError("Enter a full phone number including country code, e.g. +919876543210.");setBusy(false);return;}
  const {error}=await supabase.auth.signInWithOtp({phone:normalized});
  if(error)setError(error.message);else{setSent(true);setNotice("OTP requested. Enter the code sent to your phone.");}
  setBusy(false);
 }
 async function verify(e:React.FormEvent){e.preventDefault();setBusy(true);setError("");
  const normalized=phone.replace(/[\s()-]/g,"");
  const {data,error}=await supabase.auth.verifyOtp({phone:normalized,token:otp.trim(),type:"sms"});
  if(error){setError(error.message);setBusy(false);return;}
  if(!data.user){setError("OTP verification did not return a user. Please retry.");setBusy(false);return;}
  const {data:profile,error:profileError}=await supabase.from("technician_profiles").select("user_id,full_name,active").eq("user_id",data.user.id).maybeSingle();
  if(profileError||!profile||!profile.active){await supabase.auth.signOut();setError("This phone is not enabled as an active VGS technician. Contact your administrator.");setBusy(false);return;}
  router.replace("/");router.refresh();
 }
 return <main className="flex min-h-screen items-center justify-center bg-[#f4f7fb] p-4"><section className="w-full max-w-md rounded-3xl border bg-white p-7 shadow-sm"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#102c46] text-white"><ShieldCheck size={28}/></div><p className="mt-5 text-xs font-bold tracking-wide text-cyan-800">VASHISHTH HOME SERVICE</p><h1 className="mt-2 text-2xl font-bold text-slate-900">Technician sign in</h1><p className="mt-2 text-sm leading-6 text-slate-600">Use the registered mobile number to receive a one-time password. Only active technicians approved by VGS can access assigned jobs.</p><form onSubmit={sent?verify:sendCode} className="mt-6 space-y-4"><label className="block text-sm font-semibold">Mobile number with country code</label><div className="flex items-center gap-2 rounded-xl border px-3"><Phone size={18} className="text-slate-400"/><input required type="tel" value={phone} onChange={e=>setPhone(e.target.value)} disabled={sent} placeholder="+919876543210" className="w-full py-3 outline-none"/></div>{sent&&<><label className="block text-sm font-semibold">SMS OTP</label><input required inputMode="numeric" autoComplete="one-time-code" value={otp} onChange={e=>setOtp(e.target.value)} placeholder="Enter OTP" className="w-full rounded-xl border px-3 py-3 outline-none"/></>}<button disabled={busy} className="w-full rounded-xl bg-[#087e8b] py-3.5 font-bold text-white disabled:opacity-60">{busy?"Please wait...":sent?"Verify OTP and sign in":"Send OTP"}</button></form>{sent&&<button onClick={()=>{setSent(false);setOtp("");setNotice("");setError("");}} className="mt-3 w-full text-sm font-semibold text-cyan-800">Change phone number</button>}{notice&&<p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}{error&&<p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}<p className="mt-5 text-xs leading-5 text-slate-500">Location is only collected when you explicitly punch attendance. SMS delivery depends on the Supabase phone provider configuration.</p></section></main>;
}
