// Data for the Voice Agent Knowledge Map (/tools/knowledge-map/).
// Bilingual: EN is the public language; RU is reachable through the hidden
// corner toggle (double-click the bottom-right corner of the stage).
// Merged from the original 37 disciplines down to 29 — the absorbed topics
// live on as sentences inside their hosts (see the site registry).

const W = "https://en.wikipedia.org/wiki/";

export const UI = {
  en: {
    title: "What you need to know to build a voice agent",
    intro:
      "Twenty-nine disciplines in six clouds. Lines connect fields that work on the same problem from different sides.",
    hint: "Select a discipline to read what it is and why it matters here.",
    read: "Read more",
    linked: "Connected to",
  },
  ru: {
    title: "Что нужно знать, чтобы делать голосового агента",
    intro:
      "Двадцать девять дисциплин в шести облаках. Линии соединяют области, которые решают одну задачу с разных сторон.",
    hint: "Выберите дисциплину, чтобы прочитать, что это и зачем она здесь.",
    read: "Почитать",
    linked: "Связано с",
  },
};

export const GROUPS = {
  conv: { en: "Conversation", ru: "Разговор" },
  person: { en: "The person", ru: "Человек" },
  hm: { en: "Person and machine", ru: "Человек и машина" },
  voice: { en: "Voice and hearing", ru: "Голос и слух" },
  char: { en: "Character", ru: "Персонаж" },
  tech: { en: "Technology", ru: "Технология" },
};

