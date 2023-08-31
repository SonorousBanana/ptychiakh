import React, { useState, useEffect, useLayoutEffect } from "react";
import { ScrollView, Alert, View, TouchableOpacity, Text, Image, TextInput, StyleSheet, Button, TouchableWithoutFeedback, Keyboard } from "react-native";
import { signOut } from 'firebase/auth';
import { auth, database } from '../firebase';
import { useNavigation } from "@react-navigation/native";
import Ionic from 'react-native-vector-icons/Ionicons';
import ImagePicker from 'react-native-image-picker';

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
import { storage } from '../firebase';

const Profile = ({ route }) =>{
  const { location } = route.params;
  const [profileText, setProfileText] = useState('');
  const [savedText, setSavedText] = useState('');
  const [usersProfile, setUserProfile] = useState('');
  const [displayText, setDisplayText] = useState('Write something for you...');
  const [editing, setEditing] = useState(false);
  const [editedText, setEditedText] = useState('');
    const navigation = useNavigation();
    const [profileImage, setProfileImage] = useState(null);
   

    const onSignOut = () => {
        signOut(auth).then(() => console.log("Logout success")).catch(error => console.log('Error logging out: ', error));
      };


      useEffect(() => {
        // Fetch the saved text from Firestore when the component mounts
        const fetchProfileText = async () => {
          let userId;
          let text;
          let user;
          const docRef = query(collection(database, "Community", location, 'users'), where('user', '==', auth.currentUser?.email)); // Update the collection name and document ID
          const docSnap = await getDocs(docRef);
          
         docSnap.forEach((doc) => {
          userId = doc.id;
          text = doc.data().Description;
          user = doc.data().user;
          
        });
        setSavedText(text);
          setUserProfile(user);
      }
        fetchProfileText();
      }, []);
    
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
          "Description": profileText }).then(() =>{
            console.log("on prof update profile ok!!");
          }).catch((err) => Alert.alert("Login error", err.message));

          updateDoc(doc(database, 'Community', location, 'candidates', userId), { 
            "Description": profileText }).then(() =>{
              console.log("on prof, update desc candidate ok!!");
            }).catch((err) => Alert.alert("Login error", err.message));
    
        setSavedText(profileText);
        } catch (error) {
          console.error('Error saving profile text:', error);
        }
      };


      const openImagePicker = async () => {
        try {
          const image = await ImagePicker.openPicker({
            width: 300,
            height: 300,
            cropping: true,
          });
    
          const uploadUri = image.path;
    
          // Upload image to Firebase Storage
          const storageRef = storage().ref(`profileImages/${userId}`);
          const task = storageRef.putFile(uploadUri);
    
          task.on('state_changed', (taskSnapshot) => {
            const progress = (taskSnapshot.bytesTransferred / taskSnapshot.totalBytes) * 100;
            console.log(`Upload is ${progress}% complete`);
          });
    
          task.then(async () => {
            console.log('Image uploaded to Firebase Storage');
    
            // Get the download URL of the uploaded image
            const downloadURL = await storageRef.getDownloadURL();
    
            // Update the user's Firestore document with the download URL
            const userDocRef = doc(
              database,
              'Community',
              location,
              'users',
              userId
            );
    
            await updateDoc(userDocRef, {
              profileImage: downloadURL,
            });
    
            console.log('Download URL stored in Firestore');
            setProfileImage(downloadURL);
          });
        } catch (error) {
          console.error('Error uploading image:', error);
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
                        console.log("on prof update profile ok!!");
                      }).catch((err) => Alert.alert("Login error", err.message));

                      deleteDoc(doc(database, 'Community', location, 'candidates', userId)).then(() =>{
                          console.log("on prof, update desc candidate ok!!");
                        }).catch((err) => Alert.alert("Login error", err.message));


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
    
      const handleEditStart = () => {
        setEditing(true);
        setEditedText(displayText);
      };
    
      const handleEditEnd = async () => {
        setEditing(false);
        setDisplayText(editedText);
        let userId;
        const docRef = query(collection(database, "Community", location, 'users'), where('user', '==', auth.currentUser?.email)); // Update the collection name and document ID
        const docSnap = await getDocs(docRef);
          
         docSnap.forEach((doc) => {
          userId = doc.id;
        });
        try{
        await updateDoc(doc(database, 'Community', location, 'users', userId), { 
          "Description": editedText });
    
        setSavedText(editedText);
        } catch (error) {
          console.error('Error saving profile text:', error);
        }
      };
    
      const handleTextChange = (text) => {
        setEditedText(text);
      };

    return(
      <ScrollView>
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <View style={styles.container}>
        
        {profileImage && <Image source={{ uri: profileImage }} style={{ width: 100, height: 100 }} />}
          <Text style={styles.text}>Describe yourself about participating in elections. Why should your fellow citizens vote for you as a community leader?</Text>
            
            <TextInput
              placeholder="Write something..."
              value={profileText}
              multiline
              numberOfLines={4}
              onChangeText={setProfileText}
              style={styles.text}
          />
            <Button title="Save" onPress={handleSave} />
            
            <Text style={styles.title}>Description: </Text>
            <Text style={styles.text}>{savedText}</Text>
            
        <TouchableOpacity style={styles.button} onPress={onSignOut}>
          <Text style={{color: 'white', fontWeight: '600', fontSize: 18}}>Log out <Ionic name='log-out-outline'size={18}/></Text>
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
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 8,
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
  });