/* --- СТАРТ БЛОКА: Тест #7 - Стабильный минималистичный плагин --- */
(function () {
    'use strict';

    // 1. Хранилище (LocalStorage)
    var Storage = {
        get: function() {
            try { return JSON.parse(localStorage.getItem('lampa_local_torrents') || '[]'); } 
            catch (e) { return []; }
        },
        save: function(item) {
            var list = this.get();
            if (list.some(function(t) { return t.magnet === item.magnet; })) {
                Lampa.Noty.show('Уже сохранено!');
                return;
            }
            list.push(item);
            localStorage.setItem('lampa_local_torrents', JSON.stringify(list));
            Lampa.Noty.show('Сохранено в локальные!');
        },
        remove: function(magnet) {
            var list = this.get().filter(function(t) { return t.magnet !== magnet; });
            localStorage.setItem('lampa_local_torrents', JSON.stringify(list));
            Lampa.Noty.show('Удалено из сохраненных!');
        }
    };

    // 2. Кнопка "Сохранить" в контекстном меню (работает нативно)
    if (window.Lampa && window.Lampa.Select) {
        var orig_show = Lampa.Select.show;
        Lampa.Select.show = function (params) {
            var magnet = '';
            var el = $('.focus, .selector.focus, :focus').closest('.selector, [data-element], [data-item]');
            var d = el.data('injected_torrent_data') || el.data('element') || el.data('item') || el.data('torrent') || el.data('data') || params.data;
            
            if (d) {
                var hash = d.hash || d.info_hash || d.infoHash || d.btih;
                if (hash) magnet = 'magnet:?xt=urn:btih:' + hash.trim();
                else if (d.magnet) magnet = d.magnet;
                else if (typeof d === 'string' && d.indexOf('magnet:') === 0) magnet = d;
            }

            if (magnet) {
                params.items.push({
                    title: '💾 Сохранить в локальные',
                    action: 'save_local',
                    magnet: magnet,
                    title_film: (Lampa.Activity.active() ? Lampa.Activity.active().activity.title : 'Без названия'),
                    id_film: (Lampa.Activity.active() ? Lampa.Activity.active().activity.id : null)
                });

                var orig_onSelect = params.onSelect;
                params.onSelect = function (item) {
                    if (item && item.action === 'save_local') {
                        Storage.save({
                            title: item.title_film,
                            magnet: item.magnet,
                            id: item.id_film,
                            date: Date.now()
                        });
                    } else if (orig_onSelect) orig_onSelect(item);
                };
            }
            return orig_show(params);
        };
    }

    // 3. Умный фоновый инжектор кнопки (без лагов и дубликатов)
    var showing_local = false;

    setInterval(function() {
        var active = window.Lampa && window.Lampa.Activity && window.Lampa.Activity.active();
        
        // Если мы на экране торрентов
        if (active && (String(active.component).toLowerCase() === 'mytorrents' || String(active.component).toLowerCase() === 'torrents')) {
            
            // Если мы сейчас НЕ показываем наш локальный список
            if (!showing_local) {
                var screen = $('.activity').last();
                
                // Если экрана еще нет или кнопка уже добавлена — ничего не делаем
                if (screen.length > 0 && screen.find('.local-torrents-btn').length === 0) {
                    var list = Storage.get();

                    // Создаем нативную кнопку-карточку
                    var btn = $('<div class="selector card local-torrents-btn" style="padding: 15px; text-align: center; background: #222; margin: 15px; border-radius: 8px; font-size: 18px; font-weight: bold; border: 2px solid #e50914; cursor: pointer;">' +
                                '📁 Сохраненные раздачи (' + list.length + ')' +
                                '</div>');
                    
                    btn.on('click', function() {
                        showing_local = true; // Запрещаем инжектору перерисовывать кнопку
                        showNativeList(screen, list);
                    });

                    // Вставляем в тело экрана
                    var body = screen.find('.scroll__body, .activity__body').first();
                    if (body.length === 0) body = screen;
                    
                    body.prepend(btn);
                    
                    // Обновляем пульт
                    if (Lampa.Controller) Lampa.Controller.toggle('content');
                }
            }
        } else {
            // Если вышли из раздела торрентов — сбрасываем статус
            showing_local = false;
        }
    }, 500);

    // 4. Отрисовка списка сохраненных раздач
    function showNativeList(screen, list) {
        var body = screen.find('.scroll__body, .activity__body').first();
        if (body.length === 0) body = screen;

        body.empty(); // Полностью очищаем экран от заглушек TorrServe и нашей кнопки

        if (list.length === 0) {
            body.append('<div style="text-align: center; padding: 50px; font-size: 20px; color: #888;">Список пуст. Сохраняйте раздачи в фильмах!</div>');
            return;
        }

        var container = $('<div style="padding: 15px; display: flex; flex-direction: column; gap: 10px;"></div>');

        list.slice().reverse().forEach(function(item) {
            var date_str = new Date(item.date).toLocaleDateString();
            
            var card = $('<div class="selector card" style="padding: 15px; background: #1a1a1a; border-radius: 8px; border: 1px solid #333; display: flex; justify-content: space-between; align-items: center; cursor: pointer;">' +
                         '<div style="overflow: hidden; padding-right: 15px;">' +
                             '<div style="font-size: 18px; font-weight: bold; color: #fff; margin-bottom: 5px;">' + (item.title || 'Без названия') + '</div>' +
                             '<div style="font-size: 12px; color: #777;">Добавлено: ' + date_str + ' | ' + String(item.magnet).substring(0, 35) + '...</div>' +
                         '</div>' +
                         '<div style="color: #e50914; font-size: 24px; font-weight: bold;">⋮</div>' +
                         '</div>');

            card.on('click', function() {
                Lampa.Select.show({
                    title: item.title || 'Управление',
                    items: [
                        { title: '▶ Воспроизвести', action: 'play' },
                        { title: '🎬 Открыть карточку фильма', action: 'card' },
                        { title: '🗑 Удалить из сохраненных', action: 'del' }
                    ],
                    onSelect: function(m) {
                        if (m.action === 'play') {
                            if (window.Lampa.Torrent && window.Lampa.Torrent.start) {
                                window.Lampa.Torrent.start({ magnet: item.magnet, title: item.title });
                            } else {
                                window.location.href = item.magnet;
                            }
                        } else if (m.action === 'card') {
                            if (item.id) Lampa.Activity.push({ component: 'full', id: item.id, method: 'tmdb' });
                            else Lampa.Noty.show('ID фильма не был сохранен');
                        } else if (m.action === 'del') {
                            Storage.remove(item.magnet);
                            showNativeList(screen, Storage.get()); // Мгновенно обновляем список
                        }
                    }
                });
            });

            container.append(card);
        });

        body.append(container);
        
        if (Lampa.Controller) Lampa.Controller.toggle('content');
    }

})();
/* --- КОНЕЦ БЛОКА: Тест #7 - Стабильный минималистичный плагин --- */