export const DISCIPLINES = {
  comm: {
    g: "conv",
    n: { en: "Communication theory", ru: "Теория коммуникации" },
    t: {
      en: "The study of how messages are made, carried and understood: models, channels, noise, feedback. It gives the overall frame in which an agent is seen not only as a source of answers but also as a channel, a receiver and a party to a relationship.",
      ru: "Наука о том, как сообщения создаются, передаются и понимаются: модели, каналы, шум, обратная связь. Нужна, потому что даёт общий каркас, в котором агент виден не только как источник ответов, но и как канал, получатель и участник отношений.",
    },
    l: [
      ["Communication studies", W + "Communication_studies"],
      ["Communication theory", W + "Communication_theory"],
    ],
  },
  ca: {
    g: "conv",
    n: { en: "Conversation analysis", ru: "Конверсационный анализ" },
    t: {
      en: "A branch of sociology that studies the mechanics of live talk: how people hand over the floor, overlap, and repair misunderstandings. It describes the rules by which an interruption counts either as support or as grabbing the floor — an agent without these rules cannot tell one from the other. Above the level of the turn, the same mechanics organise topics: words like “by the way”, “so anyway”, “all right then” mark a topic being opened, resumed or closed, and an agent that does not hear them answers the last sentence instead of the conversation.",
      ru: "Раздел социологии о механике живого разговора: как люди передают слово, накладываются, исправляют недопонимание. В нём описаны правила, по которым перебивание считается либо поддержкой, либо захватом слова, и агент без этих правил не различает одно и другое. Выше уровня реплики та же механика организует темы: слова вроде «кстати», «так вот», «ну ладно» размечают открытие, возврат и закрытие темы, и агент, который их не слышит, отвечает на последнюю фразу вместо разговора.",
    },
    l: [
      ["Conversation analysis", W + "Conversation_analysis"],
      ["Turn-taking", W + "Turn-taking"],
      ["Discourse analysis", W + "Discourse_analysis"],
      ["Discourse marker", W + "Discourse_marker"],
    ],
  },
  prag: {
    g: "conv",
    n: { en: "Pragmatics", ru: "Прагматика" },
    t: {
      en: "The branch of linguistics about what a speaker means beyond what is literally said. Without it an agent takes things literally: asked “could you make it shorter?”, it answers “yes, I could”. Dictionary meaning itself language models already hold well; what remains hard is meaning that depends on what the speakers share: reference (“that one”, “like last time”) and ambiguity.",
      ru: "Раздел лингвистики о том, что человек имеет в виду сверх буквально сказанного. Без неё агент понимает буквально: на «а можно покороче?» отвечает «да, можно». Словарное значение языковые модели уже держат хорошо; сложным остаётся значение, которое зависит от общего знания собеседников: референция («тот самый», «как в прошлый раз») и неоднозначность.",
    },
    l: [
      ["Pragmatics", W + "Pragmatics"],
      ["Implicature", W + "Implicature"],
      ["Cooperative principle", W + "Cooperative_principle"],
      ["Deixis", W + "Deixis"],
    ],
  },
  polite: {
    g: "conv",
    n: { en: "Politeness theory", ru: "Теория вежливости" },
    t: {
      en: "The study of “face” and of how people soften acts that threaten it: interrupting, disagreeing, correcting, refusing. An agent does all of these constantly. Without softening it sounds rude; with too much it sounds servile.",
      ru: "Учение о «лице» и о том, как люди смягчают действия, которые ему угрожают: перебить, возразить, поправить, отказать. Нужна, потому что агент делает всё это постоянно: без смягчения он звучит как хам, а с избытком — как подхалим.",
    },
    l: [
      ["Politeness theory", W + "Politeness_theory"],
      ["Face", W + "Face_(sociological_concept)"],
    ],
  },
  psl: {
    g: "conv",
    n: { en: "Psycholinguistics", ru: "Психолингвистика" },
    t: {
      en: "The science of how people produce and understand speech in real time. Its key result for an agent: gaps between turns are around 200 ms, while preparing an utterance takes over 600 ms. So people predict the end of the other person’s turn and prepare their reply in advance. An agent that waits for silence and only then starts thinking is always late.",
      ru: "Наука о том, как человек порождает и понимает речь в реальном времени. Главный для агента результат: пауза между репликами у людей порядка 200 мс, а на подготовку высказывания уходит больше 600 мс. Значит, люди предсказывают конец чужой реплики и готовят ответ заранее. Агент, который ждёт тишины и только потом начинает думать, опаздывает всегда.",
    },
    l: [
      ["Psycholinguistics", W + "Psycholinguistics"],
      [
        "Levinson & Torreira 2015",
        "https://www.frontiersin.org/articles/10.3389/fpsyg.2015.00731/full",
      ],
    ],
  },
  socio: {
    g: "conv",
    n: { en: "Sociolinguistics", ru: "Социолингвистика" },
    t: {
      en: "The science of how language depends on the speaker, the listener and the situation. People in conversation converge in vocabulary, pace and register. An agent with one register for everybody sounds like an answering machine.",
      ru: "Наука о зависимости языка от говорящего, собеседника и ситуации. Нужна, потому что собеседники сближаются в словаре, темпе и регистре. Агент с одним регистром на всех звучит как автоответчик.",
    },
    l: [
      ["Sociolinguistics", W + "Sociolinguistics"],
      ["Register", W + "Register_(sociolinguistics)"],
      [
        "Communication accommodation theory",
        W + "Communication_accommodation_theory",
      ],
    ],
  },

  rhet: {
    g: "voice",
    n: { en: "Rhetoric", ru: "Риторика" },
    t: {
      en: "The discipline of composing speech for a listener: order, repetition, emphasis, example. Text written for the eye falls apart when heard. Rhetoric is the oldest body of rules for speech that cannot be re-read.",
      ru: "Дисциплина о построении речи, рассчитанной на слушателя: порядок, повтор, акцент, пример. Нужна, потому что текст, написанный для глаз, на слух разваливается, а риторика — старейший свод правил для речи, которую нельзя перечитать.",
    },
    l: [["Rhetoric", W + "Rhetoric"]],
  },
  pros: {
    g: "voice",
    n: { en: "Prosody", ru: "Просодия" },
    t: {
      en: "The part of phonetics about intonation, rhythm, stress and pauses. Prosody carries what the words do not: whether the speaker has finished, whether it is a question or a statement, which word matters most. It works the other way too: synthesis that stresses the wrong word changes the meaning of the sentence.",
      ru: "Раздел фонетики об интонации, ритме, ударении и паузах. Нужна, потому что просодия сообщает то, чего нет в словах: закончил ли человек реплику, вопрос это или утверждение, какое слово главное. В обратную сторону то же самое: синтез с неверным акцентом меняет смысл фразы.",
    },
    l: [
      ["Prosody", W + "Prosody_(linguistics)"],
      ["Intonation", W + "Intonation_(linguistics)"],
    ],
  },
  phon: {
    g: "voice",
    n: { en: "Phonetics", ru: "Фонетика" },
    t: {
      en: "The science of speech sounds. Recognition and synthesis errors are phonetic: similar sounds get confused, stress shifts, reduction breaks. This includes pronunciation norms: stress, names, loanwords. Without phonetics all one can say about such errors is “it sounds odd”.",
      ru: "Наука о звуках речи. Нужна, потому что ошибки распознавания и синтеза фонетические: путаются близкие звуки, съезжают ударения, ломается редукция. Сюда же относятся нормы произношения: ударения, имена, заимствования. Без фонетики про такие ошибки можно сказать только «звучит странно».",
    },
    l: [
      ["Phonetics", W + "Phonetics"],
      ["Orthoepy", W + "Orthoepy"],
    ],
  },
  para: {
    g: "voice",
    n: { en: "Paralinguistics", ru: "Паралингвистика" },
    t: {
      en: "The study of vocal signals other than words: sighs, chuckles, hesitations, tension. “Yeah, right” can be agreement, doubt or sarcasm, and the difference is entirely in the voice. A speech-to-text-to-model pipeline destroys it at the first step.",
      ru: "Дисциплина о голосовых сигналах помимо слов: вздохи, смешки, запинки, напряжение. «Ну да» бывает согласием, сомнением и сарказмом, и различие целиком в голосе. Схема «речь → текст → модель» уничтожает его на первом же шаге.",
    },
    l: [["Paralanguage", W + "Paralanguage"]],
  },
  scene: {
    g: "voice",
    n: { en: "Voice and speech training", ru: "Сценическая речь" },
    t: {
      en: "The practical discipline of voice placement, breath and delivery. Modern speech synthesis is steered with verbal directions, and directing a voice takes a director’s ear and vocabulary.",
      ru: "Практическая дисциплина о постановке голоса, дыхании, подаче. Нужна, потому что современный синтез управляется словесными указаниями, а чтобы режиссировать голос, нужны слух и словарь режиссёра.",
    },
    l: [
      ["Vocal pedagogy", W + "Vocal_pedagogy"],
      ["Voice acting", W + "Voice_acting"],
    ],
  },

  emo: {
    g: "person",
    n: { en: "Psychology of emotion", ru: "Психология эмоций" },
    t: {
      en: "The science of what emotions are and how they are expressed. It has an unresolved dispute between models: six basic emotions, axes of valence and arousal, and emotions as constructed in context. Every emotion recogniser silently picks one of the three, and that choice decides what it is able to see at all.",
      ru: "Наука о том, что такое эмоции и как они выражаются. В ней идёт нерешённый спор между моделями: «шесть базовых эмоций», «оси валентности и возбуждения» и «эмоции конструируются в контексте». Любой распознаватель эмоций молча выбирает одну из трёх, и от выбора зависит, что он вообще способен увидеть.",
    },
    l: [
      ["Emotion", W + "Emotion"],
      ["Emotion classification", W + "Emotion_classification"],
      ["Theory of constructed emotion", W + "Theory_of_constructed_emotion"],
    ],
  },
  couns: {
    g: "person",
    n: { en: "Counselling psychology", ru: "Консультативная психология" },
    t: {
      en: "The discipline of listening and asking so that things become clearer to the other person. It has measurable rules. In motivational interviewing, for example, reflections should outnumber questions, otherwise the conversation feels like an interrogation.",
      ru: "Дисциплина о том, как слушать и спрашивать так, чтобы человеку становилось яснее. Нужна, потому что в ней есть измеримые правила. Например, в мотивационном интервьюировании отражений должно быть больше, чем вопросов, иначе разговор ощущается как допрос.",
    },
    l: [
      ["Person-centered therapy", W + "Person-centered_therapy"],
      ["Motivational interviewing", W + "Motivational_interviewing"],
      ["Active listening", W + "Active_listening"],
    ],
  },
  fac: {
    g: "person",
    n: { en: "Facilitation", ru: "Фасилитация" },
    t: {
      en: "The practice of guiding someone else’s conversation or thinking without stepping into the content. It separates responsibility for the process from responsibility for the content. A language model steps into the content by default.",
      ru: "Практика ведения чужого разговора или мышления без вмешательства в содержание. Нужна, потому что разделяет ответственность за процесс и за содержание. Языковая модель по умолчанию лезет в содержание.",
    },
    l: [
      ["Facilitator", W + "Facilitator"],
      ["Facilitation (business)", W + "Facilitation_(business)"],
    ],
  },
  soc: {
    g: "person",
    n: { en: "Social psychology", ru: "Социальная психология" },
    t: {
      en: "The science of influence, trust, impression and status. Two of its results apply directly to a voice agent: an impression of personality from a voice forms in under a second, and one-sided attachment to a media figure was studied here decades before AI. Its group side matters when the agent is one of several participants — roles, norms, who answers whom: in a group, “was that addressed to me, and is now a good moment to come in?” is a harder question than one-to-one.",
      ru: "Наука о влиянии, доверии, впечатлении, статусе. Два её результата прямо про голосового агента: впечатление о личности по голосу складывается меньше чем за секунду, а односторонняя привязанность к медиаперсонажу изучена в ней за десятилетия до ИИ. Её групповая сторона важна, когда агент — один из нескольких участников: роли, нормы, кто кому отвечает; в группе вопрос «ко мне ли это обращено и уместно ли сейчас вступить» сложнее, чем один на один.",
    },
    l: [
      ["Social psychology", W + "Social_psychology"],
      ["Parasocial interaction", W + "Parasocial_interaction"],
      ["Group dynamics", W + "Group_dynamics"],
    ],
  },
  cog: {
    g: "person",
    n: { en: "Cognitive psychology", ru: "Когнитивная психология" },
    t: {
      en: "The science of attention, memory and mental load. Working memory holds about four items, and speech cannot be re-read. A five-item list that is harmless on a screen is lost by the third item when heard.",
      ru: "Наука о внимании, памяти, умственной нагрузке. Рабочая память держит около четырёх единиц, а речь нельзя перечитать. Перечень из пяти пунктов, безобидный на экране, на слух теряется к третьему.",
    },
    l: [
      ["Cognitive psychology", W + "Cognitive_psychology"],
      ["Working memory", W + "Working_memory"],
      ["Cognitive load", W + "Cognitive_load"],
    ],
  },
  philo: {
    g: "person",
    n: { en: "Philosophy of dialogue", ru: "Философия диалога" },
    t: {
      en: "A tradition that treats conversation as a relation between two, not as a transfer of information. It poses a question every product answers anyway, if only implicitly: is the agent an “it” (a tool) or a “you” (a partner) to the person?",
      ru: "Традиция, понимающая разговор как отношение между двумя, а не как передачу информации. Нужна, потому что ставит вопрос, на который продукт отвечает в любом случае, хотя бы неявно: агент для человека «оно» (инструмент) или «ты» (собеседник).",
    },
    l: [
      ["Philosophy of dialogue", W + "Philosophy_of_dialogue"],
      ["I and Thou", W + "I_and_Thou"],
      ["Dialogic", W + "Dialogic"],
    ],
  },

  impro: {
    g: "char",
    n: {
      en: "Acting and improvisation",
      ru: "Актёрское мастерство и импровизация",
    },
    t: {
      en: "The discipline of presence, attention to a partner, and status. In Johnstone’s account every line raises or lowers the speaker’s status. Language models have two defaults, an ingratiating low and a lecturing high, and both get in the way of talking as equals.",
      ru: "Дисциплина о присутствии, внимании к партнёру, статусе. У Джонстоуна каждая реплика повышает или понижает статус говорящего. У языковых моделей два дефолта: заискивающий низкий и лекторский высокий, и оба мешают разговору на равных.",
    },
    l: [
      ["Improvisational theatre", W + "Improvisational_theatre"],
      ["Keith Johnstone", W + "Keith_Johnstone"],
    ],
  },
  drama: {
    g: "char",
    n: { en: "Dramatic writing", ru: "Драматургия" },
    t: {
      en: "The craft of building character and dialogue. Character shows in choices made under pressure, not in a list of adjectives. A prompt that says “friendly, curious, with a sense of humour” does not create one.",
      ru: "Ремесло построения характера и диалога. Нужна, потому что характер проявляется в выборе под давлением, а не в списке прилагательных. Промпт «дружелюбная, любопытная, с юмором» характера не создаёт.",
    },
    l: [
      ["Dramaturgy", W + "Dramaturgy"],
      ["Characterization", W + "Characterization"],
    ],
  },

  hci: {
    g: "hm",
    n: {
      en: "Human–computer interaction",
      ru: "Human–computer interaction",
    },
    t: {
      en: "The science of how people interact with technology. In Nass’s experiments people were polite to a computer, applied gender stereotypes to synthetic voices, and reciprocated a machine’s “self-disclosure”. They knew all along that it was a program.",
      ru: "Наука о взаимодействии людей с техникой. В экспериментах Нэсса люди были вежливы с компьютером, переносили на синтезированные голоса гендерные стереотипы и отвечали взаимностью на «откровенность» машины. При этом они знали, что перед ними программа.",
    },
    l: [
      ["Human–computer interaction", W + "Human%E2%80%93computer_interaction"],
      ["Computers are social actors", W + "Computers_are_social_actors"],
      ["The Media Equation", W + "The_Media_Equation"],
    ],
  },
  cd: {
    g: "hm",
    n: { en: "Conversation design", ru: "Conversation design" },
    t: {
      en: "The applied discipline of designing voice interfaces. Its typical failures were catalogued long ago: what to do when the person is silent, when the wrong thing was recognised, when a confirmation is needed, and how many times one may ask again. It also owns the system’s behaviour over time: the agent has states (listening, thinking, speaking, did not catch that), and the person has to tell them apart without a screen, from sound alone.",
      ru: "Прикладная дисциплина проектирования голосовых интерфейсов. Типовые провалы в ней давно каталогизированы: что делать, когда человек молчит, когда распознано не то, когда нужно подтверждение и сколько раз можно переспросить. На ней же — поведение системы во времени: у агента есть состояния (слушает, думает, говорит, не расслышал), и человек должен различать их без экрана, по одному звуку.",
    },
    l: [
      ["Voice user interface", W + "Voice_user_interface"],
      ["Interaction design", W + "Interaction_design"],
    ],
  },
  ia: {
    g: "hm",
    n: {
      en: "Information architecture",
      ru: "Информационная архитектура",
    },
    t: {
      en: "The discipline of organising information so that it can be navigated. Classically it is about screens and navigation, which a voice agent does not have. Here it serves another purpose: how the agent’s memory and knowledge are structured, what goes into context, and how the right thing is found.",
      ru: "Дисциплина об организации информации так, чтобы в ней можно было ориентироваться. Классически она про экраны и навигацию, которых у голосового агента нет. Здесь она нужна для другого: как устроены память и знания агента, что попадает в контекст и как находится нужное.",
    },
    l: [["Information architecture", W + "Information_architecture"]],
  },
  pm: {
    g: "hm",
    n: { en: "Psychometrics", ru: "Психометрия" },
    t: {
      en: "The science of measuring the subjective. An answer to “rate this conversation from 1 to 5” measures the politeness of the person answering. Measuring anything else takes scales with tested validity.",
      ru: "Наука об измерении субъективного. Ответ на «оцените разговор от 1 до 5» измеряет вежливость отвечающего. Чтобы измерить что-то другое, нужны шкалы с проверенной валидностью.",
    },
    l: [
      ["Psychometrics", W + "Psychometrics"],
      ["Validity", W + "Validity_(statistics)"],
    ],
  },
  eth: {
    g: "hm",
    n: { en: "AI ethics and law", ru: "Этика и право ИИ" },
    t: {
      en: "The discipline of what is acceptable in a system’s behaviour. The EU AI Act requires telling people that they are talking to an AI and bans emotion recognition in the workplace and in education. For an agent that reads emotions this is a direct limit on where it can be used.",
      ru: "Дисциплина о допустимом в поведении систем. Европейский AI Act обязывает сообщать человеку, что он говорит с ИИ, и запрещает распознавание эмоций на рабочем месте и в образовании. Для агента, читающего эмоции, это прямое ограничение на сферы применения.",
    },
    l: [
      [
        "Ethics of artificial intelligence",
        W + "Ethics_of_artificial_intelligence",
      ],
      ["Artificial Intelligence Act", W + "Artificial_Intelligence_Act"],
    ],
  },

  ml: {
    g: "tech",
    n: { en: "Machine learning", ru: "Машинное обучение" },
    t: {
      en: "The science of algorithms that learn from data. Every part of the agent is a trained model with its own distribution of errors. Without knowing what it learned from and how, there is no predicting where it will break. This includes adjusting a finished model — fine-tuning on examples, reinforcement learning from human ratings: stable behaviour (manner, brevity, readiness to ask again) is shaped by training, and a prompt holds it less firmly.",
      ru: "Наука об алгоритмах, которые учатся на данных. Каждая часть агента — обученная модель со своим распределением ошибок, и без понимания, на чём и как она училась, нельзя предсказать, где она сломается. Сюда же относится донастройка готовой модели — дообучение на примерах, обучение с подкреплением на оценках людей: устойчивое поведение (манера, краткость, готовность переспросить) формируется обучением, а промпт держит его слабее.",
    },
    l: [
      ["Machine learning", W + "Machine_learning"],
      ["Fine-tuning", W + "Fine-tuning_(deep_learning)"],
      ["RLHF", W + "Reinforcement_learning_from_human_feedback"],
    ],
  },
  sds: {
    g: "tech",
    n: {
      en: "Spoken dialogue systems",
      ru: "Разговорные диалоговые системы",
    },
    t: {
      en: "The research field of dialogue management, incremental speech processing and predicting speaker change. The standard solution, “treat the turn as finished after N ms of silence”, gives either long pauses or cutting people off mid-word. The alternatives to it are being developed here.",
      ru: "Область исследований об управлении диалогом, обработке речи по мере поступления и предсказании смены говорящего. Типовое решение «считать реплику законченной после N мс тишины» даёт либо долгие паузы, либо перебивания на полуслове. Альтернативы этому решению разрабатывают именно здесь.",
    },
    l: [
      ["Spoken dialog system", W + "Spoken_dialog_system"],
      ["Skantze & Irfan 2025", "https://arxiv.org/pdf/2501.08946"],
    ],
  },
  speech: {
    g: "tech",
    n: { en: "Speech technology", ru: "Речевые технологии" },
    t: {
      en: "The engineering field of speech recognition and synthesis. Its main architectural choice, a recognition → model → synthesis cascade or a single speech-to-speech model, decides whether anything other than words reaches the agent.",
      ru: "Инженерная область о распознавании и синтезе речи. Нужна, потому что главный архитектурный выбор (каскад «распознавание → модель → синтез» или единая модель «речь в речь») решает, доходит ли до агента что-либо кроме слов.",
    },
    l: [
      ["Speech recognition", W + "Speech_recognition"],
      ["Speech synthesis", W + "Speech_synthesis"],
    ],
  },
  dsp: {
    g: "tech",
    n: {
      en: "Digital signal processing",
      ru: "Цифровая обработка сигналов",
    },
    t: {
      en: "The discipline of handling sound as a signal. Without echo cancellation the agent hears itself from the speaker and interrupts itself. Without voice activity detection it takes a cough or a slammed door for a turn. Its reference point is psychoacoustics — how people hear: what a person can make out in noise, why the same voice sounds different in headphones and a phone speaker, and what in a sound is tiring.",
      ru: "Дисциплина о работе со звуком как с сигналом. Без эхоподавления агент слышит из динамика самого себя и сам себя перебивает, а без детектора голоса принимает за реплику кашель и хлопок двери. Её ориентир — психоакустика, то, как человек слышит: что он расслышит в шуме, почему один и тот же голос в наушниках и в динамике телефона звучит по-разному и что в звуке утомляет.",
    },
    l: [
      ["Digital signal processing", W + "Digital_signal_processing"],
      ["Voice activity detection", W + "Voice_activity_detection"],
      [
        "Echo suppression and cancellation",
        W + "Echo_suppression_and_cancellation",
      ],
      ["Psychoacoustics", W + "Psychoacoustics"],
    ],
  },
  rt: {
    g: "tech",
    n: {
      en: "Real-time systems",
      ru: "Системы реального времени",
    },
    t: {
      en: "The part of engineering about guaranteed latency. The whole budget is those same 200 ms of the human norm. The network, end-of-turn detection, the model’s first token and the first sound of synthesis all have to fit in it, and each stage alone can easily use it up; the ITU G.114 telephony standard treats up to 150 ms one way as comfortable. And a voice agent is a dozen services running at once in streaming mode — a failure in any of them is heard immediately, as silence or a cut-off.",
      ru: "Раздел инженерии о гарантированной задержке. Весь бюджет — те самые 200 мс человеческой нормы. В него должны уложиться сеть, определение конца реплики, первый токен модели и первый звук синтеза, и каждая стадия по отдельности легко съедает его целиком; телефонный стандарт ITU G.114 считает комфортной задержку до 150 мс в одну сторону. А голосовой агент — это десяток сервисов, работающих одновременно в потоковом режиме: сбой любого слышен сразу, как тишина или обрыв.",
    },
    l: [
      ["Real-time computing", W + "Real-time_computing"],
      ["WebRTC", W + "WebRTC"],
      ["G.114", W + "G.114"],
      ["Software engineering", W + "Software_engineering"],
    ],
  },
};

