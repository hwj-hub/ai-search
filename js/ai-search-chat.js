/* ===================================================================
   ai-search-chat.js — AI 검색 · B안 (채팅형)
   좌측 "이전 대화" 목록 + 우측 채팅창. 실제 API 호출 없는 클라이언트 목업.
   검색 로직(parseQuery/scoreProgram)은 program-search.js와 같은 방식을
   재사용해 지역/대상/키워드를 문자열 매칭으로 추출하고 점수순 정렬한다.
   =================================================================== */

document.addEventListener('DOMContentLoaded', function () {

  var PROGRAMS = [
    { title: '연수 테스트', org: '대한상공회의소(민간기업)', type: '현장직업체험형', region: '서울 중구', apply: '전국', hours: '2시간', cost: '무료', status: 'open', grades: ['el'] },
    { title: 'NH농협은행 행복채움 금융 진로교실', org: '농협은행 광주영업본부(민간기업)', type: '강연형', region: '서울 강남구', apply: '전국', hours: '2시간', cost: '무료', status: 'open', grades: ['el', 'ms', 'hs'] },
    { title: '한식 셰프 클래스 – 계절 재료로 만드는 우리 음식', org: '한식진흥원(공공기관)', type: '직업실무체험형', region: '서울 마포구', apply: '전국', hours: '3시간', cost: '10,000원', status: 'open', grades: ['el'] },
    { title: '베이커리 창업가 체험 – 나만의 빵 만들기', org: '성동제빵학원(개인사업체)', type: '현장직업체험형', region: '서울 성동구', apply: '전국', hours: '2시간', cost: '15,000원', status: 'open', grades: ['el', 'ms'] },
    { title: '푸드스타일리스트 하루 체험', org: '강남푸드스타일링센터(민간기업)', type: '직업실무체험형', region: '서울 강남구', apply: '전국', hours: '2시간', cost: '20,000원', status: 'closed', grades: ['ms'] },
    { title: '인공지능 개발자 체험단 – 나만의 챗봇 만들기', org: 'G밸리 SW교육센터(민간기업)', type: '현장직업체험형', region: '서울 구로구', apply: '전국', hours: '3시간', cost: '무료', status: 'open', grades: ['ms'] },
    { title: '게임 기획자 진로체험 – 기획서부터 프로토타입까지', org: '판교게임아카데미(민간기업)', type: '직업실무체험형', region: '경기 성남시', apply: '전국', hours: '4시간', cost: '12,000원', status: 'open', grades: ['ms'] },
    { title: '소프트웨어학과 체험 – 대학 실습실 탐방', org: '동작대학교 SW융합학과(학교/대학교)', type: '학과체험형', region: '서울 동작구', apply: '전국', hours: '2시간', cost: '무료', status: 'closed', grades: ['ms'] },
    { title: '학교로 찾아가는 재난안전 응급처치', org: '한국스포츠과학연구소(청주센터)(민간기업)', type: '직업실무체험형', region: '대구 북구', apply: '전국', hours: '2시간', cost: '350,000원', status: 'open', grades: ['el', 'ms', 'hs'] },
    { title: '캐리커쳐 작가 체험', org: '달연거울(학교/대학교)', type: '현장직업체험형', region: '대전 동구', apply: '전국', hours: '2시간', cost: '15,000원', status: 'open', grades: ['ms', 'hs'] }
  ];

  var GRADE_LABEL = { el: '초', ms: '중', hs: '고' };

  function gradesText(grades) {
    return grades.map(function (g) { return GRADE_LABEL[g]; }).join('·');
  }

  // ---------- 자연어 질의 파싱 (program-search.js와 동일한 방식) ----------
  function parseQuery(query) {
    var region = null;
    if (query.indexOf('서울') > -1 && query.indexOf('중구') > -1) region = '서울 중구';
    else if (query.indexOf('강남') > -1) region = '서울 강남구';
    else if (query.indexOf('마포') > -1) region = '서울 마포구';
    else if (query.indexOf('성동') > -1) region = '서울 성동구';
    else if (query.indexOf('구로') > -1) region = '서울 구로구';
    else if (query.indexOf('동작') > -1) region = '서울 동작구';
    else if (query.indexOf('서울') > -1) region = '서울';
    else if (query.indexOf('판교') > -1 || query.indexOf('성남') > -1) region = '경기 성남시';
    else if (query.indexOf('대구') > -1) region = '대구';
    else if (query.indexOf('대전') > -1) region = '대전';

    var target = null;
    if (query.indexOf('중등') > -1 || query.indexOf('중학생') > -1) target = '중학생';
    else if (query.indexOf('고등') > -1) target = '고등학생';
    else if (query.indexOf('초등') > -1) target = '초등학생';

    var keyword = null, keywordType = null;
    if (query.indexOf('IT') > -1 || query.indexOf('코딩') > -1 || query.indexOf('개발자') > -1) { keyword = 'IT·코딩'; keywordType = '현장직업체험형'; }
    else if (query.indexOf('보건') > -1 || query.indexOf('의료') > -1 || query.indexOf('헬스케어') > -1) { keyword = '보건·의료'; keywordType = '직업실무체험형'; }
    else if (query.indexOf('요리') > -1 || query.indexOf('베이커리') > -1 || query.indexOf('빵') > -1) { keyword = '요리'; keywordType = '현장직업체험형'; }
    else if (query.indexOf('미술') > -1 || query.indexOf('캐리커쳐') > -1) { keyword = '미술'; keywordType = '현장직업체험형'; }
    else if (query.indexOf('게임') > -1) { keyword = '게임'; keywordType = '직업실무체험형'; }
    else if (query.indexOf('금융') > -1 || query.indexOf('은행') > -1) { keyword = '금융'; keywordType = '강연형'; }

    var timeframe = null;
    if (query.indexOf('주말') > -1) timeframe = '주말';
    else if (query.indexOf('이번 주') > -1 || query.indexOf('이번주') > -1) timeframe = '이번 주';
    else if (query.indexOf('오늘') > -1) timeframe = '오늘';

    return { region: region, target: target, keyword: keyword, keywordType: keywordType, timeframe: timeframe };
  }

  // ---------- 한글 조사(을/를) 처리 ----------
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

  function displayKeyword(cond) {
    return cond.keyword ? (cond.keyword + ' 체험') : '체험';
  }

  function formatTimeKorean() {
    return new Date().toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  function scoreProgram(p, cond) {
    var score = 0;
    if (cond.region) {
      cond.region.split(' ').forEach(function (tok) {
        if (p.region.indexOf(tok) > -1) score += 2;
      });
    }
    if (cond.keywordType && p.type === cond.keywordType) score += 3;
    if (cond.target) {
      var map = { '초등학생': 'el', '중학생': 'ms', '고등학생': 'hs' };
      if (p.grades.indexOf(map[cond.target]) > -1) score += 2;
    }
    return score;
  }

  function pickResults(query) {
    var cond = parseQuery(query);
    var scored = PROGRAMS.map(function (p) { return { p: p, s: scoreProgram(p, cond) }; });
    scored.sort(function (a, b) { return b.s - a.s; });
    var top = scored.slice(0, 3).map(function (x) { return x.p; });
    return { cond: cond, items: top };
  }

  function headerText(cond) {
    var parts = [];
    if (cond.region) parts.push(cond.region + '에서');
    if (cond.timeframe) parts.push(cond.timeframe + '에');
    parts.push('할 수 있는 ' + withEulReul(displayKeyword(cond)) + ' 찾는 중...');
    return parts.join(' ');
  }

  function step1Sub(cond) {
    var tokens = [];
    if (cond.region) tokens.push(cond.region);
    if (cond.timeframe) tokens.push(cond.timeframe);
    tokens.push(displayKeyword(cond));
    return tokens.join(', ') + ' 관련 정보를 분석하고 있어요.';
  }

  function step2Sub(cond) {
    return cond.region
      ? cond.region + '에서 진행되는 ' + displayKeyword(cond) + ' 프로그램을 찾고 있어요.'
      : displayKeyword(cond) + ' 프로그램을 찾고 있어요.';
  }

  function answerSentence(query, cond, items) {
    var prefix = cond.region ? cond.region + '에서 참여할 수 있는 ' : '';
    var kw = cond.keyword ? cond.keyword + ' 관련 ' : '';
    return prefix + kw + '체험 ' + items.length + '건을 찾았어요';
  }

  // ---------- 이전 대화(사이드바) ----------
  var history = [
    {
      id: 'h1', query: '이번 주말 서울에서 할 수 있는 요리 체험 있어?', time: '방금 전', active: true,
      answer: null // 아래에서 pickResults로 채움
    },
    { id: 'h2', query: '서울 중구 중학생 IT·코딩 체험 찾아줘', time: '1시간 전', active: false, answer: null },
    { id: 'h3', query: '부산 강서구 고등학생 보건·헬스케어 체험', time: '어제', active: false, answer: null },
    { id: 'h4', query: '경기 포천 초등학생 진로탐색 프로그램', time: '2일 전', active: false, answer: null },
    { id: 'h5', query: '신청 가능한 미술 체험 있을까?', time: '4일 전', active: false, answer: null }
  ];

  var historyListEl = document.getElementById('aichatHistoryList');
  var bodyEl = document.getElementById('aichatBody');
  var form = document.getElementById('aichatForm');
  var input = document.getElementById('aichatInput');
  var suggestions = document.getElementById('aichatSuggestions');
  var newBtn = document.getElementById('aichatNewBtn');

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

  function clearBody() {
    bodyEl.innerHTML = '';
  }

  function showEmptyState() {
    clearBody();
    var div = document.createElement('div');
    div.className = 'aichat-empty';
    div.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 4h16v12H7l-3 3V4z" stroke-linejoin="round"></path></svg><span>궁금한 체험 프로그램을 자연어로 물어보세요</span>';
    bodyEl.appendChild(div);
  }

  function renderMiniCard(p) {
    var card = document.createElement('div');
    card.className = 'aichat-mini-card';
    var statusCls = p.status === 'open' ? 'status-open' : 'status-closed';
    var statusLabel = p.status === 'open' ? '모집중' : '신청마감';
    card.innerHTML =
      '<div class="aichat-mini-top"><span class="aichat-mini-title">' + p.title + '</span>' +
      '<span class="aichat-badge ' + statusCls + ' shown">' + statusLabel + '</span></div>' +
      '<div class="aichat-mini-meta shown"><span>대상 ' + gradesText(p.grades) + ' · ' + p.region + '</span>' +
      '<span class="aichat-badge type">' + p.type + '</span></div>';
    return card;
  }

  // 빈 제목으로 카드 뼈대만 먼저 만들고, 제목은 타이핑으로 채운 뒤
  // 상태배지·메타 정보를 페이드인시키는 버전 (실시간 응답용)
  function renderMiniCardSkeleton(p) {
    var card = document.createElement('div');
    card.className = 'aichat-mini-card';
    var statusCls = p.status === 'open' ? 'status-open' : 'status-closed';
    var statusLabel = p.status === 'open' ? '모집중' : '신청마감';
    card.innerHTML =
      '<div class="aichat-mini-top"><span class="aichat-mini-title"></span>' +
      '<span class="aichat-badge ' + statusCls + '">' + statusLabel + '</span></div>' +
      '<div class="aichat-mini-meta"><span>대상 ' + gradesText(p.grades) + ' · ' + p.region + '</span>' +
      '<span class="aichat-badge type">' + p.type + '</span></div>';
    return card;
  }

  function appendUserMsg(text) {
    var div = document.createElement('div');
    div.className = 'aichat-msg-user';
    div.textContent = text;
    bodyEl.appendChild(div);
    bodyEl.scrollTop = bodyEl.scrollHeight;
    return div;
  }

  // 한 글자씩 타이핑하는 공용 헬퍼. 다 쓰고 나면 onDone 호출.
  function typeText(el, text, speed, onDone) {
    el.textContent = '';
    el.classList.add('typing');
    var i = 0;
    var timer = setInterval(function () {
      if (i < text.length) {
        el.textContent += text.charAt(i);
        i++;
        bodyEl.scrollTop = bodyEl.scrollHeight;
      } else {
        clearInterval(timer);
        el.classList.remove('typing');
        if (onDone) onDone();
      }
    }, speed);
    return timer;
  }

  // 미니카드를 한 장씩 순서대로 등장시키고, 각 카드 제목도 타이핑으로 채운다
  function revealCardsSequentially(container, items, idx) {
    if (idx >= items.length) return;
    var item = items[idx];
    var card = renderMiniCardSkeleton(item);
    container.appendChild(card);
    bodyEl.scrollTop = bodyEl.scrollHeight;

    var titleEl = card.querySelector('.aichat-mini-title');
    var statusBadge = card.querySelector('.aichat-badge.status-open, .aichat-badge.status-closed');
    var metaEl = card.querySelector('.aichat-mini-meta');

    setTimeout(function () {
      typeText(titleEl, item.title, 15, function () {
        if (statusBadge) statusBadge.classList.add('shown');
        metaEl.classList.add('shown');
        setTimeout(function () { revealCardsSequentially(container, items, idx + 1); }, 260);
      });
    }, 120);
  }

  function appendAiMsg(text, items, options) {
    options = options || {};
    var animate = options.animate !== false;

    var wrap = document.createElement('div');
    wrap.className = 'aichat-msg-ai';
    var row = document.createElement('div');
    row.className = 'aichat-ai-row';
    row.innerHTML = '<span class="mini-avatar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"></circle></svg></span><strong>꿈길 AI</strong>';
    wrap.appendChild(row);
    var p = document.createElement('p');
    p.className = 'aichat-answer-text';
    wrap.appendChild(p);
    var cardsWrap = document.createElement('div');
    cardsWrap.className = 'aichat-mini-cards';
    wrap.appendChild(cardsWrap);
    bodyEl.appendChild(wrap);
    bodyEl.scrollTop = bodyEl.scrollHeight;

    if (!animate) {
      // 이미 지나간 대화(이전 대화 불러오기, 최초 로드)는 타이핑 없이 바로 표시
      p.textContent = text;
      items.forEach(function (item) { cardsWrap.appendChild(renderMiniCard(item)); });
      bodyEl.scrollTop = bodyEl.scrollHeight;
      return;
    }

    // 실시간 응답: 답변 문장을 한 글자씩 타이핑 → 끝나면 결과 카드가 한 장씩 등장
    typeText(p, text, 18, function () {
      revealCardsSequentially(cardsWrap, items, 0);
    });
  }

  // ---------- 실시간 검색 진행 상태: 4단계 세로 타임라인 ----------
  var CHECK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"></path></svg>';
  var SEARCH_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"></circle><path d="M21 21l-4.35-4.35" stroke-linecap="round"></path></svg>';

  function buildProgressSteps(cond) {
    return [
      { title: '질문 이해하기', sub: step1Sub(cond) },
      { title: '관련 정보 검색 중 ...', sub: step2Sub(cond) },
      { title: '정보 검토 및 정리 중 ...', sub: '찾은 정보를 비교하고 선별하고 있어요.' },
      { title: '추천 결과 생성 중 ...', sub: '조건에 맞는 최적의 결과를 정리하고 있어요.' }
    ];
  }

  function runSearchProgress(cond, onDone) {
    var steps = buildProgressSteps(cond);
    var time = formatTimeKorean();

    var card = document.createElement('div');
    card.className = 'aichat-progress';

    var head = document.createElement('div');
    head.className = 'aichat-progress-head';
    head.innerHTML = SEARCH_SVG + '<strong></strong><time>' + time + '</time>';
    card.appendChild(head);

    var stepEls = steps.map(function (step, idx) {
      var row = document.createElement('div');
      row.className = 'aichat-progress-step';

      var iconCol = document.createElement('div');
      iconCol.className = 'aichat-progress-icon-col';
      var icon = document.createElement('div');
      icon.className = 'aichat-progress-icon';
      icon.innerHTML = CHECK_SVG + '<span class="aichat-progress-icon-dot"></span>';
      iconCol.appendChild(icon);
      if (idx < steps.length - 1) {
        var line = document.createElement('div');
        line.className = 'aichat-progress-line';
        iconCol.appendChild(line);
      }
      row.appendChild(iconCol);

      var content = document.createElement('div');
      content.className = 'aichat-progress-content';
      content.innerHTML =
        '<div class="aichat-progress-title-row"><span class="aichat-progress-title">' + step.title + '</span>' +
        '<time class="aichat-progress-time">' + time + '</time></div>' +
        '<p class="aichat-progress-sub">' + step.sub + '</p>';
      row.appendChild(content);

      card.appendChild(row);
      return row;
    });

    bodyEl.appendChild(card);
    bodyEl.scrollTop = bodyEl.scrollHeight;

    // 헤드 문장도 한 글자씩 타이핑 — "답변 과정"부터 타이핑되는 느낌을 주기 위함
    typeText(head.querySelector('strong'), headerText(cond), 16);

    function setState(idx, state) {
      stepEls[idx].classList.remove('active', 'done');
      stepEls[idx].classList.add(state);
    }

    // 시작: 1단계는 이미 완료, 2단계가 바로 진행중으로 시작
    setState(0, 'done');
    setState(1, 'active');
    bodyEl.scrollTop = bodyEl.scrollHeight;

    setTimeout(function () {
      setState(1, 'done');
      setState(2, 'active');
      bodyEl.scrollTop = bodyEl.scrollHeight;

      setTimeout(function () {
        setState(2, 'done');
        setState(3, 'active');
        bodyEl.scrollTop = bodyEl.scrollHeight;

        setTimeout(function () {
          setState(3, 'done');

          setTimeout(function () {
            card.remove();
            onDone();
          }, 350);
        }, 700);
      }, 700);
    }, 700);
  }

  function runQuery(query) {
    appendUserMsg(query);
    var picked = pickResults(query);
    runSearchProgress(picked.cond, function () {
      appendAiMsg(answerSentence(query, picked.cond, picked.items), picked.items);
      // 사이드바에 새 대화로 추가
      history.forEach(function (h) { h.active = false; });
      history.unshift({ id: 'h' + Date.now(), query: query, time: '방금 전', active: true });
      if (history.length > 8) history.length = 8;
      renderHistoryList();
    });
  }

  function openHistoryItem(id) {
    var h = history.filter(function (x) { return x.id === id; })[0];
    if (!h) return;
    setActiveHistory(id);
    clearBody();
    appendUserMsg(h.query);
    var picked = pickResults(h.query);
    appendAiMsg(answerSentence(h.query, picked.cond, picked.items), picked.items, { animate: false });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var q = input.value.trim();
    if (!q) return;
    input.value = '';
    runQuery(q);
  });

  suggestions.addEventListener('click', function (e) {
    var chip = e.target.closest('.aichat-chip');
    if (!chip) return;
    runQuery(chip.dataset.query);
  });

  newBtn.addEventListener('click', function () {
    history.forEach(function (h) { h.active = false; });
    renderHistoryList();
    showEmptyState();
    input.focus();
  });

  // ---------- 초기 상태: 첫 번째 대화(요리 체험)를 이미 주고받은 상태로 표시 ----------
  renderHistoryList();
  var initial = history[0];
  appendUserMsg(initial.query);
  var initialPicked = pickResults(initial.query);
  appendAiMsg(answerSentence(initial.query, initialPicked.cond, initialPicked.items), initialPicked.items, { animate: false });

});
