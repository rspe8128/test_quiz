# -*- coding: utf-8 -*-
"""Inline SVG diagrams for final-science biology sections."""

FIG_EMERGENCE = '''
<figure class="fsci-fig">
<svg viewBox="0 0 520 120" xmlns="http://www.w3.org/2000/svg" aria-label="창발성: 단위체에서 복합체">
  <defs><marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#059669"/></marker></defs>
  <rect x="10" y="35" width="70" height="50" rx="8" fill="#d1fae5" stroke="#059669"/>
  <text x="45" y="65" text-anchor="middle" font-size="11" fill="#065f46">아미노산</text>
  <line x1="85" y1="60" x2="115" y2="60" stroke="#059669" marker-end="url(#arr)"/>
  <rect x="120" y="20" width="100" height="80" rx="8" fill="#a7f3d0" stroke="#059669"/>
  <text x="170" y="55" text-anchor="middle" font-size="11" fill="#065f46">단백질</text>
  <text x="170" y="75" text-anchor="middle" font-size="9" fill="#047857">(입체 구조·기능)</text>
  <rect x="280" y="35" width="90" height="50" rx="8" fill="#dbeafe" stroke="#2563eb"/>
  <text x="325" y="65" text-anchor="middle" font-size="10" fill="#1e40af">뉴클레오타이드</text>
  <line x1="375" y1="60" x2="405" y2="60" stroke="#2563eb" marker-end="url(#arr)"/>
  <rect x="410" y="20" width="100" height="80" rx="8" fill="#bfdbfe" stroke="#2563eb"/>
  <text x="460" y="55" text-anchor="middle" font-size="11" fill="#1e40af">핵산</text>
  <text x="460" y="75" text-anchor="middle" font-size="9" fill="#1d4ed8">(유전정보)</text>
</svg>
<figcaption>단위체에는 없던 <strong>기능·정보</strong>가 모여 형성된 상위 물질에서 나타남 = 창발성</figcaption>
</figure>'''

FIG_AMINO = '''
<figure class="fsci-fig">
<svg viewBox="0 0 360 160" xmlns="http://www.w3.org/2000/svg" aria-label="아미노산 구조">
  <circle cx="180" cy="80" r="22" fill="#fef3c7" stroke="#d97706" stroke-width="2"/>
  <text x="180" y="85" text-anchor="middle" font-size="12" font-weight="bold">C</text>
  <text x="180" y="30" text-anchor="middle" font-size="11" fill="#0369a1">아미노기 (–NH₂)</text>
  <line x1="180" y1="42" x2="180" y2="58" stroke="#0369a1"/>
  <text x="55" y="85" text-anchor="middle" font-size="11" fill="#b45309">카복실기</text>
  <text x="55" y="100" text-anchor="middle" font-size="10" fill="#b45309">(–COOH)</text>
  <line x1="95" y1="80" x2="158" y2="80" stroke="#b45309"/>
  <text x="300" y="80" text-anchor="middle" font-size="11" fill="#7c3aed">곁사슬 (R)</text>
  <line x1="202" y1="80" x2="255" y2="80" stroke="#7c3aed"/>
  <rect x="255" y="62" width="50" height="36" rx="6" fill="#ede9fe" stroke="#7c3aed"/>
  <text x="280" y="84" text-anchor="middle" font-size="11">R</text>
  <text x="180" y="145" text-anchor="middle" font-size="10" fill="#64748b">곁사슬 종류(약 20가지) → 아미노산·단백질 성질 결정</text>
</svg>
<figcaption>아미노산 = 아미노기 + α탄소 + 카복실기 + <strong>곁사슬</strong></figcaption>
</figure>'''

