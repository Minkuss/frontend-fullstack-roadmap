# Персональная карта тем для развития Frontend Engineer

> Составлено на основе текущего профиля:
>
> - более 2 лет коммерческой frontend-разработки;
> - React + TypeScript;
> - строгая типизация в рабочих проектах;
> - опыт с legacy, React Admin, REST API и ЭЦП;
> - базовый Docker, Linux, Caddy/nginx;
> - pet-проекты и Telegram Mini Apps;
> - базовый FastAPI;
> - слабая теоретическая база JavaScript и React;
> - мало самостоятельного опыта тестирования;
> - мало опыта с frontend-безопасностью, производительностью, SQL, CI/CD и observability;
> - цель — Middle Frontend / frontend-heavy fullstack и зарплата от 150 000 ₽.

---

# 1. Приоритеты

## Критический приоритет

Эти блоки напрямую влияют на прохождение Middle Frontend собеседований:

1. JavaScript fundamentals.
2. React в глубину.
3. TypeScript.
4. HTTP, браузер и frontend-безопасность.
5. Самостоятельное тестирование.
6. TanStack Query и server state.

## Высокий приоритет

Эти блоки повышают стоимость как frontend-heavy fullstack-разработчика:

7. Архитектура frontend-приложений.
8. Node.js.
9. PostgreSQL и SQL.
10. Docker и CI/CD.
11. Отладка, мониторинг и observability.

## Поддерживающий приоритет

12. HTML, CSS и accessibility.
13. Git и командная разработка.
14. Технический английский.
15. Работа с AI-агентами.

## Пока не приоритетно

На текущем этапе не нужно специально углубляться в:

- Kubernetes;
- сложные микросервисы;
- Kafka;
- GraphQL, если он не нужен в проекте;
- микрофронтенды как отдельную специализацию;
- Angular и Vue;
- WebAssembly;
- сложную frontend-графику;
- продвинутые алгоритмы уровня олимпиад;
- системное администрирование;
- сложный DevOps.

---

# 2. JavaScript

## Цель

Перестать опираться только на практическую интуицию и научиться точно объяснять выполнение JavaScript-кода.

## 2.1. Области видимости и выполнение кода

Изучить:

- execution context;
- global execution context;
- function execution context;
- call stack;
- lexical environment;
- scope;
- scope chain;
- block scope;
- function scope;
- hoisting;
- temporal dead zone;
- замыкания;
- захват переменных замыканием.

Уметь объяснить:

- почему `let` и `const` нельзя использовать до объявления;
- чем область видимости `var` отличается от `let`;
- почему замыкание сохраняет доступ к переменным;
- где замыкания встречаются в React;
- как замыкания связаны со stale closure.

Практика:

- функции-счётчики;
- фабрики функций;
- приватное состояние через closure;
- примеры stale closure;
- задачи на hoisting.

---

## 2.2. Типы, значения и ссылки

Изучить:

- primitive values;
- objects;
- reference semantics;
- сравнение примитивов и объектов;
- shallow copy;
- deep copy;
- mutation;
- immutability;
- spread syntax;
- `Object.assign`;
- `structuredClone`;
- JSON serialization limitations;
- destructuring;
- optional chaining;
- nullish coalescing;
- truthy и falsy values;
- `null` и `undefined`;
- `NaN`;
- `Object.is`.

Уметь объяснить:

- почему два одинаковых объекта не равны;
- почему изменение вложенного объекта может мутировать исходные данные;
- как мутация влияет на React;
- чем `||` отличается от `??`;
- когда `structuredClone` не подходит.

Практика:

- копирование вложенных данных;
- immutable update;
- обновление массива объектов;
- поиск ошибок из-за мутаций.

---

## 2.3. Функции и `this`

Изучить:

- function declaration;
- function expression;
- arrow functions;
- first-class functions;
- higher-order functions;
- callback;
- pure functions;
- side effects;
- `this`;
- implicit binding;
- explicit binding;
- constructor binding;
- `bind`;
- `call`;
- `apply`;
- потеря контекста;
- отличие `this` в arrow function.

Уметь объяснить:

- как определяется `this`;
- почему arrow function не имеет собственного `this`;
- когда теряется контекст метода;
- чем callback отличается от вызова функции.

Практика:

- задачи на `this`;
- собственный упрощённый `bind`;
- функции высшего порядка;
- чистые и нечистые функции.

---

## 2.4. Прототипы и классы

Изучить:

