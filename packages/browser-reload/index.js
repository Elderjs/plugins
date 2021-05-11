const plugin = {
  name: 'elderjs-plugin-browser-reload',
  description:
    'Polls a websocket to make sure a server is up. If it is down, it keeps polling and restarts once the websocket is back up. Basically reloads the webpage automatically. ',
  init: (plugin) => {
    // used to store the data in the plugin's closure so it is persisted between loads

    const notProd = process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'PRODUCTION';

    plugin.run = !plugin.settings.build && notProd;
    plugin.origin = plugin.settings.origin.includes('://') ? plugin.settings.origin : 'http://localhost';

    plugin.path = plugin.settings.prefix;

    if (plugin.path) {
      console.log('> Elder.js Auto Reload Plugin auto reloading path:', plugin.settings.prefix);
    }

    plugin.serverPort = process.env.SERVER_PORT || 3000;

    if (plugin.run) {
      plugin.ws = require('http').createServer();
      plugin.io = require('socket.io')(plugin.ws);

      plugin.io.on('connection', (client) => {
        client.emit('hi', true);
      });
      plugin.ws.listen(plugin.config.port);
    }

    return plugin;
  },
  config: {
    port: 8080,
    delay: 600,
    preventReloadQS: 'noreload',
    retryCount: 300,
  },
  hooks: [
    {
      hook: 'stacks',
      name: 'addWeSocketClient',
      description: 'Adds websocket logic to footer.',
      priority: 50,
      run: ({ customJsStack, plugin }) => {
        if (plugin.run) {
          customJsStack.push({
            name: 'socksjs',
            string: `
          <script>
          function wait(){
            return new Promise((resolve)=>{
              setTimeout(() => {
                resolve();
            }, ${plugin.config.delay});
            });
          }

          async function checkServer(tryCount = 0){
            try {
              var up = await fetch('${plugin.origin}:${plugin.serverPort}${plugin.path}');
              if(up.ok) return true;
            } catch(e) {
              // do nothing
            }
            if(tryCount > ${plugin.config.retryCount}){
              return false;
            }
            await wait();
            return checkServer(tryCount+1);
          }
          var socketio = document.createElement("script");
          socketio.src = "https://cdn.jsdelivr.net/npm/socket.io-client@2/dist/socket.io.js";
          socketio.rel = "preload";
          socketio.onload = function() {
            if(document.location.search.indexOf('${plugin.config.preventReloadQS}') === -1){
              var disconnected = false;
              var socket = io('${plugin.origin}:${plugin.config.port}');
              socket.on('connect', async function() {
                if (disconnected) {
                  console.log('reloading');

                  const serverUp = await checkServer();
                  if(serverUp){
                    window.location.reload();
                    disconnected = false;
                  } else {
                    console.error('Reloading failed after ${plugin.config.retryCount} retries to connect.')
                  }
                }
              });
              socket.on('hi', function(data) {
                // console.log('hi', data);
              });
              socket.on('disconnect', function() {
                //   console.log('disonnected');
                disconnected = true;
              });
            }
          };
          document.getElementsByTagName('head')[0].appendChild(socketio);
          
          </script>`,
          });
          return {
            customJsStack,
          };
        }
      },
    },
  ],
};

module.exports = plugin;
exports.default = plugin;
