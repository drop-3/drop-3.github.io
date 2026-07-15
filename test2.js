(function () {
    'use strict';

    var executed = false;
    var max_wait_time = 10000; // Максимальное время слежки: 10 секунд (если инет отвалился)
    var check_interval = 500;  // Шаг проверки памяти: каждые 0.5 секунды

    // Базы данных Лампы, куда пишется история просмотров и закладки
    var keys_to_watch = ['history', 'history_watch', 'online_view', 'favorite', 'torrents_history'];

    // Функция: делает текстовый "слепок" (фотографию) текущей истории в памяти
    function getDataSnapshot() {
        var snapshot = '';
        for (var i = 0; i < keys_to_watch.length; i++) {
            snapshot += JSON.stringify(Lampa.Storage.get(keys_to_watch[i], ''));
        }
        return snapshot;
    }

    function init() {
        // Гарантируем, что логика запустится строго 1 раз за сеанс
        if (executed) return;
        executed = true;

        var active = Lampa.Activity.active();
        if (!active) return;

        // 1. Делаем стартовую фотографию памяти при запуске
        var initial_snapshot = getDataSnapshot();
        var elapsed = 0;

        console.log('SyncRefresh: Запущен умный наблюдатель синхронизации...');

        // 2. Запускаем циклическую проверку в фоне
        var watcher = setInterval(function() {
            elapsed += check_interval;

            // Делаем новый слепок и сравниваем со стартовым
            var current_snapshot = getDataSnapshot();

            // ЕСЛИ ПАМЯТЬ ИЗМЕНИЛАСЬ — ПРИШЛА СИНХРОНИЗАЦИЯ!
            if (current_snapshot !== initial_snapshot) {
                clearInterval(watcher); // Мгновенно убиваем таймер, он больше не нужен
                
                var current_active = Lampa.Activity.active();
                var history_length = Lampa.Activity.history ? Lampa.Activity.history.length : 1;
                
                // ПРЕДОХРАНИТЕЛЬ: Обновляем экран, ТОЛЬКО если пользователь всё ещё на стартовой странице
                if (current_active && history_length <= 1) {
                    console.log('SyncRefresh: Синхронизация пришла за ' + (elapsed/1000) + ' сек. Обновляем экран!');
                    Lampa.Activity.replace(current_active);
                } else {
                    console.log('SyncRefresh: Данные обновлены в фоне, но пользователь уже ушел в каталог. Перерисовка экрана отменена, чтобы не мешать.');
                }
            }

            // Если прошло 10 секунд, а ничего не изменилось — прекращаем слежку
            if (elapsed >= max_wait_time) {
                clearInterval(watcher);
                console.log('SyncRefresh: Время истекло. Новых данных нет или история уже актуальна.');
            }

        }, check_interval);
    }

    // БРОНЕЖИЛЕТ: Надежный цикл проверки полной загрузки интерфейса Лампы
    function checkLampaReady() {
        if (window.appready) {
            init();
        } else {
            setTimeout(checkLampaReady, 250); // Ждем четверть секунды и спрашиваем снова
        }
    }

    // Старт работы плагина
    checkLampaReady();

})();