/* --- СТАРТ БЛОКА: Истинный минимализм (в стиле твоего разработчика) --- */
(function () {
    // Получение сохранений из памяти ТВ
    function getSaves() {
        try { return JSON.parse(localStorage.getItem('lampa_saves') || '[]'); } 
        catch(e) { return []; }
    }

    // 1. Кнопка "Сохранить" в меню (работает нативно)
    var timerSelect = setInterval(function() {
        if (window.Lampa && window.Lampa.Select) {
            clearInterval(timerSelect); // Нашли меню — убиваем таймер
            
            var old_show = Lampa.Select.show;
            Lampa.Select.show = function(params) {
                var el = $('.focus, .selector.focus').closest('[data-element], [data-item], .selector');
                var d = el.data('element') || el.data('item') || el.data('torrent') || params.data;
                var mag = d ? (d.magnet || '') : '';
                if (!mag && d && (d.hash || d.btih)) mag = 'magnet:?xt=urn:btih:' + (d.hash || d.btih);

                if (mag) {
                    params.items.push({ title: '💾 Сохранить', action: 'my_save' });
                    var old_sel = params.onSelect;
                    
                    params.onSelect = function(a) {
                        if (a && a.action === 'my_save') {
                            var list = getSaves();
                            var act = Lampa.Activity.active() ? (Lampa.Activity.active().activity || {}) : {};
                            
                            if (!list.some(function(x){ return x.magnet === mag; })) {
                                list.unshift({
                                    title: act.title || act.name || 'Сохраненный торрент',
                                    img: act.img || act.poster || '',
                                    magnet: mag,
                                    hash: mag.replace(/.*btih:([a-z0-9]+).*/i, '$1'),
                                    stat_string: '💾 Из памяти ТВ'
                                });
                                localStorage.setItem('lampa_saves', JSON.stringify(list));
                                if (Lampa.Noty) Lampa.Noty.show('💾 Сохранено!');
                            } else {
                                if (Lampa.Noty) Lampa.Noty.show('⚠️ Уже есть в списке!');
                            }
                        } else if (old_sel) old_sel(a);
                    };
                }
                return old_show(params);
            };
        }
    }, 500);

    // 2. Подмена каталога (ТОТ САМЫЙ стиль: ждем appready и отключаемся)
    var thisInterval = setInterval(function() {
        if (window.appready && window.Lampa) {
            // Берем правильное имя модуля (Torrserve или Torserver)
            var TS = Lampa.Torrserve || Lampa.Torserver;
            
            if (TS && TS.list && !TS._hooked) {
                TS._hooked = true;
                var old_list = TS.list;
                
                // Подмешиваем наши сохранения из памяти к ответу сервера
                TS.list = function(onSuccess, onError) {
                    var saves = getSaves();
                    old_list(function(server_items) {
                        onSuccess(saves.concat(server_items || []));
                    }, function(err) {
                        if (saves.length > 0) onSuccess(saves);
                        else if (onError) onError(err);
                    });
                };
                
                clearInterval(thisInterval); // Дело сделано — убиваем таймер
            }
        }
    }, 500);

})();
/* --- КОНЕЦ БЛОКА --- */
