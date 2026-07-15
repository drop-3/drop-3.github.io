/* --- СТАРТ БЛОКА: Тест #6 - Чистый минималистичный плагин --- */
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

    // 2. Кнопка "Сохранить" в контекстном меню (работает нативно через Lampa.Select)
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

    // 3. Добавление кнопки в раздел "Торренты" (БЕЗ ТАЙМЕРОВ И БУЛЬДОЗЕРОВ)
    Lampa.Listener.follow('activity', function (e) {
        if (e.type === 'start' && (String(e.component).toLowerCase() === 'mytorrents' || String(e.component).toLowerCase() === 'torrents')) {
            
            // Небольшая задержка, чтобы Лампа создала контейнер экрана
            setTimeout(function() {
                var screen = $('.activity.active .activity__body, .activity.active').first();
                if (screen.length === 0) return;

                var list = Storage.get();

                // Создаем кнопку с классом "selector" — пульт ТВ подхватит её автоматически!
                var btn = $('<div class="selector card" style="padding: 15px; text-align: center; background: #222; margin: 15px; border-radius: 8px; font-size: 18px; font-weight: bold; border: 1px solid #444;">' +
                            '📁 Сохраненные раздачи (' + list.length + ')' +
                            '</div>');
                
                btn.on('click', function() {
                    showNativeList(screen, list);
                });

                // Вставляем кнопку в самый верх
                screen.prepend(btn);
                
                // Говорим Лампе пересчитать элементы для пульта
                if (Lampa.Controller) Lampa.Controller.toggle('content');
            }, 600);
        }
    });

    // 4. Отрисовка списка через стандартные классы Лампы
    function showNativeList(screen, list) {
        screen.empty(); // Очищаем экран от мусора
        
        if (list.length === 0) {
            screen.append('<div style="text-align: center; padding: 50px; font-size: 20px; color: #888;">Список пуст. Сохраняйте раздачи в фильмах!</div>');
            return;
        }

        var container = $('<div style="padding: 15px; display: flex; flex-direction: column; gap: 10px;"></div>');

        list.slice().reverse().forEach(function(item) {
            var date_str = new Date(item.date).toLocaleDateString();
            
            // Класс "selector" делает карточку активной для пульта!
            var card = $('<div class="selector card" style="padding: 15px; background: #1a1a1a; border-radius: 8px; border: 1px solid #333; display: flex; justify-content: space-between; align-items: center;">' +
                         '<div style="overflow: hidden; padding-right: 15px;">' +
                             '<div style="font-size: 18px; font-weight: bold; color: #fff; margin-bottom: 5px;">' + (item.title || 'Без названия') + '</div>' +
                             '<div style="font-size: 12px; color: #777;">Добавлено: ' + date_str + ' | ' + String(item.magnet).substring(0, 35) + '...</div>' +
                         '</div>' +
                         '<div style="color: #e50914; font-size: 24px; font-weight: bold;">⋮</div>' +
                         '</div>');

            // При клике открываем родное меню выбора Лампы
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
                            showNativeList(screen, Storage.get()); // Обновляем список сразу
                        }
                    }
                });
            });

            container.append(card);
        });

        screen.append(container);
        
        // Говорим пульту переключить фокус на наш новый список
        if (Lampa.Controller) Lampa.Controller.toggle('content');
    }

})();
/* --- КОНЕЦ БЛОКА: Тест #6 - Чистый минималистичный плагин --- */
