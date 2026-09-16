const { buildData } = require('../../scripts/ui/data');

// Named exports also load correctly through Eleventy 3.0 on Node 24.
exports.data = function () {
  return { permalink: '/ui-data.json', eleventyExcludeFromCollections: true };
};

exports.render = function () {
  return JSON.stringify(buildData(process.cwd()));
};