- prototype;
- prototype chain;
- `__proto__` на уровне понимания;
- `Object.create`;
- constructor functions;
- class syntax;
- inheritance;
- instance methods;
- static methods;
- private fields;
- composition против inheritance.

Уметь объяснить:

- где JavaScript ищет свойство;
- чем `prototype` отличается от прототипа конкретного объекта;
- что делает `new`;
- почему классы JavaScript основаны на прототипах.

---

## 2.5. Асинхронность

Это один из главных приоритетов.

Изучить:

- synchronous code;
- Web APIs;
- event loop;
- task queue;
- microtask queue;
- Promise;
- состояния Promise;
- chaining;
- error propagation;
- `async/await`;
- `try/catch/finally`;
- `Promise.all`;
- `Promise.allSettled`;
- `Promise.race`;
- `Promise.any`;
- `queueMicrotask`;
- `setTimeout`;
- request cancellation;
- AbortController;
- race conditions;
- debounce;
- throttle;
- retry;
- exponential backoff;
- ограничение параллелизма.

Уметь объяснить:

- порядок выполнения task и microtask;
- почему `setTimeout(..., 0)` не выполняется сразу;
- как ошибки проходят по Promise chain;
- чем последовательное ожидание отличается от параллельного;
- как возникает race condition;
- как отменять устаревшие запросы;
- почему слишком много microtasks могут задержать интерфейс.

Практика:

- минимум 20 задач на event loop;
- debounce;
- throttle;
- retry с ограничением попыток;
- отменяемый поиск;
- ограничитель параллельных запросов;
- защита от устаревшего ответа API.

---

## 2.6. Коллекции и итерации

Изучить:

- Array methods;
- `map`;
- `filter`;
- `reduce`;
- `find`;
- `findIndex`;
- `some`;
- `every`;
- `flat`;
- `flatMap`;
- `sort`;
- `toSorted`;
- `Set`;
- `Map`;
- `WeakSet`;
- `WeakMap`;
- iterables;
- iterators;
- generators на базовом уровне.

Практика:

- группировка данных;
- построение lookup map;
- удаление дубликатов;
- преобразование ответа API;
- агрегация статистики тренировок.

---

## 2.7. Модули и сборка

Изучить:

- ES modules;
- named exports;
- default exports;
- dynamic import;
- CommonJS на уровне понимания;
- module resolution;
- tree shaking;
- side effects;
- code splitting;
- circular dependencies;
- bundler entry points;
- source maps;
- environment variables.

Инструменты:

- Vite;
- Webpack на уровне понимания, учитывая legacy;
- Turborepo, так как уже используется;
- bundle analyzer.

Уметь объяснить:

- почему tree shaking может не сработать;
- как dynamic import влияет на bundle;
- чем dev-сборка отличается от production;
- что такое source map;
- как искать циклические зависимости.

---

## 2.8. Память и производительность

Изучить:

- garbage collection на концептуальном уровне;
- reachability;
- memory leaks;
- event listener leaks;
- timers;
- detached DOM;
- closures и удержание памяти;
- long tasks;
- performance.now;
- браузерный Performance panel.

Практика:

- найти утечку слушателя;
- корректно очищать таймер;
- анализировать long task;
- сделать базовый memory snapshot.

---

# 3. TypeScript

## Цель

Уметь типизировать бизнес-логику, API и переиспользуемые компоненты без злоупотребления `any`.

## 3.1. База типов

Изучить:

- type inference;
- explicit annotations;
- primitive types;
- arrays;
- tuples;
- object types;
- optional properties;
- readonly;
- literal types;
- union types;
- intersection types;
- enums и их альтернативы;
- function types;
- overloads на базовом уровне.

Особое внимание:

- `any`;
- `unknown`;
- `never`;
- `void`;
- `null`;
- `undefined`.

Уметь объяснить:

- почему `unknown` безопаснее `any`;
- где появляется `never`;
- когда нужен exhaustive check;
- почему type assertion не проверяет данные.

---

## 3.2. Narrowing

Изучить:

- `typeof`;
- `in`;
- `instanceof`;
- truthiness narrowing;
- equality narrowing;
- custom type guards;
- assertion functions;
- discriminated unions;
- exhaustive checking.

Практика:

- типизированный reducer;
- обработка состояний запроса;
- разбор разных API response;
- обработка ошибок разных типов.

---

## 3.3. Generics

Изучить:

