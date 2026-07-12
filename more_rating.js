(function () {
    'use strict';

    function initPlugin() {
        if (window.bylampa_cards_info_loaded) return;
        window.bylampa_cards_info_loaded = true;

        console.log('byLampa Cards Info: Запуск плагина v7.0 (DOM Снайпер)...');

        if (window.Lampa && Lampa.Noty) {
            Lampa.Noty.show('🎨 byLampa Cards v7.0: DOM Снайпер подключен!');
        }

        // 1. Внедряем чистые стили ТОЛЬКО для наших плашек
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

        function getQuality(data) {
            var q = (data.quality || data.rip || data.video_quality || data.resolution || '').toUpperCase();
            var title = (data.name || data.title || '').toUpperCase();

            if (q.indexOf('4K') !== -1 || q.indexOf('2160') !== -1 || title.indexOf('4K') !== -1) return { text: '4K', className: 'bl-quality--4k' };
            if (q.indexOf('1080') !== -1 || q.indexOf('FHD') !== -1) return { text: 'FHD', className: 'bl-quality--fhd' };
            if (q.indexOf('720') !== -1 || q.indexOf('HD') !== -1) return { text: 'HD', className: 'bl-quality--hd' };
            if (q.indexOf('CAM') !== -1 || q.indexOf('TS') !== -1 || q.indexOf('ЭКРАН') !== -1) return { text: 'CAM', className: 'bl-quality--cam' };
            return null;
        }

        function isSeries(data) {
            return data.media_type === 'tv' || Boolean(data.first_air_date) || data.type === 'tv' || data.type === 'serial';
        }

        function getSeriesStatusDot(data) {
            var status = (data.status || '').toLowerCase();
            if (status === 'ended' || status === 'canceled' || status === 'completed' || data.in_production === false) {
                return '<span class="bl-dot bl-dot--red"></span>';
            }
            if (status === 'returning series' || data.in_production === true || status === 'airing') {
                return '<span class="bl-dot bl-dot--green"></span>';
            }
            return '';
        }

        // 3. УНИВЕРСАЛЬНАЯ ОТМЫЧКА: Извлекаем данные фильма из DOM-узла карточки
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
            // Проверяем кэш jQuery
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

        // 4. Главная функция сканирования экрана
        function scanAndApplyBadges() {
            try {
                // Ищем все карточки на экране (точно так же, как рабочий плагин ищет рейтинг)
                var cards = document.querySelectorAll('.card');
                if (!cards || cards.length === 0) return;

                var taggedCount = 0;
                var lastTitle = '';

                for (var i = 0; i < cards.length; i++) {
                    var domCard = cards[i];
                    
                    // Если уже оформили эту карту — пропускаем
                    if (domCard.getAttribute('data-bl-tagged')) continue;

                    var data = getCardData(domCard);
                    if (!data) continue; // Если это карточка актёра или меню без фильма

                    // Ищем контейнер постера
                    var view = domCard.querySelector('.card__view') || domCard.querySelector('.card__img') || domCard;
                    if (view.tagName && view.tagName.toLowerCase() === 'img') view = view.parentNode || domCard;

                    domCard.setAttribute('data-bl-tagged', 'true');
                    taggedCount++;
                    lastTitle = data.title || data.name || 'Фильм';

                    // Если на карточке уже есть родная цифра рейтинга — скрываем её, чтобы не мешала нашей
                    var nativeVote = view.querySelector('.card__vote');
                    if (nativeVote) nativeVote.style.display = 'none';

                    // --- ↖️ Верхний левый ---
                    var tlBadge = document.createElement('div');
                    tlBadge.className = 'bl-badge bl-badge--tl';
                    tlBadge.innerHTML = isSeries(data) ? ('Сериал ' + getSeriesStatusDot(data)) : 'Фильм';
                    view.appendChild(tlBadge);

                    // --- ↗️ Верхний правый ---
                    var year = getYear(data);
                    if (year && year !== '0000') {
                        var trBadge = document.createElement('div');
                        trBadge.className = 'bl-badge bl-badge--tr';
                        trBadge.innerText = year;
                        view.appendChild(trBadge);
                    }

                    // --- ↙️ Нижний левый ---
                    var quality = getQuality(data);
                    if (quality) {
                        var blBadge = document.createElement('div');
                        blBadge.className = 'bl-badge bl-badge--bl ' + quality.className;
                        blBadge.innerText = quality.text;
                        view.appendChild(blBadge);
                    }

                    // --- ↘️ Нижний правый ---
                    var rating = getRating(data);
                    var brBadge = document.createElement('div');
                    brBadge.className = 'bl-badge bl-badge--br';
                    brBadge.innerHTML = rating.val === 'NEW' ? '<span>NEW</span>' : ('<span>' + rating.val + '</span><span class="source-label">' + rating.src + '</span>');
                    view.appendChild(brBadge);
                }

                // 🎯 РАДАР 7.0: Отчитываемся об успехе на экране!
                if (taggedCount > 0 && !window._bl_radar_v7_shown && window.Lampa && Lampa.Noty) {
                    window._bl_radar_v7_shown = true;
                    Lampa.Noty.show('🛠 Радар v7.0: Найдено карт: ' + cards.length + ' ("' + lastTitle + '")');
                }

            } catch (e) {
                console.error('byLampa Cards Info: Ошибка в scanAndApplyBadges', e);
            }
        }

        // 5. ГЛАВНЫЙ СЕКРЕТ: Вешаем MutationObserver на body, как в твоем рабочем плагине!
        var timer;
        var observer = new MutationObserver(function (mutations) {
            clearTimeout(timer);
            timer = setTimeout(function () {
                scanAndApplyBadges();
            }, 30); // Ждем 30 мс после любого изменения экрана и сканируем карточки
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Запускаем первое сканирование сразу
        setTimeout(scanAndApplyBadges, 500);
        setTimeout(scanAndApplyBadges, 1500);
    }

    // Запуск плагина по готовности приложения
    if (window.appready || (window.Lampa && window.Lampa.Card)) {
        initPlugin();
    } else if (window.Lampa && Lampa.Listener) {
        Lampa.Listener.follow('app', function (e) {
            if (e.type == 'ready' || e.type == 'appready') {
                initPlugin();
            }
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
