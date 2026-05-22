# ui.yaml — схема визуализатора структуры UI

Этот файл описывает дерево экранов и блоков, которое рендерится таблицей на странице `/ui/` (визуализатор: `src/assets/service/ui-visualizer.js`, стили: `src/styles/service/ui-visualizer.css`).

Используется для сравнения **что сейчас в продакшене** и **что в работе/прототипе**, чтобы видеть delta и не терять разделы при редизайне.

## Структура

```yaml
current:   # колонка Production — то, что в живом app
  - ...
target:    # колонка Prototype — то, что в прототипах /web/* и /dashboard/*
  - ...
```

Внутри каждой колонки — список **роутов** (страниц/экранов).

### Роут

```yaml
- id: dashboard-account            # стабильный ключ, по нему мерджатся строки таблицы
  route: /dashboard/account/       # ОДИН url
  # или:
  routes:                          # НЕСКОЛЬКО url для одной логической страницы
    - /dashboard/foo/create/
    - /dashboard/foo/edit/
  title: Account                   # отображается в первой колонке
  title_deprecated: Old Title      # (опц.) показывается зачёркнутым перед title
  sections: [...]                  # плоский список секций (см. ниже)
  subsections: [...]               # (опц.) подразделы со своими заголовками
```

Если страницы ещё нет в этой колонке — `route: —` и `sections: []`. Это позволяет показать «есть только в Prototype» / «есть только в Production».

### Section — что положить внутри роута

Три типа, выбираются по смыслу:

| Тип | Когда | Как выглядит в визуализаторе |
|---|---|---|
| `text-content: <name>` | плоский блок текста или строка таблицы внутри секции — БЕЗ карточки/рамки | буллет `· <name>` |
| `widget: <name>` | один блок, обёрнутый в карточку/рамку (`m__widget`, виджет с заголовком) | рамка вокруг `· <name>` |
| `widgets: [a, b, c]` | НЕСКОЛЬКО блоков внутри одной карточки/виджета | одна рамка со списком `· a`, `· b`, `· c` |

Эвристика «widget или text-content»: открой прототип, найди блок. Если он лежит в `<div class="m__widget">` или визуально оформлен как карточка с фоном/бордером — `widget:`. Если это просто строка в таблице или абзац — `text-content:`.

```yaml
sections:
  - section:
      text-content: account-intro
  - section:
      widget: api-keys-table
  - section:
      widgets:
        - filters
        - request-log
        - credits-consumed
```

### Subsections — для табов и логических подразделов

Если на странице переключатель вкладок (`ids-navbar`, segmented control) и у каждой вкладки свой заголовок + контент — выноси в `subsections`. Сам переключатель остаётся в `sections` как widget сверху.

```yaml
sections:
  - section:
      widget: behaviors-tabs
subsections:
  - title: Detection Packages
    sections:
      - section: { text-content: detection-packages-intro }
      - section: { widget: detection-packages-table }
  - title: Behaviors
    sections:
      - section: { widget: behaviors-table }
```

## Имена

- Имена (`account-intro`, `members`, `behaviors-tabs`, …) — kebab-case, осмысленные.
- Должны быть консистентны между `current` и `target` для одинаковых блоков (легче читать diff).
- Когда переименовываешь сущность (`hero` → `models-intro`) — поменяй в обеих колонках.

## Воркфлоу актуализации

Когда пользователь говорит «обнови схему / поменялся X / появился раздел Y»:

1. **Уточни scope** одной фразой: какая колонка (Prototype/Production/обе) и какой раздел/страница.
2. **Найди источник правды**:
   - Прототипы: `src/prototypes/`
     - Платформа: `src/prototypes/platform/dashboard/*.html`, `src/prototypes/platform/auth/*.html`
     - Лендинг/доки/модели: `src/prototypes/*.html`
   - Включения секций: `src/includes/prototypes/**` и `src/includes/service/table-*.html`
   - Модалки: `src/includes/service/modal-*.html` (сейчас в схеме НЕ отслеживаются — см. ниже).
3. **Сравни структуру** прототипа со строкой YAML. Особое внимание:
   - появились ли новые секции/виджеты;
   - порядок блоков;
   - изменилось ли деление по `widget:` / `text-content:` / `subsections:` (открой HTML, посмотри какие блоки в `m__widget`, какие плоские);
   - не появились ли новые подстраницы (новый файл в `prototypes/`) — заведи новый роут.
4. **Подсветь решения**, которые неочевидны (например: слить две страницы в один роут через `routes:`; раскрыть таблицу на отдельные `text-content` строки; завести `subsections`).
5. **Минимальный diff** — не переписывай весь файл, меняй только затронутое.

## Что схема НЕ описывает

- **Модалки** — целенаправленно не трекаются (их много, шумят). Если когда-то понадобится — расширить схему отдельным полем `modals:` на роут и дополнить визуализатор.
- **Layout chrome** — header, footer, sidebar, шапка auth-страниц с promo-панелью. Это общее обрамление, в `sections` не идёт.
- **Поведение/скрипты** — только структура.

## Если меняешь схему (поля)

Любое новое поле в YAML должно быть поддержано:
1. Нормализатором в `src/assets/service/ui-visualizer.js` (`normalizeRouteList` / `normalizeSection` / `normalizeSubsection`).
2. Рендером в той же файле (`renderRouteBody`, `renderSectionsList`, `renderRoutePaths`).
3. Стилями в `src/styles/service/ui-visualizer.css` если нужен новый класс.

Не забывай: после правки YAML страница `/ui/` подхватит изменения автоматически при перезагрузке.
