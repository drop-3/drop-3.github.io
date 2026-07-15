var thisInterval = setInterval(function(){
  if (window.appready) {
    Lampa.Activity.replace(Lampa.Activity.active());
    clearInterval(thisInterval);
  }
}, 4000)
