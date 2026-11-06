/* Runs before first paint (inlined by the site's layouts): sets
   <html data-type="hand"> when the visitor chose the handwritten text, so
   the page never flashes the typeset version first. The choice is kept in
   localStorage under "cr-type". For previews, ?type=hand|set overrides it
   and ?pen=baby|nz|print swaps the handwriting. */
export const TYPE_KEY = "cr-type";

export const typeScript = `try{var q=new URLSearchParams(location.search),d=document.documentElement,t=q.get('type')||localStorage.getItem('${TYPE_KEY}');if(t==='hand')d.dataset.type='hand';var p=q.get('pen');if(p==='baby'||p==='nz'||p==='print')d.dataset.pen=p}catch(e){}`;
