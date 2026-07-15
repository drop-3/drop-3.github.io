/* --- СТАРТ БЛОКА: Перехват JSON с защитой от дубликатов --- */
(function () {
    'use strict';

    function getSaves() {
        try { return JSON.parse(localStorage.getItem('lampa_my_torrents') || '[]'); } 
        catch(e) { return []; }
    }

    // 1. Кнопка "Сохранить в Лампу" с ПРОВЕРКОЙ НА ДУБЛИКАТЫ
    if (window.Lampa && window.Lampa.Select) {
        var old_show = Lampa.Select.show;
        Lampa.Select.show = function(params) {
            var el = $('.focus, .selector.focus, :focus').closest('.selector, [data-element], [data-item]');
            var d = el.data('injected_torrent_data') || el.data('element') || el.data('item') || el.data('torrent') || el.data('data') || params.data;
            var magnet = '', hash = '';
            
            if (d) {
                hash = d.hash || d.info_hash || d.infoHash || d.btih || '';
                if (hash) magnet = 'magnet:?xt=urn:btih:' + hash.trim();
                else if (d.magnet) magnet = d.magnet;
            }
            
            if (magnet) {
                params.items.push({ title: '💾 Сохранить в Лампу', action: 'save_local' });
                var old_onSelect = params.onSelect;
                
                params.onSelect = function(item) {
                    if (item && item.action === 'save_local') {
                        var list = getSaves();
                        var clean_hash = hash || magnet.replace(/.*btih:([a-zA-Z0-9]+).*/i, '$1');
                        
                        // ЖЕСТКАЯ ПРОВЕРКА: Если такой магнет или хэш уже есть — отмена!
                        var exists = list.some(function(i) {
                            return i.magnet === magnet || (i.hash && i.hash === clean_hash);
                        });

                        if (exists) {
                            if (window.Lampa && Lampa.Noty) Lampa.Noty.show('⚠️ Уже есть в сохраненных!');
                            return;
                        }

                        var act = Lampa.Activity.active() ? (Lampa.Activity.active().activity || {}) : {};
                        
                        list.unshift({
                            title: act.title || act.name || d.title || 'Без названия',
                            poster: act.poster || act.img || act.backdrop || '',
                            img: act.img || act.poster || act.backdrop || '',
                            hash: clean_hash,
                            magnet: magnet,
                            size: 0,
                            loaded_size: 0,
                            torrent_size: 0,
                            stat_string: '💾 Сохранено в ТВ'
                        });
                        
                        localStorage.setItem('lampa_my_torrents', JSON.stringify(list));
                        if (window.Lampa && Lampa.Noty) Lampa.Noty.show('💾 Сохранено в Лампу!');
                    } else if (old_onSelect) {
                        old_onSelect(item);
                    }
                };
            }
            return old_show(params);
        };
    }

    // 2. ПОДМЕНА ДАННЫХ (с защитой от того, что ТоррСервер загрузится позже нас)
    setInterval(function() {
        if (window.Lampa && window.Lampa.Torrserver) {
            // Проверяем главные функции ТоррСервера: list, get, torrents
            ['list', 'get', 'torrents', 'load'].forEach(function(method) {
                var orig = Lampa.Torrserver[method];
                if (typeof orig === 'function' && !orig._my_hook) {
                    
                    Lampa.Torrserver[method] = function(onSuccess, onError) {
                        var saves = getSaves();
                        // Если в нашей памяти есть сохранения — сразу отдаем их Лампе!
                        if (saves.length > 0) {
                            if (typeof onSuccess === 'function') onSuccess(saves);
                            return;
                        }
                        return orig.apply(this, arguments);
                    };
                    
                    Lampa.Torrserver[method]._my_hook = true;
                }
            });
        }
    }, 500);

})();
/* --- КОНЕЦ БЛОКА --- */
