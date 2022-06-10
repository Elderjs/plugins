import { PluginOptions, PluginInitPayload } from '@elderjs/elderjs';
import { createServer } from 'http';
import { Server } from 'socket.io';

interface ElderjsPluginInternal {
  run: boolean;
  origin: string;
  prefix: string;
  serverPort: number | string;
  ws?: ReturnType<typeof createServer>;
  io?: Server;
  config: typeof config;
}
type InitFn = PluginInitPayload & { config: typeof config };
type InitReturn = InitFn & { internal: ElderjsPluginInternal };

const config = {
  port: 8080,
  delay: 600,
  preventReloadQS: 'noreload',
  retryCount: 300,
  reload: true, // whether a hard reload should be done in the browser. If false it will fetch and replace the document with the fetched document.
};

const plugin: PluginOptions = {
  name: '@elderjs/plugin-browser-reload',
  minimumElderjsVersion: '1.7.5',
  description:
    'Polls a websocket to make sure a server is up. If it is down, it keeps polling and restarts once the websocket is back up. Basically reloads the webpage automatically. ',
  init: (plugin: InitFn): InitReturn => {
    // used to store the data in the plugin's closure so it is persisted between loads
    const internal: ElderjsPluginInternal = {
      run: !plugin.settings.build && process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'PRODUCTION',
      origin:
        plugin.settings.origin.includes('://') && !plugin.settings.origin.includes('example.com')
          ? plugin.settings.origin
          : 'http://localhost',
      prefix: plugin.settings.prefix,
      serverPort: process.env.SERVER_PORT || 3000,
      config: plugin.config,
    };

    if (internal.prefix) {
      console.log('> Elder.js Auto Reload Plugin auto reloading prefix:', internal.prefix);
    }

    if (internal.run) {
      internal.ws = createServer();
      internal.io = new Server(internal.ws, {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        cors: {
          origin: '*',
        },
      });
      internal.io.on('connection', (client) => {
        client.emit('hi', true);
      });
      internal.ws.listen(internal.config.port);
    }

    return { ...plugin, internal };
  },
  config,
  hooks: [
    {
      hook: 'stacks',
      name: 'addWeSocketClient',
      description: 'Adds websocket logic to footer.',
      priority: 50,
      run: ({ customJsStack, plugin }) => {
        const internal = plugin.internal as ElderjsPluginInternal;
        if (internal.run) {
          customJsStack.push({
            source: 'socksjs',
            string: `
          <script>
          function wait(){
            return new Promise((resolve)=>{
              setTimeout(() => {
                resolve();
            }, ${internal.config.delay});
            });
          }

          async function checkServer(tryCount = 0){
            try {
              var up = await fetch('${internal.origin}:${internal.serverPort}' + document.location.pathname);
              if(up.ok) {
                if(${!internal.config.reload}){
                  const text = await up.text();
                  let parser = new DOMParser();
                  const doc = parser.parseFromString(text, 'text/html');
                  document.replaceChild( doc.documentElement, document.documentElement );
                  console.log('replaced');
                }
                return true;
              }
            } catch(e) {
              // do nothing
            }
            if(tryCount > ${internal.config.retryCount}){
              return false;
            }
            await wait();
            return checkServer(tryCount+1);
          }
          var socketio = document.createElement("script");
          socketio.src = "https://cdn.jsdelivr.net/npm/socket.io-client@4.5.1/dist/socket.io.min.js";
          socketio.rel = "preload";
          socketio.onload = function() {
            if(document.location.search.indexOf('${internal.config.preventReloadQS}') === -1){
              var disconnected = false;
              var socket = io('${internal.origin}:${internal.config.port}');
              socket.on('connect', async function() {
                if (disconnected) {


                  const serverUp = await checkServer();
                  if(serverUp){
                    disconnected = false;
                    if(${internal.config.reload}){
                      console.log('reloaded')
                      window.location.reload();
                    }
                  } else {
                    console.error('Reloading failed after ${internal.config.retryCount} retries to connect.')
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

export default plugin;
