/* USW SYNC — 준완성형 프런트. 서버 없이 브라우저 저장소(localStorage)에 저장한다. */
(() => {
'use strict';
const KEY = 'uswsync.v1';
const DAYS = ['월', '화', '수', '목', '금'];
const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17];
const FEATS = [
  { id: 'team', name: '팀 만들기 · 초대', short: '팀' },
  { id: 'tt', name: '시간표 · 가능 시간 등록', short: '시간표' },
  { id: 'free', name: '공통 공강 찾기', short: '공통 공강' },
  { id: 'vote', name: '회의 시간 추천 · 투표', short: '추천 · 투표' },
  { id: 'meet', name: '회의 일정', short: '회의 일정' },
  { id: 'task', name: '역할 · 할 일', short: '할 일' },
  { id: 'due', name: '마감 · 진행 상황', short: '마감 현황' }
];
const CARDS = ['free', 'meet', 'task', 'due'];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = sel => document.querySelector(sel);
const uid = () => Math.random().toString(36).slice(2, 9);
const pad = n => String(n).padStart(2, '0');
const today = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); };
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromIso = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const md = s => { const d = fromIso(s); return `${d.getMonth() + 1}/${d.getDate()}`; };
const dday = s => Math.round((fromIso(s) - today()) / 864e5);
const ddayText = s => { const n = dday(s); return n === 0 ? 'D-DAY' : n > 0 ? `D-${n}` : `D+${-n}`; };
const nextDate = (day, from = today()) => { const d = new Date(from); const w = d.getDay(); let diff = (day + 1 - w + 7) % 7; if (diff === 0) diff = 7; d.setDate(d.getDate() + diff); return d; };
const slotKey = (d, h) => `${d}-${h}`;
const slotText = k => { const [d, h] = k.split('-').map(Number); return `${DAYS[d]} ${pad(h)}:00`; };

/* ---------- 저장소 ---------- */
function seed() {
  const busy = {
    me: ['0-9', '0-10', '0-11', '1-13', '1-14', '2-9', '2-10', '3-15', '3-16', '4-10', '4-11'],
    m1: ['0-13', '0-14', '1-9', '1-10', '1-11', '2-13', '2-14', '2-15', '3-9', '3-10', '4-13', '4-14'],
    m2: ['0-9', '0-10', '1-15', '1-16', '2-9', '2-10', '2-11', '3-13', '3-14', '4-9', '4-10'],
    m3: ['0-15', '0-16', '1-9', '1-10', '2-14', '2-15', '3-9', '3-10', '3-11', '4-15', '4-16']
  };
  const t = today();
  const plus = n => { const d = new Date(t); d.setDate(d.getDate() + n); return iso(d); };
  const mon = nextDate(0);
  return {
    user: null,
    team: { name: '캡스톤 3조', code: 'USW-' + uid().toUpperCase().slice(0, 6), created: iso(t) },
    members: [
      { id: 'me', name: '', role: '기획 · 일정' },
      { id: 'm1', name: '김민수', role: '백엔드' },
      { id: 'm2', name: '이서연', role: '프론트' },
      { id: 'm3', name: '박지훈', role: '발표 · 자료' }
    ],
    busy,
    candidates: ['0-12', '2-12', '4-12'],
    votes: { '0-12': ['m1', 'm2'], '2-12': ['m3'], '4-12': [] },
    meetings: [
      { id: uid(), date: iso(mon), time: '12:00', place: '중앙도서관 스터디룸 3', agenda: '역할 분담 확정 · 화면 시안 검토' }
    ],
    tasks: [
      { id: uid(), title: '요구사항 정리', who: 'me', due: plus(3), done: true },
      { id: uid(), title: '중간 점검 보고서', who: 'me', due: plus(4), done: false },
      { id: uid(), title: '화면 시안 다듬기', who: 'm2', due: plus(5), done: false },
      { id: uid(), title: 'API 설계서', who: 'm1', due: plus(6), done: false },
      { id: uid(), title: 'DB 스키마 초안', who: 'm1', due: plus(7), done: false },
      { id: uid(), title: '발표 자료 초안', who: 'm3', due: plus(10), done: false }
    ],
    deadlines: [
      { id: uid(), title: '중간 점검', date: plus(4) },
      { id: uid(), title: '시연 리허설', date: plus(14) },
      { id: uid(), title: '최종 발표', date: plus(21) }
    ],
    notice: `${md(plus(4))} 중간 점검 보고서 제출. 화면 틀은 확정됐고 세부 내용 채우는 중.`,
    settings: { notify: true }
  };
}
let S;
function load() { try { S = JSON.parse(localStorage.getItem(KEY)); } catch (e) { S = null; } if (!S || !S.team) S = seed(); }
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
const me = () => S.members.find(m => m.id === 'me');
const member = id => S.members.find(m => m.id === id) || { name: '?' };
const myName = () => (S.user && S.user.name) || '나';

