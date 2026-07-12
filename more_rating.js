(function () {
    'use strict';

    function initPlugin() {
        if (window.bylampa_cards_info_loaded) return;
        window.bylampa_cards_info_loaded = true;

        console.log('byLampa Cards Info: Плагин успешно загружен!');

        // 1. Внедряем CSS-стили для плашек
        var style = document.createElement('style');
        style.innerHTML = `
            /* Общие стили для угловых плашек */
            .bl-badge {
                position: absolute;
                padding: 0.35em 0.6em;
                font-family: sans-serif;
                font-weight: 700;
                font-size: 0.85em;
                line-height: 1;
                z-index: 10;
                pointer-events: none;
                display: flex;
                align-items: center;
                gap: 0.35em;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
                transition: all 0.2s ease;
            }

            /* ↖️ Верхний левый угол: Тип (Фильм / Сериал) */
            .bl-badge--tl {
                top: 0;
                left: 0;
                background: rgba(38, 166, 91, 0.85); /* Приятный зеленый */
                color: #ffffff;
                border-bottom-right-radius: 10px;
            }

            /* ↗️ Верхний правый угол: Год */
            .bl-badge--tr {
                top: 0;
                right: 0;
                background: rgba(20, 20, 20, 0.75);
                color: #ffffff;
                border-bottom-left-radius: 10px;
            }

            /* ↙️ Нижний левый угол: Качество видео */
            .bl-badge--bl {
                bottom: 0;
                left: 0;
                border-top-right-radius: 10px;
                font-weight: 900;
                letter-spacing: 0.5px;
            }
            .bl-quality--4k { background: #e5a00d; color: #000000; }       /* Золотистый, черные буквы */
            .bl-quality--fhd { background: #0d5ce5; color: #ffffff; }      /* Синий, белые буквы */
            .bl-quality--hd { background: rgba(20, 20, 20, 0.85); color: #ffffff; } /* Темно-прозрачный */
            .bl-quality--cam { background: rgba(150, 30, 30, 0.85); color: #ffffff; } /* Бордово-прозрачный */

            /* ↘️ Нижний правый угол: Рейтинг */
            .bl-badge--br {
                bottom: 0;
                right: 0;
                background: rgba(20, 20, 20, 0.75);
                color: #00e5ff; /* Фирменный циановый/голубой */
                border-top-left-radius: 10px;
                font-size: 0.9em;
            }
            .bl-badge--br .source-label {
                font-size: 0.55em;
                line-height: 0.9;
                color: #ffffff;
                opacity: 0.8;
                display: flex;
                flex-direction: column;
                text-align: center;
                font-weight: 600;
            }

            /* Светодиоды статуса сериала */
            .bl-dot {
                width: 6px;
                height: 6px;
                border-radius: 50%;
                display: inline-block;
            }
            .bl-dot--green { background: #00ff66; box-shadow: 0 0 5px #00ff66; }
            .bl-dot--red { background: #ff3333; box-shadow: 0 0 5px #ff3333; }
        `;
        document.head.appendChild(style);

        // 2. Вспомогательные функции для парсинга данных
        function getYear(data) {
            var date = data.release_date || data.first_air_date || data.year || '';
            return date ? String(date).slice(0, 4) : '';
        }

        function getRating(data) {
            // Приоритет: 1. TMDB -> 2. IMDb -> 3. КиноПоиск
            var tmdb = parseFloat(data.vote_average || 0);
            var imdb = parseFloat(data.imdb_rating || data.rating_imdb || 0);
            var kp = parseFloat(data.kp_rating || data.rating_kp || data.kinopoisk_rating || 0);

            if (tmdb > 0) return { val: tmdb.toFixed(1), src: 'TM<br>DB' };
            if (imdb > 0) return { val: imdb.toFixed(1), src: 'IM<br>Db' };
            if (kp > 0) return { val: kp.toFixed(1), src: 'KP' };
            
            return { val: 'NEW', src: '' };
        }

        function getQuality(data) {
            // Проверяем поля качества, которые могут передавать балансеры/парсеры byLampa
            var q = (data.quality || data.rip || data.video_quality || data.resolution || '').toUpperCase();
            var title = (data.name || data.title || '').toUpperCase();

            if (q.indexOf('4K') !== -1 || q.indexOf('2160') !== -1 || title.indexOf('4K') !== -1) {
                return { text: '4K', className: 'bl-quality--4k' };
            }
            if (q.indexOf('1080') !== -1 || q.indexOf('FHD') !== -1) {
                return { text: 'FHD', className: 'bl-quality--fhd' };
            }
            if (q.indexOf('720') !== -1 || q.indexOf('HD') !== -1) {
                return { text: 'HD', className: 'bl-quality--hd' };
            }
            if (q.indexOf('CAM') !== -1 || q.indexOf('TS') !== -1 || q.indexOf('ЭКРАН') !== -1) {
                return { text: 'CAM', className: 'bl-quality--cam' };
            }
            return null; // Если качество неизвестно — плашку не выводим
        }

        function isSeries(data) {
            return data.media_type === 'tv' || Boolean(data.first_air_date) || data.type === 'tv' || data.type === 'serial';
        }

        function getSeriesStatusDot(data) {
            // Если статус известен как завершенный/отмененный -> красный, иначе (в производстве) -> зеленый
            var status = (data.status || '').toLowerCase();
            if (status === 'ended' || status === 'canceled' || status === 'completed' || data.in_production === false) {
                return '<span class="bl-dot bl-dot--red" title="Завершён"></span>';
            }
            if (status === 'returning series' || data.in_production === true || status === 'airing') {
                return '<span class="bl-dot bl-dot--green" title="Выходят серии"></span>';
            }
            return ''; // Если информации нет, точку просто не показываем
        }

        // 3. Перехватываем создание карточек в приложении
        var old_create = Lampa.Card.prototype.create;
        Lampa.Card.prototype.create = function () {
            old_create.apply(this, arguments);

            try {
                var card = this.card;
                var data = this.data;
                var view = card.querySelector('.card__view') || card;

                if (!data) return;

                // --- ↖️ Верхний левый: Тип ---
                var tlBadge = document.createElement('div');
                tlBadge.className = 'bl-badge bl-badge--tl';
                if (isSeries(data)) {
                    tlBadge.innerHTML = 'Сериал ' + getSeriesStatusDot(data);
                } else {
                    tlBadge.innerHTML = 'Фильм';
                }
                view.appendChild(tlBadge);

                // --- ↗️ Верхний правый: Год ---
                var year = getYear(data);
                if (year && year !== '0000') {
                    var trBadge = document.createElement('div');
                    trBadge.className = 'bl-badge bl-badge--tr';
                    trBadge.innerText = year;
                    view.appendChild(trBadge);
                }

                // --- ↙️ Нижний левый: Качество ---
                var quality = getQuality(data);
                if (quality) {
                    var blBadge = document.createElement('div');
                    blBadge.className = 'bl-badge bl-badge--bl ' + quality.className;
                    blBadge.innerText = quality.text;
                    view.appendChild(blBadge);
                }

                // --- ↘️ Нижний правый: Рейтинг ---
                var rating = getRating(data);
                var brBadge = document.createElement('div');
                brBadge.className = 'bl-badge bl-badge--br';
                if (rating.val === 'NEW') {
                    brBadge.innerHTML = '<span>NEW</span>';
                } else {
                    brBadge.innerHTML = '<span>' + rating.val + '</span><span class="source-label">' + rating.src + '</span>';
                }
                view.appendChild(brBadge);

            } catch (e) {
                console.error('byLampa Cards Info: Ошибка при отрисовке плашек', e);
            }
        };
    }

    // Ожидаем загрузку ядра Lampa
    if (window.Lampa && Lampa.Card) {
        initPlugin();
    } else {
        var timer = setInterval(function () {
            if (window.Lampa && Lampa.Card) {
                clearInterval(timer);
                initPlugin();
            }
        }, 100);
    }
})();
