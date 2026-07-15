/* --- СТАРТ БЛОКА: Тест №1 - Добавление кнопки сохранения --- */
(function () {
    'use strict';

    // 1. Уведомления
    function showNoty(msg) {
        if (window.Lampa && window.Lampa.Noty) window.Lampa.Noty.show(msg);
    }

    // 2. Хранилище (LocalStorage)
    window.LocalTorrentStorage = {
        save: function(item) {
            var saved = this.get();
            // Проверка на дубликат по magnet
            if (saved.find(function(t) { return t.magnet === item.magnet; })) {
                showNoty('Уже сохранено!');
                return;
            }
            saved.push({
                movie_id: item.movie_id,
                movie_title: item.movie_title,
                magnet: item.magnet,
                date: Date.now()
            });
            localStorage.setItem('lampa_local_torrents', JSON.stringify(saved));
            showNoty('Сохранено в локальные торренты');
        },
        get: function() {
            try {
                var data = localStorage.getItem('lampa_local_torrents');
                return data ? JSON.parse(data) : [];
            } catch (e) { return []; }
        }
    };

    // 3. Интеграция в контекстное меню
    if (window.Lampa && window.Lampa.Select) {
        var orig_show = Lampa.Select.show;
        Lampa.Select.show = function (params) {
            // Пытаемся найти магнит-ссылку в данных
            var magnet = '';
            if (params.data && typeof params.data === 'object') {
                var hash = params.data.hash || params.data.info_hash || params.data.infoHash || params.data.btih;
                if (hash) magnet = 'magnet:?xt=urn:btih:' + hash.trim();
                else if (params.data.magnet) magnet = params.data.magnet;
            }

            if (magnet) {
                // Добавляем наш пункт
                params.items.push({
                    title: 'Сохранить в локальные',
                    save_magnet: magnet,
                    movie_id: (window.Lampa.Activity.active() ? window.Lampa.Activity.active().activity.id : null),
                    movie_title: (window.Lampa.Activity.active() ? window.Lampa.Activity.active().activity.title : 'Неизвестно')
                });

                // Перехват выбора
                var orig_onSelect = params.onSelect;
                params.onSelect = function (item) {
                    if (item && item.save_magnet) {
                        window.LocalTorrentStorage.save({
                            magnet: item.save_magnet,
                            movie_id: item.movie_id,
                            movie_title: item.movie_title
                        });
                    } else if (orig_onSelect) {
                        orig_onSelect(item);
                    }
                };
            }
            
            return orig_show(params);
        };
    }
})();
/* --- КОНЕЦ БЛОКА: Тест №1 - Добавление кнопки сохранения --- */
