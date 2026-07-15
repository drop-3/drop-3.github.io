(function () {
    'use strict';

    // ВРЕМЯ ЗАДЕРЖКИ В МИЛЛИСЕКУНДАХ (4500 = 4.5 секунды)
    var delay_time = 4500; 
    
    var executed = false;

    function init() {
        if (executed) return;
        executed = true;

        // 1. Запоминаем, сколько страниц в истории было в момент старта
        var start_len = (Lampa.Activity.history && Lampa.Activity.history.length) ? Lampa.Activity.history.length : 1;
        
        console.log('SyncRefresh: Таймер 4.5 сек запущен. Стартовый счётчик страниц:', start_len);

        setTimeout(function() {
            var active = Lampa.Activity.active();
            var current_len = (Lampa.Activity.history && Lampa.Activity.history.length) ? Lampa.Activity.history.length : 1;

            // 2. СРАВНИВАЕМ: Если счётчик страниц не изменился — значит, мы всё ещё на стартовой странице!
            if (active && current_len === start_len) {
                console.log('SyncRefresh: Вы на стартовом экране. Перерисовываем историю...');
                Lampa.Activity.replace(active);
            } else {
                console.log('SyncRefresh: Вы ушли в другой каталог (счётчик изменился с ' + start_len + ' на ' + current_len + '). Обновление отменено!');
            }
        }, delay_time);
    }

    // Надежный цикл проверки загрузки
    function checkLampaReady() {
        if (window.appready) {
            init();
        } else {
            setTimeout(checkLampaReady, 250);
        }
    }

    checkLampaReady();

})();
