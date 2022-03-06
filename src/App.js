import React from 'react';
import {StyleSheet, Text, View, Button, TouchableOpacity} from 'react-native';

import {NavigationContainer, useTheme} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

function HomeScreen({navigation}) {
  const {colors} = useTheme();

  return (
    <View style={[styles.screenView]}>
      <Text style={[styles.title]}>Retroboard Control</Text>
      <View style={styles.appButtonsView}>
        <TouchableOpacity
          style={styles.appButton}
          onPress={() => console.log('Clock pressed')}>
          <Text style={styles.appButtonText}>Clock</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.appButton}
          onPress={() => console.log('Clear pressed')}>
          <Text style={styles.appButtonText}>Clear</Text>
        </TouchableOpacity>
      </View>
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
  appButtonsView: {
    marginTop: 20,
    flexDirection: 'row',
  },
  title: {
    fontWeight: '700',
    fontSize: 24,
    color: '#ffff33',
  },
  appButton: {
    backgroundColor: '#ffff33',
    padding: 10,
    borderRadius: 5,
    margin: 5,
  },
  appButtonText: {
    fontSize: 18,
  },
});

export default App;
