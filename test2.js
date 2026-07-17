/* --- РАБОЧИЙ КОД: Твой Тест №2 + Подключение к списку --- */
(function () {
    'use strict';

    // 1. Уведомления
    function showNoty(msg) {
        if (window.Lampa && window.Lampa.Noty) window.Lampa.Noty.show(msg);
    }

    // 2. Хранилище (Твой оригинальный код)
    window.LocalTorrentStorage = {
        save: function(item) {
            var saved = this.get();
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

    // 3. Поиск данных (Твой оригинальный код)
    function findMagnetInElement() {
        var magnet = '';
        var f = $('.focus, .selector.focus, :focus').closest('.selector, [data-element], [data-item]');
        var d = f.data('injected_torrent_data') || f.data('element') || f.data('item') || f.data('torrent') || f.data('data');
        
        if (d) {
            var hash = d.hash || d.info_hash || d.infoHash || d.btih;
            if (hash) magnet = 'magnet:?xt=urn:btih:' + hash.trim();
            else if (d.magnet) magnet = d.magnet;
            else if (typeof d === 'string' && d.indexOf('magnet:') === 0) magnet = d;
        }
        return magnet;
    }

    // 4. Интеграция кнопки (Твой оригинальный код)
    if (window.Lampa && window.Lampa.Select) {
        var orig_show = Lampa.Select.show;
        Lampa.Select.show = function (params) {
            var magnet = findMagnetInElement();

            if (magnet) {
                params.items.push({
                    title: 'Сохранить в локальные',
                    save_magnet: magnet,
                    movie_id: (window.Lampa.Activity.active() ? window.Lampa.Activity.active().activity.id : null),
                    movie_title: (window.Lampa.Activity.active() ? window.Lampa.Activity.active().activity.title : 'Неизвестно')
                });

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

    // 5. ИНТЕГРАЦИЯ В СПИСОК (Добавление сохраненных в стандартный каталог)
    // Ждем, пока загрузится TorrServer, и подменяем метод list
    var timer = setInterval(function() {
        var TS = window.Lampa && (Lampa.TorrServer || Lampa.Torrserve);
        if (TS && TS.list) {
            clearInterval(timer);
            var originalList = TS.list;
            TS.list = function(params, success, error) {
                // Обработка аргументов (бывают разные версии Лампы)
                var onSucc = typeof params === 'function' ? params : success;
                var onErr = typeof params === 'function' ? success : error;
                var p = typeof params === 'function' ? {} : params;

                originalList.call(this, p, function(items) {
                    var local = window.LocalTorrentStorage.get();
                    // Превращаем наши сохраненные в формат Lampa
                    var formatted = local.map(function(t) {
                        return { title: t.movie_title, magnet: t.magnet, stat_string: '💾 Сохраненный' };
                    });
                    // Склеиваем
                    onSucc(formatted.concat(items || []));
                }, onErr);
            };
        }
    }, 500);

})();
