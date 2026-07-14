(function () {
    'use strict';

    function reloadStartPage() {
        var active = Lampa.Activity.active();
        
        // Проверяем: 
        // 1. Есть ли активная страница
        // 2. Находимся ли мы всё ещё на стартовом экране
        if (active && Lampa.Activity.history && Lampa.Activity.history.length <= 1) {
            console.log('SyncRefresh: Прошло 1.5 сек, перерисовываем стартовую страницу');
            
            // МАЯЧОК: Уведомление прямо перед началом обновления
            Lampa.Noty.show('Обновляю стартовую страницу...'); 
            
            // Бесшовно перерисовываем страницу с уже подтянутыми данными
            Lampa.Activity.replace(active);
            
        } else {
            // Маячок на случай, если вы уже ушли со стартовой страницы (для отладки)
            console.log('SyncRefresh: Обновление отменено, вы уже перешли в другой раздел');
        }
    }

    function init() {
        // Запускаем таймер на 1.5 секунды после готовности приложения
        setTimeout(reloadStartPage, 10000);
    }

    // Ждем полной загрузки интерфейса Lampa
    if (window.appready) {
        init();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type == 'ready') {
                init();
            }
        });
    }
})();
