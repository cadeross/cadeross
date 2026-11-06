/* Runs before first paint (inlined by the site layout).

   Picks the version of the site: the original light field, the
   watercolor, or the Monet pond. From ?v=light|watercolor|monet
   (remembered) or the last choice. The two painted versions also get
   data-paint, for what they share, and data-night when the visitor is in
   dark mode (or ?night=1; ?night=0 forces day).

   Picks where the light field sits too, from ?layout=side|top|half
   (remembered) or the last choice. The painted versions ignore it. */

export const LAYOUT_KEY = "cr-layout";
export const VERSION_KEY = "cr-version";

export const layoutScript = `try{var s=new URLSearchParams(location.search),d=document.documentElement;var q=s.get('layout');if(q==='side'||q==='top'||q==='half')localStorage.setItem('${LAYOUT_KEY}',q);var v=q||localStorage.getItem('${LAYOUT_KEY}');if(v==='top'||v==='half')d.dataset.layout=v;var r=s.get('v');if(r==='light'||r==='watercolor'||r==='monet')localStorage.setItem('${VERSION_KEY}',r);var e=r||localStorage.getItem('${VERSION_KEY}');if(e==='watercolor'||e==='monet'){d.dataset.version=e;d.dataset.paint='';var n=s.get('night');if(n==='1'||(n!=='0'&&matchMedia('(prefers-color-scheme: dark)').matches))d.dataset.night=''}}catch(e){}`;
