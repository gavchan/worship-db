# Worship DB 최종 악보 업로드 규칙

## 핵심

Supabase Storage 저장명에는 한글을 넣지 않습니다.  
Supabase Storage에서 한글 object key가 `InvalidKey` 오류를 낼 수 있기 때문입니다.

## Storage 실제 구조

```text
scores/
  곡ID/
    곡ID_Key_code_1.png
    곡ID_Key_code_2.png
```

예:

```text
scores/
  31feba3c-c47d-439a-9aef-5bbf181e9f42/
    31feba3c-c47d-439a-9aef-5bbf181e9f42_A_code_1.png
    31feba3c-c47d-439a-9aef-5bbf181e9f42_A_code_2.png
```

## 화면 표시명

화면에서는 기존 규칙처럼 이해하기 쉽게 표시할 수 있습니다.

```text
가서제자삼으라_A_코드_1.png
```

## 안정화 처리

- Storage 실제 파일명은 ASCII만 사용합니다.
- 곡 연결은 상위 폴더 `곡ID/`로 보장합니다.
- Key와 페이지 번호는 파일명에 유지합니다.
- 같은 곡, 같은 Key, 같은 페이지를 다시 올리면 덮어씁니다.
- 다시 들어올 때 Storage 실제 파일을 조회합니다.
- 파일이 있으면 `has_score=true`로 자동 보정합니다.