FIG_PEPTIDE = '''
<figure class="fsci-fig">
<svg viewBox="0 0 420 100" xmlns="http://www.w3.org/2000/svg" aria-label="펩타이드 결합">
  <rect x="20" y="30" width="80" height="40" rx="6" fill="#d1fae5" stroke="#059669"/>
  <text x="60" y="55" text-anchor="middle" font-size="11">아미노산1</text>
  <rect x="140" y="30" width="80" height="40" rx="6" fill="#d1fae5" stroke="#059669"/>
  <text x="180" y="55" text-anchor="middle" font-size="11">아미노산2</text>
  <line x1="100" y1="50" x2="140" y2="50" stroke="#059669" stroke-width="3"/>
  <text x="120" y="42" text-anchor="middle" font-size="9" fill="#047857">펩타이드</text>
  <text x="120" y="72" text-anchor="middle" font-size="9" fill="#dc2626">+ H₂O 빠짐</text>
  <text x="280" y="45" font-size="11" fill="#334155">탈수축합결합</text>
  <text x="280" y="65" font-size="10" fill="#64748b">→ 폴리펩타이드(단백질)</text>
</svg>
<figcaption>펩타이드 결합: 두 아미노산 사이에 <strong>물 1분자</strong>가 빠지며 형성</figcaption>
</figure>'''

FIG_NUCLEOTIDE = '''
<figure class="fsci-fig">
<svg viewBox="0 0 400 140" xmlns="http://www.w3.org/2000/svg" aria-label="뉴클레오타이드">
  <circle cx="200" cy="70" r="18" fill="#fef3c7" stroke="#ca8a04"/>
  <text x="200" y="75" text-anchor="middle" font-size="11">당</text>
  <rect x="240" y="52" width="60" height="36" rx="6" fill="#dbeafe" stroke="#2563eb"/>
  <text x="270" y="74" text-anchor="middle" font-size="10">인산</text>
  <rect x="100" y="52" width="60" height="36" rx="6" fill="#fce7f3" stroke="#db2777"/>
  <text x="130" y="74" text-anchor="middle" font-size="10">염기</text>
  <line x1="160" y1="70" x2="182" y2="70" stroke="#64748b"/>
  <line x1="218" y1="70" x2="240" y2="70" stroke="#64748b"/>
  <text x="200" y="125" text-anchor="middle" font-size="10" fill="#64748b">인산 : 당 : 염기 = 1 : 1 : 1</text>
</svg>
<figcaption>뉴클레오타이드 — DNA·RNA의 <strong>단위체</strong></figcaption>
</figure>'''

FIG_DNA_PAIR = '''
<figure class="fsci-fig">
<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" aria-label="DNA 상보적 결합">
  <line x1="80" y1="20" x2="80" y2="180" stroke="#059669" stroke-width="4"/>
  <line x1="240" y1="20" x2="240" y2="180" stroke="#059669" stroke-width="4"/>
  <text x="80" y="50" text-anchor="middle" font-size="14" font-weight="bold" fill="#2563eb">A</text>
  <text x="240" y="50" text-anchor="middle" font-size="14" font-weight="bold" fill="#dc2626">T</text>
  <line x1="95" y1="45" x2="225" y2="45" stroke="#94a3b8" stroke-dasharray="4"/>
  <text x="160" y="40" text-anchor="middle" font-size="9" fill="#64748b">수소결합 ×2</text>
  <text x="80" y="100" text-anchor="middle" font-size="14" font-weight="bold" fill="#7c3aed">C</text>
  <text x="240" y="100" text-anchor="middle" font-size="14" font-weight="bold" fill="#ca8a04">G</text>
  <line x1="95" y1="95" x2="225" y2="95" stroke="#94a3b8" stroke-dasharray="4"/>
  <text x="160" y="90" text-anchor="middle" font-size="9" fill="#64748b">수소결합 ×3</text>
  <text x="160" y="175" text-anchor="middle" font-size="11" fill="#334155">A↔T · C↔G (상보적 결합)</text>
</svg>
<figcaption>마주 보는 가닥의 염기는 <strong>상보적</strong>으로만 짝지어 이중 나선 형성</figcaption>
</figure>'''

