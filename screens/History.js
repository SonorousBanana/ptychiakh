import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, SafeAreaView, ScrollView } from "react-native";
import { auth, database } from '../firebase';
import { useNavigation } from "@react-navigation/native";
import { Card } from 'react-native-paper';
import {
  doc,
  collection,
  onSnapshot,
} from 'firebase/firestore';

const History = ({ route }) => {
    const { location, name, street, city, country, Latitude, Longitude } = route.params;
    const navigation = useNavigation()
    const [votingData, setVotingData] = useState([]);


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
       
             return unsubscribe;
           } catch (error) {
             console.error('Error fetching voting data:', error);
           }
         
           return () => {
             unsubscribe();
           };
         }, [location]);


         const currentDate = new Date().toISOString().split('T')[0];
            console.log('Current Date:', currentDate);

            const filteredVotingData = votingData.filter(item => {
                const votingDate = item.deadlineDate.split('T')[0];
                console.log('Voting Date:', votingDate);
                return votingDate < currentDate;
            });
            console.log('Filtered Voting Data:', filteredVotingData);



            const renderVotingItem = ({ item }) => (

                <Card style={styles.eventCard}>
                <View key={item.key}>
                  <Text style={styles.title}>{item.title}</Text>
                
                </View>
                </Card>
              );


    return (
        <ScrollView style={{ flex: 1, marginTop:20}} nestedScrollEnabled = {true}>
             <SafeAreaView style={{ flex: 1, alignItems: 'center',  justifyContent: 'center', }}>
        
            <Text style={styles.postTitle}>History Of Community's Votings</Text>
            {filteredVotingData.map((item, index) => (
              <View key={index}>
                
                <TouchableOpacity onPress={() => navigation.navigate('VotingItem', { votingIndex: item.key })}>
                {renderVotingItem({ item })}
                
                </TouchableOpacity>
              </View> ))}
       
        </SafeAreaView>

      </ScrollView>

    );
}

const styles = StyleSheet.create({
    eventCard: {
        width: 300,
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
      postTitle: {
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        
      },

});

export default History;