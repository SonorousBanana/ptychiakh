import React, { useState, useEffect, useLayoutEffect, useCallback } from "react";
import { RefreshControl, Alert, View, TouchableOpacity, Text, StyleSheet, Button, SafeAreaView, TouchableWithoutFeedback, Keyboard, Pressable, ScrollView, } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NotificationsProvider, useNotifications } from './NotificationsContext';
import { useRefreshContext } from './RefreshContext';
import colors from '../colors';
import {
  doc,
  onSnapshot,
  collection,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { auth, database } from '../firebase';
import Ionic from 'react-native-vector-icons/Ionicons';
import { Card, Paragraph } from 'react-native-paper';
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
  const [eventLocations, setEventLocations] = useState([]);
  const { newNotificationsCount } = useNotifications();
  const { refreshFlag } = useRefreshContext();
  const [votingData, setVotingData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [resultsForVoting, setResultsForVoting] = useState({});

  useEffect(() => {
    const eventsRef = collection(database, 'Community', location, 'event');
    const subscribe = onSnapshot(eventsRef, (querySnapshot) => {
      setEvents(querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
        
      }))
      );
      
    });
    // Stop listening for updates when no longer required
    return () => subscribe();
  }, [location]);


  useEffect(() => {
    // Define a Firestore query for 'users' where 'isAdmin' is true
    const adminQuery = query(collection(database, 'Community', location, 'users'), where('isAdmin', '==', true));
  
    // Subscribe to real-time updates using onSnapshot
    const unsubscribe = onSnapshot(adminQuery, (querySnapshot) => {
      let mada = null;
      querySnapshot.forEach((doc) => {
        mada = doc.data().user;
      });
  
      setUserAdmin(mada);
  
      if (auth.currentUser?.email === mada) {
        setCurrentAdmin(true);
      } else {
        setCurrentAdmin(false);
      }
  
      if (mada !== null) {
        setExistAdmin(true);
      } else {
        setExistAdmin(false);
      }
    });
    return () => unsubscribe();
  }, [userAdmin]);

  
  const fetchResultsForVoting = async (votingId) => {
    try {
      const resultRef = collection(
        database,
        'Community',
        location,
        'voting',
        votingId,
        'results'
      );
      const resultSnapshot = await getDocs(resultRef);

      const resultData = resultSnapshot.docs.map((doc) => {
        const data = doc.data();
        const voteIds = data.votesIds || {};
        const voteCount = Object.keys(voteIds).length;
        return {
          key: doc.id,
          count: voteCount,
        };
      });

      // Store the results in a state variable specific to this voting
      setResultsForVoting((prevResults) => ({
        ...prevResults,
        [votingId]: resultData,
      }));
    } catch (error) {
      console.error(`Error fetching results for voting ${votingId}:`, error);
    }
  };
  

  const findHighestVoteCount = (votingId) => {
    const results = resultsForVoting[votingId];
  
    if (!results || results.length === 0) {
      return null; // No results available for this voting
    }
  
    let highestCount = 0;
    let highestResult = null;
  
    results.forEach((result) => {
      if (result.count > highestCount) {
        highestCount = result.count;
        highestResult = result;
      }
    });
  
    return highestResult;
  };
  

  const fetchAllVotingsAndResults = async () => {
    try {
      const votingsRef = collection(database, 'Community', location, 'voting');
      const votingsQuery = query(votingsRef, orderBy('deadlineDate', 'desc'), limit(5));
      const votingsSnapshot = await getDocs(votingsQuery);
      
      const votingData = [];

      if (!votingsSnapshot.empty) {
        await Promise.all(
          votingsSnapshot.docs.map(async (votingDoc) => {
            const votingDocData = {
              key: votingDoc.id,
              ...votingDoc.data(),
            };

            // Fetch and set results for this voting
            await fetchResultsForVoting(votingDoc.id);
            findHighestVoteCount(votingDoc.id);
            // Add voting data to the array


            const deadlineTimestamp = votingDocData.deadlineDate.split('T')[0];
            const currentDate = new Date().toISOString().split('T')[0];

          if (currentDate > deadlineTimestamp) {
            // Add voting data to the array only if the deadline has passed
            votingData.push(votingDocData);
          }

          })
        );
       
        setVotingData(votingData);
      } else {
        setVotingData([]);
      }
    } catch (error) {
      console.error('Error fetching all votings and results:', error);
    }
  };
  

