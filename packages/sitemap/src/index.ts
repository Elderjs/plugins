import { PluginOptions, PluginInitPayload, RequestObject } from '@elderjs/elderjs';
import fs from 'fs-extra';
import path from 'path';

interface ElderjsPluginInternal {
  config: typeof config;
  ready: boolean;
}

type InitFn = PluginInitPayload & { config: typeof config };
type InitReturn = InitFn & { internal: ElderjsPluginInternal };

type LastUpdateFn = ({ query, request }: { query: unknown; request: RequestObject }) => Date | PromiseLike<Date>;

type Config = {
  origin: string;
  exclude: string[];
  routeDetails: {
    [x: string]: SitemapRequestDetails;
  };
  lastUpdate: {
    [x: string]: Date | string | LastUpdateFn;
  };
};

type SitemapRequestDetails = {
  priority: number;
  changefreq: string;
};

type SitemapRequestObject = RequestObject & { details: SitemapRequestDetails };

const config: Config = {
  origin: '', // the https://yourdomain.com
  exclude: [], // an array of permalinks or permalink prefixes. So you can do ['500'] and it will match /500**
  routeDetails: {}, // set custom priority and change freq if not it falls back to default
  lastUpdate: {}, // configurable last update for each route type.
};

const SITEMAP_INDEX_HEADER = `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/siteindex.xsd">`;
const SITEMAP_INDEX_FOOTER = `</sitemapindex>`;
const SITEMAP_HEADER = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
const SITEMAP_FOOTER = `</urlset>`;

const defaultSitemapRequestDetails: SitemapRequestDetails = {
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

const plugin: PluginOptions = {
  name: '@elderjs/plugin-sitemap',
  description: 'Builds a sitemap for all pages on your site.',
  minimumElderjsVersion: '1.7.5',
  init: (plugin: InitFn): InitReturn => {
    // most of the bootstrap is not due to init() not being async.
    const internal: ElderjsPluginInternal = {
      ready: false,
      ...plugin,
      config: {
        ...plugin.config,
      },
    };

    if (plugin.settings.origin === 'https://example.com') {
      console.error('SITEMAP: You need to set the origin in your elder.config.js to be correct before proceeding.');
    } else if (
      internal.config.origin &&
      typeof internal.config.origin === 'string' &&
      internal.config.origin.includes('://')
    ) {
      internal.ready = true;
    } else if (
      plugin.settings.origin &&
      typeof plugin.settings.origin === 'string' &&
      plugin.settings.origin.includes('://')
    ) {
      internal.ready = true;
      internal.config.origin = plugin.settings.origin;
    } else {
      console.error(
        `elder-plugin-sitemap please make sure you have a full domain name set for the value at 'elder-plugin-sitemap.origin' in your elder.config.js.`,
      );
    }

    return { ...plugin, internal };
  },
  hooks: [
    {
      hook: 'allRequests',
      name: 'addAllRequestsToPlugin',
      description: 'Generates a sitemap on build.',
      priority: 1, // we want it to be last.
      run: async ({ allRequests, plugin, helpers, settings, routes, query }) => {
        const internal = plugin.internal as ElderjsPluginInternal;
        if (settings.build && !settings.worker) {
          if (internal.ready) {
            const customPriority =
              internal.config &&
              typeof internal.config.routeDetails === 'object' &&
              Object.keys(internal.config.routeDetails).length > 0;
            const customLastUpdate =
              internal.config &&
              typeof internal.config.lastUpdate === 'object' &&
              Object.keys(internal.config.lastUpdate).length > 0;

            console.log(`Beginning sitemap generation.`);
            console.time('sitemap');

            const routeNames = Object.keys(routes);
            const sitemapRequests: SitemapRequestObject[] = [];

            const allRequestsWithPermalinks = allRequests.map((request) => ({
              ...request,
              permalink: routes[request.route].permalink({ helpers, request, settings }),
            }));

            for (const cv of allRequestsWithPermalinks) {
              const req: SitemapRequestObject = {
                ...cv,
                details: customPriority
                  ? internal.config.routeDetails[cv.route] || defaultSitemapRequestDetails
                  : defaultSitemapRequestDetails,
              };

              if (customLastUpdate) {
                const dateEntry = internal.config.lastUpdate[req.route];
                if (typeof dateEntry === 'function') {
                  // fn
                  const dateFromFn = await dateEntry({ request: cv, query });
                  if (Object.prototype.toString.call(dateFromFn) === '[object Date]') {
                    req.lastUpdate = dateFromFn;
                  } else {
                    console.error(
                      `lastUpdate function on ${req.route} didn't return a date. Instead saw: ${dateFromFn}. Request: ${req}`,
                    );
                  }
                } else if (typeof dateEntry === 'string') {
                  // must be YYYY-MM-DD;
                  req.lastUpdate = new Date(Date.parse(dateEntry));
                } else {
                  // console.log('Using default fallback', req);
                  req.lastUpdate = defaultSitemapDate;
                }
              } else {
                // console.log('Using default fallback', req);
                req.lastUpdate = defaultSitemapDate;
              }

              sitemapRequests.push(req);
            }

            // split requests into groups based on sitemap;
            const sitemapFileRequests: Record<string, SitemapRequestObject[]> = {};
            for (const routeName of routeNames) {
              const routeRequests = sitemapRequests
                .filter((ar) => ar.route === routeName)
                .filter(
                  (request) =>
                    !internal.config.exclude.find(
                      (e) => request.permalink.startsWith(`/${e}`) || request.permalink.startsWith(`${e}`),
                    ),
                )
                .sort((a, b) => {
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
                const indexFileName = `sitemap-${routeName}${i > 0 ? `-${i}` : ''}.xml`;
                sitemapFileRequests[indexFileName] = routeRequests.splice(0, 50000);
                i += 1;
              }
            }

            const indexFiles: string[] = [];

            for (const [indexFileName, routeRequests] of Object.entries(sitemapFileRequests)) {
              if (routeRequests.length > 0) {
                indexFiles.push(`${internal.config.origin}/${indexFileName}`);

                let xml = SITEMAP_HEADER;
                routeRequests.forEach((request) => {
                  xml += `<url><loc>${internal.config.origin}${request.permalink.replace(
                    /&/g,
                    '&amp;',
                  )}</loc><lastmod>${formatDate(request.lastUpdate)}</lastmod><changefreq>${
                    request.details.changefreq
                  }</changefreq><priority>${request.details.priority}</priority></url>`;
                });
                xml += SITEMAP_FOOTER;

                // todo: remove after v1.
                if (settings.distDir) {
                  fs.writeFileSync(path.resolve(settings.distDir, `./${indexFileName}`), xml, {
                    encoding: 'utf-8',
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
                fs.writeFileSync(path.resolve(settings.distDir, './sitemap.xml'), indexXml, {
                  encoding: 'utf-8',
                });
              }
            } else {
              console.error(new Error('SITEMAP: Unable to write sitemap, no qualified requests.'));
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
  config,
};

export default plugin;
