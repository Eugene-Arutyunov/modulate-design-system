// Data for the Conversation Intelligence Knowledge Map (/tools/knowledge-map/).
// Bilingual: EN is the public language; RU is reachable through the hidden
// corner toggle (double-click the bottom-right corner of the stage).
// Merged from the original 37 disciplines down to 29 — the absorbed topics
// live on as sentences inside their hosts (see the site registry).

const W = "https://en.wikipedia.org/wiki/";

export const UI = {
  en: {
    title:
      "Conversation intelligence = conversation understanding + a speaking agent",
    intro:
      "Thirty disciplines. The upper half is what it takes to understand a conversation; the lower half is what it takes to take part in one. The technology underneath carries both. Lines connect fields that work on the same problem from different sides.",
    hint: "Select a discipline to read what it is and why it matters here.",
    read: "Read more",
    linked: "Connected to",
  },
  ru: {
    title:
      "Conversation intelligence = понимание разговора + говорящий агент",
    intro:
      "Тридцать дисциплин. Верхняя половина — то, что нужно, чтобы понимать разговор; нижняя — то, что нужно, чтобы в нём участвовать. Технология внизу несёт и то и другое. Линии соединяют области, которые решают одну задачу с разных сторон.",
    hint: "Выберите дисциплину, чтобы прочитать, что это и зачем она здесь.",
    read: "Почитать",
    linked: "Связано с",
  },
};

// The two halves of the formula; rendered as band labels over the cloud rows
export const HALVES = {
  understanding: {
    en: "Conversation understanding",
    ru: "Понимание разговора",
  },
  agent: { en: "Speaking agent", ru: "Говорящий агент" },
};

export const GROUPS = {
  conv: { en: "Conversation", ru: "Разговор" },
  voice: { en: "Voice and hearing", ru: "Голос и слух" },
  person: { en: "People", ru: "Люди" },
  conduct: { en: "Taking part", ru: "Участие" },
  char: { en: "Character and delivery", ru: "Персонаж и подача" },
  hm: { en: "Person and machine", ru: "Человек и машина" },
  tech: { en: "Technology", ru: "Технология" },
};