- generic functions;
- generic interfaces;
- generic types;
- constraints;
- default generic parameters;
- `keyof`;
- indexed access types;
- generic React components.

Практика:

- generic table;
- generic select;
- API client;
- типизированный repository;
- utility для обновления поля объекта.

---

## 3.4. Продвинутые типы

Изучить на рабочем уровне:

- utility types;
- `Partial`;
- `Required`;
- `Readonly`;
- `Pick`;
- `Omit`;
- `Record`;
- `Exclude`;
- `Extract`;
- `NonNullable`;
- `ReturnType`;
- `Parameters`;
- mapped types;
- conditional types;
- `infer`;
- template literal types;
- `satisfies`;
- const assertions;
- branded types.

Не нужно превращать TypeScript в олимпиадное программирование. Цель — читать и писать реальные типы проекта.

---

## 3.5. Типизация API

Изучить:

- DTO;
- domain model;
- отличие API model от UI model;
- runtime validation;
- schema validation;
- Zod;
- преобразование входных данных;
- typed fetch wrapper;
- error response types;
- pagination types;
- generated API clients на уровне понимания;
- OpenAPI.

Практика:

- описать API тренировок;
- проверить ответ через Zod;
- преобразовать DTO в domain entity;
- не доверять `response.json()` без проверки.

---

## 3.6. TypeScript в React

Изучить:

- props;
- children;
- event types;
- refs;
- generic components;
- polymorphic components на базовом уровне;
- context typing;
- reducer typing;
- custom hooks;
- controlled components;
- form types;
- типизация TanStack Query;
- типизация ошибок.

---

## 3.7. Конфигурация

Изучить:

- `strict`;
- `noImplicitAny`;
- `strictNullChecks`;
- `noUncheckedIndexedAccess`;
- `exactOptionalPropertyTypes`;
- path aliases;
- project references на уровне понимания;
- declaration files;
- типизация сторонних библиотек.

Практика:

- включить строгие опции в pet-проекте;
- постепенно убрать `any`;
- добавить lint rule против неявного `any`.

---

# 4. React

## Цель

Перейти от прикладного использования React к точному пониманию его модели выполнения.

## 4.1. Render и commit

Изучить:

- trigger;
- render phase;
- commit phase;
- reconciliation;
- virtual DOM как упрощённая модель;
- component identity;
- state preservation;
- state reset;
- роль позиции в дереве;
- `key`;
- повторный рендер родителя;
- повторный рендер дочернего компонента.

Уметь объяснить:

- почему вызов компонента не равен изменению DOM;
- что вызывает рендер;
- когда React сохраняет state;
- почему неправильный `key` ломает состояние;
- почему индекс массива часто плохой `key`.

Практика:

- диагностировать 10 примеров с перерендерами;
- сделать примеры сохранения и сброса state;
- исправить список с неправильными ключами.

---

## 4.2. State

Изучить:

- state as snapshot;
- batching;
- functional state updates;
- derived state;
- lifting state up;
- single source of truth;
- local state;
- shared state;
- URL state;
- server state;
- global client state;
- state machines на концептуальном уровне.

Практика:

- выбрать правильное место состояния;
- убрать дублирующий state;
- заменить Effect на вычисление;
- перенести фильтры в URL.

---

## 4.3. Effects

Это критическая тема.

Изучить:

- назначение Effect;
- dependency array;
- cleanup;
- stale closure;
- race conditions;
- subscriptions;
- timers;
- request cancellation;
- Strict Mode и двойной запуск в development;
- когда Effect не нужен;
- разделение Effect по причинам;
- синхронизация с внешней системой;
- `useLayoutEffect` на уровне понимания.

Уметь объяснить:

- почему нельзя игнорировать `exhaustive-deps`;
- почему вычисляемое значение не нужно класть в state через Effect;
- как избежать бесконечного цикла;
- как очищать подписку;
- как защищаться от устаревших запросов.

Практика:

- найти 10 неправильных Effect;
- переписать их;
- сделать подписку;
- сделать cleanup;
- отменить запрос.

---

## 4.4. Composition

Изучить:

- composition;
- children;
- render props на уровне понимания;
- compound components;
- headless components;
- controlled API;
- uncontrolled API;
- custom hooks;
- разделение UI и бизнес-логики;
- container/presentational на уровне идеи.

Практика:

- модальное окно;
- tabs;
- form field;
- reusable data table;
- вынесение логики в custom hook.

---

## 4.5. Context и state management

Изучить:

