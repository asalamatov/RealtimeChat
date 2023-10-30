import { Image, Text, TextBase, TouchableOpacity, View, SafeAreaView } from 'react-native';
import { useEffect, useLayoutEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';

import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';

const Tab = createBottomTabNavigator();

import RequestsScreen from './Requests';
import FriendsScreen from './Friends';
import ProfileScreen from './Profile';
import useGlobal from '../core/global';
import Thumbnail from '../common/Thumbnail';


const HomeScreen = ({ navigation }) => {

    const user = useGlobal(state => state.user);

  const socketConnect = useGlobal(state => state.socketConnect);
  const socketClose = useGlobal(state => state.socketClose);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, []);

  useEffect(() => {
    socketConnect();
    return () => {
      socketClose();
    };
  }, []);


    const onSearch = () => {
        navigation.navigate('Search');
    };

  return (
    <Tab.Navigator
      screenOptions={({route, navigation}) => ({
        headerLeft: () => (
          <View style={{marginLeft: 16}}>
            <Thumbnail size={28} url={user.thumbnail} />
          </View>
        ),
        headerRight: () => (
            <TouchableOpacity
                onPress={onSearch}
            >
                <FontAwesomeIcon
                icon="magnifying-glass"
                size={22}
                color="#404040"
                style={{marginRight: 16}}
                />
            </TouchableOpacity>
            ),
            tabBarIcon: ({focused, color, size}) => {
                const icons = {
                    Requests: 'bell',
                    Friends: 'inbox',
                    Profile: 'user',
            };

          const icon = icons[route.name];

          return <FontAwesomeIcon icon={icon} color={color} size={28} />;
        },
        tabBarActiveTintColor: '#202020',
        tabBarInactiveTintColor: '#AAAAAA',
        tabBarShowLabel: false,
      })}>
      <Tab.Screen name="Requests" component={RequestsScreen} />
      <Tab.Screen name="Friends" component={FriendsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default HomeScreen;
