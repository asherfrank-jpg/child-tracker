import { useState, useRef, useEffect } from "react";
import { useAuth, useChildProfile, useMedications, useTemperature } from "./firebase-hooks";
import { initPushNotifications } from "./firebase-config";
// ─────────────────────────────────────────
// THEME & CONSTANTS
// ─────────────────────────────────────────
const T = {
  bg: "#F7F4EF", card: "#FFFFFF", primary: "#2D6A4F", light: "#52B788",
  accent: "#F4A261", danger: "#E63946", dangerBg: "#FFE8EA",
  text: "#1A1A2E", muted: "#6B7280", border: "#E8E0D5",
};

const OTC_MEDS = [
  { name: "אקמול",          generic: "פרצטמול",       color: "#52B788", cat: "חום וכאב",    route: "פומי — סירופ",          intervalHours: 6,  maxDaily: 4, note: "לא לשלב עם תרופות פרצטמול אחרות. לא לפני גיל 3 חודשים.",
    doses: [{ age:"3–6 ח'", w:"5–8 ק\"ג", d:"2.5 מ\"ל"}, { age:"6ח'–2שנ", w:"8–13 ק\"ג", d:"5 מ\"ל"}, { age:"2–6 שנים", w:"13–20 ק\"ג", d:"7.5 מ\"ל"}, { age:"6–12 שנים", w:"20–40 ק\"ג", d:"10 מ\"ל"}] },
  { name: "דקסמול ילדים",   generic: "פרצטמול",       color: "#52B788", cat: "חום וכאב",    route: "פומי — סירופ",          intervalHours: 6,  maxDaily: 4, note: "זהה לאקמול. לא לשלב שני המוצרים יחד.",
    doses: [{ age:"6ח'–2שנ", w:"8–13 ק\"ג", d:"5 מ\"ל"}, { age:"2–6 שנים", w:"13–20 ק\"ג", d:"7.5 מ\"ל"}, { age:"6–12 שנים", w:"20–40 ק\"ג", d:"10 מ\"ל"}] },
  { name: "נורופן ילדים",   generic: "איבופרופן",     color: "#F4A261", cat: "חום וכאב",    route: "פומי — תרחיף",          intervalHours: 8,  maxDaily: 3, note: "לא לפני גיל 6 חודשים. לתת עם אוכל. לא לשלב עם אדוויל.",
    doses: [{ age:"6–12 ח'", w:"7–10 ק\"ג", d:"2.5 מ\"ל"}, { age:"1–3 שנים", w:"10–15 ק\"ג", d:"5 מ\"ל"}, { age:"3–7 שנים", w:"15–22 ק\"ג", d:"7.5 מ\"ל"}, { age:"7–12 שנים", w:"22–40 ק\"ג", d:"10 מ\"ל"}] },
  { name: "אדוויל ילדים",   generic: "איבופרופן",     color: "#F4A261", cat: "חום וכאב",    route: "פומי — תרחיף",          intervalHours: 8,  maxDaily: 3, note: "לא לשלב עם נורופן. לתת עם אוכל. לא לפני גיל 6 חודשים.",
    doses: [{ age:"6–12 ח'", w:"7–10 ק\"ג", d:"2.5 מ\"ל"}, { age:"1–3 שנים", w:"10–15 ק\"ג", d:"5 מ\"ל"}, { age:"3–7 שנים", w:"15–22 ק\"ג", d:"7.5 מ\"ל"}, { age:"7–12 שנים", w:"22–40 ק\"ג", d:"10 מ\"ל"}] },
  { name: "ביסולבון",        generic: "ברומהקסין",    color: "#9C6ADE", cat: "שיעול וליחה", route: "פומי — סירופ",          intervalHours: 8,  maxDaily: 3, note: "מדלל ליחה. לא לשלב עם תרופות לשיעול יבש. מעל גיל 2.",
    doses: [{ age:"2–5 שנים", w:"—", d:"2.5 מ\"ל"}, { age:"6–12 שנים", w:"—", d:"5 מ\"ל"}] },
  { name: "מוקוסולבן ילדים", generic: "אמברוקסול",    color: "#9C6ADE", cat: "שיעול וליחה", route: "פומי — סירופ",          intervalHours: 8,  maxDaily: 3, note: "מדלל ומסייע בפינוי ליחה. מעל גיל 2.",
    doses: [{ age:"2–5 שנים", w:"—", d:"2.5 מ\"ל"}, { age:"6–12 שנים", w:"—", d:"5 מ\"ל"}] },
  { name: "קלריטין ילדים",   generic: "לוראטדין",     color: "#E91E8C", cat: "אלרגיה",      route: "פומי — סירופ",          intervalHours: 24, maxDaily: 1, note: "פעם אחת ביום. לא גורם לישנוניות.",
    doses: [{ age:"2–12 שנים", w:"עד 30 ק\"ג", d:"5 מ\"ל"}, { age:"2–12 שנים", w:"מעל 30 ק\"ג", d:"10 מ\"ל"}] },
  { name: "זירטק ילדים",     generic: "ציטריזין",     color: "#E91E8C", cat: "אלרגיה",      route: "פומי — טיפות/סירופ",    intervalHours: 24, maxDaily: 1, note: "עשוי לגרום לישנוניות קלה. מעל גיל 6 חודשים.",
    doses: [{ age:"6–12 ח'", w:"—", d:"2.5 מ\"ל"}, { age:"1–6 שנים", w:"—", d:"2.5 מ\"ל"}, { age:"6–12 שנים", w:"—", d:"5 מ\"ל"}] },
  { name: "אוטריווין ילדים", generic: "קסילומטאזולין", color: "#1565C0", cat: "אף סתום",    route: "טיפות/ספריי לאף",       intervalHours: 8,  maxDaily: 3, note: "לא יותר מ-5 ימים רצופים. מעל גיל 2.",
    doses: [{ age:"2–6 שנים", w:"—", d:"1–2 טיפות/נחיר"}, { age:"6–12 שנים", w:"—", d:"2–3 טיפות/נחיר"}] },
];

const TEMP_OPTIONS = [];
for (let t = 35.0; t <= 42.0; t = Math.round((t + 0.1) * 10) / 10) TEMP_OPTIONS.push(t.toFixed(1));
const ITEM_H = 54;

// ─────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────
function formatTime(mins) {
  if (mins <= 0) return "עכשיו";
  if (mins < 60) return `${mins} דק'`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m > 0 ? `${h}:${String(m).padStart(2,"0")} שע'` : `${h} שע'`;
}
function getTempStatus(val) {
  const v = parseFloat(val);
  if (v < 37.5) return { label:"תקין",      color:T.primary, bg:"#EEF7F2", emoji:"🟢" };
  if (v < 38.5) return { label:"חום קל",    color:"#E65100", bg:"#FFF3E0", emoji:"🟡" };
  if (v < 39.5) return { label:"חום",       color:T.accent,  bg:"#FFF3E0", emoji:"🟠" };
  return           { label:"חום גבוה",   color:T.danger,  bg:T.dangerBg,emoji:"🔴" };
}
function getMedAlert(val) {
  const v = parseFloat(val);
  if (v >= 40.5) return { color:T.danger, bg:T.dangerBg, border:T.danger, icon:"🚨", title:"פנה לחדר מיון", text:"חום גבוה מאוד. יש לפנות לחדר מיון מיידית." };
  if (v >= 39.5) return { color:"#E65100", bg:"#FFF3E0", border:"#FFAB76", icon:"⚠️", title:"מומלץ להתייעץ עם רופא", text:"חום גבוה. מומלץ לפנות לרופא בהקדם." };
  if (v >= 38.5) return { color:"#F9A825", bg:"#FFFDE7", border:"#FFE57F", icon:"👀", title:"שים לב לסימנים נוספים", text:"עקוב אחר קשיי נשימה, פריחה, או ירידה בתגובתיות." };
  return null;
}

// ─────────────────────────────────────────
// NOTIFICATION MANAGER
// ─────────────────────────────────────────
const notifTimers = {}; // track scheduled timeouts by med id

function requestNotifPermission(onResult) {
  if (!("Notification" in window)) { onResult("unsupported"); return; }
  if (Notification.permission === "granted") { onResult("granted"); return; }
  if (Notification.permission === "denied")  { onResult("denied");  return; }
  Notification.requestPermission().then(onResult);
}

function getNotifPermission() {
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission; // "default" | "granted" | "denied"
}

function showNotif(title, body, icon = "💊") {
  if (getNotifPermission() !== "granted") return;
  try {
    new Notification(title, { body, icon: "/icon-192.png", dir: "rtl", lang: "he" });
  } catch(e) { console.warn("Notification failed:", e); }
}

function scheduleMedNotif(med, minutesBefore = 15) {
  // Cancel existing timer for this med
  if (notifTimers[med.id]) { clearTimeout(notifTimers[med.id]); delete notifTimers[med.id]; }
  if (!med.active || med.nextDose <= minutesBefore) return;
  const msUntilAlert = (med.nextDose - minutesBefore) * 60 * 1000;
  notifTimers[med.id] = setTimeout(() => {
    showNotif(
      `💊 ${med.name} — עוד ${minutesBefore} דקות`,
      `מנה: ${med.dose} | מרווח: כל ${med.intervalHours} שעות`
    );
    delete notifTimers[med.id];
  }, msUntilAlert);
}

// eslint-disable-next-line no-unused-vars
function cancelMedNotif(medId) {
  if (notifTimers[medId]) { clearTimeout(notifTimers[medId]); delete notifTimers[medId]; }
}

function scheduleAllNotifs(medications, minutesBefore = 15) {
  medications.filter(m => m.active).forEach(m => scheduleMedNotif(m, minutesBefore));
}


function BottomNav({ screen, setScreen }) {
  return (
    <div style={{ position:"fixed", bottom:0, right:0, left:0, maxWidth:420, margin:"0 auto", background:"white", borderTop:`1px solid ${T.border}`, display:"flex", padding:"10px 0 20px", zIndex:50 }}>
      {[{ id:"dashboard", icon:"🏠", label:"ראשי" }, { id:"medications", icon:"💊", label:"תרופות" }, { id:"temp", icon:"🌡️", label:"חום" }, { id:"settings", icon:"⚙️", label:"הגדרות" }].map(item => (
        <button key={item.id} onClick={() => setScreen(item.id)} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4, background:"none", border:"none", cursor:"pointer", padding:"6px 0" }}>
          <span style={{ fontSize:22 }}>{item.icon}</span>
          <span style={{ fontSize:11, fontWeight:screen===item.id?800:500, color:screen===item.id?T.primary:T.muted }}>{item.label}</span>
          {screen===item.id && <div style={{ width:20, height:3, background:T.primary, borderRadius:2 }} />}
        </button>
      ))}
    </div>
  );
}

