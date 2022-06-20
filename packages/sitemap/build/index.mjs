var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));

// src/index.ts
import fs from "fs-extra";
import path from "path";
var config = {
  origin: "",
  exclude: [],
  routeDetails: {},
  lastUpdate: {}
};
var SITEMAP_INDEX_HEADER = `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/siteindex.xsd">`;
var SITEMAP_INDEX_FOOTER = `</sitemapindex>`;
var SITEMAP_HEADER = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
var SITEMAP_FOOTER = `</urlset>`;
var defaultSitemapRequestDetails = {
  priority: 0.7,
  changefreq: "monthly"
};
function formatDate(date) {
  let d = date;
  if (typeof date === "string") {
    d = new Date(date);
  }
  let month = "" + (d.getMonth() + 1);
  let day = "" + d.getDate();
  const year = d.getFullYear();
  if (month.length < 2)
    month = "0" + month;
  if (day.length < 2)
    day = "0" + day;
  return [year, month, day].join("-");
}
var defaultSitemapDate = new Date(Date.now());
var plugin = {
  name: "@elderjs/plugin-sitemap",
  description: "Builds a sitemap for all pages on your site.",
  minimumElderjsVersion: "1.7.5",
  init: (plugin2) => {
    const internal = __spreadProps(__spreadValues({
      ready: false
    }, plugin2), {
      config: __spreadValues({}, plugin2.config)
    });
    if (plugin2.settings.origin === "https://example.com") {
      console.error("SITEMAP: You need to set the origin in your elder.config.js to be correct before proceeding.");
    } else if (internal.config.origin && typeof internal.config.origin === "string" && internal.config.origin.includes("://")) {
      internal.ready = true;
    } else if (plugin2.settings.origin && typeof plugin2.settings.origin === "string" && plugin2.settings.origin.includes("://")) {
      internal.ready = true;
      internal.config.origin = plugin2.settings.origin;
    } else {
      console.error(`elder-plugin-sitemap please make sure you have a full domain name set for the value at 'elder-plugin-sitemap.origin' in your elder.config.js.`);
    }
    return __spreadProps(__spreadValues({}, plugin2), { internal });
  },
  hooks: [
    {
      hook: "allRequests",
      name: "addAllRequestsToPlugin",
      description: "Generates a sitemap on build.",
      priority: 1,
      run: async ({ allRequests, plugin: plugin2, helpers, settings, routes, query }) => {
        const internal = plugin2.internal;
        if (settings.build && !settings.worker) {
          if (internal.ready) {
            const customPriority = internal.config && typeof internal.config.routeDetails === "object" && Object.keys(internal.config.routeDetails).length > 0;
            const customLastUpdate = internal.config && typeof internal.config.lastUpdate === "object" && Object.keys(internal.config.lastUpdate).length > 0;
            console.log(`Beginning sitemap generation.`);
            console.time("sitemap");
            const routeNames = Object.keys(routes);
            const sitemapRequests = [];
            const allRequestsWithPermalinks = allRequests.map((request) => __spreadProps(__spreadValues({}, request), {
              permalink: routes[request.route].permalink({ helpers, request, settings })
            }));
            for (const cv of allRequestsWithPermalinks) {
              const req = __spreadProps(__spreadValues({}, cv), {
                details: customPriority ? internal.config.routeDetails[cv.route] || defaultSitemapRequestDetails : defaultSitemapRequestDetails
              });
              if (customLastUpdate) {
                const dateEntry = internal.config.lastUpdate[req.route];
                if (typeof dateEntry === "function") {
                  const dateFromFn = await dateEntry({ request: cv, query });
                  if (Object.prototype.toString.call(dateFromFn) === "[object Date]") {
                    req.lastUpdate = dateFromFn;
                  } else {
                    console.error(`lastUpdate function on ${req.route} didn't return a date. Instead saw: ${dateFromFn}. Request: ${req}`);
                  }
                } else if (typeof dateEntry === "string") {
                  req.lastUpdate = new Date(Date.parse(dateEntry));
                } else {
                  req.lastUpdate = defaultSitemapDate;
                }
              } else {
                req.lastUpdate = defaultSitemapDate;
              }
              sitemapRequests.push(req);
            }
            const sitemapFileRequests = {};
            for (const routeName of routeNames) {
              const routeRequests = sitemapRequests.filter((ar) => ar.route === routeName).filter((request) => !internal.config.exclude.find((e) => request.permalink.startsWith(`/${e}`) || request.permalink.startsWith(`${e}`))).sort((a, b) => {
                if (a.permalink > b.permalink) {
                  return 1;
                }
                if (b.permalink > a.permalink) {
                  return -1;
                }
                return 0;
              });
              let i = 0;
              while (routeRequests.length > 0) {
                const indexFileName = `sitemap-${routeName}${i > 0 ? `-${i}` : ""}.xml`;
                sitemapFileRequests[indexFileName] = routeRequests.splice(0, 5e4);
                i += 1;
              }
            }
            const indexFiles = [];
            for (const [indexFileName, routeRequests] of Object.entries(sitemapFileRequests)) {
              if (routeRequests.length > 0) {
                indexFiles.push(`${internal.config.origin}/${indexFileName}`);
                let xml = SITEMAP_HEADER;
                routeRequests.forEach((request) => {
                  xml += `<url><loc>${internal.config.origin}${request.permalink.replace(/&/g, "&amp;")}</loc><lastmod>${formatDate(request.lastUpdate)}</lastmod><changefreq>${request.details.changefreq}</changefreq><priority>${request.details.priority}</priority></url>`;
                });
                xml += SITEMAP_FOOTER;
                if (settings.distDir) {
                  fs.writeFileSync(path.resolve(settings.distDir, `./${indexFileName}`), xml, {
                    encoding: "utf-8"
                  });
                }
                console.log(`${indexFileName}: ${routeRequests.length} pages`);
              }
            }
            if (indexFiles.length > 0) {
              let indexXml = SITEMAP_INDEX_HEADER;
              for (let i = 0; i < indexFiles.length; i++) {
                indexXml += `<sitemap><loc>${indexFiles[i]}</loc></sitemap>`;
              }
              indexXml += SITEMAP_INDEX_FOOTER;
              if (settings.distDir) {
                fs.writeFileSync(path.resolve(settings.distDir, "./sitemap.xml"), indexXml, {
                  encoding: "utf-8"
                });
              }
            } else {
              console.error(new Error("SITEMAP: Unable to write sitemap, no qualified requests."));
            }
            console.log(`Writing root sitemap`);
            console.timeEnd("sitemap");
            return {
              plugin: plugin2
            };
          }
        }
      }
    }
  ],
  config
};
var src_default = plugin;
export {
  src_default as default
};
