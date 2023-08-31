import React, { useState, useEffect, useLayoutEffect, useCallback } from "react";
import { Alert, View, TouchableOpacity, Text, Image, StyleSheet, FlatList, TextInput, Button, SafeAreaView, TouchableWithoutFeedback, Keyboard, Pressable, ScrollView, VirtualizedList } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { createStackNavigator } from '@react-navigation/stack';
import { NotificationsProvider, useNotifications } from './NotificationsContext';
import { useRefreshContext } from './RefreshContext';
import { FontAwesome } from '@expo/vector-icons';
import colors from '../colors';
import {
  doc,
  collection,
  deleteDoc,
  getDocs,
  query,
  where,
  getCountFromServer,
} from 'firebase/firestore';
import { auth, database } from '../firebase';
import { AntDesign } from '@expo/vector-icons';
import { Entypo } from '@expo/vector-icons';
import Ionic from 'react-native-vector-icons/Ionicons';
import LocationComponent from "../location";
import { Card } from 'react-native-paper';
import MapView, { Marker } from 'react-native-maps';

const catImageUrl = "https://i.guim.co.uk/img/media/26392d05302e02f7bf4eb143bb84c8097d09144b/446_167_3683_2210/master/3683.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=49ed3252c0b2ffb49cf8b508892e452d";




