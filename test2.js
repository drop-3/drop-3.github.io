(function () {
    'use strict';

    var timer = setInterval(function() {
        if (window.Lampa && window.Lampa.Select && window.Lampa.Select.show) {
            clearInterval(timer);
            
            // 1. Проверяем, запустился ли вообще наш плагин
            if (window.Lampa.Noty) window.Lampa.Noty.show('✅ Плагин установлен в память!');

            var orig_show = Lampa.Select.show;
            Lampa.Select.show = function (params) {
                // 2. Сигнализируем, что меню открылось
                if (window.Lampa.Noty) window.Lampa.Noty.show('👀 Открыто меню торрента');

                var magnet = '';

                // ПОПЫТКА 1: Достаем магнит из стандартных параметров (как делает большинство плагинов)
                if (params && params.data) {
                    if (params.data.magnet) magnet = params.data.magnet;
                    else if (params.data.hash || params.data.btih) magnet = 'magnet:?xt=urn:btih:' + (params.data.hash || params.data.btih);
                }

                // ПОПЫТКА 2: Если Попытка 1 пустая, ищем через фокус пульта (Твой Тест №2)
                if (!magnet) {
                    var f = $('.focus, .selector.focus, :focus').closest('.selector, [data-element], [data-item]');
                    if (f.length > 0) {
                        var d = f.data('injected_torrent_data') || f.data('element') || f.data('item') || f.data('torrent') || f.data('data');
                        if (d) {
                            if (d.magnet) magnet = d.magnet;
                            else if (d.hash || d.btih || d.info_hash) magnet = 'magnet:?xt=urn:btih:' + (d.hash || d.btih || d.info_hash);
                        }
                    }
                }

                // 3. Отчитываемся о результатах поиска
                if (magnet) {
                    if (window.Lampa.Noty) window.Lampa.Noty.show('🎯 Магнит найден! Добавляю кнопку.');
                    params.items.push({
                        title: '💾 Сохранить',
                        save_magnet: magnet
                    });
                } else {
                    if (window.Lampa.Noty) window.Lampa.Noty.show('❌ Магнит НЕ найден! Кнопки не будет.');
                }

                var orig_onSelect = params.onSelect;
                params.onSelect = function (item) {
                    if (item && item.save_magnet) {
                        if (window.Lampa.Noty) window.Lampa.Noty.show('💾 Нажали сохранить: ' + item.save_magnet.substring(0, 15) + '...');
                    } else if (orig_onSelect) {
                        orig_onSelect(item);
                    }
                };

                return orig_show.call(this, params);
            };
        }
    }, 500);
})();
