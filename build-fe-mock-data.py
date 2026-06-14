# -*- coding: utf-8 -*-
"""Generate fe-mock-quiz-data.js from Unit 3-4 mock exam PDF."""
from pathlib import Path
import json

OUT = Path(__file__).resolve().parent / "fe-mock-quiz-data.js"

PASSAGES = {
    "p13": {
        "label": "[1-3] Sophie Green · The Watcher",
        "html": """<p>Stare into the eyes of The Watcher, British artist Sophie Green's portrait of an African wild dog, and you'll see there's something reflected. A triangular outline of a distant mountain perhaps, or maybe a termite mound on the savanna. Something the animal is looking at, in any case, that draws and locks your own gaze. And by the time it does, you realize that the animal is actually now looking at you.</p>
<p>The effect is striking: a strangely intimate moment with one of the planet's most beleaguered mammals emerging from the shadows. But of course, it's not really an animal; just a very realistic painting of one.</p>
<p>"That's always been my aim," says Green. "I want my artwork to be a window into another ecosystem. So people can feel they're face to face with the animal, rather than looking through a lens or at just another picture. Most people don't get that experience unless they go on a safari or an expedition. I kind of want my artwork to be that experience for them."</p>
<p>Green's 14-piece exhibition—entitled Impermanence: The Art of Conservation—was initially envisioned to feature only polar animals, but Green says she quickly realized she was painting herself into a corner—conservation issues, human encroachment, and climate change affect animals all over the world, so she started to branch out.</p>
<p>Green adds that hope is an embedded theme in her collections and is also the source of her collection's ambiguous title. "The name impermanence is open to interpretation—it kind of implies the impermanence of certain species and ecosystems," she says. "But it could also represent the impermanence of our problems. There's a dark side, but there can also be a light side."</p>""",
    },
    "p45": {
        "label": "[4-5] DRC Protest Art",
        "html": """<p>It started as a countercultural art movement in 2001. After years studying at the Academy of Fine Arts, Kinshasa—following teachers' advice on creating work with "proper" materials, such as resin and plaster of Paris—some students in the Democratic Republic of the Congo (DRC) decided to do something different. They created art with what was in their immediate environment, including tires, exhaust pipes, foam, plastic bottles, antennas, tins that had held milk or paint, feathers, CDs, rubber slippers, and other discarded items.</p>
<p>This work, the artists believed, felt familiar to a Congolese audience and spoke to a particularly egregious aspect of Congolese life: waste. Waste generated locally by citizens. Waste dumped in the country by hyper-consumerist nations. Waste triggered by the endless extraction of resources from the DRC's earth, or the rapacious collection of the same above land.</p>
<p>In Kinshasa, gutters are brimming with nonrecyclable plastic bottles. Markets are awash with second- and third-hand goods, castoffs from high-income countries. In areas where international companies mine for cobalt—a precious component of smartphone batteries—frequent discharges contaminate river systems and surrounding life. By repurposing waste to create sculpture and performance art, the artists wanted to dial up the public's acuity toward an ongoing emergency. Waste also provided the artists with an opening to comment on other fraught sociopolitical issues.</p>
<p>Robot Annonce, for example, is a wearable sculpture by Jared Kalenga made of broken radio parts. It seeks to raise awareness about the ever-spreading reach of fake news. Precy Numbi's figure made out of automobile parts is a way of protesting the millions of "garbage cars" imported into Africa every year—secondhand vehicles that discourage the growth of the continent's own auto industry. And Femme Électrique, Falonne Mambu's creation made of electric wires, is double-edged. It speaks to the paucity of electric power service in the DRC and, simultaneously, what goes on in the dark: assaults and kidnappings.</p>""",
    },
    "p67": {
        "label": "[6-7] Origami · Art & Science",
        "html": """<p>The art of origami has existed in Japan since at least the 17th century. Initially, origami models were simple and used largely for ceremonial purposes. But in the mid-20th century, origami master Akira Yoshizawa helped elevate paper folding to a fine art, breathing life and personality into each creature he designed.</p>
<p>Among her many achievements, Fuse is famous for her advances in modular origami, which uses interlocking units to create models with greater flexibility and potential complexity. But she thinks of her work as less about creation than about discovering something that's already there. She describes her process as if she's watching from afar, following wherever the paper leads her. "Suddenly, beautiful patterns come out."</p>
<p>Indeed, origami taps into patterns that echo throughout the universe, seen in natural forms such as leaves emerging from a bud, or insects tucking their wings. For these exquisite folds to become scientifically useful, however, researchers must not only discover the patterns but also understand how they work. And that requires math.</p>
<p>Origami is now pushing the limits of what scientists think is possible, particularly at the tiniest of scales. At the University of Pennsylvania's Singh Center for Nanotechnology, Marc Miskin, an electrical engineer, has been crafting an army of robots, each no bigger than a speck of dust. Such small bots require big creativity. At tiny scales, forces like friction are enormous: gears don't turn, wheels don't spin, and belts don't run. That's where origami comes in. Fold patterns will bend and move the same way at any size, at least theoretically.</p>""",
    },
    "p810": {
        "label": "[8-10] Green Air Travel · flygskam & SAF",
        "html": """<p>As someone who loves to fly and never tires of looking at landmarks below, clouds alongside, or stars above, I can't begrudge anyone the joy of flight. At the same time, any journey in the skies warms the planet. Some experts peg air travel as the source of up to 5 percent of the human contribution to global warming today.</p>
<p>That figure will likely climb as passenger and freight air traffic grows, and as other activities like land transportation and construction become more energy efficient. All this has led to a movement urging people not to fly or at least to fly a lot less, a campaign with a name that has caught on in Europe and is becoming familiar elsewhere: flygskam, a Swedish term best translated as "flight shame."</p>
<p>"Hour for hour, there is just about nothing you as an individual can do that's worse for the health of the planet than to sit on an airplane," says Peter Kalmus, an astrophysicist turned NASA climate scientist who hasn't flown since 2012. "The hard fact that most people haven't accepted yet is that we don't need to fly, and if you truly accept that we are in a climate emergency, you shouldn't fly."</p>
<p>However, aviation leaders contend that shaming flight is not the answer—greening it is.</p>
<p>"Aviation is an essential part of the global economy, so our challenge is reducing emissions and decarbonizing aviation, not preventing people who want to travel from traveling," says Sean Newsum, the director of aviation sustainability strategy for Boeing. "That's really our foundational belief as an industry at this point."</p>
<p>For now, SAFs are still blended with standard fuel. But they are cast as the giant first step toward shrinking aviation's carbon footprint. The challenges? First, it's very expensive. This alternative fuel costs two to six times more than kerosene, and although more flights are using SAFs, it all adds up to little more than a drop in the bucket—well under 0.1 percent of the 95 billion gallons of fuel the industry used in 2019.</p>
<p>Proponents contend that if SAF production were built to the scale needed to serve the bulk of aviation needs, the price would drop precipitously, becoming competitive with kerosene. But getting to scale is a classic chicken-or-egg dilemma. Unless there's demand, supply won't grow; but because the current supply is so small and costly, it's hard to stimulate demand.</p>""",
    },
    "p1113": {
        "label": "[11-13] Maveric · Hydrogen · Electric",
        "html": """<p>At Airbus headquarters in the south of France, there is a flying machine made of composite materials resembling no airliner that has ever taken to the skies, at least outside of science fiction movies or UFO sightings. The plane, known as Maveric, is a model aircraft with a 3.2-meter wingspan. For Airbus, Maveric's design could hold the answer to this intriguing question: Is there a more efficient—greener—way to design an airliner?</p>
<p>For all kinds of reasons, the modern aircraft manufacturing industry does not easily lend itself to the disruption that can so suddenly upend conventional thinking in other industries. A true game changer of an airliner will take many, many years to develop and more years to weather the gauntlet of safety tests involved in certification for commercial service.</p>
<p>Yet the so-called blended wing body design employed by Maveric—although with major technical challenges to overcome—could yield as much as a 40 percent reduction in carbon emissions compared with today's planes. The main advantage of the streamlined design is that the entire aircraft functions much like a wing, reducing drag and making it much easier to generate lift.</p>
<p>In 2020, Airbus went a step further and created a major stir in the industry by announcing it was working on a line of aircraft with a stunning capability: zero-emission flight. A Maveric variant and two smaller tube-and-wing airliners, it said, would operate on hydrogen fuel. The main by-product? Water vapor.</p>
<p>As is true with electric automobiles, zero emission doesn't necessarily mean zero pollution. Just as it matters where the electricity comes from to charge the car's battery, Airbus's approach begs the question of how to create and store hydrogen fuel.</p>
<p>Most hydrogen used today comes from fossil fuels. But so-called green hydrogen, in which clean electricity is used to separate water into hydrogen and oxygen, is the holy grail. Advocates say that technological progress and scaling up will bring green hydrogen its day in the sky.</p>
<p>Just how strong a public backlash to the idea of air taxis there might be is hard to say. But electric-powered flight, while still severely limited by battery weight and capacity, is happening on another front. One intriguing approach is in British Columbia, Canada, where a commuter seaplane operator is retrofitting its workhorse fleet of 60-year-old de Havilland Beavers and Otters, swapping out gas-fired piston engines for electric motors.</p>""",
    },
    "p1415": {
        "label": "[14-15] Boeing vs Airbus",
        "html": """<p>Boeing and Airbus differ in terms of history and background, their attitudes toward automation, and how their pilot controls reflect these different attitudes.</p>
<p>Both companies have different attitudes toward automation. Both rely heavily on automation, but … Boeing: In an emergency, pilot makes the final decision. Airbus: In an emergency, computers can override pilot decisions.</p>
<p>Boeing's and Airbus's attitudes toward automation affect how their pilot controls are designed. Boeing: "Yoke" is more manual and demanding, but more engaging and customizable. Airbus: "Joystick" and fly-by-wire system is simpler, but pilot gets less sensory feedback.</p>
<p>While Boeing opts for a more traditional "yoke" (a steering wheel that can also be pulled and pushed to change altitude), Airbus prefers a simpler sidestick controller (similar to a video game joystick). Boeing's more manual controls require greater pilot engagement, while Airbus's controls are simpler and more automated. Although, while Airbus's "fly-by-wire" system reduces pilot workload, many pilots actually prefer Boeing's controls as they allow more sensory feedback as the plane moves through the air.</p>""",
    },
}

