import { describe, it, expect } from 'vitest';
import { anonymizeText, formatRedactSummary } from './anonymize';

// Тестовые ИНН/ОГРН/ОГРНИП/номер карты ниже сгенерированы по официальным
// алгоритмам контрольных сумм (не выдуманы) — см. историю коммита. Номер
// карты 4111111111111111 — общеизвестный тестовый номер Visa (проходит Луна,
// не принадлежит реальному держателю).
const VALID_INN_ORG = '1234567894';
const VALID_INN_PERSON = '500100732185';
const VALID_OGRN = '1027700000008';
const VALID_OGRNIP = '304770000000008';
const VALID_CARD = '4111111111111111';
const REAL_SBERBANK_INN = '7707083893'; // реальный ИНН для проверки алгоритма против жизни

describe('телефоны', () => {
  it('распознаёт +7 с пробелами и скобками', () => {
    const r = anonymizeText('Звоните: +7 (999) 123-45-67');
    expect(r.text).toBe('Звоните: [ТЕЛЕФОН СКРЫТ]');
    expect(r.counts.phone).toBe(1);
  });

  it('распознаёт 8 без разделителей', () => {
    const r = anonymizeText('тел. 89991234567');
    expect(r.text).toContain('[ТЕЛЕФОН СКРЫТ]');
    expect(r.counts.phone).toBe(1);
  });

  it('распознаёт с дефисами без скобок', () => {
    const r = anonymizeText('8-999-123-45-67');
    expect(r.counts.phone).toBe(1);
  });

  it('распознаёт несколько телефонов в одном тексте', () => {
    const r = anonymizeText('Первый: +7 999 111 22 33, второй: 8 (495) 222-33-44');
    expect(r.counts.phone).toBe(2);
    expect(r.text).not.toMatch(/\d/);
  });
});

describe('email', () => {
  it('распознаёт простой email', () => {
    const r = anonymizeText('Пишите на info@example.com за подробностями');
    expect(r.text).toBe('Пишите на [EMAIL СКРЫТ] за подробностями');
    expect(r.counts.email).toBe(1);
  });

  it('распознаёт email с точкой в имени и поддоменом', () => {
    const r = anonymizeText('ivan.petrov@mail.corp.example.co');
    expect(r.counts.email).toBe(1);
    expect(r.text).toBe('[EMAIL СКРЫТ]');
  });
});

describe('ИНН', () => {
  it('распознаёт валидный ИНН юрлица (10 цифр) по контрольной сумме', () => {
    const r = anonymizeText(`ИНН: ${VALID_INN_ORG}`);
    expect(r.counts.innOrg).toBe(1);
    expect(r.text).toBe('ИНН: [ИНН СКРЫТ]');
  });

  it('распознаёт валидный ИНН физлица/ИП (12 цифр) по контрольной сумме', () => {
    const r = anonymizeText(`ИНН: ${VALID_INN_PERSON}`);
    expect(r.counts.innPerson).toBe(1);
  });

  it('подтверждает алгоритм на реальном ИНН (Сбербанк)', () => {
    const r = anonymizeText(REAL_SBERBANK_INN);
    expect(r.counts.innOrg).toBe(1);
  });

  it('НЕ трогает 10-значное число с неверной контрольной суммой (снижение ложных срабатываний)', () => {
    const invalid = '1234567890'; // не проходит контрольную сумму ИНН-10
    const r = anonymizeText(`номер договора ${invalid}`);
    expect(r.counts.innOrg).toBeUndefined();
    expect(r.text).toContain(invalid);
  });

  it('НЕ трогает 12-значное число с неверной контрольной суммой', () => {
    const invalid = '123456789012';
    const r = anonymizeText(invalid);
    expect(r.counts.innPerson).toBeUndefined();
    expect(r.text).toBe(invalid);
  });
});

describe('ОГРН / ОГРНИП', () => {
  it('распознаёт валидный ОГРН (13 цифр)', () => {
    const r = anonymizeText(`ОГРН ${VALID_OGRN}`);
    expect(r.counts.ogrn).toBe(1);
  });

  it('распознаёт валидный ОГРНИП (15 цифр)', () => {
    const r = anonymizeText(`ОГРНИП ${VALID_OGRNIP}`);
    expect(r.counts.ogrnip).toBe(1);
  });

  it('НЕ трогает 13-значное число с неверной контрольной суммой', () => {
    const invalid = '1027700000001';
    const r = anonymizeText(invalid);
    expect(r.counts.ogrn).toBeUndefined();
  });
});

