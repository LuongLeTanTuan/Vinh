export function createQualityProfile() {
  const nav = window.navigator || {};
  const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
  const isTouch = ('ontouchstart' in window) || nav.maxTouchPoints > 0;
  const dpr = window.devicePixelRatio || 1;
  const memory = nav.deviceMemory || 4;
  const cores = nav.hardwareConcurrency || 4;
  const saveData = Boolean(connection?.saveData);

  const lowPower =
    saveData ||
    memory <= 3 ||
    cores <= 4 ||
    (isTouch && dpr >= 2.5);

  const mediumPower =
    !lowPower &&
    (isTouch || memory <= 6 || cores <= 6 || dpr >= 2);

  const tier = lowPower ? 'low' : mediumPower ? 'medium' : 'high';

  return {
    tier,
    isTouch,
    antialias: tier !== 'low',
    shadows: tier !== 'low',
    decorShadows: tier === 'high',
    modelShadows: tier !== 'low',
    galleryLights: tier === 'high',
    shadowMapSize: tier === 'high' ? 512 : 256,
    pixelRatioMin: tier === 'low' ? 0.85 : 1,
    pixelRatioMax: tier === 'high' ? 1.65 : tier === 'medium' ? 1.35 : 1.1,
    starCount: tier === 'high' ? 1800 : tier === 'medium' ? 1300 : 900,
    skyDomeWidthSegments: tier === 'high' ? 64 : tier === 'medium' ? 48 : 32,
    skyDomeHeightSegments: tier === 'high' ? 48 : tier === 'medium' ? 36 : 24,
    nebulaCount: tier === 'high' ? 6 : tier === 'medium' ? 5 : 3,
    balloonCurvePoints: tier === 'high' ? 24 : 14
  };
}
