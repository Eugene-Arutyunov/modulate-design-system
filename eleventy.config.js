module.exports = function (conf) {
  conf.addFilter("startsWith", (str, prefix) => str.startsWith(prefix));
  conf.addPassthroughCopy("./src/index.js");
  conf.addPassthroughCopy("./src/assets");
  conf.addPassthroughCopy("./src/fonts");
  conf.addPassthroughCopy("./ui.yaml");
  conf.addPassthroughCopy("./dashboard-charts.json");

  conf.addWatchTarget("./src/index.css");
  conf.addWatchTarget("./src/styles/");

  return {
    dir: {
      input: "./src",
      includes: "./includes",
    },
    htmlTemplateEngine: "njk",
  };
};
