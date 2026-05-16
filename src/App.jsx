import { useState, useMemo, useEffect } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from "recharts";

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
  ["MNQ","2026-05-15","15:06",-98.7,99,"SHORT"],
  ["MNQ","2026-05-15","15:08",-88.7,301,"SHORT"],
  ["NQ","2026-05-15","15:13",-13.8,78,"LONG"],
  ["NQ","2026-05-15","15:14",386.2,104,"LONG"],
  ["MNQ","2026-05-15","15:16",-81.2,10,"SHORT"],
  ["MNQ","2026-05-15","15:17",-81.2,8,"SHORT"],
  ["NQ","2026-05-15","15:17",-188.8,31,"LONG"],
  ["NQ","2026-05-15","15:18",-133.8,31,"LONG"],
  ["NQ","2026-05-15","15:19",841.2,78,"SHORT"],
];

const SEED=mkT(RAW,"a");
const emptyRules=()=>({r1:false,r2:false,r3:false,r4:false,r5:false,r6:false});
const emptyForm=()=>({date:todayISO(),time:nowHHMM(),contract:"MNQ",dir:"LONG",pnl:"",setup:SETUPS[0],notes:"",rules:emptyRules()});

const Pill=({bg,color,children})=>(
  <span style={{display:"inline-block",padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600,background:bg,color}}>{children}</span>
);
const Card=({children,style})=>(
  <div style={{background:"#1a1f2e",border:"1px solid #2d3548",borderRadius:12,padding:16,overflow:"hidden",...style}}>{children}</div>
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

export default function App(){
  const[trades,setTrades]=useState(()=>{
    try{
      const v=localStorage.getItem('ttp_data_version');
      if(v!=='2026-05-15-v3'){
        localStorage.setItem('ttp_data_version','2026-05-15-v3');
        localStorage.setItem('ttp_trades',JSON.stringify(SEED));
        // Also update saldo to reflect new trade data
        const seedSum=SEED.filter(t=>t.acct==='09').reduce((s,t)=>s+t.pnl,0);
        const newSaldo=Math.round((50000+seedSum)*100)/100;
        localStorage.setItem('ttp_saldo',newSaldo);
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
  const[aiLoading,setAiLoading]=useState(false);
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
    try{
      const s=localStorage.getItem('ttp_goals');
      return s?JSON.parse(s):{pnl:1500,disc:80};
    }catch(e){return{pnl:1500,disc:80};}
  });
  // Settings menu state
  const[settingsOpen,setSettingsOpen]=useState(false);
  const[settings,setSettings]=useState(()=>{
    try{
      const s=localStorage.getItem('ttp_settings');
      return s?JSON.parse(s):{
        maxTrades:2,
        pauseMins:15,
        windowStart:"16:15",
        windowEnd:"17:30",
        monthlyGoal:1500,
        riskPerTradePct:2,
        customRules:[]
      };
    }catch(e){return{maxTrades:2,pauseMins:15,windowStart:"16:15",windowEnd:"17:30",monthlyGoal:1500,riskPerTradePct:2,customRules:[]};}
  });
  const saveSettings=(s)=>{setSettings(s);localStorage.setItem('ttp_settings',JSON.stringify(s));};
  const[journal,setJournal]=useState(()=>{try{return JSON.parse(localStorage.getItem('ttp_journal')||'{}');}catch(e){return{};}});
  const[todayJ,setTodayJ]=useState(()=>{
    try{
      const j=JSON.parse(localStorage.getItem('ttp_journal')||'{}');
      return j[todayISO()]||{good:"",bad:"",emotion:""};
    }catch(e){return{good:"",bad:"",emotion:""};}
  });
  const[ttpDD,setTtpDD]=useState(()=>parseFloat(localStorage.getItem('ttp_dd')||'781.88'));
  const[saldo,setSaldo]=useState(()=>parseFloat(localStorage.getItem('ttp_saldo')||'50433.22'));
  const[lastTradeAt,setLastTradeAt]=useState(null);
  const[tick,setTick]=useState(0);

  useEffect(()=>{
    const id=setInterval(()=>setTick(t=>t+1),1000);
    return()=>clearInterval(id);
  },[]);

  // Splash screen on app open
  useEffect(()=>{
    const t=setTimeout(()=>setShowSplash(false),1800);
    // After splash, show daily motivation if first time today
    const t2=setTimeout(()=>{
      const lastShown=localStorage.getItem('ttp_daily_quote');
      if(lastShown!==todayISO()){
        localStorage.setItem('ttp_daily_quote',todayISO());
        triggerAiPopup("daily_motivation");
      }
    },2200);
    return()=>{clearTimeout(t);clearTimeout(t2);};
  },[]);

  // Auto-popup triggers
  useEffect(()=>{
    const h=new Date().getHours(),m=new Date().getMinutes();
    const todayT=t09.filter(t=>t.date===todayISO());
    const key16=todayISO()+"_16";
    const keyOT=todayISO()+"_ot";
    
    // 16:15 Trading window popup
    if(h===16&&m>=15&&m<=20&&!aiAutoShown[key16]&&!todayBlocked){
      setAiAutoShown(p=>({...p,[key16]:true}));
      triggerAiPopup("trading_window");
    }
    // Overtrading warning
    if(todayT.length>=OVERTRADING_AT&&!aiAutoShown[keyOT]){
      setAiAutoShown(p=>({...p,[keyOT]:true}));
      triggerAiPopup("overtrading");
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

  const t09=useMemo(()=>
    trades.filter(t=>t&&t.acct==="09"&&typeof t.date==="string")
          .sort((a,b)=>(a.date+a.time)<(b.date+b.time)?-1:1),[trades]);

  const totalPnl=useMemo(()=>t09.reduce((s,t)=>s+t.pnl,0),[t09]);
  const netPnl=useMemo(()=>Math.round(t09.reduce((s,t)=>s+t.pnl,0)*100)/100,[t09]);
  const kontoabstand=Math.max(0,Math.round((BUFFER-ttpDD)*100)/100);

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
      while(dt.getDay()===0||dt.getDay()===6)dt.setDate(dt.getDate()+1);
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
      label:d,pnl:map[d]?.pnl||0,
      days:map[d]?.days.size||0,
      wr:map[d]?.n?Math.round(map[d].wins/map[d].n*100):0,
      pct:map[d]?.days.size?Math.round([...map[d].days].filter(date=>{
        return t09.filter(t=>t.date===date).reduce((s,t)=>s+t.pnl,0)>0;
      }).length/map[d].days.size*100):0,
    }));
  },[t09]);

  const equity=useMemo(()=>{let c=0;return t09.map((t,i)=>({i:i+1,v:Math.round((c+=t.pnl)*100)/100}));},[t09]);

  const monthPnl=useMemo(()=>{
    const mo=todayISO().slice(0,7);
    return Math.round(t09.filter(t=>t.date.startsWith(mo)).reduce((s,t)=>s+t.pnl,0)*100)/100;
  },[t09]);

  const profitPlan=useMemo(()=>{
    if(t09.length<10)return null;
    const wins=t09.filter(t=>t.pnl>0),losses=t09.filter(t=>t.pnl<=0);
    const wr=wins.length/t09.length;
    const avgW=wins.length?wins.reduce((s,t)=>s+t.pnl,0)/wins.length:0;
    const avgL=losses.length?Math.abs(losses.reduce((s,t)=>s+t.pnl,0)/losses.length):1;
    const rr=avgW/avgL;
    const m={};t09.forEach(t=>{m[t.date]=(m[t.date]||0)+1;});
    return{wr:Math.round(wr*100),rr:rr.toFixed(1),neededWR:Math.round(100/(1+rr)),
      dailyEV:Math.round(2*(wr*40-(1-wr)*20)),
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

  const showToast=msg=>{setToast(msg);setTimeout(()=>setToast(""),2800);};

  // Daily rotating motivation quotes
  const DAILY_QUOTES=[
    "Jeden Tag gibt es Chancen, nicht jeder Trade muss mitgemacht werden. 🎯",
    "Disziplin schlägt Talent. Halte dich an deine Regeln. 💪",
    "Der beste Trade ist manchmal der, den du nicht machst. 🧘",
    "Geduld ist deine größte Stärke. Warte auf dein Setup. ⏱",
    "Heute zählt jede Regel die du befolgst – mehr als jeder Gewinn. ✅",
    "Konstanz schlägt schnelle Gewinne. Bleib bei deinem Plan. 📊",
    "Der Markt läuft nicht weg. Atme tief durch. 🌊",
    "Verluste gehören dazu. Wichtig ist wie du danach reagierst. 🎯",
    "Du bist ein Trader, kein Spieler. Eindeutig durch Disziplin. 🎓",
    "Routine ist langweilig – aber sie macht profitable Trader. 🔁",
    "Ein guter Trader fragt nicht 'wie viel kann ich verdienen', sondern 'wie viel könnte ich verlieren'. 🛡",
    "Heute keine Trades zu machen ist eine Entscheidung. Eine kluge. 🤔",
    "Deine Regeln sind dein Schutz. Bricht sie, bricht dein Konto. 🛡️",
    "Erfolg = (gutes Setup) × (Disziplin) × (Wiederholung). 📈"
  ];
  
  const getDailyQuote=()=>{
    const dayOfYear=Math.floor((new Date()-new Date(new Date().getFullYear(),0,0))/86400000);
    return DAILY_QUOTES[dayOfYear%DAILY_QUOTES.length];
  };

  // Smart Trading Coach – analyzes real data
  const smartCoach=(userMsg,trigger)=>{
    if(trigger==="daily_motivation"){
      const q=getDailyQuote();
      const yesterdayISO=()=>{const d=new Date();d.setDate(d.getDate()-1);while(d.getDay()===0||d.getDay()===6)d.setDate(d.getDate()-1);return d.toISOString().split("T")[0];};
      const yT=t09.filter(t=>t.date===yesterdayISO());
      const yPnl=yT.reduce((s,t)=>s+t.pnl,0);
      let yLine="";
      if(yT.length>0){
        const list=yT.map(t=>`  • ${t.time} ${t.contract} ${t.dir} ${t.pnl>=0?"+":""}$${t.pnl.toFixed(0)}`).join("\n");
        yLine=`\n\nDeine Trades letzter Handelstag (${yPnl>=0?"+":""}$${yPnl.toFixed(0)}):\n${list}`;
      }
      return `Guten Morgen Jeronimo! ☀️\n\n${q}${yLine}\n\nHeute (${tod}): ${todayT.length}/2 Trades · ${tod}-WR: ${dayWR}%\n\nRoutine: ✅ Regeln durchgehen → ✅ Setup warten → ✅ Nur 16:15-17:30. Du musst nicht jeden Trade mitnehmen.`;
    }
    
    const wins=t09.filter(t=>t.pnl>0).length;
    const wr=t09.length?Math.round(wins/t09.length*100):0;
    const todayT=t09.filter(t=>t.date===todayISO());
    const todPnlV=Math.round(todayT.reduce((s,t)=>s+t.pnl,0)*100)/100;
    const DAYS=["So","Mo","Di","Mi","Do","Fr","Sa"];
    const tod=DAYS[new Date().getDay()];
    const dayMap={};t09.forEach(t=>{const d=DAYS[new Date(t.date).getDay()];if(!dayMap[d])dayMap[d]={w:0,n:0,pnl:0};dayMap[d].n++;dayMap[d].pnl+=t.pnl;if(t.pnl>0)dayMap[d].w++;});
    const dayWR=dayMap[tod]?Math.round(dayMap[tod].w/dayMap[tod].n*100):0;
    const lastT=t09[t09.length-1];
    const hour=new Date().getHours();
    const min=new Date().getMinutes();
    const inWindow=hour===16&&min>=15||hour===17&&min<=30;
    
    // Trigger-based responses
    if(trigger==="trading_window"){
      if(dayWR<40&&dayMap[tod]&&dayMap[tod].n>=3)return `⚠️ Trading-Fenster offen, aber ${tod} ist statistisch dein schlechtester Tag (${dayWR}% WR über ${dayMap[tod].n} Trades). Empfehlung: Heute nur paper-traden oder Pause.`;
      if(dayWR>=60)return `✅ Trading-Fenster offen! ${tod} ist dein STARKER Tag (${dayWR}% WR). Setup: Heatmap Correlation SP, max 2 Trades, 1 MNQ.`;
      return `📊 Trading-Fenster offen. ${tod}-WR: ${dayWR}%. Halte dich strikt an: max 2 Trades, 16:15–17:30, 1 MNQ. Kontoabstand: $${kontoabstand.toFixed(0)}.`;
    }
    if(trigger==="overtrading"){
      return `🛑 STOPP! Das ist dein ${todayT.length}. Trade heute. Deine Regel: MAX 2. Schließe die Plattform JETZT. Morgen bist du gesperrt. Heutige Performance: ${todPnlV>=0?"+":""}$${todPnlV.toFixed(0)}.`;
    }
    if(trigger==="after_trade"&&lastT){
      const ok=lastT.pnl>0;
      const ruleScore=Object.values(lastT.rules||{}).filter(Boolean).length;
      const totalRules=Object.keys(lastT.rules||{}).length;
      const rulePct=totalRules?Math.round(ruleScore/totalRules*100):0;
      if(ok&&rulePct>=80)return `🎯 Stark! ${lastT.contract} ${lastT.dir} +$${lastT.pnl.toFixed(0)}. Regelquote: ${rulePct}%. So sieht Disziplin aus. Heute: ${todayT.length}/2 Trades.`;
      if(ok&&rulePct<80)return `📈 Gewinn (+$${lastT.pnl.toFixed(0)}) – aber Regelquote nur ${rulePct}%. Du hast Glück gehabt. Glück ist keine Strategie.`;
      if(!ok&&rulePct>=80)return `❌ Verlust ($${lastT.pnl.toFixed(0)}) – aber ${rulePct}% Regelquote. Das passiert. Wichtig: keine Rache-Trades. Pause einhalten!`;
      return `🚨 Verlust ($${lastT.pnl.toFixed(0)}) UND nur ${rulePct}% Regelquote. Das ist ein Setup für Overtrading. Atme tief durch. 15 Min Pause sind PFLICHT.`;
    }
    
    // User input parsing
    const msg=(userMsg||"").toLowerCase();
    if(msg.includes("hallo")||msg.includes("hi")||msg.includes("hey")){
      return `Hi Jeronimo! 👋 ${t09.length} Trades, ${wr}% WR. Heute: ${todayT.length}/2 (${todPnlV>=0?"+":""}$${todPnlV.toFixed(0)}). Was möchtest du wissen?`;
    }
    if(msg.includes("heute")||msg.includes("today")){
      if(todayT.length===0)return `Heute (${tod}) noch keine Trades. Dein ${tod}-WR historisch: ${dayWR}%. ${inWindow?"Trading-Fenster ist OFFEN.":"Trading-Fenster: 16:15–17:30."}`;
      return `Heute: ${todayT.length} Trades, P&L: ${todPnlV>=0?"+":""}$${todPnlV.toFixed(0)}. ${todayT.length>=2?"LIMIT erreicht – nicht mehr traden!":`Noch ${2-todayT.length} Trade möglich.`}`;
    }
    if(msg.includes("wie ist")||msg.includes("performance")||msg.includes("stats")){
      const best=Object.entries(dayMap).filter(([_,v])=>v.n>=3).sort((a,b)=>(b[1].w/b[1].n)-(a[1].w/a[1].n))[0];
      const worst=Object.entries(dayMap).filter(([_,v])=>v.n>=3).sort((a,b)=>(a[1].w/a[1].n)-(b[1].w/b[1].n))[0];
      return `${t09.length} Trades, ${wr}% WR. Bester Tag: ${best?best[0]+" ("+Math.round(best[1].w/best[1].n*100)+"%)":"–"}. Schlechtester: ${worst?worst[0]+" ("+Math.round(worst[1].w/worst[1].n*100)+"%)":"–"}. Saldo: $${saldo.toFixed(0)}.`;
    }
    if(msg.includes("kontoabstand")||msg.includes("dd")||msg.includes("drawdown")){
      return `Kontoabstand: $${kontoabstand.toFixed(0)} (${Math.round(kontoabstand/BUFFER*100)}% frei von $${BUFFER}). Empfohlen pro Trade: max $${Math.round(kontoabstand*0.02)}. MNQ = $0.50/Tick.`;
    }
    if(msg.includes("soll ich")||msg.includes("traden")){
      if(todayT.length>=2)return `Nein. Du hast schon ${todayT.length}/2 Trades heute. Limit erreicht.`;
      if(todayBlocked)return `NEIN. Heute gesperrt wegen Overtrading gestern.`;
      if(dayWR<40&&dayMap[tod]&&dayMap[tod].n>=3)return `Eher nicht. ${tod} ist dein schwacher Tag (${dayWR}% WR). Lieber Pause oder demo.`;
      if(!inWindow)return `Warte aufs Fenster (16:15–17:30). Aktuell: ${String(hour).padStart(2,"0")}:${String(min).padStart(2,"0")}.`;
      return `Wenn Setup da ist: ja. Max 1 MNQ, SL bei 40 Ticks (-$20), TP bei 80 Ticks (+$40). Halte dich an Heatmap Correlation SP.`;
    }
    if(msg.includes("warum")||msg.includes("why")){
      return `Verluste meist durch: 1) Zu viele Trades pro Tag (Overtrading) 2) Trades außerhalb 16:15–17:30 3) Emotionales Trading nach Verlust. Schau dir die History an.`;
    }
    if(msg.includes("regel")||msg.includes("rule")){
      return `Deine Regeln: Max 2 Trades/Tag, nur 16:15–17:30, 1 MNQ, 15 Min Pause nach Trade, SL gesetzt, Plan vor Trade. Bei 3 Trades = morgen gesperrt.`;
    }
    if(msg.includes("danke")||msg.includes("ty"))return `Gerne. Trade smart, nicht hart. 💪`;
    
    // Default analysis
    return `Aktuell: ${t09.length} Trades, ${wr}% WR, Saldo $${saldo.toFixed(0)}. Heute (${tod}): ${todayT.length}/2 Trades, ${todPnlV>=0?"+":""}$${todPnlV.toFixed(0)}. Frag mich nach: Performance, Stats, "soll ich traden", Regeln, Kontoabstand.`;
  };

  const triggerAiPopup=(type)=>{
    setAiOpen(true);
    const response=smartCoach("",type);
    setAiMessages([{role:"assistant",content:response,auto:true}]);
  };

  const sendAiMessage=()=>{
    if(!aiInput.trim())return;
    const userInput=aiInput;
    setAiMessages(p=>[...p,{role:"user",content:userInput}]);
    setAiInput("");
    setTimeout(()=>{
      const response=smartCoach(userInput,"");
      setAiMessages(p=>[...p,{role:"assistant",content:response}]);
    },300);
  };

  const addTrade=()=>{
    if(!form.pnl){showToast("Bitte P&L eingeben");return;}
    const v=parseFloat(form.pnl);
    if(isNaN(v)){showToast("P&L muss eine Zahl sein");return;}
    const newT={id:uid(),acct:"09",contract:form.contract,date:form.date,time:form.time,pnl:v,dur:0,dir:form.dir,setup:form.setup,notes:form.notes,rules:{...form.rules}};
    setTrades(p=>{const updated=[...p,newT];localStorage.setItem('ttp_trades',JSON.stringify(updated));return updated;});
    const newSaldo=Math.round((saldo+v)*100)/100;
    setSaldo(newSaldo);
    localStorage.setItem("ttp_saldo",newSaldo);
    if(v<0){const newDD=Math.round((ttpDD+Math.abs(v))*100)/100;setTtpDD(newDD);localStorage.setItem("ttp_dd",newDD);}
    setLastTradeAt(new Date());
    setForm(emptyForm());
    showToast("Gespeichert! 15-Min Pause startet...");
    setTab("dash");
    setTimeout(()=>triggerAiPopup("after_trade"),1000);
    // Reset pre-trade checks - must check again before next trade
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
  const monthlyStats=useMemo(()=>{
    const m={};
    t09.forEach(t=>{
      const mo=t.date.slice(0,7);
      if(!m[mo])m[mo]={pnl:0,trades:0,wins:0,losses:0,days:new Set()};
      m[mo].pnl+=t.pnl;m[mo].trades++;m[mo].days.add(t.date);
      if(t.pnl>0)m[mo].wins++;else m[mo].losses++;
    });
    return Object.entries(m).sort(([a],[b])=>b.localeCompare(a)).map(([mo,v])=>({
      mo,pnl:Math.round(v.pnl*100)/100,
      trades:v.trades,wins:v.wins,losses:v.losses,
      wr:Math.round(v.wins/v.trades*100),days:v.days.size
    }));
  },[t09]);

  const NAVS=[{k:"dash",icon:"📊",lb:"Dashboard"},{k:"check",icon:"✅",lb:"Regeln"},{k:"log",icon:"➕",lb:"Eintragen"},{k:"analyse",icon:"📈",lb:"Analyse"},{k:"hist",icon:"📋",lb:"History"}];

  return(
    <div style={{background:"#0f1117",minHeight:"100vh",color:"#e2e8f0",fontFamily:"-apple-system,BlinkMacSystemFont,sans-serif",fontSize:14,paddingBottom:"calc(80px + env(safe-area-inset-bottom,0px))"}}>
      {showSplash&&<div style={{position:"fixed",inset:0,zIndex:9999,background:"radial-gradient(circle at center,#1a1f2e 0%,#0f1117 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",animation:"fadeOut 0.4s ease 1.4s forwards"}}>
        <div style={{fontSize:42,fontWeight:900,letterSpacing:"-2px",marginBottom:8,animation:"scaleIn 0.6s ease"}}>
          <span style={{color:B}}>Mind</span><span style={{color:"#e2e8f0"}}>Risk</span>
        </div>
        <div style={{fontSize:11,color:"#6b7280",letterSpacing:"3px",marginBottom:32,animation:"fadeIn 0.8s ease 0.3s both"}}>TRADING JOURNAL</div>
        <div style={{width:48,height:48,borderRadius:"50%",border:"3px solid #2d3548",borderTopColor:B,animation:"spin 0.8s linear infinite"}}/>
      </div>}
      <style>{`*{box-sizing:border-box;margin:0;padding:0}html,body{overflow-x:hidden;max-width:100%}@keyframes pulse{0%,100%{opacity:0.3}50%{opacity:1}}@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes fadeOut{to{opacity:0;visibility:hidden}}@keyframes scaleIn{from{transform:scale(0.85);opacity:0}to{transform:scale(1);opacity:1}}@keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}@keyframes glowPulse{0%,100%{box-shadow:0 0 0 0 rgba(245,158,11,0.5)}50%{box-shadow:0 0 0 12px rgba(245,158,11,0)}}input,select,textarea{background:#1a1f2e;color:#e2e8f0;border:1px solid #2d3548;border-radius:8px;padding:9px 12px;font-family:inherit;font-size:13px;outline:none;width:100%;max-width:100%}input:focus,select:focus,textarea:focus{border-color:#6366f1}select option{background:#1a1f2e}button{cursor:pointer;font-family:inherit;border:none;border-radius:8px}`}</style>

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

      <div style={{background:"linear-gradient(180deg,#1a1f2e 0%,#161b27 100%)",borderBottom:"1px solid #2d3548",padding:"14px 18px 12px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
          <div>
            <div style={{fontWeight:800,fontSize:22,letterSpacing:"-0.5px"}}><span style={{color:B}}>Mind</span><span style={{color:"#e2e8f0"}}>Risk</span></div>
            <div style={{color:"#6b7280",fontSize:10,marginTop:1}}>Jeronimo – Konto 09</div>
          </div>
          <div style={{fontSize:10,textAlign:"right"}}>
            <div style={{display:"flex",flexDirection:"column",gap:2,alignItems:"flex-end"}}>
              <div>
                <span style={{color:"#6b7280",fontSize:9}}>LON </span>
                <span style={{color:lonOpen?G:Y,fontWeight:700}}>{lonTime}</span>
                <span style={{color:lonOpen?G:"#6b7280",marginLeft:3}}>{lonOpen?"●":"○"}</span>
              </div>
              <div>
                <span style={{color:"#6b7280",fontSize:9}}>CHI </span>
                <span style={{color:chiOpen?G:Y,fontWeight:700}}>{chiTime}</span>
                <span style={{color:chiOpen?G:"#6b7280",marginLeft:3}}>{chiOpen?"●":"○"}</span>
              </div>
            </div>
          </div>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            <div style={{background:B+"22",border:"1px solid "+B,borderRadius:20,padding:"6px 14px",fontWeight:700,fontSize:12,color:B}}>P1-235109</div>
            <button onClick={()=>setSettingsOpen(true)} style={{background:"#2d3548",borderRadius:10,width:36,height:36,padding:0,display:"flex",alignItems:"center",justifyContent:"center",color:"#e2e8f0",fontSize:18}}>☰</button>
          </div>
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          <Pill bg={todPnl>=0?G+"22":R+"22"} color={pc(todPnl)}>Heute: {fs(todPnl)}</Pill>
          {inPause&&<Pill bg={Y+"33"} color={Y}>⏸ {pStr}</Pill>}
          <Pill bg={tradesLeft>0&&!todayBlocked&&!atLimit?G+"22":R+"22"} color={tradesLeft>0&&!todayBlocked&&!atLimit?G:R}>
            {todayBlocked?"🚫 GESPERRT":overtradingToday?"🚫 3 TRADES":atLimit?"🛑 LIMIT":tradesLeft+" Trade"+(tradesLeft===1?"":"s")+" übrig"}
          </Pill>
          <Pill bg={sc(disc)+"22"} color={sc(disc)}>Regelquote: {disc}%</Pill>
        </div>
      </div>

      {inPause&&<div style={{position:"sticky",top:0,zIndex:90,background:"linear-gradient(135deg,#f59e0b 0%,#ef4444 100%)",padding:"10px 16px",display:"flex",alignItems:"center",gap:10,boxShadow:"0 4px 12px rgba(0,0,0,0.3)",animation:"slideUp 0.3s ease"}}>
        <span style={{fontSize:18,animation:"pulse 1s infinite"}}>⏸</span>
        <div style={{flex:1}}>
          <div style={{fontWeight:800,fontSize:13,color:"#fff",letterSpacing:"-0.2px"}}>PFLICHTPAUSE – {pStr}</div>
          <div style={{fontSize:10,color:"#fef3c7",opacity:0.9}}>Kein Impuls-Trade! Warte den Timer ab.</div>
        </div>
      </div>}
      
      <div style={{padding:"16px 16px 20px",maxWidth:520,margin:"0 auto"}}>

        {tab==="dash"&&(
          <div style={{display:"flex",flexDirection:"column",gap:12}}>

            {inPause&&<div style={{background:"linear-gradient(135deg,rgba(245,158,11,0.15) 0%,rgba(239,68,68,0.08) 100%)",border:"2px solid rgba(245,158,11,0.6)",borderRadius:14,padding:"16px 18px",display:"flex",gap:14,alignItems:"center",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",boxShadow:"0 4px 24px rgba(245,158,11,0.25)",animation:"glowPulse 2s ease infinite"}}>
              <span style={{fontSize:24,filter:"drop-shadow(0 0 8px rgba(245,158,11,0.5))"}}>⏸</span>
              <div style={{flex:1}}>
                <div style={{color:Y,fontWeight:700,fontSize:13,marginBottom:4,letterSpacing:"-0.2px"}}>Pflichtpause – {PAUSE_MINS} Min nach Trade</div>
                <div style={{color:Y,fontWeight:800,fontSize:36,lineHeight:1,letterSpacing:"-1px",fontFamily:"-apple-system,system-ui"}}>{pStr}</div>
                <div style={{color:"#fbbf24",fontSize:11,marginTop:5,opacity:0.9}}>Kein Impuls-Trade – warte den Timer ab</div>
              </div>
            </div>}

            {todayBlocked&&!inPause&&<div style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.4)",borderRadius:14,padding:"14px 16px",display:"flex",gap:14,alignItems:"center",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",boxShadow:"0 4px 24px rgba(239,68,68,0.15)"}}>
              <span style={{fontSize:22,filter:"drop-shadow(0 0 8px rgba(239,68,68,0.5))"}}>🚫</span>
              <div style={{flex:1}}><div style={{color:R,fontWeight:700,fontSize:13,marginBottom:3,letterSpacing:"-0.2px"}}>Heute gesperrt (Overtrading gestern)</div><div style={{color:"#fca5a5",fontSize:11,opacity:0.9,lineHeight:1.5}}>Morgen wieder. Heute: analysieren statt traden.</div></div>
            </div>}

            {overtradingToday&&!todayBlocked&&<div style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.4)",borderRadius:14,padding:"14px 16px",display:"flex",gap:14,alignItems:"center",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",boxShadow:"0 4px 24px rgba(239,68,68,0.15)"}}>
              <span style={{fontSize:22,filter:"drop-shadow(0 0 8px rgba(239,68,68,0.5))"}}>🚫</span>
              <div style={{flex:1}}><div style={{color:R,fontWeight:700,fontSize:13,marginBottom:3,letterSpacing:"-0.2px"}}>3 Trades – Morgen gesperrt!</div><div style={{color:"#fca5a5",fontSize:11,opacity:0.9,lineHeight:1.5}}>Grenze überschritten. Rechner aus.</div></div>
            </div>}

            {atLimit&&!overtradingToday&&!todayBlocked&&<div style={{background:O+"22",border:"1px solid "+O,borderRadius:10,padding:"10px 14px",display:"flex",gap:10,alignItems:"center"}}>
              <span style={{fontSize:18}}>🛑</span>
              <div><div style={{color:O,fontWeight:800,fontSize:13}}>2 Trades – Tageslimit!</div><div style={{color:"#fdba74",fontSize:11,marginTop:1}}>Kein 3. Trade! Ein 3. Trade sperrt morgen.</div></div>
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
                  <span style={{color:"#6b7280",fontSize:10}}>Kontoabstand</span>
                  <span style={{color:kontoabstand<500?R:kontoabstand<1000?Y:G,fontWeight:700}}>${kontoabstand.toFixed(0)} frei ({Math.round((1-ttpDD/BUFFER)*100)}%)</span>
                </div>
                <Bar2 pct={kontoabstand/BUFFER*100} color={kontoabstand<500?R:kontoabstand<1000?Y:G}/>
                {kontoabstand<1000&&<div style={{color:kontoabstand<500?R:Y,fontSize:10,fontWeight:700,marginTop:3}}>{kontoabstand<500?"STOPP! Nur noch $"+kontoabstand.toFixed(0)+" bis TTP sperrt":"Vorsicht: unter $1.000"}</div>}
              </div>
              <div>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                  <span style={{color:"#6b7280",fontSize:10}}>{todPnl>=0?"Heute P&L":"Heute verloren"}</span>
                  <span style={{color:todPnl>=0?G:dpD>75?R:Y,fontWeight:700,fontSize:10}}>{fs(todPnl)} {todPnl>=0?"(Profit)":"/ -$1.000 Limit"}</span>
                </div>
                <div style={{height:8,borderRadius:4,background:"#2d3548",overflow:"hidden",position:"relative"}}>
                  {todPnl>=0?
                    <div style={{height:"100%",borderRadius:4,width:Math.min(100,(todPnl/500)*100)+"%",background:"linear-gradient(90deg,#00d395 0%,#10b981 100%)",transition:"width .4s",boxShadow:"0 0 8px rgba(0,211,149,0.4)"}}/>
                    :<div style={{height:"100%",borderRadius:4,width:dpD+"%",background:dpD>75?"linear-gradient(90deg,#ef4444,#dc2626)":dpD>50?"linear-gradient(90deg,#f59e0b,#ef4444)":"linear-gradient(90deg,#fbbf24,#f59e0b)",transition:"width .4s"}}/>
                  }
                </div>
              </div>
              <div style={{marginTop:10,paddingTop:10,borderTop:"1px solid #2d3548",display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                <div>
                  <div style={{color:"#6b7280",fontSize:10,marginBottom:3}}>Saldo (aus TTP):</div>
                  <input type="number" step="0.01" defaultValue={saldo} onBlur={e=>{const v=parseFloat(e.target.value);if(!isNaN(v)){setSaldo(v);localStorage.setItem("ttp_saldo",v);}}} style={{fontSize:12,padding:"5px 8px"}}/>
                </div>
                <div>
                  <div style={{color:"#6b7280",fontSize:10,marginBottom:3}}>Max DD genutzt ($):</div>
                  <input type="number" step="0.01" defaultValue={ttpDD} onBlur={e=>{const v=parseFloat(e.target.value);if(!isNaN(v)){setTtpDD(v);localStorage.setItem("ttp_dd",v);}}} style={{fontSize:12,padding:"5px 8px"}}/>
                </div>
              </div>
              <div style={{marginTop:10,background:"linear-gradient(135deg,rgba(0,211,149,0.08) 0%,rgba(99,102,241,0.05) 100%)",borderRadius:10,padding:"10px 12px",border:"1px solid "+G+"44"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <div style={{color:G,fontSize:11,fontWeight:700,letterSpacing:"-0.2px"}}>{
                    kontoabstand<500?"⚠️ Risk-Level: KONSERVATIV":
                    kontoabstand<1000?"📊 Risk-Level: VORSICHTIG":
                    kontoabstand<1500?"💪 Risk-Level: STANDARD":
                    "🚀 Risk-Level: KOMFORT"
                  }</div>
                  <div style={{color:"#6b7280",fontSize:10}}>${kontoabstand.toFixed(0)} Puffer</div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,fontSize:11}}>
                  <div><div style={{color:"#6b7280",fontSize:9,marginBottom:2}}>MAX/TRADE</div><div style={{color:R,fontWeight:800}}>${
                    kontoabstand<500?Math.round(kontoabstand*0.01):
                    kontoabstand<1000?Math.round(kontoabstand*0.015):
                    kontoabstand<1500?Math.round(kontoabstand*0.02):
                    Math.round(kontoabstand*0.025)
                  }</div></div>
                  <div><div style={{color:"#6b7280",fontSize:9,marginBottom:2}}>MNQ TICKS</div><div style={{color:Y,fontWeight:800}}>{
                    kontoabstand<500?Math.round(kontoabstand*0.01/0.5):
                    kontoabstand<1000?Math.round(kontoabstand*0.015/0.5):
                    kontoabstand<1500?Math.round(kontoabstand*0.02/0.5):
                    Math.round(kontoabstand*0.025/0.5)
                  }</div></div>
                  <div><div style={{color:"#6b7280",fontSize:9,marginBottom:2}}>MAX/TAG</div><div style={{color:G,fontWeight:800}}>${
                    kontoabstand<500?Math.round(kontoabstand*0.02):
                    kontoabstand<1000?Math.round(kontoabstand*0.03):
                    kontoabstand<1500?Math.round(kontoabstand*0.04):
                    Math.round(kontoabstand*0.05)
                  }</div></div>
                </div>
                <div style={{color:"#6b7280",fontSize:10,marginTop:6,lineHeight:1.4}}>{
                  kontoabstand<500?"⚠️ Konto in Gefahr – minimales Risiko nehmen.":
                  kontoabstand<1000?"Vorsicht – TTP DD nicht weiter erhöhen.":
                  kontoabstand<1500?"Standard-Risiko, normale Trades möglich.":
                  "Großzügiger Puffer – aber bleib diszipliniert."
                }</div>
              </div>
            </Card>

            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
              {[
                {l:"TRADES",v:tradeCount+"/"+DAILY_LIMIT,c:tradesLeft>0?G:R},
                {l:"P&L HEUTE",v:fs(todPnl),c:pc(todPnl)},
                {l:"KONTOABSTAND",v:"$"+kontoabstand.toFixed(0),c:kontoabstand<1000?Y:G},
              ].map(s=>(
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
              <div style={{display:"flex",gap:12,marginTop:8,fontSize:10,color:"#6b7280"}}>
                <span><span style={{color:G}}>■</span> Gewinn</span>
                <span><span style={{color:R}}>■</span> Verlust</span>
                <span><span style={{color:R}}>■</span> SPERRE</span>
              </div>
            </Card>

            <Card style={{borderColor:P+"33"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div style={{fontWeight:700}}>Monatsziel – {todayISO().slice(0,7)}</div>
                <button onClick={()=>setTab("analyse")} style={{background:"none",color:P,fontSize:12}}>bearbeiten</button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                <div><div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{color:"#6b7280",fontSize:10}}>P&L</span><span style={{color:pc(monthPnl),fontSize:10,fontWeight:700}}>{fs(monthPnl)} / ${goals.pnl}</span></div><Bar2 pct={Math.min(100,Math.max(0,monthPnl)/goals.pnl*100)} color={monthPnl>=goals.pnl?G:B}/></div>
                <div><div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{color:"#6b7280",fontSize:10}}>Regelquote</span><span style={{color:sc(disc),fontSize:10,fontWeight:700}}>{disc}% / {goals.disc}%</span></div><Bar2 pct={Math.min(100,disc/goals.disc*100)} color={sc(disc)}/></div>
              </div>
              {(()=>{
                const eom=new Date(now.getFullYear(),now.getMonth()+1,0);
                const tLeft=Math.max(1,Math.round((eom-now)/86400000*5/7));
                const needed=Math.round(goals.pnl-monthPnl);
                const perDay=needed>0?Math.ceil(needed/tLeft):0;
                return needed>0?(
                  <div style={{background:"#0f1117",borderRadius:8,padding:10,display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,textAlign:"center"}}>
                    <div><div style={{color:"#6b7280",fontSize:9}}>HANDELSTAGE</div><div style={{color:B,fontWeight:800,fontSize:16}}>{tLeft}</div></div>
                    <div style={{borderLeft:"1px solid #2d3548",borderRight:"1px solid #2d3548"}}><div style={{color:"#6b7280",fontSize:9}}>PRO TAG</div><div style={{color:Y,fontWeight:800,fontSize:16}}>${perDay}</div></div>
                    <div><div style={{color:"#6b7280",fontSize:9}}>PRO TRADE</div><div style={{color:Y,fontWeight:800,fontSize:16}}>${Math.ceil(perDay/2)}</div></div>
                  </div>
                ):<div style={{color:G,fontWeight:700,textAlign:"center",padding:6}}>Monatsziel erreicht! 🎉</div>;
              })()}
            </Card>
            {profitPlan&&(
              <Card style={{borderColor:G+"33",background:"#0a160f"}}>
                <div style={{fontWeight:700,fontSize:15,marginBottom:3,color:G}}>Weg zur Profitabilitaet</div>
                <div style={{color:"#6b7280",fontSize:11,marginBottom:12}}>Basierend auf {t09.length} Trades | Realist. Ziel mit 1 MNQ: <span style={{color:G,fontWeight:700}}>$200–$400/Monat</span></div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:12}}>
                  {[{l:"TREFFERQUOTE",v:profitPlan.wr+"%",c:profitPlan.wr>=50?G:R},{l:"DEIN R:R",v:profitPlan.rr+":1",c:parseFloat(profitPlan.rr)>=1?G:R},{l:"BREAK-EVEN",v:profitPlan.neededWR+"%",c:Y}].map(s=>(
                    <div key={s.l} style={{background:"#0f1117",borderRadius:8,padding:10,textAlign:"center"}}>
                      <div style={{color:"#6b7280",fontSize:9,marginBottom:3}}>{s.l}</div>
                      <div style={{color:s.c,fontWeight:800,fontSize:18}}>{s.v}</div>
                    </div>
                  ))}
                </div>
                {profitPlan.overtradeDays>0&&<div style={{background:R+"22",border:"1px solid "+R+"44",borderRadius:8,padding:"8px 12px",marginBottom:10,display:"flex",gap:8}}>
                  <span>⚠️</span><div style={{color:R,fontSize:12,fontWeight:600}}>{profitPlan.overtradeDays} von {profitPlan.totalDays} Tagen: Overtrading. Dein #1 Problem.</div>
                </div>}
                <div style={{background:"#0f1117",borderRadius:10,padding:12}}>
                  <div style={{color:G,fontWeight:700,marginBottom:8}}>1 MNQ Kontrakt – Dein Plan:</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    {[{l:"RISIKO/TRADE",v:"$"+Math.round(kontoabstand*0.02),sub:"2% Kontoabstand",c:R},{l:"ZIEL/TRADE (2:1)",v:"$"+Math.round(kontoabstand*0.04),sub:Math.round(kontoabstand*0.04/0.5)+" Ticks TP",c:G},
                      {l:"MAX HEUTE",v:"$80",sub:"2×$40 mit 1 MNQ",c:G},{l:"BEI 55% WR",v:"+$"+Math.round(2*(0.55*40-0.45*20)*22),sub:"pro Monat",c:G}].map(s=>(
                      <div key={s.l} style={{background:"#1a1f2e",borderRadius:8,padding:8}}>
                        <div style={{color:"#6b7280",fontSize:9,marginBottom:2}}>{s.l}</div>
                        <div style={{color:s.c,fontWeight:800,fontSize:16}}>{s.v}</div>
                        <div style={{color:"#6b7280",fontSize:9,marginTop:1}}>{s.sub}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{marginTop:10,background:"#0f1117",borderRadius:10,padding:12}}>
                  <div style={{color:"#6b7280",fontSize:10,marginBottom:8,fontWeight:700}}>AUFBAU-PLAN</div>
                  {[{p:"Phase 1",icon:"🌱",t:"Jetzt: 1 MNQ",d:"Max 2 Trades/Tag | 16:15–17:30 | SL "+Math.round(kontoabstand*0.02/0.5)+" Ticks",active:true},
                    {p:"Phase 2",icon:"📈",t:"30 prof. Tage: 2 MNQ",d:"Gleiche Regeln, doppeltes Kapital",active:false},
                    {p:"Phase 3",icon:"🏆",t:"Ziel: 1 NQ",d:"Nach 60 Tagen Disziplin",active:false}].map((ph,i)=>(
                    <div key={i} style={{display:"flex",gap:10,padding:"7px 0",borderBottom:i<2?"1px solid #2d3548":"none",opacity:ph.active?1:0.5}}>
                      <span style={{fontSize:16,flexShrink:0}}>{ph.icon}</span>
                      <div><div style={{fontWeight:700,fontSize:12,color:ph.active?G:"#e2e8f0"}}>{ph.p}: {ph.t}</div><div style={{color:"#6b7280",fontSize:10}}>{ph.d}</div></div>
                      {ph.active&&<span style={{marginLeft:"auto",color:G,fontSize:11,fontWeight:700,flexShrink:0}}>JETZT</span>}
                    </div>
                  ))}
                </div>
              </Card>
            )}


          </div>
        )}

        {tab==="check"&&(
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {inPause&&<div style={{background:"#1a0a00",border:"2px solid "+Y,borderRadius:12,padding:"12px 16px",display:"flex",gap:12,alignItems:"center"}}>
              <span style={{fontSize:24}}>⏸</span>
              <div style={{flex:1}}><div style={{color:Y,fontWeight:800,fontSize:14}}>Pflichtpause</div><div style={{color:Y,fontWeight:800,fontSize:38,letterSpacing:2,lineHeight:1}}>{pStr}</div><div style={{color:"#fbbf24",fontSize:11,marginTop:2}}>Warte den Timer ab</div></div>
            </div>}
            {todayBlocked&&<div style={{background:R+"22",border:"1px solid "+R,borderRadius:10,padding:"10px 14px",display:"flex",gap:10,alignItems:"center"}}>
              <span>🚫</span><div style={{color:R,fontWeight:800}}>Heute gesperrt – Pause-Tag</div>
            </div>}
            {overtradingToday&&!todayBlocked&&<div style={{background:R+"22",border:"1px solid "+R,borderRadius:10,padding:"10px 14px",display:"flex",gap:10}}>
              <span>🚫</span><div style={{color:R,fontWeight:800}}>3 Trades – Morgen gesperrt. Rechner aus.</div>
            </div>}
            {atLimit&&!overtradingToday&&!todayBlocked&&<div style={{background:O+"22",border:"1px solid "+O,borderRadius:10,padding:"10px 14px",display:"flex",gap:10}}>
              <span>🛑</span><div><div style={{color:O,fontWeight:800}}>2 Trades – Tageslimit!</div><div style={{color:"#fdba74",fontSize:11}}>Kein 3. Trade!</div></div>
            </div>}
            <Card style={{borderColor:now.getHours()>=16?G+"44":Y+"44"}}>
              <div style={{fontWeight:700,fontSize:16,marginBottom:4}}>Zeitfenster</div>
              <div style={{color:now.getHours()>=16?G:Y,fontSize:24,fontWeight:800}}>{now.toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"})} Uhr</div>
              <div style={{color:"#6b7280",fontSize:12,marginTop:4}}>{now.getHours()>=16?"Optimales Fenster (16:15+)":"Noch nicht – warte auf 16:15 Uhr"}</div>
            </Card>
            {!inPause&&!todayBlocked&&!overtradingToday&&!atLimit&&<Card>
              <div style={{fontWeight:700,fontSize:15,marginBottom:12}}>Pre-Trade Regelnliste</div>
              {[{id:"c1",q:"Geplantes Setup – kein Impuls?"},{id:"c2",q:"SL und TP definiert?"},{id:"c3",q:"Emotional ruhig und klar?"},{id:"c4",q:"Nach 16:15 Uhr?"}].map(it=>(
                <Chk key={it.id} checked={checks[it.id]} onClick={()=>{const newChecks={...checks,[it.id]:!checks[it.id]};setChecks(newChecks);localStorage.setItem("ttp_checks",JSON.stringify({date:todayISO(),data:newChecks}));}} label={it.q}/>
              ))}
              <div style={{marginTop:12,background:allChecked?G+"22":R+"11",border:"1px solid "+(allChecked?G:R)+"44",borderRadius:10,padding:12,textAlign:"center"}}>
                {allChecked?<div><div style={{color:G,fontWeight:800,fontSize:17}}>GRUENES LICHT</div><div style={{color:"#6b7280",fontSize:11,marginTop:3}}>1 MNQ | SL {Math.round(kontoabstand*0.02/0.5)} Ticks (${Math.round(kontoabstand*0.02)}) | TP {Math.round(kontoabstand*0.04/0.5)} Ticks</div></div>
                :<div style={{color:R,fontWeight:700,fontSize:15}}>Noch nicht bereit</div>}
              </div>
              <button onClick={()=>{setChecks({c1:false,c2:false,c3:false,c4:false});localStorage.removeItem("ttp_checks");}} style={{background:"none",color:"#6b7280",fontSize:12,padding:"7px 0",width:"100%",marginTop:6}}>Zuruecksetzen</button>
            </Card>}
            <Card style={{background:"#12101a",borderColor:P+"33"}}>
              <div style={{color:P,fontWeight:700,marginBottom:8}}>Meine Regeln</div>
              {["1 MNQ – kein NQ bis profitabel","Max 2 Trades/Tag","15 Min Pause nach jedem Trade","Nur 16:15–17:30 Uhr","SL + TP vor dem Entry","Ein 3. Trade sperrt morgen"].map((r,i)=>(
                <div key={i} style={{display:"flex",gap:8,padding:"5px 0",borderBottom:"1px solid #2d3548",fontSize:13,color:"#c4b5fd"}}>
                  <span style={{color:P,fontWeight:700,flexShrink:0}}>{i+1}.</span>{r}
                </div>
              ))}
            </Card>
          </div>
        )}

        {tab==="log"&&(
          <div>
            {!allChecked&&!inPause&&!todayBlocked&&!atLimit&&(
              <div style={{background:"linear-gradient(135deg,rgba(239,68,68,0.12) 0%,rgba(245,158,11,0.08) 100%)",border:"2px solid rgba(239,68,68,0.5)",borderRadius:14,padding:"18px 18px 16px",marginBottom:14,textAlign:"center",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",boxShadow:"0 4px 24px rgba(239,68,68,0.15)"}}>
                <div style={{fontSize:42,marginBottom:8,filter:"drop-shadow(0 0 12px rgba(239,68,68,0.4))"}}>🔒</div>
                <div style={{color:R,fontWeight:800,fontSize:16,marginBottom:6,letterSpacing:"-0.3px"}}>Routine zuerst!</div>
                <div style={{color:"#fca5a5",fontSize:12,marginBottom:14,lineHeight:1.5}}>Bevor du einen Trade einträgst, gehe deine Pre-Trade Regeln durch.<br/>Disziplin vor Action.</div>
                <div style={{background:"rgba(0,0,0,0.25)",borderRadius:10,padding:"10px 14px",marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#94a3b8",marginBottom:5}}>
                    <span>Regeln durch</span>
                    <span style={{fontWeight:700,color:"#fff"}}>{Object.values(checks).filter(Boolean).length}/4</span>
                  </div>
                  <div style={{height:6,borderRadius:3,background:"#2d3548",overflow:"hidden"}}>
                    <div style={{height:"100%",width:(Object.values(checks).filter(Boolean).length/4*100)+"%",background:"linear-gradient(90deg,#ef4444,#f59e0b,#00d395)",transition:"width .4s"}}/>
                  </div>
                </div>
                <button onClick={()=>setTab("check")} style={{background:"linear-gradient(135deg,"+B+","+P+")",color:"#fff",padding:"12px 24px",fontWeight:700,fontSize:13,borderRadius:10,boxShadow:"0 4px 16px rgba(99,102,241,0.4)"}}>✅ Zu den Regeln</button>
              </div>
            )}
            {(inPause||todayBlocked||atLimit)&&(
              <div style={{background:inPause?"#1a0a00":R+"22",border:"2px solid "+(inPause?Y:R),borderRadius:12,padding:14,marginBottom:12,textAlign:"center"}}>
                {inPause&&<><div style={{color:Y,fontWeight:800,fontSize:15,marginBottom:2}}>⏸ Pflichtpause</div><div style={{color:Y,fontWeight:800,fontSize:42,letterSpacing:2}}>{pStr}</div><div style={{color:"#fbbf24",fontSize:12,marginTop:3}}>Warte bis der Countdown ablaeuft</div></>}
                {!inPause&&todayBlocked&&<div style={{color:R,fontWeight:800}}>🚫 Heute gesperrt</div>}
                {!inPause&&!todayBlocked&&overtradingToday&&<div style={{color:R,fontWeight:800}}>🚫 3 Trades – Morgen gesperrt</div>}
                {!inPause&&!todayBlocked&&!overtradingToday&&atLimit&&<div style={{color:O,fontWeight:800}}>🛑 Tageslimit {DAILY_LIMIT} Trades – kein 3. Trade!</div>}
              </div>
            )}
            {allChecked&&!inPause&&!todayBlocked&&!atLimit&&(
              <div style={{background:"linear-gradient(135deg,rgba(0,211,149,0.12) 0%,rgba(99,102,241,0.08) 100%)",border:"1px solid rgba(0,211,149,0.5)",borderRadius:14,padding:"12px 16px",marginBottom:14,display:"flex",gap:12,alignItems:"center",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",boxShadow:"0 4px 16px rgba(0,211,149,0.15)"}}>
                <span style={{fontSize:22,filter:"drop-shadow(0 0 8px rgba(0,211,149,0.5))"}}>✅</span>
                <div style={{flex:1}}>
                  <div style={{color:G,fontWeight:800,fontSize:13,letterSpacing:"-0.2px"}}>READY – Routine erfüllt</div>
                  <div style={{color:"#86efac",fontSize:11,opacity:0.85,marginTop:2}}>Alle 4 Regeln abgehakt. Du kannst traden.</div>
                </div>
              </div>
            )}
            <Card>
              <div style={{fontWeight:700,fontSize:16,marginBottom:14}}>Trade eintragen</div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,overflow:"hidden"}}>
                  <div style={{minWidth:0}}><label style={{color:"#6b7280",fontSize:10,display:"block",marginBottom:4}}>DATUM</label><input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></div>
                  <div style={{minWidth:0}}><label style={{color:"#6b7280",fontSize:10,display:"block",marginBottom:4}}>UHRZEIT</label><input type="time" value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))}/></div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,overflow:"hidden"}}>
                  <div style={{minWidth:0}}><label style={{color:"#6b7280",fontSize:10,display:"block",marginBottom:4}}>KONTRAKT</label>
                    <select value={form.contract} onChange={e=>setForm(f=>({...f,contract:e.target.value}))}>
                      <option value="MNQ">MNQ ✓</option><option value="NQ">NQ</option><option value="ES">ES</option>
                    </select>
                  </div>
                  <div style={{minWidth:0}}><label style={{color:"#6b7280",fontSize:10,display:"block",marginBottom:4}}>RICHTUNG</label>
                    <select value={form.dir} onChange={e=>setForm(f=>({...f,dir:e.target.value}))}>
                      <option value="LONG">LONG ↑</option><option value="SHORT">SHORT ↓</option>
                    </select>
                  </div>
                </div>
                <div><label style={{color:"#6b7280",fontSize:10,display:"block",marginBottom:4}}>SETUP</label>
                  <select value={form.setup} onChange={e=>setForm(f=>({...f,setup:e.target.value}))}>
                    {SETUPS.map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div><label style={{color:"#6b7280",fontSize:10,display:"block",marginBottom:4}}>NETTO P&L ($) *</label>
                  <input type="number" step="0.01" value={form.pnl} onChange={e=>setForm(f=>({...f,pnl:e.target.value}))} placeholder="z.B. 40 oder -20" style={{borderColor:form.pnl?(parseFloat(form.pnl)>=0?G+"88":R+"88"):"#2d3548"}}/>
                </div>
                <div style={{background:"#0a160f",borderRadius:8,padding:"8px 10px",border:"1px solid "+G+"33"}}>
                  <div style={{color:G,fontSize:11,fontWeight:600}}>1 MNQ: SL {Math.round(kontoabstand*0.02/0.5)} Ticks (${Math.round(kontoabstand*0.02)}) | TP {Math.round(kontoabstand*0.04/0.5)} Ticks (${Math.round(kontoabstand*0.04)})</div>
                </div>
                <div style={{background:"#0f1117",borderRadius:8,padding:10,border:"1px solid #2d3548"}}>
                  <div style={{color:"#6b7280",fontSize:11,marginBottom:6}}>REGELN EINGEHALTEN?</div>
                  {RULES.map(r=>(<Chk key={r.id} checked={form.rules[r.id]} onClick={()=>setForm(f=>({...f,rules:{...f.rules,[r.id]:!f.rules[r.id]}}))} label={r.label}/>))}
                </div>
                <div><label style={{color:"#6b7280",fontSize:10,display:"block",marginBottom:4}}>NOTIZEN</label>
                  <textarea rows={2} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Emotion? Was lief gut/schlecht?" style={{resize:"vertical"}}/>
                </div>
                <div style={{background:Y+"11",border:"1px solid "+Y+"44",borderRadius:8,padding:"8px 12px",display:"flex",gap:8,alignItems:"center"}}>
                  <span>⏱</span><div style={{color:Y,fontSize:11}}>Nach dem Speichern: 15 Min Pflichtpause startet automatisch</div>
                </div>
                <button onClick={addTrade} style={{background:canTrade?B:"#374151",color:"#fff",padding:13,fontSize:14,fontWeight:700,width:"100%",borderRadius:8,opacity:canTrade?1:0.6}} disabled={!canTrade}>
                  {inPause?"⏸ Warten... "+pStr:todayBlocked?"Heute gesperrt":overtradingToday?"3 Trades – Gesperrt":atLimit?"Limit ("+DAILY_LIMIT+" Trades)":!allChecked?"🔒 Erst Regeln abhaken":"Trade speichern – Timer startet!"}
                </button>
              </div>
            </Card>
          </div>
        )}

        {tab==="analyse"&&(
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <Card style={{borderColor:B+"44"}}>
              <div style={{fontWeight:700,fontSize:15,marginBottom:12}}>Monatsziel setzen</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div><label style={{color:"#6b7280",fontSize:10,display:"block",marginBottom:4}}>P&L ZIEL ($)</label><input type="number" defaultValue={goals.pnl} onBlur={e=>setGoals(g=>({...g,pnl:parseInt(e.target.value)||300}))}/></div>
                <div><label style={{color:"#6b7280",fontSize:10,display:"block",marginBottom:4}}>REGELQUOTE (%)</label><input type="number" defaultValue={goals.disc} onBlur={e=>setGoals(g=>({...g,disc:parseInt(e.target.value)||80}))}/></div>
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
                        <div style={{color:"#6b7280",fontSize:8,marginTop:1}}>Gewinn</div>
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
              <div style={{background:R+"11",border:"1px solid "+R+"33",borderRadius:8,padding:"8px 10px",marginTop:4}}>
                <div style={{color:R,fontSize:12,fontWeight:600}}>Trades unter 30s = fast immer Verlust – Impulstrades!</div>
              </div>
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
              <button onClick={()=>{const updated={...journal,[todayISO()]:{...todayJ}};setJournal(updated);localStorage.setItem("ttp_journal",JSON.stringify(updated));showToast("Reflexion gespeichert!");}} style={{background:P,color:"#fff",padding:11,width:"100%",fontWeight:700,borderRadius:8}}>Speichern</button>
            </Card>
          </div>
        )}

        {tab==="hist"&&(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {/* Date Range Filter */}
            <Card>
              <div style={{fontWeight:700,fontSize:13,marginBottom:8,letterSpacing:"-0.2px"}}>🔍 Filter</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                <div><label style={{color:"#6b7280",fontSize:10,display:"block",marginBottom:3}}>VON</label><input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} style={{fontSize:11,padding:"5px 8px"}}/></div>
                <div><label style={{color:"#6b7280",fontSize:10,display:"block",marginBottom:3}}>BIS</label><input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} style={{fontSize:11,padding:"5px 8px"}}/></div>
              </div>
              {(dateFrom||dateTo)&&<button onClick={()=>{setDateFrom("");setDateTo("");}} style={{background:"none",color:"#6b7280",fontSize:11,padding:"4px 0",width:"100%"}}>Filter zurücksetzen ×</button>}
            </Card>

            {/* Filtered View */}
            {(dateFrom||dateTo)&&(()=>{
              const filtered=t09.filter(t=>(!dateFrom||t.date>=dateFrom)&&(!dateTo||t.date<=dateTo));
              const sum=filtered.reduce((s,t)=>s+t.pnl,0);
              const wins=filtered.filter(t=>t.pnl>0).length;
              const wr=filtered.length?Math.round(wins/filtered.length*100):0;
              return(
                <>
                  <Card style={{background:"linear-gradient(135deg,rgba(99,102,241,0.08) 0%,rgba(0,211,149,0.05) 100%)",borderColor:B+"44"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div>
                        <div style={{color:"#6b7280",fontSize:10,marginBottom:2}}>{filtered.length} Trades im Zeitraum</div>
                        <div style={{color:pc(sum),fontWeight:800,fontSize:24,letterSpacing:"-0.5px"}}>{sum>=0?"+":"-"}${Math.abs(sum).toFixed(2)}</div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{color:"#6b7280",fontSize:10,marginBottom:2}}>Trefferquote</div>
                        <div style={{color:wr>=50?G:R,fontWeight:800,fontSize:20}}>{wr}%</div>
                      </div>
                    </div>
                  </Card>
                  {filtered.length>0&&[...filtered].reverse().map(t=>{
                    const rv=t.rules||{},kk=Object.keys(rv);
                    const rs=kk.length?Math.round(kk.filter(k=>rv[k]).length/kk.length*100):0;
                    return(
                      <div key={t.id} style={{background:"#1a1f2e",borderRadius:10,padding:"10px 12px",borderLeft:"3px solid "+pc(t.pnl),display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <div style={{flex:1}}>
                          <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:2}}>
                            <span style={{fontWeight:800,color:pc(t.pnl),fontSize:14}}>{fd(t.pnl)}</span>
                            <span style={{fontSize:10,color:"#6b7280"}}>{t.contract} · {t.dir}</span>
                          </div>
                          <div style={{color:"#6b7280",fontSize:10}}>{t.date} {t.time}</div>
                        </div>
                        <button onClick={()=>setDelId(t.id)} style={{background:"none",color:R,fontSize:16,padding:"2px 4px",opacity:0.5}}>×</button>
                      </div>
                    );
                  })}
                </>
              );
            })()}

            {/* Monthly Overview (only when no filter) */}
            {!dateFrom&&!dateTo&&(
              <Card>
                <div style={{fontWeight:700,fontSize:15,marginBottom:10,letterSpacing:"-0.2px"}}>📅 Jahresübersicht</div>
                <div style={{color:"#6b7280",fontSize:11,marginBottom:10}}>Tippe einen Monat an, um Details zu sehen</div>
                {monthlyStats.map(ms=>{
                  const isExp=expandedMonth===ms.mo;
                  const monthTrades=t09.filter(t=>t.date.startsWith(ms.mo));
                  return(
                    <div key={ms.mo} style={{marginBottom:8,background:"#0f1117",borderRadius:10,padding:"10px 12px",border:isExp?"1px solid "+B+"55":"1px solid transparent",transition:"all .2s"}}>
                      <div onClick={()=>setExpandedMonth(isExp?null:ms.mo)} style={{cursor:"pointer"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                          <div style={{display:"flex",gap:6,alignItems:"center"}}>
                            <span style={{color:"#6b7280",fontSize:11,transition:"transform .2s",display:"inline-block",transform:isExp?"rotate(90deg)":"rotate(0)"}}>▶</span>
                            <div style={{fontWeight:700,fontSize:13}}>{ms.mo}</div>
                          </div>
                          <div style={{color:pc(ms.pnl),fontWeight:800,fontSize:15,letterSpacing:"-0.3px"}}>{ms.pnl>=0?"+":"-"}${Math.abs(ms.pnl).toFixed(0)}</div>
                        </div>
                        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:4,fontSize:10}}>
                          <div style={{textAlign:"center"}}><div style={{color:"#6b7280"}}>Trades</div><div style={{fontWeight:700}}>{ms.trades}</div></div>
                          <div style={{textAlign:"center"}}><div style={{color:"#6b7280"}}>WR</div><div style={{color:ms.wr>=50?G:R,fontWeight:700}}>{ms.wr}%</div></div>
                          <div style={{textAlign:"center"}}><div style={{color:"#6b7280"}}>TP</div><div style={{color:G,fontWeight:700}}>{ms.wins}</div></div>
                          <div style={{textAlign:"center"}}><div style={{color:"#6b7280"}}>SL</div><div style={{color:R,fontWeight:700}}>{ms.losses}</div></div>
                        </div>
                        <div style={{marginTop:5}}>
                          <div style={{height:4,borderRadius:2,background:"#2d3548",overflow:"hidden"}}>
                            <div style={{height:"100%",borderRadius:2,width:ms.wr+"%",background:"linear-gradient(90deg,"+(ms.wr>=50?G:R)+","+(ms.wr>=50?B:O)+")"}}/>
                          </div>
                        </div>
                      </div>
                      {isExp&&(
                        <div style={{marginTop:10,paddingTop:10,borderTop:"1px solid #2d3548",display:"flex",flexDirection:"column",gap:5}}>
                          {[...monthTrades].reverse().map(t=>(
                            <div key={t.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 8px",background:"#1a1f2e",borderRadius:6,borderLeft:"2px solid "+pc(t.pnl)}}>
                              <div style={{flex:1}}>
                                <div style={{fontSize:11,fontWeight:700,color:pc(t.pnl)}}>{fd(t.pnl)} <span style={{color:"#6b7280",fontWeight:400}}>· {t.contract} · {t.dir}</span></div>
                                <div style={{color:"#6b7280",fontSize:10}}>{t.date} {t.time}</div>
                              </div>
                              <button onClick={(e)=>{e.stopPropagation();setDelId(t.id);}} style={{background:"none",color:R,fontSize:14,padding:"2px 4px",opacity:0.4}}>×</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </Card>
            )}
          </div>
        )}

      </div>

      <div style={{position:"fixed",bottom:0,left:0,right:0,background:"rgba(26,31,46,0.95)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",borderTop:"1px solid #2d3548",display:"flex",zIndex:100,maxWidth:520,margin:"0 auto",paddingBottom:"env(safe-area-inset-bottom,8px)"}}>
        {NAVS.map(nav=>(
          <button key={nav.k} onClick={()=>setTab(nav.k)} style={{background:"none",color:tab===nav.k?B:"#6b7280",padding:"10px 2px 12px",fontSize:9,flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,borderBottom:tab===nav.k?"2px solid "+B:"2px solid transparent",borderRadius:0,position:"relative",fontWeight:600,letterSpacing:"0.3px"}}>
            <span style={{fontSize:17,lineHeight:"1"}}>{nav.k==="log"&&!allChecked&&!todayBlocked&&!atLimit&&!inPause?"🔒":nav.icon}</span>
            <span style={{whiteSpace:"nowrap"}}>{nav.lb.toUpperCase()}</span>
            {nav.k==="log"&&inPause&&<div style={{position:"absolute",top:6,right:"15%",width:7,height:7,borderRadius:"50%",background:Y}}/>}
            {nav.k==="check"&&allChecked&&!todayBlocked&&<div style={{position:"absolute",top:6,right:"15%",width:7,height:7,borderRadius:"50%",background:G,boxShadow:"0 0 8px rgba(0,211,149,0.6)"}}/>}
          </button>
        ))}
      </div>

      {/* SETTINGS DRAWER */}
      {settingsOpen&&<div onClick={()=>setSettingsOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:300,backdropFilter:"blur(4px)",WebkitBackdropFilter:"blur(4px)",animation:"fadeIn 0.2s ease"}}>
        <div onClick={e=>e.stopPropagation()} style={{position:"absolute",top:0,right:0,bottom:0,width:"min(360px,90vw)",background:"linear-gradient(180deg,#1a1f2e 0%,#0f1117 100%)",borderLeft:"1px solid #2d3548",overflowY:"auto",animation:"slideUp 0.3s ease",padding:"20px 18px",paddingBottom:"calc(20px + env(safe-area-inset-bottom,0px))"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
            <div style={{fontWeight:800,fontSize:20,letterSpacing:"-0.5px"}}>⚙️ Einstellungen</div>
            <button onClick={()=>setSettingsOpen(false)} style={{background:"#2d3548",borderRadius:8,width:32,height:32,padding:0,color:"#e2e8f0",fontSize:18}}>×</button>
          </div>
          
          <div style={{marginBottom:18}}>
            <div style={{color:B,fontWeight:700,fontSize:13,marginBottom:10,letterSpacing:"-0.2px"}}>🎯 Ziele</div>
            <div style={{background:"#0f1117",borderRadius:10,padding:12}}>
              <label style={{color:"#6b7280",fontSize:10,display:"block",marginBottom:4}}>MONATSZIEL (€)</label>
              <input type="number" value={settings.monthlyGoal} onChange={e=>{const newS={...settings,monthlyGoal:parseInt(e.target.value)||0};saveSettings(newS);const newG={...goals,pnl:parseInt(e.target.value)||0};setGoals(newG);localStorage.setItem("ttp_goals",JSON.stringify(newG));}} style={{fontSize:14,fontWeight:700,padding:"8px 12px"}}/>
              <div style={{color:"#6b7280",fontSize:10,marginTop:6}}>Aktuell: €{settings.monthlyGoal}/Monat = ~€{Math.round(settings.monthlyGoal/21)}/Handelstag</div>
            </div>
          </div>

          <div style={{marginBottom:18}}>
            <div style={{color:B,fontWeight:700,fontSize:13,marginBottom:10,letterSpacing:"-0.2px"}}>🛡 Trading-Regeln</div>
            <div style={{background:"#0f1117",borderRadius:10,padding:12,display:"flex",flexDirection:"column",gap:10}}>
              <div>
                <label style={{color:"#6b7280",fontSize:10,display:"block",marginBottom:4}}>MAX TRADES / TAG</label>
                <input type="number" value={settings.maxTrades} onChange={e=>saveSettings({...settings,maxTrades:parseInt(e.target.value)||2})} style={{fontSize:13,padding:"7px 10px"}}/>
              </div>
              <div>
                <label style={{color:"#6b7280",fontSize:10,display:"block",marginBottom:4}}>PFLICHTPAUSE (MIN)</label>
                <input type="number" value={settings.pauseMins} onChange={e=>saveSettings({...settings,pauseMins:parseInt(e.target.value)||15})} style={{fontSize:13,padding:"7px 10px"}}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                <div>
                  <label style={{color:"#6b7280",fontSize:10,display:"block",marginBottom:4}}>FENSTER VON</label>
                  <input type="time" value={settings.windowStart} onChange={e=>saveSettings({...settings,windowStart:e.target.value})} style={{fontSize:12,padding:"7px 10px"}}/>
                </div>
                <div>
                  <label style={{color:"#6b7280",fontSize:10,display:"block",marginBottom:4}}>FENSTER BIS</label>
                  <input type="time" value={settings.windowEnd} onChange={e=>saveSettings({...settings,windowEnd:e.target.value})} style={{fontSize:12,padding:"7px 10px"}}/>
                </div>
              </div>
              <div>
                <label style={{color:"#6b7280",fontSize:10,display:"block",marginBottom:4}}>RISIKO % / TRADE</label>
                <input type="number" step="0.5" value={settings.riskPerTradePct} onChange={e=>saveSettings({...settings,riskPerTradePct:parseFloat(e.target.value)||2})} style={{fontSize:13,padding:"7px 10px"}}/>
              </div>
            </div>
            <div style={{color:"#6b7280",fontSize:10,marginTop:6,lineHeight:1.5,paddingLeft:4}}>ℹ️ Änderungen werden gespeichert. Für die volle Wirkung App ggf. neu laden.</div>
          </div>

          <div style={{marginBottom:18}}>
            <div style={{color:B,fontWeight:700,fontSize:13,marginBottom:10,letterSpacing:"-0.2px"}}>💾 Daten</div>
            <button onClick={()=>{
              if(confirm("Alle lokalen Daten zurücksetzen? Trades, Saldo, Einstellungen werden gelöscht.")){
                localStorage.clear();
                location.reload();
              }
            }} style={{background:"rgba(239,68,68,0.1)",color:R,border:"1px solid rgba(239,68,68,0.3)",padding:"10px 14px",width:"100%",fontWeight:600,fontSize:12,borderRadius:10}}>🗑 Alle Daten löschen</button>
          </div>

          <div style={{borderTop:"1px solid #2d3548",paddingTop:12,color:"#6b7280",fontSize:10,textAlign:"center"}}>
            MindRisk v1.0 · Konto P1-235109
          </div>
        </div>
      </div>}

      {/* AI TRADING PARTNER */}
      <div style={{position:"fixed",bottom:80,right:16,zIndex:200}}>
        {!aiOpen&&(
          <button onClick={()=>{setAiOpen(true);if(aiMessages.length===0){const r=smartCoach("hallo","");setAiMessages([{role:"assistant",content:r}]);}}} 
            style={{width:52,height:52,borderRadius:"50%",background:"linear-gradient(135deg,#6366f1,#a855f7)",border:"none",fontSize:22,boxShadow:"0 4px 20px #6366f144",display:"flex",alignItems:"center",justifyContent:"center"}}>
            🤖
          </button>
        )}
        {aiOpen&&(
          <div style={{width:320,maxWidth:"calc(100vw - 32px)",background:"#1a1f2e",border:"1px solid #6366f1",borderRadius:16,boxShadow:"0 8px 32px #0008",display:"flex",flexDirection:"column",maxHeight:420}}>
            <div style={{padding:"12px 16px",borderBottom:"1px solid #2d3548",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <span style={{fontSize:18}}>🤖</span>
                <div>
                  <div style={{fontWeight:700,fontSize:13,color:B}}>MindRisk Coach</div>
                  <div style={{color:"#6b7280",fontSize:10}}>Dein Trading Partner</div>
                </div>
              </div>
              <button onClick={()=>setAiOpen(false)} style={{background:"none",color:"#6b7280",fontSize:18,padding:"2px 6px"}}>×</button>
            </div>
            <div style={{flex:1,overflow:"auto",padding:12,display:"flex",flexDirection:"column",gap:8,minHeight:120}}>
              {aiMessages.length===0&&!aiLoading&&(
                <div style={{color:"#6b7280",fontSize:12,textAlign:"center",padding:16}}>Tippe eine Frage oder warte auf automatische Analyse...</div>
              )}
              {aiMessages.map((m,i)=>(
                <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
                  <div style={{maxWidth:"85%",padding:"8px 12px",borderRadius:12,background:m.role==="user"?B+"33":"#0f1117",border:"1px solid "+(m.role==="user"?B+"44":"#2d3548"),fontSize:12,color:m.role==="user"?"#c7d2fe":"#e2e8f0",lineHeight:1.4}}>
                    {m.content}
                  </div>
                </div>
              ))}
              {aiLoading&&(
                <div style={{display:"flex",gap:4,padding:8}}>
                  <div style={{width:6,height:6,borderRadius:"50%",background:B,animation:"pulse 1s infinite"}}/>
                  <div style={{width:6,height:6,borderRadius:"50%",background:B,animation:"pulse 1s infinite 0.2s"}}/>
                  <div style={{width:6,height:6,borderRadius:"50%",background:B,animation:"pulse 1s infinite 0.4s"}}/>
                </div>
              )}
            </div>
            <div style={{padding:"8px 12px",borderTop:"1px solid #2d3548",display:"flex",gap:8}}>
              <input value={aiInput} onChange={e=>setAiInput(e.target.value)} 
                onKeyDown={e=>e.key==="Enter"&&sendAiMessage()}
                placeholder="Frag deinen Trading Coach..." 
                style={{flex:1,fontSize:12,padding:"6px 10px",borderRadius:8}}/>
              <button onClick={sendAiMessage} disabled={aiLoading||!aiInput.trim()} 
                style={{background:B,color:"#fff",padding:"6px 12px",borderRadius:8,fontSize:12,fontWeight:700,opacity:aiLoading||!aiInput.trim()?0.5:1}}>→</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
