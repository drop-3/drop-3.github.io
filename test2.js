(function () {
    'use strict';

    // 1. ХРАНИЛИЩЕ (Фундамент из Теста №2)
    var Storage = {
        KEY: 'lampa_local_torrents',
        get: function() {
            try { var data = localStorage.getItem(this.KEY); return data ? JSON.parse(data) : []; }
            catch (e) { return []; }
        },
        save: function(item) {
            var saved = this.get();
            if (saved.find(function(t) { return t.magnet === item.magnet; })) return false;
            saved.push(item);
            localStorage.setItem(this.KEY, JSON.stringify(saved));
            return true;
        }
    };

    // 2. БЕЗОПАСНАЯ КНОПКА (Фундамент из Теста №2)
    function findMagnet() {
        var f = $('.focus, .selector.focus, :focus').closest('.selector, [data-element], [data-item]');
        var d = f.data('injected_torrent_data') || f.data('element') || f.data('item') || f.data('torrent') || f.data('data');
        if (!d) return null;
        var hash = d.hash || d.info_hash || d.btih;
        return {
            magnet: hash ? 'magnet:?xt=urn:btih:' + hash.trim() : d.magnet,
            title: d.title || d.name || 'Сохраненный торрент'
        };
    }

    if (window.Lampa && Lampa.Select) {
        var orig_show = Lampa.Select.show;
        Lampa.Select.show = function (params) {
            var torrent = findMagnet();
            if (torrent && torrent.magnet) {
                params.items.push({
                    title: '💾 Сохранить в каталог',
                    save_magnet: torrent.magnet,
                    save_title: torrent.title
                });
                var orig_onSelect = params.onSelect;
                params.onSelect = function (item) {
                    if (item && item.save_magnet) {
                        if (Storage.save({ magnet: item.save_magnet, title: item.save_title })) {
                            if(Lampa.Noty) Lampa.Noty.show('Сохранено в каталог!');
                        } else {
                            if(Lampa.Noty) Lampa.Noty.show('Уже есть!');
                        }
                    } else if (orig_onSelect) { orig_onSelect(item); }
                };
            }
            return orig_show.call(this, params);
        };
    }

    // 3. ИНТЕГРАЦИЯ В СТАНДАРТНЫЙ КАТАЛОГ (Работа с "TorrServer.list")
    var timer = setInterval(function() {
        var TS = window.Lampa && (Lampa.TorrServer || Lampa.Torrserve);
        if (TS && TS.list) {
            clearInterval(timer);
            var originalList = TS.list;
            TS.list = function(params, success, error) {
                var onSucc = typeof params === 'function' ? params : success;
                var onErr = typeof params === 'function' ? success : error;
                var p = typeof params === 'function' ? {} : params;

                originalList.call(this, p, function(items) {
                    var local = Storage.get();
                    // Превращаем наши данные в формат Lampa
                    var formatted = local.map(function(t) {
                        return { title: t.title, magnet: t.magnet, stat_string: '💾 Из памяти' };
                    });
                    // Склеиваем массивы
                    onSucc(formatted.concat(items || []));
                }, onErr);
            };
        }
    }, 500);
})();
