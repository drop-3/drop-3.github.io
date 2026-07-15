(function () {
    'use strict';

    function initCacheCleaner() {
        // Удаляем старую кнопку, если ты перезагружаешь или перевключаешь плагин в настройках
        $('.header__action_cache_cleaner').remove();

        // Иконка очистки (метла/корзина) с жёстко заданными размерами, чтобы не пропадала на ТВ
        var icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24" style="width: 1.3em; height: 1.3em;"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>';

        // Создаем кнопку точно так же, как создаётся кнопка магнита в парсерах
        var button = $('<div class="header__action header__action_cache_cleaner" title="Очистить кэш">' + icon + '</div>');

        // Вешаем функцию очистки на клик
        button.on('click', function () {
            // 1. Показываем стандартное уведомление от Lampa
            if (window.Lampa && Lampa.Noty && Lampa.Noty.show) {
                Lampa.Noty.show('Кэш очищен. Перезагрузка...');
            }

            // 2. Очистка кэша браузера / Service Worker (тяжелые постеры и чанки видео)
            try {
                if (typeof caches !== 'undefined' && caches.keys) {
                    caches.keys().then(function (names) {
                        names.forEach(function (name) {
                            caches.delete(name);
                        });
                    });
                }
            } catch (e) {}

            // 3. Очистка временной сессионной памяти
            try {
                if (window.sessionStorage) sessionStorage.clear();
            } catch (e) {}

            // 4. Очистка только кэша и мусора из localStorage (плагины, настройки и аккаунт НЕ удаляются!)
            try {
                if (window.localStorage) {
                    var keys_to_delete = [];
                    for (var i = 0; i < localStorage.length; i++) {
                        var key = localStorage.key(i);
                        if (key && (
                            key.indexOf('cache') !== -1 ||
                            key.indexOf('tmdb') !== -1 ||
                            key.indexOf('kp_') !== -1 ||
                            key.indexOf('cub_cache') !== -1 ||
                            key.indexOf('parser_cache') !== -1 ||
                            key.indexOf('online_cache') !== -1 ||
                            key.indexOf('image_cache') !== -1 ||
                            key.indexOf('temp') !== -1
                        )) {
                            keys_to_delete.push(key);
                        }
                    }
                    for (var j = 0; j < keys_to_delete.length; j++) {
                        localStorage.removeItem(keys_to_delete[j]);
                    }
                }
            } catch (e) {}

            // 5. Очистка внутреннего кэша Lampa
            try {
                if (window.Lampa && Lampa.Storage && Lampa.Storage.clearCache) {
                    Lampa.Storage.clearCache();
                }
            } catch (e) {}

            // 6. Перезагрузка через 1.5 секунды, чтобы успело показаться уведомление
            setTimeout(function () {
                window.location.reload(true);
            }, 1500);
        });

        // Вставляем иконку в верхний бар (ровно туда же, куда вставляется магнит)
        $('.header__actions').append(button);
    }

    // Стандартный запуск Lampa-плагина (точно как в parsers.js)
    if (window.appready) {
        initCacheCleaner();
    } else {
        if (window.Lampa && Lampa.Listener) {
            Lampa.Listener.follow('app', function (e) {
                if (e.type == 'ready') {
                    initCacheCleaner();
                }
            });
        }
    }

})();
