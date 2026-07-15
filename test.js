(function () {
    'use strict';

    // Генератор пунктов меню с иконками (размер 1.2em для идеальной вёрстки в любых форках)
    function createMenuItem(title, svgPath) {
        return '<div class="settings-folder" style="padding:0!important">' +
                   '<div style="width:2.2em;height:1.7em;padding-right:.5em">' +
                       '<svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="currentColor">' +
                           svgPath +
                       '</svg>' +
                   '</div>' +
                   '<div style="font-size:1.3em">' + title + '</div>' +
               '</div>';
    }

    // Иконки SVG только для 5 наших пунктов
    var MENU_ITEMS = {
        exit: createMenuItem('Закрыть приложение', '<path d="M14.5 9.5L9.5 14.5M9.5 9.5L14.5 14.5" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5" fill="none"/>'),
        reboot: createMenuItem('Перезагрузить', '<path d="M11 2a9 9 0 0 0-9 9 9 9 0 0 0 4.68 7.68l1.46-1.46A7 7 0 1 1 18 11a7 7 0 0 1-.79 3.21l1.46 1.46A9 9 0 0 0 11 2z"/>'),
        server: createMenuItem('Сменить сервер', '<path d="M13 21.75V20.25H10v1.5h3zM3.17 19.83l.53-.53H3.7v.53zM21.25 13c0 .41.34.75.75.75s.75-.34.75-.75h-1.5zM10 3.75h4v-1.5h-4v1.5zM2.75 13v-1H1.25v1h1.5zm0-1v-1H1.25v1h1.5zM13 20.25H10v1.5h3v-1.5zm8.25-9v1h1.5v-1h-1.5z"/>'),
        cache: createMenuItem('Очистить кэш', '<path d="M26 20h-6v-2h6zm4 8h-6v-2h6zm-2-4h-6v-2h6z"/><path d="M17.003 20a4.9 4.9 0 0 0-2.404-4.173L22 3l-1.73-1l-7.577 13.126a5.7 5.7 0 0 0-5.243 1.503C3.706 20.24 3.996 28.682 4.01 29.04a1 1 0 0 0 1 .96h14.991a1 1 0 0 0 .6-1.8c-3.54-2.656-3.598-8.146-3.598-8.2"/>'),
        settings: createMenuItem('Настройки', '<path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>')
    };

    // Функция закрытия приложения на разных ТВ
    function exitApp() {
        if (Lampa.Platform.is('webos')) window.location.assign('exit://exit');
        if (Lampa.Platform.is('tizen')) tizen.application.getCurrentApplication().exit();
        if (Lampa.Platform.is('android')) Lampa.Android.exit();
        if (Lampa.Platform.is('orsay')) Lampa.Orsay.exit();
        if (Lampa.Platform.is('netcast')) window.NetCastBack();
        if (Lampa.Platform.is('apple_tv')) window.history.back();
        if (Lampa.Platform.is('nw')) nw.App.quit();
        if (Lampa.Platform.is('browser')) window.close();
    }

    // Смена сервера
    function switchServer() {
        var protocol = location.protocol === 'https:' ? 'https://' : 'http://';
        Lampa.Input.open({
            title: 'Укажите cервер',
            value: '',
            free: true
        }, function (new_host) {
            if (new_host !== '') {
                window.location.href = protocol + new_host;
            } else {
                showBackMenu();
            }
        });
    }

    // Открытие основных настроек Lampa
    function openSettings() {
        if (Lampa.Settings && Lampa.Settings.open) {
            Lampa.Settings.open();
        } else if (Lampa.Controller && Lampa.Controller.toggle) {
            Lampa.Controller.toggle('settings');
        }
    }

    // БЕРЕЖНАЯ ОЧИСТКА: Строго кэш! Настройки, избранное и аккаунты НЕ ТРОГАЕМ!
    function clearOnlyCache() {
        if (typeof caches !== 'undefined') {
            caches.keys().then(function (names) {
                names.forEach(function (name) { caches.delete(name); });
            }).catch(function() {});
        }
        if (typeof sessionStorage !== 'undefined') sessionStorage.clear();
        if (Lampa.Activity && Lampa.Activity.cache) Lampa.Activity.cache = {};
        if (Lampa.Template && Lampa.Template.cache) Lampa.Template.cache = {};

        var cacheKeywords = ['cache', 'tmdb', 'omdb', 'imdb', 'kinopoisk', 'temp', 'hash', 'online_cache', 'parser_cache', 'cub_cache', 'last_search'];
        var keysToRemove = [];
        for (var i = 0; i < localStorage.length; i++) {
            var key = localStorage.key(i);
            if (key) {
                var lowerKey = key.toLowerCase();
                for (var j = 0; j < cacheKeywords.length; j++) {
                    if (lowerKey.indexOf(cacheKeywords[j]) !== -1) {
                        keysToRemove.push(key);
                        break;
                    }
                }
            }
        }
        keysToRemove.forEach(function (key) { localStorage.removeItem(key); });
    }

    // САНИТАР: Превращает старые цифры ('1'/'2') от прошлых тестов в правильные переключатели (true/false)
    function normalizeStorage() {
        var keys = ['back_menu_exit', 'back_menu_reboot', 'back_menu_server', 'back_menu_cache', 'back_menu_settings'];
        keys.forEach(function(key) {
            var val = Lampa.Storage.get(key);
            if (val === '2' || val === 2 || val === 'true') Lampa.Storage.set(key, true);
            if (val === '1' || val === 1 || val === 'false' || val === '0') Lampa.Storage.set(key, false);
        });
    }

    // Умная проверка: если пункт не выключен явно (false), то показываем его!
    function isItemEnabled(key) {
        var val = Lampa.Storage.get(key);
        if (val === false || val === 'false' || val === '0' || val === 0 || val === '1' || val === 1) {
            return false;
        }
        return true;
    }

    var isCustomMenuOpen = false;
    var originalSelectShow;

    // Отображение нашего кастомного меню Выхода
    function showBackMenu() {
        var items = [];

        if (isItemEnabled('back_menu_exit')) items.push({ title: MENU_ITEMS.exit, action: 'exit' });
        if (isItemEnabled('back_menu_reboot')) items.push({ title: MENU_ITEMS.reboot, action: 'reboot' });
        if (isItemEnabled('back_menu_server')) items.push({ title: MENU_ITEMS.server, action: 'server' });
        if (isItemEnabled('back_menu_cache')) items.push({ title: MENU_ITEMS.cache, action: 'cache' });
        if (isItemEnabled('back_menu_settings')) items.push({ title: MENU_ITEMS.settings, action: 'settings' });

        isCustomMenuOpen = true;

        originalSelectShow.call(Lampa.Select, {
            title: 'Выход',
            items: items,
            onBack: function () {
                isCustomMenuOpen = false;
                Lampa.Controller.toggle('content');
            },
            onSelect: function (item) {
                isCustomMenuOpen = false;
                switch (item.action) {
                    case 'exit': exitApp(); break;
                    case 'reboot': location.reload(); break;
                    case 'server': switchServer(); break;
                    case 'cache': 
                        if (Lampa.Noty && Lampa.Noty.show) Lampa.Noty.show('Только кэш очищен! Перезагрузка...');
                        clearOnlyCache(); 
                        setTimeout(function () { window.location.reload(); }, 1500);
                        break;
                    case 'settings': openSettings(); break;
                }
            }
        });
    }

    // Регистрируем настройки с РОДНЫМ переключателем Lampa (type: 'trigger')
    function addSettings() {
        Lampa.SettingsApi.addComponent({
            component: 'back_menu',
            name: 'Меню Выход',
            icon: '<svg width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 20L14 4M18 8L22 12L18 16M6 16L2 12L6 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        });

        var params = [
            { name: 'back_menu_exit', field: 'Закрыть приложение' },
            { name: 'back_menu_reboot', field: 'Перезагрузить' },
            { name: 'back_menu_server', field: 'Сменить сервер' },
            { name: 'back_menu_cache', field: 'Очистить кэш' },
            { name: 'back_menu_settings', field: 'Настройки' }
        ];

        params.forEach(function (param) {
            // type: 'trigger' — это стандартный ползунок/галочка Lampa. Переключается в 1 клик!
            Lampa.SettingsApi.addParam({
                component: 'back_menu',
                param: {
                    name: param.name,
                    type: 'trigger',
                    default: true
                },
                field: {
                    name: param.field,
                    description: 'Отображать в меню выхода'
                }
            });
        });
    }

    // Главная функция инициализации
    function startPlugin() {
        if (window.back_menu_initialized) return;
        window.back_menu_initialized = true;

        normalizeStorage(); // Очищаем память от старых тестов
        originalSelectShow = Lampa.Select.show;

        function init() {
            addSettings();

            // МГНОВЕННЫЙ ПЕРЕХВАТ (До отрисовки, без миганий!)
            Lampa.Select.show = function (params) {
                if (params && params.title && !isCustomMenuOpen) {
                    var title = String(params.title).toLowerCase().trim();
                    var targetTitle = (Lampa.Lang && Lampa.Lang.translate ? Lampa.Lang.translate('title_out') : 'выход').toLowerCase().trim();

                    if (title.indexOf(targetTitle) !== -1 || title.indexOf('выход') !== -1 || title.indexOf('exit') !== -1 || title.indexOf('закрыть') !== -1) {
                        showBackMenu();
                        return;
                    }
                }
                originalSelectShow.apply(this, arguments);
            };
        }

        if (window.appready) {
            init();
        } else {
            Lampa.Listener.follow('app', function (e) {
                if (e.type === 'ready') init();
            });
        }
    }

    // Надёжный цикл загрузки
    var checkInterval = setInterval(function () {
        if (typeof Lampa !== 'undefined' && Lampa.SettingsApi && Lampa.Controller && Lampa.Select) {
            clearInterval(checkInterval);
            startPlugin();
        }
    }, 200);

})();
