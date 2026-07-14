// Версия: 3.0
// Описание: Независимый пользовательский Фильтр 2 в боковом меню с выбором стран и фиксом ошибки базы данных.

(function () {
    'use strict';

    var plugin_version = '3.0';
    var plugin_name = 'Фильтр 2';

    function init() {
        Lampa.Noty.show('Плагин "' + plugin_name + '" версия ' + plugin_version + ' загружен');

        // Базовые настройки фильтра (добавилась country)
        var defaultState = {
            type: 'movie',
            year: '0',
            rating: '0',
            country: '0',
            sort: 'popularity.desc'
        };

        // Словари для отображения
        var dictType = { 'movie': 'Фильмы', 'tv': 'Сериалы' };
        var dictSort = { 'popularity.desc': 'Популярные', 'vote_average.desc': 'По высокому рейтингу', 'primary_release_date.desc': 'Новинки' };
        var dictRating = { '0': 'Любой', '5': 'Больше 5', '6': 'Больше 6', '7': 'Больше 7', '8': 'Больше 8' };
        
        // Словарь стран (используем стандартные коды TMDB/ISO 3166-1)
        var dictCountry = {
            '0': 'Любая',
            'RU': 'Россия',
            'US': 'США',
            'KR': 'Южная Корея',
            'TR': 'Турция',
            'GB': 'Великобритания',
            'JP': 'Япония',
            'FR': 'Франция',
            'ES': 'Испания',
            'IN': 'Индия',
            'CN': 'Китай',
            'DE': 'Германия',
            'IT': 'Италия'
        };

        // Генератор годов
        function getYears() {
            var y = { '0': 'Любой' };
            var cur = new Date().getFullYear();
            for (var i = cur; i >= 1990; i--) y[i] = i.toString();
            return y;
        }
        var dictYear = getYears();

        var currentState = Object.assign({}, defaultState, Lampa.Storage.get('plugin_filter2_state', {}));

        function openMainMenu() {
            var items = [
                { title: '🔍 НАЧАТЬ ПОИСК', id: 'search' },
                { title: '🎬 Тип: ' + dictType[currentState.type], id: 'type' },
                { title: '🌍 Страна: ' + dictCountry[currentState.country], id: 'country' },
                { title: '📅 Год: ' + dictYear[currentState.year], id: 'year' },
                { title: '⭐️ Рейтинг: ' + dictRating[currentState.rating], id: 'rating' },
                { title: '↕️ Сортировка: ' + dictSort[currentState.sort], id: 'sort' },
                { title: '💾 Сохранить как по умолчанию', id: 'save' },
                { title: '🗑 Очистить настройки (Сброс)', id: 'clear' }
            ];

            Lampa.Select.show({
                title: 'Настройки: Фильтр 2',
                items: items,
                onSelect: function (a) {
                    if (a.id === 'search') {
                        doSearch(currentState);
                    } else if (a.id === 'save') {
                        Lampa.Storage.set('plugin_filter2_state', currentState);
                        Lampa.Noty.show('Настройки Фильтр 2 сохранены!');
                        setTimeout(openMainMenu, 50);
                    } else if (a.id === 'clear') {
                        currentState = Object.assign({}, defaultState);
                        Lampa.Storage.set('plugin_filter2_state', currentState);
                        Lampa.Noty.show('Настройки сброшены!');
                        setTimeout(openMainMenu, 50);
                    } else {
                        openSubMenu(a.id);
                    }
                },
                onBack: function () {
                    Lampa.Controller.toggle('menu');
                }
            });
        }

        function openSubMenu(type) {
            var items = [];
            var dict = {};
            var currentVal = currentState[type];

            if (type === 'type') dict = dictType;
            if (type === 'year') dict = dictYear;
            if (type === 'rating') dict = dictRating;
            if (type === 'sort') dict = dictSort;
            if (type === 'country') dict = dictCountry; // Добавили обработку страны

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
                    currentState[type] = a.value;
                    setTimeout(openMainMenu, 50);
                },
                onBack: function () {
                    setTimeout(openMainMenu, 50);
                }
            });
        }

        function doSearch(params) {
            var baseUrl = 'discover/' + params.type;
            var query = [];
            
            query.push('sort_by=' + params.sort);
            
            // Защита от фильмов-мусора с накрученным рейтингом
            if (params.rating !== '0' || params.sort === 'vote_average.desc') {
                query.push('vote_count.gte=50'); 
            }
            
            if (params.year !== '0') {
                if (params.type === 'movie') query.push('primary_release_year=' + params.year);
                else query.push('first_air_date_year=' + params.year);
            }
            if (params.rating !== '0') {
                query.push('vote_average.gte=' + params.rating);
            }
            if (params.country !== '0') {
                query.push('with_origin_country=' + params.country); // Параметр для страны
            }

            var finalUrl = baseUrl + '?' + query.join('&');
            var pageTitle = 'Фильтр 2: ' + dictType[params.type];

            Lampa.Activity.push({
                url: finalUrl,
                title: pageTitle,
                component: 'category',
                source: 'tmdb', // ИСПРАВЛЕНИЕ ОШИБКИ: явно указываем базу данных
                page: 1
            });
        }

        function addMenuButton() {
            if ($('.menu__list .filter2-item').length) return;
            
            var item = $('<li class="menu__item selector filter2-item" data-action="filter2"><div class="menu__ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg></div><div class="menu__text">Фильтр 2</div></li>');
            
            item.on('hover:enter click', function () {
                openMainMenu();
            });

            $('.menu .menu__list').eq(0).append(item);
        }

        if (window.appready) {
            addMenuButton();
        } else {
            Lampa.Listener.follow('app', function (e) {
                if (e.type === 'ready') addMenuButton();
            });
        }
    }

    if (window.appready) {
        init();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') init();
        });
    }
})();
