"use client";

import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowRight, CheckCircle2, Clock3, MapPin, Phone, ShieldCheck, Wrench } from "lucide-react";

const TENANT_ID = "64a74da0-a831-4ae8-a914-2f0db19a1443";
type Service = { id: string; slug: string; name: string; category: string; short_description: string | null; base_price: number; duration_minutes: number };

export default function BookServicePage() {
  const searchParams = useSearchParams();
  const [services, setServices] = useState<Service[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [area, setArea] = useState("");
  const [preferredAt, setPreferredAt] = useState("");
  const [description, setDescription] = useState("");
  const [consent, setConsent] = useState(false);
  const [loadingServices, setLoadingServices] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    void supabase.from("service_catalog").select("id,slug,name,category,short_description,base_price,duration_minutes")
      .eq("tenant_id", TENANT_ID).eq("active", true).order("display_order")
      .then(({ data, error: queryError }) => {
        if (!alive) return;
        if (queryError) setError("We could not load services. Please refresh or call us.");
        else {
          const rows = (data || []) as Service[];
          setServices(rows);
          const requestedService = searchParams.get("service");
          const requested = rows.find((s) => s.slug === requestedService || s.id === requestedService || s.name.toLowerCase() === requestedService?.toLowerCase());
          if (requested) setServiceId(requested.id); else if (rows[0]) setServiceId(rows[0].id);
        }
        setLoadingServices(false);
      });
    return () => { alive = false; };
  }, []);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true); setError(""); setMessage("");
    const normalizedPhone = phone.replace(/[\s()-]/g, "");
    if (!/^\+?[0-9]{8,15}$/.test(normalizedPhone)) {
      setError("Enter a valid phone number with country code if possible.");
      setSending(false); return;
    }
    const { error: insertError } = await supabase.from("booking_requests").insert({
      tenant_id: TENANT_ID,
      service_id: serviceId || null,
      customer_name: name.trim(),
      customer_phone: normalizedPhone,
      service_address: address.trim(),
      area: area.trim() || null,
      preferred_at: preferredAt ? new Date(preferredAt).toISOString() : null,
      problem_description: description.trim() || null,
      source: "website",
      status: "new",
      privacy_consent: consent,
    });
    if (insertError) {
      setError(insertError.message.includes("row-level security")
        ? "Booking could not be submitted. Please call us while we check the booking configuration."
        : "Booking could not be submitted right now. Please try again or call us.");
    } else {
      setMessage("Order booking confirmed! Your request has been recorded. Our team will contact you to confirm availability, visit time and final charges. No online payment is required at this stage.");
      setName(""); setPhone(""); setAddress(""); setArea(""); setPreferredAt(""); setDescription(""); setConsent(false);
    }
    setSending(false);
  }

  const selected = services.find((s) => s.id === serviceId);
  const groups = Array.from(new Set(services.map((s) => s.category)));

  return <main className="min-h-screen bg-[#f4f7fb] text-slate-900">
    <header className="bg-[#102c46] text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <a href="/" className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#087e8b] font-black">VGS</span><span><span className="block text-xs text-slate-300">Vashishth Global Solutions</span><span className="font-bold">Home Services in Lucknow</span></span></a>
        <a href="tel:9580145185" className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold"><Phone className="mr-2 inline" size={16}/> Call us</a>
      </div>
      <div className="mx-auto grid max-w-6xl gap-8 px-5 pb-12 pt-8 md:grid-cols-2 md:items-center md:pb-16">
        <div><p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-cyan-100"><ShieldCheck size={15}/> Reliable home services in Lucknow</p><h1 className="mt-5 text-4xl font-black leading-tight sm:text-5xl">Home repairs, made <span className="text-cyan-300">simple.</span></h1><p className="mt-4 max-w-xl leading-7 text-slate-300">Request appliance repair, cleaning and handyman services. Submit your order booking and our team will contact you to confirm availability and pricing. Online payment is not required at this stage.</p><div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-200"><span><MapPin className="mr-1 inline" size={16}/> Lucknow</span><span><Wrench className="mr-1 inline" size={16}/> Verified job workflow</span><span><Clock3 className="mr-1 inline" size={16}/> Scheduled visits</span></div></div>
        <div className="rounded-3xl bg-white p-5 text-slate-900 shadow-2xl sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-bold text-[#087e8b]">BOOK A SERVICE</p><h2 className="mt-1 text-2xl font-black">Confirm order booking</h2><p className="mt-2 text-sm text-slate-500">Submit your service details now. No payment step for now.</p></div><div className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-50 text-[#087e8b]"><Wrench size={23}/></div></div>
          <form onSubmit={submit} className="mt-5 space-y-4">
            <label className="block text-sm font-semibold">Choose a service
              <select required value={serviceId} onChange={(e) => setServiceId(e.target.value)} disabled={loadingServices || services.length === 0} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal outline-none focus:border-cyan-700">
                {loadingServices && <option>Loading services…</option>}
                {!loadingServices && services.length === 0 && <option value="">No services available</option>}
                {groups.map((group) => <optgroup key={group} label={group}>{services.filter((s) => s.category === group).map((s) => <option key={s.id} value={s.id}>{s.name} · from ₹{Number(s.base_price).toLocaleString("en-IN")}</option>)}</optgroup>)}
              </select>
            </label>
            {selected && <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600"><span className="font-bold text-slate-900">Indicative starting price: ₹{Number(selected.base_price).toLocaleString("en-IN")}</span><p className="mt-1">{selected.short_description || "Our team will confirm the scope and final price."} Final pricing depends on diagnosis and work required.</p></div>}
            <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-semibold">Your name<input required minLength={2} maxLength={120} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal outline-none focus:border-cyan-700" placeholder="Full name"/></label><label className="block text-sm font-semibold">Mobile number<input required type="tel" maxLength={20} value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal outline-none focus:border-cyan-700" placeholder="+91 98765 43210"/></label></div>
            <label className="block text-sm font-semibold">Service address<input minLength={5} maxLength={500} value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="street-address" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal outline-none focus:border-cyan-700" placeholder="House / flat, street and locality"/></label>
            <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-semibold">Locality / area<input required maxLength={120} value={area} onChange={(e) => setArea(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal outline-none focus:border-cyan-700" placeholder="e.g. Gomti Nagar"/></label><label className="block text-sm font-semibold">Preferred visit time <span className="font-normal text-slate-400">(optional)</span><input type="datetime-local" value={preferredAt} onChange={(e) => setPreferredAt(e.target.value)} min={new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0,16)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal outline-none focus:border-cyan-700"/></label></div>
            <label className="block text-sm font-semibold">Describe the issue <span className="font-normal text-slate-400">(optional)</span><textarea maxLength={2000} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal outline-none focus:border-cyan-700" placeholder="Appliance, issue or service requirements"/></label>
            <label className="flex items-start gap-3 text-xs leading-5 text-slate-500"><input required type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1"/><span>I agree that Vashishth Global Solutions (VGS) may use these details to handle my service request. I have read the privacy notice.</span></label>
            {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
            {message && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800"><CheckCircle2 className="mr-2 inline" size={18}/>{message}</p>}
            <button disabled={sending || loadingServices || services.length === 0} className="w-full rounded-xl bg-[#087e8b] px-4 py-4 font-bold text-white shadow-sm transition hover:bg-[#066a75] disabled:opacity-50">{sending ? "Confirming booking…" : <>Confirm Order Booking <ArrowRight className="ml-2 inline" size={18}/></>}</button>
            <p className="text-center text-xs text-slate-400">No online payment required. Your request is recorded first; our team will contact you to confirm the visit and final charges.</p>
          </form>
        </div>
      </div>
    </header>
    <section className="mx-auto max-w-6xl px-5 py-12"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-bold text-[#087e8b]">OUR SERVICES</p><h2 className="mt-1 text-3xl font-black">Help for your home</h2></div><p className="max-w-md text-sm leading-6 text-slate-500">Starting prices are indicative and can change after inspection or scope confirmation.</p></div><div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{services.map((s) => <article key={s.id} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center justify-between gap-3"><span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-[#087e8b]">{s.category}</span><span className="text-sm font-black">₹{Number(s.base_price).toLocaleString("en-IN")}+</span></div><h3 className="mt-4 text-lg font-bold">{s.name}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{s.short_description}</p><p className="mt-4 text-xs text-slate-400">{s.duration_minutes} min estimated slot</p></article>)}</div></section>
    <footer className="border-t bg-white"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-sm text-slate-500"><span>© {new Date().getFullYear()} Vashishth Global Solutions</span><span>Lucknow · <a href="tel:9580145185" className="font-semibold text-[#087e8b]">9580145185</a></span></div></footer>
  </main>;
}
