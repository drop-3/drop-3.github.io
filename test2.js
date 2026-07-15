(function () {
    'use strict';

    // ВРЕМЯ ЗАДЕРЖКИ (в миллисекундах):
    var phone_delay = 1000; // Для смартфонов и ПК (1.5 секунды)
    var tv_delay    = 4500; // Для телевизоров и приставок (4.5 секунды)
    
    var executed = false;

    function init() {
        if (executed) return;
        executed = true;

        // Запоминаем стартовую страницу, которая открылась при запуске
        var start_page = Lampa.Activity.active();
        if (!start_page) return;

        // Определяем тип устройства (Телевизор/Приставка или Смартфон/ПК)
        var is_tv = Lampa.Platform.tv() || /tv|tizen|webos|bravia|box|shield/i.test(navigator.userAgent.toLowerCase());
        var delay = is_tv ? tv_delay : phone_delay;

        console.log('SyncRefresh: Устройство:', is_tv ? 'ТВ/Приставка' : 'Смартфон', '| Задержка:', delay, 'мс');

        // Запускаем таймер
        setTimeout(function() {
            var current_page = Lampa.Activity.active();

            // ПРЕДОХРАНИТЕЛЬ: Обновляем только если пользователь всё ещё на стартовой странице
            if (current_page === start_page) {
                console.log('SyncRefresh: Время пришло, перерисовываем страницу...');
                Lampa.Activity.replace(start_page);
            } else {
                console.log('SyncRefresh: Пользователь ушел с главной страницы, обновление отменено.');
            }
        }, delay);
    }

    // Надежный цикл ожидания загрузки интерфейса (для форков)
    function checkLampaReady() {
        if (window.appready) {
            init();
        } else {
            setTimeout(checkLampaReady, 250);
        }
    }

    checkLampaReady();

})();
