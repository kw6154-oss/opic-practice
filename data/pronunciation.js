/* =========================================================
   pronunciation.js — 발음 연습 문장 풀 + 듣기 연습 링크
   각 문장은 { en, ko } (ko는 자연스러운 한국어 의역).
   AI 호출 없이 로컬 데이터로만 동작.
   ========================================================= */
(function (global) {
  "use strict";

  var PRONUNCIATION_SENTENCES = {
    IM2: [
      { en: "I usually grab a cup of coffee on my way to work.", ko: "저는 보통 출근길에 커피 한 잔을 사요." },
      { en: "There is a small park near my house.", ko: "집 근처에 작은 공원이 있어요." },
      { en: "I like listening to music when I exercise.", ko: "저는 운동할 때 음악 듣는 걸 좋아해요." },
      { en: "My favorite cafe has a really cozy atmosphere.", ko: "제가 좋아하는 카페는 분위기가 정말 아늑해요." },
      { en: "I go jogging twice a week in the morning.", ko: "저는 일주일에 두 번 아침에 조깅을 해요." },
      { en: "Last weekend, I went hiking with my friends.", ko: "지난 주말에 친구들이랑 등산을 갔어요." },
      { en: "I live in an apartment with my family.", ko: "저는 가족과 함께 아파트에 살아요." },
      { en: "On weekends, I usually relax at home.", ko: "주말에는 보통 집에서 쉬어요." },
      { en: "I enjoy traveling to new places in Korea.", ko: "저는 국내의 새로운 곳을 여행하는 걸 즐겨요." },
      { en: "The weather was perfect for a walk yesterday.", ko: "어제는 산책하기에 딱 좋은 날씨였어요." },
      { en: "I usually listen to music on my phone.", ko: "저는 보통 휴대폰으로 음악을 들어요." },
      { en: "My neighborhood is quiet and safe.", ko: "우리 동네는 조용하고 안전해요." },
      { en: "I sometimes meet my friends at a cafe near my office.", ko: "가끔 회사 근처 카페에서 친구들을 만나요." },
      { en: "I started jogging to stay healthy.", ko: "건강을 지키려고 조깅을 시작했어요." },
      { en: "My favorite season for hiking is fall.", ko: "등산하기에 제가 가장 좋아하는 계절은 가을이에요." },
      { en: "I took a lot of pictures during my trip.", ko: "여행하면서 사진을 정말 많이 찍었어요." },
      { en: "I feel relaxed when I drink coffee.", ko: "커피를 마시면 마음이 편안해져요." },
      { en: "I usually go to bed around midnight.", ko: "저는 보통 자정쯤에 자요." },
      { en: "My family likes to eat out on weekends.", ko: "우리 가족은 주말에 외식하는 걸 좋아해요." },
      { en: "I want to visit Busan again someday.", ko: "언젠가 부산에 다시 가보고 싶어요." }
    ],
    IH: [
      { en: "Whenever I feel stressed, I go for a long walk to clear my head.", ko: "스트레스를 받을 때마다 머리를 식히려고 오래 산책을 해요." },
      { en: "The cafe I go to has a unique vibe that makes me feel relaxed.", ko: "제가 자주 가는 카페는 독특한 분위기가 있어서 마음이 편해져요." },
      { en: "I've been trying to work out regularly, but it's not always easy.", ko: "꾸준히 운동하려고 노력 중인데, 늘 쉽지만은 않아요." },
      { en: "One thing I love about hiking is the sense of accomplishment at the top.", ko: "등산에서 제일 좋은 건 정상에 올랐을 때의 성취감이에요." },
      { en: "Compared to a few years ago, I listen to much more variety of music.", ko: "몇 년 전에 비하면 훨씬 다양한 음악을 들어요." },
      { en: "If I had more free time, I would definitely travel more often.", ko: "시간이 더 많다면 분명 여행을 더 자주 다닐 거예요." },
      { en: "I remember the first time I visited Jeju Island with my family.", ko: "가족과 처음 제주도에 갔던 때가 기억나요." },
      { en: "What I usually do on weekends depends on how tired I am.", ko: "주말에 뭘 하는지는 제가 얼마나 피곤한지에 따라 달라요." },
      { en: "Even though it was raining, we decided to continue our trip.", ko: "비가 왔는데도 우리는 여행을 계속하기로 했어요." },
      { en: "I prefer quiet places where I can focus on my own thoughts.", ko: "저는 제 생각에 집중할 수 있는 조용한 곳을 좋아해요." },
      { en: "It usually takes about thirty minutes to get to the trail by bus.", ko: "버스로 등산로까지 보통 30분 정도 걸려요." },
      { en: "I've noticed that exercising in the morning makes my whole day better.", ko: "아침에 운동하면 하루 전체가 더 좋아진다는 걸 느꼈어요." },
      { en: "The thing is, I don't get to travel as often as I would like.", ko: "사실은, 제가 원하는 만큼 자주 여행하지는 못해요." },
      { en: "While I was traveling, I ran into an unexpected problem with my booking.", ko: "여행 중에 예약 문제로 예상치 못한 일을 겪었어요." },
      { en: "I used to listen to pop music a lot, but these days I'm into jazz.", ko: "예전엔 팝을 많이 들었는데, 요즘은 재즈에 빠졌어요." },
      { en: "Honestly, the best part of my weekend is having coffee with no schedule.", ko: "솔직히 주말에서 제일 좋은 건 아무 일정 없이 커피 마시는 거예요." },
      { en: "As soon as I get home, I usually change and go out for a quick run.", ko: "집에 도착하면 보통 옷을 갈아입고 가볍게 달리러 나가요." },
      { en: "It was such a memorable trip that I still talk about it with my friends.", ko: "정말 기억에 남는 여행이라 아직도 친구들과 그 얘기를 해요." },
      { en: "One of the reasons I love that cafe is that the staff remember my order.", ko: "그 카페를 좋아하는 이유 중 하나는 직원분들이 제 주문을 기억해줘서예요." },
      { en: "By the time we reached the top, the view made all the effort worth it.", ko: "정상에 도착했을 때, 그 경치를 보니 모든 고생이 보람 있었어요." }
    ],
    AL: [
      { en: "Looking back, that trip completely changed my perspective on traveling alone.", ko: "돌이켜보면, 그 여행은 혼자 여행하는 것에 대한 제 생각을 완전히 바꿔놨어요." },
      { en: "What makes that cafe stand out is the meticulous attention to every little detail.", ko: "그 카페가 특별한 건 사소한 부분 하나하나까지 세심하게 신경 쓴다는 점이에요." },
      { en: "Had I known the trail would be that challenging, I would have prepared more thoroughly.", ko: "그 코스가 그렇게 힘들 줄 알았다면 훨씬 더 철저히 준비했을 거예요." },
      { en: "There's something incredibly refreshing about jogging at dawn before the city wakes up.", ko: "도시가 깨어나기 전 새벽에 조깅하는 건 말할 수 없이 상쾌해요." },
      { en: "The atmosphere was so inviting that we ended up staying for hours without realizing it.", ko: "분위기가 너무 좋아서 우리는 시간 가는 줄도 모르고 몇 시간이나 머물렀어요." },
      { en: "Over the years, my taste in music has evolved from mainstream pop to indie genres.", ko: "세월이 흐르면서 제 음악 취향이 대중적인 팝에서 인디 쪽으로 바뀌었어요." },
      { en: "Despite the unpredictable weather, the breathtaking scenery made every step worthwhile.", ko: "날씨가 변덕스러웠지만, 숨 막히는 풍경 덕분에 한 걸음 한 걸음이 다 가치 있었어요." },
      { en: "I make it a point to explore unfamiliar neighborhoods whenever I get the chance.", ko: "저는 기회가 될 때마다 낯선 동네를 둘러보려고 일부러 챙겨요." },
      { en: "What struck me the most was how effortlessly the locals welcomed us.", ko: "가장 인상 깊었던 건 현지 사람들이 너무도 자연스럽게 우리를 반겨준 거였어요." },
      { en: "It's not merely about exercising; it's about maintaining a sustainable routine.", ko: "단순히 운동하는 게 아니라, 꾸준히 이어갈 수 있는 루틴을 지키는 게 핵심이에요." },
      { en: "Not until I reached the summit did I realize how far I had come.", ko: "정상에 오르고 나서야 제가 얼마나 멀리 왔는지 실감했어요." },
      { en: "If anything, the setback taught me to plan with a healthy margin for error.", ko: "오히려 그 실패가 여유를 두고 계획하는 법을 가르쳐줬어요." },
      { en: "The neighborhood has undergone a remarkable transformation over the past decade.", ko: "그 동네는 지난 10년 동안 눈에 띄게 변했어요." },
      { en: "I find it fascinating how a simple cup of coffee can anchor an entire morning routine.", ko: "커피 한 잔이 아침 루틴 전체의 중심이 될 수 있다는 게 참 흥미로워요." },
      { en: "Rarely do I come across a place that balances comfort and character so well.", ko: "편안함과 개성을 이렇게 잘 갖춘 곳은 좀처럼 만나기 어려워요." },
      { en: "What I appreciate most is the subtle interplay between the music and the ambiance.", ko: "제가 가장 마음에 드는 건 음악과 분위기가 은근하게 어우러지는 점이에요." },
      { en: "Given the chance, I would gladly retrace that entire journey step by step.", ko: "기회가 된다면 그 여정 전체를 한 걸음씩 다시 밟아보고 싶어요." },
      { en: "It dawned on me that consistency matters far more than intensity.", ko: "강도보다 꾸준함이 훨씬 중요하다는 걸 문득 깨달았어요." },
      { en: "The experience was equal parts exhausting and exhilarating, which is exactly why I cherish it.", ko: "그 경험은 지치는 만큼이나 짜릿했는데, 그래서 더 소중하게 느껴져요." },
      { en: "Suffice it to say, that single weekend reshaped how I spend my free time.", ko: "한마디로, 그 주말 하나가 제 여가 시간 보내는 방식을 완전히 바꿔놨어요." }
    ],
    FILLER: [
      { en: "Oh, that's a really good question.", ko: "오, 정말 좋은 질문이네요." },
      { en: "Well, let me think about that for a second.", ko: "음, 잠깐 생각 좀 해볼게요." },
      { en: "Hmm, where should I start?", ko: "흠, 어디서부터 말해야 할까요?" },
      { en: "Actually, that reminds me of something.", ko: "아, 그러고 보니 생각나는 게 있어요." },
      { en: "You know, it's funny that you ask that.", ko: "있잖아요, 그걸 물어보시니 재밌네요." },
      { en: "Honestly, I've never really thought about it before.", ko: "솔직히 전엔 한 번도 진지하게 생각해 본 적이 없어요." },
      { en: "Let me see... how can I put this?", ko: "글쎄요… 이걸 어떻게 말하면 좋을까요?" },
      { en: "Well, off the top of my head,", ko: "음, 지금 바로 떠오르는 걸로는," },
      { en: "That's a tough one, but I'd say...", ko: "어려운 질문이네요, 그래도 말하자면…" },
      { en: "Okay, so here's the thing.", ko: "자, 그러니까 이런 거예요." },
      { en: "I mean, there are a couple of things that come to mind.", ko: "그러니까, 떠오르는 게 몇 가지 있어요." },
      { en: "To be honest with you,", ko: "솔직히 말씀드리면," },
      { en: "Now that I think about it,", ko: "지금 생각해 보니," },
      { en: "How should I put it... it's kind of hard to explain.", ko: "뭐랄까… 설명하기가 좀 어렵네요." },
      { en: "Anyway, long story short,", ko: "아무튼, 간단히 말하자면," }
    ]
  };

  var YOUTUBE_LINKS = {
    IM2: "https://www.youtube.com/watch?v=OWYGBBG2hys",
    IH:  "https://www.youtube.com/watch?v=FhAXowYcV3Q",
    AL:  "https://www.youtube.com/watch?v=4jej5i7dbTA",
    tip: "https://www.youtube.com/watch?v=Ivwc3Ou0Z9E"
  };

  global.PRONUNCIATION_SENTENCES = PRONUNCIATION_SENTENCES;
  global.YOUTUBE_LINKS = YOUTUBE_LINKS;
})(window);
