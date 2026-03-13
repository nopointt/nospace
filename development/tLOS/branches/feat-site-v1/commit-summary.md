# Commit Summary — site-v1
> Status: ABANDONED
> Closed: 2026-03-01

## Задача

Промо-видео для THELOS: infinite-canvas с 30 скриншотами сервисов, летящими на зрителя, текст "Хочу все / На одном / Экране", финальный collapse в чёрный монолит.

## Что сделано

- **infinite-canvas template** адаптирован: React + @react-three/fiber, 30 image planes, белый фон, chunked texture loading
- **isStopping** — плавная остановка камеры через lerp
- **TextOverlay** — 3 строки текста появляются по таймерам (6000/6950/7900ms после загрузки)
- **CollapseOverlay** — 3 попытки collapse анимации:

## Попытки collapse (все отклонены)

| Подход | Результат |
|---|---|
| CSS metaball (blur+contrast) с новыми кругами | "полная херня — новые объекты" |
| GLSL fragment shader (UV distortion → монолит) | "очень плохо" — артефакты, неправильные цвета, пропорции |
| GSAP DOM grid (30 скриншотов → center, scale:0) | "дрыстня" — хаотичное разлетание без `grid` в stagger |

## Почему не получилось

Реальная проблема: 3D-сцена (Three.js WebGL) и 2D-оверлей (DOM/React) — разные слои. Нет нативного способа захватить позиции 3D-объектов и анимировать DOM-эквиваленты синхронно. Все попытки создавали "фейковые объекты" вместо реальных.

## Что можно было бы сделать иначе

- Canvas2D capture через `preserveDrawingBuffer: true` + рисовать collapse прямо в WebGL
- Three.js CSS3DRenderer для 2D+3D sync
- Записать видео руками (ScreenCapture) вместо кода

## Артефакты ветки

- `templates/infinite-canvas/` — рабочий infinite-canvas, можно переиспользовать
- `templates/GridFlowEffect/` — хороший GSAP grid reference
- `video-scenario.md` — сценарий видео (16 сцен)