QUIZ = [
    {
        "id": 1,
        "passage": "p13",
        "cat": "[1-3] Sophie Green",
        "q": "Which choice best explains the function of the opening description of The Watcher?",
        "opts": [
            "① It introduces Green's technical precision before the passage turns away from conservation.",
            "② It suggests that realistic paintings can fully replace direct encounters with ecosystems.",
            "③ It turns the viewer's act of looking into a face-to-face experience that supports Green's artistic aim.",
            "④ It uses the reflected landscape to shift the passage from animal conservation to geographic detail.",
        ],
        "a": "③ It turns the viewer's act of looking into a face-to-face experience that supports Green's artistic aim.",
        "ex": "첫 문단은 관람자가 동물을 바라보다가 오히려 마주 보는 듯한 경험을 하게 되는 과정을 보여 줍니다. 이는 Green이 말한 “window into another ecosystem”이라는 목표와 연결되므로 ③이 정답입니다.",
    },
    {
        "id": 2,
        "passage": "p13",
        "cat": "[1-3] Sophie Green",
        "q": "Which of the following CANNOT be inferred from the passage?",
        "opts": [
            "① Green's exhibition eventually moved beyond its first planned focus.",
            "② The title Impermanence is intentionally open to more than one interpretation.",
            "③ Green's art tries to replace real ecosystems with more accurate painted ones.",
            "④ The painting creates the effect that the animal is returning the viewer's gaze.",
        ],
        "a": "③ Green's art tries to replace real ecosystems with more accurate painted ones.",
        "ex": "작품은 관람자가 다른 생태계를 간접적으로 경험하게 하지만, Green의 그림이 실제 생태계를 더 정확하게 대체한다고 말하지는 않습니다. 따라서 ③은 추론할 수 없습니다.",
    },
    {
        "id": 3,
        "passage": "p13",
        "cat": "[1-3] Sophie Green",
        "q": "Which sentence correctly uses a nonrestrictive relative clause based on the passage?",
        "opts": [
            "① The Watcher that shows an African wild dog, creates an intense exchange of gazes.",
            "② The Watcher, which shows an African wild dog, creates an intense exchange of gazes.",
            "③ The Watcher, that shows an African wild dog, creates an intense exchange of gazes.",
            "④ The Watcher which shows an African wild dog creates, an intense exchange of gazes.",
        ],
        "a": "② The Watcher, which shows an African wild dog, creates an intense exchange of gazes.",
        "ex": "The Watcher는 특정 작품명이므로 부가 설명에는 비제한적 관계절이 필요합니다. comma + which를 써야 하므로 ②가 맞습니다.",
    },
    {
        "id": 4,
        "passage": "p45",
        "cat": "[4-5] DRC Art",
        "q": "Why is the artists' use of discarded materials presented as more than a practical choice?",
        "opts": [
            "① The materials let the artists imitate \"proper\" art materials while hiding their social origins.",
            "② The materials are familiar local objects that also expose waste, imports, and resource extraction.",
            "③ The materials make the works easier for Congolese audiences to recognize, but less political.",
            "④ The materials move the focus away from Congolese conditions toward general recycling aesthetics.",
        ],
        "a": "② The materials are familiar local objects that also expose waste, imports, and resource extraction.",
        "ex": "버려진 물건들이 단순 재료가 아니라 지역 쓰레기·수입 폐기물·자원 채굴 문제를 드러내는 장치라고 설명합니다. ②가 정답입니다.",
    },
    {
        "id": 5,
        "passage": "p45",
        "cat": "[4-5] DRC Art",
        "q": "Which of the following is the LEAST appropriate association?",
        "opts": [
            "① Robot Annonce - broken radio parts - fake news",
            "② Femme Electrique - electric wires - power shortage and violence",
            "③ discarded objects - local and global waste problems - public visibility",
            "④ proper materials - imported castoffs - stronger criticism of resource extraction",
        ],
        "a": "④ proper materials - imported castoffs - stronger criticism of resource extraction",
        "ex": "작가들은 resin·plaster 같은 'proper materials'를 거부했습니다. 수입 폐기물·자원 착취는 버려진 물건과 연결되므로 ④의 연결이 가장 부적절합니다.",
    },
    {
        "id": 6,
        "passage": "p67",
        "cat": "[6-7] Origami",
        "q": "Which statement best captures the passage's movement from art toward science?",
        "opts": [
            "① Origami becomes scientific only after its ceremonial and artistic purposes disappear.",
            "② Origami is presented mainly as a Japanese tradition preserved apart from modern technology.",
            "③ Origami moves from simple ceremonial models and fine art to patterned forms that can inform science and tiny-scale technology.",
            "④ Origami's mathematical rules are shown to limit the flexibility that artists such as Fuse value.",
        ],
        "a": "③ Origami moves from simple ceremonial models and fine art to patterned forms that can inform science and tiny-scale technology.",
        "ex": "의례적 목적 → fine art → modular origami·수학 → tiny-scale technology로 이어지는 흐름을 ③이 가장 정확히 설명합니다.",
    },
    {
        "id": 7,
        "passage": "p67",
        "cat": "[6-7] Origami",
        "q": "Why do fold patterns matter in the discussion of tiny-scale technology?",
        "opts": [
            "① They make tiny robots powerful enough to use ordinary gears, wheels, and belts despite friction.",
            "② They show that conventional mechanical parts become more efficient as machines get smaller.",
            "③ They remove the need for scientists to understand the mathematics behind origami patterns.",
            "④ They offer a way of producing predictable movement where ordinary mechanical parts may fail.",
        ],
        "a": "④ They offer a way of producing predictable movement where ordinary mechanical parts may fail.",
        "ex": "tiny scales에서 friction이 커져 gears·wheels·belts가 작동하기 어렵지만, fold patterns는 크기와 관계없이 움직일 수 있으므로 ④가 정답입니다.",
    },
    {
        "id": 8,
        "passage": "p810",
        "cat": "[8-10] flygskam & SAF",
        "q": "Which choice best describes the contrast developed before the SAF discussion?",
        "opts": [
            "① The passage presents flygskam as a social pressure, then shows aviation leaders redirecting the issue toward decarbonization.",
            "② The passage treats Kalmus's argument and Newsum's response as two versions of the same anti-travel position.",
            "③ The passage suggests that policy limits on flying matter less than the personal pleasure of flight.",
            "④ The passage frames SAF as a response to frequent-flyer rewards rather than to aviation emissions.",
        ],
        "a": "① The passage presents flygskam as a social pressure, then shows aviation leaders redirecting the issue toward decarbonization.",
        "ex": "flygskam·Kalmus의 비행 줄이기 압력 vs Newsum의 decarbonizing aviation으로 돌리는 업계 입장 대비를 ①이 가장 정확히 설명합니다.",
    },
    {
        "id": 9,
        "passage": "p810",
        "cat": "[8-10] flygskam & SAF",
        "q": "Which choice best explains why SAF remains a limited solution in the passage?",
        "opts": [
            "① SAF is already widely used, but it depends too heavily on crop-based fuel sources.",
            "② SAF has promise, but its high cost, tiny current share, and scaling problem limit its immediate effect.",
            "③ SAF is cleaner than Jet A only when airlines stop blending it with standard fuel.",
            "④ SAF cannot be used until the aviation industry replaces current aircraft with new engine designs.",
        ],
        "a": "② SAF has promise, but its high cost, tiny current share, and scaling problem limit its immediate effect.",
        "ex": "SAF는 유망하지만 가격이 높고 사용량이 0.1% 미만이며 scaling 문제가 있으므로 ②가 정답입니다.",
    },
    {
        "id": 10,
        "passage": "p810",
        "cat": "[8-10] flygskam & SAF",
        "q": "What is the \"chicken-or-egg dilemma\" in the SAF discussion?",
        "opts": [
            "① Airlines need mandates because passenger demand for SAF already exceeds the available supply.",
            "② SAF producers can expand quickly, but passengers refuse to fly on aircraft using alternative fuel.",
            "③ Supply needs demand to grow, but demand is difficult to create while supply is small and costly.",
            "④ Crop-based fuels are the only possible SAF source, so aviation demand must fall before supply can exist.",
        ],
        "a": "③ Supply needs demand to grow, but demand is difficult to create while supply is small and costly.",
        "ex": "Unless there's demand, supply won't grow — 그러나 공급이 작고 비싸 수요를 만들기 어렵다는 구조이므로 ③이 정답입니다.",
    },
    {
        "id": 11,
        "passage": "p1113",
        "cat": "[11-13] Airbus & Electric",
        "q": "Which of the following is TRUE about the blended wing body design in the passage?",
        "opts": [
            "① It is already the standard design for all commercial passenger planes.",
            "② It is less efficient because it increases drag and reduces lift.",
            "③ It was introduced mainly to replace SAF in current engines immediately.",
            "④ It may reduce emissions, but certification and development make it a long-term possibility.",
        ],
        "a": "④ It may reduce emissions, but certification and development make it a long-term possibility.",
        "ex": "배출 감소 가능성은 있지만 개발·안전 인증에 오랜 시간이 걸리므로 장기 가능성에 가깝습니다.",
    },
    {
        "id": 12,
        "passage": "p1113",
        "cat": "[11-13] Airbus & Electric",
        "q": "Why does the passage complicate Airbus's claim about zero-emission hydrogen flight?",
        "opts": [
            "① Water vapor becomes the main pollutant when hydrogen-powered aircraft fly commercially.",
            "② Hydrogen is green only if it is blended with electricity stored in aircraft batteries.",
            "③ Airbus can make hydrogen aircraft zero-emission only by using the Maveric body design.",
            "④ The aircraft may release only water vapor, but producing the hydrogen may still depend on fossil fuels.",
        ],
        "a": "④ The aircraft may release only water vapor, but producing the hydrogen may still depend on fossil fuels.",
        "ex": "zero emission ≠ zero pollution. 현재 대부분의 hydrogen은 fossil fuels에서 나오므로 ④가 정답입니다.",
    },
    {
        "id": 13,
        "passage": "p1113",
        "cat": "[11-13] Airbus & Electric",
        "q": "Which pair is the MOST appropriate according to the passage?",
        "opts": [
            "① hydrogen fuel - already green because it always comes from clean electricity",
            "② Maveric - an immediate replacement for every existing aircraft",
            "③ electric seaplanes - promising in limited contexts but restricted by battery capacity",
            "④ air taxis - free from public safety concerns because they are small",
        ],
        "a": "③ electric seaplanes - promising in limited contexts but restricted by battery capacity",
        "ex": "전기 비행은 제한적 형태로 실험되지만 배터리 무게·용량 한계가 있으므로 ③이 정답입니다.",
    },
    {
        "id": 14,
        "passage": "p1415",
        "cat": "[14-15] Boeing vs Airbus",
        "q": "Which sentence would be the best topic sentence for a body paragraph about control systems?",
        "opts": [
            "① Boeing was founded earlier than Airbus, so it is always safer in every situation.",
            "② Boeing's and Airbus's views on automation are reflected in the different ways their pilots control aircraft.",
            "③ Both companies manufacture commercial aircraft and compete for similar clients.",
            "④ Aircraft companies should stop using automation because pilots dislike technology.",
        ],
        "a": "② Boeing's and Airbus's views on automation are reflected in the different ways their pilots control aircraft.",
        "ex": "control systems를 automation 철학 차이와 연결하는 ②가 본문 단락 주제문으로 가장 적절합니다.",
    },
    {
        "id": 15,
        "passage": "p1415",
        "cat": "[14-15] Boeing vs Airbus",
        "q": "Which of the following is NOT grammatically acceptable as a sentence with an initial phrase?",
        "opts": [
            "① Founded in Europe in 1970, Airbus became Boeing's major competitor.",
            "② In an emergency, Boeing expects the pilot to make the final decision.",
            "③ With a fly-by-wire system, Airbus can reduce pilot workload.",
            "④ Trusting automated systems, unsafe pilot inputs can be overridden by Airbus aircraft.",
        ],
        "a": "④ Trusting automated systems, unsafe pilot inputs can be overridden by Airbus aircraft.",
        "ex": "Trusting automated systems의 의미상 주어는 Airbus/항공기 시스템이어야 하는데 unsafe pilot inputs가 주어처럼 읽히므로 dangling modifier 오류입니다.",
    },
]

