// Déclaration de type pour In-Page Push
interface Window {
  jfj?: any;
  google?: any;
}

// Déclaration du module pour le script SendPulse
declare module 'https://cdn.sendpulse.com/push/@latest/sp-push.js' {
  const sp_push: any;
  export default sp_push;
}

// Déclaration du module pour le script fancyresponse
declare module 'https://fancyresponse.com/*' {
  const jfj: any;
  export default jfj;
}