- Context;
- provider;
- потребители;
- влияние изменения context value;
- разделение contexts;
- мемоизация значения;
- Context против Zustand;
- Context против props;
- Zustand selectors;
- derived state;
- store normalization;
- server state нельзя без причины складывать в Zustand.

Инструменты:

- Zustand;
- React Context;
- TanStack Query;
- URLSearchParams.

Практика:

- авторизация через Context или store;
- отдельные selectors;
- фильтры в URL;
- server state через TanStack Query.

---

## 4.6. Производительность React

Изучить:

- React DevTools;
- Profiler;
- why did this render;
- `React.memo`;
- `useMemo`;
- `useCallback`;
- referential equality;
- expensive calculations;
- list virtualization;
- code splitting;
- lazy;
- Suspense;
- transitions;
- deferred value на базовом уровне.

Уметь объяснить:

- почему мемоизация имеет стоимость;
- когда `useCallback` бесполезен;
- как новая ссылка на объект влияет на memoized component;
- когда нужна виртуализация.

Инструменты:

- React Profiler;
- Chrome Performance;
- `@tanstack/react-virtual` или `react-window`.

---

## 4.7. Ошибки и устойчивость

Изучить:

- Error Boundary;
- ошибки render phase;
- ошибки event handlers;
- async errors;
- retry;
- fallback UI;
- empty state;
- stale state;
- offline state;
- loading state;
- skeleton;
- optimistic UI;
- graceful degradation.

Практика:

- Error Boundary;
- retry button;
- fallback page;
- корректные состояния API.

---

## 4.8. Формы

Изучить:

- controlled fields;
- uncontrolled fields;
- validation;
- touched/dirty state;
- async validation;
- form submission;
- disabled state;
- error messages;
- accessibility;
- complex forms;
- dynamic fields.

Инструменты:

- React Hook Form;
- Zod;
- native FormData.

Практика:

- форма создания тренировки;
- динамические подходы;
- schema validation;
- серверные ошибки;
- сохранение черновика.

---

# 5. TanStack Query

## Цель

Перестать вручную управлять server state через `useEffect` и глобальные stores.

## Темы

Изучить:

- QueryClient;
- provider;
- query keys;
- query functions;
- `useQuery`;
- `useMutation`;
- `staleTime`;
- garbage collection;
- refetch;
- background refetch;
- invalidation;
- retries;
- cancellation;
- dependent queries;
- enabled queries;
- placeholder data;
- initial data;
- pagination;
- infinite queries;
- prefetch;
- optimistic updates;
- mutation rollback;
- query key factories;
- cache updates;
- server rendering на базовом уровне;
- error handling;
- offline behavior на базовом уровне.

Практика:

- список тренировок;
- детали тренировки;
- создание подхода;
- optimistic update;
- удаление;
- rollback при ошибке;
- пагинация истории;
- prefetch деталей;
- корректные query keys.

---

# 6. Архитектура frontend

## Цель

Уметь объяснять архитектурные решения, а не только раскладывать код по FSD-папкам.

## Изучить

- separation of concerns;
- cohesion;
- coupling;
- dependency direction;
- public API модуля;
- boundaries;
- domain model;
- UI layer;
- application layer;
- infrastructure layer;
- feature modules;
- shared modules;
- dependency inversion на практическом уровне;
- composition root;
- state ownership;
- data flow;
- side effects;
- API layer;
- adapters;
- repositories на уровне применимости;
- circular dependencies;
- barrel exports;
- module contracts;
- error boundaries;
- feature flags;
- configuration;
- monorepo;
- shared packages;
- versioning внутренних пакетов.

## FSD

Изучить не только названия слоёв:

- `app`;
- `pages`;
- `widgets`;
- `features`;
- `entities`;
- `shared`;
- правила импортов;
- public API;
- slices;
- segments;
- когда FSD избыточен;
- как не создавать «папочную архитектуру».

## Практика

- нарисовать архитектуру pet-проекта;
- описать data flow;
- определить владельцев state;
- создать 3 ADR;
- объяснить альтернативы;
- найти циклические зависимости;
- провести рефакторинг одного модуля.

---

# 7. HTTP и сеть

## Цель

Уверенно понимать взаимодействие браузера с backend.

## Изучить

