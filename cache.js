(function () {
    'use strict';

    // Защита от повторного запуска плагина
    if (window.cache_cleaner_plugin_loaded) return;
    window.cache_cleaner_plugin_loaded = true;

    // === 1. Иконка "Очистка кэша" (стильная корзина с анимацией обновления) ===
    var clean_icon = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 4H15.5L14.5 3H9.5L8.5 4H5V6H19V4ZM6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V7H6V19ZM8 9H16V19H8V9Z" fill="currentColor"/><path d="M12 11V17M10 13L12 11L14 13" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    // === 2. Функция безопасной очистки ТОЛЬКО кэша ===
    function clearAppCache() {
        // Выводим уведомление Lampa
        if (window.Lampa && Lampa.Noty && Lampa.Noty.show) {
            Lampa.Noty.show('Кэш очищен. Перезагрузка...');
        }

        try {
            // А. Очистка кэша браузера/Service Worker (здесь копятся тяжелые постеры и чанки видео)
            if (window.caches && typeof caches.keys === 'function') {
                caches.keys().then(function (names) {
                    names.forEach(function (name) {
                        caches.delete(name);
                    });
                }).catch(function(e) { console.log(e); });
            }

            // Б. Очистка временной сессионной памяти
            if (window.sessionStorage) {
                sessionStorage.clear();
            }

            // В. Точечная и безопасная очистка мусора в localStorage
            // ВНИМАНИЕ: Мы НЕ трогаем аккаунты, избранное, настройки и список плагинов!
            if (window.localStorage) {
                var keys_to_remove = [];
                for (var i = 0; i < localStorage.length; i++) {
                    var key = localStorage.key(i);
                    if (key) {
                        // Ищем и удаляем только кэш парсеров, постеров, балансеров и временные файлы
                        if (
                            key.indexOf('cache_') === 0 ||
                            key.indexOf('tmdb_') === 0 ||
                            key.indexOf('kp_') === 0 ||
                            key.indexOf('cub_cache_') === 0 ||
                            key.indexOf('parser_cache') === 0 ||
                            key.indexOf('online_cache') === 0 ||
                            key.indexOf('image_cache') === 0 ||
                            key.indexOf('temp_') === 0 ||
                            key.indexOf('lampa_cache') === 0
                        ) {
                            keys_to_remove.push(key);
                        }
                    }
                }
                keys_to_remove.forEach(function(k) {
                    localStorage.removeItem(k);
                });
            }

            // Г. Очистка внутреннего кэша самой Lampa (если доступно)
            if (window.Lampa) {
                if (Lampa.Storage && Lampa.Storage.clearCache) {
                    Lampa.Storage.clearCache();
                } else if (Lampa.Storage && Lampa.Storage.cache && typeof Lampa.Storage.cache.clear === 'function') {
                    Lampa.Storage.cache.clear();
                }
            }
        } catch (e) {
            console.error('Ошибка при очистке кэша Lampa:', e);
        }

        // Задержка 1.5 секунды перед перезагрузкой, чтобы пользователь успел увидеть уведомление
        setTimeout(function () {
            window.location.reload(true);
        }, 1500);
    }

    // === 3. Надежная отрисовка иконки в верхнем баре ===
    function addCacheButton() {
        // Если кнопка уже есть на экране — не дублируем
        if ($('.header__action--cache-cleaner').length) return;

        var actions = $('.header__actions');
        if (actions.length) {
            var btn = $(`<div class="header__action header__action--cache-cleaner" title="Очистить кэш">${clean_icon}</div>`);
            
            btn.on('click', function () {
                clearAppCache();
            });

            // Добавляем иконку в верхнюю панель
            actions.append(btn);
        }
    }

    // === 4. Инициализация и защита от "затыков" с появлением иконки ===
    function initPlugin() {
        addCacheButton();

        // Подстраховка: проверяем панель несколько раз с интервалом, 
        // если вдруг Lampa отрисовала шапку с задержкой или перерисовала интерфейс
        var check_attempts = 0;
        var check_timer = setInterval(function() {
            addCacheButton();
            check_attempts++;
            if ($('.header__action--cache-cleaner').length || check_attempts > 10) {
                clearInterval(check_timer);
            }
        }, 500);
    }

    // Запуск в зависимости от состояния загрузки приложения
    if (window.appready) {
        initPlugin();
    } else {
        if (window.Lampa && Lampa.Listener) {
            Lampa.Listener.follow('app', function (e) {
                if (e.type == 'ready') {
                    initPlugin();
                }
            });
        }
        // Дополнительный fallback для нестандартных или старых сборок
        $(document).ready(function() {
            setTimeout(initPlugin, 1000);
        });
    }

})();
