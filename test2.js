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

/* --- СТАРТ БЛОКА: Тест #5 - Идеальный экран + Меню из 4 пунктов --- */
(function () {
    'use strict';

    function showNoty(msg) {
        if (window.Lampa && window.Lampa.Noty) window.Lampa.Noty.show(msg);
    }

    // Быстрый таймер (300 мс), чтобы не было мигания
    setInterval(function() {
        var active = window.Lampa && window.Lampa.Activity && window.Lampa.Activity.active();
        
        if (active && (String(active.component).toLowerCase() === 'mytorrents' || String(active.component).toLowerCase() === 'torrents')) {
            
            if ($('.my-local-torrents-container').length === 0) {
                
                var list = window.LocalTorrentStorage ? window.LocalTorrentStorage.get() : [];
                
                var screen = $('.activity').last();
                if (screen.length === 0) screen = $('body');

                var target = screen.find('.scroll__body, .activity__body').first();
                if (target.length === 0) target = screen;

                // СКРЫВАЕМ стандартный мусор Лампы (пустые иконки и кнопку "Обновить")
                target.children().hide();

                // Создаем наш чистовой блок
                var my_list = $('<div class="my-local-torrents-container" style="width: 100%; min-height: 80vh; padding: 30px; background: #111; z-index: 99999; position: relative;">' + 
                                '<div style="font-size: 26px; font-weight: bold; color: #fff; margin-bottom: 20px; border-bottom: 2px solid #e50914; padding-bottom: 10px;">Мои сохраненные торренты (' + list.length + ')</div>' +
                                '<div class="my-cards-grid" style="display: flex; flex-wrap: wrap; gap: 20px;"></div>' +
                                '</div>');
                
                var grid = my_list.find('.my-cards-grid');

                if (list.length === 0) {
                    grid.append('<div style="color: #888; font-size: 18px; padding: 20px;">Список пуст. Сохраняйте раздачи долгим нажатием в парсере!</div>');
                } else {
                    list.slice().reverse().forEach(function(item) {
                        var date_str = new Date(item.date).toLocaleDateString();
                        var card = $('<div class="my-local-torrent-card focus" tabindex="0" style="flex: 1 1 320px; background: #1a1a1a; border: 2px solid #444; padding: 20px; border-radius: 10px; cursor: pointer; transition: 0.2s; outline: none;">' +
                                        '<div style="font-size: 20px; font-weight: bold; color: #fff; margin-bottom: 10px;">' + (item.movie_title || 'Без названия') + '</div>' +
                                        '<div style="font-size: 14px; color: #888; margin-bottom: 12px;">Добавлено: ' + date_str + '</div>' +
                                        '<div style="font-size: 12px; color: #aaa; background: #000; padding: 10px; border-radius: 6px; word-break: break-all; border: 1px solid #222;">' + String(item.magnet).substring(0, 45) + '...</div>' +
                                     '</div>');
                        
                        // Подсветка для пульта и мышки
                        card.on('mouseenter focus', function() { $(this).css({ 'border-color': '#e50914', 'transform': 'scale(1.02)' }); });
                        card.on('mouseleave blur', function() { $(this).css({ 'border-color': '#444', 'transform': 'scale(1)' }); });

                        // НАЖАТИЕ НА КАРТОЧКУ - ВЫЗОВ МЕНЮ ИЗ 4 ПУНКТОВ
                        card.on('click', function() {
                            if (window.Lampa && window.Lampa.Select) {
                                Lampa.Select.show({
                                    title: item.movie_title || 'Управление раздачей',
                                    items: [
                                        { title: '▶ Воспроизвести', action: 'play' },
                                        { title: '🎬 Открыть карточку фильма', action: 'card' },
                                        { title: '🔄 Сменить раздачу (в парсер)', action: 'parser' },
                                        { title: '🗑 Удалить из сохраненных', action: 'delete' }
                                    ],
                                    onSelect: function(m) {
                                        if (m.action === 'play') {
                                            // Запуск торрента через плеер Лампы
                                            if (window.Lampa.Torrent && window.Lampa.Torrent.start) {
                                                window.Lampa.Torrent.start({ magnet: item.magnet, title: item.movie_title });
                                            } else {
                                                showNoty('Запуск магнета...');
                                                window.location.href = item.magnet;
                                            }
                                        } else if (m.action === 'card') {
                                            // Переход в карточку фильма
                                            if (item.movie_id) {
                                                Lampa.Activity.push({ component: 'full', id: item.movie_id, method: 'tmdb' });
                                            } else {
                                                showNoty('Ошибка: ID фильма не был сохранен');
                                            }
                                        } else if (m.action === 'parser') {
                                            // Переход к выбору раздач
                                            if (item.movie_id) {
                                                Lampa.Activity.push({ component: 'torrents', id: item.movie_id, title: item.movie_title });
                                            } else {
                                                showNoty('Ошибка: ID фильма не был сохранен');
                                            }
                                        } else if (m.action === 'delete') {
                                            // Удаление
                                            if (window.LocalTorrentStorage && window.LocalTorrentStorage.remove) {
                                                window.LocalTorrentStorage.remove(item.magnet);
                                                showNoty('Удалено!');
                                                card.fadeOut(300, function() { $(this).remove(); });
                                            }
                                        }
                                    }
                                });
                            }
                        });

                        grid.append(card);
                    });
                }

                // Добавляем наш экран
                target.prepend(my_list);
            }
        }
    }, 300);
})();
/* --- КОНЕЦ БЛОКА: Тест #5 - Идеальный экран + Меню из 4 пунктов --- */
