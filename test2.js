/* --- СТАРТ БЛОКА: Тест #8 - Идеальная адаптация под пульт ТВ --- */
(function () {
    'use strict';

    // 1. Хранилище
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

    // 2. Кнопка в контекстном меню парсера
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

    // 3. Инжектор кнопки с МАГНИТОМ для пульта ТВ
    var showing_local = false;

    setInterval(function() {
        var active = window.Lampa && window.Lampa.Activity && window.Lampa.Activity.active();
        
        if (active && (String(active.component).toLowerCase() === 'mytorrents' || String(active.component).toLowerCase() === 'torrents')) {
            if (!showing_local) {
                var screen = $('.activity').last();
                
                if (screen.length > 0 && screen.find('.local-torrents-btn').length === 0) {
                    var list = Storage.get();

                    // Обязательно ставим tabindex="0" и класс selector для ТВ-пульта
                    var btn = $('<div class="selector card local-torrents-btn" tabindex="0" style="padding: 18px; text-align: center; background: #222; margin: 15px; border-radius: 8px; font-size: 20px; font-weight: bold; border: 2px solid #e50914; cursor: pointer; transition: 0.2s; outline: none;">' +
                                '📁 Сохраненные раздачи (' + list.length + ')' +
                                '</div>');
                    
                    // Реакция на фокус пульта (hover:focus - системное событие Лампы)
                    btn.on('hover:focus focus', function() {
                        $(this).css({ 'background': '#e50914', 'color': '#fff', 'transform': 'scale(1.02)', 'border-color': '#fff', 'box-shadow': '0 0 15px rgba(229,9,20,0.5)' });
                    });
                    btn.on('hover:empty blur', function() {
                        $(this).css({ 'background': '#222', 'color': '#fff', 'transform': 'scale(1)', 'border-color': '#e50914', 'box-shadow': 'none' });
                    });

                    btn.on('click', function() {
                        showing_local = true;
                        showNativeList(screen, list);
                    });

                    var body = screen.find('.scroll__body, .activity__body').first();
                    if (body.length === 0) body = screen;
                    
                    body.prepend(btn);
                    
                    // МАГИЯ ДЛЯ ПУЛЬТА: Пересчитываем сетку и АВТОМАТИЧЕСКИ ставим фокус на нашу кнопку!
                    if (window.Lampa && window.Lampa.Controller) {
                        Lampa.Controller.collectionSet(screen.find('.selector'));
                        Lampa.Controller.collectionFocus(btn[0]);
                    }
                }
            }
        } else {
            showing_local = false;
        }
    }, 500);

    // 4. Отрисовка списка с поддержкой ТВ-пульта
    function showNativeList(screen, list) {
        var body = screen.find('.scroll__body, .activity__body').first();
        if (body.length === 0) body = screen;

        body.empty();

        if (list.length === 0) {
            body.append('<div style="text-align: center; padding: 50px; font-size: 20px; color: #888;">Список пуст. Сохраняйте раздачи в фильмах!</div>');
            return;
        }

        var container = $('<div style="padding: 15px; display: flex; flex-direction: column; gap: 12px;"></div>');

        list.slice().reverse().forEach(function(item) {
            var date_str = new Date(item.date).toLocaleDateString();
            
            var card = $('<div class="selector card" tabindex="0" style="padding: 18px; background: #1a1a1a; border-radius: 8px; border: 2px solid #333; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: 0.2s; outline: none;">' +
                         '<div style="overflow: hidden; padding-right: 15px;">' +
                             '<div style="font-size: 20px; font-weight: bold; color: #fff; margin-bottom: 6px;">' + (item.title || 'Без названия') + '</div>' +
                             '<div style="font-size: 14px; color: #888;">Добавлено: ' + date_str + ' | ' + String(item.magnet).substring(0, 35) + '...</div>' +
                         '</div>' +
                         '<div style="color: #e50914; font-size: 26px; font-weight: bold;">⋮</div>' +
                         '</div>');

            // Подсветка карточек пультом ТВ
            card.on('hover:focus focus', function() {
                $(this).css({ 'border-color': '#e50914', 'transform': 'scale(1.02)', 'background': '#222' });
            });
            card.on('hover:empty blur', function() {
                $(this).css({ 'border-color': '#333', 'transform': 'scale(1)', 'background': '#1a1a1a' });
            });

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
                            showNativeList(screen, Storage.get());
                        }
                    }
                });
            });

            container.append(card);
        });

        body.append(container);
        
        // Пересчитываем сетку для пульта и сразу ставим фокус на ПЕРВЫЙ фильм в списке!
        if (window.Lampa && window.Lampa.Controller) {
            Lampa.Controller.collectionSet(body.find('.selector'));
            var first_card = body.find('.selector').first()[0];
            if (first_card) Lampa.Controller.collectionFocus(first_card);
        }
    }

})();
/* --- КОНЕЦ БЛОКА: Тест #8 - Идеальная адаптация под пульт ТВ --- */
