(function () {
    'use strict';

    // 1. ХРАНИЛИЩЕ (Безопасное чтение и запись)
    function getSaves() {
        try { 
            var data = localStorage.getItem('lampa_local_mytorrents');
            return data ? JSON.parse(data) : []; 
        } catch (_) { 
            return []; 
        }
    }

    function saveTorrent(item) {
        var all = getSaves();
        var exists = false;
        for (var i = 0; i < all.length; i++) {
            if (all[i].magnet === item.magnet) { 
                exists = true; 
                break; 
            }
        }
        if (exists) {
            if (window.Lampa && Lampa.Noty) Lampa.Noty.show('⚠️ Уже есть в списке');
            return false;
        }
        all.push(item);
        localStorage.setItem('lampa_local_mytorrents', JSON.stringify(all));
        if (window.Lampa && Lampa.Noty) Lampa.Noty.show('💾 Сохранено в Лампу');
        return true;
    }

    // 2. КНОПКА В МЕНЮ (Ждем готовности Lampa.Select)
    var initSelect = setInterval(function() {
        if (window.Lampa && Lampa.Select && Lampa.Select.show) {
            clearInterval(initSelect);
            var old_show = Lampa.Select.show;
            
            Lampa.Select.show = function (params) {
                var d = params.data || {};
                var magnet = d.magnet || '';
                var hash = d.hash || d.btih || '';
                if (!magnet && hash) magnet = 'magnet:?xt=urn:btih:' + hash;

                if (magnet) {
                    params.items.push({
                        title: '💾 Сохранить в Лампу',
                        action: 'save_local_torrent'
                    });
                }

                var old_onSelect = params.onSelect;
                params.onSelect = function (item) {
                    if (item && item.action === 'save_local_torrent') {
                        var act = Lampa.Activity.active() ? (Lampa.Activity.active().activity || {}) : {};
                        var title = d.title || act.title || act.name || 'Раздача';
                        saveTorrent({
                            id: Date.now(),
                            magnet: magnet,
                            movie_title: title
                        });
                    } else if (old_onSelect) {
                        old_onSelect(item);
                    }
                };
                return old_show.call(this, params);
            };
        }
    }, 500);

    // 3. КОМПОНЕНТ И ГЛАВНОЕ МЕНЮ (Ждем готовности компонентов)
    var initMenu = setInterval(function() {
        if (window.Lampa && Lampa.Component && Lampa.Menu && Lampa.Menu.add) {
            clearInterval(initMenu);

            // Регистрируем компонент "mytorrents"
            Lampa.Component.add('mytorrents', {
                template: '<div class="mytorrents"><div class="mytorrents__list" style="padding: 20px; color: #fff;"></div></div>',
                onRender: function () {
                    var all = getSaves();
                    var list = this.$('.mytorrents__list');
                    list.empty();

                    if (all.length === 0) {
                        list.append('<div style="opacity: 0.5; font-size: 18px; text-align: center; margin-top: 50px;">Нет сохранённых раздач</div>');
                        return;
                    }

                    all.reverse().forEach(function (item) {
                        var card = $('<div class="mytorrents__card selector" style="padding: 15px; margin-bottom: 10px; background: rgba(255,255,255,0.1); border-radius: 8px; cursor: pointer;">' +
                            '<div style="font-size: 16px; font-weight: bold;">' + (item.movie_title || 'Без названия') + '</div>' +
                            '<div style="font-size: 12px; opacity: 0.7; margin-top: 4px; overflow: hidden; text-overflow: ellipsis;">' + (item.magnet || '') + '</div>' +
                            '</div>');

                        card.on('click', function () {
                            if (Lampa.Player && Lampa.Player.play) {
                                Lampa.Player.play({ url: item.magnet, title: item.movie_title });
                            } else {
                                if (Lampa.Noty) Lampa.Noty.show('❌ Ошибка запуска плеера');
                            }
                        });

                        list.append(card);
                    });
                }
            });

            // Добавляем пункт в главное меню
            Lampa.Menu.add({
                id: 'mytorrents',
                title: 'Мои торренты',
                icon: 'download',
                onClick: function () {
                    Lampa.Activity.push({
                        url: '',
                        component: 'mytorrents',
                        title: 'Мои торренты',
                        page: true,
                        clear: true
                    });
                }
            });
        }
    }, 500);

})();
