/* --- СТАРТ БЛОКА: Тест №3 (Радар фокуса) --- */
(function () {
    'use strict';

    // 1. Хранилище
    window.LocalTorrentStorage = {
        save: function(item) {
            var saved = this.get();
            var exists = false;
            for (var i = 0; i < saved.length; i++) {
                if (saved[i].magnet === item.magnet) { exists = true; break; }
            }
            if (exists) {
                if (window.Lampa && window.Lampa.Noty) window.Lampa.Noty.show('⚠️ Уже сохранено!');
                return;
            }
            saved.push({
                movie_id: item.movie_id,
                movie_title: item.movie_title,
                magnet: item.magnet,
                date: Date.now()
            });
            localStorage.setItem('lampa_local_torrents', JSON.stringify(saved));
            if (window.Lampa && window.Lampa.Noty) window.Lampa.Noty.show('💾 Сохранено в память!');
        },
        get: function() {
            try {
                var data = localStorage.getItem('lampa_local_torrents');
                return data ? JSON.parse(data) : [];
            } catch (e) { return []; }
        }
    };

    // 2. РАДАР ФОКУСА (Запоминает раздачу до открытия меню)
    var lastTorrentData = null;
    setInterval(function() {
        var f = $('.focus');
        if (f.length > 0) {
            // Если фокус ушел на всплывающее меню, ничего не делаем (сохраняем память о раздаче)
            if (f.closest('.select, .select__item, .layer, .modal').length > 0) {
                return;
            }

            var el = f.closest('.selector, [data-element], [data-item]');
            var d = el.data('injected_torrent_data') || el.data('element') || el.data('item') || el.data('torrent') || el.data('data') || (el[0] ? el[0].__data : null);
            
            // Если пульт стоит на раздаче - запоминаем её!
            if (d && (d.hash || d.btih || d.info_hash || (typeof d.magnet === 'string' && d.magnet.indexOf('magnet:') === 0))) {
                lastTorrentData = d;
            } else {
                // Если пульт ушел на обычную кнопку (например "Смотреть") - стираем память
                lastTorrentData = null;
            }
        }
    }, 200);

    // 3. ИНТЕГРАЦИЯ В МЕНЮ
    var timer = setInterval(function() {
        if (window.Lampa && window.Lampa.Select && window.Lampa.Select.show) {
            clearInterval(timer);
            
            var orig_show = Lampa.Select.show;
            Lampa.Select.show = function (params) {
                var magnet = '';

                // Берем данные не из экрана, а из памяти нашего радара!
                if (lastTorrentData) {
                    if (lastTorrentData.magnet) magnet = lastTorrentData.magnet;
                    else if (lastTorrentData.hash || lastTorrentData.btih || lastTorrentData.info_hash) {
                        magnet = 'magnet:?xt=urn:btih:' + (lastTorrentData.hash || lastTorrentData.btih || lastTorrentData.info_hash).trim();
                    }
                }

                // Если радар помнит магнит — добавляем кнопку
                if (magnet) {
                    var active = window.Lampa.Activity.active();
                    var act_data = active ? (active.activity || {}) : {};

                    params.items.push({
                        title: '💾 Сохранить в Лампу',
                        save_magnet: magnet,
                        movie_id: act_data.id || null,
                        movie_title: act_data.title || act_data.name || 'Неизвестно'
                    });

                    var orig_onSelect = params.onSelect;
                    params.onSelect = function (item) {
                        if (item && item.save_magnet) {
                            window.LocalTorrentStorage.save({
                                magnet: item.save_magnet,
                                movie_id: item.movie_id,
                                movie_title: item.movie_title
                            });
                            lastTorrentData = null; // Очищаем после сохранения
                        } else if (orig_onSelect) {
                            orig_onSelect(item);
                        }
                    };
                }
                
                return orig_show.call(this, params);
            };
        }
    }, 500);
})();
/* --- КОНЕЦ БЛОКА --- */
