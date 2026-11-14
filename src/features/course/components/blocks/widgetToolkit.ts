/**
 * Boîte à outils `window.SW` injectée dans l'iframe des widgets (voir `widgetDocument.ts`).
 *
 * Contrat : `widget-toolkit.json` (source unique des signatures, copiée côté backend). Aucune fonction
 * publiée n'est renommée ni retirée : les widgets déjà stockés l'appellent.
 *
 * Règles du script (code de confiance, vérifiées par `widgetToolkit.test.ts`) : JavaScript natif, aucun
 * réseau, stockage, eval, `postMessage` ni accès au parent ; texte du modèle uniquement via `textContent`
 * (ou attributs `aria-label`) ; SVG via `createElementNS` ; couleurs uniquement par les variables `--w-*`.
 *
 * Contraintes d'écriture des chaînes ci-dessous : pas d'accent grave, pas de dollar-accolade, pas
 * d'antislash, et jamais la balise fermante de script (le contenu est inséré tel quel dans le HTML).
 */

/**
 * Logique pure (sans DOM) : échelles, graduations, mise en page des graphes, chemins. Définit `var P`.
 * Exécutable seule dans `vm` pour les tests.
 */
export const PURE_LOGIC_SCRIPT = `var P=(function(){
function num(v,d){if(v==null||v==="")return d;var n=Number(v);return isFinite(n)?n:d}
function clamp(v,a,b){return Math.min(b,Math.max(a,v))}
function fmt(v){return String(parseFloat(Number(v).toPrecision(6)))}
function r2(v){return Math.round(v*100)/100}
function niceTicks(min,max,count){
min=num(min,0);max=num(max,min+1);
if(max<min){var t=min;min=max;max=t}
if(max===min)max=min+1;
count=clamp(Math.round(num(count,5)),2,20);
var raw=(max-min)/count,p=Math.pow(10,Math.floor(Math.log(raw)/Math.LN10)),f=raw/p;
var step=(f<=1?1:f<=2?2:f<=5?5:10)*p;
var first=Math.ceil(min/step-1e-9),out=[];
for(var k=0;k<100;k++){var v=(first+k)*step;if(v>max+step*1e-9)break;out.push(parseFloat(v.toPrecision(12)))}
return out}
function makeScale(d0,d1,r0,r1){
d0=num(d0,0);d1=num(d1,d0+1);
if(d1===d0)return function(){return (r0+r1)/2};
var m=(r1-r0)/(d1-d0);
return function(v){return r0+(v-d0)*m}}
function extent(values,includeZero){
var lo=Infinity,hi=-Infinity;
for(var i=0;i<values.length;i++){var v=values[i];if(typeof v==="number"&&isFinite(v)){if(v<lo)lo=v;if(v>hi)hi=v}}
if(includeZero){lo=Math.min(lo,0);hi=Math.max(hi,0)}
if(lo>hi)return [0,1];
if(lo===hi)hi=lo+1;
return [lo,hi]}
function normPoints(points){
if(!Array.isArray(points))throw new Error("points : tableau de [x, y] attendu");
if(points.length>5000)throw new Error("points : 5000 points au maximum");
return points.map(function(p){
var x,y;
if(Array.isArray(p)){x=p[0];y=p[1]}else if(p&&typeof p==="object"){x=p.x;y=p.y}else return null;
x=num(x,NaN);y=num(y,NaN);
return isFinite(x)&&isFinite(y)?[x,y]:null})}
function sample(fn,a,b,n){
n=clamp(Math.round(num(n,100)),2,2000);
var out=[];
for(var k=0;k<n;k++){var x=a+(b-a)*k/(n-1),y=Number(fn(x));out.push(isFinite(y)?[x,y]:null)}
return out}
function linePath(pts,fx,fy){
var d="",pen=false;
for(var i=0;i<pts.length;i++){
var p=pts[i];
if(!p){pen=false;continue}
d+=(pen?"L":"M")+r2(fx(p[0]))+" "+r2(fy(p[1]));pen=true}
return d}
function normGraph(nodes,edges){
if(!Array.isArray(nodes)||nodes.length===0)throw new Error("nodes : tableau non vide attendu");
if(nodes.length>60)throw new Error("nodes : 60 noeuds au maximum");
var ids=[],labels=[],index=Object.create(null);
nodes.forEach(function(n,i){
var obj=n!=null&&typeof n==="object";
var id=obj?n.id:n;
if(id==null)throw new Error("nodes : identifiant manquant");
id=String(id);
if(id in index)throw new Error("nodes : identifiant en double ("+id+")");
index[id]=i;ids.push(id);
labels.push(obj&&n.label!=null?String(n.label):id)});
var list=Array.isArray(edges)?edges:[];
if(list.length>200)throw new Error("edges : 200 aretes au maximum");
var out=list.map(function(e){
var a,b,l;
if(Array.isArray(e)){a=e[0];b=e[1];l=e[2]}else if(e&&typeof e==="object"){a=e.from;b=e.to;l=e.label}else throw new Error("edges : [de, vers] ou {from, to} attendu");
var ia=index[String(a)],ib=index[String(b)];
if(ia===undefined||ib===undefined)throw new Error("edges : noeud inconnu ("+a+" vers "+b+")");
return {a:ia,b:ib,label:l==null?"":String(l)}});
return {ids:ids,labels:labels,edges:out}}
function graphLayout(n,pairs,w,h,pad){
var cx=w/2,cy=h/2,R=Math.max(1,Math.min(w,h)/2-pad),pos=[],i,j,e,it;
for(i=0;i<n;i++){
var a=2*Math.PI*i/n-Math.PI/2+i*0.013;
pos.push({x:n===1?cx:cx+R*Math.cos(a),y:n===1?cy:cy+R*Math.sin(a)})}
if(n<=3)return pos.map(function(p){return {x:r2(p.x),y:r2(p.y)}});
var k=Math.sqrt(w*h/n)*0.7,temp=Math.min(w,h)/8;
for(it=0;it<150;it++){
var dx=[],dy=[];
for(i=0;i<n;i++){dx.push(0);dy.push(0)}
for(i=0;i<n;i++)for(j=i+1;j<n;j++){
var ex=pos[i].x-pos[j].x,ey=pos[i].y-pos[j].y,d=Math.sqrt(ex*ex+ey*ey)||0.01,f=k*k/d;
dx[i]+=ex/d*f;dy[i]+=ey/d*f;dx[j]-=ex/d*f;dy[j]-=ey/d*f}
for(e=0;e<pairs.length;e++){
var u=pairs[e][0],v=pairs[e][1];
if(u===v)continue;
var fx=pos[u].x-pos[v].x,fy=pos[u].y-pos[v].y,fd=Math.sqrt(fx*fx+fy*fy)||0.01,ff=fd*fd/k;
dx[u]-=fx/fd*ff;dy[u]-=fy/fd*ff;dx[v]+=fx/fd*ff;dy[v]+=fy/fd*ff}
for(i=0;i<n;i++){
var disp=Math.sqrt(dx[i]*dx[i]+dy[i]*dy[i])||0.01,m=Math.min(disp,temp);
pos[i].x+=dx[i]/disp*m;pos[i].y+=dy[i]/disp*m}
temp*=0.97}
var x0=Infinity,x1=-Infinity,y0=Infinity,y1=-Infinity;
pos.forEach(function(p){x0=Math.min(x0,p.x);x1=Math.max(x1,p.x);y0=Math.min(y0,p.y);y1=Math.max(y1,p.y)});
return pos.map(function(p){
return {x:r2(x1>x0?pad+(p.x-x0)/(x1-x0)*(w-2*pad):cx),y:r2(y1>y0?pad+(p.y-y0)/(y1-y0)*(h-2*pad):cy)}})}
function edgeEndpoints(p,q,r){
var dx=q.x-p.x,dy=q.y-p.y,d=Math.sqrt(dx*dx+dy*dy);
if(d<=2*r)return {x1:p.x,y1:p.y,x2:q.x,y2:q.y};
var ux=dx/d,uy=dy/d;
return {x1:r2(p.x+ux*r),y1:r2(p.y+uy*r),x2:r2(q.x-ux*r),y2:r2(q.y-uy*r)}}
function pathEdges(path,edges,directed){
var on=[];
for(var i=0;i+1<path.length;i++){
var u=path[i],v=path[i+1];
for(var e=0;e<edges.length;e++){
var ed=edges[e];
if((ed.a===u&&ed.b===v)||(!directed&&ed.a===v&&ed.b===u)){if(on.indexOf(e)<0)on.push(e)}}}
return on}
function seriesColorSpec(i,rel){
var k=Math.floor(Math.abs(num(i,0)))%8;
if(k===0)return "var(--w-accent)";
if(rel)return "color-mix(in oklch, oklch(from var(--w-accent) l c calc(h + "+(k*45)+")) 88%, var(--w-fg))";
return "color-mix(in srgb, var(--w-accent) "+(100-k*12)+"%, var(--w-fg))"}
return {num:num,clamp:clamp,fmt:fmt,niceTicks:niceTicks,makeScale:makeScale,extent:extent,normPoints:normPoints,sample:sample,linePath:linePath,normGraph:normGraph,graphLayout:graphLayout,edgeEndpoints:edgeEndpoints,pathEdges:pathEdges,seriesColorSpec:seriesColorSpec}
})();`;

