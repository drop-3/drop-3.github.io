(function () {
    'use strict';

    // 1. Достаем наши сохранения из памяти ТВ
    function getSaves() {
        try { return JSON.parse(localStorage.getItem('lampa_my_torrents') || '[]'); } 
        catch(e) { return []; }
    }

    // 2. Кнопка "Сохранить в Лампу" в меню раздачи (надежная, уже проверенная)
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
                        
                        // Проверка на дубликаты
                        if (list.some(function(i) { return i.magnet === magnet || (i.hash && i.hash === clean_hash); })) {
                            if (window.Lampa && Lampa.Noty) Lampa.Noty.show('⚠️ Уже есть в сохраненных!');
                            return;
                        }

                        var act = Lampa.Activity.active() ? (Lampa.Activity.active().activity || {}) : {};
                        
                        // Сохраняем название, постер и магнет (то, про что и говорилось в подсказке)
                        list.unshift({
                            title: act.title || act.name || d.title || 'Без названия',
                            poster: act.poster || act.img || act.backdrop || '',
                            img: act.img || act.poster || act.backdrop || '',
                            hash: clean_hash,
                            magnet: magnet,
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

    // 3. Добавляем наши фильмы к списку торрент-клиента
    function attachToClient() {
        // Проверяем оба варианта имени объекта в Лампе
        var client = window.Lampa && (Lampa.Torrserver || Lampa.Torserver);
        
        if (client && client.list && !client._my_list_hook) {
            client._my_list_hook = true;
            
            var orig_list = client.list;
            client.list = function(onSuccess, onError) {
                var saves = getSaves();
                
                orig_list(function(server_items) {
                    // Склеиваем: сначала наши сохранения, потом то, что в клиенте
                    onSuccess(saves.concat(server_items || []));
                }, function(err) {
                    // Если клиент выдал ошибку — всё равно показываем наши сохранения
                    if (saves.length > 0) onSuccess(saves);
                    else if (onError) onError(err);
                });
            };
        }
    }

    // Запускаем проверку при старте и через секунду, чтобы точно поймать загрузку клиента
    attachToClient();
    setTimeout(attachToClient, 1000);

})();
