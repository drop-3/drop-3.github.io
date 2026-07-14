// Версия: 7.0
// Описание: Независимый пользовательский Фильтр 2 с кастомным двухсторонним ползунком годов.

(function () {
    'use strict';

    var plugin_version = '7.0';
    var plugin_name = 'Фильтр 2';

    function init() {
        Lampa.Noty.show('Плагин "' + plugin_name + '" версия ' + plugin_version + ' загружен');

        // Базовые настройки
        var defaultState = {
            type: 'movie',
            year: '0',
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

        var currentState = Object.assign({}, defaultState, Lampa.Storage.get('plugin_filter2_state', {}));

        // Стили для нашего ползунка
        var sliderCss = `
            .filter2-slider-container { padding: 30px 10px; text-align: center; }
            .filter2-slider-values { font-size: 2.2em; margin-bottom: 40px; font-weight: bold; color: #fff; }
            .filter2-range-wrapper { position: relative; height: 40px; width: 90%; margin: 0 auto; }
            .filter2-range-track { position: absolute; top: 16px; left: 0; right: 0; height: 8px; background: rgba(255,255,255,0.2); border-radius: 4px; z-index: 1; }
            .filter2-range-input { position: absolute; top: 8px; left: 0; width: 100%; pointer-events: none; -webkit-appearance: none; background: transparent; z-index: 2; outline: none; }
            .filter2-range-input::-webkit-slider-thumb { pointer-events: auto; -webkit-appearance: none; width: 24px; height: 24px; background: #fff; border-radius: 50%; cursor: pointer; box-shadow: 0 0 10px rgba(0,0,0,0.5); transition: transform 0.1s; }
            .filter2-range-input::-webkit-slider-thumb:hover, .filter2-range-input.focus::-webkit-slider-thumb { transform: scale(1.3); background: #f39c12; }
            .filter2-btn-row { display: flex; justify-content: center; gap: 20px; margin-top: 50px; }
            .filter2-btn { padding: 12px 24px; border-radius: 8px; font-size: 1.1em; cursor: pointer; background: rgba(255,255,255,0.1); color: #fff; transition: background 0.2s, color 0.2s; }
            .filter2-btn.focus, .filter2-btn:hover { background: #fff; color: #000; }
        `;

        function openMainMenu() {
            // Формируем красивый текст для года
            var yearText = currentState.year === '0' ? 'Любой' : currentState.year.replace('-', ' - ');

            var items = [
                { title: '🔍 НАЧАТЬ ПОИСК', id: 'search' },
                { title: '🎬 Тип: ' + dictType[currentState.type], id: 'type' },
                { title: '🌍 Страна: ' + dictCountry[currentState.country], id: 'country' },
                { title: '📅 Год: ' + yearText, id: 'year' },
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
                    } else if (a.id === 'year') {
                        // Открываем наш кастомный ползунок
                        openYearSlider();
                    } else {
                        openSubMenu(a.id);
                    }
                },
                onBack: function () {
                    Lampa.Controller.toggle('menu');
                }
            });
        }

        // Окно с двухсторонним ползунком
        function openYearSlider() {
            var curYear = new Date().getFullYear();
            var minYear = 1950; // Самый старый год на шкале
            var maxYear = curYear;
            var valMin = minYear;
            var valMax = maxYear;

            // Вытягиваем текущие значения, если они уже были заданы
            if (currentState.year !== '0') {
                if (currentState.year.indexOf('-') !== -1) {
                    var parts = currentState.year.split('-');
                    valMin = Math.min(parts[0], parts[1]);
                    valMax = Math.max(parts[0], parts[1]);
                } else {
                    valMin = currentState.year;
                    valMax = currentState.year;
                }
            }

            var html = $(`
                <div class="filter2-slider-container">
                    <div class="filter2-slider-values"><span id="f2-val-min">${valMin}</span> - <span id="f2-val-max">${valMax}</span></div>
                    <div class="filter2-range-wrapper">
                        <div class="filter2-range-track"></div>
                        <input type="range" id="f2-range-min" class="filter2-range-input selector" min="${minYear}" max="${maxYear}" value="${valMin}">
                        <input type="range" id="f2-range-max" class="filter2-range-input selector" min="${minYear}" max="${maxYear}" value="${valMax}">
                    </div>
                    <div class="filter2-btn-row">
                        <div class="filter2-btn selector save-year">Применить</div>
                        <div class="filter2-btn selector any-year">Любой год</div>
                    </div>
                </div>
            `);

            // Добавляем стили, если их еще нет
            if (!$('#filter2-slider-style').length) {
                $('head').append('<style id="filter2-slider-style">' + sliderCss + '</style>');
            }

            // Логика синхронизации ползунков (всегда показывает МИН - МАКС правильно)
            html.find('#f2-range-min, #f2-range-max').on('input', function() {
                var v1 = parseInt(html.find('#f2-range-min').val());
                var v2 = parseInt(html.find('#f2-range-max').val());
                html.find('#f2-val-min').text(Math.min(v1, v2));
                html.find('#f2-val-max').text(Math.max(v1, v2));
            });

            // Кнопка применить
            html.find('.save-year').on('hover:enter click', function() {
                var min = html.find('#f2-val-min').text();
                var max = html.find('#f2-val-max').text();
                currentState.year = (min === max) ? min : (max + '-' + min);
                Lampa.Modal.close();
                setTimeout(openMainMenu, 50);
            });

            // Кнопка Любой
            html.find('.any-year').on('hover:enter click', function() {
                currentState.year = '0';
                Lampa.Modal.close();
                setTimeout(openMainMenu, 50);
            });

            // Выводим кастомное модальное окно Лампы
            Lampa.Modal.show({
                title: 'Диапазон годов',
                html: html,
                size: 'medium',
                onBack: function() {
                    Lampa.Modal.close();
                    setTimeout(openMainMenu, 50);
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
            
            // Обработка диапазонов дат для сервера TMDB
            if (params.year !== '0') {
                if (params.year.indexOf('-') !== -1) {
                    var years = params.year.split('-');
                    var yearMax = Math.max(years[0], years[1]);
                    var yearMin = Math.min(years[0], years[1]);
                    
                    if (params.type === 'movie') {
                        query.push('primary_release_date.gte=' + yearMin + '-01-01');
                        query.push('primary_release_date.lte=' + yearMax + '-12-31');
                    } else {
                        query.push('first_air_date.gte=' + yearMin + '-01-01');
                        query.push('first_air_date.lte=' + yearMax + '-12-31');
                    }
                } else {
                    // Если выбран конкретный один год
                    if (params.type === 'movie') query.push('primary_release_year=' + params.year);
                    else query.push('first_air_date_year=' + params.year);
                }
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
