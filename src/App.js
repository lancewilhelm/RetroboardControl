import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  NativeModules,
  NativeEventEmitter,
  PermissionsAndroid,
  Platform,
  FlatList,
} from 'react-native';

import {NavigationContainer, useTheme} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import BleManager, {start, stopScan} from 'react-native-ble-manager';

const Stack = createNativeStackNavigator();
const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

function App() {
  const [isScanning, setIsScanning] = useState(false);
  const peripherals = new Map();
  const [list, setList] = useState();

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

  function startScan() {
    if (!isScanning) {
      BleManager.scan([], 3, true)
        .then(res => {
          console.log('Scanning...');
          setIsScanning(true);
        })
        .catch(err => {
          console.error(err);
        });
    }
  }

  function handleStopScan() {
    console.log('Scan is stopped');
    setIsScanning(false);
  }

  function handleDisconnectedPeripheral(data) {
    let peripheral = peripherals.get(data.peripheral);
    if (peripheral) {
      peripheral.connected = false;
      peripherals.set(peripheral.id, peripheral);
      setList(Array.from(peripherals.values()));
    }
  }

  function handleUpdatedValueForCharacteristic(data) {
    console.log(
      'Received data from ' +
        data.peripheral +
        ' characteristic ' +
        data.characteristic,
      data.value,
    );
  }

  function retrieveConnected() {
    BleManager.getConnectedPeripherals([]).then(res => {
      if (res.length == 0) {
        console.log('No connected peripherals');
      }
      console.log(res);
      for (var i = 0; i < res.length; i++) {
        var peripheral = res[i];
        peripheral.connected = true;
        peripherals.set(peripheral.id, peripheral);
        setList(Array.from(peripherals.values()));
      }
    });
  }

  function handleDiscoverPeripheral(peripheral) {
    console.log('Got ble peripheral', peripheral);
    if (!peripheral.name) {
      peripheral.name = 'Unknown';
    }
    peripherals.set(peripheral.id, peripheral);
    setList(Array.from(peripherals.values()));
  }

  function testPeripheral(peripheral) {
    if (peripheral) {
      if (peripheral.connected) {
        BleManager.disconnect(peripheral.id);
      } else {
        BleManager.connect(peripheral.id)
          .then(() => {
            let p = peripherals.get(peripheral.id);
            if (p) {
              p.connected = true;
              peripherals.set(peripheral.id, p);
              setList(Array.from(peripherals.values()));
            }
            console.log('Connected to ' + peripheral.id);

            setTimeout(() => {
              // Test and read current RSSI Value
              BleManager.retrieveServices(peripheral.id).then(data => {
                console.log('Retrieved peripheral services', data);

                BleManager.readRSSI(peripheral.id).then(rssi => {
                  console.log('Retrieved RSSI value', rssi);
                  let p = peripherals.get(peripheral.id);
                  if (p) {
                    p.rssi = rssi;
                    peripherals.set(peripheral.id, p);
                    setList(Array.from(peripherals.values()));
                  }
                });
              });
            }, 900);
          })
          .catch(err => {
            console.error('Connection error', err);
          });
      }
    }
  }

  useEffect(() => {
    BleManager.start({showAlert: true});

    bleManagerEmitter.addListener(
      'BleManagerDiscoverPeripheral',
      handleDiscoverPeripheral,
    );
    bleManagerEmitter.addListener('BleManagerStopScan', handleStopScan);
    bleManagerEmitter.addListener(
      'BleManagerDisconnectPeripheral',
      handleDisconnectedPeripheral,
    );
    bleManagerEmitter.addListener(
      'BleManagerDidUpdateValueForCharacteristic',
      handleUpdatedValueForCharacteristic,
    );

    if (Platform.OS === 'android' && Platform.Version >= 23) {
      PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ).then(result => {
        if (result) {
          console.log('Permission is OK');
        } else {
          PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          ).then(result => {
            if (result) {
              console.log('User accept');
            } else {
              console.log('User refuse');
            }
          });
        }
      });
    }

    return () => {
      console.log('unmount');
      bleManagerEmitter.removeListener(
        'BleManagerDiscoverPeripheral',
        handleDiscoverPeripheral,
      );
      bleManagerEmitter.removeListener('BleManagerStopScan', handleStopScan);
      bleManagerEmitter.removeListener(
        'BleManagerDisconnectPeripheral',
        handleDisconnectedPeripheral,
      );
      bleManagerEmitter.removeListener(
        'BleManagerDidUpdateValueForCharacteristic',
        handleUpdatedValueForCharacteristic,
      );
    };
  }, []);

  function renderItem(item) {
    const color = item.connected ? 'green' : '#fff';
    return (
      <TouchableOpacity onPress={() => testPeripheral(item)}>
        <View style={{backgroundColor: color}}>
          <Text>{item.name}</Text>
          <Text>{item.rssi}</Text>
          <Text>{item.id}</Text>
        </View>
      </TouchableOpacity>
    );
  }

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
      <View style={styles.screenView}>
        <TouchableOpacity style={styles.appButton} onPress={startScan}>
          <Text style={styles.appButtonText}>Start Scan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.appButton} onPress={stopScan}>
          <Text style={styles.appButtonText}>Stop Scan</Text>
        </TouchableOpacity>
        <FlatList
          data={list}
          renderItem={({item}) => renderItem(item)}
          keyExtractor={item => item.id}
        />
      </View>
    </NavigationContainer>
  );
}

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

const styles = StyleSheet.create({
  screenView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appButtonsView: {
    marginTop: 5,
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