- URL;
- DNS на базовом уровне;
- TCP на базовом уровне;
- TLS/HTTPS;
- HTTP request;
- HTTP response;
- методы;
- safe methods;
- idempotent methods;
- status codes;
- headers;
- content types;
- compression;
- cookies;
- caching;
- `Cache-Control`;
- `ETag`;
- conditional requests;
- CORS;
- preflight;
- credentials;
- REST;
- pagination;
- rate limits;
- timeout;
- retries;
- idempotency keys;
- WebSocket;
- SSE;
- polling;
- long polling на уровне понимания.

Практика:

- разбирать запросы в Network;
- сделать отмену;
- сделать retry;
- сравнить WebSocket, SSE и polling;
- настроить caching для статики;
- обработать 401, 403, 404, 409, 422, 429, 500.

---

# 8. Браузер

## Цель

Понимать среду выполнения frontend-приложения.

## Изучить

- DOM;
- CSSOM;
- render tree;
- style calculation;
- layout;
- paint;
- composite;
- main thread;
- compositor thread на базовом уровне;
- reflow;
- repaint;
- event propagation;
- capturing;
- bubbling;
- event delegation;
- default actions;
- focus;
- history API;
- URL API;
- localStorage;
- sessionStorage;
- IndexedDB на базовом уровне;
- cookies;
- service workers на базовом уровне;
- web workers на базовом уровне;
- browser cache;
- rendering lifecycle.

## Производительность

- Core Web Vitals;
- LCP;
- INP;
- CLS;
- long tasks;
- lazy loading;
- code splitting;
- preload;
- prefetch;
- responsive images;
- image formats;
- bundle size;
- source maps;
- network waterfall.

Инструменты:

- Chrome DevTools;
- Lighthouse;
- Performance;
- Memory;
- Network;
- Coverage;
- React Profiler.

---

# 9. Frontend-безопасность

## Цель

Уметь проектировать и проверять безопасную схему frontend-аутентификации.

## Изучить

- threat model;
- XSS;
- stored XSS;
- reflected XSS;
- DOM XSS;
- HTML escaping;
- sanitization;
- `dangerouslySetInnerHTML`;
- CSRF;
- SameSite cookies;
- CSRF token;
- CORS не является CSRF-защитой;
- cookies;
- `HttpOnly`;
- `Secure`;
- `SameSite`;
- localStorage risks;
- sessionStorage risks;
- access token;
- refresh token;
- token rotation;
- session authentication;
- Content Security Policy;
- clickjacking;
- `X-Frame-Options`;
- open redirect;
- dependency vulnerabilities;
- supply chain;
- OAuth 2.0;
- OpenID Connect;
- PKCE;
- BFF pattern;
- безопасная работа с Telegram `initData`.

Практика:

- описать threat model pet-проекта;
- проверить cookies;
- настроить security headers;
- серверно валидировать Telegram `initData`;
- обработать logout и refresh;
- провести dependency audit.

Источники:

- OWASP Cheat Sheet Series;
- MDN Security;
- документация OAuth/OIDC провайдера.

---

# 10. Тестирование

## Цель

Самостоятельно писать тесты и понимать, что именно они доказывают.

## 10.1. Общие концепции

Изучить:

- unit tests;
- integration tests;
- component tests;
- E2E;
- test pyramid;
- test trophy;
- behavior testing;
- implementation details;
- arrange-act-assert;
- fixtures;
- mocks;
- stubs;
- spies;
- fake timers;
- deterministic tests;
- flaky tests;
- coverage;
- meaningful coverage;
- happy path;
- error path;
- edge cases.

---

## 10.2. Vitest

Изучить:

- test suites;
- assertions;
- mocks;
- spies;
- fake timers;
- setup files;
- test environment;
- coverage;
- parameterized tests.

Практика:

- бизнес-функции;
- преобразование данных;
- валидация;
- retry;
- debounce с fake timers.

---

## 10.3. React Testing Library

Изучить:

- render;
- queries;
- `getBy`;
- `findBy`;
- `queryBy`;
- role-based queries;
- user-event;
- async UI;
- forms;
- accessibility-oriented tests;
- testing hooks только при необходимости;
- не тестировать внутреннее состояние.

Практика:

- форма тренировки;
- loading;
- error;
- empty state;
- validation;
- user interaction.

---

## 10.4. MSW

Изучить:

- network mocking;
- handlers;
- success response;
- error response;
- delayed response;
- test isolation.

Практика:

- мок списка тренировок;
- 500;
- 401;
- медленный ответ;
- пустой список.

---

## 10.5. Playwright

Изучить:

