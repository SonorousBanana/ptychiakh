import React, { useState, useEffect } from 'react';
import { Alert, View, TouchableOpacity, Text, Image, StyleSheet, Button, Pressable, StatusBar, Dimensions, SafeAreaView, ScrollView } from "react-native";
import { auth, database } from '../firebase';
import { useNavigation } from "@react-navigation/native";
import {
  doc,
  collection,
  addDoc,
  setDoc,
  getDocs,
  getDoc,
  updateDoc,
  query,
  onSnapshot,
  querySnapshot,
  where,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import DatePicker from '@react-native-community/datetimepicker';
import TimePicker from '@react-native-community/datetimepicker';


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
  //const [resultId, setResultId] = useState([]);
  const [resultCount, setResultCount] = useState(null);
  const [deadExceed, setDeadExceed] = useState(null);
  const [deadlineDate, setDeadLineDate] = useState([]);
  const [deadlineTime, setDeadLineTime] = useState([]);
  const [disability,  setDisability] = useState(false);
  let title;


  const fetchVotingData = () => {
    try {
      const votingRef = doc(database, 'Community', location, 'voting', votingIndex);

      // Use onSnapshot to listen for real-time updates
      onSnapshot(votingRef, (snapshot) => {
        if (snapshot.exists()) {
          const votingData2 = snapshot.data();

          title = votingData2.title;
          setVoteTitle(votingData2.title);
          setVoteDescription(votingData2.description);
          setVoteChoices(votingData2.choices);
          setVotingData(votingData2);
          setDeadLineDate(votingData2.deadlineDate);
          setDeadLineTime(votingData2.deadlineTime);
        }
      });
    } catch (error) {
      console.error('Error fetching voting data:', error);
    }
  };

  const fetchVoteVoting = async () => {
    let userId;
    const usersPart = query(collection(database, "Community", location, 'users'), where('user', '==', auth.currentUser?.email));
    const querySnapshot = await getDocs(usersPart);
    querySnapshot.forEach((doc) => {
      userId = doc.id;
    });

    const userVoteData = doc(database, "Community", location, 'users', userId);
    const docSnap = await getDoc(userVoteData);

    if (docSnap.exists()) {
      let data = docSnap.data();
      let data1 = data.votedEvents;
      let data2 = data1[title];

      setHasVotedForEvent(data2);
    
    } else {
      console.log("No such document!");
    }
    // Use onSnapshot to listen for real-time updates
    onSnapshot(userVoteData, (snapshot) => {
      if (snapshot.exists()) {
        let data = snapshot.data();
        let data1 = data.votedEvents;
        let data2 = data1[title];
        setHasVotedForEvent(data2);
      }
    });
  };


  const fetchResultData = () => {
    
    try {
      const resultRef = collection(database, 'Community', location, 'voting', votingIndex, 'results');

      onSnapshot(resultRef, (snapshot) => {
        const resultData = snapshot.docs.map((doc) => {
          const data = doc.data();
          const voteIds = data.votesIds || {};
          const voteCount = Object.keys(voteIds).length;
          return {
            key: doc.id,
            count: voteCount,
          };
        });
  
        setResultData(resultData);
        setResultCount(resultData);
        //console.log(resultData);
      });

    } catch (error) {
      console.error('Error fetching result data:', error);
    }
  };

  useEffect(() => {
    
    const votingRef = doc(database, 'Community', location, 'voting', votingIndex);

    // Use onSnapshot to listen for real-time updates to the deadline data
    const unsubscribe = onSnapshot(votingRef, (snapshot) => {
      if (snapshot.exists()) {
        const votingData2 = snapshot.data();


        const currentTimestamp = new Date();
        currentTimestamp.setDate(currentTimestamp.getDate())
        console.log(currentTimestamp);
        const currentDate = currentTimestamp.toISOString().split('T')[0];
        const currentTime = currentTimestamp.toTimeString().split(' ')[0];
        const deadlineDate = votingData2.deadlineDate;
        const deadlineTime = votingData2.deadlineTime;
        console.log("Date current : ", currentDate);
        console.log("Time current : ", currentTime);

        if (currentDate === deadlineDate && currentTime >= deadlineTime) {

          setDisability(true);
          setDeadExceed(true);
        } else if (currentDate > deadlineDate) {

          setDisability(true);
          setDeadExceed(true);
        } else {
          // Deadline has not passed

          setDeadExceed(false);
        }

        if (hasVotedForEvent === true) {
          setDisability(true);
        } else {
          setDisability(false);
        }
      }
    });
    return unsubscribe;

}, []);


  useEffect(() => {
   
    fetchVotingData();
    fetchVoteVoting();
    fetchResultData();

    if (hasVotedForEvent === true ) {
      setDisability(true);
    } else {
      setDisability(false);
    }
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
        await setDoc(resultDocRef, { 
          count: increment(1) 
        }, { merge: true });
       
      const subcollectionName = voteChoices[selectedChoiceId].toString();
      const subcollectionRef = doc(database, 'Community', location, 'voting', votingIndex, 'results', subcollectionName);

      const subcollectionQuerySnapshot = await getDoc(subcollectionRef);
      const numberOfSubcollections = subcollectionQuerySnapshot.size;
      const allVotes = subcollectionQuerySnapshot.data().votesIds || [];
        await updateDoc(subcollectionRef, {
          'votesIds': {
            ...allVotes,
            [auth.currentUser?.uid]: {
              time: serverTimestamp(),
            },
          },
        });
      console.log(`Number of subcollections under '${subcollectionName}': ${numberOfSubcollections}`);

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
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data();
          await updateDoc(userRef, {
            votedEvents: {
              ...userData.votedEvents,
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
  
  
  //console.log("you voted: ", hasVotedForEvent);
//console.log("you selected: ", selectedChoiceId);


  return (
    <ScrollView>
       <SafeAreaView style={{ flex: 1, alignItems: 'center',  justifyContent: 'center', }}>
      {votingData ? (
        <View style={styles.container}>
          <Text style={styles.title}>{votingData.title}</Text>
          <Text style={styles.description}>Description: {votingData.description}</Text>
          <Text style={styles.description}>Voting Ends in {votingData.deadlineDate} {votingData.deadlineTime}</Text>

          <View>
          {voteChoices.map((choice, index) => (
            
            <TouchableOpacity
            key={index}
            style={[
              styles.choiceButton,
              selectedChoiceId === index && styles.selectedChoice,
            ]}
            onPress={() => handleChoiceSelect(index)}
            disabled={disability}
            
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
              
          {!hasVotedForEvent && !deadExceed && (
          <Button title="Submit Vote" onPress={handleSubmitVote} disabled={disability}/>
          )}
          {hasVotedForEvent && (
          <Text style={styles.alreadyVotedText}>You have already vote for this voting!!</Text>
          
          )}

          {deadExceed && (
            <Text style={styles.alreadyVotedText}>The DeadLine of this voting has exceed</Text>
          )}
          
           {hasVotedForEvent || deadExceed ? (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>Voting Results</Text>
              {resultData.map((result, index) => (
                <Text key={index} style={styles.resultItem}>
                  {result.key} : {result.count} votes
                </Text>
              ))}
            </View>
          ) : null}
          
          
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
