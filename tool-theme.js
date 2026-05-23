document.addEventListener('DOMContentLoaded',()=>{
  if(document.querySelector('.tool-top')) return;
  const current=location.pathname.split('/').pop()||'';
  const isChoir=current.includes('choir');
  const main=document.createElement('main');
  main.className='tool-main';
  [...document.body.children].forEach(node=>{
    if(node.tagName==='SCRIPT') return;
    main.appendChild(node);
  });
  const header=document.createElement('header');
  header.className='tool-top';
  header.innerHTML=`
    <a class="tool-brand" href="${isChoir?'test-choir.html':'index.html'}">${isChoir?'성가대 자료실':'드림찬양단'}</a>
    <nav class="tool-nav" aria-label="도구 이동">
      <a href="index.html">통합 홈</a>
      <a href="test-conti.html">찬양콘티</a>
      <a href="song-search.html">곡별 검색</a>
      <a href="test-songs.html">세부검색</a>
      <a href="test-tools.html">관리도구</a>
      <a href="test-choir.html">성가대</a>
    </nav>`;
  document.body.prepend(header);
  document.body.append(main);
});
