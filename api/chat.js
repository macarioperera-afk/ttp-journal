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

          {/* SCHNELL-STATS */}
          {(()=>{
            const wins=t09.filter(t=>t.pnl>0);
            const losses=t09.filter(t=>t.pnl<0);
            const avgW=wins.length?Math.round(wins.reduce((s,t)=>s+t.pnl,0)/wins.length):0;
            const avgL=losses.length?Math.round(Math.abs(losses.reduce((s,t)=>s+t.pnl,0)/losses.length)):0;
            const pf=avgL>0?(avgW*wins.length)/(avgL*losses.length):0;
            return(
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:6}}>
                {[{l:"TRADES",v:t09.length,c:B},{l:"Ø WIN",v:"+$"+avgW,c:G},{l:"Ø LOSS",v:"-$"+avgL,c:R},{l:"PROFIT F.",v:pf.toFixed(1)+"x",c:pf>=1?G:R}].map(s=>(
                  <div key={s.l} style={{background:"#1a1f2e",border:"1px solid #2d3548",borderRadius:10,padding:"10px 8px",textAlign:"center"}}>
                    <div style={{color:"#4b5563",fontSize:8,marginBottom:3}}>{s.l}</div>
                    <div style={{color:s.c,fontWeight:800,fontSize:13}}>{s.v}</div>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* EQUITY KURVE */}
          <Card>
            <div style={{fontWeight:700,marginBottom:10,fontSize:14,color:"#e2e8f0"}}>Equity Kurve</div>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={equity}>
                <XAxis dataKey="i" tick={{fill:"#4b5563",fontSize:9}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:"#4b5563",fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>"$"+v} width={55}/>
                <Tooltip formatter={v=>[fd(v),"Kumuliert"]} contentStyle={{background:"#1a1f2e",border:"1px solid #2d3548",borderRadius:8,fontSize:11}}/>
                <ReferenceLine y={0} stroke="#2d3548" strokeDasharray="4 4"/>
                <Line type="monotone" dataKey="v" stroke={B} strokeWidth={2} dot={false}/>
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* STUNDEN-PERFORMANCE */}
          {(()=>{
            const hours={};
            t09.forEach(t=>{const h=parseInt(t.time.split(":")[0]);if(!hours[h])hours[h]={n:0,wins:0,pnl:0};hours[h].n++;hours[h].pnl+=t.pnl;if(t.pnl>0)hours[h].wins++;});
            const sorted=Object.entries(hours).sort(([a],[b])=>parseInt(a)-parseInt(b));
            return sorted.length>0&&(
              <Card>
                <div style={{fontWeight:700,marginBottom:10,fontSize:14,color:"#e2e8f0"}}>Stunden-Performance</div>
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {sorted.map(([h,d])=>{
                    const wr=Math.round(d.wins/d.n*100);
                    const c=wr>=60?G:wr>=40?Y:R;
                    const isWindow=parseInt(h)>=16&&parseInt(h)<=17;
                    return(
                      <div key={h} style={{display:"flex",alignItems:"center",gap:8}}>
                        <div style={{color:isWindow?G:"#6b7280",fontSize:11,fontWeight:isWindow?700:400,width:36,flexShrink:0}}>{h}:00{isWindow&&" ⚡"}</div>
                        <div style={{flex:1,height:20,background:"#0f1117",borderRadius:4,overflow:"hidden",position:"relative"}}>
                          <div style={{height:"100%",width:wr+"%",background:c+"44",borderRadius:4}}/>
                          <div style={{position:"absolute",top:0,left:4,right:0,height:"100%",display:"flex",alignItems:"center"}}>
                            <span style={{color:c,fontSize:10,fontWeight:700}}>{wr}% WR</span>
                            <span style={{color:"#4b5563",fontSize:10,marginLeft:6}}>{d.n} Trades · {d.pnl>=0?"+":""}${Math.round(d.pnl)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })()}

          {/* SETUP-PERFORMANCE */}
          {(()=>{
            const setups={};
            t09.forEach(t=>{const s=t.setup||"Unbekannt";if(!setups[s])setups[s]={n:0,wins:0,pnl:0};setups[s].n++;setups[s].pnl+=t.pnl;if(t.pnl>0)setups[s].wins++;});
            const sorted=Object.entries(setups).sort(([,a],[,b])=>b.pnl-a.pnl);
            return sorted.length>0&&(
              <Card>
                <div style={{fontWeight:700,marginBottom:10,fontSize:14,color:"#e2e8f0"}}>Setup-Performance</div>
                {sorted.map(([name,d])=>{
                  const wr=Math.round(d.wins/d.n*100);
                  const c=wr>=60?G:wr>=40?Y:R;
                  return(
                    <div key={name} style={{marginBottom:8,padding:"8px 10px",background:"#0f1117",borderRadius:8,borderLeft:"3px solid "+c}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                        <div style={{fontSize:11,fontWeight:700,color:"#e2e8f0"}}>{name}</div>
                        <div style={{color:pc(d.pnl),fontWeight:800,fontSize:12}}>{d.pnl>=0?"+":""}${Math.round(d.pnl)}</div>
                      </div>
                      <div style={{display:"flex",gap:12}}>
                        <span style={{color:c,fontSize:10,fontWeight:700}}>{wr}% WR</span>
                        <span style={{color:"#4b5563",fontSize:10}}>{d.n} Trades</span>
                        <span style={{color:"#4b5563",fontSize:10}}>Ø {d.wins} TP / {d.n-d.wins} SL</span>
                      </div>
                    </div>
                  );
                })}
              </Card>
            );
          })()}

          {/* STREAK + PSYCHOLOGIE */}
          {(()=>{
            let curStreak=0,maxWin=0,maxLoss=0,cur=0;
            t09.forEach(t=>{if(t.pnl>0){cur=cur>0?cur+1:1;maxWin=Math.max(maxWin,cur);}else{cur=cur<0?cur-1:-1;maxLoss=Math.min(maxLoss,cur);}});
            curStreak=cur;
            const discHistory=t09.slice(-20).map((t,i)=>{const rv=t.rules||{};const kk=Object.keys(rv);return kk.length?Math.round(kk.filter(k=>rv[k]).length/kk.length*100):50;});
            const avgDisc=discHistory.length?Math.round(discHistory.reduce((s,v)=>s+v,0)/discHistory.length):0;
            return(
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <Card>
                  <div style={{fontWeight:700,fontSize:13,marginBottom:10,color:"#e2e8f0"}}>Streak-Analyse</div>
                  {[{l:"Aktuell",v:curStreak>0?"+"+curStreak+" Siege":curStreak<0?Math.abs(curStreak)+" Verluste":"Neutral",c:curStreak>0?G:curStreak<0?R:Y},
                    {l:"Best. Siegesserie",v:maxWin+" Trades",c:G},
                    {l:"Schlechteste Serie",v:Math.abs(maxLoss)+" Verluste",c:R},
                  ].map(s=>(
                    <div key={s.l} style={{marginBottom:6}}>
                      <div style={{color:"#4b5563",fontSize:9}}>{s.l}</div>
                      <div style={{color:s.c,fontWeight:800,fontSize:14}}>{s.v}</div>
                    </div>
                  ))}
                </Card>
                <Card>
                  <div style={{fontWeight:700,fontSize:13,marginBottom:10,color:"#e2e8f0"}}>Mentaler Score</div>
                  {[{l:"Regelquote Ø",v:avgDisc+"%",c:sc(avgDisc)},
                    {l:"Disziplin-Trend",v:disc>avgDisc?"↗ Im Aufbau":disc<avgDisc?"↘ Ausbaufähig":"→ Konstant",c:disc>=avgDisc?G:Y},
                    {l:"Overtrading-Tage",v:profitPlan?profitPlan.overtradeDays+"T":"–",c:profitPlan&&profitPlan.overtradeDays>3?R:G},
                  ].map(s=>(
                    <div key={s.l} style={{marginBottom:6}}>
                      <div style={{color:"#4b5563",fontSize:9}}>{s.l}</div>
                      <div style={{color:s.c,fontWeight:800,fontSize:14}}>{s.v}</div>
                    </div>
                  ))}
                </Card>
              </div>
            );
          })()}

          {/* BESTE HANDELSTAGE */}
          <Card>
            <div style={{fontWeight:700,marginBottom:8,fontSize:14,color:"#e2e8f0"}}>Handelstage nach Wochentag</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:5}}>
              {weekdayStats.map(d=>{
                const c=d.pct>=60?G:d.pct>=40?Y:R;
                return(
                  <div key={d.label} style={{background:"#0f1117",borderRadius:8,padding:"8px 4px",textAlign:"center",border:"1px solid "+(d.days>0?c+"33":"#2d3548")}}>
                    <div style={{fontWeight:700,fontSize:13,marginBottom:2,color:d.days>0?c:"#374151"}}>{d.label}</div>
                    {d.days>0?(<>
                      <div style={{color:c,fontWeight:800,fontSize:16}}>{d.pct}%</div>
                      <div style={{color:pc(d.pnl),fontSize:10,fontWeight:600}}>{d.pnl>=0?"+":"-"}${Math.abs(d.pnl).toFixed(0)}</div>
                      <div style={{color:"#374151",fontSize:8}}>{d.days}T</div>
                    </>):<div style={{color:"#374151",fontSize:10,marginTop:6}}>–</div>}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* HALTEDAUER */}
          <Card>
            <div style={{fontWeight:700,marginBottom:8,fontSize:14,color:"#e2e8f0"}}>Haltedauer</div>
            {durBuckets.map(b=>(
              <div key={b.label} style={{marginBottom:8,display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:52,color:"#6b7280",fontSize:11,flexShrink:0}}>{b.label}</div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                    <span style={{color:"#4b5563",fontSize:9}}>{b.n} Trades</span>
                    <span style={{color:sc(b.wr),fontSize:9,fontWeight:700}}>{b.wr}% · {b.pnl>=0?"+":""}${Math.round(b.pnl)}</span>
                  </div>
                  <Bar2 pct={b.wr} color={sc(b.wr)}/>
                </div>
              </div>
            ))}
          </Card>

          {/* PSYCHOLOGIE JOURNAL */}
          <Card style={{borderColor:P+"33"}}>
            <div style={{fontWeight:700,marginBottom:10,fontSize:14,color:"#e2e8f0"}}>Tages-Reflexion</div>
            {[{id:"good",label:"Was lief gut?",p:"Setup, Disziplin..."},{id:"bad",label:"Was verbessern?",p:"Impuls, zu früh..."},{id:"emotion",label:"Emotionaler Zustand?",p:"Ruhig, fokussiert..."}].map(q=>(
              <div key={q.id} style={{marginBottom:8}}>
                <label style={{color:"#6b7280",fontSize:10,display:"block",marginBottom:3}}>{q.label}</label>
                <textarea rows={2} value={todayJ[q.id]||""} onChange={e=>setTodayJ(p=>({...p,[q.id]:e.target.value}))} placeholder={q.p} style={{resize:"vertical"}}/>
              </div>
            ))}
            <button onClick={()=>{const u={...journal,[todayISO()]:{...todayJ}};setJournal(u);localStorage.setItem("ttp_journal",JSON.stringify(u));showToast("Reflexion gespeichert!");}} style={{background:P,color:"#fff",padding:10,width:"100%",fontWeight:700,borderRadius:10,fontSize:13}}>Speichern</button>
          </Card>
        </div>}

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
            <div>
              <div style={{fontWeight:800,fontSize:20,color:"#e2e8f0"}}>Einstellungen</div>
              <div style={{color:"#6366f1",fontSize:10,fontWeight:600,letterSpacing:"0.5px"}}>MINDRISK KONFIGURATION</div>
            </div>
            <button onClick={()=>setSettingsOpen(false)} style={{background:"rgba(255,255,255,0.05)",border:"1px solid #2d3548",borderRadius:10,width:34,height:34,padding:0,color:"#6b7280",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          {/* ZIELE – ACCORDION */}
          {[
            {id:"goals",label:"Meine Ziele",sub:"Monatsziel, 3M, 6M"},
            {id:"rules",label:"Trading Regeln",sub:"Limits, Zeiten, Pause"},
            {id:"coach",label:"Coach Profil",sub:"Wer du bist & KI-Gedächtnis"},
            {id:"data",label:"Daten",sub:"Reset & Verwaltung"},
          ].map(sec=>(
            <div key={sec.id} style={{marginBottom:6,borderRadius:12,border:"1px solid #2d3548",overflow:"hidden"}}>
              <div onClick={()=>setSettingsSection(p=>p===sec.id?null:sec.id)}
                style={{padding:"12px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",background:settingsSection===sec.id?"rgba(99,102,241,0.08)":"transparent"}}>
                <div>
                  <div style={{fontWeight:700,fontSize:13,color:"#e2e8f0"}}>{sec.label}</div>
                  <div style={{color:"#4b5563",fontSize:10}}>{sec.sub}</div>
                </div>
                <div style={{color:settingsSection===sec.id?B:"#4b5563",fontSize:12,fontWeight:700,transform:settingsSection===sec.id?"rotate(180deg)":"none",transition:"transform .2s"}}>▼</div>
              </div>

              {settingsSection==="goals"&&sec.id==="goals"&&<div style={{padding:"12px 14px",borderTop:"1px solid #2d3548",background:"#0f1117"}}>
                <div style={{marginBottom:12}}>
                  <div style={{color:"#6b7280",fontSize:10,fontWeight:600,marginBottom:6}}>ZIEL-ZEITRAUM</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
                    {[{k:"month",l:"Monat"},{k:"3m",l:"3 Monate"},{k:"6m",l:"6 Monate"}].map(p=>(
                      <button key={p.k} onClick={()=>setGoalPeriod(p.k)} style={{background:goalPeriod===p.k?B+"33":"#1a1f2e",border:"1px solid "+(goalPeriod===p.k?B:"#2d3548"),color:goalPeriod===p.k?B:"#6b7280",padding:"7px 4px",borderRadius:8,fontSize:11,fontWeight:600}}>{p.l}</button>
                    ))}
                  </div>
                </div>
                <Field label="ZIEL-SALDO ($)">
                  <input type="number" defaultValue={goals.targetBalance} onBlur={e=>{const v=parseFloat(e.target.value);if(!isNaN(v)){const newG={...goals,targetBalance:v};setGoals(newG);localStorage.setItem('ttp_goals',JSON.stringify(newG));} }} style={{background:"transparent",border:"none",padding:"2px 0",fontSize:14,fontWeight:700,color:"#e2e8f0",width:"100%",outline:"none"}}/>
                </Field>
                <div style={{marginTop:8,background:"rgba(99,102,241,0.08)",borderRadius:8,padding:"8px 10px",border:"1px solid rgba(99,102,241,0.15)"}}>
                  <div style={{color:"#6b7280",fontSize:10}}>Aktuell: <span style={{color:"#e2e8f0",fontWeight:700}}>${saldo.toFixed(0)}</span> · Noch fehlen: <span style={{color:R,fontWeight:700}}>${Math.max(0,goals.targetBalance-saldo).toFixed(0)}</span></div>
                </div>
                <div style={{marginTop:8}}>
                  <Field label="REGELQUOTE-ZIEL (%)">
                    <input type="number" defaultValue={goals.disc} onBlur={e=>{const v=parseInt(e.target.value);if(!isNaN(v)){const newG={...goals,disc:v};setGoals(newG);localStorage.setItem('ttp_goals',JSON.stringify(newG));}}} style={{background:"transparent",border:"none",padding:"2px 0",fontSize:14,fontWeight:700,color:"#e2e8f0",width:"100%",outline:"none"}}/>
                  </Field>
                </div>
              </div>}

              {settingsSection==="rules"&&sec.id==="rules"&&<div style={{padding:"12px 14px",borderTop:"1px solid #2d3548",background:"#0f1117",display:"flex",flexDirection:"column",gap:10}}>
                <Field label="MAX TRADES / TAG"><input type="number" value={settings.maxTrades} onChange={e=>saveSettings({...settings,maxTrades:parseInt(e.target.value)||2})} style={{background:"transparent",border:"none",padding:"2px 0",fontSize:14,fontWeight:700,color:"#e2e8f0",width:"100%",outline:"none"}}/></Field>
                <Field label="PFLICHTPAUSE (MIN)"><input type="number" value={settings.pauseMins} onChange={e=>saveSettings({...settings,pauseMins:parseInt(e.target.value)||15})} style={{background:"transparent",border:"none",padding:"2px 0",fontSize:14,fontWeight:700,color:"#e2e8f0",width:"100%",outline:"none"}}/></Field>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <Field label="FENSTER VON"><input type="time" value={settings.windowStart} onChange={e=>saveSettings({...settings,windowStart:e.target.value})} style={{background:"transparent",border:"none",padding:"2px 0",fontSize:13,color:"#e2e8f0",width:"100%",outline:"none"}}/></Field>
                  <Field label="FENSTER BIS"><input type="time" value={settings.windowEnd} onChange={e=>saveSettings({...settings,windowEnd:e.target.value})} style={{background:"transparent",border:"none",padding:"2px 0",fontSize:13,color:"#e2e8f0",width:"100%",outline:"none"}}/></Field>
                </div>
              </div>}

              {settingsSection==="coach"&&sec.id==="coach"&&<div style={{padding:"12px 14px",borderTop:"1px solid #2d3548",background:"#0f1117"}}>
                <div style={{color:"#6b7280",fontSize:10,marginBottom:6}}>KI liest das bei JEDER Antwort:</div>
                <textarea rows={5} value={coachProfile} onChange={e=>{setCoachProfile(e.target.value);localStorage.setItem('ttp_coach_profile',e.target.value);}}
                  placeholder="Ich bin Jeronimo. Ich trade MNQ/NQ bei TTP. Mein Problem ist Overtrading nach Verlusten..."
                  style={{resize:"vertical",fontSize:11,lineHeight:1.5,width:"100%",marginBottom:8}}/>
                <div style={{color:G,fontSize:9,marginBottom:10}}>Schreib auch Psychologie, Schwächen, Ziele</div>
                {coachMemory.length>0&&<div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                    <div style={{color:"#6b7280",fontSize:10,fontWeight:600}}>GEDÄCHTNIS ({coachMemory.length} Einträge)</div>
                    <button onClick={()=>{if(confirm("Löschen?")){setCoachMemory([]);localStorage.removeItem('ttp_coach_memory');}}} style={{background:"none",color:R,fontSize:10,padding:0}}>löschen</button>
                  </div>
                  {coachMemory.slice(0,4).map((m,i)=>(
                    <div key={i} style={{fontSize:10,color:"#94a3b8",padding:"3px 0",borderBottom:"1px solid #2d3548"}}>
                      <span style={{color:"#4b5563",fontSize:9}}>{m.date}: </span>{m.note.slice(0,70)}
                    </div>
                  ))}
                </div>}
              </div>}

              {settingsSection==="data"&&sec.id==="data"&&<div style={{padding:"12px 14px",borderTop:"1px solid #2d3548",background:"#0f1117"}}>
                <Field label="SALDO ($)">
                  <input type="number" step="0.01" defaultValue={saldo} onBlur={e=>{const v=parseFloat(e.target.value);if(!isNaN(v)){setSaldo(v);localStorage.setItem("ttp_saldo",v);}}} style={{background:"transparent",border:"none",padding:"2px 0",fontSize:14,fontWeight:700,color:"#e2e8f0",width:"100%",outline:"none"}}/>
                </Field>
                <div style={{marginTop:8}}>
                  <Field label="MAX DD LEVEL ($)">
                    <input type="number" step="0.01" defaultValue={maxDDLevel} onBlur={e=>{const v=parseFloat(e.target.value);if(!isNaN(v)){setMaxDDLevel(v);localStorage.setItem("ttp_maxdd_level",v);}}} style={{background:"transparent",border:"none",padding:"2px 0",fontSize:14,fontWeight:700,color:"#e2e8f0",width:"100%",outline:"none"}}/>
                  </Field>
                </div>
                <button onClick={()=>{if(window.confirm("Alle Daten loeschen?")){{localStorage.clear();window.location.reload();}}}} style={{marginTop:12,background:"rgba(239,68,68,0.08)",color:R,border:"1px solid rgba(239,68,68,0.2)",padding:"10px 14px",width:"100%",fontWeight:600,fontSize:12,borderRadius:10}}>Alle Daten löschen</button>
              </div>}
            </div>
          ))}
          <div style={{paddingTop:12,color:"#374151",fontSize:10,textAlign:"center"}}>MindRisk v2.0 · Claude AI ✅</div>
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
          <div style={{width:320,maxWidth:"calc(100vw - 32px)",background:"#1a1f2e",border:"1px solid #6366f1",borderRadius:16,boxShadow:"0 8px 32px rgba(99,102,241,0.3)",display:"flex",flexDirection:"column",maxHeight:"70vh"}}>
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
              <div ref={aiMessagesEndRef}/>
            </div>
            <div style={{padding:"6px 12px",borderTop:"1px solid #2d3548",display:"flex",gap:6,flexWrap:"wrap"}}>
              <button onClick={()=>triggerAiPopup("daily_motivation")} style={{background:"rgba(0,211,149,0.15)",color:G,fontSize:10,padding:"4px 10px",borderRadius:20,border:"1px solid "+G+"44",fontWeight:700}}>☀️ Tages-Briefing</button>
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
              <textarea value={aiInput} onChange={e=>setAiInput(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&(e.preventDefault(),sendAiMessage())}
                placeholder={isRecording?"🎤 Höre zu...":"Frag deinen Coach..."}
                rows={2}
                style={{flex:1,fontSize:13,padding:"10px 14px",borderRadius:16,background:"#0f1117",border:"1px solid #2d3548",resize:"none",lineHeight:1.4,maxHeight:80,overflowY:"auto",color:"#e2e8f0",fontFamily:"inherit"}}/>
              <button id="aiSendBtn" onClick={sendAiMessage} disabled={aiLoading||(!aiInput.trim()&&!aiImage)}
                style={{background:"linear-gradient(135deg,"+B+","+P+")",color:"#fff",padding:"8px 12px",borderRadius:20,fontSize:14,fontWeight:700,opacity:aiLoading||(!aiInput.trim()&&!aiImage)?0.4:1,flexShrink:0}}>→</button>
            </div>
            </>
          </div>
        )}
      </div>
    </div>
  );
}
