# Elder.js Plugin: Sitemap

Easily generate a sitemap for your Elder.js website.

By default it will build a sitemap when you build your Elder.js site.

This sitemap will include a sub-sitemap for each route.

Currently there is a hard limit of 50,000 urls per sub-sitemap. 


## Install

```bash
npm install --save @elderjs/plugin-sitemap
```

## Config


Once installed, open your `elder.config.js` and configure the plugin by adding `@elderjs/plugin-sitemap` to your plugin object.

```javascript
plugins: {

  '@elderjs/plugin-sitemap': {
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
  '@elderjs/plugin-sitemap': {
    origin: '', // the https://yourdomain.com
    exclude: [], // an array of permalinks or permalink prefixes. So you can do ['500'] and it will match /500**
    routeDetails: {
      home: {
        priority: 1.0,
        changefreq: 'monthly',
      },
      blog: {
        priority: 0.8,
        changfreq: 'monthly',
      }
    }, // set custom priority and change freq if not it falls back to default
    lastUpdate: { // configurable last update for each route type.
      home: '2020-01-01',
      blog: async ({ query, request }) => {
        // receives the query prop from hooks. This allows you to hit your db or api or anything else configured on your query object.
        // return a date object.
        return new Date(Date.now());
      }
    }, 
  },
}
```


## Exclusion Logic is Greedy

For example excluding 'green' route
```js
exclude: ['green'],
```
would excude all routes starting with 'green', also 'greenland' and 'green-eggs'

'green' route could be explicitly excluded with
```js
exclude: ['green/'],
```
Also nested routes or specific slugs of route could be excluded with
```js
exclude: ['green/', 'greenland/polar-bear'],
```
