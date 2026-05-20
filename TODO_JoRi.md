# 요리조리 JoRi 브랜치 — 다음 작업 목록

> 브랜치: `JoRi`

---

## 1. 영양 화면 날짜 선택 달력 (NutritionScreen.js)

### 목표
- 날짜 표시 영역("오늘" / 날짜 텍스트) 탭 시 달력 팝업
- 원하는 날짜 선택 → 해당 날짜 영양 기록 조회

### 구현 포인트
- 현재 `Pressable` (`dateLabelText`)을 탭하면 `setSelectedDate(new Date())`로 오늘로 돌아가는 동작을 달력 오픈으로 변경
- 달력 라이브러리 후보: `react-native-calendars` (expo 호환, 한국어 지원)
- 선택 날짜 → `setSelectedDate()` 적용 → 기존 날짜 이동 로직(◀ ▶)과 연동
- 모달 형태로 표시 (바텀시트 또는 센터 팝업)

### 설치 필요
```
npx expo install react-native-calendars
```

---