/** Partie DOM : API publique. Suppose `P` défini dans la même portée. */
const DOM_SCRIPT = `var NAMES=["svg","axes","line","bars","scatter","graph","slider","stepper","table","color"];
var NS="http://www.w3.org/2000/svg",uid=0,REL=false;
try{REL=typeof CSS!=="undefined"&&!!CSS.supports&&CSS.supports("color","oklch(from red l c h)")}catch(e){}
function nid(p){uid+=1;return "sw-"+p+uid}
function el(tag,cls,text){var e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=String(text);return e}
function sv(tag,attrs,text){var e=document.createElementNS(NS,tag);Object.keys(attrs||{}).forEach(function(k){e.setAttribute(k,String(attrs[k]))});if(text!=null)e.textContent=String(text);return e}
function add(p,c){p.appendChild(c);return c}
function clear(n){while(n.firstChild)n.removeChild(n.firstChild)}
function paint(n,prop,v){n.style.setProperty(prop,v)}
function opt(o){return o&&typeof o==="object"?o:{}}
function str(v,d){return v==null?d:String(v).slice(0,200)}
function userCall(fn,args){try{return fn.apply(null,args)}catch(e){throw {swUser:true,err:e}}}
function mount(t){
if(t==null){if(document.body)return document.body;throw new Error("document.body indisponible")}
if(typeof t==="string"){var e=document.querySelector(t);if(!e)throw new Error("conteneur introuvable : "+t);return e}
if(t.nodeType===1)return t;
throw new Error("conteneur invalide (element ou selecteur CSS attendu)")}
function reportHost(t){try{if(t&&t.nodeType===1)return t;if(typeof t==="string")return document.querySelector(t);if(t&&t.svg&&t.svg.parentNode)return t.svg.parentNode}catch(e){}return null}
function report(name,err,t){try{
var box=el("div","sw-error","SW."+name+" : "+(err&&err.message?err.message:String(err)));
box.setAttribute("role","alert");
add(reportHost(t)||document.body||document.documentElement,box)}catch(e){}}
function pub(name,fn,fallback){return function(){
try{return fn.apply(null,arguments)}catch(e){
if(e&&e.swUser)throw e.err;
if(name!=="color")report(name,e,arguments[0]);
return fallback===undefined?null:fallback}}}
function color(i){return P.seriesColorSpec(i,REL)}
function mkSvg(t,o){
o=opt(o);
var w=P.clamp(P.num(o.width,480),120,2000),ht=P.clamp(P.num(o.height,300),80,2000);
var svg=sv("svg",{viewBox:"0 0 "+w+" "+ht,"class":"sw-svg",role:"img","aria-label":str(o.label,"Graphique")});
add(mount(t),svg);
return {svg:svg,w:w,h:ht}}
function needChart(c){if(!c||!c.svg||!c.plot||typeof c.x!=="function")throw new Error("chart invalide : passer le resultat de SW.axes")}
function text(parent,x,y,cls,anchor,value){return add(parent,sv("text",{x:P.fmt(x),y:P.fmt(y),"class":cls,"text-anchor":anchor},value))}
function apiAxes(t,o){
o=opt(o);
var box=mkSvg(t,o),svg=box.svg,w=box.w,ht=box.h;
var xmin=P.num(o.xmin,0),xmax=P.num(o.xmax,10),ymin=P.num(o.ymin,0),ymax=P.num(o.ymax,10);
if(xmax<=xmin)xmax=xmin+1;
if(ymax<=ymin)ymax=ymin+1;
var pl={l:o.ylabel?56:44,t:14,r:w-16,b:ht-(o.xlabel?44:28)};
var fx=P.makeScale(xmin,xmax,pl.l,pl.r),fy=P.makeScale(ymin,ymax,pl.b,pl.t);
P.niceTicks(xmin,xmax,6).forEach(function(v){
add(svg,sv("line",{x1:fx(v),x2:fx(v),y1:pl.t,y2:pl.b,"class":"sw-grid"}));
text(svg,fx(v),pl.b+16,"sw-tick","middle",P.fmt(v))});
P.niceTicks(ymin,ymax,5).forEach(function(v){
add(svg,sv("line",{x1:pl.l,x2:pl.r,y1:fy(v),y2:fy(v),"class":"sw-grid"}));
text(svg,pl.l-6,fy(v)+4,"sw-tick","end",P.fmt(v))});
add(svg,sv("line",{x1:pl.l,x2:pl.r,y1:pl.b,y2:pl.b,"class":"sw-axis"}));
add(svg,sv("line",{x1:pl.l,x2:pl.l,y1:pl.t,y2:pl.b,"class":"sw-axis"}));
if(o.xlabel)text(svg,(pl.l+pl.r)/2,ht-6,"sw-axlabel","middle",str(o.xlabel));
if(o.ylabel){var yl=text(svg,12,(pl.t+pl.b)/2,"sw-axlabel","middle",str(o.ylabel));yl.setAttribute("transform","rotate(-90 12 "+P.fmt((pl.t+pl.b)/2)+")")}
var clipId=nid("clip"),defs=add(svg,sv("defs",{})),clip=add(defs,sv("clipPath",{id:clipId}));
add(clip,sv("rect",{x:pl.l,y:pl.t,width:pl.r-pl.l,height:pl.b-pl.t}));
var g=add(svg,sv("g",{"clip-path":"url(#"+clipId+")"})),legend=add(svg,sv("g",{}));
if(o.xlabel&&o.ylabel)svg.setAttribute("aria-label",str(o.label,"Graphique")+" ("+str(o.ylabel)+" selon "+str(o.xlabel)+")");
return {svg:svg,x:fx,y:fy,plot:pl,g:g,legend:legend,n:0,xmin:xmin,xmax:xmax}}
function addLegend(c,label,col,dash){
if(!label)return;
var y=c.plot.t+12+c.n*18,g=add(c.legend,sv("g",{}));
c.n+=1;
var ln=add(g,sv("line",{x1:c.plot.l+8,x2:c.plot.l+30,y1:y,y2:y,"stroke-width":3}));
paint(ln,"stroke",col);
if(dash)ln.setAttribute("stroke-dasharray","5 4");
add(g,sv("text",{x:c.plot.l+36,y:y+4,"class":"sw-legend"},label));
c.svg.setAttribute("aria-label",(c.svg.getAttribute("aria-label")||"Graphique")+" ; serie : "+label)}
function seriesPoints(c,pts){
if(typeof pts==="function")return P.sample(function(x){return userCall(pts,[x])},c.xmin,c.xmax,120);
return P.normPoints(pts)}
function apiLine(c,pts,o){
needChart(c);o=opt(o);
var col=color(o.i),path=add(c.g,sv("path",{"class":"sw-line",fill:"none","stroke-width":2.5,"stroke-linejoin":"round"}));
paint(path,"stroke",col);
if(o.dash)path.setAttribute("stroke-dasharray","6 4");
function draw(p){path.setAttribute("d",P.linePath(seriesPoints(c,p),c.x,c.y))}
draw(pts);
addLegend(c,o.label==null?"":str(o.label),col,!!o.dash);
return {path:path,update:pub("line.update",draw)}}
function apiScatter(c,pts,o){
needChart(c);o=opt(o);
var col=color(o.i),r=P.clamp(P.num(o.r,4),1,20),g=add(c.g,sv("g",{}));
function draw(p){
clear(g);
P.normPoints(p).forEach(function(q){
if(!q)return;
var dot=add(g,sv("circle",{cx:P.fmt(c.x(q[0])),cy:P.fmt(c.y(q[1])),r:r,"class":"sw-dot"}));
paint(dot,"fill",col)})}
draw(pts);
addLegend(c,o.label==null?"":str(o.label),col,false);
return {update:pub("scatter.update",draw)}}
function apiBars(t,o){
o=opt(o);
if(!Array.isArray(o.values))throw new Error("values : tableau de nombres attendu");
if(o.values.length>60)throw new Error("values : 60 barres au maximum");
var box=mkSvg(t,o),svg=box.svg,w=box.w,ht=box.h;
var labels=Array.isArray(o.labels)?o.labels.map(function(x){return String(x)}):[];
var hl=Array.isArray(o.highlight)?o.highlight:(o.highlight==null?[]:[o.highlight]);
var pl={l:o.ylabel?56:44,t:18,r:w-12,b:ht-30},g=add(svg,sv("g",{}));
function draw(vals){
clear(g);
var v=vals.map(function(n){return P.num(n,0)}),ex=P.extent(v,true);
var ymin=P.num(o.ymin,ex[0]),ymax=P.num(o.ymax,ex[1]);
if(ymax<=ymin)ymax=ymin+1;
var fy=P.makeScale(ymin,ymax,pl.b,pl.t),zero=fy(P.clamp(0,ymin,ymax)),band=(pl.r-pl.l)/Math.max(1,v.length);
P.niceTicks(ymin,ymax,5).forEach(function(tk){
add(g,sv("line",{x1:pl.l,x2:pl.r,y1:fy(tk),y2:fy(tk),"class":"sw-grid"}));
text(g,pl.l-6,fy(tk)+4,"sw-tick","end",P.fmt(tk))});
add(g,sv("line",{x1:pl.l,x2:pl.l,y1:pl.t,y2:pl.b,"class":"sw-axis"}));
add(g,sv("line",{x1:pl.l,x2:pl.r,y1:zero,y2:zero,"class":"sw-axis"}));
v.forEach(function(val,i){
var on=hl.indexOf(i)>=0,top0=fy(P.clamp(val,ymin,ymax)),cx=pl.l+band*(i+0.5);
var bar=add(g,sv("rect",{x:P.fmt(pl.l+band*i+band*0.15),y:P.fmt(Math.min(top0,zero)),width:P.fmt(band*0.7),height:P.fmt(Math.abs(zero-top0)),"class":on?"sw-bar sw-on":"sw-bar"}));
paint(bar,"fill",color(on?1:0));
text(g,cx,val>=0?top0-4:top0+14,"sw-tick","middle",P.fmt(val));
if(i<labels.length)text(g,cx,pl.b+16,"sw-tick","middle",labels[i].length>10?labels[i].slice(0,9)+"…":labels[i])});
if(o.ylabel){var yl=text(g,12,(pl.t+pl.b)/2,"sw-axlabel","middle",str(o.ylabel));yl.setAttribute("transform","rotate(-90 12 "+P.fmt((pl.t+pl.b)/2)+")")}
svg.setAttribute("aria-label",str(o.label,"Diagramme en barres")+" : "+v.map(function(x,i){return (i<labels.length?labels[i]:String(i+1))+" = "+P.fmt(x)}).join(", "))}
draw(o.values);
return {svg:svg,update:pub("bars.update",function(vals){if(!Array.isArray(vals))throw new Error("values : tableau de nombres attendu");draw(vals)})}}
function apiGraph(t,o){
o=opt(o);
var G=P.normGraph(o.nodes,o.edges),directed=!!o.directed,R=18;
var box=mkSvg(t,o),svg=box.svg;
var pos=P.graphLayout(G.ids.length,G.edges.map(function(e){return [e.a,e.b]}),box.w,box.h,R+14);
var idMk=nid("ar"),idMkOn=nid("ar");
var defs=add(svg,sv("defs",{}));
[[idMk,"sw-arrow"],[idMkOn,"sw-arrow sw-on"]].forEach(function(m){
var mk=add(defs,sv("marker",{id:m[0],viewBox:"0 0 10 10",refX:9,refY:5,markerWidth:7,markerHeight:7,orient:"auto"}));
add(mk,sv("path",{d:"M0 0L10 5L0 10z","class":m[1]}))});
var edgeEls=G.edges.map(function(e){
var p=pos[e.a],q=pos[e.b],node;
if(e.a===e.b){node=sv("path",{d:"M"+P.fmt(p.x-7)+" "+P.fmt(p.y-R)+"A12 12 0 1 1 "+P.fmt(p.x+7)+" "+P.fmt(p.y-R),"class":"sw-edge"})}
else{var ep=P.edgeEndpoints(p,q,R);node=sv("line",{x1:ep.x1,y1:ep.y1,x2:ep.x2,y2:ep.y2,"class":"sw-edge"})}
if(directed)node.setAttribute("marker-end","url(#"+idMk+")");
add(svg,node);
if(e.label)text(svg,(p.x+q.x)/2,(p.y+q.y)/2-5+(e.a===e.b?-R-6:0),"sw-elabel","middle",e.label);
return node});
var nodeEls=G.ids.map(function(id,i){
var g=add(svg,sv("g",{"class":"sw-node"})),lab=G.labels[i];
add(g,sv("circle",{cx:P.fmt(pos[i].x),cy:P.fmt(pos[i].y),r:R}));
add(g,sv("text",{x:P.fmt(pos[i].x),y:P.fmt(pos[i].y+4),"class":"sw-nlabel"},lab.length>8?lab.slice(0,7)+"…":lab));
add(g,sv("title",{},lab));
if(typeof o.onSelect==="function"){
g.setAttribute("tabindex","0");g.setAttribute("role","button");g.setAttribute("aria-label",lab);
g.addEventListener("click",function(){o.onSelect(id)});
g.addEventListener("keydown",function(ev){if(ev.key==="Enter"||ev.key===" "){ev.preventDefault();o.onSelect(id)}})}
return g});
function highlight(spec){
spec=opt(spec);
var nodes=(Array.isArray(spec.nodes)?spec.nodes:[]).map(String),path=(Array.isArray(spec.path)?spec.path:[]).map(String);
var pathIdx=path.map(function(x){return G.ids.indexOf(x)}).filter(function(i){return i>=0});
var onEdges=P.pathEdges(pathIdx,G.edges,directed);
nodeEls.forEach(function(g,i){g.setAttribute("class",nodes.indexOf(G.ids[i])>=0||path.indexOf(G.ids[i])>=0?"sw-node sw-on":"sw-node")});
edgeEls.forEach(function(n,i){
var on=onEdges.indexOf(i)>=0;
n.setAttribute("class",on?"sw-edge sw-on":"sw-edge");
if(directed)n.setAttribute("marker-end","url(#"+(on?idMkOn:idMk)+")")})}
highlight(o.highlight);
svg.setAttribute("aria-label",str(o.label,"Graphe")+" : "+G.ids.length+" noeuds, "+G.edges.length+(directed?" aretes orientees":" aretes")+" ("+G.ids.join(", ")+")");
return {svg:svg,highlight:pub("graph.highlight",highlight)}}
function apiSlider(t,o){
o=opt(o);
var root=add(mount(t),el("div","sw-field")),id=nid("in");
var min=P.num(o.min,0),max=P.num(o.max,10),step=P.num(o.step,1);
if(max<=min)max=min+1;
if(step<=0)step=1;
var val=P.clamp(P.num(o.value,min),min,max);
var lab=add(root,el("label","sw-label",str(o.label,"Valeur")));
lab.setAttribute("for",id);
var inp=add(root,el("input","sw-range"));
inp.setAttribute("type","range");inp.setAttribute("id",id);
inp.setAttribute("min",String(min));inp.setAttribute("max",String(max));inp.setAttribute("step",String(step));
inp.value=String(val);
var out=add(root,el("output","sw-out"));
out.setAttribute("for",id);
function emit(v,wrapped){
out.textContent=P.fmt(v)+(o.unit?" "+str(o.unit):"");
if(typeof o.onChange!=="function")return;
if(wrapped)userCall(o.onChange,[v]);else o.onChange(v)}
inp.addEventListener("input",function(){emit(Number(inp.value),false)});
emit(val,true);
return {input:inp,get:function(){return Number(inp.value)},set:pub("slider.set",function(v){var n=P.clamp(P.num(v,min),min,max);inp.value=String(n);emit(n,true)})}}
function apiStepper(t,o){
o=opt(o);
var steps=Array.isArray(o.steps)?o.steps:[];
if(steps.length===0)throw new Error("steps : tableau non vide attendu");
if(steps.length>100)throw new Error("steps : 100 etapes au maximum");
var n=steps.length,cur=P.clamp(Math.floor(P.num(o.start,0)),0,n-1);
var root=add(mount(t),el("div","sw-stepper")),count=add(root,el("div","sw-step-count")),title=add(root,el("div","sw-step-title")),body=add(root,el("div","sw-step-text")),nav=add(root,el("div","sw-step-nav"));
body.setAttribute("aria-live","polite");
var prev=add(nav,el("button","sw-btn","Précédent")),next=add(nav,el("button","sw-btn","Suivant"));
prev.setAttribute("type","button");next.setAttribute("type","button");
function render(wrapped){
var s=steps[cur],obj=s!=null&&typeof s==="object";
count.textContent="Étape "+(cur+1)+" / "+n;
title.textContent=obj&&s.title!=null?String(s.title):"";
body.textContent=obj?(s.text==null?"":String(s.text)):String(s==null?"":s);
prev.disabled=cur===0;next.disabled=cur===n-1;
if(typeof o.onStep!=="function")return;
if(wrapped)userCall(o.onStep,[cur,s]);else o.onStep(cur,s)}
prev.addEventListener("click",function(){if(cur>0){cur-=1;render(false)}});
next.addEventListener("click",function(){if(cur<n-1){cur+=1;render(false)}});
render(true);
return {goto:pub("stepper.goto",function(i){cur=P.clamp(Math.floor(P.num(i,cur)),0,n-1);render(true)}),get:function(){return cur}}}
function apiTable(t,o){
o=opt(o);
var headers=Array.isArray(o.headers)?o.headers:[],rows=Array.isArray(o.rows)?o.rows:[];
if(rows.length>200)throw new Error("rows : 200 lignes au maximum");
var wrap=add(mount(t),el("div","sw-table-wrap"));
wrap.setAttribute("tabindex","0");wrap.setAttribute("role","region");wrap.setAttribute("aria-label",str(o.caption,"Tableau"));
var tb=add(wrap,el("table","sw-table"));
if(o.caption!=null)add(tb,el("caption","sw-caption",str(o.caption)));
if(headers.length){
var hr=add(add(tb,el("thead")),el("tr"));
headers.forEach(function(x){var th=add(hr,el("th",null,x==null?"":x));th.setAttribute("scope","col")})}
var body=add(tb,el("tbody")),trs=rows.map(function(r){
if(!Array.isArray(r))throw new Error("rows : chaque ligne doit etre un tableau");
var tr=add(body,el("tr"));
r.forEach(function(c){add(tr,el("td",null,c==null?"":c))});
return tr});
function highlight(i){trs.forEach(function(tr,k){tr.className=k===i?"sw-on":""})}
highlight(o.highlight);
return {el:wrap,highlight:pub("table.highlight",highlight)}}
function build(){
var S={};
S.svg=pub("svg",function(t,o){return mkSvg(t,o).svg});
S.axes=pub("axes",apiAxes);
S.line=pub("line",apiLine);
S.bars=pub("bars",apiBars);
S.scatter=pub("scatter",apiScatter);
S.graph=pub("graph",apiGraph);
S.slider=pub("slider",apiSlider);
S.stepper=pub("stepper",apiStepper);
S.table=pub("table",apiTable);
S.color=pub("color",color,"var(--w-accent)");
return S}
function stubs(err){
var S={};
NAMES.forEach(function(n){S[n]=function(){if(n==="color")return "var(--w-accent)";report(n,new Error("boîte à outils indisponible ("+(err&&err.message?err.message:"erreur d'initialisation")+")"));return null}});
return S}
var SW;
try{SW=build()}catch(e){SW=stubs(e)}
try{window.SW=Object.freeze(SW)}catch(e){}`;

