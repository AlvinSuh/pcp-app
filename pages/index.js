import { useState, useCallback } from "react";
import Head from "next/head";

// ── 데이터 상수 ───────────────────────────────────────────────────────
const NEO = {
  O: { label: "개방성", color: "#5DCAA5", facets: ["상상력","심미성","감수성","변화추구","지적호기심","가치개방성"] },
  C: { label: "성실성", color: "#378ADD", facets: ["유능감","질서정연","의무감","성취추구","자기훈련","신중함"] },
  E: { label: "외향성", color: "#EF9F27", facets: ["온정성","사교성","자기주장","활동성","자극추구","긍정정서"] },
  A: { label: "친화성", color: "#D4537E", facets: ["신뢰","솔직성","이타성","순응성","겸손","공감배려"] },
  N: { label: "신경성", color: "#E24B4A", facets: ["불안","적대감","우울","자의식","충동성","취약성"] },
};
const CLIFTON = {
  "실행력":    ["성취","정리","신념","공정성","심사숙고","체계","집중","책임","복구"],
  "관계형성":  ["적응","연결성","개발","공감","화합","포용","개별화","긍정","절친"],
  "영향력":    ["행동","주도력","커뮤니케이션","승부","최상화","자기확신","존재감","사교성"],
  "전략적사고":["분석","회고","미래지향","발상","수집","지적사고","배움","전략"],
};
const CAT_COL = { "실행력":"#378ADD","관계형성":"#D4537E","영향력":"#EF9F27","전략적사고":"#5DCAA5" };
const SCHWARTZ = ["보편주의","자비","전통","순응","안전","권력","성취","쾌락주의","자극","자기방향성"];
const VIA = ["창의성","호기심","판단력","학구열","통찰력","용감성","끈기","진정성","활력","사랑","친절","사회성","공정성","리더십","팀워크","용서","겸손","신중함","자기조절","심미안","감사","낙관성","유머","영성"];
const RANK_COLORS = [
  { bg:"#FAEEDA", text:"#633806" },
  { bg:"#E6F1FB", text:"#0C447C" },
  { bg:"#E1F5EE", text:"#085041" },
  { bg:"#EEEDFE", text:"#3C3489" },
  { bg:"#FAECE7", text:"#712B13" },
];

// ── 유틸 함수 ─────────────────────────────────────────────────────────
function initFacets() {
  const f = {};
  Object.keys(NEO).forEach(k => {
    f[k] = {};
    NEO[k].facets.forEach(name => { f[k][name] = 50; });
  });
  return f;
}
function avg(obj) {
  const v = Object.values(obj);
  return Math.round(v.reduce((a, b) => a + b, 0) / v.length);
}
function rankedStr(arr) {
  return arr.length ? arr.map((v, i) => `${i + 1}순위:${v}`).join(", ") : "미입력";
}
function extractJSON(text) {
  let s = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  const start = s.indexOf("{");
  if (start !== -1) {
    let depth = 0, end = -1;
    for (let i = start; i < s.length; i++) {
      if (s[i] === "{") depth++;
      else if (s[i] === "}") { depth--; if (depth === 0) { end = i; break; } }
    }
    if (end !== -1) {
      try { return JSON.parse(s.slice(start, end + 1)); } catch (_) {}
    }
  }
  throw new Error("JSON 파싱 실패. 응답: " + s.slice(0, 120));
}

// API 호출 → /api/chat (서버 경유, 키 안전)
async function callAPI(prompt, maxTokens = 4096) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, maxTokens }),
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
  return data.text;
}

// ── UI 공통 컴포넌트 ──────────────────────────────────────────────────
function StepIndicator({ step }) {
  const steps = ["데이터 입력", "구성개념 생성", "중요도 평가", "자기관리 방안"];
  return (
    <div style={{ display:"flex", alignItems:"center", marginBottom:"2rem" }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display:"flex", alignItems:"center", flex: i < steps.length - 1 ? "1" : "none" }}>
          <div title={s} style={{
            width:28, height:28, borderRadius:"50%", display:"flex", alignItems:"center",
            justifyContent:"center", fontSize:12, fontWeight:500, flexShrink:0,
            background: i+1 < step ? "#E1F5EE" : i+1 === step ? "#1a1a1a" : "transparent",
            color:       i+1 < step ? "#085041" : i+1 === step ? "#fff"    : "#aaa",
            border:      i+1 < step ? "1px solid #9FE1CB" : i+1 === step ? "1px solid #1a1a1a" : "0.5px solid #ddd",
          }}>
            {i + 1 < step ? "✓" : i + 1}
          </div>
          {i < steps.length - 1 && (
            <div style={{ flex:1, height:1, background: i+1 < step ? "#9FE1CB" : "#e0e0e0", margin:"0 4px" }} />
          )}
        </div>
      ))}
    </div>
  );
}

function Card({ children, style }) {
  return (
    <div style={{ background:"#fff", border:"0.5px solid #e8e8e4", borderRadius:12,
      padding:"1.25rem", marginBottom:"1rem", ...style }}>
      {children}
    </div>
  );
}

