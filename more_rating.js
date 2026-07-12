(function () {
    'use strict';

    function initPlugin() {
        if (window.bylampa_cards_info_loaded) return;
        window.bylampa_cards_info_loaded = true;

        console.log('byLampa Cards Info: Запуск плагина...');

        // 🚨 ДИОГНАСТИЧЕСКОЕ УВЕДОМЛЕНИЕ
        // Если ты видишь это сообщение на экране смартфона — файл точно скачался и работает!
        if (window.Lampa && Lampa.Noty) {
            Lampa.Noty.show('🎨 byLampa Cards: плагин успешно подключен!');
        }

        // 1. CSS стили (с усиленным z-index и принудительным position: relative)
        var style = document.createElement('style');
        style.innerHTML = `
            /* Гарантируем, что углы будут отчитываться от границ карточки */
            .card__view, .card {
                position: relative !important;
            }
            .bl-badge {
                position: absolute;
                padding: 0.35em 0.6em;
                font-family: sans-serif;
                font-weight: 700;
                font-size: 0.8em;
                line-height: 1;
                z-index: 100; /* Подняли слой, чтобы постер точно не перекрывал плашки */
                pointer-events: none;
                display: flex;
                align-items: center;
                gap: 0.35em;
                box-shadow: 0 2px 8px rgba(0,0,0,0.4);
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
                transition: all 0.2s ease;
                box-sizing: border-box;
            }

            /* ↖️ Верхний левый угол: Тип */
            .bl-badge--tl {
                top: 0;
                left: 0;
                background: rgba(38, 166, 91, 0.85);
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

            /* ↙️ Нижний левый угол: Качество */
            .bl-badge--bl {
                bottom: 0;
                left: 0;
                border-top-right-radius: 10px;
                font-weight: 900;
                letter-spacing: 0.5px;
            }
            .bl-quality--4k { background: #e5a00d; color: #000000; }
            .bl-quality--fhd { background: #0d5ce5; color: #ffffff; }
            .bl-quality--hd { background: rgba(20, 20, 20, 0.85); color: #ffffff; }
            .bl-quality--cam { background: rgba(150, 30, 30, 0.85); color: #ffffff; }

            /* ↘️ Нижний правый угол: Рейтинг */
            .bl-badge--br {
                bottom: 0;
                right: 0;
                background: rgba(20, 20, 20, 0.75);
                color: #00e5ff;
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

        // 3. Универсальная функция добавления плашек
        function applyBadges(instance) {
            try {
                if (instance._bl_badges_added) return; // Защита от дублирования
                var card = instance.card;
                var data = instance.data;
                if (!card || !data) return;

                var view = card.querySelector('.card__view') || card;
                if (!view) return;

                instance._bl_badges_added = true;

                // --- ↖️ Верхний левый: Тип ---
                var tlBadge = document.createElement('div');
                tlBadge.className = 'bl-badge bl-badge--tl';
                tlBadge.innerHTML = isSeries(data) ? ('Сериал ' + getSeriesStatusDot(data)) : 'Фильм';
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
                brBadge.innerHTML = rating.val === 'NEW' ? '<span>NEW</span>' : ('<span>' + rating.val + '</span><span class="source-label">' + rating.src + '</span>');
                view.appendChild(brBadge);

            } catch (e) {
                console.error('byLampa Cards Info: Ошибка в applyBadges', e);
            }
        }

        // 4. Перехватываем и create, и build с гарантией отрисовки в конце стека
        var old_create = Lampa.Card.prototype.create;
        Lampa.Card.prototype.create = function () {
            var res = old_create ? old_create.apply(this, arguments) : null;
            var self = this;
            setTimeout(function () { applyBadges(self); }, 0);
            return res;
        };

        if (Lampa.Card.prototype.build) {
            var old_build = Lampa.Card.prototype.build;
            Lampa.Card.prototype.build = function () {
                var res = old_build ? old_build.apply(this, arguments) : null;
                var self = this;
                setTimeout(function () { applyBadges(self); }, 0);
                return res;
            };
        }
    }

    // Надежный цикл ожидания загрузки ядра
    function checkReady() {
        if (window.Lampa && window.Lampa.Card) {
            initPlugin();
        } else {
            setTimeout(checkReady, 100);
        }
    }
    checkReady();
})();
