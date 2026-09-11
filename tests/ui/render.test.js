const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { renderUI } = require('../../scripts/ui/render');
const { digest } = require('../../scripts/ui/model');

test('build renderer provides rows without browser JS and excludes unreviewed private data', () => {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'ui-render-'));
  try {
    fs.mkdirSync(path.join(root,'src/service'),{recursive:true});
    fs.writeFileSync(path.join(root,'src/service/ui.yaml'), `current:\n  - id: internal-demo\n    title: 'Demo <script>'\n    route: /internal/demo\n    sections: []\ntarget:\n  - id: internal-demo\n    title: 'Demo <script>'\n    route: /demo/\n    sections:\n      - section: {widget: demo-table}\n`);
    const base=path.join(root,'.ui-audit/latest');fs.mkdirSync(base,{recursive:true});
    fs.writeFileSync(path.join(base,'internal-demo.webp'),'reviewed pixels');
    const check={pageId:'internal-demo',key:'demo',scenario:'default',screenshots:{production:'/ui-audit/internal-demo.webp'},urls:{production:'https://example.com/private-marker'},reviewedElements:[{element:'Secret',difference:'private-marker'}]};
    fs.writeFileSync(path.join(base,'results.json'),JSON.stringify({checks:[check]}));
    const scheme=renderUI('scheme',root),blocked=renderUI('compare',root);
    assert.match(scheme,/<table/);assert.match(scheme,/demo-table/);assert.match(scheme,/Demo &lt;script&gt;/);assert.doesNotMatch(scheme,/Loading|<script>/);
    assert.doesNotMatch(blocked,/private-marker|internal-demo.webp/);
    check.privacy={version:1,reviewed:true};
    fs.writeFileSync(path.join(base,'results.json'),JSON.stringify({checks:[check]}));
    fs.writeFileSync(path.join(base,'public-internal.json'),JSON.stringify({version:1,images:{'internal-demo.webp':digest('reviewed pixels')}}));
    assert.match(renderUI('compare',root),/<img src="\/ui-audit\/internal-demo.webp"/);
    fs.writeFileSync(path.join(base,'internal-demo.webp'),'unreviewed replacement');
    assert.doesNotMatch(renderUI('compare',root),/private-marker|internal-demo.webp/);
    fs.unlinkSync(path.join(base,'results.json'));assert.match(renderUI('compare',root),/<h2>Pages<\/h2>/);
  } finally {fs.rmSync(root,{recursive:true,force:true});}
});
