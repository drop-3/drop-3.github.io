/* --- СТАРТ БЛОКА: Финальный перехват JSON --- */
(function () {
    'use strict';

    function getSaves() {
        try { return JSON.parse(localStorage.getItem('lampa_my_torrents') || '[]'); } 
        catch(e) { return []; }
    }

    // 1. Кнопка "Сохранить в Лампу" (с защитой от дубликатов и сохранением постера)
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
                        
                        // Проверка: есть ли уже такой торрент?
                        if (list.some(function(i) { return i.magnet === magnet || (i.hash && i.hash === clean_hash); })) {
                            if (window.Lampa && Lampa.Noty) Lampa.Noty.show('⚠️ Уже есть в сохраненных!');
                            return;
                        }

                        var act = Lampa.Activity.active() ? (Lampa.Activity.active().activity || {}) : {};
                        
                        // Сохраняем название, постер и хэш
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

    // 2. Умный фильтр: распознает любой запрос к ТоррСерверу
    function isTorrServerUrl(url) {
        if (!url || typeof url !== 'string') return false;
        var u = url.toLowerCase();
        
        // Исключаем запросы к базам фильмов (TMDB, CUB и т.д.)
        if (u.indexOf('themoviedb') > -1 || u.indexOf('tmdb') > -1 || u.indexOf('cub.watch') > -1 || u.indexOf('jac.red') > -1) return false;
        
        // Проверяем порты ТоррСервера и стандартные пути API
        if (u.indexOf('8090') > -1 || u.indexOf('8095') > -1 || u.indexOf('torrserver') > -1 || u.indexOf('mytorrents') > -1) return true;
        if (u.indexOf('/echo') > -1 || u.indexOf('/torrents') > -1 || u.indexOf('/list') > -1 || u.indexOf('/view') > -1 || u.indexOf('/stat') > -1) return true;
        
        return false;
    }

    // 3. Перехватчик (работает в фоне, чтобы поймать плагины, загружаемые позже)
    setInterval(function() {
        if (!window.Lampa) return;

        // Перехватываем все сетевые запросы Лампы (Lampa.Network)
        if (Lampa.Network) {
            for (var key in Lampa.Network) {
                if (typeof Lampa.Network[key] === 'function' && !Lampa.Network[key]._my_hook) {
                    (function(method, orig) {
                        Lampa.Network[method] = function(url, onSuccess, onError) {
                            if (isTorrServerUrl(url)) {
                                var saves = getSaves();
                                if (typeof onSuccess === 'function') onSuccess(saves);
                                return;
                            }
                            return orig.apply(this, arguments);
                        };
                        Lampa.Network[method]._my_hook = true;
                    })(key, Lampa.Network[key]);
                }
            }
        }

        // Перехватываем прямые вызовы модулей ТоррСервера (Torrserver, TS, Matrod)
        ['Torrserver', 'TS', 'Matrod', 'TorrServe'].forEach(function(mod_name) {
            var mod = Lampa[mod_name];
            if (mod) {
                for (var k in mod) {
                    if (typeof mod[k] === 'function' && k.match(/list|get|all|torrents|load|echo|view/i) && !mod[k]._my_hook) {
                        (function(method, orig) {
                            mod[method] = function(onSuccess, onError) {
                                var saves = getSaves();
                                if (saves.length > 0 && typeof onSuccess === 'function') {
                                    onSuccess(saves);
                                    return;
                                }
                                return orig.apply(this, arguments);
                            };
                            mod[method]._my_hook = true;
                        })(k, mod[k]);
                    }
                }
            }
        });
    }, 500);

})();
/* --- КОНЕЦ БЛОКА --- */
