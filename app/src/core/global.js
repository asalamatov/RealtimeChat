import { create } from 'zustand';
import secure from './secure';
import api, { ADDRESS } from './api';
import utils from './utils';




//------------------------
//    Socket Receive messages handlers
//------------------------

function responseThumbnail(set, get, data) {
    set((state) => ({
        user: data
    }));
}





const useGlobal = create((set, get) => ({
  //------------------------
  //    Initialization
  //------------------------

  initialized: false,

  init: async () => {
    const credentials = await secure.get('credentials');
    if (credentials) {
      try {
        const response = await api({
          method: 'POST',
          url: '/chat/signin/',
          data: {
            username: credentials.username,
            password: credentials.password,
          },
        });

        if (response.status != 200) {
          throw 'Authentication Error';
        }

        const user = response.data.user;
        const tokens = response.data.tokens;

        secure.set('tokens', tokens);

        set(state => ({
          initialized: true,
          authenticated: true,
          user: user,
        }));
        return;
      } catch (error) {
        console.log('useGlobal.init: ', error);
      }
    }
    set(state => ({
      initialized: true,
    }));
  },

  //------------------------
  //    Authentication
  //------------------------
  authenticated: false,
  user: {},

  login: (credentials, user, tokens) => {
    secure.set('credentials', credentials);
    secure.set('tokens', tokens);
    set(state => ({
      authenticated: true,
      user: user,
    }));
  },

  logout: () => {
    secure.wipe();
    set(state => ({
      authenticated: false,
      user: {},
    }));
  },

  //------------------------
  //    Authentication
  //------------------------

  socket: null,

    socketConnect: async () => {
        const tokens = await secure.get('tokens');

        const url = `ws://${ADDRESS}/chat/?token=${tokens.access}`;

        const socket = new WebSocket( url );

        socket.onopen = () => {
            utils.log('SOCKET: connected');
        };

        socket.onmessage = e => {
            const parsed = JSON.parse(e.data);
            utils.log('SOCKET: message', parsed);
            const responses = {
                'thumbnail': responseThumbnail
            }
            const resp = responses[parsed.source]
            if (!resp) {
                utils.log(`parced source: "${parsed.source}" not found in responses`)
                return
            }
            resp(set, get, parsed);
        }

        socket.onerror = e => {
            utils.log('SOCKET: error', e.message);
        };

        socket.onclose = e => {
            utils.log('SOCKET: closed', e.code, e.reason);
        };

        set(state => ({
            socket: socket,
        }));

        // utils.log('TOKENS: ', tokens);
    },

    socketClose: () => {},

  //------------------------
  //    Thumbnail
  //------------------------

	uploadThumbnail: (file) => {
        const socket = get().socket;
        // console.log(get().socket)
            socket.send(JSON.stringify({
                source: 'thumbnail',
                base64: file.base64,
                filename: file.fileName
            }))
        },
}));


export default useGlobal