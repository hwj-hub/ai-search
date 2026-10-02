/* ===================================================================
   ai-search-list.js — AI 검색 · 통합형
   B안(ai-search-chat.js)의 "이전 대화" 사이드바 + A안(program-search.js)의
   자연어 검색창·순차 타이핑 리빌 리스트를 하나의 답변 카드로 합친 버전.
   실제 API 호출은 없는 클라이언트 목업이며, 검색 로직(parseQuery/
   scoreProgram/matchPercent/buildReasonChips)과 결과 리스트의 타이핑
   리빌 애니메이션은 program-search.js의 로직을 그대로 이식했다.
   =================================================================== */

document.addEventListener('DOMContentLoaded', function () {

  // ---------- 데이터 (program-search.js와 동일) ----------
  var PROGRAMS = [
    { title: '연수 테스트', org: '대한상공회의소(민간기업)', type: '현장직업체험형', typeCls: 'green', region: '서울 중구', apply: '전국', hours: '2시간', cost: '무료', status: 'open' },
    { title: '꿈길 QR코드 테스트(26년)', org: '테스트꿈길체험처(민간기업)', type: '현장직업체험형', typeCls: 'green', region: '서울 강남구', apply: '전국', hours: '5시간', cost: '무료', status: 'open' },
    { title: '꿈길 연수 프로그램 (2026년도)', org: '대한상공회의소(민간기업)', type: '현장직업체험형', typeCls: 'green', region: '서울 강동구', apply: '전국', hours: '4시간', cost: '무료', status: 'open' },
    { title: 'NH농협은행 행복채움 금융 진로교실', org: '농협은행 광주영업본부(민간기업)', type: '강연형', typeCls: 'teal', region: '서울 강남구', apply: '전국', hours: '2시간', cost: '무료', status: 'open' },
    { title: '땅에 피는 하늘사랑(춘하추동)', org: '고려대학교 세종캠퍼스(인증기관)', type: '공연형', typeCls: 'indigo', region: '강원 영월군', apply: '전국', hours: '30시간', cost: '12,000원', status: 'closed' },
    { title: '대한상공회의소 직업체험', org: '대한상공회의소(민간기업)', type: '현장직업체험형', typeCls: 'green', region: '서울 중구', apply: '전국', hours: '2시간', cost: '1,000원', status: 'open' },
    { title: '학교로 찾아가는 재난안전 응급처치', org: '한국스포츠과학연구소(청주센터)(민간기업)', type: '직업실무체험형', typeCls: 'orange', region: '대구 북구', apply: '전국', hours: '2시간', cost: '350,000원', status: 'open' },
    { title: '캐리커쳐 작가', org: '달연거울(학교/대학교)', type: '현장직업체험형', typeCls: 'green', region: '대전 동구', apply: '전국', hours: '2시간', cost: '15,000원', status: 'open' },
    { title: '계란형 이끼 테라리움 키트_원예지도사 (유튜브 동영상 안내자료)', org: '향미의정원(개인사업체)', type: '현장직업체험형', typeCls: 'green', region: '경남 양산시', apply: '전국', hours: '2시간', cost: '20,000원', status: 'closed' },
    { title: '보컬댄스 입시와 아이돌가수지망생 외 유튜브크리에이터 직업', org: '학앤터 아카데미 학원(개인사업체)', type: '현장직업체험형', typeCls: 'green', region: '부산 수영구', apply: '부산광역시 강서구 외 15지역', hours: '2시간', cost: '20,000원', status: 'open' }
  ];

  var ROW_ICON = {
    clock: '<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3.5 2" stroke-linecap="round"></path>',
    pin: '<path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z"></path><circle cx="12" cy="10" r="2.4"></circle>',
    globe: '<circle cx="12" cy="12" r="9"></circle><path d="M3 12h18M12 3c2.5 2.5 3.8 6 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-6-3.8-9s1.3-6.5 3.8-9z" stroke-linecap="round"></path>'
  };

  function matchPercent(p, cond) {
    var s = scoreProgram(p, cond);
    var pct = 72 + s * 6;
    if (pct > 99) pct = 99;
    return pct;
  }

  function buildReasonChips(p, cond) {
    var chips = [];
    if (cond.region && cond.region.split(' ').some(function (tok) { return p.region.indexOf(tok) > -1; })) {
      chips.push('지역 일치');
    }
    if (cond.keywordType && p.type === cond.keywordType) {
      chips.push('유형 일치');
    }
    if (!chips.length) chips.push('관련 프로그램');
    return chips.map(function (c) {
      return '<span class="psrch-reason-chip"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.8 5.6L19 9l-5.2 1.4L12 16l-1.8-5.6L5 9l5.2-1.4L12 2z"></path></svg>' + c + '</span>';
    }).join('');
  }

  function metaIconsHtml(p) {
    return (
      '<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">' + ROW_ICON.clock + '</svg>' + p.hours + '</span>' +
      '<span><strong>' + p.cost + '</strong></span>' +
      '<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">' + ROW_ICON.pin + '</svg>' + p.region + '</span>' +
      '<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">' + ROW_ICON.globe + '</svg>신청 ' + p.apply + '</span>'
    );
  }

  function scoreProgram(p, cond) {
    var score = 0;
    if (cond.region) {
      cond.region.split(' ').forEach(function (tok) {
        if (p.region.indexOf(tok) > -1) score += 2;
      });
    }
    if (cond.keywordType && p.type === cond.keywordType) score += 3;
    return score;
  }

  // ---------- 자연어 질의 파싱 (program-search.js와 동일 + 현장직업체험 보강) ----------
  function parseQuery(query) {
    var region = null;
    if (query.indexOf('서울') > -1 && query.indexOf('중구') > -1) region = '서울 중구';
    else if (query.indexOf('강서구') > -1) region = '부산 강서구';
    else if (query.indexOf('포천') > -1) region = '경기 포천';
    else if (query.indexOf('서울') > -1) region = '서울';
    else if (query.indexOf('부산') > -1) region = '부산';
    else if (query.indexOf('경기') > -1) region = '경기';
    else if (query.indexOf('대구') > -1) region = '대구';
    else if (query.indexOf('대전') > -1) region = '대전';
    else if (query.indexOf('강원') > -1) region = '강원';
    else if (query.indexOf('경남') > -1 || query.indexOf('양산') > -1) region = '경남';

    var target = null;
    if (query.indexOf('중등') > -1 || query.indexOf('중학생') > -1) target = '중학생';
    else if (query.indexOf('고등') > -1) target = '고등학생';
    else if (query.indexOf('초등') > -1) target = '초등학생';

    var keyword = null, keywordType = null;
    if (query.indexOf('IT') > -1 || query.indexOf('코딩') > -1) { keyword = 'IT·코딩'; keywordType = '현장직업체험형'; }
    else if (query.indexOf('보건') > -1 || query.indexOf('헬스케어') > -1) { keyword = '보건·의료'; keywordType = '직업실무체험형'; }
    else if (query.indexOf('요리') > -1) { keyword = '요리'; keywordType = '현장직업체험형'; }
    else if (query.indexOf('강연') > -1) { keyword = '강연'; keywordType = '강연형'; }
    else if (query.indexOf('공연') > -1) { keyword = '공연'; keywordType = '공연형'; }
    else if (query.indexOf('현장직업체험') > -1) { keyword = '현장직업체험'; keywordType = '현장직업체험형'; }
    else if (query.indexOf('진로탐색') > -1) { keyword = '진로탐색'; keywordType = null; }

    return { region: region, target: target, keyword: keyword, keywordType: keywordType };
  }

  // ---------- 한글 조사(을/를) 처리 (ai-search-chat.js와 동일) ----------
  function hasFinalConsonant(word) {
    if (!word) return true;
    var ch = word.charAt(word.length - 1);
    var code = ch.charCodeAt(0) - 0xAC00;
    if (code < 0 || code > 11171) return true;
    return (code % 28) !== 0;
  }
  function withEulReul(word) {
    return word + (hasFinalConsonant(word) ? '을' : '를');
  }
  // '현장직업체험'처럼 키워드 자체가 이미 "체험"으로 끝나는 경우
  // "현장직업체험 체험"으로 중복되지 않도록 방지
  function displayKeyword(cond) {
    if (!cond.keyword) return '체험';
    return /체험$/.test(cond.keyword) ? cond.keyword : (cond.keyword + ' 체험');
  }
  function statusSentence(cond) {
    var parts = [];
    if (cond.region) parts.push(cond.region + '에서');
    parts.push('할 수 있는 ' + withEulReul(displayKeyword(cond)) + ' 찾는 중...');
    return parts.join(' ');
  }

  // ---------- 한 글자씩 타이핑하는 공용 헬퍼 ----------
  function typeText(el, text, speed, onDone) {
    el.textContent = '';
    el.classList.add('typing');
    var i = 0;
    var timer = setInterval(function () {
      if (i < text.length) {
        el.textContent += text.charAt(i);
        i++;
      } else {
        clearInterval(timer);
        el.classList.remove('typing');
        if (onDone) onDone();
      }
    }, speed);
    return timer;
  }

  // ---------- 결과 행 렌더링 (즉시 / 순차 타이핑 리빌) ----------
  function buildRowSkeleton(p, idx, cond) {
    var isTop = idx < 3;
    var row = document.createElement('article');
    row.className = 'psrch-row' + (isTop ? ' psrch-row-top' : '');

    var rankBadge = isTop
      ? '<span class="psrch-rank-badge"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.8 5.6L19 9l-5.2 1.4L12 16l-1.8-5.6L5 9l5.2-1.4L12 2z"></path></svg>AI 추천 ' + (idx + 1) + '위</span>'
      : '';
    var matchBadge = '<span class="psrch-match-badge">AI 매칭 ' + matchPercent(p, cond) + '%</span>';

    row.innerHTML =
      '<div class="psrch-row-accent"></div>' +
      '<div class="psrch-row-main">' +
        '<div class="psrch-row-top psrch-reveal">' +
          rankBadge +
          '<span class="status-pill ' + (p.status === 'open' ? 'open' : 'closed') + '">' + (p.status === 'open' ? '모집중' : '신청마감') + '</span>' +
          '<span class="type-pill ' + p.typeCls + '">' + p.type + '</span>' +
          matchBadge +
        '</div>' +
        '<h3 class="psrch-row-title"></h3>' +
        '<div class="psrch-reason-chips psrch-reveal">' + buildReasonChips(p, cond) + '</div>' +
        '<div class="psrch-row-meta-icons psrch-reveal">' + metaIconsHtml(p) + '</div>' +
      '</div>' +
      '<div class="psrch-row-foot psrch-reveal">' +
        '<button type="button" class="psrch-row-cta">상세보기 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"></path></svg></button>' +
      '</div>';
    return row;
  }

  function renderRowInstant(p, idx, cond) {
    var isTop = idx < 3;
    var row = document.createElement('article');
    row.className = 'psrch-row' + (isTop ? ' psrch-row-top' : '');
    row.style.animationDelay = (idx * 0.04) + 's';

    var rankBadge = isTop
      ? '<span class="psrch-rank-badge"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.8 5.6L19 9l-5.2 1.4L12 16l-1.8-5.6L5 9l5.2-1.4L12 2z"></path></svg>AI 추천 ' + (idx + 1) + '위</span>'
      : '';
    var matchBadge = '<span class="psrch-match-badge">AI 매칭 ' + matchPercent(p, cond) + '%</span>';

    row.innerHTML =
      '<div class="psrch-row-accent"></div>' +
      '<div class="psrch-row-main">' +
        '<div class="psrch-row-top">' +
          rankBadge +
          '<span class="status-pill ' + (p.status === 'open' ? 'open' : 'closed') + '">' + (p.status === 'open' ? '모집중' : '신청마감') + '</span>' +
          '<span class="type-pill ' + p.typeCls + '">' + p.type + '</span>' +
          matchBadge +
        '</div>' +
        '<h3 class="psrch-row-title">' + p.title + '</h3>' +
        '<div class="psrch-reason-chips">' + buildReasonChips(p, cond) + '</div>' +
        '<div class="psrch-row-meta-icons">' + metaIconsHtml(p) + '</div>' +
      '</div>' +
      '<div class="psrch-row-foot">' +
        '<button type="button" class="psrch-row-cta">상세보기 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"></path></svg></button>' +
      '</div>';
    return row;
  }

  function renderRowsInstant(items, cond, listingEl) {
    listingEl.innerHTML = '';
    items.forEach(function (p, idx) { listingEl.appendChild(renderRowInstant(p, idx, cond)); });
  }

  function revealRowsSequentially(items, cond, listingEl, idx) {
    if (idx >= items.length) return;
    var p = items[idx];
    var row = buildRowSkeleton(p, idx, cond);
    listingEl.appendChild(row);

    var titleEl = row.querySelector('.psrch-row-title');
    var reveals = row.querySelectorAll('.psrch-reveal');

    setTimeout(function () {
      typeText(titleEl, p.title, 14, function () {
        reveals.forEach(function (el) { el.classList.add('shown'); });
        setTimeout(function () { revealRowsSequentially(items, cond, listingEl, idx + 1); }, 220);
      });
    }, 90);
  }

  // ---------- 요소 참조 ----------
  var answerArea = document.getElementById('aslistAnswerArea');
  var historyListEl = document.getElementById('aslistHistoryList');
  var form = document.getElementById('aslistForm');
  var input = document.getElementById('aslistInput');
  var newBtn = document.getElementById('aslistNewBtn');

  // ---------- 최근 검색(이전 대화) ----------
  var history = [
    { id: 'h1', query: '서울 중구에서 할 수 있는 현장직업체험 찾아줘', time: '방금 전', active: true },
    { id: 'h2', query: '서울 중구 중학생 IT·코딩 체험 찾아줘', time: '1시간 전', active: false },
    { id: 'h3', query: '부산 강서구 고등학생 보건·헬스케어 체험', time: '어제', active: false },
    { id: 'h4', query: '경기 포천 초등학생 진로탐색 프로그램', time: '2일 전', active: false },
    { id: 'h5', query: '신청 가능한 요리 체험 있을까?', time: '4일 전', active: false }
  ];

  function renderHistoryList() {
    historyListEl.innerHTML = '';
    history.forEach(function (h) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'aichat-history-item' + (h.active ? ' active' : '');
      btn.innerHTML = '<p>' + h.query + '</p><span>' + h.time + '</span>';
      btn.addEventListener('click', function () { openHistoryItem(h.id); });
      historyListEl.appendChild(btn);
    });
  }

  function setActiveHistory(id) {
    history.forEach(function (h) { h.active = (h.id === id); });
    renderHistoryList();
  }

  // ---------- 답변 카드 ----------
  function sortedPrograms(cond) {
    return PROGRAMS.map(function (p) { return { p: p, s: scoreProgram(p, cond) }; })
      .sort(function (a, b) { return b.s - a.s; })
      .map(function (x) { return x.p; });
  }

  function buildCardShell() {
    var card = document.createElement('div');
    card.className = 'aslist-answer-card';

    var aiRow = document.createElement('div');
    aiRow.className = 'aslist-ai-row';
    aiRow.innerHTML =
      '<span class="aslist-avatar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"></circle></svg></span>' +
      '<strong>꿈길 AI</strong><span class="aslist-answer-tag">ANSWER</span>';
    card.appendChild(aiRow);

    var statusEl = document.createElement('p');
    statusEl.className = 'psrch-status';
    card.appendChild(statusEl);

    return { card: card, statusEl: statusEl };
  }

  function buildToolbarListingPagination(items) {
    var divider = document.createElement('div');
    divider.className = 'aslist-divider';

    var toolbar = document.createElement('div');
    toolbar.className = 'psrch-toolbar';
    toolbar.innerHTML =
      '<p class="psrch-count">총 <strong>' + items.length + '</strong>건</p>' +
      '<div class="psrch-toolbar-right">' +
        '<div class="psrch-sort"><select class="psrch-select psrch-sort-select">' +
          '<option>AI 추천순</option><option>최신순</option><option>마감임박순</option>' +
        '</select></div>' +
      '</div>';

    var listingEl = document.createElement('div');
    listingEl.className = 'psrch-listing';

    var pagination = document.createElement('nav');
    pagination.className = 'psrch-pagination';
    pagination.setAttribute('aria-label', '페이지네이션');
    pagination.innerHTML =
      '<button type="button" class="psrch-pg" aria-label="이전"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 6l-6 6 6 6" stroke-linecap="round" stroke-linejoin="round"></path></svg></button>' +
      '<button type="button" class="psrch-pg active">1</button>' +
      '<button type="button" class="psrch-pg">2</button>' +
      '<button type="button" class="psrch-pg" aria-label="다음"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"></path></svg></button>';
    pagination.querySelectorAll('.psrch-pg').forEach(function (btn) {
      if (btn.hasAttribute('aria-label')) return;
      btn.addEventListener('click', function () {
        pagination.querySelectorAll('.psrch-pg').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
      });
    });

    return { divider: divider, toolbar: toolbar, listingEl: listingEl, pagination: pagination };
  }

  function renderAnswerCard(query, cond, items, options) {
    options = options || {};
    var animate = options.animate !== false;

    answerArea.innerHTML = '';
    var shell = buildCardShell();
    answerArea.appendChild(shell.card);

    if (!animate) {
      shell.statusEl.textContent = statusSentence(cond);
      var parts = buildToolbarListingPagination(items);
      shell.card.appendChild(parts.divider);
      shell.card.appendChild(parts.toolbar);
      shell.card.appendChild(parts.listingEl);
      renderRowsInstant(items, cond, parts.listingEl);
      shell.card.appendChild(parts.pagination);
      return;
    }

    typeText(shell.statusEl, statusSentence(cond), 16, function () {
      var parts = buildToolbarListingPagination(items);
      shell.card.appendChild(parts.divider);
      shell.card.appendChild(parts.toolbar);
      shell.card.appendChild(parts.listingEl);
      shell.card.appendChild(parts.pagination);
      revealRowsSequentially(items, cond, parts.listingEl, 0);
    });
  }

  function showEmptyState() {
    answerArea.innerHTML = '';
    var div = document.createElement('div');
    div.className = 'aslist-empty';
    div.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 4h16v12H7l-3 3V4z" stroke-linejoin="round"></path></svg><span>궁금한 체험 프로그램을 자연어로 물어보세요</span>';
    answerArea.appendChild(div);
  }

  function runQuery(query) {
    var cond = parseQuery(query);
    var sorted = sortedPrograms(cond);
    renderAnswerCard(query, cond, sorted, { animate: true });

    history.forEach(function (h) { h.active = false; });
    history.unshift({ id: 'h' + Date.now(), query: query, time: '방금 전', active: true });
    if (history.length > 8) history.length = 8;
    renderHistoryList();
  }

  function openHistoryItem(id) {
    var h = history.filter(function (x) { return x.id === id; })[0];
    if (!h) return;
    setActiveHistory(id);
    input.value = h.query;
    var cond = parseQuery(h.query);
    var sorted = sortedPrograms(cond);
    renderAnswerCard(h.query, cond, sorted, { animate: false });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var q = input.value.trim();
    if (!q) { input.focus(); return; }
    runQuery(q);
  });

  newBtn.addEventListener('click', function () {
    history.forEach(function (h) { h.active = false; });
    renderHistoryList();
    showEmptyState();
    input.value = '';
    input.focus();
  });

  // ---------- 초기 상태: 첫 번째 이전 대화를 이미 조회한 상태로 표시 ----------
  renderHistoryList();
  var initial = history[0];
  input.value = initial.query;
  var initialCond = parseQuery(initial.query);
  renderAnswerCard(initial.query, initialCond, sortedPrograms(initialCond), { animate: false });

});