FIG_CELL = '''
<figure class="fsci-fig">
<svg viewBox="0 0 480 220" xmlns="http://www.w3.org/2000/svg" aria-label="동물세포와 식물세포">
  <rect x="10" y="10" width="210" height="200" rx="12" fill="#ecfdf5" stroke="#059669" stroke-width="2"/>
  <text x="115" y="28" text-anchor="middle" font-size="11" font-weight="bold">동물 세포</text>
  <ellipse cx="115" cy="110" rx="85" ry="70" fill="#fff" stroke="#10b981"/>
  <circle cx="115" cy="100" r="28" fill="#dbeafe" stroke="#2563eb"/>
  <text x="115" y="105" text-anchor="middle" font-size="9">핵</text>
  <ellipse cx="70" cy="130" rx="22" ry="12" fill="#fef3c7" stroke="#d97706"/>
  <text x="70" y="133" text-anchor="middle" font-size="7">미토</text>
  <circle cx="155" cy="135" r="8" fill="#fce7f3"/>
  <text x="155" y="155" text-anchor="middle" font-size="7">리보솜</text>
  <rect x="250" y="10" width="220" height="200" rx="12" fill="#f0fdf4" stroke="#16a34a" stroke-width="2"/>
  <text x="360" y="28" text-anchor="middle" font-size="11" font-weight="bold">식물 세포</text>
  <rect x="265" y="35" width="190" height="160" rx="4" fill="none" stroke="#84cc16" stroke-width="3"/>
  <ellipse cx="360" cy="115" rx="75" ry="60" fill="#fff" stroke="#10b981"/>
  <circle cx="360" cy="105" r="24" fill="#dbeafe" stroke="#2563eb"/>
  <ellipse cx="400" cy="90" rx="18" ry="10" fill="#bbf7d0" stroke="#16a34a"/>
  <text x="400" y="93" text-anchor="middle" font-size="7">엽록체</text>
  <rect x="320" y="140" width="50" height="35" rx="4" fill="#e0e7ff" stroke="#6366f1"/>
  <text x="345" y="160" text-anchor="middle" font-size="7">액포</text>
  <text x="115" y="198" text-anchor="middle" font-size="8" fill="#64748b">세포막</text>
  <text x="360" y="198" text-anchor="middle" font-size="8" fill="#64748b">+ 세포벽(바깥)</text>
</svg>
<figcaption>식물 세포는 <strong>세포벽·엽록체·액포</strong>가 동물 세포보다 발달</figcaption>
</figure>'''

