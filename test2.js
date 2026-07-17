/* --- СТАРТ БЛОКА: Тест №2 (Исправленный запуск) --- */
(function () {
    'use strict';

    // 1. Уведомления
    function showNoty(msg) {
        if (window.Lampa && window.Lampa.Noty) window.Lampa.Noty.show(msg);
    }

    // 2. Хранилище (Заменено на безопасный ES5 цикл, чтобы не было ошибок на старых ТВ)
    window.LocalTorrentStorage = {
        save: function(item) {
            var saved = this.get();
            
            var exists = false;
            for (var i = 0; i < saved.length; i++) {
                if (saved[i].magnet === item.magnet) {
                    exists = true;
                    break;
                }
            }
            if (exists) {
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

    // 3. Улучшенный поиск данных
    function findMagnetInElement() {
        var magnet = '';
        var f = $('.focus, .selector.focus, :focus').closest('.selector, [data-element], [data-item]');
        var d = f.data('injected_torrent_data') || f.data('element') || f.data('item') || f.data('torrent') || f.data('data');
        
        if (d) {
            var hash = d.hash || d.info_hash || d.infoHash || d.btih;
            if (hash) magnet = 'magnet:?xt=urn:btih:' + hash.trim();
            else if (d.magnet) magnet = d.magnet;
            else if (typeof d === 'string' && d.indexOf('magnet:') === 0) magnet = d;
        }
        return magnet;
    }

    // 4. Интеграция (ДОБАВЛЕН ТАЙМЕР ОЖИДАНИЯ)
    var timer = setInterval(function() {
        // Скрипт ждет, пока Лампа 100% прогрузит меню Select
        if (window.Lampa && window.Lampa.Select && window.Lampa.Select.show) {
            clearInterval(timer); // Лампа загрузилась, выключаем таймер

            var orig_show = Lampa.Select.show;
            Lampa.Select.show = function (params) {
                var magnet = findMagnetInElement();

                if (magnet) {
                    var active = window.Lampa.Activity.active();
                    var act_data = active ? (active.activity || {}) : {};

                    params.items.push({
                        title: 'Сохранить в локальные',
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
                        } else if (orig_onSelect) {
                            orig_onSelect(item);
                        }
                    };
                }
                
                return orig_show.call(this, params);
            };
        }
    }, 500); // Повторяет проверку каждые полсекунды, пока не сработает
})();
/* --- КОНЕЦ БЛОКА: Тест №2 --- */
