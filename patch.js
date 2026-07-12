(function () {
    'use strict';

    // 1. ТВОЙ СПИСОК ПАРСЕРОВ
    // (Здесь указываем названия и адреса. Если у тебя они берутся из настроек — заменим на твой источник)
    var parsers_list = [
        { name: 'Jackett (Основной)', url: 'http://192.168.1.100:9117' },
        { name: 'TorrServer (Локальный)', url: 'http://127.0.0.1:8090' },
        { name: 'Резервный парсер', url: 'https://backup-parser.example.com' }
    ];

    // Ключ в памяти Lampa, куда сохраняется активный парсер 
    // (в стандартной Lampa это обычно 'jackett_url' или 'parser_url')
    var storage_key = 'jackett_url'; 

    // 2. ФУНКЦИЯ ПРОВЕРКИ ДОСТУПНОСТИ (ПИНГ)
    function checkParserStatus(url, callback) {
        var timer = setTimeout(function () {
            callback(false);
        }, 2500); // Таймаут 2.5 секунды на проверку

        // Используем jQuery, так как он нативно встроен во все версии Lampa
        $.ajax({
            url: url,
            method: 'GET',
            timeout: 2500,
            success: function () {
                clearTimeout(timer);
                callback(true);
            },
            error: function (jqXHR) {
                clearTimeout(timer);
                // Важный нюанс для ТВ: если сервер вернул ошибку (например, 401 или 404), 
                // но статус > 0 — значит сам сервер ЖИВ и доступен по сети!
                if (jqXHR && jqXHR.status > 0) {
                    callback(true);
                } else {
                    callback(false); // Полный тайм-аут или нет сети (CORS/Offline)
                }
            }
        });
    }

    // 3. ОТКРЫТИЕ МЕНЮ С ВЫБОРОМ ПАРСЕРА
    function showParsersMenu() {
        Lampa.Noty.show('Проверяем доступность парсеров...');

        var checked_items = [];
        var completed = 0;

        // Проверяем все парсеры параллельно
        parsers_list.forEach(function (item) {
            checkParserStatus(item.url, function (is_online) {
                completed++;
                
                // Формируем красивую строку состояния с цветным кружком
                var status_dot = is_online ? '<span style="color: #4caf50;">●</span> ' : '<span style="color: #f44336;">●</span> ';
                var status_text = is_online ? '<span style="color: #4caf50; font-size: 0.8em;"> [Доступен]</span>' : '<span style="color: #f44336; font-size: 0.8em;"> [Недоступен]</span>';
                
                checked_items.push({
                    title: status_dot + item.name + status_text,
                    subtitle: item.url,
                    url: item.url,
                    online: is_online,
                    // Помечаем галочкой текущий выбранный в настройках парсер
                    selected: Lampa.Storage.get(storage_key) === item.url
                });

                // Когда все проверены — открываем стандартное меню Lampa
                if (completed === parsers_list.length) {
                    // Сортируем: сначала доступные, потом недоступные
                    checked_items.sort(function (a, b) { return b.online - a.online; });

                    Lampa.Select.show({
                        title: 'Выбор парсера',
                        items: checked_items,
                        onSelect: function (a) {
                            Lampa.Storage.set(storage_key, a.url);
                            Lampa.Noty.show('Активный парсер изменен на: ' + a.title.replace(/<[^>]*>/g, ''));
                        }
                    });
                }
            });
        });
    }

    // 4. ДОБАВЛЕНИЕ КНОПКИ В ВЕРХНИЙ БАР (ШАПКУ)
    function addHeaderButton() {
        // Проверяем, чтобы кнопка не добавилась дважды
        if ($('.parser-switch-btn').length) return;

        var head_actions = $('.head__actions');
        if (!head_actions.length) return;

        // Создаем иконку (SVG в виде серверов)
        // Класс "selector" ОЧЕНЬ ВАЖЕН — без него на кнопку нельзя будет навестись пультом ТВ!
        var btn = $(
            '<div class="head__action selector parser-switch-btn" title="Смена парсера">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 24px; height: 24px;">' +
                    '<rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>' +
                    '<rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>' +
                    '<line x1="6" y1="6" x2="6.01" y2="6"></line>' +
                    '<line x1="6" y1="18" x2="6.01" y2="18"></line>' +
                '</svg>' +
            '</div>'
        );

        // Вешаем обработчик на клик мыши и на кнопку "ОК" на пульте (hover:enter в Lampa)
        btn.on('hover:enter click', function () {
            showParsersMenu();
        });

        // Вставляем кнопку в самое начало блока иконок (или перед поиском)
        head_actions.prepend(btn);
    }

    // 5. ИНИЦИАЛИЗАЦИЯ И СЛЕДЕНИЕ ЗА ИНТЕРФЕЙСОМ
    // Lampa перерисовывает шапку при смене экранов, поэтому следим за активностью
    Lampa.Listener.follow('app', function (e) {
        if (e.type == 'ready') {
            addHeaderButton();
        }
    });

    Lampa.Listener.follow('activity', function (e) {
        if (e.type == 'start' || e.type == 'destroy') {
            setTimeout(addHeaderButton, 200);
        }
    });

    // Если плагин подключился, когда приложение уже загружено
    if (window.appready) {
        addHeaderButton();
    }

})();
