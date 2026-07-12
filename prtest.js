(function () {
    'use strict';

    var VERSION = '6.0';

    // 1. ВИЗУАЛЬНЫЙ МАЯЧОК (Чистый HTML/CSS, не зависит от уведомлений Лампы)
    function showBanner(text, isError) {
        function create() {
            var div = document.createElement('div');
            div.style.cssText = 'position:fixed;top:15px;right:15px;z-index:999999;padding:12px 20px;background:' + (isError ? '#e74c3c' : '#2ecc71') + ';color:#fff;font-size:16px;font-weight:bold;border-radius:8px;box-shadow:0 4px 15px rgba(0,0,0,0.5);pointer-events:none;';
            div.innerText = text;
            document.body.appendChild(div);
            setTimeout(function () {
                try { document.body.removeChild(div); } catch(e){}
            }, 5000);
        }
        if (document.body) create();
        else window.addEventListener('DOMContentLoaded', create);
    }

    // Вызываем плашку МГНОВЕННО при чтении файла браузером!
    showBanner('🚀 Torrents Copy v' + VERSION + ' запущен!');

    // 2. Перехват элемента, которого коснулись пальцем, мышкой или пультом
    var last_target = null;

    ['pointerdown', 'touchstart', 'mousedown', 'click'].forEach(function (eventType) {
        document.addEventListener(eventType, function (e) {
            last_target = e.target;
        }, true);
    });

    document.addEventListener('keydown', function (e) {
        if (e.keyCode === 13 || e.key === 'Enter') {
            last_target = document.activeElement || (window.$ && $('.focus')[0]) || (window.$ && $('.selector.focus')[0]);
        }
    }, true);

    // 3. Рекурсивный поиск magnet и .torrent ссылок во всех скрытых данных
    function findLinksInObject(obj, links, depth) {
        if (!obj || typeof obj !== 'object' || depth > 3) return;

        var hash_val = obj.hash || obj.Hash || obj.info_hash || obj.infoHash || obj.btih;
        if (!links.magnet && hash_val && typeof hash_val === 'string') {
            var clean_hash = hash_val.trim();
            if (/^[a-fA-F0-9]{40}$/.test(clean_hash) || /^[a-zA-Z2-7]{32}$/.test(clean_hash)) {
                links.magnet = 'magnet:?xt=urn:btih:' + clean_hash;
            }
        }

        for (var key in obj) {
            try {
                var val = obj[key];
                if (typeof val === 'string') {
                    val = val.trim();
                    if (val.toLowerCase().indexOf('magnet:') === 0) {
                        links.magnet = val;
                    } else if ((val.toLowerCase().indexOf('http') === 0 || val.toLowerCase().indexOf('ftp') === 0) &&
                               (val.indexOf('.torrent') !== -1 || key.toLowerCase().indexOf('link') !== -1 || key.toLowerCase().indexOf('url') !== -1 || key.toLowerCase().indexOf('file') !== -1 || key.toLowerCase().indexOf('torrent') !== -1)) {
                        if (!links.direct && !val.match(/\.(jpg|jpeg|png|webp|gif|svg|mp4|mkv|avi|m3u8)$/i) && key.toLowerCase().indexOf('img') === -1 && key.toLowerCase().indexOf('poster') === -1) {
                            links.direct = val;
                        }
                    }
                } else if (typeof val === 'object' && val !== null) {
                    findLinksInObject(val, links, depth + 1);
                }
            } catch (e) {}
        }
    }

    function getLinksFromTarget() {
        var links = { magnet: '', direct: '' };
        if (!window.$) return links;
        
        var el = $(last_target || $('.focus, .selector.focus, :focus')[0]).closest('.selector, [data-element], [data-item], [data-torrent], [data-data], .torrent-item, .card, li, div');
        
        while (el.length && (!links.magnet && !links.direct)) {
            var all_data = el.data() || {};
            for (var k in all_data) {
                findLinksInObject(all_data[k], links, 0);
            }
            el = el.parent();
            if (el.is('body') || el.is('html')) break;
        }
        return links;
    }

    // 4. Копирование в буфер с визуальным подтверждением на экране
    function copyText(text, successMessage) {
        function showSuccess() {
            showBanner('📋 ' + successMessage);
            if (window.Lampa && Lampa.Noty && Lampa.Noty.show) Lampa.Noty.show(successMessage);
        }
        function showError() {
            showBanner('❌ Ошибка копирования', true);
            if (window.Lampa && Lampa.Noty && Lampa.Noty.show) Lampa.Noty.show('Ошибка копирования');
        }

        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(showSuccess).catch(function () {
                fallbackCopy(text, showSuccess, showError);
            }
        } else {
            fallbackCopy(text, showSuccess, showError);
        }
    }

    function fallbackCopy(text, onSuccess, onError) {
        var textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.top = "-9999px";
        textArea.style.left = "-9999px";
        textArea.style.opacity = "0";
        
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            var successful = document.execCommand('copy');
            if (successful) onSuccess();
            else if (onError) onError();
        } catch (err) {
            if (onError) onError();
        }
        
        document.body.removeChild(textArea);
    }

    // 5. Подключение к Lampa.Select (с режимом ожидания)
    function attachToSelect() {
        if (!window.Lampa || !window.Lampa.Select) return false;
        
        if (window.Lampa.Select._torrents_copy_attached) return true;
        window.Lampa.Select._torrents_copy_attached = true;

        var original_select_show = Lampa.Select.show;

        Lampa.Select.show = function (params) {
            if (params && params.items && Array.isArray(params.items)) {
                var links = { magnet: '', direct: '' };
                
                findLinksInObject(params, links, 0);

                if (!links.magnet && !links.direct) {
                    var targetLinks = getLinksFromTarget();
                    links.magnet = targetLinks.magnet;
                    links.direct = targetLinks.direct;
                }

                if (links.magnet || links.direct) {
                    if (links.magnet) {
                        params.items.push({
                            title: 'Скопировать Magnet-ссылку',
                            copy_url: links.magnet,
                            copy_msg: 'Magnet-ссылка скопирована'
                        });
                    }
                    if (links.direct) {
                        params.items.push({
                            title: 'Скопировать .torrent ссылку',
                            copy_url: links.direct,
                            copy_msg: 'Прямая ссылка скопирована'
                        });
                    }

                    var original_onSelect = params.onSelect;
                    params.onSelect = function (item) {
                        if (item && item.copy_url) {
                            copyText(item.copy_url, item.copy_msg);
                        } else if (original_onSelect) {
                            original_onSelect(item);
                        }
                    };
                }
            }

            return original_select_show(params);
        };
        return true;
    }

    if (!attachToSelect()) {
        var checkInterval = setInterval(function () {
            if (attachToSelect()) {
                clearInterval(checkInterval);
            }
        }, 300);
    }
})();
