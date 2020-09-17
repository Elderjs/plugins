const fs = require('fs-extra');
const path = require('path');

const SITEMAP_INDEX_HEADER = `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/siteindex.xsd">`;
const SITEMAP_INDEX_FOOTER = `</sitemapindex>`;
const SITEMAP_HEADER = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
const SITEMAP_FOOTER = `</urlset>`;

const defaultSitemapPriority = {
  priority: 0.7,
  changefreq: 'monthly',
};

function formatDate(date) {
  let d = date;
  if (typeof date === 'string') {
    d = new Date(date);
  }

  let month = '' + (d.getMonth() + 1);
  let day = '' + d.getDate();
  const year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
}

const defaultSitemapDate = new Date(Date.now());

const plugin = {
  name: '@elderjs/plugin-sitemap',
  description: 'Builds a sitemap for all pages on your site.',
  init: (plugin) => {
    // most of the bootstrap is not due to init() not being async.
    plugin.internal = {};

    if (plugin.config.origin && typeof plugin.config.origin === 'string' && plugin.config.origin.includes('://')) {
      plugin.internal.ready = true;
    } else {
      console.error(
        `elder-plugin-sitemap please make sure you have a full domain name set for the value at 'elder-plugin-sitemap.origin' in your elder.config.js.`,
      );
    }

    return plugin;
  },
  hooks: [
    {
      hook: 'allRequests',
      name: 'addAllRequestsToPlugin',
      description: 'Generates a sitemap on build.',
      priority: 100, // we want it to be last.
      run: async ({ allRequests, plugin, settings, routes, query }) => {
        if (settings.build && !settings.worker) {
          if (plugin.internal.ready) {
            const customPriority =
              plugin.config &&
              typeof plugin.config.routeDetails === 'object' &&
              Object.keys(plugin.config.routeDetails).length > 0;
            const customLastUpdate =
              plugin.config &&
              typeof plugin.config.lastUpdate === 'object' &&
              Object.keys(plugin.config.lastUpdate).length > 0;

            console.log(`Beginning sitemap generation.`);
            console.time('sitemap');

            const routeNames = Object.keys(routes);
            const sitemapRequests = [];

            for (let i = 0; i < allRequests.length; i++) {
              const cv = allRequests[i];
              const req = { ...allRequests[i] };
              if (customPriority) {
                req.details = plugin.config.routeDetails[req.route] || defaultSitemapPriority;
              } else {
                req.details = defaultSitemapPriority;
              }

              if (customLastUpdate) {
                if (typeof plugin.config.lastUpdate[req.route] === 'function') {
                  // some users could need their data object... we could do it here, but it will REALLLLY slow things down and should be opt in only.
                  // to do this we'd just call the route.data function... but there will be limitations.

                  const dateFromFn = await plugin.config.lastUpdate[req.route]({ request: cv, query });
                  if (Object.prototype.toString.call(dateFromFn) === '[object Date]') {
                    req.lastUpdate = dateFromFn;
                  } else {
                    console.error(
                      `lastUpdate function on ${req.route} didn't return a date. Instead saw: ${dateFromFn}. Request: ${req}`,
                    );
                  }
                } else if (typeof plugin.config.lastUpdate[req.route] === 'string') {
                  // must be YYYY-MM-DD;
                  req.lastUpdate = new Date(Date.parse(plugin.config.lastUpdate[req.route]));
                } else {
                  console.log('Using default fallback', req);
                  req.lastUpdate = defaultSitemapDate;
                }
              } else {
                console.log('Using default fallback', req);
                req.lastUpdate = defaultSitemapDate;
              }

              sitemapRequests.push(req);
            }

            const indexFiles = [];

            for (let i = 0; i < routeNames.length; i++) {
              const route = routeNames[i];
              const indexFileName = `sitemap-${route}.xml`;
              indexFiles.push({ url: `${plugin.config.origin}/${indexFileName}` });

              const routeRequests = sitemapRequests.filter((ar) => ar.route === route);

              if (routeRequests.length > 50000) {
                throw new Error(`${indexFileName} will have more than 50,000 urls. Implement splitting logic.`);
              }

              let xml = SITEMAP_HEADER;
              routeRequests.forEach((request) => {
                const permalink = routes[route].permalink({ request, settings });

                const exclude = plugin.config.exclude.find(
                  (e) => permalink.startsWith(`/${e}`) || permalink.startsWith(`${e}`),
                );
                if (exclude) return;

                xml += `<url><loc>${plugin.config.origin}${permalink}</loc><lastmod>${formatDate(
                  request.lastUpdate,
                )}</lastmod><changefreq>${request.details.changefreq}</changefreq><priority>${
                  request.details.priority
                }</priority></url>`;
              });
              xml += SITEMAP_FOOTER;

              // todo: remove after v1.
              if (settings.locations && settings.locations.public) {
                fs.writeFileSync(path.resolve(process.cwd(), settings.locations.public, `./${indexFileName}`), xml, {
                  encoding: 'utf-8',
                });
              } else if (settings.distDir) {
                fs.writeFileSync(path.resolve(settings.distDir, `./${indexFileName}`), xml, {
                  encoding: 'utf-8',
                });
              }
              console.log(`${indexFileName}: ${routeRequests.length} pages`);
            }

            let indexXml = SITEMAP_INDEX_HEADER;
            for (let i = 0; i < indexFiles.length; i++) {
              indexXml += `<sitemap><loc>${indexFiles[i].url}</loc></sitemap>`;
            }
            indexXml += SITEMAP_INDEX_FOOTER;

            // todo: remove after v1.
            if (settings.locations && settings.locations.public) {
              fs.writeFileSync(path.resolve(process.cwd(), settings.locations.public, './sitemap.xml'), indexXml, {
                encoding: 'utf-8',
              });
            } else if (settings.distDir) {
              fs.writeFileSync(path.resolve(settings.distDir, './sitemap.xml'), indexXml, {
                encoding: 'utf-8',
              });
            }

            console.log(`Writing root sitemap`);

            // split requests into template specific

            console.timeEnd('sitemap');

            return {
              plugin,
            };
          }
        }
      },
    },
  ],
  config: {
    origin: '', // the https://yourdomain.com
    exclude: [], // an array of permalinks or permalink prefixes. So you can do ['500'] and it will match /500**
    routeDetails: {}, // set custom priority and change freq if not it falls back to default
    lastUpdate: {}, // configurable last update for each route type.
  },
};

module.exports = plugin;
