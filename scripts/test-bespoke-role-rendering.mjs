#!/usr/bin/env node
// Isolated generated/canonical rendering. The actual template is read only.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {browserType,browserName} from './bespoke-test-browser.mjs';
import {createDevServer} from './bespoke-dev-server.mjs';
import catalog from '../bespoke/builder-catalog.json' with {type:'json'};
import {cssForDesign,defaultDesign,roleStyleDefaults} from '../bespoke/builder-model.mjs';

const root=path.resolve(import.meta.dirname,'..'),output=process.env.BESPOKE_REVIEW_DIR;
if(output)await fs.mkdir(output,{recursive:true});
const template=await fs.readFile(path.join(root,'SPOKES Builder/template.html'),'utf8');
const templateCss=[...template.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(match=>match[1]).join('\n');
const sections=[...template.matchAll(/<section\b[^>]*>[\s\S]*?<\/section>/g)].map(match=>match[0]);
const originals={title:sections.find(s=>s.includes('slide-title active')),divider:sections.find(s=>s.includes('slide-section')),cards:sections.find(s=>s.includes('class="cards-grid"')),video:sections.find(s=>s.includes('slide-video'))};
const legacy=JSON.parse(await fs.readFile(path.join(root,'scripts/test-fixtures/bespoke/selection-money-management.json'),'utf8'));
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const kinds=['title','divider','cards','video','activity'];
const views=[
  {name:'desktop',width:1440,height:1000,canvas:1100,scale:1,mode:'gradient',pattern:'dot-grid',strength:'bold',placement:'top-left',headingSize:'large',bodySize:'large',headingAlign:'right',bodyAlign:'left',font:'inter',bodyFont:'outfit'},
  {name:'phone-long',width:390,height:844,canvas:390,scale:1,mode:'solid',pattern:'plain',strength:'subtle',placement:'bottom-right',headingSize:'small',bodySize:'small',headingAlign:'center',bodyAlign:'right',font:'bitter',bodyFont:'raleway',long:true},
  {name:'phone-text200',width:390,height:700,canvas:390,scale:2,mode:'gradient',pattern:'diagonal',strength:'normal',placement:'top-right',headingSize:'small',bodySize:'large',headingAlign:'left',bodyAlign:'center',font:'inter',bodyFont:'outfit'},
  {name:'narrow-desktop',width:1100,height:700,canvas:700,scale:1,mode:'gradient',pattern:'crosshatch',strength:'normal',placement:'bottom-left',headingSize:'large',bodySize:'small',headingAlign:'left',bodyAlign:'center',font:'bitter',bodyFont:'raleway'},
  {name:'hidden',width:1100,height:700,canvas:900,scale:1,mode:'solid',pattern:'plain',strength:'normal',placement:'bottom-right',headingSize:'small',bodySize:'large',headingAlign:'right',bodyAlign:'center',font:'inter',bodyFont:'outfit',hidden:true}
];
function fixture(view){
  const design=defaultDesign(catalog);design.slides.title.layout=view.name==='phone-text200'?'split':'left';design.slides.title.logo='above';
  design.slides.divider.layout='band';design.slides.cards.count='4';design.slides.cards.layout='columns';design.slides.cards.titleBar=true;design.slides.video.layout='side';design.slides.activity.layout='side';
  design.samples.title=view.long?'Practical workplace choices '.repeat(8).slice(0,200):'Make room for your next step';
  design.samples.subtitle=view.long?'Take time to practice and reflect. '.repeat(15).slice(0,500):'Choose one useful skill and practice it together.';
  design.samples.boxes=Array.from({length:4},(_,i)=>view.long?`${i+1}. `+'Choose one small action. Reflect and adjust. '.repeat(28).slice(0,1190):`Choose one useful action for step ${i+1}.`);
  design.roleStyles={};
  for(const kind of kinds){
    const style={...roleStyleDefaults(catalog,design,kind),backgroundMode:view.mode,primary:'royal',secondary:'mauve',direction:view.name==='narrow-desktop'?'down':'right',pattern:view.pattern,patternStrength:view.strength,headingColor:'light',bodyColor:'gold',headingFont:view.font,bodyFont:view.bodyFont,headingSize:view.headingSize,bodySize:view.bodySize,headingAlignment:view.headingAlign,bodyAlignment:view.bodyAlign,headingVisible:!view.hidden,bodyVisible:!view.hidden,watermarkMode:view.hidden?'off':'text',watermarkText:'PRACTICE 02',watermarkColor:'accent',watermarkSize:view.long?'small':view.name==='desktop'?'large':'medium',watermarkPlacement:view.placement,watermarkOpacity:view.name==='desktop'?'low':view.scale===2?'medium':'high'};
    if(kind!=='title')style.headingText=view.long?'A practical habit that you can develop together '.repeat(5).slice(0,200):`Practice ${kind} together`;
    if(!['title','cards'].includes(kind))style.bodyText=view.long?'Choose a practical step and share your plan. '.repeat(29).slice(0,1200):'Choose a practical next step and share it with a partner.';
    if(['divider','activity'].includes(kind)){style.labelText=kind==='divider'?'CHAPTER PRACTICE':'Practice partners';style.labelVisible=true;}
    design.roleStyles[kind]=style;
  }
  return design;
}
function canonical(kind,design){
  const s=design.roleStyles[kind],heading=escape(kind==='title'?design.samples.title:s.headingText),body=escape(kind==='title'?design.samples.subtitle:s.bodyText);
  const label=escape(s.labelText||'');
  const cards=design.samples.boxes.map((copy,i)=>`<div class="card"><h4>Step ${i+1}</h4><p>${escape(copy)}</p></div>`).join('');
  if(kind==='activity')return `<section class="slide active" data-chapter="7"><h2>${heading}</h2><div class="activity-box"><span class="activity-label">${label}</span><p>${body}</p></div></section>`;
  let markup=originals[kind].replace(/class="slide(?![^\"]*active)/,'class="slide active');
  if(kind==='title')return markup.replace('{{LESSON_TITLE}}',()=>heading).replace('{{SUBTITLE}}',()=>body);
  markup=markup.replace(/<h2>[\s\S]*?<\/h2>/,()=>`<h2>${heading}</h2>`);
  if(kind==='divider')return markup.replace(/<p class="chapter-label">[\s\S]*?<\/p>/,()=>`<p class="chapter-label">${label}</p>`).replace('</section>',()=>`<p>${body}</p></section>`);
  if(kind==='cards')return markup.replace(/<div class="cards-grid">[\s\S]*<\/div>\s*<\/section>/,()=>`<div class="cards-grid">${cards}</div></section>`).replace('{{Optional subtitle}}','Canonical supporting copy');
  // Keep the actual wrapper/inline styles and local poster, but never load media.
  return markup.replace(/<(?:source|track)\b[^>]*>/g,'').replace(/controls/g,'').replace('</section>',()=>`<p>${body}</p></section>`);
}
const selectors={title:['.slide-title-text','h1','.slide-subtitle','.subtitle'],divider:['.slide-heading','h2','.slide-body:not(:first-of-type)','p:not(.chapter-label)'],cards:['.slide-heading','h2','.slide-card .slide-body','.card p'],video:['.slide-heading','h2','.slide-body','p'],activity:['.slide-heading','h2','.slide-body','.activity-box p']};
const server=await createDevServer({port:0}),browser=await browserType.launch();
let renders=0,watermarks=0,visibilityChecks=0,bandPixels=0;const evidence=[],errors=[],external=[];
async function metrics(page,kind,source){
  return page.locator(source==='canonical'?'.slide.active':`.bespoke-slide[data-kind="${kind}"]`).evaluate((el,{kind,source,selectors})=>{
    const r=el.getBoundingClientRect(),s=getComputedStyle(el);
    const text=selector=>{const n=el.querySelector(selector);if(!n)return null;const b=n.getBoundingClientRect(),c=getComputedStyle(n);return {text:n.textContent,display:c.display,color:c.color,font:c.fontFamily,size:parseFloat(c.fontSize),align:c.textAlign,x:b.x-r.x,y:b.y-r.y,w:b.width,h:b.height,sw:n.scrollWidth,cw:n.clientWidth};};
    const rects=[...el.querySelectorAll('h1,h2,h3,h4,p,li,.slide-activity-label,.activity-label,.logo,.slide-logo,.video-container,.slide-video-frame,.section-circle')].filter(n=>!n.closest('.slide-sidebar,.slide-sidebar-disclosure')&&getComputedStyle(n).display!=='none').map(n=>{const b=n.getBoundingClientRect();return {text:n.textContent.slice(0,30),x:b.x-r.x,y:b.y-r.y,w:b.width,h:b.height,sw:n.scrollWidth,cw:n.clientWidth};}).filter(n=>n.w&&n.h);
    const slot=source==='canonical'?1:0,wm=source==='canonical'?getComputedStyle(el,'::after'):el.querySelector('.role-watermark')&&getComputedStyle(el.querySelector('.role-watermark'));
    return {w:r.width,h:r.height,sw:el.scrollWidth,sh:el.scrollHeight,background:s.backgroundColor,image:s.backgroundImage,bgSize:s.backgroundSize,bgPosition:s.backgroundPosition,fontReady:document.fonts.status,heading:text(selectors[kind][slot]),body:text(selectors[kind][slot+2]),frame:kind==='video'?text(source==='canonical'?'.video-container':'.slide-video-frame'):null,label:['divider','activity'].includes(kind)?text(source==='canonical'?(kind==='divider'?'.chapter-label':'.activity-label'):(kind==='divider'?'.slide-body:first-of-type':'.slide-activity-label')):null,wm:wm?{display:wm.display,content:wm.content,color:wm.color,opacity:wm.opacity,align:wm.textAlign,font:wm.fontFamily,size:wm.fontSize,height:wm.height,width:wm.width,position:wm.position,flex:wm.flex}:null,rects};
  },{kind,source,selectors});
}
async function watermarkInk(page,kind,source,placement){
  const locator=page.locator(source==='canonical'?'.slide.active':`.bespoke-slide[data-kind="${kind}"]`);
  await locator.evaluate((el,bottom)=>{el.scrollTop=bottom?el.scrollHeight:0;},placement.startsWith('bottom'));
  // Native media poster compositing can finish between screenshots. Its bounds
  // remain part of overlap checks; mask only its changing pixels in this diff.
  const screenshotOptions={mask:[page.locator('video')],maskColor:'#ffffff'};
  const before=await locator.screenshot(screenshotOptions);
  const hiding=await page.addStyleTag({content:source==='canonical'?'.slide.active::after{visibility:hidden!important}':'.role-watermark{visibility:hidden!important}'});
  const after=await locator.screenshot(screenshotOptions);await hiding.evaluate(el=>el.remove());
  const bbox=await page.evaluate(async([a,b])=>{
    async function data(base64){const img=new Image();img.src='data:image/png;base64,'+base64;await img.decode();const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);return {data:ctx.getImageData(0,0,img.width,img.height).data,width:img.width,height:img.height};}
    const x=await data(a),y=await data(b);let left=x.width,top=x.height,right=-1,bottom=-1,count=0,discardedPixels=0,components=0;
    const mask=new Uint8Array(x.width*x.height);
    for(let p=0;p<x.data.length;p+=4)if(Math.max(...[0,1,2].map(c=>Math.abs(x.data[p+c]-y.data[p+c])))>3)mask[p/4]=1;
    // One or two disconnected edge pixels can change when native media is
    // composited. Keep every connected paint component of at least 3 pixels.
    for(let start=0;start<mask.length;start++)if(mask[start]){
      const pending=[start],pixels=[];mask[start]=0;
      while(pending.length){const i=pending.pop(),px=i%x.width,py=Math.floor(i/x.width);pixels.push(i);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=px+dx,ny=py+dy;if(nx>=0&&nx<x.width&&ny>=0&&ny<x.height){const j=ny*x.width+nx;if(mask[j]){mask[j]=0;pending.push(j);}}}}
      if(pixels.length<3){discardedPixels+=pixels.length;continue;}
      components++;count+=pixels.length;for(const i of pixels){left=Math.min(left,i%x.width);right=Math.max(right,i%x.width);top=Math.min(top,Math.floor(i/x.width));bottom=Math.max(bottom,Math.floor(i/x.width));}
    }
    return {x:left,y:top,w:right-left+1,h:bottom-top+1,count,components,discardedPixels,width:x.width,height:x.height};
  },[before.toString('base64'),after.toString('base64')]);
  assert(bbox.count>8,`${source}/${kind}: watermark actually paints`);
  const m=await metrics(page,kind,source);
  for(const box of m.rects){const intersection=Math.min(bbox.x+bbox.w,box.x+box.w)-Math.max(bbox.x,box.x)>1&&Math.min(bbox.y+bbox.h,box.y+box.h)-Math.max(bbox.y,box.y)>1;if(intersection&&output){await fs.writeFile(path.join(output,'overlap-before.png'),before);await fs.writeFile(path.join(output,'overlap-hidden.png'),after);}assert(!intersection,`${source}/${kind}: watermark overlaps meaningful text ${JSON.stringify({bbox,box,wm:m.wm})}`);}
  if(placement.endsWith('right'))assert(bbox.x+bbox.w>m.w/2,`${source}/${kind} right placement`);else assert(bbox.x<m.w/2,`${source}/${kind} left placement`);
  const visible=m.rects.filter(box=>box.y+box.h>0&&box.y<m.h);
  if(placement.startsWith('top'))assert(!visible.length||bbox.y+bbox.h<=Math.min(...visible.map(box=>box.y))+1,`${source}/${kind} top reserved area`);
  else assert(!visible.length||bbox.y>=Math.max(...visible.map(box=>Math.min(m.h,box.y+box.h)))-1,`${source}/${kind} bottom reserved area`);
  watermarks++;return bbox;
}
async function backgroundPixels(page,locator){
  await locator.evaluate(el=>{el.scrollTop=0;});
  const png=await locator.screenshot();
  return page.evaluate(async encoded=>{const img=new Image();img.src='data:image/png;base64,'+encoded;await img.decode();const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);return [.05,.5,.95].map(y=>[...ctx.getImageData(2,Math.floor(img.height*y),1,1).data].slice(0,3));},png.toString('base64'));
}
try{
  for(const view of views){
    const context=await browser.newContext({viewport:{width:view.width,height:view.height},reducedMotion:'reduce'});
    await context.route(/^https?:/,route=>{if(new URL(route.request().url()).origin===server.baseUrl)return route.continue();external.push(route.request().url());return route.abort();});
    const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
    const design=fixture(view),payload={schema:'bespoke-selection/v2',date:'2026-09-24',submittedAt:'2026-09-24T16:30:00.000Z',lesson:legacy.lesson,team:legacy.team,design};
    const generated=JSON.parse(execFileSync(process.execPath,['scripts/bespoke-model-bridge.mjs','design'],{cwd:root,input:JSON.stringify(payload),encoding:'utf8'}));assert.deepEqual(generated.errors,[]);
    for(const kind of kinds){
      const measured={};
      for(const source of ['generated','canonical']){
        const canonicalSource=source==='canonical';
        await page.setContent(`<html lang="en"><head><base href="${server.baseUrl}/bespoke/"><style>${canonicalSource?templateCss:''}</style><style>html{font-size:${view.scale*100}%}body{margin:0;padding:0}.test-stage{width:${view.canvas}px;max-width:100%}*,*::before,*::after{animation:none!important;transition:none!important}</style><style>${generated.css}</style></head><body><main class="test-stage">${canonicalSource?canonical(kind,design):generated.markup[kind]}</main></body></html>`);
        await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images,...[...document.querySelectorAll('video[poster]')].map(video=>{const img=new Image();img.src=video.poster;return img;})].map(img=>img.decode().catch(()=>{})));await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
        await page.waitForFunction(({selector,visible})=>{const heading=document.querySelector(selector);return heading&&getComputedStyle(heading).color==='rgb(255, 255, 255)'&&(getComputedStyle(heading).display!=='none')===visible;},{selector:canonicalSource?`.slide.active ${selectors[kind][1]}`:`.bespoke-slide ${selectors[kind][0]}`,visible:!view.hidden},{timeout:5000});
        const m=await metrics(page,kind,source),tag=`${view.name}/${source}/${kind}`;renders++;
        assert.equal(m.fontReady,'loaded',tag+' fonts');assert(m.sw<=m.w+1,tag+' horizontal scroll');
        for(const box of m.rects)assert(box.x>=-1&&box.y>=-1&&box.x+box.w<=m.w+1&&box.y+box.h<=m.sh+1&&box.sw<=box.cw+1,tag+' copy containment '+JSON.stringify(box));
        if(m.frame&&m.body&&m.body.display!=='none'){const a=m.frame,b=m.body;const overlaps=Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)>1&&Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)>1;assert(!overlaps,tag+' video frame overlaps supporting copy '+JSON.stringify({frame:a,body:b}));}
        if(canonicalSource&&m.sh>m.h+1){
          const reachable=await page.locator('.slide.active').evaluate(el=>{el.scrollTop=el.scrollHeight;const last=[...el.querySelectorAll('h1,h2,h3,h4,p,li,.activity-label')].filter(node=>node.getBoundingClientRect().width).at(-1);if(!last)return true;const range=document.createRange();range.selectNodeContents(last);const line=[...range.getClientRects()].at(-1),r=el.getBoundingClientRect();el.scrollTop=0;return !line||line.bottom<=r.bottom+1&&line.bottom>=r.top;});
          assert(reachable,tag+' last meaningful copy reachable by normal scroll');
        }
        for(const [type,color,align,fontId] of [['heading','rgb(255, 255, 255)',view.headingAlign,view.font],['body','rgb(211, 178, 87)',view.bodyAlign,view.bodyFont]]){
          const text=m[type];if(!text&&kind==='video'&&view.hidden)continue;assert(text,tag+' '+type+' exists');
          assert.equal(text.display==='none',Boolean(view.hidden),tag+' '+type+' visibility');
          assert.equal(text.color,color,tag+' '+type+' color');assert.equal(text.align,align,tag+' '+type+' alignment');
          assert(text.font.includes(catalog.fonts.find(font=>font.id===fontId).family),tag+' '+type+' font');
          if(type==='body'||kind!=='title'){const expected=(type==='body'?(view.bodySize==='small'?.85:1.3):(view.headingSize==='small'?1.1:2.8))*16*view.scale;assert(Math.abs(text.size-expected)<.05,tag+' '+type+' size');}
        }
        if(m.label)assert.notEqual(m.label.display,'none',tag+' independent label visibility');
        if(kind==='divider'){assert(m.bgSize.endsWith('100% 70%'),tag+' preserves band');assert.equal(m.background,'rgb(255, 255, 255)',tag+' outer band surface');}
        else assert.equal(m.background,'rgb(0, 19, 63)',tag+' selected primary');
        if(!view.hidden){assert.equal(Number(m.wm.opacity),{low:.12,medium:.25,high:.45}[design.roleStyles[kind].watermarkOpacity],tag+' exact watermark opacity');m.watermarkInk=await watermarkInk(page,kind,source,view.placement);}
        else assert(!m.wm||m.wm.display==='none'||['none','""',"''"].includes(m.wm.content),tag+' watermark hidden');
        if(kind==='divider'&&view.name==='phone-long'){
          const locator=page.locator(canonicalSource?'.slide.active':'.bespoke-slide');
          const band=await backgroundPixels(page,locator);assert.deepEqual(band,[[255,255,255],[0,19,63],[255,255,255]],tag+' actual band pixels');
          const centered=structuredClone(design);centered.slides.divider.layout='center';const css=await page.addStyleTag({content:cssForDesign(catalog,centered)});
          const center=await backgroundPixels(page,locator);assert.deepEqual(center,[[0,19,63],[0,19,63],[0,19,63]],tag+' center differs from band');await css.evaluate(el=>el.remove());
          m.bandPixels={band,center};bandPixels++;
        }
        measured[source]=m;evidence.push({view:view.name,kind,source,...m});
        if(output&&((view.name==='desktop'&&['title','divider','cards'].includes(kind)&&source==='generated')||(view.name==='phone-text200'&&['divider','activity'].includes(kind))))await page.screenshot({path:path.join(output,`${view.name}-${source}-${kind}.png`)});
      }
      for(const key of ['background','image','bgSize','bgPosition'])assert.equal(measured.generated[key],measured.canonical[key],`${view.name}/${kind}: actual generated/canonical ${key} parity`);
      for(const type of ['heading','body'])if(measured.generated[type]&&measured.canonical[type])for(const key of ['color','font','align'])assert.equal(measured.generated[type][key],measured.canonical[type][key],`${view.name}/${kind}: ${type} ${key} parity`);
    }
    await context.close();console.log(`PASS ${view.name}: five roles generated/canonical computed styles, containment, visibility and decorative ink`);
  }
  // Explicitly exercise every independent visibility combination for labels.
  const context=await browser.newContext({viewport:{width:900,height:900}}),page=await context.newPage();
  await context.route(/^https?:/,route=>new URL(route.request().url()).origin===server.baseUrl?route.continue():route.abort());
  for(const kind of ['divider','activity'])for(const headingVisible of [true,false])for(const bodyVisible of [true,false])for(const labelVisible of [true,false]){
    const view=views[0],design=fixture(view);Object.assign(design.roleStyles[kind],{headingVisible,bodyVisible,labelVisible,watermarkMode:'off'});
    const payload={schema:'bespoke-selection/v2',date:'2026-09-24',submittedAt:'2026-09-24T16:30:00.000Z',lesson:legacy.lesson,team:legacy.team,design};
    const generated=JSON.parse(execFileSync(process.execPath,['scripts/bespoke-model-bridge.mjs','design'],{cwd:root,input:JSON.stringify(payload),encoding:'utf8'}));
    for(const source of ['generated','canonical']){
      await page.setContent(`<html><head><base href="${server.baseUrl}/bespoke/"><style>${source==='canonical'?templateCss:''}</style><style>${generated.css}</style></head><body>${source==='canonical'?canonical(kind,design):generated.markup[kind]}</body></html>`);
      const m=await metrics(page,kind,source);
      for(const [key,value] of [['heading',headingVisible],['body',bodyVisible],['label',labelVisible]])assert.equal(m[key].display!=='none',value,`${source}/${kind} ${key} independent visibility`);
      visibilityChecks++;
    }
  }
  await context.close();
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  if(output)await fs.writeFile(path.join(output,'role-rendering.json'),JSON.stringify({browser:browserName,renders,watermarks,visibilityChecks,bandPixels,evidence},null,2));
  console.log(`BeSpoke role rendering (${browserName}): ${renders} computed renders, ${watermarks} watermark ink/overlap checks, ${visibilityChecks} visibility combinations passed.`);
}finally{await browser.close();await server.close();}
