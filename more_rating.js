(function () {
    'use strict';

    function initPlugin() {
        if (window.bylampa_cards_info_loaded) return;
        window.bylampa_cards_info_loaded = true;

        console.log('byLampa Cards Info: Запуск плагина v6.0...');

        if (window.Lampa && Lampa.Noty) {
            Lampa.Noty.show('🎨 byLampa Cards v6.0: Тотальный перехват подключен!');
        }

        // 1. Чистые стили ТОЛЬКО для плашек (не ломаем пропорции постеров Lampa!)
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

        // 2. Функции парсинга
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

        // 3. Универсальный накладчик плашек
        function applyBadges(cardObj, data, templateName) {
            try {
                if (!cardObj || !data) return;
                // Проверяем, что перед нами именно фильм или сериал
                if (!data.title && !data.name && !data.release_date && !data.first_air_date) return;

                var domCard = cardObj.nodeType ? cardObj : (cardObj[0] || cardObj.el || cardObj.card || null);
                if (!domCard) return;

                // Защита от дублирования
                if (domCard.getAttribute('data-bl-tagged')) return;

                // Ищем контейнер постера (поддержка любых версий и скинов)
                var view = null;
                if (domCard.classList && domCard.classList.contains('card__view')) {
                    view = domCard;
                } else if (domCard.querySelector) {
                    view = domCard.querySelector('.card__view') || domCard.querySelector('.card__img') || domCard;
                }
                if (!view) return;

                // Если .card__img оказался тегом <img>, прикрепляем плашки к его родителю (div), чтобы не ломать HTML
                if (view.tagName && view.tagName.toLowerCase() === 'img') {
                    view = view.parentNode || domCard;
                }

                domCard.setAttribute('data-bl-tagged', 'true');

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

                // 🎯 РАДАР 6.0: Сообщаем об успехе и раскрываем имя шаблона byLampa!
                if (!window._bl_radar_shown && window.Lampa && Lampa.Noty) {
                    window._bl_radar_shown = true;
                    var cardTitle = data.title || data.name || 'Фильм';
                    Lampa.Noty.show('🛠 Радар: шаблон "' + (templateName || 'card') + '" -> "' + cardTitle + '"');
                }

            } catch (e) {
                console.error('byLampa Cards Info: Ошибка в applyBadges', e);
            }
        }

        // 4. ГЛАВНЫЙ СЕКРЕТНЫЙ ПЕРЕХВАТ: Внедряемся в ядро генератора HTML (Template.get)
        if (Lampa.Template && Lampa.Template.get) {
            var old_template_get = Lampa.Template.get;
            Lampa.Template.get = function (name, data) {
                // Вызываем оригинальный генератор и получаем готовый HTML-элемент
                var res = old_template_get.apply(this, arguments);
                
                // Если в генератор передали данные фильма/сериала — это 100% карточка, как бы она ни называлась!
                if (data && typeof data === 'object' && (data.title || data.name) && (data.release_date || data.first_air_date || data.vote_average || data.id)) {
                    // Накладываем плашки сразу и через 20 миллисекунд (для гарантии, если DOM достраивается асинхронно)
                    applyBadges(res, data, name);
                    setTimeout(function () { applyBadges(res, data, name); }, 20);
                }
                return res;
            };
        }

        // 5. Резервный перехват стандартного Lampa.Card (на всякий случай)
        if (Lampa.Card) {
            var old_Card = Lampa.Card;
            Lampa.Card = function (data, card_type) {
                var instance = new old_Card(data, card_type);
                if (instance.create) {
                    var old_create = instance.create;
                    instance.create = function () {
                        var res = old_create.apply(instance, arguments);
                        setTimeout(function () { applyBadges(instance.card || res, data, 'Lampa.Card'); }, 10);
                        return res;
                    };
                }
                return instance;
            };
            for (var prop in old_Card) {
                if (old_Card.hasOwnProperty(prop)) Lampa.Card[prop] = old_Card[prop];
            }
        }
    }

    // Надёжный цикл ожидания загрузки ядра Lampa
    function checkReady() {
        if (window.Lampa && window.Lampa.Template) {
            initPlugin();
        } else {
            setTimeout(checkReady, 100);
        }
    }
    checkReady();
})();
