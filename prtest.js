/*
* byLampa Cards v9.3 (Ultra-Smooth TV Engine)
* Никаких визуальных изменений — весь интерфейс и цвета сохранены на 100%.
* Глубокая оптимизация для Smart TV и Android ТВ-приставок:
* - GPU аппаратное ускорение плашек (contain + translateZ)
* - Отрисовка DOM микро-порциями (requestAnimationFrame)
* - Буфер скролла для защиты от фризов пульта (Debounce 60ms)
*/

(function () {
    'use strict';

    function initPlugin() {
        if (window.bylampa_cards_v93_loaded) return;
        window.bylampa_cards_v93_loaded = true;

        console.log('byLampa Cards v9.3: Ультра-плавный движок для ТВ (GPU + rAF Batching)');

        // --- 1. СТИЛИ (С GPU-УСКОРЕНИЕМ ДЛЯ ТВ) ---
        var style = document.createElement('style');
        style.innerHTML = 
            /* contain: layout style и translateZ(0) спасают ТВ от перерисовки каталога при скролле */
            ".bl-badge { position: absolute !important; padding: 0.35em 0.6em; font-family: sans-serif, Arial, Helvetica; font-weight: 700; font-size: 0.8em; line-height: 1; z-index: 100 !important; pointer-events: none; display: flex; align-items: center; gap: 0.35em; box-shadow: 0 2px 8px rgba(0,0,0,0.6); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); transition: all 0.2s ease; box-sizing: border-box; contain: layout style; transform: translateZ(0); -webkit-transform: translateZ(0); }" +
            ".bl-badge--tl { top: 0 !important; left: 0 !important; background: rgba(38, 166, 91, 0.85); color: #fff; border-bottom-right-radius: 10px; flex-direction: column !important; align-items: flex-start !important; justify-content: center; gap: 0.15em !important; }" +
            ".bl-badge--tr { top: 0 !important; right: 0 !important; background: rgba(20, 20, 20, 0.85); color: #fff; border-bottom-left-radius: 10px; }" +
            ".bl-badge--bl { bottom: 0 !important; left: 0 !important; border-top-right-radius: 10px; font-weight: 900; letter-spacing: 0.5px; }" +
            ".bl-quality--4k { background: #e5a00d; color: #000; }" +
            ".bl-quality--fhd { background: #0d5ce5; color: #fff; }" +
            ".bl-quality--hd { background: rgba(20, 20, 20, 0.85); color: #fff; }" +
            ".bl-quality--cam { background: rgba(150, 30, 30, 0.85); color: #fff; }" +
            ".bl-badge--br { bottom: 0 !important; right: 0 !important; background: rgba(20, 20, 20, 0.85); color: #00e5ff; border-top-left-radius: 10px; font-size: 0.9em; }" +
            ".bl-badge--br .source-label { font-size: 0.55em; line-height: 0.9; color: #fff; opacity: 0.8; display: flex; flex-direction: column; text-align: center; font-weight: 600; }" +
            ".bl-dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; flex-shrink: 0; background: transparent; }" +
            ".bl-dot--green { background: #00ff66; box-shadow: 0 0 5px #00ff66; }" +
            ".bl-dot--red { background: #ff3333; box-shadow: 0 0 5px #ff3333; }" +
            ".bl-dot--grey { background: #888; }";
        document.head.appendChild(style);

        // --- 2. БАЗЫ ДАННЫХ И КЭШ ---
        var QUALITY_CACHE = Lampa.Storage.cache('bl_quality_cache_v93', 500, {});
        var TV_INFO_CACHE = Lampa.Storage.cache('bl_tv_info_cache_v93', 500, {});

        // --- 3. СЕТЕВАЯ ОЧЕРЕДЬ ЗАПРОСОВ ---
        var networkQueue = [];
        var queueTimer = null;

        function processQueue() {
            if (networkQueue.length === 0) {
                clearInterval(queueTimer);
                queueTimer = null;
                return;
            }
            var task = networkQueue.shift();
            // Выполняем задачу только если карточка всё ещё на экране
            if (task.card && document.body.contains(task.card)) {
                task.func();
            }
        }

        function addToQueue(card, func) {
            networkQueue.push({ card: card, func: func });
            if (!queueTimer) {
                // 200 мс между сетевыми запросами — идеальный баланс для ТВ-приставок
                queueTimer = setInterval(processQueue, 200); 
            }
        }

        // --- 4. ДОБЫЧА КАЧЕСТВА (JACRED) ---
        function fetchExternalQuality(data, callback) {
            var cacheKey = (data.media_type || 'movie') + '_' + data.id;
            if (QUALITY_CACHE[cacheKey]) { callback(QUALITY_CACHE[cacheKey]); return; }

            var year = (data.release_date || data.first_air_date || '').toString().slice(0, 4);
            var title = (data.title || data.name || '').trim();
            if (!year || !title) { callback(null); return; }

            var uid = Lampa.Storage.get('lampac_unic_id', '');
            var jUrl = Lampa.Storage.get('jackett_url') || Lampa.Storage.get('jac.red') || 'jac.red';
            jUrl = jUrl.replace(/^https?:\/\//i, '');
            var url = 'http://' + jUrl + '/api/v1.0/torrents?search=' + encodeURIComponent(title) + '&year=' + year + '&uid=' + uid;

            var req = new Lampa.Reguest();
            req.timeout(5000);
            req.silent(url, function (res) {
                try {
                    var arr = typeof res === 'string' ? JSON.parse(res) : res;
                    if (Array.isArray(arr) && arr.length > 0) {
                        var bestQ = -1;
                        for (var i = 0; i < arr.length; i++) {
                            var q = arr[i].quality;
                            if (typeof q === 'number' && q > bestQ) bestQ = q;
                            else if (typeof q === 'string') {
                                if (/2160|4k/i.test(q)) bestQ = Math.max(bestQ, 2160);
                                else if (/1080/i.test(q)) bestQ = Math.max(bestQ, 1080);
                                else if (/720/i.test(q)) bestQ = Math.max(bestQ, 720);
                            }
                        }
                        if (bestQ > 0) {
                            var fQ = 'HD';
                            if (bestQ >= 2160) fQ = '4K';
                            else if (bestQ >= 1080) fQ = 'FHD';
                            
                            QUALITY_CACHE[cacheKey] = fQ; 
                            Lampa.Storage.set('bl_quality_cache_v93', QUALITY_CACHE);
                            callback(fQ); return;
                        }
                    }
                } catch(e) {}
                callback(null);
            }, function () { callback(null); });
        }

        // --- 5. ДОБЫЧА TMDB (ЭПИЗОДЫ И СТАТУС) ---
        function fetchExternalTvInfo(data, callback) {
            if (!data.id) { callback(null); return; }
            var cacheKey = 'tv_' + data.id;
            if (TV_INFO_CACHE[cacheKey]) { callback(TV_INFO_CACHE[cacheKey]); return; }

            var apiKey = (Lampa.TMDB && Lampa.TMDB.key) ? Lampa.TMDB.key() : '4ef0d7355d9ffb5151e987764708ce96';
            var url = (Lampa.TMDB && Lampa.TMDB.api) ? Lampa.TMDB.api('tv/' + data.id + '?api_key=' + apiKey) : ('https://api.themoviedb.org/3/tv/' + data.id + '?api_key=' + apiKey);

            var req = new Lampa.Reguest();
            req.timeout(5000);
            req.silent(url, function (res) {
                if (res && res.status) {
                    var st = (res.status === 'Ended' || res.status === 'Canceled' || res.in_production === false) ? 'ended' : 'ongoing';
                    var epObj = res.last_episode_to_air || res.next_episode_to_air;
                    var epStr = '';
                    if (epObj) {
                        var s = parseInt(epObj.season_number, 10) || 0;
                        var e = parseInt(epObj.episode_number, 10) || 0;
                        if (s > 0 && e > 0) epStr = 'S' + s + ' E' + e;
                    } else if (res.number_of_seasons > 0 && res.number_of_episodes > 0) {
                        epStr = 'S' + res.number_of_seasons + ' E' + res.number_of_episodes;
                    }
                    var infoObj = { status: st, ep: epStr };
                    TV_INFO_CACHE[cacheKey] = infoObj; 
                    Lampa.Storage.set('bl_tv_info_cache_v93', TV_INFO_CACHE);
                    callback(infoObj);
                } else callback(null);
            }, function () { callback(null); });
        }

        // --- 6. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---
        function getCardData(domCard) {
            var nodes = [domCard, domCard.querySelector('.card__view'), domCard.parentNode, domCard.firstElementChild];
            for (var i = 0; i < nodes.length; i++) {
                var n = nodes[i]; if (!n) continue;
                if (n._data && (n._data.title || n._data.name)) return n._data;
                if (n.data && (n.data.title || n.data.name)) return n.data;
                if (n.card_data && (n.card_data.title || n.card_data.name)) return n.card_data;
            }
            return null;
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
        function getRatingColor(val) {
            if (val === 'NEW') return '#fff';
            var num = parseFloat(val);
            if (num >= 7.0) return '#00ff66';
            if (num >= 5.0) return '#ff9800';
            return '#ff3333';
        }
        function formatEpString(obj) {
            if (!obj) return '';
            var s = parseInt(obj.season_number, 10) || 0;
            var e = parseInt(obj.episode_number, 10) || 0;
            if (s > 0 && e > 0) return 'S' + s + ' E' + e;
            return '';
        }

        // --- 7. ГЛАВНЫЙ СБОРЩИК ---
        function processCard(domCard) {
            var data = getCardData(domCard);
            if (!data || !data.id) return;
            var view = domCard.querySelector('.card__view') || domCard;

            var nativeVote = view.querySelector('.card__vote');
            if (nativeVote) nativeVote.style.display = 'none';

            // ↗️ ГОД
            if (!view.querySelector('.bl-badge--tr')) {
                var year = (data.release_date || data.first_air_date || data.year || '').toString().slice(0, 4);
                if (year && year !== '0000') {
                    var trBadge = document.createElement('div'); trBadge.className = 'bl-badge bl-badge--tr';
                    trBadge.innerText = year; view.appendChild(trBadge);
                }
            }

            // ↘️ РЕЙТИНГ
            if (!view.querySelector('.bl-badge--br')) {
                var rating = getRating(data);
                var brBadge = document.createElement('div'); brBadge.className = 'bl-badge bl-badge--br';
                brBadge.style.borderColor = getRatingColor(rating.val);
                brBadge.innerHTML = rating.val === 'NEW' ? '<span>NEW</span>' : ('<span style="color:' + getRatingColor(rating.val) + '">' + rating.val + '</span><span class="source-label">' + rating.src + '</span>');
                view.appendChild(brBadge);
            }

            // ↖️ ТИП + СЕРИИ + ЛАМПОЧКА
            if (!view.querySelector('.bl-badge--tl')) {
                var tlBadge = document.createElement('div'); tlBadge.className = 'bl-badge bl-badge--tl';
                var isSeries = (data.media_type === 'tv' || data.first_air_date || data.type === 'tv' || data.type === 'serial');
                
                if (isSeries) {
                    var topRow = document.createElement('div'); topRow.style.cssText = 'display: flex; align-items: center; gap: 0.35em; width: 100%; line-height: 1;';
                    topRow.innerHTML = '<span>Сериал</span> <span class="bl-dot bl-dot--grey"></span>';
                    var epRow = document.createElement('div'); epRow.className = 'bl-ep-info';
                    epRow.style.cssText = 'font-size: 0.85em; font-weight: 900; color: #ffeb3b; text-shadow: 0 1px 2px rgba(0,0,0,0.8); letter-spacing: 0.5px; line-height: 1; display: none; margin-top: 0.1em;';
                    
                    tlBadge.appendChild(topRow); tlBadge.appendChild(epRow); view.appendChild(tlBadge);
                    var dotEl = topRow.querySelector('.bl-dot');

                    function updateTvBadge(st, epText) {
                        if (st === 'ended' || st === 'canceled' || st === false) dotEl.className = 'bl-dot bl-dot--red';
                        else dotEl.className = 'bl-dot bl-dot--green';
                        if (epText) { epRow.innerText = epText; epRow.style.display = 'block'; }
                    }

                    var stState = null; var stVal = (data.status || '').toLowerCase();
                    if (stVal === 'ended' || stVal === 'canceled' || data.in_production === false) stState = 'ended';
                    else if (stVal === 'returning series' || data.in_production === true) stState = 'ongoing';
                    var epVal = formatEpString(data.last_episode_to_air || data.next_episode_to_air);

                    if (stState && epVal) {
                        updateTvBadge(stState, epVal);
                    } else {
                        addToQueue(domCard, function() {
                            fetchExternalTvInfo(data, function(info) {
                                if (info && tlBadge.parentNode) updateTvBadge(info.status || stState, info.ep || epVal);
                            });
                        });
                    }
                } else {
                    tlBadge.innerHTML = '<span>Фильм</span>'; view.appendChild(tlBadge);
                }
            }

            // ↙️ КАЧЕСТВО
            if (!view.querySelector('.bl-badge--bl')) {
                var qVal = data.quality || data.rip || data.resolution || '';
                if (!qVal && data.title) {
                    if (/4k|uhd|2160/i.test(data.title)) qVal = '4K';
                    else if (/1080|fhd/i.test(data.title)) qVal = 'FHD';
                }

                function applyQualityBadge(qText) {
                    if (!qText || !view || view.querySelector('.bl-badge--bl')) return;
                    var qClass = 'bl-quality--hd';
                    if (qText === '4K') qClass = 'bl-quality--4k';
                    else if (qText === 'FHD') qClass = 'bl-quality--fhd';
                    else if (qText === 'CAM' || qText === 'TS') qClass = 'bl-quality--cam';
                    var blBadge = document.createElement('div');
                    blBadge.className = 'bl-badge bl-badge--bl ' + qClass;
                    blBadge.innerText = qText; view.appendChild(blBadge);
                }

                if (qVal) {
                    var cleanQ = /4k|2160/i.test(qVal) ? '4K' : (/1080|fhd/i.test(qVal) ? 'FHD' : (/cam|ts/i.test(qVal) ? 'CAM' : 'HD'));
                    applyQualityBadge(cleanQ);
                } else {
                    addToQueue(domCard, function() {
                        fetchExternalQuality(data, function(fetchedQ) {
                            if (fetchedQ) { data.quality = fetchedQ; applyQualityBadge(fetchedQ); }
                        });
                    });
                }
            }
        }

        // --- 8. ОПТИМИЗИРОВАННЫЙ ДВИЖОК ОТРИСОВКИ ДЛЯ ТВ (rAF Batching) ---
        var pendingCards = [];
        var isRendering = false;

        function scheduleRender() {
            if (isRendering || pendingCards.length === 0) return;
            isRendering = true;
            // requestAnimationFrame рисует ровно в момент, когда ТВ готов к следующему кадру
            requestAnimationFrame(function() {
                // Берем по 4 карточки за кадр — интерфейс не лагает при скролле!
                var chunk = pendingCards.splice(0, 4);
                for (var i = 0; i < chunk.length; i++) {
                    if (document.body.contains(chunk[i])) {
                        processCard(chunk[i]);
                    }
                }
                isRendering = false;
                if (pendingCards.length > 0) scheduleRender();
            });
        }

        // --- 9. БУФЕР СКРОЛЛА (Debounce 60ms) ---
        var mutTimer = null;
        var mutObserver = new MutationObserver(function() {
            if (!mutTimer) {
                // Ждем 60 мс, чтобы Lampa закончила двигать экран при скролле
                mutTimer = setTimeout(function() {
                    mutTimer = null;
                    var cards = document.querySelectorAll('.card:not([data-bl-processed])');
                    for (var i = 0; i < cards.length; i++) {
                        cards[i].setAttribute('data-bl-processed', 'true');
                        pendingCards.push(cards[i]);
                    }
                    scheduleRender();
                }, 60);
            }
        });
        mutObserver.observe(document.body, { childList: true, subtree: true });

        // Запуск для стартовых карточек
        var initialCards = document.querySelectorAll('.card:not([data-bl-processed])');
        for (var i = 0; i < initialCards.length; i++) {
            initialCards[i].setAttribute('data-bl-processed', 'true');
            pendingCards.push(initialCards[i]);
        }
        scheduleRender();
    }

    if (window.appready || (window.Lampa && window.Lampa.Card)) initPlugin();
    else if (window.Lampa && Lampa.Listener) {
        Lampa.Listener.follow('app', function (e) { if (e.type == 'ready' || e.type == 'appready') initPlugin(); });
    } else {
        var checkTimer = setInterval(function () {
            if (window.appready || (window.Lampa && window.Lampa.Card)) {
                clearInterval(checkTimer); initPlugin();
            }
        }, 100);
    }
})();
