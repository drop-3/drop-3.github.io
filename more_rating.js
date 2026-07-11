(function () {
    'use strict';

    // ==========================================
    // 1. НАШИ СТИЛИ (С усиленным z-index для форков)
    // ==========================================
    var style = document.createElement('style');
    style.innerHTML = `
        .card-overlay {
            position: absolute !important;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: none !important;
            z-index: 9999 !important;
        }
        .card-overlay-item {
            position: absolute !important;
            padding: 3px 6px !important;
            background: rgba(0,0,0,0.85) !important;
            color: #fff !important;
            font-size: 11px !important;
            font-weight: bold !important;
            border-radius: 4px !important;
            line-height: 1.2 !important;
            font-family: Arial, sans-serif !important;
        }
        
        /* Левый верхний: Серии + Точка статуса */
        .card-overlay-item.top-left {
            top: 5px !important;
            left: 5px !important;
            display: flex !important;
            align-items: center !important;
            gap: 5px !important;
        }
        .status-dot {
            width: 8px !important;
            height: 8px !important;
            border-radius: 50% !important;
            display: inline-block !important;
        }
        .dot-green { background-color: #00FF66 !important; box-shadow: 0 0 6px #00FF66 !important; }
        .dot-red   { background-color: #FF3333 !important; box-shadow: 0 0 4px #FF3333 !important; }

        /* Правый верхний: Год */
        .card-overlay-item.top-right {
            top: 5px !important;
            right: 5px !important;
            color: #ddd !important;
        }
        
        /* Левый нижний: ЦВЕТНОЕ КАЧЕСТВО */
        .card-overlay-item.bottom-left {
            bottom: 5px !important;
            left: 5px !important;
            font-weight: 800 !important;
            font-size: 11px !important;
            text-transform: uppercase !important;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.9) !important;
        }
        .quality-gold { background: #FFC107 !important; color: #000000 !important; }
        .quality-blue { background: #00E5FF !important; color: #000814 !important; }
        .quality-white { background: #F8F9FA !important; color: #1A1A1A !important; }

        /* Правый нижний: КРУПНЫЙ РЕЙТИНГ (для чтения с дивана) */
        .card-overlay-item.bottom-right {
            bottom: 5px !important;
            right: 5px !important;
            font-size: 14px !important;
            font-weight: 800 !important;
            padding: 4px 8px !important;
            border: 1px solid rgba(255,255,255,0.1) !important;
        }
        .rating-green { color: #00FF66 !important; }
        .rating-yellow { color: #FFC107 !important; }
        .rating-red { color: #FF3333 !important; }
    `;
    document.head.appendChild(style);

    // ==========================================
    // 2. ЛОГИКА AMIKDN (С исправителем jQuery -> DOM)
    // ==========================================
    function createOverlay(cardEl, data) {
        if (!cardEl || !data) return;

        // ВАЖНО: Превращаем jQuery-объект Лампы в чистый HTML-элемент!
        var card = cardEl[0] || cardEl;
        if (!card.querySelector) return;

        var view = card.querySelector('.card__view') || card.querySelector('.card__img') || card;
        if (!view) return;
        
        // Проверяем, нет ли уже нашего оверлея на этой карточке
        if (view.querySelector('.card-overlay')) return;

        // Фиксируем границы контейнера, чтобы плашки не улетали
        if (view.style) view.style.position = 'relative';

        var overlay = document.createElement('div');
        overlay.className = 'card-overlay';

        // 1. ГОД (Правый верхний)
        var year = data.release_date || data.first_air_date || data.year || data.date;
        if (year) {
            var cleanYear = String(year).slice(0, 4);
            if (cleanYear.length === 4 && !isNaN(cleanYear)) {
                var elYear = document.createElement('div');
                elYear.className = 'card-overlay-item top-right';
                elYear.innerText = cleanYear;
                overlay.appendChild(elYear);
            }
        }

        // 2. ТИП / СЕРИИ + ТОЧКА СТАТУСА (Левый верхний)
        var isTv = data.type === 'tv' || data.name || data.number_of_seasons || data.first_air_date;
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

        // 4. КРУПНЫЙ РЕЙТИНГ (Правый нижний)
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
    // 3. РОДНЫЕ ОБРАБОТЧИКИ AMIKDN (Все 4 события Лампы)
    // ==========================================
    function init() {
        if (!window.Lampa) return;

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
