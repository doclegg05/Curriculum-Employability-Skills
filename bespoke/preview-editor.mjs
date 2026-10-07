/** Selection is transient UI state; every edit goes through the existing history/model. */
export function createPreviewEditor(host) {
 const stage=document.getElementById('modelStage'),toolbar=document.getElementById('contextToolbar');
 const names={title:'Title slide',divider:'Chapter divider',cards:'Text boxes',video:'Video slide',activity:'Activity'};
 let selected='background',targets=[],lastKind,editingText=false;
 // Decorative slide DOM stays isolated from selection, focus and sample controls.
 const thumbnailRoots=new WeakMap();
 const label=(id)=>targets.find(t=>t.id===id)?.label||'Background';
 function select(id,{activate=true,focus=false}={}) {
  selected=id;
  if(activate)host.activate();else refreshSelection();
  if(focus)targets.find(t=>t.id===selected)?.node.focus({preventScroll:true});
 }
 function refreshSelection(){
  const {kind}=host.context();
  for(const t of targets){const on=t.id===selected;t.node.classList.toggle('editor-selected',on);t.node.setAttribute('aria-describedby','selectionHelp');if(on)t.node.setAttribute('aria-current','true');else t.node.removeAttribute('aria-current');}
  const picker=document.getElementById('selectedElement');if(picker)picker.value=selected;
  document.getElementById('editScope').textContent=scope(kind,selected);
  renderToolbar();
 }
 function scope(kind,id){
  const target=label(id);
  if(id.startsWith('box'))return `${target} selected · Fill/border treatment and arrangement affect ALL boxes on Text boxes slides.`;
  if(kind==='cards'&&id.startsWith('heading'))return `${target} selected · Formatting affects the title bar and ALL box headings on Text boxes slides.`;
  if(kind==='cards'&&id.startsWith('body'))return `${target} selected · Formatting affects ALL box text on Text boxes slides. Sample words remain independent.`;
  if(kind==='divider'&&id.startsWith('body'))return `${target} selected · Formatting affects the chapter label and supporting text on Chapter divider slides.`;
  if(kind==='activity'&&id.startsWith('heading'))return `${target} selected · Formatting affects the heading and activity label on Activity slides.`;
  return `${target} selected · ${names[kind]} only. Other slide types and shared defaults stay unchanged.`;
 }
 function field(id,title,value,options,onChange){
  const wrapper=document.createElement('label');wrapper.className='toolbar-field';wrapper.append(document.createTextNode(title));
  const select=document.createElement('select');select.id='context-'+id;
  for(const option of options){const el=document.createElement('option');el.value=String(option.id);el.textContent=option.label;select.append(el);}
  select.value=String(value);select.disabled=!host.context().editable;
  select.onchange=()=>{if(!host.context().editable)return;onChange(select.value);document.getElementById(select.id)?.focus({preventScroll:true});};
  wrapper.append(select);toolbar.append(wrapper);
 }
 function renderToolbar(){
  if(editingText)return;
  const activeId=toolbar.contains(document.activeElement)?document.activeElement.id:null;
  toolbar.replaceChildren();
  const {design,kind,editable,optionsOpen,mode}=host.context();
  if(!design)return;
  // Guide me owns the preview while it runs; Start and Review offer one explicit way into editing.
  toolbar.hidden=mode==='guide';
  for(const id of ['editScope','selectionHelp'])document.getElementById(id).hidden=mode!=='edit';
  if(mode==='guide')return;
  if(mode==='browse'){
   const edit=document.createElement('button');edit.id='btnEditSlide';edit.type='button';edit.className='btn btn-primary';edit.textContent='Edit this slide';
   edit.onclick=()=>{host.activate();document.getElementById('selectedElement')?.focus({preventScroll:true});};
   toolbar.append(edit);return;
  }
  field('element','Selected element',selected,targets.map(t=>({id:t.id,label:t.label})),value=>select(value,{focus:true}));
  document.getElementById('context-element').id='selectedElement';
  const saved={...host.model.roleStyleDefaults(host.catalog,design,kind),...design.roleStyles?.[kind]};
  const effective=host.model.effectiveRoleStyle(host.catalog,design,kind);
  const apply=(key,value)=>host.change(`${names[kind]}: ${key.replace(/([A-Z])/g,' $1').toLowerCase()}`,d=>Object.assign(d,host.model.setRoleStyle(host.catalog,d,kind,key,value)));
  const colors=()=>host.catalog.palette.map(c=>({id:c.id,label:c.name}));
  const colorField=(id,title,value,callback)=>{field(id,title,value,colors(),callback);const input=document.getElementById('context-'+id);input.style.borderLeft='12px solid '+host.catalog.palette.find(c=>c.id===value).hex;};
  if(selected.startsWith('heading')||selected.startsWith('body')||selected==='extra'){
   const type=selected==='extra'?'extra':selected.startsWith('heading')?'heading':'body';
   if(type!=='extra')field('font','Font',effective[type+'Font'],host.catalog.fonts.map(f=>({id:f.id,label:f.label})),v=>apply(type+'Font',v));
   field('size','Size',saved[type+'Size'],[{id:'small',label:'Smaller'},{id:'default',label:'Medium'},{id:'large',label:'Larger'}],v=>apply(type+'Size',v));
   colorField('color','Text color',effective[type+'Color'],v=>apply(type+'Color',v));
   field('align','Align',effective[type+'Alignment'],['left','center','right'].map(id=>({id,label:id[0].toUpperCase()+id.slice(1)})),v=>apply(type+'Alignment',v));
   field('placement','Place in text area',saved[type+'Placement']==='layout'?(kind==='title'&&design.slides.title.layout==='bottom'?'bottom':kind==='title'&&['corner','headline','masthead'].includes(design.slides.title.layout)?'top':'middle'):saved[type+'Placement'],['top','middle','bottom'].map(id=>({id,label:id[0].toUpperCase()+id.slice(1)})),v=>apply(type+'Placement',v));
   const target=targets.find(t=>t.id===selected)?.node;
   const box=target?.closest('.slide-card'),boxIndex=box?[...stage.querySelectorAll('.slide-card')].indexOf(box):-1;
   const isLabel=kind==='activity'&&target?.classList.contains('slide-activity-label')||kind==='divider'&&target?.matches('.slide-body:first-of-type');
   const copyKey=isLabel?'labelText':type+'Text';
   const wrapper=document.createElement('label');wrapper.className='toolbar-copy';wrapper.textContent='Sample text';
   const input=document.createElement('textarea');input.id='context-text';input.rows=2;
   input.maxLength=boxIndex>=0?(type==='heading'?100:host.catalog.sampleLimits.box):isLabel?80:kind==='title'&&type!=='extra'?host.catalog.sampleLimits[type==='heading'?'title':'subtitle']:type==='heading'?200:type==='extra'?500:1200;
   input.value=boxIndex>=0?(type==='heading'?(saved.boxHeadings?.[boxIndex]??`Step ${boxIndex+1}`):design.samples.boxes[boxIndex]):effective[copyKey]??'';
   input.disabled=!editable;let checkpoint=true;
   input.onfocus=()=>{editingText=true;checkpoint=true;};input.onblur=()=>{editingText=false;};
   input.oninput=()=>{if(!editable)return;host.textChange('Edit sample text',d=>{
    if(boxIndex>=0&&type==='body')d.samples.boxes[boxIndex]=input.value;
    else if(boxIndex>=0){const headings=saved.boxHeadings?.slice()??['Step 1','Step 2','Step 3','Step 4'];headings[boxIndex]=input.value;Object.assign(d,host.model.setRoleStyle(host.catalog,d,kind,'boxHeadings',headings));}
    else Object.assign(d,host.model.setRoleStyle(host.catalog,d,kind,copyKey,input.value));
   },checkpoint);checkpoint=false;};wrapper.append(input);toolbar.append(wrapper);
   if(type==='extra'){const remove=document.createElement('button');remove.type='button';remove.className='text-link';remove.textContent='Remove added text';remove.disabled=!editable;remove.onclick=()=>{selected='background';apply('extraText',null);};toolbar.append(remove);}

  }else if(selected.startsWith('box')){
   const decisions=host.catalog.slideGroups.find(g=>g.id==='cards').decisions;
   for(const key of ['look','layout']){const decision=decisions.find(d=>d.id===key);field(key,key==='look'?'Fill & border style':'Box arrangement',design.slides.cards[key],decision.options,v=>host.change('Text boxes: '+decision.label,d=>{d.slides.cards[key]=v;}));}
  }else{
   field('finish','Background',effective.backgroundMode,[{id:'solid',label:'Solid'},{id:'gradient',label:'Gradient'}],v=>apply('backgroundMode',v));
   colorField('background',effective.backgroundMode==='gradient'?'Start color':'Background color',effective.primary,v=>apply('primary',v));
   if(effective.backgroundMode==='gradient')colorField('second','End color',effective.secondary,v=>apply('secondary',v));
  }
  const addText=document.createElement('button');addText.type='button';addText.id='btnAddText';addText.className='btn btn-secondary';addText.textContent=effective.extraText===null?'Add text':'Select added text';addText.disabled=!editable;addText.onclick=()=>{selected='extra';if(effective.extraText===null)apply('extraText','Your text here');else refreshSelection();document.getElementById('context-text')?.focus();};toolbar.append(addText);
  const more=document.createElement('button');more.id='btnMoreOptions';more.type='button';more.className='btn btn-secondary';more.textContent=optionsOpen?'Hide options':'More options';more.setAttribute('aria-expanded',String(optionsOpen));more.setAttribute('aria-controls','detailControls');more.onclick=()=>host.more(selected);toolbar.append(more);
  if(!editable){const note=document.createElement('span');note.className='toolbar-readonly';note.textContent='View only · open your team design to edit.';toolbar.append(note);}
  if(activeId)document.getElementById(activeId)?.focus({preventScroll:true});
 }
 function refresh({thumbnails=true}={}){
  const {kind}=host.context();if(lastKind!==kind){selected='background';lastKind=kind;}
  targets=[];
  const editing=host.context().mode==='edit';
  // Text keeps its visible words as its name; the background and boxes are labeled groups.
  const add=(id,label,node)=>{if(!node||getComputedStyle(node).display==='none'||!node.getClientRects().length)return;targets.push({id,label,node});if(!editing)return;node.dataset.editTarget=id;node.tabIndex=0;if(node.matches('.bespoke-slide,.slide-card')){node.setAttribute('role','group');node.setAttribute('aria-label',label);}};
  add('background','Background',stage.querySelector('.bespoke-slide'));
  add('extra','Added text',stage.querySelector('.slide-extra-text'));
  stage.querySelectorAll('.slide-title-text,.slide-heading,.slide-card h3,.slide-activity-label').forEach((node,i)=>add('heading-'+i,node.closest('.slide-card')?'Box '+(Array.from(stage.querySelectorAll('.slide-card')).indexOf(node.closest('.slide-card'))+1)+' heading':node.classList.contains('slide-activity-label')?'Activity label':'Heading',node));
  stage.querySelectorAll('.slide-subtitle,.slide-body').forEach((node,i)=>add('body-'+i,node.closest('.slide-card')?'Box '+(Array.from(stage.querySelectorAll('.slide-card')).indexOf(node.closest('.slide-card'))+1)+' text':'Supporting text',node));
  stage.querySelectorAll('.slide-card').forEach((node,i)=>add('box-'+i,'Box '+(i+1),node));
  if(!targets.some(t=>t.id===selected))selected='background';
  refreshSelection();
  if(!thumbnails)return;
  for(const button of document.querySelectorAll('#previewTabs [data-view]')){
   let thumb=button.querySelector('.slide-thumbnail');if(!thumb){const text=button.textContent;button.replaceChildren();thumb=document.createElement('span');thumb.className='slide-thumbnail';thumb.setAttribute('aria-hidden','true');thumb.inert=true;thumbnailRoots.set(thumb,thumb.attachShadow({mode:'closed'}));button.append(thumb);const name=document.createElement('span');name.textContent=text;button.append(name);}
   thumbnailRoots.get(thumb).innerHTML='<style>'+document.getElementById('designStyle').textContent+'.bespoke-slide{width:640px!important;max-width:none!important;min-height:360px;transform:scale(.19);transform-origin:top left;box-shadow:none}@media(max-width:760px){.bespoke-slide{transform:scale(.153)}}</style>'+host.thumbnail(button.dataset.view);
  }
 }
 stage.addEventListener('click',event=>{
  if(host.context().mode!=='edit'||event.target.closest('summary,a,input,select,textarea,button'))return;
  const node=event.target.closest('[data-edit-target]');if(node)select(node.dataset.editTarget,{focus:true});
 });
 stage.addEventListener('keydown',event=>{
  if(host.context().mode!=='edit'||event.target.closest('summary,a,input,select,textarea,button'))return;
  if(event.key==='Escape'){event.preventDefault();select('background',{focus:true});}
  else if(event.key==='Enter'||event.key===' '){const node=event.target.closest('[data-edit-target]');if(node){event.preventDefault();select(node.dataset.editTarget,{focus:true});}}
 });
 return {refresh};
}
