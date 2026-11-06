/* Runs before first paint (inlined by the site's layouts): sets
   <html data-night> when the visitor is in dark mode, so the night paper,
   ink and painting load without a flash. ?night=1 forces night and
   ?night=0 forces day, for previews. */
export const nightScript = `try{var n=new URLSearchParams(location.search).get('night');if(n==='1'||(n!=='0'&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.dataset.night=''}catch(e){}`;
