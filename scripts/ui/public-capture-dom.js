(() => {
  const allowed = new Set(["Modulate","Dashboard","Docs","Pricing","Overview","API Keys","Usage","Billing","Organization","Conversations","Review Queue","Users & Organizations","Data Management","Invites & Credits","Platform Usage","Org Overrides","Reports","Model Management","Email Status","Users","Organizations","Unverified Signups","Data Export","Data Deletion","Exclude from Training","User","Entity Type","Select","Download Data","Invites","Credit Codes","Create Invite","Created By","Credits","Claims","Tags","Overrides","Status","Created","Link","Actions","Name","Email","Roles","Members","Internal","Invoice Only","Invoice","UUID","User","Organization","Total","#","Previous","Next","Search by name or email...","Search by name, UUID, member email, or tag...","Search by email...","Show test accounts","No unverified signups.","Choose an organization...","Select tag...","Select model...","-","—","Edit","Create Model","All types","All statuses","Export CSV","Bulk Export","Recipient email","Email type","Start date","End date","Recipient filter","All Orgs","All Tags","Generate Report","Month","Tag","Organization Overrides","Bulk Tag Overrides","Conversations Access","Select Organization","Model","Concurrency","$/1k hrs","Enabled","Add Organization","Apply","Remove","Enable","Disable","Access","Updated","Day","Week","Year","All Time","All Models","All Users","Hour","Orgs","All Statuses","Start Date","End Date","Granularity","Usage by Model","Credit Consumption","Credit Grants","Requests by Status","Active Users","Console Status Over Time","New Signups per Period","Cumulative Signups","Top by Credit Grants","Top by Credit Purchases","Top by Credit Consumption","Top by Requests","Search by uuid, name, email or organization","Search by uuid, name, email or tag","Search by email","Signed up","Token expires","Resend email","Generate link","Search","Pending","Sent","Failed","No signups match this email.","Settings","Limits","Models","Insights","Behaviors","Actions","Jobs","Playground","Terms of Use","Privacy Policy","© Modulate.ai",", 2026","Internal admin links","Manage platform users and organizations. Click a row to view details, activity logs, and management actions.","Manage platform users. Click a row to expand details, activity logs, and management actions.","Manage platform organizations. Click a row to expand details, activity logs, and management actions.","Review unverified signups and manage their verification links.","Export user or organization data, permanently delete records, or manage training data exclusions for privacy compliance.","Code","Created / Expires","Create Code","Rescind","Delete Data","Exclude","Include","Training Data Exclusions","Delete","Permanently Delete","Confirmation","Hard Delete"]);
  const normalize = s => String(s || '').replace(/\s+/g, ' ').trim();
  const masks = []; let counter = 0;
  const visible = e => e && getComputedStyle(e).visibility !== 'hidden' && e.getClientRects().length;
  const background = e => {for(let p=e;p;p=p.parentElement){const c=getComputedStyle(p).backgroundColor;if(c!=='rgba(0, 0, 0, 0)'&&c!=='transparent')return c;}return '#ffffff';};
  const add = (r, e, replacement) => {if(r.width<=0||r.height<=0)return; masks.push({x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height,fill:background(e),text:replacement,fontSize:Math.min(18,Number.parseFloat(getComputedStyle(e).fontSize)||14),color:'#686779'});};
  for(const n of [...document.querySelectorAll("body,body *")].flatMap(e=>[...e.childNodes].filter(n=>n.nodeType===3))){
    const e=n.parentElement,t=normalize(n.textContent);
    if(!t||!visible(e)||e.closest('script,style,noscript,option,svg')||allowed.has(t))continue;
    const range=document.createRange();range.selectNodeContents(n);
    const rects=[...range.getClientRects()];if(!rects.length)continue;
    counter++;
    const replacement=t.includes('@')?`person${counter}@example.com`:/^[\d.,%$€£\s:+/\-]+$/.test(t)?'100':/^[a-f\d-]{20,}$/i.test(t)?'00000000-0000-4000-8000-000000000001':`Example ${counter}`;
    rects.forEach((r,i)=>add(r,e,i===0?replacement:''));
  }
  for(const e of document.querySelectorAll('input,textarea,select')){
    if(!visible(e)||['checkbox','radio','button','submit','hidden'].includes(e.type))continue;
    const t=e.value || e.placeholder || '';
    if(t&&!allowed.has(normalize(t)))add(e.getBoundingClientRect(),e,'Example value');
  }
  for(const e of document.querySelectorAll('img,canvas,video,iframe,svg,[class*=barcode]')){
    if(!visible(e))continue;const r=e.getBoundingClientRect();
    // Keep small SVG icons; remove graphics that may encode identifiers or live data.
    if(e.tagName.toLowerCase()==='svg'&&r.width<=40&&r.height<=40&&!e.querySelector('text'))continue;
    add(r,e,r.width>100?'Sample illustration':'');
  }
  for(const e of document.querySelectorAll('body *')){
    if(!visible(e))continue;
    if(getComputedStyle(e).backgroundImage.includes('url('))add(e.getBoundingClientRect(),e,'');
    for(const pseudo of ['::before','::after']){const content=getComputedStyle(e,pseudo).content;if(content&& !['none','normal','""',"''"].includes(content)&&!allowed.has(normalize(content.replace(/^["']|["']$/g,'')))){add(e.getBoundingClientRect(),e,'');break;}}
  }
  return {version:1,viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio},document:{width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight},masks,unknownTextCount:counter};
}
)()
