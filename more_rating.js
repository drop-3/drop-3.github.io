(function () {
    'use strict';

    function initPlugin() {
        if (window.bylampa_cards_info_loaded) return;
        window.bylampa_cards_info_loaded = true;

        console.log('byLampa Cards Info: Запуск плагина v7.1 (Глубокий Скан)...');

        if (window.Lampa && Lampa.Noty) {
            Lampa.Noty.show('🎨 byLampa Cards v7.1: Глубокий Скан подключен!');
        }

        // 1. Стили
        var style = document.createElement('style');
        style.innerHTML = `
            .bl-badge {
                position: absolute !important;
                padding: 0.35em 0.6em;
                font-family: sans-serif, Arial, Helvetica;
                font-weight: 700;
                font-size: 0.8em;
                line-height: 1;
                z-index: 100 !important;
                pointer-events: none;
                display: flex;
                align-items: center;
                gap: 0.35em;
                box-shadow: 0 2px 8px rgba(0,0,0,0.6);
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
                transition: all 0.2s ease;
                box-sizing: border-box;
            }

            /* ↖️ Верхний левый: Тип */
            .bl-badge--tl {
                top: 0 !important; left: 0 !important;
                background: rgba(38, 166, 91, 0.85); color: #ffffff;
                border-bottom-right-radius: 10px;
            }

            /* ↗️ Верхний правый: Год */
            .bl-badge--tr {
                top: 0 !important; right: 0 !important;
                background: rgba(20, 20, 20, 0.85); color: #ffffff;
                border-bottom-left-radius: 10px;
            }

            /* ↙️ Нижний левый: Качество */
            .bl-badge--bl {
                bottom: 0 !important; left: 0 !important;
                border-top-right-radius: 10px;
                font-weight: 900; letter-spacing: 0.5px;
            }
            .bl-quality--4k { background: #e5a00d; color: #000000; }
            .bl-quality--fhd { background: #0d5ce5; color: #ffffff; }
            .bl-quality--hd { background: rgba(20, 20, 20, 0.85); color: #ffffff; }
            .bl-quality--cam { background: rgba(150, 30, 30, 0.85); color: #ffffff; }

            /* ↘️ Нижний правый: Рейтинг */
            .bl-badge--br {
                bottom: 0 !important; right: 0 !important;
                background: rgba(20, 20, 20, 0.85); color: #00e5ff;
                border-top-left-radius: 10px; font-size: 0.9em;
            }
            .bl-badge--br .source-label {
                font-size: 0.55em; line-height: 0.9; color: #ffffff;
                opacity: 0.8; display: flex; flex-direction: column;
                text-align: center; font-weight: 600;
            }

            .bl-dot {
                width: 6px; height: 6px; border-radius: 50%; display: inline-block;
            }
            .bl-dot--green { background: #00ff66; box-shadow: 0 0 5px #00ff66; }
            .bl-dot--red { background: #ff3333; box-shadow: 0 0 5px #ff3333; }
        `;
        document.head.appendChild(style);

        // 2. Вспомогательные функции парсинга
        function getYear(data) {
            var date = data.release_date || data.first_air_date || data.year || '';
            return date ? String(date).slice(0, 4) : '';
        }

        function getRating(data) {
            var tmdb = parseFloat(data.vote_average || 0);
            var imdb = parseFloat(data.imdb_rating || data.rating_imdb || 0);
            var kp = parseFloat(data.kp_rating || data.rating_kp || data.kinopoisk_rating || 0);

            if (tmdb > 0) return { val: tmdb.toFixed(1), src: 'TM<br>DB' };
            if (imdb > 0) return { val: imdb.toFixed(1), src: 'IM<br>Db' };
            if (kp > 0) return { val: kp.toFixed(1), src: 'KP' };
            return { val: 'NEW', src: '' };
        }

        // 🚨 АГРЕССИВНЫЙ ПОИСК КАЧЕСТВА (Проверяем 15+ полей и подписей)
        function getQuality(data, domCard) {
            var qStr = '';
            var fields = [
                'quality', 'rip', 'video_quality', 'resolution', 'label', 'tag', 'badge', 
                'release_quality', 'camrip', 'telecine', 'hdrip', 'bdrip', 'webdl', 'webrip', '4k'
            ];
            
            for (var i = 0; i < fields.length; i++) {
                if (data[fields[i]]) qStr += ' ' + String(data[fields[i]]);
            }
            
            // Дополнительно проверяем название фильма и оригинальное название
            qStr += ' ' + (data.name || '') + ' ' + (data.title || '') + ' ' + (data.original_title || '') + ' ' + (data.original_name || '');

            // Проверяем, не создал ли сам byLampa скрытую плашку качества в DOM
            if (domCard && domCard.textContent) {
                var txt = domCard.textContent.toUpperCase();
                if (txt.indexOf('4K') !== -1 || txt.indexOf('UHD') !== -1) qStr += ' 4K';
                else if (txt.indexOf('1080') !== -1 || txt.indexOf('FHD') !== -1) qStr += ' 1080';
                else if (txt.indexOf('720') !== -1 || txt.indexOf('HD') !== -1) qStr += ' 720';
                else if (txt.indexOf('CAM') !== -1 || txt.indexOf('TS') !== -1 || txt.indexOf('ЭКРАН') !== -1) qStr += ' CAM';
            }

            qStr = qStr.toUpperCase();

            if (qStr.indexOf('4K') !== -1 || qStr.indexOf('2160') !== -1 || qStr.indexOf('UHD') !== -1) {
                return { text: '4K', className: 'bl-quality--4k' };
            }
            if (qStr.indexOf('1080') !== -1 || qStr.indexOf('FHD') !== -1 || qStr.indexOf('BDRIP') !== -1 || qStr.indexOf('WEBRIP') !== -1 || qStr.indexOf('WEB-DL') !== -1) {
                return { text: 'FHD', className: 'bl-quality--fhd' };
            }
            if (qStr.indexOf('720') !== -1 || qStr.indexOf('HD') !== -1 || qStr.indexOf('HDRIP') !== -1) {
                return { text: 'HD', className: 'bl-quality--hd' };
            }
            if (qStr.indexOf('CAM') !== -1 || qStr.indexOf('TS') !== -1 || qStr.indexOf('ЭКРАН') !== -1 || qStr.indexOf('TELECINE') !== -1) {
                return { text: 'CAM', className: 'bl-quality--cam' };
            }
            return null;
        }

        function isSeries(data) {
            return data.media_type === 'tv' || Boolean(data.first_air_date) || data.type === 'tv' || data.type === 'serial';
        }

        function getSeriesStatusDot(data) {
            var status = (data.status || '').toLowerCase();
            if (status === 'ended' || status === 'canceled' || status === 'completed' || data.in_production === false) {
                return '<span class="bl-dot bl-dot--red" title="Завершён"></span>';
            }
            if (status === 'returning series' || data.in_production === true || status === 'airing') {
                return '<span class="bl-dot bl-dot--green" title="Продолжается"></span>';
            }
            return '';
        }

        // 3. Извлечение данных карты
        function getCardData(domCard) {
            if (!domCard) return null;
            var nodes = [domCard, domCard.querySelector('.card__view'), domCard.parentNode, domCard.firstElementChild];
            for (var i = 0; i < nodes.length; i++) {
                var n = nodes[i];
                if (!n) continue;
                if (n._data && (n._data.title || n._data.name)) return n._data;
                if (n.data && (n.data.title || n.data.name)) return n.data;
                if (n.item && (n.item.title || n.item.name)) return n.item;
                if (n.card_data && (n.card_data.title || n.card_data.name)) return n.card_data;
                if (n['data-item'] && (n['data-item'].title || n['data-item'].name)) return n['data-item'];
                if (n['data-card'] && (n['data-card'].title || n['data-card'].name)) return n['data-card'];
                if (n.__data && (n.__data.title || n.__data.name)) return n.__data;
                if (n.object && (n.object.title || n.object.name)) return n.object;
            }
            if (window.$ && typeof window.$ === 'function') {
                for (var i = 0; i < nodes.length; i++) {
                    var n = nodes[i];
                    if (!n) continue;
                    try {
                        var jq = $(n);
                        var keys = ['item', 'card', 'data', 'object', 'item-data', 'card-data'];
                        for (var k = 0; k < keys.length; k++) {
                            var d = jq.data(keys[k]);
                            if (d && typeof d === 'object' && (d.title || d.name)) return d;
                        }
                    } catch(e) {}
                }
            }
            return null;
        }

        // 🚨 ФОНОВАЯ ПОДГРУЗКА СТАТУСА СЕРИАЛОВ (Без тормозов для ТВ)
        var statusQueue = [];
        var isProcessingQueue = false;

        function processStatusQueue() {
            if (isProcessingQueue || statusQueue.length === 0) return;
            isProcessingQueue = true;

            var task = statusQueue.shift();
            if (!task || !task.id || !window.Lampa || !Lampa.TMDB) {
                isProcessingQueue = false;
                processStatusQueue();
                return;
            }

            // Делаем тихий запрос к TMDB для узнавания статуса
            var url = 'tv/' + task.id + '?api_key=' + (Lampa.TMDB.key || '4ef0d7355d9ffb5151e987764708ce96') + '&language=ru-RU';
            
            Lampa.TMDB.get(url, function (resp) {
                if (resp && resp.status && task.badgeEl) {
                    task.data.status = resp.status;
                    task.data.in_production = resp.in_production;
                    var dot = getSeriesStatusDot(task.data);
                    if (dot) task.badgeEl.innerHTML = 'Сериал ' + dot;
                }
                setTimeout(function () {
                    isProcessingQueue = false;
                    processStatusQueue();
                }, 200); // Пауза 200мс между запросами, чтобы не нагружать сеть
            }, function () {
                isProcessingQueue = false;
                processStatusQueue();
            });
        }

        // 4. Главное сканирование
        function scanAndApplyBadges() {
            try {
                var cards = document.querySelectorAll('.card');
                if (!cards || cards.length === 0) return;

                for (var i = 0; i < cards.length; i++) {
                    var domCard = cards[i];
                    if (domCard.getAttribute('data-bl-tagged')) continue;

                    var data = getCardData(domCard);
                    if (!data) continue;

                    var view = domCard.querySelector('.card__view') || domCard.querySelector('.card__img') || domCard;
                    if (view.tagName && view.tagName.toLowerCase() === 'img') view = view.parentNode || domCard;

                    domCard.setAttribute('data-bl-tagged', 'true');

                    var nativeVote = view.querySelector('.card__vote');
                    if (nativeVote) nativeVote.style.display = 'none';

                    // --- ↖️ Верхний левый (Тип + статус) ---
                    var tlBadge = document.createElement('div');
                    tlBadge.className = 'bl-badge bl-badge--tl';
                    var dotHtml = '';
                    
                    if (isSeries(data)) {
                        dotHtml = getSeriesStatusDot(data);
                        tlBadge.innerHTML = 'Сериал ' + dotHtml;
                        view.appendChild(tlBadge);

                        // Если статус неизвестен (каталог), ставим в очередь на тихую фоновую проверку!
                        if (!dotHtml && data.id && statusQueue.length < 30) {
                            statusQueue.push({ id: data.id, data: data, badgeEl: tlBadge });
                            processStatusQueue();
                        }
                    } else {
                        tlBadge.innerHTML = 'Фильм';
                        view.appendChild(tlBadge);
                    }

                    // --- ↗️ Верхний правый (Год) ---
                    var year = getYear(data);
                    if (year && year !== '0000') {
                        var trBadge = document.createElement('div');
                        trBadge.className = 'bl-badge bl-badge--tr';
                        trBadge.innerText = year;
                        view.appendChild(trBadge);
                    }

                    // --- ↙️ Нижний левый (Качество) ---
                    var quality = getQuality(data, domCard);
                    if (quality) {
                        var blBadge = document.createElement('div');
                        blBadge.className = 'bl-badge bl-badge--bl ' + quality.className;
                        blBadge.innerText = quality.text;
                        view.appendChild(blBadge);
                    }

                    // --- ↘️ Нижний правый (Рейтинг) ---
                    var rating = getRating(data);
                    var brBadge = document.createElement('div');
                    brBadge.className = 'bl-badge bl-badge--br';
                    brBadge.innerHTML = rating.val === 'NEW' ? '<span>NEW</span>' : ('<span>' + rating.val + '</span><span class="source-label">' + rating.src + '</span>');
                    view.appendChild(brBadge);
                }
            } catch (e) {
                console.error('byLampa Cards Info: Ошибка в scanAndApplyBadges', e);
            }
        }

        // 5. Наблюдатель DOM
        var timer;
        var observer = new MutationObserver(function () {
            clearTimeout(timer);
            timer = setTimeout(scanAndApplyBadges, 30);
        });

        observer.observe(document.body, { childList: true, subtree: true });

        setTimeout(scanAndApplyBadges, 500);
        setTimeout(scanAndApplyBadges, 1500);
    }

    if (window.appready || (window.Lampa && window.Lampa.Card)) {
        initPlugin();
    } else if (window.Lampa && Lampa.Listener) {
        Lampa.Listener.follow('app', function (e) {
            if (e.type == 'ready' || e.type == 'appready') initPlugin();
        });
    } else {
        var checkTimer = setInterval(function () {
            if (window.appready || (window.Lampa && window.Lampa.Card)) {
                clearInterval(checkTimer);
                initPlugin();
            }
        }, 100);
    }
})();
