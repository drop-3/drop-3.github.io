(function () {
    'use strict';

    // 1. Хранилище
    function getSaves() {
        try { return JSON.parse(localStorage.getItem('lampa_my_torrents') || '[]'); } 
        catch(e) { return []; }
    }

    // 2. КНОПКА: Максимально простая, без условий
    if (window.Lampa && window.Lampa.Select) {
        var old_show = Lampa.Select.show;
        Lampa.Select.show = function(params) {
            // Добавляем кнопку всегда, если есть массив items
            if (params.items && Array.isArray(params.items)) {
                params.items.push({
                    title: '💾 Сохранить в Лампу',
                    action: 'my_save_action'
                });
            }

            var old_onSelect = params.onSelect;
            params.onSelect = function(a) {
                if (a && a.action === 'my_save_action') {
                    var act = Lampa.Activity.active() ? Lampa.Activity.active().activity : {};
                    // Пытаемся достать данные из params.data или текущей активности
                    var d = params.data || {};
                    var magnet = d.magnet || act.magnet || '';
                    var title = d.title || act.title || 'Сохраненный торрент';
                    
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
                    } else {
                        if (Lampa.Noty) Lampa.Noty.show('❌ Не удалось получить ссылку');
                    }
                } else if (old_onSelect) {
                    old_onSelect(a);
                }
            };
            return old_show(params);
        };
    }

    // 3. ДАННЫЕ: Прямая подмена метода list
    var timer = setInterval(function() {
        var TS = window.Lampa && (Lampa.Torrserve || Lampa.TorrServer);
        if (TS && TS.list) {
            clearInterval(timer);
            
            var old_list = TS.list;
            TS.list = function(onSuccess, onError) {
                old_list(function(items) {
                    var saves = getSaves();
                    // Добавляем наши сохранения в начало списка
                    var result = saves.concat(items || []);
                    onSuccess(result);
                }, onError);
            };
        }
    }, 1000);
})();
