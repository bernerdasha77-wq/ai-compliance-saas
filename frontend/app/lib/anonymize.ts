/**
 * Клиентское обезличивание структурированных персональных данных перед
 * отправкой документа на анализ. Намеренно ограничено форматами с чётким,
 * регулярным написанием (телефон, email, ИНН, ОГРН/ОГРНИП, СНИЛС, паспорт РФ,
 * номер карты) — имена, адреса, названия компаний НЕ распознаются: это
 * задача NER-модели, а не регулярных выражений, и попытка "угадывать" их
 * регэкспами дала бы ложное чувство полноты защиты хуже, чем её отсутствие.
 *
 * Каждая категория — при первой возможности — валидируется контрольной
 * суммой (ИНН, ОГРН/ОГРНИП — официальные алгоритмы ФНС; номер карты —
 * Луна), чтобы не заменять на плейсхолдер случайные числа той же длины
 * (номер договора, дата в цифрах и т.п.). СНИЛС и паспорт РФ — только по
 * формату: у СНИЛС формат (три дефиса + пробел) уже достаточно специфичен,
 * у паспорта РФ публично проверяемого алгоритма контрольной суммы нет.
 */

export type AnonymizeCategoryKey =
  | 'card'
  | 'ogrnip'
  | 'ogrn'
  | 'snils'
  | 'passportRu'
  | 'innOrg'
  | 'innPerson'
  | 'phone'
  | 'email';

export interface AnonymizeCategory {
  key: AnonymizeCategoryKey;
  /** Название для сводки в UI, например "телефон" (без числа — оно подставляется отдельно) */
  label: string;
  placeholder: string;
}

export const ANONYMIZE_CATEGORIES: Record<AnonymizeCategoryKey, AnonymizeCategory> = {
  card: { key: 'card', label: 'номер карты', placeholder: '[КАРТА СКРЫТА]' },
  ogrnip: { key: 'ogrnip', label: 'ОГРНИП', placeholder: '[ОГРНИП СКРЫТ]' },
  ogrn: { key: 'ogrn', label: 'ОГРН', placeholder: '[ОГРН СКРЫТ]' },
  snils: { key: 'snils', label: 'СНИЛС', placeholder: '[СНИЛС СКРЫТ]' },
  passportRu: { key: 'passportRu', label: 'паспорт', placeholder: '[ПАСПОРТ СКРЫТ]' },
  innOrg: { key: 'innOrg', label: 'ИНН', placeholder: '[ИНН СКРЫТ]' },
  innPerson: { key: 'innPerson', label: 'ИНН', placeholder: '[ИНН СКРЫТ]' },
  phone: { key: 'phone', label: 'телефон', placeholder: '[ТЕЛЕФОН СКРЫТ]' },
  email: { key: 'email', label: 'email', placeholder: '[EMAIL СКРЫТ]' },
};

export interface CategoryResult {
  text: string;
  count: number;
}

export interface AnonymizeResult {
  text: string;
  /** Количество замен по категории — только ненулевые категории для UI-сводки. */
  counts: Partial<Record<AnonymizeCategoryKey, number>>;
  total: number;
}

// ---- Контрольные суммы -------------------------------------------------

