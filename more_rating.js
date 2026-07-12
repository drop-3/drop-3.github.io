(function () {
    'use strict';

    function initPlugin() {
        if (window.bylampa_cards_v81_loaded) return;
        window.bylampa_cards_v81_loaded = true;

        console.log('byLampa Cards v8.1: Запуск (Alloha + JacRed + TMDB + S:E info)...');
        // Уведомление Lampa.Noty.show убрано по вашей просьбе — запуск полностью тихий!

        // --- 1. НАШИ ФИРМЕННЫЕ СТИЛИ (4 УГЛА + БЛЮР + СЕЗОНЫ) ---
        var style = document.createElement('style');
        style.innerHTML = `
            .bl-badge {
                position: absolute !important; padding: 0.35em 0.6em; font-family: sans-serif, Arial, Helvetica;
                font-weight: 700; font-size: 0.8em; line-height: 1; z-index: 100 !important; pointer-events: none;
                display: flex; align-items: center; gap: 0.35em; box-shadow: 0 2px 8px rgba(0,0,0,0.6);
                backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); transition: all 0.2s ease; box-sizing: border-box;
            }
            /* ↖️ Верхний левый: делаем вертикальную колонку для надписи Сериал и S1 E10 */
            .bl-badge--tl { 
                top: 0 !important; left: 0 !important; background: rgba(38, 166, 91, 0.85); color: #fff; 
                border-bottom-right-radius: 10px; flex-direction: column !important; align-items: flex-start !important; 
                justify-content: center; gap: 0.15em !important;
            }
            .bl-badge--tr { top: 0 !important; right: 0 !important; background: rgba(20, 20, 20, 0.85); color: #fff; border-bottom-left-radius: 10px; }
            .bl-badge--bl { bottom: 0 !important; left: 0 !important; border-top-right-radius: 10px; font-weight: 900; letter-spacing: 0.5px; }
            .bl-quality--4k { background: #e5a00d; color: #000; }
            .bl-quality--fhd { background: #0d5ce5; color: #fff; }
            .bl-quality--hd { background: rgba(20, 20, 20, 0.85); color: #fff; }
            .bl-quality--cam { background: rgba(150, 30, 30, 0.85); color: #fff; }
            .bl-badge--br { bottom: 0 !important; right: 0 !important; background: rgba(20, 20, 20, 0.85); color: #00e5ff; border-top-left-radius: 10px; font-size: 0.9em; }
            .bl-badge--br .source-label { font-size: 0.55em; line-height: 0.9; color: #fff; opacity: 0.8; display: flex; flex-direction: column; text-align: center; font-weight: 600; }
            .bl-dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; flex-shrink: 0; }
            .bl-dot--green { background: #00ff66; box-shadow: 0 0 5px #00ff66; }
            .bl-dot--red { background: #ff3333; box-shadow: 0 0 5px #ff3333; }
        `;
        document.head.appendChild(style);

        // --- 2. АЛГОРИТМЫ РАСШИФРОВКИ СЕРВЕРОВ ALLOHA ---
        function _b64raw(str) {
            if (typeof atob === 'function') { try { return atob(str); } catch (e) {} }
            var b = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
            str = String(str).replace(/=+$/, '').replace(/[^A-Za-z0-9+/]/g, '');
            var out = '', bits = 0, acc = 0;
            for (var i = 0; i < str.length; i++) {
                acc = (acc << 6) | b.indexOf(str.charAt(i)); bits += 6;
                if (bits >= 8) { bits -= 8; out += String.fromCharCode((acc >> bits) & 0xFF); }
            }
            return out;
        }
        function _decodeAllohaServers() {
            var _d = 'OBpQET0aR0hOCQ0XEQFeYFkEAgVPGBMDBwMuGglcAxMeQU1QECAdABxOW1tbBRNVLE8HFwgAQFZVR1V4QldEWAUaWgdEVy5BUhZOHFUYQwcWI1RfUAQVDRMSSEtgAxUcQhINFg0eSjcPH1BAQw0MChcKbUxHFl9QTldVQ1d6TwBHXFQaUFVBB31GU0EJBRpaVhdTbQs4';
            var _k = 'cardOverlay';
            try {
                var raw = _b64raw(_d), out = '';
                for (var i = 0; i < raw.length; i++) out += String.fromCharCode(raw.charCodeAt(i) ^ _k.charCodeAt(i % _k.length));
                return JSON.parse(out);
            } catch (e) { return []; }
        }
        var ALLOHA_SERVERS = _decodeAllohaServers();
        var QUALITY_CACHE = Lampa.Storage.cache('bl_quality_cache_v81', 500, {});
        var TV_INFO_CACHE = Lampa.Storage.cache('bl_tv_info_cache_v81', 500, {});

        // --- 3. МОТОР ДОБЫЧИ КАЧЕСТВА (Alloha + JacRed) ---
        function fetchExternalQuality(data, callback) {
            var cacheKey = (data.media_type || 'movie') + '_' + data.id;
            if (QUALITY_CACHE[cacheKey]) { callback(QUALITY_CACHE[cacheKey]); return; }

            var req = new Lampa.Reguest();
            req.timeout(7000);

            if (ALLOHA_SERVERS.length > 0) {
                var server = ALLOHA_SERVERS[Math.floor(Math.random() * ALLOHA_SERVERS.length)];
                var url = server.url + '?token=' + server.token;
                if (data.kinopoisk_id || data.kp_id) url += '&kp=' + encodeURIComponent(data.kinopoisk_id || data.kp_id);
                else if (data.imdb_id) url += '&imdb=' + encodeURIComponent(data.imdb_id);
                else if (data.id) url += '&tmdb=' + encodeURIComponent(data.id);

                req.silent(url, function (res) {
                    try {
                        var json = typeof res === 'string' ? JSON.parse(res) : res;
                        if (json.status === 'success' && json.data) {
                            var q = 'HD';
                            if (json.data.uhd) q = '4K';
                            else if (json.data.quality && /(^|,\s*)ts(\s*,|$)/i.test(json.data.quality)) q = 'CAM';
                            else if (json.data.quality && /(1080|fhd)/i.test(json.data.quality)) q = 'FHD';
                            QUALITY_CACHE[cacheKey] = q;
                            Lampa.Storage.set('bl_quality_cache_v81', QUALITY_CACHE);
                            callback(q); return;
                        }
                    } catch (e) {}
                    fetchJacRedFallback(data, cacheKey, callback);
                }, function () { fetchJacRedFallback(data, cacheKey, callback); });
            } else { fetchJacRedFallback(data, cacheKey, callback); }
        }

        function fetchJacRedFallback(data, cacheKey, callback) {
            var year = (data.release_date || data.first_air_date || '').toString().slice(0, 4);
            if (!year || !data.title && !data.name) { callback(null); return; }
            var req = new Lampa.Reguest();
            req.timeout(7000);
            var uid = Lampa.Storage.get('lampac_unic_id', '');
            var url = 'https://jr.maxvol.pro/api/v2.0/indexers/all/results?apikey=&uid=' + uid + '&year=' + year + '&title=' + encodeURIComponent((data.title || data.name).trim());
            
            req.silent(url, function (res) {
                try {
                    var json = typeof res === 'string' ? JSON.parse(res) : res;
                    if (json.Results && json.Results.length > 0) {
                        var q = 'HD';
                        for (var i = 0; i < json.Results.length; i++) {
                            var resVal = (json.Results[i].info || {}).quality;
                            if (resVal === 2160) { q = '4K'; break; }
                            if (resVal === 1080) q = 'FHD';
                        }
                        QUALITY_CACHE[cacheKey] = q;
                        Lampa.Storage.set('bl_quality_cache_v81', QUALITY_CACHE);
                        callback(q); return;
                    }
                } catch(e) {}
                callback(null);
            }, function () { callback(null); });
        }

        // --- 4. МОТОР ДОБЫЧИ СТАТУСА И СЕРИЙ (TMDB API) ---
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
                    
                    // Вычисляем актуальный сезон и серию (S1 E10)
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
                    Lampa.Storage.set('bl_tv_info_cache_v81', TV_INFO_CACHE);
                    callback(infoObj);
                } else callback(null);
            }, function () { callback(null); });
        }

        // --- 5. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ВИЗУАЛА ---
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
        function getRatingColor(val) {
            if (val === 'NEW') return '#fff';
            var num = parseFloat(val);
            if (num >= 7.0) return '#00ff66';
            if (num >= 5.0) return '#ff9800';
            return '#ff3333';
        }
        function isSeries(data) {
            return data.media_type === 'tv' || Boolean(data.first_air_date) || data.type === 'tv' || data.type === 'serial';
        }
        function formatEpString(obj) {
            if (!obj) return '';
            var s = parseInt(obj.season_number, 10) || 0;
            var e = parseInt(obj.episode_number, 10) || 0;
            if (s > 0 && e > 0) return 'S' + s + ' E' + e;
            return '';
        }
        function getCardData(domCard) {
            if (!domCard) return null;
            var nodes = [domCard, domCard.querySelector('.card__view'), domCard.parentNode, domCard.firstElementChild];
            for (var i = 0; i < nodes.length; i++) {
                var n = nodes[i]; if (!n) continue;
                if (n._data && (n._data.title || n._data.name)) return n._data;
                if (n.data && (n.data.title || n.data.name)) return n.data;
                if (n.card_data && (n.card_data.title || n.card_data.name)) return n.card_data;
            }
            return null;
        }

        // --- 6. ГЛАВНЫЙ СКАНЕР И ОТРИСОВЩИК ---
        function scanAndApplyBadges() {
            var cards = document.querySelectorAll('.card');
            if (!cards.length) return;

            cards.forEach(function (domCard) {
                if (domCard.getAttribute('data-bl-v81-tagged')) return;
                var data = getCardData(domCard);
                if (!data || !data.id) return;

                var view = domCard.querySelector('.card__view') || domCard;
                if (!view || !view.appendChild) return;

                domCard.setAttribute('data-bl-v81-tagged', 'true');
                var nativeVote = view.querySelector('.card__vote');
                if (nativeVote) nativeVote.style.display = 'none';

                // ↗️ Верхний правый: ГОД
                var year = getYear(data);
                if (year && year !== '0000' && !view.querySelector('.bl-badge--tr')) {
                    var trBadge = document.createElement('div');
                    trBadge.className = 'bl-badge bl-badge--tr';
                    trBadge.innerText = year;
                    view.appendChild(trBadge);
                }

                // ↘️ Нижний правый: РЕЙТИНГ
                if (!view.querySelector('.bl-badge--br')) {
                    var rating = getRating(data);
                    var brBadge = document.createElement('div');
                    brBadge.className = 'bl-badge bl-badge--br';
                    brBadge.style.borderColor = getRatingColor(rating.val);
                    brBadge.innerHTML = rating.val === 'NEW' ? '<span>NEW</span>' : ('<span style="color:' + getRatingColor(rating.val) + '">' + rating.val + '</span><span class="source-label">' + rating.src + '</span>');
                    view.appendChild(brBadge);
                }

                // ↖️ Верхний левый: ТИП + ЛАМПОЧКА + СЕЗОН/СЕРИЯ (S1 E10)
                if (!view.querySelector('.bl-badge--tl')) {
                    var tlBadge = document.createElement('div');
                    tlBadge.className = 'bl-badge bl-badge--tl';
                    
                    if (isSeries(data)) {
                        // Создаем 2 строки: верхняя (Сериал 🟢), нижняя (S1 E10 ярко-желтым цветом)
                        var topRow = document.createElement('div');
                        topRow.style.cssText = 'display: flex; align-items: center; gap: 0.35em; width: 100%; line-height: 1;';
                        topRow.innerHTML = '<span>Сериал</span> <span class="bl-dot" style="background:#888;"></span>';
                        
                        var epRow = document.createElement('div');
                        epRow.className = 'bl-ep-info';
                        epRow.style.cssText = 'font-size: 0.85em; font-weight: 900; color: #ffeb3b; text-shadow: 0 1px 2px rgba(0,0,0,0.8); letter-spacing: 0.5px; line-height: 1; display: none; margin-top: 0.1em;';
                        
                        tlBadge.appendChild(topRow);
                        tlBadge.appendChild(epRow);
                        view.appendChild(tlBadge);

                        var dotEl = topRow.querySelector('.bl-dot');

                        function updateTvBadge(st, epText) {
                            if (st === 'ended' || st === 'canceled' || st === false) {
                                dotEl.className = 'bl-dot bl-dot--red';
                                dotEl.title = 'Завершён';
                            } else if (st === 'returning series' || st === 'ongoing' || st === true) {
                                dotEl.className = 'bl-dot bl-dot--green';
                                dotEl.title = 'Продолжается';
                            }
                            if (epText) {
                                epRow.innerText = epText;
                                epRow.style.display = 'block';
                            }
                        }

                        // Проверяем, есть ли данные сразу в карточке
                        var stVal = (data.status || '').toLowerCase();
                        var stState = null;
                        if (stVal === 'ended' || stVal === 'canceled' || data.in_production === false) stState = 'ended';
                        else if (stVal === 'returning series' || data.in_production === true) stState = 'ongoing';
                        
                        var epVal = formatEpString(data.last_episode_to_air || data.next_episode_to_air);
                        
                        if (stState && epVal) {
                            updateTvBadge(stState, epVal);
                        } else {
                            if (stState || epVal) updateTvBadge(stState, epVal);
                            // Если чего-то не хватает — догружаем из TMDB!
                            fetchExternalTvInfo(data, function (info) {
                                if (!info || !tlBadge.parentNode) return;
                                updateTvBadge(info.status || stState, info.ep || epVal);
                            });
                        }
                    } else {
                        tlBadge.innerHTML = '<span>Фильм</span>';
                        view.appendChild(tlBadge);
                    }
                }

                // ↙️ Нижний левый: КАЧЕСТВО
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
                        blBadge.innerText = qText;
                        view.appendChild(blBadge);
                    }

                    if (qVal) {
                        var cleanQ = /4k|2160/i.test(qVal) ? '4K' : (/1080|fhd/i.test(qVal) ? 'FHD' : (/cam|ts/i.test(qVal) ? 'CAM' : 'HD'));
                        applyQualityBadge(cleanQ);
                    } else {
                        fetchExternalQuality(data, function (fetchedQ) {
                            if (fetchedQ) {
                                data.quality = fetchedQ;
                                applyQualityBadge(fetchedQ);
                            }
                        });
                    }
                }
            });
        }

        // --- 7. НАБЛЮДАТЕЛЬ ЗА ЭКРАНОМ ---
        var timer;
        var observer = new MutationObserver(function () {
            clearTimeout(timer);
            timer = setTimeout(scanAndApplyBadges, 60);
        });
        observer.observe(document.body, { childList: true, subtree: true });

        setInterval(scanAndApplyBadges, 1500);
        setTimeout(scanAndApplyBadges, 300);
    }

    if (window.appready || (window.Lampa && window.Lampa.Card)) initPlugin();
    else if (window.Lampa && Lampa.Listener) {
        Lampa.Listener.follow('app', function (e) { if (e.type == 'ready' || e.type == 'appready') initPlugin(); });
    } else {
        var checkTimer = setInterval(function () {
            if (window.appready || (window.Lampa && window.Lampa.Card)) {
                clearInterval(checkTimer);
                initPlugin();
            }
        }, 100);
    }
})();
