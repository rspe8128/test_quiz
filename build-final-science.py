# -*- coding: utf-8 -*-
"""Generate final-science.html with proper UTF-8 encoding."""
from pathlib import Path

from fsci_bio_content import (
    BIO_CELL, BIO_GENETICS, BIO_MATERIAL, BIO_METABOLISM, BIO_QUIZ,
)

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "final-science.html"

SHELL = '''<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>통합과학 · 기말 대비</title>
  <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
  <link rel="stylesheet" href="site-theme.css" />
  <link rel="stylesheet" href="final-science.css" />
</head>
<body>
  <div class="shell">
    <nav class="site-nav">
      <a class="site-nav__link" href="index.html#final">&larr; 기말 대비 메인</a>
    </nav>
    <p class="page-eyebrow">민사 1-1 · 기말고사</p>
    <h1 class="app-title">통합과학 · 기말 대비</h1>
    <div class="page-card" id="fsciRoot">
      <p class="fk-lead">제공해 주신 <strong>모의고사 해설 PDF</strong> 슬라이드를 그대로 넣었습니다. <strong>생물</strong> 탭에서 원본 그림·글자를 보며 복습하고, <strong>연습문제</strong> 탭에서 기출 해설 기반 14문항을 풀 수 있습니다.</p>
      <div class="fk-topnav-wrap">
        <div class="fk-topnav" role="tablist" aria-label="통합과학 과목">
          <button type="button" class="fk-topnav__btn" data-fsci-tab="physics" role="tab" aria-selected="false">물리<small>준비 중</small></button>
          <button type="button" class="fk-topnav__btn is-on" data-fsci-tab="biology" role="tab" aria-selected="true">생물<small>생명파트 · 14문항</small></button>
          <button type="button" class="fk-topnav__btn" data-fsci-tab="earth" role="tab" aria-selected="false">지구과학<small>준비 중</small></button>
          <button type="button" class="fk-topnav__btn" data-fsci-tab="chemistry" role="tab" aria-selected="false">화학<small>준비 중</small></button>
        </div>
      </div>
      <div id="fsciPanels">

        <section class="fk-panel" data-fsci-panel="physics" role="tabpanel" hidden>
          <div class="fsci-placeholder">
            <p class="fsci-placeholder__badge">준비 중</p>
            <p>물리 파트 정리는 곧 추가됩니다.</p>
          </div>
        </section>

        <section class="fk-panel is-on" data-fsci-panel="biology" role="tabpanel">
          <div class="fsci-subnav-wrap">
            <div class="fsci-subnav" role="tablist" aria-label="생물 단원">
              <button type="button" class="fsci-subnav__btn is-on" data-fsci-bio-tab="bio-material" role="tab" aria-selected="true">자연의 구성물질</button>
              <button type="button" class="fsci-subnav__btn" data-fsci-bio-tab="bio-cell" role="tab" aria-selected="false">세포</button>
              <button type="button" class="fsci-subnav__btn" data-fsci-bio-tab="bio-metabolism" role="tab" aria-selected="false">물질대사·효소</button>
              <button type="button" class="fsci-subnav__btn" data-fsci-bio-tab="bio-genetics" role="tab" aria-selected="false">유전정보</button>
              <button type="button" class="fsci-subnav__btn" data-fsci-bio-tab="bio-quiz" role="tab" aria-selected="false">연습문제</button>
            </div>
          </div>

          <div class="fsci-bio-panel is-on" data-fsci-bio-panel="bio-material" role="tabpanel">
''' + BIO_MATERIAL + '''
          </div>

          <div class="fsci-bio-panel" data-fsci-bio-panel="bio-cell" role="tabpanel" hidden>
''' + BIO_CELL + '''
          </div>

          <div class="fsci-bio-panel" data-fsci-bio-panel="bio-metabolism" role="tabpanel" hidden>
''' + BIO_METABOLISM + '''
          </div>

          <div class="fsci-bio-panel" data-fsci-bio-panel="bio-genetics" role="tabpanel" hidden>
''' + BIO_GENETICS + '''
          </div>

          <div class="fsci-bio-panel" data-fsci-bio-panel="bio-quiz" role="tabpanel" hidden>
''' + BIO_QUIZ + '''
          </div>
        </section>

        <section class="fk-panel" data-fsci-panel="earth" role="tabpanel" hidden>
          <div class="fsci-placeholder">
            <p class="fsci-placeholder__badge">준비 중</p>
            <p>지구과학 파트 정리는 곧 추가됩니다.</p>
          </div>
        </section>

        <section class="fk-panel" data-fsci-panel="chemistry" role="tabpanel" hidden>
          <div class="fsci-placeholder">
            <p class="fsci-placeholder__badge">준비 중</p>
            <p>화학 파트 정리는 곧 추가됩니다.</p>
          </div>
        </section>

      </div>
    </div>
  </div>
  <div class="footer">출처: 모의고사-해설-기말고사-대비순서.pdf (슬라이드 원본 사용)</div>
  <link rel="stylesheet" href="bgm-player.css" />
  <script src="bgm-player.js" defer></script>
  <script src="fsci-quiz-data.js" charset="UTF-8"></script>
  <script src="final-science-app.js" charset="UTF-8" defer></script>
</body>
</html>
'''

OUT.write_text(SHELL, encoding="utf-8")
print("wrote", OUT)
