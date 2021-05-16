import loadScript from './loadScript';

window.dataLayer = window.dataLayer || [];

window.gtag = function gtag() {
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer.push(arguments);
};

window.gtag('js', new Date());

window.gtag('config', 'UA-73887811-5');

if (process.env.NODE_ENV === 'production') {
  loadScript('https://www.googletagmanager.com/gtag/js?id=UA-73887811-5');
} else {
  // eslint-disable-next-line no-console
  window.gtag = console.log;
}