FIG_MEMBRANE = '''
<figure class="fsci-fig">
<svg viewBox="0 0 420 160" xmlns="http://www.w3.org/2000/svg" aria-label="인지질 2중층">
  <text x="30" y="25" font-size="10" fill="#0369a1">세포 바깥 (물)</text>
  <text x="30" y="145" font-size="10" fill="#0369a1">세포 안 (물)</text>
  <g transform="translate(60,35)">
    <circle cx="0" cy="0" r="10" fill="#60a5fa"/><line x1="0" y1="10" x2="0" y2="35" stroke="#64748b" stroke-width="3"/>
    <circle cx="30" cy="0" r="10" fill="#60a5fa"/><line x1="30" y1="10" x2="30" y2="35" stroke="#64748b" stroke-width="3"/>
    <circle cx="60" cy="0" r="10" fill="#60a5fa"/><line x1="60" y1="10" x2="60" y2="35" stroke="#64748b" stroke-width="3"/>
    <circle cx="90" cy="0" r="10" fill="#60a5fa"/><line x1="90" y1="10" x2="90" y2="35" stroke="#64748b" stroke-width="3"/>
    <circle cx="120" cy="0" r="10" fill="#60a5fa"/><line x1="120" y1="10" x2="120" y2="35" stroke="#64748b" stroke-width="3"/>
    <circle cx="150" cy="0" r="10" fill="#60a5fa"/><line x1="150" y1="10" x2="150" y2="35" stroke="#64748b" stroke-width="3"/>
    <circle cx="180" cy="0" r="10" fill="#60a5fa"/><line x1="180" y1="10" x2="180" y2="35" stroke="#64748b" stroke-width="3"/>
    <circle cx="210" cy="0" r="10" fill="#60a5fa"/><line x1="210" y1="10" x2="210" y2="35" stroke="#64748b" stroke-width="3"/>
    <circle cx="240" cy="0" r="10" fill="#60a5fa"/><line x1="240" y1="10" x2="240" y2="35" stroke="#64748b" stroke-width="3"/>
    <circle cx="270" cy="0" r="10" fill="#60a5fa"/><line x1="270" y1="10" x2="270" y2="35" stroke="#64748b" stroke-width="3"/>
    <circle cx="300" cy="0" r="10" fill="#60a5fa"/><line x1="300" y1="10" x2="300" y2="35" stroke="#64748b" stroke-width="3"/>
    <circle cx="0" cy="70" r="10" fill="#60a5fa"/><line x1="0" y1="60" x2="0" y2="35" stroke="#64748b" stroke-width="3"/>
    <circle cx="30" cy="70" r="10" fill="#60a5fa"/><line x1="30" y1="60" x2="30" y2="35" stroke="#64748b" stroke-width="3"/>
    <circle cx="60" cy="70" r="10" fill="#60a5fa"/><line x1="60" y1="60" x2="60" y2="35" stroke="#64748b" stroke-width="3"/>
    <circle cx="90" cy="70" r="10" fill="#60a5fa"/><line x1="90" y1="60" x2="90" y2="35" stroke="#64748b" stroke-width="3"/>
    <circle cx="120" cy="70" r="10" fill="#60a5fa"/><line x1="120" y1="60" x2="120" y2="35" stroke="#64748b" stroke-width="3"/>
    <circle cx="150" cy="70" r="10" fill="#60a5fa"/><line x1="150" y1="60" x2="150" y2="35" stroke="#64748b" stroke-width="3"/>
    <circle cx="180" cy="70" r="10" fill="#60a5fa"/><line x1="180" y1="60" x2="180" y2="35" stroke="#64748b" stroke-width="3"/>
    <circle cx="210" cy="70" r="10" fill="#60a5fa"/><line x1="210" y1="60" x2="210" y2="35" stroke="#64748b" stroke-width="3"/>
    <circle cx="240" cy="70" r="10" fill="#60a5fa"/><line x1="240" y1="60" x2="240" y2="35" stroke="#64748b" stroke-width="3"/>
    <circle cx="270" cy="70" r="10" fill="#60a5fa"/><line x1="270" y1="60" x2="270" y2="35" stroke="#64748b" stroke-width="3"/>
    <circle cx="300" cy="70" r="10" fill="#60a5fa"/><line x1="300" y1="60" x2="300" y2="35" stroke="#64748b" stroke-width="3"/>
    <ellipse cx="150" cy="35" rx="18" ry="28" fill="#fca5a5" opacity="0.85"/>
    <text x="150" y="38" text-anchor="middle" font-size="8" fill="#7f1d1d">막단백질</text>
  </g>
  <text x="210" y="155" text-anchor="middle" font-size="10" fill="#64748b">● 친수성 머리(물 쪽) — | 소수성 꼬리(안쪽) — ● 친수성 머리</text>
</svg>
<figcaption>인지질 2중층 + 막단백질 = <strong>유동 모자이크</strong> 세포막</figcaption>
</figure>'''

