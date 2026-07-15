(function () {
    'use strict';

    // Получаем сохраненные данные
    function getSaves() {
        try { return JSON.parse(localStorage.getItem('lampa_my_torrents') || '[]'); } 
        catch(e) { return []; }
    }

    // 1. Сохранение (оставляем как есть, оно работает)
    if (window.Lampa && window.Lampa.Select) {
        var old_show = Lampa.Select.show;
        Lampa.Select.show = function(params) {
            var el = $('.focus, .selector.focus').closest('[data-element], [data-item], .selector');
            var d = el.data('element') || el.data('item') || el.data('torrent') || params.data;
            var mag = d ? (d.magnet || '') : '';
            if (!mag && d && (d.hash || d.btih)) mag = 'magnet:?xt=urn:btih:' + (d.hash || d.btih);

            if (mag) {
                params.items.push({ title: '💾 Сохранить в Лампу', action: 'my_save' });
                var old_sel = params.onSelect;
                params.onSelect = function(a) {
                    if (a && a.action === 'my_save') {
                        var list = getSaves();
                        if (!list.some(function(x){ return x.magnet === mag; })) {
                            var act = Lampa.Activity.active() ? (Lampa.Activity.active().activity || {}) : {};
                            list.unshift({
                                title: act.title || act.name || 'Сохраненный торрент',
                                img: act.img || act.poster || '',
                                magnet: mag,
                                hash: mag.replace(/.*btih:([a-z0-9]+).*/i, '$1'),
                                stat_string: '💾 Из памяти ТВ'
                            });
                            localStorage.setItem('lampa_my_torrents', JSON.stringify(list));
                            if (Lampa.Noty) Lampa.Noty.show('💾 Сохранено!');
                        } else {
                            if (Lampa.Noty) Lampa.Noty.show('⚠️ Уже есть!');
                        }
                    } else if (old_sel) old_sel(a);
                };
            }
            return old_show(params);
        };
    }

    // 2. Внедрение в движок TorrServe
    // В Лампе встроенный клиент часто живет в Lampa.Torrserve
    var check = setInterval(function() {
        if (window.Lampa && Lampa.Torrserve) {
            clearInterval(check);
            
            // Запоминаем оригинал
            var orig = Lampa.Torrserve.list;
            
            Lampa.Torrserve.list = function(onSuccess, onError) {
                orig(function(items) {
                    var my = getSaves();
                    // Объединяем наши и серверные
                    onSuccess(my.concat(items));
                }, onError);
            };
        }
    }, 1000);
})();
