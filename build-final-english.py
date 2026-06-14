# -*- coding: utf-8 -*-
"""Generate final-english.html from Pathways 4 Unit 3–4 study content."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "final-english.html"

TABS = [
    ("u3-summary", "Unit 3 정리", "Art · conservation"),
    ("u3-passages", "Unit 3 지문", "Full text"),
    ("u4-summary", "Unit 4 정리", "Green aviation"),
    ("u4-passages", "Unit 4 지문", "Full text"),
    ("grammar", "문법·어휘", "Phrases · vocab"),
]


def esc(text):
    return (
        str(text)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def passage_block(title, paragraphs_list, src=""):
    parts = ['            <details class="fk-passage">']
    parts.append(f"              <summary>{esc(title)}</summary>")
    parts.append('              <div class="fk-passage__body">')
    if src:
        parts.append(f'                <p class="fk-passage-src">{esc(src)}</p>')
    for item in paragraphs_list:
        if isinstance(item, tuple):
            label, text = item
            parts.append(
                f'                <p><span class="fk-mark">{esc(label)}</span> {esc(text)}</p>'
            )
        else:
            parts.append(f"                <p>{esc(item)}</p>")
    parts.append("              </div>")
    parts.append("            </details>")
    return "\n".join(parts)


def table_html(rows):
    body = []
    for row in rows:
        tag = "th" if row.get("head") else "td"
        cells = "".join(f"<{tag}>{esc(c)}</{tag}>" for c in row["cells"])
        body.append(f"              <tr>{cells}</tr>")
    return '            <table class="fk-compare">\n' + "\n".join(body) + "\n            </table>"


def card(title, inner_html):
    return (
        f'          <div class="fk-card">\n'
        f"            <h4>{esc(title)}</h4>\n"
        f"{inner_html}\n"
        f"          </div>"
    )


def tab_button(tab_id, label, small, first=False):
    on = " is-on" if first else ""
    sel = "true" if first else "false"
    return (
        f'          <button type="button" class="fk-topnav__btn{on}" '
        f'data-fe-tab="{tab_id}" role="tab" aria-selected="{sel}">'
        f"{esc(label)}<small>{esc(small)}</small></button>"
    )


def panel(tab_id, title, body, first=False):
    hidden = "" if first else " hidden"
    active = " is-on" if first else ""
    expand = ""
    if tab_id.endswith("-passages"):
        expand = (
            '          <div class="fk-panel-actions">\n'
            '            <button type="button" data-fe-expand-all>모든 지문 펼치기</button>\n'
            "          </div>\n"
        )
    return (
        f'        <section class="fk-panel{active}" data-fe-panel="{tab_id}" '
        f'role="tabpanel"{hidden}>\n'
        f'          <p class="fk-panel-title">{esc(title)}</p>\n'
        f"{expand}"
        f"{body}\n"
        f"        </section>"
    )


# ── Unit 3 summary ──────────────────────────────────────────────────────────

U3_SUMMARY = """
          <p class="fk-lead">Pathways 4 Unit 3 · <strong>Making an Impact Through Art</strong> (기말 직보 요점정리)</p>
""" + card(
    "핵심 주제 (Main idea)",
    """
            <p><span class="fk-k">Main idea</span> Art can inspire people and create real-world impact by promoting wildlife conservation, raising awareness of social issues, and inspiring scientific innovation.</p>
            <p>세 가지 사례로 예술이 ① 영감을 주고 ② 실제 변화를 이끌 수 있음을 설명.</p>
            <ul>
              <li><span class="fk-mark">A–I</span> Art for Conservation — Sophie Green</li>
              <li><span class="fk-mark">J–N</span> Art as Activism — DRC(콩고) 예술가</li>
              <li><span class="fk-mark">O–V</span> Art for Science — Origami</li>
            </ul>""",
) + "\n" + card(
    "1) Art for Conservation — Sophie Green",
    """
            <ul>
              <li><strong>The Watcher</strong> — 아프리카 야생개 초상화; 동물이 관람자를 응시하는 듯한 친밀감</li>
              <li><strong>Impermanence: The Art of Conservation</strong> — 14점 전시; 극지동물 → 전 세계 종으로 확장</li>
              <li>아크릴 + 층층이 빠르게 쌓는 기법 → 3차원적 하이퍼리얼리즘</li>
              <li>성격: 창의적보다 <strong>analytical</strong>(분석적), 정확함 추구</li>
              <li><strong>impermanence</strong> 이중 의미 ① certain species &amp; ecosystems ② our problems (희망)</li>
            </ul>""",
) + "\n" + card(
    "2) Art as Activism — DRC (2001 Kinshasa)",
    """
            <ul>
              <li>2001년 킨샤사 미술학교 학생들의 반문화 운동 — 타이어·CD·플라스틱 등 <strong>폐기물</strong> 활용</li>
              <li><strong>3 wastes</strong>: ① 콩고 시민 쓰레기 ② 초소비국에서 버린 쓰레기 ③ 자원 착취로 인한 쓰레기</li>
            </ul>
