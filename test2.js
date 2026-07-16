(function () {
    'use strict';

    /* -------------------------------------------------------------------------- */
    /*   Локализация и тексты                                                     */
    /* -------------------------------------------------------------------------- */
    if (window.Lampa && Lampa.Lang) {
        Lampa.Lang.extend({
            my_ts_save: '💾 Сохранить в Лампу',
            my_ts_saved: '💾 Сохранено в память ТВ!',
            my_ts_exist: '⚠️ Этот торрент уже сохранён',
            my_ts_error: '❌ Ошибка: нет магнет-ссылки'
        });
    }

    /* -------------------------------------------------------------------------- */
    /*   Вспомогательная функция: Работа с памятью ТВ                             */
    /* -------------------------------------------------------------------------- */
    function getSaves() {
        try { 
            return JSON.parse(localStorage.getItem('lampa_my_torrents') || '[]'); 
        } catch(e) { 
            return []; 
        }
    }

    /* ==========================================================================
       БЛОК А : UI — Кнопка «Сохранить в Лампу» (Изолированная логика)
       ========================================================================== */
    function initUI() {
        if (!window.Lampa || !Lampa.Select) return;

        var old_show = Lampa.Select.show;
        
        Lampa.Select.show = function(params) {
            // 1. Жесткая проверка: есть ли данные о торренте в текущем меню?
            var d = params.data || {};
            var magnet = d.magnet || '';
            var hash = d.hash || d.btih || '';
            
            // Если нет магнета, пытаемся собрать его из хэша
            if (!magnet && hash) {
                magnet = 'magnet:?xt=urn:btih:' + hash.trim();
            }

            // 2. Добавляем кнопку ТОЛЬКО если есть магнет-ссылка (отсекаем левые меню!)
            if (magnet) {
                params.items.push({
                    title: (Lampa.Lang && Lampa.Lang.translate('my_ts_save')) || '💾 Сохранить в Лампу',
                    action: 'my_save_torrent_action'
                });
            }

            // 3. Обработка нажатия на нашу кнопку
            var old_onSelect = params.onSelect;
            params.onSelect = function(item) {
                if (item && item.action === 'my_save_torrent_action') {
                    if (!magnet) {
                        if (Lampa.Noty) Lampa.Noty.show((Lampa.Lang && Lampa.Lang.translate('my_ts_error')) || '❌ Ошибка');
                        return;
                    }

                    var list = getSaves();
                    var clean_hash = hash || magnet.replace(/.*btih:([a-zA-Z0-9]+).*/i, '$1');

                    // Проверка на дубликаты
                    var isDuplicate = list.some(function(x) { 
                        return x.magnet === magnet || (x.hash && x.hash === clean_hash); 
                    });

                    if (!isDuplicate) {
                        // Достаем данные из активного окна или карточки фильма
                        var act = Lampa.Activity.active() ? (Lampa.Activity.active().activity || {}) : {};
                        var title = d.title || act.title || act.name || 'Сохраненный торрент';
                        var poster = d.img || d.poster || act.img || act.poster || '';

                        list.unshift({
                            title: title,
                            img: poster,
                            poster: poster,
                            magnet: magnet,
                            hash: clean_hash,
                            stat_string: '💾 Из памяти ТВ',
                            date: Date.now()
                        });

                        localStorage.setItem('lampa_my_torrents', JSON.stringify(list));
                        if (Lampa.Noty) Lampa.Noty.show((Lampa.Lang && Lampa.Lang.translate('my_ts_saved')) || '💾 Сохранено!');
                    } else {
                        if (Lampa.Noty) Lampa.Noty.show((Lampa.Lang && Lampa.Lang.translate('my_ts_exist')) || '⚠️ Уже есть!');
                    }
                } else if (old_onSelect) {
                    old_onSelect(item);
                }
            };

            return old_show(params);
        };
    }

    /* ==========================================================================
       БЛОК Б : Инъекция данных — Подмена списка TorrServer (по твоему примеру)
       ========================================================================== */
    function injectTorrentList() {
        var attempts = 0;
        
        // Таймер ожидания загрузки Лампы и модуля ТоррСервера (как в твоем файле)
        var waitForTorrserver = setInterval(function() {
            attempts++;
            
            // Если прошло слишком много времени (15 секунд), прекращаем поиски
            if (attempts > 150) {
                clearInterval(waitForTorrserver);
                return;
            }

            if (!window.Lampa) return;

            // Ищем объект клиента. Во встроенных клиентах это может быть Torrserve (с маленькой s) или TorrServer
            var TS = window.Lampa.TorrServer || window.Lampa.Torrserve || window.Lampa.Torrserver;

            // Если объект найден, у него есть метод list, и мы его еще не перехватывали
            if (TS && TS.list && !TS._my_injected_hook) {
                TS._my_injected_hook = true; // Ставим метку, чтобы не зациклить
                
                var originalList = TS.list;

                // Подменяем метод list
                TS.list = function(params, success, error) {
                    // Обработка разницы аргументов (в некоторых версиях Лампы первый аргумент - сразу колбэк success)
                    var onSuccess = typeof params === 'function' ? params : success;
                    var onError = typeof params === 'function' ? success : error;
                    var origParams = typeof params === 'function' ? {} : params;

                    // Вызываем оригинальный запрос к твоему встроенному клиенту
                    return originalList.call(this, origParams, function(data) {
                        var saves = getSaves();
                        
                        // Если сервер вернул массив — склеиваем: сначала наши сохраненные, потом серверные
                        var serverData = Array.isArray(data) ? data : [];
                        var mergedData = saves.concat(serverData);

                        if (onSuccess) onSuccess.call(this, mergedData);
                    }, function(err) {
                        // Если сервер вылетел с ошибкой, всё равно показываем сохранённое из памяти ТВ!
                        var saves = getSaves();
                        if (saves.length > 0 && onSuccess) {
                            onSuccess.call(this, saves);
                        } else if (onError) {
                            onError.call(this, err);
                        }
                    });
                };

                // Дело сделано — убиваем таймер!
                clearInterval(waitForTorrserver);
            }
        }, 100);
    }

    /* -------------------------------------------------------------------------- */
    /*   Запуск плагина                                                           */
    /* -------------------------------------------------------------------------- */
    // Запускаем UI сразу при инициализации
    initUI();
    // Запускаем ожидание ТоррСервера в фоне
    injectTorrentList();

})();