/* ---------- 계산 ---------- */
function freeCount(k) { return S.members.filter(m => !(S.busy[m.id] || []).includes(k)).length; }
function allFreeSlots() { const out = []; DAYS.forEach((_, d) => HOURS.forEach(h => { const k = slotKey(d, h); if (freeCount(k) === S.members.length) out.push(k); })); return out; }
function nextMeeting() { const t = iso(today()); return S.meetings.filter(m => m.date >= t).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0]; }
function progress() { const n = S.tasks.length, d = S.tasks.filter(t => t.done).length; return { n, d, p: n ? Math.round(d / n * 100) : 0 }; }
function nearestDue() { const t = iso(today()); return S.deadlines.filter(x => x.date >= t).sort((a, b) => a.date.localeCompare(b.date))[0]; }
function status(fid) {
  switch (fid) {
    case 'team': return `팀원 ${S.members.length}명 · 초대 코드 ${S.team.code}`;
    case 'tt': { const n = (S.busy.me || []).length; return n ? `내 수업 ${n}칸 등록됨` : '아직 시간표를 넣지 않았어요'; }
    case 'free': return `전원 가능 ${allFreeSlots().length}칸 (평일 9~18시)`;
    case 'vote': { const mine = Object.values(S.votes).filter(v => v.includes('me')).length; return `후보 ${S.candidates.length}개 · 내 투표 ${mine}개`; }
    case 'meet': { const m = nextMeeting(); return m ? `다음 회의 ${md(m.date)} ${m.time} · ${m.place}` : '확정된 회의 없음'; }
    case 'task': { const mine = S.tasks.filter(t => t.who === 'me' && !t.done).length; return `내 할 일 ${mine}개 남음 · 전체 ${S.tasks.filter(t => !t.done).length}개`; }
    case 'due': { const p = progress(), d = nearestDue(); return `진행률 ${p.p}%` + (d ? ` · ${d.title} ${ddayText(d.date)}` : ''); }
  }
  return '';
}

