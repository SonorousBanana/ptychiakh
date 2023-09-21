import React, { useState, useEffect, useLayoutEffect } from "react";
import { View, StyleSheet, } from "react-native";
import MapView from "react-native-maps";
import { Marker } from "react-native-maps";
import { collection, getDocs, query, onSnapshot, doc, } from 'firebase/firestore';
import { auth, database } from '../firebase';

const Map = ({ route }) =>{
    const { location, name, street, Latitude, Longitude } = route.params;
    const apiKey = 'AIzaSyD-jrw1E9HJ3RFQKEwHhw04qLvaI-cafOM';
    const [eventLocations, setEventLocations] = useState([]);
    const [userLocation, setUserLocation] = useState(null);

      const fetchEventLocations = async () => {
        try {
          const eventRef = collection(database, 'Community', location, 'event');
          const eventSnapshot = await getDocs(eventRef);
          const eventData = eventSnapshot.docs.map(doc => doc.data());

           // Geocode addresses to obtain latitude and longitude
        const geocodedEventData = await Promise.all(eventData.map(async event => {
          const address = event.location;
          const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=AIzaSyD-jrw1E9HJ3RFQKEwHhw04qLvaI-cafOM`);
          const data = await response.json();
          if (data.results.length > 0) {
            const { lat, lng } = data.results[0].geometry.location;
            return {
              ...event,
              latitude: lat,
              longitude: lng,
            };
          }
          return event;
        }));
          setUserLocation({ Latitude, Longitude });
          setEventLocations(geocodedEventData);
        } catch (error) {
          console.error('Error fetching event data:', error);
        }
      };


    useLayoutEffect(() => {
      fetchEventLocations();
    },[eventLocations]);


    return (
      <View style={styles.container}>
        <MapView
          style={styles.map}
          // Use the region prop to set the initial map view
          region={{
            latitude: Latitude || 0,
            longitude: Longitude || 0,
            latitudeDelta: 0.0222,
            longitudeDelta: 0.0121,
          }}
        >
          {userLocation && (
          <Marker
            coordinate={{
              latitude: Latitude,
              longitude: Longitude,
            }}
            title = "You are here!"
            location={location}
            pinColor="blue"
             // Set the marker color to blue
          />
          )}
          {/* Add markers for each event location */}
          {eventLocations.map((event, index) => (
            <Marker
              key={index}
              coordinate={{
                latitude: event.latitude,
                longitude: event.longitude
              }}
              title={event.title}
              description={event.location}
              location={event.location}
            />
           
          ))}
        </MapView>
  
       
        {/* Display data below the map */}
        <View style={styles.dataContainer}>
          {/* Rest of the code remains the same */}
        </View>
        </View>
    );
  };
  
  const styles = StyleSheet.create({
    container: {
      ...StyleSheet.absoluteFillObject,
      flex: 1,
      justifyContent: "flex-end",
      alignItems: "center",
    },
    map: {
      ...StyleSheet.absoluteFillObject,
    },
    dataContainer: {
      backgroundColor: "white",
      padding: 10,
      width: "100%",
    },
  });
  
  export default Map;