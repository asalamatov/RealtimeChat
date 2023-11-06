import axios from 'axios';
import { Platform } from 'react-native';

export const ADDRESS = Platform.OS === 'ios'
  ? 'localhost:8000'
// : '10.0.2.2:8000'
  : 'rsvwqv1h-8000.use.devtunnels.ms'

// export const ADDRESS = 'rsvwqv1h-8000.use.devtunnels.ms'

const baseURL = Platform.OS === 'ios'
  ? 'http://' + ADDRESS
  : 'https://' + ADDRESS

const api = axios.create({
  // baseURL: 'https://' + ADDRESS,
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json'
  },
});

export default api;