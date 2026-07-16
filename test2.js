(function() {
  const KEY = 'lampa_saved_torrents'; // ключ хранилища

  // Загрузить сохранённые раздачи
  function load() {
    try { return JSON.parse(Lampa.Storage.get(KEY, '[]')); } catch(e) { return []; }
  }

  // Сохранить массив
  function persist(list) {
    Lampa.Storage.set(KEY, JSON.stringify(list));
  }

  // Проверить дубликат по hash
  function findSaved(hash) {
    return load().find(i => i.torrent_hash === hash);
  }

  // Основная функция сохранения
  function addTorrent(entry) {
    const list = load();
    if (list.some(i => i.torrent_hash === entry.torrent_hash)) {
      Lampa.Notific.show('Эта раздача уже сохранена');
      return false;
    }
    list.unshift(entry);
    persist(list);
    Lampa.Notific.show('Раздача сохранена');
    return true;
  }

  // Удаление
  function remove(hash) {
    const list = load().filter(i => i.torrent_hash !== hash);
    persist(list);
    Lampa.Notific.show('Раздача удалена');
  }

  // Собрать объект для сохранения
  function buildEntry(torrent, cardData) {
    return {
      torrent_hash:   torrent.hash || '',
      torrent_url:    torrent.url || '',
      torrent_title:  torrent.title || '',
      source:         torrent.source || '',
      movie_id:       cardData ? cardData.id : '',
      saved_at:       Date.now(),
      // копия карточки (облегчённая)
      card: {
        id:       cardData ? cardData.id : '',
        title:    cardData ? cardData.title : '',
        poster:   cardData ? cardData.poster : '',
        year:     cardData ? cardData.year : '',
        type:     cardData ? cardData.type : '',
      }
    };
  }
// Пункт в меню раздачи (долгое нажатие)
  Lampa.Component.add('torrent:context', function (data, cb) {
    let torrent = data.torrent;
    let card = data.card || (data.data ? data.data.movie : null) || (data.movie ? data.movie.card : null);
    let entry = buildEntry(torrent, card);
    let saved = findSaved(torrent.hash);

    cb([{
      title: saved ? 'Уже в лампе' : 'Сохранить в лампу',
      icon: 'bookmark',
      onClick: () => {
        if (saved) {
          Lampa.Notific.show('Раздача уже сохранена');
        } else {
          addTorrent(entry);
        }
      }
    }]);
  });

  // Раздел в главном меню "Сохранённые раздачи"
  Lampa.Component.add('main:menu', function (data, cb) {
    data.push({
      title: 'Мои раздачи',
      icon: 'bookmark',
      onClick: (e) => {
        let list = load();
        if (!list.length) {
          Lampa.Notific.show('Нет сохранённых раздач');
          return;
        }

        Lampa.Activity.push({
          url: '',
          title: 'Мои раздачи',
          component: 'category',
          page: 1,
          card: (function() {
            var cards = list.map(item => ({
              id: item.movie_id || item.torrent_hash,
              title: item.card ? item.card.title : item.torrent_title,
              poster: item.card ? item.card.poster : '',
              year: item.card ? item.card.year : '',
              type: item.card ? item.card.type : 'movie',
              context: [{
                title: 'Открыть карточку',
                icon: 'info',
                onClick: () => {
                  if (item.movie_id) {
                    Lampa.Activity.push({
                      url: '',
                      title: item.card ? item.card.title : '',
                      component: 'full',
                      id: item.movie_id,
                      type: item.card ? item.card.type : ''
                    });
                  }
                }
              },{
                title: 'Удалить',
                icon: 'delete',
                onClick: () => {
                  remove(item.torrent_hash);
                  Lampa.Activity.back();
                }
              }]
            }));
            return { results: cards };
          })()
        });
      }
    });
    cb(data);
  });

  // Функция "переключить раздачу" — загрузка торрента и старт плеера
  function switchTorrent(url, title) {
    Lampa.Torrent.open(url, title);
  }

})();
