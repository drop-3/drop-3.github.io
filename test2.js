(function () {
    'use strict';

    function getSaves() {
        try { return JSON.parse(localStorage.getItem('lampa_my_torrents') || '[]'); } 
        catch(e) { return []; }
    }

    // 1. ПРОВЕРЕННАЯ КНОПКА (логика, которая работала)
    if (window.Lampa && window.Lampa.Select) {
        var old_show = Lampa.Select.show;
        Lampa.Select.show = function(params) {
            // Добавляем кнопку принудительно, чтобы она точно была
            params.items.push({
                title: '💾 Сохранить в Лампу',
                action: 'my_save_action'
            });

            var old_onSelect = params.onSelect;
            params.onSelect = function(a) {
                if (a && a.action === 'my_save_action') {
                    var act = Lampa.Activity.active() ? Lampa.Activity.active().activity : {};
                    // Берем то, что есть в данных, либо из активности
                    var magnet = (params.data && params.data.magnet) || act.magnet || '';
                    var title = (params.data && params.data.title) || act.title || 'Сохраненный торрент';
                    
                    if (magnet) {
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
                    }
                } else if (old_onSelect) {
                    old_onSelect(a);
                }
            };
            return old_show(params);
        };
    }

    // 2. ОТДЕЛЬНЫЙ БЛОК ДЛЯ КАТАЛОГА (не влияет на кнопку)
    var timer = setInterval(function() {
        var TS = window.Lampa && (Lampa.Torrserver || Lampa.TorrServer);
        if (TS && TS.list) {
            clearInterval(timer);
            var old_list = TS.list;
            TS.list = function(onSuccess, onError) {
                old_list(function(items) {
                    var saves = getSaves();
                    onSuccess(saves.concat(items || []));
                }, onError);
            };
        }
    }, 1000);
})();
