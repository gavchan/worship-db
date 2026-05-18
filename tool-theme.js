document.addEventListener('DOMContentLoaded',()=>{
  if(document.querySelector('.tool-top')) return;
  const current=location.pathname.split('/').pop()||'';
  const isChoir=current.includes('choir');
  const header=document.createElement('header');
  header.className='tool-top';
  header.innerHTML=`
    <a class="tool-brand" href="${isChoir?'test-choir.html':'test-main.html'}">${isChoir?'성가대 자료실':'드림찬양단'}</a>
    <nav class="tool-nav" aria-label="도구 이동">
      <a href="test-main.html">찬양단 홈</a>
      <a href="test-conti.html">찬양콘티</a>
      <a href="test-songs.html">찬양곡</a>
      <a href="test-tools.html">관리도구</a>
      <a href="test-choir.html">성가대</a>
      <a href="index.html">통합 홈</a>
    </nav>`;
  document.body.prepend(header);
});
