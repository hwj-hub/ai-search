/* ===================================================================
   ai-search.js — AI 검색 · 독립 페이지형 상호작용 (클라이언트 목업)
   업로드된 참고 HTML(검색 → 타이핑 상태 메시지 → 스켈레톤 로딩 →
   결과 카드 + 페이지네이션) 흐름을 그대로 구현하되, 실제 API는 호출하지
   않는다. 검색어에서 지역/학교급/주제 키워드를 문자열 매칭으로 뽑아
   그럴듯한 15개 결과를 생성해 보여주는 데모용 로직이다.

   실제 서비스 연동 시에는 generateTargetedResults() 내부를 실제 검색
   API 호출(및 그 결과를 카드 데이터 형태로 매핑하는 로직)로 교체하면 된다.
   =================================================================== */

document.addEventListener('DOMContentLoaded', function () {

  var form = document.getElementById('aisrchForm');
  var input = document.getElementById('aisrchInput');
  var statusArea = document.getElementById('aisrchStatus');
  var suggestions = document.getElementById('aisrchSuggestions');
  var resultsSection = document.getElementById('aisrchResults');
  var countInfo = document.getElementById('aisrchCount');
  var cardsContainer = document.getElementById('aisrchCards');
  var paginationBox = document.getElementById('aisrchPagination');

  if (!form || !input) return;

  var typingTimer = null;
  var currentResults = [];
  var currentPage = 1;
  var ITEMS_PER_PAGE = 5;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    handleSearch();
  });

  suggestions.addEventListener('click', function (e) {
    var chip = e.target.closest('.aisrch-chip');
    if (!chip) return;
    input.value = chip.dataset.query;
    handleSearch();
  });

  function handleSearch() {
    var query = input.value.trim();
    if (!query) {
      input.focus();
      return;
    }

    suggestions.style.display = 'none';
    resultsSection.style.display = 'none';
    cardsContainer.innerHTML = '';
    paginationBox.innerHTML = '';

    currentResults = generateTargetedResults(query, 15);

    runTypingEffect('해당 지역의 교육 인프라와 체험 프로그램을 매칭하고 있습니다...', function () {
      resultsSection.style.display = 'flex';
      renderSkeletonCards();

      setTimeout(function () {
        runTypingEffect('맞춤형 진로 체험 프로그램 ' + currentResults.length + '개를 정렬하는 중...', function () {
          setTimeout(function () {
            statusArea.textContent = '';
            statusArea.classList.remove('typing');
            currentPage = 1;
            renderResultsPage(currentPage);
            renderPagination();
          }, 400);
        });
      }, 500);
    });
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
    }, 20);
  }

  function renderSkeletonCards() {
    cardsContainer.innerHTML = '';
    for (var i = 0; i < 3; i++) {
      var sk = document.createElement('div');
      sk.className = 'aisrch-skeleton-card';
      sk.innerHTML =
        '<div class="aisrch-skeleton-line" style="width:30%;margin-bottom:16px;"></div>' +
        '<div class="aisrch-skeleton-line" style="width:55%;height:20px;"></div>' +
        '<div class="aisrch-skeleton-line" style="width:90%;"></div>' +
        '<div class="aisrch-skeleton-line" style="width:100%;height:42px;margin:16px 0;"></div>' +
        '<div class="aisrch-skeleton-line" style="width:100%;height:34px;border-radius:10px;margin-bottom:0;"></div>';
      cardsContainer.appendChild(sk);
    }
  }

  // 검색어에서 지역 / 학교급 / 주제를 뽑아 15개의 그럴듯한 결과를 생성한다.
  function generateTargetedResults(query, count) {
    var region = '전국';
    if (query.indexOf('서울') > -1 && query.indexOf('중구') > -1) region = '서울 중구';
    else if (query.indexOf('강서구') > -1) region = '부산 강서구';
    else if (query.indexOf('포천') > -1) region = '경기 포천시';
    else if (query.indexOf('서울') > -1) region = '서울';
    else if (query.indexOf('부산') > -1) region = '부산';
    else if (query.indexOf('경기') > -1) region = '경기';

    var target = '초·중·고 전체';
    if (query.indexOf('중등') > -1 || query.indexOf('중학생') > -1) target = '중학생';
    else if (query.indexOf('고등') > -1) target = '고등학생';
    else if (query.indexOf('초등') > -1) target = '초등학생';

    var category = '진로탐색·교육';
    if (query.indexOf('IT') > -1 || query.indexOf('코딩') > -1) category = 'IT·AI·디지털';
    else if (query.indexOf('보건') > -1 || query.indexOf('헬스케어') > -1) category = '보건·의료';
    else if (query.indexOf('도자기') > -1 || query.indexOf('공예') > -1) category = '공예·예술';
    else if (query.indexOf('게임') > -1) category = '게임·미디어';

    var titleTemplates = [
      region + ' 맞춤형 ' + category + ' 집중 프로그램',
      '현장 연계형 ' + category + ' 체험',
      category + ' 전문가와 함께하는 진로체험',
      '미래 설계 ' + category + ' 스페셜 클래스',
      '청소년 진로 멘토링 – ' + category + ' 탐방'
    ];
    var typePills = [
      { label: '현장직업체험', cls: 'green' },
      { label: '직업실무체험', cls: 'green' },
      { label: '학과체험', cls: 'purple' }
    ];
    var type2List = ['현장 체험형', '실습·체험형', '강연·견학형'];

    var results = [];
    for (var i = 0; i < count; i++) {
      var tpl = titleTemplates[i % titleTemplates.length];
      var typePill = typePills[i % typePills.length];
      var isClosed = (i % 4 === 3);

      results.push({
        typeLabel: typePill.label,
        typeCls: typePill.cls,
        statusLabel: isClosed ? '신청마감' : '모집중',
        statusCls: isClosed ? 'closed' : 'open',
        title: tpl + ' (' + (i + 1) + '기)',
        snippet: region + ' 인근 교육 인프라와 연계해 ' + target + '이 ' + category + ' 분야의 핵심 역량을 직접 체험해보는 프로그램입니다.',
        region: region,
        target: target,
        cost: (i % 2 === 0) ? '무료' : '재료비 일부 지원',
        type2: type2List[i % type2List.length],
        tags: ['#' + region.replace(/\s/g, ''), '#' + target, '#' + category.replace(/[·]/g, ''), '#인기프로그램']
      });
    }
    return results;
  }

  function renderResultsPage(page) {
    cardsContainer.innerHTML = '';
    currentPage = page;

    var total = currentResults.length;
    var start = (page - 1) * ITEMS_PER_PAGE;
    var end = Math.min(start + ITEMS_PER_PAGE, total);
    countInfo.textContent = '검색 결과: 총 ' + total + '개 중 ' + (start + 1) + '~' + end + '개 표시';

    currentResults.slice(start, end).forEach(function (item, idx) {
      var card = document.createElement('article');
      card.className = 'aisrch-card';
      card.style.animationDelay = (idx * 0.05) + 's';

      var tagsHtml = item.tags.map(function (t) {
        return '<span class="aisrch-hashtag">' + t + '</span>';
      }).join('');

      card.innerHTML =
        '<div class="top">' +
          '<span class="type-pill ' + item.typeCls + '">' + item.typeLabel + '</span>' +
          '<span class="status-pill ' + item.statusCls + '">' + item.statusLabel + '</span>' +
        '</div>' +
        '<div class="title-row"><h3>' + item.title + '</h3></div>' +
        '<p class="snippet">' + item.snippet + '</p>' +
        '<div class="aisrch-location">' +
          '<strong>활동 지역</strong>' +
          '<span class="aisrch-loc-tag">' + item.region + '</span>' +
        '</div>' +
        '<div class="divider"></div>' +
        '<div class="meta-footer">' +
          '<div class="meta-group">' +
            '<span>대상 ' + item.target + '</span><span>·</span>' +
            '<span>비용 ' + item.cost + '</span><span>·</span>' +
            '<span>유형 ' + item.type2 + '</span>' +
          '</div>' +
          '<div class="tags-group">' + tagsHtml + '</div>' +
        '</div>';
      cardsContainer.appendChild(card);
    });
  }

  function renderPagination() {
    paginationBox.innerHTML = '';
    var totalPages = Math.ceil(currentResults.length / ITEMS_PER_PAGE);

    var prevBtn = makePageBtn('‹', null, currentPage === 1, function () { movePage(currentPage - 1); }, '이전 페이지');
    paginationBox.appendChild(prevBtn);

    for (var i = 1; i <= totalPages; i++) {
      (function (pageNum) {
        var btn = makePageBtn(String(pageNum), pageNum === currentPage, false, function () { movePage(pageNum); });
        paginationBox.appendChild(btn);
      })(i);
    }

    var nextBtn = makePageBtn('›', null, currentPage === totalPages, function () { movePage(currentPage + 1); }, '다음 페이지');
    paginationBox.appendChild(nextBtn);
  }

  function makePageBtn(label, active, disabled, onClick, ariaLabel) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'aisrch-page-btn' + (active ? ' active' : '');
    btn.textContent = label;
    btn.disabled = !!disabled;
    if (ariaLabel) btn.setAttribute('aria-label', ariaLabel);
    btn.addEventListener('click', onClick);
    return btn;
  }

  function movePage(targetPage) {
    renderResultsPage(targetPage);
    renderPagination();
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

});