function Modal({ onClose, children }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"flex-end", justifyContent:"center", zIndex:100 }} onClick={onClose}>
      <div style={{ background:"white", borderRadius:"28px 28px 0 0", padding:"28px 24px 44px", width:"100%", maxWidth:420, maxHeight:"90vh", overflowY:"auto" }} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function ScrollPicker({ options, value, onChange, unit }) {
  const ref = useRef(null);
  const idx = Math.max(0, options.indexOf(value));
  useEffect(() => { if (ref.current) ref.current.scrollTop = idx * ITEM_H; }, [idx]); // eslint-disable-line react-hooks/exhaustive-deps
  const onScroll = e => { const i = Math.round(e.target.scrollTop / ITEM_H); if (options[i] !== undefined) onChange(options[i]); };
  return (
    <div style={{ position:"relative", height:ITEM_H*3, overflow:"hidden", borderRadius:16, background:"#F7F4EF" }}>
      <div style={{ position:"absolute", top:ITEM_H, left:8, right:8, height:ITEM_H, background:"#EEF7F2", border:`2px solid ${T.primary}`, borderRadius:12, pointerEvents:"none", zIndex:0 }} />
      <div ref={ref} onScroll={onScroll} style={{ position:"relative", zIndex:1, height:"100%", overflowY:"scroll", scrollSnapType:"y mandatory", scrollbarWidth:"none" }}>
        <style>{`div::-webkit-scrollbar{display:none}`}</style>
        <div style={{ height:ITEM_H, scrollSnapAlign:"start" }} />
        {options.map(opt => (
          <div key={opt} style={{ height:ITEM_H, display:"flex", alignItems:"center", justifyContent:"center", scrollSnapAlign:"start", fontSize:opt===value?30:20, fontWeight:900, color:opt===value?T.primary:T.muted, direction:"ltr", gap:4, transition:"all 0.15s" }}>
            {opt}<span style={{ fontSize:opt===value?15:11, fontWeight:500, marginTop:4 }}>{unit}</span>
          </div>
        ))}
        <div style={{ height:ITEM_H, scrollSnapAlign:"start" }} />
      </div>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:ITEM_H, background:"linear-gradient(to bottom,rgba(247,244,239,1) 20%,transparent)", pointerEvents:"none", zIndex:2 }} />
      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:ITEM_H, background:"linear-gradient(to top,rgba(247,244,239,1) 20%,transparent)", pointerEvents:"none", zIndex:2 }} />
    </div>
  );
}

