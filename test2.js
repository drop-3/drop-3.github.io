/* --- СТАРТ БЛОКА: Тест #9 - Перехват источника данных --- */
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
                if (window.Lampa && Lampa.Noty) Lampa.Noty.show('Уже сохранено!');
                return;
            }
            list.push(item);
            localStorage.setItem('lampa_local_torrents', JSON.stringify(list));
            if (window.Lampa && Lampa.Noty) Lampa.Noty.show('Сохранено в локальные!');
        }
    };

    // 2. Кнопка "Сохранить" в контекстном меню (уже проверенная и рабочая)
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
                            hash: item.magnet ? item.magnet.replace(/.*btih:([a-zA-Z0-9]+).*/i, '$1') : '',
                            id: item.id_film,
                            date: Date.now()
                        });
                    } else if (orig_onSelect) orig_onSelect(item);
                };
            }
            return orig_show(params);
        };
    }

    // 3. ТОТ САМЫЙ НАМЁК: Перехватываем данные, которые раздел тянет с ТоррСервера!
    function injectLocalTorrents(server_items) {
        var local = Storage.get();
        if (!local || local.length === 0) return server_items || [];

        // Маскируем наши локальные сохранения под формат ТоррСервера, чтобы Лампа их приняла за родные
        var formatted_local = local.map(function(item) {
            return {
                title: '📁 [Локально] ' + (item.title || 'Без названия'),
                magnet: item.magnet,
                hash: item.hash || 'local_' + Math.random(),
                size: 0,
                stat_string: 'Сохранено в памяти ТВ',
                loaded_size: 0,
                torrent_size: 0,
                local_save: true, // Пометка, что это наша карточка
                data: item
            };
        });

        // Объединяем: сначала наши сохранения, затем то, что пришло от сервера
        return formatted_local.concat(server_items || []);
    }

    // Встраиваемся в API ТоррСервера в Лампе
    var check_timer = setInterval(function() {
        if (window.Lampa && window.Lampa.Torrserver) {
            clearInterval(check_timer);

            // Перехватываем метод получения списка (list)
            var orig_list = Lampa.Torrserver.list;
            if (orig_list) {
                Lampa.Torrserver.list = function (onSuccess, onError) {
                    orig_list(function (server_items) {
                        // Сервер ответил — подмешиваем наши данные и отдаём Лампе
                        onSuccess(injectLocalTorrents(server_items));
                    }, function (err) {
                        // Сервер выключен или выдал ошибку — всё равно отдаём Лампе наши сохранения!
                        var local_only = injectLocalTorrents([]);
                        if (local_only.length > 0) onSuccess(local_only);
                        else if (onError) onError(err);
                    });
                };
            }
        }
    }, 200);

})();
/* --- КОНЕЦ БЛОКА: Тест #9 - Перехват источника данных --- */