- locators;
- role locators;
- assertions;
- fixtures;
- authentication state;
- network interception;
- retries;
- screenshots;
- traces;
- parallel execution;
- test data;
- Page Object только при реальной пользе;
- борьба с flaky tests.

Практика:

- вход;
- создание тренировки;
- редактирование;
- удаление;
- ошибка backend;
- refresh страницы;
- мобильный viewport.

---

# 11. HTML, CSS и accessibility

## Цель

Довести до уверенного рабочего уровня, не становясь узким специалистом по вёрстке.

## HTML

Изучить:

- semantic HTML;
- forms;
- labels;
- buttons;
- links;
- tables;
- dialogs;
- headings;
- landmarks;
- media;
- native validation;
- keyboard behavior.

## CSS

Изучить:

- box model;
- normal flow;
- positioning;
- stacking context;
- z-index;
- flexbox;
- grid;
- responsive design;
- media queries;
- container queries;
- intrinsic sizing;
- min/max/clamp;
- overflow;
- text truncation;
- CSS variables;
- transitions;
- animations на базовом уровне;
- specificity;
- cascade;
- isolation;
- logical properties.

## Accessibility

Изучить:

- keyboard navigation;
- focus;
- focus trap;
- focus restoration;
- semantic roles;
- accessible names;
- labels;
- ARIA;
- live regions;
- dialogs;
- contrast;
- reduced motion;
- screen reader basics;
- WCAG на рабочем уровне.

Инструменты:

- axe;
- Lighthouse;
- Accessibility Tree;
- Testing Library role queries.

---

# 12. Node.js

## Цель

Получить рабочий backend-уровень, достаточный для frontend-heavy fullstack.

## Основы Node.js

Изучить:

- Node runtime;
- event loop отличия на базовом уровне;
- modules;
- environment variables;
- process;
- signals;
- graceful shutdown;
- file system;
- streams на базовом уровне;
- errors;
- async code;
- package management.

## Framework

Выбрать один основной:

- Fastify — предпочтительно для понимания и лёгких сервисов;
- NestJS — если целевые вакансии часто его требуют.

Изучить:

- routes/controllers;
- services;
- dependency injection, если NestJS;
- validation;
- middleware/hooks;
- authentication;
- authorization;
- error handling;
- logging;
- file uploads;
- background jobs;
- rate limiting;
- healthchecks;
- OpenAPI;
- testing API.

## Авторизация

Изучить:

- sessions;
- JWT;
- refresh rotation;
- password hashing;
- RBAC;
- ownership checks;
- Telegram authentication;
- CSRF;
- secure cookies.

---

# 13. SQL и PostgreSQL

## Цель

Перестать рассматривать БД как чёрный ящик.

## SQL

Изучить:

- `SELECT`;
- `INSERT`;
- `UPDATE`;
- `DELETE`;
- `WHERE`;
- `ORDER BY`;
- `GROUP BY`;
- aggregate functions;
- inner join;
- left join;
- subqueries;
- CTE;
- pagination;
- transactions;
- constraints.

## Проектирование данных

Изучить:

- entities;
- relationships;
- one-to-one;
- one-to-many;
- many-to-many;
- primary keys;
- foreign keys;
- unique constraints;
- normalization;
- denormalization на уровне понимания;
- nullable fields;
- timestamps;
- soft delete;
- audit fields.

## PostgreSQL

Изучить:

- data types;
- indexes;
- composite indexes;
- unique indexes;
- query planner;
- `EXPLAIN`;
- transactions;
- isolation levels на базовом уровне;
- locks на базовом уровне;
- JSONB на уровне применимости;
- migrations;
- connection pool;
- N+1 problem.

Инструменты:

- PostgreSQL;
- Drizzle или Prisma;
- migrations;
- pgAdmin/DBeaver;
- `EXPLAIN ANALYZE`.

Практика:

- схема тренировок;
- упражнения;
- подходы;
- программы;
- пользователи;
- индексы;
- аналитические запросы;
- транзакционное создание тренировки.

---

# 14. Docker

## Цель

Перейти от «умею запустить Compose» к нормальному production-развёртыванию небольшого приложения.

## Изучить

- image;
- container;
- layer;
- Dockerfile;
- build context;
- `.dockerignore`;
- multi-stage build;
- cache;
- Compose;
- networks;
- volumes;
- bind mounts;
- healthchecks;
- restart policies;
- environment variables;
- secrets;
- non-root user;
- ports;
- logs;
- resource limits на базовом уровне;
- image scanning;
- slim/alpine tradeoffs.