/* ---------- 라우팅 ---------- */
const route = () => { const h = location.hash.replace(/^#\/?/, ''); const [a, b] = h.split('/'); return { page: a || 'intro', fid: b || '' }; };
const go = h => { location.hash = h; };
const isMobile = () => matchMedia('(max-width: 899px)').matches;
let toastT, openMenu = null, mobNoticeOpen = false, pcFid = '';

/* ---------- 조각 ---------- */
function header(opts) {
  const { login = false } = opts || {};
  const feat = route().fid || pcFid;
  return `<header class="hd">
    <button class="brand" data-act="home">USW SYNC <small>BETA</small></button>
    <div class="hbtns">${login ? `<button class="hb pri" data-act="go" data-to="login">로그인</button>` : `
      <span class="hbwrap"><button class="hb" data-menu="feat" aria-expanded="${openMenu === 'feat'}">세부기능</button>
        <div class="menu" ${openMenu === 'feat' ? '' : 'hidden'}><small>전체 기능</small>${FEATS.map(f => `<button data-act="open" data-fid="${f.id}" class="${feat === f.id ? 'cur' : ''}">${f.name}<span class="tiny">${f.short}</span></button>`).join('')}</div></span>
      <span class="hbwrap"><button class="hb" data-menu="set" aria-expanded="${openMenu === 'set'}">설정</button>
        <div class="menu" ${openMenu === 'set' ? '' : 'hidden'}><button data-act="toggleNotify">알림 <span class="tiny">${S.settings.notify ? '켜짐' : '꺼짐'}</span></button><button data-act="toast" data-msg="시간표 연동은 준비 중이에요 (에브리타임 불러오기 예정)">시간표 연동 <span class="tiny">준비 중</span></button><div class="sep"></div><button data-act="reset">데이터 초기화 <span class="tiny">예시로 되돌림</span></button></div></span>
      <span class="hbwrap"><button class="hb pri" data-menu="acct" aria-expanded="${openMenu === 'acct'}">계정</button>
        <div class="menu" ${openMenu === 'acct' ? '' : 'hidden'}><small>${esc(myName())} · ${esc(S.user ? S.user.sid : '')}</small><button data-act="open" data-fid="team">내 팀 <span class="tiny">${esc(S.team.name)}</span></button><div class="sep"></div><button data-act="logout">로그아웃</button></div></span>`}
    </div></header>`;
}

/* ---------- 소개 ---------- */
function pageIntro() {
  return `<div class="intro">${header({ login: true })}
  <div class="introbody">
    <section class="hero">
      <h1>팀플 시간 맞추기,<br>시간표만 올리면 끝.</h1>
      <p>수원대 학생을 위한 공강 기반 팀플 조율 서비스. 팀원이 시간표를 올리면 공통 공강을 바로 찾고, 회의 투표·확정부터 할 일과 마감까지 한곳에서 관리해요.</p>
      <div class="cta"><button class="btn pri" data-act="go" data-to="login">시작하기</button><button class="btn" data-act="scroll" data-to="#how">어떻게 되나요?</button></div>
    </section>
    <section class="zig" id="how">
      <div class="fig"><span class="cap">공통 공강 · 검은 칸 = 전원 가능</span>
        <div class="minigrid">${Array.from({ length: 25 }, (_, i) => `<i class="${[6, 7, 12, 17, 18].includes(i) ? 'b' : [1, 3, 9, 14, 20, 23].includes(i) ? 'h' : ''}"></i>`).join('')}</div></div>
      <div><h2>1. 시간표를 올리면 공통 공강이 보여요</h2><p>각자 수업 시간을 칸으로 찍기만 하면 팀 전체가 비는 시간을 자동으로 계산해요. 누가 언제 가능한지 묻고 답할 필요가 없어요.</p>
        <ul><li>평일 9~18시, 1시간 단위</li><li>가능한 사람 수가 칸마다 표시</li></ul></div>
    </section>
    <section class="zig rev">
      <div class="fig"><span class="cap">회의 시간 투표</span>
        <div class="minibar"><div><span>월 12:00</span><b style="--w:75%"></b><span class="num">3표</span></div><div><span>수 12:00</span><b style="--w:50%"></b><span class="num">2표</span></div><div><span>금 12:00</span><b style="--w:25%"></b><span class="num">1표</span></div></div></div>
      <div><h2>2. 추천 시간에 투표하고 바로 확정해요</h2><p>공통 공강 중에서 후보를 올리고 팀원이 투표해요. 가장 많이 모인 시간을 한 번에 회의로 확정하고 장소·안건까지 적어 둬요.</p>
        <ul><li>후보는 공통 공강에서만 고를 수 있어요</li><li>확정하면 회의 일정에 자동 등록</li></ul></div>
    </section>
    <section class="zig">
      <div class="fig"><span class="cap">할 일 · 마감</span>
        <div class="minilist"><div><i class="b"></i><s>요구사항 정리</s><span class="num" style="margin-left:auto">완료</span></div><div><i></i>중간 점검 보고서<span class="num" style="margin-left:auto">D-4</span></div><div><i></i>API 설계서<span class="num" style="margin-left:auto">D-6</span></div></div></div>
      <div><h2>3. 역할·할 일·마감을 한곳에서</h2><p>누가 무엇을 언제까지 하는지 팀 전체가 같은 화면으로 봐요. 진행률과 가장 가까운 마감이 항상 위에 떠 있어요.</p>
        <ul><li>팀원별 역할과 담당 할 일</li><li>마감 D-day와 진행률 자동 계산</li></ul></div>
    </section>
    <section class="footbox"><h2>지금 팀을 만들어 보세요</h2><p class="desc">서버 없이 이 브라우저에만 저장되는 체험판이에요. 로그인은 이름과 학번만 넣으면 돼요.</p><button class="btn pri" data-act="go" data-to="login">시작하기</button></section>
    <p class="foot">USW SYNC · 수원대학교 해커톤 팀 프로젝트 (임시 명칭) · 체험판</p>
  </div></div>`;
}

/* ---------- 로그인 ---------- */
function pageLogin() {
  return `<div class="login">${header({ login: true })}
  <div class="loginbody"><form class="card" id="loginForm">
    <h1>로그인</h1>
    <p class="note">체험판이라 비밀번호가 없어요. 이름과 학번만 넣으면 팀 화면으로 들어가요.</p>
    <div><label class="lbl" for="lname">이름</label><input class="inp" id="lname" required maxlength="12" placeholder="홍길동" autocomplete="name"></div>
    <div><label class="lbl" for="lsid">학번</label><input class="inp" id="lsid" required inputmode="numeric" maxlength="12" placeholder="20231234"></div>
    <button class="btn pri" type="submit">들어가기</button>
    <button class="btn ghost" type="button" data-act="go" data-to="">← 소개로</button>
  </form></div></div>`;
}

/* ---------- 기능 화면 ---------- */
function view(fid) {
  switch (fid) {
    case 'team': return viewTeam();
    case 'tt': return viewTT();
    case 'free': return viewFree();
    case 'vote': return viewVote();
    case 'meet': return viewMeet();
    case 'task': return viewTask();
    case 'due': return viewDue();
  }
  return viewHome();
}
function viewHome() {
  const m = nextMeeting(), p = progress(), d = nearestDue();
  return `<div class="sec"><span>${esc(S.team.name)}</span><small>TEAM HOME</small></div>
  <div class="members">${S.members.map(av).join('')}</div>
  <div class="kv"><b>다음 회의</b><span>${m ? `${md(m.date)} ${m.time} · ${esc(m.place)}` : '없음'}</span><b>진행률</b><span>${p.d}/${p.n} 완료 (${p.p}%)</span><b>가까운 마감</b><span>${d ? `${esc(d.title)} ${md(d.date)} (${ddayText(d.date)})` : '없음'}</span></div>
  <div class="sec"><span>공지</span><small>NOTICE</small></div>
  <textarea class="ta" data-bind="notice" placeholder="팀 공지를 적어 두세요">${esc(S.notice)}</textarea>
  <p class="desc">공지는 입력하는 대로 저장돼요. 왼쪽·오른쪽 카드나 위의 세부기능에서 기능을 열 수 있어요.</p>`;
}
function av(m) { return `<span class="av ${m.id === 'me' ? 'me' : ''}"><i>${esc((m.id === 'me' ? myName() : m.name).slice(0, 1))}</i>${esc(m.id === 'me' ? myName() : m.name)}${m.role ? ` <span class="desc">· ${esc(m.role)}</span>` : ''}</span>`; }
function viewTeam() {
  const link = `${location.origin}${location.pathname}#/join/${S.team.code}`;
  return `<div class="sec"><span>팀 정보</span><small>TEAM</small></div>
  <div class="row2"><div><label class="lbl">팀 이름</label><input class="inp" data-bind="team.name" value="${esc(S.team.name)}"></div><span class="desc">만든 날 ${md(S.team.created)}</span></div>
  <div class="sec"><span>초대 링크</span><small>INVITE</small></div>
  <div class="linkbox"><code>${esc(link)}</code><button class="btn sm" data-act="copy" data-text="${esc(link)}">복사</button></div>
  <p class="desc">링크를 받은 팀원이 열면 이 팀에 바로 들어와요. (체험판에서는 같은 브라우저 안에서만 동작)</p>
  <div class="sec"><span>팀원 ${S.members.length}명</span><small>MEMBERS</small></div>
  <div class="list">${S.members.map(m => `<div class="item"><span class="av ${m.id === 'me' ? 'me' : ''}" style="grid-row:1/3"><i>${esc((m.id === 'me' ? myName() : m.name).slice(0, 1))}</i></span><span class="t">${esc(m.id === 'me' ? myName() : m.name)}${m.id === 'me' ? ' <span class="tag">나</span>' : ''}</span><span class="s">역할: <input class="inp" style="min-height:28px;padding:2px 8px;font-size:12.5px;width:140px;display:inline-block" data-role="${m.id}" value="${esc(m.role)}"></span>${m.id !== 'me' ? `<span class="r"><button class="btn sm ghost" data-act="rmMember" data-id="${m.id}">내보내기</button></span>` : ''}</div>`).join('')}</div>
  <form class="form" data-form="addMember"><label class="lbl">팀원 직접 추가 (초대 링크 대신)</label><div class="g2"><input class="inp" name="name" required maxlength="12" placeholder="이름"><input class="inp" name="role" maxlength="20" placeholder="역할 (선택)"></div><button class="btn" type="submit">추가</button></form>`;
}
function ttTable(cellFn) {
  return `<div class="ttwrap"><table class="tt"><thead><tr><th></th>${DAYS.map(d => `<th>${d}</th>`).join('')}</tr></thead><tbody>
  ${HOURS.map(h => `<tr><td class="h">${h}</td>${DAYS.map((_, d) => `<td>${cellFn(slotKey(d, h), d, h)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function viewTT() {
  const mine = S.busy.me || [];
  return `<div class="sec"><span>내 시간표</span><small>${mine.length}칸 수업</small></div>
  <p class="desc">수업이 있는 칸을 눌러 표시하세요. 표시 안 한 칸은 "가능한 시간"으로 계산돼요.</p>
  <div class="legend"><span><i class="busy"></i>수업 · 불가</span><span><i></i>가능</span></div>
  ${ttTable(k => `<button class="cell ${mine.includes(k) ? 'busy' : ''}" data-act="tt" data-k="${k}" aria-pressed="${mine.includes(k)}" title="${slotText(k)}">${mine.includes(k) ? '수업' : ''}</button>`)}
  <div class="hbtns"><button class="btn sm ghost" data-act="ttClear">모두 지우기</button><span class="desc">저장은 자동이에요.</span></div>`;
}
function viewFree() {
  const all = allFreeSlots(), n = S.members.length;
  return `<div class="sec"><span>공통 공강</span><small>전원 가능 ${all.length}칸</small></div>
  <p class="desc">숫자는 그 시간에 가능한 팀원 수(${n}명 중). 검은 칸은 전원 가능. 칸을 누르면 회의 후보에 올라가요.</p>
  <div class="legend"><span><i class="all"></i>전원</span><span><i class="some"></i>일부</span><span><i style="opacity:.3"></i>0명</span><span><i style="box-shadow:0 0 0 2px var(--ink);"></i>후보</span></div>
  ${ttTable(k => { const c = freeCount(k), cls = c === n ? 'all' : c === 0 ? 'none' : 'some'; return `<button class="cell ${cls} ${S.candidates.includes(k) ? 'cand' : ''}" data-act="cand" data-k="${k}" title="${slotText(k)} · ${c}명 가능">${c}</button>`; })}
  <div class="sec"><span>팀원별 상태</span><small>BY MEMBER</small></div>
  <div class="kv">${S.members.map(m => `<b>${esc(m.id === 'me' ? myName() : m.name)}</b><span>${(S.busy[m.id] || []).length ? `수업 ${(S.busy[m.id] || []).length}칸 등록` : '시간표 없음'}</span>`).join('')}</div>`;
}
function viewVote() {
  const cands = S.candidates.slice().sort((a, b) => (S.votes[b] || []).length - (S.votes[a] || []).length || a.localeCompare(b));
  const n = S.members.length;
  const auto = allFreeSlots().filter(k => !S.candidates.includes(k)).slice(0, 3);
  return `<div class="sec"><span>회의 시간 후보</span><small>${cands.length}개</small></div>
  <p class="desc">공통 공강에서 올라온 후보예요. 투표하고, 가장 많이 모인 시간을 확정하세요.</p>
  ${cands.length ? `<div class="list">${cands.map(k => { const v = S.votes[k] || [], mine = v.includes('me'), c = freeCount(k); return `<div class="vote"><div class="top"><span class="when">${slotText(k)} <span class="desc">(${md(iso(nextDate(+k.split('-')[0])))}) · ${c}/${n}명 가능</span></span><span class="hbtns"><button class="chip" data-act="vote" data-k="${k}" aria-pressed="${mine}">${mine ? '✓ 투표함' : '투표'}</button><button class="btn sm pri" data-act="confirm" data-k="${k}">확정</button><button class="btn sm ghost" data-act="uncand" data-k="${k}">빼기</button></span></div><div class="bar"><i style="--w:${n ? v.length / n * 100 : 0}%"></i></div><div class="who">${v.length}표${v.length ? ' · ' + v.map(id => esc(id === 'me' ? myName() : member(id).name)).join(', ') : ''}</div></div>`; }).join('')}</div>` : `<div class="empty">후보가 없어요. 공통 공강에서 칸을 눌러 올리세요.</div>`}
  ${auto.length ? `<div class="sec"><span>추천</span><small>전원 가능</small></div><div class="hbtns" style="flex-wrap:wrap">${auto.map(k => `<button class="chip" data-act="cand" data-k="${k}">+ ${slotText(k)}</button>`).join('')}</div>` : ''}`;
}
function viewMeet() {
  const t = iso(today());
  const list = S.meetings.slice().sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const up = list.filter(m => m.date >= t), past = list.filter(m => m.date < t);
  const item = m => `<div class="item ${m.date < t ? 'done' : ''}"><span class="tag ${m.date >= t ? 'k' : ''}" style="grid-row:1/3">${md(m.date)}</span><span class="t">${m.time} · ${esc(m.place)}</span><span class="s">${esc(m.agenda || '안건 없음')} · ${ddayText(m.date)}</span><span class="r"><button class="btn sm ghost" data-act="rmMeet" data-id="${m.id}">삭제</button></span></div>`;
  return `<div class="sec"><span>다가오는 회의</span><small>${up.length}건</small></div>
  ${up.length ? `<div class="list">${up.map(item).join('')}</div>` : `<div class="empty">확정된 회의가 없어요. 추천 · 투표에서 확정하세요.</div>`}
  <form class="form" data-form="addMeet"><label class="lbl">회의 직접 추가</label><div class="g2"><input class="inp" type="date" name="date" required value="${iso(nextDate(0))}"><input class="inp" type="time" name="time" required value="12:00"></div><input class="inp" name="place" required placeholder="장소" maxlength="30"><input class="inp" name="agenda" placeholder="안건 (선택)" maxlength="60"><button class="btn" type="submit">추가</button></form>
  ${past.length ? `<div class="sec"><span>지난 회의</span><small>${past.length}건</small></div><div class="list">${past.map(item).join('')}</div>` : ''}`;
}
function viewTask() {
  const list = S.tasks.slice().sort((a, b) => a.done - b.done || a.due.localeCompare(b.due));
  return `<div class="sec"><span>역할</span><small>ROLES</small></div>
  <div class="members">${S.members.map(av).join('')}</div>
  <p class="desc">역할은 팀 화면에서 고칠 수 있어요.</p>
  <div class="sec"><span>할 일</span><small>${S.tasks.filter(x => !x.done).length}개 남음</small></div>
  ${list.length ? `<div class="list">${list.map(x => `<div class="item ${x.done ? 'done' : ''}"><button class="chk" data-act="task" data-id="${x.id}" aria-pressed="${x.done}" aria-label="완료">${x.done ? '✓' : ''}</button><span class="t">${esc(x.title)}</span><span class="s">${esc(x.who === 'me' ? myName() : member(x.who).name)} · ${md(x.due)} (${ddayText(x.due)})</span><span class="r"><button class="btn sm ghost" data-act="rmTask" data-id="${x.id}">삭제</button></span></div>`).join('')}</div>` : `<div class="empty">할 일이 없어요.</div>`}
  <form class="form" data-form="addTask"><label class="lbl">할 일 추가</label><input class="inp" name="title" required placeholder="무엇을" maxlength="40"><div class="g2"><select class="sel" name="who">${S.members.map(m => `<option value="${m.id}">${esc(m.id === 'me' ? myName() : m.name)}</option>`).join('')}</select><input class="inp" type="date" name="due" required value="${iso(nextDate(4))}"></div><button class="btn" type="submit">추가</button></form>`;
}
function viewDue() {
  const p = progress();
  const ds = S.deadlines.slice().sort((a, b) => a.date.localeCompare(b.date));
  const byM = S.members.map(m => { const t = S.tasks.filter(x => x.who === m.id); return { m, n: t.length, d: t.filter(x => x.done).length }; });
  return `<div class="sec"><span>전체 진행률</span><small>${p.d}/${p.n}</small></div>
  <div class="bar" style="height:20px"><i style="--w:${p.p}%"></i></div><p class="desc">할 일 ${p.n}개 중 ${p.d}개 완료 (${p.p}%)</p>
  <div class="sec"><span>마감</span><small>${ds.length}개</small></div>
  ${ds.length ? `<div class="list">${ds.map(d => `<div class="item ${dday(d.date) < 0 ? 'done' : ''}"><span class="tag ${dday(d.date) <= 3 && dday(d.date) >= 0 ? 'k' : ''}" style="grid-row:1/3">${ddayText(d.date)}</span><span class="t">${esc(d.title)}</span><span class="s">${md(d.date)}</span><span class="r"><button class="btn sm ghost" data-act="rmDue" data-id="${d.id}">삭제</button></span></div>`).join('')}</div>` : `<div class="empty">마감이 없어요.</div>`}
  <form class="form" data-form="addDue"><label class="lbl">마감 추가</label><div class="g2"><input class="inp" name="title" required placeholder="무엇" maxlength="30"><input class="inp" type="date" name="date" required value="${iso(nextDate(4))}"></div><button class="btn" type="submit">추가</button></form>
  <div class="sec"><span>팀원별 진행</span><small>BY MEMBER</small></div>
  <div class="list">${byM.map(({ m, n, d }) => `<div class="vote"><div class="top"><span class="when" style="font-size:14px">${esc(m.id === 'me' ? myName() : m.name)}</span><span class="desc num">${d}/${n}</span></div><div class="bar"><i style="--w:${n ? d / n * 100 : 0}%"></i></div></div>`).join('')}</div>`;
}

/* ---------- 카드 (PC) ---------- */
function card(fid) {
  const f = FEATS.find(x => x.id === fid);
  let body = '';
  if (fid === 'free') { const all = allFreeSlots(); body = `<div class="big">${all.length}<span style="font-size:13px"> 칸</span></div><div class="sub">전원 가능 · 평일 9~18시</div><div class="mini">${all.slice(0, 4).map(k => `<div><span>${slotText(k)}</span><span>${S.candidates.includes(k) ? '후보' : ''}</span></div>`).join('')}</div>`; }
  if (fid === 'meet') { const m = nextMeeting(); body = m ? `<div class="big">${md(m.date)}</div><div class="sub">${m.time} · ${esc(m.place)} · ${ddayText(m.date)}</div><div class="desc" style="font-size:12px">${esc(m.agenda || '')}</div>` : `<div class="sub">확정된 회의 없음</div><div class="desc" style="font-size:12px">후보 ${S.candidates.length}개 투표 중</div>`; }
  if (fid === 'task') { const mine = S.tasks.filter(t => !t.done && t.who === 'me').sort((a, b) => a.due.localeCompare(b.due)); body = `<div class="big">${mine.length}<span style="font-size:13px"> 개</span></div><div class="sub">내 할 일 · 전체 ${S.tasks.filter(t => !t.done).length}개 남음</div><div class="mini">${mine.slice(0, 4).map(t => `<div><span>${esc(t.title)}</span><span>${ddayText(t.due)}</span></div>`).join('')}</div>`; }
  if (fid === 'due') { const p = progress(), ds = S.deadlines.filter(d => dday(d.date) >= 0).sort((a, b) => a.date.localeCompare(b.date)); body = `<div class="big">${p.p}<span style="font-size:13px"> %</span></div><div class="bar"><i style="--w:${p.p}%"></i></div><div class="mini">${ds.slice(0, 3).map(d => `<div><span>${esc(d.title)}</span><span>${ddayText(d.date)}</span></div>`).join('')}</div>`; }
  return `<button class="wcard ${pcFid === fid ? 'on' : ''}" data-act="open" data-fid="${fid}"><b>${f.short}<small>${f.id.toUpperCase()}</small></b><div class="body">${body}</div></button>`;
}

/* ---------- 앱 페이지 ---------- */
function pageApp() {
  const r = route();
  if (isMobile()) {
    if (r.fid) {
      const f = FEATS.find(x => x.id === r.fid);
      return `<div class="app">${header()}<div class="mdetail"><div class="dh"><button class="back2" data-act="go" data-to="app">← 목록</button><span>${f ? f.name : '팀'}</span><small>${(f ? f.id : 'home').toUpperCase()}</small></div><div class="panel"><div class="pb">${view(r.fid)}</div></div></div></div>`;
    }
    return `<div class="app">${header()}<div class="mob">
      <button class="notice ${mobNoticeOpen ? 'open' : ''}" data-act="notice"><b>공지 <small>${esc(S.team.name)}</small></b><p>${esc(S.notice || '공지가 없어요.')}</p></button>
      <div class="listbox"><div class="lhead"><b>주요 기능</b><small>${esc(myName())} · ${S.members.length}명</small></div>
        <div class="flist">${FEATS.map(f => `<button class="frow" data-act="open" data-fid="${f.id}"><b>${f.name}</b><span class="st">${esc(status(f.id))}</span><span class="arr">›</span></button>`).join('')}</div><div class="fade"></div></div>
    </div></div>`;
  }
  pcFid = r.fid;
  const f = FEATS.find(x => x.id === pcFid);
  return `<div class="app">${header()}<div class="dash">
    <div class="col">${card(CARDS[0])}${card(CARDS[1])}</div>
    <div class="panel main"><div class="ph"><span>${f ? f.name : '세부 작업 공간'}</span><span class="hbtns"><small>${f ? esc(status(f.id)) : esc(S.team.name)}</small>${f ? `<button class="btn sm ghost" data-act="go" data-to="app">닫기</button>` : ''}</span></div><div class="pb">${view(pcFid)}</div></div>
    <div class="col">${card(CARDS[2])}${card(CARDS[3])}</div>
  </div></div>`;
}

/* ---------- 렌더 ---------- */
function render() {
  const r = route();
  if (r.page === 'join') { // 초대 링크
    if (S.user) { toast('이미 팀에 들어와 있어요'); go('app/team'); } else { sessionStorage.setItem('uswsync.join', r.fid); go('login'); }
    return;
  }
  if (!S.user && r.page === 'app') { go('login'); return; }
  if (S.user && (r.page === 'intro' || r.page === 'login')) { go('app'); return; }
  const root = $('#root');
  const scrollPb = root.querySelector('.pb') ? root.querySelector('.pb').scrollTop : 0;
  // 다시 그려도 폼에 적던 글과 커서는 유지
  const keep = {}; root.querySelectorAll('[data-form] [name]').forEach(i => { if (i.value) keep[i.closest('[data-form]').dataset.form + '/' + i.name] = i.value; });
  const ae = document.activeElement, focusKey = ae && root.contains(ae) ? (ae.id || ae.dataset.bind || ae.dataset.role || (ae.name && ae.closest('[data-form]') ? ae.closest('[data-form]').dataset.form + '/' + ae.name : '')) : '';
  const selPos = ae && 'selectionStart' in ae ? ae.selectionStart : null;
  root.innerHTML = r.page === 'login' ? pageLogin() : r.page === 'app' ? pageApp() : pageIntro();
  const pb = root.querySelector('.pb'); if (pb) pb.scrollTop = scrollPb;
  root.querySelectorAll('[data-form] [name]').forEach(i => { const k = i.closest('[data-form]').dataset.form + '/' + i.name; if (keep[k] && !(i.type === 'date' || i.type === 'time') ) i.value = keep[k]; else if (keep[k]) i.value = keep[k]; });
  if (focusKey) { const el = root.querySelector('#' + CSS.escape(focusKey)) || root.querySelector(`[data-bind="${focusKey}"],[data-role="${focusKey}"]`) || (focusKey.includes('/') ? root.querySelector(`[data-form="${focusKey.split('/')[0]}"] [name="${focusKey.split('/')[1]}"]`) : null); if (el) { el.focus({ preventScroll: true }); try { if (selPos != null && el.setSelectionRange) el.setSelectionRange(selPos, selPos); } catch (e) {} } }
  document.title = r.page === 'app' ? `${FEATS.find(x => x.id === r.fid)?.name || S.team.name} · USW SYNC` : 'USW SYNC';
}
function toast(msg) { let t = $('#toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.append(t); } t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 2200); }
function closeMenus() { if (openMenu) { openMenu = null; render(); } }

/* ---------- 이벤트 ---------- */
document.addEventListener('click', e => {
  const mb = e.target.closest('[data-menu]');
  if (mb) { openMenu = openMenu === mb.dataset.menu ? null : mb.dataset.menu; render(); return; }
  const b = e.target.closest('[data-act]');
  if (!b) { if (!e.target.closest('.menu')) closeMenus(); return; }
  const a = b.dataset.act, d = b.dataset;
  openMenu = null;
  switch (a) {
    case 'home': go(S.user ? 'app' : ''); break;
    case 'go': go(d.to); break;
    case 'scroll': document.querySelector(d.to)?.scrollIntoView({ behavior: 'smooth' }); break;
    case 'open': go('app/' + d.fid); break;
    case 'toast': toast(d.msg); render(); break;
    case 'toggleNotify': S.settings.notify = !S.settings.notify; save(); toast(S.settings.notify ? '알림을 켰어요' : '알림을 껐어요'); break;
    case 'reset': { const u = S.user; S = seed(); S.user = u; if (u) me().name = u.name; save(); toast('예시 데이터로 되돌렸어요'); break; }
    case 'logout': S.user = null; save(); go(''); break;
    case 'notice': mobNoticeOpen = !mobNoticeOpen; break;
    case 'copy': navigator.clipboard?.writeText(d.text).then(() => toast('초대 링크를 복사했어요'), () => toast('복사하지 못했어요')); break;
    case 'tt': { const s = new Set(S.busy.me || []); s.has(d.k) ? s.delete(d.k) : s.add(d.k); S.busy.me = [...s]; save(); break; }
    case 'ttClear': S.busy.me = []; save(); break;
    case 'cand': if (freeCount(d.k) === 0) { toast('아무도 가능하지 않은 시간이에요'); break; } if (S.candidates.includes(d.k)) { S.candidates = S.candidates.filter(k => k !== d.k); delete S.votes[d.k]; toast(`${slotText(d.k)} 후보에서 뺐어요`); } else { S.candidates.push(d.k); S.votes[d.k] = S.votes[d.k] || []; toast(`${slotText(d.k)} 후보에 올렸어요`); } save(); break;
    case 'uncand': S.candidates = S.candidates.filter(k => k !== d.k); delete S.votes[d.k]; save(); break;
    case 'vote': { const v = new Set(S.votes[d.k] || []); v.has('me') ? v.delete('me') : v.add('me'); S.votes[d.k] = [...v]; save(); break; }
    case 'confirm': { const [day, h] = d.k.split('-').map(Number); S.meetings.push({ id: uid(), date: iso(nextDate(day)), time: `${pad(h)}:00`, place: '장소 미정', agenda: '' }); S.candidates = S.candidates.filter(k => k !== d.k); delete S.votes[d.k]; save(); toast(`${slotText(d.k)} 회의로 확정했어요`); go('app/meet'); return; }
    case 'rmMeet': S.meetings = S.meetings.filter(m => m.id !== d.id); save(); break;
    case 'task': { const t = S.tasks.find(x => x.id === d.id); if (t) t.done = !t.done; save(); break; }
    case 'rmTask': S.tasks = S.tasks.filter(x => x.id !== d.id); save(); break;
    case 'rmDue': S.deadlines = S.deadlines.filter(x => x.id !== d.id); save(); break;
    case 'rmMember': { S.members = S.members.filter(m => m.id !== d.id); delete S.busy[d.id]; Object.keys(S.votes).forEach(k => { S.votes[k] = S.votes[k].filter(x => x !== d.id); }); save(); break; }
  }
  render();
});
document.addEventListener('submit', e => {
  const f = e.target;
  e.preventDefault();
  if (f.id === 'loginForm') {
    const name = $('#lname').value.trim(), sid = $('#lsid').value.trim(); if (!name || !sid) return;
    S.user = { name, sid }; me().name = name; save();
    const j = sessionStorage.getItem('uswsync.join'); if (j) { sessionStorage.removeItem('uswsync.join'); toast(`초대 코드 ${j} 팀에 들어왔어요`); }
    go('app'); return;
  }
  const fd = new FormData(f), v = k => (fd.get(k) || '').toString().trim();
  switch (f.dataset.form) {
    case 'addMember': S.members.push({ id: uid(), name: v('name'), role: v('role') }); S.busy[S.members.at(-1).id] = []; toast('팀원을 추가했어요'); break;
    case 'addMeet': S.meetings.push({ id: uid(), date: v('date'), time: v('time'), place: v('place'), agenda: v('agenda') }); break;
    case 'addTask': S.tasks.push({ id: uid(), title: v('title'), who: v('who'), due: v('due'), done: false }); break;
    case 'addDue': S.deadlines.push({ id: uid(), title: v('title'), date: v('date') }); break;
  }
  save(); render();
});
document.addEventListener('input', e => {
  const t = e.target;
  if (t.dataset.bind === 'notice') { S.notice = t.value; save(); }
  else if (t.dataset.bind === 'team.name') { S.team.name = t.value; save(); }
  else if (t.dataset.role) { const m = member(t.dataset.role); m.role = t.value; save(); }
});
window.addEventListener('hashchange', () => { openMenu = null; render(); });
let mq = isMobile(); window.addEventListener('resize', () => { if (isMobile() !== mq) { mq = isMobile(); render(); } });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenus(); });

load(); render();
})();
