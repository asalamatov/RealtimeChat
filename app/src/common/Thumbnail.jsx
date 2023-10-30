import utils from '../core/utils';
import { Image } from 'react-native';

const Thumbnail = ({url, size}) => {
  return (
    <Image
      source={utils.thumbnail(url)}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#e0e0e0',
      }}
    />
  );
}

export default Thumbnail