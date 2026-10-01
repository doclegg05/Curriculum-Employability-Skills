// Selection is transient UI state. Every change uses the builder's existing
// history, validation, draft and shared-save pipeline.
import * as Model from './builder-model.mjs';
const names={title:'Title slide',divider:'Chapter divider',cards:'Text boxes',video:'Video slide',activity:'Activity'};
const $=id=>document.getElementById(id);
const options=pairs=>pairs.map(([id,label])=>({id,label}));
export function createDirectEditor(host){
 let selected='background',view=null,targets=[],sampleOpen=false,thumbnailKey=null;
 const workspace=$('workspace'),panel=$('chromeRail'),stage=$('modelStage');
 document.body.classList.add('direct-editor');
 const bar=document.createElement('nav');bar.className='editor-navigation';bar.setAttribute('aria-label','Editor commands');
 const canvas=document.createElement('button');canvas.id='btnCanvas';canvas.className='btn btn-secondary';canvas.textContent='Edit slide';canvas.onclick=()=>close();
 bar.append(canvas,panel.querySelector('.stepper'));workspace.before(bar);
 const closeButton=document.createElement('button');closeButton.id='btnCloseOptions';closeButton.className='btn btn-secondary inspector-close';closeButton.textContent='Back to slide';closeButton.onclick=()=>close();panel.prepend(closeButton);
 const rail=document.createElement('aside');rail.className='slide-rail';rail.setAttribute('aria-label','Slide designs');rail.innerHTML='<h2>Slides</h2><p>5 reusable designs</p>';rail.append($('previewTabs'));workspace.prepend(rail);
 const toolbar=document.createElement('section');toolbar.id='contextToolbar';toolbar.tabIndex=-1;toolbar.className='context-toolbar';toolbar.setAttribute('aria-label','Selected element controls');$('previewPane').prepend(toolbar);
 const scope=document.createElement('p');scope.id='editScope';scope.className='edit-scope';toolbar.after(scope);
 const help=document.createElement('p');help.className='canvas-hint';help.textContent='Select something on the slide to change its look. Tab to select; Enter to open its controls.';$('modelStage').parentElement.after(help);
 panel.hidden=true;
 const ro=new ResizeObserver(()=>scaleThumbnails());ro.observe(rail);
 function scaleThumbnails(){rail.querySelectorAll('.thumbnail-window').forEach(el=>{el.style.setProperty('--thumb-scale',String(el.clientWidth/960));});}
 function open(){panel.hidden=false;workspace.classList.add('options-open');$('btnMoreOptions')?.setAttribute('aria-expanded','true');}
 function close(){panel.hidden=true;workspace.classList.remove('options-open');$('btnMoreOptions')?.setAttribute('aria-expanded','false');$('btnCanvas').focus({preventScroll:true});}
 function choose(key,{focus=false}={}){
  selected=key;sampleOpen=false;mark();renderToolbar();
  $('liveRegion').textContent='Selected '+(targets.find(t=>t.key===selected)?.label||'Background')+'. '+$('editScope').textContent;
  if(focus)$('editTarget').focus({preventScroll:true});
 }
 stage.addEventListener('click',event=>{
  // The sidebar disclosure is still a native disclosure, not a paint target.
  if(event.target.closest('.slide-sidebar-disclosure'))return;
  const el=event.target.closest('[data-edit-target]');if(el)choose(el.dataset.editTarget);
 });
 stage.addEventListener('keydown',event=>{
  if(event.target!==event.target.closest('[data-edit-target]'))return;
  if(['Enter',' '].includes(event.key)){event.preventDefault();choose(event.target.dataset.editTarget,{focus:true});}
  if(event.key==='Escape'){event.preventDefault();choose('background',{focus:true});}
 });
 function mark(){
  stage.querySelectorAll('[data-edit-target]').forEach(el=>{
   const active=el.dataset.editTarget===selected;el.classList.toggle('edit-selected',active);
   if(el.getAttribute('role')==='button')el.setAttribute('aria-pressed',String(active));
  });
 }
 function discover(){
  targets=[];
  const add=(el,key,label,type,extra={})=>{
   if(!el||getComputedStyle(el).display==='none')return;
   targets.push({el,key,label,type,...extra});el.dataset.editTarget=key;el.tabIndex=0;
   // Preserve container semantics when selectable regions contain other targets.
   el.setAttribute('role',type==='background'||type==='card'||type==='activity'?'group':'button');
   el.setAttribute('aria-label','Select '+label.toLowerCase());el.setAttribute('aria-describedby','editScope');
   el.id='canvas-'+key;
  };
  add(stage.querySelector('.bespoke-slide'),'background','Background','background');
  add(stage.querySelector('.slide-title-text,.slide-heading'),'heading',view==='title'?'Title':'Heading','heading');
  add(stage.querySelector('.slide-subtitle'),'body','Subtitle','body');
  if(view==='divider'){
   const bodies=stage.querySelectorAll('.slide-body');add(bodies[0],'label','Chapter label','body',{textKey:'labelText'});add(bodies[1],'body','Supporting text','body');
  }
  if(view==='cards')stage.querySelectorAll('.slide-card').forEach((el,i)=>{
   add(el,'card-'+i,'Box '+(i+1),'card',{index:i});
   add(el.querySelector('h3'),'card-heading-'+i,'Box '+(i+1)+' heading','heading',{index:i,fixedText:true});
   add(el.querySelector('.slide-body'),'card-body-'+i,'Box '+(i+1)+' text','body',{index:i});
  });
  if(['video','activity'].includes(view))add(stage.querySelector('.slide-body'),'body','Supporting text','body');
  add(stage.querySelector('.slide-activity'),'activity','Activity box','activity');
  add(stage.querySelector('.slide-activity-label'),'label','Activity label','heading',{textKey:'labelText'});
  add(stage.querySelector('.slide-video-frame'),'video','Video frame','video');
  add(stage.querySelector('.slide-logo'),'logo','SPOKES logo','logo');
  if(!targets.some(t=>t.key===selected))selected='background';mark();
 }
 function change(label,mutate){host.change(names[view]+': '+label,mutate);}
 function role(key,value){change(key.replace(/([A-Z])/g,' $1').toLowerCase(),d=>Object.assign(d,Model.setRoleStyle(host.catalog(),d,view,key,value)));}
 function box(index,key,value){change('box '+(index+1)+' '+key,d=>{d.boxStyles||=Array.from({length:4},()=>({fill:'inherit',border:'inherit',look:'inherit'}));d.boxStyles[index][key]=value;});}
 function select(label,id,items,value,callback,{disabled=false}={}){
  const field=document.createElement('label');field.className='toolbar-field';field.textContent=label;
  const el=document.createElement('select');el.id=id;
  for(const item of items){const opt=document.createElement('option');opt.value=String(item.id);opt.textContent=item.label;opt.selected=String(value)===String(item.id);el.append(opt);}
  el.disabled=disabled||(!host.editable()&&id!=='editTarget');el.onchange=()=>callback(items.find(o=>String(o.id)===el.value).id);field.append(el);toolbar.append(field);return el;
 }
 function decision(key,label){const c=host.catalog(),d=host.design(),item=c.slideGroups.find(g=>g.id===view).decisions.find(o=>o.id===key);if(item)select(label||item.label,'edit-'+key,item.options,d.slides[view][key],value=>change(item.label,next=>{next.slides[view][key]=value;}));}
 function renderToolbar(){
  // Preserve native typing, selection, caret and undo while sample copy updates.
  if(toolbar.contains(document.activeElement)&&document.activeElement.matches('textarea,input'))return;
  const focused=toolbar.contains(document.activeElement)?document.activeElement.id:null;
  toolbar.replaceChildren();
  const target=targets.find(t=>t.key===selected)||{label:'Background',type:'background'},c=host.catalog(),d=host.design(),style=Model.effectiveRoleStyle(c,d,view),saved={...Model.roleStyleDefaults(c,d,view),...d.roleStyles?.[view]};
  select('Selected','editTarget',targets.map(t=>({id:t.key,label:t.label})),selected,key=>choose(key));
  const colors=c.palette.map(o=>({id:o.id,label:o.name}));
  const local=(key,label,items,value=style[key])=>select(label,'edit-'+key,items,value,v=>role(key,v));
  let scopeText=names[view]+' only';
  if(['heading','body'].includes(target.type)){
   const prefix=target.type,linked=view==='cards'?(prefix==='heading'?'All box headings and title bar':'All box text'):view==='divider'&&prefix==='body'?'Chapter label and supporting text':view==='activity'&&prefix==='heading'?'Heading and activity label':target.label;
   scopeText=linked+' · '+names[view]+' only';
   local(prefix+'Font','Font',c.fonts,style[prefix+'Font']);
   local(prefix+'Size','Size',options([['small','Smaller'],['default','Match layout'],['large','Larger']]),saved[prefix+'Size']);
   local(prefix+'Color','Text color',colors);
   local(prefix+'Alignment','Align',options([['layout','Match layout'],['left','Left'],['center','Center'],['right','Right']]),saved[prefix+'Alignment']);
   if(!target.fixedText){
    const b=document.createElement('button');b.id='btnSampleText';b.className='btn btn-secondary';b.textContent='Sample words';b.setAttribute('aria-expanded',String(sampleOpen));b.onclick=()=>{sampleOpen=!sampleOpen;renderToolbar();if(sampleOpen)$('editorSampleText').focus();};toolbar.append(b);
   }
   const reset=document.createElement('button');reset.id='btnUseSharedText';reset.className='text-link';reset.textContent='Use shared font & color';reset.disabled=!host.editable();reset.onclick=()=>change('use shared '+prefix+' font and color',next=>{for(const key of [prefix+'Font',prefix+'Color'])Object.assign(next,Model.setRoleStyle(c,next,view,key,'inherit'));});toolbar.append(reset);
  }else if(target.type==='card'){
   const record=d.boxStyles?.[target.index]||{fill:'inherit',border:'inherit',look:'inherit'};
   const inherit=[{id:'inherit',label:'Use slide default'}];
   select('Fill','edit-box-fill',[...inherit,...colors],record.fill,v=>box(target.index,'fill',v));
   select('Border color','edit-box-border',[...inherit,...colors],record.border,v=>box(target.index,'border',v));
   select('Box style','edit-box-look',[...inherit,...c.slideGroups.find(g=>g.id==='cards').decisions.find(o=>o.id==='look').options],record.look,v=>box(target.index,'look',v));
   decision('layout','Layout · all boxes');decision('count','Box count');
   scopeText=target.label+' fill, border & style only · Layout and count affect all boxes on this slide';
  }else if(target.type==='background'){
   local('primary','Background',colors);local('backgroundMode','Finish',options([['inherit','Match layout'],['solid','One color'],['gradient','Two colors']]),saved.backgroundMode);
   if(style.backgroundMode==='gradient')local('secondary','Second color',colors);
   local('pattern','Texture',c.backgrounds);decision('layout','Slide layout');
   scopeText='Background & layout · '+names[view]+' only'+(view==='divider'&&d.slides.divider.layout==='band'?' · Outer band surface uses the shared background':'');
  }else if(target.type==='logo'){decision('logo');decision('layout');scopeText='Logo position & layout · Title slide only';}
  else if(target.type==='video'){decision('frame');decision('layout');scopeText='Video frame & layout · Video slide only';}
  else if(target.type==='activity'){decision('layout');decision('labelStyle');scopeText='Activity box & label style · Activity only';}
  const more=document.createElement('button');more.id='btnMoreOptions';more.className='btn btn-secondary';more.textContent='More options';more.setAttribute('aria-controls','chromeRail');more.setAttribute('aria-expanded',String(!panel.hidden));more.onclick=()=>{open();host.details(view,target.type);};toolbar.append(more);
  scope.textContent=scopeText+'.';
  if(!host.editable())scope.textContent+=' Open your private team link to edit.';
  if(sampleOpen&&!target.fixedText&&['heading','body'].includes(target.type)){
   const field=document.createElement('label');field.className='sample-text-field';field.textContent=target.index!==undefined?'Sample words · Box '+(target.index+1)+' only':'Sample words · '+target.label;
   const input=document.createElement('textarea');input.id='editorSampleText';input.rows=2;input.disabled=!host.editable();
   const key=target.textKey||(target.type==='heading'?'headingText':'bodyText');
   input.value=target.index!==undefined?d.samples.boxes[target.index]:style[key];input.maxLength=target.index!==undefined?c.sampleLimits.box:key==='labelText'?80:view==='title'?c.sampleLimits[target.type==='heading'?'title':'subtitle']:target.type==='heading'?200:1200;
   let checkpoint=false;input.oninput=()=>{host.textChange(target.index,key,input.value,!checkpoint);checkpoint=true;};field.append(input);toolbar.append(field);
  }
  if(focused)$(focused)?.focus({preventScroll:true});
 }
 function thumbnails(){
  const c=host.catalog(),d=host.design(),lessonTitle=host.lessonTitle(),key=JSON.stringify([d,lessonTitle]);
  if(key===thumbnailKey){scaleThumbnails();return;}thumbnailKey=key;
  $('previewTabs').querySelectorAll('[data-view]').forEach((button,index)=>{
   const kind=button.dataset.view;button.setAttribute('aria-label',names[kind]);
   button.innerHTML='<span class="thumbnail-window" aria-hidden="true"><span class="thumbnail-design"></span></span><span class="thumbnail-label">'+(index+1)+'. '+names[kind]+'</span>';
   const design=button.querySelector('.thumbnail-design');design.inert=true;
   // Closed, inert miniature trees avoid duplicating the main slide's semantic
   // landmarks and selector targets. They render the same model and generated CSS.
   const shadow=design.attachShadow({mode:'closed'}),style=document.createElement('style');
   style.textContent=Model.cssForDesign(c,d,{scope:'.bespoke-slide',fontBase:'../fonts',canonical:false})+' .bespoke-slide{min-height:600px!important;box-sizing:border-box}';
   shadow.append(style);const content=document.createElement('div');content.innerHTML=Model.renderSlide(c,d,kind,{logoUrl:'../SPOKES-Logo.png',lessonTitle});shadow.append(content);
  });scaleThumbnails();
 }
 return {
  open,close,
  update({quick=false}={}){
   const next=host.view();if(next!==view){view=next;selected='background';sampleOpen=false;}
   discover();if(quick)return;
   renderToolbar();thumbnails();
   if(host.guiding())open();
  }
 };
}