useLayoutEffect(() => {

  fetchAllVotingsAndResults();
 
}, [userAdmin]);

    
    useEffect(() => {
      const countUsers = collection(database, 'Community', location, 'users');
      
      const unsubscribe = onSnapshot(countUsers, (querySnapshot) => {
        let count1 = 0;
        querySnapshot.forEach((doc) => {
          count1 = count1 + 1
          
        });
        console.log('Number of current users: ', count1);
        setNumOfUsers(count1);
      });
      
      // Stop listening for updates when no longer required
      return () => unsubscribe();
    }, [location]);
  
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
    }, [navigation, newNotificationsCount]);


   const fetchEventLocations = async () => {
      try {
        const eventRef = collection(database, 'Community', location, 'event');
        const eventSnapshot = await getDocs(eventRef);
        const eventData = eventSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

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
      //});
      } catch (error) {
        console.error('Error fetching event data:', error);
      }
    };

    const onRefresh = useCallback(() => {

      setRefreshing(true);

      fetchEventLocations();
      fetchAllVotingsAndResults();

      setTimeout(() => {
        setRefreshing(false);
      }, 1500);
    }, []);



  useLayoutEffect(() => {

    /*async function deleteInactiveEvents() {
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
  
    deleteInactiveEvents();*/

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
  
  const renderResultsForVoting = (votingId) => {
    const highestResult = findHighestVoteCount(votingId);
  
    if (!highestResult) {
      return <Text>No results available for this voting.</Text>;
    }
  
    return (
      <View>
        <Paragraph style={{ marginTop:10 }}>
        <Text>Community decided :  </Text>
        <Text style={styles.decision}>{`${highestResult.key}: ${highestResult.count} votes`}</Text>
        </Paragraph>
      </View>
    );
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
      
      <ScrollView style={styles.container1}refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        
          <View style={styles.container}>
          <Text style={styles.title} color="red">
            Welcome to {name === 'null' ? `${location} of ${city}` : name}
          </Text>

          {existAdmin && (
            <Text style={styles.txtb}>
              Admin of {name} is {userAdmin}
            </Text>
          )}
          {!existAdmin && (
            <Text style={styles.txtb}>
              There is no admin in this area. Please candidate or vote someone to become Admin.
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

            {currentAdmin && (
                    <TouchableOpacity
                      style={styles.createButton}
                      onPress={() => navigation.navigate('CreateVoting')}
                    >
                      <Ionic name="add-circle" size={24} color="white" style={styles.createIcon} />
                      <Text style={styles.createButtonText}>Create something for your citizens</Text>
                    </TouchableOpacity>
                  )}

            <View style={styles.votingsContainer}>
                  <Text style={styles.votingsTitle}>The latest Community decisions :</Text>
               
                    
                  {votingData.map((voting) => (
                    <View key={voting.key}>
                      <Card style={styles.votingCard}>
                      {/* Render voting information here */}
                      <Text style={styles.votingTitle}>Voting Title: {voting.title}</Text>
                      {/* Render the results */}
                      {renderResultsForVoting(voting.key)}
                      </Card>
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
        },
        
        header: {
          backgroundColor: colors.primary,
          paddingVertical: 20,
          paddingHorizontal: 16,
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
        right: 0,
        backgroundColor: 'red',
        borderRadius: 10,
        paddingHorizontal: 5,
      },
      notificationBadgeText: {
        color: 'white',
        fontSize: 12,
      },
      votingsContainer: {
        marginHorizontal: 16,
      },
      votingCard: {
        width: 300,
        justifyContent: 'center',
        alignContent: 'center',
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
      },
      votingTitle: {
        fontSize: 16,
        fontWeight: 'bold',
      },
      votingsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginVertical: 16,
      },
      createButton: {
        backgroundColor: '#992D22',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 24,
        marginHorizontal: 19,
        marginBottom: 16,
        paddingHorizontal: 10,
        marginVertical: 20,
        shadowColor: '#992D22',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.9,
        shadowRadius: 5,
        elevation: 5,
        flexDirection: 'row', // To align the icon and text horizontally
        alignItems: 'center'
      },
      createIcon: {
        marginRight: 8,
      },
      createButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
      },
      decision: {
        fontWeight: 'bold',
      },
    });