(function () {
    'use strict';

    // ЕДИНОЕ ВРЕМЯ ЗАДЕРЖКИ ДЛЯ ВСЕХ УСТРОЙСТВ (4500 = 4.5 секунды)
    var delay_time = 4000; 
    
    var executed = false;

    function reloadStartPage() {
        var active = Lampa.Activity.active();
        
        // Проверяем: есть ли страница и не ушли ли мы далеко в меню
        if (active && Lampa.Activity.history && Lampa.Activity.history.length <= 1) {
            console.log('SyncRefresh: 4.5 секунды прошло, перерисовываем страницу...');
            Lampa.Activity.replace(active);
        } else {
            console.log('SyncRefresh: Пользователь уже в другом каталоге, обновление отменено.');
        }
    }

    function init() {
        if (executed) return;
        executed = true;

        console.log('SyncRefresh: Таймер на 4.5 секунды запущен...');
        setTimeout(reloadStartPage, delay_time);
    }

    // Надежный цикл ожидания загрузки интерфейса
    function checkLampaReady() {
        if (window.appready) {
            init();
        } else {
            setTimeout(checkLampaReady, 250);
        }
    }

    checkLampaReady();

})();
