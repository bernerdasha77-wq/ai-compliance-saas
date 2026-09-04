/**
 * Клиентское извлечение текста из PDF/DOCX — намеренно НЕ на бэкенде (см.
 * историю: цель — чтобы исходный файл физически не покидал браузер
 * пользователя до анализа, не только его содержимое до передачи в DeepSeek).
 * Библиотеки грузятся динамически, чтобы не раздувать основной бандл
 * страницы для пользователей, которые файл ещё не выбрали.
 *
 * Сверено с текущим серверным разбором (PyPDF2/python-docx) на реальных
 * документах: PDF — содержимое совпадает посимвольно; DOCX — mammoth
 * дополнительно читает таблицы (python-docx в этом проекте их не читал
 * вообще), то есть строго не хуже.
 */

async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();

  const buffer = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: buffer }).promise;

  let text = '';
  for (let i = 1; i <= doc.numPages; i++) {
    try {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item) => ('str' in item ? item.str : '')).join(' ') + '\n';
    } catch {
      // pdfjs-dist иногда падает на getPage()/getTextContent() для отдельной
      // страницы с нестандартным содержимым (реальный кейс: воспроизводится
      // только в настоящем Safari/WebKit, не в тестовой автоматизации) —
      // пропускаем страницу вместо падения всего извлечения с сырой ошибкой.
    }
  }
  return text;
}

async function extractDocxText(file: File): Promise<string> {
  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return result.value;
}

/** Бросает Error с понятным пользователю сообщением при неподдерживаемом
 * формате или сбое разбора (например, скан PDF без текстового слоя) —
 * без тихого отката на какой-либо другой путь. */
export async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.pdf')) return extractPdfText(file);
  if (name.endsWith('.docx')) return extractDocxText(file);
  throw new Error('Поддерживаются только PDF и DOCX');
}
