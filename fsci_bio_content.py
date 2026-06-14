# -*- coding: utf-8 -*-
"""Expanded biology section HTML for final-science."""
from fsci_pdf_pages import render_pdf_pages

BIO_MATERIAL = '''
            <p class="fk-panel-title">2-3 자연의 구성물질 · 창발성 · 단백질 · 핵산</p>
            <div class="fk-card">
              <h4>단원 안내</h4>
              <p>단위체·창발성, 규소/탄소, 단백질·핵산, 펩타이드 결합, DNA/RNA, 상보적 결합. 아래 슬라이드는 선생님 자료 PDF와 동일합니다.</p>
              <table class="fk-compare">
                <tr><th>암기 포인트</th><th>내용</th></tr>
                <tr><td>창발성</td><td>아미노산→단백질, 뉴클레오타이드→핵산</td></tr>
                <tr><td>펩타이드 결합</td><td>물 1분자 탈수 (탈수축합)</td></tr>
                <tr><td>DNA 염기</td><td>A,T,G,C / RNA는 U</td></tr>
                <tr><td>상보 결합</td><td>A–T(수소2), C–G(수소3)</td></tr>
              </table>
              ''' + render_pdf_pages("bio-material") + '''
            </div>'''

BIO_CELL = '''
            <p class="fk-panel-title">3-1 생명 시스템의 기본 단위 · 세포 · 세포막</p>
            <div class="fk-card">
              <h4>단원 안내</h4>
              <p>세포 소기관, 동물·식물 세포, 인지질 2중층, 단순·촉진 확산, 삼투. 통합과학에서는 통로·운반체 단백질을 구분하지 않습니다.</p>
              <table class="fk-compare">
                <tr><th>소기관</th><th>기능</th></tr>
                <tr><td>핵</td><td>유전정보·생명 활동 조절</td></tr>
                <tr><td>라이보솜</td><td>단백질 합성</td></tr>
                <tr><td>소포체·골지체</td><td>운반·분비</td></tr>
                <tr><td>마이토콘드리아</td><td>세포 호흡(엽록체=광합성)</td></tr>
              </table>
              ''' + render_pdf_pages("bio-cell") + '''
            </div>'''

BIO_METABOLISM = '''
            <p class="fk-panel-title">3-2 물질대사와 효소</p>
            <div class="fk-card">
              <h4>단원 안내</h4>
              <p>물질대사, 동화/이화, 활성화에너지 vs 반응열, 효소 특성(기질 특이성·재사용·변성), 카탈레이스 실험.</p>
              <p class="fk-note">기출: 카탈레이스가 있을 때 <strong>활성화에너지가 더 작다</strong>. 효소는 반응 후 재사용된다.</p>
              ''' + render_pdf_pages("bio-metabolism") + '''
            </div>'''

BIO_GENETICS = '''
            <p class="fk-panel-title">3-3 세포 내 정보의 흐름 · 유전자 · 유전암호</p>
            <div class="fk-card">
              <h4>단원 안내</h4>
              <p>유전자 발현, 전사(핵)·번역(라이보솜), 코돈(64종), 유전암호 공통성, 돌연변이(낫모양적혈구·백색증·PKU).</p>
              <p class="fk-note">기출(상): DNA 상보 가닥·염기 개수·전사 문제 → 가닥을 직접 채워 넣으며 풀기.</p>
              ''' + render_pdf_pages("bio-genetics") + '''
            </div>'''

BIO_QUIZ = '''
            <p class="fk-panel-title">연습문제 · 모의고사 해설 기반</p>
            <div class="fsci-quiz-intro" data-fsci-quiz-intro="bio-quiz">
              <p>PDF 중간·후반 <strong>해설 14문항</strong>을 객관식으로 재구성했습니다. (원문 지문은 슬라이드 그림 위주라 해설 기반)</p>
              <table class="fk-compare">
                <tr><th>단원</th><th>문항</th><th>난이도</th></tr>
                <tr><td>자연의 구성물질</td><td>5</td><td>하~중</td></tr>
                <tr><td>세포</td><td>3</td><td>하</td></tr>
                <tr><td>물질대사·효소</td><td>2</td><td>하~중</td></tr>
                <tr><td>유전정보</td><td>4</td><td>상</td></tr>
              </table>
              <button type="button" class="fs-quiz-start" data-fsci-quiz-start="bio-quiz">연습문제 풀기 시작<small>객관식 14문항 · 순서 랜덤</small></button>
            </div>
            <div class="fs-quiz-wrap">
              <div class="fs-quiz-app" data-fsci-quiz-app="bio-quiz"></div>
            </div>'''