/** Алгоритм Луна — стандартная проверка номеров банковских карт. */
function luhnValid(digits: string): boolean {
  let sum = 0;
  let alternate = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number(digits[i]);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

/** ИНН юрлица (10 цифр) — официальный алгоритм ФНС. */
function inn10Valid(digits: string): boolean {
  const d = digits.split('').map(Number);
  const weights = [2, 4, 10, 3, 5, 9, 4, 6, 8];
  const check = (weights.reduce((acc, w, i) => acc + w * d[i], 0) % 11) % 10;
  return check === d[9];
}

/** ИНН физлица/ИП (12 цифр) — официальный алгоритм ФНС, две контрольные цифры. */
function inn12Valid(digits: string): boolean {
  const d = digits.split('').map(Number);
  const w1 = [7, 2, 4, 10, 3, 5, 9, 4, 6, 8];
  const w2 = [3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8];
  const c1 = (w1.reduce((acc, w, i) => acc + w * d[i], 0) % 11) % 10;
  const c2 = (w2.reduce((acc, w, i) => acc + w * d[i], 0) % 11) % 10;
  return c1 === d[10] && c2 === d[11];
}

/** ОГРН (13 цифр) — официальный алгоритм ФНС. */
function ogrnValid(digits: string): boolean {
  const first12 = parseInt(digits.slice(0, 12), 10);
  let check = first12 % 11;
  if (check === 10) check = 0;
  return check === Number(digits[12]);
}

/** ОГРНИП (15 цифр) — официальный алгоритм ФНС. */
function ogrnipValid(digits: string): boolean {
  const first14 = parseInt(digits.slice(0, 14), 10);
  let check = first14 % 13;
  if (check > 9) check = check % 10;
  return check === Number(digits[14]);
}

// ---- Категории -----------------------------------------------------------
// Каждая функция изолирует совпадения через (?<!\d)/(?!\d) — не задевает
// цифры внутри более длинных чисел (номер карты внутри которого случайно
// нашлось бы 10-значное число, и т.п.), поэтому порядок вызова категорий
// друг на друга не влияет.

function redactCards(text: string): CategoryResult {
  let count = 0;
  const result = text.replace(
    /(?<!\d)\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}(?!\d)/g,
    (match) => {
      const digits = match.replace(/[ -]/g, '');
      if (!luhnValid(digits)) return match;
      count++;
      return ANONYMIZE_CATEGORIES.card.placeholder;
    }
  );
  return { text: result, count };
}

function redactOgrnip(text: string): CategoryResult {
  let count = 0;
  const result = text.replace(/(?<!\d)\d{15}(?!\d)/g, (match) => {
    if (!ogrnipValid(match)) return match;
    count++;
    return ANONYMIZE_CATEGORIES.ogrnip.placeholder;
  });
  return { text: result, count };
}

function redactOgrn(text: string): CategoryResult {
  let count = 0;
  const result = text.replace(/(?<!\d)\d{13}(?!\d)/g, (match) => {
    if (!ogrnValid(match)) return match;
    count++;
    return ANONYMIZE_CATEGORIES.ogrn.placeholder;
  });
  return { text: result, count };
}

function redactSnils(text: string): CategoryResult {
  let count = 0;
  const result = text.replace(
    /(?<!\d)\d{3}-\d{3}-\d{3} \d{2}(?!\d)/g,
    () => {
      count++;
      return ANONYMIZE_CATEGORIES.snils.placeholder;
    }
  );
  return { text: result, count };
}

function redactPassportRu(text: string): CategoryResult {
  let count = 0;
  // "серия + номер" — 4 цифры, пробел, 6 цифр (стандартное написание РФ).
  // Публично проверяемой контрольной суммы у паспорта РФ нет — только формат.
  const result = text.replace(/(?<!\d)\d{4} \d{6}(?!\d)/g, () => {
    count++;
    return ANONYMIZE_CATEGORIES.passportRu.placeholder;
  });
  return { text: result, count };
}

function redactInn(text: string): { text: string; orgCount: number; personCount: number } {
  let orgCount = 0;
  let personCount = 0;
  let result = text.replace(/(?<!\d)\d{12}(?!\d)/g, (match) => {
    if (!inn12Valid(match)) return match;
    personCount++;
    return ANONYMIZE_CATEGORIES.innPerson.placeholder;
  });
  result = result.replace(/(?<!\d)\d{10}(?!\d)/g, (match) => {
    if (!inn10Valid(match)) return match;
    orgCount++;
    return ANONYMIZE_CATEGORIES.innOrg.placeholder;
  });
  return { text: result, orgCount, personCount };
}

