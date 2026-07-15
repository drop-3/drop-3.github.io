/* --- СТАРТ БЛОКА: Снайперский перехват JSON (в стиле минимализма) --- */
(function () {
    'use strict';

    function getSaves() {
        try { return JSON.parse(localStorage.getItem('lampa_my_torrents') || '[]'); } 
        catch(e) { return []; }
    }

    // 1. Кнопка "Сохранить в Лампу" в контекстном меню
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
                        var act = Lampa.Activity.active() ? (Lampa.Activity.active().activity || {}) : {};
                        var list = getSaves();
                        
                        // Сохраняем ТОТ САМЫЙ набор: название, постер и хэш!
                        list.unshift({
                            title: act.title || act.name || d.title || 'Без названия',
                            poster: act.poster || act.img || act.backdrop || '',
                            img: act.img || act.poster || act.backdrop || '',
                            hash: hash || magnet.replace(/.*btih:([a-zA-Z0-9]+).*/i, '$1'),
                            magnet: magnet
                        });
                        
                        localStorage.setItem('lampa_my_torrents', JSON.stringify(list));
                        if (window.Lampa && Lampa.Noty) Lampa.Noty.show('💾 Сохранено в Лампу!');
                    } else if (old_onSelect) old_onSelect(item);
                };
            }
            return old_show(params);
        };
    }

    // 2. СНАЙПЕРСКИЙ ПЕРЕХВАТ: подменяем сетевой ответ самой Лампы на нашу локальную память!
    if (window.Lampa && window.Lampa.Network) {
        ['silent', 'get', 'native'].forEach(function(method) {
            var orig = Lampa.Network[method];
            if (!orig) return;
            
            Lampa.Network[method] = function(url, onSuccess, onError) {
                var active = Lampa.Activity.active();
                var is_torrents = active && (active.component === 'torrents' || active.component === 'mytorrents');
                var is_ts_url = typeof url === 'string' && (url.indexOf('echo') > -1 || url.indexOf('torrserver') > -1 || url.indexOf('/torrents/') > -1 || url.indexOf('mytorrents') > -1);
                
                // Если Лампа запрашивает данные для экрана торрентов — вместо сети отдаём наш JSON!
                if (is_torrents || is_ts_url) {
                    var saves = getSaves();
                    if (onSuccess) onSuccess(saves);
                    return;
                }
                return orig.apply(this, arguments);
            };
        });
    }

})();
/* --- КОНЕЦ БЛОКА --- */
