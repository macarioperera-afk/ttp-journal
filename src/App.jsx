import { useState, useMemo, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

const G="#00d395",R="#ef4444",B="#6366f1",Y="#f59e0b",P="#a855f7",O="#f97316";
const pc=v=>v>0?G:v<0?R:"#6b7280";
const fd=v=>(v>=0?"+":"-")+"$"+Math.abs(v).toFixed(2);
const fs=v=>(v>=0?"+":"-")+"$"+Math.abs(v).toFixed(0);
const todayISO=()=>new Date().toISOString().split("T")[0];
const nowHHMM=()=>new Date().toTimeString().slice(0,5);
const uid=()=>"t"+Date.now()+Math.random().toString(36).slice(2,5);
const BUFFER=2000;
const DAILY_LIMIT=2;
const OVERTRADING_AT=3;
const PAUSE_MINS=15;

const SETUPS=["Heatmap Correlation SP","Break & Retest","VWAP Bounce","Opening Range Break","Momentum Scalp","Support/Resistance"];
const RULES=[
  {id:"r1",label:"Geplantes Setup – kein Impuls"},
  {id:"r2",label:"Stop Loss gesetzt"},
  {id:"r3",label:"Take Profit gesetzt"},
  {id:"r4",label:"Emotional ruhig und fokussiert"},
  {id:"r5",label:"Nach 16:15 Uhr getradet"},
  {id:"r6",label:"Max 2. Trade heute (kein 3.)"},
];

const mkT=(raw,pfx)=>{
  const dc={};
  return raw.map((r,i)=>{
    const[ct,dt,tm,pnl,dur,dir]=r;
    const hr=parseInt(tm.split(":")[0]);
    dc[dt]=(dc[dt]||0)+1;
    const tn=dc[dt];
    return{id:pfx+(i+1),acct:"09",contract:ct,date:dt,time:tm,pnl,dur,dir,
      setup:dur<30?"Momentum Scalp":hr>=16?"Heatmap Correlation SP":dur>60?"Break & Retest":"Heatmap Correlation SP",
      notes:dur<10?"Impulstrade "+dur+"s":"",
      rules:{r1:dur>60,r2:dur>=30,r3:dur>60,r4:pnl>0&&tn<=2,r5:hr>=16,r6:tn<=2}};
  });
};

const RAW=[
  ["MNQ","2026-04-30","15:23",-91.20,77,"LONG"],["NQ","2026-04-30","15:25",-307.60,9,"SHORT"],
  ["NQ","2026-04-30","15:25",796.20,260,"SHORT"],["MNQ","2026-04-30","15:30",-96.20,11,"SHORT"],
  ["NQ","2026-04-30","15:30",211.20,9,"SHORT"],["MNQ","2026-04-30","15:31",27.26,12,"SHORT"],
  ["MNQ","2026-04-30","15:31",22.76,33,"SHORT"],["MNQ","2026-04-30","15:31",41.26,40,"SHORT"],
  ["MNQ","2026-04-30","15:31",59.52,49,"SHORT"],["MNQ","2026-05-04","13:04",-81.20,117,"SHORT"],
  ["MNQ","2026-05-04","13:08",21.76,87,"LONG"],["MNQ","2026-05-04","13:08",32.26,152,"LONG"],
  ["MNQ","2026-05-04","13:08",38.26,173,"LONG"],["MNQ","2026-05-04","13:08",60.52,195,"LONG"],
  ["NQ","2026-05-04","13:12",96.20,59,"LONG"],["NQ","2026-05-04","17:11",-128.80,9,"LONG"],
  ["NQ","2026-05-04","17:11",-128.80,17,"LONG"],["NQ","2026-05-04","17:11",261.20,132,"SHORT"],
  ["NQ","2026-05-04","17:14",236.20,29,"SHORT"],["NQ","2026-05-05","13:30",-123.80,55,"SHORT"],
  ["NQ","2026-05-05","13:32",96.20,327,"LONG"],["MNQ","2026-05-05","13:38",-68.70,1373,"LONG"],
  ["NQ","2026-05-05","14:14",61.20,143,"LONG"],["NQ","2026-05-05","14:17",6.20,38,"LONG"],
  ["MNQ","2026-05-05","14:18",-81.20,75,"SHORT"],["NQ","2026-05-05","14:19",86.20,110,"SHORT"],
  ["MNQ","2026-05-05","14:22",-81.20,112,"LONG"],["NQ","2026-05-05","14:25",-128.80,70,"SHORT"],
  ["NQ","2026-05-05","14:28",-128.80,36,"LONG"],["MNQ","2026-05-05","14:32",-6.20,399,"SHORT"],
  ["NQ","2026-05-05","14:39",-33.80,231,"SHORT"],["NQ","2026-05-05","16:52",-63.80,45,"LONG"],
  ["NQ","2026-05-05","16:54",-33.80,205,"LONG"],["NQ","2026-05-05","16:57",-153.80,24,"LONG"],
  ["NQ","2026-05-05","16:58",-148.80,43,"SHORT"],["NQ","2026-05-05","17:00",-138.80,14,"LONG"],
  ["MNQ","2026-05-05","17:00",-27.48,15,"SHORT"],["MNQ","2026-05-05","17:01",-27.48,94,"SHORT"],
  ["MNQ","2026-05-05","17:04",-4.24,5,"SHORT"],["NQ","2026-05-06","17:12",-93.80,191,"SHORT"],
  ["NQ","2026-05-06","17:16",221.20,68,"LONG"],["NQ","2026-05-06","17:20",136.20,322,"LONG"],
  ["NQ","2026-05-06","17:20",21.20,416,"LONG"],["NQ","2026-05-07","13:33",-307.60,89,"SHORT"],
  ["NQ","2026-05-07","13:40",-153.80,231,"SHORT"],["MNQ","2026-05-07","13:44",-81.20,19,"LONG"],
  ["NQ","2026-05-07","13:46",191.20,127,"SHORT"],["MNQ","2026-05-07","13:45",26.76,251,"SHORT"],
  ["MNQ","2026-05-07","13:45",25.26,365,"SHORT"],["MNQ","2026-05-07","13:45",44.28,394,"SHORT"],
  ["NQ","2026-05-07","13:52",6.20,146,"LONG"],["NQ","2026-05-07","16:21",226.20,27,"LONG"],
  ["NQ","2026-05-07","16:21",446.20,43,"LONG"],["MNQ","2026-05-07","16:23",3.80,79,"SHORT"],
  ["MNQ","2026-05-07","16:25",-34.48,33,"LONG"],["MNQ","2026-05-07","16:26",11.52,44,"LONG"],
  ["MNQ","2026-05-08","12:55",-81.20,28,"SHORT"],["NQ","2026-05-08","12:56",-138.80,20,"SHORT"],
  ["NQ","2026-05-08","12:57",-103.80,21,"SHORT"],["NQ","2026-05-08","12:58",291.20,644,"LONG"],
  ["NQ","2026-05-08","13:09",31.20,92,"LONG"],["MNQ","2026-05-08","13:11",7.26,157,"LONG"],
  ["MNQ","2026-05-08","13:11",7.26,171,"LONG"],["MNQ","2026-05-08","13:11",9.76,204,"LONG"],
  ["MNQ","2026-05-08","13:11",33.52,297,"LONG"],["MNQ","2026-05-08","15:12",-86.20,27,"SHORT"],
  ["MNQ","2026-05-08","15:14",-81.20,19,"LONG"],["NQ","2026-05-08","15:15",1.20,125,"SHORT"],
  ["NQ","2026-05-08","15:17",-128.80,25,"SHORT"],["NQ","2026-05-08","15:17",-3.80,63,"SHORT"],
  ["NQ","2026-05-08","15:19",-128.80,22,"LONG"],["NQ","2026-05-08","15:19",76.20,85,"LONG"],
  ["NQ","2026-05-08","15:21",-133.80,22,"SHORT"],["NQ","2026-05-08","15:23",-133.80,97,"SHORT"],
  ["NQ","2026-05-08","15:25",-138.80,104,"LONG"],["MNQ","2026-05-08","15:27",-81.20,13,"SHORT"],
  ["NQ","2026-05-08","15:29",-128.80,5,"SHORT"],["MNQ","2026-05-08","15:28",-30.96,101,"SHORT"],
  ["MNQ","2026-05-08","15:30",9.04,18,"SHORT"],["MNQ","2026-05-08","15:30",-81.20,2,"LONG"],
  ["NQ","2026-05-11","16:27",1.20,53,"SHORT"],["NQ","2026-05-11","16:28",396.20,72,"SHORT"],
  ["NQ","2026-05-12","16:35",-283.80,15,"SHORT"],["NQ","2026-05-12","16:36",-213.80,8,"SHORT"],
  ["NQ","2026-05-12","16:36",-38.80,4,"SHORT"],["NQ","2026-05-12","16:37",831.20,130,"LONG"],
  ["MNQ","2026-05-12","16:40",25.76,29,"LONG"],["MNQ","2026-05-12","16:40",-46.96,37,"LONG"],
  ["MNQ","2026-05-12","16:41",28.26,9,"SHORT"],["MNQ","2026-05-12","16:41",3.04,23,"SHORT"],
  ["MNQ","2026-05-12","16:42",16.76,30,"LONG"],["MNQ","2026-05-12","16:42",41.76,39,"LONG"],
  ["MNQ","2026-05-12","16:42",90.78,52,"LONG"],
  ["NQ","2026-05-13","17:10",-128.80,78,"LONG"],["NQ","2026-05-13","17:11",-103.80,13,"LONG"],
  ["NQ","2026-05-13","17:12",-118.80,16,"SHORT"],["NQ","2026-05-13","17:13",-123.80,36,"SHORT"],
  ["NQ","2026-05-13","17:15",-113.80,14,"SHORT"],["NQ","2026-05-13","17:16",-108.80,26,"LONG"],
  ["NQ","2026-05-13","17:19",-103.80,54,"LONG"],["NQ","2026-05-13","17:23",381.20,184,"SHORT"],
  ["NQ","2026-05-13","17:27",26.20,65,"SHORT"],["NQ","2026-05-13","17:28",-103.80,25,"SHORT"],
  ["NQ","2026-05-13","17:28",-108.80,3,"SHORT"],["NQ","2026-05-13","17:29",-103.80,50,"LONG"],
  ["NQ","2026-05-14","11:38",-327.60,58,"SHORT"],["NQ","2026-05-14","11:40",6.20,149,"LONG"],
  ["NQ","2026-05-14","11:43",686.20,7930,"LONG"],["NQ","2026-05-14","13:57",-103.80,134,"LONG"],
  ["NQ","2026-05-14","13:59",-93.80,57,"SHORT"],["NQ","2026-05-14","14:01",236.20,1065,"LONG"],
  ["MNQ","2026-05-14","15:25",23.76,108,"SHORT"],["MNQ","2026-05-14","15:25",27.76,147,"SHORT"],
  ["MNQ","2026-05-14","15:25",41.26,171,"SHORT"],["MNQ","2026-05-14","15:25",51.52,177,"SHORT"],
  ["MNQ","2026-05-15","15:06",-98.7,99,"SHORT"],["MNQ","2026-05-15","15:08",-88.7,301,"SHORT"],
  ["NQ","2026-05-15","15:13",-13.8,78,"LONG"],["NQ","2026-05-15","15:14",386.2,104,"LONG"],
  ["MNQ","2026-05-15","15:16",-81.2,10,"SHORT"],["MNQ","2026-05-15","15:17",-81.2,8,"SHORT"],
  ["NQ","2026-05-15","15:17",-188.8,31,"LONG"],["NQ","2026-05-15","15:18",-133.8,31,"LONG"],
  ["NQ","2026-05-15","15:19",841.2,78,"SHORT"],
];

const SEED=mkT(RAW,"a");
const emptyRules=()=>({r1:false,r2:false,r3:false,r4:false,r5:false,r6:false});
const emptyForm=()=>({date:todayISO(),time:nowHHMM(),contract:"MNQ",dir:"LONG",pnl:"",setup:SETUPS[0],notes:"",rules:emptyRules()});

const Pill=({bg,color,children})=>(
  <span style={{display:"inline-block",padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600,background:bg,color}}>{children}</span>
);
const Card=({children,style,onClick})=>(
  <div onClick={onClick} style={{background:"#1a1f2e",border:"1px solid #2d3548",borderRadius:12,padding:16,overflow:"hidden",...style}}>{children}</div>
);
const Bar2=({pct,color})=>(
  <div style={{height:8,borderRadius:4,background:"#2d3548"}}>
    <div style={{height:"100%",borderRadius:4,width:Math.min(100,Math.max(0,pct))+"%",background:color,transition:"width .4s"}}/>
  </div>
);
const Chk=({checked,onClick,label})=>(
  <div onClick={onClick} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:"1px solid #2d3548",cursor:"pointer"}}>
    <div style={{width:22,height:22,borderRadius:6,border:"2px solid "+(checked?G:"#2d3548"),background:checked?G:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
      {checked&&<span style={{color:"#000",fontSize:14,fontWeight:900}}>✓</span>}
    </div>
    <span style={{fontSize:14}}>{label}</span>
  </div>
);

const Field=({label,children})=>(
  <div style={{background:"#0f1117",borderRadius:10,padding:"10px 12px",border:"1px solid #2d3548"}}>
    <div style={{color:"#6b7280",fontSize:9,fontWeight:700,letterSpacing:"0.8px",marginBottom:6}}>{label}</div>
    {children}
  </div>
);

export default function App(){
  const[trades,setTrades]=useState(()=>{
    try{
      const v=localStorage.getItem('ttp_data_version');
      if(v!=='2026-05-15-v3'){
        localStorage.setItem('ttp_data_version','2026-05-15-v3');
        localStorage.setItem('ttp_trades',JSON.stringify(SEED));
        const seedSum=SEED.filter(t=>t.acct==='09').reduce((s,t)=>s+t.pnl,0);
        localStorage.setItem('ttp_saldo',Math.round((50000+seedSum)*100)/100);
        return SEED;
      }
      const s=localStorage.getItem('ttp_trades');
      return s?JSON.parse(s):SEED;
    }catch(e){return SEED;}
  });
  const[showSplash,setShowSplash]=useState(true);
  const[tab,setTab]=useState("dash");
  const[toast,setToast]=useState("");
  const[delId,setDelId]=useState(null);
  const[expandedMonth,setExpandedMonth]=useState(null);
  const[dateFrom,setDateFrom]=useState("");
  const[dateTo,setDateTo]=useState("");
  const[aiOpen,setAiOpen]=useState(false);
  const[aiMessages,setAiMessages]=useState([]);
  const[aiInput,setAiInput]=useState("");
  const[pendingImage,setPendingImage]=useState(null);
  const[aiLoading,setAiLoading]=useState(false);
  const[aiImage,setAiImage]=useState(null);
  const[aiImagePreview,setAiImagePreview]=useState(null);
  const[isRecording,setIsRecording]=useState(false);
  const[aiAutoShown,setAiAutoShown]=useState({});
  const[checks,setChecks]=useState(()=>{
    try{
      const saved=JSON.parse(localStorage.getItem('ttp_checks')||'{}');
      if(saved.date===todayISO())return saved.data||{c1:false,c2:false,c3:false,c4:false};
    }catch(e){}
    return{c1:false,c2:false,c3:false,c4:false};
  });
  const[form,setForm]=useState(emptyForm());
  const[goals,setGoals]=useState(()=>{
    try{const s=localStorage.getItem('ttp_goals');return s?JSON.parse(s):{pnl:1500,disc:80,targetBalance:53000};}
    catch(e){return{pnl:1500,disc:80,targetBalance:53000};}
  });
  const[settingsOpen,setSettingsOpen]=useState(false);
  const[settings,setSettings]=useState(()=>{
    try{
      const s=localStorage.getItem('ttp_settings');
      return s?JSON.parse(s):{maxTrades:2,pauseMins:15,windowStart:"16:15",windowEnd:"17:30",monthlyGoal:1500,riskPerTradePct:2};
    }catch(e){return{maxTrades:2,pauseMins:15,windowStart:"16:15",windowEnd:"17:30",monthlyGoal:1500,riskPerTradePct:2};}
  });
  const saveSettings=(s)=>{setSettings(s);localStorage.setItem('ttp_settings',JSON.stringify(s));};
  const[profExpanded,setProfExpanded]=useState(false);
  const[coachProfile,setCoachProfile]=useState(()=>{
    try{return localStorage.getItem('ttp_coach_profile')||'';}catch(e){return'';}
  });
  const[coachMemory,setCoachMemory]=useState(()=>{
    try{return JSON.parse(localStorage.getItem('ttp_coach_memory')||'[]');}catch(e){return[];}
  });
  const saveCoachMemory=(note)=>{
    const ts=new Date().toISOString().split('T')[0];
    const newMemory=[{date:ts,note},...coachMemory].slice(0,30);
    setCoachMemory(newMemory);
    localStorage.setItem('ttp_coach_memory',JSON.stringify(newMemory));
  };
  const[journal,setJournal]=useState(()=>{try{return JSON.parse(localStorage.getItem('ttp_journal')||'{}');}catch(e){return{};}});
  const[todayJ,setTodayJ]=useState(()=>{
    try{const j=JSON.parse(localStorage.getItem('ttp_journal')||'{}');return j[todayISO()]||{good:"",bad:"",emotion:""};}
    catch(e){return{good:"",bad:"",emotion:""};}
  });
  const[maxDDLevel,setMaxDDLevel]=useState(()=>parseFloat(localStorage.getItem('ttp_maxdd_level')||'49070.80'));
  const[saldo,setSaldo]=useState(()=>parseFloat(localStorage.getItem('ttp_saldo')||'50433.22'));
  const[lastTradeAt,setLastTradeAt]=useState(null);
  const[tick,setTick]=useState(0);

  useEffect(()=>{const id=setInterval(()=>setTick(t=>t+1),1000);return()=>clearInterval(id);},[]);

  useEffect(()=>{
    const t=setTimeout(()=>setShowSplash(false),1800);
    const t2=setTimeout(()=>triggerAiPopup("daily_motivation"),2200);
    return()=>{clearTimeout(t);clearTimeout(t2);};
  },[]);

  useEffect(()=>{
    const h=new Date().getHours(),m=new Date().getMinutes();
    const todayT=t09.filter(t=>t.date===todayISO());
    const key16=todayISO()+"_16";
    const keyOT=todayISO()+"_ot";
    if(h===16&&m>=15&&m<=20&&!aiAutoShown[key16]&&!todayBlocked){
      setAiAutoShown(p=>({...p,[key16]:true}));triggerAiPopup("trading_window");
    }
    if(todayT.length>=OVERTRADING_AT&&!aiAutoShown[keyOT]){
      setAiAutoShown(p=>({...p,[keyOT]:true}));triggerAiPopup("overtrading");
    }
  },[tick]);

  const now=new Date();
  const msSince=lastTradeAt?now-lastTradeAt:999999;
  const pauseSecs=Math.max(0,PAUSE_MINS*60-Math.floor(msSince/1000));
  const inPause=pauseSecs>0;
  const pMin=Math.floor(pauseSecs/60);
  const pSec=pauseSecs%60;
  const pStr=pMin+":"+(pSec<10?"0":"")+pSec;
  const sc=v=>v>=80?G:v>=60?Y:R;

  const t09=useMemo(()=>trades.filter(t=>t&&t.acct==="09"&&typeof t.date==="string").sort((a,b)=>(a.date+a.time)<(b.date+b.time)?-1:1),[trades]);
  const netPnl=useMemo(()=>Math.round(t09.reduce((s,t)=>s+t.pnl,0)*100)/100,[t09]);
  const kontoabstand=Math.max(0,Math.round((saldo-maxDDLevel)*100)/100);
  const todT=t09.filter(t=>t.date===todayISO());
  const todPnl=Math.round(todT.reduce((s,t)=>s+t.pnl,0)*100)/100;
  const tradeCount=todT.length;
  const atLimit=tradeCount>=DAILY_LIMIT;
  const overtradingToday=tradeCount>=OVERTRADING_AT;
  const tradesLeft=Math.max(0,DAILY_LIMIT-tradeCount);
  const dpD=Math.min(100,Math.abs(Math.min(0,todPnl))/1000*100);
  const canTrade=!atLimit&&!overtradingToday&&!inPause;

  const disc=useMemo(()=>{
    if(!t09.length)return 0;
    const tot=t09.reduce((s,t)=>{const rv=t.rules||{},kk=Object.keys(rv);return kk.length?s+kk.filter(k=>rv[k]).length/kk.length:s;},0);
    return Math.round(tot/t09.length*100);
  },[t09]);

  const overtradingDays=useMemo(()=>{
    const m={};t09.forEach(t=>{m[t.date]=(m[t.date]||0)+1;});
    return new Set(Object.entries(m).filter(([,n])=>n>=OVERTRADING_AT).map(([d])=>d));
  },[t09]);

  const blockedDays=useMemo(()=>{
    const s=new Set();
    overtradingDays.forEach(d=>{
      const dt=new Date(d);dt.setDate(dt.getDate()+1);
      if(dt.getDay()===0||dt.getDay()===6)return;
      s.add(dt.toISOString().split("T")[0]);
    });
    return s;
  },[overtradingDays]);

  const todayBlocked=blockedDays.has(todayISO());
  const calMap=useMemo(()=>{const m={};t09.forEach(t=>{if(!m[t.date])m[t.date]=0;m[t.date]+=t.pnl;});return m;},[t09]);

  const weekdayStats=useMemo(()=>{
    const DAYS=["So","Mo","Di","Mi","Do","Fr","Sa"];
    const map={};
    t09.forEach(t=>{
      const lbl=DAYS[new Date(t.date).getDay()];
      if(!map[lbl])map[lbl]={pnl:0,days:new Set(),wins:0,n:0};
      map[lbl].pnl+=t.pnl;map[lbl].days.add(t.date);map[lbl].n++;
      if(t.pnl>0)map[lbl].wins++;
    });
    return["Mo","Di","Mi","Do","Fr"].map(d=>({
      label:d,pnl:map[d]?.pnl||0,days:map[d]?.days.size||0,
      wr:map[d]?.n?Math.round(map[d].wins/map[d].n*100):0,
      pct:map[d]?.days.size?Math.round([...map[d].days].filter(date=>t09.filter(t=>t.date===date).reduce((s,t)=>s+t.pnl,0)>0).length/map[d].days.size*100):0,
    }));
  },[t09]);

  const equity=useMemo(()=>{let c=0;return t09.map((t,i)=>({i:i+1,v:Math.round((c+=t.pnl)*100)/100}));},[t09]);
  const monthPnl=useMemo(()=>Math.round(t09.filter(t=>t.date.startsWith(todayISO().slice(0,7))).reduce((s,t)=>s+t.pnl,0)*100)/100,[t09]);
  const profitPlan=useMemo(()=>{
    if(t09.length<10)return null;
    const wins=t09.filter(t=>t.pnl>0),losses=t09.filter(t=>t.pnl<=0);
    const wr=wins.length/t09.length;
    const avgW=wins.length?wins.reduce((s,t)=>s+t.pnl,0)/wins.length:0;
    const avgL=losses.length?Math.abs(losses.reduce((s,t)=>s+t.pnl,0)/losses.length):1;
    const rr=avgW/avgL;
    const m={};t09.forEach(t=>{m[t.date]=(m[t.date]||0)+1;});
    const dailyEV=Math.round(2*(wr*avgW-(1-wr)*avgL));
    const monthlyEV=Math.round(dailyEV*22);
    return{wr:Math.round(wr*100),rr:rr.toFixed(1),neededWR:Math.round(100/(1+rr)),
      dailyEV,monthlyEV,avgW:Math.round(avgW),avgL:Math.round(avgL),
      overtradeDays:Object.values(m).filter(n=>n>3).length,totalDays:Object.keys(m).length};
  },[t09]);

  const durBuckets=useMemo(()=>{
    const bkts=[{lbl:"<30s",mn:0,mx:30},{lbl:"30s-2m",mn:30,mx:120},{lbl:"2-5m",mn:120,mx:300},{lbl:"5m+",mn:300,mx:999999}];
    return bkts.map(b=>{
      const arr=t09.filter(t=>t.dur>=b.mn&&t.dur<b.mx);
      const w=arr.filter(t=>t.pnl>0);
      return{label:b.lbl,n:arr.length,wr:arr.length?Math.round(w.length/arr.length*100):0,pnl:arr.reduce((s,t)=>s+t.pnl,0)};
    });
  },[t09]);

  const monthlyStats=useMemo(()=>{
    const m={};
    t09.forEach(t=>{
      const mo=t.date.slice(0,7);
      if(!m[mo])m[mo]={pnl:0,trades:0,wins:0,losses:0,days:new Set()};
      m[mo].pnl+=t.pnl;m[mo].trades++;m[mo].days.add(t.date);
      if(t.pnl>0)m[mo].wins++;else m[mo].losses++;
    });
    return Object.entries(m).sort(([a],[b])=>b.localeCompare(a)).map(([mo,v])=>({
      mo,pnl:Math.round(v.pnl*100)/100,trades:v.trades,wins:v.wins,losses:v.losses,
      wr:Math.round(v.wins/v.trades*100),days:v.days.size
    }));
  },[t09]);

  const showToast=msg=>{setToast(msg);setTimeout(()=>setToast(""),2800);};

  const DAILY_QUOTES=[
    "Jeden Tag gibt es Chancen, nicht jeder Trade muss mitgemacht werden.",
    "Disziplin schlaegt Talent. Halte dich an deine Regeln.",
    "Der beste Trade ist manchmal der, den du nicht machst.",
    "Geduld ist deine groesste Staerke. Warte auf dein Setup.",
    "Heute zaehlt jede Regel die du befolgst – mehr als jeder Gewinn.",
    "Konstanz schlaegt schnelle Gewinne. Bleib bei deinem Plan.",
    "Der Markt laeuft nicht weg. Atme tief durch.",
    "Verluste gehoeren dazu. Wichtig ist wie du danach reagierst.",
    "Routine ist langweilig – aber sie macht profitable Trader.",
    "Deine Regeln sind dein Schutz. Bricht sie, bricht dein Konto.",
  ];
  const getDailyQuote=()=>{
    const dayOfYear=Math.floor((new Date()-new Date(new Date().getFullYear(),0,0))/86400000);
    return DAILY_QUOTES[dayOfYear%DAILY_QUOTES.length];
  };

  const smartCoach=(userMsg,trigger)=>{
    const wins=t09.filter(t=>t.pnl>0).length;
    const wr=t09.length?Math.round(wins/t09.length*100):0;
    const todayT=t09.filter(t=>t.date===todayISO());
    const todPnlV=Math.round(todayT.reduce((s,t)=>s+t.pnl,0)*100)/100;
    const DAYS=["So","Mo","Di","Mi","Do","Fr","Sa"];
    const tod=DAYS[new Date().getDay()];
    const dayMap={};t09.forEach(t=>{const d=DAYS[new Date(t.date).getDay()];if(!dayMap[d])dayMap[d]={w:0,n:0,pnl:0};dayMap[d].n++;dayMap[d].pnl+=t.pnl;if(t.pnl>0)dayMap[d].w++;});
    const dayWR=dayMap[tod]?Math.round(dayMap[tod].w/dayMap[tod].n*100):0;
    const lastT=t09[t09.length-1];
    const hour=new Date().getHours();const min=new Date().getMinutes();
    const inWindow=(hour===16&&min>=15)||(hour===17&&min<=30);
    if(trigger==="daily_motivation"){
      const q=getDailyQuote();
      return "Guten Morgen Jeronimo! \u2600\uFE0F\n\n"+q+"\n\nHeute ("+tod+"): "+todayT.length+"/2 Trades\n"+tod+"-WR historisch: "+dayWR+"%\n\nRoutine: Regeln durchgehen \u2192 Setup warten \u2192 Nur 16:15-17:30 Uhr.";
    }
    if(trigger==="trading_window"){
      if(dayWR<40&&dayMap[tod]&&dayMap[tod].n>=3)return "\u26A0\uFE0F Trading-Fenster offen, aber "+tod+" ist dein schwacher Tag ("+dayWR+"% WR). Empfehlung: Heute Pause oder demo.";
      return "\u2705 Trading-Fenster offen! "+tod+"-WR: "+dayWR+"%. Max 2 Trades, 1 MNQ, Kontoabstand: $"+kontoabstand.toFixed(0)+".";
    }
    if(trigger==="overtrading")return "\uD83D\uDED1 STOPP! "+todayT.length+". Trade heute. MAX 2. Schliesse die Plattform JETZT. Morgen gesperrt. P&L heute: "+(todPnlV>=0?"+":"")+"$"+todPnlV.toFixed(0)+".";
    if(trigger==="after_trade"&&lastT){
      const ok=lastT.pnl>0;
      const ruleScore=Object.values(lastT.rules||{}).filter(Boolean).length;
      const totalRules=Object.keys(lastT.rules||{}).length;
      const rulePct=totalRules?Math.round(ruleScore/totalRules*100):0;
      if(ok&&rulePct>=80)return "\uD83C\uDFAF Stark! "+lastT.contract+" "+lastT.dir+" +$"+lastT.pnl.toFixed(0)+". Regelquote: "+rulePct+"%. Heute: "+todayT.length+"/2 Trades.";
      if(!ok)return "\u274C Verlust $"+lastT.pnl.toFixed(0)+" (Regelquote: "+rulePct+"%). 15 Min Pause sind Pflicht. Kein Rache-Trade!";
      return "\uD83D\uDCC8 Gewinn +$"+lastT.pnl.toFixed(0)+" aber Regelquote nur "+rulePct+"%. Glueck ist keine Strategie.";
    }
    const msg=(userMsg||"").toLowerCase();
    if(msg.includes("hallo")||msg.includes("hi"))return "Hi Jeronimo! \uD83D\uDC4B "+t09.length+" Trades, "+wr+"% WR. Heute: "+todayT.length+"/2 ("+(todPnlV>=0?"+":"")+"$"+todPnlV.toFixed(0)+").";
    if(msg.includes("heute"))return todayT.length===0?"Heute noch keine Trades. "+tod+"-WR: "+dayWR+"%. "+(inWindow?"Fenster offen!":"Fenster: 16:15-17:30."):"Heute: "+todayT.length+" Trades, P&L: "+(todPnlV>=0?"+":"")+"$"+todPnlV.toFixed(0)+(todayT.length>=2?". LIMIT!":". Noch "+(2-todayT.length)+" Trade moeglich.");
    if(msg.includes("soll ich")||msg.includes("traden")){
      if(todayT.length>=2)return "Nein. Du hast schon "+todayT.length+"/2 Trades. Limit erreicht.";
      if(todayBlocked)return "NEIN. Heute gesperrt wegen Overtrading gestern.";
      if(!inWindow)return "Warte aufs Fenster (16:15-17:30). Jetzt: "+String(hour).padStart(2,"0")+":"+String(min).padStart(2,"0")+" Uhr.";
      return "Wenn Setup da ist: ja. 1 MNQ, SL 40 Ticks, TP 80 Ticks. Regelquote pruefen!";
    }
    if(msg.includes("kontoabstand")||msg.includes("dd"))return "Kontoabstand: $"+kontoabstand.toFixed(0)+" ("+Math.round(kontoabstand/BUFFER*100)+"% frei). Max pro Trade: $"+Math.round(kontoabstand*0.02)+".";
    if(msg.includes("regel"))return "Regeln: Max 2 Trades/Tag, nur 16:15-17:30, 1 MNQ, 15 Min Pause, SL+TP vor Entry. 3 Trades = morgen gesperrt.";
    if(msg.includes("danke"))return "Gerne. Trade smart, nicht hart. \uD83D\uDCAA";
    return "Aktuell: "+t09.length+" Trades, "+wr+"% WR, Saldo $"+saldo.toFixed(0)+". Heute ("+tod+"): "+todayT.length+"/2, "+(todPnlV>=0?"+":"")+"$"+todPnlV.toFixed(0)+". Frag: 'soll ich traden', 'heute', 'kontoabstand', 'regeln'.";
  };

  const triggerAiPopup=async(type,tradeData)=>{
    setAiOpen(true);
    setAiLoading(true);
    setAiMessages([{role:"assistant",content:"⏳ Analysiere...",auto:true}]);
    
    const DAYS=["So","Mo","Di","Mi","Do","Fr","Sa"];
    const tod=DAYS[new Date().getDay()];
    const dayMap={};t09.forEach(t=>{const d=DAYS[new Date(t.date).getDay()];if(!dayMap[d])dayMap[d]={w:0,n:0,pnl:0};dayMap[d].n++;dayMap[d].pnl+=t.pnl;if(t.pnl>0)dayMap[d].w++;});
    const dayWR=dayMap[tod]?Math.round(dayMap[tod].w/dayMap[tod].n*100):0;
    const yesterdayISO=()=>{const d=new Date();d.setDate(d.getDate()-1);while(d.getDay()===0||d.getDay()===6)d.setDate(d.getDate()-1);return d.toISOString().split("T")[0];};
    const yT=t09.filter(t=>t.date===yesterdayISO());
    const yPnl=Math.round(yT.reduce((s,t)=>s+t.pnl,0)*100)/100;
    const wins=t09.filter(t=>t.pnl>0).length;
    const wr=t09.length?Math.round(wins/t09.length*100):0;
    const streak=()=>{let s=0;const r=[...t09].reverse();for(const t of r){if(t.pnl>0)s>0?s++:s===0?s=1:s=1;else s<0?s--:s===0?s=-1:s=-1;break;}return s;};
    const currentStreak=streak();

    let prompt="";
    if(type==="daily_motivation"){
      const yTradesStr=yT.length?yT.map(t=>"• "+t.time+" "+t.contract+" "+t.dir+" "+(t.pnl>=0?"+":"")+"$"+t.pnl.toFixed(0)).join("\n"):"Kein Trading gestern";
      const statsStr="• "+tod+"-WR historisch: "+dayWR+"% ("+((dayMap[tod]?.n)||0)+" Trades)\n• Gesamt WR: "+wr+"% aus "+t09.length+" Trades\n• Streak: "+(currentStreak>0?"+"+currentStreak+" Gewinne":currentStreak<0?currentStreak+" Verluste":"Neutral")+"\n• Saldo: $"+saldo.toFixed(2)+" | Ziel: $"+goals.targetBalance+" | Fehlt: $"+Math.max(0,goals.targetBalance-saldo).toFixed(0)+"\n• Kontoabstand: $"+kontoabstand.toFixed(0);
      prompt="Gib mir mein persönliches Tages-Briefing für heute ("+tod+").\n\nGESTRIGE TRADES ("+yT.length+" Trades, P&L: "+(yPnl>=0?"+":"")+"$"+yPnl+"):\n"+yTradesStr+"\n\nMEINE STATS:\n"+statsStr+"\n\nAnalysiere gestrige Trades kurz, gib mir eine klare Empfehlung für heute und eine persönliche Motivation. Max 5 Sätze.";
    }
    else if(type==="after_trade"&&tradeData){
      const tod2=t09.filter(t=>t.date===todayISO());
      const ruleScore=Object.values(tradeData.rules||{}).filter(Boolean).length;
      const totalRules=Object.keys(tradeData.rules||{}).length;
      const rulePct=totalRules?Math.round(ruleScore/totalRules*100):0;
      const recentLosses=t09.slice(-5).filter(t=>t.pnl<0).length;
      prompt=`Analysiere meinen Trade und gib mir direktes Feedback:

TRADE: ${tradeData.contract} ${tradeData.dir} um ${tradeData.time}
P&L: ${tradeData.pnl>=0?"+":""}$${tradeData.pnl.toFixed(2)}
Regelquote: ${rulePct}% (${ruleScore}/${totalRules} Regeln)
Setup: ${tradeData.setup||"Nicht angegeben"}
Trade Nr. heute: ${tod2.length}/${DAILY_LIMIT}

KONTEXT:
• Letzte 5 Trades: ${t09.slice(-5).map(t=>t.pnl>=0?"+$"+t.pnl.toFixed(0):"-$"+Math.abs(t.pnl).toFixed(0)).join(", ")}
• Verluste in letzten 5: ${recentLosses}
• Heutige P&L: ${todPnl>=0?"+":""}$${todPnl.toFixed(0)}

Sei direkt und ehrlich. Erkenne Muster wenn du sie siehst. Max 4 Sätze.`;
    }
    else if(type==="overtrading"){
      const tod3=t09.filter(t=>t.date===todayISO());
      const todTradesStr=tod3.map(t=>"• "+t.time+" "+t.contract+" "+(t.pnl>=0?"+":"")+"$"+t.pnl.toFixed(0)).join("\n");
      prompt="NOTFALL: Jeronimo hat gerade seinen "+tod3.length+". Trade gemacht (Limit: "+DAILY_LIMIT+").\n\nHeutige Trades:\n"+todTradesStr+"\nHeutige P&L: "+(todPnl>=0?"+":"")+"$"+todPnl.toFixed(0)+"\n\nGib eine KLARE STOPP-Nachricht. Kurz, direkt, keine Ausreden akzeptieren. Max 3 Sätze.";
    }
    else if(type==="trading_window"){
      prompt=`Das Trading-Fenster (16:15-17:30) ist gerade geöffnet.

HEUTE (${tod}):
• Bisherige Trades: ${tradeCount}/${DAILY_LIMIT}
• P&L heute: ${todPnl>=0?"+":""}$${todPnl.toFixed(0)}
• ${tod}-WR historisch: ${dayWR}%
• Kontoabstand: $${kontoabstand.toFixed(0)}

Soll ich jetzt traden? Klare Ja/Nein Empfehlung mit kurzem Grund. Max 3 Sätze.`;
    }
    else{
      setAiMessages([{role:"assistant",content:smartCoach("",type),auto:true}]);
      setAiLoading(false);
      return;
    }

    try{
      const wins_t=t09.filter(t=>t.pnl>0),losses_t=t09.filter(t=>t.pnl<0);
      const ctx={saldo,kontoabstand,tradeCount,todPnl,disc,todayBlocked,inPause,tradesLeft,
        totalTrades:t09.length,winRate:wr,currentDay:tod,dayWR,monthPnl,targetBalance:goals.targetBalance,
        missingToTarget:Math.max(0,goals.targetBalance-saldo),
        avgWin:wins_t.length?Math.round(wins_t.reduce((s,t)=>s+t.pnl,0)/wins_t.length):0,
        avgLoss:losses_t.length?Math.round(losses_t.reduce((s,t)=>s+t.pnl,0)/losses_t.length):0,
        allTrades:t09.map(t=>t.date+" "+t.time+" "+t.contract+" "+t.dir+" "+(t.pnl>=0?"+":"")+"$"+t.pnl.toFixed(0)).join("\n"),
        todayTrades:todT.map(t=>({pnl:t.pnl,dir:t.dir,contract:t.contract,time:t.time})),
        coachProfile:coachProfile||'',
        coachMemory:coachMemory.slice(0,10).map(m=>m.date+': '+m.note).join('\n')};
      const res=await fetch('/api/chat',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({messages:[{role:"user",content:prompt}],context:ctx})
      });
      const rawText=await res.text();
      if(!res.ok){setAiMessages([{role:"assistant",content:smartCoach("",type),auto:true}]);return;}
      const data=JSON.parse(rawText);
      if(data.message){
        setAiMessages([{role:"assistant",content:data.message,auto:true}]);
        const m=data.message;
        if(m.includes("Muster")||m.includes("Problem")||m.includes("Stärke")||m.includes("Schwäche")||m.length>200){
          saveCoachMemory("💡 Session "+new Date().toLocaleDateString("de-DE")+": "+m.slice(0,100).replace(/\n/g," ")+"...");
        }
      }
      else setAiMessages([{role:"assistant",content:smartCoach("",type),auto:true}]);
    }catch(err){
      setAiMessages([{role:"assistant",content:smartCoach("",type),auto:true}]);
    }finally{setAiLoading(false);}
  };

  const startVoice=()=>{
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){showToast("Spracheingabe nicht unterstützt");return;}
    const rec=new SR();
    rec.lang="de-DE";
    rec.continuous=false;
    rec.interimResults=false;
    setIsRecording(true);
    rec.start();
    rec.onresult=(e)=>{
      const text=e.results[0][0].transcript;
      setAiInput(text);
      setIsRecording(false);
    };
    rec.onerror=()=>setIsRecording(false);
    rec.onend=()=>setIsRecording(false);
  };

  const handleImageSelect=(e)=>{
    const file=e.target.files[0];
    if(!file)return;
    const reader=new FileReader();
    reader.onload=(ev)=>{
      const base64=ev.target.result.split(",")[1];
      setAiImage({base64,mediaType:file.type||"image/jpeg"});
      setAiImagePreview(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const sendAiMessage=async()=>{
    if((!aiInput.trim()&&!aiImage)||aiLoading)return;
    // "Merke dir..." Befehl → direkt ins Gedächtnis
    const inputLow=(aiInput||"").toLowerCase();
    if(inputLow.startsWith("merke dir")||inputLow.startsWith("vergiss nicht")){
      const note=aiInput.slice(inputLow.indexOf(" ")+1).trim();
      if(note){
        saveCoachMemory("📌 "+note);
        setAiMessages(p=>[...p,{role:"user",content:aiInput},{role:"assistant",content:"✅ Gemerkt! Ich werde mir das für alle zukünftigen Sessions merken:\n\n📌 "+note}]);
        setAiInput("");
        return;
      }
    }
    const userInput=aiInput;
    const newMsgs=[...aiMessages,{role:"user",content:userInput}];
    setAiMessages(newMsgs);
    setAiInput("");
    setAiLoading(true);
    try{
      // Alle Trades für KI-Analyse
      const allWins=t09.filter(t=>t.pnl>0);
      const allLoss=t09.filter(t=>t.pnl<0);
      const DAYS2=["So","Mo","Di","Mi","Do","Fr","Sa"];
      const dayStats={};
      t09.forEach(t=>{const d=DAYS2[new Date(t.date).getDay()];if(!dayStats[d])dayStats[d]={n:0,wins:0,pnl:0};dayStats[d].n++;dayStats[d].pnl+=t.pnl;if(t.pnl>0)dayStats[d].wins++;});
      const hourStats={};
      t09.forEach(t=>{const h=parseInt(t.time.split(":")[0]);if(!hourStats[h])hourStats[h]={n:0,wins:0,pnl:0};hourStats[h].n++;hourStats[h].pnl+=t.pnl;if(t.pnl>0)hourStats[h].wins++;});
      const setupStats={};
      t09.forEach(t=>{const s=t.setup||"Unbekannt";if(!setupStats[s])setupStats[s]={n:0,wins:0,pnl:0};setupStats[s].n++;setupStats[s].pnl+=t.pnl;if(t.pnl>0)setupStats[s].wins++;});
      const ctx={
        // Account Status
        saldo,kontoabstand,tradeCount,todPnl,disc,todayBlocked,inPause,tradesLeft,
        currentTime:nowHHMM(),
        currentDay:["So","Mo","Di","Mi","Do","Fr","Sa"][new Date().getDay()],
        // Goals
        monthPnl,targetBalance:goals.targetBalance,
        missingToTarget:Math.max(0,goals.targetBalance-saldo),
        // Gesamtstatistik
        totalTrades:t09.length,
        winRate:t09.length?Math.round(allWins.length/t09.length*100):0,
        avgWin:allWins.length?Math.round(allWins.reduce((s,t)=>s+t.pnl,0)/allWins.length):0,
        avgLoss:allLoss.length?Math.round(allLoss.reduce((s,t)=>s+t.pnl,0)/allLoss.length):0,
        totalPnl:Math.round(t09.reduce((s,t)=>s+t.pnl,0)),
        overtradingToday,atLimit,
        // Muster-Analyse
        dayStats,hourStats,setupStats,
        // Heutige Trades (voll)
        todayTrades:todT.map(t=>({pnl:t.pnl,dir:t.dir,contract:t.contract,time:t.time,setup:t.setup})),
        allTrades:t09.map(t=>({d:t.date,t:t.time,p:Math.round(t.pnl),dir:t.dir,c:t.contract,s:t.setup||""})),
        coachProfile:coachProfile||'',
        coachMemory:coachMemory.slice(0,10).map(m=>m.date+': '+m.note).join('\n')
      };
      // Build messages mit optionalem Bild
      const apiMessages=newMsgs.map((m,i)=>{
        if(i===newMsgs.length-1&&aiImage&&m.role==="user"){
          return{role:"user",content:[
            {type:"image",source:{type:"base64",media_type:aiImage.mediaType,data:aiImage.base64}},
            {type:"text",text:m.content||"Analysiere diesen Chart für mich"}
          ]};
        }
        return{role:m.role,content:m.content};
      });
      setAiImage(null);
      setAiImagePreview(null);
      const res=await fetch('/api/chat',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({messages:apiMessages,context:ctx})
      });
      const rawText=await res.text();
      if(!res.ok){
        setAiMessages(p=>[...p,{role:"assistant",content:"🔴 HTTP "+res.status+": "+rawText.slice(0,200)}]);
        return;
      }
      let data;
      try{data=JSON.parse(rawText);}catch(e){
        setAiMessages(p=>[...p,{role:"assistant",content:"🔴 JSON Fehler: "+rawText.slice(0,200)}]);
        return;
      }
      if(!data.message){
        setAiMessages(p=>[...p,{role:"assistant",content:"🔴 Kein message Feld: "+JSON.stringify(data).slice(0,200)}]);
        return;
      }
      setAiMessages(p=>[...p,{role:"assistant",content:data.message}]);
    }catch(err){
      setAiMessages(p=>[...p,{role:"assistant",content:"🔴 Netzwerk Fehler: "+err.message}]);
    }finally{setAiLoading(false);}
  };

  const addTrade=()=>{
    if(!form.pnl){showToast("Bitte P&L eingeben");return;}
    const v=parseFloat(form.pnl);
    if(isNaN(v)){showToast("P&L muss eine Zahl sein");return;}
    const newT={id:uid(),acct:"09",contract:form.contract,date:form.date,time:form.time,pnl:v,dur:0,dir:form.dir,setup:form.setup,notes:form.notes,rules:{...form.rules}};
    setTrades(p=>{const u=[...p,newT];localStorage.setItem('ttp_trades',JSON.stringify(u));return u;});
    const newSaldo=Math.round((saldo+v)*100)/100;
    setSaldo(newSaldo);localStorage.setItem("ttp_saldo",newSaldo);
    setLastTradeAt(new Date());
    setForm(emptyForm());
    showToast("Gespeichert! 15-Min Pause startet...");
    setTab("dash");
    setTimeout(()=>triggerAiPopup("after_trade",newT),1000);
    setChecks({c1:false,c2:false,c3:false,c4:false});
    localStorage.removeItem("ttp_checks");
  };

  const renderCal=()=>{
    const y=now.getFullYear(),mo=now.getMonth();
    const fd2=new Date(y,mo,1).getDay(),dim=new Date(y,mo+1,0).getDate();
    const cells=[];
    for(let i=0;i<(fd2||7)-1;i++)cells.push(<div key={"e"+i}/>);
    for(let d=1;d<=dim;d++){
      const k=`${y}-${String(mo+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      const pv=calMap[k],isT=k===todayISO(),isFuture=k>todayISO();
      const isBlocked=blockedDays.has(k)&&isFuture;
      let bg="#1a1f2e",border=isT?B:"#2d3548";
      if(isBlocked){bg=R+"11";border=R+"44";}
      else if(pv!=null){bg=pv>0?G+"22":R+"22";border=pv>0?G+"55":R+"55";}
      cells.push(
        <div key={k} style={{background:bg,border:"2px solid "+border,borderRadius:7,padding:"5px 2px",textAlign:"center",minHeight:42}}>
          <div style={{color:isT?B:"#6b7280",fontSize:11,fontWeight:isT?700:400}}>{d}</div>
          {isBlocked&&<div style={{fontSize:8,color:R,fontWeight:700}}>SPERRE</div>}
          {pv!=null&&!isBlocked&&<div style={{color:pc(pv),fontSize:10,fontWeight:700}}>{pv>=0?"+":"-"}${Math.abs(pv).toFixed(0)}</div>}
        </div>
      );
    }
    return cells;
  };

  const allChecked=Object.values(checks).every(Boolean);
  const nowD=new Date();
  const lonTime=nowD.toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit",timeZone:"Europe/London"});
  const chiTime=nowD.toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit",timeZone:"America/Chicago"});
  const lonH=new Date(nowD.toLocaleString("en-US",{timeZone:"Europe/London"})).getHours();
  const chiH=new Date(nowD.toLocaleString("en-US",{timeZone:"America/Chicago"})).getHours();
  const lonOpen=lonH>=8&&lonH<16;
  const chiOpen=chiH>=8&&chiH<15;
  const NAVS=[
  {k:"dash",lb:"Dashboard",svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><polyline points="2,17 8,10 13,14 22,5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="8" cy="10" r="1.5" fill="currentColor"/><circle cx="13" cy="14" r="1.5" fill="currentColor"/><line x1="2" y1="21" x2="22" y2="21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/></svg>},
  {k:"check",lb:"Regeln",svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 2 L14.5 9H22L16 13.5L18.5 21L12 16.5L5.5 21L8 13.5L2 9H9.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" fill="none"/><polyline points="8,12 11,15 16,9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>},
  {k:"log",lb:"Loggen",svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>},
  {k:"analyse",lb:"Analyse",svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 20 Q7 12 10 15 Q13 18 16 8 Q18 2 21 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/><circle cx="21" cy="4" r="2" fill="currentColor" opacity="0.8"/><circle cx="10" cy="15" r="1.5" fill="currentColor" opacity="0.6"/></svg>},
  {k:"hist",lb:"History",svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="2" rx="1" fill="currentColor" opacity="0.9"/><rect x="3" y="9" width="14" height="2" rx="1" fill="currentColor" opacity="0.7"/><rect x="3" y="14" width="16" height="2" rx="1" fill="currentColor" opacity="0.5"/><rect x="3" y="19" width="10" height="2" rx="1" fill="currentColor" opacity="0.35"/></svg>},
];

  return(
    <div style={{background:"#0f1117",minHeight:"100vh",color:"#e2e8f0",fontFamily:"-apple-system,BlinkMacSystemFont,sans-serif",fontSize:14,paddingBottom:"calc(80px + env(safe-area-inset-bottom,0px))"}}>
      {showSplash&&<div style={{position:"fixed",inset:0,zIndex:9999,background:"radial-gradient(circle at center,#1a1f2e 0%,#0f1117 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",animation:"fadeOut 0.4s ease 1.4s forwards"}}>
        <div style={{fontSize:42,fontWeight:900,letterSpacing:"-2px",marginBottom:8}}><span style={{color:B}}>Mind</span><span style={{color:"#e2e8f0"}}>Risk</span></div>
        <div style={{fontSize:11,color:"#6b7280",letterSpacing:"3px",marginBottom:32}}>TRADING JOURNAL</div>
        <div style={{width:48,height:48,borderRadius:"50%",border:"3px solid #2d3548",borderTopColor:B,animation:"spin 0.8s linear infinite"}}/>
      </div>}

      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        html,body{overflow-x:hidden;max-width:100%}
        input,select,textarea{max-width:100%;box-sizing:border-box;background:#0f1117;color:#e2e8f0;border:1px solid #2d3548;border-radius:8px;padding:8px 10px;font-family:inherit;font-size:14px;outline:none;width:100%}
        input:focus,select:focus,textarea:focus{border-color:#6366f1}
        select option{background:#1a1f2e}
        button{cursor:pointer;font-family:inherit;border:none;border-radius:8px}
        .mr-content{padding:16px 16px 20px;max-width:520px;margin:0 auto}
        .mr-nav{max-width:520px;margin:0 auto}
        @keyframes pulse{0%,100%{opacity:0.3}50%{opacity:1}}@keyframes livingOrb{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}@keyframes orbGlow{0%,100%{box-shadow:0 0 20px rgba(99,102,241,0.55),0 0 40px rgba(168,85,247,0.35),0 0 70px rgba(99,102,241,0.15)}50%{box-shadow:0 0 30px rgba(99,102,241,0.85),0 0 65px rgba(168,85,247,0.55),0 0 100px rgba(99,102,241,0.3)}}@keyframes orbRing1{0%{transform:scale(1);opacity:0.8}100%{transform:scale(2.5);opacity:0}}@keyframes orbRing2{0%{transform:scale(1);opacity:0.6}100%{transform:scale(3);opacity:0}}@keyframes orbRing3{0%{transform:scale(1);opacity:0.4}100%{transform:scale(3.8);opacity:0}}@keyframes orbSpin{to{transform:rotate(360deg)}}@keyframes orbCore{0%,100%{opacity:0.55;transform:translate(-50%,-50%) scale(0.85)}50%{opacity:1;transform:translate(-50%,-50%) scale(1.2)}}@keyframes breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}@keyframes orbGlow{0%,100%{box-shadow:0 0 20px rgba(99,102,241,0.5),0 0 40px rgba(168,85,247,0.3),0 0 60px rgba(99,102,241,0.15)}50%{box-shadow:0 0 30px rgba(99,102,241,0.8),0 0 60px rgba(168,85,247,0.5),0 0 90px rgba(99,102,241,0.25)}}@keyframes orbSpin{to{transform:rotate(360deg)}}@keyframes orbCore{0%,100%{opacity:0.6;transform:translate(-50%,-50%) scale(0.8)}50%{opacity:1;transform:translate(-50%,-50%) scale(1.15)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes fadeOut{to{opacity:0;visibility:hidden}}
        @keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes glowPulse{0%,100%{box-shadow:0 0 0 0 rgba(99,102,241,0.5)}50%{box-shadow:0 0 0 12px rgba(99,102,241,0)}}
        @keyframes orb{0%,100%{transform:scale(1);box-shadow:0 0 20px rgba(99,102,241,0.6),0 0 40px rgba(168,85,247,0.3)}50%{transform:scale(1.05);box-shadow:0 0 30px rgba(99,102,241,0.9),0 0 60px rgba(168,85,247,0.5)}}
        @keyframes ring{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
      `}</style>

      {toast&&<div style={{position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",zIndex:999,background:"#161b22",border:"1px solid "+G,color:G,padding:"10px 20px",borderRadius:10,fontWeight:600,fontSize:13,boxShadow:"0 8px 32px #0008",whiteSpace:"nowrap"}}>{toast}</div>}

      {delId&&<div style={{position:"fixed",inset:0,zIndex:998,background:"#000c",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <Card style={{width:280,textAlign:"center",border:"1px solid "+R}}>
          <div style={{color:R,fontWeight:700,marginBottom:16,fontSize:16}}>Trade loeschen?</div>
          <div style={{display:"flex",gap:10,justifyContent:"center"}}>
            <button style={{background:R+"33",color:R,border:"1px solid "+R,padding:"8px 20px",fontWeight:600}} onClick={()=>{setTrades(p=>p.filter(t=>t.id!==delId));setDelId(null);showToast("Geloescht");}}>Ja</button>
            <button style={{background:"#21262d",color:"#8b949e",padding:"8px 16px"}} onClick={()=>setDelId(null)}>Nein</button>
          </div>
        </Card>
      </div>}

      {/* HEADER */}
      <div style={{background:"linear-gradient(180deg,#1a1f2e 0%,#161b27 100%)",borderBottom:"1px solid #2d3548",padding:"14px 18px 12px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
          <div>
            <div style={{fontWeight:800,fontSize:28,letterSpacing:"-1px"}}><span style={{color:B}}>Mind</span><span style={{color:"#e2e8f0"}}>Risk</span></div>
            <div style={{color:"#6b7280",fontSize:10,marginTop:1}}>Jeronimo – Konto 09</div>
          </div>
          <div style={{fontSize:10,textAlign:"right"}}>
            <div style={{display:"flex",flexDirection:"column",gap:2,alignItems:"flex-end"}}>
              <div><span style={{color:"#6b7280",fontSize:9}}>LON </span><span style={{color:lonOpen?G:Y,fontWeight:700}}>{lonTime}</span><span style={{color:lonOpen?G:"#6b7280",marginLeft:3}}>{lonOpen?"●":"○"}</span></div>
              <div><span style={{color:"#6b7280",fontSize:9}}>CHI </span><span style={{color:chiOpen?G:Y,fontWeight:700}}>{chiTime}</span><span style={{color:chiOpen?G:"#6b7280",marginLeft:3}}>{chiOpen?"●":"○"}</span></div>
            </div>
          </div>
          <button onClick={()=>setSettingsOpen(true)} style={{background:"linear-gradient(135deg,#6366f1,#a855f7)",borderRadius:12,width:42,height:42,padding:0,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:20,flexShrink:0}}>☰</button>
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          <Pill bg={B+"22"} color={B}>P1-235109</Pill>
          <Pill bg={todPnl>=0?G+"22":R+"22"} color={pc(todPnl)}>Heute: {fs(todPnl)}</Pill>
          {inPause&&<Pill bg={Y+"33"} color={Y}>⏸ {pStr}</Pill>}
          <Pill bg={tradesLeft>0&&!todayBlocked&&!atLimit?G+"22":R+"22"} color={tradesLeft>0&&!todayBlocked&&!atLimit?G:R}>
            {todayBlocked?"🚫 GESPERRT":overtradingToday?"🚫 3 TRADES":atLimit?"🛑 LIMIT":tradesLeft+" Trade"+(tradesLeft===1?"":"s")+" übrig"}
          </Pill>
          <Pill bg={sc(disc)+"22"} color={sc(disc)}>Regelquote: {disc}%</Pill>
        </div>
      </div>

      {inPause&&<div style={{position:"sticky",top:0,zIndex:90,background:"linear-gradient(135deg,#f59e0b,#ef4444)",padding:"10px 16px",display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:18}}>⏸</span>
        <div style={{flex:1}}>
          <div style={{fontWeight:800,fontSize:13,color:"#fff"}}>PFLICHTPAUSE – {pStr}</div>
          <div style={{fontSize:10,color:"#fef3c7"}}>Kein Impuls-Trade! Warte den Timer ab.</div>
        </div>
      </div>}

      <div className="mr-content">

        {/* DASHBOARD */}
        {tab==="dash"&&<div style={{display:"flex",flexDirection:"column",gap:12}}>
          {todayBlocked&&<div style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.4)",borderRadius:14,padding:"14px 16px",display:"flex",gap:12,alignItems:"center"}}>
            <span style={{fontSize:22}}>🚫</span>
            <div><div style={{color:R,fontWeight:700,fontSize:13}}>Heute gesperrt (Overtrading gestern)</div><div style={{color:"#fca5a5",fontSize:11}}>Morgen wieder. Heute: analysieren.</div></div>
          </div>}
          {overtradingToday&&!todayBlocked&&<div style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.4)",borderRadius:14,padding:"14px 16px",display:"flex",gap:12,alignItems:"center"}}>
            <span style={{fontSize:22}}>🚫</span>
            <div><div style={{color:R,fontWeight:700,fontSize:13}}>3 Trades – Morgen gesperrt!</div><div style={{color:"#fca5a5",fontSize:11}}>Rechner aus.</div></div>
          </div>}
          {atLimit&&!overtradingToday&&!todayBlocked&&<div style={{background:O+"22",border:"1px solid "+O,borderRadius:10,padding:"10px 14px",display:"flex",gap:10,alignItems:"center"}}>
            <span>🛑</span><div><div style={{color:O,fontWeight:800}}>2 Trades – Tageslimit!</div><div style={{color:"#fdba74",fontSize:11}}>Kein 3. Trade!</div></div>
          </div>}
          {inPause&&<div style={{background:"linear-gradient(135deg,rgba(245,158,11,0.15),rgba(239,68,68,0.08))",border:"2px solid rgba(245,158,11,0.6)",borderRadius:14,padding:"16px 18px",display:"flex",gap:14,alignItems:"center",animation:"glowPulse 2s ease infinite"}}>
            <span style={{fontSize:24}}>⏸</span>
            <div style={{flex:1}}>
              <div style={{color:Y,fontWeight:700,fontSize:13,marginBottom:4}}>Pflichtpause</div>
              <div style={{color:Y,fontWeight:800,fontSize:36,lineHeight:1}}>{pStr}</div>
              <div style={{color:"#fbbf24",fontSize:11,marginTop:5}}>Kein Impuls-Trade – warte den Timer ab</div>
            </div>
          </div>}

          <Card style={{borderColor:B+"44"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
              <div>
                <div style={{color:"#6b7280",fontSize:10,fontWeight:600,letterSpacing:1,marginBottom:3}}>KONTO 09</div>
                <div style={{color:pc(netPnl),fontWeight:800,fontSize:26}}>{netPnl>=0?"+":"-"}${Math.abs(netPnl).toFixed(2)}</div>
                <div style={{color:"#6b7280",fontSize:10,marginTop:1}}>Saldo: ${saldo.toLocaleString("de-DE")}</div>
              </div>
              <div style={{background:"#0f1117",borderRadius:8,padding:"8px 12px",textAlign:"right"}}>
                <div style={{color:"#6b7280",fontSize:9,marginBottom:1}}>HEUTE</div>
                <div style={{color:pc(todPnl),fontWeight:800,fontSize:16}}>{fs(todPnl)}</div>
                <div style={{color:"#6b7280",fontSize:9,marginTop:1}}>{tradeCount}/{DAILY_LIMIT} Trades</div>
              </div>
            </div>
            <div style={{marginBottom:8}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                <span style={{color:"#6b7280",fontSize:10}}>Max DD Abstand</span>
                <span style={{color:kontoabstand<500?R:kontoabstand<1000?Y:G,fontWeight:700}}>${kontoabstand.toFixed(0)} ({Math.round(kontoabstand/BUFFER*100)}%)</span>
              </div>
              <Bar2 pct={kontoabstand/BUFFER*100} color={kontoabstand<500?R:kontoabstand<1000?Y:G}/>
            </div>
            <div style={{marginTop:10,paddingTop:10,borderTop:"1px solid #2d3548",display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <Field label="SALDO ($)">
                <input type="number" step="0.01" defaultValue={saldo} onBlur={e=>{const v=parseFloat(e.target.value);if(!isNaN(v)){setSaldo(v);localStorage.setItem("ttp_saldo",v);}}} style={{background:"transparent",border:"none",padding:"2px 0",fontSize:14,fontWeight:700,color:"#e2e8f0",width:"100%",outline:"none"}}/>
              </Field>
              <Field label="MAX DD ($)">
                <input type="number" step="0.01" defaultValue={maxDDLevel} onBlur={e=>{const v=parseFloat(e.target.value);if(!isNaN(v)){setMaxDDLevel(v);localStorage.setItem("ttp_maxdd_level",v);}}} style={{background:"transparent",border:"none",padding:"2px 0",fontSize:14,fontWeight:700,color:"#e2e8f0",width:"100%",outline:"none"}}/>
              </Field>
            </div>
          </Card>

          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
            {[{l:"TRADES",v:tradeCount+"/"+DAILY_LIMIT,c:tradesLeft>0?G:R},{l:"P&L HEUTE",v:fs(todPnl),c:pc(todPnl)},{l:"DD ABSTAND",v:"$"+kontoabstand.toFixed(0),c:kontoabstand<1000?Y:G}].map(s=>(
              <div key={s.l} style={{background:"#1a1f2e",border:"1px solid #2d3548",borderRadius:10,padding:10,textAlign:"center"}}>
                <div style={{color:"#6b7280",fontSize:9,marginBottom:3}}>{s.l}</div>
                <div style={{color:s.c,fontWeight:800,fontSize:14}}>{s.v}</div>
              </div>
            ))}
          </div>

          <Card>
            <div style={{fontWeight:700,marginBottom:10,fontSize:15}}>{now.toLocaleString("de-DE",{month:"long",year:"numeric"})}</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:5}}>
              {["Mo","Di","Mi","Do","Fr","Sa","So"].map(d=><div key={d} style={{textAlign:"center",color:"#6b7280",fontSize:10,fontWeight:600}}>{d}</div>)}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>{renderCal()}</div>
          </Card>

          <Card style={{borderColor:P+"33"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={{fontWeight:700,fontSize:15}}>Monatsziel</div>
              <button onClick={(e)=>{e.stopPropagation();const v=prompt("Ziel-Saldo ($):",goals.targetBalance);if(v&&!isNaN(v)){const newG={...goals,targetBalance:parseFloat(v)};setGoals(newG);localStorage.setItem('ttp_goals',JSON.stringify(newG));}}} style={{background:P+"33",color:P,fontSize:11,padding:"4px 10px",borderRadius:8,fontWeight:600}}>✏️ Ziel</button>
            </div>
            {(()=>{
              const missing=Math.max(0,goals.targetBalance-saldo);
              const gained=Math.max(0,saldo-(goals.targetBalance-2000));
              const pct=Math.min(100,Math.max(0,(saldo-Math.min(saldo,goals.targetBalance-2000))/(goals.targetBalance-Math.min(saldo,goals.targetBalance-2000))*100));
              return(
                <div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
                    <div style={{background:"#0f1117",borderRadius:8,padding:"8px 10px",textAlign:"center"}}>
                      <div style={{color:"#6b7280",fontSize:9,marginBottom:2}}>AKTUELL</div>
                      <div style={{color:"#e2e8f0",fontWeight:800,fontSize:14}}>${saldo.toLocaleString("de-DE",{minimumFractionDigits:0,maximumFractionDigits:0})}</div>
                    </div>
                    <div style={{background:"#0f1117",borderRadius:8,padding:"8px 10px",textAlign:"center"}}>
                      <div style={{color:"#6b7280",fontSize:9,marginBottom:2}}>ZIEL</div>
                      <div style={{color:P,fontWeight:800,fontSize:14}}>${goals.targetBalance.toLocaleString("de-DE")}</div>
                    </div>
                    <div style={{background:"#0f1117",borderRadius:8,padding:"8px 10px",textAlign:"center"}}>
                      <div style={{color:"#6b7280",fontSize:9,marginBottom:2}}>FEHLT</div>
                      <div style={{color:missing<=0?G:R,fontWeight:800,fontSize:14}}>{missing<=0?"✅ Erreicht!":"$"+Math.round(missing).toLocaleString("de-DE")}</div>
                    </div>
                  </div>
                  <div style={{marginBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <span style={{color:"#6b7280",fontSize:10}}>Fortschritt zum Ziel</span>
                      <span style={{color:missing<=0?G:B,fontWeight:700,fontSize:10}}>{Math.round(Math.min(100,(saldo/goals.targetBalance)*100))}%</span>
                    </div>
                    <div style={{height:10,borderRadius:5,background:"#2d3548",overflow:"hidden"}}>
                      <div style={{height:"100%",borderRadius:5,width:Math.min(100,(saldo/goals.targetBalance)*100)+"%",background:"linear-gradient(90deg,"+B+","+P+")",transition:"width .4s"}}/>
                    </div>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{color:"#6b7280",fontSize:10}}>Regelquote</span>
                    <span style={{color:sc(disc),fontSize:10,fontWeight:700}}>{disc}% / {goals.disc}%</span>
                  </div>
                  <Bar2 pct={Math.min(100,disc/goals.disc*100)} color={sc(disc)}/>
                </div>
              );
            })()}
          </Card>

          {profitPlan&&<Card style={{borderColor:G+"33",background:"#0a160f",cursor:"pointer"}} onClick={()=>setProfExpanded(p=>!p)}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <div style={{fontWeight:700,fontSize:15,color:G}}>Weg zur Profitabilität</div>
              <div style={{color:G,fontSize:12,opacity:0.8,fontWeight:600}}>{profExpanded?"▲ schließen":"▼ öffnen"}</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:profExpanded?10:0}}>
              {[{l:"TREFFERQUOTE",v:profitPlan.wr+"%",c:profitPlan.wr>=50?G:R},{l:"DEIN R:R",v:profitPlan.rr+":1",c:parseFloat(profitPlan.rr)>=1?G:R},{l:"BREAK-EVEN",v:profitPlan.neededWR+"%",c:Y}].map(s=>(
                <div key={s.l} style={{background:"#0f1117",borderRadius:8,padding:10,textAlign:"center"}}>
                  <div style={{color:"#6b7280",fontSize:9,marginBottom:3}}>{s.l}</div>
                  <div style={{color:s.c,fontWeight:800,fontSize:18}}>{s.v}</div>
                </div>
              ))}
            </div>
            {profExpanded&&<>
              {profitPlan.overtradeDays>0&&<div style={{background:R+"22",border:"1px solid "+R+"44",borderRadius:8,padding:"8px 12px",display:"flex",gap:8,marginBottom:10}}>
                <span>⚠️</span><div style={{color:R,fontSize:12,fontWeight:600}}>{profitPlan.overtradeDays} von {profitPlan.totalDays} Tagen: Overtrading. Dein #1 Problem.</div>
              </div>}
              <div style={{background:"#0f1117",borderRadius:10,padding:12}}>
                <div style={{color:G,fontWeight:700,marginBottom:8}}>1 MNQ – Live Kalkulation:</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {[
                    {l:"RISIKO/TRADE",v:"$"+Math.round(kontoabstand*0.02),c:R},
                    {l:"ZIEL/TRADE (2:1)",v:"$"+Math.round(kontoabstand*0.04),c:G},
                    {l:"EV PRO TAG",v:(profitPlan.dailyEV>=0?"+":"")+"$"+profitPlan.dailyEV,c:profitPlan.dailyEV>=0?G:R},
                    {l:"PROGNOSE/MONAT",v:(profitPlan.monthlyEV>=0?"+":"")+"$"+profitPlan.monthlyEV,c:profitPlan.monthlyEV>=0?G:R},
                    {l:"ZUM ZIEL FEHLT",v:"$"+Math.max(0,goals.targetBalance-saldo).toFixed(0),c:Math.max(0,goals.targetBalance-saldo)===0?G:Y},
                    {l:"MONATE BIS ZIEL",v:profitPlan.monthlyEV>0?Math.ceil(Math.max(0,goals.targetBalance-saldo)/profitPlan.monthlyEV)+"Mo":"∞",c:profitPlan.monthlyEV>0?G:R}
                  ].map(s=>(
                    <div key={s.l} style={{background:"#1a1f2e",borderRadius:8,padding:8}}>
                      <div style={{color:"#6b7280",fontSize:9,marginBottom:2}}>{s.l}</div>
                      <div style={{color:s.c,fontWeight:800,fontSize:16}}>{s.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>}
          </Card>}
        </div>}

        {/* REGELN TAB */}
        {tab==="check"&&<div style={{display:"flex",flexDirection:"column",gap:12}}>
          {inPause&&<div style={{background:"#1a0a00",border:"2px solid "+Y,borderRadius:12,padding:"12px 16px",display:"flex",gap:12,alignItems:"center"}}>
            <span style={{fontSize:24}}>⏸</span>
            <div><div style={{color:Y,fontWeight:800,fontSize:14}}>Pflichtpause</div><div style={{color:Y,fontWeight:800,fontSize:38,letterSpacing:2,lineHeight:1}}>{pStr}</div></div>
          </div>}
          {todayBlocked&&<div style={{background:R+"22",border:"1px solid "+R,borderRadius:10,padding:"10px 14px",display:"flex",gap:10}}><span>🚫</span><div style={{color:R,fontWeight:800}}>Heute gesperrt – Pause-Tag</div></div>}
          {atLimit&&!overtradingToday&&!todayBlocked&&<div style={{background:O+"22",border:"1px solid "+O,borderRadius:10,padding:"10px 14px",display:"flex",gap:10}}><span>🛑</span><div style={{color:O,fontWeight:800}}>2 Trades – Tageslimit!</div></div>}
          <Card style={{borderColor:now.getHours()>=16?G+"44":Y+"44"}}>
            <div style={{fontWeight:700,fontSize:16,marginBottom:4}}>Zeitfenster</div>
            <div style={{color:now.getHours()>=16?G:Y,fontSize:24,fontWeight:800}}>{now.toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"})} Uhr</div>
            <div style={{color:"#6b7280",fontSize:12,marginTop:4}}>{now.getHours()>=16?"Optimales Fenster (16:15+)":"Warte auf 16:15 Uhr"}</div>
          </Card>
          {!inPause&&!todayBlocked&&!overtradingToday&&!atLimit&&<Card>
            <div style={{fontWeight:700,fontSize:15,marginBottom:4}}>✅ Pre-Trade Checkliste</div>
            <div style={{color:"#6b7280",fontSize:11,marginBottom:12}}>Alle 4 Punkte abhaken vor dem Trade</div>
            {[{id:"c1",q:"Geplantes Setup – kein Impuls?"},{id:"c2",q:"SL und TP definiert?"},{id:"c3",q:"Emotional ruhig und klar?"},{id:"c4",q:"Nach 16:15 Uhr?"}].map(it=>(
              <Chk key={it.id} checked={checks[it.id]} onClick={()=>{const n={...checks,[it.id]:!checks[it.id]};setChecks(n);localStorage.setItem("ttp_checks",JSON.stringify({date:todayISO(),data:n}));}} label={it.q}/>
            ))}
            <div style={{marginTop:12,background:allChecked?G+"22":R+"11",border:"1px solid "+(allChecked?G:R)+"44",borderRadius:10,padding:12,textAlign:"center"}}>
              {allChecked?<div style={{color:G,fontWeight:800,fontSize:17}}>GRUENES LICHT ✅</div>:<div style={{color:R,fontWeight:700,fontSize:15}}>Noch nicht bereit</div>}
            </div>
          </Card>}
          <Card style={{background:"#12101a",borderColor:P+"33"}}>
            <div style={{color:P,fontWeight:700,marginBottom:8}}>Meine Regeln</div>
            {["1 MNQ – kein NQ bis profitabel","Max 2 Trades/Tag","15 Min Pause nach jedem Trade","Nur 16:15–17:30 Uhr","SL + TP vor dem Entry","Ein 3. Trade sperrt morgen"].map((r,i)=>(
              <div key={i} style={{display:"flex",gap:8,padding:"6px 0",borderBottom:"1px solid #2d3548",fontSize:13,color:"#c4b5fd"}}>
                <span style={{color:P,fontWeight:700,flexShrink:0}}>{i+1}.</span>{r}
              </div>
            ))}
          </Card>
        </div>}

        {/* LOGGEN TAB */}
        {tab==="log"&&<div>
          {!allChecked&&!inPause&&!todayBlocked&&!atLimit&&<div style={{background:"linear-gradient(135deg,rgba(239,68,68,0.12),rgba(245,158,11,0.08))",border:"2px solid rgba(239,68,68,0.5)",borderRadius:14,padding:"18px",marginBottom:14,textAlign:"center"}}>
            <div style={{fontSize:40,marginBottom:8}}>🔒</div>
            <div style={{color:R,fontWeight:800,fontSize:16,marginBottom:6}}>Routine zuerst!</div>
            <div style={{color:"#fca5a5",fontSize:12,marginBottom:14,lineHeight:1.5}}>Gehe zuerst deine Pre-Trade Regeln durch.</div>
            <button onClick={()=>setTab("check")} style={{background:"linear-gradient(135deg,"+B+","+P+")",color:"#fff",padding:"12px 24px",fontWeight:700,fontSize:13,borderRadius:10}}>✅ Zu den Regeln</button>
          </div>}
          {inPause&&<div style={{background:"#1a0a00",border:"2px solid "+Y,borderRadius:12,padding:14,marginBottom:12,textAlign:"center"}}>
            <div style={{color:Y,fontWeight:800,fontSize:15,marginBottom:2}}>⏸ Pflichtpause</div>
            <div style={{color:Y,fontWeight:800,fontSize:42,letterSpacing:2}}>{pStr}</div>
          </div>}
          {!inPause&&todayBlocked&&<div style={{background:R+"22",border:"1px solid "+R,borderRadius:12,padding:14,marginBottom:12,textAlign:"center"}}><div style={{color:R,fontWeight:800}}>🚫 Heute gesperrt</div></div>}
          {!inPause&&atLimit&&!todayBlocked&&<div style={{background:O+"22",border:"1px solid "+O,borderRadius:12,padding:14,marginBottom:12,textAlign:"center"}}><div style={{color:O,fontWeight:800}}>🛑 Tageslimit erreicht</div></div>}
          {allChecked&&!inPause&&!todayBlocked&&!atLimit&&<div style={{background:"linear-gradient(135deg,rgba(0,211,149,0.12),rgba(99,102,241,0.08))",border:"1px solid rgba(0,211,149,0.5)",borderRadius:14,padding:"12px 16px",marginBottom:14,display:"flex",gap:12,alignItems:"center"}}>
            <span style={{fontSize:22}}>✅</span>
            <div><div style={{color:G,fontWeight:800,fontSize:13}}>READY – Routine erfüllt</div><div style={{color:"#86efac",fontSize:11,marginTop:2}}>Alle 4 Regeln abgehakt.</div></div>
          </div>}
          <Card>
            <div style={{fontWeight:700,fontSize:16,marginBottom:14}}>Trade loggen</div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <Field label="DATUM">
                  <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} style={{background:"transparent",border:"none",padding:"2px 0",fontSize:13,color:"#e2e8f0",width:"100%",outline:"none"}}/>
                </Field>
                <Field label="UHRZEIT">
                  <input type="time" value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))} style={{background:"transparent",border:"none",padding:"2px 0",fontSize:13,color:"#e2e8f0",width:"100%",outline:"none"}}/>
                </Field>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <Field label="KONTRAKT">
                  <select value={form.contract} onChange={e=>setForm(f=>({...f,contract:e.target.value}))}>
                    <option value="MNQ">MNQ ✓</option><option value="NQ">NQ</option><option value="ES">ES</option>
                  </select>
                </Field>
                <Field label="RICHTUNG">
                  <select value={form.dir} onChange={e=>setForm(f=>({...f,dir:e.target.value}))}>
                    <option value="LONG">LONG ↑</option><option value="SHORT">SHORT ↓</option>
                  </select>
                </Field>
              </div>
              <Field label="SETUP">
                <select value={form.setup} onChange={e=>setForm(f=>({...f,setup:e.target.value}))}>
                  {SETUPS.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="NETTO P&L ($) *">
                <input type="number" step="0.01" value={form.pnl} onChange={e=>setForm(f=>({...f,pnl:e.target.value}))} placeholder="z.B. 40 oder -20" style={{borderColor:form.pnl?(parseFloat(form.pnl)>=0?G+"88":R+"88"):"#2d3548"}}/>
              </Field>
              <div style={{background:"#0a160f",borderRadius:10,padding:"10px 12px",border:"1px solid "+G+"33"}}>
                <div style={{color:G,fontSize:11,fontWeight:600}}>1 MNQ: SL 40 Ticks ($20) | TP 80 Ticks ($40)</div>
              </div>
              <div style={{background:"#0f1117",borderRadius:10,padding:12,border:"1px solid #2d3548"}}>
                <div style={{color:"#6b7280",fontSize:11,marginBottom:6,fontWeight:600}}>REGELN EINGEHALTEN?</div>
                {RULES.map(r=>(<Chk key={r.id} checked={form.rules[r.id]} onClick={()=>setForm(f=>({...f,rules:{...f.rules,[r.id]:!f.rules[r.id]}}))} label={r.label}/>))}
              </div>
              <Field label="NOTIZEN">
                <textarea rows={2} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Emotion? Was lief gut/schlecht?" style={{resize:"vertical"}}/>
              </Field>
              <button onClick={addTrade} style={{background:canTrade?B:"#374151",color:"#fff",padding:13,fontSize:14,fontWeight:700,width:"100%",borderRadius:10,opacity:canTrade?1:0.6}} disabled={!canTrade}>
                {inPause?"⏸ Warten... "+pStr:todayBlocked?"Heute gesperrt":overtradingToday?"3 Trades – Gesperrt":atLimit?"Limit erreicht":!allChecked?"🔒 Erst Regeln abhaken":"Trade speichern – Timer startet!"}
              </button>
            </div>
          </Card>
        </div>}

        {/* ANALYSE TAB */}
        {tab==="analyse"&&<div style={{display:"flex",flexDirection:"column",gap:12}}>
          <Card style={{borderColor:B+"44"}}>
            <div style={{fontWeight:700,fontSize:15,marginBottom:12}}>Ziele setzen</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <Field label="SALDO-ZIEL ($)">
                <input type="number" defaultValue={goals.targetBalance} onBlur={e=>{const v=parseFloat(e.target.value);if(!isNaN(v)){const newG={...goals,targetBalance:v};setGoals(newG);localStorage.setItem('ttp_goals',JSON.stringify(newG));}}} style={{background:"transparent",border:"none",padding:"2px 0",fontSize:13,color:"#e2e8f0",width:"100%",outline:"none"}}/>
                <div style={{color:"#6b7280",fontSize:9,marginTop:3}}>Fehlt: ${Math.max(0,goals.targetBalance-saldo).toFixed(0)}</div>
              </Field>
              <Field label="REGELQUOTE-ZIEL (%)">
                <input type="number" defaultValue={goals.disc} onBlur={e=>{const v=parseInt(e.target.value);if(!isNaN(v)){const newG={...goals,disc:v};setGoals(newG);localStorage.setItem('ttp_goals',JSON.stringify(newG));}}} style={{background:"transparent",border:"none",padding:"2px 0",fontSize:13,color:"#e2e8f0",width:"100%",outline:"none"}}/>
                <div style={{color:"#6b7280",fontSize:9,marginTop:3}}>Aktuell: {disc}%</div>
              </Field>
            </div>
          </Card>
          <Card>
            <div style={{fontWeight:700,marginBottom:4}}>Beste Handelstage</div>
            <div style={{color:"#6b7280",fontSize:11,marginBottom:10}}>% profitable Tage pro Wochentag</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:5}}>
              {weekdayStats.map(d=>{
                const c=d.pct>=60?G:d.pct>=40?Y:R;
                return(
                  <div key={d.label} style={{background:"#0f1117",borderRadius:8,padding:"8px 4px",textAlign:"center",border:"1px solid "+(d.days>0?c+"44":"#2d3548")}}>
                    <div style={{fontWeight:700,fontSize:13,marginBottom:3,color:d.days>0?c:"#4b5563"}}>{d.label}</div>
                    {d.days>0?(<>
                      <div style={{color:c,fontWeight:800,fontSize:17}}>{d.pct}%</div>
                      <div style={{color:"#6b7280",fontSize:8}}>Gewinn</div>
                      <div style={{color:pc(d.pnl),fontSize:10,fontWeight:700,marginTop:4}}>{d.pnl>=0?"+":"-"}${Math.abs(d.pnl).toFixed(0)}</div>
                      <div style={{color:"#6b7280",fontSize:8}}>{d.days}T</div>
                    </>):<div style={{color:"#4b5563",fontSize:10,marginTop:6}}>–</div>}
                  </div>
                );
              })}
            </div>
          </Card>
          <Card>
            <div style={{fontWeight:700,marginBottom:10}}>Haltedauer Analyse</div>
            {durBuckets.map(b=>(
              <div key={b.label} style={{marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                  <div><span style={{fontWeight:700,fontSize:13}}>{b.label}</span><span style={{color:"#6b7280",fontSize:11,marginLeft:8}}>{b.n} Trades</span></div>
                  <div style={{display:"flex",gap:10}}><span style={{color:sc(b.wr),fontWeight:700,fontSize:12}}>{b.wr}% WR</span><span style={{color:pc(b.pnl),fontWeight:700,fontSize:12}}>{fs(b.pnl)}</span></div>
                </div>
                <Bar2 pct={b.wr} color={sc(b.wr)}/>
              </div>
            ))}
          </Card>
          <Card>
            <div style={{fontWeight:700,marginBottom:10}}>Equity Kurve</div>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={equity}>
                <XAxis dataKey="i" tick={{fill:"#6b7280",fontSize:9}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:"#6b7280",fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>"$"+v} width={55}/>
                <Tooltip formatter={v=>[fd(v),"Kumuliert"]} contentStyle={{background:"#1a1f2e",border:"1px solid #2d3548",borderRadius:8,fontSize:12}}/>
                <ReferenceLine y={0} stroke="#2d3548" strokeDasharray="4 4"/>
                <Line type="monotone" dataKey="v" stroke={B} strokeWidth={2} dot={false}/>
              </LineChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <div style={{fontWeight:700,marginBottom:10}}>Tages-Reflexion – {todayISO()}</div>
            {[{id:"good",label:"Was lief gut?",p:"Setup, Disziplin..."},{id:"bad",label:"Was anders machen?",p:"Impuls, zu frueh..."},{id:"emotion",label:"Emotionaler Zustand?",p:"Ruhig, gierig..."}].map(q=>(
              <div key={q.id} style={{marginBottom:10}}>
                <label style={{color:"#6b7280",fontSize:11,display:"block",marginBottom:4}}>{q.label}</label>
                <textarea rows={2} value={todayJ[q.id]||""} onChange={e=>setTodayJ(p=>({...p,[q.id]:e.target.value}))} placeholder={q.p} style={{resize:"vertical"}}/>
              </div>
            ))}
            <button onClick={()=>{const u={...journal,[todayISO()]:{...todayJ}};setJournal(u);localStorage.setItem("ttp_journal",JSON.stringify(u));showToast("Reflexion gespeichert!");}} style={{background:P,color:"#fff",padding:11,width:"100%",fontWeight:700,borderRadius:10}}>Speichern</button>
          </Card>
        </div>}

        {/* HISTORY TAB */}
        {tab==="hist"&&<div style={{display:"flex",flexDirection:"column",gap:10}}>
          <Card>
            <div style={{fontWeight:700,fontSize:13,marginBottom:8}}>🔍 Filter</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
              <Field label="VON"><input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} style={{background:"transparent",border:"none",padding:"2px 0",fontSize:13,color:"#e2e8f0",width:"100%",outline:"none"}}/></Field>
              <Field label="BIS"><input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} style={{background:"transparent",border:"none",padding:"2px 0",fontSize:13,color:"#e2e8f0",width:"100%",outline:"none"}}/></Field>
            </div>
            {(dateFrom||dateTo)&&<button onClick={()=>{setDateFrom("");setDateTo("");}} style={{background:"none",color:"#6b7280",fontSize:11,padding:"4px 0",width:"100%"}}>Filter zurücksetzen ×</button>}
          </Card>
          {(dateFrom||dateTo)&&(()=>{
            const filtered=t09.filter(t=>(!dateFrom||t.date>=dateFrom)&&(!dateTo||t.date<=dateTo));
            const sum=filtered.reduce((s,t)=>s+t.pnl,0);
            const wr=filtered.length?Math.round(filtered.filter(t=>t.pnl>0).length/filtered.length*100):0;
            return(<>
              <Card style={{borderColor:B+"44"}}>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <div><div style={{color:"#6b7280",fontSize:10}}>{filtered.length} Trades</div><div style={{color:pc(sum),fontWeight:800,fontSize:24}}>{sum>=0?"+":"-"}${Math.abs(sum).toFixed(2)}</div></div>
                  <div style={{textAlign:"right"}}><div style={{color:"#6b7280",fontSize:10}}>WR</div><div style={{color:wr>=50?G:R,fontWeight:800,fontSize:20}}>{wr}%</div></div>
                </div>
              </Card>
              {[...filtered].reverse().map(t=>(
                <div key={t.id} style={{background:"#1a1f2e",borderRadius:10,padding:"10px 12px",borderLeft:"3px solid "+pc(t.pnl),display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div><div style={{display:"flex",gap:6,marginBottom:2}}><span style={{fontWeight:800,color:pc(t.pnl)}}>{fd(t.pnl)}</span><span style={{fontSize:10,color:"#6b7280"}}>{t.contract} · {t.dir}</span></div><div style={{color:"#6b7280",fontSize:10}}>{t.date} {t.time}</div></div>
                  <button onClick={()=>setDelId(t.id)} style={{background:"none",color:R,fontSize:16,padding:"2px 4px",opacity:0.5}}>×</button>
                </div>
              ))}
            </>);
          })()}
          {!dateFrom&&!dateTo&&<Card>
            <div style={{fontWeight:700,fontSize:15,marginBottom:10}}>📅 Jahresübersicht</div>
            {monthlyStats.map(ms=>{
              const isExp=expandedMonth===ms.mo;
              return(
                <div key={ms.mo} style={{marginBottom:8,background:"#0f1117",borderRadius:10,padding:"10px 12px",border:isExp?"1px solid "+B+"55":"1px solid transparent"}}>
                  <div onClick={()=>setExpandedMonth(isExp?null:ms.mo)} style={{cursor:"pointer"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                      <div style={{display:"flex",gap:6,alignItems:"center"}}>
                        <span style={{color:"#6b7280",fontSize:11,display:"inline-block",transform:isExp?"rotate(90deg)":"none"}}>▶</span>
                        <div style={{fontWeight:700,fontSize:13}}>{ms.mo}</div>
                      </div>
                      <div style={{color:pc(ms.pnl),fontWeight:800,fontSize:15}}>{ms.pnl>=0?"+":"-"}${Math.abs(ms.pnl).toFixed(0)}</div>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:4,fontSize:10}}>
                      <div style={{textAlign:"center"}}><div style={{color:"#6b7280"}}>Trades</div><div style={{fontWeight:700}}>{ms.trades}</div></div>
                      <div style={{textAlign:"center"}}><div style={{color:"#6b7280"}}>WR</div><div style={{color:ms.wr>=50?G:R,fontWeight:700}}>{ms.wr}%</div></div>
                      <div style={{textAlign:"center"}}><div style={{color:"#6b7280"}}>TP</div><div style={{color:G,fontWeight:700}}>{ms.wins}</div></div>
                      <div style={{textAlign:"center"}}><div style={{color:"#6b7280"}}>SL</div><div style={{color:R,fontWeight:700}}>{ms.losses}</div></div>
                    </div>
                  </div>
                  {isExp&&<div style={{marginTop:10,paddingTop:10,borderTop:"1px solid #2d3548",display:"flex",flexDirection:"column",gap:5}}>
                    {[...t09.filter(t=>t.date.startsWith(ms.mo))].reverse().map(t=>(
                      <div key={t.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 8px",background:"#1a1f2e",borderRadius:6,borderLeft:"2px solid "+pc(t.pnl)}}>
                        <div><div style={{fontSize:11,fontWeight:700,color:pc(t.pnl)}}>{fd(t.pnl)} <span style={{color:"#6b7280",fontWeight:400}}>· {t.contract} · {t.dir}</span></div><div style={{color:"#6b7280",fontSize:10}}>{t.date} {t.time}</div></div>
                        <button onClick={e=>{e.stopPropagation();setDelId(t.id);}} style={{background:"none",color:R,fontSize:14,padding:"2px 4px",opacity:0.4}}>×</button>
                      </div>
                    ))}
                  </div>}
                </div>
              );
            })}
          </Card>}
        </div>}

      </div>

      {/* BOTTOM NAV */}
      <div className="mr-nav" style={{position:"fixed",bottom:0,left:0,right:0,background:"rgba(26,31,46,0.95)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",borderTop:"1px solid #2d3548",display:"flex",zIndex:100,paddingBottom:"env(safe-area-inset-bottom,8px)"}}>
        {NAVS.map(nav=>(
          <button key={nav.k} onClick={()=>setTab(nav.k)} style={{background:"none",color:tab===nav.k?B:P+"aa",padding:"10px 2px 11px",fontSize:8,flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4,borderBottom:tab===nav.k?"2px solid "+B:"2px solid transparent",borderRadius:0,position:"relative",fontWeight:700,letterSpacing:"0.5px",transition:"color 0.2s"}}>
            <div style={{width:22,height:22,display:"flex",alignItems:"center",justifyContent:"center",opacity:tab===nav.k?1:0.55,transform:tab===nav.k?"scale(1.1)":"scale(1)",transition:"all 0.2s"}}>
              {nav.k==="log"&&!allChecked&&!todayBlocked&&!atLimit&&!inPause
                ?<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#ef4444" strokeWidth="1.8"/><line x1="12" y1="8" x2="12" y2="16" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/><line x1="8" y1="12" x2="16" y2="12" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/></svg>
                :nav.svg}
            </div>
            <span style={{whiteSpace:"nowrap",color:tab===nav.k?B:P+"aa"}}>{nav.lb.toUpperCase()}</span>
            {nav.k==="log"&&inPause&&<div style={{position:"absolute",top:8,right:"14%",width:6,height:6,borderRadius:"50%",background:Y,boxShadow:"0 0 6px "+Y}}/>}
            {nav.k==="check"&&allChecked&&!todayBlocked&&<div style={{position:"absolute",top:8,right:"14%",width:6,height:6,borderRadius:"50%",background:G,boxShadow:"0 0 8px rgba(0,211,149,0.8)"}}/>}
          </button>
        ))}
      </div>

      {/* SETTINGS DRAWER */}
      {settingsOpen&&<div onClick={()=>setSettingsOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:300,backdropFilter:"blur(4px)"}}>
        <div onClick={e=>e.stopPropagation()} style={{position:"absolute",top:0,right:0,bottom:0,width:"min(300px,82vw)",background:"linear-gradient(180deg,#1a1f2e,#0f1117)",borderLeft:"1px solid #2d3548",overflowY:"auto",padding:"20px 18px",paddingBottom:"calc(20px + env(safe-area-inset-bottom,0px))"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
            <div style={{fontWeight:800,fontSize:20}}>⚙️ Einstellungen</div>
            <button onClick={()=>setSettingsOpen(false)} style={{background:"#2d3548",borderRadius:8,width:32,height:32,padding:0,color:"#e2e8f0",fontSize:18}}>×</button>
          </div>
          <div style={{marginBottom:18}}>
            <div style={{color:B,fontWeight:700,fontSize:13,marginBottom:10}}>🛡 Trading-Regeln</div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <Field label="MAX TRADES / TAG"><input type="number" value={settings.maxTrades} onChange={e=>saveSettings({...settings,maxTrades:parseInt(e.target.value)||2})} style={{background:"transparent",border:"none",padding:"2px 0",fontSize:14,fontWeight:700,color:"#e2e8f0",width:"100%",outline:"none"}}/></Field>
              <Field label="PFLICHTPAUSE (MIN)"><input type="number" value={settings.pauseMins} onChange={e=>saveSettings({...settings,pauseMins:parseInt(e.target.value)||15})} style={{background:"transparent",border:"none",padding:"2px 0",fontSize:14,fontWeight:700,color:"#e2e8f0",width:"100%",outline:"none"}}/></Field>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                <Field label="FENSTER VON"><input type="time" value={settings.windowStart} onChange={e=>saveSettings({...settings,windowStart:e.target.value})} style={{background:"transparent",border:"none",padding:"2px 0",fontSize:13,color:"#e2e8f0",width:"100%",outline:"none"}}/></Field>
                <Field label="FENSTER BIS"><input type="time" value={settings.windowEnd} onChange={e=>saveSettings({...settings,windowEnd:e.target.value})} style={{background:"transparent",border:"none",padding:"2px 0",fontSize:13,color:"#e2e8f0",width:"100%",outline:"none"}}/></Field>
              </div>
            </div>
          </div>
          <div style={{marginBottom:18}}>
            <div style={{color:B,fontWeight:700,fontSize:13,marginBottom:10}}>🧠 Coach Profil</div>
            <div style={{background:"#0f1117",borderRadius:10,padding:12,marginBottom:8}}>
              <div style={{color:"#6b7280",fontSize:10,marginBottom:6}}>Schreib einmal wer du bist – KI liest das IMMER:</div>
              <textarea rows={6} value={coachProfile} onChange={e=>{setCoachProfile(e.target.value);localStorage.setItem('ttp_coach_profile',e.target.value);}}
                placeholder="Ich bin Jeronimo. Ich trade MNQ/NQ bei TTP. Mein Problem ist Overtrading nach Verlusten. Stärke: Do/Mo 16:15-17:30..."
                style={{resize:"vertical",fontSize:11,lineHeight:1.5,width:"100%"}}/>
              <div style={{color:G,fontSize:9,marginTop:4}}>💡 Schreib auch Psychologie, Schwächen, Ziele</div>
            </div>
            {coachMemory.length>0&&<div style={{background:"#0f1117",borderRadius:10,padding:12,marginBottom:8}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <div style={{color:"#6b7280",fontSize:10,fontWeight:700}}>📝 GEDÄCHTNIS ({coachMemory.length})</div>
                <button onClick={()=>{if(confirm("Gedächtnis löschen?")){setCoachMemory([]);localStorage.removeItem('ttp_coach_memory');}}} style={{background:"none",color:R,fontSize:10,padding:0}}>löschen</button>
              </div>
              {coachMemory.slice(0,5).map((m,i)=>(
                <div key={i} style={{fontSize:10,color:"#94a3b8",padding:"3px 0",borderBottom:"1px solid #2d3548"}}>
                  <span style={{color:"#4b5563",fontSize:9}}>{m.date}: </span>{m.note.slice(0,80)}
                </div>
              ))}
            </div>}
          </div>
          <div style={{marginBottom:18}}>
            <div style={{color:B,fontWeight:700,fontSize:13,marginBottom:10}}>💾 Daten</div>
            <button onClick={()=>{if(window.confirm("Alle Daten loeschen?")){{localStorage.clear();window.location.reload();}}}} style={{background:"rgba(239,68,68,0.1)",color:R,border:"1px solid rgba(239,68,68,0.3)",padding:"10px 14px",width:"100%",fontWeight:600,fontSize:12,borderRadius:10}}>🗑 Alle Daten löschen</button>
          </div>
          <div style={{borderTop:"1px solid #2d3548",paddingTop:12,color:"#6b7280",fontSize:10,textAlign:"center"}}>MindRisk v2.0 · echte Claude KI ✅</div>
        </div>
      </div>}

      {/* AI COACH – FUTURISTISCH */}
      <div style={{position:"fixed",bottom:88,right:16,zIndex:200}}>
        {!aiOpen&&(
          <button onClick={()=>{setAiOpen(true);if(aiMessages.length===0){setAiMessages([{role:"assistant",content:smartCoach("","daily_motivation")}]);}}}
            style={{width:54,height:54,borderRadius:"50%",border:"none",padding:0,position:"relative",overflow:"visible",cursor:"pointer",background:"transparent",WebkitTapHighlightColor:"transparent"}}>
            {/* Pulsing rings – echter Herzschlag */}
            <div style={{position:"absolute",inset:0,borderRadius:"50%",background:"rgba(99,102,241,0.5)",animation:"orbRing1 1.4s ease-out infinite",pointerEvents:"none"}}/>
            <div style={{position:"absolute",inset:0,borderRadius:"50%",background:"rgba(168,85,247,0.4)",animation:"orbRing2 1.4s ease-out infinite 0.45s",pointerEvents:"none"}}/>
            <div style={{position:"absolute",inset:0,borderRadius:"50%",background:"rgba(99,102,241,0.25)",animation:"orbRing3 1.4s ease-out infinite 0.9s",pointerEvents:"none"}}/>
            {/* Main sphere – atmet */}
            <div style={{position:"absolute",inset:0,borderRadius:"50%",background:"radial-gradient(circle at 35% 28%,#e0d4ff 0%,#c4b5fd 15%,#a78bfa 35%,#7c3aed 60%,#4c1d95 85%,#1e1b4b 100%)",animation:"livingOrb 2.2s ease-in-out infinite",boxShadow:"0 0 25px rgba(99,102,241,0.7),0 0 50px rgba(168,85,247,0.4),inset 0 0 15px rgba(255,255,255,0.15)"}}/>
            {/* Rotierender Ring */}
            <div style={{position:"absolute",inset:3,borderRadius:"50%",border:"1.5px solid transparent",borderTopColor:"rgba(255,255,255,0.6)",borderRightColor:"rgba(196,181,253,0.4)",animation:"orbSpin 4s linear infinite",pointerEvents:"none"}}/>
            {/* Kern-Licht */}
            <div style={{position:"absolute",top:"20%",left:"22%",width:20,height:20,borderRadius:"50%",background:"radial-gradient(circle,rgba(255,255,255,0.95) 0%,rgba(221,214,254,0.6) 50%,transparent 75%)",filter:"blur(3px)",animation:"orbCore 2s ease-in-out infinite",pointerEvents:"none"}}/>
          </button>
        )}
        {aiOpen&&(
          <div style={{width:320,maxWidth:"calc(100vw - 32px)",background:"#1a1f2e",border:"1px solid #6366f1",borderRadius:16,boxShadow:"0 8px 32px rgba(99,102,241,0.3)",display:"flex",flexDirection:"column",maxHeight:440}}>
            <div style={{padding:"12px 16px",borderBottom:"1px solid #2d3548",display:"flex",justifyContent:"space-between",alignItems:"center",background:"linear-gradient(135deg,rgba(99,102,241,0.15),rgba(168,85,247,0.1))",borderRadius:"16px 16px 0 0"}}>
              <div style={{display:"flex",gap:10,alignItems:"center"}}>
                <div style={{width:32,height:32,borderRadius:"50%",background:"linear-gradient(135deg,#6366f1,#a855f7)",display:"flex",alignItems:"center",justifyContent:"center",animation:"orb 3s ease infinite",flexShrink:0}}>
                  <svg width="18" height="18" viewBox="0 0 28 28" fill="none">
                    <circle cx="10" cy="12" r="2.5" fill="white" opacity="0.9"/>
                    <circle cx="18" cy="12" r="2.5" fill="white" opacity="0.9"/>
                    <path d="M9 17.5 Q14 21 19 17.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.9"/>
                  </svg>
                </div>
                <div>
                  <div style={{fontWeight:700,fontSize:13,color:"#e2e8f0"}}>MindRisk Coach</div>
                  <div style={{color:B,fontSize:10,fontWeight:600}}>Claude AI ✦</div>
                </div>
              </div>
              <button onClick={()=>setAiOpen(false)} style={{background:"rgba(255,255,255,0.08)",color:"#6b7280",fontSize:16,padding:"4px 8px",borderRadius:6}}>×</button>
            </div>
            <div style={{flex:1,overflow:"auto",padding:12,display:"flex",flexDirection:"column",gap:8,minHeight:120}}>
              {aiMessages.length===0&&!aiLoading&&(
                <div style={{color:"#6b7280",fontSize:12,textAlign:"center",padding:16}}>Tippe eine Frage – echte Claude KI antwortet!</div>
              )}
              {aiMessages.map((m,i)=>(
                <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
                  <div style={{maxWidth:"85%",padding:"8px 12px",borderRadius:m.role==="user"?"12px 12px 2px 12px":"12px 12px 12px 2px",background:m.role==="user"?"linear-gradient(135deg,"+B+","+P+")":"#0f1117",border:"1px solid "+(m.role==="user"?"transparent":"#2d3548"),fontSize:12,color:"#e2e8f0",lineHeight:1.5,whiteSpace:"pre-wrap"}}>
                    {m.content}
                  </div>
                </div>
              ))}
              {aiLoading&&(
                <div style={{display:"flex",gap:4,padding:"4px 8px"}}>
                  <div style={{width:7,height:7,borderRadius:"50%",background:B,animation:"pulse 1s infinite"}}/>
                  <div style={{width:7,height:7,borderRadius:"50%",background:P,animation:"pulse 1s infinite 0.2s"}}/>
                  <div style={{width:7,height:7,borderRadius:"50%",background:B,animation:"pulse 1s infinite 0.4s"}}/>
                </div>
              )}
            </div>
            <div style={{padding:"6px 12px",borderTop:"1px solid #2d3548",display:"flex",gap:6,flexWrap:"wrap"}}>
              {["Soll ich traden?","Analysiere meine Schwächen","Beste Handelszeit?","Diese Woche?"].map(q=>(
                <button key={q} onClick={()=>{setAiInput(q);}} style={{background:"rgba(99,102,241,0.15)",color:B,fontSize:10,padding:"4px 10px",borderRadius:20,border:"1px solid "+B+"44",fontWeight:600}}>{q}</button>
              ))}
              {t09.length>0&&<button onClick={()=>{const last=t09[t09.length-1];setAiInput("Analysiere: "+last.contract+" "+last.dir+" "+(last.pnl>=0?"+":"")+"$"+last.pnl.toFixed(2)+" um "+last.time+" am "+last.date);}} style={{background:"rgba(0,211,149,0.15)",color:G,fontSize:10,padding:"4px 10px",borderRadius:20,border:"1px solid "+G+"44",fontWeight:600}}>📊 Letzter Trade</button>}
            </div>
            <>
            {aiImagePreview&&<div style={{padding:"6px 12px",borderTop:"1px solid #2d3548",display:"flex",alignItems:"center",gap:8}}>
              <img src={aiImagePreview} alt="chart" style={{width:52,height:52,borderRadius:8,objectFit:"cover",border:"1px solid "+B+"44"}}/>
              <div style={{fontSize:11,color:"#94a3b8",flex:1}}>📊 Chart wird mitgeschickt...</div>
              <button onClick={()=>{setAiImage(null);setAiImagePreview(null);}} style={{background:"none",color:"#ef4444",fontSize:18,padding:"2px 6px"}}>×</button>
            </div>}
            <div style={{padding:"8px 12px",borderTop:"1px solid #2d3548",display:"flex",gap:6,alignItems:"center"}}>
              <input type="file" id="chartUpload" accept="image/*" onChange={handleImageSelect} style={{display:"none"}}/>
              <button onClick={()=>document.getElementById("chartUpload").click()}
                style={{background:"#1a1f2e",border:"1px solid #2d3548",color:"#94a3b8",padding:"7px 9px",borderRadius:10,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}
                title="Chart Screenshot hochladen">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </button>
              <button onClick={startVoice}
                style={{background:isRecording?"rgba(239,68,68,0.3)":"#1a1f2e",border:"1px solid "+(isRecording?"#ef4444":"#2d3548"),color:isRecording?"#ef4444":"#94a3b8",padding:"7px 9px",borderRadius:10,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}
                title="Spracheingabe">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              </button>
              <input value={aiInput} onChange={e=>setAiInput(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&sendAiMessage()}
                placeholder={isRecording?"🎤 Höre zu...":"Frag deinen Coach..."}
                style={{flex:1,fontSize:12,padding:"8px 10px",borderRadius:20,background:"#0f1117",border:"1px solid #2d3548"}}/>
              <button onClick={sendAiMessage} disabled={aiLoading||(!aiInput.trim()&&!aiImage)}
                style={{background:"linear-gradient(135deg,"+B+","+P+")",color:"#fff",padding:"8px 12px",borderRadius:20,fontSize:14,fontWeight:700,opacity:aiLoading||(!aiInput.trim()&&!aiImage)?0.4:1,flexShrink:0}}>→</button>
            </div>
            </>
          </div>
        )}
      </div>
    </div>
  );
}
