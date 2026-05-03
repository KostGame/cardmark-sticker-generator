# Roadmap

## PR-000: Initial generator prototype

- Статическое приложение.
- Пресеты колод.
- Предпросмотр печатного листа.
- CardMark v0.
- SVG/PDF/печать/JSON export.
- Базовая документация.
- Governance baseline: проектные документы, журнал решений, спецификация CardMark v0, roadmap и шаблон отчёта.

## PR-001: Stabilization and GitHub Pages publishing

- Проверка и утверждение governance baseline после initial merge.
- Минимальные локальные проверки без build step.
- GitHub Pages publishing guidance.
- Проверка относительных путей и Pages-ready структуры.
- Правила изменения CardMark v0 без изменения самого формата.
- Проверка ссылок, Markdown и документационных обязательств.

## PR-002: Print layout modes and duplex sheets

- Контрольный, компактный, двусторонний, домашний и плоттерный режимы.
- Front/back страницы для двусторонней печати.
- Registration marks, cut lines, safe area и SVG layer classes.
- Проверки SVG/JSON/CardMark regressions для новых режимов.

## PR-003: CardMark validation and test fixtures

- Тестовые SVG fixtures.
- Проверка детерминированности `generateCardMark`.
- Документирование edge cases.

## Future: Recognition app

- Камера в браузере.
- Поиск CardMark.
- Определение `markerId`.
- Определение ориентации.
- Сопоставление с JSON-манифестом.
- Ручная коррекция результата.
