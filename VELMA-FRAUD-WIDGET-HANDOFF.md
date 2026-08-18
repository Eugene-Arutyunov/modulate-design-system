# Velma Fraud Demo Widget — контекст для продолжения работы

Док для агента, продолжающего задачу в другой среде. Состояние на 18 августа 2026.

## Где мы

- **Ветка:** `fingerprint` (в `main` не влито). Здесь два невлитых фичевых коммита: `a0563ed` (Scatterplot builder) и `0c57e5f` (сам виджет), плюс merge `main` от 18.08.
- **Статус:** все пункты исходного плана выполнены, страница собрана и проверена (сборка Eleventy, скриншоты десктоп/700px, прогон экспортного HTML с симуляцией середины проигрывания). Задача в фазе «полировка / следующие пожелания владельца».
- **План задачи:** `/Users/arutyunov/.cursor/plans/velma_fraud_demo_widget_25a4bded.plan.md` (вне репозитория; суть продублирована здесь).

## Что это

Страница `/tools/velma-fraud-demo-widget/` — интерактивный демо-виджет фрод-звонка для сайта Modulate (Webflow). Исходник — прототип из `~/Downloads/v2 widget w: audio` (HTML + events JSON + mp3 на ~68 секунд), пересобранный на канонических элементах дизайн-системы: таймлайн — фингерпринт-плеер, цвета/типографика — токены `--m__*`, акценты — палитра групп эмоций.

Сценарий: попытка захвата аккаунта (Harborview Bank), Caller — синтетический голос, Agent — человек. По мере проигрывания появляются реплики, сигналы (language / speaker / deepfake / emotion / behavior), растёт метр фрод-риска (порог 85%), в конце — вердикт и экшены.

## Файлы

| Файл | Роль |
|---|---|
| `src/tools/velma-fraud-demo-widget.html` | Страница: панель (Replay; Export JSON / Import; Export HTML) + полноширинный стейдж |
| `src/assets/service/velma-fraud/velma-fraud-widget.js` | Сам виджет. **Классический скрипт, IIFE, без module-импортов** — при HTML-экспорте инлайнится как есть. API: `window.VelmaFraudWidget.mount(root, data)` → `{ replay, seek, destroy }`; `._last` — хэндл последнего маунта (отладка/тесты). Самомаунт из `#velma-fraud-data` + `[data-vf-widget]` (путь экспортного файла) |
| `src/assets/service/velma-fraud/velma-fraud-config.js` | ES-модуль с дефолтными данными (конверсия events JSON + кураторские эмоции реплик) |
| `src/assets/service/velma-fraud/velma-fraud-studio.js` | Обвязка страницы (ES-модуль): маунт, импорт/экспорт JSON, экспорт HTML |
| `src/assets/service/velma-fraud/velma-fraud-embed.css` | Standalone-стили для экспорта: сабсет плеерных правил + правила виджета, **тёмные значения токенов запечены литералами**, плоские селекторы без вложенности. На сайте не подключается |
| `src/assets/service/velma-fraud/velma-fraud-demo.mp3` | Аудио (~1 МБ), уходит в сборку passthrough-копией |
| `src/styles/service/velma-fraud-widget.css` | Стили для бандла сайта: студийный стейдж + виджет на живых токенах. Подключён в `src/css-bundle.njk` |

Записи о виджете: `src/tools/index.html` (Builders) и `src/assets/service/REPOSITORY-REGISTRY.md` (раздел «Velma Fraud Demo Widget» — там же подробное описание механики).

## Архитектура (главное)

