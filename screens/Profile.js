import React, { useState, useEffect, useLayoutEffect } from "react";
import { ScrollView, Alert, View, TouchableOpacity, Text, Image, TextInput, StyleSheet, Button, TouchableWithoutFeedback, Keyboard } from "react-native";
import { signOut } from 'firebase/auth';
import { auth, database } from '../firebase';
import { useNavigation } from "@react-navigation/native";
import Ionic from 'react-native-vector-icons/Ionicons';
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
} from 'firebase/firestore';

const Profile = ({ route }) =>{
  const { location } = route.params;
  const [profileText, setProfileText] = useState('');
  const [savedText, setSavedText] = useState('');
  const [usersProfile, setUserProfile] = useState('');
  const navigation = useNavigation();
  const [isEditing, setIsEditing] = useState(false);
   
    const onSignOut = () => {
        signOut(auth).then(() => console.log("Logout success")).catch(error => console.log('Error logging out: ', error));
      };

      useEffect(() => {
        // Set up a real-time listener for the profile document
        const docRef = query(collection(database, "Community", location, 'users'), where('user', '==', auth.currentUser?.email)); // Update the collection name and document ID

        const unsubscribe = onSnapshot(docRef, (querySnapshot) => {
          querySnapshot.forEach((doc) => {
              const data = doc.data();
              setProfileText(data.description);
              setSavedText(data.description);
          setUserProfile(data.user);
            });
          });
    
        return () => {
          // Unsubscribe from the listener when the component unmounts
          unsubscribe();
          
        };
      }, [location]);

    
      const handleSave = async () => {
        // Save the input text to Firestore
        let userId;
        const docRef = query(collection(database, "Community", location, 'users'), where('user', '==', auth.currentUser?.email)); // Update the collection name and document ID
        const docSnap = await getDocs(docRef);
          
         docSnap.forEach((doc) => {
          userId = doc.id;
        });
        try{
         updateDoc(doc(database, 'Community', location, 'users', userId), { 
          "description": profileText }).then(() =>{
            console.log("on prof update profile ok!!");
          }).catch((err) => Alert.alert("update description error", err.message));

          updateDoc(doc(database, 'Community', location, 'candidates', userId), { 
            "description": profileText }).then(() =>{
              console.log("on prof, update desc candidate ok!!");
            }).catch((err) => console.log("doesnt paticipate", err.message));
    
        setSavedText(profileText);
        setIsEditing(false);
        } catch (error) {
          console.error('Error saving profile text:', error);
        }
      };

      const handleDeleteAccount = async () => {
        // Show a confirmation alert to the user
        let userId;
                    const docRef = query(collection(database, "Community", location, 'users'), where('user', '==', auth.currentUser?.email)); // Update the collection name and document ID
                    const docSnap = await getDocs(docRef);
                    docSnap.forEach((doc) => {
                      userId = doc.id;
                    });
        Alert.alert(
          'Confirm Account Deletion',
          'Are you sure you want to delete your account? This action cannot be undone.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => {
                const user = auth.currentUser;
                if (user) {
                  user
                    .delete()
                    .then(() => {
                    
                      deleteDoc(doc(database, 'Community', location, 'users', userId)).then(() =>{
                        console.log("on prof delete profile ok!!");
                      }).catch((err) => Alert.alert("delete profile error"));

                      deleteDoc(doc(database, 'Community', location, 'candidates', userId)).then(() =>{
                          console.log("on prof, delete candidate ok!!");
                        }).catch((err) => Alert.alert("delete candidate", err.message));

                      console.log('User account deleted successfully.');
                      // Redirect or perform any other actions after deletion
                    })
                    .catch((error) => {
                      console.error('Error deleting user account:', error);
                    });
    
                } else {
                  console.log('No user is currently signed in.');
                }
              },
            },
          ],
          { cancelable: true }
        );
      };

    return (
      <ScrollView>
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <View style={styles.container}>
            
            <Text style={styles.text}>Describe yourself about participating in elections. Why should your fellow citizens vote for you as a community leader?</Text>
            <Text style={styles.title}>Description:</Text>
  
            {isEditing ? (
              <TextInput
                value={profileText}
                onChangeText={setProfileText}
                multiline
                numberOfLines={4}
                style={styles.descriptionText}
              />
            ) : (
              <Text style={styles.descriptionText} onPress={() => setIsEditing(true)}>
                {profileText}
              </Text>
            )}

            {isEditing && (
              <Button title="Save" onPress={handleSave} />
             )}
  
            <TouchableOpacity style={styles.button} onPress={onSignOut}>
              <Text style={{ color: 'white', fontWeight: '600', fontSize: 18 }}>Log out <Ionic name='log-out-outline' size={18} /></Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDeleteAccount}>
              <Text style={{ color: 'red', fontWeight: '600', fontSize: 18, margin: 30, alignSelf: 'center' }}>Delete Your Account</Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>
    );
};

export default Profile;

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#fff",
    },
    button: {
      backgroundColor: '#b23b3b',
      height: 58,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 40,
      marginHorizontal: 30,
    },
    text: {
      justifyContent: 'center',
      alignItems: 'center',
      margin: 15,
      //borderWidth: 1,
      //borderColor: '#ccc',
      //borderRadius: 8,
      padding: 12,
      marginBottom: 16,
      color: '#333',
    },
    title: {
      textDecorationLine: 'underline',
      justifyContent: 'center',
      alignItems: 'center',
      margin: 10,
    },
   descriptionText: {
      justifyContent: 'center',
      alignItems: 'center',
      margin: 15,
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
      color: '#333',
    },
  });