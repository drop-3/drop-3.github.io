/* --- СТАРТ БЛОКА: Финальный минималистичный плагин --- */
(function () {
    'use strict';

    // 1. Работа с локальной памятью (сохранение и получение JSON)
    function getSaves() {
        try { return JSON.parse(localStorage.getItem('lampa_my_torrents') || '[]'); } 
        catch(e) { return []; }
    }

    function addSave(item) {
        var list = getSaves();
        // Проверка на дубликаты
        if (!list.some(function(i) { return i.magnet === item.magnet || (i.hash && i.hash === item.hash); })) {
            list.unshift(item); // Добавляем в начало списка
            localStorage.setItem('lampa_my_torrents', JSON.stringify(list));
            if (window.Lampa && Lampa.Noty) Lampa.Noty.show('💾 Сохранено в Лампу!');
        } else {
            if (window.Lampa && Lampa.Noty) Lampa.Noty.show('Уже есть в сохраненных!');
        }
    }

    // 2. Добавляем кнопку "Сохранить" в контекстное меню раздач
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
                params.items.push({
                    title: '💾 Сохранить в Лампу',
                    action: 'save_local'
                });
                
                var old_onSelect = params.onSelect;
                params.onSelect = function(item) {
                    if (item && item.action === 'save_local') {
                        // ТОТ САМЫЙ НАМЁК: Достаём постер и название из текущей карточки фильма!
                        var act = Lampa.Activity.active();
                        var card = act ? (act.card || act.data || (act.activity ? (act.activity.card || act.activity.data) : null)) : null;
                        var title = card ? (card.title || card.name) : (d.title || 'Без названия');
                        var img = card ? (card.img || card.poster || card.backdrop) : '';
                        
                        addSave({
                            title: title,
                            img: img, // Сохраняем постер
                            magnet: magnet,
                            hash: hash || magnet.replace(/.*btih:([a-zA-Z0-9]+).*/i, '$1')
                        });
                    } else if (old_onSelect) {
                        old_onSelect(item);
                    }
                };
            }
            return old_show(params);
        };
    }

    // 3. ТОТ САМЫЙ НАМЁК: Подменяем сетевой запрос JSON на нашу локальную память!
    function overrideTorrServerData() {
        if (window.Lampa && window.Lampa.Torrserver && !Lampa.Torrserver._my_local_hook) {
            Lampa.Torrserver._my_local_hook = true;
            
            var old_list = Lampa.Torrserver.list;
            Lampa.Torrserver.list = function(onSuccess, onError) {
                // Превращаем наши сохранения в стандартный формат JSON ТоррСервера
                var my_saved_json = getSaves().map(function(item) {
                    return {
                        title: '📁 ' + item.title,
                        img: item.img || '', // Передаём постер Лампе
                        poster: item.img || '',
                        hash: item.hash,
                        magnet: item.magnet,
                        size: 0,
                        loaded_size: 0,
                        torrent_size: 0,
                        stat_string: '💾 Сохранено в памяти ТВ',
                        status: 'local'
                    };
                });
                
                // Запрашиваем данные у сервера и склеиваем: СНАЧАЛА наши сохранения, затем сетевые
                if (old_list) {
                    old_list(function(server_list) {
                        onSuccess(my_saved_json.concat(server_list || []));
                    }, function(err) {
                        // Если ТоррСервер выключен (ошибка сети) — всё равно отдаём наши сохранения!
                        if (my_saved_json.length > 0) onSuccess(my_saved_json);
                        else if (onError) onError(err);
                    });
                } else {
                    onSuccess(my_saved_json);
                }
            };
        }
    }

    // Включаем подмену данных сразу и проверяем через секунду (если ядро Лампы загружалось чуть дольше)
    overrideTorrServerData();
    setTimeout(overrideTorrServerData, 1000);

})();
/* --- КОНЕЦ БЛОКА: Финальный минималистичный плагин --- */
