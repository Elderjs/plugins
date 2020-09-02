# Elder.js: Browser Reload

Designed to work with the [Elder.js Template](https://github.com/Elderjs/template/) and integrate browser reloading.

It works by adding a websocket on bootstrap. It then sets up a listener to that websocket on the client.

When the server is restarted due to a code change, the browser will restart as well.

## Install

```bash
npm install --save @elderjs/browser-reload
```

## Config

Once installed, open your `elder.config.js` and configure the plugin by adding `@elderjs/browser-reload` to your plugin object.

```javascript
plugins: {
  '@elderjs/browser-reload': {} // activates the plugin
}
```

## Customizing the Defaults

Below are the default settings of the plugin. You can adjust them to your needs.

```javascript
plugins: {

  '@elderjs/browser-reload': {
    port: 8080, // the port the websocket server should run on.
    delay: 200, // the delay in ms the browser should wait after the server disappears.
    preventReloadQS: 'noreload', // if 'noreload' is in the query string it won't reload that page. Good for CSS editing in the browser.
    retryCount: 50, // number of tries the browser will check to see if the server is up before giving up.
  },

}
```
