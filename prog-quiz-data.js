const PROG_QUIZ = [
  {
    id: 1,
    cat: "Java 준비",
    q: "Java의 WORA(Write Once, Run Anywhere)는 무엇을 의미하는가?",
    opts: ["한 번 작성한 코드를 여러 환경에서 실행 가능", "한 번만 컴파일하면 수정 불가", "한 파일에 모든 코드를 작성", "인터넷 없이만 실행"],
    a: "한 번 작성한 코드를 여러 환경에서 실행 가능",
    ex: "Java는 플랫폼에 독립적인 바이트코드를 만들어 JVM에서 실행한다."
  },
  {
    id: 2,
    cat: "Java 준비",
    q: "`.java` 파일을 `.class`로 바꾸는 명령은?",
    opts: ["javac", "java", "jdk", "jre"],
    a: "javac",
    ex: "javac가 컴파일, java가 실행이다."
  },
  {
    id: 3,
    cat: "Java 준비",
    q: "프로그래밍의 3대 제어 구조가 아닌 것은?",
    opts: ["순차", "조건 분기", "반복", "상속"],
    a: "상속",
    ex: "순차·조건(분기)·반복이 기본 제어 구조이다."
  },
  {
    id: 4,
    cat: "변수·자료형",
    q: "Java 8대 기본(Primitive) 자료형 개수는?",
    opts: ["6", "7", "8", "9"],
    a: "8",
    ex: "boolean, char, byte, short, int, long, float, double."
  },
  {
    id: 5,
    cat: "변수·자료형",
    q: "Identifier(식별자)로 사용할 수 없는 것은?",
    opts: ["myVar", "_count", "int", "score2"],
    a: "int",
    ex: "int는 Keyword(예약어)이므로 식별자로 쓸 수 없다."
  },
  {
    id: 6,
    cat: "변수·자료형",
    q: "식별자 이름 짓기 규칙으로 옳은 것은?",
    opts: ["1score", "my-score", "myScore", "class"],
    a: "myScore",
    ex: "숫자로 시작 불가, - 불가, class는 예약어, camelCase 권장."
  },
  {
    id: 7,
    cat: "변수·자료형",
    q: "정수형 4종과 실수형 2종으로 나누는 주된 이유는?",
    opts: ["표현 범위·메모리·연산 효율이 다르기 때문", "문법 규칙상 무조건", "문자형과 겹치지 않게", "컴파일러 버그 방지"],
    a: "표현 범위·메모리·연산 효율이 다르기 때문",
    ex: "byte~long, float~double은 크기와 정밀도가 다르다."
  },
  {
    id: 8,
    cat: "정수형·2의 보수",
    q: "16bit 2의 보수 체계에서 표현 가능한 정수 개수(대략)는?",
    opts: ["256", "65536", "32768", "65535"],
    a: "65536",
    ex: "2^16 = 65536가지 패턴. 범위는 -32768 ~ 32767."
  },
  {
    id: 9,
    cat: "정수형·2의 보수",
    q: "overflow(오버플로)란?",
    opts: ["표현 범위를 넘어 잘못된 값으로 해석됨", "변수 이름이 너무 길어짐", "실수가 정수로 바뀜", "컴파일이 중단됨"],
    a: "표현 범위를 넘어 잘못된 값으로 해석됨",
    ex: "예: byte 100 + 100은 8bit 범위를 넘어 이상한 결과."
  },
  {
    id: 10,
    cat: "정수형·2의 보수",
    q: "음수를 2진수로 저장할 때 주로 쓰는 방법은?",
    opts: ["2의 보수", "부호만 바꿈", "10진 그대로", "ASCII 변환"],
    a: "2의 보수",
    ex: "16bit 정수 체계는 2의 보수법을 사용한다."
  },
  {
    id: 11,
    cat: "IEEE-754",
    q: "32bit 단정밀(float) IEEE-754 구성은?",
    opts: ["1bit 부호 + 8bit 지수 + 23bit 가수", "1 + 11 + 52", "8 + 8 + 16", "2 + 15 + 15"],
    a: "1bit 부호 + 8bit 지수 + 23bit 가수",
    ex: "64bit double은 1 + 11 + 52."
  },
  {
    id: 12,
    cat: "IEEE-754",
    q: "32bit 실수형 지수에 bias를 더할 때 사용하는 값은?",
    opts: ["127", "1023", "255", "128"],
    a: "127",
    ex: "64bit는 bias 1023."
  },
  {
    id: 13,
    cat: "IEEE-754",
    q: "IEEE-754 정규화 후 가수(Mantissa) 저장 시 생략하는 것은?",
    opts: ["맨 앞의 1.", "부호 비트", "지수 전체", "소수점 아래 0"],
    a: "맨 앞의 1.",
    ex: "1.XXX 형태에서 1.은 implicit bit로 생략."
  },
  {
    id: 14,
    cat: "IEEE-754",
    q: "부동소수점 표현의 단점으로 맞는 것은?",
    opts: ["대부분의 수가 오차를 가진 채 저장됨", "범위가 너무 좁음", "정수만 표현 가능", "2진 변환 불가"],
    a: "대부분의 수가 오차를 가진 채 저장됨",
    ex: "연산도 복잡·느리고 정규화 불가 수도 있다."
  },
  {
    id: 15,
    cat: "IEEE-754",
    q: "IEEE-754 특수 케이스에 해당하지 않는 것은?",
    opts: ["Infinity", "NaN", "0.0", "Prime"],
    a: "Prime",
    ex: "Infinity, NaN, 0.0, denormalized number 등이 특수 케이스."
  },
  {
    id: 16,
    cat: "문자·논리형",
    q: "char x='A'; System.out.println(x+1); 의 출력은?",
    opts: ["66", "B", "A1", "컴파일 오류"],
    a: "66",
    ex: "char + int → int로 승격. 'A'(65) + 1 = 66."
  },
  {
    id: 17,
    cat: "문자·논리형",
    q: "char x='A'; System.out.println((char)(x+1)); 의 출력은?",
    opts: ["B", "66", "A", "AB"],
    a: "B",
    ex: "명시적 (char) 캐스팅으로 문자로 출력."
  },
  {
    id: 18,
    cat: "문자·논리형",
    q: "boolean형이 저장할 수 있는 값은?",
    opts: ["true / false", "0 / 1", "yes / no", "T / F 문자"],
    a: "true / false",
    ex: "Java boolean은 true, false만."
  },
  {
    id: 19,
    cat: "형변환",
    q: "System.out.println(3 + 3.5); 에서 일어나는 형변환은?",
    opts: ["int → double 올림(묵시적)", "double → int 내림", "형변환 없음", "char → int"],
    a: "int → double 올림(묵시적)",
    ex: "3이 3.0으로 승격되어 3.0 + 3.5."
  },
  {
    id: 20,
    cat: "형변환",
    q: "int a; a = 3.5; 가 컴파일되지 않는 이유는?",
    opts: ["묵시적 내림(실수→정수)은 허용되지 않음", "a가 선언 안 됨", "3.5가 너무 큼", "double 키워드 필요"],
    a: "묵시적 내림(실수→정수)은 허용되지 않음",
    ex: "오차 위험이 있어 자동 내림은 불가. (int)3.5처럼 명시해야 함."
  },
  {
    id: 21,
    cat: "형변환",
    q: "int a = (int)3.5; 실행 후 a의 값은?",
    opts: ["3", "4", "3.5", "컴파일 오류"],
    a: "3",
    ex: "명시적 내림 — 소수 이하 버림."
  },
  {
    id: 22,
    cat: "형변환",
    q: "묵시적 형변환과 명시적 형변환 설명으로 맞는 것은?",
    opts: ["묵시적은 주로 올림, 명시적은 주로 내림", "둘 다 항상 내림", "묵시적은 프로그래머가 (type) 사용", "boolean도 모든 형과 자동 변환"],
    a: "묵시적은 주로 올림, 명시적은 주로 내림",
    ex: "boolean 제외 7개 기본형은 상호 변환 가능(규칙 따름)."
  },
  {
    id: 23,
    cat: "연산자",
    q: "수학식 2 ≤ x ≤ 10 을 Java에서 올바르게 쓰면?",
    opts: ["x >= 2 && x <= 10", "2 <= x <= 10", "x >= 2 || x <= 10", "2 <= x && 10"],
    a: "x >= 2 && x <= 10",
    ex: "Java는 연속 비교를 한 줄에 쓰지 않는다."
  },
  {
    id: 24,
    cat: "연산자",
    q: "논리 AND 연산자는?",
    opts: ["&&", "||", "&", "and"],
    a: "&&",
    ex: "||는 OR, &는 비트 AND."
  },
  {
    id: 25,
    cat: "연산자",
    q: "삼항 연산자 형태는?",
    opts: ["조건 ? 값1 : 값2", "if 조건 then 값", "조건 : 값1 ? 값2", "switch(조건)"],
    a: "조건 ? 값1 : 값2",
    ex: "x = (a%2==0) ? true : false;"
  },
  {
    id: 26,
    cat: "연산자",
    q: "나머지 연산자는?",
    opts: ["%", "/", "*", "mod"],
    a: "%",
    ex: "a % 2 == 0 → 짝수 판별."
  },
  {
    id: 27,
    cat: "조건문",
    q: "switch-case에서 case 다음에 break를 안 쓰면?",
    opts: ["다음 case로 떨어짐(fall-through)", "컴파일 오류", "프로그램 종료", "default로 점프"],
    a: "다음 case로 떨어짐(fall-through)",
    ex: "의도적으로 break 생략할 수도 있지만 보통 break 사용."
  },
  {
    id: 28,
    cat: "조건문",
    q: "if - else if - else 대신 switch-case를 쓰기 좋은 경우는?",
    opts: ["하나의 변수를 여러 상수 값과 비교", "범위 비교(점수 구간)", "복잡한 논리식", "반복 횟수 제어"],
    a: "하나의 변수를 여러 상수 값과 비교",
    ex: "A/B/C 입력 → apple/banana/cherry 같은 단일 값 비교."
  },
  {
    id: 29,
    cat: "조건문",
    q: "if(a%2==0) x=true; else x=false; 와 같은 코드를 한 줄로 쓰면?",
    opts: ["x = (a%2==0) ? true : false;", "x = a%2==0 : true false;", "x = if(a%2==0) true;", "switch(a%2) x;"],
    a: "x = (a%2==0) ? true : false;",
    ex: "삼항 연산자로 if-else 단순 대체."
  },
  {
    id: 30,
    cat: "반복문",
    q: "for문의 올바른 형태는?",
    opts: ["for(초기값; 조건식; 증감) { }", "for 조건식 { }", "for(조건식) 증감 { }", "for { } while(조건)"],
    a: "for(초기값; 조건식; 증감) { }",
    ex: "초기값 → 조건 → {문장} → 증감 → 조건 …"
  },
  {
    id: 31,
    cat: "반복문",
    q: "do-while문의 특징은?",
    opts: ["문장을 최소 1번은 실행", "조건을 먼저 검사", "무한 반복만 가능", "for보다 빠름"],
    a: "문장을 최소 1번은 실행",
    ex: "do { } while(조건); — 실행 후 조건 검사."
  },
  {
    id: 32,
    cat: "반복문",
    q: "break와 continue 설명으로 맞는 것은?",
    opts: ["break=루프 탈출, continue=이번 회차 건너뛰기", "둘 다 종료", "continue=탈출, break=건너뛰기", "switch에서만 사용"],
    a: "break=루프 탈출, continue=이번 회차 건너뛰기",
    ex: "break는 switch·반복문, continue는 반복문."
  },
  {
    id: 33,
    cat: "반복문",
    q: "Countable loop에 주로 쓰는 반복문은?",
    opts: ["for", "while만", "do-while만", "switch"],
    a: "for",
    ex: "횟수가 정해진 반복(1~10 출력 등)에 for가 편하다."
  },
  {
    id: 34,
    cat: "반복문",
    q: "for문과 while문의 관계는?",
    opts: ["서로 변환 가능", "변환 불가", "for만 조건 사용", "while은 증감 불가"],
    a: "서로 변환 가능",
    ex: "초기값·조건·증감 위치만 조정하면 바꿀 수 있다."
  },
  {
    id: 35,
    cat: "Java 준비",
    q: "Java 소스 파일 이름과 public class 이름의 관계는?",
    opts: ["같아야 한다", "달라도 된다", "확장자만 같으면 됨", "package 이름과 같아야 함"],
    a: "같아야 한다",
    ex: "Hello.java → public class Hello."
  },
  {
    id: 36,
    cat: "IEEE-754",
    q: "10.625를 32bit float로 저장할 때 부호 비트(양수)는?",
    opts: ["0", "1", "127", "0100"],
    a: "0",
    ex: "양수 0, 음수 1. 10.625 → 0100 0001 …"
  },
  {
    id: 37,
    cat: "변수·자료형",
    q: "지역 변수(블록 안 int x;)를 선언만 하고 값을 안 넣으면?",
    opts: ["컴파일 오류(사용 전 초기화 필요)", "자동으로 0", "null", "true"],
    a: "컴파일 오류(사용 전 초기화 필요)",
    ex: "지역 변수는 자동 초기화되지 않는다."
  },
  {
    id: 38,
    cat: "연산자",
    q: "비트 시프트 연산자가 아닌 것은?",
    opts: ["&&", ">>", "<<", ">>>"],
    a: "&&",
    ex: ">>, <<, >>>는 시프트. &&는 논리 AND."
  },
  {
    id: 39,
    cat: "조건문",
    q: "switch문에서 모든 case에 해당하지 않을 때 실행되는 것은?",
    opts: ["default", "else", "break", "finally"],
    a: "default",
    ex: "default: 문장; [break;]"
  },
  {
    id: 40,
    cat: "반복문",
    q: "소수 판별에서 약수를 찾으면 더 이상 반복하지 않도록 쓰는 키워드는?",
    opts: ["break", "continue", "return", "switch"],
    a: "break",
    ex: "약수 발견 시 break로 조기 종료."
  }
];
