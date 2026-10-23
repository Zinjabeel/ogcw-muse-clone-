// Laptop fit (owner, 15 Oct 2026): the site should look on every laptop
// exactly as it does on the owner's screen (about 1650px wide), only
// smaller. So below that width the whole page is scaled down in step with
// the window: --fit is the window's width over 1650 (never under 0.62, the
// 1024px tablet line, never over 1), --site-zoom is the page's usual 90%
// times --fit, and --site-unzoom undoes it for sizes measured from the
// window (the "vh" heights). It runs in the page head, before anything is
// drawn, and again whenever the window is resized. The CSS is in styles.css
// ("Desktop scale").
export const FIT_WIDTH = 1650;

export const fitInitScript = `(function(){var d=document.documentElement;function f(){var k=Math.min(1,Math.max(.62,window.innerWidth/${FIT_WIDTH}));var z=.9*k;d.style.setProperty('--fit',k.toFixed(4));d.style.setProperty('--site-zoom',z.toFixed(4));d.style.setProperty('--site-unzoom',(1/z).toFixed(4));}f();window.addEventListener('resize',f);})();`;
