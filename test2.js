(function () {
    'use strict';

    // Получение данных
    function getSaves() {
        try { return JSON.parse(localStorage.getItem('lampa_my_torrents') || '[]'); } 
        catch(e) { return []; }
    }

    // 1. КНОПКА: Только для раздач
    if (window.Lampa && window.Lampa.Select) {
        var old_show = Lampa.Select.show;
        Lampa.Select.show = function(params) {
            // Проверяем: есть ли у нас список элементов и является ли он списком торрентов
            // (ищем признаки того, что мы в меню раздач)
            var is_torrent_list = params.items && params.items.length > 0 && 
                                 (params.items[0].magnet || params.items[0].hash || params.items[0].file_id);

            if (is_torrent_list) {
                params.items.push({
                    title: '💾 Сохранить в Лампу',
                    action: 'my_save'
                });
            }

            var old_onSelect = params.onSelect;
            params.onSelect = function(a) {
                if (a && a.action === 'my_save') {
                    var act = Lampa.Activity.active() ? Lampa.Activity.active().activity : {};
                    var magnet = a.magnet || (params.data ? params.data.magnet : '');
                    var title = act.title || act.name || 'Торрент';

                    var list = getSaves();
                    if (!list.some(function(x){ return x.magnet === magnet; })) {
                        list.unshift({
                            title: title,
                            magnet: magnet,
                            img: act.img || act.poster || '',
                            stat_string: '💾 Сохранено'
                        });
                        localStorage.setItem('lampa_my_torrents', JSON.stringify(list));
                        if (Lampa.Noty) Lampa.Noty.show('💾 Сохранено!');
                    } else {
                        if (Lampa.Noty) Lampa.Noty.show('⚠️ Уже есть!');
                    }
                } else if (old_onSelect) {
                    old_onSelect(a);
                }
            };
            return old_show(params);
        };
    }

    // 2. ДАННЫЕ: Внедряемся в Лампу через событие загрузки данных
    // Это самый безопасный способ - мы просто "подкладываем" наши данные, когда Лампа их запрашивает
    if (window.Lampa && Lampa.Listener) {
        Lampa.Listener.follow('torrserver', function(e) {
            if (e.type === 'get' || e.type === 'list') {
                var saves = getSaves();
                if (saves.length > 0) {
                    // Если Лампа уже получила данные от сервера, добавляем наши в начало
                    if (e.data && Array.isArray(e.data)) {
                        e.data = saves.concat(e.data);
                    }
                }
            }
        });
    }
})();
