Worship DB Phase7 Integrated Runtime

기준:
- phase7 4-1 데이터 뼈대
- phase7 4-2 연주엔진 안정화
- phase7 4-3 viewerFrame / 유튜브 / 공유 보강
- phase7 4-4 관리도구 / 일괄관리 / 순차편집기 정리

적용 전 권장:
1. 기존 배포본 백업
2. 압축 해제 후 루트 파일 그대로 업로드
3. Supabase 사용 시 worship_db_phase7_4_1_schema.sql 먼저 검토 후 적용

주의:
- keys, bpm_min, bpm_max, bpm_label 등 신규 필드는 SQL 적용 후 완전 활성화됩니다.
- 기존 저장값은 key/bpm fallback으로 읽도록 설계되었습니다.
- fullscreen, swipe, youtube, cache는 안정화 레이어 방식으로 보강되었습니다.