""" + table_html([
        {"head": True, "cells": ["작품", "예술가", "재료", "메시지"]},
        {"cells": ["Robot Annonce", "Jared Kalenga", "라디오 부품", "가짜뉴스 확산 경고"]},
        {"cells": ["인물 조각", "Precy Numbi", "자동차 부품", "중고차 수입 비판"]},
        {"cells": ["Femme Électrique", "Falonne Mambu", "전선", "전력 부족 + 어둠 속 범죄"]},
    ]),
) + "\n" + card(
    "3) Art for Science — Origami",
    table_html([
        {"head": True, "cells": ["인물", "분야", "기여", "효과"]},
        {"cells": ["Akira Yoshizawa", "예술", "종이접기를 순수 예술로 발전", "생명감 있는 표현"]},
        {"cells": ["Tomoko Fuse", "예술", "모듈러 오리가미 개발", "복잡한 구조 가능"]},
        {"cells": ["Thomas Hull", "수학", "접기 패턴의 수학화", "구조 분석 가능"]},
        {"cells": ["Koryo Miura", "우주공학", "Miura-ori 개발", "1995 태양광 패널 접기"]},
        {"cells": ["Marc Miskin", "나노기술", "초소형 로봇 설계", "극소 환경에서도 작동"]},
    ]),
) + "\n" + card(
    "Preparing to Read · Revising Practice",
    """
            <p><span class="fk-k">Preparing to Read</span> Berndnaut Smilde — 건물 안 실제 구름 <em>Nimbus</em>; 수증기+미세입자; <strong>transience(덧없음)</strong>이 진정한 인상</p>
            <p><span class="fk-k">Revising Practice</span> Rostonville Library — Vitruvius 3원칙: <strong>durability · function · aesthetics</strong> (화강암, 개방형 설계, 구리 창틀, 자생 식물)</p>""",
)

# ── Unit 4 summary ──────────────────────────────────────────────────────────

U4_SUMMARY = """
          <p class="fk-lead">Pathways 4 Unit 4 · <strong>Green Air Travel</strong> by Sam Howe Verhovek</p>
""" + card(
    "문제 제기 [A–D]",
    """
            <p>비행의 즐거움 vs 환경 피해 — 항공여행이 지구 온난화에 최대 5% 기여</p>
            <p><strong>flygskam</strong> (flight shame, 스웨덴) — 비행 줄이기 운동</p>
            <p>프랑스: 2.5시간 이내 기차로 가능한 국내선 금지 / 영국: air miles·마일리지 제도 폐지 제안</p>""",
) + "\n" + card(
    "핵심 인물 6명",
    table_html([
        {"head": True, "cells": ["인물", "소속", "주장 요지"]},
        {"cells": ["Peter Kalmus", "NASA 기후과학자", "기후위기 인식 시 비행 중단 — 개인 행동 중 가장 해로움"]},
        {"cells": ["Sean Newsum", "Boeing", "비행은 필수 → 탄소 감축·기술 개선이 답"]},
        {"cells": ["Curt Studebaker", "Freedom Pines Biorefinery", "폐기물 기반 SAF — 기존 등유보다 더 깨끗함"]},
        {"cells": ["Paul Stein", "Rolls-Royce CTO", "SAF 대규모 확대·의무화 지지"]},
        {"cells": ["Gary Gysin", "Wisk CEO", "FAA 안전 기준 충족 후 자율 전기 에어택시"]},
        {"cells": ["Greg McDougall", "Harbour Air CEO", "전기 수상기 상용화 — 환경·경제 모두 유리"]},
    ]),
) + "\n" + card(
    "기업별 친환경 전략",
    table_html([
        {"head": True, "cells": ["회사", "전략", "연료/에너지", "특징"]},
        {"cells": ["Boeing", "SAF 지지·탈탄소화", "SAF(혼합)", "차세대 SAF 호환 엔진"]},
        {"cells": ["Rolls-Royce", "SAF 대규모 확대", "SAF", "UltraFan 엔진·SAF 완전 호환"]},
        {"cells": ["Airbus", "수소 기반 제로배출", "수소", "Maveric blended wing body"]},
        {"cells": ["Wisk", "전기 자율 공중택시", "전기", "Boeing·Kitty Hawk 자금 지원"]},
        {"cells": ["Harbour Air", "기존 수상기 전기화", "전기+수력", "60년 된 기종 레트로피팅"]},
    ]),
) + "\n" + card(
    "4가지 기술 전략 비교",
    table_html([
        {"head": True, "cells": ["기술", "장점", "단점", "대표 기업"]},
        {"cells": ["SAF", "가장 빠른 해결책·폐기물 활용", "2~6배 고가·0.1% 미만", "Boeing, Rolls-Royce"]},
        {"cells": ["Hydrogen", "배출물 수증기·제로배출", "화석연료 기반 생산·인프라 부족", "Airbus"]},
        {"cells": ["Electric", "탄소 무배출·비용 절감", "배터리 무게·단거리만", "Wisk, Harbour Air"]},
        {"cells": ["Blended Wing", "탄소 최대 40% 절감", "인증까지 수십 년", "Airbus(Maveric), Flying-V"]},
    ]),
) + "\n" + card(
    "Preparing to Read · Revising Practice",
    """
            <p><span class="fk-k">Preparing to Read</span> 교통 혼잡 → 대중교통 전환 (효율·환경·비용); 질 높은 대중교통 필요</p>
            <p><span class="fk-k">Revising Practice</span> Boeing vs Airbus — 자동화 철학·<strong>yoke</strong> vs <strong>sidestick</strong>·fly-by-wire</p>""",
)

# ── Grammar tab ─────────────────────────────────────────────────────────────

GRAMMAR = """
          <p class="fk-lead">Unit 3–4 문법·어휘 (기말 직보 요점정리)</p>