Практика:

- отдельные frontend/backend images;
- production build;
- healthchecks;
- non-root containers;
- named volume для БД;
- internal network;
- Caddy/nginx reverse proxy;
- безопасное хранение конфигурации.

---

# 15. Caddy и nginx

## Цель

Уверенно понимать текущую схему деплоя.

## Изучить

- reverse proxy;
- TLS;
- automatic HTTPS;
- static files;
- compression;
- caching;
- security headers;
- SPA fallback;
- proxy headers;
- WebSocket proxying;
- request size limits;
- logs;
- rate limiting на базовом уровне;
- zero-downtime reload на уровне понимания.

Практика:

- frontend на `/`;
- API на `/api`;
- WebSocket endpoint;
- caching assets;
- security headers;
- access logs.

---

# 16. CI/CD

## Цель

Убрать ручную пересборку проекта на сервере.

## GitHub Actions или GitLab CI

Изучить:

- workflow;
- jobs;
- steps;
- runners;
- artifacts;
- cache;
- secrets;
- environments;
- branch protection;
- pull request checks;
- manual approvals;
- deployment;
- rollback;
- tagging;
- release.

## Pipeline pet-проекта

Обязательные стадии:

1. install;
2. lint;
3. typecheck;
4. unit tests;
5. build;
6. E2E для критических сценариев;
7. Docker build;
8. deploy;
9. healthcheck после deploy.

Дополнительно:

- staging;
- production;
- database migrations;
- backup перед migration;
- rollback strategy.

---

# 17. Observability и production-диагностика

## Цель

Уметь понять, что сломалось у пользователя, а не ждать скриншот в чате.

## Frontend

Изучить:

- error tracking;
- stack traces;
- source maps;
- breadcrumbs;
- release versions;
- user context;
- performance monitoring;
- frontend logs;
- privacy.

Инструмент:

- Sentry.

## Backend

Изучить:

- structured logs;
- log levels;
- request ID;
- correlation ID;
- error logs;
- audit logs;
- metrics;
- uptime;
- healthcheck;
- readiness;
- liveness на уровне понимания.

Инструменты:

- Pino;
- Sentry;
- Uptime Kuma;
- Grafana/Prometheus позже, не как первый шаг.

## Практика

- Sentry release;
- source maps;
- request ID от Caddy до backend;
- health endpoint;
- uptime check;
- уведомление о падении.

---

# 18. Git и командная разработка

## Изучить

- branching;
- merge;
- rebase;
- conflict resolution;
- cherry-pick;
- revert;
- reset;
- reflog;
- bisect;
- tags;
- conventional commits;
- pull requests;
- code review;
- protected branches;
- semantic versioning;
- release notes.

Практика:

- найти регрессию через `git bisect`;
- откатить плохой релиз;
- исправить конфликт;
- написать хороший PR description.

---

# 19. Code review

## Что проверять

- корректность;
- соответствие требованиям;
- edge cases;
- читаемость;
- типизацию;
- архитектурные границы;
- состояние;
- side effects;
- ошибки;
- безопасность;
- производительность;
- тесты;
- accessibility;
- backward compatibility;
- сложность поддержки.

## Персональная задача

Перестать ограничивать review только стилем и упрощением кода.

Для каждого PR задавать вопросы:

- Что произойдёт при ошибке API?
- Может ли запрос завершиться не в том порядке?
- Есть ли утечка данных?
- Где находится источник истины?
- Не дублируется ли state?
- Как проверить решение?
- Что произойдёт на медленном интернете?
- Можно ли откатить изменение?

---

# 20. Работа с AI-агентами

## Цель

Использовать AI как усилитель инженерных навыков, а не замену понимания.

## Изучить и практиковать

- формулирование требований;
- acceptance criteria;
- task decomposition;
- context engineering;
- repository instructions;
- AGENTS.md;
- plan-first workflow;
- small diffs;
- review loop;
- testing loop;
- security review;
- prompt injection risks;
- проверка зависимостей;
- контроль миграций;
- контроль shell-команд;
- оценка сгенерированной архитектуры;
- comparison of alternatives;
- ведение decision log.

## Рабочий процесс

1. Самостоятельно понять задачу.
2. Написать ограничения.
3. Составить собственный черновой план.
4. Попросить AI проверить план.
5. Реализовывать маленькими частями.
6. Читать diff.
7. Запускать тесты.
8. Проверять типы.
9. Проверять security.
10. Объяснять итоговое решение без AI.

