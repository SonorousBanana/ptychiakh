import * as Location from 'expo-location';
import React, { useState, createContext, useContext, useEffect } from 'react';

export default function LocationComponent() {
const [locationServiceEnabled, setLocationServiceEnabled] = useState(false);

const [city, setCity] = useState('Wait, we are fetching your location...');
const [country, setCountry] = useState('Wait, we are fetching your location...');
const [name, setName] = useState('Wait, we are fetching your location...');
const [street, setStreet] = useState('Wait, we are fetching your location...');
const [Latitude, setLatitude] = useState('');
const [Longitude, setLongitude] = useState('');

let city1;
let country1;
let name1;
let street1;

  const [displayCurrentAddress, setDisplayCurrentAddress] = useState(
    'Wait, we are fetching your location...'
    );
  const [locationData, setLocationData] = useState('');
  let data;
  let address;
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
        
        setLatitude(latitude);
        setLongitude(longitude)

        for (let item of response) {
          address = `${item.isoCountryCode}_${item.postalCode}`;
          data = `${item.city}, ${item.country}, ${item.name}, ${item.postalCode}`;
          setLocationData(data);
          setDisplayCurrentAddress(address);
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

  return  [ displayCurrentAddress, street, name, city, country, Latitude, Longitude ];
};

