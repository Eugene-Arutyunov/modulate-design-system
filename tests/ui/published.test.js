const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { digest } = require('../../scripts/ui/model');
const { validatePublished, publishAssets } = require('../../scripts/ui/published');
const { renderUI } = require('../../scripts/ui/render');
test('clean checkout renders reviewed public captures and copies only referenced images', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ui-public-'));
  try {
    fs.mkdirSync(path.join(root,'src/service'),{recursive:true});
    fs.writeFileSync(path.join(root,'src/service/ui.yaml'),'current:\n  - {id: internal-demo, route: /demo, sections: []}\ntarget:\n  - {id: internal-demo, route: /demo/, sections: []}\n');
    const base = path.join(root,'ui-public');fs.mkdirSync(base);
    fs.writeFileSync(path.join(base,'internal-demo.webp'),'reviewed pixels');
    fs.writeFileSync(path.join(base,'private.txt'),'must not ship');
    const report = {checks:[{pageId:'internal-demo',scenario:'default',privacy:{version:1,reviewed:true},screenshots:{production:'/ui-audit/internal-demo.webp'}}]};
    const result = JSON.stringify(report);
    fs.writeFileSync(path.join(base,'results.json'), result);
    fs.writeFileSync(path.join(base,'manifest.json'),JSON.stringify({version:1,results:digest(result),images:{'internal-demo.webp':digest('reviewed pixels')}}));
    assert.match(renderUI('compare',root),/src="\/ui-audit\/internal-demo.webp"/);
    publishAssets(root,path.join(root,'_site'));
    assert.deepEqual(fs.readdirSync(path.join(root,'_site/ui-audit')),['internal-demo.webp']);
    fs.writeFileSync(path.join(base,'internal-demo.webp'),'unreviewed replacement');
    assert.throws(()=>validatePublished(root),/changed without review/);
    fs.writeFileSync(path.join(base,'internal-demo.webp'),'reviewed pixels');
    fs.writeFileSync(path.join(base,'results.json'),JSON.stringify({checks:[]}));
    assert.throws(()=>validatePublished(root),/changed without a new receipt/);
  } finally {fs.rmSync(root,{recursive:true,force:true});}
});
