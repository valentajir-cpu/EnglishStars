// ENGLISH STARS - texty k nauceni nazpamet (rozhovory, basnicky)
// Kazdy text: id (stabilni!), unitId, title, roles (nazvy roli), tomRole (index role, kterou rika Tom),
// lines [{r: index role, en, cz}], volitelne autoEvent {due: 'YYYY-MM-DD'} = pri spusteni hry se automaticky
// zalozi udalost "Nazpamet" s timto datem (jen jednou; pokud datum jeste neuplynulo).
window.ES_TEXTS = [
  {
    id: 'txt-u2-shop-dialogue',
    unitId: 'u2-lets-go-shopping',
    title: 'Rozhovor v obchodě (Unit 2, Lesson 3)',
    roles: ['Prodavač', 'Zákazník'],
    tomRole: 1,
    lines: [
      { r: 0, en: 'Hello. Can I help you?', cz: 'Dobrý den. Můžu vám pomoct?' },
      { r: 1, en: 'Can I have an apple and a peach, please?', cz: 'Můžu dostat jablko a broskev, prosím?' },
      { r: 0, en: 'Here you are.', cz: 'Tady máte.' },
      { r: 1, en: 'Thank you. And can I have some bread and some carrots, please?', cz: 'Děkuji. A můžu dostat chleba a mrkev, prosím?' },
      { r: 0, en: 'Yes, of course.', cz: 'Ano, samozřejmě.' },
      { r: 1, en: "Thank you very much. I love carrots. They're delicious!", cz: 'Mockrát děkuji. Miluju mrkev. Je výborná!' }
    ],
    grammar: ['a peach', 'an apple', 'some bread', 'some carrots'],
    autoEvent: { due: '2026-11-10' }
  }
];
