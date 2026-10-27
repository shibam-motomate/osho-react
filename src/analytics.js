const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

export function initGoogleAnalytics() {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined') return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };

  // gtag.js is ~177 KB — bigger than the app's own code — so it must not compete with the first
  // screen. Calls are queued in dataLayer right away (nothing is lost) and the script itself is
  // added once the page has loaded and the browser is idle.
  const addScript = () => {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);
  };
  const whenIdle = () => (typeof window.requestIdleCallback === 'function'
    ? window.requestIdleCallback(addScript, {timeout: 4000})
    : setTimeout(addScript, 2500));
  if (document.readyState === 'complete') whenIdle();
  else window.addEventListener('load', whenIdle, {once: true});

  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID);
}

export function trackPageView(path = window.location.pathname) {
  if (!GA_MEASUREMENT_ID || typeof window.gtag !== 'function') return;

  window.gtag('event', 'page_view', {
    page_path: path,
  });
}
