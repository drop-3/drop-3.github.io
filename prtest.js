// Версия 1.4 - Исправлен баг с пустым экраном, работает дебаг
(function () {
    'use strict';

    var PLUGIN_VERSION = '1.4';

    if (window.movies_tracker_plugin_loaded === PLUGIN_VERSION) return;
    window.movies_tracker_plugin_loaded = PLUGIN_VERSION;

    var THRESHOLD = 80; 

    function createCustomFolderComponent() {
        Lampa.Component.add('custom_movie_filter', function(params) {
            var component = new Lampa.Interaction(this);
            var html = $('<div></div>');
            var scroll = new Lampa.Scroll({ mask: true, over: true });
            var items = [];
            var _this = this;

            this.build = function() {
                html.empty();
                if (scroll) scroll.destroy();
                scroll = new Lampa.Scroll({ mask: true, over: true });
                items = [];

                var history = Lampa.Storage.get('history', []);
                
                var filtered = history.filter(function(item) {
                    if (item.type === 'tv') return false;

                    var hash = item.hash || Lampa.Utils.hash(item.type ? [item.type, item.id].join('_') : item.id);
                    var view = Lampa.Timeline.view(hash) || {};
                    var progress = parseFloat(view.percent || item.percent || 0);

                    if (params.action === 'watching_now') {
                        return progress < THRESHOLD; 
                    } else if (params.action === 'watched') {
                        return progress >= THRESHOLD;
                    }
                    return false;
                });

                if (filtered.length === 0) {
                    var dbg = "Здесь пока пусто.<br><br><span style='color: #ffc107; font-size: 0.8em;'>[Диагностика для разработчика]</span><br>";
                    dbg += "<span style='font-size: 0.8em;'>Всего записей в истории: " + history.length + "</span><br>";
                    
                    if (history.length > 0) {
                        var first = history[0];
                        var f_hash = first.hash || Lampa.Utils.hash(first.type ? [first.type, first.id].join('_') : first.id);
                        var f_view = Lampa.Timeline.view(f_hash) || {};
                        var p = parseFloat(f_view.percent || first.percent || 0);
                        dbg += "<span style='font-size: 0.8em; color: #aaa;'>Последний элемент: " + (first.title || first.name || 'Без названия') + " (Тип: " + first.type + ", Прогресс плеера: " + p + "%)</span>";
                    }
                    
                    html.append('<div class="empty__body" style="padding: 3em; text-align: center; color: rgba(255,255,255,0.7); font-size: 1.2em;">' + dbg + '</div>');
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
                // ВОТ ЭТА СТРОКА БЫЛА ПОТЕРЯНА В 1.3:
                this.activity.render().find('.activity__body').append(html); 
            };

            this.update = function() {
                _this.build();
                Lampa.Controller.toggle('content');
            };

            this.render = function() {
                return html;
            };

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
            this.destroy = function() {
                if (scroll) scroll.destroy();
                html.remove();
                items.forEach(function(c) { c.destroy(); });
            };
        });
    }

    function addMenuItems() {
        if ($('.menu__item[data-action="watching_now"]').length) return; 

        var svgPlay = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>';
        var svgCheck = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" fill="currentColor"/></svg>';

        var htmlWatching = $('<li class="menu__item selector" data-action="watching_now"><div class="menu__ico">'+svgPlay+'</div><div class="menu__text">Смотрю сейчас</div></li>');
        var htmlWatched = $('<li class="menu__item selector" data-action="watched"><div class="menu__ico">'+svgCheck+'</div><div class="menu__text">Просмотрено</div></li>');

        // Добавлено событие 'click' для тестов с мышки
        htmlWatching.on('hover:enter click', function() {
            Lampa.Activity.push({ url: '', title: 'Смотрю сейчас', component: 'custom_movie_filter', action: 'watching_now' });
        });

        htmlWatched.on('hover:enter click', function() {
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

    function init() {
        createCustomFolderComponent();
        addMenuItems();

        Lampa.Listener.follow('menu', function (e) {
            if (e.type === 'ready' || e.type === 'build') {
                addMenuItems();
            }
        });

        setTimeout(function() {
            Lampa.Noty.show('Плагин v' + PLUGIN_VERSION + ' загружен');
        }, 1000);
    }

    if (window.appready) init();
    else Lampa.Listener.follow('app', function(e) { if (e.type == 'ready') init(); });

})();