- **Чистый `render(t)`**: всё на экране — функция часов. Часы — mp3 (`Audio` + `canplaythrough`, тег «Audio synced»), фолбэк — симулированный rAF-клок («Demo clock»). Сик, пауза, реплей не требуют состояния.
- **Таймлайн — канонический фингерпринт-плеер**: `media-container` → `pg-player-dataviz` → `transcript-clip emotion-*` (2 лейна Caller/Agent), полоса `media-box#audio-player`, kiki-глифы (`behaviour-indicator`) в моменты behavior-сигналов, контур глифа — цветом эмоции активного клипа. Ховер-подписи как у фингерпринт-студии: имя эмоции слева от длительности (`vf-emotion-caption`), строка транскрипта в `clip-text-caption`. Плейхед — `player-position-line` (виден при `data-playback-started="true"` на `.vf-player`).
- **Прогрессив-ревил**: классы `vf-pending` (клипы/глифы) и `vf-visible` (реплики, сигналы, вердикт, чипы) тогглятся в `render(t)`; автоскролл панелей — только внутренний (`scrollPanelTo`), страницу не дёргает.
- **Управление**: play/pause — полоса плеера; сик — драг по визуализации; клавиатура — space и стрелки (guard на инпуты/кнопки).
- **Метр**: кейфреймы из данных, градиент по четырём цветам групп эмоций, заякорен на всю ширину бара трюком `--vf-fill` (fill — клип-окно, `::before` растягивается `calc(100% / var(--vf-fill))`).
- **Цветовые соответствия сигналов**: language → calm-grounded (azure), speaker → low-energy (blue), deepfake → attack (red = error), behavior → excited (orange), emotion → цвет самой эмоции (инлайн `--vf-sig-RGB`).
- **Тема**: плата жёстко тёмная — класс `dark-mode` на корне резолвит `--m__*`/`--ids__*` в тёмные значения на странице; в embed-CSS они запечены.
- **Респонзив (паттерн скеттерплота)**: фрейм 1140px → 100% ниже 1139px; em-база виджета 16px → 14px ниже 992px (в виджете `--player-strip-height: 3em` вместо плейграундных rem, чтобы полосы масштабировались); панели в столбик ниже 768px.

## Форматы данных и экспорт

- **JSON-конверт**: `format: "modulate-velma-fraud-demo"`, `version: 1`, поля `meta / transcript / signals / verdict / actions / meterKeyframes`. Времена в ms, camelCase (`startMs`, `tMs`).
- **Экспорт HTML**: полный самодостаточный документ (решение владельца — документ, не фрагмент): инлайн `velma-fraud-embed.css` + `velma-fraud-widget.js` + данные инлайн-JSON; Inter с Google Fonts; mp3 **не вшивается** — грузится в ассеты Webflow, URL прописывается в `meta.audioUrl` (через импорт JSON перед экспортом). Без доступного аудио виджет честно работает на демо-клоке.

## Известные грабли и договорённости

- **Headless Chrome не даёт вьюпорт уже ~500px** — «мобильные» скриншоты на 390 бесполезны (лейаут рендерится в 500 и обрезается). Мобильную вёрстку проверять на ~700px (брейкпоинт 768 срабатывает честно). Также Chrome в headless периодически виснет — снимать с вотчдогом (`& CPID=$!; sleep N; kill -9`).
- Для теста экспортного файла есть приём: собрать копию экспорта скриптом node (css + js + данные из `_site/`) и добавить `VelmaFraudWidget._last.seek(60000)` on load — скриншот середины проигрывания без кликов.
- **Попутные фиксы уже в коммите**: в `fingerprint-studio.css` перепозиционирован `clip-text-caption` (плейграундная геометрия `top: 6rem` попадала за пределы полосы 3rem с `overflow: hidden` — подпись была невидима); в виджетном CSS растянут нулевой по ширине `player-position-indicator`.
- **Отложено отдельной задачей** (договорённость с владельцем): замечания к коммиту скеттерплота `a0563ed` — дублирование CSS между `scatterplot.css` и `scatterplot-embed.css`, вьюпорт-зависимые медиа в скриншот-режиме, мёртвый JSON-пейлоад в HTML-экспорте. Возможное направление — общий `widget-studio`-хелпер для респонзив-стейджа и экспорта.
- Кураторские эмоции реплик (config): Caller — frustrated → stressed → anxious → angry → contemptuous; Agent — calm / neutral / confident / calm. Держатся согласованными с emotion-сигналами ленты.

## Как проверять

```bash
npm run build                      # Eleventy → _site/
python3 -m http.server 8085 -d _site
# страница: http://localhost:8085/tools/velma-fraud-demo-widget/
```

Смоук: на десктопе тег в шапке виджета должен смениться на «Audio synced» (mp3 подхватился); play → клипы/реплики/сигналы появляются, метр растёт, на 0:56 — вердикт; сик перетаскиванием пересчитывает всё из t.

## Стиль общения с владельцем

Обращаться на «вы», отвечать кратко, начинать ответ со слов «Окей, ».
