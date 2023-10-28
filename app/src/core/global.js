import { create } from 'zustand';
import secure from './secure';
import api from './api';

const useGlobal = create(set => ({


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
        })

        if (response.status != 200) {
          throw 'Authentication Error'
        }

        const user = response.data.user;

        set(state => ({
          initialized: true,
          authenticated: true,
          user: user,
        }));
        return
      } catch (error) {
        console.log('useGlobal.init: ', error)
      }
    }
    set(state => ({
      initialized: true
    }));
  },



  //------------------------
  //    Authentication
  //------------------------
  authenticated: false,
  user: {},

  login: (credentials, user) => {
    secure.set('credentials', credentials);
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
}));


export default useGlobal