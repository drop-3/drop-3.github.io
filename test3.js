(function () {
    'use strict';

    // Ссылки на внешние сервисы
    var LINKS = {
        youtube: 'https://youtube.com/tv',
        twitch: 'https://webos.tv.twitch.tv',
        rutube: 'https://rutube.ru/tv-release/rutube.server-22.0.0/webos/',
        fork_player: 'http://browser.appfxml.com',
        drm_play: 'https://ott.drm-play.com',
        speedtest: 'http://speedtest.vokino.tv/?R=3'
    };

    // Генератор пунктов меню
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

    // Иконки SVG
    var MENU_ITEMS = {
        exit: createMenuItem('Закрыть приложение', '<path d="M14.5 9.5L9.5 14.5M9.5 9.5L14.5 14.5" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5" fill="none"/>'),
        reboot: createMenuItem('Перезагрузить', '<path d="M11 2a9 9 0 0 0-9 9 9 9 0 0 0 4.68 7.68l1.46-1.46A7 7 0 1 1 18 11a7 7 0 0 1-.79 3.21l1.46 1.46A9 9 0 0 0 11 2z"/>'),
        server: createMenuItem('Сменить сервер', '<path d="M13 21.75V20.25H10v1.5h3zM3.17 19.83l.53-.53H3.7v.53zM21.25 13c0 .41.34.75.75.75s.75-.34.75-.75h-1.5zM10 3.75h4v-1.5h-4v1.5zM2.75 13v-1H1.25v1h1.5zm0-1v-1H1.25v1h1.5zM13 20.25H10v1.5h3v-1.5zm8.25-9v1h1.5v-1h-1.5z"/>'),
        speedtest: createMenuItem('Speed Test', '<path d="M10.45 15.5q.625.625 1.575.588T13.4 15.4L19 7l-8.4 5.6q-.65.45-.712 1.362t.562 1.538M5.1 20q-.55 0-1.012-.238t-.738-.712q-.65-1.175-1-2.437T2 14q0-2.075.788-3.9t2.137-3.175T8.1 4.788T12 4q2.05 0 3.85.775T19 6.888t2.15 3.125t.825 3.837q.025 1.375-.312 2.688t-1.038 2.512q-.275.475-.737.713T18.874 20z"/>'),
        cache: createMenuItem('Очистить кэш', '<path d="M26 20h-6v-2h6zm4 8h-6v-2h6zm-2-4h-6v-2h6z"/><path d="M17.003 20a4.9 4.9 0 0 0-2.404-4.173L22 3l-1.73-1l-7.577 13.126a5.7 5.7 0 0 0-5.243 1.503C3.706 20.24 3.996 28.682 4.01 29.04a1 1 0 0 0 1 .96h14.991a1 1 0 0 0 .6-1.8c-3.54-2.656-3.598-8.146-3.598-8.2"/>'),
        youtube: createMenuItem('YouTube', '<path d="M10 2.3C.172 2.3 0 3.174 0 10s.172 7.7 10 7.7s10-.874 10-7.7s-.172-7.7-10-7.7m3.205 8.034l-4.49 2.096c-.393.182-.715-.022-.715-.456V8.026c0-.433.322-.638.715-.456l4.49 2.096c.393.184.393.484 0 .668"/>'),
        twitch: createMenuItem('Twitch', '<path d="M3.774 2L2.45 5.452v14.032h4.774V22h2.678l2.548-2.548h3.871l5.226-5.226V2zm15.968 11.323l-3 3h-4.743L9.452 18.87v-2.548H5.42V3.774h14.32z"/>'),
        rutube: createMenuItem('RuTube', '<path d="M128.689 47.57H20.396v116.843h30.141V126.4h57.756l26.352 38.013h33.75l-29.058-38.188c9.025-1.401 15.522-4.73 19.493-9.985 3.97-5.255 5.956-13.664 5.956-24.875v-8.759c0-6.657-.721-11.912-1.985-15.941"/>'),
        fork: createMenuItem('ForkPlayer', '<path d="M16.614 25.235v-9.235h3.047l.481-3.06h-3.529v-1.535c0-.798.262-1.56 1.408-1.56h2.291V6.79h-3.252c-2.735 0-3.481 1.801-3.481 4.297v1.852h-1.876v3.062h1.876v9.235z"/>'),
        drm: createMenuItem('DRM Play', '<path d="M46,37H2a1,1,0,0,1-1-1V8A1,1,0,0,1,2,7H46a1,1,0,0,1,1,1V36A1,1,0,0,1,46,37ZM45,9H3V35H45ZM21,16a.975.975,0,0,1,.563.2l7.771,4.872a.974.974,0,0,1,.261,1.715l-7.974,4.981A.982.982,0,0,1,21,28a1,1,0,0,1-1-1V17A1,1,0,0,1,21,16Z"/>')
    };

    // Функция закрытия приложения
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

    // Запуск SpeedTest
    function openSpeedTest() {
        var html = $('<div style="text-align:right;"><div style="min-height:360px;"><iframe id="speedtest-iframe" width="100%" height="100%" frameborder="0"></iframe></div></div>');
        Lampa.Modal.open({
            title: '',
            html: html,
            size: 'medium',
            mask: true,
            onBack: function () {
                Lampa.Modal.close();
                Lampa.Controller.toggle('content');
            }
        });
        document.getElementById('speedtest-iframe').src = LINKS.speedtest;
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

    // Флажок защиты от зацикливания
    var isCustomMenuOpen = false;

    // Отображение нашего кастомного меню Выхода
    function showBackMenu() {
        var items = [];

        if (Lampa.Storage.get('back_menu_exit', '2') !== '1') items.push({ title: MENU_ITEMS.exit, action: 'exit' });
        if (Lampa.Storage.get('back_menu_reboot', '2') !== '1') items.push({ title: MENU_ITEMS.reboot, action: 'reboot' });
        if (Lampa.Storage.get('back_menu_server', '2') !== '1') items.push({ title: MENU_ITEMS.server, action: 'server' });
        if (Lampa.Storage.get('back_menu_speedtest', '2') !== '1') items.push({ title: MENU_ITEMS.speedtest, action: 'speedtest' });
        if (Lampa.Storage.get('back_menu_cache', '2') !== '1') items.push({ title: MENU_ITEMS.cache, action: 'cache' });
        if (Lampa.Storage.get('back_menu_youtube', '2') !== '1') items.push({ title: MENU_ITEMS.youtube, action: 'youtube' });
        if (Lampa.Storage.get('back_menu_twitch', '2') !== '1') items.push({ title: MENU_ITEMS.twitch, action: 'twitch' });
        if (Lampa.Storage.get('back_menu_rutube', '2') !== '1') items.push({ title: MENU_ITEMS.rutube, action: 'rutube' });
        if (Lampa.Storage.get('back_menu_fork', '2') !== '1') items.push({ title: MENU_ITEMS.fork, action: 'fork' });
        if (Lampa.Storage.get('back_menu_drm', '2') !== '1') items.push({ title: MENU_ITEMS.drm, action: 'drm' });

        isCustomMenuOpen = true;

        Lampa.Select.show({
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
                    case 'speedtest': openSpeedTest(); break;
                    case 'cache': 
                        if (Lampa.Noty && Lampa.Noty.show) Lampa.Noty.show('Только кэш очищен! Перезагрузка...');
                        clearOnlyCache(); 
                        setTimeout(function () { window.location.reload(); }, 1500);
                        break;
                    case 'youtube': window.location.href = LINKS.youtube; break;
                    case 'twitch': window.location.href = LINKS.twitch; break;
                    case 'rutube': window.location.href = LINKS.rutube; break;
                    case 'fork': window.location.href = LINKS.fork_player; break;
                    case 'drm': window.location.href = LINKS.drm_play; break;
                }
            }
        });
    }

    // Регистрируем настройки
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
            { name: 'back_menu_speedtest', field: 'Speed Test' },
            { name: 'back_menu_cache', field: 'Очистить кэш' },
            { name: 'back_menu_youtube', field: 'YouTube' },
            { name: 'back_menu_twitch', field: 'Twitch' },
            { name: 'back_menu_rutube', field: 'RuTube' },
            { name: 'back_menu_fork', field: 'ForkPlayer' },
            { name: 'back_menu_drm', field: 'DRM Play' }
        ];

        params.forEach(function (param) {
            Lampa.SettingsApi.addParam({
                component: 'back_menu',
                param: {
                    name: param.name,
                    type: 'select',
                    values: { 1: 'Скрыть', 2: 'Отобразить' },
                    default: '2'
                },
                field: {
                    name: param.field,
                    description: 'Нажмите для выбора'
                }
            });
        });
    }

    // Главная функция инициализации
    function startPlugin() {
        if (window.back_menu_initialized) return;
        window.back_menu_initialized = true;

        function init() {
            addSettings();

            // БЕЗОПАСНЫЙ ПЕРЕХВАТЧИК (Без спам-таймеров и с защитой от вылетов)
            Lampa.Controller.listener.follow('toggle', function (e) {
                if (!e || !e.name) return;
                var ctrlName = String(e.name).toLowerCase();
                
                // Если открылся select И это НЕ наше собственное меню
                if (ctrlName === 'select' && !isCustomMenuOpen) {
                    
                    // Даем ТВ ровно 50мс спокойно достроить окно и скроллбары
                    setTimeout(function () {
                        var titleElem = $('.selectbox__title');
                        if (!titleElem.length) return;
                        
                        var title = titleElem.text().toLowerCase().trim();
                        var targetTitle = (Lampa.Lang && Lampa.Lang.translate ? Lampa.Lang.translate('title_out') : 'выход').toLowerCase().trim();
                        
                        // Если это окно Выхода
                        if (title.indexOf(targetTitle) !== -1 || title.indexOf('выход') !== -1 || title.indexOf('exit') !== -1 || title.indexOf('закрыть') !== -1) {
                            
                            // БРОНЯ TRY...CATCH: закрываем окно безопасно!
                            // Если скролл еще не готов, ошибка проглотится и оранжевый экран НЕ вылезет.
                            try {
                                if (Lampa.Select && Lampa.Select.close) Lampa.Select.close();
                            } catch (err) {
                                console.log('Безопасное закрытие окна:', err);
                            }
                            
                            // Открываем наше меню
                            setTimeout(function () {
                                showBackMenu();
                            }, 50);
                        }
                    }, 50); // 50мс - идеальная пауза для Smart TV
                }
            });
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