## Обязательная практика

- одна сессия в неделю без AI-генерации;
- самостоятельно писать первые версии тестов;
- самостоятельно проектировать схему БД;
- самостоятельно объяснять каждый merged diff.

---

# 21. Технический английский

## Цель

Подготовиться к интервью и работе в англоязычной команде.

## Темы

- рассказ о себе;
- текущий проект;
- legacy;
- ЭЦП;
- build optimization;
- architecture decisions;
- code review;
- production issue;
- testing;
- React rendering;
- event loop;
- authentication;
- pet-project architecture;
- AI-assisted development.

## Практика

- 10 минут устного ответа каждый день;
- mock interview раз в неделю;
- README на английском;
- English CV;
- описание PR на английском;
- объяснение одной темы вслух.

---

# 22. Алгоритмы и структуры данных

## Требуемый уровень

Для frontend-собеседований нужен рабочий базовый уровень, а не олимпиадный.

## Изучить

- Big O;
- arrays;
- strings;
- objects/hash maps;
- Set;
- Map;
- stack;
- queue;
- linked list на уровне понимания;
- tree traversal;
- recursion;
- sorting;
- binary search;
- two pointers;
- sliding window;
- frequency counter;
- BFS/DFS на базовом уровне.

Практика:

- 1–2 задачи в неделю;
- основной упор на объяснение сложности;
- задачи, близкие к преобразованию данных frontend.

---

# 23. Pet-проект: рекомендуемый стек

Для дневника тренировок или Telegram Mini App:

## Frontend

- React;
- TypeScript;
- Vite или Next.js;
- TanStack Query;
- Zustand только для настоящего client state;
- React Hook Form;
- Zod;
- shadcn/ui или MUI;
- Vitest;
- React Testing Library;
- Playwright;
- Sentry.

## Backend

Предпочтительный новый вариант:

- Node.js;
- Fastify;
- TypeScript;
- Zod;
- PostgreSQL;
- Drizzle ORM;
- Pino;
- OpenAPI.

Допустимый вариант:

- FastAPI;
- PostgreSQL;
- SQLAlchemy;
- Alembic;
- Pydantic.

Не нужно переписывать существующий проект только ради Node.js. Можно сделать следующий сервис или отдельный модуль на Node.js.

## Infrastructure

- Docker;
- Docker Compose;
- Caddy;
- GitHub Actions;
- Uptime Kuma;
- Sentry;
- VPS.

---

# 24. Очерёдность изучения

## Этап 1 — первые 8 недель

Основной фокус:

- JavaScript execution model;
- event loop;
- closures;
- `this`;
- TypeScript narrowing и generics;
- React render/commit;
- state;
- Effects;
- stale closures;
- TanStack Query basics;
- первые самостоятельные тесты.

## Этап 2 — недели 9–16

Основной фокус:

- HTTP;
- браузер;
- security;
- TanStack Query advanced;
- React performance;
- Testing Library;
- MSW;
- Playwright;
- архитектура pet-проекта.

## Этап 3 — недели 17–24

Основной фокус:

- Node.js;
- SQL;
- PostgreSQL;
- Docker;
- CI/CD;
- Sentry;
- logging;
- production deploy;
- подготовка к собеседованиям.

---

# 25. Минимальный критерий освоения блока

Блок можно считать освоенным на рабочем уровне, если ты:

- можешь объяснить его без конспекта;
- можешь написать минимальный пример;
- можешь найти ошибку в чужом коде;
- применил тему в проекте;
- написал или обновил тест;
- ответил на уточняющие вопросы;
- помнишь основную модель через неделю.

---

# 26. Что даст максимальный прирост именно тебе

Наибольший карьерный эффект в ближайшие месяцы дадут:

1. Event loop, closures, асинхронность и `this`.
2. React render, state, Effects и stale closures.
3. TypeScript narrowing, generics и отказ от `any`.
4. TanStack Query.
5. Самостоятельные Vitest, Testing Library и Playwright.
6. XSS, CSRF, cookies, CORS и authentication.
7. PostgreSQL: joins, indexes, migrations и transactions.
8. GitHub Actions и автоматический deploy.
9. Sentry и структурированные логи.
10. Публичный pet-проект с качественным README.
11. Технические интервью на русском и английском.
12. Чёткая упаковка опыта с legacy, сборкой и ЭЦП.

Это важнее изучения очередного frontend-фреймворка.