const Home = ({ route }) => {
  const { location, name, street, city, country, Latitude, Longitude } = route.params;
  const navigation = useNavigation();
  const [numOfUsers, setNumOfUsers] = useState([]);
  const [userAdmin, setUserAdmin] = useState('');
  const [currentAdmin, setCurrentAdmin] = useState(false);
  const [existAdmin, setExistAdmin] = useState (false);
  const [events, setEvents] = useState([]);
  const [sortedEvent, setSortedEvent] = useState([]);
  const [eventLocations, setEventLocations] = useState([]);
  const { newNotificationsCount } = useNotifications();
  const { refreshFlag } = useRefreshContext();
  const [votingData, setVotingData] = useState([]);


  const fetchEvents = async () => {
    const eventsRef = collection(database, 'Community', location, 'event');
    const querySnapshot = await getDocs(eventsRef);

    const eventData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    setEvents(eventData);
  };


  const viewAdmin = async () => {
    let mada;
    const Admin = query(collection(database, 'Community', location, 'users'), where('isAdmin', '==', true));
    const querySnapshot1 = await getDocs(Admin);
            querySnapshot1.forEach((doc) => {
              
              mada = doc.data().user;
              
          });
          setUserAdmin(mada);
          if(  auth.currentUser?.email == mada){
            setCurrentAdmin(true);
          }
          if (userAdmin !== ''){
            setExistAdmin(true);
          }
  };
  viewAdmin();

  const fetchVotingData = async () => {
    try {
      const votingRef = collection(database, 'Community', location, 'voting');
      const votingSnapshot = await getDocs(votingRef);
  
      if (!votingSnapshot.empty) {
        const votingData = votingSnapshot.docs.map(doc => ({
          key: doc.id,
          ...doc.data(),
        }));
        setVotingData(votingData);
      }
    } catch (error) {
      console.error('Error fetching voting data:', error);
    }
  };

  const fetchResultData = async votingKey => {
    try {
      const resultRef = doc(database, 'Community', location, 'voting', votingKey, 'result');
      const resultSnapshot = await getDocs(resultRef);

      if (!resultSnapshot.empty) {
      const resultData = resultSnapshot.docs.map(doc => ({
        key: doc.id,
        ...doc.data(),
      }));
    }
      // You can do something with the resultData if needed
    } catch (error) {
      console.error('Error fetching result data:', error);
    }
  };
  
useLayoutEffect(() => {

  viewAdmin();
  fetchEvents();
  fetchVotingData();

}, [userAdmin]);


  const fetchNumOfUsers = async () =>{
  const countUsers = collection(database, 'Community', location, 'users');
  const snapshot =await getCountFromServer(countUsers);
  setNumOfUsers(snapshot.data().count);

  console.log('count: ', snapshot.data().count);
  }
  fetchNumOfUsers();


    useLayoutEffect(() => {
      navigation.setOptions({
        headerRight: () => (
          
          <TouchableOpacity
            style={{
              marginRight: 10
            }}
            onPress={() => navigation.navigate("Notifications")}
          >
            {newNotificationsCount > 0 && (
              <View>
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {newNotificationsCount}
                    </Text>
                    
                  </View>
                  <Ionic name="notifications" size={35} style={{marginRight: 5}}/>
                  </View>
                )}
                {newNotificationsCount <= 0 && (
            <Ionic name="notifications-outline" size={30} style={{marginRight: 5}}/>
                )}
          </TouchableOpacity>
        )
      });
    }, [navigation]);


    const fetchEventLocations = async () => {
      try {
        const eventRef = collection(database, 'Community', location, 'event');
        const eventSnapshot = await getDocs(eventRef);
        const eventData = eventSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

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
        
        setEventLocations(geocodedEventData);
      } catch (error) {
        console.error('Error fetching event data:', error);
      }
    };
    
   

  useLayoutEffect(() => {

    async function deleteInactiveEvents() {
      const date = new Date(); // Replace this with your actual date


      const dateString = date.toISOString().split('T')[0];

      // Query for users whose last login time is older than a week
      const q = query(collection(database, 'Community', location, 'event'), where('date', '<', dateString));
      const inactiveEventsSnapshot = await getDocs(q);

      // Delete inactive users and their data
      inactiveEventsSnapshot.forEach(async (eventDoc) => {
        const eventId = eventDoc.id;
        //await auth.deleteUser(userId); // Delete from Firebase Authentication
        await deleteDoc(doc(database, 'Community', location, 'event', eventId)); // Delete from Firestore
      });
      
    }
  
    deleteInactiveEvents();

    fetchEventLocations();
  },[]);

  const deleteEvent = async (eventId, eventTitle) => {
    try{
      console.log(eventTitle);
      Alert.alert(
        'Delete Event',
        `Are you sure you want to delete the event with title: ${eventTitle}`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              console.log(eventId);
              await deleteDoc(doc(database, 'Community', location, 'event', eventId));
    
              setEvents(prevEvents => (prevEvents ? prevEvents.filter(event => event.id !== eventId) : []));
              fetchEventLocations();
            },
          },
        ]
      );
      
    } catch (error) {
      console.error('Error Delete Event', error);
    }
  };
    
    const renderItem = ({ item }) => (
      item.type === 'header' ? (
        <View style={{ marginTop: 5 }}>
          {/* Render your header content here */}
        </View>
      ) : (
        <Card style={styles.eventCard}>
        <Text style={styles.eventTitle}>{item.title}</Text>
        <Text style={styles.eventDescription}>{item.description}</Text>
        <Text>Date: {item.date}</Text>
        <Text>Time: {item.time}</Text>
        
        {item.location && ( // Check if the event has an address
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: item.latitude, // Set the latitude from the address
              longitude: item.longitude, // Set the longitude from the address
              latitudeDelta: 0.0072,
            longitudeDelta: 0.0071,
            }}
          >
            {eventLocations.map((event, index) => (
                <Marker
                  key={index}
                  coordinate={{
                    latitude: item.latitude,
                    longitude: item.longitude,
                  }}
                  title={item.title}
                  description={item.location}
                  location={item.location}
                />
               
            ))}
          </MapView>
          </View>
        )}

        {currentAdmin && (
            <View style={styles.deleteButton}>
              <Button
              style={styles.createEventButtonText}
                title="Delete Event"
                onPress={() => deleteEvent(item.id, item.title)}
                color="black"
              />
              </View>
            )}
      </Card>
      
      )
    );

    const sortedEvents = eventLocations.slice().sort((a, b) =>
    new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time)
  );

    return (
      
      <ScrollView style={styles.container1}>
        
        <View style={styles.container}>
        
          <View style={{ marginTop:5, justifyContent: 'center',}}>
            <Text style={styles.title} color="red">Welcome to {name? name : city}</Text>
          </View>
          {existAdmin && (
            <Text style={styles.txtb}>
              Admin of {name} is {userAdmin}
            </Text>
          )}
          {!existAdmin && (
            <Text style={styles.txtb}>
              There is no admin in this area. Please candidate or vote someone to be the Admin.
            </Text>
          )}
          {currentAdmin && (
            <View>
            <Text style={styles.txtb} >You are the admin of the aera!!</Text>
            
            </View>
          )}
          <Pressable style={styles.numOfUsers}>
          <Text style={styles.txtw}>Current Users in this area Connected: {numOfUsers}</Text>
          </Pressable>
       
          <Text>Email: {auth.currentUser?.email}</Text>
            <Text>Your postal code is: {location}</Text>
            <TouchableOpacity>

            </TouchableOpacity>
            {currentAdmin && (
            <View style={styles.btnCrEvent}>
              <Button
              style={styles.createEventButtonText}
                title="Create something for your citizen"
                onPress={() => navigation.navigate('CreateVoting')}
                color="white"
              />
              </View>
            )}

            <View>
                  <Text>Votings:</Text>
                  {votingData.map(item => (
                    <View key={item.key}>
                      <Text>{item.title}</Text>
                      
                    </View>
                  ))}
                </View>

          <Text style={styles.subtitle}>Below you can find the scheduled events</Text>
                
          {sortedEvents.map((item, index) => (
          <View key={index}>
            {renderItem({ item })}
            
          </View>
          
        ))}
         
        </View>
        
        </ScrollView>
        
    );
    };

    export default Home;

    const styles = StyleSheet.create({
      container1:{
        flex: 1,
      },
        container: {
            marginTop: 10,
            justifyContent: 'center',
            alignItems: 'center',
            //backgroundColor: "#fff",
        },
        input: {
          width: '80%',
          borderWidth: 1,
          borderColor: '#ccc',
          borderRadius: 5,
          padding: 10,
          marginBottom: 20,
        },
        chatButton: {
            backgroundColor: colors.primary,
            height: 50,
            width: 50,
            borderRadius: 25,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: colors.primary,
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: .9,
            shadowRadius: 8,
            marginRight: 20,
            marginBottom: 50,
        },
        button: {

          backgroundColor: 'black',
          width: '160%',
          padding: 15,
          borderRadius: 10,
          alignItems: 'center',
          marginTop: 40,
      },
      buttonText: {
          color: 'white',
          fontWeight: '700',
          fontSize: 16,
      },
      numOfUsers: {
        backgroundColor: '#3e3e3e', // Dark gray background color
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20, // Larger border radius
        margin: 10,
        alignSelf: 'center',
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5, // Elevation for Android shadow
      },
      txtw: {
        color: '#fff',
        margin: 5, 
      },
      txtb: {
        justifyContent: 'center',
            alignItems: 'center',
        color: 'black',
        margin: 5,
      },
      title: {
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 31,
        fontWeight: 'bold',
       
        marginBottom: 15,
        color: '#333',
      },
      eventCard: {
        backgroundColor: colors.lightGray,
        padding: 10,
        marginBottom: 40,
        borderRadius: 10,
        width: '90%',
        alignSelf: 'center',
      },
      eventTitle: {
        justifyContent: 'center',
            alignItems: 'center',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
      },
      eventDescription: {
        fontSize: 14,
        color: colors.darkGray,
      },
      btnCrEvent:{
        marginBottom: 30,
        marginTop: 20,
        backgroundColor: '#992D22',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 10,
        marginVertical: 20,
        alignSelf: 'center',
        shadowColor: '#992D22',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.9,
        shadowRadius: 8,
        elevation: 5,
        flexDirection: 'row', // To align the icon and text horizontally
        alignItems: 'center',
      },
      createEventButtonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16,
        marginLeft: 10, // Add some space between icon and text
      },
      map: {
        ...StyleSheet.absoluteFillObject,
      },
      mapContainer: {
        marginTop: 10,
        height: 200,
        width: 350, // Adjust the height as needed
      },
      subtitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: 'purple',
        marginBottom: 20,
      },
      deleteButton: {
        marginTop: 10,
      },
      notificationBadge: {
        position: 'absolute',
        top: 0,
        right: -4,
        backgroundColor: 'red',
        borderRadius: 10,
        paddingHorizontal: 5,
      },
      notificationBadgeText: {
        color: 'white',
        fontSize: 12,
      },
    });