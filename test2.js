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

/* --- СТАРТ БЛОКА: Тест #3.4 - Вкладки и список для экрана mytorrents --- */
(function () {
    'use strict';

    function showNoty(msg) {
        if (window.Lampa && window.Lampa.Noty) window.Lampa.Noty.show(msg);
    }

    // Отслеживаем запуск именно экрана 'mytorrents'
    Lampa.Listener.follow('activity', function (e) {
        if (e.type === 'start' && String(e.component).toLowerCase() === 'mytorrents') {
            
            // Ждем 1.5 секунды для полной отрисовки экрана Лампой
            setTimeout(function() {
                var active_screen = $('.activity.active .activity__body');
                if (active_screen.length === 0) active_screen = $('.activity.active');

                // Проверяем, не создали ли мы уже вкладки
                if (active_screen.length > 0 && $('.local-tabs').length === 0) {
                    
                    showNoty('Загружаем сохраненные торренты...');

                    // Создаем панель вкладок
                    var tabs = $('<div class="local-tabs" style="display: flex; justify-content: center; padding: 15px; margin-bottom: 15px; background: rgba(0,0,0,0.3); border-bottom: 1px solid #333; z-index: 10;">' +
                                    '<button class="tab-btn active" data-tab="ts" style="margin: 0 10px; padding: 10px 25px; background: #e50914; color: #fff; border: none; border-radius: 5px; font-size: 16px; cursor: pointer;">TorrServe</button>' +
                                    '<button class="tab-btn" data-tab="local" style="margin: 0 10px; padding: 10px 25px; background: #333; color: #fff; border: 1px solid #555; border-radius: 5px; font-size: 16px; cursor: pointer;">Local</button>' +
                                 '</div>');
                    
                    // Вставляем вкладки в самый верх экрана
                    active_screen.prepend(tabs);

                    // Обработка кликов по вкладкам
                    tabs.find('.tab-btn').on('click', function() {
                        var tab = $(this).data('tab');
                        
                        // Меняем оформление кнопок
                        tabs.find('.tab-btn').css({ background: '#333', border: '1px solid #555' });
                        $(this).css({ background: '#e50914', border: 'none' });

                        if (tab === 'local') {
                            // Прячем всё содержимое экрана, кроме наших вкладок
                            active_screen.children().not('.local-tabs').hide();
                            showLocalList(active_screen);
                        } else {
                            // Удаляем наш локальный список и возвращаем видимость стандартным элементам
                            $('.local-torrents-list').remove();
                            active_screen.children().show();
                        }
                    });
                }
            }, 1500); 
        }
    });

    // Функция отрисовки нашего списка
    function showLocalList(container) {
        $('.local-torrents-list').remove(); // Очищаем старый, если был
        
        var list_container = $('<div class="local-torrents-list" style="padding: 10px 30px; display: flex; flex-wrap: wrap; gap: 15px;"></div>');
        var list = window.LocalTorrentStorage.get();

        if (list.length === 0) {
            list_container.append('<div style="width: 100%; text-align: center; padding: 50px; font-size: 20px; color: #888;">Список сохраненных торрентов пуст</div>');
        } else {
            // Выводим карточки (новые сверху)
            list.slice().reverse().forEach(function(item) {
                var date_str = new Date(item.date).toLocaleDateString();
                var card = $('<div class="local-card" style="flex: 1 1 300px; background: #1a1a1a; border: 1px solid #333; padding: 15px; border-radius: 8px; cursor: pointer; transition: 0.2s;">' +
                                '<div style="font-size: 18px; font-weight: bold; color: #fff; margin-bottom: 8px;">' + item.movie_title + '</div>' +
                                '<div style="font-size: 12px; color: #888; margin-bottom: 5px;">Добавлено: ' + date_str + '</div>' +
                                '<div style="font-size: 13px; color: #aaa; word-break: break-all; background: #111; padding: 8px; border-radius: 4px;">' + item.magnet.substring(0, 40) + '...</div>' +
                             '</div>');
                
                // Эффект наведения (фокус)
                card.on('mouseenter', function() { $(this).css('border-color', '#e50914'); });
                card.on('mouseleave', function() { $(this).css('border-color', '#333'); });

                // Клик по карточке (пока заглушка для будущего меню из 4 пунктов)
                card.on('click', function() {
                    showNoty('Скоро здесь откроется меню управления!');
                });

                list_container.append(card);
            });
        }

        container.append(list_container);
    }
})();
/* --- КОНЕЦ БЛОКА: Тест #3.4 - Вкладки и список для экрана mytorrents --- */
