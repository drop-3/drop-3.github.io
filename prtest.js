// Версия: 2.0
// Описание: Независимый пользовательский Фильтр 2 в боковом меню с сохранением настроек.

(function () {
    'use strict';

    var plugin_version = '2.0';
    var plugin_name = 'Фильтр 2';

    function init() {
        // Уведомление об успешной загрузке версии 2.0
        Lampa.Noty.show('Плагин "' + plugin_name + '" версия ' + plugin_version + ' загружен');

        // Базовые (дефолтные) настройки фильтра
        var defaultState = {
            type: 'movie',
            year: '0',
            rating: '0',
            sort: 'popularity.desc'
        };

        // Словари для отображения красивых названий в меню
        var dictType = { 'movie': 'Фильмы', 'tv': 'Сериалы' };
        var dictSort = { 'popularity.desc': 'Популярные', 'vote_average.desc': 'По высокому рейтингу', 'primary_release_date.desc': 'Новинки' };
        var dictRating = { '0': 'Любой', '5': 'Больше 5', '6': 'Больше 6', '7': 'Больше 7', '8': 'Больше 8' };

        // Генератор списка годов (от текущего до 1990)
        function getYears() {
            var y = { '0': 'Любой' };
            var cur = new Date().getFullYear();
            for (var i = cur; i >= 1990; i--) y[i] = i.toString();
            return y;
        }
        var dictYear = getYears();

        // Загружаем сохраненные настройки (или берем дефолтные, если их нет)
        var currentState = Object.assign({}, defaultState, Lampa.Storage.get('plugin_filter2_state', {}));

        // Функция открытия главного меню нашего Фильтра 2
        function openMainMenu() {
            var items = [
                { title: '🔍 НАЧАТЬ ПОИСК', id: 'search' },
                { title: '🎬 Тип: ' + dictType[currentState.type], id: 'type' },
                { title: '📅 Год: ' + dictYear[currentState.year], id: 'year' },
                { title: '⭐️ Рейтинг: ' + dictRating[currentState.rating], id: 'rating' },
                { title: '↕️ Сортировка: ' + dictSort[currentState.sort], id: 'sort' },
                { title: '💾 Сохранить как по умолчанию', id: 'save' },
                { title: '🗑 Очистить настройки (Сброс)', id: 'clear' }
            ];

            // Используем нативный Lampa.Select (идеально работает с пультами)
            Lampa.Select.show({
                title: 'Настройки: Фильтр 2',
                items: items,
                onSelect: function (a) {
                    if (a.id === 'search') {
                        doSearch(currentState);
                    } else if (a.id === 'save') {
                        Lampa.Storage.set('plugin_filter2_state', currentState);
                        Lampa.Noty.show('Настройки Фильтр 2 успешно сохранены!');
                        setTimeout(openMainMenu, 50); // Возвращаемся в меню
                    } else if (a.id === 'clear') {
                        currentState = Object.assign({}, defaultState);
                        Lampa.Storage.set('plugin_filter2_state', currentState);
                        Lampa.Noty.show('Настройки сброшены по умолчанию!');
                        setTimeout(openMainMenu, 50); // Возвращаемся в меню
                    } else {
                        openSubMenu(a.id); // Открываем подменю для выбора (Год, Тип и т.д.)
                    }
                },
                onBack: function () {
                    Lampa.Controller.toggle('menu'); // При возврате фокус уходит обратно в левое меню
                }
            });
        }

        // Функция открытия подменю для выбора конкретного параметра
        function openSubMenu(type) {
            var items = [];
            var dict = {};
            var currentVal = currentState[type];

            if (type === 'type') dict = dictType;
            if (type === 'year') dict = dictYear;
            if (type === 'rating') dict = dictRating;
            if (type === 'sort') dict = dictSort;

            for (var k in dict) {
                items.push({
                    title: dict[k],
                    value: k,
                    selected: k === currentVal
                });
            }

            Lampa.Select.show({
                title: 'Выберите значение',
                items: items,
                onSelect: function (a) {
                    currentState[type] = a.value; // Обновляем параметр
                    setTimeout(openMainMenu, 50); // Возвращаемся в главное меню фильтра
                },
                onBack: function () {
                    setTimeout(openMainMenu, 50);
                }
            });
        }

        // Функция формирования запроса и открытия страницы с результатами
        function doSearch(params) {
            var baseUrl = 'discover/' + params.type;
            var query = [];
            
            query.push('sort_by=' + params.sort);
            
            if (params.year !== '0') {
                if (params.type === 'movie') query.push('primary_release_year=' + params.year);
                else query.push('first_air_date_year=' + params.year);
            }
            if (params.rating !== '0') {
                query.push('vote_average.gte=' + params.rating);
            }

            var finalUrl = baseUrl + '?' + query.join('&');
            var pageTitle = 'Фильтр 2: ' + (params.type === 'movie' ? 'Фильмы' : 'Сериалы');

            // Даем команду Lampa открыть новую страницу с результатами
            Lampa.Activity.push({
                url: finalUrl,
                title: pageTitle,
                component: 'category',
                page: 1
            });
        }

        // Внедряем кнопку в главное левое меню Lampa
        function addMenuButton() {
            // Защита от двойного добавления
            if ($('.menu__list .filter2-item').length) return;
            
            // Создаем элемент меню с иконкой "воронки"
            var item = $('<li class="menu__item selector filter2-item" data-action="filter2"><div class="menu__ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg></div><div class="menu__text">Фильтр 2</div></li>');
            
            // Обработчик нажатия (enter на пульте или клик мышью)
            item.on('hover:enter click', function () {
                openMainMenu();
            });

            // Добавляем в самый низ основного списка меню
            $('.menu .menu__list').eq(0).append(item);
        }

        // Пытаемся добавить кнопку сразу, если приложение уже готово
        if (window.appready) {
            addMenuButton();
        } else {
            // Либо ждем события готовности
            Lampa.Listener.follow('app', function (e) {
                if (e.type === 'ready') addMenuButton();
            });
        }
    }

    // Точка входа
    if (window.appready) {
        init();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') init();
        });
    }
})();