function redactPhones(text: string): CategoryResult {
  let count = 0;

  // Российские номера: +7/8/7, опциональные разделители (пробел/точка/дефис),
  // опциональные скобки вокруг кода города/оператора, группы 3-3-2-2 цифр.
  let result = text.replace(
    /(?<!\d)(?:\+7|8|7)[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}(?!\d)/g,
    () => {
      count++;
      return ANONYMIZE_CATEGORIES.phone.placeholder;
    }
  );

  // Международные номера (не РФ) — формат сильно отличается между странами
  // (США, Великобритания и т.д.), единой жёсткой группировки, как у
  // российских номеров, нет. Поэтому требуем обязательный "+" (иначе
  // слишком много ложных срабатываний — у телефона, в отличие от карты/
  // ИНН/ОГРН, нет контрольной суммы для проверки) и вместо жёсткой
  // группировки проверяем итоговое количество цифр — 7-15, диапазон формата
  // E.164. Числа с "+7" сюда не попадают — они уже заменены на плейсхолдер
  // выше и не содержат цифр.
  result = result.replace(
    /(?<!\d)\+\d{1,3}[\s.-]?\(?\d{1,4}\)?(?:[\s.-]?\d{2,4}){1,4}(?!\d)/g,
    (match) => {
      const digits = match.replace(/\D/g, '');
      if (digits.length < 7 || digits.length > 15) return match;
      count++;
      return ANONYMIZE_CATEGORIES.phone.placeholder;
    }
  );

  return { text: result, count };
}

function redactEmails(text: string): CategoryResult {
  let count = 0;
  const result = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, () => {
    count++;
    return ANONYMIZE_CATEGORIES.email.placeholder;
  });
  return { text: result, count };
}

/**
 * Прогоняет текст через все категории и возвращает обезличенный текст плюс
 * счётчики замен по категориям (для сводки в UI — см. Фазу 2).
 */
export function anonymizeText(text: string): AnonymizeResult {
  const counts: Partial<Record<AnonymizeCategoryKey, number>> = {};
  let current = text;

  const card = redactCards(current);
  current = card.text;
  if (card.count) counts.card = card.count;

  const ogrnip = redactOgrnip(current);
  current = ogrnip.text;
  if (ogrnip.count) counts.ogrnip = ogrnip.count;

  const ogrn = redactOgrn(current);
  current = ogrn.text;
  if (ogrn.count) counts.ogrn = ogrn.count;

  const snils = redactSnils(current);
  current = snils.text;
  if (snils.count) counts.snils = snils.count;

  const passport = redactPassportRu(current);
  current = passport.text;
  if (passport.count) counts.passportRu = passport.count;

  const inn = redactInn(current);
  current = inn.text;
  if (inn.orgCount) counts.innOrg = inn.orgCount;
  if (inn.personCount) counts.innPerson = inn.personCount;

  const phone = redactPhones(current);
  current = phone.text;
  if (phone.count) counts.phone = phone.count;

  const email = redactEmails(current);
  current = email.text;
  if (email.count) counts.email = email.count;

  const total = Object.values(counts).reduce((a, b) => a + (b ?? 0), 0);

  return { text: current, counts, total };
}

// ---- Сводка для UI (Фаза 2) ----------------------------------------------

function pluralizeRu(n: number, [one, few, many]: [string, string, string]): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

/** Категории, у которых есть естественное русское склонение по числам —
 * остальные (email, ИНН, ОГРН/ОГРНИП, СНИЛС) в разговорной речи не
 * склоняются ("2 СНИЛС", а не "2 СНИЛСа"), выводим как есть. */
const PLURAL_FORMS: Partial<Record<AnonymizeCategoryKey, [string, string, string]>> = {
  phone: ['телефон', 'телефона', 'телефонов'],
  passportRu: ['паспорт', 'паспорта', 'паспортов'],
  card: ['карта', 'карты', 'карт'],
};

/** "2 телефона, 1 email, 1 ИНН" — innOrg/innPerson объединяются в один
 * пункт "ИНН", т.к. для пользователя разница юрлицо/физлицо не важна. */
export function formatRedactSummary(counts: AnonymizeResult['counts']): string {
  const merged = new Map<string, number>();
  (Object.keys(counts) as AnonymizeCategoryKey[]).forEach((key) => {
    const count = counts[key] ?? 0;
    if (!count) return;
    const mergeKey = key === 'innOrg' || key === 'innPerson' ? 'inn' : key;
    merged.set(mergeKey, (merged.get(mergeKey) ?? 0) + count);
  });

  const parts: string[] = [];
  merged.forEach((count, mergeKey) => {
    if (mergeKey === 'inn') {
      parts.push(`${count} ИНН`);
      return;
    }
    const key = mergeKey as AnonymizeCategoryKey;
    const plural = PLURAL_FORMS[key];
    const label = plural ? pluralizeRu(count, plural) : ANONYMIZE_CATEGORIES[key].label;
    parts.push(`${count} ${label}`);
  });
  return parts.join(', ');
}
