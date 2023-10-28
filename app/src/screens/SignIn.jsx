import { Keyboard, KeyboardAvoidingView, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useLayoutEffect, useState } from "react";
import Title from "../common/Title";
import Input from "../common/Input";
import Button from "../common/Button";
import api from "../core/api";
import utils from "../core/utils";
import useGlobal from "../core/global";




const SignInScreen = ({ navigation }) => {

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const login = useGlobal(state => state.login)


    useLayoutEffect(() => {
      navigation.setOptions({
        headerShown: false,
      });
    }, []);

  const onSignIn = () => {
    console.log('onSignIn', username, password);

    // check username
    const failUsername = !username || username.length < 4;
    if (failUsername) {
      setUsernameError('Username should be at least 4 characters')
    }

    // check password
    const failPassword = !password || password.length < 8
    if (failPassword) {
      setPasswordError('Password should be at least 8 characters')
    }

    //break out of this function if there were any issues
    if (failPassword || failUsername) {
      return
    }

    //make sign in request
    api({
      method: 'POST',
      url: '/chat/signin/',
      data: {
        username: username,
        password: password
      }
    })
      .then(response => {
        const credentials = {
          username: username,
          password: password
        };
        utils.log('Sign In: ', response.data);
        login(credentials, response.data.user);
      })
      .catch(error => {
        if (error.response) {
          console.log(error.response.data);
          console.log(error.response.status);
          console.log(error.response.headers);
        } else if (error.request) {
          console.log(error.request);
        } else {
          console.log('Error', error.message);
        }
        console.log(error.config);
    })

  }

  return (
    <SafeAreaView style={{flex: 1}}>
      <KeyboardAvoidingView behavior="height" style={{flex: 1}}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              paddingHorizontal: 20,
            }}>
            <Title text="Realtime Chat" color="#202020" />

            <Input
              title="Username"
              value={username}
              setValue={setUsername}
              error={usernameError}
              setError={setUsernameError}
            />

            <Input
              title="Password"
              secureTextEntry={true}
              value={password}
              setValue={setPassword}
              error={passwordError}
              setError={setPasswordError}
            />

            <Button title="Sign In" onPress={onSignIn} />

            <Text style={{textAlign: 'center', marginTop: 40}}>
              Don't have an account?{' '}
              <Text
                style={{
                  color: 'blue',
                }}
                onPress={() => navigation.navigate('SignUp')}>
                Sign Up
              </Text>
            </Text>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default SignInScreen