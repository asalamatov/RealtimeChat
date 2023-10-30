import { Text, View, TouchableWithoutFeedback, Keyboard, KeyboardAvoidingView, SafeAreaView } from 'react-native';
import { useLayoutEffect, useState } from 'react';
import Button from '../common/Button';
import Input from '../common/Input';
import api from '../core/api';
import utils from '../core/utils';
import useGlobal from '../core/global';



const SignUpScreen = ({ navigation }) => {

  const [username,  setUsername]  = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [password1, setPassword1] = useState('');
  const [password2, setPassword2] = useState('');

  const [usernameError,  setUsernameError]  = useState('');
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError,  setLastNameError]  = useState('');
  const [password1Error, setPassword1Error] = useState('');
  const [password2Error, setPassword2Error] = useState('');

  const login = useGlobal(state => state.login)

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, []);


  const onSignUp = () => {
    console.log('onSignUp');

    //check username
    const failUsername = !username || username.length < 4;
    if (failUsername) {
      setUsernameError('Username should be at least 4 characters');
    }

    //check firstname
    const failFirstName = !firstName;
    if (failFirstName) {
      setFirstNameError('First Name not provided');
    }

    //check lastname
    const failLastname = !lastName;
    if (failLastname) {
      setLastNameError('Last Name not provided');
    }

    //check password 1
    const failPassword1 = !password1 || password1.length < 8;
    if (failPassword1) {
      setPassword1Error('Password should be at least 8 characters');
    }

    //check password 2
    const emptyPassword2 = !password2;
    const failPassword2 = password1 != password2;
    if (emptyPassword2) {
      setPassword2Error('Password should be at least 8 characters');
    } else if (failPassword2) {
      setPassword2Error("Passwords don't match");
      setPassword1Error("Passwords don't match");
    }

    //break out of function in error
    if (
      failUsername ||
      failFirstName ||
      failLastname ||
      emptyPassword2 ||
      failPassword1 ||
      failPassword2
    ) {
      return;
    }

    //make sign in request
    api({
      method: 'POST',
      url: '/chat/signup/',
      data: {
        username: username,
        first_name: firstName,
        last_name: lastName,
        password: password1,
      },
    })
      .then(response => {
        const credentials = {
          username: username,
          password: password1,
        };
        utils.log('Sign Up: ', response.data);
        login(credentials, response.data.user, response.data.tokens);
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
      });
  }

  return (
    <SafeAreaView style={{flex: 1}}>
      <KeyboardAvoidingView behavior='height' style={{flex: 1}}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              paddingHorizontal: 16,
            }}>
            <Text
              style={{
                textAlign: 'center',
                marginBottom: 24,
                fontSize: 36,
                fontWeight: 'bold',
              }}>
              Sign Up
            </Text>

            <Input
              title="Username"
              value={username}
              setValue={setUsername}
              error={usernameError}
              setError={setUsernameError}
            />

            <Input
              title="First Name"
              value={firstName}
              setValue={setFirstName}
              error={firstNameError}
              setError={setFirstNameError}
            />

            <Input
              title="Last Name"
              value={lastName}
              setValue={setLastName}
              error={lastNameError}
              setError={setLastNameError}
            />

            <Input
              title="Password"
              secureTextEntry={true}
              value={password1}
              setValue={setPassword1}
              error={password1Error}
              setError={setPassword1Error}
            />

            <Input
              title="Retype Password"
              secureTextEntry={true}
              value={password2}
              setValue={setPassword2}
              error={password2Error}
              setError={setPassword2Error}
            />

            <Button title="Sign Up" onPress={onSignUp} />

            <Text style={{textAlign: 'center', marginTop: 40}}>
              Already have an account?{' '}
              <Text
                style={{
                  color: 'blue',
                }}
                onPress={() => navigation.goBack()}>
                Sign In
              </Text>
            </Text>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignUpScreen
