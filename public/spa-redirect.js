/**
 * GitHub Pages SPA: restore the URL after 404.html sent us to /.
 * Must run synchronously before the React app (see index.html).
 */
(function () {
  var key = 'spa-redirect'
  var stored = sessionStorage.getItem(key)
  if (!stored) return
  sessionStorage.removeItem(key)
  try {
    var target = stored.charAt(0) === '/' ? stored : new URL(stored, window.location.origin).pathname
    var current = window.location.pathname + window.location.search + window.location.hash
    if (target && target !== current) {
      history.replaceState(null, '', target)
    }
  } catch (e) {
    console.warn('[spa-redirect] could not restore path:', e)
  }
})()
