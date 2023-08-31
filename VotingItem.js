import React, { useState, useEffect } from 'react';
import { Alert, View, TouchableOpacity, Text, Image, StyleSheet, FlatList, Button, Pressable, StatusBar, Dimensions, SafeAreaView, ScrollView } from "react-native";
import { auth, database } from '../firebase';
import { useNavigation } from "@react-navigation/native";
import { Card } from 'react-native-paper';
import {
  doc,
  collection,
  addDoc,
  setDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  query,
  onSnapshot,
  querySnapshot,
  where,
  getCollections,
  serverTimestamp,
  increment,
} from 'firebase/firestore';


const VotingItem = ({ route }) => {
  const { location, name, street, city, country, Latitude, Longitude } = route.params;
  const votingIndex = route.params?.votingIndex;
  const navigation = useNavigation();
  const [selectedChoiceId, setSelectedChoiceId] = useState(null);
  const [votingData, setVotingData] = useState([]);
  const [voteTitle, setVoteTitle] = useState('');
  const [voteDescription, setVoteDescription] = useState('');
  const [voteChoices, setVoteChoices] = useState([]);
  const [hasVotedForEvent, setHasVotedForEvent] = useState(false);
  const [resultData, setResultData] = useState([]);
  const [resultId, setResultId] = useState([]);
  const [resultCount, setResultCount] = useState(null);
  let title;


  const fetchVotingData = async () => {
    try {

      const votingRef = doc(database, 'Community', location, 'voting', votingIndex);
      const votingSnapshot = await getDoc(votingRef);
     
      const votingData2 = votingSnapshot.data();

      title = votingData2.title;
      setVoteTitle(votingData2.title);
      setVoteDescription(votingData2.description);
      setVoteChoices(votingData2.choices);
      setVotingData(votingData2);


    } catch (error) {
      console.error('Error fetching voting data:', error);
    }
  };


  const fetchVoteVoting = async () => {
    let userId;
    const usersPart = query(collection(database, "Community", location, 'users'), where('user', '==', auth.currentUser?.email));
        const querySnapshot = await getDocs(usersPart);
          // Loop through the query results
          querySnapshot.forEach((doc) => {
            // Get the value of the name field
            //let name = doc.get('name');
            // Or use data() to get all fields
            userId = doc.id;
            
          });
        
          const userVoteData = doc(database, "Community", location, 'users', userId);
          const docSnap= await getDoc(userVoteData);
          
          if (docSnap.exists()) {
            let data = docSnap.data();
            let data1 = data.votedEvents;
            let data2 = data1[title];
        
           setHasVotedForEvent(data2);
            console.log("Document data:",  data2);
          } else {
            // docSnap.data() will be undefined in this case
            console.log("No such document!");
          }

          console.log(userId);

  };


  const fetchResultData = async () => {
    try {
      let id;
      const resultRef = collection(database, 'Community', location, 'voting', votingIndex, 'results');
      const resultSnapshot = await getDocs(resultRef);
      
        const resultData = resultSnapshot.docs.map(doc => ({
          key: doc.id,
          count: doc.data().count,
          
        }));
      
        setResultData(resultData);
        setResultCount(resultData);
      console.log(resultData);
    
    } catch (error) {
      console.error('Error fetching result data:', error);
    }
  };

  useEffect(() => {
   
    fetchVotingData();
    fetchVoteVoting();
    fetchResultData();
    
  }, [location]);

  useEffect(() => {
   
    fetchVoteVoting();
    
  }, [location]);

  const handleChoiceSelect = (choiceIndex) => {
    setSelectedChoiceId(choiceIndex);
  };


  const handleSubmitVote = async () => {
    if (selectedChoiceId !== null) {
      try {
        let userId;
        const votingRef = doc(database, 'Community', location, 'voting', votingIndex);
  
        // Update the choice count in the "results" subcollection
        const resultDocRef = doc(votingRef, 'results', voteChoices[selectedChoiceId].toString());
        await setDoc(resultDocRef, { count: increment(1) }, { merge: true });
  
        // Optionally, reset the selected choice here
        setSelectedChoiceId(null);
        

        const usersPart = query(collection(database, "Community", location, 'users'), where('user', '==', auth.currentUser?.email));
        const querySnapshot = await getDocs(usersPart);
          // Loop through the query results
          querySnapshot.forEach((doc) => {
            // Get the value of the name field
            //let name = doc.get('name');
            // Or use data() to get all fields
            userId = doc.id;
            
          });

        const userRef = doc(database, 'Community', location, 'users', userId);
          await updateDoc(userRef, {
            votedEvents: {
              [voteTitle]: true,
            },
          });

          fetchVoteVoting();
        // Show a success message to the user
        Alert.alert('Vote submitted successfully');
        navigation.navigate('Vote')
      } catch (error) {
        console.error('Error submitting vote:', error);
      }
    } else {
      Alert.alert('Please select a choice before submitting');
    }
  };
  
  
  console.log("you voted: ", hasVotedForEvent);
console.log("you selected: ", selectedChoiceId);


  return (
    <ScrollView>
       <SafeAreaView style={{ flex: 1, alignItems: 'center',  justifyContent: 'center', }}>
      {votingData ? (
        <View style={styles.container}>
          <Text style={styles.title}>{votingData.title}</Text>
          <Text style={styles.description}>Description: {votingData.description}</Text>
       
          <View>
          {voteChoices.map((choice, index) => (
            
            <TouchableOpacity
            key={index}
            style={[
              styles.choiceButton,
              selectedChoiceId === index && styles.selectedChoice,
            ]}
            onPress={() => handleChoiceSelect(index)}
            disabled={hasVotedForEvent}
          >
            <Text
              style={[
                styles.choiceText,
                selectedChoiceId === index && styles.selectedChoiceText,
              ]}
            >
              {index + 1}: {choice}
            </Text>
          </TouchableOpacity>
          

          ))}
          {!hasVotedForEvent && (
          <Button title="Submit Vote" onPress={handleSubmitVote} />
          )}
          {hasVotedForEvent && (
          <Text style={styles.alreadyVotedText}>You have already vote for this voting!!</Text>
          

          )}
           {hasVotedForEvent && (
          <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Voting Results</Text>
          {resultData.map((result, index) => (
            <Text key={index} style={styles.resultItem}>
              {result.key} : {result.count} votes
            </Text>
          ))}
        </View>
          )}
        </View>
        </View>
          
      ) : (
        <Text>Loading voting data...</Text>
      )}
      
      </SafeAreaView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    //backgroundColor: 'grey',
    color: '#fff',
    padding: 15,
    borderRadius: 15,
    margin: 5,
    marginHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceButton: {
    borderRadius: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 5,
  },
  selectedChoice: {
    borderRadius: 20,
    borderColor: 'blue',
    backgroundColor: '#f0f0f0',
  },
  choiceText: {
    fontWeight: 'bold',
    color: 'black',
  },
  selectedChoiceText: {
    color: 'blue', // Change to the desired color for selected choices
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  description: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    color: '#555',
  },
  alreadyVotedText: {
    marginTop: 16,
    color: '#ff0000',
  },
  resultsContainer: {
    marginTop: 20,
    padding: 10,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  resultItem: {
    fontSize: 16,
    marginBottom: 5,
  },
  
});

export default VotingItem;
