import React from 'react';
import {StyleSheet, Text, View, Button} from 'react-native';

import {NavigationContainer, useTheme} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

function HomeScreen({navigation}) {
  const {colors} = useTheme();

  return (
    <View style={[styles.screenView]}>
      <Text style={{color: colors.text}}>Home Screen</Text>
      <Button
        title="Go to Details"
        onPress={() => navigation.navigate('Details')}
      />
    </View>
  );
}

function DetailsScreen({navigation}) {
  const {colors} = useTheme();

  return (
    <View style={[styles.screenView]}>
      <Text style={{color: colors.text}}>Details Screen</Text>
      <Button
        title="Go to Details...again"
        onPress={() => navigation.push('Details')}
      />
      <Button title="Go to Home" onPress={() => navigation.navigate('Home')} />
      <Button title="Go Back" onPress={() => navigation.goBack()} />
      <Button title="To top" onPress={() => navigation.popToTop()} />
    </View>
  );
}

const Stack = createNativeStackNavigator();

function App() {
  // const isDarkMode = useColorScheme() === 'dark';
  const myTheme = {
    dark: true,
    colors: {
      primary: '#ffff33',
      background: '#000023',
      card: '#000028',
      text: '#fff',
      border: '#ffff33',
      notification: '#ffff33',
    },
  };

  return (
    <NavigationContainer theme={myTheme}>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerTintColor: '#ffff33',
          headerTitleStyle: {fontWeight: 'bold', fontSize: 20},
        }}>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{title: ''}}
        />
        <Stack.Screen
          name="Details"
          component={DetailsScreen}
          options={{title: ''}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  screenView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default App;
