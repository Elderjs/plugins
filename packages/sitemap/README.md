# Elder.js Plugin: Critical Path CSS

Easily generate a sitemap for your Elder.js website.

By default it will build a sitemap when you build your Elder.js site.

This sitemap will include a sub-sitemap for each route.

Currently there is a hard limit of 50,000 urls per sub-sitemap. 


## Install


## Config


Once installed, open your `elder.config.js` and configure the plugin by adding 'elder-plugin-critical-path-css' to your plugin object.

```javascript
plugins: {

  'elder-plugin-sitemap': {
    origin: '', // the https://yourdomain.com
    exclude: [], // an array of permalinks or permalink prefixes. So you can do ['500'] and it will match /500**
    routeDetails: {}, // set custom priority and change freq if not it falls back to default
    lastUpdate: {}, // configurable last update for each route type.
  },

}
```


## Configuring Route Specific Details

```javascript
plugins: {
  'elder-plugin-sitemap': {
    origin: '', // the https://yourdomain.com
    exclude: [], // an array of permalinks or permalink prefixes. So you can do ['500'] and it will match /500**
    routeDetails: {
      home: {
        priority: 1.0,
        changefreq: 'monthly',
      }
      blog: {
        priority: 0.8,
        changfreq: 'monthly',
      }
    }, // set custom priority and change freq if not it falls back to default
    lastUpdate: {
      home: '2020-01-01',
      blog: async ({ query, request }) => {
        // return a date object.
        return new Date(Date.now());
      }
    }, // configurable last update for each route type.
  },
}
```
