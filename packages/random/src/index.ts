import { PluginOptions } from '@elderjs/elderjs';

const production = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'PRODUCTION';
const plugin: PluginOptions = {
  name: '@elderjs/plugin-random',
  description: 'Adds a /random/ page on previewer requests that displays all of the possible routes.',
  minimumElderjsVersion: '1.7.5',

  init: (plugin) => {
    if (production) {
      plugin.hooks = [];
      plugin.routes = {};
    }
    return plugin;
  },

  routes: {
    pluginRandom: {
      data: {},
      template: 'Random.svelte',
      layout: 'RandomLayout.svelte',
      permalink: ({ request }) => {
        if (request.slug && request.realRoute) return `/random/${request.realRoute}/`;
        return `/random/`;
      },
      all: async ({ settings }) => (settings.server && !production ? [{ slug: '/random/' }] : []),
    },
  },

  hooks: [
    {
      hook: 'allRequests',
      name: 'addRandomAndDebug',
      description: 'Adds /random/route/ requests to allRequests. Also adds /debug/ to all requests.',
      priority: 50, // default
      run: async ({ settings, allRequests, routes }) => {
        if (!production && settings.server) {
          const randomRequests = Object.keys(routes).reduce(
            (out, route) => [...out, { slug: 'random', realRoute: route, route: 'pluginRandom' }],
            [],
          );
          return {
            allRequests: [...allRequests, ...randomRequests],
          };
        }
      },
    },
    {
      hook: 'request',
      name: 'updateRandomRequestWithRealRequest',
      description: 'Adjusts random requests to go to a real page and route',
      priority: 70, // Higher priority incase other plugins also need to be run on the same request.
      run: ({ settings, request: priorRequest, allRequests, routes }) => {
        const { req } = priorRequest;
        if (!production && settings.server && priorRequest.slug === 'random' && priorRequest.route === 'pluginRandom') {
          // filter requests
          const routeRequests = allRequests.filter((r) => r.route === priorRequest.realRoute);

          if (routeRequests && routeRequests.length > 0) {
            // choose a random one
            const randomRequest = Math.floor(Math.random() * (routeRequests.length - 1));

            // update the request
            const selectedRequest = routeRequests.slice(randomRequest, randomRequest + 1)[0];

            // clone to prevent the req object pollution due to pass by reference.
            const request = JSON.parse(JSON.stringify(selectedRequest));
            request.req = req;

            const route = routes[request.route];
            return {
              request,
              route,
            };
          }
        }
      },
    },
    {
      hook: 'request',
      name: 'addAllRequestsToDebugDataObject',
      description: 'Adds the allRequests array to the data object for /debug/',
      run: ({ data, settings, request, allRequests }) => {
        if (!production && settings.server && request.slug === 'debug' && request.route === 'debug') {
          return {
            data: Object.assign({}, data, {
              allRequests: [...allRequests],
            }),
          };
        }
      },
    },
  ],
};

module.exports = plugin;
