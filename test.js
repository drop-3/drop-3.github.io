(function () {
    'use strict';

    // === НАСТРОЙКИ ===
    var repo = 'Bylumpa/BYLAMPA-ATV';
    var releasesUrl = 'https://github.com/Bylumpa/BYLAMPA-ATV/releases';
    // =================

    function isNewerVersion(current, latest) {
        var curParts = current.toString().replace(/[^0-9.]/g, '').split('.');
        var latParts = latest.toString().replace(/[^0-9.]/g, '').split('.');
        
        for (var i = 0; i < Math.max(curParts.length, latParts.length); i++) {
            var cur = parseInt(curParts[i] || 0, 10);
            var lat = parseInt(latParts[i] || 0, 10);
            if (lat > cur) return true;
            if (lat < cur) return false;
        }
        return false;
    }

    function checkUpdate() {
        // Получаем версию из Android-оболочки
        var currentVersion = window.bylampa_version || (Lampa.Manifest && Lampa.Manifest.app_version) || '0.0.0';
        var apiUrl = 'https://api.github.com/repos/' + repo + '/releases/latest';

        fetch(apiUrl)
            .then(function (response) {
                if (!response.ok) throw new Error('Network error');
                return response.json();
            })
            .then(function (data) {
                var latestVersion = data.tag_name;
                
                if (latestVersion && isNewerVersion(currentVersion, latestVersion)) {
                    showUpdateDialog(latestVersion);
                }
            })
            .catch(function (error) {
                console.log('[BYLAMPA Update] Ошибка при проверке обновлений:', error);
            });
    }

    function showUpdateDialog(newVersion) {
        Lampa.Select.show({
            title: 'Обнаружена новая версия: ' + newVersion + '. Обновить?',
            items: [
                {
                    title: 'Да',
                    action: 'yes'
                },
                {
                    title: 'Нет',
                    action: 'no'
                }
            ],
            onSelect: function (item) {
                if (item.action === 'yes') {
                    // Команда window.open работает как клик по ссылке.
                    // Android должен перехватить её и открыть браузер по умолчанию.
                    window.open(releasesUrl, '_blank');
                }
                Lampa.Controller.toggle('content');
            },
            onBack: function () {
                Lampa.Controller.toggle('content');
            }
        });
    }

    function initCheck() {
        // Задержка 3 секунды, чтобы интерфейс успел отрисоваться
        setTimeout(function() {
            checkUpdate();
        }, 3000);
    }

    if (window.appready) {
        initCheck();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') {
                initCheck();
            }
        });
    }

})();
