import { Text } from "react-native"


const Title = ({ text, color }) => {
  return (
    <Text
      style={{
        color: color,
        textAlign: 'center',
        fontSize: 48,
        fontFamily: 'LeckerliOne-Regular',
        marginBottom: 40
      }}>
      {text}
    </Text>
  );
}

export default Title