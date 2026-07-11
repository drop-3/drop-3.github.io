(function () {
    'use strict';

    // ==========================================
    // 1. НАШИ КАСТОМНЫЕ СТИЛИ (На базе amikdn)
    // ==========================================
    var style = document.createElement('style');
    style.innerHTML = `
        .card-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;
            z-index: 10;
        }
        .card-overlay-item {
            position: absolute;
            padding: 3px 6px;
            background: rgba(0,0,0,0.85);
            color: #fff;
            font-size: 11px;
            font-weight: bold;
            border-radius: 4px;
            line-height: 1.2;
        }
        /* Левый верхний: Серии + Точка статуса */
        .card-overlay-item.top-left {
            top: 5px;
            left: 5px;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            display: inline-block;
        }
        .dot-green { background-color: #00FF66; box-shadow: 0 0 6px #00FF66; }
        .dot-red   { background-color: #FF3333; box-shadow: 0 0 4px #FF3333; }

        /* Правый верхний: Год */
        .card-overlay-item.top-right {
            top: 5px;
            right: 5px;
            color: #ddd;
        }
        
        /* Левый нижний: ЦВЕТНОЕ КАЧЕСТВО */
        .card-overlay-item.bottom-left {
            bottom: 5px;
            left: 5px;
            font-weight: 800;
            font-size: 11px;
            text-transform: uppercase;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.9);
        }
        .quality-gold { background: #FFC107 !important; color: #000000 !important; }
        .quality-blue { background: #00E5FF !important; color: #000814 !important; }
        .quality-white { background: #F8F9FA !important; color: #1A1A1A !important; }

        /* Правый нижний: КРУПНЫЙ РЕЙТИНГ (для дивана) */
        .card-overlay-item.bottom-right {
            bottom: 5px;
            right: 5px;
            font-size: 14px !important; /* Увеличенный шрифт! */
            font-weight: 800;
            padding: 4px 8px;
            border: 1px solid rgba(255,255,255,0.1);
        }
        .rating-green { color: #00FF66 !important; }
        .rating-yellow { color: #FFC107 !important; }
        .rating-red { color: #FF3333 !important; }
    `;
    document.head.appendChild(style);

    // ==========================================
    // 2. ОРИГИНАЛЬНАЯ ЛОГИКА AMIKDN
    // ==========================================
    function createOverlay(card, data) {
        if (!card || !data) return;
        var view = card.querySelector('.card__view');
        if (!view) return;
        
        // Чтобы не перерисовывать лишний раз (родная проверка amikdn)
        if (view.querySelector('.card-overlay')) return;

        var overlay = document.createElement('div');
        overlay.className = 'card-overlay';

        // 1. ГОД (Правый верхний)
        var year = data.release_date || data.first_air_date || data.year;
        if (year) {
            var cleanYear = String(year).slice(0, 4);
            if (cleanYear.length === 4 && !isNaN(cleanYear)) {
                var elYear = document.createElement('div');
                elYear.className = 'card-overlay-item top-right';
                elYear.innerText = cleanYear;
                overlay.appendChild(elYear);
            }
        }

        // 2. ТИП / СЕРИИ + ТОЧКА СТАТУСА (Левый верхний) - БЕЗ ОЗВУЧЕК
        var isTv = data.type === 'tv' || data.name || data.number_of_seasons;
        var elType = document.createElement('div');
        elType.className = 'card-overlay-item top-left';
        
        if (isTv) {
            var sInfo = '';
            if (data.number_of_seasons) sInfo += 'S' + data.number_of_seasons;
            if (data.number_of_episodes) sInfo += ' E' + data.number_of_episodes;
            
            var isEnded = data.status === 'Ended' || data.status === 'Canceled' || data.status === 'Завершен';
            var dotClass = isEnded ? 'dot-red' : 'dot-green';
            
            elType.innerHTML = 'СЕРИАЛ ' + sInfo + ' <span class="status-dot ' + dotClass + '"></span>';
        } else {
            elType.innerText = 'ФИЛЬМ';
        }
        overlay.appendChild(elType);

        // 3. ЦВЕТНОЕ КАЧЕСТВО (Левый нижний)
        var quality = data.quality || data.hd || (data.rip ? 'DVDRip' : '');
        if (quality) {
            var qText = String(quality).toUpperCase();
            var qClass = 'quality-white';
            if (qText.indexOf('4K') !== -1 || qText.indexOf('2160') !== -1 || qText.indexOf('UHD') !== -1) {
                qClass = 'quality-gold';
            } else if (qText.indexOf('1080') !== -1 || qText.indexOf('FHD') !== -1 || qText.indexOf('BLU') !== -1 || qText.indexOf('BDRIP') !== -1) {
                qClass = 'quality-blue';
            }
            var elQuality = document.createElement('div');
            elQuality.className = 'card-overlay-item bottom-left ' + qClass;
            elQuality.innerText = qText;
            overlay.appendChild(elQuality);
        }

        // 4. КРУПНЫЙ РЕЙТИНГ (Правый нижний) - БЕЗ ВОЗРАСТА И ПРОГРЕССА
        var rating = data.kp_rating || data.rating_kp || data.imdb_rating || data.rating_imdb || data.vote_average || data.rating;
        if (rating && parseFloat(rating) > 0) {
            var cleanRating = parseFloat(rating).toFixed(1);
            var rClass = 'rating-green';
            if (cleanRating < 5.0) rClass = 'rating-red';
            else if (cleanRating < 7.0) rClass = 'rating-yellow';

            var elRating = document.createElement('div');
            elRating.className = 'card-overlay-item bottom-right ' + rClass;
            elRating.innerText = cleanRating;
            overlay.appendChild(elRating);
        }

        view.appendChild(overlay);
    }

    // ==========================================
    // 3. РОДНЫЕ ОБРАБОТЧИКИ СОБЫТИЙ (1 в 1 как у amikdn!)
    // ==========================================
    function init() {
        if (!window.Lampa) return;

        // Главный секрет стабильности amikdn: слушаем все возможные варианты отрисовки!
        Lampa.Listener.follow('card', function (e) {
            if (e.render) createOverlay(e.render, e.object || e.data);
        });

        Lampa.Listener.follow('new_card', function (e) {
            if (e.render) createOverlay(e.render, e.data);
        });

        Lampa.Listener.follow('create', function (e) {
            if (e.type === 'card' && e.render) createOverlay(e.render, e.object || e.data);
        });

        Lampa.Listener.follow('render_card', function (e) {
            if (e.render) createOverlay(e.render, e.data);
        });
    }

    if (window.Lampa) {
        init();
    } else {
        var timer = setInterval(function () {
            if (window.Lampa) {
                clearInterval(timer);
                init();
            }
        }, 200);
    }

})();
