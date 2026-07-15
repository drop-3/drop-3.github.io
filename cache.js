(function () {
    'use strict';

    function init() {
        // Иконка очистки
        var icon = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 4H15.5L14.5 3H9.5L8.5 4H5V6H19V4ZM6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V7H6V19ZM8 9H16V19H8V9Z" fill="currentColor"/><path d="M12 11V17M10 13L12 11L14 13" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        
        var button = $(`<div class="header__action" title="Очистить кэш">${icon}</div>`);

        button.on('click', function () {
            Lampa.Noty.show('Кэш очищен. Перезагрузка...');

            if (window.caches) {
                caches.keys().then(function (names) {
                    for (let name of names) caches.delete(name);
                });
            }

            if (window.sessionStorage) {
                sessionStorage.clear();
            }

            for (let i = localStorage.length - 1; i >= 0; i--) {
                let key = localStorage.key(i);
                if (key && (
                    key.indexOf('cache_') === 0 ||
                    key.indexOf('tmdb_') === 0 ||
                    key.indexOf('kp_') === 0 ||
                    key.indexOf('cub_cache_') === 0 ||
                    key.indexOf('parser_cache') === 0 ||
                    key.indexOf('online_cache') === 0 ||
                    key.indexOf('image_cache') === 0 ||
                    key.indexOf('temp_') === 0
                )) {
                    localStorage.removeItem(key);
                }
            }

            if (Lampa.Storage.clearCache) {
                Lampa.Storage.clearCache();
            }

            setTimeout(function () {
                window.location.reload(true);
            }, 1500);
        });

        // Вставляем ровно туда же, куда встает иконка магнита в парсерах
        $('.header__action').last().after(button);
    }

    if (window.appready) init();
    else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type == 'ready') init();
        });
    }
})();
