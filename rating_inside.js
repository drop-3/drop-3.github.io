/*
* byLampa Details Enriched v3.0 (Strict & Clean)
* Плагин работает ТОЛЬКО внутри описания фильма/сериала.
* Собирает оценки платформ (IMDb, KP, TMDB, RT, MC) и Качество.
* Награды (Оскары, Эмми) вырезаны полностью. 
* Вид: Иконки строго сверху, цифры снизу (табличный вид из донора).
*/

(function () {
    'use strict';
    
    // --- 1. SVG ИКОНКИ (Только платформы) ---
    var star_svg = '<svg viewBox="5 5 54 54" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill="none" stroke="white" stroke-width="2" d="M32 18.7461L36.2922 27.4159L46.2682 28.6834L38.9675 35.3631L40.7895 44.8469L32 40.2489L23.2105 44.8469L25.0325 35.3631L17.7318 28.6834L27.7078 27.4159L32 18.7461ZM32 23.2539L29.0241 29.2648L22.2682 30.1231L27.2075 34.6424L25.9567 41.1531L32 37.9918L38.0433 41.1531L36.7925 34.6424L41.7318 30.1231L34.9759 29.2648L32 23.2539Z"/><path fill="none" stroke="white" stroke-width="2" d="M32 9C19.2975 9 9 19.2975 9 32C9 44.7025 19.2975 55 32 55C44.7025 55 55 44.7025 55 32C55 19.2975 44.7025 9 32 9ZM7 32C7 18.1929 18.1929 7 32 7C45.8071 7 57 18.1929 57 32C57 45.8071 45.8071 57 32 57C18.1929 57 7 45.8071 7 32Z"/></svg>';
    var avg_svg = '<svg width="800px" height="800px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" version="1.1"><g transform="translate(0 -1028.4)"><path d="m9.533-0.63623 2.79 6.2779 5.581 0.6976-4.186 3.4877 1.395 6.278-5.58-3.488-5.5804 3.488 1.3951-6.278-4.1853-3.4877 5.5804-0.6976z" transform="matrix(1.4336 0 0 1.4336 -1.6665 1029.3)" fill="#f39c12"/><g fill="#f1c40f"><g><path d="m12 0v13l4-4z" transform="translate(0 1028.4)"/><path d="m12 13 12-3-6 5z" transform="translate(0 1028.4)"/><path d="m12 13 8 11-8-5z" transform="translate(0 1028.4)"/><path d="m12 13-8 11 2-9z" transform="translate(0 1028.4)"/></g><path d="m12 13-12-3 8-1z" transform="translate(0 1028.4)"/></g></g></svg>';
    var tmdb_svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 150"><defs><linearGradient id="grad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#90cea1"/><stop offset="56%" stop-color="#3cbec9"/><stop offset="100%" stop-color="#00b3e5"/></linearGradient><style>.text-style {font-weight: bold; fill: url(#grad); text-anchor: start; dominant-baseline: middle; textLength: 150; lengthAdjust: spacingAndGlyphs; font-size: 70px;}</style></defs><text class="text-style" x="0" y="50" textLength="150" lengthAdjust="spacingAndGlyphs">TM</text><text class="text-style" x="0" y="120" textLength="150" lengthAdjust="spacingAndGlyphs">DB</text></svg>';
    var imdb_svg = '<svg viewBox="0 0 122.88 122.88" xmlns="http://www.w3.org/2000/svg"><path fill="#F5C518" d="M18.43,0h86.02c10.18,0,18.43,8.25,18.43,18.43v86.02c0,10.18-8.25,18.43-18.43,18.43H18.43C8.25,122.88,0,114.63,0,104.45l0-86.02C0,8.25,8.25,0,18.43,0L18.43,0z"/><path d="M24.96,78.72V44.16h-9.6v34.56H24.96L24.96,78.72z M45.36,44.16L43.2,60.24L42,51.6l-1.2-7.44l-12,0v34.56h8.16v-22.8 l3.36,22.8h6l3.12-23.28v23.28h8.16V44.16H45.36L45.36,44.16z M61.44,78.72V44.16h14.88c3.6,0,6.24,2.64,6.24,6v22.56 c0,3.36-2.64,6-6.24,6H61.44L61.44,78.72z M72.72,50.4l-2.16-0.24v22.56c1.2,0,2.16-0.24,2.4-0.72c0.48-0.48,0.48-1.92,0.48-4.32 V54.24v-2.88L72.72,50.4L72.72,50.4L72.72,50.4z M100.56,52.8h0.72c3.36,0,6.24,2.64,6.24,6v13.92c0,3.36-2.88,6-6.24,6l-0.72,0 c-1.92,0-3.84-0.96-5.04-2.64l-0.48,2.16H86.4V44.16h9.12V55.2C96.72,53.76,98.64,52.8,100.56,52.8L100.56,52.8z M98.64,69.6v-8.16 L98.4,58.8c-0.24-0.48-0.96-0.72-1.44-0.72c-0.48,0-1.2,0.24-1.44,0.72v13.68c0.24,0.48,0.96,0.72,1.44,0.72 c0.48,0,1.44-0.24,1.44-0.72L98.64,69.6L98.64,69.6z"/></svg>';
    var kp_svg = '<svg width="300" height="300" viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg"><mask id="mask0_1_69" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="300" height="300"><circle cx="150" cy="150" r="150" fill="white"/></mask><g mask="url(#mask0_1_69)"><circle cx="150" cy="150" r="150" fill="black"/><path d="M300 45L145.26 127.827L225.9 45H181.2L126.3 121.203V45H89.9999V255H126.3V178.92L181.2 255H225.9L147.354 174.777L300 255V216L160.776 160.146L300 169.5V130.5L161.658 139.494L300 84V45Z" fill="url(#paint0_radial_1_69)"/></g><defs><radialGradient id="paint0_radial_1_69" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(89.9999 45) rotate(45) scale(296.985)"><stop offset="0.5" stop-color="#FF5500"/><stop offset="1" stop-color="#BBFF00"/></radialGradient></defs></svg>';
    var rt_svg = '<svg viewBox="0 0 138.75 141.25" xmlns="http://www.w3.org/2000/svg"><g fill="#f93208"><path d="m20.154 40.829c-28.149 27.622-13.657 61.011-5.734 71.931 35.254 41.954 92.792 25.339 111.89-5.9071 4.7608-8.2027 22.554-53.467-23.976-78.009z"/><path d="m39.613 39.265 4.7778-8.8607 28.406-5.0384 11.119 9.2082z"/></g><g><path d="m39.436 8.5696 8.9682-5.2826 6.7569 15.479c3.7925-6.3226 13.79-16.316 24.939-4.6684-4.7281 1.2636-7.5161 3.8553-7.7397 8.4768 15.145-4.1697 31.343 3.2127 33.539 9.0911-10.951-4.314-27.695 10.377-41.771 2.334 0.009 15.045-12.617 16.636-19.902 17.076 2.077-4.996 5.591-9.994 1.474-14.987-7.618 8.171-13.874 10.668-33.17 4.668 4.876-1.679 14.843-11.39 24.448-11.425-6.775-2.467-12.29-2.087-17.814-1.475 2.917-3.961 12.149-15.197 28.625-8.476z" fill="#02902e"/></g></svg>';
    var mc_svg = '<svg width="88" height="88" viewBox="0 0 88 88"><circle fill="#001B36" stroke="#FC0" stroke-width="4.6" cx="44" cy="44" r="41.6"/><path transform="translate(-10,-961) matrix(1.2756629,-1.3487733,1.3685717,1.2634987,-267.04706,1066.0743)" fill="#FFF" d="m126.73438,92.087002 5.05859,0 0,2.832031 c 1.80989-2.200501 3.96483-3.30076 6.46484-3.300781 1.32811,2.1e-5 2.48045,.273458 3.45703,.820312 .97655,.546895 1.77733,1.373717 2.40235,2.480469 .91144-1.106752 1.89451-1.933574 2.94922-2.480469 1.05466-0.546854 2.18096-0.820291 3.3789-0.820312 1.52341,2.1e-5 2.81247,.309265 3.86719,.927734 1.05466,.618509 1.84242,1.526711 2.36328,2.724609 .37757,.885434 .56637,2.317724 .56641,4.296875 l 0,13.26172-5.48828,0 0-11.85547 c-3e-5-2.057277-0.18883-3.385401-0.56641-3.984375-0.50784-0.781233-1.28909-1.171858-2.34375-1.171875-0.76825,1.7e-5-1.49091,.234392-2.16797,.703125-0.6771,.468766-1.16538,1.155614-1.46484,2.060547-0.2995,.904961-0.44924,2.333998-0.44922,4.287108 l 0,9.96094-5.48828,0 0-11.36719 c-2e-5-2.018214-0.0977-3.320296-0.29297-3.906248-0.19533-0.585922-0.49806-1.02212-0.9082-1.308594-0.41017-0.286442-0.96681-0.429671-1.66993-0.429688-0.84636,1.7e-5-1.60808,.227882-2.28515,.683594-0.6771,.455745-1.16212,1.113297-1.45508,1.972656-0.29298,.859389-0.43946,2.28517-0.43945,4.27734 l 0,10.07813-5.48828,0z"/></svg>';

    // --- 2. ЛОКАЛИЗАЦИЯ ---
    Lampa.Lang.add({
        maxsm_ratings_cc: { ru: 'Очистить локальный кэш плагина рейтингов', en: 'Clear local cache' },
        maxsm_ratings_avg_simple: { ru: 'Оценка', en: 'Rating' },
        maxsm_ratings_loading: { ru: 'Загрузка', en: 'Loading' },
        maxsm_ratings_mode: { ru: 'Средний рейтинг', en: 'Average rating' }
    });

    // --- 3. СТИЛИ (Оригинальный "табличный" вид из донора) ---
    var modalStyle = "<style id=\"maxsm_ratings_modal\">" +
        ".maxsm-modal-ratings { padding: 1.25em; font-size: 1.4em; line-height: 1.6; width: auto; max-width: 100%; display: inline-block; }" +
        ".maxsm-modal-rating-line { padding: 0.5em 0; border-bottom: 0.0625em solid rgba(255, 255, 255, 0.1); white-space: nowrap; }" +
        ".maxsm-modal-rating-line:last-child { border-bottom: none; }" +
        ".maxsm-modal-imdb { color: #f5c518; }" +
        ".maxsm-modal-kp { color: #4CAF50; }" +
        ".maxsm-modal-tmdb { color: #01b4e4; }" +
        ".maxsm-modal-rt { color: #fa320a; }" +
        ".maxsm-modal-mc { color: #6dc849; }" +
        "@media (max-width: 768px) { .maxsm-modal-ratings { font-size: 1.2em; } }" +
        "</style>";
    Lampa.Template.add('maxsm_ratings_modal', modalStyle);
    $('body').append(Lampa.Template.get('maxsm_ratings_modal', {}, true));

    var style = "<style id=\"maxsm_ratings_table\">" +
        ".full-start-new__rate-line { visibility: hidden; display: flex; flex-wrap: nowrap; gap: 0.01em; width: fit-content; max-width: 100%; }" +
        /* Тот самый табличный вид: Иконка сверху, цифра снизу */
        ".full-start-new__rate-line .full-start__rate { display: flex !important; flex-direction: column-reverse !important; align-items: center !important; min-width: auto !important; margin-right: 0.5em !important; }" +
        ".full-start-new__rate-line .full-start__rate > div:first-child { font-size: 1.0em; }" +
        ".full-start-new__rate-line .full-start__rate > div:last-child, .full-start-new__rate-line .full-start__rate > .source--name { font-size: 0.8em; color: gold; margin-top: 0.2em; }" +
        ".full-start-new__rate-line > div:not(.full-start__age):not(.full-start__status) svg { width: 1.3em !important; height: 1.3em !important; vertical-align: middle; }" +
        ".rate--green  { color: #4caf50; }" +
        ".rate--lime   { color: #cddc39; }" +
        ".rate--orange { color: #ff9800; }" +
        ".rate--red    { color: #f44336; }" +
        ".rate--gold   { color: gold; }" +
        ".rate--icon   { height: 1.3em; }" +
        /* Плашка качества внутри описания */
        ".maxsm-quality { min-width: 2.8em; text-align: center; border: 1.1px solid #FFFF00 !important; color: #FFFFFF; font-weight: normal; font-size: 1.5em; font-style: italic; border-radius: 0.3em !important; padding: 0.2em 0.8em !important; margin-left: 0.5em !important; align-self: center; }" +
        "@media (max-width: 600px) { .full-start-new__rate-line { gap: 0.3em; } .full-start-new__rate-line .full-start__rate > div:first-child { font-size: 1em; } .full-start-new__rate-line .full-start__rate > div:last-child, .full-start-new__rate-line .full-start__rate > .source--name { font-size: 0.7em; } }" +
        "</style>";
    Lampa.Template.add('maxsm_ratings_table_css', style);
    $('body').append(Lampa.Template.get('maxsm_ratings_table_css', {}, true));

    var loadingStyles = "<style id=\"maxsm_ratings_loading_animation\">" +
        ".loading-dots-container { position: absolute; top: 50%; left: 0; right: 0; text-align: left; transform: translateY(-50%); z-index: 10; }" +
        ".full-start-new__rate-line { position: relative; }" +
        ".loading-dots { display: inline-flex; align-items: center; gap: 0.4em; color: #ffffff; font-size: 1em; background: rgba(0, 0, 0, 0.3); padding: 0.6em 1em; border-radius: 0.5em; }" +
        ".loading-dots__text { margin-right: 1em; }" +
        ".loading-dots__dot { width: 0.5em; height: 0.5em; border-radius: 50%; background-color: currentColor; opacity: 0.3; animation: loading-dots-fade 1.5s infinite both; }" +
        ".loading-dots__dot:nth-child(1) { animation-delay: 0s; }" +
        ".loading-dots__dot:nth-child(2) { animation-delay: 0.5s; }" +
        ".loading-dots__dot:nth-child(3) { animation-delay: 1s; }" +
        "@keyframes loading-dots-fade { 0%, 90%, 100% { opacity: 0.3; } 35% { opacity: 1; } }" +
        "@media screen and (max-width: 480px) { .loading-dots-container { -webkit-justify-content: center; justify-content: center; text-align: center; max-width: 100%; }}" +
        "</style>";
    Lampa.Template.add('maxsm_ratings_loading_animation_css', loadingStyles);
    $('body').append(Lampa.Template.get('maxsm_ratings_loading_animation_css', {}, true));

    // --- 4. КОНСТАНТЫ И КЭШ ---
    var CACHE_TIME = 3 * 24 * 60 * 60 * 1000; 
    var Q_CACHE_TIME = 24 * 60 * 60 * 1000;
    var OMDB_CACHE = 'maxsm_ratings_omdb_cache';
    var KP_CACHE = 'maxsm_ratings_kp_cache';
    var IMDB_CACHE = 'maxsm_ratings_imdb_cache';
    var QUALITY_CACHE = 'maxsm_ratings_quality_cache';
    var OMDB_API_KEYS = (window.RATINGS_PLUGIN_TOKENS && window.RATINGS_PLUGIN_TOKENS.OMDB_API_KEYS) || ['1c149048'];
    var KP_API_KEYS = (window.RATINGS_PLUGIN_TOKENS && window.RATINGS_PLUGIN_TOKENS.KP_API_KEYS) || ['2a4a0808-81a3-40ae-b0d3-e11335ede616'];
    var PROXY_TIMEOUT = 5000;
    var JACRED_PROTOCOL = 'http://';
    var JACRED_URL = Lampa.Storage.get('jac.red') || 'jac.red';
    var PROXY_LIST = ['http://api.allorigins.win/raw?url=', 'http://cors.bwa.workers.dev/'];

    var AGE_RATINGS = { 'G': '3+', 'PG': '6+', 'PG-13': '13+', 'R': '17+', 'NC-17': '18+', 'TV-Y': '0+', 'TV-Y7': '7+', 'TV-G': '3+', 'TV-PG': '6+', 'TV-14': '14+', 'TV-MA': '17+' };
    var WEIGHTS = { imdb: 0.35, tmdb: 0.15, kp: 0.20, mc: 0.15, rt: 0.15 };

    var timeout = new Promise(function(_, reject) { setTimeout(function() { reject(new Error('Таймаут запроса')); }, 360000); });

    function getIMDBCache(key) { var cache = Lampa.Storage.get(IMDB_CACHE) || {}; var item = cache[key]; return item && (Date.now() - item.timestamp < CACHE_TIME) ? item : null; }
    function saveIMDBCache(key, data) { var cache = Lampa.Storage.get(IMDB_CACHE) || {}; cache[key] = { imdb: data.imdb || null, timestamp: Date.now() }; Lampa.Storage.set(IMDB_CACHE, cache); }

    function getIMDBRatings(normalizedCard, callback) {
        if (normalizedCard.imdb_id) return fetchIMDBRatings(normalizedCard.imdb_id, callback);
        var queryTitle = (normalizedCard.original_title || normalizedCard.title || '').replace(/[:—\-]/g, ' ').trim();
        var year = ''; var targetYear;
        if (normalizedCard.release_date && typeof normalizedCard.release_date === 'string') { year = normalizedCard.release_date.split('-')[0]; targetYear = parseInt(year, 10); }
        if (isNaN(targetYear)) return callback(null);
        var encodedTitle = encodeURIComponent(queryTitle).replace(/%20/g, '+');

        Promise.race([fetch("https://api.imdbapi.dev/search/titles?query=" + encodedTitle), timeout]).then(function (response) {
            if (!response.ok) throw new Error("HTTP error " + response.status); return response.json();
        }).then(function (data) {
            if (!data || !data.titles || !Array.isArray(data.titles)) return callback(null);
            var result = null; var closestYearDiff = Infinity;
            for (var i = 0; i < data.titles.length; i++) {
                var item = data.titles[i]; if (!item.startYear) continue;
                var yearDiff = Math.abs(item.startYear - targetYear);
                if (yearDiff === 0) { result = item; break; }
                if (yearDiff <= 1 && yearDiff < closestYearDiff) { closestYearDiff = yearDiff; result = item; }
            }
            if (result) callback({ imdb: result.rating.aggregateRating }); else callback(null);
        }).catch(function () { callback(null); });
    }

    function fetchIMDBRatings(filmId, callback) {
        Promise.race([fetch("https://api.imdbapi.dev/titles/" + filmId), timeout]).then(function (response) {
            if (!response.ok) throw new Error("API error: " + response.status); return response.json();
        }).then(function (data) {
            if (data && data.rating && data.rating.aggregateRating) callback({ imdb: data.rating.aggregateRating });
            else callback({ imdb: null });
        }).catch(function () { callback({ imdb: null }); });
    }

    function getRandomToken(arr) { return (!arr || !arr.length) ? '' : arr[Math.floor(Math.random() * arr.length)]; }

    function getKPRatings(normalizedCard, apiKey, callback) {
        if (normalizedCard.kinopoisk_id) return fetchRatings(normalizedCard.kinopoisk_id);
        var queryTitle = (normalizedCard.original_title || normalizedCard.title || '').replace(/[:\-–—]/g, ' ').trim();
        var year = ''; if (normalizedCard.release_date && typeof normalizedCard.release_date === 'string') year = normalizedCard.release_date.split('-')[0];
        if (!year) return callback(null);
        var encodedTitle = encodeURIComponent(queryTitle);
        var searchUrl = 'https://kinopoiskapiunofficial.tech/api/v2/films/search-by-keyword?keyword=' + encodedTitle;
        
        fetch(searchUrl, { method: 'GET', headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' } }).then(function (response) {
            if (!response.ok) throw new Error('HTTP error: ' + response.status); return response.json();
        }).then(function (data) {
            if (!data.films || !data.films.length) return callback(null);
            var bestMatch = null; var filmYear; var targetYear;
            for (var j = 0; j < data.films.length; j++) {
                var film2 = data.films[j]; if (!film2.year) continue;
                filmYear = parseInt(film2.year.substring(0, 4), 10); targetYear = parseInt(year, 10);
                if (isNaN(filmYear) || isNaN(targetYear)) continue;
                if (filmYear === targetYear) { bestMatch = film2; break; }
            }
            if (!bestMatch) {
                for (var k = 0; k < data.films.length; k++) {
                    var film3 = data.films[k]; if (!film3.year) continue;
                    filmYear = parseInt(film3.year.substring(0, 4), 10); targetYear = parseInt(year, 10);
                    if (isNaN(filmYear) || isNaN(targetYear)) continue;
                    if (Math.abs(filmYear - targetYear) <= 1) { bestMatch = film3; break; }
                }
            }
            if (!bestMatch || !bestMatch.filmId) return callback(null);
            fetchRatings(bestMatch.filmId);
        }).catch(function () { callback(null); });

        function fetchRatings(filmId) {
            var xmlUrl = 'https://rating.kinopoisk.ru/' + filmId + '.xml';
            fetchWithProxy(xmlUrl, function (error, xmlText) {
                if (!error && xmlText) {
                    try {
                        var parser = new DOMParser(); var xmlDoc = parser.parseFromString(xmlText, "text/xml");
                        var kpRatingNode = xmlDoc.getElementsByTagName("kp_rating")[0];
                        var kpRating = kpRatingNode ? parseFloat(kpRatingNode.textContent) : null;
                        if (!isNaN(kpRating) && kpRating > 0) return callback({ kinopoisk: kpRating });
                    } catch (e) {}
                }
                fetch('https://kinopoiskapiunofficial.tech/api/v2.2/films/' + filmId, { headers: { 'X-API-KEY': apiKey } }).then(function (response) {
                    if (!response.ok) throw new Error('API error'); return response.json();
                }).then(function (data) { callback({ kinopoisk: data.ratingKinopoisk || null }); }).catch(function () { callback(null); });
            });
        }
    }

    function addLoadingAnimation(render) {
        if (!render) return;
        var rateLine = $('.full-start-new__rate-line', render).first(); // ТОЛЬКО ПЕРВЫЙ КОНТЕЙНЕР (ГЛАВНЫЙ ЭКРАН)
        if (!rateLine.length || $('.loading-dots-container', rateLine).length) return;
        rateLine.append('<div class="loading-dots-container"><div class="loading-dots"><span class="loading-dots__text">' + Lampa.Lang.translate("maxsm_ratings_loading") + '</span><span class="loading-dots__dot"></span><span class="loading-dots__dot"></span><span class="loading-dots__dot"></span></div></div>');
        $('.loading-dots-container', rateLine).css({ 'opacity': '1', 'visibility': 'visible' });
    }

    function removeLoadingAnimation(render) {
        if (!render) return;
        var containers = $('.loading-dots-container', render);
        containers.each(function (index, element) { element.parentNode.removeChild(element); });
    }

    function getCardType(card) {
        var type = card.media_type || card.type;
        if (type === 'movie' || type === 'tv') return type;
        return card.name || card.original_name ? 'tv' : 'movie';
    }

    function getRatingClass(rating) {
        if (rating >= 8.5) return 'rate--green';
        if (rating >= 7.0) return 'rate--lime';
        if (rating >= 5.0) return 'rate--orange';
        return 'rate--red';
    }

    function fetchWithProxy(url, callback) {
        var currentProxyIndex = 0; var callbackCalled = false;
        function tryNextProxy() {
            if (currentProxyIndex >= PROXY_LIST.length) {
                if (!callbackCalled) { callbackCalled = true; callback(new Error('All proxies failed for ' + url)); } return;
            }
            var proxyUrl = PROXY_LIST[currentProxyIndex] + encodeURIComponent(url);
            var timeoutId = setTimeout(function() { if (!callbackCalled) { currentProxyIndex++; tryNextProxy(); } }, PROXY_TIMEOUT);
            fetch(proxyUrl).then(function(response) {
                clearTimeout(timeoutId); if (!response.ok) throw new Error('Proxy error: ' + response.status); return response.text();
            }).then(function(data) {
                if (!callbackCalled) { callbackCalled = true; clearTimeout(timeoutId); callback(null, data); }
            }).catch(function() {
                clearTimeout(timeoutId); if (!callbackCalled) { currentProxyIndex++; tryNextProxy(); }
            });
        }
        tryNextProxy();
    }

    function getBestReleaseFromJacred(normalizedCard, callback) {
        if (!JACRED_URL) { callback(null); return; }
        function translateQuality(quality) {
            if (typeof quality !== 'number') return quality; 
            if (quality >= 2160) return '4K'; if (quality >= 1080) return 'FHD'; if (quality >= 720) return 'HD'; if (quality > 0) return 'SD'; return null;
        }
        var year = ''; var dateStr = normalizedCard.release_date || '';
        if (dateStr.length >= 4) year = dateStr.substring(0, 4);
        if (!year || isNaN(year)) { callback(null); return; }

        function searchJacredApi(searchTitle, searchYear, exactMatch, apiCallback) {
            var userId = Lampa.Storage.get('lampac_unic_id', '');
            var apiUrl = JACRED_PROTOCOL + JACRED_URL + '/api/v1.0/torrents?search=' + encodeURIComponent(searchTitle) + '&year=' + searchYear + (exactMatch ? '&exact=true' : '') + '&uid=' + userId;
            var controller = new AbortController();
            var timeoutId = setTimeout(function() { controller.abort(); apiCallback(null); }, PROXY_TIMEOUT * PROXY_LIST.length + 1000);

            fetchWithProxy(apiUrl, function(error, responseText) {
                clearTimeout(timeoutId);
                if (error || !responseText) { apiCallback(null); return; }
                try {
                    var torrents = JSON.parse(responseText);
                    if (!Array.isArray(torrents) || torrents.length === 0) { apiCallback(null); return; }
                    var bestNumericQuality = -1; var bestFoundTorrent = null;
                    for (var i = 0; i < torrents.length; i++) {
                        var currentTorrent = torrents[i]; var currentNumericQuality = currentTorrent.quality;
                        var lowerTitle = (currentTorrent.title || '').toLowerCase();
                        if (/\b(ts|telesync|camrip|cam)\b/i.test(lowerTitle)) { if (currentNumericQuality < 720) continue; }
                        if (typeof currentNumericQuality !== 'number' || currentNumericQuality === 0) continue;
                        if (currentNumericQuality > bestNumericQuality) { bestNumericQuality = currentNumericQuality; bestFoundTorrent = currentTorrent; }
                    }
                    if (bestFoundTorrent) apiCallback({ quality: translateQuality(bestFoundTorrent.quality || bestNumericQuality), title: bestFoundTorrent.title });
                    else apiCallback(null);
                } catch (e) { apiCallback(null); }
            });
        }

        var searchStrategies = [];
        if (normalizedCard.original_title && /[a-zа-яё0-9]/i.test(normalizedCard.original_title)) searchStrategies.push({ title: normalizedCard.original_title.trim(), year: year, exact: true });
        if (normalizedCard.title && /[a-zа-яё0-9]/i.test(normalizedCard.title)) searchStrategies.push({ title: normalizedCard.title.trim(), year: year, exact: true });

        function executeNextStrategy(index) {
            if (index >= searchStrategies.length) { callback(null); return; }
            var strategy = searchStrategies[index];
            searchJacredApi(strategy.title, strategy.year, strategy.exact, function(result) {
                if (result !== null) callback(result); else executeNextStrategy(index + 1);
            });
        }
        if (searchStrategies.length > 0) executeNextStrategy(0); else callback(null);
    }

    function clearQualityElements(render) { if (render) $('.full-start__status.maxsm-quality', render).remove(); }

    function showQualityPlaceholder(render) {
        if (!render) return;
        var rateLine = $('.full-start-new__rate-line', render).first(); // ТОЛЬКО ГЛАВНЫЙ ЭКРАН
        if (!rateLine.length) return;
        if (!$('.full-start__status.maxsm-quality', render).length) {
            var placeholder = document.createElement('div');
            placeholder.className = 'full-start__status maxsm-quality';
            placeholder.textContent = '...'; placeholder.style.opacity = '0.7';
            rateLine.append(placeholder);
        }
    }

    function fetchQualitySequentially(normalizedCard, qCacheKey, render) {
        getBestReleaseFromJacred(normalizedCard, function (jrResult) {
            var quality = (jrResult && jrResult.quality) || null;
            if (quality && quality !== 'NO') {
                saveQualityCache(qCacheKey, { quality: quality });
                updateQualityElement(quality, render);
                return;
            }
            clearQualityElements(render);
        });
    }

    function updateQualityElement(quality, render) {
        if (!render) return;
        var element = $('.full-start__status.maxsm-quality', render);
        var rateLine = $('.full-start-new__rate-line', render).first(); // ТОЛЬКО ГЛАВНЫЙ ЭКРАН
        if (!rateLine.length) return;
        if (element.length) { element.text(quality).css('opacity', '1'); }
        else {
            var div = document.createElement('div');
            div.className = 'full-start__status maxsm-quality';
            div.textContent = quality;
            rateLine.append(div);
        }
    }

    function getOmdbCache(key) { var cache = Lampa.Storage.get(OMDB_CACHE) || {}; var item = cache[key]; return item && (Date.now() - item.timestamp < CACHE_TIME) ? item : null; }
    function saveOmdbCache(key, data) {
        var cache = Lampa.Storage.get(OMDB_CACHE) || {};
        cache[key] = { rt: data.rt, mc: data.mc, ageRating: data.ageRating, timestamp: Date.now() }; // Убраны награды
        Lampa.Storage.set(OMDB_CACHE, cache);
    }
    function getKpCache(key) { var cache = Lampa.Storage.get(KP_CACHE) || {}; var item = cache[key]; return item && (Date.now() - item.timestamp < CACHE_TIME) ? item : null; }
    function saveKpCache(key, data) { var cache = Lampa.Storage.get(KP_CACHE) || {}; cache[key] = { kp: data.kp || null, timestamp: Date.now() }; Lampa.Storage.set(KP_CACHE, cache); }
    function getQualityCache(key) { var cache = Lampa.Storage.get(QUALITY_CACHE) || {}; var item = cache[key]; return item && (Date.now() - item.timestamp < Q_CACHE_TIME) ? item : null; }
    function saveQualityCache(key, data) { var cache = Lampa.Storage.get(QUALITY_CACHE) || {}; cache[key] = { quality: data.quality || null, timestamp: Date.now() }; Lampa.Storage.set(QUALITY_CACHE, cache); }

    function fetchOmdbRatings(card, callback) {
        var url = 'https://www.omdbapi.com/?apikey=' + getRandomToken(OMDB_API_KEYS) + '&i=' + card.imdb_id;
        new Lampa.Reguest().silent(url, function (data) {
            if (data && data.Response === 'True' && (data.Ratings || data.imdbRating)) {
                callback({ rt: extractRating(data.Ratings, 'Rotten Tomatoes'), mc: extractRating(data.Ratings, 'Metacritic'), ageRating: data.Rated || null });
            } else callback(null);
        }, function () { callback(null); });
    }

    function extractRating(ratings, source) {
        if (!ratings || !Array.isArray(ratings)) return null;
        for (var i = 0; i < ratings.length; i++) {
            if (ratings[i].Source === source) {
                try { return source === 'Rotten Tomatoes' ? parseFloat(ratings[i].Value.replace('%', '')) : parseFloat(ratings[i].Value.split('/')[0]); } catch (e) { return null; }
            }
        }
        return null;
    }

    function updateHiddenElements(ratings, render) {
        if (!render) return;
        var pgElement = $('.full-start__pg.hide', render);
        if (pgElement.length && ratings.ageRating) {
            var invalidRatings = ['N/A', 'Not Rated', 'Unrated', 'NR'];
            if (invalidRatings.indexOf(ratings.ageRating) === -1) {
                var localizedRating = AGE_RATINGS[ratings.ageRating] || ratings.ageRating;
                pgElement.removeClass('hide').text(localizedRating);
            }
        }
        var imdbElement = $('.rate--imdb', render);
        if (imdbElement.length && ratings.imdb && !isNaN(ratings.imdb)) {
            imdbElement.removeClass('hide').find('> div').eq(0).text(parseFloat(ratings.imdb).toFixed(1));
        }
        var kpElement = $('.rate--kp', render);
        if (kpElement.length && ratings.kp && !isNaN(ratings.kp)) {
            kpElement.removeClass('hide').find('> div').eq(0).text(parseFloat(ratings.kp).toFixed(1));
        }
    }

    function insertRatings(rtRating, mcRating, render) {
        if (!render) return;
        var rateLine = $('.full-start-new__rate-line', render).first(); // ТОЛЬКО ГЛАВНЫЙ ЭКРАН
        if (!rateLine.length) return;
        var lastRate = $('.full-start__rate:last', rateLine);

        if (rtRating && !isNaN(rtRating) && !$('.rate--rt', rateLine).length) {
            var rtElement = $('<div class="full-start__rate rate--rt"><div>' + rtRating + '</div><div class="source--name">Tomatoes</div></div>');
            if (lastRate.length) rtElement.insertAfter(lastRate); else rateLine.prepend(rtElement);
        }
        if (mcRating && !isNaN(mcRating) && !$('.rate--mc', rateLine).length) {
            var insertAfter = $('.rate--rt', rateLine).length ? $('.rate--rt', rateLine) : lastRate;
            var mcElement = $('<div class="full-start__rate rate--mc"><div>' + mcRating + '</div><div class="source--name">Metacritic</div></div>');
            if (insertAfter.length) mcElement.insertAfter(insertAfter); else rateLine.prepend(mcElement);
        }
    }

    function calculateAverageRating(render) {
        if (!render) return;
        var rateLine = $('.full-start-new__rate-line', render).first(); // ТОЛЬКО ГЛАВНЫЙ ЭКРАН
        if (!rateLine.length) return;
        var ratings = {
            imdb: parseFloat($('.rate--imdb div:first', rateLine).text()) || 0,
            tmdb: parseFloat($('.rate--tmdb div:first', rateLine).text()) || 0,
            kp: parseFloat($('.rate--kp div:first', rateLine).text()) || 0,
            mc: (parseFloat($('.rate--mc div:first', rateLine).text()) || 0) / 10,
            rt: (parseFloat($('.rate--rt div:first', rateLine).text()) || 0) / 10
        };
        var totalWeight = 0; var weightedSum = 0; var ratingsCount = 0;
        for (var key in ratings) {
            if (ratings.hasOwnProperty(key) && !isNaN(ratings[key]) && ratings[key] > 0) {
                weightedSum += ratings[key] * WEIGHTS[key]; totalWeight += WEIGHTS[key]; ratingsCount++;
            }
        }
        $('.rate--avg', rateLine).remove();
        var isPortrait = window.innerHeight > window.innerWidth;
        if (totalWeight > 0 && (ratingsCount > 1 || isPortrait)) {
            var averageRating = (weightedSum / totalWeight).toFixed(1);
            var colorClass = getRatingClass(averageRating);
            var avgLabel = Lampa.Lang.translate(isPortrait ? "maxsm_ratings_avg_simple" : "maxsm_ratings_mode");
            if (isPortrait) $('.full-start__rate', rateLine).not('.rate--avg').hide();
            var avgElement = $('<div class="full-start__rate rate--avg ' + colorClass + '"><div>' + averageRating + '</div><div class="source--name">' + avgLabel + '</div></div>');
            $('.full-start__rate:first', rateLine).before(avgElement);
        }
    }

    function showRatingsModal(render) {
        var modalContent = $('<div class="maxsm-modal-ratings"></div>');
        var rateLine = $('.full-start-new__rate-line', render).first();
        if (!rateLine.length) return;
        var ratingOrder = ['rate--avg', 'rate--tmdb', 'rate--imdb', 'rate--kp', 'rate--rt', 'rate--mc']; // Без наград

        ratingOrder.forEach(function (className) {
            var element = $('.' + className, rateLine);
            if (element.length) {
                var value = element.children().eq(0).text().trim();
                var numericValue = parseFloat(value);
                var label = '';
                switch (className) {
                    case 'rate--avg': label = Lampa.Lang.translate("maxsm_ratings_mode"); break;
                    case 'rate--tmdb': label = 'TMDB'; break;
                    case 'rate--imdb': label = 'IMDb'; break;
                    case 'rate--kp': label = 'Кинопоиск'; break;
                    case 'rate--rt': label = 'Rotten Tomatoes'; break;
                    case 'rate--mc': label = 'Metacritic'; break;
                }
                var item = $('<div class="maxsm-modal-rating-line"></div>');
                if (className === 'rate--avg') { var colorClass = getRatingClass(numericValue); if (colorClass) item.addClass(colorClass); }
                else { item.addClass('maxsm-modal-' + className.replace('rate--', '')); }
                item.text(value + ' - ' + label);
                modalContent.append(item);
            }
        });
        Lampa.Modal.open({ title: Lampa.Lang.translate("maxsm_ratings_avg_simple"), html: modalContent, width: 600, onBack: function () { Lampa.Modal.close(); } });
    }

    function insertIcons(render) {
        if (!render) return;
        function replaceIcon(className, svg) {
            var Element = $('.' + className, render);
            if (Element.length) {
                var sourceNameElement = Element.find('.source--name');
                if (sourceNameElement.length) { sourceNameElement.html(svg).addClass('rate--icon'); }
                else { var childDivs = Element.children('div'); if (childDivs.length >= 2) { $(childDivs[1]).html(svg).addClass('rate--icon'); } }
            }
        }
        replaceIcon('rate--imdb', imdb_svg); replaceIcon('rate--kp', kp_svg); replaceIcon('rate--tmdb', tmdb_svg);
        replaceIcon('rate--rt', rt_svg); replaceIcon('rate--mc', mc_svg); replaceIcon('rate--avg', avg_svg); // Награды вырезаны
    }

    // --- 5. ГЛАВНАЯ ФУНКЦИЯ ОБОГАЩЕНИЯ КАРТОЧКИ ---
    function fetchAdditionalRatings(card, render) {
        if (!render) return;
        var normalizedCard = {
            id: card.id, tmdb: card.vote_average || null, kinopoisk_id: card.kinopoisk_id, imdb_id: card.imdb_id || card.imdb || null,
            title: card.title || card.name || '', original_title: card.original_title || card.original_name || '', type: getCardType(card), release_date: card.release_date || card.first_air_date || ''
        };
        var rateLine = $('.full-start-new__rate-line', render).first(); // ИСПРАВЛЕНИЕ: Только первая строка
        if (rateLine.length) { rateLine.css('visibility', 'hidden'); rateLine.addClass('done'); addLoadingAnimation(render); }

        var cacheKey = normalizedCard.type + '_' + (normalizedCard.imdb_id || normalizedCard.id);
        var qCacheKey = normalizedCard.type + '_' + (normalizedCard.id || normalizedCard.imdb_id);
        var cachedData = getOmdbCache(cacheKey);
        var cachedKpData = getKpCache(cacheKey);
        var cachedIMDBData = getIMDBCache(cacheKey);
        var cacheQualityData = getQualityCache(qCacheKey);
        var ratingsData = {};

        // Качество JacRed
        if (cacheQualityData) { updateQualityElement(cacheQualityData.quality, render); }
        else { clearQualityElements(render); showQualityPlaceholder(render); fetchQualitySequentially(normalizedCard, qCacheKey, render); }

        if (cachedIMDBData) { ratingsData.imdb = cachedIMDBData.imdb; processKP(); }
        else {
            getIMDBRatings(normalizedCard, function (imdbRatings) {
                if (imdbRatings && imdbRatings.imdb) { ratingsData.imdb = imdbRatings.imdb; saveIMDBCache(cacheKey, { imdb: imdbRatings.imdb }); }
                processKP();
            });
        }

        function processKP() {
            if (cachedKpData) { ratingsData.kp = cachedKpData.kp; processNextStep(); }
            else {
                getKPRatings(normalizedCard, getRandomToken(KP_API_KEYS), function (kpRatings) {
                    if (kpRatings && kpRatings.kinopoisk) { ratingsData.kp = kpRatings.kinopoisk; saveKpCache(cacheKey, { kp: kpRatings.kinopoisk }); }
                    processNextStep();
                });
            }
        }

        function processNextStep() {
            updateHiddenElements(ratingsData, render);
            if (cachedData) {
                ratingsData.rt = cachedData.rt; ratingsData.mc = cachedData.mc; ratingsData.ageRating = cachedData.ageRating;
                updateUI();
            } else if (normalizedCard.imdb_id) {
                fetchOmdbRatings(normalizedCard, function (omdbData) {
                    if (omdbData) {
                        ratingsData.rt = omdbData.rt; ratingsData.mc = omdbData.mc; ratingsData.ageRating = omdbData.ageRating;
                        saveOmdbCache(cacheKey, omdbData);
                    }
                    updateUI();
                });
            } else { updateUI(); }
        }

        function updateUI() {
            insertRatings(ratingsData.rt, ratingsData.mc, render);
            updateHiddenElements(ratingsData, render);
            calculateAverageRating(render);
            insertIcons(render);
            removeLoadingAnimation(render);
            
            // Включаем видимость только для первой строки
            var finalRateLine = $('.full-start-new__rate-line', render).first();
            if (finalRateLine.length) {
                finalRateLine.css('visibility', 'visible');
            }
            
            if (window.innerHeight > window.innerWidth) {
                $('.full-start__rate', render).off('click.ratings-modal').on('click.ratings-modal', function (e) { e.stopPropagation(); showRatingsModal(render); });
            }
        }
    }

    // --- 6. ИНИЦИАЛИЗАЦИЯ ПЛАГИНА ---
    function startPlugin() {
        window.maxsmRatingsPluginRefactored = true;

        Lampa.SettingsApi.addComponent({ component: "maxsm_ratings_ref", name: "Рейтинги (Обогатитель)", icon: star_svg });
        Lampa.SettingsApi.addParam({
            component: 'maxsm_ratings_ref', param: { name: 'maxsm_ratings_cc', type: 'button' },
            field: { name: Lampa.Lang.translate('maxsm_ratings_cc') },
            onChange: function () {
                localStorage.removeItem(OMDB_CACHE); localStorage.removeItem(KP_CACHE);
                localStorage.removeItem(IMDB_CACHE); localStorage.removeItem(ID_MAPPING_CACHE);
                localStorage.removeItem(QUALITY_CACHE); window.location.reload();
            }
        });

        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                var render = e.object.activity.render();
                fetchAdditionalRatings(e.data.movie, render);
            }
        });
    }

    if (!window.maxsmRatingsPluginRefactored) startPlugin();
})();
