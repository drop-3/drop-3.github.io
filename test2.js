(function () {
    'use strict';

    function getSaves() {
        try { return JSON.parse(localStorage.getItem('lampa_my_torrents') || '[]'); } 
        catch(e) { return []; }
    }

    if (window.Lampa && window.Lampa.Select) {
        var old_show = Lampa.Select.show;
        
        Lampa.Select.show = function(params) {
            // 1. Проверяем, есть ли в этом меню данные о торренте
            // Мы ищем магнет или хэш в данных элемента или в самом списке
            var hasTorrentData = (params.data && (params.data.magnet || params.data.hash || params.data.btih));
            
            // 2. Если нашли данные — добавляем кнопку (и только тогда!)
            if (hasTorrentData) {
                params.items.push({
                    title: '💾 Сохранить в Лампу',
                    action: 'my_save_action'
                });
            }

            var old_onSelect = params.onSelect;
            params.onSelect = function(item) {
                if (item && item.action === 'my_save_action') {
                    // Берем данные прямо из контекста
                    var d = params.data;
                    var magnet = d.magnet || (d.hash ? 'magnet:?xt=urn:btih:' + d.hash : '');
                    var title = d.title || 'Сохраненный торрент';
                    
                    if (magnet) {
                        var list = getSaves();
                        if (!list.some(function(x){ return x.magnet === magnet; })) {
                            list.unshift({
                                title: title,
                                magnet: magnet,
                                img: d.img || d.poster || '',
                                stat_string: '💾 Сохранено'
                            });
                            localStorage.setItem('lampa_my_torrents', JSON.stringify(list));
                            if (Lampa.Noty) Lampa.Noty.show('💾 Сохранено!');
                        } else {
                            if (Lampa.Noty) Lampa.Noty.show('⚠️ Уже есть!');
                        }
                    } else {
                        if (Lampa.Noty) Lampa.Noty.show('❌ Ошибка данных');
                    }
                } else if (old_onSelect) {
                    old_onSelect(item);
                }
            };
            return old_show(params);
        };
    }

    // Внедрение в список (без перехвата сети, чистое объединение массивов)
    var timer = setInterval(function() {
        var TS = window.Lampa && (Lampa.Torrserver || Lampa.TorrServer);
        if (TS && TS.list) {
            clearInterval(timer);
            var old_list = TS.list;
            TS.list = function(onSuccess, onError) {
                old_list(function(items) {
                    var saves = getSaves();
                    // Склеиваем, если не пусто
                    onSuccess(saves.concat(items || []));
                }, onError);
            };
        }
    }, 1000);
})();
