/* ============================================================
   Плагин "Локальные торренты" для Lampa (Uncensored)
   Часть 1/4: Хранилище, поиск магнита, контекстное меню
   ============================================================ */

(function () {
    'use strict';

    // ========= 1. УВЕДОМЛЕНИЯ =========
    function notify(msg) {
        if (Lampa && Lampa.Noty) Lampa.Noty.show(msg);
    }

    // ========= 2. ХРАНИЛИЩЕ =========
    const Storage = {
        KEY: 'lampa_local_mytorrents',

        getAll() {
            try {
                return JSON.parse(localStorage.getItem(this.KEY)) || [];
            } catch (_) {
                return [];
            }
        },

        save(item) {
            const all = this.getAll();
            if (all.find(t => t.magnet === item.magnet)) {
                notify('Эта раздача уже сохранена');
                return false;
            }
            all.push({
                id: Date.now(),
                movie_id: item.movie_id || '',
                movie_title: item.movie_title || 'Без названия',
                movie_poster: item.movie_poster || '',
                movie_year: item.movie_year || '',
                magnet: item.magnet,
                torrent_name: item.torrent_name || '',
                torrent_quality: item.torrent_quality || '',
                torrent_size: item.torrent_size || '',
                torrent_seeds: item.torrent_seeds || 0,
                date: Date.now()
            });
            localStorage.setItem(this.KEY, JSON.stringify(all));
            notify('Сохранено в лампу');
            return true;
        },

        remove(id) {
            let all = this.getAll();
            all = all.filter(t => t.id !== id);
            localStorage.setItem(this.KEY, JSON.stringify(all));
            notify('Удалено');
        },

        update(id, newData) {
            const all = this.getAll();
            const idx = all.findIndex(t => t.id === id);
            if (idx !== -1) {
                all[idx] = { ...all[idx], ...newData };
                localStorage.setItem(this.KEY, JSON.stringify(all));
            }
        }
    };

    // ========= 3. ИЗВЛЕЧЕНИЕ ДАННЫХ РАЗДАЧИ =========
    function getTorrentData() {
        // Ищем активный (focus) элемент раздачи
        const $el = $('.focus, .selector.focus, :focus').closest(
            '.selector, [data-element], [data-item], .torrent-item, .torrent_row'
        );
        if (!$el.length) return null;

        // Пробуем вытащить из разных мест
        let data = $el.data('injected_torrent_data')
                || $el.data('element')
                || $el.data('item')
                || $el.data('torrent')
                || $el.data('data')
                || $el[0]?.__torrent;

        if (!data) return null;

        // Извлекаем magnet
        let magnet = '';
        const hash = data.hash || data.info_hash || data.infoHash || data.btih;
        if (hash) {
            magnet = 'magnet:?xt=urn:btih:' + hash.trim();
        } else if (data.magnet && typeof data.magnet === 'string') {
            magnet = data.magnet;
        } else if (typeof data === 'string' && data.startsWith('magnet:')) {
            magnet = data;
        }

        if (!magnet) return null;

        return {
            magnet: magnet,
            torrent_name: data.title || data.name || data.filename || '',
            torrent_quality: data.quality || data.qualityText || '',
            torrent_size: data.size || data.sizeText || data.sizeString || '',
            torrent_seeds: data.seeders || data.seeds || 0
        };
    }

    function getMovieData() {
        try {
            const active = Lampa.Activity.active();
            if (!active) return { movie_id: '', movie_title: 'Неизвестно', movie_poster: '', movie_year: '' };

            const card = active.activity || {};
            return {
                movie_id: card.id || card.kp_id || card.imdb_id || '',
                movie_title: card.title || card.name || 'Неизвестно',
                movie_poster: card.poster || card.img || '',
                movie_year: card.year || ''
            };
        } catch (_) {
            return { movie_id: '', movie_title: 'Неизвестно', movie_poster: '', movie_year: '' };
        }
    }

    // ========= 4. ДОБАВЛЕНИЕ ПУНКТА В КОНТЕКСТНОЕ МЕНЮ РАЗДАЧ =========
    function patchContextMenu() {
        if (!Lampa.Select || !Lampa.Select.show) return;

        const originalShow = Lampa.Select.show;

        Lampa.Select.show = function (params) {
            const torrent = getTorrentData();
            const movie = getMovieData();

            if (torrent && params && params.items) {
                // Добавляем пункт меню
                params.items.push({
                    title: 'Сохранить в лампу',
                    icon: 'download',
                    _custom_action: 'save_local_torrent',
                    _payload: { ...torrent, ...movie }
                });

                // Перехватываем выбор
                const originalOnSelect = params.onSelect;
                params.onSelect = function (item) {
                    if (item && item._custom_action === 'save_local_torrent') {
                        Storage.save(item._payload);
                    } else if (originalOnSelect) {
                        originalOnSelect(item);
                    }
                };
            }

            return originalShow.call(Lampa.Select, params);
        };
    }

    // ========= 5. СТАРТ =========
    if (window.Lampa) {
        patchContextMenu();
    }
})();

