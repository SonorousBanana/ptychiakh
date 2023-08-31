import React, { useState, useEffect, useLayoutEffect, useCallback } from "react";
import { RefreshControl, Alert, View, TouchableOpacity, Text, Image, StyleSheet, FlatList, Button, Pressable, StatusBar, Dimensions, SafeAreaView, ScrollView } from "react-native";
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
   
    const { addNotification } = useNotifications();
    const [refreshing, setRefreshing] = useState(false);
    

    const onRefresh = useCallback(() => {
      setRefreshing(true);
      setTimeout(() => {
        setRefreshing(false);
      }, 1500);
    }, []);

      const  fetchEmails1 = async () => {
        const userChoice = collection(database, 'Community', location, 'candidates');
        const querySnapshot = await getDocs(userChoice);
        const usersFieldArray = querySnapshot.docs.map(doc => ({ key: doc.id, choice: doc.data().choice, description: doc.data().Description})); // replace 'user' with the field you want to extract
        
        setVotingUsers(usersFieldArray);
        
        
        };
      

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
            text = doc.data().Description;
            
          });
          if (text !== null) {
          updateDoc(doc(database, 'Community', location, 'candidates', userId), { 
            "Description": text,
          }).then(() =>{
            console.log("on vote, update desc candidate ok!!");
            console.log(text);
          }).catch((err) => Alert.alert("Login error", err.message));
          }
      };
      

      useEffect(() =>{
        fetchEmails1();
        getPartSit();
        descpRef();

      }, []);

            
      const handleParticipationToggle = async () => {
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
          Description: description,
        });

          const newParticipating = !participating;
          setParticipating(newParticipating);
          fetchEmails1();
          console.log('User participation updated successfully!');
        } else {
          Alert.alert("You already Candidate");
        }
        
        } catch (error) {
          console.error('Error updating user participation:', error);
        }
      };

      const handleRemoveCandidate = async () => {
        try {
           if (participating === true){        
             
         
            let userId;
            const updateUserPart = query(collection(database, "Community", location, 'users'), where('user', '==', auth.currentUser?.email));
            const querySnapshot2 = await getDocs(updateUserPart);
            querySnapshot2.forEach((doc) => {
              //console.log(doc.id);
              userId = doc.id;
            });
            // Update the user's participation status in Firestore
             updateDoc(doc(database, 'Community', location, 'users', userId), { 
              "participateInElection": false,
            });
    
             deleteDoc(doc(database, 'Community', location, 'candidates', userId), {
              choice: auth.currentUser?.email,
              votes: 0,
            });
            
            const newParticipating = !participating;
            setParticipating(newParticipating);
            fetchEmails1();
           console.log('User participation updated successfully!');
          } else {
            Alert.alert("You dont Candidate");
          }
         } catch (error) {
           console.error('Error updating user participation:', error);
         }
       };
   //PARTICIPATIONS


   const updateAdminStatus = async () => {
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
  
        if (voteCount > highestVoteCount) {
          highestVoteCount = voteCount;
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

      addNotification('Vote submitted successfully');
      
      console.log('Admin status updated successfully!');
   // }
    } catch (error) {
      console.error('Error updating admin status:', error);
    }
  };


   //Vote
      
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
          await updateDoc(candidateRef, {
           "votes": currentVoteCount + 1, // Increment the candidate's vote count by 1
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
        if (currentVoteCount1 > 0){
          await updateDoc(candidateRef1, {
           "votes": currentVoteCount1 - 1, // decrement the candidate's vote count by 1
          });
        }
       
   // updateAdminStatus();
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
    try {
      const candidatesQuery = query(collection(database, 'Community', location, 'candidates'));
      const querySnapshot = await getDocs(candidatesQuery);
  
      //if (querySnapshot.exist) {
      let highestVoteCount = -1;
      let topUser = null;
  
      querySnapshot.forEach((doc) => {
        const candidateData = doc.data();
        const voteCount = candidateData.votes;
  
        if (voteCount > highestVoteCount) {
          highestVoteCount = voteCount;
          topUser = candidateData.choice; // This assumes the 'choice' field contains the user's email or name
        }
      });
  
      return topUser;
      //}
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

    
    fetchTopUser();
    updateAdminStatus();
  }, []);

  const infoCandidatePress = (candidateKey) => {
    if (selectedCandidate === candidateKey) {
      setSelectedCandidate(null);
      fetchEmails1();
    } else {
      setSelectedCandidate(candidateKey);
      fetchEmails1();
    }
  };




  const fetchVotingData = async () => {
    try {
      const votingRef = collection(database, 'Community', location, 'voting');
      const votingSnapshot = await getDocs(votingRef);
      const votingData = votingSnapshot.docs.map(doc => ({
        key: doc.id,
        ...doc.data(),
      }));
      setVotingData(votingData);
    } catch (error) {
      console.error('Error fetching voting data:', error);
    }
  };


  useEffect(() => {
   

    fetchVotingData();

    
  }, [location]);


  


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
         {topUser && (
          <Text style={styles.text}>
            User with the most votes: {topUser}
          </Text>
        )}
          <Text style={styles.postTitle}>Vote for Admin</Text>
            <Text style={styles.text}>
              Do you want to participate in the election?
            </Text>
            
         
        {!participating && (
          <Button title="Take Part in Candidate" onPress={handleParticipationToggle} style={styles.buttonText}/>
        )}

        
        {participating && (
          <Button title="Remove Candidate" onPress={handleRemoveCandidate} style={styles.buttonText}/>
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

        {votingData.map((item, index) => (
          <View key={index}>
            
            <TouchableOpacity onPress={() => navigation.navigate('VotingItem', { votingIndex: item.key })}>
            {renderVotingItem({ item })}
            
            </TouchableOpacity>
          </View> ))}

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
    formContainer: {
      width: '80%',
      marginBottom: 20,
    },
    postContainer: {
      width: '80%',
      marginBottom: 20,
    },
    postTitle: {
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 10,
      
    },
    postContent: {
      fontSize: 16,
      lineHeight: 24,
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
    candidateName: {
      fontSize: 18,
      marginVertical: 10,
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