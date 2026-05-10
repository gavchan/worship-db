Worship DB Phase7 4-3 - viewerFrame / YouTube / 공유 안정화

적용 범위
1. PC 오른쪽 viewerFrame을 악보 프레임 기준으로 고정
2. PC 유튜브 재생을 내부 iframe으로 통일
3. 모바일 확장 카드 viewerFrame 크기 안정화
4. 모바일 유튜브 닫기 시 iframe src 제거
5. 공유 링크 fallback에서 새창 열기 제거, 복사/공유 우선
6. share.html은 콘티 저장 override 값을 우선 사용하고 원본 DB는 fallback으로 사용
7. 공유 페이지에 읽기 전용/콘티 저장값 표시 보강

건드리지 않은 것
- 4-2 연주엔진 performanceSetlist 기본 구조
- 스와이프 엔진 핵심 이동 로직
- 관리도구/일괄관리/순차편집기
- Supabase 테이블 실제 마이그레이션

주의
- 유튜브 임베드 제한이 있는 영상은 내부 iframe에서도 재생되지 않을 수 있습니다.
- share.html의 콘티 override는 현재 브라우저 localStorage 기반 fallback 값이 있을 때 우선 적용됩니다.