/* ============================================================
   Плагин "Локальные торренты" для Lampa (Uncensored)
   Часть 2/4: Раздел в главном меню, компонент mytorrents, шаблон
   ============================================================ */

    // ========= 6. COMPONENT: mytorrents =========
    function buildComponent() {
        if (!Lampa.Component) return;

        Lampa.Component.add('mytorrents', {
            template: `
                <div class="mytorrents">
                    <div class="mytorrents__head">
                        <div class="mytorrents__title">Сохранённые торренты</div>
                        <div class="mytorrents__count"></div>
                    </div>
                    <div class="mytorrents__list scrollbox">
                        <!-- карточки рендерятся динамически -->
                    </div>
                    <div class="mytorrents__empty">
                        <span>Нет сохранённых раздач</span>
                    </div>
                </div>
            `,

            onRender() {
                this.renderList();
            },

            renderList() {
                const all = Storage.getAll();
                const $list = this.$('.mytorrents__list');
                const $empty = this.$('.mytorrents__empty');
                const $count = this.$('.mytorrents__count');

                $list.empty();
                $count.text(all.length ? `Всего: ${all.length}` : '');

                if (!all.length) {
                    $empty.show();
                    $list.hide();
                    return;
                }

                $empty.hide();
                $list.show();

                all.reverse().forEach(item => {
                    $list.append(this.buildCard(item));
                });
            },

            buildCard(item) {
                const poster = item.movie_poster
                    ? `<div class="mytorrents__poster" style="background-image:url('${item.movie_poster}')"></div>`
                    : `<div class="mytorrents__poster mytorrents__poster--empty"></div>`;

                const seeds = item.torrent_seeds
                    ? `<span class="mytorrents__seeds">▲ ${item.torrent_seeds}</span>`
                    : '';

                return $(`
                    <div class="mytorrents__card selector" data-id="${item.id}">
                        ${poster}
                        <div class="mytorrents__info">
                            <div class="mytorrents__movie-title">${item.movie_title}</div>
                            <div class="mytorrents__torrent-name">${item.torrent_name || 'Без названия'}</div>
                            <div class="mytorrents__meta">
                                <span class="mytorrents__quality">${item.torrent_quality || ''}</span>
                                <span class="mytorrents__size">${item.torrent_size || ''}</span>
                                ${seeds}
                            </div>
                        </div>
                    </div>
                `);
            },

            onFocus(item) {
                // заглушка — понадобится в части 3 для контекстного меню
            },

            onClick(item) {
                // заглушка — понадобится в части 3
            },

            destroy() {
                this.$('.mytorrents__list').empty();
            }
        });
    }

    // ========= 7. ДОБАВЛЕНИЕ В ГЛАВНОЕ МЕНЮ =========
    function addToMainMenu() {
        if (!Lampa.Menu || !Lampa.Menu.add) return;

        Lampa.Menu.add({
            id: 'mytorrents',
            title: 'Торренты',
            icon: 'download',
            index: 90,
            onClick() {
                Lampa.Activity.push({
                    url: '',
                    component: 'mytorrents',
                    title: 'Торренты',
                    page: true,
                    clear: true
                });
            }
        });
    }

    buildComponent();
    addToMainMenu();
})();

    // ========= 8. КОНТЕКСТНОЕ МЕНЮ В РАЗДЕЛЕ «ТОРРЕНТЫ» =========
    function getTorrentById(id) {
        return Storage.getAll().find(t => t.id === id);
    }

    function openMovieCard(movieId) {
        if (!movieId) {
            notify('Не удалось открыть карточку — нет ID фильма');
            return;
        }
        // Переход на карточку фильма
        Lampa.Activity.push({
            url: '',
            component: 'full',
            id: movieId,
            title: '',
            page: true
        });
    }

    function showCardContextMenu(cardElement) {
        const id = $(cardElement).data('id');
        const torrent = getTorrentById(id);
        if (!torrent) return;

        const items = [
            {
                title: 'Открыть карточку фильма',
                icon: 'movie',
                action: 'open_movie'
            },
            {
                title: 'Сменить раздачу',
                icon: 'swap',
                action: 'change_torrent'
            },
            {
                title: 'Удалить',
                icon: 'delete',
                action: 'delete'
            }
        ];

        Lampa.Select.show({
            title: torrent.movie_title || 'Торрент',
            items: items,
            onSelect(item) {
                if (!item) return;

                switch (item.action) {
                    case 'open_movie':
                        openMovieCard(torrent.movie_id);
                        break;

                    case 'change_torrent':
                        // Открываем карточку фильма — там юзер выберет новую раздачу
                        openMovieCard(torrent.movie_id);
                        notify('Выберите новую раздачу и сохраните её');
                        break;

                    case 'delete':
                        Lampa.Select.show({
                            title: 'Удалить сохранение?',
                            items: [
                                { title: 'Да, удалить', action: 'confirm_delete' },
                                { title: 'Отмена', action: 'cancel' }
                            ],
                            onSelect(confirmItem) {
                                if (confirmItem && confirmItem.action === 'confirm_delete') {
                                    Storage.remove(torrent.id);
                                    // Обновляем список — триггерим перерисовку компонента
                                    const comp = Lampa.Component.get('mytorrents');
                                    if (comp) comp.renderList();
                                }
                            }
                        });
                        break;
                }
            }
        });
    }

    // ========= 9. ПАТЧ КОМПОНЕНТА — ДОБАВЛЯЕМ ОБРАБОТЧИКИ =========
    function patchComponent() {
        const orig = Lampa.Component.get;
        Lampa.Component.get = function (name) {
            const comp = orig.call(Lampa.Component, name);
            if (name === 'mytorrents' && comp && !comp._patched) {
                comp._patched = true;

                const origOnRender = comp.onRender.bind(comp);
                comp.onRender = function () {
                    origOnRender();
                    // Вешаем контекстное меню на долгое нажатие
                    this.$('.mytorrents__card').off('longpress.torrent').on('longpress.torrent', function () {
                        showCardContextMenu(this);
                    });
                };
            }
            return comp;
        };
    }

    patchComponent();

    // ========= 10. СТИЛИ =========
    function injectStyles() {
        const css = `
            /* Раздел "Торренты" */
            .mytorrents {
                padding: 20px;
                color: #fff;
                height: 100%;
                display: flex;
                flex-direction: column;
            }
            .mytorrents__head {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 16px;
                flex-shrink: 0;
            }
            .mytorrents__title {
                font-size: 22px;
                font-weight: 600;
            }
            .mytorrents__count {
                font-size: 14px;
                opacity: 0.6;
            }
            .mytorrents__list {
                flex: 1;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            .mytorrents__empty {
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                opacity: 0.5;
            }
            .mytorrents__card {
                display: flex;
                gap: 12px;
                background: rgba(255,255,255,0.06);
                border-radius: 12px;
                padding: 10px;
                cursor: pointer;
                transition: background 0.15s;
                align-items: center;
            }
            .mytorrents__card.focus,
            .mytorrents__card:hover {
                background: rgba(255,255,255,0.12);
            }
            .mytorrents__poster {
                width: 60px;
                height: 85px;
                border-radius: 8px;
                background-size: cover;
                background-position: center;
                flex-shrink: 0;
                background-color: rgba(255,255,255,0.08);
            }
            .mytorrents__poster--empty::after {
                content: '🎬';
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100%;
                font-size: 24px;
                opacity: 0.4;
            }
            .mytorrents__info {
                flex: 1;
                min-width: 0;
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            .mytorrents__movie-title {
                font-size: 15px;
                font-weight: 600;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .mytorrents__torrent-name {
                font-size: 13px;
                opacity: 0.7;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .mytorrents__meta {
                display: flex;
                gap: 10px;
                font-size: 12px;
                opacity: 0.5;
                align-items: center;
            }
            .mytorrents__quality {
                background: rgba(255,255,255,0.1);
                padding: 1px 6px;
                border-radius: 4px;
                font-weight: 500;
            }
            .mytorrents__size {
                font-weight: 500;
            }
            .mytorrents__seeds {
                color: #4caf50;
                font-weight: 600;
            }
        `;

        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
    }

    injectStyles();

})();
