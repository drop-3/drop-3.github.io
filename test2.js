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

/* --- СТАРТ БЛОКА: Тест #3.5 - Таран (Гарантированная вставка вкладок) --- */
(function () {
    'use strict';

    function showNoty(msg) {
        if (window.Lampa && window.Lampa.Noty) window.Lampa.Noty.show(msg);
    }

    // Запускаем постоянный таймер (бульдозер), который каждые 500 мс проверяет, где мы находимся
    setInterval(function() {
        var active = window.Lampa && window.Lampa.Activity && window.Lampa.Activity.active();
        
        // Проверяем, что мы сейчас именно на экране mytorrents (или torrents)
        if (active && (String(active.component).toLowerCase() === 'mytorrents' || String(active.component).toLowerCase() === 'torrents')) {
            
            // Берем весь текущий видимый экран Лампы
            var screen = $('.activity.active');
            
            // Если экран существует, а наших кнопок на нем еще нет — вбиваем их туда!
            if (screen.length > 0 && screen.find('.local-tabs').length === 0) {
                
                showNoty('Вставляем вкладки Local...');

                // Создаем панель кнопок с максимальным приоритетом (z-index)
                var tabs = $('<div class="local-tabs" style="width: 100%; display: flex; justify-content: center; padding: 20px; background: #111; border-bottom: 2px solid #e50914; z-index: 99999; position: relative;">' +
                                '<button class="tab-btn active" data-tab="ts" style="margin: 0 15px; padding: 12px 30px; background: #e50914; color: #fff; border: none; border-radius: 6px; font-size: 18px; font-weight: bold; cursor: pointer;">TorrServe</button>' +
                                '<button class="tab-btn" data-tab="local" style="margin: 0 15px; padding: 12px 30px; background: #222; color: #fff; border: 2px solid #777; border-radius: 6px; font-size: 18px; font-weight: bold; cursor: pointer;">Local</button>' +
                             '</div>');
                
                // Вставляем в самую верхнюю точку активного экрана
                screen.prepend(tabs);

                // Логика нажатий на кнопки
                tabs.find('.tab-btn').on('click', function() {
                    var tab = $(this).data('tab');
                    
                    tabs.find('.tab-btn').css({ background: '#222', border: '2px solid #777' });
                    $(this).css({ background: '#e50914', border: 'none' });

                    if (tab === 'local') {
                        // Скрываем всё стандартное содержимое экрана Лампы (заглушку и кнопки обновления)
                        screen.children().not('.local-tabs').hide();
                        showLocalList(screen);
                    } else {
                        // Удаляем наш список и возвращаем стандартный экран TorrServe
                        screen.find('.local-torrents-list').remove();
                        screen.children().show();
                    }
                });
            }
        }
    }, 500);

    // Функция отрисовки списка сохраненных карточек
    function showLocalList(container) {
        container.find('.local-torrents-list').remove();
        
        var list_container = $('<div class="local-torrents-list" style="width: 100%; padding: 30px; display: flex; flex-wrap: wrap; gap: 20px; overflow-y: auto; max-height: 80vh;"></div>');
        var list = window.LocalTorrentStorage ? window.LocalTorrentStorage.get() : [];

        if (list.length === 0) {
            list_container.append('<div style="width: 100%; text-align: center; padding: 50px; font-size: 24px; color: #aaa;">Список сохраненных торрентов пуст</div>');
        } else {
            // Отрисовываем сохраненные раздачи (от новых к старым)
            list.slice().reverse().forEach(function(item) {
                var date_str = new Date(item.date).toLocaleDateString();
                var card = $('<div style="flex: 1 1 350px; background: #1a1a1a; border: 2px solid #444; padding: 20px; border-radius: 10px; cursor: pointer; transition: 0.2s;">' +
                                '<div style="font-size: 20px; font-weight: bold; color: #fff; margin-bottom: 10px;">' + (item.movie_title || 'Без названия') + '</div>' +
                                '<div style="font-size: 14px; color: #888; margin-bottom: 10px;">Добавлено: ' + date_str + '</div>' +
                                '<div style="font-size: 12px; color: #666; background: #0d0d0d; padding: 10px; border-radius: 6px; word-break: break-all;">' + String(item.magnet).substring(0, 50) + '...</div>' +
                             '</div>');
                
                card.on('click', function() {
                    showNoty('Следующий шаг: прикручиваем меню из 4 пунктов!');
                });

                list_container.append(card);
            });
        }

        container.append(list_container);
    }
})();
/* --- КОНЕЦ БЛОКА: Тест #3.5 - Таран (Гарантированная вставка вкладок) --- */