function Btn({ children, primary, disabled, onClick, style }) {
  return (
    <button disabled={disabled} onClick={onClick} style={{
      display:"inline-flex", alignItems:"center", gap:6, padding:"9px 20px",
      border: primary ? "1px solid #1a1a1a" : "0.5px solid #ccc",
      borderRadius:8, fontSize:14, fontWeight:500,
      background: primary ? "#1a1a1a" : "#fff",
      color:      primary ? "#fff"    : "#1a1a1a",
      opacity: disabled ? 0.4 : 1,
      cursor: disabled ? "not-allowed" : "pointer",
      transition: "opacity 0.15s",
      ...style,
    }}>
      {children}
    </button>
  );
}

function Spinner({ message }) {
  return (
    <div style={{ textAlign:"center", padding:"3rem 1rem" }}>
      <div style={{
        width:24, height:24, borderRadius:"50%",
        border:"2px solid #e0e0e0", borderTopColor:"#1a1a1a",
        animation:"spin 0.8s linear infinite", margin:"0 auto 1rem",
      }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <p style={{ fontSize:14, color:"#888" }}>{message || "AI가 분석하고 있습니다..."}</p>
    </div>
  );
}

function ErrorBox({ msg, onRetry, onBack }) {
  return (
    <div style={{ background:"#fff5f5", border:"0.5px solid #fca5a5", borderRadius:8, padding:"1rem", marginTop:"1rem" }}>
      <p style={{ fontSize:14, fontWeight:500, color:"#b91c1c", marginBottom:6 }}>오류가 발생했습니다</p>
      <pre style={{ fontSize:12, color:"#b91c1c", opacity:0.8, whiteSpace:"pre-wrap", wordBreak:"break-all",
        maxHeight:100, overflow:"auto", fontFamily:"monospace" }}>{msg}</pre>
      <div style={{ display:"flex", gap:8, marginTop:12 }}>
        {onBack  && <Btn onClick={onBack}>← 다시 입력</Btn>}
        {onRetry && <Btn primary onClick={onRetry}>재시도</Btn>}
      </div>
    </div>
  );
}

function RTag({ v, ranked, max, onToggle }) {
  const idx = ranked.indexOf(v);
  const isRanked = idx !== -1;
  const maxed = ranked.length >= max && !isRanked;
  return (
    <span onClick={() => !maxed && onToggle(v)} style={{
      display:"inline-flex", alignItems:"center", borderRadius:99, fontSize:12,
      cursor: maxed ? "not-allowed" : "pointer",
      border: isRanked ? "0.5px solid #bbb" : "0.5px solid #e0e0dc",
      background: isRanked ? "#fff" : "#f5f5f2",
      color:      isRanked ? "#1a1a1a" : "#666",
      opacity: maxed ? 0.35 : 1, overflow:"hidden", userSelect:"none",
    }}>
      {isRanked && (
        <span style={{ width:22, height:22, borderRadius:"50%", display:"flex", alignItems:"center",
          justifyContent:"center", fontSize:11, fontWeight:500, margin:"1px 0 1px 2px", flexShrink:0,
          background: RANK_COLORS[idx].bg, color: RANK_COLORS[idx].text }}>
          {idx + 1}
        </span>
      )}
      <span style={{ padding: isRanked ? "4px 8px 4px 4px" : "4px 10px" }}>{v}</span>
    </span>
  );
}

function RankedSection({ title, hint, items, ranked, max, onToggle, categories }) {
  return (
    <div>
      <div style={{ display:"flex", alignItems:"baseline", gap:6, marginBottom:6 }}>
        <span style={{ fontSize:14, fontWeight:500 }}>{title}</span>
        <span style={{ fontSize:11, padding:"1px 7px", borderRadius:99, background:"#f3f3f0",
          color:"#666", border:"0.5px solid #ddd" }}>{ranked.length}/{max}</span>
      </div>
      <p style={{ fontSize:11, color:"#888", marginBottom:8 }}>{hint}</p>
      <div style={{ display:"flex", flexWrap:"wrap", gap:6, padding:"6px 10px", background:"#f8f8f6",
        borderRadius:8, border:"0.5px solid #e5e5e0", marginBottom:10, minHeight:34, alignItems:"center" }}>
        {ranked.length === 0
          ? <span style={{ fontSize:12, color:"#aaa", fontStyle:"italic" }}>선택 순서가 순위가 됩니다</span>
          : ranked.map((v, i) => (
            <div key={v} style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:12,
              padding:"2px 8px 2px 3px", borderRadius:99, background:"#fff", border:"0.5px solid #ccc" }}>
              <span style={{ width:18, height:18, borderRadius:"50%", display:"flex", alignItems:"center",
                justifyContent:"center", fontSize:10, fontWeight:500, flexShrink:0,
                background: RANK_COLORS[i].bg, color: RANK_COLORS[i].text }}>{i + 1}</span>
              <span>{v}</span>
            </div>
          ))}
      </div>
      {categories
        ? Object.entries(categories).map(([cat, catItems]) => (
          <div key={cat} style={{ marginBottom:12 }}>
            <div style={{ fontSize:11, fontWeight:500, color:"#888", textTransform:"uppercase",
              letterSpacing:"0.05em", marginBottom:5, display:"flex", alignItems:"center", gap:5 }}>
              <span style={{ width:8, height:8, borderRadius:"50%", background: CAT_COL[cat], display:"inline-block" }} />
              {cat}
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {catItems.map(v => <RTag key={v} v={v} ranked={ranked} max={max} onToggle={onToggle} />)}
            </div>
          </div>
        ))
        : <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {items.map(v => <RTag key={v} v={v} ranked={ranked} max={max} onToggle={onToggle} />)}
          </div>
      }
    </div>
  );
}

