/* =========================================================
   sample-scripts.js — 기본 샘플 스크립트 (묘사·서술형 5 + 롤플레이 4)
   키 없는 사용자도 결과물을 미리 볼 수 있도록 내장.
   원본: new_opic_scripts.md (합본) — Part1→type:"description", Part2→type:"roleplay"
   매핑: [English Script]→answer, [한국어 뜻]→extras.ko, [원어민 발음 표기]→extras.pron
   질문 카드 항목은 단일 answer 대신 cards:[{label,en,ko,pron}] 배열로 보관.
   ========================================================= */
(function (global) {
  "use strict";

  var SAMPLE_SCRIPTS = [
    /* ===================== Part 1. 묘사·서술형 ===================== */
    {
      id: "sample-park", sample: true, type: "description", ts: 1735689600000,
      topicId: "jogging", topicLabel: "공원 + 조깅 / 걷기", level: "IH",
      question: "Let's talk about how you relax. What do you do to clear your mind when you feel stressed? Tell me about a place you like to go.",
      answer: "Whenever I'm feeling overwhelmed, my go-to place is a park about ten minutes from my apartment. I'll be honest — I'm job hunting at the moment, and the constant waiting for results gets to me more than I'd like to admit. So when my head feels cluttered, I throw on my running shoes and head out. I usually start with a slow jog along the river trail and then cool down with a long walk. There's something about the rhythm of running and the cool morning air that just resets my brain. By the time I get home, the problems that felt huge an hour earlier somehow seem a lot smaller. It's honestly the cheapest therapy I know.",
      expressions: [
        { en: "my go-to place", ko: "내가 늘 찾는 곳, 단골 장소" },
        { en: "gets to me", ko: "나를 힘들게 하다, 신경 쓰이게 하다" },
        { en: "resets my brain", ko: "머리를 리셋시켜 주다" }
      ],
      tips: [
        "feeling overwhelmed, gets to me 같은 감정 표현으로 도입을 자연스럽게 시작하세요.",
        "the cheapest therapy I know 같은 비유로 마무리하면 인상이 강해져요."
      ],
      levelNote: "다양한 시제와 감정 묘사, 연결어로 한 문단을 자연스럽게 이어 IH 수준에 적합합니다.",
      keywords: ["overwhelmed", "go-to park", "job hunting", "running shoes", "jog + walk", "resets my brain", "problems smaller", "cheapest therapy"],
      structure: [
        { label: "상황", range: [1, 2] },
        { label: "행동", range: [3, 4] },
        { label: "감정", range: [5, 6] },
        { label: "마무리", range: [7, 7] }
      ],
      paraphrases: [
        { ko: "공원에 간다", options: ["I head to the park", "I go for a run", "I get some fresh air"] },
        { ko: "스트레스를 받는다", options: ["I get stressed easily", "it gets to me", "I feel overwhelmed"] }
      ],
      extras: {
        ko: "뭔가에 압도당하는 기분이 들 때면, 제가 늘 찾는 곳은 집에서 10분쯤 떨어진 공원이에요. 솔직히 말하면 지금 취업 준비 중이라, 결과를 계속 기다리는 게 인정하고 싶은 것보다 더 힘들거든요. 그래서 머릿속이 복잡해지면 러닝화를 신고 그냥 나가요. 보통 강변 산책로를 따라 천천히 조깅하다가 긴 걷기로 마무리해요. 달리는 리듬이랑 선선한 아침 공기에는 뭔가 머리를 리셋시켜 주는 게 있어요. 집에 돌아올 때쯤이면, 한 시간 전엔 거대해 보였던 고민들이 어쩐지 훨씬 작게 느껴져요. 솔직히 제가 아는 가장 값싼 치료법이에요.",
        pron: "웬에붤 아임 필링 오우벌웰름드, 마이 고우-투 플레이스 이저 팍 어바웃 텐 미닛츠 프럼 마이 아팟먼(트). 아일 비 아-니스트 — 아임 좝 헌팅 앳 더 모먼트, 앤 더 칸스턴트 웨이링 풔 뤼절츠 겟츠 투 미 모어 댄 아이드 라익 투 엇밋. 쏘 웬 마이 헤드 필즈 클러러드, 아이 쓰로우 온 마이 뤄닝 슈즈 앤 헤드 아웃. 아 유절리 스탓 위더 슬로우 좍 얼롱 더 뤼버 츄뤠일 앤 덴 쿨 다운 위더 롱 웤. 데얼즈 썸띵 어바웃 더 뤼듬 어브 뤄닝 앤 더 쿨 모닝 에얼 댓 저슷 뤼셋츠 마이 브뤠인. 바이 더 타임 아이 겟 홈, 더 프롸블럼즈 댓 펠트 휴-지 언 아워 얼리어 썸하우 씸 어 랏 스몰러. 이츠 아-니슬리 더 칲이스트 떼뤄피 아이 노우."
      }
    },
    {
      id: "sample-cafe", sample: true, type: "description", ts: 1735603200000,
      topicId: "cafe", topicLabel: "카페 + 음악 감상", level: "IH",
      question: "Let's talk about cafes. Tell me about a cafe you go to and what you usually do there.",
      answer: "I'm a bit of a cafe person, to be honest. There's this cozy little place around the corner from where I live, and I've practically become a regular there. Since I live alone, my apartment can feel a little too quiet sometimes, so the cafe is where I go to feel surrounded by people without actually having to talk to anyone. I'll grab an iced americano, put my earphones in, and lose myself in whatever playlist I'm into that week — lately it's been a lot of mellow R&B. There's a certain comfort in the background hum of the espresso machine and the quiet chatter. That hour or two completely recharges me. It's the part of my day I look forward to the most.",
      expressions: [
        { en: "become a regular", ko: "단골이 되다" },
        { en: "lose myself in", ko: "~에 푹 빠져들다" },
        { en: "recharges me", ko: "나를 재충전시켜 주다" }
      ],
      tips: [
        "become a regular, lose myself in 같은 표현으로 일상 습관을 생생하게 묘사하세요.",
        "since I live alone처럼 이유를 덧붙이면 담화가 풍부해져요."
      ],
      levelNote: "구체적 상황 설명과 연결어로 자연스럽게 문단을 구성해 IH 수준에 적합합니다.",
      keywords: ["cafe person", "cozy place nearby", "regular", "live alone (too quiet)", "iced americano + earphones", "mellow R&B", "espresso hum", "recharges me", "look forward to most"],
      structure: [
        { label: "상황", range: [1, 3] },
        { label: "행동", range: [4, 4] },
        { label: "감정", range: [5, 6] },
        { label: "마무리", range: [7, 7] }
      ],
      paraphrases: [
        { ko: "음악을 듣는다", options: ["I put my earphones in", "I lose myself in a playlist", "I tune everything out with music"] },
        { ko: "편안하다 / 충전된다", options: ["it recharges me", "it relaxes me", "it clears my head"] }
      ],
      extras: {
        ko: "솔직히 저는 카페를 좀 좋아하는 사람이에요. 집 모퉁이를 돌면 아늑한 작은 카페가 하나 있는데, 사실상 단골이 됐어요. 혼자 살다 보니 집이 가끔 너무 조용하게 느껴져서, 굳이 누구랑 말하지 않아도 사람들 속에 있는 기분을 느끼고 싶을 때 그 카페에 가요. 아이스 아메리카노를 한 잔 시키고 이어폰을 꽂은 다음, 그 주에 빠져 있는 플레이리스트에 푹 빠져들어요. 요즘은 잔잔한 R&B를 많이 들어요. 에스프레소 머신 소리랑 나직한 대화 소리에는 묘한 편안함이 있어요. 그 한두 시간이 저를 완전히 충전시켜 줘요. 하루 중 가장 기다려지는 시간이에요.",
        pron: "아임 어 빗 어버 카페이 펄슨, 투비 아-니스트. 데얼즈 디스 코지 리를 플레이스 어롸운 더 코너 프럼 웨어 아이 리브, 앤 아이브 프뢕티클리 비컴 어 뤠귤러 데얼. 씬스 아이 리브 얼론, 마이 아팟먼트 캔 필 어 리를 투 콰이엇 썸타임즈, 쏘 더 카페이 이즈 웨어 아이 고 투 필 써롸운디드 바이 피플 위다웃 액츌리 해빙 투 톡 투 에니원. 아일 그뢥 언 아이스트 어메뤼카노, 풋 마이 이어폰즈 인, 앤 루즈 마이셀프 인 웟에버 플레이리슷 아임 인투 댓 윅 — 레잇리 잇츠 빈 어 라러브 멜로우 알앤비. 데얼저 써튼 컴풔트 인 더 백그롸운(드) 험 어브 디 에스프뤠소 머쉰 앤 더 콰이엇 채러. 댓 아워 오어 투 컴플릿리 뤼차쥐스 미. 이츠 더 팟 어브 마이 데이 아이 룩 풔워드 투 더 모스트."
      }
    },
    {
      id: "sample-kpop", sample: true, type: "description", ts: 1735516800000,
      topicId: "concert", topicLabel: "K-pop + BTS + 콘서트", level: "AL",
      question: "Let's talk about music. What kind of music do you enjoy, and have you ever been to a concert? Tell me about it.",
      answer: "If there's one thing I can talk about forever, it's K-pop. The production, the choreography, the way a hook gets stuck in your head for days — I'm completely hooked. BTS has been my favorite group for years, and I actually got to see them live last year. I still remember walking into that stadium and feeling the floor literally vibrate from the crowd. Listening to their songs through earphones is great, but it's nothing compared to singing every word at the top of your lungs with thousands of other fans. By the end of the night my voice was gone and my legs were sore, but I had the biggest smile on my face. If I had the chance, I'd go again in a heartbeat.",
      expressions: [
        { en: "completely hooked", ko: "완전히 빠져 있는, 푹 빠진" },
        { en: "at the top of your lungs", ko: "목청껏" },
        { en: "in a heartbeat", ko: "망설임 없이, 순식간에" }
      ],
      tips: [
        "completely hooked, at the top of your lungs 같은 관용표현으로 열정을 드러내세요.",
        "이어폰 감상과 라이브 경험을 대비(nothing compared to)시키면 AL다운 전개가 돼요."
      ],
      levelNote: "관용표현·생생한 묘사·논리적 전개로 길고 정교한 담화를 구성해 AL 수준에 적합합니다.",
      keywords: ["talk forever about K-pop", "completely hooked", "BTS favorite", "saw them live last year", "floor vibrate", "singing with thousands", "voice gone, legs sore", "biggest smile", "go again in a heartbeat"],
      structure: [
        { label: "도입", range: [1, 2] },
        { label: "경험", range: [3, 4] },
        { label: "감정", range: [5, 6] },
        { label: "마무리", range: [7, 7] }
      ],
      paraphrases: [
        { ko: "정말 좋아한다", options: ["I'm a huge fan", "I'm completely hooked", "I can't get enough of it"] },
        { ko: "또 가고 싶다", options: ["I'd go again in a heartbeat", "I'd jump at the chance", "I can't wait to go back"] }
      ],
      extras: {
        ko: "제가 끝없이 떠들 수 있는 게 하나 있다면, 그건 K팝이에요. 그 완성도, 안무, 후렴구가 며칠씩 머릿속에 맴도는 그 느낌까지 — 완전히 빠져 있어요. BTS는 몇 년째 제가 가장 좋아하는 그룹인데, 작년에 실제로 라이브로 봤어요. 그 경기장에 들어서면서 관중 때문에 바닥이 말 그대로 울리는 걸 느꼈던 게 아직도 기억나요. 이어폰으로 노래를 듣는 것도 좋지만, 수천 명의 다른 팬들과 목청껏 모든 가사를 따라 부르는 것에 비할 바가 아니에요. 그날 밤이 끝날 때쯤엔 목이 다 쉬고 다리도 아팠지만, 얼굴엔 세상 가장 큰 미소가 걸려 있었어요. 기회가 된다면 망설임 없이 또 갈 거예요.",
        pron: "이프 데얼즈 원 띵 아이 캔 톡 어바웃 풔레버, 이츠 케이팝. 더 프뤄덕션, 더 코뤼아그뤄피, 더 웨이 어 훅 겟츠 스턱 인 유어 헤드 풔 데이즈 — 아임 컴플릿리 훅트. 비티에스 해즈 빈 마이 페이버륏 그룹 풔 이얼즈, 앤 아이 액츌리 갓 투 씨 뎀 라이브 래스트 이어. 아이 스틸 뤼멤버 워킹 인투 댓 스테이디엄 앤 필링 더 플로어 리러뤌리 바이브뤠잇 프럼 더 크롸우드. 리스닝 투 데어 쏭즈 쓰루 이어폰즈 이즈 그뤠잇, 벗 잇츠 낫띵 컴페얼드 투 씽잉 에브뤼 워드 앳 더 탑 어브 유어 렁즈 위드 따우전즈 어브 아더 팬즈. 바이 디 엔드 어브 더 나잇 마이 보이스 워즈 곤 앤 마이 레그즈 워 쏘어, 벗 아이 해드 더 비기스트 스마일 온 마이 페이스. 이프 아이 해드 더 챈스, 아이드 고 어겐 인 어 핫빗."
      }
    },
    {
      id: "sample-trip", sample: true, type: "description", ts: 1735430400000,
      topicId: "domestic", topicLabel: "여행", level: "IH",
      question: "I'd like to ask about travel. Tell me about your most memorable trip. Where did you go, who did you go with, and what made it special?",
      answer: "My favorite trip so far has to be the one I took to [Busan / Japan] last year. I went with a close friend, and honestly, everything just fell into place. The weather was perfect — warm enough to walk around all day, but not so hot that we were miserable. What really made the trip, though, was the food. We wandered into this tiny local spot with no English menu, just pointed at whatever looked good, and ended up having one of the best meals of my life. We took way too many photos and laughed about the silliest things. It was exactly the kind of break I needed. I'd recommend that place to anyone without hesitation.",
      expressions: [
        { en: "fell into place", ko: "딱딱 맞아떨어지다" },
        { en: "what really made the trip", ko: "그 여행을 진짜 특별하게 만든 것" },
        { en: "without hesitation", ko: "망설임 없이" }
      ],
      tips: [
        "질문에 맞춰 [Busan / Japan] 부분만 지역명으로 바꿔 사용하세요.",
        "what really made the trip was ~ 구조로 핵심 포인트를 강조하면 좋아요."
      ],
      levelNote: "과거 시제와 묘사, what made it special 같은 연결어로 IH 수준에 적합합니다.",
      keywords: ["favorite trip", "[Busan/Japan] last year", "close friend", "everything fell into place", "perfect weather", "the food (no English menu, just pointed)", "best meal", "too many photos", "break I needed", "recommend without hesitation"],
      structure: [
        { label: "상황", range: [1, 2] },
        { label: "디테일", range: [3, 5] },
        { label: "감정", range: [6, 7] },
        { label: "마무리", range: [8, 8] }
      ],
      paraphrases: [
        { ko: "정말 좋았다", options: ["everything fell into place", "it was a perfect getaway", "it couldn't have gone better"] },
        { ko: "강력 추천한다", options: ["I'd recommend it without hesitation", "I can't recommend it enough", "you have to go"] }
      ],
      extras: {
        ko: "지금까지 제가 가장 좋아한 여행은 작년에 다녀온 [부산 / 일본] 여행이에요. 친한 친구랑 갔는데, 솔직히 모든 게 딱딱 맞아떨어졌어요. 날씨가 완벽했어요. 하루 종일 돌아다닐 만큼 따뜻하면서도, 힘들 정도로 덥지는 않았거든요. 근데 그 여행을 진짜 특별하게 만든 건 음식이었어요. 영어 메뉴도 없는 작은 현지 식당에 우연히 들어가서, 그냥 맛있어 보이는 걸 손가락으로 가리켰는데, 인생 최고의 식사 중 하나를 하게 됐어요. 사진도 정말 많이 찍고 별것 아닌 일에도 깔깔 웃었어요. 딱 제가 필요했던 그런 휴식이었어요. 누구에게든 망설임 없이 추천할 곳이에요.",
        pron: "마이 페이버륏 츄륍 쏘 파 해즈 투 비 더 원 아이 툭 투 [부싼 / 져팬] 래스트 이어. 아이 웬 위더 클로우스 프뤤, 앤 아-니슬리, 에브뤼띵 저슷 펠 인투 플레이스. 더 웨더 워즈 펄펙트 — 웜 이너프 투 웤 어롸운드 올 데이, 벗 낫 쏘 핫 댓 위 워 미저뤄블. 웟 륄리 메이드 더 츄륍, 도우, 워즈 더 푸-드. 위 완덜드 인투 디스 타이니 로컬 스팟 위드 노 잉글리쉬 메뉴, 저슷 포인티드 앳 웟에버 룩트 굿, 앤 엔디드 업 해빙 원 어브 더 베스트 밀즈 어브 마이 라이프. 위 툭 웨이 투 메니 포토즈 앤 래프트 어바웃 더 씰리이스트 띵즈. 잇 워즈 이그잭리 더 카인드 어브 브뤠익 아이 니디드. 아이드 뤠커멘드 댓 플레이스 투 에니원 위다웃 헤지테이션."
      }
    },
    {
      id: "sample-stress", sample: true, type: "description", ts: 1735344000000,
      topicId: "bar", topicLabel: "쇼핑 / 술집 가기", level: "IH",
      question: "Everyone has their own way to relieve stress. What do you usually do to unwind? Tell me about it in detail.",
      answer: "Like I said, job hunting has been pretty draining lately, so I've learned to make time to unwind. When the stress really piles up, I usually go [shopping / to a bar] with my best friend. We'll talk about where we see ourselves in a few years, complain about everything under the sun, and somehow end up laughing until our stomachs hurt. There's something about [treating myself to a new outfit / sharing a cold beer] that lifts the weight off my shoulders, at least for a while. It might not solve anything, but it reminds me not to take everything so seriously. That's my go-to way to blow off steam.",
      expressions: [
        { en: "piles up", ko: "(스트레스가) 쌓이다" },
        { en: "lifts the weight off my shoulders", ko: "어깨의 짐을 덜어주다" },
        { en: "blow off steam", ko: "스트레스를 풀다" }
      ],
      tips: [
        "질문에 맞춰 [shopping / to a bar], [treating myself to a new outfit / sharing a cold beer] 부분을 바꿔 쓰세요.",
        "blow off steam, lifts the weight off my shoulders 같은 관용표현으로 마무리하세요."
      ],
      levelNote: "조건·습관 표현과 관용구로 한 문단을 유기적으로 이어 IH 수준에 적합합니다.",
      keywords: ["job hunting draining", "make time to unwind", "[shopping/bar] with best friend", "talk about future, complain", "laugh until stomachs hurt", "[new outfit/cold beer] lifts the weight", "not solve but reminds", "go-to way to blow off steam"],
      structure: [
        { label: "상황", range: [1, 2] },
        { label: "행동", range: [3, 3] },
        { label: "감정", range: [4, 5] },
        { label: "마무리", range: [6, 6] }
      ],
      paraphrases: [
        { ko: "스트레스를 푼다", options: ["I blow off steam", "I unwind", "I take the edge off"] },
        { ko: "기분이 나아진다", options: ["it lifts the weight off my shoulders", "it takes my mind off things", "it makes me feel so much better"] }
      ],
      extras: {
        ko: "말씀드렸듯이 요즘 취업 준비가 꽤 진을 빼서, 저는 숨 돌릴 시간을 일부러 만드는 법을 익혔어요. 스트레스가 정말 쌓일 때면, 보통 베프랑 [쇼핑하러 / 술집에] 가요. 우리 몇 년 뒤에 어떤 모습일지 얘기하고, 세상만사 다 불평하다가, 어느새 배가 아플 때까지 웃게 돼요. [새 옷 한 벌로 저를 챙기는 것 / 시원한 맥주를 함께 나누는 것]에는 어깨의 짐을 잠시나마 덜어주는 뭔가가 있어요. 뭘 해결해 주진 않지만, 모든 걸 너무 심각하게 받아들이지 말자고 다시 일깨워 줘요. 그게 제가 스트레스를 푸는 단골 방법이에요.",
        pron: "라익 아이 쎄드, 좝 헌팅 해즈 빈 프뤼리 드뤠이닝 레잇리, 쏘 아이브 런드 투 메익 타임 투 언와인드. 웬 더 스트뤠스 륄리 파일즈 업, 아 유절리 고 [솨핑 / 투어 바] 위드 마이 베스트 프뤤. 위일 톡 어바웃 웨어 위 씨 아워셀브즈 인 어 퓨 이얼즈, 컴플레인 어바웃 에브뤼띵 언더 더 썬, 앤 썸하우 엔드 업 래핑 언틸 아워 스토먹스 헐트. 데얼즈 썸띵 어바웃 [츄뤼링 마이셀프 투 어 뉴 아웃핏 / 쉐어링 어 콜드 비어] 댓 리프츠 더 웨잇 오프 마이 숄더즈, 앳 리스트 풔 어 와일. 잇 마잇 낫 쏠브 에니띵, 벗 잇 뤼마인즈 미 낫 투 테익 에브뤼띵 쏘 씨뤼어슬리. 댓츠 마이 고우-투 웨이 투 블로우 오프 스팀."
      }
    },

    /* ===================== Part 2. 롤플레이 ===================== */
    {
      id: "rp-call-open", sample: true, type: "roleplay", ts: 1735257600000,
      topicId: null, topicLabel: "롤플레이 · 전화 오프닝 (문의/예약)", level: "IH",
      question: "You need to make a phone call to get some information. Call the place, greet them, and explain your situation.",
      answer: "Hi, is this [장소 이름]? Great. I'm hoping you can help me out — I've got a few quick questions about [the tickets / my reservation]. This is actually my first time, so bear with me.",
      expressions: [],
      tips: [
        "콘서트 티켓 예매, 식당 예약, 상점 물건 문의 등 전화 걸 때 활용하세요.",
        "[장소 이름], [the tickets / my reservation] 부분만 상황에 맞춰 바꿔 쓰세요."
      ],
      levelNote: "인사 → 용건 → 양해 순서로 자연스럽게 전화 오프닝을 구성합니다.",
      keywords: ["Hi, is this [장소]?", "help me out", "few quick questions about [티켓/예약]", "first time", "bear with me"],
      structure: [
        { label: "인사", range: [1, 2] },
        { label: "용건", range: [3, 3] },
        { label: "양해", range: [4, 4] }
      ],
      paraphrases: [
        { ko: "도와주세요", options: ["I'm hoping you can help me out", "Could you help me with something", "I could use some help"] }
      ],
      extras: {
        ko: "안녕하세요, 거기 [장소 이름]이죠? 다행이네요. 좀 도와주셨으면 하는데요 — [티켓 / 예약]에 대해 빠르게 몇 가지 여쭤볼 게 있어서요. 사실 이번이 처음이라, 조금 양해 부탁드려요.",
        pron: "하이, 이즈 디스 [장소 이름]? 그뤠잇. 아임 호핑 유 캔 헲 미 아웃 — 아이브 갓 어 퓨 퀵 퀘스쳔즈 어바웃 [더 티킷츠 / 마이 뤠절베이션]. 디스 이즈 액츌리 마이 펄스트 타임, 쏘 베어 위드 미."
      }
    },
    {
      id: "rp-q-cards", sample: true, type: "roleplay", ts: 1735171200000,
      topicId: null, topicLabel: "롤플레이 · 세부 질문하기 (질문 카드)", level: "IH",
      question: "Ask three or four questions to get the details you need. Pick the cards that fit the situation.",
      cards: [
        { label: "① 가격", en: "First off, could you tell me how much it is?", ko: "우선, 가격이 얼마인지 알려주시겠어요?", pron: "펄스트 오프, 쿠쥬 텔 미 하우 머치 잇 이즈?" },
        { label: "② 운영 시간", en: "What time do you open and close?", ko: "몇 시에 열고 닫나요?", pron: "왓 타임 두 유 오픈 앤 클로우즈?" },
        { label: "③ 위치", en: "Where exactly are you located?", ko: "정확히 어디에 위치해 있나요?", pron: "웨어 이그잭리 알 유 로케이리드?" },
        { label: "④ 예약 방법", en: "Do I need to book in advance, or can I just walk in?", ko: "미리 예약해야 하나요, 아니면 그냥 가도 되나요?", pron: "두 아이 니드 투 북 인 어드밴스, 오어 캔 아이 저슷 웍 인?" },
        { label: "⑤ 잔여/가능 여부", en: "Is it still available for this weekend?", ko: "이번 주말에 아직 가능한가요?", pron: "이즈 잇 스틸 어베일러블 풔 디스 위켄드?" },
        { label: "⑥ 결제 수단", en: "Which payment methods do you accept?", ko: "어떤 결제 수단을 받으세요?", pron: "위치 페이먼트 메똗즈 두 유 억셉트?" },
        { label: "옵션 · 할인 묻기", en: "I'm on a pretty tight budget these days, so do you offer any discounts for students or job seekers?", ko: "제가 요즘 예산이 좀 빠듯해서요, 혹시 학생이나 취준생 할인이 있나요?", pron: "아임 온 어 프뤼리 타잇 버짓 디즈 데이즈, 쏘 두 유 오퍼 애니 디스카운츠 풔 스튜던츠 오어 잡 씨컬즈?" }
      ],
      expressions: [],
      tips: [
        "상황에 맞춰 3~4개만 골라 쓰세요. 카드만 바꿔 끼우면 요구가 바뀌어도 대응돼요.",
        "할인 카드는 가격·구매 상황에서만, 안 맞으면 생략하세요."
      ],
      levelNote: "필요한 정보를 묻는 질문 카드 모음. 상황에 맞게 3~4개를 골라 조합합니다.",
      paraphrases: [
        { ko: "가격", options: ["How much is it?", "Could you tell me the price?", "What's the cost?"] },
        { ko: "예약", options: ["Do I need to book in advance?", "Should I make a reservation?", "Can I just walk in?"] },
        { ko: "시간", options: ["What time do you open?", "What are your hours?", "When do you close?"] }
      ],
      extras: null
    },
    {
      id: "rp-apology", sample: true, type: "roleplay", ts: 1735084800000,
      topicId: null, topicLabel: "롤플레이 · 문제 상황 + 사과 (약속 취소)", level: "IH",
      question: "Call your friend, explain a problem that came up, and apologize for canceling your plans.",
      answer: "Hey [친구 이름], it's me. Listen, I hate to do this, but something's come up. To be honest, I've been feeling awful all day — I've got a splitting headache and I can barely move. There's no way I can make it tonight, and I feel terrible about bailing on you.",
      expressions: [],
      tips: [
        "친구와 약속 펑크, 산 물건 고장 등에 활용 (오픽 단골 콤보).",
        "이어서 '대안 제시'(롤플레이 4)까지 말하면 음성 메시지 남기기 유형이 됩니다."
      ],
      levelNote: "사정 설명 → 진심 어린 사과로 문제 상황 롤플레이를 구성합니다.",
      keywords: ["it's me", "hate to do this, something's come up", "feeling awful all day", "splitting headache, can barely move", "no way I can make it tonight", "feel terrible about bailing"],
      structure: [
        { label: "인사", range: [1, 1] },
        { label: "문제", range: [2, 3] },
        { label: "사과", range: [4, 4] }
      ],
      paraphrases: [
        { ko: "못 갈 것 같아", options: ["I can't make it", "I won't be able to make it", "I have to bail"] },
        { ko: "정말 미안해", options: ["I feel terrible about it", "I'm really sorry to do this", "I hate letting you down"] }
      ],
      extras: {
        ko: "야 [친구 이름], 나야. 저기, 이런 말 하기 정말 싫은데, 일이 좀 생겼어. 솔직히 하루 종일 컨디션이 엉망이야 — 머리가 쪼개질 듯 아프고 거의 못 움직이겠어. 오늘 밤엔 도저히 못 갈 것 같아. 약속 펑크 내서 정말 미안해.",
        pron: "헤이 [친구 이름], 이츠 미. 리슨, 아이 헤잇 투 두 디스, 벗 썸띵즈 컴 업. 투비 아-니스트, 아이브 빈 필링 어플 올 데이 — 아이브 갓 어 스플리링 헤데익 앤 아이 캔 베얼리 무브. 데얼즈 노 웨이 아이 캔 메이킷 투나잇, 앤 아이 필 테뤄블 어바웃 베일링 온 유."
      }
    },
    {
      id: "rp-alternative", sample: true, type: "roleplay", ts: 1734998400000,
      topicId: null, topicLabel: "롤플레이 · 대안 제시 (해결책)", level: "IH",
      question: "After explaining the problem, offer an alternative or a way to make it up, and wrap up the call.",
      answer: "But let me make it up to you. How about we reschedule for next weekend — are you free on Saturday? Or better yet, dinner's on me next time, my treat. Just let me know what works for you. Give me a call back when you get this. Talk soon!",
      expressions: [],
      tips: [
        "문제 설명 후 보상·대안을 제안하며 마무리할 때 사용하세요.",
        "'문제+사과'(롤플레이 3)와 이어 말하면 음성 메시지 남기기 유형 답이 됩니다."
      ],
      levelNote: "대안 제안 → 회신 요청으로 해결책 롤플레이를 마무리합니다.",
      keywords: ["make it up to you", "reschedule next weekend, Saturday?", "or dinner's on me, my treat", "let me know what works", "call me back", "talk soon"],
      structure: [
        { label: "대안", range: [1, 2] },
        { label: "제안", range: [3, 3] },
        { label: "마무리", range: [4, 6] }
      ],
      paraphrases: [
        { ko: "내가 살게", options: ["it's on me", "my treat", "I've got it covered"] },
        { ko: "다시 잡자", options: ["let's reschedule", "how about a rain check", "let's set another time"] }
      ],
      extras: {
        ko: "근데 내가 꼭 만회할게. 우리 다음 주말로 다시 잡는 거 어때 — 토요일에 시간 돼? 아니면 더 좋은 걸로, 다음에 저녁은 내가 살게, 내가 쏠게. 너 되는 시간으로 알려줘. 이거 들으면 다시 전화 줘. 곧 보자!",
        pron: "벗 렛 미 메이킷 업 투 유. 하우 어바웃 위 뤼스케쥴 풔 넥스트 위켄드 — 알 유 프리 온 쌔러데이? 오어 베럴 옛, 디너즈 온 미 넥스트 타임, 마이 츄륏. 저슷 렛 미 노우 왓 웍스 풔 유. 기브 미어 콜 백 웬 유 겟 디스. 톡 쑨!"
      }
    }
  ];

  global.SAMPLE_SCRIPTS = SAMPLE_SCRIPTS;
})(window);