// ─────────────────────────────────────────
// SCREEN: NOTIFICATION PERMISSION
// ─────────────────────────────────────────
function NotifPermissionScreen({ onDone }) {
  const [asking, setAsking] = useState(false);
  const perm = getNotifPermission();

  const handleRequest = () => {
    setAsking(true);
    requestNotifPermission(p => { setAsking(false); onDone(p); });
  };

  return (
    <div style={{ minHeight:"100vh", background:T.bg, fontFamily:"'Heebo',sans-serif", direction:"rtl", maxWidth:420, margin:"0 auto", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"0 32px", textAlign:"center" }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div style={{ animation:"fadeUp 0.6s ease both" }}>
        <div style={{ fontSize:72, marginBottom:20 }}>🔔</div>
        <div style={{ fontSize:26, fontWeight:900, color:T.text, fontFamily:"'Noto Serif Hebrew',serif", marginBottom:10 }}>
          התראות חכמות
        </div>
        <div style={{ fontSize:15, color:T.muted, lineHeight:1.7, marginBottom:32 }}>
          כדי לא לפספס מנת תרופה —<br/>תקבל התראה <strong style={{ color:T.text }}>15 דקות לפני</strong> כל מנה,<br/>גם כשהאפליקציה ברקע.
        </div>

        <div style={{ background:"white", borderRadius:20, padding:"20px 24px", border:`1.5px solid ${T.border}`, marginBottom:28, textAlign:"right" }}>
          {[
            { icon:"⏰", text:"תזכורת לפני כל מנת תרופה" },
            { icon:"👥", text:"עדכון כשהמטפל השני נותן מנה" },
            { icon:"🌡️", text:"התראה על חום גבוה" },
          ].map((r,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"9px 0", borderBottom:i<2?`1px solid ${T.border}`:"none" }}>
              <span style={{ fontSize:20 }}>{r.icon}</span>
              <span style={{ fontSize:14, color:T.text, fontWeight:600 }}>{r.text}</span>
            </div>
          ))}
        </div>

        {perm === "denied" ? (
          <>
            <div style={{ background:T.dangerBg, border:`1px solid ${T.danger}`, borderRadius:14, padding:"12px 16px", marginBottom:20, fontSize:13, color:T.danger }}>
              ⚠️ ההתראות חסומות בהגדרות הדפדפן. יש לאפשר ידנית בהגדרות.
            </div>
            <button onClick={() => onDone("denied")} style={{ width:"100%", background:"none", color:T.muted, border:`1.5px solid ${T.border}`, borderRadius:18, padding:16, fontSize:15, fontWeight:700, cursor:"pointer" }}>
              המשך בלי התראות
            </button>
          </>
        ) : (
          <>
            <button onClick={handleRequest} disabled={asking} style={{ width:"100%", background:asking?"#A8D5BE":T.primary, color:"white", border:"none", borderRadius:18, padding:18, fontSize:17, fontWeight:800, cursor:"pointer", boxShadow:"0 4px 16px rgba(45,106,79,0.3)", marginBottom:12 }}>
              {asking ? "ממתין לאישור..." : "🔔 אפשר התראות"}
            </button>
            <button onClick={() => onDone("default")} style={{ width:"100%", background:"none", color:T.muted, border:"none", fontSize:13, cursor:"pointer", padding:"8px" }}>
              עכשיו לא
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// SCREEN: LOGIN
// ─────────────────────────────────────────
function LoginScreen({ onDone }) {
  const [step, setStep] = useState("landing");
  const [name, setName] = useState("");
  const [gender, setGender] = useState(null);
  const [avatar, setAvatar] = useState("🧒");

  const boyAvatars = ["👶","👦"], girlAvatars = ["👶","👧"];
  const handleGender = g => { setGender(g); setAvatar(g==="girl" ? girlAvatars[0] : boyAvatars[0]); };

  return (
    <div style={{ minHeight:"100vh", background:T.bg, fontFamily:"'Heebo',sans-serif", direction:"rtl", maxWidth:420, margin:"0 auto", position:"relative" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;700;800;900&family=Noto+Serif+Hebrew:wght@700;900&display=swap'); *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}`}
      </style>
      {/* blobs */}
      <div style={{ position:"absolute", inset:0, overflow:"hidden", zIndex:0, pointerEvents:"none" }}>
        <div style={{ position:"absolute", top:-80, right:-60, width:280, height:280, borderRadius:"50%", background:"rgba(82,183,136,0.15)" }} />
        <div style={{ position:"absolute", bottom:200, left:-60, width:200, height:200, borderRadius:"50%", background:"rgba(244,162,97,0.12)" }} />
      </div>

      {/* LANDING */}
      {step==="landing" && (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", minHeight:"100vh", padding:"0 28px 52px", textAlign:"center", position:"relative", zIndex:1 }}>
          <div style={{ flex:1 }} />
          <div style={{ animation:"fadeUp 0.7s ease both" }}>
            <div style={{ width:96, height:96, borderRadius:30, background:"white", boxShadow:"0 8px 32px rgba(45,106,79,0.18)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:50, margin:"0 auto 20px", animation:"pulse 4s ease-in-out infinite" }}>🧒</div>
            <div style={{ fontSize:30, fontWeight:900, color:T.text, fontFamily:"'Noto Serif Hebrew',serif", lineHeight:1.2, marginBottom:10 }}>מעקב מחלת ילד</div>
            <div style={{ fontSize:15, color:T.muted, lineHeight:1.6 }}>מעקב חום ותרופות,<br/>מסונכרן בין שני הורים</div>
          </div>
          <div style={{ flex:1 }} />
          <div style={{ display:"flex", flexDirection:"column", gap:10, width:"100%", marginBottom:28, animation:"fadeUp 0.8s 0.1s ease both" }}>
            {[{ icon:"🌡️", t:"מעקב חום עם הנחיות רפואיות" }, { icon:"💊", t:"תרופות OTC ומרשם, עם תזכורות" }, { icon:"👥", t:"סנכרון בזמן אמת בין הורים" }].map((f,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:12, background:"white", borderRadius:14, padding:"12px 16px", boxShadow:"0 2px 10px rgba(0,0,0,0.05)", border:`1px solid ${T.border}` }}>
                <span style={{ fontSize:22 }}>{f.icon}</span><span style={{ fontSize:14, fontWeight:600, color:T.text }}>{f.t}</span>
              </div>
            ))}
          </div>
          <button onClick={() => setStep("profile")} style={{ width:"100%", background:"white", color:T.text, border:`2px solid ${T.border}`, borderRadius:18, padding:"16px 20px", fontSize:16, fontWeight:800, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:12, boxShadow:"0 4px 16px rgba(0,0,0,0.08)", animation:"fadeUp 0.8s 0.2s ease both" }}>
            <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            התחבר עם Google
          </button>
        </div>
      )}

      {/* PROFILE */}
      {step==="profile" && (
        <div style={{ display:"flex", flexDirection:"column", minHeight:"100vh", padding:"60px 28px 44px", position:"relative", zIndex:1 }}>
          <div style={{ fontSize:26, fontWeight:900, color:T.text, fontFamily:"'Noto Serif Hebrew',serif", marginBottom:4 }}>פרופיל הילד/ה</div>
          <div style={{ fontSize:13, color:T.muted, marginBottom:24 }}>ניתן לערוך בכל עת מההגדרות</div>

          <div style={{ marginBottom:22 }}>
            <div style={{ fontSize:13, fontWeight:700, color:T.text, marginBottom:10 }}>מין *</div>
            <div style={{ display:"flex", gap:12 }}>
              {[{ id:"boy", label:"ילד", emoji:"👦", c:"#1565C0", bg:"#E3F2FD" }, { id:"girl", label:"ילדה", emoji:"👧", c:"#880E4F", bg:"#FCE4EC" }].map(g => (
                <button key={g.id} onClick={() => handleGender(g.id)} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:6, padding:"16px 10px", borderRadius:18, border:`2px solid ${gender===g.id?g.c:T.border}`, background:gender===g.id?g.bg:"white", cursor:"pointer" }}>
                  <span style={{ fontSize:32 }}>{g.emoji}</span>
                  <span style={{ fontSize:15, fontWeight:800, color:gender===g.id?g.c:T.muted }}>{g.label}</span>
                </button>
              ))}
            </div>
          </div>

          {gender && <>
            <div style={{ textAlign:"center", marginBottom:20 }}>
              <div style={{ fontSize:64, marginBottom:10 }}>{avatar}</div>
              <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
                {(gender==="girl"?girlAvatars:boyAvatars).map(a => (
                  <button key={a} onClick={() => setAvatar(a)} style={{ width:50, height:50, fontSize:28, borderRadius:14, border:`2px solid ${avatar===a?T.primary:T.border}`, background:avatar===a?"#EEF7F2":"white", cursor:"pointer" }}>{a}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:13, fontWeight:700, color:T.text, marginBottom:8 }}>שם ה{gender==="girl"?"ילדה":"ילד"} *</div>
              <input value={name} onChange={e => setName(e.target.value)} placeholder={gender==="girl"?"לדוגמה: מיה":"לדוגמה: נועם"} style={{ width:"100%", padding:"14px 16px", border:`2px solid ${name?T.primary:T.border}`, borderRadius:14, fontSize:18, outline:"none", direction:"rtl", color:T.text }} />
            </div>
            <div style={{ background:"#EEF7F2", borderRadius:12, padding:"10px 14px", fontSize:12, color:T.primary, lineHeight:1.5, marginBottom:24 }}>
              💡 גיל ומשקל ניתן להוסיף בהגדרות — עוזרים לחישוב מינון תרופות OTC
            </div>
          </>}

          <div style={{ flex:1 }} />
          <button onClick={() => gender && name && onDone({ name, gender, avatar, age:"", weight:"" })} disabled={!gender||!name}
            style={{ width:"100%", background:(!gender||!name)?T.border:T.primary, color:(!gender||!name)?T.muted:"white", border:"none", borderRadius:18, padding:18, fontSize:17, fontWeight:800, cursor:(gender&&name)?"pointer":"default" }}>
            בואו נתחיל! ←
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// SCREEN: DASHBOARD
// ─────────────────────────────────────────
function MedCard({ med, onUpdate }) {
  const urgent = med.nextDose <= 30;
  const elapsed = med.totalInterval - med.nextDose;
  const elapsedPct = elapsed / med.totalInterval;
  const isTooSoon = med.nextDose > 0 && elapsedPct < 0.5;
  const isEarly   = med.nextDose > 0 && elapsedPct >= 0.5 && elapsedPct < 1;
  const [showNote, setShowNote] = useState(false);
  const [showWarn, setShowWarn] = useState(false);
  const [note, setNote] = useState("");

  const handleGiven = () => {
    if (med.given) { onUpdate({ ...med, given:false, savedNote:"" }); return; }
    if (isTooSoon) return;
    if (isEarly) { setShowWarn(true); return; }
    setShowNote(true);
  };
  const confirm = () => { onUpdate({ ...med, given:true, savedNote:note }); setShowNote(false); setShowWarn(false); setNote(""); };

  const pct = Math.min(100, Math.max(0,(elapsed/med.totalInterval)*100));
  const barColor = isTooSoon ? T.danger : urgent ? T.accent : med.color;

  return (
    <div style={{ background:T.card, borderRadius:20, padding:"16px 18px", border: isTooSoon?`2px solid ${T.danger}`:urgent?`2px solid ${T.accent}`:`1.5px solid ${T.border}`, position:"relative", overflow:"hidden", boxShadow:"0 2px 8px rgba(0,0,0,0.04)" }}>
      <div style={{ position:"absolute", top:0, right:0, width:5, height:"100%", background:med.color, borderRadius:"0 20px 20px 0" }} />
      <div style={{ marginBottom:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:16, fontWeight:800, color:T.text, fontFamily:"'Noto Serif Hebrew',serif" }}>{med.name}</span>
          <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20, background:med.type==="OTC"?"#E8F5F0":"#EEF3FF", color:med.type==="OTC"?T.primary:"#4A90D9" }}>{med.type}</span>
        </div>
        <div style={{ fontSize:12, color:T.muted, marginTop:2 }}>מנה: <strong style={{ color:T.text }}>{med.dose}</strong> · ניתן ע"י {med.who} {med.lastGiven}</div>
      </div>
      {/* progress */}
      <div style={{ marginBottom:showNote||showWarn||med.savedNote?10:0 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
          <span style={{ fontSize:11, color:T.muted }}>ניתן {med.lastGiven}</span>
          <div style={{ display:"flex", alignItems:"center", gap:5 }}>
            {urgent&&!isTooSoon&&<span style={{ fontSize:10, fontWeight:800, color:T.accent, background:"#FFF3E0", padding:"2px 7px", borderRadius:20 }}>בקרוב!</span>}
            <span style={{ fontSize:12, fontWeight:800, color:isTooSoon?T.danger:urgent?T.accent:T.text }}>עוד {formatTime(med.nextDose)}</span>
          </div>
        </div>
        <div style={{ height:7, background:"#F0EDE8", borderRadius:8, overflow:"hidden", marginBottom:10 }}>
          <div style={{ height:"100%", width:`${pct}%`, background:`linear-gradient(to left,${barColor},${barColor}88)`, borderRadius:8 }} />
        </div>
        <button onClick={handleGiven} style={{ width:"100%", background:med.given?"#E8F5F0":isTooSoon?T.dangerBg:T.primary, color:med.given?T.primary:isTooSoon?T.danger:"white", border:"none", borderRadius:12, padding:"10px", fontSize:13, fontWeight:700, cursor:isTooSoon?"not-allowed":"pointer" }}>
          {med.given?"✓ ניתן":isTooSoon?"🚫 מוקדם מדי":"💊 ניתן עכשיו"}
        </button>
      </div>
      {isTooSoon&&!showNote&&<div style={{ background:T.dangerBg, border:`1.5px solid ${T.danger}`, borderRadius:12, padding:"10px 12px", marginTop:8 }}>
        <div style={{ fontSize:13, fontWeight:800, color:T.danger, marginBottom:2 }}>🚫 מוקדם מדי לתת מנה</div>
        <div style={{ fontSize:12, color:T.danger }}>המנה ניתנה לפני {formatTime(elapsed)} בלבד. מרווח נדרש: {med.totalInterval/60} שע'.</div>
      </div>}
      {showWarn&&<div style={{ background:"#FFF8E1", border:"1.5px solid #FFD54F", borderRadius:12, padding:"10px 12px", marginTop:8 }}>
        <div style={{ fontSize:13, fontWeight:800, color:"#E65100", marginBottom:4 }}>⚠️ מוקדם מהרגיל</div>
        <div style={{ fontSize:12, color:"#795548", marginBottom:8 }}>נותרו עוד {formatTime(med.nextDose)}. להמשיך?</div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={() => { setShowWarn(false); setShowNote(true); }} style={{ flex:1, background:"#E65100", color:"white", border:"none", borderRadius:10, padding:"8px", fontSize:12, fontWeight:800, cursor:"pointer" }}>כן, תן עכשיו</button>
          <button onClick={() => setShowWarn(false)} style={{ flex:1, background:"none", color:T.muted, border:`1.5px solid ${T.border}`, borderRadius:10, padding:"8px", fontSize:12, cursor:"pointer" }}>ביטול</button>
        </div>
      </div>}
      {showNote&&<div style={{ marginTop:8 }}>
        <textarea autoFocus value={note} onChange={e=>setNote(e.target.value)} placeholder="הערה אופציונלית..." rows={2} style={{ width:"100%", padding:"9px 12px", border:`1.5px solid ${T.primary}`, borderRadius:12, fontSize:13, outline:"none", direction:"rtl", fontFamily:"'Heebo',sans-serif", resize:"none", marginBottom:8 }} />
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={confirm} style={{ flex:1, background:T.primary, color:"white", border:"none", borderRadius:10, padding:"9px", fontSize:13, fontWeight:800, cursor:"pointer" }}>✓ אשר מנה</button>
          <button onClick={() => setShowNote(false)} style={{ background:"none", color:T.muted, border:`1.5px solid ${T.border}`, borderRadius:10, padding:"9px 12px", fontSize:13, cursor:"pointer" }}>ביטול</button>
        </div>
      </div>}
      {med.savedNote&&!showNote&&<div style={{ background:"#F7F4EF", borderRadius:10, padding:"7px 12px", fontSize:12, color:T.text, marginTop:6 }}>📝 {med.savedNote}</div>}
    </div>
  );
}

function DashboardScreen({ profile, medications, setMedications, lastTemp, setLastTemp, setScreen, setShowAddMed }) {
  const status = lastTemp ? getTempStatus(lastTemp.value) : null;
  const activeMeds = medications.filter(m => m.active);
  const nextMed = [...activeMeds].sort((a,b) => a.nextDose - b.nextDose)[0];
  const [showTempModal, setShowTempModal] = useState(false);
  const [selTemp, setSelTemp] = useState("38.5");
  const [selMethod, setSelMethod] = useState("axillary");
  const [note, setNote] = useState("");
  const medAlert = getMedAlert(selTemp);
  const cm = METHODS.find(m => m.id===selMethod);

  return (
    <div style={{ minHeight:"100vh", background:T.bg, fontFamily:"'Heebo',sans-serif", direction:"rtl", maxWidth:420, margin:"0 auto", paddingBottom:100 }}>
      <div style={{ background:T.primary, padding:"52px 24px 28px", borderRadius:"0 0 32px 32px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-40, left:-40, width:150, height:150, background:"rgba(255,255,255,0.06)", borderRadius:"50%" }} />
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.65)", marginBottom:4 }}>שלום 👋</div>
            <div style={{ fontSize:26, fontWeight:900, color:"white", fontFamily:"'Noto Serif Hebrew',serif" }}>מעקב מחלה</div>
            <div style={{ fontSize:15, color:"rgba(255,255,255,0.8)", marginTop:4 }}>{profile.avatar} {profile.name}</div>
          </div>
          <div style={{ width:40, height:40, borderRadius:"50%", background:"rgba(255,255,255,0.2)", border:"2.5px solid rgba(255,255,255,0.7)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>א</div>
        </div>
      </div>

      <div style={{ padding:"20px 20px 0" }}>
        {/* temp card */}
        <div style={{ background:T.card, borderRadius:22, padding:"18px 20px", marginBottom:14, border:`1.5px solid ${T.border}`, boxShadow:"0 2px 10px rgba(0,0,0,0.05)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <span style={{ fontSize:14, fontWeight:700, color:T.muted }}>🌡️ חום אחרון</span>
            {lastTemp && <span style={{ fontSize:12, color:T.muted }}>ע"י {lastTemp.who} · {lastTemp.time}</span>}
          </div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            {lastTemp ? (
              <div style={{ display:"flex", alignItems:"baseline", gap:6, direction:"ltr" }}>
                <span style={{ fontSize:52, fontWeight:900, color:status.color, lineHeight:1 }}>{lastTemp.value}</span>
                <span style={{ fontSize:20, color:T.muted }}>°C</span>
                <span style={{ fontSize:13, fontWeight:800, color:status.color, background:status.bg, padding:"3px 10px", borderRadius:20, border:`1px solid ${status.color}` }}>{status.emoji} {status.label}</span>
              </div>
            ) : (
              <span style={{ fontSize:15, color:T.muted }}>לא נמדד עדיין</span>
            )}
            <button onClick={() => setShowTempModal(true)} style={{ background:T.primary, color:"white", border:"none", borderRadius:14, padding:"10px 16px", fontSize:13, fontWeight:700, cursor:"pointer" }}>+ מדידה</button>
          </div>
        </div>

        {/* meds */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <div style={{ fontSize:16, fontWeight:800, color:T.text }}>💊 תרופות פעילות</div>
          <button onClick={() => setShowAddMed(true)} style={{ background:"none", border:`1.5px solid ${T.primary}`, color:T.primary, borderRadius:10, padding:"6px 14px", fontSize:12, fontWeight:700, cursor:"pointer" }}>+ הוסף</button>
        </div>

        {activeMeds.length === 0 ? (
          <div style={{ textAlign:"center", padding:"32px 0", color:T.muted }}>
            <div style={{ fontSize:36, marginBottom:8 }}>💊</div>
            <div style={{ fontSize:14, fontWeight:600 }}>אין תרופות פעילות</div>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {activeMeds.map(med => (
              <MedCard key={med.id} med={med} onUpdate={updated => setMedications(ms => ms.map(m => m.id===updated.id?updated:m))} />
            ))}
          </div>
        )}

        {nextMed && (
          <div style={{ marginTop:18, background:"#EEF7F2", borderRadius:16, padding:"14px 18px", border:"1.5px solid #C8E6C9", display:"flex", alignItems:"center", gap:12 }}>
            <span style={{ fontSize:26 }}>⏰</span>
            <div>
              <div style={{ fontSize:13, fontWeight:800, color:T.primary }}>הפעולה הבאה</div>
              <div style={{ fontSize:13, color:T.text }}>{nextMed.name} בעוד <strong>{formatTime(nextMed.nextDose)}</strong></div>
            </div>
          </div>
        )}
      </div>

      {showTempModal && (
        <Modal onClose={() => setShowTempModal(false)}>
          <div style={{ fontSize:19, fontWeight:900, marginBottom:4, fontFamily:"'Noto Serif Hebrew',serif" }}>🌡️ רישום מדידה</div>
          <div style={{ fontSize:13, color:T.muted, marginBottom:16 }}>בחר שיטה וגלול לטמפרטורה</div>
          <div style={{ display:"flex", gap:8, marginBottom:16 }}>
            {METHODS.map(m => (
              <button key={m.id} onClick={() => setSelMethod(m.id)} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4, padding:"10px 6px", borderRadius:14, border:`2px solid ${selMethod===m.id?m.color:T.border}`, background:selMethod===m.id?m.bg:"white", cursor:"pointer" }}>
                <span style={{ fontSize:20 }}>{m.emoji}</span>
                <span style={{ fontSize:11, fontWeight:800, color:selMethod===m.id?m.color:T.muted }}>{m.label}</span>
              </button>
            ))}
          </div>
          {cm.adjust !== 0 && <div style={{ background:"#FFF8E1", border:"1px solid #FFD54F", borderRadius:12, padding:"9px 13px", marginBottom:14, fontSize:12, color:"#E65100" }}>⚠️ שיטה זו נמוכה ב-{Math.abs(cm.adjust)}–{cm.id==="axillary"?"1":"0.5"}° מרקטאלי.</div>}
          <ScrollPicker options={TEMP_OPTIONS} value={selTemp} onChange={setSelTemp} unit="°C" />
          {medAlert && (
            <div style={{ marginTop:14, background:medAlert.bg, border:`2px solid ${medAlert.border}`, borderRadius:14, padding:"12px 14px" }}>
              <div style={{ fontSize:14, fontWeight:900, color:medAlert.color, marginBottom:3 }}>{medAlert.icon} {medAlert.title}</div>
              <div style={{ fontSize:12, color:medAlert.color, lineHeight:1.5 }}>{medAlert.text}</div>
              <div style={{ fontSize:11, color:medAlert.color, opacity:0.7, marginTop:5 }}>* אינה מחליפה ייעוץ רפואי</div>
            </div>
          )}
          <div style={{ marginTop:14 }}>
            <div style={{ fontSize:13, fontWeight:700, color:T.text, marginBottom:8 }}>📝 הערה (אופציונלי)</div>
            <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="פריחה, שיעול, הקאה..." rows={2} style={{ width:"100%", padding:"10px 12px", border:`1.5px solid ${note?T.primary:T.border}`, borderRadius:12, fontSize:13, outline:"none", direction:"rtl", fontFamily:"'Heebo',sans-serif", resize:"none" }} />
          </div>
          <button onClick={() => { setLastTemp({ value:selTemp, time:"הרגע", who:"אמא", method:cm.label, note }); setNote(""); setShowTempModal(false); }}
            style={{ width:"100%", background:cm.color, color:"white", border:"none", borderRadius:16, padding:15, fontSize:15, fontWeight:800, cursor:"pointer", marginTop:16 }}>
            שמור מדידה
          </button>
        </Modal>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// SCREEN: TEMP
// ─────────────────────────────────────────
const METHODS = [
  { id:"rectal",  label:"רקטאלי",   emoji:"🍼", color:"#2D6A4F", bg:"#EEF7F2", adjust:0,     accuracy:"גולד סטנדרט", age:"עד גיל 3" },
  { id:"oral",    label:"אורלי",    emoji:"👄", color:"#1565C0", bg:"#E3F2FD", adjust:-0.5,  accuracy:"מדויק יחסית", age:"מגיל 4+" },
  { id:"axillary",label:"בית שחי", emoji:"🤗", color:"#6A2D6A", bg:"#F3E5F5", adjust:-0.75, accuracy:"פחות מדויק", age:"כל הגילאים" },
];

function TempScreen({ profile, lastTemp, setLastTemp }) {
  const [showModal, setShowModal] = useState(false);
  const [selTemp, setSelTemp] = useState("38.5");
  const [selMethod, setSelMethod] = useState("axillary");
  const [note, setNote] = useState("");
  const status = lastTemp ? getTempStatus(lastTemp.value) : null;
  const medAlert = getMedAlert(selTemp);
  const cm = METHODS.find(m => m.id===selMethod);

  return (
    <div style={{ minHeight:"100vh", background:T.bg, fontFamily:"'Heebo',sans-serif", direction:"rtl", maxWidth:420, margin:"0 auto", paddingBottom:100 }}>
      <div style={{ background:T.primary, padding:"52px 24px 28px", borderRadius:"0 0 28px 28px" }}>
        <div style={{ fontSize:13, color:"rgba(255,255,255,0.65)", marginBottom:4 }}>{profile.name}</div>
        <div style={{ fontSize:24, fontWeight:900, color:"white", fontFamily:"'Noto Serif Hebrew',serif" }}>🌡️ מעקב חום</div>
      </div>
      <div style={{ padding:"22px 20px 0" }}>
        <div style={{ background:T.card, borderRadius:22, padding:"20px", border:`2px solid ${lastTemp?status.color:T.border}`, boxShadow:lastTemp?`0 4px 20px ${status.color}22`:"none", marginBottom:18 }}>
          <div style={{ fontSize:12, color:T.muted, marginBottom:12, display:"flex", justifyContent:"space-between" }}>
            <span>📍 מדידה אחרונה</span>
            {lastTemp && <span>ע"י {lastTemp.who} · {lastTemp.time}</span>}
          </div>
          {lastTemp ? (
            <>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                <div style={{ display:"flex", alignItems:"baseline", gap:6, direction:"ltr" }}>
                  <span style={{ fontSize:56, fontWeight:900, color:status.color, lineHeight:1 }}>{lastTemp.value}</span>
                  <span style={{ fontSize:20, color:T.muted }}>°C</span>
                </div>
                <div style={{ background:status.bg, color:status.color, borderRadius:14, padding:"8px 14px", fontSize:13, fontWeight:800, border:`1.5px solid ${status.color}`, textAlign:"center" }}>
                  <div style={{ fontSize:20 }}>{status.emoji}</div><div>{status.label}</div>
                </div>
              </div>
              <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"#F7F4EF", borderRadius:10, padding:"4px 12px", fontSize:12, color:T.muted, marginBottom:lastTemp.note?10:0 }}>
                {(METHODS.find(m=>m.label===lastTemp.method)||{}).emoji} שיטה: {lastTemp.method}
              </div>
              {lastTemp.note && <div style={{ background:"#F7F4EF", borderRadius:10, padding:"8px 12px", fontSize:13, color:T.text, marginTop:8 }}>📝 {lastTemp.note}</div>}
            </>
          ) : <div style={{ fontSize:15, color:T.muted, textAlign:"center", padding:"12px 0" }}>לא נמדד עדיין</div>}
        </div>
        <button onClick={() => setShowModal(true)} style={{ width:"100%", background:T.primary, color:"white", border:"none", borderRadius:18, padding:"16px", fontSize:16, fontWeight:800, cursor:"pointer", boxShadow:"0 4px 16px rgba(45,106,79,0.3)" }}>
          🌡️ מדידה חדשה
        </button>
      </div>

      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          <div style={{ fontSize:19, fontWeight:900, marginBottom:4, fontFamily:"'Noto Serif Hebrew',serif" }}>🌡️ רישום מדידה</div>
          <div style={{ fontSize:13, color:T.muted, marginBottom:16 }}>בחר שיטה וגלול לטמפרטורה</div>
          <div style={{ display:"flex", gap:8, marginBottom:16 }}>
            {METHODS.map(m => (
              <button key={m.id} onClick={() => setSelMethod(m.id)} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4, padding:"10px 6px", borderRadius:14, border:`2px solid ${selMethod===m.id?m.color:T.border}`, background:selMethod===m.id?m.bg:"white", cursor:"pointer" }}>
                <span style={{ fontSize:20 }}>{m.emoji}</span>
                <span style={{ fontSize:11, fontWeight:800, color:selMethod===m.id?m.color:T.muted }}>{m.label}</span>
              </button>
            ))}
          </div>
          {cm.adjust !== 0 && <div style={{ background:"#FFF8E1", border:"1px solid #FFD54F", borderRadius:12, padding:"9px 13px", marginBottom:14, fontSize:12, color:"#E65100" }}>⚠️ שיטה זו נמוכה ב-{Math.abs(cm.adjust)}–{cm.id==="axillary"?"1":"0.5"}° מרקטאלי.</div>}
          <ScrollPicker options={TEMP_OPTIONS} value={selTemp} onChange={setSelTemp} unit="°C" />
          {medAlert && (
            <div style={{ marginTop:14, background:medAlert.bg, border:`2px solid ${medAlert.border}`, borderRadius:14, padding:"12px 14px" }}>
              <div style={{ fontSize:14, fontWeight:900, color:medAlert.color, marginBottom:3 }}>{medAlert.icon} {medAlert.title}</div>
              <div style={{ fontSize:12, color:medAlert.color, lineHeight:1.5 }}>{medAlert.text}</div>
              <div style={{ fontSize:11, color:medAlert.color, opacity:0.7, marginTop:5 }}>* אינה מחליפה ייעוץ רפואי</div>
            </div>
          )}
          <div style={{ marginTop:14 }}>
            <div style={{ fontSize:13, fontWeight:700, color:T.text, marginBottom:8 }}>📝 הערה (אופציונלי)</div>
            <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="פריחה, שיעול, הקאה..." rows={2} style={{ width:"100%", padding:"10px 12px", border:`1.5px solid ${note?T.primary:T.border}`, borderRadius:12, fontSize:13, outline:"none", direction:"rtl", fontFamily:"'Heebo',sans-serif", resize:"none" }} />
          </div>
          <button onClick={() => { setLastTemp({ value:selTemp, time:"הרגע", who:"אמא", method:cm.label, note }); setNote(""); setShowModal(false); }}
            style={{ width:"100%", background:cm.color, color:"white", border:"none", borderRadius:16, padding:15, fontSize:15, fontWeight:800, cursor:"pointer", marginTop:16 }}>
            שמור מדידה
          </button>
        </Modal>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// SCREEN: SETTINGS
// ─────────────────────────────────────────
const AGE_OPTS    = Array.from({length:12},(_,i)=>String(i+1));
const WEIGHT_OPTS = Array.from({length:33},(_,i)=>String(i+8));

function SettingsScreen({ profile, setProfile, notifPermission, notifMinutes, setNotifMinutes, onRequestNotif }) {
  const [editField, setEditField] = useState(null);
  const [notifs, setNotifs] = useState({ reminders:true, caretaker:true, highTemp:true });
  const [showEndIllness, setShowEndIllness] = useState(false);

  const fields = {
    name:   { label:`שם ה${profile.gender==="girl"?"ילדה":"ילד"}`, hint:"השם שיוצג", placeholder:"נועם", type:"text", scroll:false },
    age:    { label:"גיל (שנים)",    hint:"לחישוב מינון OTC",      placeholder:"4",  type:"number", scroll:true,  opts:AGE_OPTS,    unit:"שנים" },
    weight: { label:'משקל (ק"ג)',   hint:"לחישוב מינון OTC",      placeholder:"17", type:"number", scroll:true,  opts:WEIGHT_OPTS, unit:'ק"ג' },
  };

  return (
    <div style={{ minHeight:"100vh", background:T.bg, fontFamily:"'Heebo',sans-serif", direction:"rtl", maxWidth:420, margin:"0 auto", paddingBottom:100 }}>
      <div style={{ background:T.primary, padding:"52px 24px 32px", borderRadius:"0 0 28px 28px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <div style={{ width:64, height:64, borderRadius:"50%", background:"rgba(255,255,255,0.15)", border:"3px solid rgba(255,255,255,0.5)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:32 }}>{profile.avatar}</div>
          <div>
            <div style={{ fontSize:22, fontWeight:900, color:"white", fontFamily:"'Noto Serif Hebrew',serif" }}>{profile.name}</div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.75)" }}>
              {profile.age ? `${profile.age} שנים` : "גיל לא הוגדר"}
              {profile.weight ? ` · ${profile.weight} ק"ג` : ""}
            </div>
          </div>
        </div>
      </div>
      <div style={{ padding:"20px 20px 0" }}>
        {/* profile section */}
        {[{ title:"פרטי הילד/ה", rows:[
          { icon:"👤", label:`שם`, value:profile.name, key:"name" },
          { icon:"🎂", label:"גיל", value:profile.age||"לא הוגדר", key:"age" },
          { icon:"⚖️", label:"משקל", value:profile.weight?`${profile.weight} ק"ג`:"לא הוגדר", key:"weight" },
        ]}].map(sec => (
          <div key={sec.title} style={{ marginBottom:22 }}>
            <div style={{ fontSize:12, fontWeight:800, color:T.muted, letterSpacing:1, marginBottom:10 }}>{sec.title}</div>
            <div style={{ background:T.card, borderRadius:18, border:`1.5px solid ${T.border}`, overflow:"hidden" }}>
              {sec.rows.map((row,i) => (
                <div key={row.key} onClick={() => setEditField(row.key)} style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px", borderBottom:i<sec.rows.length-1?`1px solid ${T.border}`:"none", cursor:"pointer" }}>
                  <span style={{ fontSize:18, width:26 }}>{row.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:600, color:T.text }}>{row.label}</div>
                    <div style={{ fontSize:12, color:T.muted }}>{row.value}</div>
                  </div>
                  <span style={{ color:T.muted, fontSize:18 }}>›</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* notifications */}
        <div style={{ marginBottom:22 }}>
          <div style={{ fontSize:12, fontWeight:800, color:T.muted, letterSpacing:1, marginBottom:10 }}>התראות</div>
          <div style={{ background:T.card, borderRadius:18, border:`1.5px solid ${T.border}`, overflow:"hidden" }}>

            {/* permission status row */}
            <div style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px", borderBottom:`1px solid ${T.border}` }}>
              <span style={{ fontSize:18, width:26 }}>🔔</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:600, color:T.text }}>התראות לטלפון</div>
                <div style={{ fontSize:12, color: notifPermission==="granted" ? T.primary : notifPermission==="denied" ? T.danger : T.muted }}>
                  {notifPermission==="granted" ? "✅ מופעלות" : notifPermission==="denied" ? "🚫 חסומות בדפדפן" : "לא הוגדר"}
                </div>
              </div>
              {notifPermission !== "granted" && notifPermission !== "denied" && (
                <button onClick={onRequestNotif} style={{ background:T.primary, color:"white", border:"none", borderRadius:10, padding:"7px 14px", fontSize:12, fontWeight:700, cursor:"pointer" }}>
                  אפשר
                </button>
              )}
            </div>

            {/* minutes before */}
            {notifPermission === "granted" && (
              <div style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px", borderBottom:`1px solid ${T.border}` }}>
                <span style={{ fontSize:18, width:26 }}>⏱️</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:600, color:T.text }}>התראה מוקדמת</div>
                  <div style={{ fontSize:12, color:T.muted }}>{notifMinutes} דקות לפני כל מנה</div>
                </div>
                <div style={{ display:"flex", gap:6 }}>
                  {[10, 15, 30].map(m => (
                    <button key={m} onClick={() => setNotifMinutes(m)} style={{ padding:"5px 10px", borderRadius:10, fontSize:12, fontWeight:700, border:`1.5px solid ${notifMinutes===m?T.primary:T.border}`, background:notifMinutes===m?"#EEF7F2":"white", color:notifMinutes===m?T.primary:T.muted, cursor:"pointer" }}>
                      {m}′
                    </button>
                  ))}
                </div>
              </div>
            )}

            {[
              { key:"caretaker", icon:"👥", label:"עדכון מטפל אחר נתן", sub:"כשהשני רושם מנה" },
              { key:"highTemp",  icon:"🌡️", label:"התראת חום גבוה",    sub:"מעל 39.5°" },
            ].map((r,i,arr) => (
              <div key={r.key} style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px", borderBottom:i<arr.length-1?`1px solid ${T.border}`:"none" }}>
                <span style={{ fontSize:18, width:26 }}>{r.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:600, color:T.text }}>{r.label}</div>
                  <div style={{ fontSize:12, color:T.muted }}>{r.sub}</div>
                </div>
                <div onClick={() => setNotifs(n=>({...n,[r.key]:!n[r.key]}))} style={{ width:44, height:25, borderRadius:13, background:notifs[r.key]?T.primary:T.border, position:"relative", cursor:"pointer", transition:"background 0.2s" }}>
                  <div style={{ position:"absolute", top:2.5, right:notifs[r.key]?2.5:"auto", left:notifs[r.key]?"auto":2.5, width:20, height:20, borderRadius:"50%", background:"white", transition:"all 0.2s", boxShadow:"0 1px 4px rgba(0,0,0,0.2)" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* end illness */}
        <div style={{ marginBottom:22 }}>
          <div style={{ fontSize:12, fontWeight:800, color:T.muted, letterSpacing:1, marginBottom:10 }}>מחלה נוכחית</div>
          <div style={{ background:T.card, borderRadius:18, border:`1.5px solid ${T.border}`, overflow:"hidden" }}>
            <div onClick={() => setShowEndIllness(true)} style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px", cursor:"pointer" }}>
              <span style={{ fontSize:18, width:26 }}>📁</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:600, color:T.text }}>סיים מחלה ושמור בארכיון</div>
                <div style={{ fontSize:12, color:T.muted }}>המידע ישמר שבוע</div>
              </div>
              <span style={{ color:T.muted, fontSize:18 }}>›</span>
            </div>
          </div>
        </div>
      </div>

      {editField && (
        <EditSettingsField
          field={{ ...fields[editField], key: editField }}
          profile={profile}
          onSave={val => { setProfile(p=>({...p,[editField]:val})); setEditField(null); }}
          onClose={() => setEditField(null)}
        />
      )}

      {showEndIllness && (
        <Modal onClose={() => setShowEndIllness(false)}>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:44, marginBottom:12 }}>📁</div>
            <div style={{ fontSize:18, fontWeight:900, marginBottom:8, fontFamily:"'Noto Serif Hebrew',serif" }}>סיום מחלה</div>
            <div style={{ fontSize:14, color:T.muted, lineHeight:1.6, marginBottom:24 }}>כל המידע ישמר בארכיון למשך שבוע ואז יימחק. התרופות והתזכורות יכובו מיד.</div>
            <button onClick={() => setShowEndIllness(false)} style={{ width:"100%", background:T.danger, color:"white", border:"none", borderRadius:16, padding:15, fontSize:15, fontWeight:800, cursor:"pointer", marginBottom:10 }}>סיים מחלה</button>
            <button onClick={() => setShowEndIllness(false)} style={{ width:"100%", background:"none", color:T.muted, border:`1.5px solid ${T.border}`, borderRadius:16, padding:13, fontSize:13, cursor:"pointer" }}>ביטול</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// ADD MEDICATION MODAL (shared)
// ─────────────────────────────────────────
function AddMedModal({ onAdd, onClose }) {
  const [step, setStep]   = useState("type");
  const [type, setType]   = useState(null);
  const [rxMethod, setRxMethod] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [search, setSearch] = useState("");
  const [catFilter, setCat] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm]   = useState({ name:"", dose:"", unit:'מ"ל', every:"", duration:"", notes:"" });

  const cats = [...new Set(OTC_MEDS.map(m=>m.cat))];
  const filtered = OTC_MEDS.filter(m=>(!catFilter||m.cat===catFilter)&&(!search||m.name.includes(search)||m.generic.includes(search)));

  const pickOTC = med => { setSelected(med); setForm(f=>({...f,name:med.name,dose:(med.doses[1]?med.doses[1].d:med.doses[0].d),every:String(med.intervalHours)})); setStep("otc-detail"); };
  const simulateScan = () => { setScanning(true); setTimeout(()=>{ setScanning(false); setForm({name:"אוגמנטין",dose:"2.5",unit:'מ"ל',every:"8",duration:"7",notes:"לתת עם אוכל"}); setStep("confirm"); },2000); };
  const doAdd = () => {
    onAdd({ id:Date.now(), name:form.name||(selected&&selected.name), type:type==="OTC"?"OTC":"Rx",
      dose:type==="OTC"?((selected&&selected.doses[1]?selected.doses[1].d:(selected&&selected.doses[0]?selected.doses[0].d:""))):`${form.dose} ${form.unit}`,
      intervalHours:Number(form.every)||(selected&&selected.intervalHours),
      totalInterval:(Number(form.every)||(selected&&selected.intervalHours)||6)*60,
      nextDose:(Number(form.every)||(selected&&selected.intervalHours)||6)*60,
      color:(selected&&selected.color)||"#4A90D9", startDate:"01/06",
      durationDays:form.duration?Number(form.duration):null,
      history:[], active:true, given:false, savedNote:"",
      lastGiven:"לא ניתן עדיין", who:"—" });
    onClose();
  };

  const Prog = ({cur,tot}) => <div style={{display:"flex",gap:5,marginBottom:18}}>{Array.from({length:tot}).map((_,i)=><div key={i} style={{flex:i===cur?2:1,height:4,borderRadius:4,background:i<=cur?T.primary:T.border,transition:"all 0.3s"}}/>)}</div>;
  const Back = ({to}) => <button onClick={()=>setStep(to)} style={{background:"none",border:"none",color:T.muted,fontSize:13,cursor:"pointer",marginBottom:12}}>→ חזרה</button>;

  return (
    <Modal onClose={onClose}>
      {step==="type"&&<>
        <div style={{fontSize:19,fontWeight:900,marginBottom:4,fontFamily:"'Noto Serif Hebrew',serif"}}>💊 הוספת תרופה</div>
        <div style={{fontSize:13,color:T.muted,marginBottom:20}}>איזה סוג תרופה?</div>
        {[{id:"OTC",icon:"🛒",title:"ללא מרשם (OTC)",sub:"אקמול, נורופן...",note:"מינון אוטומטי",nc:T.primary,nb:"#EEF7F2"},
          {id:"Rx", icon:"📋",title:"מרשם רופא (Rx)", sub:"אנטיביוטיקה...",note:"צילום מדבקה / ידנית",nc:"#4A90D9",nb:"#EEF3FF"}].map(t=>(
          <button key={t.id} onClick={()=>{setType(t.id);setStep(t.id==="OTC"?"otc":"rx-method");}} style={{display:"flex",alignItems:"center",gap:14,background:"white",border:`1.5px solid ${T.border}`,borderRadius:18,padding:"16px",cursor:"pointer",textAlign:"right",width:"100%",marginBottom:10}}>
            <div style={{width:48,height:48,borderRadius:14,background:t.nb,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{t.icon}</div>
            <div style={{flex:1}}><div style={{fontSize:15,fontWeight:800,color:T.text}}>{t.title}</div><div style={{fontSize:11,color:T.muted}}>{t.sub}</div><div style={{fontSize:11,color:t.nc,fontWeight:700,marginTop:2}}>✓ {t.note}</div></div>
            <span style={{color:T.muted,fontSize:18}}>›</span>
          </button>
        ))}
      </>}

      {step==="otc"&&<>
        <Prog cur={0} tot={3}/><Back to="type"/>
        <div style={{fontSize:16,fontWeight:800,marginBottom:10}}>בחר תרופה</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
          <button onClick={()=>setCat(null)} style={{padding:"4px 12px",borderRadius:20,fontSize:11,fontWeight:700,border:`1.5px solid ${!catFilter?T.primary:T.border}`,background:!catFilter?"#EEF7F2":"white",color:!catFilter?T.primary:T.muted,cursor:"pointer"}}>הכל</button>
          {cats.map(c=><button key={c} onClick={()=>setCat(c===catFilter?null:c)} style={{padding:"4px 12px",borderRadius:20,fontSize:11,fontWeight:700,border:`1.5px solid ${catFilter===c?T.primary:T.border}`,background:catFilter===c?"#EEF7F2":"white",color:catFilter===c?T.primary:T.muted,cursor:"pointer"}}>{c}</button>)}
        </div>
        <div style={{position:"relative",marginBottom:10}}>
          <span style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)"}}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="חיפוש..." style={{width:"100%",padding:"9px 34px 9px 10px",border:`1.5px solid ${T.border}`,borderRadius:12,fontSize:13,outline:"none",direction:"rtl"}}/>
        </div>
        {filtered.map((med,i)=>(
          <button key={i} onClick={()=>pickOTC(med)} style={{display:"flex",alignItems:"center",gap:10,background:"white",border:`1.5px solid ${T.border}`,borderRadius:14,padding:"11px 13px",cursor:"pointer",textAlign:"right",width:"100%",marginBottom:8}}>
            <div style={{width:10,height:10,borderRadius:"50%",background:med.color,flexShrink:0}}/>
            <div style={{flex:1}}><div style={{fontSize:14,fontWeight:800,color:T.text}}>{med.name}</div><div style={{fontSize:11,color:T.muted}}>{med.generic} · {med.route} · כל {med.intervalHours}שע' · {med.cat}</div></div>
            <span style={{color:T.muted}}>›</span>
          </button>
        ))}
      </>}

      {step==="otc-detail"&&selected&&<>
        <Prog cur={1} tot={3}/><Back to="otc"/>
        <div style={{fontSize:18,fontWeight:900,marginBottom:14,fontFamily:"'Noto Serif Hebrew',serif"}}>{selected.name}</div>
        <div style={{display:"flex",gap:8,marginBottom:12}}>
          {[{l:"אופן נטילה",v:selected.route},{l:"תדירות",v:`כל ${selected.intervalHours}שע'`},{l:"מקסימום",v:`${selected.maxDaily}/יום`}].map((r,i)=>(
            <div key={i} style={{flex:1,background:"#F7F4EF",borderRadius:10,padding:"9px 8px",textAlign:"center"}}><div style={{fontSize:10,color:T.muted,marginBottom:2}}>{r.l}</div><div style={{fontSize:11,fontWeight:800,color:T.text}}>{r.v}</div></div>
          ))}
        </div>
        <div style={{borderRadius:12,overflow:"hidden",border:`1.5px solid ${T.border}`,marginBottom:12}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",background:T.primary}}>
            {["גיל","משקל","מינון"].map(h=><div key={h} style={{padding:"7px 8px",fontSize:11,fontWeight:800,color:"white",textAlign:"center"}}>{h}</div>)}
          </div>
          {selected.doses.map((d,i)=>(
            <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",background:i%2===0?"white":"#F7F4EF"}}>
              <div style={{padding:"7px 8px",fontSize:11,color:T.text,textAlign:"center"}}>{d.age}</div>
              <div style={{padding:"7px 8px",fontSize:11,color:T.muted,textAlign:"center"}}>{d.w}</div>
              <div style={{padding:"7px 8px",fontSize:11,fontWeight:800,color:selected.color,textAlign:"center"}}>{d.d}</div>
            </div>
          ))}
        </div>
        <div style={{background:"#FFF8E1",border:"1px solid #FFD54F",borderRadius:10,padding:"9px 12px",marginBottom:16,fontSize:12,color:"#795548"}}>⚠️ {selected.note}</div>
        <button onClick={()=>setStep("confirm")} style={{width:"100%",background:T.primary,color:"white",border:"none",borderRadius:16,padding:14,fontSize:14,fontWeight:800,cursor:"pointer"}}>המשך לאישור ←</button>
      </>}

      {step==="rx-method"&&<>
        <Prog cur={0} tot={3}/><Back to="type"/>
        <div style={{fontSize:16,fontWeight:800,marginBottom:4}}>איך להזין?</div>
        <div style={{fontSize:13,color:T.muted,marginBottom:18}}>בחר שיטה</div>
        {[{m:"camera",icon:"📷",title:"צלם מדבקה",sub:"AI יחלץ פרטים",nb:"#EEF7F2",nc:T.primary,border:T.primary,badge:"מהיר!"},
          {m:"manual",icon:"✏️",title:"הזנה ידנית",sub:"מלא פרטים בעצמך",nb:"#EEF3FF",nc:"#4A90D9",border:T.border,badge:null}].map(opt=>(
          <button key={opt.m} onClick={()=>{setRxMethod(opt.m);setStep(opt.m==="camera"?"rx-camera":"rx-manual");}} style={{display:"flex",alignItems:"center",gap:14,background:"white",border:`2px solid ${opt.border}`,borderRadius:18,padding:"18px 16px",cursor:"pointer",textAlign:"right",width:"100%",marginBottom:12}}>
            <div style={{width:50,height:50,background:opt.nb,borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{opt.icon}</div>
            <div style={{flex:1}}><div style={{fontSize:15,fontWeight:800,color:T.text}}>{opt.title}</div><div style={{fontSize:12,color:T.muted}}>{opt.sub}</div></div>
            {opt.badge&&<span style={{background:"#EEF7F2",color:T.primary,fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:8}}>{opt.badge}</span>}
          </button>
        ))}
      </>}

      {step==="rx-camera"&&<>
        <Prog cur={1} tot={3}/><Back to="rx-method"/>
        {!scanning?(
          <div style={{textAlign:"center"}}>
            <div style={{background:"#1A1A2E",borderRadius:18,aspectRatio:"4/3",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",marginBottom:16}}>
              <div style={{width:"55%",height:"50%",border:"2px solid rgba(82,183,136,0.8)",borderRadius:8,position:"relative"}}>
                {[["top","right"],["top","left"],["bottom","right"],["bottom","left"]].map(([v,h],i)=>(
                  <div key={i} style={{position:"absolute",[v]:0,[h]:0,width:16,height:16,borderTop:v==="top"?"2.5px solid #52B788":"none",borderBottom:v==="bottom"?"2.5px solid #52B788":"none",borderRight:h==="right"?"2.5px solid #52B788":"none",borderLeft:h==="left"?"2.5px solid #52B788":"none"}}/>
                ))}
              </div>
              <div style={{color:"rgba(255,255,255,0.5)",fontSize:12,marginTop:12}}>כוון למדבקת התרופה</div>
            </div>
            <button onClick={simulateScan} style={{width:"100%",background:T.primary,color:"white",border:"none",borderRadius:16,padding:14,fontSize:14,fontWeight:800,cursor:"pointer"}}>📷 צלם עכשיו</button>
          </div>
        ):(
          <div style={{textAlign:"center",padding:"40px 0"}}>
            <div style={{fontSize:44,marginBottom:14}}>🔍</div>
            <div style={{fontSize:16,fontWeight:800,marginBottom:6}}>מנתח מדבקה...</div>
            <div style={{fontSize:13,color:T.muted}}>ה-AI מחלץ פרטי תרופה</div>
            <style>{`@keyframes dot{0%,100%{opacity:.3;transform:translateY(0)}50%{opacity:1;transform:translateY(-6px)}}`}</style>
            <div style={{display:"flex",gap:6,justifyContent:"center",marginTop:18}}>
              {[0,1,2].map(i=><div key={i} style={{width:10,height:10,borderRadius:"50%",background:T.primary,animation:`dot 0.8s ease-in-out ${i*0.2}s infinite`}}/>)}
            </div>
          </div>
        )}
      </>}

      {step==="rx-manual"&&<>
        <Prog cur={1} tot={3}/><Back to="rx-method"/>
        <div style={{fontSize:16,fontWeight:800,marginBottom:14}}>פרטי התרופה</div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {[{l:"שם התרופה *",k:"name",p:"לדוגמה: אוגמנטין",t:"text"},
            {l:"כל כמה שעות *",k:"every",p:"8",t:"number"},
            {l:"משך טיפול (ימים, אופציונלי)",k:"duration",p:"ריק = ללא הגבלה",t:"number"},
            {l:"הערות הרופא",k:"notes",p:"לדוגמה: לתת עם אוכל",t:"text"}].map(f=>(
            <div key={f.k}>
              <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:5}}>{f.l}</div>
              <div style={{display:"flex",gap:8}}>
                <input type={f.t} value={form[f.k]} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))} placeholder={f.p} style={{flex:1,padding:"10px 12px",border:`1.5px solid ${T.border}`,borderRadius:12,fontSize:14,outline:"none",direction:"rtl",color:T.text}}/>
                {f.k==="name"&&<><input type="number" value={form.dose} onChange={e=>setForm(p=>({...p,dose:e.target.value}))} placeholder="מינון" style={{width:56,padding:"10px 6px",border:`1.5px solid ${T.border}`,borderRadius:12,fontSize:13,outline:"none",textAlign:"center"}}/>
                <select value={form.unit} onChange={e=>setForm(p=>({...p,unit:e.target.value}))} style={{padding:"10px 6px",border:`1.5px solid ${T.border}`,borderRadius:12,fontSize:12,outline:"none"}}><option>מ"ל</option><option>מ"ג</option><option>טבליות</option></select></>}
              </div>
            </div>
          ))}
        </div>
        <button onClick={()=>form.name&&form.every&&setStep("confirm")} disabled={!form.name||!form.every}
          style={{width:"100%",background:(!form.name||!form.every)?T.border:T.primary,color:(!form.name||!form.every)?T.muted:"white",border:"none",borderRadius:16,padding:14,fontSize:14,fontWeight:800,cursor:"pointer",marginTop:18}}>
          המשך לאישור ←
        </button>
      </>}

      {step==="confirm"&&<>
        <Prog cur={2} tot={3}/>
        {rxMethod==="camera"&&<div style={{background:"#EEF7F2",border:"1px solid #C8E6C9",borderRadius:10,padding:"8px 12px",marginBottom:12,fontSize:12,color:T.primary,fontWeight:600}}>✅ פרטים זוהו מהמדבקה — בדוק ואשר</div>}
        <div style={{fontSize:16,fontWeight:800,marginBottom:14}}>אישור והפעלה</div>
        <div style={{background:"#F7F4EF",borderRadius:16,padding:"14px",marginBottom:16}}>
          {[["שם",form.name||(selected&&selected.name)],["סוג",type],
            ["מינון",type==="OTC"?((selected&&selected.doses[1]?selected.doses[1].d:(selected&&selected.doses[0]?selected.doses[0].d:""))):`${form.dose} ${form.unit}`],
            ["תדירות",`כל ${form.every||(selected&&selected.intervalHours)} שעות`],
            ["אופן נטילה",type==="OTC"?(selected&&selected.route):"לפי הוראות רופא"],
            form.duration?["משך טיפול",`${form.duration} ימים`]:null,
            form.notes?["הערות",form.notes]:null,
          ].filter(Boolean).map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${T.border}`}}>
              <span style={{fontSize:13,color:T.muted}}>{k}</span>
              <span style={{fontSize:13,fontWeight:700,color:T.text}}>{v}</span>
            </div>
          ))}
        </div>
        <button onClick={doAdd} style={{width:"100%",background:T.primary,color:"white",border:"none",borderRadius:16,padding:14,fontSize:14,fontWeight:800,cursor:"pointer",marginBottom:10}}>💊 הפעל מעקב</button>
        <button onClick={()=>setStep(type==="OTC"?"otc-detail":rxMethod==="camera"?"rx-camera":"rx-manual")} style={{width:"100%",background:"none",color:T.muted,border:`1.5px solid ${T.border}`,borderRadius:16,padding:12,fontSize:13,cursor:"pointer"}}>חזור לעריכה</button>
      </>}
    </Modal>
  );
}

// ─────────────────────────────────────────
// MEDICATIONS SCREEN
// ─────────────────────────────────────────
function MedRowItem({ med, onHistory, onEdit, onDelete, onToggle }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{background:T.card,borderRadius:18,border:`1.5px solid ${med.active?T.border:"#E8E0D5"}`,overflow:"hidden",opacity:med.active?1:0.6}}>
      <div style={{height:4,background:med.active?med.color:T.border}}/>
      <div style={{padding:"14px 16px"}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:6}}>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
              <span style={{fontSize:15,fontWeight:900,color:T.text,fontFamily:"'Noto Serif Hebrew',serif"}}>{med.name}</span>
              <span style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:20,background:med.type==="OTC"?"#E8F5F0":"#EEF3FF",color:med.type==="OTC"?T.primary:"#4A90D9"}}>{med.type}</span>
              {!med.active&&<span style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:20,background:"#F0EDE8",color:T.muted}}>מושהה</span>}
            </div>
            <div style={{fontSize:12,color:T.muted}}>{med.dose} · כל {med.intervalHours} שעות</div>
          </div>
          <button onClick={()=>setOpen(!open)} style={{background:"none",border:"none",fontSize:18,cursor:"pointer",color:T.muted,transform:open?"rotate(180deg)":"none",transition:"transform 0.2s"}}>⌄</button>
        </div>
        <button onClick={onHistory} style={{display:"flex",alignItems:"center",gap:6,background:"#F7F4EF",border:"none",borderRadius:9,padding:"5px 11px",fontSize:12,color:T.primary,fontWeight:700,cursor:"pointer"}}>
          📋 {med.history.length} מנות — צפה בהיסטוריה
        </button>
        {open&&<div style={{display:"flex",gap:8,marginTop:10,paddingTop:10,borderTop:`1px solid ${T.border}`}}>
          {[{l:"✏️ עריכה",fn:onEdit,bg:"#EEF7F2",c:T.primary},
            {l:med.active?"⏸ השהה":"▶ הפעל",fn:onToggle,bg:med.active?"#FFF3E0":"#EEF7F2",c:med.active?"#E65100":T.primary},
            {l:"🗑️ הסר",fn:onDelete,bg:T.dangerBg,c:T.danger}].map((a,i)=>(
            <button key={i} onClick={a.fn} style={{flex:1,background:a.bg,color:a.c,border:"none",borderRadius:10,padding:"9px",fontSize:12,fontWeight:700,cursor:"pointer"}}>{a.l}</button>
          ))}
        </div>}
      </div>
    </div>
  );
}

function EditMedModal({ med, onSave, onClose }) {
  const [dose, setDose]   = useState(med.dose);
  const [every, setEvery] = useState(String(med.intervalHours));
  const [dur, setDur]     = useState(med.durationDays ? String(med.durationDays) : "");
  return (
    <Modal onClose={onClose}>
      <div style={{fontSize:17,fontWeight:900,marginBottom:14,fontFamily:"'Noto Serif Hebrew',serif"}}>✏️ {med.name}</div>
      {[{l:"מינון",v:dose,set:setDose,p:'5 מ"ל'},{l:"כל כמה שעות",v:every,set:setEvery,p:"6",t:"number"},{l:"משך טיפול (ימים)",v:dur,set:setDur,p:"ריק = ללא הגבלה",t:"number"}].map(f=>(
        <div key={f.l} style={{marginBottom:12}}>
          <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:5}}>{f.l}</div>
          <input type={f.t||"text"} value={f.v} onChange={e=>f.set(e.target.value)} placeholder={f.p} style={{width:"100%",padding:"10px 12px",border:`1.5px solid ${T.border}`,borderRadius:12,fontSize:14,outline:"none",direction:"rtl"}}/>
        </div>
      ))}
      <button onClick={()=>onSave({...med,dose,intervalHours:Number(every),durationDays:dur?Number(dur):null})}
        style={{width:"100%",background:T.primary,color:"white",border:"none",borderRadius:16,padding:14,fontSize:14,fontWeight:800,cursor:"pointer",marginBottom:10}}>שמור</button>
      <button onClick={onClose} style={{width:"100%",background:"none",color:T.muted,border:`1.5px solid ${T.border}`,borderRadius:16,padding:12,fontSize:13,cursor:"pointer"}}>ביטול</button>
    </Modal>
  );
}

function EditSettingsField({ field, profile, onSave, onClose }) {
  const [val, setVal] = useState(profile[field.key] || "");
  return (
    <Modal onClose={onClose}>
      <div style={{fontSize:18,fontWeight:900,marginBottom:4,fontFamily:"'Noto Serif Hebrew',serif"}}>{field.label}</div>
      <div style={{fontSize:13,color:T.muted,marginBottom:18}}>{field.hint}</div>
      {field.scroll ? (
        <>
          <ScrollPicker options={field.opts} value={val||field.opts[3]} onChange={setVal} unit={field.unit}/>
          <div style={{display:"flex",alignItems:"center",gap:8,marginTop:12}}>
            <span style={{fontSize:12,color:T.muted}}>או הזן ידנית:</span>
            <input type="number" value={val} onChange={e=>setVal(e.target.value)} style={{flex:1,padding:"9px 12px",border:`1.5px solid ${T.border}`,borderRadius:10,fontSize:15,outline:"none",textAlign:"center"}}/>
            <span style={{fontSize:13,color:T.muted}}>{field.unit}</span>
          </div>
        </>
      ) : (
        <input autoFocus type={field.type} value={val} onChange={e=>setVal(e.target.value)} placeholder={field.placeholder} style={{width:"100%",padding:"13px 15px",border:`2px solid ${T.primary}`,borderRadius:13,fontSize:17,outline:"none",direction:"rtl",color:T.text}}/>
      )}
      <button onClick={()=>onSave(val)} style={{width:"100%",background:T.primary,color:"white",border:"none",borderRadius:16,padding:15,fontSize:15,fontWeight:800,cursor:"pointer",marginTop:20}}>שמור</button>
    </Modal>
  );
}

function MedicationsScreen({ profile, medications, setMedications }) {
  const [tab, setTab] = useState("active");
  const [showAdd, setShowAdd] = useState(false);
  const [histMed, setHistMed] = useState(null);
  const [editMed, setEditMed] = useState(null);
  const [delMed, setDelMed]   = useState(null);

  const displayed = tab==="active" ? medications.filter(m=>m.active) : medications;
  const active = medications.filter(m=>m.active).length;

  return (
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:"'Heebo',sans-serif",direction:"rtl",maxWidth:420,margin:"0 auto",paddingBottom:100}}>
      <div style={{background:T.primary,padding:"52px 24px 24px",borderRadius:"0 0 28px 28px"}}>
        <div style={{fontSize:13,color:"rgba(255,255,255,0.65)",marginBottom:4}}>{profile.name}</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:24,fontWeight:900,color:"white",fontFamily:"'Noto Serif Hebrew',serif"}}>💊 תרופות</div>
          <button onClick={()=>setShowAdd(true)} style={{background:"rgba(255,255,255,0.2)",color:"white",border:"none",borderRadius:12,padding:"8px 16px",fontSize:13,fontWeight:700,cursor:"pointer"}}>+ הוסף</button>
        </div>
        <div style={{display:"flex",gap:8,marginTop:14}}>
          {[{id:"active",label:`פעילות (${active})`},{id:"all",label:"הכל"}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"6px 16px",borderRadius:20,fontSize:12,fontWeight:700,border:"none",cursor:"pointer",background:tab===t.id?"white":"rgba(255,255,255,0.15)",color:tab===t.id?T.primary:"rgba(255,255,255,0.85)"}}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{padding:"18px 20px 0"}}>
        <div style={{display:"flex",gap:10,marginBottom:16}}>
          {[{l:"תרופות פעילות",v:active,c:T.primary,bg:"#EEF7F2"},{l:"מנות ניתנו",v:medications.reduce((a,m)=>a+m.history.length,0),c:"#4A90D9",bg:"#EEF3FF"}].map((s,i)=>(
            <div key={i} style={{flex:1,background:s.bg,borderRadius:14,padding:"11px 14px",border:`1.5px solid ${s.c}22`}}>
              <div style={{fontSize:22,fontWeight:900,color:s.c}}>{s.v}</div>
              <div style={{fontSize:11,color:T.muted,marginTop:1}}>{s.l}</div>
            </div>
          ))}
        </div>

        {displayed.length===0 ? (
          <div style={{textAlign:"center",padding:"40px 0",color:T.muted}}>
            <div style={{fontSize:36,marginBottom:8}}>💊</div>
            <div style={{fontSize:14,fontWeight:600}}>אין תרופות להצגה</div>
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {displayed.map(med=>(
              <MedRowItem key={med.id} med={med}
                onHistory={()=>setHistMed(med)}
                onEdit={()=>setEditMed(med)}
                onDelete={()=>setDelMed(med)}
                onToggle={()=>setMedications(ms=>ms.map(m=>m.id===med.id?{...m,active:!m.active}:m))}
              />
            ))}
          </div>
        )}
      </div>

      {showAdd && <AddMedModal onAdd={med=>setMedications(ms=>[...ms,med])} onClose={()=>setShowAdd(false)}/>}

      {histMed && <Modal onClose={()=>setHistMed(null)}>
        <div style={{fontSize:17,fontWeight:900,marginBottom:16,fontFamily:"'Noto Serif Hebrew',serif"}}>{histMed.name} — היסטוריה</div>
        <div style={{fontSize:12,color:T.muted,marginBottom:12}}>{histMed.history.length} מנות ניתנו</div>
        {histMed.history.length===0
          ? <div style={{textAlign:"center",padding:"20px 0",color:T.muted}}>לא ניתנו מנות עדיין</div>
          : [...histMed.history].reverse().map((h,i)=>(
            <div key={i} style={{display:"flex",gap:12,paddingBottom:14,position:"relative"}}>
              {i<histMed.history.length-1&&<div style={{position:"absolute",right:15,top:28,bottom:0,width:2,background:T.border}}/>}
              <div style={{width:32,height:32,borderRadius:"50%",background:histMed.color+"22",border:`2px solid ${histMed.color}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0,zIndex:1}}>💊</div>
              <div style={{flex:1,paddingTop:3}}>
                <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:14,fontWeight:800}}>{histMed.dose}</span><span style={{fontSize:12,color:T.muted}}>{h.time}</span></div>
                <div style={{fontSize:12,color:T.muted}}>ע"י {h.who}</div>
                {h.note&&<div style={{fontSize:12,background:"#F7F4EF",borderRadius:8,padding:"4px 9px",marginTop:4}}>📝 {h.note}</div>}
              </div>
            </div>
          ))
        }
        <button onClick={()=>setHistMed(null)} style={{width:"100%",background:T.primary,color:"white",border:"none",borderRadius:14,padding:13,fontSize:14,fontWeight:800,cursor:"pointer",marginTop:8}}>סגור</button>
      </Modal>}

      {editMed && <EditMedModal med={editMed}
        onSave={updated=>{setMedications(ms=>ms.map(m=>m.id===updated.id?updated:m));setEditMed(null);}}
        onClose={()=>setEditMed(null)}/>}

      {delMed && <Modal onClose={()=>setDelMed(null)}>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:44,marginBottom:12}}>🗑️</div>
          <div style={{fontSize:17,fontWeight:900,marginBottom:8,fontFamily:"'Noto Serif Hebrew',serif"}}>הסר {delMed.name}?</div>
          <div style={{fontSize:13,color:T.muted,lineHeight:1.6,marginBottom:22}}>התרופה תועבר לארכיון.</div>
          <button onClick={()=>{setMedications(ms=>ms.map(m=>m.id===delMed.id?{...m,active:false}:m));setDelMed(null);}}
            style={{width:"100%",background:T.danger,color:"white",border:"none",borderRadius:16,padding:14,fontSize:14,fontWeight:800,cursor:"pointer",marginBottom:10}}>כן, הסר</button>
          <button onClick={()=>setDelMed(null)} style={{width:"100%",background:"none",color:T.muted,border:`1.5px solid ${T.border}`,borderRadius:16,padding:12,fontSize:13,cursor:"pointer"}}>ביטול</button>
        </div>
      </Modal>}
    </div>
  );
}
// ─────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────
export default function App() {
  // eslint-disable-next-line no-unused-vars
  const { user, loading, familyId, login } = useAuth();
  const { profile, updateProfile }         = useChildProfile(familyId);
  const { medications, addMedication }     = useMedications(familyId);
  const { lastTemp, addReading }           = useTemperature(familyId);

  const [screen, setScreen]                   = useState("login");
  const [notifPermission, setNotifPermission] = useState(getNotifPermission());
  const [notifMinutes, setNotifMinutes]       = useState(15);
  const [showAddMed, setShowAddMed]           = useState(false);

  // אחרי login מ-Firebase — עבור לדשבורד
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (user && screen === "login") setScreen("notif-permission");
    if (!user && !loading)          setScreen("login");
  }, [user, loading, screen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (notifPermission === "granted") scheduleAllNotifs(medications, notifMinutes);
  }, [medications, notifPermission, notifMinutes]);

  const activeProfile = profile;

const handleFirebaseLogin = async () => {
  try { 
    await login();
    await initPushNotifications();
  } catch(e) { console.error(e); }
};

  const handleSetMedications = (updater) => {
    // עם Firebase — כל שינוי נכתב ישירות ל-Firestore
    // לא צריך setState מקומי
  };

  const handleAddMed = async (med) => {
    try { await addMedication(med); } catch(e) { console.error(e); }
  };

  const handleAddTemp = async (value, method, note) => {
    try { await addReading(value, method, user?.displayName || "הורה", note); } catch(e) { console.error(e); }
  };

  const handleUpdateProfile = async (data) => {
    try { await updateProfile(data); } catch(e) { console.error(e); }
  };

  if (loading) return (
    <div style={{ minHeight:"100vh", background:T.bg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Heebo',sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:52, marginBottom:16 }}>🧒</div>
        <div style={{ fontSize:16, color:T.muted }}>טוען...</div>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily:"'Heebo',sans-serif", direction:"rtl" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;700;800;900&family=Noto+Serif+Hebrew:wght@700;900&display=swap'); *{box-sizing:border-box;margin:0;padding:0;}`}</style>

      {screen==="login" && (
        <LoginScreen onDone={handleFirebaseLogin} isFirebase={true} />
      )}

      {screen==="notif-permission" && (
        <NotifPermissionScreen
          onDone={(perm) => { setNotifPermission(perm); setScreen("dashboard"); }}
        />
      )}

      {screen !== "login" && screen !== "notif-permission" && (
        <>
          {screen==="dashboard" && (
            <DashboardScreen
              profile={activeProfile || { name: user?.displayName || "הורה", avatar:"🧒" }}
              medications={medications}
              setMedications={handleSetMedications}
              lastTemp={lastTemp}
              setLastTemp={(t) => handleAddTemp(t.value, t.method, t.note)}
              setScreen={setScreen}
              setShowAddMed={setShowAddMed}
            />
          )}
          {screen==="medications" && (
            <MedicationsScreen
              profile={activeProfile || { name: user?.displayName || "הורה" }}
              medications={medications}
              setMedications={handleSetMedications}
            />
          )}
          {screen==="temp" && (
            <TempScreen
              profile={activeProfile || { name: user?.displayName || "הורה" }}
              lastTemp={lastTemp}
              setLastTemp={(t) => handleAddTemp(t.value, t.method, t.note)}
            />
          )}
          {screen==="settings" && (
            <SettingsScreen
              profile={activeProfile || { name: user?.displayName || "הורה", avatar:"🧒" }}
              setProfile={handleUpdateProfile}
              notifPermission={notifPermission}
              notifMinutes={notifMinutes}
              setNotifMinutes={setNotifMinutes}
              onRequestNotif={() => requestNotifPermission(p => setNotifPermission(p))}
            />
          )}
          <BottomNav screen={screen} setScreen={setScreen} />
          {showAddMed && (
            <AddMedModal
              onAdd={handleAddMed}
              onClose={() => setShowAddMed(false)}
            />
          )}
        </>
      )}
    </div>
  );
}