// ── 메인 앱 ───────────────────────────────────────────────────────────
export default function Home() {
  const [step, setStep] = useState(1);
  const [facets, setFacets] = useState(initFacets);
  const [b5open, setB5open] = useState({ O:false, C:false, E:false, A:false, N:false });
  const [via, setVia]       = useState([]);
  const [cs, setCs]         = useState([]);
  const [sw, setSw]         = useState([]);
  const [diary, setDiary]   = useState("");
  const [selfChar, setSelfChar] = useState("");
  const [constructs, setConstructs] = useState([]);
  const [ratings, setRatings]       = useState({});
  const [plans, setPlans]           = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const toggleRanked = useCallback((setter, max) => (v) => {
    setter(prev => {
      const i = prev.indexOf(v);
      if (i !== -1) return prev.filter(x => x !== v);
      if (prev.length >= max) return prev;
      return [...prev, v];
    });
  }, []);

  const updateFacet = (k, f, val) =>
    setFacets(prev => ({ ...prev, [k]: { ...prev[k], [f]: val } }));

  // ── 구성개념 생성 (2회 분할 호출) ──
  const genConstructs = async () => {
    setLoading(true); setError(""); setStep(2);

    const b5Lines = Object.keys(NEO).map(k =>
      `${NEO[k].label}(${k}) 평균:${avg(facets[k])} [${
        Object.entries(facets[k]).map(([f, v]) => `${f}:${v}`).join(", ")
      }]`
    ).join("\n");

    const baseCtx = [
      `[NEO-PI-R]\n${b5Lines}`,
      `[VIA 강점 순위] ${rankedStr(via)}`,
      `[CliftonStrengths 순위] ${rankedStr(cs)}`,
      `[Schwartz 가치관 순위] ${rankedStr(sw)}`,
      diary    ? `[일기/SNS] ${diary.slice(0, 400)}`    : "",
      selfChar ? `[자기특성화] ${selfChar.slice(0, 500)}` : "",
    ].filter(Boolean).join("\n");

    const makePrompt = (ids, prev) => {
      const dup = prev.length
        ? `\n이미 도출된 구성개념(중복 금지): ${prev.map(c => `"${c.emergentPole}↔${c.implicitPole}"`).join(", ")}\n`
        : "";
      return `조지 켈리 개인구성개념 이론 전문가입니다.
아래 데이터를 분석해 양극성 구성개념 ${ids.length}개(id: ${ids.join(",")})를 도출하세요.
순위 높은 강점·가치관에 더 큰 가중치를 두세요.${dup}

${baseCtx}

JSON만 출력하세요:
{"constructs":[${ids.map(id =>
  `{"id":${id},"emergentPole":"긍정극(2-4단어)","implicitPole":"대비극(2-4단어)","description":"데이터와 연결한 설명 2문장"}`
).join(",")}]}`;
    };

    try {
      const t1 = await callAPI(makePrompt([1, 2, 3], []), 2000);
      const p1 = extractJSON(t1);
      if (!Array.isArray(p1.constructs)) throw new Error("1차: constructs 배열 없음");

      const t2 = await callAPI(makePrompt([4, 5], p1.constructs), 2000);
      const p2 = extractJSON(t2);
      if (!Array.isArray(p2.constructs)) throw new Error("2차: constructs 배열 없음");

      const all = [...p1.constructs, ...p2.constructs];
      setConstructs(all);
      const r = {}; all.forEach(c => { r[c.id] = 0; }); setRatings(r);
      setError("");
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  // ── 자기관리 방안 생성 (3회 분할 호출) ──
  const genPlans = async () => {
    setLoading(true); setError(""); setStep(4);
    const sorted = [...constructs].sort((a, b) => (ratings[b.id] || 0) - (ratings[a.id] || 0));
    const top3 = sorted.slice(0, 3);

    const ctx = [
      `VIA순위: ${rankedStr(via)}`,
      `CS순위: ${rankedStr(cs)}`,
      `Schwartz순위: ${rankedStr(sw)}`,
      selfChar ? `자기특성화(요약): ${selfChar.slice(0, 300)}` : "",
    ].filter(Boolean).join(" / ");

    try {
      const results = [];
      for (let i = 0; i < top3.length; i++) {
        const c = top3[i];
        const prompt = `조지 켈리 개인구성개념 이론 기반 심리 코치입니다.
핵심 자원: ${ctx}

분석 구성개념(TOP${i+1}, 중요도 ${ratings[c.id]}/5):
"${c.emergentPole} ↔ ${c.implicitPole}"
배경: ${c.description}

이 구성개념에 대해 건설적 대안주의(Constructive Alternativism) 관점의 자기관리 방안을 작성하세요.
1순위 강점·가치관을 핵심 자원으로 활용하세요.

JSON만 출력하세요:
{"rank":${i+1},"constructLabel":"${c.emergentPole} ↔ ${c.implicitPole}","insight":"핵심 통찰 2문장","strategies":["구체적 전략 1","구체적 전략 2","구체적 전략 3"],"reframingTip":"켈리식 재구성 1-2문장"}`;

        const text = await callAPI(prompt, 2000);
        const parsed = extractJSON(text);
        results.push(parsed);
      }
      setPlans(results); setError("");
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const restart = () => {
    setStep(1); setConstructs([]); setRatings({}); setPlans([]);
    setError(""); setSelfChar(""); setDiary("");
    setVia([]); setCs([]); setSw([]);
  };

  // ── 리포트 생성 ──
  const generateReport = () => {
    const sorted = [...constructs].sort((a, b) => (ratings[b.id] || 0) - (ratings[a.id] || 0));
    const today = new Date().toLocaleDateString("ko-KR", { year:"numeric", month:"long", day:"numeric" });
    const b5Summary = Object.keys(NEO).map(k => `${NEO[k].label}(${k}): ${avg(facets[k])}`).join(" · ");
    const rcColors = ["#8B5E0A","#2C2C2A","#085041"];
    const rcBg    = ["#FFF8EE","#F8F8F6","#F0FAF5"];

    const html = `<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8">
<title>개인 구성개념 자기관리 리포트</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;600;700&family=Noto+Sans+KR:wght@300;400;500;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Noto Sans KR',sans-serif;color:#1a1a1a;background:#fff;font-size:14px;line-height:1.7;}
.page{max-width:760px;margin:0 auto;padding:48px 40px;}
.cover{border-bottom:2px solid #1a1a1a;padding-bottom:32px;margin-bottom:40px;}
.cover-eyebrow{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#888;margin-bottom:12px;}
.cover-title{font-family:'Noto Serif KR',serif;font-size:28px;font-weight:700;line-height:1.3;margin-bottom:8px;}
.cover-sub{font-size:13px;color:#555;margin-bottom:20px;}
.cover-meta{display:flex;gap:24px;font-size:12px;color:#888;}
.cover-meta b{color:#1a1a1a;font-weight:500;}
.section{margin-bottom:36px;}
.sec-title{font-family:'Noto Serif KR',serif;font-size:17px;font-weight:600;margin-bottom:14px;padding-bottom:6px;border-bottom:0.5px solid #ddd;}
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;}
.info-box{background:#f8f8f6;border-radius:6px;padding:10px 12px;border:0.5px solid #e8e8e4;}
.info-box-label{font-size:10px;font-weight:500;color:#888;text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px;}
.info-box-value{font-size:13px;}
.c-row{display:flex;align-items:center;gap:8px;padding:10px 14px;border:0.5px solid #e8e8e4;border-radius:8px;margin-bottom:8px;flex-wrap:wrap;}
.c-num{width:22px;height:22px;border-radius:50%;background:#f0f0ee;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:500;flex-shrink:0;}
.pole-p{padding:3px 10px;border-radius:99px;font-size:12px;font-weight:500;background:#E6F1FB;color:#0C447C;}
.pole-n{padding:3px 10px;border-radius:99px;font-size:12px;font-weight:500;background:#FAECE7;color:#712B13;}
.stars{display:flex;gap:3px;margin-left:auto;}
.star-f{width:13px;height:13px;background:#1a1a1a;border-radius:2px;}
.star-e{width:13px;height:13px;background:#e0e0e0;border-radius:2px;}
.plan-card{border-radius:10px;padding:20px 22px;margin-bottom:20px;}
.plan-hdr{display:flex;align-items:center;gap:12px;margin-bottom:14px;}
.plan-rank{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:600;flex-shrink:0;}
.plan-label{font-weight:600;font-size:15px;}
.plan-imp{font-size:12px;color:#888;margin-top:2px;}
.divider{height:1px;background:rgba(0,0,0,.08);margin:12px 0;}
.sec-lbl{font-size:10px;font-weight:500;color:#888;text-transform:uppercase;letter-spacing:.06em;margin-bottom:7px;}
.insight{font-size:13px;line-height:1.8;margin-bottom:14px;}
.strat{display:flex;gap:10px;margin-bottom:8px;align-items:flex-start;}
.strat-num{width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:500;flex-shrink:0;margin-top:2px;}
.strat-txt{font-size:13px;line-height:1.75;}
.reframe{background:rgba(0,0,0,.04);border-radius:6px;padding:11px 13px;margin-top:12px;}
.reframe-lbl{font-size:10px;font-weight:500;color:#888;text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px;}
.reframe-txt{font-size:12px;line-height:1.65;font-style:italic;}
.selfchar{background:#f8f8f6;border-radius:8px;padding:14px 16px;font-size:13px;line-height:1.8;color:#333;white-space:pre-wrap;border:0.5px solid #e8e8e4;}
.footer{margin-top:48px;padding-top:16px;border-top:0.5px solid #e0e0e0;font-size:11px;color:#bbb;text-align:center;}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
</style></head><body>
<div class="page">
  <div class="cover">
    <div class="cover-eyebrow">Personal Construct Psychology · Self-Management Report</div>
    <div class="cover-title">개인 구성개념<br>자기관리 리포트</div>
    <div class="cover-sub">조지 켈리(George Kelly)의 개인구성개념 이론 기반 분석</div>
    <div class="cover-meta"><span><b>생성일</b> ${today}</span><span><b>분석 모델</b> NEO-PI-R · VIA · CliftonStrengths · Schwartz</span></div>
  </div>
  <div class="section">
    <div class="sec-title">1. 입력 데이터 요약</div>
    <div class="info-grid">
      <div class="info-box"><div class="info-box-label">Big5 평균 (NEO-PI-R)</div><div class="info-box-value">${b5Summary}</div></div>
      <div class="info-box"><div class="info-box-label">Schwartz 가치관 순위</div><div class="info-box-value">${rankedStr(sw)}</div></div>
      <div class="info-box"><div class="info-box-label">VIA 강점 순위</div><div class="info-box-value">${rankedStr(via)}</div></div>
      <div class="info-box"><div class="info-box-label">CliftonStrengths 순위</div><div class="info-box-value">${rankedStr(cs)}</div></div>
    </div>
    ${selfChar ? `<div style="margin-top:12px;"><div class="sec-lbl" style="margin-bottom:7px;">자기특성화 (Self-Characterization)</div><div class="selfchar">${selfChar.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</div></div>` : ""}
  </div>
  <div class="section">
    <div class="sec-title">2. 양극성 구성개념 5개 및 중요도</div>
    ${sorted.map((c, i) => {
      const r = ratings[c.id] || 0;
      const stars = [1,2,3,4,5].map(v => `<div class="${v<=r?"star-f":"star-e"}"></div>`).join("");
      return `<div class="c-row"><div class="c-num">${i+1}</div><span class="pole-p">${c.emergentPole}</span><span style="font-size:12px;color:#aaa;">↔</span><span class="pole-n">${c.implicitPole}</span><div class="stars">${stars}</div></div>`;
    }).join("")}
  </div>
  <div class="section">
    <div class="sec-title">3. TOP3 구성개념별 자기관리 방안</div>
    ${plans.map((plan, idx) => `
    <div class="plan-card" style="background:${rcBg[idx]};border:0.5px solid rgba(0,0,0,.07);">
      <div class="plan-hdr">
        <div class="plan-rank" style="border:1.5px solid ${rcColors[idx]};color:${rcColors[idx]};background:${rcBg[idx]};">${idx+1}</div>
        <div><div class="plan-label" style="color:${rcColors[idx]};">${plan.constructLabel}</div><div class="plan-imp">중요도 ${ratings[sorted[idx]?.id]||"-"}/5 · TOP ${idx+1}</div></div>
      </div>
      <div class="divider"></div>
      <div class="sec-lbl">핵심 통찰</div><div class="insight">${plan.insight}</div>
      <div class="sec-lbl">자기관리 전략</div>
      ${(plan.strategies||[]).map((s,i)=>`<div class="strat"><div class="strat-num" style="color:${rcColors[idx]};border:1px solid ${rcColors[idx]};">${i+1}</div><div class="strat-txt">${s}</div></div>`).join("")}
      <div class="reframe"><div class="reframe-lbl">건설적 대안 · Kelly's Constructive Alternativism</div><div class="reframe-txt">${plan.reframingTip}</div></div>
    </div>`).join("")}
  </div>
  <div class="footer">본 리포트는 조지 켈리의 개인구성개념 이론(Personal Construct Theory)에 기반하여 AI가 생성한 참고 자료입니다.</div>
</div>
<script>window.onload=()=>window.print();</script>
</body></html>`;

    const blob = new Blob([html], { type:"text/html;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  // ── Step 1 렌더 ──
  const renderStep1 = () => (
    <>
      <p style={{ fontSize:13, color:"#666", marginBottom:"1.5rem", lineHeight:1.6 }}>
        강점과 가치관은 중요한 순서대로 클릭하여 순위를 매겨주세요.
      </p>

      {/* Big5 */}
      <Card>
        <p style={{ fontSize:14, fontWeight:500, marginBottom:12 }}>
          Big5 성격검사 <span style={{ fontSize:12, fontWeight:400, color:"#888" }}>— NEO-PI-R 하위 항목 (클릭하여 펼치기)</span>
        </p>
        {Object.keys(NEO).map(k => {
          const info = NEO[k], ms = avg(facets[k]);
          return (
            <div key={k} style={{ border:"0.5px solid #e8e8e4", borderRadius:8, marginBottom:8, overflow:"hidden" }}>
              <div onClick={() => setB5open(p => ({ ...p, [k]: !p[k] }))}
                style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px",
                  cursor:"pointer", background:"#f8f8f6", userSelect:"none" }}>
                <div style={{ width:10, height:10, borderRadius:"50%", background:info.color, flexShrink:0 }} />
                <span style={{ fontSize:14, fontWeight:500, flex:1 }}>{info.label} ({k})</span>
                <span style={{ fontSize:13, fontWeight:500, color:"#888", minWidth:28, textAlign:"right" }}>{ms}</span>
                <span style={{ fontSize:11, color:"#888", transform: b5open[k] ? "rotate(180deg)" : "none", transition:"0.2s" }}>▼</span>
              </div>
              {b5open[k] && (
                <div style={{ padding:"10px 14px 14px" }}>
                  <div className="facet-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px 16px" }}>
                    {info.facets.map(f => (
                      <div key={f} style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontSize:12, color:"#666", width:72, flexShrink:0 }}>{f}</span>
                        <input type="range" min={1} max={100} value={facets[k][f]}
                          onChange={e => updateFacet(k, f, parseInt(e.target.value))}
                          style={{ flex:1 }} />
                        <span style={{ fontSize:12, fontWeight:500, minWidth:22, textAlign:"right" }}>{facets[k][f]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </Card>

      {/* VIA */}
      <Card>
        <RankedSection title="VIA 대표 강점" hint="가장 중요한 강점부터 순서대로 클릭 (최대 5개)"
          items={VIA} ranked={via} max={5} onToggle={toggleRanked(setVia, 5)} />
      </Card>

      {/* CliftonStrengths */}
      <Card>
        <RankedSection title="CliftonStrengths 34" hint="나를 가장 잘 나타내는 테마부터 순서대로 클릭 (최대 5개)"
          ranked={cs} max={5} onToggle={toggleRanked(setCs, 5)} categories={CLIFTON} />
      </Card>

      {/* Schwartz */}
      <Card>
        <RankedSection title="Schwartz 가치관" hint="가장 중요한 가치부터 순서대로 클릭 (최대 4개)"
          items={SCHWARTZ} ranked={sw} max={4} onToggle={toggleRanked(setSw, 4)} />
      </Card>

      {/* 일기 / SNS */}
      <Card>
        <p style={{ fontSize:14, fontWeight:500, marginBottom:8 }}>
          일기 또는 SNS 글 <span style={{ fontSize:12, fontWeight:400, color:"#888" }}>선택 입력</span>
        </p>
        <textarea value={diary} onChange={e => setDiary(e.target.value)}
          placeholder="최근에 쓴 일기나 SNS에 올린 글을 자유롭게 붙여넣으세요."
          style={{ width:"100%", padding:"10px 12px", border:"0.5px solid #ddd", borderRadius:8,
            fontSize:14, fontFamily:"inherit", resize:"vertical", minHeight:90,
            background:"#f8f8f6", color:"#1a1a1a" }} />
      </Card>

      {/* 자기특성화 */}
      <Card>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
          <p style={{ fontSize:14, fontWeight:500 }}>자기특성화 (Self-Characterization)</p>
          <span style={{ fontSize:11, padding:"1px 7px", borderRadius:99,
            background:"#E1F5EE", color:"#085041", border:"0.5px solid #9FE1CB" }}>Kelly 기법</span>
          <span style={{ fontSize:12, fontWeight:400, color:"#888" }}>선택 입력</span>
        </div>
        <div style={{ background:"#f0f7ff", border:"0.5px solid #b5d4f4", borderRadius:8,
          padding:"12px 14px", marginBottom:12 }}>
          <p style={{ fontSize:12, fontWeight:500, color:"#185FA5", marginBottom:6 }}>
            ✦ 조지 켈리의 자기특성화 작성 가이드라인
          </p>
          <ol style={{ fontSize:12, color:"#333", lineHeight:1.8, paddingLeft:16 }}>
            <li><strong>3인칭으로 작성하세요.</strong> 예: "홍길동은 …" (자신의 이름이나 가명 사용)</li>
            <li><strong>나를 깊이 이해하는 친한 친구</strong>가 공감적이고 따뜻한 시선으로 쓴 것처럼 작성하세요.</li>
            <li><strong>전체적인 모습</strong>을 담으세요. 결점 목록이 아닌 한 인간으로서의 전체 그림을 그리세요.</li>
            <li><strong>자유롭게</strong> 쓰세요. 정해진 형식에 얽매이지 마세요.</li>
            <li>자신이 <strong>어떻게 세상을 보고, 관계를 맺고, 상황을 해쳐나가는지</strong>가 드러나도록 쓰세요.</li>
          </ol>
          <p style={{ fontSize:11, color:"#378ADD", marginTop:8, fontStyle:"italic" }}>
            💡 예시: "이 사람은 늘 새로운 것에 호기심을 느끼며, 사람들 사이에서 …"
          </p>
        </div>
        <textarea value={selfChar} onChange={e => setSelfChar(e.target.value)}
          placeholder="3인칭으로 자유롭게 작성하세요 (분량 제한 없음)"
          style={{ width:"100%", padding:"10px 12px", border:"0.5px solid #ddd", borderRadius:8,
            fontSize:14, fontFamily:"inherit", resize:"vertical", minHeight:140,
            background:"#f8f8f6", color:"#1a1a1a", lineHeight:1.7 }} />
        {selfChar.length > 0 && (
          <p style={{ fontSize:11, color:"#aaa", marginTop:4, textAlign:"right" }}>{selfChar.length}자</p>
        )}
      </Card>

      <div style={{ display:"flex", justifyContent:"flex-end", marginTop:"1.5rem" }}>
        <Btn primary onClick={genConstructs}>양극성 구성개념 도출 →</Btn>
      </div>
    </>
  );

  // ── Step 2 렌더 ──
  const renderStep2 = () => {
    if (loading) return <Spinner message="양극성 구성개념을 도출하고 있습니다... (2회 호출)" />;
    if (error)   return (
      <>
        <p style={{ fontSize:18, fontWeight:500, marginBottom:4 }}>구성개념 생성 오류</p>
        <ErrorBox msg={error} onBack={() => { setStep(1); setError(""); }} onRetry={genConstructs} />
      </>
    );
    return (
      <>
        <p style={{ fontSize:18, fontWeight:500, marginBottom:4 }}>양극성 구성개념 후보 5개</p>
        <p style={{ fontSize:13, color:"#666", marginBottom:"1.5rem" }}>
          강점·가치관 순위와 NEO-PI-R 패턴을 통합하여 도출한 구성개념입니다.
        </p>
        {constructs.map((c, i) => (
          <Card key={c.id}>
            <p style={{ fontSize:12, color:"#888", marginBottom:8 }}>구성개념 {i + 1}</p>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10, flexWrap:"wrap" }}>
              <span style={{ padding:"4px 12px", borderRadius:99, fontSize:13, fontWeight:500, background:"#E6F1FB", color:"#0C447C" }}>{c.emergentPole}</span>
              <span style={{ fontSize:13, color:"#888" }}>↔</span>
              <span style={{ padding:"4px 12px", borderRadius:99, fontSize:13, fontWeight:500, background:"#FAECE7", color:"#712B13" }}>{c.implicitPole}</span>
            </div>
            <p style={{ fontSize:13, color:"#666", lineHeight:1.65 }}>{c.description}</p>
          </Card>
        ))}
        <div style={{ display:"flex", justifyContent:"flex-end", gap:10, marginTop:"1.5rem" }}>
          <Btn onClick={() => setStep(1)}>← 다시 입력</Btn>
          <Btn primary onClick={() => setStep(3)}>중요도 평가하기 →</Btn>
        </div>
      </>
    );
  };

  // ── Step 3 렌더 ──
  const renderStep3 = () => {
    const allRated = constructs.every(c => ratings[c.id] > 0);
    return (
      <>
        <p style={{ fontSize:18, fontWeight:500, marginBottom:4 }}>구성개념 중요도 평가</p>
        <p style={{ fontSize:13, color:"#666", marginBottom:"1.5rem" }}>
          각 구성개념이 당신 삶에서 얼마나 중요하게 작동하는지 5점으로 평가하세요.
        </p>
        {constructs.map(c => (
          <Card key={c.id}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12, flexWrap:"wrap" }}>
              <span style={{ padding:"3px 10px", borderRadius:99, fontSize:12, fontWeight:500, background:"#E6F1FB", color:"#0C447C" }}>{c.emergentPole}</span>
              <span style={{ fontSize:11, color:"#888" }}>↔</span>
              <span style={{ padding:"3px 10px", borderRadius:99, fontSize:12, fontWeight:500, background:"#FAECE7", color:"#712B13" }}>{c.implicitPole}</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:11, color:"#888", width:60 }}>덜 중요</span>
              <div style={{ display:"flex", gap:6, flex:1, justifyContent:"center" }}>
                {[1,2,3,4,5].map(v => (
                  <div key={v} onClick={() => setRatings(p => ({ ...p, [c.id]: v }))}
                    style={{ width:30, height:30, borderRadius:"50%", display:"flex",
                      alignItems:"center", justifyContent:"center", cursor:"pointer",
                      fontSize:13, fontWeight:500,
                      background: ratings[c.id] >= v ? "#1a1a1a" : "#f3f3f0",
                      color:      ratings[c.id] >= v ? "#fff"    : "#888",
                      border:     ratings[c.id] >= v ? "1px solid #1a1a1a" : "0.5px solid #ccc" }}>
                    {v}
                  </div>
                ))}
              </div>
              <span style={{ fontSize:11, color:"#888", width:60, textAlign:"right" }}>매우 중요</span>
            </div>
          </Card>
        ))}
        <div style={{ display:"flex", justifyContent:"flex-end", gap:10, marginTop:"1.5rem" }}>
          <Btn onClick={() => setStep(2)}>← 구성개념 보기</Btn>
          <Btn primary disabled={!allRated} onClick={genPlans}>
            {allRated ? "자기관리 방안 생성 →" : "모두 평가해주세요"}
          </Btn>
        </div>
      </>
    );
  };

  // ── Step 4 렌더 ──
  const renderStep4 = () => {
    if (loading) return <Spinner message="TOP3 구성개념별 자기관리 방안을 순서대로 생성 중입니다... (3회 호출)" />;
    if (error)   return (
      <>
        <p style={{ fontSize:18, fontWeight:500, marginBottom:4 }}>자기관리 방안 생성 오류</p>
        <ErrorBox msg={error} onRetry={genPlans} />
      </>
    );
    const sorted = [...constructs].sort((a, b) => (ratings[b.id] || 0) - (ratings[a.id] || 0));
    const rcStyle = [
      { bg:"#FAEEDA", color:"#633806" },
      { bg:"#F1EFE8", color:"#2C2C2A" },
      { bg:"#E1F5EE", color:"#085041" },
    ];
    return (
      <>
        <p style={{ fontSize:18, fontWeight:500, marginBottom:4 }}>TOP3 구성개념별 자기관리 방안</p>
        <p style={{ fontSize:13, color:"#666", marginBottom:"1.5rem" }}>
          강점·가치관 순위와 NEO-PI-R 패턴이 통합된 개인 맞춤형 방안입니다.
        </p>
        {plans.map((plan, idx) => (
          <Card key={idx}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:4 }}>
              <div style={{ width:32, height:32, borderRadius:"50%", display:"flex",
                alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:500,
                flexShrink:0, background: rcStyle[idx].bg, color: rcStyle[idx].color }}>
                {idx + 1}
              </div>
              <div>
                <p style={{ fontWeight:500, fontSize:15, marginBottom:2 }}>{plan.constructLabel}</p>
                <p style={{ fontSize:12, color:"#888" }}>중요도 {ratings[sorted[idx]?.id] || "-"}/5</p>
              </div>
            </div>
            <div style={{ height:1, background:"#eee", margin:"12px 0" }} />
            <div style={{ marginBottom:"1rem" }}>
              <p style={{ fontSize:12, fontWeight:500, color:"#888", marginBottom:6 }}>핵심 통찰</p>
              <p style={{ fontSize:14, lineHeight:1.7 }}>{plan.insight}</p>
            </div>
            <div style={{ marginBottom:"1rem" }}>
              <p style={{ fontSize:12, fontWeight:500, color:"#888", marginBottom:8 }}>자기관리 전략</p>
              {(plan.strategies || []).map((s, i) => (
                <div key={i} style={{ display:"flex", gap:10, marginBottom:8, alignItems:"flex-start" }}>
                  <div style={{ width:20, height:20, borderRadius:"50%", border:"0.5px solid #ccc",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:11, fontWeight:500, flexShrink:0, marginTop:1 }}>{i + 1}</div>
                  <p style={{ fontSize:14, lineHeight:1.7 }}>{s}</p>
                </div>
              ))}
            </div>
            <div style={{ background:"#f8f8f6", borderRadius:8, padding:12 }}>
              <p style={{ fontSize:12, fontWeight:500, color:"#888", marginBottom:5 }}>건설적 대안 (Kelly)</p>
              <p style={{ fontSize:13, lineHeight:1.65 }}>{plan.reframingTip}</p>
            </div>
          </Card>
        ))}
        <div style={{ display:"flex", justifyContent:"flex-end", gap:10, marginTop:"1.5rem" }}>
          <Btn onClick={restart}>처음부터 다시 시작</Btn>
          <Btn primary onClick={generateReport}>📄 리포트 출력 / 저장</Btn>
        </div>
      </>
    );
  };

  return (
    <>
      <Head>
        <title>개인 구성개념 분석 | Personal Construct Psychology</title>
        <meta name="description" content="조지 켈리의 개인구성개념 이론 기반 자기분석 및 자기관리 방안 도출 앱" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div style={{ minHeight:"100vh", background:"#fafaf8" }}>
        {/* 헤더 */}
        <header style={{ background:"#fff", borderBottom:"0.5px solid #e8e8e4",
          padding:"0 1.5rem", height:56, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"baseline", gap:10 }}>
            <span style={{ fontSize:16, fontWeight:600 }}>PCP</span>
            <span style={{ fontSize:13, color:"#888" }}>개인 구성개념 분석</span>
          </div>
          <span style={{ fontSize:11, color:"#aaa" }}>Based on George Kelly's Personal Construct Theory</span>
        </header>

        {/* 메인 */}
        <main style={{ maxWidth:720, margin:"0 auto", padding:"2rem 1.5rem" }}>
          <StepIndicator step={step} />
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </main>

        {/* 푸터 */}
        <footer style={{ textAlign:"center", padding:"2rem 1rem", fontSize:12, color:"#bbb",
          borderTop:"0.5px solid #e8e8e4", marginTop:"2rem" }}>
          Personal Construct Psychology App · Based on George Kelly (1955)
        </footer>
      </div>
    </>
  );
}
