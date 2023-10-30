import { Text, View, SafeAreaView, ActivityIndicator, FlatList, TouchableOpacity } from 'react-native';
import useGlobal from '../core/global';
import Empty from '../common/Empty';
import Cell from '../common/Cell';
import Thumbnail from '../common/Thumbnail';

const RequestAccept = ({ item }) => {
  const requestAccept = useGlobal(state => state.requestAccept);

  return (
    <TouchableOpacity
      style={{
        backgroundColor: '#202020',
        height: 36,
        borderRadius: 18,
        paddingHorizontal: 14,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onPress={() => requestAccept(item.sender.username)}
    >
      <Text style={{ color: 'white', fontWeight:'bold' }}>Accept</Text>
    </TouchableOpacity>
  )
}

const RequestRow = ({ item }) => {
  const message = 'Requested to connect with you'
  const time = '7m ago'
  return (
    <Cell>
      <Thumbnail url={item.sender.thumbnail} size={76} />
      <View
        style={{
          flex: 1,
          paddingHorizontal: 16,
        }}>
        <Text style={{fontWeight: 'bold', color: '#202020', marginBottom: 4}}>
          {item.sender.name}
        </Text>
        <Text style={{ color: '#606060'}}>
          {message} <Text style={{fontWeight:'bold', color:'#909090'}}>{time}</Text>
        </Text>
      </View>
      <RequestAccept item={item}  />
    </Cell>
  );
}

const RequestsScreen = () => {
  const requestList = useGlobal(state => state.requestList);

  // show loading indicator
  if (requestList === null) {
    return (
        <ActivityIndicator size="large" style={{flex: 1}} />
    );
  }

  // show empty if no requests
  if (requestList.length === 0) {
    return (
      <Empty icon='bell' message="No requests" />
    );
  }

  return (
    <View>
      <FlatList
        data={requestList}
        renderItem={({item}) => (
          <RequestRow item={item} />
        )}
        keyExtractor={item => item.sender.username}
      />
    </View>
  );
};

export default RequestsScreen;
