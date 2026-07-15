(function () {
    'use strict';

    var VERSION = '1.0-final';

    // Функция для вызова уведомлений Lampa
    function showNoty(msg) {
        if (window.Lampa && window.Lampa.Noty && typeof window.Lampa.Noty.show === 'function') {
            window.Lampa.Noty.show(msg);
        } else {
            setTimeout(function () {
                if (window.Lampa && window.Lampa.Noty && typeof window.Lampa.Noty.show === 'function') {
                    window.Lampa.Noty.show(msg);
                }
            }, 1000);
        }
    }

    // 1. Перехват шаблонов
    function hookTemplate() {
        if (!window.Lampa || !window.Lampa.Template) return false;
        if (window.Lampa.Template._copy_hooked) return true;
        window.Lampa.Template._copy_hooked = true;

        var orig_get = Lampa.Template.get;
        Lampa.Template.get = function (name, data) {
            var el = orig_get(name, data);
            if (data && typeof data === 'object' && el && window.$) {
                try {
                    $(el).data('injected_torrent_data', data);
                } catch (e) {}
            }
            return el;
        };
        return true;
    }

    // 2. Запоминаем последний элемент, которого коснулись пальцем, мышкой или пультом
    var last_target = null;
    var events = ['pointerdown', 'touchstart', 'mousedown', 'click'];
    for (var i = 0; i < events.length; i++) {
        document.addEventListener(events[i], function (e) {
            last_target = e.target;
        }, true);
    }

    document.addEventListener('keydown', function (e) {
        if (e.keyCode === 13 || e.key === 'Enter') {
            last_target = document.activeElement || (window.$ && $('.focus')[0]) || (window.$ && $('.selector.focus')[0]);
        }
    }, true);

    // 3. Универсальный поиск ссылок во всех полях раздачи
    function findLinks(obj, links, depth) {
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
                    findLinks(val, links, depth + 1);
                }
            } catch (e) {}
        }
    }

    // 4. Функция копирования в буфер
    function copyText(text, successMessage) {
        function showSuccess() { showNoty(successMessage); }
        function showError() { showNoty('Ошибка копирования. Проверьте разрешения'); }

        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(showSuccess).catch(function () {
                fallbackCopy(text, showSuccess, showError);
            });
        } else {
            fallbackCopy(text, showSuccess, showError);
        }
    }

    function fallbackCopy(text, onSuccess, onError) {
        try {
            var textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            textArea.style.top = "-9999px";
            textArea.style.left = "-9999px";
            textArea.style.opacity = "0";
            
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            var successful = document.execCommand('copy');
            document.body.removeChild(textArea);

            if (successful) onSuccess();
            else if (onError) onError();
        } catch (err) {
            if (onError) onError();
        }
    }

    // 5. Перехват контекстного меню
    function hookSelect() {
        if (!window.Lampa || !window.Lampa.Select) return false;
        if (window.Lampa.Select._copy_hooked) return true;
        window.Lampa.Select._copy_hooked = true;

        var orig_show = Lampa.Select.show;

        Lampa.Select.show = function (params) {
            if (params && params.items && Array.isArray(params.items)) {
                var links = { magnet: '', direct: '' };
                
                findLinks(params, links, 0);

                if (!links.magnet && !links.direct && window.$ && last_target) {
                    var el = $(last_target).closest('.selector, [data-element], [data-item], [data-torrent], .torrent-item, .card, li, div');
                    var depth_check = 10;
                    while (el.length && depth_check > 0 && !el.is('body')) {
                        var d = el.data('injected_torrent_data') || el.data('element') || el.data('item') || el.data('torrent') || el.data('data');
                        if (d) findLinks(d, links, 0);
                        if (links.magnet || links.direct) break;
                        el = el.parent();
                        depth_check--;
                    }
                }

                if (!links.magnet && !links.direct && window.$) {
                    var f = $('.focus, .selector.focus, :focus').closest('.selector, [data-element], [data-item]');
                    var fd = f.data('injected_torrent_data') || f.data('element') || f.data('item');
                    if (fd) findLinks(fd, links, 0);
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

                    var orig_onSelect = params.onSelect;
                    params.onSelect = function (item) {
                        if (item && item.copy_url) {
                            copyText(item.copy_url, item.copy_msg);
                        } else if (orig_onSelect) {
                            orig_onSelect(item);
                        }
                    };
                }
            }

            return orig_show(params);
        };
        return true;
    }

    // Запуск с автоконтролем готовности
    hookTemplate();
    hookSelect();

    var timer = setInterval(function () {
        if (hookTemplate() && hookSelect()) {
            clearInterval(timer);
        }
    }, 300);

})();
