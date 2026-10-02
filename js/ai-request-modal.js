/* ===================================================================
   ai-request-modal.js — AI 맞춤형 프로그램 요청 모달 인터랙션
   모달 열기/닫기는 main.js 의 AI 검색 팝업(.modal-backdrop,
   data-open-modal/data-close-modal)과 동일한 패턴을 사용한다.
   지역 시/도 ↔ 시/군/구 연동, 대면 구분 세그먼트 토글, 키워드 태그
   추가/삭제(최대 3개), 제출 시 폼 데이터 수집까지 클라이언트에서
   전부 처리하는 목업이며 실제 API 호출은 하지 않는다.
   =================================================================== */

document.addEventListener('DOMContentLoaded', function () {

  (function () {
    var openBtn = document.getElementById('areqOpenBtn');
    var backdrop = document.getElementById('aiReqBackdrop');
    var modal = document.getElementById('aiReqModal');
    if (!backdrop || !modal) return;

    function openModal() {
      backdrop.classList.add('open');
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function closeModal() {
      backdrop.classList.remove('open');
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }

    if (openBtn) openBtn.addEventListener('click', openModal);
    backdrop.addEventListener('click', closeModal);
    modal.querySelectorAll('[data-close-modal]').forEach(function (btn) {
      btn.addEventListener('click', closeModal);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
    });

    // ---------- 지역: 시/도 ↔ 시/군/구 연동 ----------
    var REGION_DATA = {
      '서울특별시': ['중구', '강남구', '마포구', '종로구', '영등포구'],
      '부산광역시': ['해운대구', '강서구', '부산진구', '동래구', '사하구'],
      '경기도': ['포천시', '수원시', '성남시', '고양시', '용인시'],
      '인천광역시': ['연수구', '남동구', '부평구', '미추홀구'],
      '대구광역시': ['수성구', '중구', '달서구'],
      '광주광역시': ['서구', '북구', '광산구'],
      '대전광역시': ['유성구', '서구', '중구'],
      '강원특별자치도': ['춘천시', '원주시', '강릉시']
    };

    var sidoSelect = document.getElementById('aiReqSido');
    var sigunguSelect = document.getElementById('aiReqSigungu');

    function fillOptions(select, list) {
      select.innerHTML = '';
      list.forEach(function (label) {
        var opt = document.createElement('option');
        opt.value = label;
        opt.textContent = label;
        select.appendChild(opt);
      });
    }

    function refreshSigungu() {
      var list = REGION_DATA[sidoSelect.value] || [];
      fillOptions(sigunguSelect, list);
    }

    if (sidoSelect && sigunguSelect) {
      fillOptions(sidoSelect, Object.keys(REGION_DATA));
      sidoSelect.value = '경기도';
      refreshSigungu();
      sigunguSelect.value = '포천시';
      sidoSelect.addEventListener('change', refreshSigungu);
    }

    // ---------- 대면 구분: 세그먼트 토글 ----------
    var onoffGroup = document.getElementById('aiReqOnoff');
    if (onoffGroup) {
      onoffGroup.querySelectorAll('.ai-req-seg-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          onoffGroup.querySelectorAll('.ai-req-seg-btn').forEach(function (b) {
            b.classList.remove('active');
            b.setAttribute('aria-checked', 'false');
          });
          btn.classList.add('active');
          btn.setAttribute('aria-checked', 'true');
        });
      });
    }

    // ---------- 키워드(태그): 입력 후 Enter로 추가, 최대 3개 ----------
    var TAG_LIMIT = 3;
    var tagInput = document.getElementById('aiReqTagInput');
    var tagsBox = document.getElementById('aiReqTags');
    var tags = [];

    function renderTags() {
      tagsBox.innerHTML = '';
      tags.forEach(function (tag, idx) {
        var chip = document.createElement('span');
        chip.className = 'ai-req-tag-chip';
        chip.innerHTML = '#' + escapeHtml(tag) + ' <button type="button" class="ai-req-tag-remove" aria-label="' + escapeHtml(tag) + ' 삭제">✕</button>';
        chip.querySelector('.ai-req-tag-remove').addEventListener('click', function () {
          tags.splice(idx, 1);
          renderTags();
        });
        tagsBox.appendChild(chip);
      });
      var atLimit = tags.length >= TAG_LIMIT;
      tagInput.disabled = atLimit;
      tagInput.placeholder = atLimit ? '최대 3개까지 입력할 수 있어요' : '태그 입력 후 Enter';
    }

    function escapeHtml(str) {
      var div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }

    if (tagInput && tagsBox) {
      tagInput.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        var value = tagInput.value.trim().replace(/^#/, '');
        if (!value || tags.length >= TAG_LIMIT) return;
        if (tags.indexOf(value) === -1) tags.push(value);
        tagInput.value = '';
        renderTags();
      });
    }

    // ---------- 폼 제출 (실제 API 호출 없는 목업) ----------
    var form = document.getElementById('aiReqForm');
    var submitBtn = document.getElementById('aiReqSubmitBtn');

    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var query = document.getElementById('aiReqQuery').value.trim();
        if (!query) {
          document.getElementById('aiReqQuery').focus();
          return;
        }

        var payload = {
          query: query,
          region: [sidoSelect ? sidoSelect.value : null, sigunguSelect ? sigunguSelect.value : null],
          onsite: onoffGroup ? onoffGroup.querySelector('.active').dataset.value : null,
          experienceDate: document.getElementById('aiReqDate').value || null,
          matchRange: [
            document.getElementById('aiReqRangeStart').value || null,
            document.getElementById('aiReqRangeEnd').value || null
          ],
          tags: tags.slice()
        };

        // 실제 서비스 연동 시 이 부분을 서버로의 요청 생성 API 호출로 교체하면 됩니다.
        console.log('[AI 맞춤형 프로그램 요청] 제출 데이터:', payload);

        var originalLabel = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '요청이 접수됐어요 ✓';
        setTimeout(function () {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalLabel;
          closeModal();
        }, 900);
      });
    }

    renderTags();
  })();

});