describe('СНИЛС', () => {
  it('распознаёт стандартный формат XXX-XXX-XXX XX', () => {
    const r = anonymizeText('СНИЛС: 112-233-445 95');
    expect(r.text).toBe('СНИЛС: [СНИЛС СКРЫТ]');
    expect(r.counts.snils).toBe(1);
  });
});

describe('паспорт РФ', () => {
  it('распознаёт формат "4 цифры пробел 6 цифр"', () => {
    const r = anonymizeText('Паспорт 4510 123456');
    expect(r.text).toBe('Паспорт [ПАСПОРТ СКРЫТ]');
    expect(r.counts.passportRu).toBe(1);
  });
});

describe('номер карты', () => {
  it('распознаёт валидный по Луну номер с пробелами', () => {
    const spaced = VALID_CARD.match(/.{4}/g)!.join(' ');
    const r = anonymizeText(`Карта: ${spaced}`);
    expect(r.counts.card).toBe(1);
  });

  it('распознаёт валидный по Луну номер с дефисами', () => {
    const dashed = VALID_CARD.match(/.{4}/g)!.join('-');
    const r = anonymizeText(dashed);
    expect(r.counts.card).toBe(1);
  });

  it('распознаёт валидный по Луну номер без разделителей', () => {
    const r = anonymizeText(VALID_CARD);
    expect(r.counts.card).toBe(1);
  });

  it('НЕ трогает 16-значное число, не прошедшее Луна', () => {
    const invalid = '1234567890123456';
    const r = anonymizeText(invalid);
    expect(r.counts.card).toBeUndefined();
    expect(r.text).toBe(invalid);
  });
});

describe('комбинированный документ', () => {
  it('обезличивает несколько разных категорий одновременно и не оставляет исходных значений', () => {
    const text = `
Договор оказания услуг

Исполнитель: ИНН ${VALID_INN_ORG}, ОГРН ${VALID_OGRN}
Контакты: +7 (999) 123-45-67, email: contact@company.ru
Второй контакт: 8-916-555-66-77, second.contact@mail.example.com

Оплата производится на карту ${VALID_CARD.match(/.{4}/g)!.join(' ')}
`;
    const r = anonymizeText(text);

    expect(r.counts.innOrg).toBe(1);
    expect(r.counts.ogrn).toBe(1);
    expect(r.counts.phone).toBe(2);
    expect(r.counts.email).toBe(2);
    expect(r.counts.card).toBe(1);
    expect(r.total).toBe(7);

    // ни одно исходное значение не должно остаться в тексте
    expect(r.text).not.toContain(VALID_INN_ORG);
    expect(r.text).not.toContain(VALID_OGRN);
    expect(r.text).not.toContain('contact@company.ru');
    expect(r.text).not.toContain('999');
    expect(r.text).not.toContain(VALID_CARD);

    // а содержательный (не-ПДн) текст договора остаётся на месте
    expect(r.text).toContain('Договор оказания услуг');
    expect(r.text).toContain('Оплата производится на карту');
  });

  it('не находит ничего в тексте без персональных данных', () => {
    const r = anonymizeText('Стороны обязуются соблюдать конфиденциальность информации.');
    expect(r.total).toBe(0);
    expect(r.counts).toEqual({});
  });
});

describe('formatRedactSummary', () => {
  it('склоняет "телефон" по числам (1/2/5/11/21)', () => {
    expect(formatRedactSummary({ phone: 1 })).toBe('1 телефон');
    expect(formatRedactSummary({ phone: 2 })).toBe('2 телефона');
    expect(formatRedactSummary({ phone: 5 })).toBe('5 телефонов');
    expect(formatRedactSummary({ phone: 11 })).toBe('11 телефонов');
    expect(formatRedactSummary({ phone: 21 })).toBe('21 телефон');
  });

  it('объединяет innOrg и innPerson в один пункт "ИНН"', () => {
    expect(formatRedactSummary({ innOrg: 1, innPerson: 1 })).toBe('2 ИНН');
  });

  it('перечисляет несколько категорий через запятую', () => {
    const summary = formatRedactSummary({ phone: 2, email: 1, innOrg: 1 });
    expect(summary).toBe('2 телефона, 1 email, 1 ИНН');
  });

  it('не склоняемые категории выводятся как есть', () => {
    expect(formatRedactSummary({ snils: 2 })).toBe('2 СНИЛС');
    expect(formatRedactSummary({ ogrn: 3 })).toBe('3 ОГРН');
  });
});
