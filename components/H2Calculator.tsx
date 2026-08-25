import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// ─────────────────────────────────────────────
// PHYSICS CONSTANTS
// ─────────────────────────────────────────────
const H2_HHV = 39.4;
const WIND_SHEAR = 0.143;
const MIN_LOAD_ALK = 0.20;
const MIN_LOAD_PEM = 0.05;
const ALK_CURVE: [number,number][] = [[0,0],[0.2,0.55],[0.3,0.60],[0.4,0.63],[0.5,0.65],[0.6,0.670],[0.7,0.685],[0.8,0.680],[0.9,0.665],[1.0,0.650]];
const PEM_CURVE: [number,number][] = [[0,0],[0.05,0.60],[0.2,0.65],[0.4,0.68],[0.6,0.70],[0.8,0.695],[1.0,0.68]];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTH_DAYS = [31,28,31,30,31,30,31,31,30,31,30,31];
const MONTH_HOURS = [744,672,744,720,744,720,744,744,720,744,720,744];

const PANEL_META: Record<string,{label:string;tempCoeff:number;desc:string}> = {
  mono:     { label:"Monocrystalline (20–23%)", tempCoeff:-0.0035, desc:"Most efficient. Best for limited space." },
  poly:     { label:"Polycrystalline (15–17%)", tempCoeff:-0.0040, desc:"Good value for large ground installs." },
  thin:     { label:"Thin-film (10–13%)",        tempCoeff:-0.0020, desc:"Works well in diffuse/cloudy light." },
  bifacial: { label:"Bifacial (+8–12% rear)",    tempCoeff:-0.0030, desc:"Captures reflected light. Ideal for ground mounts." },
};

const SOLAR: Record<string,number[]> = {
  AB:[0.4,0.9,1.9,3.3,4.3,4.6,4.4,3.8,2.6,1.4,0.6,0.3],IV:[0.4,0.9,1.9,3.3,4.4,4.7,4.5,3.8,2.6,1.4,0.6,0.3],
  KW:[0.3,0.8,1.8,3.2,4.3,4.6,4.4,3.7,2.5,1.3,0.5,0.3],ZE:[0.3,0.7,1.7,3.1,4.2,4.5,4.3,3.6,2.4,1.2,0.5,0.2],
  EH:[0.5,1.1,2.1,3.5,4.5,4.9,4.7,4.0,2.8,1.6,0.7,0.4],G:[0.5,1.0,2.1,3.5,4.5,4.9,4.7,4.0,2.8,1.5,0.7,0.4],
  NE:[0.6,1.2,2.3,3.7,4.8,5.2,5.0,4.3,3.0,1.7,0.8,0.5],TS:[0.7,1.3,2.3,3.8,4.8,5.2,5.0,4.3,3.1,1.8,0.9,0.6],
  DH:[0.6,1.2,2.3,3.7,4.8,5.2,5.0,4.3,3.0,1.7,0.8,0.5],LN:[0.8,1.5,2.6,4.1,5.2,5.6,5.4,4.8,3.4,2.0,1.0,0.7],
  YO:[0.7,1.3,2.4,3.9,5.0,5.4,5.2,4.5,3.2,1.8,0.9,0.6],LS:[0.7,1.3,2.3,3.8,4.8,5.2,5.0,4.3,3.1,1.8,0.9,0.6],
  NG:[0.8,1.4,2.5,4.0,5.1,5.5,5.2,4.6,3.3,1.9,1.0,0.7],DE:[0.8,1.4,2.5,4.0,5.1,5.5,5.2,4.6,3.3,1.9,1.0,0.7],
  B:[0.8,1.5,2.6,4.1,5.1,5.6,5.3,4.7,3.4,2.0,1.0,0.7],CV:[0.8,1.5,2.6,4.1,5.1,5.6,5.3,4.7,3.4,2.0,1.0,0.7],
  OX:[0.9,1.6,2.8,4.3,5.4,5.9,5.6,5.0,3.6,2.1,1.1,0.8],CB:[0.9,1.6,2.7,4.2,5.3,5.8,5.5,4.9,3.5,2.1,1.1,0.8],
  E:[1.0,1.7,2.9,4.4,5.5,6.0,5.7,5.1,3.7,2.2,1.2,0.8],SW:[1.0,1.7,2.9,4.4,5.5,6.0,5.7,5.1,3.7,2.2,1.2,0.8],
  SE:[1.0,1.7,2.9,4.4,5.5,6.0,5.7,5.1,3.7,2.2,1.2,0.8],NW:[1.0,1.7,2.9,4.4,5.5,6.0,5.7,5.1,3.7,2.2,1.2,0.8],
  TR:[1.3,2.1,3.4,4.9,6.0,6.5,6.2,5.6,4.1,2.5,1.4,1.0],PL:[1.1,1.9,3.2,4.7,5.8,6.3,6.0,5.4,3.9,2.4,1.3,0.9],
  EX:[1.1,1.9,3.2,4.7,5.8,6.3,6.0,5.4,3.9,2.4,1.3,0.9],BN:[1.1,1.8,3.0,4.5,5.6,6.2,5.9,5.3,3.8,2.3,1.2,0.9],
  PO:[1.1,1.9,3.1,4.6,5.7,6.3,6.0,5.3,3.9,2.3,1.2,0.9],M:[0.7,1.2,2.2,3.7,4.7,5.1,4.9,4.2,3.0,1.7,0.8,0.5],
  L:[0.7,1.3,2.3,3.8,4.8,5.2,5.0,4.3,3.1,1.7,0.9,0.6],BT:[0.6,1.1,2.1,3.6,4.6,5.0,4.8,4.1,2.9,1.6,0.8,0.5],
  CF:[0.9,1.6,2.7,4.2,5.3,5.8,5.5,4.9,3.5,2.0,1.0,0.7],SA:[1.0,1.7,2.8,4.3,5.4,5.9,5.6,5.0,3.6,2.1,1.1,0.7],
  DEFAULT:[0.8,1.4,2.5,4.0,5.0,5.5,5.2,4.6,3.3,1.9,1.0,0.7],
};

const WIND_SPD: Record<string,number[]> = {
  ZE:[9.0,8.8,8.1,7.5,7.2,6.9,6.8,7.0,7.5,8.1,8.6,9.1],KW:[8.0,7.8,7.2,6.7,6.5,6.2,6.1,6.3,6.7,7.2,7.7,8.1],
  IV:[7.8,7.5,7.0,6.5,6.3,6.0,5.9,6.1,6.5,7.0,7.5,7.9],TR:[7.0,6.8,6.3,5.8,5.6,5.3,5.2,5.4,5.8,6.3,6.7,7.1],
  PA:[6.8,6.6,6.1,5.6,5.4,5.1,5.0,5.2,5.6,6.1,6.5,6.9],SA:[6.5,6.3,5.8,5.4,5.2,4.9,4.8,5.0,5.4,5.8,6.2,6.6],
  CA:[6.2,6.0,5.6,5.2,5.0,4.8,4.7,4.8,5.2,5.6,6.0,6.3],NR:[5.8,5.7,5.3,4.9,4.7,4.5,4.4,4.5,4.9,5.3,5.6,5.9],
  CT:[5.8,5.7,5.3,4.9,4.7,4.5,4.4,4.5,4.9,5.3,5.6,5.9],NE:[5.2,5.1,4.7,4.3,4.2,4.0,3.9,4.0,4.3,4.7,5.0,5.3],
  DH:[5.0,4.9,4.5,4.2,4.1,3.9,3.8,3.9,4.2,4.5,4.8,5.1],SR:[5.0,4.9,4.5,4.2,4.1,3.9,3.8,3.9,4.2,4.5,4.8,5.1],
  LN:[5.3,5.2,4.8,4.4,4.3,4.1,4.0,4.1,4.4,4.8,5.1,5.4],HU:[5.5,5.4,5.0,4.6,4.4,4.2,4.1,4.2,4.6,5.0,5.3,5.6],
  BN:[5.0,4.9,4.5,4.2,4.0,3.8,3.7,3.8,4.2,4.5,4.8,5.1],PO:[5.2,5.1,4.7,4.3,4.2,4.0,3.9,4.0,4.3,4.7,5.0,5.3],
  EC:[3.5,3.4,3.2,2.9,2.8,2.7,2.6,2.7,2.9,3.2,3.4,3.5],SW:[3.8,3.7,3.4,3.1,3.0,2.9,2.8,2.9,3.1,3.4,3.6,3.8],
  DEFAULT:[5.0,4.9,4.5,4.2,4.0,3.8,3.7,3.8,4.2,4.5,4.8,5.1],
};

