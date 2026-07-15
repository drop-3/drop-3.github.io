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

/* --- СТАРТ БЛОКА: Тест №3 - Вкладки в меню Торренты --- */
(function () {
    'use strict';

    // Внедряемся в жизненный цикл активностей Лампы
    Lampa.Listener.follow('activity', function (e) {
        if (e.type === 'start' && e.component === 'torrents') {
            // Ждем немного, пока прорисуется стандартный список
            setTimeout(function() {
                var activity = Lampa.Activity.active();
                if (!activity) return;

                // Добавляем переключатель вкладок (Tabs), если его еще нет
                if (!$('.local-tabs').length) {
                    var tabs = $('<div class="local-tabs" style="display: flex; justify-content: center; padding: 10px;">' +
                                    '<button class="tab-btn active" style="margin: 0 10px; padding: 5px 15px;">TorrServe</button>' +
                                    '<button class="tab-btn" style="margin: 0 10px; padding: 5px 15px;">Local</button>' +
                                 '</div>');
                    
                    $('.full-start').prepend(tabs);

                    // Логика переключения
                    tabs.find('.tab-btn').on('click', function() {
                        $('.tab-btn').removeClass('active');
                        $(this).addClass('active');
                        
                        if ($(this).text() === 'Local') {
                            showLocalTorrents();
                        } else {
                            location.reload(); // Простой способ вернуть стандартный вид
                        }
                    });
                }
            }, 500);
        }
    });

    // Функция отображения сохраненных торрентов
    function showLocalTorrents() {
        var list = window.LocalTorrentStorage.get();
        var container = $('.items-line'); // Стандартный контейнер Лампы
        container.empty();

        if (list.length === 0) {
            container.append('<div class="empty" style="text-align: center; padding: 20px;">Список пуст</div>');
            return;
        }

        list.forEach(function(item) {
            var card = $('<div class="card" style="padding: 10px; border: 1px solid #333; margin: 5px; cursor: pointer;">' +
                            '<div>' + item.movie_title + '</div>' +
                            '<div style="font-size: 0.8em; color: #888;">' + item.magnet.substring(0, 20) + '...</div>' +
                         '</div>');
            
            card.on('click', function() {
                showNoty('Здесь будет меню управления: Воспроизвести/Удалить');
            });
            
            container.append(card);
        });
    }
})();
/* --- КОНЕЦ БЛОКА: Тест №3 - Вкладки в меню Торренты --- */