""" + card(
    "Initial Phrase — 3 types",
    """
            <p>문장 앞에 오는 구로 글의 리듬과 정보 순서를 바꿉니다. <strong>쉼표</strong>로 본문과 구분합니다. (Verbal phrase가 SQ 출제에 가장 좋음)</p>
            <table class="fk-compare">
              <tr><th>Type</th><th>Structure</th><th>Example</th></tr>
              <tr><td>Verbal phrase (분사구문)</td><td>to-V / V-ing / p.p.</td><td>Founded by Lee Byung-chul, Samsung was originally a trading company.</td></tr>
              <tr><td>Time phrase</td><td>When/In/After + time</td><td>In 2008, Tesla released its first car, the Tesla Roadster.</td></tr>
              <tr><td>Prepositional phrase</td><td>Preposition + object</td><td>Without Steve Wozniak's help, Steve Jobs might not have succeeded in creating Apple.</td></tr>
            </table>
            <p><span class="fk-k">Wright brothers passage</span> Raised in a supportive environment, … / Despite never having attended college, … / Working tirelessly, the pair eventually changed history.</p>
            <p><span class="fk-k">Tip</span> Initial phrase를 문장 끝으로 옮겨도 자연스러우면 initial phrase. Dangling modifier: 분사구문 주어 ≠ 주절 주어이면 오류.</p>""",
) + "\n" + card(
    "Boeing vs Airbus 정리",
    table_html([
        {"head": True, "cells": ["회사", "자동화 철학", "조종 장치"]},
        {"cells": ["Boeing", "최종 판단은 조종사 — human judgment 우선", "Yoke (고도 조절 핸들), 더 많은 감각 피드백"]},
        {"cells": ["Airbus", "자동화 핵심 — 위험 조작 시 override", "Sidestick (조이스틱), fly-by-wire로 업무 부담 감소"]},
    ]) + """
            <p><span class="fk-k">주의</span> Boeing도 자동화를 배척하지 않음 — exploitation ≠ rejection</p>""",
) + "\n" + card(
    "Unit 3 어휘",
    table_html([
        {"head": True, "cells": ["Word", "뜻", "Word", "뜻"]},
        {"cells": ["intimate", "친밀한", "beleaguered", "어려운 상황에 처한"]},
        {"cells": ["conservation", "보존", "analytical", "분석적인"]},
        {"cells": ["lend oneself to", "~에 적합하다", "ambiguous", "애매모호한"]},
        {"cells": ["egregious", "명백히 잘못된", "rapacious", "극도로 탐욕스러운"]},
        {"cells": ["be brimming/awash with", "~로 가득 차다", "dial up", "고조시키다"]},
        {"cells": ["acuity", "사고력·예리함", "fraught", "스트레스 유발하는"]},
        {"cells": ["modular", "모듈식의", "exquisite", "정교한·아름다운"]},
        {"cells": ["concentric", "동심원의", "venerable", "존경받는"]},
    ]),
) + "\n" + card(
    "Unit 4 어휘",
    table_html([
        {"head": True, "cells": ["Word / Phrase", "뜻", "Word / Phrase", "뜻"]},
        {"cells": ["begrudge", "못마땅해하다", "peg A as B", "A를 B로 규정하다"]},
        {"cells": ["flygskam", "비행 수치심", "a drop in the bucket", "새발의 피"]},
        {"cells": ["carbon footprint", "탄소 발자국", "gobble up", "게걸스럽게 먹다"]},
        {"cells": ["chicken-or-egg", "닭과 달걀 딜레마", "mandate", "의무화"]},
        {"cells": ["lend oneself to", "~에 적합하다", "upend", "완전히 뒤집다"]},
        {"cells": ["drag / lift", "항력 / 양력", "begs the question", "당연한 의문 제기"]},
        {"cells": ["to boot", "게다가", "retrofitting", "개조"]},
        {"cells": ["backlash", "반발", "swap out A for B", "A를 B로 교환"]},
    ]),
)

# ── Passage texts (Pathways 4 / National Geographic adapted) ─────────────────

MAKING_AN_IMPACT = [
    ("—", "Art has the power to inspire and effect change, as evidenced by these three examples."),
    ("A", "Stare into the eyes of The Watcher, British artist Sophie Green's portrait of an African wild dog, and you'll see there's something reflected. A triangular outline of a distant mountain perhaps, or maybe a termite mound on the savanna. Something the animal is looking at, in any case, that draws and locks your own gaze. And by the time it does, you realize that the animal is actually now looking at you."),
    ("B", "The effect is striking: a strangely intimate moment with one of the planet's most beleaguered mammals emerging from the shadows. But of course, it's not really an animal; just a very realistic painting of one."),
    ("C", "\"That's always been my aim,\" says Green. \"I want my artwork to be a window into another ecosystem. So people can feel they're face to face with the animal, rather than looking through a lens or at just another picture. Most people don't get that experience unless they go on a safari or an expedition. I kind of want my artwork to be that experience for them.\""),
    ("D", "Green's 14-piece exhibition—entitled Impermanence: The Art of Conservation—was initially envisioned to feature only polar animals, but Green says she quickly realized she was painting herself into a corner—conservation issues, human encroachment, and climate change affect animals all over the world, so she started to branch out. Hence images of balletic humpbacks, a great white shark, penguins, an African lion—and that African wild dog, amongst others."),
    ("E", "Green claims her art is not rooted in creativity. \"I'm quite detail-focused, it's just my personality type. I would say I'm more analytical. I prefer something to be exact and precise.\""),
    ("F", "She says she paints in acrylic and adds that it's an unusual medium in hyper-realism. \"It dries very quickly, but weirdly I prefer that,\" she says. \"The way I build depth is with layer after layer after layer, and I do it quickly. It creates more of a depth perception.\""),
    ("G", "This lends itself to the hyper-real quality of her exhibits. \"In watercolor, you work light to dark; you work dark to light in oil and acrylic. It's less a physical thing, more of a light perception. Light value on top of dark values kind of gives the impression of being in three dimensions.\""),
    ("H", "Green adds that hope is an embedded theme in her collections and is also the source of her collection's ambiguous title."),
    ("I", "\"The name impermanence is open to interpretation—it kind of implies the impermanence of certain species and ecosystems,\" she says. \"But it could also represent the impermanence of our problems. There's a dark side, but there can also be a light side.\""),
    ("J", "It started as a countercultural art movement in 2001. After years studying at the Academy of Fine Arts, Kinshasa—following teachers' advice on creating work with \"proper\" materials, such as resin and plaster of Paris—some students in the Democratic Republic of the Congo (DRC) decided to do something different. They created art with what was in their immediate environment, including tires, exhaust pipes, foam, plastic bottles, antennas, tins that had held milk or paint, feathers, CDs, rubber slippers, and other discarded items."),
    ("K", "This work, the artists believed, felt familiar to a Congolese audience and spoke to a particularly egregious aspect of Congolese life: waste. Waste generated locally by citizens. Waste dumped in the country by hyper-consumerist nations. Waste triggered by the endless extraction of resources from the DRC's earth, or the rapacious collection of the same above land."),
    ("L", "In Kinshasa, gutters are brimming with nonrecyclable plastic bottles. Markets are awash with second- and third-hand goods, castoffs from high-income countries. In areas where international companies mine for cobalt—a precious component of smartphone batteries—frequent discharges contaminate river systems and surrounding life. By repurposing waste to create sculpture and performance art, the artists wanted to dial up the public's acuity toward an ongoing emergency. Waste also provided the artists with an opening to comment on other fraught sociopolitical issues."),
    ("M", "Robot Annonce, for example, is a wearable sculpture by Jared Kalenga made of broken radio parts. It seeks to raise awareness about the ever-spreading reach of fake news. Precy Numbi's figure made out of automobile parts is a way of protesting the millions of \"garbage cars\" imported into Africa every year—secondhand vehicles that discourage the growth of the continent's own auto industry. And Femme Electrique, Falonne Mambu's creation made of electric wires, is double-edged. It speaks to the paucity of electric power service in the DRC and, simultaneously, what goes on in the dark: assaults and kidnappings. Mambu's inspiration for the work was drawn from periods in her life when she was homeless."),
    ("N", "These socially conscious creators who turn refuse into protest art \"are out here pushing limits,\" says Yvon Edoumou, founder of the Galerie Malabo in Kinshasa. \"We don't see a lot of that.\""),
    ("O", "The art of origami has existed in Japan since at least the 17th century. Initially, origami models were simple and used largely for ceremonial purposes. But in the mid-20th century, origami master Akira Yoshizawa helped elevate paper folding to a fine art, breathing life and personality into each creature he designed."),
    ("P", "In the late 1950s, Yoshizawa's delicate forms inspired Tomoko Fuse, now one of the foremost origami artists in Japan. Her father gave her Yoshizawa's second origami book when she was recovering from diphtheria as a child. Fuse methodically crafted every model, and she's been entranced with origami ever since. \"It's like magic,\" she says. \"Just one flat paper becomes something wonderful.\""),
    ("Q", "Among her many achievements, Fuse is famous for her advances in modular origami, which uses interlocking units to create models with greater flexibility and potential complexity. But she thinks of her work as less about creation than about discovering something that's already there. She describes her process as if she's watching from afar, following wherever the paper leads her. \"Suddenly, beautiful patterns come out.\""),
    ("R", "Indeed, origami taps into patterns that echo throughout the universe, seen in natural forms such as leaves emerging from a bud, or insects tucking their wings. For these exquisite folds to become scientifically useful, however, researchers must not only discover the patterns but also understand how they work. And that requires math."),
    ("S", "Putting numbers to origami's intriguing patterns has long driven the work of Thomas Hull, a mathematician at Western New England University in Springfield, Massachusetts. Hull still remembers unfolding a paper crane at age 10 and marveling at the ordered creases in the flat sheet. There are rules at play that allow this to work, he recalls thinking. Hull and others have spent decades working to understand the mathematics governing the world of origami."),
    ("T", "In his office are an array of models that are folded in intriguing shapes or move in unexpected ways. One is an impossible-looking sheet folded with ridges of concentric squares, which cause the paper to twist in an elegant swoop known as a hyperbolic paraboloid. Another is a sheet folded in a series of mountains and valleys called the Miura-ori pattern, which collapses or opens with a single tug. Dreamed up by astrophysicist Koryo Miura in the 1970s, the pattern was used to compact the solar panels of Japan's Space Flyer Unit, which launched in 1995."),
    ("U", "Origami is now pushing the limits of what scientists think is possible, particularly at the tiniest of scales. At the University of Pennsylvania's Singh Center for Nanotechnology, Marc Miskin, an electrical engineer, has been crafting an army of robots, each no bigger than a speck of dust. Such small bots require big creativity. At tiny scales, forces like friction are enormous: gears don't turn, wheels don't spin, and belts don't run. That's where origami comes in. Fold patterns will bend and move the same way at any size, at least theoretically."),
    ("V", "Miskin sees a world of possible ways these tiny bots could be used, from manufacturing to medicine. And the venerable art form of origami has provided him and other innovators with a new tool kit to ignite the imagination and create technologies once thought impossible."),
]

SMILDE_PREP = [
    ("1", "Many of the photos of Dutch artist Berndnaut Smilde are of clouds. However, these aren't normal clouds: they're clouds he made himself, inside of buildings. They don't last very long—some disappear after only 10 seconds—but they're definitely not fake: they're made of water vapor in the same way actual clouds are."),
    ("2", "Smilde's work is part of an ongoing art series called Nimbus. To create each of his pieces, he first has to find a dramatic architectural environment. He then fills the space with water vapor using a simple spray bottle before using a smoke machine to release tiny particles into the moisture-rich air. These particles trigger the formation of small clouds by providing the water vapor with airborne surfaces on which to condense. Once a cloud starts to form, he quickly sculpts it into shape. And when it is finally the right shape and size—usually about six feet tall and ten feet wide—he photographs it in the few seconds it exists, before it dissipates into the air. The end result is exquisite—a magical shot of a perfect cloud in a beautiful, seemingly impossible indoor setting."),
    ("3", "Smilde's work provides us with an intimate look at something that is typically only visible from a long distance away. He likes that his photos elicit strange and ambiguous feelings. However, the impression he most wants to evoke in his viewers is not the simple wonder of clouds appearing in unusual locations, but a feeling of transience—that his wispy creations exist only for a few seconds before they're gone. \"I'm not interested in trying to create something that lasts forever,\" he says. The art that Smilde makes disappears almost as soon as it is created, rooting each of his pieces not just in a place, but in a specific moment in time."),
]

ROSTONVILLE = [
    ("A", "What makes a building great? For many, aesthetics are most important. However, according to architect Marcus Vitruvius Pollio of ancient Rome, there are two more principles to consider: durability (how strong and long-lasting a structure is) and function (how well the structure serves its purpose). In my city, one building stands out for the way it satisfies all three criteria. The Rostonville Library is an example of great architecture because it is durable, functional, and aesthetically pleasing."),
    ("B", "The Rostonville Library is extremely durable because it is built primarily of granite, which is an extremely strong material. It is known to be resistant to the effects of both the environment and pollution. Granite structures are stable and resistant to vibrations too, so the Rostonville Library will likely be able to withstand earthquakes and other disasters. Because of the sturdy materials used to build the library, there is little doubt that the building will be able to stand the test of time."),
    ("C", "The Rostonville Library is also great at fulfilling its main function, which is to provide free access for members of the community to a variety of print and digital information. The library is designed to be easily accessible to all. The entire library is on one level, and it has an open design—there are no interior walls or dividers. In addition, large windows around the facility let in plenty of natural light, which makes reading and locating different sections within the library easy."),
    ("D", "Finally, the Rostonville Library is beautiful. Aesthetically pleasing details make it attractive, both inside and out. The large windows are framed in copper, which contrasts interestingly against the light gray color of the granite structure. An array of plants, which are all native to the area and allowed to grow freely, cascade down the sides of the building from a rooftop garden. These features soften the structure's lines and help it blend into its surroundings."),
    ("E", "Because of its durability, functionality, and beauty, the Rostonville Library is a great structure. By adhering to Vitruvius's principles, the building helps make its urban surroundings pleasant. It provides peace, comfort, and joy to the people who use it, and it will continue to do so for many years to come."),
]

GREEN_AIR_TRAVEL = [
    ("A", "As someone who loves to fly and never tires of looking at landmarks below, clouds alongside, or stars above, I can't begrudge anyone the joy of flight. At the same time, any journey in the skies warms the planet. Some experts peg air travel as the source of up to 5 percent of the human contribution to global warming today."),
    ("B", "That figure will likely climb as passenger and freight air traffic grows, and as other activities like land transportation and construction become more energy efficient. All this has led to a movement urging people not to fly or at least to fly a lot less, a campaign with a name that has caught on in Europe and is becoming familiar elsewhere: flygskam, a Swedish term best translated as \"flight shame.\""),
    ("C", "\"Hour for hour, there is just about nothing you as an individual can do that's worse for the health of the planet than to sit on an airplane,\" says Peter Kalmus, an astrophysicist turned NASA climate scientist who hasn't flown since 2012. \"The hard fact that most people haven't accepted yet is that we don't need to fly, and if you truly accept that we are in a climate emergency, you shouldn't fly.\""),
    ("D", "In July, France adopted a ban on all domestic air trips that can be made by train in less than two and a half hours. In the United Kingdom, the official Committee on Climate Change jolted the elite world of the most active fliers by proposing \"a ban on air miles and frequent flyer loyalty schemes that incentivize excessive flying.\""),
    ("E", "However, aviation leaders contend that shaming flight is not the answer—greening it is."),
    ("F", "\"Aviation is an essential part of the global economy, so our challenge is reducing emissions and decarbonizing aviation, not preventing people who want to travel from traveling,\" says Sean Newsum, the director of aviation sustainability strategy for Boeing. \"That's really our foundational belief as an industry at this point.\""),
    ("G", "Among the potential paths to green salvation for air travel, the quickest might be down a gravel road deep in the woods of central Georgia, leading to a hulking complex called the Freedom Pines Biorefinery. There I meet Curt Studebaker, a lanky, friendly young chemical engineer who is in the business of turning waste—all kinds of waste—into sustainable aviation fuel (SAF)."),
    ("H", "\"The amazing thing is, once you get it right, it's really a better fuel even than Jet A,\" the standard kerosene fuel in U.S. aviation, Studebaker tells me. \"It's actually cleaner.\""),
    ("I", "For now, SAFs are still blended with standard fuel. But they are cast as the giant first step toward shrinking aviation's carbon footprint. The challenges? First, it's very expensive. This alternative fuel costs two to six times more than kerosene, and although more flights are using SAFs, it all adds up to little more than a drop in the bucket—well under 0.1 percent of the 95 billion gallons of fuel the industry used in 2019. Second, the industry can't rely on the easiest, cheapest sources for conversion: crops. If fuel producers were to gobble up land and water more urgently needed for food, air travel would simply trade one environmental black eye for another."),
    ("J", "Proponents contend that if SAF production were built to the scale needed to serve the bulk of aviation needs, the price would drop precipitously, becoming competitive with kerosene. But getting to scale is a classic chicken-or-egg dilemma. Unless there's demand, supply won't grow; because the current supply is so small and costly, it's hard to stimulate demand. That's where the problem becomes political: the solution could be a carbon tax on kerosene or a requirement that SAFs account for a percentage of all aviation fuel."),
    ("K", "\"Basically, there has to be a humongous ramp-up to SAFs,\" says Paul Stein, chief technology officer of Rolls-Royce, the British manufacturer whose next-generation UltraFan, the biggest and one of the most efficient jet engines ever, is designed to use the alternative fuel. \"But industry is generally behind a SAF mandate. And certainly our position as a company is, yes! We need more SAFs. It would be a huge contribution to the planet.\""),
    ("L", "At Airbus headquarters in the south of France, there is a flying machine made of composite materials resembling no airliner that has ever taken to the skies, at least outside of science fiction movies or UFO sightings. The plane, known as Maveric, is a model aircraft with a 3.2-meter wingspan. For Airbus, Maveric's design could hold the answer to this intriguing question: Is there a more efficient—greener—way to design an airliner?"),
    ("M", "For all kinds of reasons, the modern aircraft manufacturing industry does not easily lend itself to the disruption that can so suddenly upend conventional thinking in other industries. A true game changer of an airliner will take many, many years to develop and more years to weather the gauntlet of safety tests involved in certification for commercial service."),
    ("N", "Yet the so-called blended wing body design employed by Maveric—although with major technical challenges to overcome—could yield as much as a 40 percent reduction in carbon emissions compared with today's planes. The main advantage of the streamlined design is that the entire aircraft functions much like a wing, reducing drag and making it much easier to generate lift. In the Netherlands, researchers at the Delft University of Technology used similar principles in designing Flying-V, an aircraft that looks very much like a boomerang."),
    ("O", "In 2020, Airbus went a step further and created a major stir in the industry by announcing it was working on a line of aircraft with a stunning capability: zero-emission flight. A Maveric variant and two smaller tube-and-wing airliners, it said, would operate on hydrogen fuel. The main by-product? Water vapor."),
    ("P", "As is true with electric automobiles, zero emission doesn't necessarily mean zero pollution. Just as it matters where the electricity comes from to charge the car's battery, Airbus's approach begs the question of how to create and store hydrogen fuel."),
    ("Q", "Most hydrogen used today comes from fossil fuels. But so-called green hydrogen, in which clean electricity is used to separate water into hydrogen and oxygen, is the holy grail. Advocates say that technological progress and scaling up will bring green hydrogen its day in the sky."),
    ("R", "In the central California farm town of Hollister, a stubby banana-yellow aerial vehicle with 13 rotors whirls around. It has no pilot."),
    ("S", "The self-flying electric plane may be an oddity today, but its inventors expect it to be a commonplace feature of tomorrow—the aerial taxi. As more than one evangelist for the urban air mobility industry puts it, \"Think: Uber meets Tesla in the sky.\""),
    ("T", "Their company, called Wisk, is just one of many aspiring entrants, although with major chops: It has financial backing from Boeing and Kitty Hawk, the aviation start-up founded by Google's Larry Page. Its vision is a world in which taking a flying taxi will be as easy and affordable as an automobile ride is today—and safer to boot."),
    ("U", "\"This is not the Wild West,\" Gary Gysin, Wisk's chief executive, tells me when I visit the company's hangar. \"We will absolutely meet the incredibly stringent safety standards already set for the aviation industry. We have to—nobody's flying anywhere until the FAA (the Federal Aviation Administration) says so.\""),
    ("V", "Just when this particular industry might take off is, well, up in the air. Gysin says the industry likely will start by shuttling people among airports and \"vertiports,\" which might be a landing pad atop a Manhattan apartment building, or a parking lot in a Los Angeles suburb."),
    ("W", "Just how strong a public backlash to the idea of air taxis there might be is hard to say. But electric-powered flight, while still severely limited by battery weight and capacity, is happening on another front. One intriguing approach is in British Columbia, Canada, where a commuter seaplane operator is retrofitting its workhorse fleet of 60-year-old de Havilland Beavers and Otters, swapping out gas-fired piston engines for electric motors."),
    ("X", "Greg McDougall, Harbour Air's founder and chief executive, piloted the December 2019 initial test run on the first such plane. \"We're proud to be the first airline in the world to offer completely clean electric flight, fueled by our province's sustainable hydropower,\" McDougall tells me. \"But I'm not doing this just because I'm some wild-eyed environmentalist hippie. I am a businessman. This is going to lower my costs, which is going to lower the cost of everyone's tickets.\""),
]

PUBLIC_TRANSPORT_PREP = [
    ("1", "Nobody likes a traffic jam. They lead to delays, disruptions, pollution, and stress. Unfortunately, congestion is a problem in most cities—the places with not just the most people, but the most people able to afford their own vehicles. Many cities don't have the capacity to handle all this traffic. Luckily, the solution is already at hand: People need to swap their cars for public transportation."),
    ("2", "Advocates of public transportation cite several benefits. It is more efficient than cars, requiring much less fuel per passenger. It reduces the number of cars in a city, which lowers air, noise, and even light pollution levels. Furthermore, it lowers stress levels—fighting for parking spaces, for example, becomes a thing of the past. Plus, it reduces the cost of living in cities."),
    ("3", "Clearly, though, most people still prefer driving over taking the bus or train. So what can we do to urge more people to embrace public transportation? The answer is simple: make it better. The sad reality is that public transportation is often underfunded and poorly planned. Vehicles are sometimes old and under-maintained. They don't run regularly enough, which results in excessive waiting times. And their routes often don't cover enough of the city to make them viable. It's important that public transportation officials work alongside city planners and invest sufficiently in solving these problems. It's worth noting that because public transportation is also a source of revenue, a good system ends up paying for itself."),
]

BOEING_AIRBUS = [
    ("A", "The airplane manufacturing industry is worth over US$400 billion, and two companies consistently lead the way in the sector. Boeing is an American company that was founded in 1916, while its European counterpart Airbus was founded in 1970 to compete with Boeing. While both companies specialize mainly in passenger aircraft and compete directly for clients, they are not exactly alike. They differ in terms of their attitudes toward automation, and in terms of how their airplane controls are designed to reflect these different attitudes."),
    ("B", "Both companies have very different attitudes toward automation. Airbus has long believed that automation should play a key role in piloting planes. However—as technology has progressed—Airbus's reliance on automation has increased so much that pilots today are actually limited by their planes' operating systems. If the aircraft deems a pilot's maneuver unsafe, it can override the pilot's decision. Whether this is good or bad is the subject of debate. Boeing believes that any final decision should rest in the hands of the pilot, not the plane. Although Boeing also exploits automation to a significant degree, it ultimately values human judgment over digital calculations—however sophisticated the chips and processors doing the math may be."),
    ("C", "Boeing's and Airbus's attitudes toward automation directly affect how their planes' controls are designed. While Boeing opts for a more traditional \"yoke\" (a steering wheel that can also be pulled and pushed to change altitude), Airbus prefers a simpler sidestick controller (similar to a video game joystick). There are advantages and disadvantages to each approach. Boeing's more manual controls require greater pilot engagement, while Airbus's controls are simpler and more automated. However, while Airbus's \"fly-by-wire\" system reduces pilot workload, many pilots actually prefer Boeing's controls as they allow more sensory feedback as the plane moves through the air."),
    ("D", "While these differences between Airbus and Boeing may seem striking, it is hard to tell the two companies apart in terms of the statistics that matter most. Both companies have similar safety records and fuel consumption rates, for example, and they're both similarly spacious and comfortable for passengers. Most importantly, both companies are steadfastly committed to innovation and development. As the industry continues to change and face new challenges, this can only be good for the healthy, ongoing competition that exists between these two firms, and that spurs them on to greater heights."),
]

U3_PASSAGES = (
    '          <p class="fk-passage-group">Main Reading</p>\n'
    + passage_block(
        "Making an Impact Through Art",
        MAKING_AN_IMPACT,
        "Pathways 4 Unit 3 · adapted from National Geographic",
    )
    + '\n          <p class="fk-passage-group">Preparing to Read</p>\n'
    + passage_block(
        "Berndnaut Smilde — Nimbus (indoor clouds)",
        SMILDE_PREP,
        "Pathways 4 Unit 3 · Preparing to Read",
    )
    + '\n          <p class="fk-passage-group">Revising Practice</p>\n'
    + passage_block(
        "Rostonville Library (Vitruvius principles)",
        ROSTONVILLE,
        "Pathways 4 Unit 3 · Revising Practice",
    )
)

U4_PASSAGES = (
    '          <p class="fk-passage-group">Main Reading</p>\n'
    + passage_block(
        "Green Air Travel",
        GREEN_AIR_TRAVEL,
        "Pathways 4 Unit 4 · Sam Howe Verhovek / National Geographic",
    )
    + '\n          <p class="fk-passage-group">Preparing to Read</p>\n'
    + passage_block(
        "Public Transportation vs Cars",
        PUBLIC_TRANSPORT_PREP,
        "Pathways 4 Unit 4 · Preparing to Read",
    )
    + '\n          <p class="fk-passage-group">Revising Practice</p>\n'
    + passage_block(
        "Boeing vs Airbus — automation philosophy",
        BOEING_AIRBUS,
        "Pathways 4 Unit 4 · Revising Practice",
    )
)


def build_html():
    tabs_html = "\n".join(tab_button(tid, label, small, i == 0) for i, (tid, label, small) in enumerate(TABS))
    panels_html = "\n\n".join(
        [
            panel("u3-summary", "Unit 3 · Making an Impact Through Art", U3_SUMMARY, first=True),
            panel("u3-passages", "Unit 3 · 지문 전문", U3_PASSAGES),
            panel("u4-summary", "Unit 4 · Green Air Travel", U4_SUMMARY),
            panel("u4-passages", "Unit 4 · 지문 전문", U4_PASSAGES),
            panel("grammar", "문법 · 어휘", GRAMMAR),
        ]
    )
    return f"""<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>영어 · 기말 대비</title>
  <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
  <link rel="stylesheet" href="site-theme.css" />
  <link rel="stylesheet" href="final-common.css" />
  <link rel="stylesheet" href="final-english.css" />
