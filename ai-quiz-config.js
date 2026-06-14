/**
 * AI 퀴즈 — Render API 주소 (배포 후 여기만 수정)
 * 예: https://test-quiz.onrender.com
 */
(function (global) {
  var BUILTIN_API_BASE = "";

  var PRESETS = {
    programming: {
      label: "프로그래밍 기초",
      countDefault: 5,
      topicPlaceholder: "예: for문, 배열, Scanner",
      system:
        "당신은 고등학교 프로그래밍 기초(Java) 시험 대비 문제 출제자입니다. " +
        "학생 수준에 맞는 객관식 4지선다만 만듭니다. 정답은 반드시 opts 중 하나와 완전히 동일한 문자열이어야 합니다.",
      userTemplate:
        "주제: {{topic}}\n문항 수: {{count}}\n\n" +
        "아래 JSON만 출력하세요. 다른 설명은 금지합니다.\n" +
        '{"items":[{"cat":"단원명","q":"문제","opts":["선지1","선지2","선지3","선지4"],"a":"정답 선지와 동일","ex":"한 줄 해설"}]}'
    },
    korean_mcq: {
      label: "국어 객관식",
      countDefault: 5,
      topicPlaceholder: "예: 윈셋, 협상, 토론 규칙",
      system:
        "당신은 고등학교 국어(화법과 작문·독서) 객관식 문제 출제자입니다. " +
        "4지선다 문제를 만듭니다. 정답 문자열은 opts 중 하나와 완전히 같아야 합니다.",
      userTemplate:
        "주제: {{topic}}\n문항 수: {{count}}\n\n" +
        '{"items":[{"cat":"주제","q":"문제","opts":["① ...","② ...","③ ...","④ ..."],"a":"정답 선지 전체","ex":"해설"}]}'
    },
    social: {
      label: "통합사회",
      countDefault: 5,
      topicPlaceholder: "예: 인권, 시장경제, 문화 다양성",
      system:
        "당신은 고등학교 통합사회 객관식 문제 출제자입니다. " +
        "교과 개념을 묻는 4지선다를 만듭니다.",
      userTemplate:
        "주제: {{topic}}\n문항 수: {{count}}\n\n" +
        '{"items":[{"cat":"주제","q":"문제","opts":["선지1","선지2","선지3","선지4"],"a":"정답","ex":"해설"}]}'
    },
    science: {
      label: "통합과학",
      countDefault: 5,
      topicPlaceholder: "예: 세포, 유전, 생태계",
      system: "당신은 고등학교 통합과학(생물) 객관식 문제 출제자입니다.",
      userTemplate:
        "주제: {{topic}}\n문항 수: {{count}}\n\n" +
        '{"items":[{"cat":"단원","q":"문제","opts":["선지1","선지2","선지3","선지4"],"a":"정답","ex":"해설"}]}'
    },
    generic: {
      label: "일반 객관식",
      countDefault: 5,
      topicPlaceholder: "과목·단원·키워드",
      system: "당신은 학습용 객관식 퀴즈 출제자입니다. 4지선다 문제를 만듭니다.",
      userTemplate:
        "주제: {{topic}}\n문항 수: {{count}}\n\n" +
        '{"items":[{"cat":"분류","q":"문제","opts":["선지1","선지2","선지3","선지4"],"a":"정답","ex":"해설"}]}'
    },
    history: {
      label: "역사",
      countDefault: 5,
      topicPlaceholder: "예: 고려 건국, 무신정변, 세도정치",
      system:
        "당신은 고등학교 한국사 객관식 문제 출제자입니다. 사실 관계를 묻는 4지선다를 만듭니다.",
      userTemplate:
        "주제: {{topic}}\n문항 수: {{count}}\n\n" +
        '{"items":[{"cat":"시대","q":"문제","opts":["선지1","선지2","선지3","선지4"],"a":"정답","ex":"해설"}]}'
    },
    economics: {
      label: "경제",
      countDefault: 5,
      topicPlaceholder: "예: 기회비용, 수요·공급, 시장실패",
      system: "당신은 고등학교 경제 객관식 문제 출제자입니다.",
      userTemplate:
        "주제: {{topic}}\n문항 수: {{count}}\n\n" +
        '{"items":[{"cat":"단원","q":"문제","opts":["선지1","선지2","선지3","선지4"],"a":"정답","ex":"해설"}]}'
    },
    english: {
      label: "영어",
      countDefault: 5,
      topicPlaceholder: "예: conservation, aviation, 문법",
      system:
        "당신은 고등학교 영어 독해·문법 객관식 문제 출제자입니다. 지문 없이 짧은 문제 또는 한 문장 지문으로 4지선다를 만듭니다.",
      userTemplate:
        "주제: {{topic}}\n문항 수: {{count}}\n\n" +
        '{"items":[{"cat":"Unit","q":"문제","opts":["① ...","② ...","③ ...","④ ..."],"a":"정답 선지 전체","ex":"해설"}]}'
    },
    grammar: {
      label: "국어 문법",
      countDefault: 5,
      topicPlaceholder: "예: 조사, 높임법, 중세국어",
      system: "당신은 고등학교 국어 문법 객관식 문제 출제자입니다.",
      userTemplate:
        "주제: {{topic}}\n문항 수: {{count}}\n\n" +
        '{"items":[{"cat":"문법","q":"문제","opts":["선지1","선지2","선지3","선지4"],"a":"정답","ex":"해설"}]}'
    },
    chinese: {
      label: "중국어",
      countDefault: 5,
      topicPlaceholder: "예: HSK 1급 어휘, 성조, 문법",
      system:
        "당신은 중국어 학습용 객관식 문제 출제자입니다. 한국어로 문제와 선지를 작성합니다.",
      userTemplate:
        "주제: {{topic}}\n문항 수: {{count}}\n\n" +
        '{"items":[{"cat":"중국어","q":"문제","opts":["선지1","선지2","선지3","선지4"],"a":"정답","ex":"해설"}]}'
    },
    java_practice: {
      label: "Java 연습",
      countDefault: 5,
      topicPlaceholder: "예: if문, for문, Scanner",
      system: "당신은 Java 프로그래밍 기초 객관식 문제 출제자입니다.",
      userTemplate:
        "주제: {{topic}}\n문항 수: {{count}}\n\n" +
        '{"items":[{"cat":"Java","q":"문제","opts":["선지1","선지2","선지3","선지4"],"a":"정답","ex":"해설"}]}'
    },
    korean_word: {
      label: "국어 단어",
      countDefault: 5,
      topicPlaceholder: "예: 고급 어휘, 한자어, 관용어",
      system:
        "당신은 고등학교 국어 어휘 객관식 문제 출제자입니다. 문맥에 맞는 어휘를 묻습니다.",
      userTemplate:
        "주제: {{topic}}\n문항 수: {{count}}\n\n" +
        '{"items":[{"cat":"어휘","q":"빈칸 문제 문장","opts":["단어1","단어2","단어3","단어4"],"a":"정답 단어","ex":"해설"}]}'
    }
  };

  function getApiBase() {
    return (BUILTIN_API_BASE || "").trim().replace(/\/+$/, "");
  }

  global.AIQuizConfig = {
    PRESETS: PRESETS,
    getApiBase: getApiBase,
    BUILTIN_API_BASE: BUILTIN_API_BASE
  };
})(typeof window !== "undefined" ? window : globalThis);
