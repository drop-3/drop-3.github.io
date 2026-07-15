(function () {
    'use strict';

    // Получаем данные
    function getSaves() {
        try { return JSON.parse(localStorage.getItem('lampa_my_torrents') || '[]'); } 
        catch(e) { return []; }
    }

    // 1. Прямая принудительная вставка в меню
    var menuTimer = setInterval(function() {
        if (window.Lampa && Lampa.Select) {
            clearInterval(menuTimer);
            
            var old_show = Lampa.Select.show;
            Lampa.Select.show = function(params) {
                // Если это список торрентов, добавляем нашу кнопку
                if (params.items && Array.isArray(params.items)) {
                    params.items.push({
                        title: '💾 Сохранить в Лампу',
                        action: 'my_save_action'
                    });
                }
                
                var old_onSelect = params.onSelect;
                params.onSelect = function(item) {
                    if (item && item.action === 'my_save_action') {
                        // Сохранение
                        var act = Lampa.Activity.active() ? (Lampa.Activity.active().activity || {}) : {};
                        var list = getSaves();
                        
                        // Берем данные из текущей активности
                        var title = act.title || 'Сохраненный торрент';
                        var magnet = act.magnet || ''; // Магнет подтягивается из активной карточки
                        
                        // Если магнета нет, ищем в параметрах
                        if (!magnet && params.data) magnet = params.data.magnet || '';
                        
                        if (magnet) {
                             if (!list.some(function(x){ return x.magnet === magnet; })) {
                                list.unshift({
                                    title: title,
                                    magnet: magnet,
                                    img: act.img || act.poster || '',
                                    stat_string: '💾 Из памяти ТВ'
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
    }, 500);

    // 2. Принудительное внедрение в TorrServer/Torrserver
    var listTimer = setInterval(function() {
        if (window.Lampa && (Lampa.Torrserver || Lampa.TorrServer)) {
            var ts = Lampa.Torrserver || Lampa.TorrServer;
            if (ts.list && !ts._hooked) {
                ts._hooked = true;
                var old_list = ts.list;
                
                ts.list = function(onSuccess, onError) {
                    old_list(function(items) {
                        var saves = getSaves();
                        onSuccess(saves.concat(items));
                    }, onError);
                };
                clearInterval(listTimer);
            }
        }
    }, 500);
})();
