import {create} from 'zustand';
import secure from './secure';
import api, {ADDRESS} from './api';
import utils from './utils';





//------------------------
//    Socket Receive messages handlers
//------------------------

function responseMessageType(set, get, data) {
  if (data.username !== get().messagesUsername) {
    return;
  }
  set(state => ({
    messageType: new Date(),
  }));
}

function reponseFriendNew(set, get, friend) {
  const friendList = [friend, ...get().friendList];
  set(state => ({
    friendList: friendList,
  }));
}

function responseMessageSend(set, get, data) {
  const username = data.friend.username;
  // Move friendlist item for this friend to the start of list,
  // update the preivew text and update the time stamp
  const friendList = [...get().friendList];
  const friendIndex = friendList.findIndex(
    item => item.friend.username === username,
  );
  if (friendIndex >= 0) {
    const item = friendList[friendIndex];
    item.preview = data.message.text;
    item.updated = data.message.created;
    friendList.splice(friendIndex, 1);
    friendList.unshift(item);
    set(state => ({
      friendList: friendList,
    }));
  }

  // If the message data does not belong to this friind
  // then don;t update the messagesList, as a fresh messageList will
  // be loaded the next time the user opens the correct chat window
  if (get().messagesUsername !== username) {
    return;
  }

  const messagesList = [data.message, ...get().messagesList];
  set(state => ({
    messagesList: messagesList,
  }));
}

function responseMessageList(set, get, data) {
  set(state => ({
    messagesList: [...get().messagesList, ...data.messages],
    messagesUsername: data.friend.username,
  }));
}

function responseFriendList(set, get, friendList) {
  set(state => ({
    friendList: friendList,
  }));
}

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
      socket.send(JSON.stringify({source: 'friend.list'}));
    };

    socket.onmessage = event => {
      const parsed = JSON.parse(event.data);
      // utils.log('onmessage - parsed data: ', parsed.data);
      utils.log('onmessage - parsed: ', parsed);
      const responses = {
        'message.type': responseMessageType,
        'friend.new': reponseFriendNew,
        'message.send': responseMessageSend,
        'message.list': responseMessageList,
        'friend.list': responseFriendList,
        'request.accept': responseRequestAccept,
        'request.list': responseRequestList,
        'request.connect': responseRequestConnect,
        search: responseSearch,
        thumbnail: responseThumbnail,
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
  //    Messages
  //------------------------

  messagesList: [],     //? it is message"S"List, not messageList
  messagesUsername: null,
  messagesTyping: null,

  messageList: (connectionId, page = 0) => {
    if (page === 0) {
      set(state => ({
        messagesList: [],
        messagesUsername: null,
        messagesTyping: null,
      }));
    }
    const socket = get().socket;
    socket.send(
      JSON.stringify({
        source: 'message.list',
        connectionId: connectionId,
		    page: page,
      }),
    );
  },


  messageSend: (connectionId, message) => {
    const socket = get().socket;
    socket.send(
      JSON.stringify({
        source: 'message.send',
        connectionId: connectionId,
		    message: message,
      }),
    );
  },


  messageType: (username) => {
    const socket = get().socket;
    socket.send(
      JSON.stringify({
        source: 'message.type',
        username: username,
      }),
    );
  },

  //------------------------
  //    Friends
  //------------------------

  friendList: null,

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
