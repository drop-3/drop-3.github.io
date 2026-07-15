(function () {
    'use strict';

    // Функция безопасной очистки ТОЛЬКО кэша и мусора
    function clearAppCache() {
        if (window.Lampa && Lampa.Noty && Lampa.Noty.show) {
            Lampa.Noty.show('Кэш очищен. Перезагрузка...');
        }

        try {
            // Очистка кэша браузера
            if (typeof caches !== 'undefined' && caches.keys) {
                caches.keys().then(function (names) {
                    names.forEach(function (name) {
                        caches.delete(name);
                    });
                });
            }
        } catch (e) {}

        try {
            // Очистка сессионной памяти
            if (window.sessionStorage) sessionStorage.clear();
        } catch (e) {}

        try {
            // Точечная очистка мусора в localStorage (настройки, плагины и аккаунт НЕ удаляются)
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

        try {
            // Штатная очистка кэша самой Lampa
            if (window.Lampa && Lampa.Storage && Lampa.Storage.clearCache) {
                Lampa.Storage.clearCache();
            }
        } catch (e) {}

        // Перезагрузка через 1.5 секунды, чтобы успело показаться уведомление
        setTimeout(function () {
            window.location.reload(true);
        }, 1500);
    }

    // Добавление кнопки в верхний бар
    function addTopBarButton() {
        if ($('.bat-top-cache-btn').length) return;
        var head_actions = $('.head__actions');
        if (!head_actions.length) return;

        var btn = $(
            '<div class="head__action selector bat-top-cache-btn" title="Очистить кэш">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 24px; height: 24px;">' +
                    '<path d="M3 6h18"></path>' +
                    '<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>' +
                    '<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>' +
                    '<line x1="10" y1="11" x2="10" y2="17"></line>' +
                    '<line x1="14" y1="11" x2="14" y2="17"></line>' +
                '</svg>' +
            '</div>'
        );

        // Используем ТОЛЬКО hover:enter
        btn.on('hover:enter', function () {
            clearAppCache();
        });

        head_actions.prepend(btn);
    }

    function initTopBarListener() {
        addTopBarButton();
        if (window.Lampa && window.Lampa.Listener) {
            Lampa.Listener.follow('activity', function (e) {
                if (e.type === 'start' || e.type === 'destroy') {
                    setTimeout(addTopBarButton, 200);
                }
            });
        }
    }

    function initAll() {
        initTopBarListener();
    }

    if (!window.plugin_cache_cleaner_ready) {
        window.plugin_cache_cleaner_ready = true;
        if (window.appready || (window.Lampa && window.Lampa.Storage)) initAll();
        else {
            document.addEventListener('lampa:ready', initAll);
            if (window.Lampa && window.Lampa.Listener) {
                Lampa.Listener.follow('app', function (e) {
                    if (e.type === 'ready') initAll();
                });
            }
        }
    }

})();
