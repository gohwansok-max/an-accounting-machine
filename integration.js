/**
 * 계리패스 AI — 통합 스크립트
 * googleapi-module.js와 index.html을 연동하는 핵심 로직
 */

(function() {
  'use strict';

  /**
   * 전역 객체에 모듈 연결
   */
  if (typeof googleAPI === 'undefined') {
    console.error('googleapi-module.js를 먼저 로드하세요');
    return;
  }

  /**
   * HTML의 state 객체에 AI 생성 메서드 추가
   */
  if (typeof state === 'undefined') {
    console.error('index.html이 로드되어야 합니다');
    return;
  }

  /**
   * 개선된 AI 문제 생성 (모듈 활용)
   */
  window.genAIQuestionsAdvanced = async function(subject, context = '') {
    const panel = document.getElementById('panel-' + subject);
    if (!panel) return false;

    panel.querySelector('.loading').classList.add('show');
    panel.querySelector('.qarea').innerHTML = '';

    try {
      const questions = await googleAPI.generateQuestions(
        subject,
        state.diff,
        context
      );

      if (!questions || questions.length === 0) {
        throw new Error('생성된 문제가 없습니다');
      }

      state.cur[subject] = questions;
      renderPanel(subject);
      toast(`🤖 AI가 ${state.diff} 문제 ${questions.length}개를 생성했어요!`);
      return true;

    } catch (error) {
      console.error('AI 생성 실패:', error);
      toast(`❌ 생성 실패: ${error.message}`);
      
      // 폴백: 기본 문제
      state.cur[subject] = generateDefaultQuestions(subject, state.diff);
      renderPanel(subject);
      return false;

    } finally {
      panel.querySelector('.loading').classList.remove('show');
    }
  };

  /**
   * 자료 기반 문제 생성
   */
  window.generateFromMaterialAdvanced = async function(materialText) {
    const modal = document.getElementById('modal');
    const card = document.getElementById('modalCard');

    card.innerHTML = '<div class="loading show"><div class="spin"></div>자료를 분석 중입니다…</div>';

    try {
      const questions = await googleAPI.generateFromMaterial(
        materialText,
        state.active
      );

      if (!questions || questions.length === 0) {
        throw new Error('분석 결과가 없습니다');
      }

      state.cur[state.active] = questions;
      renderPanel(state.active);
      modal.classList.remove('show');
      toast(`📚 자료 기반 문제 ${questions.length}개가 생성되었어요!`);
      return true;

    } catch (error) {
      console.error('자료 분석 실패:', error);
      toast(`❌ 분석 실패: ${error.message}`);
      return false;

    } finally {
      card.innerHTML = '';
    }
  };

  /**
   * 공식 자료 검색 및 로드
   */
  window.searchAndLoadOfficialMaterials = async function(query = null) {
    const modal = document.getElementById('modal');
    const card = document.getElementById('modalCard');

    const subjectNames = {
      postal: '우편일반',
      savings: '예금일반',
      insurance: '보험일반',
      computer: '컴퓨터일반'
    };

    const searchQuery = query || `${subjectNames[state.active] || state.active} 공무원 시험 기출 2024`;

    card.innerHTML = `<h2>🔍 공식 자료 검색</h2>
      <div class="loading show"><div class="spin"></div>검색 중입니다…</div>`;
    modal.classList.add('show');

    try {
      const results = await googleAPI.searchOfficialMaterials(searchQuery);

      if (!results || results.length === 0) {
        throw new Error('검색 결과가 없습니다. Custom Search API 설정을 확인하세요.');
      }

      let html = `<h2>🔍 검색 결과 (${results.length}개)</h2>
        <div style="max-height:400px;overflow-y:auto">`;

      results.forEach((result, idx) => {
        html += `<div style="border-bottom:1px solid var(--line);padding:12px 0">
          <div style="font-weight:800;font-size:13px;color:var(--primary)">${idx + 1}. ${result.title}</div>
          <div style="font-size:12px;color:var(--sub);margin-top:3px">${result.snippet.slice(0, 100)}…</div>
          <div style="font-size:11px;color:#999;margin-top:3px">${result.source}</div>
          <button class="btn small" style="margin-top:6px;font-size:11px" 
            onclick="loadMaterialFromURL('${result.url}')">
            📄 이 자료 로드
          </button>
        </div>`;
      });

      html += `</div>`;
      card.innerHTML = html;

    } catch (error) {
      console.error('검색 실패:', error);
      card.innerHTML = `<h2>❌ 검색 실패</h2>
        <p style="color:var(--sub)">${error.message}</p>
        <p style="font-size:12px;color:#999">
          💡 Custom Search API 설정이 필요합니다:<br>
          1. console.cloud.google.com에서 API 활성화<br>
          2. programmablesearchengine.google.com에서 검색 엔진 생성<br>
          3. ⚙️ 설정에서 API 키와 cx ID 입력
        </p>
        <button class="btn ghost small" onclick="document.getElementById('modal').classList.remove('show')">닫기</button>`;
    }
  };

  // 참고: loadMaterialFromURL 은 index.html 본체에 'CORS 실패 시 주제 기반 폴백'을 갖춘
  // 더 견고한 버전이 정의되어 있으므로 여기서 재정의하지 않는다(덮어쓰기 방지).

  /**
   * 오답 분석 (고급)
   */
  window.analyzeWrongAnswersAdvanced = async function(subject) {
    const wrongNotes = state.wrongNotes[subject] || [];
    if (wrongNotes.length === 0) {
      toast('오답이 없습니다');
      return;
    }

    const modal = document.getElementById('modal');
    const card = document.getElementById('modalCard');

    card.innerHTML = `<div class="loading show"><div class="spin"></div>약점을 분석 중입니다…</div>`;
    modal.classList.add('show');

    try {
      const analysis = await googleAPI.analyzeWrongAnswers(
        wrongNotes.map(w => w.it),
        subject
      );

      const esc = s => String(s == null ? '' : s).replace(/</g, '&lt;');
      const conceptChips = (analysis.weakConcepts || [])
        .map(c => `<span style="display:inline-block;background:rgba(239,68,68,0.15);color:var(--error);padding:4px 10px;border-radius:999px;font-size:12px;font-weight:800;margin:3px">#${esc(c)}</span>`)
        .join('');

      const eb = analysis.errorBreakdown || {};
      const concept = eb['개념부족'] || 0, mistake = eb['단순실수'] || 0;
      const breakdownHtml = (concept || mistake) ? `
        <div style="display:flex;gap:10px;margin-bottom:14px">
          <div style="flex:1;background:rgba(239,68,68,0.08);border-radius:12px;padding:10px;text-align:center">
            <div style="font-size:22px;font-weight:900;color:var(--error)">${concept}</div>
            <div style="font-size:11px;color:var(--sub);font-weight:800">📕 개념 부족</div>
          </div>
          <div style="flex:1;background:rgba(245,158,11,0.1);border-radius:12px;padding:10px;text-align:center">
            <div style="font-size:22px;font-weight:900;color:#D97706">${mistake}</div>
            <div style="font-size:11px;color:var(--sub);font-weight:800">⚠️ 단순 실수(함정)</div>
          </div>
        </div>` : '';

      const perQ = (analysis.perQuestion || []).map(p => `
        <div style="border-left:3px solid ${p.cause === '개념부족' ? 'var(--error)' : '#D97706'};padding:6px 10px;margin:6px 0;background:var(--surface-2);border-radius:8px">
          <span style="font-weight:800;font-size:12px">${esc(p.no)}번 · ${esc(p.cause)}</span>
          <div style="font-size:12px;color:var(--sub);margin-top:2px">→ ${esc(p.fix)}</div>
        </div>`).join('');

      card.innerHTML = `<h2>🧠 AI 약점 정밀 분석</h2>
        ${analysis.summary ? `<div style="font-size:13px;font-weight:800;color:var(--primary);margin-bottom:12px">“${esc(analysis.summary)}”</div>` : ''}
        ${breakdownHtml}
        <div style="margin-bottom:14px">
          <div style="font-weight:800;font-size:13px;color:var(--error);margin-bottom:6px">📊 약점 개념:</div>
          <div>${conceptChips || '(분석 결과 없음)'}</div>
        </div>
        ${perQ ? `<div style="margin-bottom:14px"><div style="font-weight:800;font-size:13px;color:var(--ink);margin-bottom:4px">📝 문제별 진단:</div>${perQ}</div>` : ''}
        <div style="background:rgba(13,71,161,0.06);padding:12px;border-radius:12px;margin-bottom:14px">
          <div style="font-weight:800;font-size:13px;color:var(--primary);margin-bottom:6px">💬 강사 피드백:</div>
          <div style="font-size:13px;line-height:1.6;color:var(--ink)">${esc(analysis.feedback) || '계속 열심히 하고 있어요!'}</div>
        </div>
        <div>
          <div style="font-weight:800;font-size:13px;color:var(--primary);margin-bottom:6px">📚 집중 복습:</div>
          <ul style="margin:6px 0;padding-left:20px">
            ${(analysis.recommendedTopics || []).map(t => `<li style="font-size:12px;color:var(--sub)">${esc(t)}</li>`).join('')}
          </ul>
        </div>
        <button class="btn small" style="width:100%;margin-top:12px" onclick="document.getElementById('modal').classList.remove('show')">닫기</button>`;

    } catch (error) {
      console.error('분석 실패:', error);
      card.innerHTML = `<h2>⚠️ 분석 중 오류</h2>
        <p style="color:var(--sub)">${error.message}</p>
        <button class="btn ghost small" onclick="document.getElementById('modal').classList.remove('show')">닫기</button>`;
    }
  };

  /**
   * 오답 노트 내보내기 (고급)
   */
  window.downloadWrongNotesAdvanced = function(subject) {
    try {
      const text = wrongNoteManager.downloadAsText(subject);
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${subject}_오답노트_${new Date().toISOString().slice(0, 10)}.txt`;
      link.click();
      URL.revokeObjectURL(link.href);
      toast('📥 오답 노트가 다운로드되었습니다');
    } catch (error) {
      console.error('다운로드 실패:', error);
      toast('❌ 다운로드 실패');
    }
  };

  /**
   * 학습 통계 표시
   */
  window.showStudyStats = function() {
    const modal = document.getElementById('modal');
    const card = document.getElementById('modalCard');

    let html = `<h2>📊 학습 통계</h2>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px">`;

    const subjectNames = {
      postal: '우편일반',
      savings: '예금일반',
      insurance: '보험일반',
      computer: '컴퓨터일반'
    };

    Object.keys(subjectNames).forEach(sub => {
      const stats = wrongNoteManager.getStats(sub);
      html += `<div style="background:rgba(13,71,161,0.06);padding:12px;border-radius:12px">
        <div style="font-weight:800;color:var(--primary)">${subjectNames[sub]}</div>
        <div style="font-size:24px;font-weight:900;margin:6px 0">${stats.totalWrong}</div>
        <div style="font-size:11px;color:var(--sub)">틀린 문제</div>
      </div>`;
    });

    html += `</div>
      <div style="margin-top:14px;padding:12px;background:rgba(16,185,129,0.06);border-radius:12px">
        <div style="font-weight:800;color:var(--success)">📈 누적 정보</div>
        <div style="font-size:13px;color:var(--sub);margin-top:6px">
          전체 오답: ${Object.values(state.wrongNotes).reduce((sum, arr) => sum + (arr ? arr.length : 0), 0)}개<br>
          현재 레벨: Lv. ${levelOf(profile.xp)}<br>
          누적 XP: ${profile.xp}
        </div>
      </div>
      <button class="btn small" style="width:100%;margin-top:12px" onclick="document.getElementById('modal').classList.remove('show')">닫기</button>`;

    card.innerHTML = html;
    modal.classList.add('show');
  };

  /**
   * API 상태 점검
   */
  window.checkAPIStatus = function() {
    googleAPI.updateCredentials();

    const status = {
      gemini: !!googleAPI.gkey ? '✅ 연결됨' : '❌ 미설정',
      search: (!!googleAPI.skey && !!googleAPI.cxid) ? '✅ 연결됨' : '❌ 미설정',
      model: googleAPI.model
    };

    return status;
  };

  /**
   * 학습 세션 초기화
   */
  window.startNewSession = function() {
    if (confirm('새 학습 세션을 시작하시겠어요? (현재 진행 상황은 유지됩니다)')) {
      state.cur = {};
      state.answers = {};
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      
      const firstTab = document.querySelector('.tab');
      if (firstTab) {
        firstTab.click();
      }
      
      toast('🆕 새 세션이 시작되었습니다!');
    }
  };

  /**
   * 초기화 시 API 상태 확인
   */
  document.addEventListener('DOMContentLoaded', function() {
    // API 모듈 초기화 (index.html의 gear 버튼 핸들러는 그대로 두어 이중 토글 버그 방지)
    googleAPI.updateCredentials();
    console.log('계리패스 AI 초기화 완료');
    console.log('API 상태:', checkAPIStatus());
  });

  /**
   * 콘솔 헬퍼 함수
   */
  window.help = function() {
    console.log(`
    ╔════════════════════════════════════════════╗
    ║    계리패스 AI — 콘솔 헬퍼 함수            ║
    ╚════════════════════════════════════════════╝

    📚 학습 함수:
    - genAIQuestionsAdvanced(subject)     : AI로 문제 생성
    - generateFromMaterialAdvanced(text)  : 자료 기반 생성
    - searchAndLoadOfficialMaterials()    : 공식 자료 검색
    - analyzeWrongAnswersAdvanced(subject): 오답 분석

    📊 통계/관리:
    - showStudyStats()                    : 학습 통계 표시
    - downloadWrongNotesAdvanced(subject) : 오답노트 다운로드
    - checkAPIStatus()                    : API 상태 확인
    - startNewSession()                   : 새 세션 시작

    💾 데이터 관리:
    - wrongNoteManager.clear()            : 모든 오답 초기화
    - localStorage.clear()                : 모든 데이터 초기화

    📞 버그 리포트:
    - 콘솔(F12)의 메시지를 확인하세요
    - API 키 설정 여부 확인: checkAPIStatus()
    `);
  };

  // 시작 메시지
  console.log('🎓 계리패스 AI 로드 완료! help() 입력해서 사용 가능한 함수를 확인하세요.');

})();
