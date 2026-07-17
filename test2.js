(function () {
    'use strict';

    // 1. ХРАНИЛИЩЕ (Все функции собраны в один объект)
    const Storage = {
        KEY: 'lampa_local_mytorrents',
        getAll() { try { return JSON.parse(localStorage.getItem(this.KEY)) || []; } catch (_) { return []; } },
        save(item) {
            const all = this.getAll();
            if (all.find(t => t.magnet === item.magnet)) { return false; }
            all.push(item);
            localStorage.setItem(this.KEY, JSON.stringify(all));
            return true;
        },
        remove(id) {
            let all = this.getAll();
            all = all.filter(t => t.id !== id);
            localStorage.setItem(this.KEY, JSON.stringify(all));
        }
    };

    // 2. ИНТЕРФЕЙС И КНОПКА
    if (Lampa.Select) {
        const originalShow = Lampa.Select.show;
        Lampa.Select.show = function (params) {
            // Логика добавления кнопки (упрощена)
            if (params.data && (params.data.magnet || params.data.hash)) {
                params.items.push({
                    title: '💾 Сохранить в Лампу',
                    action: 'save_local_torrent'
                });
            }
            const originalOnSelect = params.onSelect;
            params.onSelect = function (item) {
                if (item && item.action === 'save_local_torrent') {
                    const d = params.data;
                    const magnet = d.magnet || (d.hash ? 'magnet:?xt=urn:btih:' + d.hash : '');
                    if (Storage.save({ id: Date.now(), magnet: magnet, movie_title: d.title, torrent_name: d.title })) {
                         Lampa.Noty.show('Сохранено!');
                    } else { Lampa.Noty.show('Уже есть!'); }
                } else if (originalOnSelect) { originalOnSelect(item); }
            };
            return originalShow.call(this, params);
        };
    }

    // 3. КОМПОНЕНТ (Раздел "Мои торренты")
    Lampa.Component.add('mytorrents', {
        onRender() {
            const all = Storage.getAll();
            this.$el.html('<div class="mytorrents__list"></div>');
            const $list = this.$('.mytorrents__list');
            
            all.forEach(item => {
                const card = $(`<div class="mytorrents__card selector" data-id="${item.id}">
                    <div class="mytorrents__info">${item.movie_title}</div>
                </div>`);
                
                card.on('click', () => {
                    // ВОТ ЭТО ЗАПУСКАЕТ ФИЛЬМ
                    Lampa.Player.play({ url: item.magnet, title: item.movie_title });
                });
                
                $list.append(card);
            });
        }
    });

    // 4. МЕНЮ
    Lampa.Menu.add({
        id: 'mytorrents',
        title: 'Мои торренты',
        icon: 'download',
        onClick() { Lampa.Activity.push({ component: 'mytorrents', title: 'Мои торренты' }); }
    });

})();
