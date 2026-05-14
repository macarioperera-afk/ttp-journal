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
  const[trades,setTrades]=useState(SEED);
  const[tab,setTab]=useState("dash");
  const[toast,setToast]=useState("");
  const[delId,setDelId]=useState(null);
  const[checks,setChecks]=useState({c1:false,c2:false,c3:false,c4:false});
  const[form,setForm]=useState(emptyForm());
  const[goals,setGoals]=useState({pnl:300,disc:80});
  const[journal,setJournal]=useState({});
  const[todayJ,setTodayJ]=useState({good:"",bad:"",emotion:""});
  const[ttpDD,setTtpDD]=useState(781.88);
  const[saldo,setSaldo]=useState(50288.92);
  const[lastTradeAt,setLastTradeAt]=useState(null);
  const[tick,setTick]=useState(0);

  useEffect(()=>{
    const id=setInterval(()=>setTick(t=>t+1),1000);
    return()=>clearInterval(id);
  },[]);

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
  const netPnl=Math.round((saldo-50000)*100)/100;
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

  const addTrade=()=>{
    if(!form.pnl){showToast("Bitte P&L eingeben");return;}
    const v=parseFloat(form.pnl);
    if(isNaN(v)){showToast("P&L muss eine Zahl sein");return;}
    setTrades(p=>[...p,{id:uid(),acct:"09",contract:form.contract,date:form.date,time:form.time,pnl:v,dur:0,dir:form.dir,setup:form.setup,notes:form.notes,rules:{...form.rules}}]);
    setLastTradeAt(new Date());
    setForm(emptyForm());
    showToast("Gespeichert! 15-Min Pause startet...");
    setTab("dash");
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
  const NAVS=[{k:"dash",icon:"📊",lb:"Dashboard"},{k:"check",icon:"✅",lb:"Pre-Trade"},{k:"log",icon:"➕",lb:"Eintragen"},{k:"analyse",icon:"📈",lb:"Analyse"},{k:"hist",icon:"📋",lb:"History"}];

  return(
    <div style={{background:"#0f1117",minHeight:"100vh",color:"#e2e8f0",fontFamily:"-apple-system,BlinkMacSystemFont,sans-serif",fontSize:14,paddingBottom:80}}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}html,body{overflow-x:hidden;max-width:100%}input,select,textarea{background:#1a1f2e;color:#e2e8f0;border:1px solid #2d3548;border-radius:8px;padding:9px 12px;font-family:inherit;font-size:13px;outline:none;width:100%;max-width:100%}input:focus,select:focus,textarea:focus{border-color:#6366f1}select option{background:#1a1f2e}button{cursor:pointer;font-family:inherit;border:none;border-radius:8px}`}</style>

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

      <div style={{background:"#1a1f2e",borderBottom:"1px solid #2d3548",padding:"12px 16px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
          <div>
            <div style={{fontWeight:800,fontSize:20}}><span style={{color:B}}>TTP</span> Journal</div>
            <div style={{color:"#6b7280",fontSize:10,marginTop:1}}>Jeronimo – Konto 09</div>
          </div>
          <div style={{background:B+"22",border:"1px solid "+B,borderRadius:20,padding:"6px 14px",fontWeight:700,fontSize:12,color:B}}>P1-235109</div>
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

      <div style={{padding:14,maxWidth:520,margin:"0 auto"}}>

        {tab==="dash"&&(
          <div style={{display:"flex",flexDirection:"column",gap:12}}>

            {inPause&&<div style={{background:"#1a0a00",border:"2px solid "+Y,borderRadius:10,padding:"10px 14px",display:"flex",gap:12,alignItems:"center"}}>
              <span style={{fontSize:22}}>⏸</span>
              <div style={{flex:1}}>
                <div style={{color:Y,fontWeight:800,fontSize:13}}>Pflichtpause – {PAUSE_MINS} Min nach Trade</div>
                <div style={{color:Y,fontWeight:800,fontSize:34,lineHeight:1,letterSpacing:2}}>{pStr}</div>
                <div style={{color:"#fbbf24",fontSize:11,marginTop:2}}>Kein Impuls-Trade – warte den Timer ab</div>
              </div>
            </div>}

            {todayBlocked&&!inPause&&<div style={{background:R+"22",border:"1px solid "+R,borderRadius:10,padding:"10px 14px",display:"flex",gap:10,alignItems:"center"}}>
              <span style={{fontSize:18}}>🚫</span>
              <div><div style={{color:R,fontWeight:800,fontSize:13}}>Heute gesperrt (Overtrading gestern)</div><div style={{color:"#fca5a5",fontSize:11,marginTop:1}}>Morgen wieder. Heute: analysieren statt traden.</div></div>
            </div>}

            {overtradingToday&&!todayBlocked&&<div style={{background:R+"22",border:"1px solid "+R,borderRadius:10,padding:"10px 14px",display:"flex",gap:10,alignItems:"center"}}>
              <span style={{fontSize:18}}>🚫</span>
              <div><div style={{color:R,fontWeight:800,fontSize:13}}>3 Trades – Morgen gesperrt!</div><div style={{color:"#fca5a5",fontSize:11,marginTop:1}}>Grenze überschritten. Rechner aus.</div></div>
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
                  <span style={{color:"#6b7280",fontSize:10}}>Heute verloren</span>
                  <span style={{color:dpD>75?R:G,fontWeight:700,fontSize:10}}>{fs(todPnl)} / $1.000</span>
                </div>
                <Bar2 pct={dpD} color={dpD>75?R:dpD>50?Y:G}/>
              </div>
              <div style={{marginTop:10,paddingTop:10,borderTop:"1px solid #2d3548",display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                <div>
                  <div style={{color:"#6b7280",fontSize:10,marginBottom:3}}>Saldo (aus TTP):</div>
                  <input type="number" step="0.01" defaultValue={saldo} onBlur={e=>{const v=parseFloat(e.target.value);if(!isNaN(v))setSaldo(v);}} style={{fontSize:12,padding:"5px 8px"}}/>
                </div>
                <div>
                  <div style={{color:"#6b7280",fontSize:10,marginBottom:3}}>Max DD genutzt ($):</div>
                  <input type="number" step="0.01" defaultValue={ttpDD} onBlur={e=>{const v=parseFloat(e.target.value);if(!isNaN(v))setTtpDD(v);}} style={{fontSize:12,padding:"5px 8px"}}/>
                </div>
              </div>
              <div style={{marginTop:8,background:"#0a160f",borderRadius:8,padding:"8px 10px",border:"1px solid "+G+"33"}}>
                <div style={{color:G,fontSize:11,fontWeight:700,marginBottom:4}}>Empfohlen bei $"+kontoabstand.toFixed(0)+" Kontoabstand:</div>
                <div style={{display:"flex",gap:12,fontSize:12}}>
                  <span style={{color:R}}>Max/Trade: <strong>${Math.round(kontoabstand*0.02)}</strong></span>
                  <span style={{color:Y}}>MNQ Ticks: <strong>{Math.round(kontoabstand*0.02/0.5)}</strong></span>
                  <span style={{color:G}}>Max/Tag: <strong>${Math.round(kontoabstand*0.04)}</strong></span>
                </div>
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
              <div style={{fontWeight:700,fontSize:15,marginBottom:12}}>Pre-Trade Checkliste</div>
              {[{id:"c1",q:"Geplantes Setup – kein Impuls?"},{id:"c2",q:"SL und TP definiert?"},{id:"c3",q:"Emotional ruhig und klar?"},{id:"c4",q:"Nach 16:15 Uhr?"}].map(it=>(
                <Chk key={it.id} checked={checks[it.id]} onClick={()=>setChecks(p=>({...p,[it.id]:!p[it.id]}))} label={it.q}/>
              ))}
              <div style={{marginTop:12,background:allChecked?G+"22":R+"11",border:"1px solid "+(allChecked?G:R)+"44",borderRadius:10,padding:12,textAlign:"center"}}>
                {allChecked?<div><div style={{color:G,fontWeight:800,fontSize:17}}>GRUENES LICHT</div><div style={{color:"#6b7280",fontSize:11,marginTop:3}}>1 MNQ | SL {Math.round(kontoabstand*0.02/0.5)} Ticks (${Math.round(kontoabstand*0.02)}) | TP {Math.round(kontoabstand*0.04/0.5)} Ticks</div></div>
                :<div style={{color:R,fontWeight:700,fontSize:15}}>Noch nicht bereit</div>}
              </div>
              <button onClick={()=>setChecks({c1:false,c2:false,c3:false,c4:false})} style={{background:"none",color:"#6b7280",fontSize:12,padding:"7px 0",width:"100%",marginTop:6}}>Zuruecksetzen</button>
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
            {(inPause||todayBlocked||atLimit)&&(
              <div style={{background:inPause?"#1a0a00":R+"22",border:"2px solid "+(inPause?Y:R),borderRadius:12,padding:14,marginBottom:12,textAlign:"center"}}>
                {inPause&&<><div style={{color:Y,fontWeight:800,fontSize:15,marginBottom:2}}>⏸ Pflichtpause</div><div style={{color:Y,fontWeight:800,fontSize:42,letterSpacing:2}}>{pStr}</div><div style={{color:"#fbbf24",fontSize:12,marginTop:3}}>Warte bis der Countdown ablaeuft</div></>}
                {!inPause&&todayBlocked&&<div style={{color:R,fontWeight:800}}>🚫 Heute gesperrt</div>}
                {!inPause&&!todayBlocked&&overtradingToday&&<div style={{color:R,fontWeight:800}}>🚫 3 Trades – Morgen gesperrt</div>}
                {!inPause&&!todayBlocked&&!overtradingToday&&atLimit&&<div style={{color:O,fontWeight:800}}>🛑 Tageslimit {DAILY_LIMIT} Trades – kein 3. Trade!</div>}
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
                  {inPause?"⏸ Warten... "+pStr:todayBlocked?"Heute gesperrt":overtradingToday?"3 Trades – Gesperrt":atLimit?"Limit ("+DAILY_LIMIT+" Trades)":"Trade speichern – Timer startet!"}
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
              <button onClick={()=>{setJournal(p=>({...p,[todayISO()]:{...todayJ}}));showToast("Reflexion gespeichert!");}} style={{background:P,color:"#fff",padding:11,width:"100%",fontWeight:700,borderRadius:8}}>Speichern</button>
            </Card>
          </div>
        )}

        {tab==="hist"&&(
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            <div style={{color:"#6b7280",fontSize:12,marginBottom:2}}>{t09.length} Trades – Regelquote: {disc}%</div>
            {[...t09].reverse().map(t=>{
              const rv=t.rules||{},kk=Object.keys(rv);
              const rs=kk.length?Math.round(kk.filter(k=>rv[k]).length/kk.length*100):0;
              const dayN=t09.filter(x=>x.date===t.date).length;
              return(
                <Card key={t.id} style={{borderLeft:"3px solid "+pc(t.pnl)}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div>
                      <div style={{display:"flex",gap:5,alignItems:"center",marginBottom:3,flexWrap:"wrap"}}>
                        <span style={{fontWeight:700,color:pc(t.pnl),fontSize:16}}>{fd(t.pnl)}</span>
                        <Pill bg={B+"22"} color={B}>{t.contract}</Pill>
                        <Pill bg={(t.dir==="LONG"?G:R)+"22"} color={t.dir==="LONG"?G:R}>{t.dir}</Pill>
                        {dayN>=OVERTRADING_AT&&<Pill bg={O+"22"} color={O}>OT</Pill>}
                      </div>
                      <div style={{color:"#6b7280",fontSize:11}}>{t.date} {t.time} – {t.setup}</div>
                      {t.notes&&<div style={{color:"#94a3b8",fontSize:11,marginTop:3}}>{t.notes}</div>}
                    </div>
                    <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                      <Pill bg={(rs>=80?G:rs>=60?Y:R)+"22"} color={rs>=80?G:rs>=60?Y:R}>{rs}%</Pill>
                      <button onClick={()=>setDelId(t.id)} style={{background:"none",color:R,fontSize:18,padding:"2px 4px",opacity:0.6}}>×</button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

      </div>

      <div style={{position:"fixed",bottom:0,left:0,right:0,background:"#1a1f2e",borderTop:"1px solid #2d3548",display:"flex",zIndex:100,maxWidth:520,margin:"0 auto"}}>
        {NAVS.map(nav=>(
          <button key={nav.k} onClick={()=>setTab(nav.k)} style={{background:"none",color:tab===nav.k?B:"#6b7280",padding:"8px 0 10px",fontSize:10,flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,borderBottom:tab===nav.k?"2px solid "+B:"2px solid transparent",borderRadius:0,position:"relative"}}>
            <span style={{fontSize:18}}>{nav.icon}</span>
            {nav.lb.toUpperCase()}
            {nav.k==="log"&&inPause&&<div style={{position:"absolute",top:4,right:"12%",width:7,height:7,borderRadius:"50%",background:Y}}/>}
          </button>
        ))}
      </div>
    </div>
  );
}
