// Версия: 7.1
// Описание: Независимый пользовательский Фильтр 2 с выбором диапазона (Год ОТ и Год ДО) под пульт.

(function () {
    'use strict';

    var plugin_version = '7.1';
    var plugin_name = 'Фильтр 2';

    function init() {
        Lampa.Noty.show('Плагин "' + plugin_name + '" версия ' + plugin_version + ' загружен');

        // Базовые настройки (заменили year на year_from и year_to)
        var defaultState = {
            type: 'movie',
            year_from: '0',
            year_to: '0',
            rating: '0',
            country: '0',
            sort: 'popularity.desc'
        };

        var dictType = { 'movie': 'Фильмы', 'tv': 'Сериалы' };
        var dictSort = { 'popularity.desc': 'Популярные', 'vote_average.desc': 'По высокому рейтингу', 'primary_release_date.desc': 'Новинки' };
        var dictRating = { '0': 'Любой', '5': 'Больше 5', '6': 'Больше 6', '7': 'Больше 7', '8': 'Больше 8' };
        
        var dictCountry = {
            '0': 'Любая',
            'KR': 'Южная Корея',
            'TR': 'Турция',
            'US': 'США',
            'RU': 'Россия',
            'GB': 'Великобритания',
            'JP': 'Япония',
            'TH': 'Таиланд',
            'BR': 'Бразилия',
            'MX': 'Мексика',
            'FR': 'Франция',
            'ES': 'Испания',
            'IN': 'Индия',
            'CN': 'Китай',
            'DE': 'Германия',
            'IT': 'Италия'
        };

        // Генератор годов от текущего до 1950
        function getYears() {
            var y = { '0': 'Любой' };
            var cur = new Date().getFullYear();
            for (var i = cur; i >= 1950; i--) y[i.toString()] = i.toString();
            return y;
        }
        var dictYear = getYears();

        // Если в памяти остался старый формат (year), сбрасываем его на новый
        var savedState = Lampa.Storage.get('plugin_filter2_state', {});
        if (savedState.year) savedState = {}; 
        var currentState = Object.assign({}, defaultState, savedState);

        function openMainMenu() {
            var items = [
                { title: '🔍 НАЧАТЬ ПОИСК', id: 'search' },
                { title: '🎬 Тип: ' + dictType[currentState.type], id: 'type' },
                { title: '🌍 Страна: ' + dictCountry[currentState.country], id: 'country' },
                // Две новые кнопки для диапазона
                { title: '🗓 Год ОТ: ' + dictYear[currentState.year_from], id: 'year_from' },
                { title: '🗓 Год ДО: ' + dictYear[currentState.year_to], id: 'year_to' },
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
            if (type === 'rating') dict = dictRating;
            if (type === 'sort') dict = dictSort;
            if (type === 'country') dict = dictCountry;
            if (type === 'year_from' || type === 'year_to') dict = dictYear; // Используем один список годов

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
            var query = [];
            query.push('sort_by=' + params.sort);
            
            // Логика обработки "Год ОТ" и "Год ДО" для API
            var dateGte = (params.type === 'movie') ? 'primary_release_date.gte=' : 'first_air_date.gte=';
            var dateLte = (params.type === 'movie') ? 'primary_release_date.lte=' : 'first_air_date.lte=';
            var yearExact = (params.type === 'movie') ? 'primary_release_year=' : 'first_air_date_year=';

            if (params.year_from !== '0' && params.year_to !== '0') {
                if (params.year_from === params.year_to) {
                    // Если выбран один и тот же год в обоих пунктах
                    query.push(yearExact + params.year_from);
                } else {
                    // Если выбран диапазон (плагин сам поймет, какое число больше, а какое меньше)
                    var min = Math.min(params.year_from, params.year_to);
                    var max = Math.max(params.year_from, params.year_to);
                    query.push(dateGte + min + '-01-01');
                    query.push(dateLte + max + '-12-31');
                }
            } else if (params.year_from !== '0') {
                // Только ОТ
                query.push(dateGte + params.year_from + '-01-01');
            } else if (params.year_to !== '0') {
                // Только ДО
                query.push(dateLte + params.year_to + '-12-31');
            }
            
            if (params.rating !== '0') {
                query.push('vote_average.gte=' + params.rating);
                query.push('vote_count.gte=50'); 
            } else if (params.sort.indexOf('vote_average') !== -1) {
                query.push('vote_count.gte=50');
            }
            
            if (params.country !== '0') query.push('with_origin_country=' + params.country);

            var finalUrl = 'discover/' + params.type + '?' + query.join('&');
            
            var pageTitle = 'Фильтр 2: ' + dictType[params.type];
            if (params.country !== '0') pageTitle += ' (' + dictCountry[params.country] + ')';

            Lampa.Activity.push({
                url: finalUrl,
                title: pageTitle,
                component: 'category_full',
                source: 'tmdb',
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
