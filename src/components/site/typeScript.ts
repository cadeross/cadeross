/* Runs before first paint (inlined by the site's layouts): sets
   <html data-type="hand"> when the visitor chose the handwritten text, so
   the page never flashes the typeset version first. The choice is kept in
   localStorage under "cr-type". For previews, ?type=hand|set overrides it
   and ?pen=baby|nz|print swaps the handwriting. It also marks WebKit
   (Safari, and every browser on iOS) with data-webkit, which paints SVG
   filters on the CPU, so the handwriting can skip effects that would make
   it repaint the ink every frame. */
export const TYPE_KEY = "cr-type";

export const typeScript = `try{var q=new URLSearchParams(location.search),d=document.documentElement,t=q.get('type')||localStorage.getItem('${TYPE_KEY}');if(t==='hand')d.dataset.type='hand';var p=q.get('pen');if(p==='baby'||p==='nz'||p==='print')d.dataset.pen=p;var u=navigator.userAgent;if(/AppleWebKit/.test(u)&&!/Chrome|Chromium|Android/.test(u))d.dataset.webkit=''}catch(e){}`;
