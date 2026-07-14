(function () {
    'use strict';

    function reloadStartPage() {
        var active = Lampa.Activity.active();
        
        if (active) {
            // Маячок перед самым обновлением
            Lampa.Noty.show('Обновляю страницу...'); 
            
            // Бесшовное обновление текущей страницы
            Lampa.Activity.replace(active);
        } else {
            Lampa.Noty.show('Ошибка: Активная страница не найдена'); 
        }
    }

    function init() {
        // Как только Lampa готова, сразу кидаем маячок
        Lampa.Noty.show('SyncRefresh: Плагин успешно запущен!');
        
        // Ждем 3 секунды (3000 мс) и обновляем
        setTimeout(reloadStartPage, 3000);
    }

    // Надежный цикл проверки готовности приложения (специально для форков)
    function checkLampaReady() {
        if (window.appready) {
            init();
        } else {
            // Если еще не готово, проверяем снова через полсекунды
            setTimeout(checkLampaReady, 500);
        }
    }

    // Запускаем проверку
    checkLampaReady();

})();
