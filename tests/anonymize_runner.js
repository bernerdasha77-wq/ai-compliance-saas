// Вызывает НАСТОЯЩИЙ frontend/app/lib/anonymize.ts (тот же код, что использует
// сайт в браузере) из Python-теста. anonymize.ts не имеет внешних импортов,
// поэтому компилируется в CommonJS "на лету" через локальный tsc фронтенда —
// без дублирования логики анонимизации на Python.
//
// Использование: node tests/anonymize_runner.js <путь-к-скомпилированному-anonymize.js> <путь-к-тексту.txt>
// Печатает в stdout JSON: { text, counts, total, labelMap }

const fs = require('fs');

const [, , compiledModulePath, textPath] = process.argv;
if (!compiledModulePath || !textPath) {
  console.error('Использование: node anonymize_runner.js <compiled anonymize.js> <text file>');
  process.exit(1);
}

const { anonymizeText } = require(require('path').resolve(compiledModulePath));
const text = fs.readFileSync(textPath, 'utf-8');
const result = anonymizeText(text);
process.stdout.write(JSON.stringify(result));
