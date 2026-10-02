// ===================================================================
// header.js — 헤더/모바일 전체메뉴 동작 (서브메뉴, 마이페이지, 모바일 내비, 화면크기).
// index.html, index_login.html 공통 사용.
// ===================================================================

  (function(){
    // 마이페이지 서브메뉴(데스크톱): 학교 정보 관리 / 진로체험 프로그램 관리 / 진로교육 실적 보고.
    // "진로체험망 꿈길 > 진로체험 운영 우수사례"와 똑같이 하나의 흰 박스(.submenu-flyout) 안에서
    // 왼쪽=항상 보이는 메인 목록, 오른쪽=활성 항목의 하위 목록이 펼쳐진다.
    // 트리거가 3개라 각각의 하위 목록(.flyout-col) 중 하나만 활성화(active)로 보여준다.
    var mypageMenu = document.getElementById('mypageMenuDesktop');
    if (mypageMenu) {
      var mypageTriggers = Array.prototype.slice.call(mypageMenu.querySelectorAll('[data-flyout-trigger]'));
      var mypageCols = {};
      Array.prototype.slice.call(mypageMenu.querySelectorAll('.flyout-col')).forEach(function(col){
        mypageCols[col.getAttribute('data-flyout-id')] = col;
      });
      var mypageCloseTimer = null;

      function mypageShow(id){
        window.clearTimeout(mypageCloseTimer);
        Object.keys(mypageCols).forEach(function(key){ mypageCols[key].classList.toggle('active', key === id); });
        mypageTriggers.forEach(function(t){ t.classList.toggle('active', t.getAttribute('data-flyout-target') === id); });
      }
      function mypageHideAll(){
        Object.keys(mypageCols).forEach(function(key){ mypageCols[key].classList.remove('active'); });
        mypageTriggers.forEach(function(t){ t.classList.remove('active'); });
      }
      function mypageScheduleHide(){
        window.clearTimeout(mypageCloseTimer);
        mypageCloseTimer = window.setTimeout(mypageHideAll, 150);
      }
      function mypageCancelHide(){
        window.clearTimeout(mypageCloseTimer);
      }

      mypageTriggers.forEach(function(trigger){
        var id = trigger.getAttribute('data-flyout-target');
        trigger.addEventListener('mouseenter', function(){ mypageShow(id); });
        trigger.addEventListener('click', function(e){
          e.preventDefault();
          var willOpen = !(mypageCols[id] && mypageCols[id].classList.contains('active'));
          mypageHideAll();
          if (willOpen) mypageShow(id);
        });
      });

      // 하나로 이어진 박스라서(오른쪽 목록과 왼쪽 하위목록 사이에 빈 공간이 없음) 박스 전체를
      // 기준으로 마우스 진입/이탈을 감지하면 죽는 영역 없이 자연스럽게 열리고 닫힌다.
      mypageMenu.addEventListener('mouseenter', mypageCancelHide);
      mypageMenu.addEventListener('mouseleave', mypageScheduleHide);

      var mypageNavItem = mypageMenu.closest('.nav-item');
      if (mypageNavItem) {
        mypageNavItem.addEventListener('mouseleave', function(){
          window.clearTimeout(mypageCloseTimer);
          mypageHideAll();
        });
      }
    }
  })();

  (function(){
    // 서브메뉴(2depth)는 마우스오버로 열리고 닫힘.
    // "진로체험 운영 우수사례"(3depth)도 마우스오버로 오른쪽에 펼쳐지고, 클릭으로도 열고 닫을 수 있다.
    document.querySelectorAll('[data-flyout-menu]').forEach(function(menu){
      var trigger = menu.querySelector('[data-flyout-trigger]');
      if (!trigger) return;

      // 트리거(진로체험 운영 우수사례)가 목록 중간에 있고 3depth 패널은 위쪽에 붙어 나오다보니,
      // 트리거/플라이아웃 각각에만 mouseleave를 걸면 그 사이 빈 공간을 지나가는 순간 닫혀버렸다.
      // 그래서 전체 패널(menu = .submenu-flyout, 흰 박스 전체)을 기준으로 마우스 진입/이탈을 감지한다.
      var closeTimer = null;
      function open(){
        window.clearTimeout(closeTimer);
        menu.classList.add('open');
      }
      function scheduleClose(){
        window.clearTimeout(closeTimer);
        closeTimer = window.setTimeout(function(){ menu.classList.remove('open'); }, 150);
      }

      trigger.addEventListener('mouseenter', open);
      menu.addEventListener('mouseenter', function(){ window.clearTimeout(closeTimer); });
      menu.addEventListener('mouseleave', scheduleClose);

      trigger.addEventListener('click', function(e){
        e.preventDefault();
        window.clearTimeout(closeTimer);
        menu.classList.toggle('open');
      });

      // 상위 메뉴에서 마우스가 완전히 벗어나면 다음에 열릴 때 항상 접힌 상태로 시작
      var navItem = menu.closest('.nav-item');
      if (navItem) {
        navItem.addEventListener('mouseleave', function(){
          window.clearTimeout(closeTimer);
          menu.classList.remove('open');
        });
      }
    });
  })();

  (function(){
    var btn = document.querySelector('.hamburger-btn');
    var panel = document.getElementById('mobileNavPanel');
    var backdrop = document.getElementById('mobileNavBackdrop');
    if (!btn || !panel) return;

    function resetAccordion(){
      panel.querySelectorAll('.mnav-group.open').forEach(function(g){ g.classList.remove('open'); });
    }
    function closeMenu(){
      panel.classList.remove('open');
      backdrop.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      window.setTimeout(resetAccordion, 200);
    }
    function openMenu(){
      panel.classList.add('open');
      backdrop.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
    }

    btn.addEventListener('click', function(){
      var isOpen = panel.classList.contains('open');
      if (isOpen) { closeMenu(); } else { openMenu(); }
    });
    backdrop.addEventListener('click', closeMenu);

    var mnavCloseBtn = document.getElementById('mnavCloseBtn');
    if (mnavCloseBtn) mnavCloseBtn.addEventListener('click', closeMenu);

    // 메뉴 이름(토글 버튼)을 누르면 펼치고/접고 — 2depth/3depth 모두 같은 방식의 드롭다운.
    // 최상위(2depth) 토글은 형제 그룹을 닫아 한 번에 하나만 펼쳐지고, 중첩(3depth) 토글은 부모 목록을 유지한 채 자기 자신만 펼친다.
    panel.querySelectorAll(':scope .mnav-toggle').forEach(function(toggle){
      toggle.addEventListener('click', function(){
        var group = toggle.parentElement;
        var isNested = group.classList.contains('nested');
        var willOpen = !group.classList.contains('open');

        if (!isNested) {
          Array.prototype.forEach.call(panel.children, function(sibling){
            if (sibling !== group) sibling.classList.remove('open');
          });
        } else {
          var parentSub = group.parentElement;
          Array.prototype.forEach.call(parentSub.children, function(sibling){
            if (sibling !== group && sibling.classList && sibling.classList.contains('nested')) sibling.classList.remove('open');
          });
        }
        group.classList.toggle('open', willOpen);
      });
    });
    // 실제 목적지 링크를 누르면 선택되었다는 강조표시를 남기고 전체 메뉴를 닫는다.
    panel.querySelectorAll('.mnav-sub a').forEach(function(a){
      a.addEventListener('click', function(){
        panel.querySelectorAll('.mnav-sub a.selected').forEach(function(s){ s.classList.remove('selected'); });
        a.classList.add('selected');
        closeMenu();
      });
    });

    window.addEventListener('resize', function(){
      if (window.innerWidth > 760) closeMenu();
    });
  })();

  (function(){
    // 모바일 전체메뉴 안의 검색바 — 메뉴를 닫고 AI 검색 팝업을 연다.
    var searchBtn = document.getElementById('mnavSearchBtn');
    if (!searchBtn) return;
    searchBtn.addEventListener('click', function(){
      var panel = document.getElementById('mobileNavPanel');
      var navBackdrop = document.getElementById('mobileNavBackdrop');
      var hbtn = document.querySelector('.hamburger-btn');
      if (panel) panel.classList.remove('open');
      if (navBackdrop) navBackdrop.classList.remove('open');
      if (hbtn) hbtn.setAttribute('aria-expanded', 'false');

      var modal = document.getElementById('aiSearchModal');
      var modalBackdrop = document.getElementById('searchModalBackdrop');
      if (modal) modal.classList.add('open');
      if (modalBackdrop) modalBackdrop.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  })();

  /* ---------- 화면크기(글자 크기 조절) 드롭다운 ---------- */
  (function(){
    var wrap = document.getElementById('ssWrap');
    var btn = document.getElementById('screenSizeBtn');
    var dropdown = document.getElementById('screenSizeDropdown');
    if (!wrap || !btn || !dropdown) return;

    var options = dropdown.querySelectorAll('.ss-option');
    var DEFAULT_SCALE = '100';
    var STORAGE_KEY = 'ggomgil-font-scale';

    function applyScale(scale){
      document.documentElement.style.zoom = scale + '%';
      for (var i = 0; i < options.length; i++) {
        var opt = options[i];
        if (opt.getAttribute('data-scale') === String(scale)) {
          opt.classList.add('is-active');
        } else {
          opt.classList.remove('is-active');
        }
      }
      try { localStorage.setItem(STORAGE_KEY, scale); } catch(e){}
    }

    function openDropdown(){
      dropdown.classList.add('open');
      wrap.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
    }
    function closeDropdown(){
      dropdown.classList.remove('open');
      wrap.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }

    btn.addEventListener('click', function(e){
      e.preventDefault();
      if (dropdown.classList.contains('open')) { closeDropdown(); } else { openDropdown(); }
    });

    document.addEventListener('click', function(e){
      if (!wrap.contains(e.target)) closeDropdown();
    });

    for (var j = 0; j < options.length; j++) {
      (function(opt){
        opt.addEventListener('click', function(){
          applyScale(opt.getAttribute('data-scale'));
        });
      })(options[j]);
    }

    var resetBtn = document.getElementById('ssReset');
    if (resetBtn) {
      resetBtn.addEventListener('click', function(){
        applyScale(DEFAULT_SCALE);
      });
    }

    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved) applyScale(saved);
    } catch(e){}
  })();
