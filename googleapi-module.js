/**
 * 계리패스 AI — Google API 통합 모듈
 * Gemini 3.5 Flash/Pro, Custom Search API 활용
 * 2024년 이후 최신 데이터 필터링
 */

class GoogleAPIManager {
  constructor() {
    this.gkey = localStorage.getItem('gkey');
    this.skey = localStorage.getItem('skey');
    this.cxid = localStorage.getItem('cxid');
    this.model = localStorage.getItem('gmodel') || 'gemini-3.5-flash';
  }

  /**
   * Gemini API로 문제 생성 (고급)
   * @param {string} subject - 과목 (postal, savings, insurance, computer)
   * @param {string} difficulty - 난이도 (기본, 실전, 심화)
   * @param {string} context - 추가 컨텍스트 (선택사항)
   * @returns {Promise<Array>} 생성된 문제 배열
   */
  async generateQuestions(subject, difficulty, context = '') {
    if (!this.gkey) throw new Error('Gemini API 키가 필요합니다');

    const subjectNames = {
      postal: '우편일반',
      savings: '예금일반',
      insurance: '보험일반',
      computer: '컴퓨터일반'
    };

    const subName = subjectNames[subject] || subject;
    const diffDescription = {
      기본: '핵심 개념·기초 이해도 평가 (정답률 80% 목표)',
      실전: '실제 계리직 시험과 동일한 체감 난이도 (정답률 60% 목표)',
      심화: '고득점 변별용 복합 사고·함정 다수 (정답률 40% 목표)'
    }[difficulty] || difficulty;

    const prompt = `당신은 대한민국 우정사업본부 계리직 공무원 시험의 ${subName} 과목 수석 출제위원입니다.
최근 3개년(2022~2024) 계리직 기출 경향을 완벽히 분석하여, 수험생이 실제 시험장에서 마주칠 문제를 그대로 재현합니다.

【 출제 조건 】
- 과목: ${subName}
- 난이도: ${diffDescription}
- 개수: 정확히 20개의 4지선다 객관식
- 형식: 반드시 순수 JSON 배열로만 출력 (마크다운/설명 금지)
${context ? `- 추가 반영: ${context}` : ''}

【 합격 제조 출제 지침 (반드시 준수) 】
1. 최근 3개년 출제 빈도가 높은 핵심 테마를 우선 출제한다.
2. 각 문제에는 수험생이 자주 속는 '함정 선지'를 최소 1개 포함한다 (예: 숫자·기한·예외규정 미세 변형, 비슷한 용어 혼동).
3. 정답은 유일하고 명확해야 하며, 오답도 그럴듯해야 한다 (찍기 방지).
4. 2024년 기준 최신 개정 법령·요율·정책만 반영하고, 폐지·구버전 규정은 절대 쓰지 않는다.
5. 정답 위치(answer 인덱스)를 0~3에 고르게 분산시킨다 (한쪽 쏠림 금지).
6. explanation에는 ① 정답인 이유 ② 대표 오답(함정)이 왜 틀렸는지 ③ 시험장 암기 팁을 모두 포함한다.

【 JSON 포맷 】
[
  {
    "question": "문제 지문",
    "options": ["① 선지", "② 선지", "③ 선지", "④ 선지"],
    "answer": 1,
    "explanation": "정답 ②가 맞는 이유 / ①은 ~때문에 함정 / 암기팁: ~"
  }
]

지금 바로 20개 JSON 배열만 출력하세요. 다른 말은 절대 추가하지 마세요.`;

    try {
      const content = await this._generate(prompt, { temperature: 0.8, topK: 40, topP: 0.9, responseMimeType: 'application/json' });
      if (!content) throw new Error('응답이 비어있습니다');
      return this._parseJSON(content);
    } catch (error) {
      console.error('Gemini 문제 생성 실패:', error);
      throw error;
    }
  }

