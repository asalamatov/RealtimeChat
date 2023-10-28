import { Text, View, SafeAreaView, TextInput } from "react-native"

const Input = ({title, value, setValue, error, setError, secureTextEntry=false }) => {
  return (
    <View>
      <Text
        style={{
          color: error ? '#ff5555' : '#70747a',
          marginVertical: 6,
          paddingLeft: 16,
        }}>
        {error ? error : title}
      </Text>
      <TextInput
        autoCapitalize="none"
        autoComplete='off'
        style={{
          backgroundColor: '#e1e2e4',
          borderWidth: 1,
          borderColor: error ?  '#ff5555' : 'transparent',
          borderRadius: 26,
          height: 52,
          paddingHorizontal: 16,
        }}
        secureTextEntry={secureTextEntry}
        value={value}
        onChangeText={(text) => {
          setValue(text)

          if (error) {
            setError('')
          }

        }}
      />
    </View>
  );
};

export default Input