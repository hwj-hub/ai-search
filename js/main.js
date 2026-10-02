// ===================================================================
// main.js — 메인 콘텐츠 동작 (히어로, 배너 롤러, 검색 팝업, 카드 캐러셀, 퀵메뉴).
// index.html, index_login.html 공통 사용.
// ===================================================================

      // 메인 히어로 배경 일러스트 - 새로고침마다 3종 중 랜덤 노출
      (function(){
        var heroBgs = [
          'img/main/hero_bg_main1.svg',
          'img/main/hero_bg_main2.svg',
          'img/main/hero_bg_main3.svg'
        ];
        var pick = heroBgs[Math.floor(Math.random() * heroBgs.length)];
        document.getElementById('heroSection').style.backgroundImage = "url('" + pick + "')";
      })();

  (function(){
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    document.querySelectorAll('[data-roller]').forEach(function(viewport){
      var track = viewport.querySelector('.notice-track');
      var MAX_SLIDES = 5;

      // 최대 5개까지만 롤링 대상으로 사용 — 그 이상 마크업에 들어있으면 잘라낸다.
      var slides = Array.prototype.slice.call(track.children);
      if (slides.length > MAX_SLIDES) {
        slides.slice(MAX_SLIDES).forEach(function(el){ track.removeChild(el); });
        slides = slides.slice(0, MAX_SLIDES);
      }
      var count = slides.length;
      if (count < 2) return;

      var card = viewport.closest('.notice-card') || viewport.parentElement;
      var dotsWrap = card.querySelector('.notice-dots');
      if (dotsWrap) {
        // 기존에 남아있던 점(마크업/이전 렌더)을 먼저 비우고 실제 개수만큼 하나씩만 새로 생성 —
        // 이게 비어있지 않은 상태에서 계속 append만 하면 점이 중복 생성돼 두 개씩 켜지는 문제가 생겼었다.
        dotsWrap.innerHTML = '';
        slides.forEach(function(_, i){
          var d = document.createElement('span');
          if (i === 0) d.className = 'on';
          d.setAttribute('role', 'button');
          d.setAttribute('aria-label', (i + 1) + '번째 소식 보기');
          dotsWrap.appendChild(d);
        });
      }
      var dots = dotsWrap ? Array.prototype.slice.call(dotsWrap.children) : [];

      // 뷰포트에 한 번에 2개씩 보이고, 그 안에서 한 줄씩 위로 롤링된다.
      // 그러려면 맨 끝에 "다음에 보일 아래 줄"이 항상 존재해야 하므로, 처음 ROWS_VISIBLE개를
      // 그대로 복제해 뒤에 이어붙여서 마지막 구간에서도 2줄이 항상 채워지도록 한다.
      var ROWS_VISIBLE = 2;
      var cloneCount = Math.min(ROWS_VISIBLE, count);
      for (var c = 0; c < cloneCount; c++) {
        track.appendChild(slides[c].cloneNode(true));
      }

      var index = 0;
      // 줄 사이 간격(gap)까지 포함한 실제 이동 거리 — row 높이만으로 계산하면 gap만큼씩 밀린다.
      var slideHeight = slides.length > 1 ? (slides[1].offsetTop - slides[0].offsetTop) : viewport.clientHeight;
      var timer = null;
      var wrapTimeout = null;

      // 마크업에 남아있을 수 있는 이전 인라인 transform을 지우고 항상 첫 슬라이드부터 시작한다.
      track.style.transition = 'none';
      track.style.transform = 'translateY(0px)';

      function updateDots(realIndex){
        dots.forEach(function(d, i){ d.classList.toggle('on', i === realIndex); });
      }

      function goNext(){
        index++;
        track.style.transition = 'transform .6s cubic-bezier(.4,0,.2,1)';
        track.style.transform = 'translateY(' + (-slideHeight * index) + 'px)';
        updateDots(index % count);

        if (index === count) {
          wrapTimeout = window.setTimeout(function(){
            track.style.transition = 'none';
            track.style.transform = 'translateY(0)';
            index = 0;
          }, 620);
        }
      }

      // jump straight to a chosen slide (dot navigation)
      function goTo(target){
        if (wrapTimeout) { window.clearTimeout(wrapTimeout); wrapTimeout = null; }
        index = target;
        track.style.transition = 'transform .5s cubic-bezier(.4,0,.2,1)';
        track.style.transform = 'translateY(' + (-slideHeight * index) + 'px)';
        updateDots(index);
      }

      function start(){
        if (reduceMotion || timer) return;
        timer = window.setInterval(goNext, 3800);
      }
      function stop(){
        window.clearInterval(timer);
        timer = null;
      }
      function restart(){
        stop();
        start();
      }

      dots.forEach(function(dot, i){
        dot.addEventListener('click', function(){
          goTo(i);
          restart();
        });
      });

      card.addEventListener('mouseenter', stop);
      card.addEventListener('mouseleave', start);
      window.addEventListener('resize', function(){
        slideHeight = slides.length > 1 ? (slides[1].offsetTop - slides[0].offsetTop) : viewport.clientHeight;
        track.style.transition = 'none';
        track.style.transform = 'translateY(' + (-slideHeight * index) + 'px)';
      });

      start();
    });
  })();

  (function(){
    // 상단 3개 고정 배너(일반교과교사 가입 / 진로체험처 가입 / 진로체험지원센터 찾기)를
    // 모바일(≤760px)에서는 한 번에 하나씩, 왼쪽에서 오른쪽으로 넘어가며 보이는 배너로 롤링한다.
    // (공지사항/자료실 롤러와 반대 방향 — 새 배너가 왼쪽에서 들어와 오른쪽으로 빠지도록
    //  실제 카드 순서를 뒤집어 붙이고 translateX를 점점 0에 가깝게 줄여나간다.)
    var viewport = document.getElementById('signupCards');
    var track = document.getElementById('signupTrack');
    var dotsWrap = document.getElementById('signupDots');
    if (!viewport || !track) return;

    var slides = Array.prototype.slice.call(track.children);
    var count = slides.length;
    if (count < 2) return;

    var mq = window.matchMedia('(max-width:760px)');
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var built = false;
    var remaining = count;
    var slideWidth = 0;
    var timer = null;
    var wrapTimeout = null;
    var dots = [];
    var cloneEl = null;

    function buildStrip(){
      // 첫 카드의 복제본을 맨 앞에 붙이고, 실제 카드는 역순으로 재배치한다.
      // 순서: [복제-카드1, 카드3, 카드2, 카드1] → translateX를 0으로 줄여가며 카드1→2→3 순으로 보여주고,
      // 마지막에 0에 도달하면 맨 앞의 복제본(=카드1)이 보여 자연스럽게 처음으로 이어진다.
      cloneEl = slides[0].cloneNode(true);
      track.insertBefore(cloneEl, track.firstChild);
      for (var i = slides.length - 1; i >= 0; i--) {
        track.appendChild(slides[i]);
      }
    }

    function restoreOriginal(){
      // PC 화면으로 돌아갈 때 모바일 롤러용 복제 카드와 재배치된 순서를 원래대로 되돌린다.
      // (이걸 안 하면 카드가 중복으로 남아 PC 화면에 배너가 하나 더 보이게 된다.)
      if (cloneEl && cloneEl.parentNode) { cloneEl.parentNode.removeChild(cloneEl); }
      cloneEl = null;
      slides.forEach(function(s){ track.appendChild(s); });
      built = false;
    }

    function buildDots(){
      if (!dotsWrap || dotsWrap.children.length) return;
      slides.forEach(function(_, i){
        var d = document.createElement('span');
        if (i === 0) d.className = 'on';
        d.setAttribute('role', 'button');
        d.setAttribute('aria-label', (i + 1) + '번째 배너 보기');
        dotsWrap.appendChild(d);
      });
      dots = Array.prototype.slice.call(dotsWrap.children);
      dots.forEach(function(dot, i){
        dot.addEventListener('click', function(){
          goTo(i);
          restart();
        });
      });
    }

    function updateDots(shownIndex){
      dots.forEach(function(d, i){ d.classList.toggle('on', i === shownIndex); });
    }

    function measure(){
      slideWidth = slides[0].getBoundingClientRect().width;
    }

    function place(remainingVal, animate){
      track.style.transition = animate ? 'transform .5s cubic-bezier(.4,0,.2,1)' : 'none';
      track.style.transform = 'translateX(' + (-remainingVal * slideWidth) + 'px)';
    }

    function goNext(){
      remaining--;
      place(remaining, true);
      updateDots(count - remaining);
      if (remaining === 0) {
        wrapTimeout = window.setTimeout(function(){
          remaining = count;
          place(remaining, false);
        }, 520);
      }
    }

    function goTo(target){
      if (wrapTimeout) { window.clearTimeout(wrapTimeout); wrapTimeout = null; }
      remaining = count - target;
      place(remaining, true);
      updateDots(target);
    }

    function start(){
      if (reduceMotion || timer || !mq.matches) return;
      timer = window.setInterval(goNext, 3400);
    }
    function stop(){
      window.clearInterval(timer);
      timer = null;
    }
    function restart(){ stop(); start(); }

    function enable(){
      if (!built) {
        buildStrip();
        buildDots();
        built = true;
      }
      if (wrapTimeout) { window.clearTimeout(wrapTimeout); wrapTimeout = null; }
      measure();
      remaining = count;
      place(remaining, false);
      updateDots(0);
      start();
    }
    function disable(){
      stop();
      if (wrapTimeout) { window.clearTimeout(wrapTimeout); wrapTimeout = null; }
      track.style.transition = 'none';
      track.style.transform = '';
      if (built) {
        restoreOriginal();
      }
    }

    viewport.addEventListener('mouseenter', stop);
    viewport.addEventListener('mouseleave', start);

    function handleChange(){
      if (mq.matches) enable(); else disable();
    }
    handleChange();
    if (mq.addEventListener) mq.addEventListener('change', handleChange);
    else mq.addListener(handleChange);

    window.addEventListener('resize', function(){
      if (mq.matches && built) { measure(); place(remaining, false); }
    });
  })();

  (function(){
    // 모바일 히어로: "체험프로그램 찾기" 버튼을 누르면 AI 검색 팝업(바텀시트)이 뜬다.
    var cta = document.getElementById('heroMobileCta');
    var backdrop = document.getElementById('searchModalBackdrop');
    var modal = document.getElementById('aiSearchModal');
    if (!cta || !backdrop || !modal) return;

    function openModal(){
      backdrop.classList.add('open');
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function closeModals(){
      backdrop.classList.remove('open');
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }

    cta.addEventListener('click', openModal);
    backdrop.addEventListener('click', closeModals);
    document.querySelectorAll('[data-close-modal]').forEach(function(btn){
      btn.addEventListener('click', closeModals);
    });
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape') closeModals();
    });
  })();

  (function(){
    // 데스크톱 히어로 검색창의 'AI검색' 버튼 — PC 화면(760px 초과)에서만 AI 검색 팝업을 연다.
    var btn = document.querySelector('.hero-search .ai-btn');
    var backdrop = document.getElementById('searchModalBackdrop');
    var modal = document.getElementById('aiSearchModal');
    if (!btn || !backdrop || !modal) return;

    btn.addEventListener('click', function(){
      if (window.innerWidth <= 760) return;
      backdrop.classList.add('open');
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  })();

  (function(){
    // PC 검색 모달의 '자주 사용하는 질문' - 클릭 시 검색창에 채우기 / 전체 삭제
    var faqList = document.getElementById('faqList');
    var clearBtn = document.getElementById('faqClearBtn');
    var input = document.getElementById('desktopSearchInput');
    if (!faqList) return;

    faqList.addEventListener('click', function(e){
      var item = e.target.closest('.modal-desktop-faq-item');
      if (!item) return;
      var text = item.querySelector('span');
      if (input && text) {
        input.value = text.textContent;
        input.focus();
      }
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', function(){
        faqList.innerHTML = '';
      });
    }
  })();

  /* ---------- PROGRAM CARDS CAROUSEL ---------- */
  (function(){
    var root = document.getElementById('programCarousel');
    if (!root) return;
    var viewport = document.getElementById('programViewport');
    var track = document.getElementById('programTrack');
    var arrows = root.querySelectorAll('.carousel-arrow');
    var GAP = 16;
    var AUTOPLAY_MS = 4000;

    var originals = Array.prototype.slice.call(track.children);
    var N = originals.length;
    if (!N) return;

    // Build triple-clone track: [clones][originals][clones] for seamless looping.
    function cloneSet(){
      return originals.map(function(card){ return card.cloneNode(true); });
    }
    var before = cloneSet();
    var after = cloneSet();
    var firstOriginal = track.firstChild;
    before.forEach(function(card){
      card.setAttribute('aria-hidden','true');
      track.insertBefore(card, firstOriginal);
    });
    after.forEach(function(card){
      card.setAttribute('aria-hidden','true');
      track.appendChild(card);
    });

    var allCards = Array.prototype.slice.call(track.children);
    var currentIndex = N; // points to first original card
    var cardWidth = 0;
    var visibleCount = 4;
    var animating = false;

    function getVisibleCount(){
      if (window.innerWidth <= 400) return 1;
      if (window.innerWidth <= 760) return 2;
      return 4;
    }

    function layout(withTransition){
      visibleCount = getVisibleCount();
      var vpWidth = viewport.clientWidth;
      cardWidth = (vpWidth - GAP * (visibleCount - 1)) / visibleCount;
      allCards.forEach(function(card){
        card.style.flex = '0 0 ' + cardWidth + 'px';
        card.style.width = cardWidth + 'px';
      });
      moveTo(currentIndex, withTransition);
    }

    function moveTo(index, withTransition){
      track.style.transition = withTransition ? 'transform .45s ease' : 'none';
      track.style.transform = 'translateX(-' + (index * (cardWidth + GAP)) + 'px)';
    }

    function goTo(delta){
      if (animating) return;
      animating = true;
      currentIndex += delta;
      moveTo(currentIndex, true);
      window.setTimeout(function(){
        // seamless snap-back when drifting into the clone bands
        if (currentIndex >= N * 2){
          currentIndex -= N;
          moveTo(currentIndex, false);
        } else if (currentIndex < N){
          currentIndex += N;
          moveTo(currentIndex, false);
        }
        animating = false;
      }, 460);
    }

    arrows.forEach(function(arrow){
      arrow.addEventListener('click', function(){
        var dir = parseInt(arrow.getAttribute('data-dir'), 10) || 1;
        goTo(dir);
        restartAutoplay();
      });
    });

    var autoplayTimer = null;
    function startAutoplay(){
      stopAutoplay();
      autoplayTimer = window.setInterval(function(){ goTo(1); }, AUTOPLAY_MS);
    }
    function stopAutoplay(){
      if (autoplayTimer) window.clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
    function restartAutoplay(){
      startAutoplay();
    }

    root.addEventListener('mouseenter', stopAutoplay);
    root.addEventListener('mouseleave', startAutoplay);

    // Touch swipe (mobile) — drag live, snap to next/prev on release.
    var touchStartX = 0;
    var touchDeltaX = 0;
    var dragging = false;
    var SWIPE_THRESHOLD = 40;

    viewport.addEventListener('touchstart', function(e){
      if (!e.touches || !e.touches.length) return;
      dragging = true;
      touchStartX = e.touches[0].clientX;
      touchDeltaX = 0;
      stopAutoplay();
      track.style.transition = 'none';
    }, { passive: true });

    viewport.addEventListener('touchmove', function(e){
      if (!dragging || !e.touches || !e.touches.length) return;
      touchDeltaX = e.touches[0].clientX - touchStartX;
      var base = -(currentIndex * (cardWidth + GAP));
      track.style.transform = 'translateX(' + (base + touchDeltaX) + 'px)';
    }, { passive: true });

    viewport.addEventListener('touchend', function(){
      if (!dragging) return;
      dragging = false;
      if (touchDeltaX <= -SWIPE_THRESHOLD){
        goTo(1);
      } else if (touchDeltaX >= SWIPE_THRESHOLD){
        goTo(-1);
      } else {
        moveTo(currentIndex, true);
      }
      touchDeltaX = 0;
      startAutoplay();
    });

    var resizeTimer = null;
    window.addEventListener('resize', function(){
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function(){ layout(false); }, 150);
    });

    layout(false);
    startAutoplay();
  })();

  /* ---------- QUICK MENU PANEL (주요메뉴 보기) ---------- */
  (function(){
    var trigger = document.getElementById('quickMenuBtn');
    var panel = document.getElementById('quickMenuPanel');
    var closeBtn = document.getElementById('quickMenuCloseBtn');
    if (!trigger || !panel) return;

    function openPanel(){
      panel.classList.add('open');
      trigger.setAttribute('aria-expanded', 'true');
      trigger.style.display = 'none';
    }
    function closePanel(){
      panel.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
      trigger.style.display = '';
    }

    // 클릭(또는 키보드 Enter/Space)으로만 열리고, 닫기 버튼을 눌러야만 닫힌다.
    // 마우스가 벗어나거나 패널 바깥을 클릭해도 절대 자동으로 닫히지 않는다.
    trigger.addEventListener('click', openPanel);
    trigger.addEventListener('keydown', function(e){
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openPanel();
      }
    });
    if (closeBtn) closeBtn.addEventListener('click', closePanel);
  })();
