import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  Button,
  TouchableOpacity,
  NativeModules,
  NativeEventEmitter,
  PermissionsAndroid,
  Platform,
  FlatList,
} from 'react-native';

import {NavigationContainer, useTheme} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import BleManager, {
  getConnectedPeripherals,
  start,
  stopScan,
} from 'react-native-ble-manager';
import {stringToBytes} from 'convert-string';
import Icon from 'react-native-vector-icons/Feather';

const Stack = createNativeStackNavigator();
const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

function App() {
  const [isScanning, setIsScanning] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [deviceID, setDeviceID] = useState(null);
  const [msg, setMsg] = useState();
  const peripherals = new Map();
  const [list, setList] = useState();

  const myTheme = {
    dark: true,
    colors: {
      primary: '#ffff33',
      background: '#000028',
      card: '#000028',
      text: '#fff',
      border: '#ffff33',
      notification: '#ffff33',
    },
  };

  const serviceID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
  const rxCharID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
  const txCharID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

  function startScan() {
    if (!isScanning) {
      BleManager.scan([serviceID], 3, true)
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
      setDeviceID(__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED);
      setList(Array.from(peripherals.values()));
      setIsMonitoring(false);
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
    const val = String.fromCharCode.apply(null, data.value);
    setMsg(val);
  }

  function getNotifications() {
    console.log(deviceID);
    BleManager.startNotification(deviceID, serviceID, txCharID)
      .then(() => {
        console.log('Notifications started...');
        setIsMonitoring(true);
      })
      .catch(err => {
        console.error(err);
      });
  }

  function writeData(data) {
    console.log(data);
    BleManager.write(deviceID, serviceID, rxCharID, stringToBytes(data))
      .then(() => {
        console.log('Write: ' + data);
      })
      .catch(err => {
        console.log(err);
      });
  }

  function retrieveConnected() {
    BleManager.getConnectedPeripherals([]).then(res => {
      if (res.length === 0) {
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
      // Do nothing else, for now, with Unknown devices
    } else {
      peripherals.set(peripheral.id, peripheral);
      setList(Array.from(peripherals.values()));
    }
  }

  function testPeripheral(peripheral) {
    if (peripheral) {
      if (peripheral.connected) {
        BleManager.disconnect(peripheral.id);
        setDeviceID(null);
      } else {
        BleManager.connect(peripheral.id)
          .then(() => {
            let p = peripherals.get(peripheral.id);
            if (p) {
              p.connected = true;
              peripherals.set(peripheral.id, p);
              setDeviceID(peripheral.id);
              setList(Array.from(peripherals.values()));
            }
            console.log('Connected to ' + peripheral.id);
            setDeviceID(peripheral.id);

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

  function appButtonPress(app) {
    if (deviceID !== null) {
      console.log('Sending ' + app);
      writeData(app);
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
          ).then(res => {
            if (res) {
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
      bleManagerEmitter.remove(
        'BleManagerDiscoverPeripheral',
        handleDiscoverPeripheral,
      );
      bleManagerEmitter.remove('BleManagerStopScan', handleStopScan);
      bleManagerEmitter.remove(
        'BleManagerDisconnectPeripheral',
        handleDisconnectedPeripheral,
      );
      bleManagerEmitter.remove(
        'BleManagerDidUpdateValueForCharacteristic',
        handleUpdatedValueForCharacteristic,
      );
    };
  }, []);

  function renderItem(item) {
    const color = item.connected ? '#3d3d00' : '#000028';
    return (
      <TouchableOpacity onPress={() => testPeripheral(item)}>
        <View
          style={[
            styles.peripheral,
            {backgroundColor: color, borderColor: '#ffff33'},
          ]}>
          <Text style={{color: '#ffff33'}}>{item.name}</Text>
          <Text style={{color: '#ffff33'}}>{item.rssi}</Text>
          <Text style={{color: '#ffff33'}}>{item.id}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  function HomeScreen({navigation}) {
    return (
      <View style={[styles.screenView]}>
        <Text style={[styles.title]}>Retroboard Control</Text>
        <View style={styles.appButtonsView}>
          <TouchableOpacity
            style={styles.appButton}
            onPress={() => appButtonPress('clock')}>
            <Text style={styles.appButtonText}>Clock</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.appButton}
            onPress={() => appButtonPress('clear')}>
            <Text style={styles.appButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  function SettingsScreen({navigation}) {
    return (
      <View style={[styles.screenView]}>
        <View style={[styles.screenView, {marginTop: 30}]}>
          <TouchableOpacity style={styles.appButton} onPress={startScan}>
            <Text style={styles.appButtonText}>Start Scan</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.appButton}
            onPress={retrieveConnected}>
            <Text style={styles.appButtonText}>Get Connected Devices</Text>
          </TouchableOpacity>
          {isMonitoring ? (
            <Text style={{color: '#ffff33', fontSize: 20, fontWeight: 'bold'}}>
              Message: {msg}
            </Text>
          ) : null}
          <FlatList
            data={list}
            renderItem={({item}) => renderItem(item)}
            keyExtractor={item => item.id}
          />
        </View>
      </View>
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
          options={({navigation, route}) => ({
            headerTitle: '',
            headerRight: () => (
              <Icon
                name="settings"
                size={25}
                color="#ffff33"
                onPress={() => navigation.navigate('Settings')}
              />
            ),
          })}
        />
        <Stack.Screen name='Settings' component={SettingsScreen} options={{title: 'Settings'}} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  screenView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000028',
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
  peripheral: {
    padding: 5,
    margin: 5,
    borderColor: '#ffff33',
    borderRadius: 5,
    borderWidth: 1,
  },
});

export default App;