WRITTEN = [
    {
        "id": "SQ1",
        "type": "SQ",
        "prompt": "Combine the two sentences into one sentence using a nonrestrictive relative clause. Use correct punctuation.\n<Sophie Green paints endangered animals.>\n<Her paintings create a feeling of direct contact.>",
        "answer": "Sophie Green, whose paintings create a feeling of direct contact, paints endangered animals.",
        "ex": "Sophie Green은 특정 인물이므로 whose + comma로 비제한적 관계절을 씁니다.",
    },
    {
        "id": "SQ2",
        "type": "SQ",
        "prompt": "Combine the two sentences by beginning with a time phrase.\n<Airbus announced a line of hydrogen-powered aircraft in 2020.> , <It created a major stir in the industry.>",
        "answer": "In 2020, Airbus announced a line of hydrogen-powered aircraft, creating a major stir in the industry.",
        "ex": "In 2020 time phrase로 시작하고, 발표가 업계에 큰 반향을 일으켰다는 결과를 연결합니다.",
    },
    {
        "id": "SQ3",
        "type": "SQ",
        "prompt": "Correct the dangling modifier by making the subject logically match the initial phrase.\nHoping to make air travel greener, a new SAF facility is being tested.",
        "answer": "Hoping to make air travel greener, researchers are testing a new SAF facility.",
        "ex": "시설 자체는 hoping의 주체가 될 수 없습니다. initial phrase 뒤에 실제 행위 주체가 와야 합니다.",
    },
    {
        "id": "SQ4",
        "type": "SQ",
        "prompt": "Write one topic sentence for a body paragraph about controls.\nThesis: Boeing and Airbus differ in their attitudes toward automation and in how their controls reflect those attitudes.\nNotes: Boeing - pilot final decision / yoke / more feedback; Airbus - automation can override pilot / sidestick / less sensory feedback.",
        "answer": "Boeing's and Airbus's different attitudes toward automation are reflected in the way their control systems are designed.",
        "ex": "controls 단락 주제를 thesis의 automation 태도 차이와 연결하는 주제문입니다.",
    },
    {
        "id": "SQ5",
        "type": "SQ",
        "prompt": "Explain the phrase in context in one complete sentence.\nIn the SAF discussion, current use is described as little more than a drop in the bucket.",
        "answer": "It means that SAF's current contribution is still too small to have a major effect on aviation emissions.",
        "ex": "현재 SAF 사용 비중이 너무 작아 전체 항공 배출에 큰 영향을 주기 어렵다는 뜻입니다.",
    },
    {
        "id": "LQ1",
        "type": "LQ",
        "prompt": "Do you think art is more powerful when it creates emotional connection or when it has practical usefulness? Use at least one example from the Unit 3 art passages above and your own reasoning. Write one complete paragraph of at least five complete sentences. Do not quote more than five consecutive words from the passage.",
        "answer": "I think art is most powerful when it creates emotional connection, although practical usefulness can also be important. Sophie Green's animal paintings matter because they make viewers feel close to endangered animals they may never meet. That emotional closeness can make conservation feel personal instead of abstract. Origami's scientific uses are impressive, but they may be harder for ordinary viewers to understand immediately. In society, campaign posters or public artworks often change people's behavior because they make problems visible and memorable. Therefore, practical results are valuable, but emotional connection is often the first step that makes people care enough to act.",
        "ex": "감정적 연결 vs 실용성 — Unit 3 예시 + 5문장 이상 영작.",
    },
    {
        "id": "LQ2",
        "type": "LQ",
        "prompt": "Should people reduce flying, or should the aviation industry focus mainly on making flight greener? Use at least one example from the Unit 4 aviation passages above and your own reasoning. Write one complete paragraph of at least five complete sentences. Do not quote more than five consecutive words from the passage.",
        "answer": "I think both are necessary, but the aviation industry must focus strongly on making flight greener. People can reduce unnecessary flights, especially when a train or other reasonable option exists. However, the passage shows that aviation is also tied to travel, business, and global movement, so simply shaming all flight is not realistic. SAF can work with existing aircraft, and hydrogen or better designs may help in the long term, but each solution still has limits. Because of those limits, individuals should avoid wasteful flying while governments and companies push cleaner technology faster. A balanced approach is more realistic than choosing only behavior change or only innovation.",
        "ex": "비행 줄이기 vs 친환경 항공 — Unit 4 예시 + 균형 잡힌 입장.",
    },
    {
        "id": "LQ3",
        "type": "LQ",
        "prompt": "Compare one example from the Unit 3 art passages above and one solution from the Unit 4 aviation passages above. Which one seems more likely to change people's behavior, and why? Write one complete paragraph of at least five complete sentences. Do not quote more than five consecutive words from the passage.",
        "answer": "The DRC protest art seems more likely to change ordinary people's behavior than hydrogen aircraft in the short term. The protest artists use discarded objects, so viewers can immediately see the waste problem in the artwork itself. That direct visual shock may make people think about consumption, imports, and social responsibility. Hydrogen aircraft could reduce emissions in the future, but the passage explains that hydrogen is green only if it is produced with clean electricity. Because that solution depends on infrastructure and industry decisions, individuals may feel distant from it. For changing behavior quickly, art that makes a problem visible can be more direct than a technology that is still developing.",
        "ex": "Unit 3 예술 vs Unit 4 기술 — 행동 변화 가능성 비교.",
    },
]


def js_str(s):
    return json.dumps(s, ensure_ascii=False)


def main():
    lines = [
        "/**",
        " * Unit 3-4 직보모의고사 Ver3 — [민사1] Unit3,4 최종직보모의고사",
        " * 객관식 15 · SQ 5 · LQ 3",
        " */",
        "const FE_MOCK_PASSAGES = {",
    ]
    for key, val in PASSAGES.items():
        lines.append(f"  {js_str(key)}: {{")
        lines.append(f"    label: {js_str(val['label'])},")
        lines.append(f"    html: {js_str(val['html'])}")
        lines.append("  },")
    lines.append("};")
    lines.append("")
    lines.append(f"const FE_MOCK_QUIZ = {json.dumps(QUIZ, ensure_ascii=False, indent=2)};")
    lines.append("")
    lines.append(f"const FE_MOCK_WRITTEN = {json.dumps(WRITTEN, ensure_ascii=False, indent=2)};")
    lines.append("")
    OUT.write_text("\n".join(lines) + "\n", encoding="utf-8", newline="\r\n")
    print(f"Wrote {OUT.name}")


if __name__ == "__main__":
    main()
