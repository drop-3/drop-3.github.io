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

/* --- СТАРТ БЛОКА: Тест #3.2 - Исправленная вставка вкладок --- */
(function () {
    'use strict';

    // Слушаем открытие раздела торрентов
    Lampa.Listener.follow('activity', function (e) {
        if (e.type === 'start' && e.component === 'torrents') {
            
            // Ждем 1.5 секунды, чтобы Лампа точно прорисовала интерфейс
            setTimeout(function() {
                // Пытаемся найти контейнер, где обычно отображаются торренты
                var container = $('.full-start');
                
                // Проверка: нашли ли мы экран Торрентов
                if (container.length > 0) {
                    // Маячок - если видишь это уведомление, значит плагин "увидел" раздел
                    showNoty('Раздел Торренты обнаружен!');

                    // Если наши кнопки еще не добавлены
                    if ($('.local-tabs').length === 0) {
                        var tabs = $('<div class="local-tabs" style="display: flex; justify-content: center; padding: 20px; background: rgba(0,0,0,0.2);">' +
                                        '<button class="tab-btn active" style="margin: 0 10px; padding: 10px 20px; background: #333; color: #fff; border: 1px solid #555; border-radius: 5px;">TorrServe</button>' +
                                        '<button class="tab-btn" style="margin: 0 10px; padding: 10px 20px; background: #e50914; color: #fff; border: none; border-radius: 5px;">Local</button>' +
                                     '</div>');
                        
                        container.prepend(tabs);

                        tabs.find('.tab-btn').on('click', function() {
                            var text = $(this).text();
                            if (text === 'Local') {
                                showLocalTorrents();
                            } else {
                                // Если нажали TorrServe, просто обновляем страницу, чтобы вернуть стандартный вид
                                location.reload();
                            }
                        });
                    }
                }
            }, 1500); 
        }
    });

    function showLocalTorrents() {
        var list = window.LocalTorrentStorage.get();
        // Пытаемся очистить текущий список
        var container = $('.items-line');
        container.empty();
        
        // Если контейнер .items-line не найден, ищем другой
        if (container.length === 0) container = $('.full-start');

        if (list.length === 0) {
            container.append('<div style="text-align: center; padding: 50px;">Список локальных торрентов пуст</div>');
            return;
        }

        list.forEach(function(item) {
            var card = $('<div style="padding: 15px; margin: 10px; background: #222; border-radius: 8px; cursor: pointer;">' +
                            '<div style="font-size: 18px; font-weight: bold;">' + item.movie_title + '</div>' +
                            '<div style="color: #aaa; font-size: 14px;">Magnet: ' + item.magnet.substring(0, 30) + '...</div>' +
                         '</div>');
            
            card.on('click', function() {
                showNoty('Меню управления появится тут');
            });
            
            container.append(card);
        });
    }
})();
/* --- КОНЕЦ БЛОКА: Тест #3.2 - Исправленная вставка вкладок --- */
