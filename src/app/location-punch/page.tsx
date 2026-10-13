"use client";
import {useEffect} from "react";
import {useRouter} from "next/navigation";
export default function LocationPunchPage(){const router=useRouter();useEffect(()=>{router.replace("/");},[router]);return <main className="grid min-h-screen place-items-center bg-slate-50 p-6 text-slate-600">Opening secure technician attendance…</main>;}
