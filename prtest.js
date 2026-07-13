(function () {
    'use strict';

    // Защита от двойной загрузки
    if (window.movies_tracker_plugin_loaded) return;
    window.movies_tracker_plugin_loaded = true;

    // Настройка: процент, после которого фильм считается просмотренным
    var THRESHOLD = 80; 

    // 1. Создаем логику новой страницы (сетки с фильмами)
    function createCustomFolderComponent() {
        Lampa.Component.add('custom_movie_filter', function(params) {
            var component = new Lampa.Interaction(this);
            var html = $('<div></div>');
            var scroll = new Lampa.Scroll({ mask: true, over: true });
            var items = [];

            this.create = function() {
                this.activity.loader(true);
                
                // Получаем всю историю и данные о прогрессе просмотра
                var history = Lampa.Storage.get('history', []);
                var timeline = Lampa.Storage.get('timeline', {});

                // Фильтруем массив
                var filtered = history.filter(function(item) {
                    // Отсекаем сериалы (оставляем только фильмы)
                    if (item.type === 'tv' || (!item.title && item.name)) return false;

                    // Достаем сохраненный прогресс
                    var hash = item.hash || Lampa.Utils.hash(item.type ? [item.type, item.id].join('_') : item.id);
                    var progressObj = timeline[hash] || timeline[item.id];
                    var progress = progressObj ? progressObj.percent : 0;

                    // Распределяем по папкам
                    if (params.action === 'watching_now') {
                        return progress < THRESHOLD;
                    } else if (params.action === 'watched') {
                        return progress >= THRESHOLD;
                    }
                    return false;
                });

                // Отрисовка интерфейса
                if (filtered.length === 0) {
                    html.append('<div class="empty__body" style="padding: 3em; text-align: center; color: rgba(255,255,255,0.7); font-size: 1.2em;">Здесь пока пусто</div>');
                } else {
                    var body = $('<div class="category-full"></div>'); // Стандартная сетка Lampa
                    filtered.forEach(function(item) {
                        var card = new Lampa.Card(item, { card_category: true });
                        card.create();
                        
                        // Что делать при нажатии на карточку
                        card.onEnter = function() {
                            Lampa.Activity.push({
                                url: '',
                                title: item.title,
                                component: 'full',
                                id: item.id,
                                method: 'movie',
                                card: item
                            });
                        };
                        
                        // Плавный скролл при наведении пультом
                        card.onHover = function(target) {
                            scroll.update(card.render());
                        };
                        
                        body.append(card.render());
                        items.push(card);
                    });
                    scroll.append(body);
                    html.append(scroll.render());
                }

                this.activity.loader(false);
                this.activity.render().find('.activity__body').append(html);
            };

            // Подключаем стандартную навигацию Lampa (пульт)
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
                        else Lampa.Controller.toggle('head');
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
                scroll.destroy();
                html.remove();
                items.forEach(function(c) { c.destroy(); });
            };
        });
    }

    // 2. Добавляем кнопки в боковое меню
    function addMenuItems() {
        if ($('.menu__item[data-action="watching_now"]').length) return; // Чтобы не дублировать

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

        // Вставляем сразу после Истории
        var historyItem = $('.menu__item[data-action="history"]');
        if (historyItem.length) {
            historyItem.after(htmlWatched);
            historyItem.after(htmlWatching);
        } else {
            $('.menu .menu__list').eq(0).append(htmlWatching).append(htmlWatched);
        }
    }

    // 3. Инициализация
    function init() {
        createCustomFolderComponent();
        addMenuItems();

        // Страховка: если Lampa перерисует меню, мы снова добавим наши кнопки
        Lampa.Listener.follow('menu', function (e) {
            if (e.type === 'ready' || e.type === 'build') {
                addMenuItems();
            }
        });
    }

    if (window.appready) {
        init();
    } else {
        Lampa.Listener.follow('app', function(e) {
            if (e.type == 'ready') init();
        });
    }

})();
