(function () {
    'use strict';

    function initPlugin() {
        if (window.bylampa_optimized_loaded) return;
        window.bylampa_optimized_loaded = true;

        console.log('byLampa Cards v9.0: Оптимизированный движок (IntersectionObserver + Queue)');

        // --- СТИЛИ ---
        var style = document.createElement('style');
        style.innerHTML = `
            .bl-badge {
                position: absolute !important; padding: 0.35em 0.6em; font-family: sans-serif, Arial, Helvetica;
                font-weight: 700; font-size: 0.8em; line-height: 1; z-index: 100 !important; pointer-events: none;
                display: flex; align-items: center; gap: 0.35em; box-shadow: 0 2px 8px rgba(0,0,0,0.6);
                backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); transition: all 0.2s ease; box-sizing: border-box;
            }
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
            .bl-dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; flex-shrink: 0; background: transparent; }
            .bl-dot--green { background: #00ff66; box-shadow: 0 0 5px #00ff66; }
            .bl-dot--red { background: #ff3333; box-shadow: 0 0 5px #ff3333; }
        `;
        document.head.appendChild(style);

        // --- ОЧЕРЕДЬ ЗАПРОСОВ (Оптимизация) ---
        var taskQueue = [];
        var isProcessing = false;
        function addToQueue(task) {
            taskQueue.push(task);
            processQueue();
        }
        function processQueue() {
            if (isProcessing || taskQueue.length === 0) return;
            isProcessing = true;
            var task = taskQueue.shift();
            task();
            setTimeout(function() { isProcessing = false; processQueue(); }, 150);
        }

        // --- ДВИЖОК ПОИСКА ДАННЫХ ---
        function applyCardData(domCard, data) {
            var view = domCard.querySelector('.card__view') || domCard;
            if (!view) return;

            // Рейтинг и Год (делаем один раз)
            if (!domCard.querySelector('.bl-badge--tr')) {
                var year = (data.release_date || data.first_air_date || '').toString().slice(0, 4);
                if (year && year !== '0000') {
                    var tr = document.createElement('div'); tr.className = 'bl-badge bl-badge--tr'; tr.innerText = year; view.appendChild(tr);
                }
            }
            if (!domCard.querySelector('.bl-badge--br')) {
                var val = parseFloat(data.vote_average || 0).toFixed(1);
                var br = document.createElement('div'); br.className = 'bl-badge bl-badge--br'; 
                br.innerHTML = '<span style="color:' + (val >= 7 ? '#00ff66' : '#ff9800') + '">' + val + '</span>';
                view.appendChild(br);
            }

            // Статус и Качество (в очередь)
            addToQueue(function() {
                // Статус
                if (!domCard.querySelector('.bl-badge--tl')) {
                    var tl = document.createElement('div'); tl.className = 'bl-badge bl-badge--tl';
                    var isSeries = (data.media_type === 'tv' || data.first_air_date);
                    tl.innerHTML = '<div style="display:flex; align-items:center; gap:0.35em;">' + (isSeries ? 'Сериал <span class="bl-dot"></span>' : 'Фильм') + '</div><div class="bl-ep-info" style="display:none; font-size:0.85em; font-weight:900; color:#ffeb3b; text-shadow:0 1px 2px #000;"></div>';
                    view.appendChild(tl);

                    if (isSeries) {
                        var apiKey = (Lampa.TMDB && Lampa.TMDB.key) ? Lampa.TMDB.key() : '4ef0d7355d9ffb5151e987764708ce96';
                        fetch((Lampa.TMDB && Lampa.TMDB.api ? Lampa.TMDB.api('tv/' + data.id + '?api_key=' + apiKey) : 'https://api.themoviedb.org/3/tv/' + data.id + '?api_key=' + apiKey))
                            .then(r => r.json()).then(res => {
                                var dot = tl.querySelector('.bl-dot');
                                var epRow = tl.querySelector('.bl-ep-info');
                                if (res.status === 'Ended' || res.status === 'Canceled') dot.className = 'bl-dot bl-dot--red';
                                else dot.className = 'bl-dot bl-dot--green';
                                
                                var ep = res.last_episode_to_air || res.next_episode_to_air;
                                if (ep) { epRow.innerText = 'S' + ep.season_number + ' E' + ep.episode_number; epRow.style.display = 'block'; }
                            }).catch(()=>{});
                    }
                }

                // Качество
                if (!domCard.querySelector('.bl-badge--bl')) {
                    var qVal = data.quality || data.rip || '';
                    if (qVal) {
                        var bl = document.createElement('div');
                        bl.className = 'bl-badge bl-badge--bl bl-quality--hd';
                        bl.innerText = qVal;
                        view.appendChild(bl);
                    }
                }
            });
        }

        // --- INTERSECTION OBSERVER (Ленивая загрузка) ---
        var observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    var card = entry.target;
                    var data = card.card_data || card._data;
                    if (data && data.id) {
                        applyCardData(card, data);
                        card.setAttribute('data-bl-processed', 'true');
                    }
                }
            });
        }, { rootMargin: '200px' });

        // Наблюдатель за DOM
        new MutationObserver(function(mutations) {
            mutations.forEach(function(m) {
                m.addedNodes.forEach(function(node) {
                    if (node.classList && node.classList.contains('card') && !node.getAttribute('data-bl-processed')) {
                        observer.observe(node);
                    } else if (node.querySelectorAll) {
                        node.querySelectorAll('.card:not([data-bl-processed])').forEach(function(c) { observer.observe(c); });
                    }
                });
            });
        }).observe(document.body, { childList: true, subtree: true });

        // Запуск
        document.querySelectorAll('.card:not([data-bl-processed])').forEach(function(c) { observer.observe(c); });
    }

    if (window.appready || (window.Lampa && window.Lampa.Card)) initPlugin();
    else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') initPlugin(); });
})();
