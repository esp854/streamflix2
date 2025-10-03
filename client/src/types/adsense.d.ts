// Déclaration de type pour Google AdSense
interface Window {
  adsbygoogle?: any[];
}

// Déclaration du module pour le script AdSense
declare module 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js' {
  const adsbygoogle: any[];
  export default adsbygoogle;
}