const TEMPS: Record<string,number[]> = {
  far_north:[3,3,5,8,11,14,16,16,13,9,5,3],
  north:[4,4,6,9,12,15,17,17,14,10,6,4],
  mid:[5,5,7,10,13,16,18,18,15,11,7,5],
  south:[6,6,8,11,14,17,19,19,16,12,8,6],
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function getArea(pc: string): string {
  return (pc||"").toUpperCase().replace(/\s/g,"").match(/^([A-Z]{1,2})/)?.[1] || "";
}
function latFromPostcode(pc: string): number {
  const a = getArea(pc);
  const far = ["AB","DD","EH","FK","G","IV","KA","KW","KY","ML","PA","PH","TD","ZE","BT"];
  const nth  = ["NE","SR","DH","CA","DL","TS","LA","BB","FY","PR","L","M","WN","BL","OL","SK","WA","CH"];
  const sth  = ["TR","PL","TQ","EX","CT","BN","PO","TN","GY","JE","BH","DT"];
  if (far.includes(a)) return 57;
  if (nth.includes(a)) return 54;
  if (sth.includes(a)) return 50.5;
  return 52;
}

function weibullAvgPower(v10m_mean: number, turbP: {hubH:number;cutIn:number;cutOut:number;vRated:number;pRatedKW:number}): number {
  if (v10m_mean <= 0 || turbP.pRatedKW <= 0) return 0;
  const hubH = Math.max(turbP.hubH || 30, 5);
  const v_hub = v10m_mean * Math.pow(hubH / 10, WIND_SHEAR);
  const c = v_hub * 2 / Math.sqrt(Math.PI);
  const v_max = Math.max(turbP.cutOut * 1.1, 3 * v_hub);
  const N = 400;
  const dv = v_max / N;
  let sum = 0;
  for (let i = 0; i < N; i++) {
    const v = (i + 0.5) * dv;
    const pdf = (2 * v / (c * c)) * Math.exp(-(v / c) * (v / c));
    let p = 0;
    if (v >= turbP.cutIn && v <= turbP.cutOut) {
      p = v >= turbP.vRated
        ? turbP.pRatedKW
        : turbP.pRatedKW * Math.pow((v - turbP.cutIn) / (turbP.vRated - turbP.cutIn), 3);
    }
    sum += p * pdf * dv;
  }
  return sum;
}

function lerpCurve(curve: [number,number][], x: number): number {
  if (x <= curve[0][0]) return curve[0][1];
  for (let i = 0; i < curve.length - 1; i++) {
    const [x0,y0] = curve[i], [x1,y1] = curve[i+1];
    if (x <= x1) return y0 + (x-x0)/(x1-x0)*(y1-y0);
  }
  return curve[curve.length-1][1];
}

function electEff(loadFrac: number, type: string): number {
  const minLoad = type === "pem" ? MIN_LOAD_PEM : MIN_LOAD_ALK;
  if (loadFrac < minLoad) return 0;
  return lerpCurve(type === "alkaline" ? ALK_CURVE : PEM_CURVE, Math.min(loadFrac, 1.0));
}

function calcSolarKWh(postcode: string, solar: any): number[] {
  const irr = SOLAR[getArea(postcode)] || SOLAR.DEFAULT;
  const kWp = (Number(solar.numPanels) * Number(solar.panelWatt)) / 1000;
  if (kWp <= 0) return Array(12).fill(0);
  const sysLoss = 1 - (Number(solar.lossP)||14)/100;
  const invEff  = (Number(solar.invEff)||97)/100;
  const tiltRad = ((Number(solar.tilt)||35) * Math.PI) / 180;
  const aspectRad = ((Number(solar.orient)||0) * Math.PI) / 180;
  const tiltFactor   = Math.max(0.65, Math.cos(tiltRad - 0.6109));
  const aspectFactor = Math.cos(aspectRad) * 0.12 + 0.88;
  const geom = tiltFactor * aspectFactor;
  const bifacial = solar.panelType === "bifacial" ? 1.09 : 1.0;
  const tempCoeff = PANEL_META[solar.panelType||"mono"]?.tempCoeff || -0.0035;
  const lat = latFromPostcode(postcode);
  const tempKey = lat > 56 ? "far_north" : lat > 53 ? "north" : lat > 51 ? "mid" : "south";
  const temps = TEMPS[tempKey];
  return irr.map((d, m) => {
    const td = 1 + tempCoeff * (temps[m] - 25);
    return Math.max(0, d * MONTH_DAYS[m] * kWp * sysLoss * invEff * geom * bifacial * td);
  });
}

function calcWindKWh(postcode: string, wind: any): number[] {
  const speeds = WIND_SPD[getArea(postcode)] || WIND_SPD.DEFAULT;
  const turbP = {
    hubH:    Number(wind.hubH)||30,
    cutIn:   Number(wind.cutIn)||3,
    cutOut:  Number(wind.cutOut)||25,
    vRated:  Number(wind.vRated)||12,
    pRatedKW:Number(wind.pRatedKW)||0,
  };
  if (turbP.pRatedKW <= 0) return Array(12).fill(0);
  const nTurb = Number(wind.nTurbines)||1;
  const wake  = nTurb > 1 ? 1 - (Number(wind.wakeLoss)||8)/100 : 1.0;
  return speeds.map((v10m, m) => {
    const avgPower = weibullAvgPower(v10m, turbP);
    return avgPower * nTurb * wake * MONTH_HOURS[m];
  });
}

function suggestElectrolyserKW(postcode: string, sourceType: string, solar: any, wind: any, hydro: any, lab: any): number {
  let monthlyKWh = Array(12).fill(0);
  if (sourceType === "solar" || sourceType === "hybrid")
    monthlyKWh = monthlyKWh.map((v,i) => v + calcSolarKWh(postcode, solar)[i]);
  if (sourceType === "wind" || sourceType === "hybrid")
    monthlyKWh = monthlyKWh.map((v,i) => v + calcWindKWh(postcode, wind)[i]);
  if (sourceType === "hydro")
    monthlyKWh = MONTH_HOURS.map(h => (Number(hydro?.capacityKW)||0) * ((Number(hydro?.capFactor)||45)/100) * h);
  if (sourceType === "lab")
    monthlyKWh = MONTH_HOURS.map(h => (Number(lab?.powerKW)||0) * ((Number(lab?.hoursPerDay)||8)/24) * h);
  const annualKWh = monthlyKWh.reduce((a,b) => a+b, 0);
  const avgPower  = annualKWh / 8760;
  return Math.max(1, avgPower * 0.8);
}

function runCalc(inputs: any) {
  const { sourceType, postcode, solar, wind, hydro, lab, elect, revenue } = inputs;
  let monthlyKWh = Array(12).fill(0);
  const area = getArea(postcode);
  const locationLabel = postcode ? `${postcode.toUpperCase()}${area?" ("+area+" area)":""}` : "UK average";

  if (sourceType === "solar" || sourceType === "hybrid") {
    const kWh = calcSolarKWh(postcode, solar);
    monthlyKWh = monthlyKWh.map((v,i) => v + kWh[i]);
  }
  if (sourceType === "wind" || sourceType === "hybrid") {
    const kWh = calcWindKWh(postcode, wind);
    monthlyKWh = monthlyKWh.map((v,i) => v + kWh[i]);
  }
  if (sourceType === "hydro") {
    const kW = (Number(hydro?.capacityKW)||0) * ((Number(hydro?.capFactor)||45)/100);
    monthlyKWh = MONTH_HOURS.map(h => kW * h);
  }
  if (sourceType === "lab") {
    monthlyKWh = MONTH_HOURS.map(h => (Number(lab?.powerKW)||0) * ((Number(lab?.hoursPerDay)||8)/24) * h);
  }

  const annualKWh = monthlyKWh.reduce((a,b) => a+b, 0);
  const avgPower  = annualKWh / 8760;
  const electKW   = Number(elect.ratedKW) > 0 ? Number(elect.ratedKW) : suggestElectrolyserKW(postcode, sourceType, solar, wind, hydro, lab);
  const electType = elect.type || "alkaline";
  const storageDayKg = Number(elect.storageKgDay)||0;
  const minLoad = electType === "pem" ? MIN_LOAD_PEM : MIN_LOAD_ALK;

  const h2Monthly = monthlyKWh.map((kWh, m) => {
    if (kWh <= 0 || electKW <= 0) return 0;
    const avgP = kWh / MONTH_HOURS[m];
    const load = Math.min(avgP / electKW, 1.0);
    const eff  = electEff(load, electType);
    if (eff === 0) return 0;
    let h2 = (kWh * eff) / H2_HHV;
    if (storageDayKg > 0) h2 = Math.min(h2, storageDayKg * MONTH_DAYS[m]);
    return h2;
  });

  const annualH2Kg = h2Monthly.reduce((a,b) => a+b, 0);
  let h2Price = 8.50;
  if (revenue.mode === "contract") h2Price = parseFloat(revenue.customPrice)||8.50;
  if (revenue.mode === "onsite")   h2Price = (parseFloat(revenue.dieselPrice)||1.55) * 1.25 * 9;
  const annualRevenue = annualH2Kg * h2Price;

  let capex = Number(elect.capexGBP)||0;
  if (!capex) {
    capex += electKW * (electType === "pem" ? 1200 : 700);
    if (sourceType === "solar" || sourceType === "hybrid") {
      const kWp = (Number(solar.numPanels)*Number(solar.panelWatt))/1000;
      capex += kWp * (solar.secondLife !== false ? 360 : 800);
    }
    if (sourceType === "wind" || sourceType === "hybrid") {
      capex += Number(wind.pRatedKW) * (Number(wind.nTurbines)||1) * 1500;
    }
  }

  const payback  = annualRevenue > 0 ? capex / annualRevenue : null;
  const co2Saved = annualH2Kg * 9 / 1000;

  const warnings: any[] = [];
  const avgLoadFrac = avgPower / electKW;
  let curtailmentMonths = 0;
  h2Monthly.forEach((_, m) => {
    const load = monthlyKWh[m] / MONTH_HOURS[m] / electKW;
    if (load < minLoad) curtailmentMonths++;
  });
  if (curtailmentMonths >= 6 && electType === "alkaline") {
    warnings.push({ msg: `Electrolyser oversized for this resource. ${curtailmentMonths} months below 20% alkaline minimum load. Consider PEM or reduce to ${(avgPower * 0.5).toFixed(0)} kW.`, suggest: (avgPower * 0.5).toFixed(0) });
  }
  if (avgLoadFrac < 0.15 && Number(elect.ratedKW) > 0) {
    warnings.push({ msg: `Average load factor is only ${(avgLoadFrac*100).toFixed(0)}%. Suggested size: ${(avgPower * 0.8).toFixed(0)} kW.` });
  }

  const windCF = (sourceType === "wind" || sourceType === "hybrid") ? (() => {
    const kWhAnnual = calcWindKWh(postcode, wind).reduce((a,b)=>a+b,0);
    const ratedKW = Number(wind.pRatedKW) * (Number(wind.nTurbines)||1);
    return ratedKW > 0 ? kWhAnnual / (ratedKW * 8760) : null;
  })() : null;

  const solarYield = (sourceType === "solar" || sourceType === "hybrid") ? (() => {
    const kWp = (Number(solar.numPanels)*Number(solar.panelWatt))/1000;
    const kWhAnnual = calcSolarKWh(postcode, solar).reduce((a,b)=>a+b,0);
    return kWp > 0 ? kWhAnnual / kWp : null;
  })() : null;

  return { locationLabel, monthlyKWh, h2Monthly, annualH2Kg, annualKWh, avgPower,
    electKW, electKWauto: !(Number(elect.ratedKW) > 0), annualRevenue, h2Price,
    capex, payback, co2Saved, curtailmentMonths, windCF, solarYield, warnings };
}

async function getAIInsights(inputs: any, results: any) {
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 700,
        messages: [{ role: "user", content: `You are a green hydrogen expert. Analyse this Fluxero SMHP calculation.\n\nLocation: ${results.locationLabel}\nSource: ${inputs.sourceType}\nAverage power: ${results.avgPower.toFixed(1)} kW\nElectrolyser: ${results.electKW.toFixed(0)} kW ${inputs.elect.type}\nAnnual H2: ${results.annualH2Kg.toFixed(0)} kg\nRevenue: £${results.annualRevenue.toFixed(0)}\nPayback: ${results.payback?.toFixed(1)||"N/A"} yrs\n\nRespond ONLY in valid JSON:\n{"farmerSummary":"2-3 plain English sentences","insights":["insight 1","insight 2"],"mainRisk":"single sentence","recommendation":"single most impactful action"}` }],
      }),
    });
    const d = await res.json();
    return JSON.parse((d.content?.[0]?.text||"{}").replace(/```json|```/g,"").trim());
  } catch { return null; }
}

