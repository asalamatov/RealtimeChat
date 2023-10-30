import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import React from 'react'
import { View, Text } from 'react-native'

const Empty = ({icon, message, centered=true}) => {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: centered ? 'center' : 'flex-start',
        alignItems: 'center',
        paddingVertical: 120,
      }}>
      <FontAwesomeIcon
        icon={icon}
        size={90}
        style={{
          marginBottom: 16,
        }}
        color="#e1e2e4"
      />
      <Text
        style={{
          fontSize: 18,
          color: '#e1e2e4',
        }}>
        {message}
      </Text>
    </View>
  );
}

export default Empty