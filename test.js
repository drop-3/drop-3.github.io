(function () {
    'use strict';

    // ВРЕМЯ ЗАДЕРЖКИ В МИЛЛИСЕКУНДАХ (1500 = 1.5 секунды)
    var delay_time = 1000; 
    
    var executed = false;

    function reloadStartPage() {
        var active = Lampa.Activity.active();
        if (active) {
            Lampa.Activity.replace(active);
        }
    }

    function init() {
        // Код выполнится только один раз при запуске
        if (executed) return;
        executed = true;

        setTimeout(reloadStartPage, delay_time);
    }

    //  Цикл проверки загрузки приложения
    function checkLampaReady() {
        if (window.appready) {
            init();
        } else {
            setTimeout(checkLampaReady, 250); // Проверяем каждые четверть секунды
        }
    }

    checkLampaReady();

})();
