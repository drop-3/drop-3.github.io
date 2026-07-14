(function () {
    'use strict';

    function reloadStartPage() {
        var active = Lampa.Activity.active();
        
        // Проверяем: 
        // 1. Есть ли активная страница
        // 2. Находимся ли мы всё ещё на стартовом экране (пользователь не успел куда-то кликнуть)
        if (active && Lampa.Activity.history && Lampa.Activity.history.length <= 1) {
            console.log('SyncRefresh: Прошло 1.5 сек, перерисовываем стартовую страницу');
            
            // Бесшовно перерисовываем страницу с уже подтянутыми данными
            Lampa.Activity.replace(active);
            
            // Легкое уведомление (строку можно удалить, если будет раздражать)
            Lampa.Noty.show('Данные синхронизированы'); 
        }
    }

    function init() {
        // Запускаем таймер на 1.5 секунды после готовности приложения
        setTimeout(reloadStartPage, 1500);
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
