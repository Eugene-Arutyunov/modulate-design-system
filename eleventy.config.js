module.exports = function (conf) {
  conf.addFilter("startsWith", (str, prefix) => str.startsWith(prefix));
  conf.addPassthroughCopy("./src/index.js");
  conf.addPassthroughCopy("./src/assets");
  conf.addPassthroughCopy({ "./src/assets/service/fonts": "fonts" });
  conf.addPassthroughCopy("./ui.yaml");
  conf.addPassthroughCopy("./dashboard-charts.json");

  conf.addWatchTarget("./src/styles/");

  // remove internal structure
  conf.addGlobalData("permalink", () => {
    return (data) => {
      const stem = data.page.filePathStem;
      if (stem.startsWith("/service/")) {
        return stem.slice("/service".length) + "/index.html";
      }
      if (stem.startsWith("/prototypes/platform/")) {
        return stem.slice("/prototypes/platform".length) + "/index.html";
      }
      if (stem.startsWith("/prototypes/")) {
        return stem.slice("/prototypes".length) + "/index.html";
      }
      return (
        stem.endsWith("/index")
        ? stem + ".html"
        : stem + "/index.html"
      );
    };
  });

  return {
    dir: {
      input: "./src",
      includes: "./includes",
    },
    htmlTemplateEngine: "njk",
  };
};
