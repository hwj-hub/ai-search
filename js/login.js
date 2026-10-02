// ===================================================================
// login.js — 로그인 상태 전용 동작 (계정 드롭다운, 세션 타이머).
// index_login.html 전용 — header.js / main.js 로드 후 불러온다.
// ===================================================================

  /* ---------- 로그인 계정 드롭다운 ---------- */
  (function(){
    var wrap = document.getElementById('acctWrap');
    var btn = document.getElementById('acctBtn');
    var dropdown = document.getElementById('acctDropdown');
    if (!wrap || !btn || !dropdown) return;

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
  })();

  /* ---------- 로그인 세션 타이머(연장) ---------- */
  (function(){
    var desktopEl = document.getElementById('acctTimerDesktop');
    var mobileEl = document.getElementById('acctTimerMobile');
    var extendDesktop = document.getElementById('acctExtendDesktop');
    var extendMobile = document.getElementById('acctExtendMobile');
    if (!desktopEl && !mobileEl) return;

    var SESSION_SECONDS = 30 * 60;
    var remaining = SESSION_SECONDS;
    var timerId = null;

    function render(){
      var m = Math.floor(remaining / 60);
      var s = remaining % 60;
      var text = m + ':' + (s < 10 ? '0' + s : s);
      if (desktopEl) desktopEl.textContent = text;
      if (mobileEl) mobileEl.textContent = text;
    }

    function tick(){
      remaining = Math.max(0, remaining - 1);
      render();
      if (remaining <= 0 && timerId) {
        window.clearInterval(timerId);
        timerId = null;
      }
    }

    function extend(){
      remaining = SESSION_SECONDS;
      render();
      if (!timerId) timerId = window.setInterval(tick, 1000);
    }

    render();
    timerId = window.setInterval(tick, 1000);

    if (extendDesktop) extendDesktop.addEventListener('click', extend);
    if (extendMobile) extendMobile.addEventListener('click', extend);
  })();
