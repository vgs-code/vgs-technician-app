"use client";
import {useState} from "react";
import {MapPin,LocateFixed,CheckCircle2,AlertTriangle} from "lucide-react";

const SUPABASE_URL = "https://mpjzvniouurkmcdqhprw.supabase.co";
const SUPABASE_KEY = "sb_publishable_9RK1zCcRIolMTYSUMhWGSw_XxqioAur";

export default function LocationPunchPage() {
 const [name,setName]=useState("");
 const [code,setCode]=useState("");
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const [error,setError]=useState(false);
 async function punch() {
  setMessage(""); setError(false);
  if(!name.trim()||!code.trim()){setMessage("Enter your technician name and ID first.");setError(true);return;}
  if(!navigator.geolocation){setMessage("Location is not supported by this device/browser.");setError(true);return;}
  setBusy(true);
  navigator.geolocation.getCurrentPosition(async pos=>{
   try {
    const response=await fetch(SUPABASE_URL+"/rest/v1/technician_location_punches",{
     method:"POST",
     headers:{"Content-Type":"application/json","apikey":SUPABASE_KEY,"Authorization":"Bearer "+SUPABASE_KEY,"Prefer":"return=minimal"},
     body:JSON.stringify({technician_name:name.trim(),technician_code:code.trim(),latitude:pos.coords.latitude,longitude:pos.coords.longitude,accuracy_meters:pos.coords.accuracy,punch_type:"check_in"})
    });
    if(!response.ok) throw new Error(await response.text());
    setMessage("Location check-in saved. Your admin can review the timestamp and coordinates in Supabase.");
   } catch(e) {setMessage("Could not save check-in. Please retry or contact admin.");setError(true);}
   finally {setBusy(false);}
  },e=>{setBusy(false);setError(true);setMessage(e.code===1?"Location permission was denied. Allow location access in browser settings and try again.":"Could not get your location. Turn on device location and retry.");},{enableHighAccuracy:true,timeout:15000,maximumAge:0});
 }
 return <main className="mx-auto min-h-screen max-w-lg bg-[#f4f7fb] p-5">
  <header className="rounded-3xl bg-[#102c46] p-6 text-white"><div className="flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#189ab4]"><MapPin/></div><div><p className="text-xs text-slate-300">Vashishth Home Service</p><h1 className="text-xl font-bold">Technician Location Punch</h1></div></div><p className="mt-4 text-sm text-slate-200">Submit your current location when you start your shift. Location is captured only when you press the button.</p></header>
  <section className="mt-5 rounded-3xl border bg-white p-5"><label className="block text-sm font-semibold">Technician name</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="Enter your name" className="mt-2 w-full rounded-xl border p-3 outline-none focus:border-cyan-700"/><label className="mt-4 block text-sm font-semibold">Technician ID</label><input value={code} onChange={e=>setCode(e.target.value)} placeholder="e.g. VGS-TECH-001" className="mt-2 w-full rounded-xl border p-3 outline-none focus:border-cyan-700"/><button disabled={busy} onClick={punch} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#087e8b] py-4 font-bold text-white disabled:opacity-60"><LocateFixed size={18}/>{busy?"Getting location...":"Punch current location"}</button>{message&&<p className={"mt-4 rounded-xl p-3 text-sm "+(error?"bg-red-50 text-red-800":"bg-emerald-50 text-emerald-800")}>{error?<AlertTriangle className="mr-2 inline" size={17}/>:<CheckCircle2 className="mr-2 inline" size={17}/>} {message}</p>}</section>
  <p className="mt-4 text-xs leading-5 text-slate-500">Location permission is required. This page does not track continuously in the background. Share location with staff only under your business policy and inform technicians about what is collected.</p>
 </main>;
}
