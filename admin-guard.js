(function () {
  const PASS = '1955';
  const PC_KEY = 'worshipToolsUnlocked';
  const MOBILE_KEY = 'worshipMobileToolsUnlocked';

  function unlocked() {
    try {
      return sessionStorage.getItem(PC_KEY) === '1' || sessionStorage.getItem(MOBILE_KEY) === '1';
    } catch (_) {
      return false;
    }
  }

  function unlock() {
    try {
      sessionStorage.setItem(PC_KEY, '1');
      sessionStorage.setItem(MOBILE_KEY, '1');
    } catch (_) {}
  }

  if (unlocked()) return;

  const value = window.prompt('관리도구 비밀번호를 입력해주세요.');
  if (String(value || '').trim() === PASS) {
    unlock();
    return;
  }

  alert('비밀번호가 올바르지 않습니다. 통합 홈으로 돌아갑니다.');
  location.replace('index.html');
})();
