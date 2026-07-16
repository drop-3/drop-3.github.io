// А. Кнопка сохранения в localStorage (модуль A)
;(function () {
  'use strict'
  if (window.$lampa?.items && typeof $lampa.items.addTab === 'function') {
    $lampa.items.addTab('add-save-button', {
      title: 'Сохранить в Лампу',
      html: `<button id="lampa-save-btn" class="lampa-save-btn">Сохранить в Лампа</button>`,
      handler: function () {
        try {
          const storedItem = $lampa.storage.get('torrents-saved', [])
          const curItem = $lampa.Storage.get('content')
          if (curItem) {
            const exists = storedItem.find(
              (t) => t.magnet === curItem.magnet || t.hash === curItem.hash || t.btih === curItem.btih,
            )
            if (!exists) {
              storedItem.push({
                title: curItem.title || 'Без названия',
                magnet: curItem.magnet || '',
                img: curItem.poster?.original || curItem.poster?.preview || '',
                hash: curItem.hash || '',
                btih: curItem.btih || '',
              })
              $lampa.storage.set('torrents-saved', storedItem)
              Lampa.Noty.show('Добавлено в Лампу', 3000)
            } else {
              Lampa.Noty.show('Уже есть в Лампе', 3000)
            }
          }
        } catch (err) {
          console.error('[add-save-button] ', err)
        }
      },
    })
    $lampa.items.selectTab('add-save-button')
  }
})()

// Б. Инъекция сохраненных торрентов в list (модуль B)
;(function () {
  'use strict'
  let torrserverList = $lampa.storage.get('torrents-saved', [])

  function appendSavedTorrserverList() {
    if (!Array.isArray(torrserverList) || torrserverList.length === 0) return
    try {
      const realList = $lampa.TorrServer?.list?.()
      if (Array.isArray(realList) && realList.length > 0) {
        const ids = new Set(realList.map((x) => x.hash || x.btih))
        const savedFiltered = torrserverList.filter((t) => !ids.has(t.hash) && !ids.has(t.btih))
        torrserverList = [...realList, ...savedFiltered]
        $lampa.storage.set('torrents-saved', torrserverList)
      }
    } catch (err) {
      console.error('[appendSavedTorrserverList] ', err)
    }
  }

  // Инъекция в список: addSortedItem
  if ($lampa.TorrServer && $lampa.TorrServer.addSortedItem) {
    const originalAddSortedItem = $lampa.TorrServer.addSortedItem
    $lampa.TorrServer.addSortedItem = function (item, index, categories) {
      if (item.hash || item.btih) appendSavedTorrserverList()
      return originalAddSortedItem.call(this, item, index, categories)
    }
  }

  // Polling при старте с таймаутом
  let pollTimer
  function waitTorrServer() {
    if ($lampa.TorrServer && $lampa.TorrServer.list) {
      pollTimer = setInterval(() => {
        try {
          appendSavedTorrserverList()
          if ($lampa.TorrServer.list) {
            clearInterval(pollTimer)
          }
        } catch (err) {
          console.error('[waitTorrServer] ', err)
        }
      }, 1000)
    }
  }
  setTimeout(waitTorrServer, 3000)
  window.addEventListener('unload', () => clearInterval(pollTimer))
})()
