/* =========================================================
   sample-scripts.js — 기본 샘플 스크립트 3개 (카페/여행/하이킹)
   키 없는 사용자도 결과물을 미리 볼 수 있도록 내장.
   저장한 스크립트와 동일한 데이터 구조 (sample:true, extras 포함 → 해석/발음 오프라인).
   ========================================================= */
(function (global) {
  "use strict";

  var SAMPLE_SCRIPTS = [
    {
      id: "sample-cafe", sample: true, ts: 1735689600000,
      topicId: null, topicLabel: "단골 카페", level: "IM2",
      question: "Let's talk about cafes. Can you describe a cafe you like to go to? What does it look like, and what do you usually do there?",
      answer: "Sure. My favorite cafe is a small place near my house. It has big windows and a lot of plants, so it feels really cozy. I usually go there on weekends. I order an iced americano and sit by the window. Sometimes I read a book, and sometimes I just listen to music. The staff are very friendly, and they even remember my order. I like it because it is quiet and comfortable. For me, it is a perfect place to relax.",
      expressions: [
        { en: "a cozy atmosphere", ko: "아늑한 분위기" },
        { en: "sit by the window", ko: "창가에 앉다" },
        { en: "a perfect place to relax", ko: "쉬기에 딱 좋은 곳" }
      ],
      tips: [
        "usually, sometimes, on weekends 같은 빈도 표현으로 자연스럽게 시작하세요.",
        "there is/are와 형용사(cozy, friendly)로 묘사하면 IM2 수준에 잘 맞아요."
      ],
      levelNote: "단순 명료한 문장과 현재 시제 위주로 구성해 IM2 수준에 적합합니다.",
      extras: {
        ko: "네. 제가 제일 좋아하는 카페는 집 근처에 있는 작은 곳이에요. 큰 창문과 식물이 많아서 정말 아늑한 느낌이 들어요. 저는 보통 주말에 거기 가요. 아이스 아메리카노를 시키고 창가에 앉죠. 가끔은 책을 읽고, 가끔은 그냥 음악을 들어요. 직원분들이 아주 친절하고 제 주문까지 기억해줘요. 조용하고 편안해서 좋아요. 저한테는 쉬기에 딱 좋은 곳이에요.",
        pron: "슈어. 마이 페이버릿 카페 이즈 어 스몰 플레이스 니어 마이 하우스. 잇 해즈 빅 윈도우즈 앤 어 라럽 플랜츠, 쏘 잇 필즈 리얼리 코지. 아이 유주얼리 고우 데어 온 위켄즈. 아이 오더 언 아이스트 아메리카노 앤 씻 바이 더 윈도우. 썸타임즈 아이 리드 어 북, 앤 썸타임즈 아이 저슷 리쓴 투 뮤직. 더 스태프 아 베리 프렌들리, 앤 데이 이븐 리멤버 마이 오더. 아이 라익 잇 비커즈 잇츠 콰이엇 앤 컴퍼터블. 포 미, 잇츠 어 퍼펙트 플레이스 투 릴랙스."
      }
    },
    {
      id: "sample-trip", sample: true, ts: 1735603200000,
      topicId: null, topicLabel: "여행 경험", level: "IH",
      question: "I'd like to ask about a memorable trip. Tell me about a trip you took recently. Where did you go, who did you go with, and what made it special?",
      answer: "Last fall, I went on a trip to Gyeongju with two of my close friends. We had been planning it for a while, so we were all really excited. We stayed for two days and visited a lot of historical places like Bulguksa Temple. What made the trip special was the atmosphere — the streets were full of golden leaves, and everything felt calm and peaceful. On the second day, it suddenly started raining, but instead of getting upset, we just found a cozy cafe and talked for hours. Honestly, that unexpected moment turned out to be my favorite part. Even though it wasn't a long trip, it was so memorable that I still talk about it with my friends. I'd love to go back someday.",
      expressions: [
        { en: "had been planning it for a while", ko: "한동안 계획해 오던 중이었다" },
        { en: "turned out to be", ko: "결국 ~이 되었다" },
        { en: "so memorable that ~", ko: "너무 기억에 남아서 ~할 정도다" }
      ],
      tips: [
        "과거 시제와 과거완료(had been planning)를 섞으면 IH다운 시간 흐름이 살아나요.",
        "even though, what made it special 같은 연결어로 문장을 유기적으로 이어보세요."
      ],
      levelNote: "다양한 시제와 연결어로 한 문단을 자연스럽게 구성해 IH 수준에 적합합니다.",
      extras: {
        ko: "지난 가을, 저는 친한 친구 두 명과 경주로 여행을 갔어요. 한동안 계획해 오던 거라 다들 정말 들떠 있었죠. 이틀 동안 머물면서 불국사 같은 역사적인 장소를 많이 둘러봤어요. 그 여행을 특별하게 만든 건 분위기였어요 — 거리마다 노란 단풍이 가득했고, 모든 게 차분하고 평화로웠거든요. 둘째 날에는 갑자기 비가 내렸는데, 짜증 내는 대신 그냥 아늑한 카페를 찾아 몇 시간이나 이야기했어요. 솔직히 그 예상치 못한 순간이 제일 좋았던 부분이 됐어요. 긴 여행은 아니었지만, 너무 기억에 남아서 아직도 친구들이랑 그 얘기를 해요. 언젠가 꼭 다시 가보고 싶어요.",
        pron: "라슷 폴, 아이 웬트 온 어 트립 투 경주 윋 투 옵 마이 클로우즈 프렌즈. 위 해드 빈 플래닝 잇 포 어 와일, 쏘 위 워 올 리얼리 익사이팃. 위 스테이드 포 투 데이즈 앤 비짓팃 어 라럽 히스토리컬 플레이씨즈 라익 불국사 템플. 왓 메읻 더 트립 스페셜 워즈 디 앳모스피어 — 더 스트릿츠 워 풀 옵 골든 리브즈, 앤 에브리띵 펠트 캄 앤 피스풀. 온 더 세컨 데이, 잇 써든리 스타릿 레이닝, 벗 인스테덥 게링 업셋, 위 저슷 파운드 어 코지 카페 앤 토크트 포 아워즈. 어니슬리, 댓 언익스펙팃 모먼트 턴드 아웃 투 비 마이 페이버릿 파트. 이븐 도우 잇 워즌트 어 롱 트립, 잇 워즈 쏘 메모러블 댓 아이 스틸 토크 어바웃 잇 윋 마이 프렌즈. 아이드 럽 투 고우 백 썸데이."
      }
    },
    {
      id: "sample-hike", sample: true, ts: 1735516800000,
      topicId: null, topicLabel: "하이킹", level: "AL",
      question: "Let's talk about hiking. Tell me about your experience with hiking. How did you get into it, and what does it mean to you these days?",
      answer: "Honestly, I never expected to become a hiking person. A few years ago, a friend dragged me along to a nearby mountain, and to be honest, I complained the entire way up. But the moment I reached the top and saw the view, something just clicked. Ever since then, I've made it a point to hike at least twice a month, regardless of how busy I am. What I love about it isn't just the exercise — it's the sense of clarity I get when I'm surrounded by nature, with no notifications buzzing in my pocket. There's something incredibly grounding about putting one foot in front of the other for hours. Of course, not every hike goes smoothly; I've had my fair share of unexpected rain and sore knees. But if anything, those challenges have taught me patience. Looking back, what started as a reluctant favor to a friend has genuinely reshaped how I deal with stress. These days, hiking is less of a hobby and more of a ritual for me.",
      expressions: [
        { en: "something just clicked", ko: "(갑자기) 딱 와닿았다 / 흥미가 생겼다" },
        { en: "make it a point to ~", ko: "꼭 ~하려고 챙기다" },
        { en: "if anything", ko: "오히려" }
      ],
      tips: [
        "현재완료(I've made it a point, have taught)와 관용표현으로 정교함을 보여주세요.",
        "단순 사실 나열을 넘어 의미·변화(reshaped how I deal with stress)로 마무리하면 AL에 어울려요."
      ],
      levelNote: "관용구·다양한 시제·논리적 전개로 길고 정교한 담화를 구성해 AL 수준에 적합합니다.",
      extras: {
        ko: "솔직히 제가 하이킹을 즐기는 사람이 될 줄은 몰랐어요. 몇 년 전, 친구가 저를 근처 산에 끌고 갔는데, 솔직히 올라가는 내내 불평했어요. 그런데 정상에 올라 그 풍경을 본 순간, 뭔가 딱 와닿더라고요. 그때부터 저는 아무리 바빠도 한 달에 최소 두 번은 꼭 산에 가려고 챙겨요. 제가 좋아하는 건 단순히 운동만이 아니에요 — 주머니에서 알림이 울리지 않는 채로 자연에 둘러싸여 있을 때 느끼는 그 맑은 기분이죠. 몇 시간씩 한 걸음 한 걸음 내딛는 데에는 묘하게 마음을 단단하게 해주는 게 있어요. 물론 모든 산행이 순탄한 건 아니에요. 예상치 못한 비와 무릎 통증도 꽤 겪었죠. 하지만 오히려 그런 어려움이 저에게 인내심을 가르쳐줬어요. 돌이켜보면, 친구를 위한 마지못한 부탁으로 시작한 일이 제가 스트레스를 다루는 방식을 진짜로 바꿔놨어요. 요즘 하이킹은 저에게 취미라기보다 하나의 의식 같은 거예요.",
        pron: "어니슬리, 아이 네버 익스펙팃 투 비컴 어 하이킹 펄슨. 어 퓨 이어즈 어고우, 어 프렌드 드래그드 미 얼롱 투 어 니어바이 마운튼, 앤 투 비 어니슷, 아이 컴플레인드 디 엔타이어 웨이 업. 벗 더 모먼트 아이 리치트 더 탑 앤 쏘 더 뷰, 썸띵 저슷 클릭트. 에버 씬스 덴, 아이브 메이드 잇 어 포인트 투 하익 앳 리스트 트와이스 어 먼쓰, 리가들리스 옵 하우 비지 아이 엠. 왓 아이 럽 어바웃 잇 이즌트 저슷 디 엑서사이즈 — 잇츠 더 센스 옵 클래러티 아이 겟 웬 아임 써라운딧 바이 네이처, 윋 노우 노티피케이션즈 버징 인 마이 파킷. 데어즈 썸띵 인크레더블리 그라운딩 어바웃 푸링 원 풋 인 프런트 옵 디 어더 포 아워즈. 옵 코스, 낫 에브리 하익 고우즈 스무들리; 아이브 해드 마이 페어 셰어 옵 언익스펙팃 레인 앤 쏘어 니즈. 벗 이프 에니띵, 도우즈 챌린지즈 햅 토트 미 페이션스. 루킹 백, 왓 스타릿 애즈 어 릴럭턴트 페이버 투 어 프렌드 해즈 제뉴인리 리셰입트 하우 아이 딜 윋 스트레스. 디즈 데이즈, 하이킹 이즈 레스 옵 어 하비 앤 모어 옵 어 리추얼 포 미."
      }
    }
  ];

  global.SAMPLE_SCRIPTS = SAMPLE_SCRIPTS;
})(window);
