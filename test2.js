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

/* --- СТАРТ БЛОКА: Тест #4 - Прямое добавление карточек без вкладок --- */
(function () {
    'use strict';

    function showNoty(msg) {
        if (window.Lampa && window.Lampa.Noty) window.Lampa.Noty.show(msg);
    }

    // Запускаем фоновую проверку раз в секунду
    setInterval(function() {
        var active = window.Lampa && window.Lampa.Activity && window.Lampa.Activity.active();
        
        // Проверяем, что мы зашли на экран mytorrents (или torrents)
        if (active && (String(active.component).toLowerCase() === 'mytorrents' || String(active.component).toLowerCase() === 'torrents')) {
            
            // Если мы еще не добавили наш блок с карточками на этот экран
            if ($('.my-local-torrents-container').length === 0) {
                
                var list = window.LocalTorrentStorage ? window.LocalTorrentStorage.get() : [];
                
                // Ищем самый верхний (активный) экран в Лампе
                var screen = $('.activity').last();
                if (screen.length === 0) screen = $('body');

                // Создаем наш блок
                var my_list = $('<div class="my-local-torrents-container" style="width: 100%; padding: 25px; background: rgba(0,0,0,0.4); border-bottom: 2px solid #e50914; z-index: 99999; position: relative;">' + 
                                '<div style="font-size: 24px; font-weight: bold; color: #fff; margin-bottom: 15px;">Мои сохраненные торренты (' + list.length + ')</div>' +
                                '<div class="my-cards-grid" style="display: flex; flex-wrap: wrap; gap: 15px;"></div>' +
                                '</div>');
                
                var grid = my_list.find('.my-cards-grid');

                if (list.length === 0) {
                    // Если список пуст, выводим подсказку
                    grid.append('<div style="color: #aaa; font-size: 16px; padding: 10px;">Список пуст. Сделайте долгое нажатие на любую раздачу в фильме и нажмите «Сохранить в локальные»!</div>');
                } else {
                    // Если торренты есть — рисуем карточки
                    showNoty('Отображаем ваши торренты (' + list.length + ')');

                    list.slice().reverse().forEach(function(item) {
                        var date_str = new Date(item.date).toLocaleDateString();
                        var card = $('<div class="my-local-torrent-card" style="flex: 1 1 300px; background: #1f1f1f; border: 2px solid #555; padding: 15px; border-radius: 8px; cursor: pointer; transition: 0.2s;">' +
                                        '<div style="font-size: 18px; font-weight: bold; color: #fff; margin-bottom: 8px;">' + (item.movie_title || 'Без названия') + '</div>' +
                                        '<div style="font-size: 12px; color: #aaa; margin-bottom: 8px;">Добавлено: ' + date_str + '</div>' +
                                        '<div style="font-size: 11px; color: #777; background: #111; padding: 8px; border-radius: 4px; word-break: break-all;">' + String(item.magnet).substring(0, 45) + '...</div>' +
                                     '</div>');
                        
                        // Цвет рамки при наведении пультом/мышкой
                        card.on('mouseenter', function() { $(this).css('border-color', '#e50914'); });
                        card.on('mouseleave', function() { $(this).css('border-color', '#555'); });

                        // Клик на карточку (пока просто уведомление)
                        card.on('click', function() {
                            showNoty('Клик по фильму: ' + item.movie_title);
                        });

                        grid.append(card);
                    });
                }

                // Встраиваем наш блок в самое начало экрана (над надписью «Ваши торренты»)
                var target = screen.find('.scroll__body, .activity__body').first();
                if (target.length === 0) target = screen;
                
                target.prepend(my_list);
            }
        }
    }, 1000);
})();
/* --- КОНЕЦ БЛОКА: Тест #4 - Прямое добавление карточек без вкладок --- */
