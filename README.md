# SmileedNexus

Красивая, быстрая и лёгкая панель эмодзи для React.

## Особенности

- **Поиск по русским и английским названиям и ключевым словам** — `привет`, `hello`, `flag`, `флаг` — всё находится.
- **Совместимость с React 16.8 – 19** — хуки, `lazy`/`Suspense`, `createRoot`. Никаких конфликтов зависимостей.
- **Текстуры Twemoji** — одинаковые смайлы на Windows, macOS, Android и Linux.
- Без сторонних зависимостей. **React и React DOM** — peer-зависимости (устанавливаются в вашем проекте).
- **Интеграция с `contenteditable`** — вставляет эмодзи точно туда, где стоит курсор.
- **Идеальный рендер составных эмодзи** (радужный флаг 🏳️‍🌈, семьи 👨‍👩‍👧‍👦, тона кожи 👍🏽) благодаря `Intl.Segmenter`.
- **941 эмодзи** в наборе, включая 259 флагов стран с русскими названиями (`Россия`, `Германия`, `США`).
- **Локализация** — подписи, категории и поиск на русском и английском.
- **Недавние эмодзи** — сохраняются в `localStorage`.

## Поддержка платформ и браузеров

Благодаря локальному SVG-спрайту (Twemoji) и нативному API `Intl.Segmenter`, панель **работает одинаково** на всех операционных системах. На старых браузерах, где `Intl.Segmenter` отсутствует, используется fallback через `Array.from` (составные эмодзи могут разбиваться, но базовые работают).

## Установка

```bash
npm install @speednexus_messenger/smileed-nexus
```

**Пример**:

```jsx
import { useState } from 'react';
import { SmileedNexus } from '@speednexus_messenger/smileed-nexus';
import '@speednexus_messenger/smileed-nexus/styles.css';

function App() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)}>😀</button>
      {open && (
        <SmileedNexus
          onSelect={(emoji) => console.log(emoji)}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
```