</head>
<body>
  <div class="shell">
    <nav class="site-nav">
      <a class="site-nav__link" href="index.html#final">&larr; 기말 대비 메인</a>
    </nav>
    <p class="page-eyebrow">민사 1-1 · 기말고사</p>
    <h1 class="app-title">영어 · 기말 대비</h1>
    <div class="page-card" id="feRoot">
      <div class="fk-mode-nav" id="feModeNav" role="tablist" aria-label="영어 기말 모드">
        <button type="button" class="fk-mode-nav__btn is-on" data-fe-view="concepts" role="tab" aria-selected="true">내용 정리</button>
        <button type="button" class="fk-mode-nav__btn" data-fe-view="mock" role="tab" aria-selected="false">직보 모의고사<small>객관식 15 · SQ/LQ</small></button>
      </div>
      <div id="feConcepts">
      <div class="fk-topnav-wrap">
        <div class="fk-topnav" id="feTopnav" role="tablist" aria-label="영어 기말 단원">
{tabs_html}
        </div>
      </div>
      <div id="fePanels">

{panels_html}

      </div>
      </div>
      <div id="feMockWrap" hidden>
        <div id="feMockApp"></div>
      </div>
    </div>
  </div>
  <div class="footer">제작자: 정해우</div>
  <link rel="stylesheet" href="bgm-player.css" />
  <script src="bgm-player.js" defer></script>
  <script src="final-english-app.js" charset="UTF-8" defer></script>
  <script src="fe-mock-quiz-data.js" charset="UTF-8"></script>
  <script src="final-english-quiz-app.js" charset="UTF-8"></script>
</body>
</html>
"""


def main():
    html = build_html()
    OUT.write_text(html, encoding="utf-8", newline="\r\n")
    lines = html.count("\n") + (0 if html.endswith("\n") else 1)
    print(f"Wrote {OUT.name} ({lines} lines)")


if __name__ == "__main__":
    main()
