import { Text, View, SafeAreaView, FlatList, ActivityIndicator, Touchable, TouchableOpacity } from 'react-native';
import Empty from '../common/Empty';
import Cell from '../common/Cell';
import useGlobal from '../core/global';
import Thumbnail from '../common/Thumbnail';
import utils from '../core/utils';


const FriendRow = ({navigation, item}) => {
  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('Messages', item )}
    >
      <Cell>
        <Thumbnail url={item.friend.thumbnail} size={76} />
        <View
          style={{
            flex: 1,
            paddingHorizontal: 16,
          }}>
          <Text style={{fontWeight: 'bold', color: '#202020', marginBottom: 4}}>
            {item.friend.name}
          </Text>
          <Text style={{color: '#606060'}}>
            {item.preview}{' '}
            <Text style={{fontWeight: 'bold', color: '#909090'}}>
              {utils.formatTime(item.updated)}
            </Text>
          </Text>
        </View>
      </Cell>
    </TouchableOpacity>
  );
}



const FriendsScreen = ({navigation}) => {
  const friendList = useGlobal(state => state.friendList);
  utils.log('Friends List: ', friendList)

  // show loading indicator
  if (friendList === null) {
    return (
        <ActivityIndicator size="large" style={{flex: 1}} />
    );
  }

  // show empty if no requests
  if (friendList.length === 0) {
    return (
      <Empty icon='inbox' message="No messages yet" />
    );
  }

  return (
    <View>
      <FlatList
        data={friendList}
        renderItem={({item}) => (
          <FriendRow navigation={navigation} item={item} />
        )}
        keyExtractor={item => item.id}
      />
    </View>
  );
};

export default FriendsScreen;
