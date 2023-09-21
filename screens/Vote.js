import React, { useState, useEffect, useLayoutEffect, useCallback } from "react";
import { RefreshControl, Alert, View, TouchableOpacity, Text, StyleSheet, Button, Pressable, StatusBar, SafeAreaView, ScrollView, } from "react-native";
import { Card } from 'react-native-paper';
import { useNavigation } from "@react-navigation/native";
import { useNotifications, addNotification } from './NotificationsContext';
import { auth, database } from '../firebase';
import {
    doc,
    collection,
    setDoc,
    getDocs,
    getDoc,
    updateDoc,
    deleteDoc,
    query,
    onSnapshot,
    querySnapshot,
    where,
    Timestamp,
    deleteField,
    serverTimestamp,
  } from 'firebase/firestore';
  import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
  

  

const Vote = ({ route }) =>{
    const { location } = route.params;
    const navigation = useNavigation();
    const [votingUsers, setVotingUsers] = useState([]);
    const [participating, setParticipating] = useState(null);
    const [hasVote, setHasVote] = useState(false);
    const [votedCandidateKey, setVotedCandidateKey] = useState(null);
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [votingData, setVotingData] = useState([]);
  
    let partSit = 0;
    let exeiPsifisei= false;
    let poionpsifises = null;
    let iconName = 'vote-yea';
    let iconName1 = 'information-variant';
    let size = 20;
    //const [currentUser, setCurrentUser] = useState(auth.currentUser?.email);
    const { addNotification } = useNotifications();
    const [refreshing, setRefreshing] = useState(false);
    
    const onRefresh = useCallback(() => {
      setRefreshing(true);
      setTimeout(() => {
        setRefreshing(false);
      }, 1500);
    }, []);

    useLayoutEffect(() => {
      navigation.setOptions({
        headerRight: () => (
          
          <TouchableOpacity
            style={{
              marginRight: 10
            }}
            onPress={() => navigation.navigate("History")}
          >
            
              <View>
                <MaterialCommunityIcons name="history" size={35} style={{marginRight: 5}}/>
                  </View>
                
          </TouchableOpacity>
        )
      });
    }, [navigation]);

        useEffect(() => {
          const candidatesRef = collection(database, 'Community', location, 'candidates');

        // Subscribe to real-time updates using onSnapshot
        const unsubscribe = onSnapshot(candidatesRef, (querySnapshot) => {
          const usersFieldArray = querySnapshot.docs.map(doc => ({
            key: doc.id,
            choice: doc.data().choice,
            description: doc.data().description
          }));
      
          // Update the state with the new voting user data
          setVotingUsers(usersFieldArray);
        });
          return () => {
            unsubscribe();
          };
        }, []);

      const getPartSit = async () => {
        const usersPart = query(collection(database, 'Community', location, 'users'), where('user', '==', auth.currentUser?.email));
        await getDocs(usersPart).then((querySnapshot) => {
          // Loop through the query results
          querySnapshot.forEach((doc) => {
        
            let data = doc.data();
            partSit = data.participateInElection;
            exeiPsifisei = data.hasVote;
            poionpsifises = data.votedCandidateKey
          });
        }).catch((error) => {
          // Log the error
          console.error(error);
        });
        setParticipating(partSit);
        
        if (partSit == false){
          setParticipating(false);
          setHasVote(exeiPsifisei);
          console.log(exeiPsifisei);
          
        } else {
          setParticipating(true);
          setHasVote(exeiPsifisei);
          console.log(exeiPsifisei);
         
        }

        if (exeiPsifisei == false){
          setHasVote(false);
        } else {
          setHasVote(true);
          setVotedCandidateKey(poionpsifises);
        }

      };

      const descpRef = async () => {
        let userId;
        let text;
        const usersPart = query(collection(database, "Community", location, 'users'), where('user', '==', auth.currentUser?.email));
        const querySnapshot = await getDocs(usersPart);
          // Loop through the query results
          querySnapshot.forEach((doc) => {
            // Get the value of the name field
            //let name = doc.get('name');
            // Or use data() to get all fields
            userId = doc.id;
            text = doc.data().description;
            
          });
          if (text !== null && participating == true) {
          updateDoc(doc(database, 'Community', location, 'candidates', userId), { 
            "description": text,
          }).then(() =>{
            console.log("on vote, update desc candidate ok!!");
            console.log(text);
          }).catch((err) => Alert.alert("Login error", err.message));
          }
      };
      

      useEffect(() =>{
        getPartSit();
        descpRef();

      }, []);

            
      const handleParticipationToggle = async () => {
        
        Alert.alert(
          'Confirm Declaration candidacy',
          'Are you sure you want to for admin`s election?',
          [
            {
              text: 'Not at moment',
              style: 'destructive',
            },
            {
              text: 'Apply',
              style: 'cancel',
              onPress: async () => {
       try {
           
        if (participating === false){
            
        let userId;
        let description;
        const updateUserPart = query(collection(database, "Community", location, 'users'), where('user', '==', auth.currentUser?.email));
        const querySnapshot2 = await getDocs(updateUserPart);
        querySnapshot2.forEach((doc) => {
          
          userId = doc.id;
          description = doc.data().Description;
        });
        // Update the user's participation status in Firestore
        await updateDoc(doc(database, 'Community', location, 'users', userId), { 
          "participateInElection": true,
        });

        await setDoc(doc(database, 'Community', location, 'candidates', userId), {
          choice: auth.currentUser?.email,
          votes: 0,
 
        });

          const newParticipating = !participating;
          setParticipating(newParticipating);
          console.log('User participation updated successfully!');
        } else {
          Alert.alert("You already Candidate");
        }
        
        } catch (error) {
          console.error('Error updating user participation:', error);
        }
      },
    },
  ],
  { cancelable: true }
);
  
      };

      const handleRemoveCandidate = async () => {

        Alert.alert(
          'Remove your candidacy',
          'Are you sure you want to emove your candidacy?',
          [
            {
              text: 'Don`t remove',
              style: 'cancel',
            },
            {
              text: 'Remove',
              style: 'destructive',
              onPress: async () => {
        try {
           if (participating === true){        
             
         
            let userId;
            const updateUserPart = query(collection(database, "Community", location, 'users'), where('user', '==', auth.currentUser?.email));
            const querySnapshot2 = await getDocs(updateUserPart);
            querySnapshot2.forEach((doc) => {
              userId = doc.id;
            });
            // Update the user's participation status in Firestore
             updateDoc(doc(database, 'Community', location, 'users', userId), { 
              "participateInElection": false,
              "isAdmin": false,
            });
    
             deleteDoc(doc(database, 'Community', location, 'candidates', userId), {
              choice: auth.currentUser?.email,
              votes: 0,
            });
            
            const newParticipating = !participating;
            setParticipating(newParticipating);
           console.log('User participation updated successfully!');
          } else {
            Alert.alert("You dont Candidate");
          }
         } catch (error) {
           console.error('Error updating user participation:', error);
         }

        },
      },
    ],
    { cancelable: true }
        );
       };
   //PARTICIPATIONS


   const updateAdminStatus = async () => {
    function countNestedObjects(data) {
      let count = 0;
    
      for (const key in data) {
        if (typeof data[key] === 'object') {
          // If the property is an object, recursively count its nested objects
          count++;
        }
      }
    
      return count;
    }
    try {
      let userId;
      const Admin = query(collection(database, 'Community', location, 'users'), where('user', '==', topUser));
      
      const querySnapshot1 = await getDocs(Admin);
        querySnapshot1.forEach((doc) => {
         
          userId = doc.id;
      });

      
      const candidatesQuery = query(collection(database, 'Community', location, 'candidates'));
      const querySnapshot = await getDocs(candidatesQuery);
  
      let highestVoteCount = -1;
      let adminCandidateKey = null;
  
      querySnapshot.forEach((doc) => {
        const candidateData = doc.data();
        const voteCount = candidateData.votes;
        const allVotes = candidateData.usersVotesHim;
        const nestedObjectCount = countNestedObjects(allVotes);
        console.log(`Number of nested objects in usersVotesHim: ${nestedObjectCount}`);

        if (nestedObjectCount > highestVoteCount) {
          highestVoteCount = nestedObjectCount;
          adminCandidateKey = doc.id;
        }
      });
  
      // Update the 'IsAdmin' field of all users
      const usersQuery = query(collection(database, 'Community', location, 'users'));
      const usersSnapshot = await getDocs(usersQuery);
  
      usersSnapshot.forEach(async (userDoc) => {
        const userRef = doc(database, 'Community', location, 'users', userDoc.id);
        const isAdmin = userDoc.id === adminCandidateKey;
       
        await updateDoc(userRef, {
          "isAdmin": isAdmin,
        });
      });

      addNotification('Admin has change!!!');
      
      console.log('Admin status updated successfully!');

    } catch (error) {
      console.error('Error updating admin status:', error);
    }
  };

  
   const votes = async (candidateId) => {
  
      try {
        if (hasVote === false){
        
        setHasVote(true);
        
        console.log(hasVote);
        
        let userId;
        const updateUserVote = query(collection(database, "Community", location, 'users'), where('user', '==', auth.currentUser?.email));
        const querySnapshot2 = await getDocs(updateUserVote);
          querySnapshot2.forEach((doc) => {
              
              userId = doc.id;
          });
        // Update the user's participation status in Firestore
        await updateDoc(doc(database, 'Community', location, 'users', userId), { 
          "hasVote": true,
          "votedCandidateKey": candidateId,
        });
        
        const candidateRef = doc(database, 'Community', location, 'candidates', candidateId);
        const candidateDoc = await getDoc(candidateRef);
        const currentVoteCount = candidateDoc.data().votes || 0;
        const allVotes = candidateDoc.data().usersVotesHim || [];

          await updateDoc(candidateRef, {
           "votes": currentVoteCount + 1,
           "usersVotesHim": {
            ...allVotes,
            [auth.currentUser?.uid]: {
              time: serverTimestamp(),
            },
          },
            // Increment the candidate's vote count by 1
          });

          const candidateData = candidateDoc.data().choice;
          console.log(candidateData);

          Alert.alert("You Voted user : " + candidateData);

          setVotedCandidateKey(candidateId);

        console.log('User Vote updated successfully!');
        addNotification('Vote submitted successfully');
        updateAdminStatus();
        getTopUser();

        } else {
          Alert.alert("You have already Voted");
        }
      } catch (error) {
        console.error('Error updating user Vote:', error);
      }
   };

   const unVote = async () => {
    
    try {
      if (hasVote == true && votedCandidateKey !== null){
      
      setHasVote(false);
    
      console.log(hasVote);
      
      let userId;
      const updateUserVote = query(collection(database, "Community", location, 'users'), where('user', '==', auth.currentUser?.email));
      const querySnapshot2 = await getDocs(updateUserVote);
        querySnapshot2.forEach((doc) => {
            //console.log(doc.id);
            userId = doc.id;
        });
        const userDocRef = doc(database, 'Community', location, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.data();

      // Get the votedCandidateKey from the user's data
      const votedCandidateKey = userData.votedCandidateKey;
        setVotedCandidateKey(votedCandidateKey);
      // Update the user's participation status in Firestore
      await updateDoc(doc(database, 'Community', location, 'users', userId), { 
        "hasVote": false,
        "votedCandidateKey": null,
      });

      const candidateRef1 = doc(database, 'Community', location, 'candidates', votedCandidateKey);
        const candidateDoc1 = await getDoc(candidateRef1);
        const currentVoteCount1 = candidateDoc1.data().votes;
        const allVotes = candidateDoc1.data().usersVotesHim || [];

        const usersVotesHim = { 

        }

        if (currentVoteCount1 > 0){
          const currUs = auth.currentUser?.email;
          await updateDoc(candidateRef1, {
           "votes": currentVoteCount1 - 1,
          
          [`usersVotesHim.${auth.currentUser?.uid}`]: deleteField(),
        
            // decrement the candidate's vote count by 1
          });
        }
       
   updateAdminStatus();
    getTopUser();
      Alert.alert("You took back your Vote");
      
      console.log('User unVote updated successfully!');
      } else {
        Alert.alert("You dont have already yet");
      }
    } catch (error) {
      console.error('Error updating user Vote:', error);
    }
   };
   
   const getTopUser = async () => {

    function countNestedObjects(data) {
      let count = 0;
    
      for (const key in data) {
        if (typeof data[key] === 'object') {
          // If the property is an object, recursively count its nested objects
          count++;
        }
      }
    
      return count;
    }

    try {
      const candidatesQuery = query(collection(database, 'Community', location, 'candidates'));
      const querySnapshot = await getDocs(candidatesQuery);

      let highestVoteCount = -1;
      let topUser = null;
  
      querySnapshot.forEach((doc) => {
        const candidateData = doc.data();
        const voteCount = candidateData.votes;
        const allVotes = candidateData.usersVotesHim;
        const nestedObjectCount = countNestedObjects(allVotes);
        console.log(`Number of nested objects in usersVotesHim: ${nestedObjectCount}`);
        if (nestedObjectCount > highestVoteCount) {
          highestVoteCount = nestedObjectCount;
          topUser = candidateData.choice; // This assumes the 'choice' field contains the user's email or name
        }
      });
  
      return topUser;

    } catch (error) {
      console.error('Error getting top user:', error);
      return null;
    }
  };
  
 
  const [topUser, setTopUser] = useState(null); // State to store the top user

  useEffect(() => {
    // Fetch the top user when the component mounts
    const fetchTopUser = async () => {
      const Admin = query(collection(database, 'Community', location, 'users'), where('user', '==', topUser));
      let userId;
      const user = await getTopUser();
      setTopUser(user);
      console.log("top vote user is : " + topUser);
      
    };

    const topUserQuery = query(collection(database, 'Community', location, 'users'), where('user', '==', topUser));

    // Subscribe to real-time updates using onSnapshot
    const unsubscribe = onSnapshot(topUserQuery, (querySnapshot) => {
      let userId;
      
      // Iterate through the query results (should be just one user)
      querySnapshot.forEach((doc) => {
        userId = doc.id;
        setTopUser(doc.data().user);
      });
      
      console.log("Top vote user is: " + topUser);

      // You can do additional actions with 'userId' if needed
    });

    // Clean up the subscription when the component unmounts
    return () => {
      unsubscribe();
      updateAdminStatus();
    };
    
  }, [topUser]);

  const infoCandidatePress = (candidateKey) => {
    if (selectedCandidate === candidateKey) {
      setSelectedCandidate(null);
    } else {
      setSelectedCandidate(candidateKey);
    }
  };

  useEffect(() => {
 
    try {
      const votingRef = collection(database, 'Community', location, 'voting');
      const unsubscribe = onSnapshot(votingRef, (querySnapshot) => {
        const updatedVotingData = querySnapshot.docs.map((doc) => ({
          key: doc.id,
          ...doc.data(),
        }));
        setVotingData(updatedVotingData);
      });

      // Return an unsubscribe function to stop listening when the component unmounts
      return unsubscribe;
    } catch (error) {
      console.error('Error fetching voting data:', error);
    }
  
    // Start listening for changes when the component mounts
    // Stop listening when the component unmounts
    return () => {
      unsubscribe();
    };
  }, [location]);

  const currentDate = new Date().toISOString().split('T')[0];

  const filteredVotingData = votingData.filter(item => {
    const votingDate = item.deadlineDate.split('T')[0];
    console.log('Voting Date:', votingDate);
    return votingDate >= currentDate;
  });

  const renderVotingItem = ({ item }) => (

    <Card style={styles.eventCard}>
    <View key={item.key}>
      <Text style={styles.title}>{item.title}</Text>
    
    </View>
    </Card>
  );

  const renderItem = ({ item }) => (
    <Pressable
   
       onPress={() => infoCandidatePress(item.key)}
     >
        <View style={styles.innerContainer}>
          <Text style={styles.voteName}><MaterialCommunityIcons name={iconName1} size={size}/> {item.choice}
                  
            <TouchableOpacity onPress={() => votes(item.key)}>
              {!hasVote && (
                <Text style={styles.voteButton}> <FontAwesome5 name={iconName} size={20}></FontAwesome5></Text>
              )}
              {hasVote && (
                <Text style={styles.voteButton}>-</Text>
              )}
            </TouchableOpacity>
          </Text>
            {selectedCandidate === item.key && (

              <Text style={styles.description}>{'\n'}Description: {item.description}</Text>
            )}
        </View>
    </Pressable>

  );

   if (participating === null) {
    // While loading the participation status, show a loading message or spinner
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }
  
    return (
      <ScrollView style={{ flex: 1, marginTop:20}} nestedScrollEnabled = {true} refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
         <SafeAreaView style={{ flex: 1, alignItems: 'center',  justifyContent: 'center', }}>
         
          <Text style={styles.postTitle}>Vote for Admin</Text>
            <Text style={styles.text}>
              Do you want to participate in the election?
            </Text>
            
         
        {!participating && (
          <Button title="Declaration of candidacy" onPress={handleParticipationToggle} style={styles.buttonText}/>
        )}

        
        {participating && (
          <Button title="Remove your candidacy" onPress={handleRemoveCandidate} style={styles.buttonText}/>
        )}
      
        <ScrollView nestedScrollEnabled = {true}>
        {votingUsers.map((item, index) => (
            <View key={index}>
            {renderItem({ item })}
            
              </View>
            ))}
         </ScrollView>

          {hasVote && (
          <Button title={'Take back my vote'} onPress={unVote} style={styles.buttonText}/>
          )}
          <StatusBar barStyle="dark-content" />
    
          <Text style={styles.subtitle}>Vote for Voting Below!</Text>

        {filteredVotingData.map((item, index) => (
          <View key={index}>
            
            <TouchableOpacity onPress={() => navigation.navigate('VotingItem', { votingIndex: item.key })}>
            {renderVotingItem({ item })}
            
            </TouchableOpacity>
          </View> ))}

          <Button
          title="View Voting History"
          onPress={() => navigation.navigate('History')}
           />

      </SafeAreaView>

      </ScrollView>

    );
};
const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'grey',
      color: '#fff',
      padding: 15,
      borderRadius: 15,
      margin: 5,
      marginHorizontal: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    
    postTitle: {
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 10,
    },
    
    innerContainer: {
      backgroundColor: '#3e3e3e', // Dark gray background color
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20, // Larger border radius
        width: 340,
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
      alignItems: 'center',
      flexDirection: 'column',
    },
    voteName: {
      fontWeight: 'bold',
      color: '#fff',
      marginBottom: 5,
    },
    buttonText: {
      fontSize: 16,
      color: 'blue',
    },
    voteButton: {
      marginLeft: 15,
      marginTop: 5,
      marginBottom: -5,
      color: '#fff'
    },
    text: {
      alignItems: 'center',
    },
    description: {
      color: 'lightblue',
      marginTop: 3,
      fontStyle: 'italic',
    },
   
    eventCard: {
      width: 300, // Set the desired width
      justifyContent: 'center',
      alignContent: 'center',
      backgroundColor: 'white',
      borderRadius: 10,
      padding: 16,
      marginBottom: 16,
      elevation: 2,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 8,
      color: '#333',
    },
    subtitle: {
      marginTop: 20,
      fontSize: 14,
      fontWeight: 'bold',
      color: 'purple',
      marginBottom: 20,
    },

  });
export default Vote;