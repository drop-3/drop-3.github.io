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

    // Иконки SVG только для нужных пунктов
    var MENU_ITEMS = {
        exit: createMenuItem('Закрыть приложение', '<path d="M14.5 9.5L9.5 14.5M9.5 9.5L14.5 14.5" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5" fill="none"/>'),
        reboot: createMenuItem('Перезагрузить', '<path d="M11 2a9 9 0 0 0-9 9 9 9 0 0 0 4.68 7.68l1.46-1.46A7 7 0 1 1 18 11a7 7 0 0 1-.79 3.21l1.46 1.46A9 9 0 0 0 11 2z"/>'),
        server: createMenuItem('Сменить сервер', '<path d="M13 21.75V20.25H10v1.5h3zM3.17 19.83l.53-.53H3.7v.53zM21.25 13c0 .41.34.75.75.75s.75-.34.75-.75h-1.5zM10 3.75h4v-1.5h-4v1.5zM2.75 13v-1H1.25v1h1.5zm0-1v-1H1.25v1h1.5zM13 20.25H10v1.5h3v-1.5zm8.25-9v1h1.5v-1h-1.5z"/>'),
        cache: createMenuItem('Очистить кэш', '<path d="M26 20h-6v-2h6zm4 8h-6v-2h6zm-2-4h-6v-2h6z"/><path d="M17.003 20a4.9 4.9 0 0 0-2.404-4.173L22 3l-1.73-1l-7.577 13.126a5.7 5.7 0 0 0-5.243 1.503C3.706 20.24 3.996 28.682 4.01 29.04a1 1 0 0 0 1 .96h14.991a1 1 0 0 0 .6-1.8c-3.54-2.656-3.598-8.146-3.598-8.2"/>'),
        settings: createMenuItem('Настройки', '<path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>')
    };

    // Функция закрытия приложения на разных ТВ и устройствах
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

    // Флажок, чтобы скрипт не перехватывал сам себя
    var isCustomMenuOpen = false;

    // Сохраняем оригинальную функцию вызова меню
    var originalSelectShow;

    // Отображение нашего кастомного меню Выхода
    function showBackMenu() {
        var items = [];

        // Проверяем настройки (по умолчанию '2' = Отобразить)
        if (Lampa.Storage.get('back_menu_exit', '2') === '2') items.push({ title: MENU_ITEMS.exit, action: 'exit' });
        if (Lampa.Storage.get('back_menu_reboot', '2') === '2') items.push({ title: MENU_ITEMS.reboot, action: 'reboot' });
        if (Lampa.Storage.get('back_menu_server', '2') === '2') items.push({ title: MENU_ITEMS.server, action: 'server' });
        if (Lampa.Storage.get('back_menu_cache', '2') === '2') items.push({ title: MENU_ITEMS.cache, action: 'cache' });
        if (Lampa.Storage.get('back_menu_settings', '2') === '2') items.push({ title: MENU_ITEMS.settings, action: 'settings' });

        isCustomMenuOpen = true;

        // Вызываем сохранённый оригинальный метод без перехвата
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

    // Регистрируем настройки с мгновенным переключением в 1 клик
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
            var currentValue = Lampa.Storage.get(param.name, '2');
            var statusText = currentValue === '2' ? 'Отображается' : 'Скрыто';

            Lampa.SettingsApi.addParam({
                component: 'back_menu',
                param: {
                    name: param.name,
                    type: 'static' // Используем static вместо select, чтобы не вылезало окно выбора
                },
                field: {
                    name: param.field,
                    description: statusText
                },
                onRender: function (item) {
                    // При клике на строку или нажатии ОК на пульте — мгновенно меняем значение
                    item.on('hover:enter click', function () {
                        var val = Lampa.Storage.get(param.name, '2');
                        var newVal = val === '2' ? '1' : '2'; // Меняем 2 на 1 или 1 на 2
                        
                        Lampa.Storage.set(param.name, newVal);
                        
                        // Мгновенно обновляем текст справа
                        var newText = newVal === '2' ? 'Отображается' : 'Скрыто';
                        item.find('.settings-param__descript').text(newText);
                    });
                }
            });
        });
    }

    // Главная функция инициализации
    function startPlugin() {
        if (window.back_menu_initialized) return;
        window.back_menu_initialized = true;

        originalSelectShow = Lampa.Select.show;

        function init() {
            addSettings();

            // МГНОВЕННЫЙ ПЕРЕХВАТ (Monkey Patching):
            // Перехватываем команду рисования меню ДО того, как телевизор начнёт её выполнять!
            Lampa.Select.show = function (params) {
                if (params && params.title && !isCustomMenuOpen) {
                    var title = String(params.title).toLowerCase().trim();
                    var targetTitle = (Lampa.Lang && Lampa.Lang.translate ? Lampa.Lang.translate('title_out') : 'выход').toLowerCase().trim();

                    // Если система пытается открыть меню Выхода
                    if (title.indexOf(targetTitle) !== -1 || title.indexOf('выход') !== -1 || title.indexOf('exit') !== -1 || title.indexOf('закрыть') !== -1) {
                        // Блокируем стандартное окно и мгновенно выводим наше
                        showBackMenu();
                        return;
                    }
                }
                // Если это любое другое меню (например, выбор озвучки) — открываем штатно
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
