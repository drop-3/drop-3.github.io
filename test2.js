(function () {
    'use strict';

    function getSaves() {
        try { return JSON.parse(localStorage.getItem('lampa_my_torrents') || '[]'); } 
        catch(e) { return []; }
    }

    // ТА САМАЯ КНОПКА (логика не менялась, она точно работает)
    if (window.Lampa && window.Lampa.Select) {
        var old_show = Lampa.Select.show;
        Lampa.Select.show = function(params) {
            // Кнопка добавляется только там, где есть данные
            if (params.data && (params.data.magnet || params.data.hash)) {
                params.items.push({
                    title: '💾 Сохранить в Лампу',
                    action: 'my_save_action'
                });
            }

            var old_onSelect = params.onSelect;
            params.onSelect = function(item) {
                if (item && item.action === 'my_save_action') {
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
                    }
                } else if (old_onSelect) {
                    old_onSelect(item);
                }
            };
            return old_show(params);
        };
    }

    // ХИРУРГИЧЕСКАЯ ПРАВКА ДЛЯ КАТАЛОГА (не трогает кнопку)
    // Ждем готовности Лампы
    var hookInterval = setInterval(function() {
        if (window.Lampa && Lampa.Torrserve) {
            clearInterval(hookInterval);
            
            var originalList = Lampa.Torrserve.list;
            Lampa.Torrserve.list = function(onSuccess, onError) {
                originalList(function(items) {
                    var saves = getSaves();
                    // Просто добавляем наши сохранения к серверным
                    onSuccess(saves.concat(items || []));
                }, onError);
            };
        }
    }, 1000);
})();
