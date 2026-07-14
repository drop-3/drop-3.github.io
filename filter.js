// Версия: 8.0
// Описание: Независимый пользовательский Фильтр 2. Комбинированный выбор годов (Шаблоны + ОТ и ДО).

(function () {
    'use strict';

    var plugin_version = '8.0';
    var plugin_name = 'Фильтр 2';

    function init() {
        Lampa.Noty.show('Плагин "' + plugin_name + '" версия ' + plugin_version + ' загружен');

        // Базовые настройки
        var defaultState = {
            type: 'movie',
            year_preset: '0', // Наш шаблонный год (из списка)
            year_from: '0',   // Год ОТ
            year_to: '0',     // Год ДО
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

        var curYear = new Date().getFullYear();

        // 1. Генератор шаблонных годов (как на скриншоте)
        function getYearPresets() {
            var y = { '0': 'Любой' };
            for (var i = curYear; i >= curYear - 4; i--) {
                y[i.toString()] = i.toString();
            }
            var rangeStart = curYear + 1;
            while (rangeStart >= 1937) {
                var rangeEnd = rangeStart - 5;
                var key = rangeStart + '-' + rangeEnd;
                y[key] = key;
                rangeStart = rangeEnd;
            }
            return y;
        }
        var dictYearPreset = getYearPresets();

        // 2. Генератор точных годов для ОТ и ДО
        function getYearsExact() {
            var y = { '0': 'Любой' };
            for (var i = curYear; i >= 1930; i--) y[i.toString()] = i.toString();
            return y;
        }
        var dictYearExact = getYearsExact();

        // Защита от старых версий (сброс памяти при переходе на новые переменные)
        var savedState = Lampa.Storage.get('plugin_filter2_state', {});
        if (savedState.year !== undefined) savedState = {}; 
        var currentState = Object.assign({}, defaultState, savedState);

        function openMainMenu() {
            // Подсказка пользователю, если ОТ и ДО перекрыты главным шаблоном
            var fromDisplay = currentState.year_preset !== '0' ? '(игнорируется)' : dictYearExact[currentState.year_from];
            var toDisplay = currentState.year_preset !== '0' ? '(игнорируется)' : dictYearExact[currentState.year_to];

            var items = [
                { title: '🔍 НАЧАТЬ ПОИСК', id: 'search' },
                { title: '🎬 Тип: ' + dictType[currentState.type], id: 'type' },
                { title: '🌍 Страна: ' + dictCountry[currentState.country], id: 'country' },
                
                // Тройной блок годов
                { title: '📅 Год (шаблоны): ' + dictYearPreset[currentState.year_preset], id: 'year_preset' },
                { title: '🗓 Год ОТ: ' + fromDisplay, id: 'year_from' },
                { title: '🗓 Год ДО: ' + toDisplay, id: 'year_to' },
                
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
            if (type === 'year_preset') dict = dictYearPreset;
            if (type === 'year_from' || type === 'year_to') dict = dictYearExact;

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
            
            // Префиксы дат для API TMDB
            var dateGte = (params.type === 'movie') ? 'primary_release_date.gte=' : 'first_air_date.gte=';
            var dateLte = (params.type === 'movie') ? 'primary_release_date.lte=' : 'first_air_date.lte=';
            var yearExact = (params.type === 'movie') ? 'primary_release_year=' : 'first_air_date_year=';

            var activeYear = '';
            var isRange = false;
            var yMin, yMax;

            // Логика приоритета: проверяем шаблоны
            if (params.year_preset !== '0') {
                if (params.year_preset.indexOf('-') !== -1) {
                    var parts = params.year_preset.split('-');
                    yMin = Math.min(parts[0], parts[1]);
                    yMax = Math.max(parts[0], parts[1]);
                    isRange = true;
                } else {
                    activeYear = params.year_preset; // Если шаблон — это одиночный год (например, 2026)
                }
            } 
            // Если шаблон стоит на "Любой", смотрим на ОТ и ДО
            else if (params.year_from !== '0' || params.year_to !== '0') {
                if (params.year_from !== '0' && params.year_to !== '0') {
                    if (params.year_from === params.year_to) {
                        activeYear = params.year_from;
                    } else {
                        yMin = Math.min(params.year_from, params.year_to);
                        yMax = Math.max(params.year_from, params.year_to);
                        isRange = true;
                    }
                } else if (params.year_from !== '0') {
                    query.push(dateGte + params.year_from + '-01-01');
                } else if (params.year_to !== '0') {
                    query.push(dateLte + params.year_to + '-12-31');
                }
            }

            // Применяем вычисленный год к запросу
            if (isRange) {
                query.push(dateGte + yMin + '-01-01');
                query.push(dateLte + yMax + '-12-31');
            } else if (activeYear !== '') {
                query.push(yearExact + activeYear);
            }
            
            // Рейтинг
            if (params.rating !== '0') {
                query.push('vote_average.gte=' + params.rating);
                query.push('vote_count.gte=50'); 
            } else if (params.sort.indexOf('vote_average') !== -1) {
                query.push('vote_count.gte=50');
            }
            
            // Страна
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
