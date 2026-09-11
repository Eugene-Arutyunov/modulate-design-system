const prototypeModels = require("./src/assets/prototypes/data/models.json");

module.exports = function (conf) {
  conf.on("eleventy.before", () => {
    for (const modulePath of ["./scripts/ui/render", "./src/assets/service/ui-review"]) {
      delete require.cache[require.resolve(modulePath)];
    }
  });
  conf.addShortcode("uiTable", view => require("./scripts/ui/render").renderUI(view));
  // Preserve source exclusions, but allow the explicit local-result watch target.
  // Git still ignores all audit artifacts; none are input templates or passthroughs.
  conf.setUseGitIgnore(false);
  for (const line of require("node:fs").readFileSync(".gitignore", "utf8").split(/\r?\n/)) {
    const rule = line.trim();
    if (rule && !rule.startsWith("#") && rule !== ".ui-audit/") conf.ignores.add(rule);
  }
  conf.addWatchTarget("./.ui-audit/latest/");
  conf.addFilter("startsWith", (str, prefix) => str.startsWith(prefix));
  conf.addFilter("formatNumber", (value) => {
    const number = Number(value);
    return Number.isFinite(number) ? number.toLocaleString("en-US") : value;
  });
  conf.addGlobalData("prototypeModels", () => prototypeModels);
  conf.addPassthroughCopy("./src/index.js");
  conf.addPassthroughCopy("./src/assets");
  conf.addPassthroughCopy({
    "./src/assets/fonts": "fonts",
    "./src/assets/prototypes/data/dashboard-charts.json": "dashboard-charts.json",
    "./src/service/ui.yaml": "ui.yaml",
    "./node_modules/three/build/three.module.js": "assets/vendor/three.module.js",
    "./node_modules/three/build/three.core.js": "assets/vendor/three.core.js",
    "./node_modules/three/examples/jsm/loaders/SVGLoader.js":
      "assets/vendor/three-addons/loaders/SVGLoader.js",
  });

  conf.setServerOptions({ middleware: [require("./scripts/ui/serve").auditMiddleware] });

  conf.addWatchTarget("./src/styles/");
  conf.addWatchTarget("./scripts/ui/");
  conf.addWatchTarget("./src/service/ui.yaml");

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
