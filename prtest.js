// Версия 1.2 - Глубокий поиск таймкода, поддержка торрентов и исправление кнопки "Обновить"
(function () {
    'use strict';

    var PLUGIN_VERSION = '1.2';

    // Защита от двойной загрузки
    if (window.movies_tracker_plugin_loaded === PLUGIN_VERSION) return;
    window.movies_tracker_plugin_loaded = PLUGIN_VERSION;

    // Настройка: процент, после которого фильм считается просмотренным
    var THRESHOLD = 80; 

    // 1. Создаем логику новой страницы
    function createCustomFolderComponent() {
        Lampa.Component.add('custom_movie_filter', function(params) {
            var component = new Lampa.Interaction(this);
            var html = $('<div></div>');
            var scroll = new Lampa.Scroll({ mask: true, over: true });
            var items = [];
            var _this = this;

            this.build = function() {
                var history = Lampa.Storage.get('history', []);
                var timeline = Lampa.Storage.get('timeline', {});
                var file_view = Lampa.Storage.get('file_view', {}); // База просмотров для торрентов и некоторых балансеров

                var filtered = history.filter(function(item) {
                    // Надежный фильтр от сериалов (учитываем, что у фильмов не бывает сезонов)
                    var is_tv = item.type === 'tv' || item.number_of_seasons !== undefined || (item.name && !item.title && item.type !== 'movie');
                    if (is_tv) return false;

                    // Глубокий поиск прогресса
                    var progress = 0;
                    var idStr = String(item.id);

                    // Шаг 1: Ищем в стандартном timeline
                    for (var k in timeline) {
                        if (String(k).indexOf(idStr) !== -1 && timeline[k].percent) {
                            progress = timeline[k].percent;
                            if (progress > 0) break;
                        }
                    }

                    // Шаг 2: Если не нашли, ищем в file_view (торренты)
                    if (!progress) {
                        for (var f in file_view) {
                            if (String(f).indexOf(idStr) !== -1 && file_view[f].percent) {
                                progress = file_view[f].percent;
                                if (progress > 0) break;
                            }
                        }
                    }

                    // Шаг 3: Страховочный вариант от самой карточки
                    if (!progress) progress = item.percent || 0;
                    
                    progress = parseFloat(progress) || 0;

                    // Распределение по папкам (теперь включает и 0%, чтобы фильмы не пропадали вникуда)
                    if (params.action === 'watching_now') {
                        return progress < THRESHOLD; 
                    } else if (params.action === 'watched') {
                        return progress >= THRESHOLD;
                    }
                    return false;
                });

                // Отрисовка
                if (filtered.length === 0) {
                    html.append('<div class="empty__body" style="padding: 3em; text-align: center; color: rgba(255,255,255,0.7); font-size: 1.2em;">Здесь пока пусто</div>');
                } else {
                    var body = $('<div class="category-full"></div>');
                    filtered.forEach(function(item) {
                        var card = new Lampa.Card(item, { card_category: true });
                        card.create();
                        
                        card.onEnter = function() {
                            Lampa.Activity.push({
                                url: '',
                                title: item.title || item.name,
                                component: 'full',
                                id: item.id,
                                method: item.type || 'movie',
                                card: item
                            });
                        };
                        
                        card.onHover = function(target) {
                            scroll.update(card.render());
                        };
                        
                        body.append(card.render());
                        items.push(card);
                    });
                    scroll.append(body);
                    html.append(scroll.render());
                }
            };

            this.create = function() {
                this.activity.loader(true);
                this.build();
                this.activity.loader(false);
                this.activity.render().find('.activity__body').append(html);
            };

            // Полностью рабочая кнопка "Обновить" (перезапускает текущую активность как системная функция Lampa)
            this.update = function() {
                Lampa.Noty.show('Обновление списка...');
                Lampa.Activity.replace({
                    url: params.url,
                    title: params.title,
                    component: params.component,
                    action: params.action
                });
            };

            // Навигация пульта
            this.start = function() {
                Lampa.Controller.add('content', {
                    toggle: function() {
                        Lampa.Controller.collectionSet(html);
                        Lampa.Controller.collectionFocus(items.length ? items[0].render() : false, html);
                    },
                    left: function() {
                        if (Lampa.Platform.is('web') && !window.Navigator.canmove('left')) Lampa.Controller.toggle('menu');
                        else if (window.Navigator.canmove('left')) window.Navigator.move('left');
                        else Lampa.Controller.toggle('menu');
                    },
                    right: function() {
                        if (window.Navigator.canmove('right')) window.Navigator.move('right');
                    },
                    up: function() {
                        if (window.Navigator.canmove('up')) window.Navigator.move('up');
                        else Lampa.Controller.toggle('head'); // Фокус на верхнюю панель с кнопкой Обновить
                    },
                    down: function() {
                        if (window.Navigator.canmove('down')) window.Navigator.move('down');
                    },
                    back: function() {
                        Lampa.Activity.backward();
                    }
                });
                Lampa.Controller.toggle('content');
            };

            this.pause = function() {};
            this.stop = function() {};
            this.render = function() { return html; };
            this.destroy = function() {
                if (scroll) scroll.destroy();
                html.remove();
                items.forEach(function(c) { c.destroy(); });
            };
        });
    }

    // 2. Добавляем кнопки
    function addMenuItems() {
        if ($('.menu__item[data-action="watching_now"]').length) return; 

        var svgPlay = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>';
        var svgCheck = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" fill="currentColor"/></svg>';

        var htmlWatching = $('<li class="menu__item selector" data-action="watching_now"><div class="menu__ico">'+svgPlay+'</div><div class="menu__text">Смотрю сейчас</div></li>');
        var htmlWatched = $('<li class="menu__item selector" data-action="watched"><div class="menu__ico">'+svgCheck+'</div><div class="menu__text">Просмотрено</div></li>');

        htmlWatching.on('hover:enter', function() {
            Lampa.Activity.push({ url: '', title: 'Смотрю сейчас', component: 'custom_movie_filter', action: 'watching_now' });
        });

        htmlWatched.on('hover:enter', function() {
            Lampa.Activity.push({ url: '', title: 'Просмотрено', component: 'custom_movie_filter', action: 'watched' });
        });

        var historyItem = $('.menu__item[data-action="history"]');
        if (historyItem.length) {
            historyItem.after(htmlWatched);
            historyItem.after(htmlWatching);
        } else {
            $('.menu .menu__list').eq(0).append(htmlWatching).append(htmlWatched);
        }
    }

    // 3. Запуск
    function init() {
        createCustomFolderComponent();
        addMenuItems();

        Lampa.Listener.follow('menu', function (e) {
            if (e.type === 'ready' || e.type === 'build') {
                addMenuItems();
            }
        });

        // Уведомление об успешной загрузке
        setTimeout(function() {
            Lampa.Noty.show('Плагин Movies Tracker v' + PLUGIN_VERSION + ' загружен');
        }, 1000);
    }

    if (window.appready) {
        init();
    } else {
        Lampa.Listener.follow('app', function(e) {
            if (e.type == 'ready') init();
        });
    }

})();
