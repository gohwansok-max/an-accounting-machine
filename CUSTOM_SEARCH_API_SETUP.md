# 🔍 Custom Search API 설정 완벽 가이드

> **이 문서는 공식 자료 검색 기능을 사용하기 위해 필요한 두 가지 키를 구하는 방법을 설명합니다.**

---

## 📋 필요한 것 (2가지)

| 항목 | 이름 | 형태 | 설명 |
|-----|------|------|------|
| **1번** | Custom Search Engine ID | `cx ID` (숫자:숫자 형태) | 검색 범위를 지정하는 ID |
| **2번** | Custom Search API 키 | `skey...` (긴 문자열) | 검색을 실행하는 API 키 |

**둘 다 필요합니다!** 하나만 있으면 작동하지 않습니다.

---

## 🎯 Part 1: Custom Search Engine ID (cx ID) 구하기

### **Step 1: Google Custom Search 공식 사이트 접속**

```
👉 링크: https://programmablesearchengine.google.com
```

1️⃣ 위 링크를 브라우저에 붙여넣고 엔터
2️⃣ Google 계정으로 로그인 (Gmail 이메일 사용)

---

### **Step 2: 새 검색 엔진 생성**

**화면 첫 로드 시:**
```
┌─────────────────────────────────────┐
│  "Create" 버튼 클릭                 │
│  (파란색 버튼, 좌상단)               │
└─────────────────────────────────────┘
```

**또는 이전에 생성했으면:**
```
좌측 메뉴 → "Create a new search engine" 클릭
```

---

### **Step 3: 설정 1 - 검색할 사이트 선택**

**"What sites would you like to search?" 섹션:**

```
✅ 추천 방법 (가장 쉬움):
   "Search the entire web" 선택
   
   또는
   
❌ 특정 사이트만 (고급):
   사이트 URL 입력 (예: postalservice.go.kr)
```

**💡 이 프로젝트는 "Search the entire web" 추천!**

---

### **Step 4: 설정 2 - 검색 엔진 이름 입력**

```
이름: "우정사업 기출문제" 또는 "계리직 공무원 자료"
(마음대로 지어도 됨)
```

---

### **Step 5: "Create" 버튼 클릭**

검색 엔진이 자동으로 생성됩니다!

---

### **Step 6: cx ID 복사**

**생성 완료 후 화면:**

```
┌────────────────────────────────────────────┐
│  ✅ Congratulations!                       │
│                                            │
│  Your search engine has been created.      │
│                                            │
│  Search engine ID: 17c68f5a1234567890:xyzabc │
│                          ↑ 이거! ↑         │
│                 (클릭해서 복사)              │
└────────────────────────────────────────────┘
```

**또는 대시보드에서:**

```
좌측 메뉴에서 생성한 검색 엔진 이름 클릭
→ "Setup" 탭
→ "Search engine ID" 항목에서 복사
```

**복사한 ID 저장:**
```
📝 예시: 17c68f5a1234567890:xyzabc

이 ID를 어딘가에 메모장에 저장해두세요!
```

---

## 🔑 Part 2: Custom Search API 키 구하기

### **Step 1: Google Cloud Console 접속**

```
👉 링크: https://console.cloud.google.com
```

1️⃣ 위 링크를 브라우저에 붙여넣고 엔터
2️⃣ Google 계정으로 로그인

---

### **Step 2: 프로젝트 선택 또는 생성**

**상단 왼쪽 프로젝트 이름 옆 드롭다운:**

```
┌─────────────────────┐
│ 프로젝트 이름      │ ← 클릭
└─────────────────────┘
    ↓
┌─────────────────────┐
│ 프로젝트 선택창    │
│ ─────────────────  │
│ 기존 프로젝트들     │
│ ─────────────────  │
│ + 새 프로젝트 만들기│ ← 클릭 (첫 사용)
└─────────────────────┘
```

**새 프로젝트 만들기를 선택하면:**

```
프로젝트 이름: "계리패스 API" 또는 마음대로
프로젝트 ID: 자동 생성됨 (건드리지 않아도 됨)
```

---

### **Step 3: APIs & Services 검색**

**상단 검색창 또는 좌측 메뉴:**

```
검색창에 "APIs & Services" 입력
→ 첫 번째 결과 클릭
```

**또는 좌측 메뉴:**
```
☰ (햄버거 메뉴) 클릭
→ "APIs & Services" 클릭
```

---

### **Step 4: Custom Search API 활성화**

**"APIs & Services" 페이지에서:**

```
1️⃣ "+ ENABLE APIS AND SERVICES" 버튼 클릭
   (상단 파란색 버튼)

2️⃣ "Custom Search API" 검색
   └─ 검색창에 "custom search" 입력

3️⃣ 첫 번째 결과 클릭
   "Custom Search API" (공식 Google 아이콘)

4️⃣ "ENABLE" 버튼 클릭
   (파란색 버튼)
```

