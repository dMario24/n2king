# N2King — 노베이스에서 JLPT N2까지 59일

2026-10-08 → **2026-12-06 JLPT N2** 합격을 목표로 하는 개인 학습 웹앱.
모바일(짜투리 3분 복습, 홈 화면 설치)과 데스크톱(25~50분 집중 세션, 키보드 단축키)을 모두 지원한다.

## 기능

| 영역 | 내용 |
|---|---|
| 홈 | D-day, 이번 주 테마, **오늘 할 일**(복습 → 신규 → 퀴즈 → 독해/청해/모의고사), 연속 학습, 숙련도 |
| 학습 | 가나 50음도(발음), 어휘 1,697 · 한자 500 · 문법 179 목록/검색/상세, **오늘의 신규 학습** 세션 |
| 복습 | SM-2 변형 간격 반복(SRS). 4단계 평가, 간격 미리보기, 되돌리기, 시험일 캡 |
| 퀴즈 | 가나·어휘 뜻/읽기·한자 읽기/뜻·문법 빈칸·청해 7종 + **오답 재시험** |
| 독해/청해 | 지문 12편, TTS 청해 20개 (Web Speech API, 오디오 파일 없음) |
| 모의고사 | 3회분 × 48문항, 섹션별 제한 시간, 결과 저장·복기 |
| 플랜 | 9주 로드맵, 주차별 진행률, 뒤처짐 자동 재분배 |
| 집중 세션 | 25/50분 타이머, 페이지 이동해도 유지되는 배지 |
| 오답노트 · 통계 · 설정 | 자동 수집 오답, 28일 통계, 강도/TTS/백업(JSON 내보내기·가져오기) |

학습 기록은 **브라우저 IndexedDB** 에만 저장된다(로그인 없음). 기기 간 이동은 설정 → 내보내기/가져오기.

## 59일 커리큘럼

| 주 | 기간 | 테마 |
|---|---|---|
| 1 | 10/08–10/14 | 가나 완성 + 기초 문법 시동 |
| 2 | 10/15–10/21 | N5–N4 압축 I: 활용의 뼈대 |
| 3 | 10/22–10/28 | N4–N3 압축 II: 복문과 태 |
| 4 | 10/29–11/04 | N2 문법 I + 어휘 가속 |
| 5 | 11/05–11/11 | N2 문법 II + 독해 |
| 6 | 11/12–11/18 | N2 문법 III + 청해 |
| 7 | 11/19–11/25 | 통합 복습 + 약점 집중 (신규 마감) |
| 8 | 11/26–12/02 | 모의고사 주간 |
| 9 | 12/03–12/06 | 마무리 |

세부는 `data/curriculum.ts`. 설정의 학습 강도(가볍게/보통/빡세게)로 일일 신규량이 ±30% 조정된다.

## 개발

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # 모든 라우트가 ○ Static 이어야 한다
npm test           # vitest: SRS·플랜·퀴즈·콘텐츠 무결성
npm run validate   # 콘텐츠 데이터만 검사
npm run lint && npm run typecheck
```

- Next.js 16 (Cache Components, Turbopack), React 19.3, Tailwind v4, Dexie(IndexedDB), vitest.
- 모든 페이지는 정적 셸 + `"use client"` 아일랜드. 브라우저 전용 상태는 `<ClientOnly>`(`use(browser())`) 아래에서 읽는다.
- 배포: Vercel 에 그대로 올리면 된다. 서비스 워커는 프로덕션에서만 등록된다.

## 콘텐츠 추가

`data/<type>/` 에 파일을 만들고 `index.ts` 의 배열에 spread 로 합친다. 스키마는 `lib/content/types.ts`,
검증은 `npm run validate` (id 유일성, 읽기 문자 종류, 문항 정답 범위, 어휘 중복 등).
어휘 파일 간 중복은 `node --experimental-strip-types scripts/dedupe-vocab.mjs` 로 정리한다.

## 디렉터리

```
app/            라우트 (page.tsx 는 정적 셸)
components/     shell(네비·테마) · dashboard · learn · review · quiz · reading · listening · mock · plan · focus · settings · stats · ui
lib/            srs.ts(SRS) · plan.ts(플랜 생성) · quiz.ts(문항 생성) · db.ts(Dexie) · db-hooks.ts · tts.ts · focus.ts · content/
data/           kana · vocab · kanji · grammar · reading · listening · mock · curriculum.ts
tests/          vitest
```
