import * as Location from 'expo-location';
import React, { useState, createContext, useContext, useEffect } from 'react';
import { View, ActivityIndicator, TouchableWithoutFeedback, Keyboard, TouchableOpacity } from 'react-native';

export default function LocationDataComponent() {
const [locationServiceEnabled, setLocationServiceEnabled] = useState(false);

const [city, setCity] = useState('Wait, we are fetching your location...');
const [country, setCountry] = useState('Wait, we are fetching your location...');
const [name, setName] = useState('Wait, we are fetching your location...');
const [street, setStreet] = useState('Wait, we are fetching your location...');
//const [postalCode, setPostalCode] = useState('');

  const [locationData, setLocationData] = useState('Wait, we are fetching your location...');
  
  let city1;
  let country1;
  let name1;
  let street1;
  //postalCode
  useEffect(() => {
  CheckIfLocationEnabled();
  GetCurrentLocation();
  }, []);

  const CheckIfLocationEnabled = async () => {
  let enabled = await Location.hasServicesEnabledAsync();

  if (!enabled) {
    Alert.alert(
      'Location Service not enabled',
      'Please enable your location services to continue',
      [{ text: 'OK' }],
      { cancelable: false }
    );
  } else {
    setLocationServiceEnabled(enabled);
  }}

  const GetCurrentLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
    
      if (status !== 'granted') {
        Alert.alert(
          'Permission not granted',
          'Allow the app to use location service.',
          [{ text: 'OK' }],
          { cancelable: false }
        );
      }
    
      let { coords } = await Location.getCurrentPositionAsync();
    
      if (coords) {
        const { latitude, longitude } = coords;
        let response = await Location.reverseGeocodeAsync({
          latitude,
          longitude
        });
    
        for (let item of response) {
          
          data = `${item.city}, ${item.country}, ${item.name}, ${item.postalCode}, ${item.street}`;
          setLocationData(data);
          city1 = `${item.city}`;
          setCity(city1);
          country1 = `${item.country}`;
          setCountry(country1);
          name1 = `${item.district}`;
          setName(name1);
          street1 = `${item.street}`;
          setStreet(street1);
        }
      }
  };

  return name;
};