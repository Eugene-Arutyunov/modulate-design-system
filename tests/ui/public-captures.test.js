const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const sharp = require('sharp');
const { digest } = require('../../scripts/ui/model');
const { isPublicCapture, publicChecks } = require('../../scripts/ui/public-captures');
const { redactImage } = require('../../scripts/ui/redact-image');

test('internal captures fail closed without approval and after replacement', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'public-capture-'));
  try {
    const name='internal-users-public.webp';
    fs.writeFileSync(path.join(dir,name),'sanitized');
    assert.equal(isPublicCapture(dir,name),false);
    fs.writeFileSync(path.join(dir,'public-internal.json'),JSON.stringify({version:1,images:{[name]:digest('sanitized')}}));
    assert.equal(isPublicCapture(dir,name),true);
    const check={pageId:'internal-users',screenshots:{production:'/ui-audit/'+name},privacy:{version:1,reviewed:true}};
    assert.equal(publicChecks([check],dir).length,1);
    assert.equal(publicChecks([{...check,privacy:undefined}],dir).length,0);
    fs.writeFileSync(path.join(dir,name),'raw private screenshot');
    assert.equal(isPublicCapture(dir,name),false);
    assert.equal(publicChecks([check],dir).length,0);
  } finally { fs.rmSync(dir,{recursive:true,force:true}); }
});

test('replacement is fully opaque even when the original CSS background is translucent', async () => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'redact-image-'));
  try {
    const input=await sharp({create:{width:40,height:30,channels:3,background:'#ff0000'}}).png().toBuffer();
    const out=path.join(dir,'safe.webp');
    const manifest={version:1,viewport:{width:40,height:30,dpr:1},document:{width:40,height:30},masks:[{x:10,y:8,width:15,height:10,fontSize:10,fill:'rgba(0, 0, 0, 0.1)',color:'#000000',text:''}]};
    await redactImage(input,out,manifest);
    const {data,info}=await sharp(out).removeAlpha().raw().toBuffer({resolveWithObject:true});
    for(let y=8;y<18;y++)for(let x=10;x<25;x++){const i=(y*info.width+x)*3;assert.deepEqual([...data.subarray(i,i+3)],[242,242,246]);}
    await assert.rejects(redactImage(input,out,{...manifest,viewport:{...manifest.viewport,dpr:2}}),/geometry/);
  } finally { fs.rmSync(dir,{recursive:true,force:true}); }
});
