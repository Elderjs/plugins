# Elder.js Plugin: Critical Path CSS

Easily generate critical path css for your Elder.js websites using [critical](https://github.com/addyosmani/critical).

While Svelte does a great job of scoping CSS usually you'll have a site wide css file to hold common styles.

If you're using a common css file and are optimizing for load speed, you'll want to defer the common css file and include critical path css. 

This plugin generates the critical path css for each of your templates and automatically includes it in the head when generating the page.

Further Reading: (If you're unfamiliar with why you'd want to use critical path css, we suggest you do some googling on "Critical Path CSS", "FOUC", "Cumulative Layout Shift", and "Lighthouse Audit.")


## Install

```bash
npm install --save @elderjs/plugin-critical-path-css
```

## Config


Once installed, open your `elder.config.js` and configure the plugin by adding `@elderjs/plugin-critical-path-css` to your plugin object.

```javascript
plugins: {

  '@elderjs/plugin-critical-path-css': {
    cssFile: './src/assets/style.css', // location of your website's css file. also accepts an array of files.
    rebuild: false, // set to true to rebuild the critical path css on next build. NOTE: completely overwrites allRequests.
    folder: `./src/assets/critical/`, // relative to root of the project.
    requests: false, // used to specify the specific requests you want used for critical path css generation.
    disable: false, // if for some reason you don't want the critical path css added when the file exists. Also disables building.
    critical: { // settings here: https://github.com/addyosmani/critical
      penthouse: {
        forceInclude: [], // you can force include styles here '.btn' for example
        keepLargerMediaQueries: true,
      },
      dimensions: [
        {
          height: 500,
          width: 300,
        },
        {
          height: 900,
          width: 1280,
        },
      ],
    },
  },


}
```


### Generating Critical Path CSS For Specific Pages On a Route

By default the plugin selects the first 'request' it finds that matches a route to generate critical path css for.

If you want more control or want to generate critical path css from multiple pages you can specify a requests object by route and you are able to control the exact requests the system will build with.

If you pass an array, the css from multiple pages is deduplicated and compressed.

```javascript
plugins: {
  '@elderjs/plugin-critical-path-css': {
    requests: { // used to specify the specific requests you want used for critical path css generation.
      home: [{slug:'/'}],
      blog: [{slug: 'my-first-blog'}, {slug: 'elderjs-rocks'}]
    }, 
    cssFile: './src/assets/style.css', // location of your website's css file. also accepts an array of files.
    rebuild: false, // set to true to rebuild the critical path css on next build. NOTE: completely overwrites allRequests.
    folder: `./src/assets/critical/`, // relative to root of the project.
    disable: false, // if for some reason you don't want the critical path css added when the file exists. Also disables building.
    critical: { // settings here: https://github.com/addyosmani/critical
      penthouse: {
        forceInclude: [], // you can force include styles here '.btn' for example
        keepLargerMediaQueries: true,
      },
      dimensions: [
        {
          height: 500,
          width: 300,
        },
        {
          height: 900,
          width: 1280,
        },
      ],
    },
  },
}
```

## Recommended NPM Script: 

You probably don't want to tinker with your `elder.config.js` file each time you want to rebuild so this plugin accepts the `ELDER_REBUILD_CRITICAL_PATH` env variable. 

If that is the case, update your `package.json` file to include the following script:

`"build:critical": "ELDER_REBUILD_CRITICAL_PATH=true node ./src/build",`

Then you can run it using `npm run build:critical`.

Note: this assumes your build file is at `./src/build` so update the script accordingly.