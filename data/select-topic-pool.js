/* =========================================================
   select-topic-pool.js — 선택주제 질문 풀(뱅크)
   ---------------------------------------------------------
   구조: SELECT_TOPIC_POOL.topics[키].combo = [슬롯1, 슬롯2, 슬롯3]
         (순서 고정: 묘사 → 습관/경험 → 비교/문제)
         각 슬롯 = { tag, sub, options: [{en, ko} x3] }
   - '시작' 시 각 슬롯에서 옵션 1개를 무작위 선택해 3문제 콤보 조립
   - 직전에 뽑힌 옵션은 제외(중복 회피). API 실패 시 폴백 데이터로도 사용
   - SELECT_POOL_TOPIC_MAP: 앱 topic.id → 풀 키
   ========================================================= */
(function (global) {
  "use strict";

  function slot(tag, sub, options) { return { tag: tag, sub: sub, options: options }; }
  var S0 = "묘사", S0sub = "대상의 모습·현재 상태";
  var S1 = "습관·경험", S1sub = "평소 하는 일·기억에 남는 일";
  var S2 = "비교·문제", S2sub = "과거-현재 비교·문제 해결";

  var SELECT_TOPIC_POOL = {
    topics: {
      home: { combo: [
        slot(S0, S0sub, [
          { en: "I'd like to know about your home. Can you describe it for me — what it looks like and how many rooms it has?", ko: "당신의 집이 궁금해요. 어떻게 생겼고 방은 몇 개인지 묘사해 줄래요?" },
          { en: "Tell me about your favorite space at home. What does it look like, and why do you like it?", ko: "집에서 가장 좋아하는 공간을 말해 주세요. 어떻게 생겼고 왜 좋아하나요?" },
          { en: "Describe the neighborhood around your home. What's nearby, and what's it like to live there?", ko: "집 주변 동네를 묘사해 주세요. 근처에 뭐가 있고, 거기 사는 건 어떤가요?" }
        ]),
        slot(S1, S1sub, [
          { en: "Walk me through a typical day at home. What do you usually do from morning to night?", ko: "집에서의 평범한 하루를 들려주세요. 아침부터 밤까지 보통 뭘 하나요?" },
          { en: "Tell me about something memorable that happened at your home recently.", ko: "최근 집에서 있었던 기억에 남는 일을 말해 주세요." },
          { en: "How do you usually spend your weekends at home?", ko: "집에서 주말을 보통 어떻게 보내나요?" }
        ]),
        slot(S2, S2sub, [
          { en: "How is your current home different from a place you lived in before? Which do you prefer, and why?", ko: "지금 집은 예전에 살던 곳과 어떻게 다른가요? 어느 쪽이 더 좋고 왜 그런가요?" },
          { en: "Have you ever had a problem at home, like something breaking down? What happened, and how did you handle it?", ko: "집에서 뭔가 고장 나는 등 문제를 겪은 적 있나요? 무슨 일이었고 어떻게 해결했나요?" },
          { en: "If you could change one thing about your home, what would it be and why?", ko: "집에서 한 가지를 바꿀 수 있다면 무엇을 바꾸고 싶고, 왜죠?" }
        ])
      ]},
      show: { combo: [
        slot(S0, S0sub, [
          { en: "You said you like seeing performances. What kind of shows do you enjoy, and can you describe one you saw?", ko: "공연 보는 걸 좋아한다고 했죠. 어떤 공연을 즐기고, 본 공연 하나를 묘사해 줄래요?" },
          { en: "Describe a theater or venue where you usually watch performances. What's it like inside?", ko: "보통 공연을 보는 극장이나 공연장을 묘사해 주세요. 안은 어떤가요?" },
          { en: "Think of your favorite performer or show. Can you describe what makes them special?", ko: "가장 좋아하는 공연자나 공연을 떠올려 보세요. 무엇이 특별한지 묘사해 줄래요?" }
        ]),
        slot(S1, S1sub, [
          { en: "How do you usually plan to see a performance — booking tickets, who you go with, and so on?", ko: "공연을 보러 갈 때 보통 어떻게 준비하나요? 예매, 누구와 가는지 등이요." },
          { en: "Tell me about the most memorable performance you've ever been to.", ko: "지금까지 본 공연 중 가장 기억에 남는 공연을 말해 주세요." },
          { en: "What do you usually do before and after watching a show?", ko: "공연을 보기 전과 후에 보통 뭘 하나요?" }
        ]),
        slot(S2, S2sub, [
          { en: "How has the way you enjoy performances changed compared to the past?", ko: "공연을 즐기는 방식이 과거와 비교해 어떻게 바뀌었나요?" },
          { en: "Have you ever had a problem at a show, like bad seats or a delay? How did you deal with it?", ko: "공연에서 나쁜 자리나 지연 같은 문제를 겪은 적 있나요? 어떻게 대처했나요?" },
          { en: "Do you prefer live performances or watching them on a screen? Compare the two.", ko: "라이브 공연이 좋나요, 화면으로 보는 게 좋나요? 둘을 비교해 주세요." }
        ])
      ]},
      concert: { combo: [
        slot(S0, S0sub, [
          { en: "You mentioned you like going to concerts. What kind of concerts do you go to, and can you describe one?", ko: "콘서트 가는 걸 좋아한다고 했죠. 어떤 콘서트에 가고, 하나를 묘사해 줄래요?" },
          { en: "Describe the atmosphere of a concert you really enjoyed. What was it like?", ko: "정말 즐거웠던 콘서트의 분위기를 묘사해 주세요. 어땠나요?" },
          { en: "Tell me about an artist whose concert you'd love to see. What are they like?", ko: "콘서트를 꼭 보고 싶은 아티스트를 말해 주세요. 어떤 아티스트인가요?" }
        ]),
        slot(S1, S1sub, [
          { en: "How do you usually get ready for a concert — tickets, outfit, going with friends?", ko: "콘서트를 보통 어떻게 준비하나요? 티켓, 옷차림, 친구와 함께 가는 것 등이요." },
          { en: "Tell me about the most memorable concert you've ever been to.", ko: "지금까지 가본 콘서트 중 가장 기억에 남는 걸 말해 주세요." },
          { en: "What do you usually do during and after a concert?", ko: "콘서트 중과 끝난 뒤에 보통 뭘 하나요?" }
        ]),
        slot(S2, S2sub, [
          { en: "How is going to concerts now different from when you were younger?", ko: "지금 콘서트에 가는 건 어렸을 때와 어떻게 다른가요?" },
          { en: "Have you ever run into trouble at a concert, like crowds or cancellations? What happened?", ko: "콘서트에서 인파나 취소 같은 문제를 겪은 적 있나요? 무슨 일이었나요?" },
          { en: "Do you prefer big concerts or small, intimate ones? Compare them.", ko: "큰 콘서트가 좋나요, 작고 아담한 게 좋나요? 비교해 주세요." }
        ])
      ]},
      cafe: { combo: [
        slot(S0, S0sub, [
          { en: "You said you like going to cafes. Can you describe your favorite cafe — what it looks like and the atmosphere?", ko: "카페 가는 걸 좋아한다고 했죠. 가장 좋아하는 카페를 묘사해 줄래요? 모습과 분위기요." },
          { en: "Describe a cafe near where you live. What does it serve, and who goes there?", ko: "집 근처 카페를 묘사해 주세요. 뭘 팔고, 누가 가나요?" },
          { en: "Tell me about your favorite drink or menu at a cafe, and why you like it.", ko: "카페에서 가장 좋아하는 음료나 메뉴를 말해 주세요. 왜 좋아하나요?" }
        ]),
        slot(S1, S1sub, [
          { en: "What do you usually do when you go to a cafe? Walk me through it from ordering to leaving.", ko: "카페에 가면 보통 뭘 하나요? 주문부터 나올 때까지 들려주세요." },
          { en: "Tell me about a memorable time you spent at a cafe. Who were you with?", ko: "카페에서 보낸 기억에 남는 순간을 말해 주세요. 누구와 함께였나요?" },
          { en: "How often do you go to cafes, and when do you usually go?", ko: "카페에 얼마나 자주, 보통 언제 가나요?" }
        ]),
        slot(S2, S2sub, [
          { en: "How have your cafe habits changed over the years?", ko: "카페 이용 습관이 시간이 지나며 어떻게 바뀌었나요?" },
          { en: "Have you ever had a problem at a cafe, like a wrong order or it being too crowded? How did you deal with it?", ko: "카페에서 주문이 잘못되거나 너무 붐비는 문제를 겪은 적 있나요? 어떻게 대처했나요?" },
          { en: "Do you prefer studying or working at a cafe, or just relaxing? Compare the two.", ko: "카페에서 공부·일을 하는 게 좋나요, 그냥 쉬는 게 좋나요? 둘을 비교해 주세요." }
        ])
      ]},
      bar: { combo: [
        slot(S0, S0sub, [
          { en: "You mentioned you like going to bars or pubs. Can you describe a place you often go to?", ko: "술집 가는 걸 좋아한다고 했죠. 자주 가는 곳을 묘사해 줄래요?" },
          { en: "Describe the atmosphere of your favorite bar. What's the vibe, and what do they serve?", ko: "가장 좋아하는 술집의 분위기를 묘사해 주세요. 느낌은 어떻고 뭘 파나요?" },
          { en: "Tell me about your favorite drink or snack when you go out, and why.", ko: "술집에 갈 때 가장 좋아하는 술이나 안주를 말해 주세요. 왜죠?" }
        ]),
        slot(S1, S1sub, [
          { en: "Who do you usually go out with, and what do you do at a bar?", ko: "보통 누구와 가고, 술집에서 뭘 하나요?" },
          { en: "Tell me about a memorable night out at a bar.", ko: "술집에서 보낸 기억에 남는 밤을 말해 주세요." },
          { en: "How often do you go out, and what's a typical evening like?", ko: "얼마나 자주 나가고, 평범한 저녁은 어떤가요?" }
        ]),
        slot(S2, S2sub, [
          { en: "How has your going-out culture changed compared to a few years ago?", ko: "술자리 문화가 몇 년 전과 비교해 어떻게 바뀌었나요?" },
          { en: "Have you ever had a problem on a night out, like a place being full? How did you handle it?", ko: "술자리에서 자리가 꽉 차는 등 문제를 겪은 적 있나요? 어떻게 해결했나요?" },
          { en: "Do you prefer a quiet bar or a lively one? Compare them.", ko: "조용한 술집이 좋나요, 활기찬 곳이 좋나요? 비교해 주세요." }
        ])
      ]},
      music: { combo: [
        slot(S0, S0sub, [
          { en: "You said you enjoy listening to music. What kind of music do you like, and can you describe a favorite artist or song?", ko: "음악 듣는 걸 좋아한다고 했죠. 어떤 음악을 좋아하고, 좋아하는 아티스트나 곡을 묘사해 줄래요?" },
          { en: "Describe the device or way you usually listen to music.", ko: "보통 음악을 듣는 기기나 방식을 묘사해 주세요." },
          { en: "Tell me about a song or album that means a lot to you.", ko: "당신에게 큰 의미가 있는 곡이나 앨범을 말해 주세요." }
        ]),
        slot(S1, S1sub, [
          { en: "When and where do you usually listen to music? How does it fit into your day?", ko: "보통 언제 어디서 음악을 듣나요? 일상에 어떻게 들어와 있나요?" },
          { en: "Tell me about a memorable experience related to music.", ko: "음악과 관련된 기억에 남는 경험을 말해 주세요." },
          { en: "How do you usually discover new music these days?", ko: "요즘 새 음악을 보통 어떻게 찾나요?" }
        ]),
        slot(S2, S2sub, [
          { en: "How has your taste in music changed over time?", ko: "음악 취향이 시간이 지나며 어떻게 바뀌었나요?" },
          { en: "How is the way you listen to music now different from the past?", ko: "지금 음악을 듣는 방식은 과거와 어떻게 다른가요?" },
          { en: "Do you prefer listening alone or sharing music with others? Compare the two.", ko: "혼자 듣는 게 좋나요, 남과 음악을 나누는 게 좋나요? 비교해 주세요." }
        ])
      ]},
      jogging: { combo: [
        slot(S0, S0sub, [
          { en: "You said you like jogging. Can you describe where you usually go for a run?", ko: "조깅을 좋아한다고 했죠. 보통 어디서 달리는지 묘사해 줄래요?" },
          { en: "Describe what you wear and bring when you go jogging.", ko: "조깅하러 갈 때 무엇을 입고 챙기는지 묘사해 주세요." },
          { en: "Describe your favorite jogging route. What does it look like?", ko: "가장 좋아하는 조깅 코스를 묘사해 주세요. 어떻게 생겼나요?" }
        ]),
        slot(S1, S1sub, [
          { en: "Walk me through your usual jogging routine, from warming up to finishing.", ko: "준비운동부터 마무리까지 평소 조깅 루틴을 들려주세요." },
          { en: "Tell me about a memorable run you had.", ko: "기억에 남는 달리기 경험을 말해 주세요." },
          { en: "How often do you jog, and when do you usually go?", ko: "얼마나 자주, 보통 언제 조깅하나요?" }
        ]),
        slot(S2, S2sub, [
          { en: "How has your jogging habit changed over the years?", ko: "조깅 습관이 시간이 지나며 어떻게 바뀌었나요?" },
          { en: "Have you ever had a problem while jogging, like bad weather or an injury? How did you handle it?", ko: "조깅 중 궂은 날씨나 부상 같은 문제를 겪은 적 있나요? 어떻게 했나요?" },
          { en: "Do you prefer jogging alone or with someone? Compare the two.", ko: "혼자 달리는 게 좋나요, 누구와 함께가 좋나요? 비교해 주세요." }
        ])
      ]},
      walking: { combo: [
        slot(S0, S0sub, [
          { en: "You said you like taking walks. Can you describe where you usually walk?", ko: "걷기를 좋아한다고 했죠. 보통 어디서 걷는지 묘사해 줄래요?" },
          { en: "Describe your favorite walking spot. What's it like there?", ko: "가장 좋아하는 산책 장소를 묘사해 주세요. 거긴 어떤가요?" },
          { en: "Describe what a walk looks like for you — the time, the place, the mood.", ko: "당신의 산책이 어떤 모습인지 묘사해 주세요. 시간, 장소, 분위기요." }
        ]),
        slot(S1, S1sub, [
          { en: "When and how often do you go for walks, and what do you do while walking?", ko: "언제 얼마나 자주 걷고, 걸으면서 뭘 하나요?" },
          { en: "Tell me about a memorable walk you took.", ko: "기억에 남는 산책을 말해 주세요." },
          { en: "Do you walk alone or with someone, and why?", ko: "혼자 걷나요, 누구와 함께 걷나요? 왜죠?" }
        ]),
        slot(S2, S2sub, [
          { en: "How has your walking routine changed compared to the past?", ko: "산책 루틴이 과거와 비교해 어떻게 바뀌었나요?" },
          { en: "Have you ever had a problem during a walk, like getting caught in the rain? What did you do?", ko: "산책 중 비를 만나는 등 문제를 겪은 적 있나요? 어떻게 했나요?" },
          { en: "Do you prefer walking in the city or in nature? Compare the two.", ko: "도시에서 걷는 게 좋나요, 자연에서가 좋나요? 비교해 주세요." }
        ])
      ]},
      hiking: { combo: [
        slot(S0, S0sub, [
          { en: "You mentioned you like hiking. Can you describe a mountain or trail you've hiked?", ko: "하이킹을 좋아한다고 했죠. 올라본 산이나 코스를 묘사해 줄래요?" },
          { en: "Describe the gear and preparation you need for hiking.", ko: "하이킹에 필요한 장비와 준비를 묘사해 주세요." },
          { en: "Describe the view or scenery from a hike you really enjoyed.", ko: "정말 좋았던 하이킹의 풍경이나 경치를 묘사해 주세요." }
        ]),
        slot(S1, S1sub, [
          { en: "Walk me through a typical hiking trip, from planning to coming home.", ko: "계획부터 귀가까지 평범한 하이킹 일정을 들려주세요." },
          { en: "Tell me about your most memorable hike.", ko: "가장 기억에 남는 하이킹을 말해 주세요." },
          { en: "How often do you go hiking, and who do you usually go with?", ko: "얼마나 자주 하이킹하고, 보통 누구와 가나요?" }
        ]),
        slot(S2, S2sub, [
          { en: "How has your hiking changed over the years?", ko: "하이킹이 시간이 지나며 어떻게 바뀌었나요?" },
          { en: "Have you ever faced a problem on a hike, like bad weather or getting tired? How did you deal with it?", ko: "하이킹 중 궂은 날씨나 지침 같은 문제를 겪은 적 있나요? 어떻게 대처했나요?" },
          { en: "Do you prefer easy trails or challenging ones? Compare the two.", ko: "쉬운 코스가 좋나요, 도전적인 코스가 좋나요? 비교해 주세요." }
        ])
      ]},
      no_exercise: { combo: [
        slot(S0, S0sub, [
          { en: "You mentioned you don't really exercise. Can you tell me what you usually do in your free time instead?", ko: "운동을 잘 안 한다고 했죠. 대신 여가에 보통 뭘 하는지 말해 줄래요?" },
          { en: "Describe how you like to relax and recharge.", ko: "어떻게 쉬고 재충전하는지 묘사해 주세요." },
          { en: "Describe your favorite way to spend a day off.", ko: "쉬는 날을 보내는 가장 좋아하는 방식을 묘사해 주세요." }
        ]),
        slot(S1, S1sub, [
          { en: "Walk me through a typical day off, from morning to night.", ko: "평범한 쉬는 날을 아침부터 밤까지 들려주세요." },
          { en: "Tell me about a recent day when you just relaxed. What did you do?", ko: "최근에 그냥 푹 쉬었던 하루를 말해 주세요. 뭘 했나요?" },
          { en: "How do you usually spend your evenings during the week?", ko: "평일 저녁을 보통 어떻게 보내나요?" }
        ]),
        slot(S2, S2sub, [
          { en: "How active were you in the past compared to now? Has anything changed?", ko: "과거엔 지금과 비교해 얼마나 활동적이었나요? 바뀐 게 있나요?" },
          { en: "Have you ever felt you needed to be more active? What happened?", ko: "더 활동적이어야겠다고 느낀 적 있나요? 무슨 일이 있었나요?" },
          { en: "Do you prefer staying in or going out on your days off? Compare the two.", ko: "쉬는 날 집에 있는 게 좋나요, 나가는 게 좋나요? 비교해 주세요." }
        ])
      ]},
      domestic_travel: { combo: [
        slot(S0, S0sub, [
          { en: "You said you like traveling within Korea. Can you describe a domestic place you've visited?", ko: "국내 여행을 좋아한다고 했죠. 가본 국내 장소를 묘사해 줄래요?" },
          { en: "Describe your favorite domestic travel destination. What's it known for?", ko: "가장 좋아하는 국내 여행지를 묘사해 주세요. 무엇으로 유명한가요?" },
          { en: "Describe what you usually pack and prepare for a domestic trip.", ko: "국내 여행을 위해 보통 무엇을 챙기고 준비하는지 묘사해 주세요." }
        ]),
        slot(S1, S1sub, [
          { en: "Walk me through how you usually plan and take a trip within Korea.", ko: "국내 여행을 보통 어떻게 계획하고 다녀오는지 들려주세요." },
          { en: "Tell me about your most memorable domestic trip.", ko: "가장 기억에 남는 국내 여행을 말해 주세요." },
          { en: "Who do you usually travel with, and what do you do there?", ko: "보통 누구와 여행하고, 거기서 뭘 하나요?" }
        ]),
        slot(S2, S2sub, [
          { en: "How has the way you travel within Korea changed over the years?", ko: "국내 여행 방식이 시간이 지나며 어떻게 바뀌었나요?" },
          { en: "Have you ever had a problem on a domestic trip, like a booking issue or bad weather? How did you handle it?", ko: "국내 여행 중 예약 문제나 궂은 날씨 같은 걸 겪은 적 있나요? 어떻게 해결했나요?" },
          { en: "Do you prefer city trips or nature trips within Korea? Compare the two.", ko: "국내에서 도시 여행이 좋나요, 자연 여행이 좋나요? 비교해 주세요." }
        ])
      ]},
      overseas_travel: { combo: [
        slot(S0, S0sub, [
          { en: "You mentioned you like traveling abroad. Can you describe a country or city you've visited?", ko: "해외여행을 좋아한다고 했죠. 가본 나라나 도시를 묘사해 줄래요?" },
          { en: "Describe your dream overseas destination. Why do you want to go there?", ko: "꿈꾸는 해외 여행지를 묘사해 주세요. 왜 가고 싶나요?" },
          { en: "Describe how you prepare for an overseas trip — documents, packing, and so on.", ko: "해외여행을 어떻게 준비하는지 묘사해 주세요. 서류, 짐 싸기 등이요." }
        ]),
        slot(S1, S1sub, [
          { en: "Walk me through a typical overseas trip you've taken, from departure to return.", ko: "출발부터 귀국까지 다녀온 해외여행 하나를 들려주세요." },
          { en: "Tell me about your most memorable trip abroad.", ko: "가장 기억에 남는 해외여행을 말해 주세요." },
          { en: "What do you usually do first when you arrive in a new country?", ko: "새 나라에 도착하면 보통 가장 먼저 뭘 하나요?" }
        ]),
        slot(S2, S2sub, [
          { en: "How is traveling abroad different from traveling within Korea? Compare them.", ko: "해외여행은 국내 여행과 어떻게 다른가요? 비교해 주세요." },
          { en: "Have you ever had trouble abroad, like a delay or a language barrier? How did you deal with it?", ko: "해외에서 지연이나 언어 장벽 같은 문제를 겪은 적 있나요? 어떻게 대처했나요?" },
          { en: "Has the way you travel abroad changed compared to the past?", ko: "해외여행 방식이 과거와 비교해 바뀌었나요?" }
        ])
      ]}
    },
    generic: { combo: [
      slot(S0, S0sub, [
        { en: "Let's talk about something you enjoy in your daily life. Can you describe it and tell me why you like it?", ko: "일상에서 즐기는 것에 대해 이야기해 봐요. 묘사하고 왜 좋아하는지 말해 줄래요?" },
        { en: "Describe a place you often go to. What's it like there?", ko: "자주 가는 곳을 묘사해 주세요. 거긴 어떤가요?" },
        { en: "Describe one of your favorite hobbies and how you got into it.", ko: "가장 좋아하는 취미 하나와 그걸 시작하게 된 계기를 묘사해 주세요." }
      ]),
      slot(S1, S1sub, [
        { en: "Walk me through how you usually do this — when, where, and with whom.", ko: "이걸 보통 어떻게 하는지 들려주세요. 언제, 어디서, 누구와요." },
        { en: "Tell me about a memorable experience related to it.", ko: "그것과 관련된 기억에 남는 경험을 말해 주세요." },
        { en: "How often do you do this, and what's a typical time like?", ko: "이걸 얼마나 자주 하고, 보통 어떤 모습인가요?" }
      ]),
      slot(S2, S2sub, [
        { en: "How has it changed over time, or how is it different now compared to before?", ko: "시간이 지나며 어떻게 바뀌었나요, 또는 예전과 지금이 어떻게 다른가요?" },
        { en: "Have you ever had a problem related to it? What happened, and how did you solve it?", ko: "그것과 관련해 문제를 겪은 적 있나요? 무슨 일이었고 어떻게 해결했나요?" },
        { en: "What do you like most and least about it? Compare the two.", ko: "그것에서 가장 좋은 점과 아쉬운 점은 무엇인가요? 둘을 비교해 주세요." }
      ])
    ]}
  };

  // 앱 topic.id → 풀 키
  var SELECT_POOL_TOPIC_MAP = {
    home: "home",
    performance: "show",
    concert: "concert",
    cafe: "cafe",
    bar: "bar",
    music: "music",
    jogging: "jogging",
    walking: "walking",
    hiking: "hiking",
    no_sport: "no_exercise",
    domestic: "domestic_travel",
    overseas: "overseas_travel"
  };

  global.SELECT_TOPIC_POOL = SELECT_TOPIC_POOL;
  global.SELECT_POOL_TOPIC_MAP = SELECT_POOL_TOPIC_MAP;
})(window);
