/* ===================================================================
   program-search-card.js — 진로체험 프로그램 검색 (AI 검색 · 카드배너형)
   program-search.js와 검색 로직(자연어 질의 파싱/스코어링/타이핑 연출/
   최근검색/상세필터/페이지네이션)은 완전히 동일하고, 결과를 리스트 행이
   아닌 배너형 카드 그리드로 렌더링하는 부분만 다르다. 실제 API 호출은
   없는 클라이언트 목업이다.

   2차 수정(아이콘/타이틀 보강): 사용자가 참고 이미지로 보여준 기존 실제
   사이트의 "아이콘 타일형" 카드 스타일을 반영해, 배너를 그라디언트가
   아닌 단색+도트 패턴으로 바꾸고 가운데 큰 픽토그램 아이콘을 넣었다.
   아이콘/배너색은 `type`(체험유형) 고정 매핑이 아니라 제목·기관명의
   키워드를 먼저 검사해 내용에 맞는 아이콘(금융→코인, 안전/응급→십자,
   미술→팔레트, 사진/영상→카메라, 댄스/크리에이터→플레이)을 고르고,
   못 찾으면 체험유형 기본 아이콘으로 대체하는 classifyBanner()를
   추가했다. 카드 본문에는 대상학년(초/중/고) 동그라미 배지와, 기관/
   지역/신청범위를 아이콘+한 줄씩 나열하는 정보 리스트를 새로 넣었다
   (기존의 한 줄 요약 문장 대신).
   =================================================================== */