FIG_OSMOSIS = '''
<figure class="fsci-fig">
<svg viewBox="0 0 480 130" xmlns="http://www.w3.org/2000/svg" aria-label="삼투">
  <text x="60" y="15" text-anchor="middle" font-size="10" font-weight="bold">등장액</text>
  <text x="180" y="15" text-anchor="middle" font-size="10" font-weight="bold">저장액</text>
  <text x="300" y="15" text-anchor="middle" font-size="10" font-weight="bold">고장액</text>
  <text x="420" y="15" text-anchor="middle" font-size="10" font-weight="bold">적혈구</text>
  <circle cx="60" cy="70" r="25" fill="#fecaca" stroke="#dc2626"/>
  <text x="60" y="110" text-anchor="middle" font-size="8">변화 없음</text>
  <circle cx="180" cy="70" r="32" fill="#fecaca" stroke="#dc2626" stroke-dasharray="4"/>
  <text x="180" y="74" text-anchor="middle" font-size="8">팽윤</text>
  <text x="180" y="110" text-anchor="middle" font-size="8">물 유입 ↑</text>
  <circle cx="300" cy="70" r="18" fill="#fecaca" stroke="#dc2626"/>
  <text x="300" y="110" text-anchor="middle" font-size="8">수축</text>
  <circle cx="420" cy="70" r="28" fill="#fecaca" stroke="#dc2626"/>
  <text x="420" y="74" text-anchor="middle" font-size="8">용혈</text>
  <text x="420" y="110" text-anchor="middle" font-size="8">(저장액)</text>
</svg>
<figcaption>삼투: 반투과성 막에서 용매(물)가 <strong>저농도→고농도</strong>로 이동</figcaption>
</figure>'''

FIG_ENZYME = '''
<figure class="fsci-fig">
<svg viewBox="0 0 360 180" xmlns="http://www.w3.org/2000/svg" aria-label="활성화에너지">
  <line x1="40" y1="150" x2="340" y2="150" stroke="#64748b"/>
  <line x1="40" y1="150" x2="40" y2="20" stroke="#64748b"/>
  <text x="30" y="85" font-size="9" transform="rotate(-90 30 85)">에너지</text>
  <path d="M 60 130 Q 120 30 180 130" fill="none" stroke="#dc2626" stroke-width="2"/>
  <text x="120" y="55" font-size="9" fill="#dc2626">효소 없음</text>
  <path d="M 60 130 Q 120 80 180 130" fill="none" stroke="#059669" stroke-width="2"/>
  <text x="120" y="95" font-size="9" fill="#059669">효소 있음</text>
  <line x1="60" y1="130" x2="180" y2="130" stroke="#94a3b8" stroke-dasharray="3"/>
  <text x="200" y="135" font-size="9">반응물 → 생성물</text>
</svg>
<figcaption>효소는 <strong>활성화에너지</strong>만 낮춤. 반응열(생성물−반응물 에너지 차)은 변하지 않음</figcaption>
</figure>'''

FIG_CENTRAL = '''
<figure class="fsci-fig">
<svg viewBox="0 0 420 80" xmlns="http://www.w3.org/2000/svg" aria-label="생명중심원리">
  <rect x="10" y="25" width="70" height="35" rx="6" fill="#dbeafe" stroke="#2563eb"/>
  <text x="45" y="47" text-anchor="middle" font-size="11" font-weight="bold">DNA</text>
  <text x="115" y="47" font-size="16" fill="#059669">→</text>
  <rect x="130" y="25" width="70" height="35" rx="6" fill="#fce7f3" stroke="#db2777"/>
  <text x="165" y="47" text-anchor="middle" font-size="11" font-weight="bold">RNA</text>
  <text x="235" y="47" font-size="16" fill="#059669">→</text>
  <rect x="250" y="25" width="80" height="35" rx="6" fill="#d1fae5" stroke="#059669"/>
  <text x="290" y="47" text-anchor="middle" font-size="11" font-weight="bold">단백질</text>
  <text x="165" y="72" text-anchor="middle" font-size="9" fill="#64748b">전사(핵) · 번역(라이보솜) · 형질 발현</text>
</svg>
<figcaption><strong>생명중심원리</strong> — DNA → RNA → 단백질</figcaption>
</figure>'''
