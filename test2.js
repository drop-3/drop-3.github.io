/* --- СТАРТ БЛОКА: Тест №2 - Улучшенный поиск данных и добавление кнопки --- */
(function () {
    'use strict';

    // 1. Уведомления
    function showNoty(msg) {
        if (window.Lampa && window.Lampa.Noty) window.Lampa.Noty.show(msg);
    }

    // 2. Хранилище
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

    // 3. Улучшенный поиск данных (как в твоем рабочем коде)
    function findMagnetInElement() {
        var magnet = '';
        var f = $('.focus, .selector.focus, :focus').closest('.selector, [data-element], [data-item]');
        var d = f.data('injected_torrent_data') || f.data('element') || f.data('item') || f.data('torrent') || f.data('data');
        
        if (d) {
            // Проверяем разные форматы хранения магнита
            var hash = d.hash || d.info_hash || d.infoHash || d.btih;
            if (hash) magnet = 'magnet:?xt=urn:btih:' + hash.trim();
            else if (d.magnet) magnet = d.magnet;
            else if (typeof d === 'string' && d.indexOf('magnet:') === 0) magnet = d;
        }
        return magnet;
    }

    // 4. Интеграция
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
})();
/* --- КОНЕЦ БЛОКА: Тест №2 - Улучшенный поиск данных и добавление кнопки --- */

/* --- СТАРТ БЛОКА: Тест #3.3 - Шпион для поиска имени экрана --- */
(function () {
    'use strict';

    function showNoty(msg) {
        if (window.Lampa && window.Lampa.Noty) window.Lampa.Noty.show(msg);
    }

    // Слушаем запуск ЛЮБОГО экрана (activity) в Лампе
    Lampa.Listener.follow('activity', function (e) {
        if (e.type === 'start') {
            // Выводим системное имя экрана на ТВ
            showNoty('Имя экрана: ' + e.component);
            console.log('Открыт экран:', e.component);

            // На случай, если в имени есть слово torrent, file, my или ts — пробуем вставить кнопки сразу
            var name = String(e.component).toLowerCase();
            if (name.indexOf('torrent') !== -1 || name.indexOf('file') !== -1 || name.indexOf('ts') !== -1) {
                setTimeout(function() {
                    if ($('.local-tabs').length === 0) {
                        // Ищем активный экран и вставляем кнопки туда
                        var active_screen = $('.activity.active .activity__body, .activity.active, .full-start, .items-line').first();
                        
                        var tabs = $('<div class="local-tabs" style="display: flex; justify-content: center; padding: 20px; z-index: 9999; position: relative;">' +
                                        '<button style="margin: 0 10px; padding: 10px 20px; background: #333; color: #fff; border: 2px solid #fff; border-radius: 5px; font-size: 16px;">TorrServe</button>' +
                                        '<button style="margin: 0 10px; padding: 10px 20px; background: #e50914; color: #fff; border: none; border-radius: 5px; font-size: 16px;">Local</button>' +
                                     '</div>');
                        
                        active_screen.prepend(tabs);
                        showNoty('Кнопки добавлены в: ' + e.component);
                    }
                }, 1500);
            }
        }
    });
})();
/* --- КОНЕЦ БЛОКА: Тест #3.3 - Шпион для поиска имени экрана --- */
