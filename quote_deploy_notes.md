# 견적서 `/quote` 배포 메모

## 1. Supabase 테이블 만들기

Supabase 프로젝트에서 SQL Editor를 열고 `supabase_estimates_schema.sql` 내용을 실행합니다.

## 2. Vercel 프로젝트에 파일 넣기

`worship-db-sable` 원본 프로젝트에서 아래 위치로 파일을 넣습니다.

```text
public/quote/index.html
```

이렇게 배포하면 아래 주소로 접속할 수 있습니다.

```text
https://worship-db-sable.vercel.app/quote/
```

## 3. 첫 접속 후 연결

`/quote` 화면의 Supabase 연결 칸에 프로젝트 URL과 anon key를 넣습니다.

Supabase 위치:

```text
Project Settings > API > Project URL
Project Settings > API > Project API keys > anon public
```

한 번 입력하면 같은 브라우저에 저장됩니다.

## 4. 현재 구현

- 견적 입력
- 품목DB 저장
- 공급자 정보 저장
- Supabase `estimates` 테이블에 저장/불러오기
- 엑셀 `.xls` 다운로드
- CSV 다운로드
- 인쇄