// ─────────────────────────────────────────────
// DESIGN SYSTEM (matches website dark theme)
// ─────────────────────────────────────────────
const C = {
  bg0:"#060508",bg1:"#0A0809",bg2:"#0F0D10",bg3:"#141215",bg4:"#1A1720",
  green:"#00D68F",greenD:"#00A86B",greenGlow:"rgba(0,214,143,0.08)",
  amber:"#00E5B8",red:"#FF4050",
  white:"#F0EBE0",grey:"#7C8799",greyL:"#A8A3B3",
  border:"rgba(255,255,255,0.065)",
};

const Lbl: React.FC<{children:React.ReactNode;hint?:string;req?:boolean}> = ({children,hint,req}) => (
  <div style={{marginBottom:hint?3:8}}>
    <span style={{fontSize:15,fontWeight:600,color:C.white,display:"block",fontFamily:"'Syne',sans-serif"}}>
      {children}{req&&<span style={{color:C.green,marginLeft:4}}>*</span>}
    </span>
    {hint&&<div style={{fontSize:13,color:C.grey,marginTop:2,lineHeight:1.5}}>{hint}</div>}
  </div>
);

const Inp: React.FC<{value:any;onChange:(v:string)=>void;placeholder?:string;unit?:string;type?:string;error?:string}> = ({value,onChange,placeholder,unit,type="number",error}) => (
  <div>
    <div style={{display:"flex",alignItems:"center",background:C.bg3,border:`1.5px solid ${error?C.red:C.border}`,borderRadius:8,overflow:"hidden"}}>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{flex:1,background:"none",border:"none",outline:"none",padding:"11px 14px",fontSize:15,color:C.white,fontFamily:"'IBM Plex Mono',monospace",boxSizing:"border-box"}}/>
      {unit&&<span style={{padding:"0 12px",color:C.grey,fontSize:13,borderLeft:`1px solid ${C.border}`,whiteSpace:"nowrap"}}>{unit}</span>}
    </div>
    {error&&<div style={{fontSize:13,color:C.red,marginTop:3}}>{error}</div>}
  </div>
);