  /**
   * Gemini 호출 (모델 자동 폴백) — 선택 모델이 404/400이면 안정 모델로 재시도
   * @private
   */
  async _generate(prompt, genConfig) {
    if (!this.gkey) throw new Error('Gemini API 키가 필요합니다');
    const models = [this.model, 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.5-flash']
      .filter((m, i, a) => m && a.indexOf(m) === i);
    let lastErr;
    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(this.gkey)}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: genConfig || {} })
        });
        if (!response.ok) {
          let msg = 'HTTP ' + response.status;
          try { const e = await response.json(); if (e.error?.message) msg = e.error.message; } catch (_) {}
          lastErr = new Error(msg);
          // 모델이 없거나 요청형식 문제면 다음 모델로, 권한/쿼터면 즉시 중단
          if (response.status === 404 || response.status === 400) continue;
          throw lastErr;
        }
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (text) { this._lastModelUsed = model; if (model !== this.model) console.warn('Gemini 모델 폴백 사용:', model); return text; }
        lastErr = new Error('빈 응답');
      } catch (e) {
        lastErr = e;
        if (/Failed to fetch|NetworkError/i.test(e.message || '')) throw e; // 네트워크는 재시도 의미 없음
      }
    }
    throw lastErr || new Error('생성 실패');
  }

  /**
   * PDF/URL 텍스트 기반 맞춤형 문제 생성
   * @param {string} materialText - 학습 자료 텍스트
   * @param {string} subject - 과목
   * @returns {Promise<Array>} 생성된 문제
   */
  async generateFromMaterial(materialText, subject) {
    if (!this.gkey) throw new Error('Gemini API 키가 필요합니다');

    const subjectNames = {
      postal: '우편일반',
      savings: '예금일반',
      insurance: '보험일반',
      computer: '컴퓨터일반'
    };

    const subName = subjectNames[subject] || subject;

    const prompt = `다음은 ${subName} 학습 자료입니다:

---
${materialText.slice(0, 4000)}
---

이 자료의 핵심 내용을 기반으로 20개의 객관식 문제를 생성하세요.
- 각 문제는 자료에 명시된 내용과 직결되어야 함
- 이해도 평가 중심 (깊이 있는 사고 필요)
- 2024년 이후 법령 기준 반영
- JSON 배열 형식으로만 응답

[
  {
    "question": "...",
    "options": ["① ...", "② ...", "③ ...", "④ ..."],
    "answer": 0,
    "explanation": "..."
  }
]`;

    try {
      const content = await this._generate(prompt, { temperature: 0.7, responseMimeType: 'application/json' });
      return this._parseJSON(content);
    } catch (error) {
      console.error('자료 기반 생성 실패:', error);
      throw error;
    }
  }

  /**
   * Google Custom Search API로 공식 자료 검색
   * @param {string} query - 검색어 (예: "우정사업본부 공채 문제")
   * @returns {Promise<Array>} 검색 결과
   */
  async searchOfficialMaterials(query) {
    if (!this.skey || !this.cxid) {
      throw new Error('Custom Search API 설정이 필요합니다');
    }

    try {
      // 2024년 이후 최신 자료만 검색
      const enhancedQuery = `${query} after:2024`;
      const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(enhancedQuery)}&key=${encodeURIComponent(this.skey)}&cx=${encodeURIComponent(this.cxid)}&num=10`;

      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();

      return (data.items || []).map(item => ({
        title: item.title,
        url: item.link,
        snippet: item.snippet,
        source: item.displayLink
      }));

    } catch (error) {
      console.error('자료 검색 실패:', error);
      return [];
    }
  }

  /**
   * 오답 분석 및 피드백 생성
   * @param {Array} wrongQuestions - 틀린 문제 배열
   * @param {string} subject - 과목
   * @returns {Promise<Object>} 분석 결과
   */
  async analyzeWrongAnswers(wrongQuestions, subject) {
    if (!this.gkey) throw new Error('Gemini API 키가 필요합니다');

    const questionsText = wrongQuestions
      .map((q, i) => `${i + 1}. ${q.q}\n   정답: ${(q.o && q.o[q.a] != null) ? q.o[q.a] : q.a}\n   해설: ${q.e || ''}`)
      .join('\n');

    const prompt = `당신은 계리직 공무원 수험생을 1:1로 지도하는 일타강사입니다.
사모님(수험생)이 아래 문제들을 틀렸습니다. 합격을 만들어내는 멘토로서 약점을 정밀 진단하세요.

${questionsText}

각 문제가 '개념 부족' 때문인지 '단순 실수(함정에 걸림)' 때문인지 판단하고,
아래 JSON 형식으로만 응답하세요 (마크다운 금지):
{
  "summary": "전반적 진단 한 줄 (따뜻하지만 냉철하게)",
  "weakConcepts": ["약점 개념1", "약점 개념2"],
  "errorBreakdown": { "개념부족": 0, "단순실수": 0 },
  "perQuestion": [ { "no": 1, "cause": "개념부족|단순실수", "fix": "이 문제를 다시 안 틀리려면 어떻게 할지 한 문장" } ],
  "feedback": "사모님을 격려하며 합격을 향한 구체적 학습 방향 (3문장 이내)",
  "recommendedTopics": ["집중 복습할 개념1", "개념2", "개념3"]
}`;

    try {
      const content = await this._generate(prompt, { temperature: 0.6, responseMimeType: 'application/json' });
      return this._parseAnalysis(content);
    } catch (error) {
      console.error('오답 분석 실패:', error);
      return { summary: '', weakConcepts: [], errorBreakdown: {}, perQuestion: [], feedback: '잠시 후 다시 시도해 주세요. (' + error.message + ')', recommendedTopics: [] };
    }
  }

  /**
   * 분석 결과(객체 JSON) 파싱 — _parseJSON은 배열 전용이므로 별도 처리
   * @private
   */
  _parseAnalysis(text) {
    if (!text) return { weakConcepts: [], feedback: '', recommendedTopics: [] };
    text = text.trim().replace(/```json/gi, '').replace(/```/g, '');
    const f = text.indexOf('{'), l = text.lastIndexOf('}');
    if (f === -1 || l === -1) return { weakConcepts: [], feedback: '', recommendedTopics: [] };
    try {
      return JSON.parse(text.slice(f, l + 1));
    } catch (e) {
      console.error('분석 JSON 파싱 실패:', e);
      return { weakConcepts: [], feedback: '', recommendedTopics: [] };
    }
  }

  /**
   * JSON 파싱 (견고성 강화)
   * @private
   */
  _parseJSON(text) {
    if (!text) return [];

    // 코드펜스 제거
    text = text.trim().replace(/```json/gi, '').replace(/```/g, '');

    // JSON 배열 범위 찾기
    const firstIdx = text.indexOf('[');
    const lastIdx = text.lastIndexOf(']');

    if (firstIdx === -1 || lastIdx === -1) {
      console.warn('JSON 배열을 찾을 수 없음');
      return [];
    }

    let jsonStr = text.slice(firstIdx, lastIdx + 1);

    // 안전한 보정만 수행 (값에 따옴표를 강제로 끼우던 기존 로직은 한글 콜론 문장을 깨뜨려 제거함)
    jsonStr = jsonStr
      .replace(/,\s*([\]}])/g, '$1')  // 트레일링 콤마 제거
      .replace(/[“”]/g, '"')  // 스마트 큰따옴표 정상화
      .replace(/[‘’]/g, "'");  // 스마트 작은따옴표 정상화

    try {
      const arr = JSON.parse(jsonStr);
      if (!Array.isArray(arr)) return [];

      return arr.map(item => ({
        q: String(item.question || item.q || ''),
        o: Array.isArray(item.options) ? item.options.map(String) : [],
        a: Math.max(0, Math.min((item.options || []).length - 1, parseInt(item.answer) || 0)),
        e: String(item.explanation || item.explain || '')
      })).filter(it => it.q);

    } catch (e) {
      console.error('JSON 파싱 실패:', e, jsonStr);
      return [];
    }
  }

  /**
   * 모델 변경
   */
  setModel(modelName) {
    this.model = modelName;
    localStorage.setItem('gmodel', modelName);
  }

  /**
   * API 설정 업데이트
   */
  updateCredentials() {
    this.gkey = localStorage.getItem('gkey');
    this.skey = localStorage.getItem('skey');
    this.cxid = localStorage.getItem('cxid');
    this.model = localStorage.getItem('gmodel') || 'gemini-3.5-flash';
  }

  /**
   * 2024년 이후 데이터만 필터링하는 프롬프트 생성
   * @private
   */
  _get2024PlusPrompt(basePrompt) {
    return `${basePrompt}

【 최신 데이터 필터 】
- 출제 기준일: 2024년 1월 1일 이후
- 법령: 최신 개정 기준 반영
- 정책: 2024년 현재 시행 중인 정책만
- 통계: 최신 공식 통계 활용

오래된 정보나 폐지된 규정은 절대 포함하지 마세요.`;
  }
}

/**
 * PDF 텍스트 추출 헬퍼 (Web API 기반)
 */
class PDFTextExtractor {
  /**
   * 파일에서 텍스트 추출
   * @param {File} file - 업로드된 파일
   * @returns {Promise<string>} 추출된 텍스트
   */
  static async extractFromFile(file) {
    if (file.type === 'text/plain') {
      return file.text();
    } else if (file.type === 'application/pdf') {
      // 간단한 텍스트 추출 (PDF.js 라이브러리 필요)
      return '(PDF 파일은 Text 형식으로 변환해서 업로드하세요)';
    }
    throw new Error('지원하지 않는 파일 형식입니다');
  }

  /**
   * URL에서 텍스트 추출
   * @param {string} url - URL
   * @returns {Promise<string>} 추출된 텍스트
   */
  static async extractFromURL(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('URL 접근 실패');

      const contentType = response.headers.get('content-type');
      if (contentType.includes('text/html')) {
        const html = await response.text();
        // 간단한 HTML 파싱
        const temp = document.createElement('div');
        temp.innerHTML = html;
        return temp.innerText;
      } else if (contentType.includes('text/plain')) {
        return response.text();
      }
    } catch (e) {
      throw new Error('URL 텍스트 추출 실패: ' + e.message);
    }
  }
}

/**
 * 오답 노트 관리자
 */
class WrongNoteManager {
  constructor() {
    this.notes = this._loadFromStorage();
  }

  /**
   * 오답 추가
   */
  addWrong(subject, questionNumber, question, correct, explanation) {
    if (!this.notes[subject]) this.notes[subject] = [];
    this.notes[subject].push({
      timestamp: new Date().toISOString(),
      number: questionNumber,
      question: question,
      correct: correct,
      explanation: explanation
    });
    this._saveToStorage();
  }

  /**
   * 과목별 오답 노트 다운로드
   */
  downloadAsText(subject) {
    const notes = this.notes[subject] || [];
    let text = `=== ${subject} 오답 노트 ===\n`;
    text += `생성일: ${new Date().toLocaleString()}\n`;
    text += `총 ${notes.length}개 문항\n\n`;

    notes.forEach((note, idx) => {
      text += `${idx + 1}. [${note.number}번 문제]\n`;
      text += `   문제: ${note.question}\n`;
      text += `   정답: ${note.correct}\n`;
      text += `   해설: ${note.explanation}\n\n`;
    });

    return text;
  }

  /**
   * 로컬 스토리지 저장
   * @private
   */
  _saveToStorage() {
    localStorage.setItem('wrongNotes', JSON.stringify(this.notes));
  }

  /**
   * 로컬 스토리지 로드
   * @private
   */
  _loadFromStorage() {
    try {
      return JSON.parse(localStorage.getItem('wrongNotes')) || {};
    } catch {
      return {};
    }
  }

  /**
   * 모든 오답 노트 초기화
   */
  clear(subject = null) {
    if (subject) {
      delete this.notes[subject];
    } else {
      this.notes = {};
    }
    this._saveToStorage();
  }

  /**
   * 통계 반환
   */
  getStats(subject) {
    const notes = this.notes[subject] || [];
    return {
      totalWrong: notes.length,
      lastUpdated: notes.length > 0 ? notes[notes.length - 1].timestamp : null
    };
  }
}

/**
 * 글로벌 인스턴스 생성 (HTML에서 사용)
 */
const googleAPI = new GoogleAPIManager();
const wrongNoteManager = new WrongNoteManager();

// 모듈 내보내기 (필요시)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GoogleAPIManager, PDFTextExtractor, WrongNoteManager };
}
