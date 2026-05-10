Worship DB Phase7 4-1: 데이터 뼈대 안정화 패치

작업 목적
- 곡 원본 DB와 콘티 전용 수정값을 분리하기 위한 1차 데이터 레이어 추가
- 기존 DB 컬럼이 없어도 기존 방식으로 저장되는 fallback 유지
- 원본 DB 수정/삭제 시 사용자 확인 강화
- 삭제는 완전삭제가 아니라 보관함 이동(status=archived) 우선
- 멀티 Key/BPM helper 추가
- 콘티 추가 시 setlist item override 초깃값을 localStorage에 안전 저장

변경 파일
- pc.html
- mobile.html
- worship_db_phase7_4_1_schema.sql

아직 하지 않은 것
- 실제 Supabase setlist_items 테이블 연동 저장 전환
- score_versions / score_pages 실제 테이블 기반 악보 렌더링
- 4-2 연주엔진 performanceSetlist/swipe/cache/state 작업
- 4-3 viewerFrame/유튜브/공유 화면 통합 작업
- 4-4 일괄관리/순차편집기 전체 개편

주의
- 이번 차수는 기존 데이터를 지우지 않습니다.
- setlist override는 우선 localStorage fallback으로 저장됩니다.
- SQL은 다음 단계에서 서버 DB 구조를 맞출 때 실행할 수 있도록 준비한 파일입니다.