const Sel: React.FC<{value:any;onChange:(v:string)=>void;options:{value:string;label:string}[]}> = ({value,onChange,options}) => (
  <select value={value} onChange={e=>onChange(e.target.value)}
    style={{width:"100%",background:C.bg3,border:`1.5px solid ${C.border}`,borderRadius:8,padding:"11px 14px",fontSize:15,color:C.white,outline:"none",cursor:"pointer",appearance:"none" as any}}>
    {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);

const G2: React.FC<{children:React.ReactNode;gap?:number}> = ({children,gap=12}) => <div className="h2-grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap}}>{children}</div>;
const G3: React.FC<{children:React.ReactNode}> = ({children}) => <div className="h2-grid-3" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>{children}</div>;
const Field: React.FC<{label:string;hint?:string;req?:boolean;children:React.ReactNode}> = ({label,hint,req,children}) => <div style={{marginBottom:16}}><Lbl req={req} hint={hint}>{label}</Lbl>{children}</div>;
const Sec: React.FC<{children:React.ReactNode}> = ({children}) => <div style={{fontSize:10,fontWeight:700,letterSpacing:"2px",color:C.greenD,marginBottom:12,marginTop:4,fontFamily:"'IBM Plex Mono',monospace"}}>{children}</div>;
const Hr = () => <div style={{borderTop:`1px solid ${C.border}`,margin:"20px 0"}}/>;

const InfoTip: React.FC<{text:string}> = ({text}) => {
  const [show, setShow] = React.useState(false);
  return (
    <span style={{position:"relative",display:"inline-block",marginLeft:6}}>
      <button
        onMouseEnter={()=>setShow(true)}
        onMouseLeave={()=>setShow(false)}
        onClick={()=>setShow(v=>!v)}
        style={{width:16,height:16,borderRadius:"50%",background:C.bg4,border:`1px solid ${C.border}`,color:C.grey,fontSize:12,cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center",fontFamily:"serif"}}
      >?</button>
      {show&&<div style={{position:"absolute",left:"50%",bottom:"calc(100% + 8px)",transform:"translateX(-50%)",background:C.bg4,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 12px",width:220,fontSize:13,color:C.greyL,lineHeight:1.6,zIndex:100,boxShadow:"0 4px 20px rgba(0,0,0,0.4)"}}>
        {text}
        <div style={{position:"absolute",bottom:-5,left:"50%",width:8,height:8,background:C.bg4,border:`1px solid ${C.border}`,borderRight:"none",borderTop:"none",transform:"translateX(-50%) rotate(-45deg)"}}/>
      </div>}
    </span>
  );
};

const Toggle: React.FC<{checked:boolean;onChange:(v:boolean)=>void;label:string;sub?:string}> = ({checked,onChange,label,sub}) => (
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:C.bg3,border:`1px solid ${C.border}`,borderRadius:10,padding:"14px 16px"}}>
    <div>
      <div style={{fontSize:15,fontWeight:600,color:C.white}}>{label}</div>
      {sub&&<div style={{fontSize:13,color:C.grey,marginTop:2}}>{sub}</div>}
    </div>
    <button onClick={()=>onChange(!checked)} style={{width:44,height:24,borderRadius:12,border:"none",background:checked?C.green:C.bg4,cursor:"pointer",position:"relative",transition:"background 0.2s",flexShrink:0,marginLeft:16}}>
      <div style={{position:"absolute",top:3,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left 0.2s",left:checked?23:3}}/>
    </button>
  </div>
);

// ─────────────────────────────────────────────
// STEP COMPONENTS
// ─────────────────────────────────────────────
function S0_Source({value,onChange}: {value:string;onChange:(v:string)=>void}) {
  const opts = [
    {id:"solar",icon:"☀️",label:"Solar",sub:"PV panels"},
    {id:"wind",icon:"💨",label:"Wind",sub:"Turbines"},
    {id:"hybrid",icon:"⚡",label:"Solar + Wind",sub:"Combined"},
    {id:"hydro",icon:"💧",label:"Hydro / Other",sub:"Run-of-river"},
    {id:"lab",icon:"🔬",label:"Lab / PSU",sub:"Bench test"},
  ];
  return (
    <div>
      <h2 style={{fontSize:20,fontWeight:800,color:C.white,marginBottom:6,fontFamily:"'Syne',sans-serif"}}>What is your energy source?</h2>
      <p style={{fontSize:15,color:C.grey,marginBottom:24}}>Select the primary renewable source powering your hydrogen plant.</p>
      <div className="h2-grid-5" style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10}}>
        {opts.map(o=>(
          <button key={o.id} onClick={()=>onChange(o.id)} style={{padding:"18px 8px",border:`1.5px solid ${value===o.id?C.green:C.border}`,borderRadius:12,background:value===o.id?C.greenGlow:C.bg3,cursor:"pointer",outline:"none",textAlign:"center",transition:"all 0.2s"}}>
            <div style={{fontSize:24,marginBottom:6}}>{o.icon}</div>
            <div style={{fontSize:14,fontWeight:700,color:value===o.id?C.green:C.white,fontFamily:"'Syne',sans-serif"}}>{o.label}</div>
            <div style={{fontSize:12,color:C.grey,marginTop:2}}>{o.sub}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function S1_Location({data,onChange}: {data:any;onChange:(v:any)=>void}) {
  return (
    <div>
      <h2 style={{fontSize:20,fontWeight:800,color:C.white,marginBottom:6,fontFamily:"'Syne',sans-serif"}}>Where is your site?</h2>
      <p style={{fontSize:15,color:C.grey,marginBottom:22}}>We have built-in solar irradiance and wind speed data for every UK postcode area — no internet lookup needed.</p>
      <Field label="UK Postcode" req hint="e.g. LN1 1AA or DH1 3RG — we use the first 1–2 letters to look up your area data">
        <Inp value={data.postcode||""} onChange={v=>onChange({...data,postcode:v})} placeholder="e.g. LN1 1AA" type="text"/>
      </Field>
      <div style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:10,padding:"14px 16px"}}>
        <div style={{fontSize:13,fontWeight:700,color:C.greenD,marginBottom:8,fontFamily:"'IBM Plex Mono',monospace"}}>WHY POSTCODE MATTERS</div>
        <div style={{fontSize:13,color:C.grey,lineHeight:1.9}}>
          <div>• <b style={{color:C.greyL}}>Solar:</b> Cornwall gets ~40% more irradiance than Edinburgh</div>
          <div>• <b style={{color:C.greyL}}>Wind:</b> Shetland averages 9 m/s vs 3.5 m/s in London — a 20x energy difference</div>
          <div>• <b style={{color:C.greyL}}>Accuracy:</b> Postcode data is calibrated against 10-year PVGIS satellite averages</div>
        </div>
      </div>
    </div>
  );
}

function S2_Solar({data,onChange}: {data:any;onChange:(v:any)=>void}) {
  const kWp = ((Number(data.numPanels)||0)*(Number(data.panelWatt)||0)/1000).toFixed(2);
  return (
    <div>
      <h2 style={{fontSize:20,fontWeight:800,color:C.white,marginBottom:6,fontFamily:"'Syne',sans-serif"}}>Solar Panel Configuration</h2>
      <Sec>PANEL SPECIFICATION</Sec>
      <G2>
        <Field label={<>Number of panels <InfoTip text="How many solar panels in total? Each panel is counted separately regardless of size."/></>} req>
          <Inp value={data.numPanels||""} onChange={v=>onChange({...data,numPanels:v})} placeholder="e.g. 20"/>
        </Field>
        <Field label={<>Watts per panel <InfoTip text="The nameplate power rating of each panel in Watts. Modern panels are typically 380–450W."/></>} req>
          <Inp value={data.panelWatt||""} onChange={v=>onChange({...data,panelWatt:v})} placeholder="e.g. 400" unit="W"/>
        </Field>
      </G2>
      {Number(kWp)>0&&<div style={{background:C.greenGlow,border:`1px solid rgba(0,229,160,0.2)`,borderRadius:8,padding:"10px 14px",marginBottom:16,fontSize:14,color:C.green,fontWeight:600}}>⚡ System total: {kWp} kWp</div>}
      <Field label={<>Panel type <InfoTip text="Monocrystalline is most efficient (20–23%). Bifacial panels capture extra light from the ground below. Thin-film works better in cloudy UK conditions."/></>} hint={PANEL_META[data.panelType||"mono"]?.desc}>
        <Sel value={data.panelType||"mono"} onChange={v=>onChange({...data,panelType:v})}
          options={Object.entries(PANEL_META).map(([k,v])=>({value:k,label:v.label}))}/>
      </Field>
      <Hr/><Sec>INSTALLATION GEOMETRY</Sec>
      <G2>
        <Field label={<>Tilt angle <InfoTip text="The angle your panels face upward from horizontal. 0° = flat roof. 35° = optimal for UK solar capture. 90° = vertical wall."/></>} hint="0°=flat · 35°=optimal UK · 90°=vertical">
          <Inp value={data.tilt||""} onChange={v=>onChange({...data,tilt:v})} placeholder="35" unit="°"/>
        </Field>
        <Field label={<>Orientation <InfoTip text="Which direction do your panels face? South-facing captures the most energy in the UK."/></>}>
          <Sel value={String(data.orient||0)} onChange={v=>onChange({...data,orient:Number(v)})}
            options={[{value:"0",label:"South (optimal)"},{value:"-45",label:"South-East"},{value:"45",label:"South-West"},{value:"-90",label:"East"},{value:"90",label:"West"},{value:"180",label:"North"}]}/>
        </Field>
      </G2>
      <Hr/><Sec>SYSTEM LOSSES</Sec>
      <G2>
        <Field label={<>System losses <InfoTip text="Accounts for wiring losses, soiling (dust/bird droppings), shading, and temperature. 14% is a typical UK default."/></>} hint="Wiring, soiling, shading. Default 14%.">
          <Inp value={data.lossP||""} onChange={v=>onChange({...data,lossP:v})} placeholder="14" unit="%"/>
        </Field>
        <Field label={<>Inverter efficiency <InfoTip text="How efficiently your inverter converts DC solar power to AC (or direct DC for electrolysis). Modern inverters are 96–98%."/></>} hint="Modern string inverters ~97%">
          <Inp value={data.invEff||""} onChange={v=>onChange({...data,invEff:v})} placeholder="97" unit="%"/>
        </Field>
      </G2>
      <Toggle checked={data.secondLife!==false} onChange={v=>onChange({...data,secondLife:v})}
        label="Second-life solar panels" sub="Second-life panels save ~55% on panel CAPEX (£360/kWp vs £800/kWp new)"/>
    </div>
  );
}

function S3_Wind({data,onChange}: {data:any;onChange:(v:any)=>void}) {
  return (
    <div>
      <h2 style={{fontSize:20,fontWeight:800,color:C.white,marginBottom:6,fontFamily:"'Syne',sans-serif"}}>Wind Turbine Configuration</h2>
      <p style={{fontSize:15,color:C.grey,marginBottom:22}}>We use Weibull k=2 distribution integration across the full wind speed range — not just average speed — for accurate energy estimates.</p>
      <Sec>TURBINE SPECIFICATION</Sec>
      <G2>
        <Field label={<>Number of turbines <InfoTip text="How many turbines at your site? Wake loss modelling applies for 2 or more."/></>} req>
          <Inp value={data.nTurbines||""} onChange={v=>onChange({...data,nTurbines:v})} placeholder="1"/>
        </Field>
        <Field label={<>Rated power <InfoTip text="The nameplate power at rated wind speed. This is what the manufacturer advertises — not average output."/></>} req hint="Nameplate kW at rated wind speed">
          <Inp value={data.pRatedKW||""} onChange={v=>onChange({...data,pRatedKW:v})} placeholder="e.g. 50" unit="kW"/>
        </Field>
      </G2>
      <G2>
        <Field label={<>Rotor diameter <InfoTip text="The tip-to-tip diameter of the blades. Larger rotors capture more energy at low wind speeds."/></>}>
          <Inp value={data.rotorDiam||""} onChange={v=>onChange({...data,rotorDiam:v})} placeholder="e.g. 18" unit="m"/>
        </Field>
        <Field label={<>Hub height <InfoTip text="Height from ground to rotor centre. Higher hubs reach faster, less turbulent wind. Power law: v_hub = v_10m × (h/10)^0.143."/></>} hint="Higher = faster, smoother wind">
          <Inp value={data.hubH||""} onChange={v=>onChange({...data,hubH:v})} placeholder="30" unit="m"/>
        </Field>
      </G2>
      <Hr/><Sec>POWER CURVE — IEC 61400</Sec>
      <G3>
        <Field label={<>Cut-in speed <InfoTip text="Minimum wind speed at which the turbine starts generating. Below this, output is zero. Typically 2.5–4 m/s."/></>} hint="Typical 2.5–4 m/s">
          <Inp value={data.cutIn||""} onChange={v=>onChange({...data,cutIn:v})} placeholder="3" unit="m/s"/>
        </Field>
        <Field label={<>Rated speed <InfoTip text="Wind speed at which the turbine reaches its nameplate rated power. Above this, output is capped."/></>} hint="Typical 10–15 m/s">
          <Inp value={data.vRated||""} onChange={v=>onChange({...data,vRated:v})} placeholder="12" unit="m/s"/>
        </Field>
        <Field label={<>Cut-out speed <InfoTip text="Wind speed above which the turbine shuts down for safety. Usually 20–25 m/s."/></>} hint="Typical 20–25 m/s">
          <Inp value={data.cutOut||""} onChange={v=>onChange({...data,cutOut:v})} placeholder="25" unit="m/s"/>
        </Field>
      </G3>
    </div>
  );
}

function S4_HydroLab({sourceType,hydro,lab,onHydro,onLab}: any) {
  if (sourceType==="hydro") return (
    <div>
      <h2 style={{fontSize:20,fontWeight:800,color:C.white,marginBottom:6,fontFamily:"'Syne',sans-serif"}}>Hydro Configuration</h2>
      <G2>
        <Field label={<>Installed capacity <InfoTip text="The rated electrical output of your hydro turbine in kilowatts."/></>} req>
          <Inp value={hydro.capacityKW||""} onChange={v=>onHydro({...hydro,capacityKW:v})} placeholder="e.g. 100" unit="kW"/>
        </Field>
        <Field label={<>Capacity factor <InfoTip text="What % of the year does the turbine run at full power? Run-of-river hydro is typically 40–60% in the UK."/></>} hint="Run-of-river typical 40–60%">
          <Inp value={hydro.capFactor||""} onChange={v=>onHydro({...hydro,capFactor:v})} placeholder="45" unit="%"/>
        </Field>
      </G2>
    </div>
  );
  return (
    <div>
      <h2 style={{fontSize:20,fontWeight:800,color:C.white,marginBottom:6,fontFamily:"'Syne',sans-serif"}}>Lab / PSU Configuration</h2>
      <G2>
        <Field label={<>PSU output <InfoTip text="The DC power output of your power supply unit, in kilowatts. For small benchtop tests this might be 0.01–1 kW."/></>} req>
          <Inp value={lab.powerKW||""} onChange={v=>onLab({...lab,powerKW:v})} placeholder="0.010" unit="kW"/>
        </Field>
        <Field label={<>Daily run hours <InfoTip text="How many hours per day does the PSU run? Determines monthly energy input to the electrolyser."/></>}>
          <Inp value={lab.hoursPerDay||""} onChange={v=>onLab({...lab,hoursPerDay:v})} placeholder="8" unit="hrs"/>
        </Field>
      </G2>
    </div>
  );
}

function S5_Electrolyser({data,onChange,postcode,sourceType,solar,wind,hydro,lab}: any) {
  const suggestedKW = sourceType ? suggestElectrolyserKW(postcode,sourceType,solar||{},wind||{},hydro||{},lab||{}) : null;
  const minLoad = (data.type||"alkaline") === "pem" ? 5 : 20;
  return (
    <div>
      <h2 style={{fontSize:20,fontWeight:800,color:C.white,marginBottom:6,fontFamily:"'Syne',sans-serif"}}>Electrolyser Configuration</h2>
      <p style={{fontSize:15,color:C.grey,marginBottom:22}}>We apply real published efficiency curves — not a flat number. Part-load behaviour and minimum load thresholds are fully modelled.</p>
      <Sec>TYPE & RATING</Sec>
      <Field label={<>Electrolyser type <InfoTip text="Alkaline is Fluxero's standard — proven, lower cost, best for stable energy sources. PEM costs more but handles variable wind better as it can operate from just 5% load."/></>} hint={(data.type||"alkaline")==="pem"?"PEM: operates from 5% load, better for variable wind, £1,200/kW":"Alkaline: minimum 20% load, best for stable solar/hydro, £700/kW"}>
        <Sel value={data.type||"alkaline"} onChange={v=>onChange({...data,type:v})}
          options={[{value:"alkaline",label:"Alkaline (AEL) — Fluxero standard · £700/kW · min load 20%"},{value:"pem",label:"PEM — faster response · £1,200/kW · min load 5%"}]}/>
      </Field>
      {suggestedKW&&(
        <div style={{background:C.greenGlow,border:`1px solid rgba(0,229,160,0.2)`,borderRadius:8,padding:"10px 14px",marginBottom:12,fontSize:14,color:C.green,fontWeight:600,cursor:"pointer"}} onClick={()=>onChange({...data,ratedKW:suggestedKW.toFixed(0)})}>
          💡 Suggested size for your energy input: <b>{suggestedKW.toFixed(0)} kW</b> — click to use
        </div>
      )}
      <Field label={<>Rated power <InfoTip text="The maximum power the electrolyser can consume. Leave blank to use our auto-suggested size based on your energy source. Oversizing wastes capital; undersizing wastes energy."/></>} hint={`Leave blank for auto-sizing. Min load = ${minLoad}% of rated.`}>
        <Inp value={data.ratedKW||""} onChange={v=>onChange({...data,ratedKW:v})} placeholder={suggestedKW?.toFixed(0)||"auto"} unit="kW"/>
      </Field>
      {(data.type||"alkaline")==="alkaline"&&(
        <div style={{background:"rgba(255,184,0,0.07)",border:`1px solid rgba(255,184,0,0.2)`,borderRadius:10,padding:"12px 16px",marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:700,color:C.amber,marginBottom:6}}>⚠ Alkaline minimum load: 20%</div>
          <div style={{fontSize:13,color:C.grey,lineHeight:1.7}}>
            Power below {data.ratedKW?(Number(data.ratedKW)*0.2).toFixed(0):"—"} kW causes shutdown — no H₂ produced.
            For highly variable wind, consider PEM.
          </div>
        </div>
      )}
      <Hr/><Sec>OPTIONAL REFINEMENTS</Sec>
      <G2>
        <Field label={<>Storage capacity <InfoTip text="If you have hydrogen tanks, enter the maximum daily storage capacity in kg. This caps daily production if your tanks are full."/></>} hint="Max H₂ your tanks can hold per day">
          <Inp value={data.storageKgDay||""} onChange={v=>onChange({...data,storageKgDay:v})} placeholder="Leave blank" unit="kg/day"/>
        </Field>
        <Field label={<>CAPEX override <InfoTip text="If you know your total capital cost, enter it here to override our estimate. Otherwise we calculate from system size and equipment costs."/></>} hint="Leave blank — we estimate from system size">
          <Inp value={data.capexGBP||""} onChange={v=>onChange({...data,capexGBP:v})} placeholder="Leave blank" unit="£"/>
        </Field>
      </G2>
    </div>
  );
}

function S6_Revenue({data,onChange}: {data:any;onChange:(v:any)=>void}) {
  const modes = [
    {id:"market",label:"Market Rate",sub:"£8.50/kg UK 2025"},
    {id:"contract",label:"Fixed Contract",sub:"Your agreed price"},
    {id:"onsite",label:"On-site Use",sub:"Diesel displacement"},
  ];
  return (
    <div>
      <h2 style={{fontSize:20,fontWeight:800,color:C.white,marginBottom:6,fontFamily:"'Syne',sans-serif"}}>Revenue Model</h2>
      <p style={{fontSize:15,color:C.grey,marginBottom:20}}>How will the hydrogen be priced? This determines the revenue and payback calculation.</p>
      <div className="h2-grid-3" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:20}}>
        {modes.map(m=>(
          <button key={m.id} onClick={()=>onChange({...data,mode:m.id})} style={{padding:"14px 10px",border:`1.5px solid ${data.mode===m.id?C.green:C.border}`,borderRadius:10,background:data.mode===m.id?C.greenGlow:C.bg3,cursor:"pointer",outline:"none",textAlign:"center",transition:"all 0.2s"}}>
            <div style={{fontSize:14,fontWeight:700,color:data.mode===m.id?C.green:C.white,marginBottom:4,fontFamily:"'Syne',sans-serif"}}>{m.label}</div>
            <div style={{fontSize:12,color:C.grey}}>{m.sub}</div>
          </button>
        ))}
      </div>
      {data.mode==="contract"&&(
        <Field label={<>Your agreed H₂ price <InfoTip text="The price per kg you have agreed with your buyer. Green hydrogen typically ranges from £6–12/kg in the UK."/></>} hint="Per kg with your offtaker">
          <Inp value={data.customPrice||""} onChange={v=>onChange({...data,customPrice:v})} placeholder="8.50" unit="£/kg"/>
        </Field>
      )}
      {data.mode==="onsite"&&(
        <Field label={<>Current diesel price <InfoTip text="Your current cost per litre of diesel. We calculate hydrogen value as the energy-equivalent displacement cost."/></>}>
          <Inp value={data.dieselPrice||""} onChange={v=>onChange({...data,dieselPrice:v})} placeholder="1.55" unit="£/litre"/>
        </Field>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// RESULTS
// ─────────────────────────────────────────────
function fmtH2(kg: number): string {
  if (!kg&&kg!==0) return "—";
  if (kg<0.01) return `${(kg*1000).toFixed(1)} g`;
  if (kg<1)    return `${(kg*1000).toFixed(0)} g`;
  if (kg<1000) return `${kg.toFixed(1)} kg`;
  if (kg<1000000) return `${(kg/1000).toFixed(2)} t`;
  return `${(kg/1000).toFixed(0)} t`;
}
function fmtM(n: number): string {
  if (!n&&n!==0) return "—";
  if (n>=1e6)  return `£${(n/1e6).toFixed(2)}M`;
  if (n>=1000) return `£${(n/1000).toFixed(1)}k`;
  return `£${n.toFixed(0)}`;
}

const ChartTip: React.FC<any> = ({active,payload,label}) => {
  if (!active||!payload?.length) return null;
  return (
    <div style={{background:C.bg4,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 14px"}}>
      <div style={{fontSize:13,fontWeight:700,color:C.white,marginBottom:4}}>{label}</div>
      {payload.map((p: any)=><div key={p.name} style={{fontSize:13,color:C.green}}>{p.name}: {fmtH2(p.value)}</div>)}
    </div>
  );
};

function ResultsScreen({results,inputs,onBack}: any) {
  const [tab,setTab] = useState("h2");
  const [copied,setCopied] = useState(false);
  const chartData = MONTHS.map((m,i)=>({month:m,H2:+results.h2Monthly[i].toFixed(2),MWh:+(results.monthlyKWh[i]/1000).toFixed(2)}));
  const unityConfig = {
    version:"1.0",source:"FluxeroCalculator",timestamp:new Date().toISOString(),
    location:{postcode:inputs.postcode,label:results.locationLabel},
    sourceType:inputs.sourceType,
    electrolyser:{ratedKW:+results.electKW.toFixed(1),type:inputs.elect.type},
    monthlyH2Kg:results.h2Monthly.map((v:number)=>+v.toFixed(2)),
    annualH2Kg:+results.annualH2Kg.toFixed(2),
    annualRevenueGBP:+results.annualRevenue.toFixed(2),
    capexGBP:+results.capex.toFixed(0),
  };

  return (
    <div className="h2-calc-shell" style={{display:"flex",height:"100%",overflow:"hidden",background:C.bg0}}>
      {/* Sidebar */}
      <div className="h2-calc-sidebar" style={{width:240,background:C.bg1,borderRight:`1px solid ${C.border}`,padding:"24px 20px",display:"flex",flexDirection:"column",flexShrink:0,overflowY:"auto"}}>
        <img src="/fluxero-logo.svg" alt="Fluxero" style={{height:24,objectFit:"contain",marginBottom:24,opacity:0.9}} onError={(e)=>{(e.target as HTMLImageElement).style.display="none";}} />
        <div style={{fontSize:18,fontWeight:800,color:C.white,marginBottom:4,fontFamily:"'Syne',sans-serif"}}>Results</div>
        <div style={{fontSize:13,color:C.grey,marginBottom:16}}>📍 {results.locationLabel}</div>
        {[
          {label:"AVG POWER IN",val:`${results.avgPower.toFixed(1)} kW`},
          {label:"ELECTROLYSER",val:`${results.electKW.toFixed(0)} kW ${results.electKWauto?"(auto)":""}`,accent:results.electKWauto?C.amber:undefined},
          {label:"CO₂ AVOIDED",val:`${results.co2Saved.toFixed(1)} t/yr`,accent:C.green},
          {label:"EST. CAPEX",val:fmtM(results.capex)},
        ].map(d=>(
          <div key={d.label} style={{marginBottom:14}}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:"1.5px",color:C.greenD,marginBottom:3,fontFamily:"'IBM Plex Mono',monospace"}}>{d.label}</div>
            <div style={{fontSize:15,fontWeight:700,color:d.accent||C.white,fontFamily:"'IBM Plex Mono',monospace"}}>{d.val}</div>
          </div>
        ))}
        {(results.windCF!==null||results.solarYield!==null)&&(
          <div style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 14px",marginBottom:14}}>
            <div style={{fontSize:10,fontWeight:700,color:C.greenD,letterSpacing:"1px",marginBottom:8,fontFamily:"'IBM Plex Mono',monospace"}}>RESOURCE QUALITY</div>
            {results.windCF!==null&&<div style={{fontSize:13,color:C.grey,marginBottom:4}}>Wind CF: <b style={{color:C.white}}>{(results.windCF*100).toFixed(1)}%</b></div>}
            {results.solarYield!==null&&<div style={{fontSize:13,color:C.grey}}>Solar yield: <b style={{color:C.white}}>{results.solarYield.toFixed(0)} kWh/kWp/yr</b></div>}
          </div>
        )}
        <div style={{flex:1}}/>
        <button onClick={onBack} style={{width:"100%",padding:"10px",background:C.bg3,border:`1px solid ${C.border}`,borderRadius:8,color:C.greyL,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>← Adjust inputs</button>
      </div>

      {/* Main */}
      <div className="h2-calc-main" style={{flex:1,overflowY:"auto",padding:"28px 32px",minWidth:0}}>
        <div style={{fontSize:18,fontWeight:800,color:C.white,marginBottom:4,fontFamily:"'Syne',sans-serif"}}>
          {fmtH2(results.annualH2Kg)} of green hydrogen per year
        </div>
        <div style={{fontSize:14,color:C.grey,marginBottom:16}}>{inputs.sourceType} · {results.locationLabel}</div>

        {results.warnings.map((w: any,i: number)=>(
          <div key={i} style={{padding:"12px 16px",background:"rgba(255,184,0,0.07)",border:`1px solid rgba(255,184,0,0.2)`,borderRadius:10,marginBottom:12,display:"flex",gap:10}}>
            <span style={{fontSize:16,flexShrink:0}}>⚠</span>
            <div style={{fontSize:13,color:C.grey,lineHeight:1.6}}>{w.msg}</div>
          </div>
        ))}

        <div className="h2-grid-4" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:14}}>
          {[
            {lbl:"H₂ PER DAY",val:fmtH2(results.annualH2Kg/365),ac:C.green},
            {lbl:"H₂ PER YEAR",val:fmtH2(results.annualH2Kg),ac:C.green},
            {lbl:"ANNUAL REVENUE",val:fmtM(results.annualRevenue),ac:C.green},
            {lbl:"PAYBACK",val:results.payback?(results.payback<1?`${(results.payback*12).toFixed(0)}mo`:`${results.payback.toFixed(1)}yr`):"—",ac:C.amber},
          ].map(c=>(
            <div key={c.lbl} style={{background:C.bg3,border:`1px solid ${C.border}`,borderRadius:12,padding:"16px 14px"}}>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:"1.5px",color:C.grey,marginBottom:8,fontFamily:"'IBM Plex Mono',monospace"}}>{c.lbl}</div>
              <div style={{fontSize:22,fontWeight:800,color:c.ac,fontFamily:"'IBM Plex Mono',monospace",lineHeight:1}}>{c.val}</div>
            </div>
          ))}
        </div>

        <div style={{display:"flex",gap:8,marginBottom:8}}>
          {[{id:"h2",lbl:"H₂ Output (kg)"},{id:"kwh",lbl:"Energy Input (MWh)"}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"6px 14px",border:`1px solid ${tab===t.id?C.green:C.border}`,borderRadius:6,background:tab===t.id?C.greenGlow:C.bg3,cursor:"pointer",color:tab===t.id?C.green:C.grey,fontSize:13,fontWeight:600,outline:"none"}}>
              {t.lbl}
            </button>
          ))}
        </div>
        <div style={{background:C.bg3,border:`1px solid ${C.border}`,borderRadius:12,padding:"16px 16px 8px",marginBottom:14}}>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} margin={{top:4,right:4,bottom:0,left:-16}}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
              <XAxis dataKey="month" tick={{fill:C.grey,fontSize:12}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:C.grey,fontSize:12}} axisLine={false} tickLine={false}/>
              <Tooltip content={<ChartTip/>}/>
              <Bar dataKey={tab==="h2"?"H2":"MWh"} name={tab==="h2"?"H₂ (kg)":"Energy (MWh)"}
                fill={C.green} radius={[3,3,0,0]} maxBarSize={28} fillOpacity={0.85}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{background:C.bg3,border:`1px solid ${C.border}`,borderRadius:12,padding:"16px 20px",marginBottom:14}}>
          <Sec>TECHNICAL BREAKDOWN</Sec>
          {[
            ["Total energy input",`${(results.annualKWh/1000).toFixed(1)} MWh/yr`],
            ["Average power input",`${results.avgPower.toFixed(1)} kW`],
            ["Electrolyser rated",`${results.electKW.toFixed(0)} kW (${results.electKWauto?"auto-sized":"user input"})`],
            ["Avg load factor",`${results.electKW>0?(results.avgPower/results.electKW*100).toFixed(0):"—"}%`],
            ["H₂ price used",`£${results.h2Price.toFixed(2)}/kg`],
            ["Estimated CAPEX",fmtM(results.capex)],
            ["CO₂ avoided",`${results.co2Saved.toFixed(1)} t/yr vs grey H₂`],
          ].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:`1px solid ${C.border}`}}>
              <span style={{fontSize:14,color:C.grey}}>{k}</span>
              <span style={{fontSize:14,fontWeight:600,color:C.white,fontFamily:"'IBM Plex Mono',monospace"}}>{v}</span>
            </div>
          ))}
        </div>

        {results.aiInsights&&(
          <div style={{background:`linear-gradient(135deg,${C.bg3},rgba(0,229,160,0.04))`,border:`1px solid rgba(0,229,160,0.15)`,borderRadius:12,padding:"18px 20px",marginBottom:14}}>
            <Sec>AI SITE ANALYSIS</Sec>
            {results.aiInsights.farmerSummary&&(
              <div style={{fontSize:14,color:C.greyL,lineHeight:1.8,marginBottom:14,padding:"12px 14px",background:C.bg2,borderRadius:8,fontStyle:"italic"}}>
                "{results.aiInsights.farmerSummary}"
              </div>
            )}
            {results.aiInsights.insights?.map((ins: string,i: number)=>(
              <div key={i} style={{display:"flex",gap:8,marginBottom:8}}>
                <span style={{color:C.green,flexShrink:0}}>→</span>
                <span style={{fontSize:13,color:C.greyL,lineHeight:1.6}}>{ins}</span>
              </div>
            ))}
            {results.aiInsights.recommendation&&(
              <div style={{marginTop:8,padding:"10px 12px",background:C.greenGlow,border:`1px solid rgba(0,229,160,0.15)`,borderRadius:8}}>
                <span style={{fontSize:13,fontWeight:700,color:C.green}}>✓ Recommendation: </span>
                <span style={{fontSize:13,color:C.grey}}>{results.aiInsights.recommendation}</span>
              </div>
            )}
          </div>
        )}

        <div style={{padding:"16px 20px",background:"rgba(0,229,160,0.04)",border:`1px solid rgba(0,229,160,0.14)`,borderRadius:12}}>
          <div style={{fontSize:14,fontWeight:700,color:C.green,marginBottom:4}}>🗺 Export to Fluxero Site Planner</div>
          <div style={{fontSize:13,color:C.grey,lineHeight:1.7,marginBottom:12}}>Copy this config JSON to the Unity site planner to visualise your installation on a 3D map.</div>
          <button onClick={()=>{navigator.clipboard.writeText(JSON.stringify(unityConfig,null,2));setCopied(true);setTimeout(()=>setCopied(false),2500);}}
            style={{padding:"9px 18px",background:copied?C.greenD:C.green,border:"none",borderRadius:8,color:C.bg0,fontSize:14,fontWeight:700,cursor:"pointer",transition:"background 0.2s",fontFamily:"inherit"}}>
            {copied?"✓ Copied!":"Copy site config →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// LOADING + STEP NAV
// ─────────────────────────────────────────────
function Loading({pct,msg}: {pct:number;msg:string}) {
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",background:C.bg0,padding:40}}>
      <img src="/fluxero-logo.svg" alt="Fluxero" style={{height:22,objectFit:"contain",marginBottom:32,opacity:0.9}} onError={(e)=>{(e.target as HTMLImageElement).style.display="none";}} />
      <div style={{fontSize:18,fontWeight:700,color:C.white,marginBottom:6,fontFamily:"'Syne',sans-serif"}}>Computing your site...</div>
      <div style={{fontSize:14,color:C.grey,marginBottom:24,textAlign:"center",minHeight:20}}>{msg}</div>
      <div style={{width:280,height:4,background:C.bg3,borderRadius:2,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${pct}%`,background:C.green,borderRadius:2,transition:"width 0.4s ease"}}/>
      </div>
      <div style={{fontSize:13,color:C.grey,marginTop:8,fontFamily:"'IBM Plex Mono',monospace"}}>{pct}%</div>
    </div>
  );
}

function StepBar({steps,cur}: {steps:string[];cur:number}) {
  return (
    <div style={{display:"flex",alignItems:"center",marginBottom:28}}>
      {steps.map((s,i)=>(
        <div key={i} style={{display:"flex",alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:24,height:24,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.2s",
              background:i<cur?C.green:i===cur?C.bg4:C.bg3,border:`1.5px solid ${i<=cur?C.green:C.border}`,
              fontSize:12,fontWeight:700,color:i<cur?C.bg0:i===cur?C.green:C.grey,fontFamily:"'IBM Plex Mono',monospace"}}>
              {i<cur?"✓":i+1}
            </div>
            {i===cur&&<span style={{fontSize:13,color:C.white,fontWeight:600,fontFamily:"'Syne',sans-serif"}}>{s}</span>}
          </div>
          {i<steps.length-1&&<div style={{width:16,height:1,background:C.border,margin:"0 6px",flexShrink:0}}/>}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────
export const H2Calculator: React.FC = () => {
  const [stage,setStage]   = useState("steps");
  const [step,setStep]     = useState(0);
  const [pct,setPct]       = useState(0);
  const [msg,setMsg]       = useState("");
  const [results,setResults] = useState<any>(null);
  const [errors,setErrors] = useState<Record<string,string>>({});

  const [src,setSrc]     = useState("solar");
  const [loc,setLoc]     = useState({postcode:""});
  const [solar,setSolar] = useState({numPanels:"",panelWatt:"",panelType:"mono",tilt:"35",orient:0,lossP:"14",invEff:"97",secondLife:true});
  const [wind,setWind]   = useState({nTurbines:"1",pRatedKW:"",rotorDiam:"",hubH:"30",cutIn:"3",vRated:"12",cutOut:"25",wakeLoss:"8"});
  const [hydro,setHydro] = useState({capacityKW:"",capFactor:"45"});
  const [lab,setLab]     = useState({powerKW:"",hoursPerDay:"8"});
  const [elect,setElect] = useState({type:"alkaline",ratedKW:"",storageKgDay:"",capexGBP:""});
  const [rev,setRev]     = useState({mode:"market",customPrice:"8.50",dieselPrice:"1.55"});

  const getSteps = () => {
    const b = ["Source","Location"];
    if (src==="solar")  return [...b,"Solar","Electrolyser","Revenue"];
    if (src==="wind")   return [...b,"Wind","Electrolyser","Revenue"];
    if (src==="hybrid") return [...b,"Solar","Wind","Electrolyser","Revenue"];
    return [...b,"Source Config","Electrolyser","Revenue"];
  };

  const getContent = () => {
    const base = [
      <S0_Source value={src} onChange={v=>{setSrc(v);setStep(0);}}/>,
      <S1_Location data={loc} onChange={setLoc}/>,
    ];
    const elStep = <S5_Electrolyser data={elect} onChange={setElect} postcode={loc.postcode} sourceType={src} solar={solar} wind={wind} hydro={hydro} lab={lab}/>;
    const revStep = <S6_Revenue data={rev} onChange={setRev}/>;
    if (src==="solar")  return [...base,<S2_Solar data={solar} onChange={setSolar}/>,elStep,revStep];
    if (src==="wind")   return [...base,<S3_Wind data={wind} onChange={setWind}/>,elStep,revStep];
    if (src==="hybrid") return [...base,<S2_Solar data={solar} onChange={setSolar}/>,<S3_Wind data={wind} onChange={setWind}/>,elStep,revStep];
    return [...base,<S4_HydroLab sourceType={src} hydro={hydro} lab={lab} onHydro={setHydro} onLab={setLab}/>,elStep,revStep];
  };

  const steps = getSteps();
  const content = getContent();
  const isLast = step===content.length-1;

  function validate() {
    const e: Record<string,string> = {};
    if (step===1&&!loc.postcode) e.loc="Enter a UK postcode";
    if (src==="solar"&&step===2&&(!solar.numPanels||!solar.panelWatt)) e.solar="Enter panel count and wattage";
    if ((src==="wind"||src==="hybrid")&&step===(src==="wind"?2:3)&&!wind.pRatedKW) e.wind="Enter turbine rated power";
    setErrors(e);
    return !Object.keys(e).length;
  }

  async function doCalc() {
    if (!validate()) return;
    setStage("loading"); setPct(10); setMsg("Looking up postcode data...");
    await new Promise(r=>setTimeout(r,200));
    setPct(35); setMsg("Running Weibull wind integration...");
    await new Promise(r=>setTimeout(r,200));
    setPct(60); setMsg("Applying electrolyser efficiency curves...");
    await new Promise(r=>setTimeout(r,200));

    const inputs = {sourceType:src,postcode:loc.postcode,solar,wind,hydro,lab,elect,revenue:rev};
    const r = runCalc(inputs);
    setPct(80); setMsg("Getting AI site analysis...");
    r.aiInsights = await getAIInsights(inputs, r);
    setPct(100); setMsg("Done");
    await new Promise(x=>setTimeout(x,300));
    setResults(r); setStage("results");
  }

  if (stage==="loading") return <Loading pct={pct} msg={msg}/>;
  if (stage==="results") return <ResultsScreen results={results} inputs={{sourceType:src,postcode:loc.postcode,elect}} onBack={()=>{setStage("steps");setStep(0);}}/>;

  return (
    <div className="h2-calc-shell" style={{display:"flex",height:"100%",background:C.bg0}}>
      {/* Sidebar */}
      <div className="h2-calc-sidebar" style={{width:220,background:C.bg1,borderRight:`1px solid ${C.border}`,padding:"28px 20px",display:"flex",flexDirection:"column",position:"sticky",top:0,height:"100%",flexShrink:0}}>
        <img src="/fluxero-logo.svg" alt="Fluxero" style={{height:20,objectFit:"contain",marginBottom:4,opacity:0.9}} onError={(e)=>{(e.target as HTMLImageElement).style.display="none";}} />
        <div style={{fontSize:10,color:C.grey,marginBottom:28,fontFamily:"'IBM Plex Mono',monospace"}}>H₂ DESIGN ENGINE</div>
        <div style={{fontSize:15,fontWeight:700,color:C.white,marginBottom:6,fontFamily:"'Syne',sans-serif"}}>Site Calculator</div>
        <div style={{fontSize:13,color:C.grey,lineHeight:1.8,marginBottom:24}}>Postcode-specific UK data. Real physics. No internet required.</div>
        {["Every UK postcode area","NOABL wind speeds","Weibull k=2 wind model","IEC 61400 power curves","Alkaline/PEM efficiency curves","Auto electrolyser sizing","Oversizing warnings","AI site analysis"].map(f=>(
          <div key={f} style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:6}}>
            <div style={{width:4,height:4,borderRadius:"50%",background:C.green,marginTop:5,flexShrink:0}}/>
            <span style={{fontSize:12,color:C.greyL,lineHeight:1.4}}>{f}</span>
          </div>
        ))}
        <div style={{flex:1}}/>
        <div style={{fontSize:10,color:C.grey,marginBottom:4,fontFamily:"'IBM Plex Mono',monospace"}}>Step {step+1} of {content.length}</div>
        <div style={{height:3,background:C.bg3,borderRadius:2}}>
          <div style={{height:"100%",borderRadius:2,background:C.green,width:`${((step+1)/content.length)*100}%`,transition:"width 0.3s"}}/>
        </div>
      </div>

      {/* Form */}
      <div className="h2-calc-main" style={{flex:1,overflowY:"auto",padding:"36px 44px",maxWidth:740,minWidth:0}}>
        <StepBar steps={steps} cur={step}/>
        <div style={{minHeight:360}}>{content[step]}</div>
        {Object.keys(errors).length>0&&(
          <div style={{background:"rgba(255,64,80,0.08)",border:`1px solid rgba(255,64,80,0.2)`,borderRadius:8,padding:"10px 14px",marginTop:16,fontSize:14,color:C.red}}>
            {Object.values(errors).join(" · ")}
          </div>
        )}
        <div style={{display:"flex",justifyContent:"space-between",marginTop:24,paddingTop:18,borderTop:`1px solid ${C.border}`}}>
          <button onClick={()=>step>0&&setStep(s=>s-1)} style={{padding:"11px 22px",background:step===0?"transparent":C.bg3,border:`1px solid ${step===0?"transparent":C.border}`,borderRadius:8,color:step===0?"transparent":C.greyL,fontSize:15,fontWeight:600,cursor:step===0?"default":"pointer",fontFamily:"inherit"}}>
            ← Back
          </button>
          <button onClick={()=>{if(!validate())return;isLast?doCalc():setStep(s=>s+1);}} style={{padding:"11px 28px",background:isLast?C.green:C.bg4,border:`1.5px solid ${isLast?C.green:C.border}`,borderRadius:8,color:isLast?C.bg0:C.white,fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit",boxShadow:isLast?`0 0 20px rgba(0,229,160,0.25)`:"none"}}>
            {isLast?"Calculate →":"Continue →"}
          </button>
        </div>
      </div>
    </div>
  );
};
