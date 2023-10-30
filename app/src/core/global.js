import {create} from 'zustand';
import secure from './secure';
import api, {ADDRESS} from './api';
import utils from './utils';

//------------------------
//    Socket Receive messages handlers
//------------------------

function responseRequestAccept(set, get, connection) {
  const user = get().user;
  // * if I was the one who accepted the request
  // * remove the request from requestList
  if (user.username === connection.receiver.username) {
    const requestList = [...get().requestList];
    const requestIndex = requestList.findIndex(
      (request) => request.id === connection.id,
    )
    if (requestIndex >= 0) {
      requestList.splice(requestIndex, 1);
      set(state => ({
        requestList: requestList,
      })
      )
    }
  }
  // * if the corresponding user is in the searchList for the acceptor or the acceptee
  // * update the state of the searchList item
  const sl = get().searchList
  if (sl === null) {
    return;
  }
  const searchList = [...sl];

  let searchIndex = -1;
  if (user.username === connection.receiver.username) {
    searchIndex = searchList.findIndex(
      (user) => user.username === connection.sender.username,
    )
    // if the other user accepted
  } else {
    searchIndex = searchList.findIndex(
      (user) => user.username === connection.receiver.username,
    )
  }
  if (searchIndex >= 0) {
    searchList[searchIndex].status = 'connected';
    set(state => ({
      searchList: searchList,
    })
    )
  }
}


function responseRequestList(set, get, requestList) {
  set(state => ({
    requestList: requestList,
  }));
}

function responseRequestConnect(set, get, connection) {
  const user = get().user;
  // * if I was the one who sent the request to connect
  // * update the search list row
  if (user.username === connection.sender.username) {
    const searchList = [...get().searchList];
    const searchIndex = searchList.findIndex(
      (request) => request.username === connection.receiver.username,
    )
    if (searchIndex >= 0) {
      searchList[searchIndex].status = 'pending-them';
      utils.log('--------------------',searchList)
      set(state => ({
        searchList: searchList,
      })
      )}


    // * if they were th the one who sent the request to connect
    // * add request to the request list
  } else {
    const requestList = [...get().requestList];
    const requestIndex = requestList.findIndex(
      (request) => request.username === connection.sender.username,
    )
    if (requestIndex === -1) {
      requestList.unshift(connection);
      // requestList[requestIndex].status = 'connected';
      set(state => ({
        requestList: requestList,
      })
      )}
      console.log("{SUCCESS} - I am HERE")
  }
}


function responseSearch(set, get, data) {
  set(state => ({
    searchList: data,
  }));
}

function responseThumbnail(set, get, data) {
  set(state => ({
    user: data,
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
  //    Websocket
  //------------------------

  socket: null,

  socketConnect: async () => {
    const tokens = await secure.get('tokens');

    const url = `ws://${ADDRESS}/chat/?token=${tokens.access}`;

    const socket = new WebSocket(url);

    socket.onopen = () => {
      utils.log('SOCKET: connected');

      socket.send(JSON.stringify({source: 'request.list'}));
    };

    socket.onmessage = event => {
      const parsed = JSON.parse(event.data);
      // utils.log('onmessage - parsed data: ', parsed.data);
      utils.log('onmessage - parsed: ', parsed);
      const responses = {
        'request.accept'    : responseRequestAccept,
        'request.list'      : responseRequestList,
        'request.connect'   : responseRequestConnect,
        'search'            : responseSearch,
        'thumbnail'         : responseThumbnail,
      };
      // utils.log('responses: ', responses)
      const resp = responses[parsed.source];
      // utils.log(resp, '||||||', responses);
      if (!resp) {
        utils.log(`parced source: "${parsed.source}" not found in responses`);
        return;
      }
      resp(set, get, parsed.data);
    };

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

  socketClose: () => {
    const socket = get().socket;
    if (socket) {
      socket.close();
    }
    set(state => ({
      socket: null,
    }));
  },

  //------------------------
  //    Search
  //------------------------

  searchList: null,

  searchUsers: query => {
    if (query) {
      const socket = get().socket;
      socket.send(
        JSON.stringify({
          source: 'search',
          query: query,
        }),
      );
    } else {
      set(state => ({
        searchList: null,
      }));
    }
  },

  //------------------------
  //    Requests
  //------------------------

  requestList: null,

  requestAccept: username => {
    const socket = get().socket;
    socket.send(
      JSON.stringify({
        source: 'request.accept',
        username: username,
      }),
    );
  },

  requestConnect: username => {
    const socket = get().socket;
    socket.send(
      JSON.stringify({
        source: 'request.connect',
        username: username,
      }),
    );
  },

  //------------------------
  //    Thumbnail
  //------------------------

  uploadThumbnail: file => {
    const socket = get().socket;
    // console.log(get().socket)
    socket.send(
      JSON.stringify({
        source: 'thumbnail',
        base64: file.base64,
        filename: file.fileName,
      }),
    );
  },
}));

export default useGlobal;