document.addEventListener('DOMContentLoaded', function () {

  // ---------- 상세 필터 토글 ----------
  var filterToggle = document.getElementById('psrchFilterToggle');
  var filterPanel = document.getElementById('psrchFilterPanel');
  if (filterToggle && filterPanel) {
    filterToggle.addEventListener('click', function () {
      var isOpen = filterToggle.getAttribute('aria-expanded') === 'true';
      filterToggle.setAttribute('aria-expanded', String(!isOpen));
      filterPanel.hidden = isOpen;
      filterToggle.firstChild.textContent = isOpen ? '상세 필터로 직접 좁혀보기 ' : '상세 필터 접기 ';
    });
  }

  // ---------- 필터 패널: pill 토글 ----------
  document.querySelectorAll('.psrch-pillgroup').forEach(function (group) {
    var multi = group.dataset.multi === 'true';
    group.querySelectorAll('.psrch-pill').forEach(function (pill) {
      pill.addEventListener('click', function () {
        if (!multi) {
          group.querySelectorAll('.psrch-pill').forEach(function (p) { p.classList.remove('active'); });
        }
        pill.classList.toggle('active');
      });
    });
  });

  // ---------- 선택한 필터 초기화 ----------
  var resetBtn = document.getElementById('psrchResetBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      document.querySelectorAll('.psrch-pill.active').forEach(function (p) { p.classList.remove('active'); });
      document.querySelectorAll('.psrch-select').forEach(function (s) { s.selectedIndex = 0; });
      document.querySelectorAll('.psrch-searchfield input, .psrch-daterange input').forEach(function (i) { i.value = ''; });
    });
  }

  // ---------- 데이터 (grades: 대상학년 — el 초등/ms 중등/hs 고등) ----------
  var PROGRAMS = [
    { title: '연수 테스트', org: '대한상공회의소(민간기업)', type: '현장직업체험형', typeCls: 'green', region: '서울 중구', apply: '전국', hours: '2시간', cost: '무료', status: 'open', grades: ['el'] },
    { title: '꿈길 QR코드 테스트(26년)', org: '테스트꿈길체험처(민간기업)', type: '현장직업체험형', typeCls: 'green', region: '서울 강남구', apply: '전국', hours: '5시간', cost: '무료', status: 'open', grades: ['el', 'ms', 'hs'] },
    { title: '꿈길 연수 프로그램 (2026년도)', org: '대한상공회의소(민간기업)', type: '현장직업체험형', typeCls: 'green', region: '서울 강동구', apply: '전국', hours: '4시간', cost: '무료', status: 'open', grades: ['el', 'ms', 'hs'] },
    { title: 'NH농협은행 행복채움 금융 진로교실', org: '농협은행 광주영업본부(민간기업)', type: '강연형', typeCls: 'teal', region: '서울 강남구', apply: '전국', hours: '2시간', cost: '무료', status: 'open', grades: ['el', 'ms', 'hs'] },
    { title: '땅에 피는 하늘사랑(춘하추동)', org: '고려대학교 세종캠퍼스(인증기관)', type: '공연형', typeCls: 'indigo', region: '강원 영월군', apply: '전국', hours: '30시간', cost: '12,000원', status: 'closed', grades: ['el', 'hs'] },
    { title: '대한상공회의소 직업체험', org: '대한상공회의소(민간기업)', type: '현장직업체험형', typeCls: 'green', region: '서울 중구', apply: '전국', hours: '2시간', cost: '1,000원', status: 'open', grades: ['el', 'ms'] },
    { title: '학교로 찾아가는 재난안전 응급처치', org: '한국스포츠과학연구소(청주센터)(민간기업)', type: '직업실무체험형', typeCls: 'orange', region: '대구 북구', apply: '전국', hours: '2시간', cost: '350,000원', status: 'open', grades: ['el', 'ms', 'hs'] },
    { title: '캐리커쳐 작가', org: '달연거울(학교/대학교)', type: '현장직업체험형', typeCls: 'green', region: '대전 동구', apply: '전국', hours: '2시간', cost: '15,000원', status: 'open', grades: ['ms', 'hs'] },
    { title: '계란형 이끼 테라리움 키트_원예지도사 (유튜브 동영상 안내자료)', org: '향미의정원(개인사업체)', type: '현장직업체험형', typeCls: 'green', region: '경남 양산시', apply: '전국', hours: '2시간', cost: '20,000원', status: 'closed', grades: ['el', 'ms'] },
    { title: '보컬댄스 입시와 아이돌가수지망생 외 유튜브크리에이터 직업', org: '학앤터 아카데미 학원(개인사업체)', type: '현장직업체험형', typeCls: 'green', region: '부산 수영구', apply: '부산광역시 강서구 외 15지역', hours: '2시간', cost: '20,000원', status: 'open', grades: ['ms', 'hs'] }
  ];

  // ---------- 배너 큰 아이콘 세트 (24x24, 흰색 선/획으로 그려서 색배너 위에 얹음) ----------
  var ICONS = {
    building: '<path d="M3 10l9-6 9 6M5 10v9M9 10v9M15 10v9M19 10v9M3 19h18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"></path>',
    coin: '<ellipse cx="12" cy="6.5" rx="7" ry="2.8" fill="none" stroke="currentColor" stroke-width="1.7"></ellipse><path d="M5 6.5v5c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8v-5" fill="none" stroke="currentColor" stroke-width="1.7"></path><path d="M5 11.5v5c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8v-5" fill="none" stroke="currentColor" stroke-width="1.7"></path>',
    cross: '<path d="M12 3l7 3v5.5c0 5-3 8.2-7 9.5-4-1.3-7-4.5-7-9.5V6l7-3z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"></path><path d="M12 8.3v6.4M8.8 11.5h6.4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"></path>',
    palette: '<path d="M12 3a9 8.3 0 1 0 3.2 16c.7-.3 1-1 .7-1.7l-.2-.4c-.3-.6.1-1.4.8-1.4H18a4 4 0 0 0 4-4C22 6.3 17.9 3 12 3z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"></path><circle cx="7.6" cy="10.6" r="1.15" fill="currentColor"></circle><circle cx="10.2" cy="7.3" r="1.15" fill="currentColor"></circle><circle cx="14.2" cy="7.3" r="1.15" fill="currentColor"></circle><circle cx="16.6" cy="10.8" r="1.15" fill="currentColor"></circle>',
    camera: '<path d="M4 8.3h3.2L8.7 6h6.6l1.5 2.3H20a1 1 0 0 1 1 1V18a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.3a1 1 0 0 1 1-1z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"></path><circle cx="12" cy="13.2" r="3.4" fill="none" stroke="currentColor" stroke-width="1.7"></circle>',
    play: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.7"></circle><path d="M10.2 8.6l6 3.4-6 3.4z" fill="currentColor"></path>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3" fill="none" stroke="currentColor" stroke-width="1.7"></rect><path d="M6 11a6 6 0 0 0 12 0M12 17v3.3M9 20.3h6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"></path>',
    cap: '<path d="M12 4L2 9l10 5 8.5-4.25V15" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"></path><path d="M6 11.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-4.5" fill="none" stroke="currentColor" stroke-width="1.7"></path>',
    music: '<circle cx="7" cy="18" r="2.6" fill="none" stroke="currentColor" stroke-width="1.7"></circle><circle cx="17" cy="16" r="2.6" fill="none" stroke="currentColor" stroke-width="1.7"></circle><path d="M9.6 18V5.5L19.6 3.5V16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"></path>'
  };

  // 정보 리스트용 작은 아이콘
  var META_ICON = {
    org: '<path d="M4 21V8.5a1 1 0 0 1 .5-.87l7-4a1 1 0 0 1 1 0l7 4a1 1 0 0 1 .5.87V21M4 21h16M9 21v-4h6v4" stroke-linecap="round" stroke-linejoin="round"></path>',
    pin: '<path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z"></path><circle cx="12" cy="10" r="2.4"></circle>',
    globe: '<circle cx="12" cy="12" r="9"></circle><path d="M3 12h18M12 3c2.5 2.5 3.8 6 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-6-3.8-9s1.3-6.5 3.8-9z" stroke-linecap="round"></path>'
  };

  var GRADE_LABEL = { el: '초', ms: '중', hs: '고' };

  // 제목/기관명 키워드로 배너 색·아이콘을 고르고, 없으면 체험유형 기본값으로 대체
  function classifyBanner(p) {
    var t = p.title + ' ' + p.org;
    if (/금융|은행|증권|경제/.test(t)) return { cls: 'blue', icon: 'coin' };
    if (/캐리커쳐|미술|디자인|공예|화가/.test(t)) return { cls: 'purple', icon: 'palette' };
    if (/사진|영상|동영상|촬영/.test(t)) return { cls: 'magenta', icon: 'camera' };
    if (/댄스|보컬|크리에이터|아이돌/.test(t)) return { cls: 'pink', icon: 'play' };
    if (/응급|안전|재난|보건|의료|헬스케어/.test(t)) return { cls: 'orange', icon: 'cross' };
    switch (p.typeCls) {
      case 'green': return { cls: 'green', icon: 'building' };
      case 'orange': return { cls: 'orange', icon: 'cross' };
      case 'purple': return { cls: 'purple', icon: 'cap' };
      case 'teal': return { cls: 'teal', icon: 'mic' };
      case 'indigo': return { cls: 'indigo', icon: 'music' };
    }
    return { cls: 'green', icon: 'building' };
  }

  var cardGrid = document.getElementById('psrchCardGrid');
  var totalCountEl = document.getElementById('psrchTotalCount');
  var statusArea = document.getElementById('psrchStatus');
  var conditionsBox = document.getElementById('psrchConditions');
  var condChips = document.getElementById('psrchCondChips');
  var condReset = document.getElementById('psrchCondReset');
  var input = document.getElementById('psrchInput');
  var form = document.getElementById('psrchSearchForm');
  var suggestions = document.getElementById('psrchSuggestions');
  var historyList = document.getElementById('psrchHistoryList');
  var historyClear = document.getElementById('psrchHistoryClear');

  var typingTimer = null;

  // cond가 있을 때만 "AI 매칭 N%" 배지를 계산해 보여준다
  function matchPercent(p, cond) {
    var s = scoreProgram(p, cond);
    var pct = 72 + s * 6;
    if (pct > 99) pct = 99;
    return pct;
  }

  function renderCards(items, cond) {
    var showMatch = !!(cond && (cond.region || cond.target || cond.keyword));
    cardGrid.innerHTML = '';
    items.forEach(function (p, idx) {
      var banner = classifyBanner(p);
      var card = document.createElement('article');
      card.className = 'psrch-card';
      card.style.animationDelay = (idx * 0.04) + 's';

      var gradePills = (p.grades || []).map(function (g) {
        return '<span class="psrch-grade-pill ' + g + '">' + GRADE_LABEL[g] + '</span>';
      }).join('');

      var matchBadge = showMatch
        ? '<span class="psrch-card-match"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.8 5.6L19 9l-5.2 1.4L12 16l-1.8-5.6L5 9l5.2-1.4L12 2z"></path></svg>AI 매칭 ' + matchPercent(p, cond) + '%</span>'
        : '';

      card.innerHTML =
        '<div class="psrch-card-banner ' + banner.cls + '">' +
          matchBadge +
          '<span class="status-pill ' + (p.status === 'open' ? 'open' : 'closed') + '">' + (p.status === 'open' ? '모집중' : '신청마감') + '</span>' +
          '<span class="psrch-card-banner-icon"><svg viewBox="0 0 24 24">' + ICONS[banner.icon] + '</svg></span>' +
        '</div>' +
        '<div class="psrch-card-body">' +
          '<div class="psrch-card-toprow">' +
            '<span class="psrch-card-grades">' + gradePills + '</span>' +
            '<span class="type-pill ' + p.typeCls + '">' + p.type + '</span>' +
          '</div>' +
          '<h3 class="psrch-card-title">' + p.title + '</h3>' +
          '<div class="psrch-card-meta-list">' +
            '<div class="psrch-card-meta-row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">' + META_ICON.org + '</svg><span>' + p.org + '</span></div>' +
            '<div class="psrch-card-meta-row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">' + META_ICON.pin + '</svg><span>' + p.region + ' (체험처)</span></div>' +
            '<div class="psrch-card-meta-row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">' + META_ICON.globe + '</svg><span>신청: ' + p.apply + '</span></div>' +
          '</div>' +
          '<div class="psrch-card-divider"></div>' +
          '<div class="psrch-card-foot">' +
            '<span>' + p.hours + ' · <strong>' + p.cost + '</strong></span>' +
            '<button type="button" class="psrch-card-detail-link">상세보기 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"></path></svg></button>' +
          '</div>' +
        '</div>';
      cardGrid.appendChild(card);
    });
  }

  function renderCardSkeleton(count) {
    cardGrid.innerHTML = '';
    for (var i = 0; i < count; i++) {
      var sk = document.createElement('div');
      sk.className = 'psrch-card-skel';
      sk.innerHTML =
        '<div class="psrch-card-skel-banner"></div>' +
        '<div class="psrch-card-skel-body">' +
          '<div class="psrch-card-skel-line" style="width:38%;height:16px;border-radius:999px;"></div>' +
          '<div class="psrch-card-skel-line" style="width:90%;"></div>' +
          '<div class="psrch-card-skel-line" style="width:70%;"></div>' +
          '<div class="psrch-card-skel-line" style="width:60%;"></div>' +
        '</div>';
      cardGrid.appendChild(sk);
    }
  }

  function runTypingEffect(message, onComplete) {
    clearInterval(typingTimer);
    statusArea.textContent = '';
    statusArea.classList.add('typing');
    var idx = 0;
    typingTimer = setInterval(function () {
      if (idx < message.length) {
        statusArea.textContent += message.charAt(idx);
        idx++;
      } else {
        clearInterval(typingTimer);
        if (onComplete) onComplete();
      }
    }, 18);
  }

  // ---------- 자연어 질의에서 조건 추출 (문자열 키워드 매칭, 실제 API 미사용) ----------
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
    else if (query.indexOf('진로탐색') > -1) { keyword = '진로탐색'; keywordType = null; }

    return { region: region, target: target, keyword: keyword, keywordType: keywordType };
  }

  function renderConditions(cond) {
    if (!cond.region && !cond.target && !cond.keyword) {
      conditionsBox.hidden = true;
      return;
    }
    condChips.innerHTML = '';
    var pairs = [
      ['지역', cond.region],
      ['대상', cond.target],
      ['키워드', cond.keyword]
    ];
    pairs.forEach(function (pair) {
      if (!pair[1]) return;
      var chip = document.createElement('span');
      chip.className = 'psrch-cond-chip';
      chip.innerHTML = pair[0] + ': ' + pair[1] + ' <button type="button" aria-label="' + pair[0] + ' 조건 삭제">✕</button>';
      chip.querySelector('button').addEventListener('click', function () {
        resetConditions();
      });
      condChips.appendChild(chip);
    });
    conditionsBox.hidden = false;
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

  function resetConditions() {
    conditionsBox.hidden = true;
    statusArea.textContent = '';
    statusArea.classList.remove('typing');
    input.value = '';
    totalCountEl.textContent = '6,342';
    renderCards(PROGRAMS, null);
  }

  function addToHistory(query) {
    if (!historyList) return;
    var item = document.createElement('button');
    item.type = 'button';
    item.className = 'psrch-history-item';
    item.dataset.query = query;
    item.innerHTML = '<p>' + query + '</p><span>방금 전</span>';
    historyList.insertBefore(item, historyList.firstChild);
    item.addEventListener('click', function () { runSearch(query); });
    // 최근 검색은 최대 4개까지만 보여준다
    var items = historyList.querySelectorAll('.psrch-history-item');
    if (items.length > 4) items[items.length - 1].remove();
  }

  function runSearch(query) {
    if (!query) { input.focus(); return; }
    input.value = query;
    suggestions.style.display = 'none';

    runTypingEffect('"' + query + '" 조건을 분석하고 있어요...', function () {
      renderCardSkeleton(3);
      setTimeout(function () {
        var cond = parseQuery(query);
        var sorted = PROGRAMS.map(function (p) { return { p: p, s: scoreProgram(p, cond) }; })
          .sort(function (a, b) { return b.s - a.s; })
          .map(function (x) { return x.p; });

        statusArea.textContent = '';
        statusArea.classList.remove('typing');
        renderConditions(cond);
        renderCards(sorted, cond);
        totalCountEl.textContent = String(sorted.length);
        addToHistory(query);
      }, 650);
    });
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      runSearch(input.value.trim());
    });
  }

  if (suggestions) {
    suggestions.addEventListener('click', function (e) {
      var chip = e.target.closest('.psrch-chip');
      if (!chip) return;
      runSearch(chip.dataset.query);
    });
  }

  if (historyList) {
    historyList.querySelectorAll('.psrch-history-item').forEach(function (item) {
      item.addEventListener('click', function () { runSearch(item.dataset.query); });
    });
  }

  if (historyClear) {
    historyClear.addEventListener('click', function () {
      historyList.innerHTML = '';
    });
  }

  if (condReset) condReset.addEventListener('click', resetConditions);

  // ---------- 페이지네이션 ----------
  document.querySelectorAll('.psrch-pg').forEach(function (btn) {
    if (btn.hasAttribute('aria-label')) return;
    btn.addEventListener('click', function () {
      document.querySelectorAll('.psrch-pg').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      cardGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // 초기 카드 렌더링(기본 상태, AI 매칭 배지 없음)
  renderCards(PROGRAMS, null);
});
