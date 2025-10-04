// Déclaration de type pour video.js et ses plugins
declare global {
  interface Window {
    videojs: any;
  }
}

// Déclaration du module video.js
declare module 'video.js' {
  const videojs: any;
  export default videojs;
}

// Déclaration du module videojs-contrib-ads
declare module 'videojs-contrib-ads' {
  const contribAds: any;
  export default contribAds;
}

// Déclaration du module videojs-ima
declare module 'videojs-ima' {
  const ima: any;
  export default ima;
}

export {};