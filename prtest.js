(function () {
    'use strict';

    // Версия скрипта для проверки обновления кэша
    var VERSION = '5.0';

    function initPlugin() {
        if (!window.Lampa) return;

        // УВЕДОМЛЕНИЕ ПРИ СТАРТЕ: выводится через 2 секунды. 
        // Если вы его видите, значит загрузился именно новый код, а не старый кэш!
        setTimeout(function () {
            if (Lampa.Noty && Lampa.Noty.show) {
                Lampa.Noty.show('[Torrents Copy v' + VERSION + '] Плагин успешно загружен!');
            }
        }, 2000);

        // 1. Перехват элемента, которого коснулись пальцем, курсором или пультом
        var last_target = null;

        ['pointerdown', 'touchstart', 'mousedown', 'click'].forEach(function (eventType) {
            document.addEventListener(eventType, function (e) {
                last_target = e.target;
            }, true); // true гарантирует перехват раньше любых скриптов приложения
        });

        document.addEventListener('keydown', function (e) {
            if (e.keyCode === 13 || e.key === 'Enter') { // Кнопка ОК на пульте
                last_target = document.activeElement || $('.focus')[0] || $('.selector.focus')[0];
            }
        }, true);

        // 2. Рекурсивный поиск magnet и .torrent ссылок внутри любых объектов данных
        function findLinksInObject(obj, links, depth) {
            if (!obj || typeof obj !== 'object' || depth > 3) return;

            // Если парсер отдал чистый хеш раздачи — сами собираем из него magnet
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
                            // Исключаем постеры и видеопотоки
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

        // Поиск данных в DOM-дереве от нажатого элемента и выше
        function getLinksFromTarget() {
            var links = { magnet: '', direct: '' };
            var el = $(last_target || $('.focus, .selector.focus, :focus')[0]).closest('.selector, [data-element], [data-item], [data-torrent], [data-data], .torrent-item, .card, li, div');
            
            // Проверяем все прикрепленные данные jQuery (.data()) на элементе и родителях
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

        // Функция копирования в буфер обмена
        function copyText(text, successMessage) {
            function showSuccess() {
                if (Lampa.Noty && Lampa.Noty.show) Lampa.Noty.show(successMessage);
                else alert(successMessage);
            }
            function showError() {
                if (Lampa.Noty && Lampa.Noty.show) Lampa.Noty.show('Ошибка копирования. Проверьте разрешения');
                else alert('Ошибка копирования');
            }

            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(text).then(showSuccess).catch(function () {
                    fallbackCopy(text, showSuccess, showError);
                });
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

        // 3. Перехват отрисовки контекстного меню
        if (window.Lampa.Select) {
            var original_select_show = Lampa.Select.show;

            Lampa.Select.show = function (params) {
                if (params && params.items && Array.isArray(params.items)) {
                    var links = { magnet: '', direct: '' };
                    
                    // Сначала ищем ссылки в параметрах самого меню
                    findLinksInObject(params, links, 0);

                    // Если там пусто, ищем в элементе, на который нажали/навели
                    if (!links.magnet && !links.direct) {
                        var targetLinks = getLinksFromTarget();
                        links.magnet = targetLinks.magnet;
                        links.direct = targetLinks.direct;
                    }

                    // ЕСЛИ НАШЛИ ССЫЛКУ — ВСЕГДА ДОБАВЛЯЕМ ПУНКТЫ В ЭТО МЕНЮ!
                    // Убраны все проверки на слова "пометить/торрент", чтобы работать с любыми парсерами.
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
        }
    }

    // Запуск с автоподхватом при нестандартной загрузке форков
    if (window.appready) initPlugin();
    else {
        var checkInterval = setInterval(function () {
            if (window.Lampa && window.Lampa.Select) {
                clearInterval(checkInterval);
                initPlugin();
            }
        }, 300);
    }
})();