---

### **Step 5: API 키 생성**

**Custom Search API 활성화 후:**

```
"Create Credentials" 또는 화면 안내 따르기
```

**또는 좌측 메뉴에서:**

```
☰ → "APIs & Services" → "Credentials"
```

**Credentials 페이지:**

```
┌──────────────────────────────────────┐
│  + CREATE CREDENTIALS                │ ← 클릭
│  (상단 파란색 버튼)                    │
└──────────────────────────────────────┘
    ↓
┌──────────────────────────────────────┐
│  드롭다운 메뉴:                       │
│  ├─ API Key                 ← 선택!   │
│  ├─ OAuth client ID                  │
│  └─ Service account                  │
└──────────────────────────────────────┘
```

**"API Key" 선택**

---

### **Step 6: API 키 복사**

**생성 완료 후:**

```
┌──────────────────────────────────────────┐
│  ✅ API key created                     │
│                                          │
│  AIza123456789abcdefghijklmnopqrstuv     │
│         ↑ 이거! ↑ (복사 버튼 있음)        │
│                                          │
│  "Copy" 또는 클립보드 아이콘 클릭         │
└──────────────────────────────────────────┘
```

**복사한 키 저장:**
```
📝 예시: AIzaSyD123456789abcdefghijklmnopqr

이 키를 어딘가에 메모장에 저장해두세요!
```

---

## ✅ 최종 확인

### **이제 2가지가 있어야 합니다:**

```
✓ Custom Search Engine ID (cx ID)
  형태: 17c68f5a1234567890:xyzabc
  
✓ Custom Search API 키 (skey)
  형태: AIzaSyD123456789abcdefghijklmnopqr
```

---

## 🎯 계리패스 AI 앱에 입력하기

### **Step 1: 앱 열기**
```
index.html을 웹 브라우저로 실행
```

### **Step 2: ⚙️ 설정 클릭**
```
앱 우상단의 ⚙️ (톱니 모양) 버튼 클릭
```

### **Step 3: 두 키 입력**

**설정 패널에서:**

```
1️⃣ "Google Custom Search API 키" 입력란
   └─ AIza...로 시작하는 키 붙여넣기

2️⃣ "Google Search Engine ID" 입력란
   └─ :xyzabc로 끝나는 ID 붙여넣기
```

### **Step 4: 💾 저장하기**
```
하단 "💾 저장하기" 버튼 클릭
```

### **Step 5: 테스트**
```
✅ "계리직 공무원" 탭 클릭
✅ 📄 자료 입력 클릭
✅ 🔍 공식 자료 검색 탭
✅ "🔍 검색하기" 클릭
→ 검색 결과가 나오면 성공! 🎉
```

---

## 🐛 트러블슈팅

### ❓ "API 활성화 안 됨" 오류

```
해결책:
1. 프로젝트가 올바르게 선택되었나?
   (상단 프로젝트 이름 확인)
   
2. Custom Search API 정말 활성화되었나?
   → 다시 한 번 ENABLE 클릭
   
3. 잠깐 기다려보기 (1-2분)
   → API가 활성화되는데 시간 걸림
```

### ❓ "403 Forbidden" 또는 "Quota 초과" 오류

```
⚠️ 무료 한도 초과

해결책:
• Free tier 한도: 일일 100회 요청 (충분함!)
• 24시간 후 자동으로 리셋됨
• 시간을 두고 다시 시도

💡 또는 결제 정보 추가하면 한도 증가
(신용카드 정보만 등록, 자동 청구 아님)
```

### ❓ "cx ID를 찾을 수 없음"

```
프로그래매블 서치 다시 확인:
1. https://programmablesearchengine.google.com
2. 생성한 검색 엔진 목록에서 찾기
3. 클릭 → Setup → Search engine ID
```

---

## 📝 정리

| 항목 | 어디서 | 형태 |
|-----|--------|------|
| **cx ID** | https://programmablesearchengine.google.com | `17c68f5a:xyzabc` |
| **API 키** | https://console.cloud.google.com | `AIzaSy...` |

**둘 다 Free tier (무료)**로 충분합니다!

---

## ✨ 최종 팁

```
💡 메모장에 이렇게 정리해두세요:

프로젝트: 계리패스 AI

1. Custom Search Engine ID (cx)
   17c68f5a1234567890:xyzabc
   
2. Custom Search API 키 (skey)
   AIzaSyD123456789abcdefghijklmnopqr
   
3. 생성일: 2024년 6월 25일
4. 상태: ✅ 활성화됨

→ 나중에 찾기 쉬워요!
```

---

**모든 설정이 완료되면, 앱에서 "🔍 공식 자료 검색" 기능을 사용할 수 있습니다!**

🎓 계리직 공무원 합격, 화이팅! 💪
