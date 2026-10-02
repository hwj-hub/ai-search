/* ===================================================================
   program-request-detail.js — 맞춤형 프로그램 요청 상세 모달 열기/닫기
   main.js 의 AI 검색 팝업(.modal-backdrop, data-open-modal/data-close-modal)
   과 동일한 패턴을 사용한다. 여러 모달이 backdrop 을 공유해도 동작하도록
   버튼에 연결된 모달만 열고 닫는다.
   =================================================================== */

document.addEventListener('DOMContentLoaded', function () {

  (function () {
    var openBtn = document.getElementById('prOpenBtn');
    var backdrop = document.getElementById('prDetailBackdrop');
    var modal = document.getElementById('prDetailModal');
    if (!openBtn || !backdrop || !modal) return;

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

    openBtn.addEventListener('click', openModal);
    backdrop.addEventListener('click', closeModal);
    modal.querySelectorAll('[data-close-modal]').forEach(function (btn) {
      btn.addEventListener('click', closeModal);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
    });

    // 실서비스 연동 예시:
    // 신청 내역 관리 목록의 "상세보기" 버튼(또는 행)에 data-open-modal="prDetailModal" 과
    // 요청 데이터(req id 등)를 data-* 속성으로 실어 보내면, 여기서 fetch 후
    // .pr-info-grid / .pr-tag-list / .pr-content-box 내용을 그 데이터로 채워 넣으면 됩니다.
  })();

});
