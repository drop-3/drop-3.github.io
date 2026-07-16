/* --- ЧАСТЬ 1: Кнопка и сохранение в память ТВ --- */
(function () {
    'use strict';

    // Безопасное чтение из хранилища без риска вызвать ошибку
    function getSavedTorrents() {
        try {
            var data = localStorage.getItem('lampa_my_torrents');
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }

    // Мягкое ожидание загрузки интерфейса Лампы
    var uiTimer = setInterval(function () {
        if (window.Lampa && window.Lampa.Select) {
            clearInterval(uiTimer);

            var originalShow = Lampa.Select.show;

            Lampa.Select.show = function (params) {
                var data = params.data || {};
                var magnet = data.magnet || '';
                var hash = data.hash || data.btih || '';

                if (!magnet && hash) {
                    magnet = 'magnet:?xt=urn:btih:' + hash;
                }

                // Добавляем кнопку ТОЛЬКО если в меню есть магнет-ссылка раздачи
                if (magnet) {
                    params.items.push({
                        title: '💾 Сохранить в Лампу',
                        action: 'save_my_torrent'
                    });
                }

                var originalOnSelect = params.onSelect;
                params.onSelect = function (item) {
                    if (item && item.action === 'save_my_torrent') {
                        var savedList = getSavedTorrents();
                        
                        // Проверка: есть ли уже такая раздача в памяти
                        var alreadySaved = savedList.some(function (el) {
                            return el.magnet === magnet;
                        });

                        if (!alreadySaved) {
                            var active = Lampa.Activity.active();
                            var activityData = active ? (active.activity || {}) : {};
                            
                            var title = data.title || activityData.title || 'Сохраненный торрент';
                            var poster = data.img || data.poster || activityData.img || activityData.poster || '';

                            savedList.unshift({
                                title: title,
                                img: poster,
                                poster: poster,
                                magnet: magnet,
                                hash: hash || magnet.replace(/.*btih:([a-zA-Z0-9]+).*/i, '$1'),
                                stat_string: '💾 Из памяти ТВ'
                            });

                            localStorage.setItem('lampa_my_torrents', JSON.stringify(savedList));
                            if (Lampa.Noty) Lampa.Noty.show('💾 Сохранено в память ТВ!');
                        } else {
                            if (Lampa.Noty) Lampa.Noty.show('⚠️ Этот торрент уже есть в списке!');
                        }
                    } else if (originalOnSelect) {
                        originalOnSelect(item);
                    }
                };

                return originalShow(params);
            };
        }
    }, 500);
})();
