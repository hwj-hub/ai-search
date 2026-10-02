/* ===================================================================
   program-search.js — 진로체험 프로그램 검색 (AI 자연어 검색 개편판) 인터랙션
   검색창에 입력한 자연어 질문을 "타이핑 상태 메시지 → 스켈레톤 로딩 →
   AI가 이해한 조건 칩 → 조건에 맞게 재정렬된 리스트" 순서로 보여준다.
   실제 API 호출은 없고, 문자열 키워드 매칭으로 조건을 추출해 기존
   프로그램 목록을 재정렬하는 클라이언트 목업이다. 상세 필터 패널
   토글/pill/초기화, 최근 검색, 페이지네이션도 함께 처리한다.
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

  // ---------- 데이터 ----------
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

  var listing = document.getElementById('psrchListing');
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

  // 리스트용 작은 아이콘 (카드형과 동일한 픽토그램으로 시각적 일관성 유지)
  var ROW_ICON = {
    clock: '<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3.5 2" stroke-linecap="round"></path>',
    pin: '<path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z"></path><circle cx="12" cy="10" r="2.4"></circle>',
    globe: '<circle cx="12" cy="12" r="9"></circle><path d="M3 12h18M12 3c2.5 2.5 3.8 6 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-6-3.8-9s1.3-6.5 3.8-9z" stroke-linecap="round"></path>'
  };

  // cond가 있을 때만 "AI 매칭 N%"를 계산한다(카드형과 동일한 점수식)
  function matchPercent(p, cond) {
    var s = scoreProgram(p, cond);
    var pct = 72 + s * 6;
    if (pct > 99) pct = 99;
    return pct;
  }

  // 이 프로그램이 왜 이 순서에 올라왔는지 — 실제로 스코어링에 쓰인 조건만 정직하게 표시
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

  // 한 글자씩 타이핑하는 공용 헬퍼 (채팅형 B안과 동일한 방식)
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

  function renderRows(items, cond, options) {
    options = options || {};
    var showAI = !!(cond && (cond.region || cond.target || cond.keyword));
    listing.innerHTML = '';

    if (options.animate && showAI) {
      revealRowsSequentially(items, cond, 0);
      return;
    }

    items.forEach(function (p, idx) {
      var isTop = showAI && idx < 3;
      var row = document.createElement('article');
      row.className = 'psrch-row' + (isTop ? ' psrch-row-top' : '');
      row.style.animationDelay = (idx * 0.04) + 's';

      var rankBadge = isTop
        ? '<span class="psrch-rank-badge"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.8 5.6L19 9l-5.2 1.4L12 16l-1.8-5.6L5 9l5.2-1.4L12 2z"></path></svg>AI 추천 ' + (idx + 1) + '위</span>'
        : '';
      var matchBadge = showAI
        ? '<span class="psrch-match-badge">AI 매칭 ' + matchPercent(p, cond) + '%</span>'
        : '';
      var middleContent = showAI
        ? '<div class="psrch-reason-chips">' + buildReasonChips(p, cond) + '</div>'
        : '<p class="psrch-row-snippet">' + p.region + ' 소재 ' + p.org + '에서 진행하는 ' + p.type + ' 프로그램입니다.</p>';

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
          middleContent +
          '<div class="psrch-row-meta-icons">' + metaIconsHtml(p) + '</div>' +
        '</div>' +
        '<div class="psrch-row-foot">' +
          '<button type="button" class="psrch-row-cta">상세보기 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"></path></svg></button>' +
        '</div>';
      listing.appendChild(row);
    });
  }

  // 실시간 AI 검색 결과: 행을 한 번에 다 보여주지 않고 한 개씩 순서대로 등장시키며,
  // 각 행의 제목을 타이핑으로 채운 뒤 배지·이유칩·메타·CTA를 페이드인한다
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

  function revealRowsSequentially(items, cond, idx) {
    if (idx >= items.length) return;
    var p = items[idx];
    var row = buildRowSkeleton(p, idx, cond);
    listing.appendChild(row);

    var titleEl = row.querySelector('.psrch-row-title');
    var reveals = row.querySelectorAll('.psrch-reveal');

    setTimeout(function () {
      typeText(titleEl, p.title, 14, function () {
        reveals.forEach(function (el) { el.classList.add('shown'); });
        setTimeout(function () { revealRowsSequentially(items, cond, idx + 1); }, 220);
      });
    }, 90);
  }

  function renderSkeleton(count) {
    listing.innerHTML = '';
    for (var i = 0; i < count; i++) {
      var sk = document.createElement('div');
      sk.className = 'psrch-skeleton-row';
      sk.innerHTML =
        '<div style="display:flex;gap:8px;">' +
          '<div class="psrch-skeleton-line" style="width:56px;height:20px;border-radius:999px;"></div>' +
          '<div class="psrch-skeleton-line" style="width:74px;height:20px;border-radius:999px;"></div>' +
        '</div>' +
        '<div class="psrch-skeleton-line" style="width:42%;height:16px;"></div>' +
        '<div class="psrch-skeleton-line" style="width:60%;"></div>';
      listing.appendChild(sk);
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
    else if (query.indexOf('현장직업체험') > -1) { keyword = '현장직업체험'; keywordType = '현장직업체험형'; }
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
    renderRows(PROGRAMS);
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
      renderSkeleton(3);
      setTimeout(function () {
        var cond = parseQuery(query);
        var sorted = PROGRAMS.map(function (p) { return { p: p, s: scoreProgram(p, cond) }; })
          .sort(function (a, b) { return b.s - a.s; })
          .map(function (x) { return x.p; });

        statusArea.textContent = '';
        statusArea.classList.remove('typing');
        renderConditions(cond);
        renderRows(sorted, cond, { animate: true });
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
      listing.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // 초기 리스트 렌더링(기본 상태)
  renderRows(PROGRAMS);
});
