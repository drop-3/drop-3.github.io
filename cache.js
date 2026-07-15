(function () {
    'use strict';

    function startPlugin() {
        if (window.safe_cache_topbar_initialized) return;
        window.safe_cache_topbar_initialized = true;

        // Иконка корзины / очистки для шапки сайта
        var svgIcon = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                          '<path d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86732 19.1425L5 7M10 11V17M14 11V17M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7M4 7H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
                      '</svg>';

        // ЮВЕЛИРНАЯ ОЧИСТКА: Удаляем строго мусор, настройки и избранное НЕ ТРОГАЕМ!
        function clearOnlyCache() {
            var clearedCount = 0;

            // 1. Очищаем кэш постеров и сетевых запросов браузера/ТВ (Cache Storage API)
            if (typeof caches !== 'undefined') {
                caches.keys().then(function (names) {
                    names.forEach(function (name) {
                        caches.delete(name);
                    });
                }).catch(function() {});
            }

            // 2. Очищаем временную сессионную память
            if (typeof sessionStorage !== 'undefined') {
                sessionStorage.clear();
            }

            // 3. Очищаем оперативную память (RAM) самой Lampa
            if (Lampa.Activity && Lampa.Activity.cache) Lampa.Activity.cache = {};
            if (Lampa.Template && Lampa.Template.cache) Lampa.Template.cache = {};

            // 4. Сканируем localStorage и удаляем ТОЛЬКО технический кэш
            // Все слова, которые указывают на временные файлы баз данных и парсеров:
            var cacheKeywords = ['cache', 'tmdb', 'omdb', 'imdb', 'kinopoisk', 'temp', 'hash', 'online_cache', 'parser_cache', 'cub_cache', 'last_search'];
            var keysToRemove = [];

            for (var i = 0; i < localStorage.length; i++) {
                var key = localStorage.key(i);
                if (key) {
                    var lowerKey = key.toLowerCase();
                    // Если в имени ключа есть слово из списка кэша — помечаем на удаление
                    for (var j = 0; j < cacheKeywords.length; j++) {
                        if (lowerKey.indexOf(cacheKeywords[j]) !== -1) {
                            keysToRemove.push(key);
                            break;
                        }
                    }
                }
            }

            // Удаляем найденный мусор
            keysToRemove.forEach(function (key) {
                localStorage.removeItem(key);
                clearedCount++;
            });

            console.log('Бережная очистка кэша завершена. Удалено элементов: ' + clearedCount);
        }

        function addHeaderButton() {
            // Если иконка уже есть, не дублируем
            if ($('.header__action [data-action="topbar_clear_cache"]').length) return;

            // Создаем кнопку. Класс "selector" обязателен для навигации с пульта ТВ!
            var button = $('<div class="header__action-item selector" data-action="topbar_clear_cache" title="Очистить кэш">' + svgIcon + '</div>');

            // Обработчик нажатия (hover:enter — кнопка ОК на пульте, click — для мыши)
            button.on('hover:enter click', function () {
                // 1. Показываем уведомление
                if (Lampa.Noty && Lampa.Noty.show) {
                    Lampa.Noty.show('Только кэш очищен! Перезагрузка...');
                }

                // 2. Запускаем нашу безопасную очистку
                clearOnlyCache();

                // 3. Ждем 1.5 секунды (чтобы вы увидели уведомление, а ТВ успел стереть файлы) и перезагружаем
                setTimeout(function () {
                    window.location.reload();
                }, 1500);
            });

            // Ищем шапку (учитываем стандартную Lampa и различные форки)
            var headerAction = $('.header__action');
            if (!headerAction.length) headerAction = $('.header__right');

            if (headerAction.length) {
                // Добавляем иконку в самое начало списка кнопок в верхнем правом углу
                headerAction.prepend(button);
            }
        }

        // Запускаем отрисовку кнопки
        addHeaderButton();

        // Если форк перерисовывает шапку при переходе по меню — автоматически возвращаем иконку
        Lampa.Controller.listener.follow('toggle', function () {
            setTimeout(addHeaderButton, 200);
        });
    }

    // Надёжный цикл: ждем полной загрузки интерфейса Lampa на ТВ
    var checkInterval = setInterval(function () {
        if (typeof Lampa !== 'undefined' && $('.header__action, .header__right').length) {
            clearInterval(checkInterval);
            startPlugin();
        }
    }, 200);

})();