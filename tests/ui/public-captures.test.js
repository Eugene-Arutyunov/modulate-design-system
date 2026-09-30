const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { digest } = require('../../scripts/ui/model');
const { isPublicCapture, publicChecks } = require('../../scripts/ui/public-captures');

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