export const ORDER = {
  conv: ["comm", "prag", "ca", "polite", "psl", "socio"],
  person: ["emo", "couns", "fac", "soc", "cog", "philo"],
  hm: ["hci", "cd", "ia", "pm", "eth"],
  voice: ["rhet", "pros", "phon", "para", "scene"],
  char: ["impro", "drama"],
  tech: ["ml", "sds", "speech", "dsp", "rt"],
};

export const LINKS = [
  ["psl", "sds"],
  ["psl", "rt"],
  ["ca", "sds"],
  ["ca", "impro"],
  ["ca", "soc"],
  ["pros", "sds"],
  ["pros", "para"],
  ["para", "emo"],
  ["para", "speech"],
  ["polite", "soc"],
  ["scene", "speech"],
  ["phon", "speech"],
  ["cog", "cd"],
  ["cog", "rhet"],
  ["hci", "soc"],
  ["comm", "hci"],
  ["eth", "emo"],
  ["drama", "socio"],
  ["drama", "ml"],
  ["impro", "fac"],
  ["soc", "fac"],
  ["couns", "prag"],
  ["philo", "eth"],
  ["pm", "soc"],
  ["ml", "speech"],
  ["cd", "rt"],
  ["ia", "ml"],
  ["dsp", "speech"],
];