/** Script complet injecté dans le head : IIFE, aucune globale hormis `window.SW`. */
export const TOOLKIT_SCRIPT = `(function(){
${PURE_LOGIC_SCRIPT}
${DOM_SCRIPT}
})();`;

/** Styles `.sw-*` : couleurs uniquement par les variables `--w-*` du thème. */
export const TOOLKIT_CSS = `.sw-svg{display:block;width:100%;max-width:640px;height:auto;margin:8px 0}
.sw-grid{stroke:var(--w-border);stroke-width:1}
.sw-axis{stroke:var(--w-muted);stroke-width:1.5}
.sw-tick,.sw-axlabel{fill:var(--w-muted);font-size:13px}
.sw-legend{fill:var(--w-fg);font-size:13px;paint-order:stroke;stroke:var(--w-bg);stroke-width:3px;stroke-linejoin:round}
.sw-line{stroke-linecap:round}
.sw-bar.sw-on{stroke:var(--w-fg);stroke-width:2}
.sw-edge{stroke:var(--w-muted);stroke-width:1.5;fill:none}
.sw-edge.sw-on{stroke:var(--w-accent);stroke-width:3}
.sw-arrow{fill:var(--w-muted)}
.sw-arrow.sw-on{fill:var(--w-accent)}
.sw-elabel{fill:var(--w-muted);font-size:12px}
.sw-node circle{fill:var(--w-surface);stroke:var(--w-muted);stroke-width:2}
.sw-node.sw-on circle{fill:var(--w-accent);stroke:var(--w-accent)}
.sw-node.sw-on .sw-nlabel{fill:var(--w-bg)}
.sw-node[role=button]{cursor:pointer}
.sw-node:focus-visible{outline:2px solid var(--w-accent);outline-offset:2px}
.sw-nlabel{fill:var(--w-fg);font-size:13px;text-anchor:middle;pointer-events:none}
.sw-field{display:grid;grid-template-columns:1fr auto;gap:4px 12px;align-items:center;margin:8px 0}
.sw-range{grid-column:1/-1;width:100%;min-height:24px;accent-color:var(--w-accent)}
.sw-out{font-variant-numeric:tabular-nums;color:var(--w-muted)}
.sw-stepper{margin:8px 0;padding:12px;border:1px solid var(--w-border);border-radius:8px;background:var(--w-surface)}
.sw-step-count{font-size:13px;color:var(--w-muted)}
.sw-step-title{font-weight:600}
.sw-step-text{min-height:3em;margin:4px 0 8px}
.sw-step-nav{display:flex;gap:8px;flex-wrap:wrap}
.sw-btn{min-height:36px;padding:4px 14px;border:1px solid var(--w-border);border-radius:8px;background:var(--w-bg);color:var(--w-fg);cursor:pointer}
.sw-btn:disabled{opacity:.5;cursor:default}
.sw-btn:focus-visible{outline:2px solid var(--w-accent);outline-offset:2px}
.sw-table-wrap{margin:8px 0;overflow-x:auto}
.sw-table-wrap:focus-visible{outline:2px solid var(--w-accent);outline-offset:2px}
.sw-table{border-collapse:collapse;width:100%}
.sw-table th,.sw-table td{padding:6px 10px;border:1px solid var(--w-border);text-align:left}
.sw-table th{background:var(--w-surface)}
.sw-caption{caption-side:top;text-align:left;color:var(--w-muted);padding-bottom:4px}
.sw-table tr.sw-on td{background:var(--w-surface);box-shadow:inset 3px 0 0 var(--w-accent)}
.sw-error{margin:8px 0;padding:8px 10px;border:1px solid var(--w-accent);border-radius:8px;background:var(--w-surface);color:var(--w-fg);font-size:13px}`;
