const PROG_CONCEPTS = [
  {
    name: "1. Java 소개 & 프로그래밍 준비",
    units: [
      {
        name: "Java란?",
        intro: "컴파일 언어이자 객체지향 프로그래밍(OOP) 언어. 한 번 작성한 코드를 여러 환경에서 실행할 수 있는 WORA(Write Once, Run Anywhere) 특성이 있다.",
        sections: [
          {
            title: "역사·키워드",
            items: [
              "SUN(그린 프로젝트) → James Gosling, 1991년 OAK → 1995년 Java 공개(Taming Tiger)",
              "GPL 라이선스, 2010년 Oracle 인수",
              "Architecture neutral(구조 중립), Portable(이식성), OOP(객체지향)"
            ]
          },
          {
            title: "프로그래밍의 3대 제어 구조",
            items: [
              "순차(sequential): 위에서 아래로 차례로 실행",
              "조건(conditional branch): if, switch-case 등으로 갈래",
              "반복(repetition): for, while, do-while 등으로 반복"
            ]
          }
        ]
      },
      {
        name: "개발 환경 준비",
        intro: "JDK 설치 → 콘솔에서 컴파일·실행 확인 → 에디터 사용 → 공식 문서 참고 순으로 준비한다.",
        sections: [
          {
            title: "JDK 다운로드·설치",
            items: [
              "https://www.oracle.com/java/technologies/ 에서 Java SE(JDK) 다운로드",
              "설치 후 JDK 폴더와 JRE 폴더가 함께 설치되었는지 확인",
              "개발에는 JDK(컴파일러 javac 포함)가 필요"
            ]
          },
          {
            title: "콘솔(cmd)에서 프로그래밍",
            items: [
              "클래스 이름과 동일한 파일명으로 .java 저장 (예: Hello.java)",
              "javac Hello.java → Hello.class 생성(컴파일)",
              "java Hello → 바이트코드 실행",
              "PATH 환경 변수에 JDK bin 폴더를 등록하면 어디서든 javac, java 사용 가능",
              "cmd에서 dir로 파일 목록, javac/java로 컴파일·실행 연습"
            ]
          },
          {
            title: "에디터·참고 자료",
            items: [
              "EditPlus, VS Code, Sublime Text, IntelliJ 등 텍스트/IDE 사용",
              "온라인 레퍼런스: https://docs.oracle.com/en/java/javase/",
              "오프라인·보조: http://www.allimant.org 등"
            ]
          }
        ]
      }
    ]
  },
  {
    name: "2. 변수 (Variable)",
    units: [
      {
        name: "Keyword와 Identifier",
        intro: "Java가 미리 의미를 정한 단어와, 프로그래머가 이름을 붙이는 식별자를 구분해야 한다.",
        sections: [
          {
            title: "Keyword (예약어)",
            items: [
              "if, for, int, class 등 언어가 정한 단어 — 식별자로 쓸 수 없음",
              "대소문자를 구분한다"
            ]
          },
          {
            title: "Identifier (식별자) 규칙",
            items: [
              "길이 제한은 거의 없음",
              "대소문자 구분 (myVar ≠ myvar)",
              "숫자로 시작할 수 없음, # 등 특수문자는 _ 와 $ 만 허용",
              "변수(메서드) 이름: 소문자 시작 권장 (camelCase)",
              "상수 이름: 대문자+밑줄 권장 (MAX_VALUE)"
            ]
          }
        ]
      },
      {
        name: "프로그램 기본 형태 (Hello World)",
        intro: "Java 프로그래밍의 기본 형태를 익힌다. 클래스 이름 = 파일 이름, public static void main.",
        sections: [
          {
            title: "수업 연습",
            items: [
              "Hello World 출력 프로그램 작성 → 컴파일·실행",
              "자신의 이름 출력",
              "명령줄 인자(args)로 이름을 받아 출력",
              "(선택) 명령줄 인자로 받은 두 정수의 합 출력"
            ]
          }
        ]
      },
      {
        name: "데이터 타입 개요",
        intro: "Java 데이터 타입은 기본(Primitive) 자료형 8개와 참조(Reference) 자료형으로 나뉜다.",
        sections: [
          {
            title: "8대 기본 자료형",
            items: [
              "논리형: boolean",
              "문자형: char",
              "정수형: byte, short, int, long (4종)",
              "실수형: float, double (2종)",
              "정수형이 4종·실수형이 2종인 이유: 표현 범위·메모리·연산 효율이 다르기 때문",
              "논리·문자·정수·실수 변수를 선언하고 리터럴을 대입한 뒤 출력 → PrimitiveDataType.java"
            ]
          },
          {
            title: "참조(Reference) 자료형",
            items: [
              "기본형 외 String, 배열, 클래스 객체 등은 참조형",
              "변수에는 값 자체가 아니라 객체를 가리키는 주소(참조)가 저장됨",
              "기말 범위에서는 기본형·형변환·제어문 위주로 다룸"
            ]
          },
          {
            title: "초기화",
            items: [
              "변수 선언 시점에 값이 주어지는 것 = 초기화",
              "지역 변수(블록 안): 선언만 하면 자동 초기화 안 됨 — 사용 전 대입 필요",
              "멤버 변수(필드): 타입별 기본값으로 자동 초기화 (int→0, boolean→false 등)",
              "선언 위치가 좁으면(블록 안) 사용 가능 시점도 좁고, 넓으면(필드) 선언 이후 언제든 사용 가능"
            ]
          }
        ]
      },
      {
        name: "정수형",
        intro: "byte·short·int·long은 2진수 표현과 진법 변환, 오버플로를 이해해야 한다.",
        sections: [
          {
            title: "크기·범위",
            items: [
              "byte 8bit, short 16bit, int 32bit, long 64bit",
              "Wrapper.MAX_VALUE, Wrapper.MIN_VALUE로 각 타입의 최댓값·최솟값 확인",
              "10진·2진·8진·16진 표기와 상호 변환 (예: 0xFF, 017, 0b1010)"
            ]
          },
          {
            title: "2의 보수 & 오버플로",
            items: [
              "16bit 정수 체계는 2의 보수법 사용",
              "음수는 2의 보수로 표현 (8bit에서 -100, 16bit에서 -50 등)",
              "표현 범위를 넘으면 overflow — 비트 패턴이 잘못 해석됨",
              "예: byte 100 + byte 100 → 범위 초과",
              "연습: 13000, -50, 32768, -32769, 40000을 16bit 2진으로 표현 → ToBinary.java",
              "0000 0101 1010 1001 과 0111 0101 1010 1001 중 어느 쪽이 양수 13000인지 구분"
            ]
          }
        ]
      },
      {
        name: "실수형 (float · double)",
        intro: "소수를 다루는 타입. 정수형으로는 10.625, 0.1015625 같은 값을 그대로 저장할 수 없다.",
        sections: [
          {
            title: "왜 실수형이 2종인가",
            items: [
              "float(단정밀, 32bit)와 double(배정밀, 64bit) — 정밀도·범위가 다름",
              "정수형만으로는 소수부를 표현하기 어렵다",
              "실수는 컴퓨터 내부에서 IEEE-754 부동소수점 형식으로 저장됨"
            ]
          },
          {
            title: "10진 → 2진 실수 변환 (예습)",
            items: [
              "10.625 = 1010.101(2) — 소수점 아래는 0.5, 0.25, 0.125… 자리로 분해",
              "0.1015625 = 0.0001101(2) — 2진 소수로 바꾼 뒤 정규화 단계로 넘김",
              "이 2진 실수를 정규화한 결과가 IEEE-754 지수·가수에 들어감"
            ]
          }
        ]
      },
      {
        name: "IEEE-754 부동소수점",
        intro: "부동(浮動)소수점: 소수점 위치가 떠다니며, 부호·지수·가수로 실수를 근사 표현한다.",
        sections: [
          {
            title: "표현 절차 (정규화 가능한 수)",
            items: [
              "1단계: 표현할 10진 실수를 2진 실수로 변환",
              "2단계: 정규화(Normalization) — 왼쪽→오른쪽 스캔해 첫 1 뒤로 소수점 이동",
              "2-2: 이동한 만큼 지수로 보정 (지수 증가/감소)",
              "2-3: 지수에 bias 더해 이진화 — float: +127(8bit), double: +1023(11bit)",
              "2-4: 부호 → 지수 → 가수 순으로 나열",
              "3단계: 비트 배치에 맞춰 저장"
            ]
          },
          {
            title: "비트 구성",
            items: [
              "32bit(단정밀 Single): 1bit 부호 + 8bit 지수 + 23bit 가수",
              "64bit(배정밀 Double): 1bit 부호 + 11bit 지수 + 52bit 가수",
              "부호: 양수 0, 음수 1",
              "가수: 정규화된 1.XXX에서 맨 앞 1. 은 생략(implicit bit)하고 XXX만 저장"
            ]
          },
          {
            title: "장점",
            items: [
              "적은 비트로 매우 넓은 범위의 수를 표현할 수 있음"
            ]
          },
          {
            title: "단점",
            items: [
              "표현·연산이 복잡하고 연산 시간이 더 걸림",
              "범위 안의 수라도 대부분 오차를 가진 채로 저장됨",
              "정규화가 불가능한 수도 존재함"
            ]
          },
          {
            title: "실행 예시 (32bit float)",
            items: [
              "10.625 → 0100 0001 0010 1010 0000 0000 0000 0000",
              "-234.10156 → 1100 0011 0110 1010 0001 1010 0000 0000",
              "-87.5 → 1100 0010 1010 1111 0000 0000 0000 0000"
            ]
          },
          {
            title: "특수 케이스 (Case-study)",
            items: [
              "Infinity (무한대)",
              "NaN (Not a Number)",
              "0.0",
              "denormalized number (비정규화 수) — 지수가 0이고 암시적 1이 없는 경우",
              "참고: http://grouper.ieee.org/groups/754/ · IEEE754.java로 확인"
            ]
          }
        ]
      },
      {
        name: "문자형 & 논리형",
        sections: [
          {
            title: "char",
            items: [
              "유니코드 한 글자 저장 (예: 'A', '가') — 2byte",
              "char x='A'; println(x) → A / println(x+1) → 66 (int로 승격) / println((char)(x+1)) → B",
              "문자열(String) vs 문자(char): \"1+1+???\" vs '1'+'1'+'???' vs \"1\"+\"???\"+\"1\"",
              "이스케이프 시퀀스: \\n, \\t, \\', \\\" 등 — http://www.unicode.org/",
              "연습: 한 글자 저장·출력, n번째 유니코드 문자 출력, 이름·친구 이름 연결 출력 → CharTest.java"
            ]
          },
          {
            title: "boolean",
            items: [
              "true / false 만 저장",
              "1byte 중 1bit만 사용하고 나머지 7bit는 don't care"
            ]
          }
        ]
      },
      {
        name: "형변환 (Type Casting)",
        intro: "서로 다른 표현법의 자료형이 한 식에서 섞일 때, 연산 시점에 잠시 다른 형으로 바꾸는 것.",
        sections: [
          {
            title: "정의·분류",
            items: [
              "묵시적(implicit): 프로그래머가 지시하지 않아도 언어 규칙에 따라 변환 — 주로 올림(promotion)",
              "명시적(explicit): (type)값 형태로 프로그래머가 방향 지시 — 주로 내림(demotion)",
              "올림: 비트 수·표현 능력이 낮은 형 → 높은 형",
              "내림: 높은 형 → 낮은 형 (정보 손실·오차 위험)",
              "boolean 제외 7개 기본형은 상호 묵시적·명시적 형변환 가능"
            ]
          },
          {
            title: "예시 1~3",
            items: [
              "ex1) System.out.println(3+3.5); → 3.0+3.5 (int→double 올림)",
              "ex2) int a; a=3.5; → 컴파일 오류 (묵시적 내림 불가, 오차 위험)",
              "ex3) int a; a=(int)3.5; → a=3 (명시적 내림)"
            ]
          },
          {
            title: "예시 4 — char 형변환",
            items: [
              "char x='A';",
              "println(x) → A",
              "println(x+1) → 66 (char+int → int)",
              "println((char)(x+1)) → B"
            ]
          },
          {
            title: "예시 5 — 반복문 + (char) 캐스팅",
            items: [
              "이중 for로 @와 * 삼각형 출력 후, * 자리에 (char)('A'+j-1)로 A,B,C… 출력",
              "급수 합: 1-3+5-7+…±n (n=563 등) — 홀수만, i%4==1이면 더하고 아니면 빼기",
              "분수 급수: 1/1-1/3+1/5-… (실수 연산 주의)"
            ]
          },
          {
            title: "초기화와 형변환",
            items: [
              "변수 선언 시(사용 가능 시점) 최초로 주어지는 값 = 초기화",
              "좁은 범위(블록) 선언 vs 넓은 범위(필드) 선언에 따라 사용 시점이 달라짐",
              "기본 자료형 지역 변수는 선언만으로 자동 초기화되지 않음 → TypeCasting.java"
            ]
          }
        ]
      }
    ]
  },
  {
    name: "3. 연산자 (Operator)",
    units: [
      {
        name: "연산자 기본",
        intro: "식에서 값을 계산하거나 비교·대입하는 기호. 피연산자(operand)와 함께 쓰인다.",
        sections: [
          {
            title: "분류 (기능)",
            items: [
              "산술: +, -, *, /, %",
              "비교(관계): >, >=, <, <=, ==, !=",
              "논리: &&, ||, !",
              "비트 시프트: >>, >>>, <<",
              "비트 논리: &, |, ^, ~",
              "증감: ++, -- / 부호: +, -",
              "캐스팅: (type) / 삼항: ? : / 대입: = / 확장 대입: +=, -= … / 괄호: ( )"
            ]
          },
          {
            title: "분류 (개수·위치)",
            items: [
              "단항·이항·삼항 연산자",
              "prefix(앞), infix(중간), postfix(뒤) 표기"
            ]
          }
        ]
      },
      {
        name: "표기법·우선순위",
        sections: [
          {
            title: "Java에서 헷갈리는 식",
            items: [
              "2 <= x <= 10 은 수학처럼 한 번에 쓰지 않음",
              "올바른 해석: x >= 2 && x <= 10",
              "(x >= 2) && (x <= 10) 과 동일한 의미"
            ]
          },
          {
            title: "우선순위·결합 방향",
            items: [
              "우선순위(precedence): 여러 연산자가 있을 때 먼저 계산할 연산자",
              "결합 방향(associativity): 우선순위가 같을 때 왼쪽→오른쪽(L→R) 또는 반대",
              "괄호로 우선순위를 바꿀 수 있음"
            ]
          }
        ]
      }
    ]
  },
  {
    name: "4. 조건문 & 반복문",
    units: [
      {
        name: "조건문 (if · switch)",
        intro: "조건에 따라 실행할 문장을 선택한다.",
        sections: [
          {
            title: "if 3가지 형태",
            items: [
              "1) if(조건식) { 문장1; 문장2; }",
              "2) if(조건식) { … } else { … }",
              "3) if(조건식1) { … } else if(조건식2) { … } else { … }",
              "조건식은 boolean 결과 (예: a % 2 == 0)"
            ]
          },
          {
            title: "switch-case",
            items: [
              "switch(식) { case 값1: 문장; [break;] case 값2: … default: … }",
              "단일 값 비교에 if-else if-else 대신 사용 가능",
              "break 없으면 다음 case로 떨어짐(fall-through)",
              "break는 switch와 반복문 모두에서 사용"
            ]
          },
          {
            title: "삼항 연산자",
            items: [
              "조건 ? 참일 때 값 : 거짓일 때 값",
              "if-else를 한 줄로: x = (a%2==0) ? true : false;",
              "문장이 단일 식으로 바뀔 수 있을 때 대체 가능"
            ]
          }
        ]
      },
      {
        name: "반복문 (for · while · do-while)",
        intro: "조건을 만족하는 동안 문장을 반복 실행한다.",
        sections: [
          {
            title: "for",
            items: [
              "for(초기값; 조건식; 증감) { 문장1; 문장2; }",
              "흐름: 초기값 → 조건식 → {문장} → 증감 → 조건식 → …",
              "횟수를 세는 반복(countable)에 자주 사용"
            ]
          },
          {
            title: "while",
            items: [
              "while(조건식) { 문장1; 문장2; }",
              "조건식 → {문장} → 조건식 → …",
              "조건이 언제 끝날지 모를 때(uncountable)에도 사용"
            ]
          },
          {
            title: "do-while",
            items: [
              "do { 문장1; 문장2; } while(조건식);",
              "문장을 최소 한 번은 실행한 뒤 조건 검사",
              "for/while로 바꿀 때 초기값·조건식 위치를 조정"
            ]
          },
          {
            title: "for ↔ while",
            items: [
              "for와 while은 서로 변환 가능",
              "1~10 출력, GCD(최대공약수), 소수 판별, 유클리드 호 제법 등으로 연습"
            ]
          }
        ]
      },
      {
        name: "break · continue",
        sections: [
          {
            title: "역할",
            items: [
              "break: 가장 안쪽 반복·switch를 즉시 탈출",
              "continue: 이번 회차 나머지를 건너뛰고 다음 반복으로",
              "소수 판별 시 약수를 찾으면 break로 조기 종료",
              "가위바위보·메뉴 입력 등에서 switch + break 조합"
            ]
          }
        ]
      },
      {
        name: "수업 예제 정리",
        sections: [
          {
            title: "조건문 연습",
            items: [
              "A/B/C 입력 → apple / banana / cherry / bad fruit",
              "가위바위보: 1=가위, 2=바위, 3=보, 그 외 입력 오류",
              "if-else if-else 와 switch-case 로 각각 작성"
            ]
          },
          {
            title: "반복문 연습",
            items: [
              "1~10 출력 (for / while)",
              "두 수의 GCD — while·for·유클리드 호 제법",
              "n이 소수인지 판별 (break 활용)",
              "Scanner로 5과목 점수 입력 후 평균 (0~100, break로 조기 종료)",
              "음수 입력 전까지 양수·음수 개수 세기 (do-while)"
            ]
          }
        ]
      }
    ]
  }
];