export const DISCIPLINES = {
  comm: {
    g: "conv",
    n: { en: "Communication theory", ru: "Теория коммуникации" },
    t: {
      en: "The study of how messages are made, carried and understood: models, channels, noise, feedback. It gives the overall frame for any system that works with conversations: a system reading a meeting is itself a receiver with its own noise, and a speaking agent is at once a channel, a receiver and a party to a relationship.",
      ru: "Наука о том, как сообщения создаются, передаются и понимаются: модели, каналы, шум, обратная связь. Даёт общий каркас для любой системы, работающей с разговором: система, читающая встречу, сама является получателем со своим шумом, а говорящий агент — сразу и канал, и получатель, и участник отношений.",
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
      en: "A branch of sociology that studies the mechanics of live talk: how people hand over the floor, overlap, and repair misunderstandings. It describes the rules by which an interruption counts either as support or as grabbing the floor — without them there is no reading who dominated a meeting and who never got to finish, and no taking the floor properly. Above the level of the turn, the same mechanics organise topics: words like “by the way”, “so anyway”, “all right then” mark a topic being opened, resumed or closed, and a system that does not hear them retells the last sentence instead of the conversation.",
      ru: "Раздел социологии о механике живого разговора: как люди передают слово, накладываются, исправляют недопонимание. В нём описаны правила, по которым перебивание считается либо поддержкой, либо захватом слова, — без них не прочитать, кто доминировал на встрече и кому не дали договорить, и не вступить в разговор самому. Выше уровня реплики та же механика организует темы: слова вроде «кстати», «так вот», «ну ладно» размечают открытие, возврат и закрытие темы, и система, которая их не слышит, пересказывает последнюю фразу вместо разговора.",
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
      en: "The branch of linguistics about what a speaker means beyond what is literally said. Without it everything is read literally: a speaking agent answers “yes, I could” to “could you make it shorter?”, and a meeting summary records “we’ll think about it” as a commitment where the whole room heard a refusal. Dictionary meaning itself language models already hold well; what remains hard is meaning that depends on what the speakers share: reference (“that one”, “like last time”) and ambiguity.",
      ru: "Раздел лингвистики о том, что человек имеет в виду сверх буквально сказанного. Без неё всё читается буквально: говорящий агент отвечает «да, можно» на «а можно покороче?», а в выжимке встречи «мы подумаем» записано как обязательство там, где вся комната услышала отказ. Словарное значение языковые модели уже держат хорошо; сложным остаётся значение, которое зависит от общего знания собеседников: референция («тот самый», «как в прошлый раз») и неоднозначность.",
    },
    l: [
      ["Pragmatics", W + "Pragmatics"],
      ["Implicature", W + "Implicature"],
      ["Cooperative principle", W + "Cooperative_principle"],
      ["Deixis", W + "Deixis"],
    ],
  },
  herm: {
    g: "conv",
    n: { en: "Hermeneutics", ru: "Герменевтика" },
    t: {
      en: "The study of interpretation. Words do not transfer meaning — they trigger it, and every understanding is a slightly imperfect reconstruction. The hermeneutic circle — a part is understood through the whole and the whole through its parts — is exactly how a conversation is read: an utterance gets its meaning from the whole meeting, and the meeting from its utterances. For a system whose product is an interpretation of someone’s words — commitments, emotions, notable moments — this is the discipline that asks on what grounds, and how the person can contest it.",
      ru: "Наука об интерпретации. Слова не передают смысл, а запускают его, и всякое понимание — чуть неточная реконструкция. Герменевтический круг — часть понимается через целое, а целое через части — это ровно то, как читается разговор: реплика получает смысл от всей встречи, а встреча — от реплик. Для системы, чей продукт — интерпретация чужих слов (обязательства, эмоции, важные моменты), это дисциплина о том, на каком основании делается такая интерпретация и как человек может её оспорить.",
    },
    l: [
      ["Hermeneutics", W + "Hermeneutics"],
      ["Hermeneutic circle", W + "Hermeneutic_circle"],
      ["Hans-Georg Gadamer", W + "Hans-Georg_Gadamer"],
    ],
  },
  polite: {
    g: "conduct",
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
      en: "The science of how people produce and understand speech in real time. Its key result: gaps between turns are around 200 ms, while preparing an utterance takes over 600 ms — so people predict the end of the other person’s turn and prepare their reply in advance. For a listener that norm is a ruler: a pause that stretches past it is itself a signal — doubt, bad news, a search for words. A speaking agent that waits for silence and only then starts thinking is always late.",
      ru: "Наука о том, как человек порождает и понимает речь в реальном времени. Главный результат: пауза между репликами у людей порядка 200 мс, а на подготовку высказывания уходит больше 600 мс — значит, люди предсказывают конец чужой реплики и готовят ответ заранее. Для слушающего эта норма — линейка: затянувшаяся пауза сама по себе сигнал — сомнение, плохая новость, поиск слов. Говорящий агент, который ждёт тишины и только потом начинает думать, опаздывает всегда.",
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
      en: "The science of how language depends on the speaker, the listener and the situation. People in conversation converge in vocabulary, pace and register, and the direction of that convergence is data: who adapts to whom shows closeness and status. A speaking agent with one register for everybody sounds like an answering machine.",
      ru: "Наука о зависимости языка от говорящего, собеседника и ситуации. Собеседники сближаются в словаре, темпе и регистре, и направление этого сближения — данные: кто под кого подстраивается, показывает близость и статус. Говорящий агент с одним регистром на всех звучит как автоответчик.",
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
    g: "char",
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
    g: "char",
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
    g: "conduct",
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
    g: "conduct",
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
      en: "The science of influence, trust, impression and status. An impression of personality from a voice forms in under a second, and one-sided attachment to a media figure was studied here decades before AI. Its group side is what makes a meeting readable at all — roles, norms, who answers whom, who holds status; the same knowledge answers a speaking agent’s hardest group question: “was that addressed to me, and is now a good moment to come in?”",
      ru: "Наука о влиянии, доверии, впечатлении, статусе. Впечатление о личности по голосу складывается меньше чем за секунду, а односторонняя привязанность к медиаперсонажу изучена здесь за десятилетия до ИИ. Групповая сторона — то, что вообще делает встречу читаемой: роли, нормы, кто кому отвечает, у кого статус; то же знание отвечает на самый трудный групповой вопрос говорящего агента: «ко мне ли это обращено и уместно ли сейчас вступить».",
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
      en: "The science of attention, memory and mental load. Memory of a conversation is reconstruction, not playback — people leave the same meeting with different meetings, which is why a record of what was actually said is worth anything at all. And for whatever is said aloud, working memory rules: it holds about four items, speech cannot be re-read, and a five-item list that is harmless on a screen is lost by the third item when heard.",
      ru: "Наука о внимании, памяти, умственной нагрузке. Память о разговоре — реконструкция, а не запись: люди уходят с одной и той же встречи с разными встречами, поэтому запись реально сказанного вообще чего-то стоит. А всем, что звучит вслух, правит рабочая память: она держит около четырёх единиц, речь нельзя перечитать, и перечень из пяти пунктов, безобидный на экране, на слух теряется к третьему.",
    },
    l: [
      ["Cognitive psychology", W + "Cognitive_psychology"],
      ["Working memory", W + "Working_memory"],
      ["Cognitive load", W + "Cognitive_load"],
    ],
  },
  philo: {
    g: "conduct",
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
    g: "tech",
    n: {
      en: "Information architecture",
      ru: "Информационная архитектура",
    },
    t: {
      en: "The discipline of organising information so that it can be navigated. Classically it is about screens and navigation; here it serves another purpose: how a system’s memory of conversations is structured — what is kept, what goes into context, and how the right moment from a month ago is found again.",
      ru: "Дисциплина об организации информации так, чтобы в ней можно было ориентироваться. Классически она про экраны и навигацию; здесь она нужна для другого: как устроена память системы о разговорах — что хранится, что попадает в контекст и как снова найти нужный момент месячной давности.",
    },
    l: [["Information architecture", W + "Information_architecture"]],
  },
  pm: {
    g: "person",
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
      en: "The discipline of what is acceptable in a system’s behaviour. The EU AI Act requires telling people that they are talking to an AI and bans emotion recognition in the workplace and in education. That cuts both halves at once: a speaking agent must disclose itself, and a system that reads emotions in meetings reads them exactly where the ban applies.",
      ru: "Дисциплина о допустимом в поведении систем. Европейский AI Act обязывает сообщать человеку, что он говорит с ИИ, и запрещает распознавание эмоций на рабочем месте и в образовании. Это режет обе половины сразу: говорящий агент обязан представиться, а система, читающая эмоции на встречах, читает их ровно там, где действует запрет.",
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
      en: "The science of algorithms that learn from data. Every part of the pipeline — recognition, understanding, generation — is a trained model with its own distribution of errors. Without knowing what it learned from and how, there is no predicting where it will break. This includes adjusting a finished model — fine-tuning on examples, reinforcement learning from human ratings: stable behaviour (a manner, brevity, what the system counts as a commitment) is shaped by training, and a prompt holds it less firmly.",
      ru: "Наука об алгоритмах, которые учатся на данных. Каждая часть конвейера — распознавание, понимание, порождение — обученная модель со своим распределением ошибок, и без понимания, на чём и как она училась, нельзя предсказать, где она сломается. Сюда же относится донастройка готовой модели — дообучение на примерах, обучение с подкреплением на оценках людей: устойчивое поведение (манера, краткость, что система считает обязательством) формируется обучением, а промпт держит его слабее.",
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
      en: "The engineering field of speech recognition and synthesis. Its main architectural choice, a recognition → model → synthesis cascade or a single speech-to-speech model, decides whether anything other than words reaches the models at all.",
      ru: "Инженерная область о распознавании и синтезе речи. Нужна, потому что главный архитектурный выбор (каскад «распознавание → модель → синтез» или единая модель «речь в речь») решает, доходит ли до моделей вообще что-либо кроме слов.",
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
      en: "The discipline of handling sound as a signal. Without echo cancellation a speaking agent hears itself from the speaker and interrupts itself; without voice activity detection anything listening to a room takes a cough or a slammed door for speech. Its reference point is psychoacoustics — how people hear: what a person can make out in noise, why the same voice sounds different in headphones and a phone speaker, and what in a sound is tiring.",
      ru: "Дисциплина о работе со звуком как с сигналом. Без эхоподавления говорящий агент слышит из динамика самого себя и сам себя перебивает, а без детектора голоса всё, что слушает комнату, принимает за речь кашель и хлопок двери. Её ориентир — психоакустика, то, как человек слышит: что он расслышит в шуме, почему один и тот же голос в наушниках и в динамике телефона звучит по-разному и что в звуке утомляет.",
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
      en: "The part of engineering about guaranteed latency. The whole budget is those same 200 ms of the human norm. The network, end-of-turn detection, the model’s first token and the first sound of synthesis all have to fit in it, and each stage alone can easily use it up; the ITU G.114 telephony standard treats up to 150 ms one way as comfortable. And a live conversation product is a dozen services running at once in streaming mode — a failure in any of them is felt immediately: for a speaking agent as silence or a cut-off, for live understanding as an insight arriving after the moment has passed.",
      ru: "Раздел инженерии о гарантированной задержке. Весь бюджет — те самые 200 мс человеческой нормы. В него должны уложиться сеть, определение конца реплики, первый токен модели и первый звук синтеза, и каждая стадия по отдельности легко съедает его целиком; телефонный стандарт ITU G.114 считает комфортной задержку до 150 мс в одну сторону. А продукт живого разговора — это десяток сервисов, работающих одновременно в потоковом режиме: сбой любого чувствуется сразу — у говорящего агента как тишина или обрыв, у живого понимания как подсказка, пришедшая после момента.",
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
  // Conversation understanding
  voice: ["pros", "phon", "para"],
  conv: ["comm", "prag", "herm", "ca", "psl", "socio"],
  person: ["emo", "soc", "cog", "pm"],
  // Speaking agent
  conduct: ["couns", "fac", "polite", "philo"],
  char: ["impro", "drama", "scene", "rhet"],
  hm: ["hci", "cd", "eth"],
  // Technology — the band behind both halves
  tech: ["ml", "sds", "speech", "dsp", "rt", "ia"],
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
  ["herm", "prag"],
  ["herm", "philo"],
  ["herm", "comm"],
  ["herm", "pm"],
];
