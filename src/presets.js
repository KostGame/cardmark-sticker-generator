(function attachCardMarkPresets(global) {
  'use strict';

  var tarotMajor = [
    'Шут',
    'Маг',
    'Жрица',
    'Императрица',
    'Император',
    'Иерофант',
    'Влюблённые',
    'Колесница',
    'Сила',
    'Отшельник',
    'Колесо Фортуны',
    'Справедливость',
    'Повешенный',
    'Смерть',
    'Умеренность',
    'Дьявол',
    'Башня',
    'Звезда',
    'Луна',
    'Солнце',
    'Суд',
    'Мир'
  ];

  var tarotSuits = [
    'Жезлы',
    'Кубки',
    'Мечи',
    'Пентакли'
  ];

  var tarotRanks = [
    'Туз',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '10',
    'Паж',
    'Рыцарь',
    'Королева',
    'Король'
  ];

  var playingSuits = [
    'Черви',
    'Бубны',
    'Трефы',
    'Пики'
  ];

  var playing36Ranks = [
    '6',
    '7',
    '8',
    '9',
    '10',
    'Валет',
    'Дама',
    'Король',
    'Туз'
  ];

  var playing54Ranks = [
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '10',
    'Валет',
    'Дама',
    'Король',
    'Туз'
  ];

  function padId(id) {
    return String(id).padStart(2, '0');
  }

  function makeCard(id, group, name, displayId) {
    return {
      id: id,
      markerId: id,
      displayId: displayId || padId(id),
      group: group,
      name: name
    };
  }

  function makeTarot78() {
    var cards = [];
    tarotMajor.forEach(function addMajor(name, index) {
      cards.push(makeCard(index, 'Старшие арканы', name, padId(index)));
    });

    tarotSuits.forEach(function addSuit(suit) {
      tarotRanks.forEach(function addRank(rank) {
        var id = cards.length;
        cards.push(makeCard(id, suit, rank, padId(id)));
      });
    });

    return cards;
  }

  function makePlayingCards(ranks) {
    var cards = [];
    playingSuits.forEach(function addSuit(suit) {
      ranks.forEach(function addRank(rank) {
        var id = cards.length;
        cards.push(makeCard(id, suit, rank, padId(id)));
      });
    });
    return cards;
  }

  function makePlaying36() {
    return makePlayingCards(playing36Ranks);
  }

  function makePlaying54() {
    var cards = makePlayingCards(playing54Ranks);
    cards.push(makeCard(52, 'Джокеры', 'Джокер красный', '52'));
    cards.push(makeCard(53, 'Джокеры', 'Джокер чёрный', '53'));
    return cards;
  }

  function parseCustomCards(text) {
    var errors = [];
    var cards = [];
    var lines = String(text || '').split(/\r?\n/);

    lines.forEach(function parseLine(rawLine, index) {
      var line = rawLine.trim();
      if (!line) {
        return;
      }

      var parts = line.split(';');
      if (parts.length !== 3) {
        errors.push('Строка ' + (index + 1) + ': нужно три поля ID;Группа;Название.');
        return;
      }

      var displayId = parts[0].trim();
      var markerId = Number(displayId);
      var group = parts[1].trim();
      var name = parts[2].trim();

      if (!Number.isInteger(markerId) || markerId < 0 || markerId > 127) {
        errors.push('Строка ' + (index + 1) + ': ID должен быть целым числом от 0 до 127.');
        return;
      }

      if (!group || !name) {
        errors.push('Строка ' + (index + 1) + ': группа и название не должны быть пустыми.');
        return;
      }

      cards.push({
        id: markerId,
        markerId: markerId,
        displayId: displayId,
        group: group,
        name: name
      });
    });

    var seen = {};
    cards.forEach(function findDuplicate(card) {
      if (seen[card.markerId]) {
        errors.push('ID ' + card.markerId + ' повторяется. Метки должны быть уникальными.');
      }
      seen[card.markerId] = true;
    });

    return {
      cards: cards,
      errors: errors
    };
  }

  var decks = {
    tarot78: {
      label: 'Таро 78',
      sections: ['Старшие арканы'].concat(tarotSuits, ['Запасные']),
      makeCards: makeTarot78
    },
    playing36: {
      label: 'Игральные 36',
      sections: playingSuits.concat(['Запасные']),
      makeCards: makePlaying36
    },
    playing54: {
      label: 'Игральные 54',
      sections: playingSuits.concat(['Джокеры', 'Запасные']),
      makeCards: makePlaying54
    },
    custom: {
      label: 'Кастомный набор',
      sections: [],
      makeCards: function emptyCustom() {
        return [];
      }
    }
  };

  global.CardMarkPresets = {
    decks: decks,
    parseCustomCards: parseCustomCards
  };
})(window);
