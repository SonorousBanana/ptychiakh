import React, { useState } from 'react';
import { StyleSheet, Text, View, Button, TextInput, Image, SafeAreaView, TouchableOpacity, StatusBar, Alert } from "react-native";
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigation } from "@react-navigation/native";
import { auth, database } from '../firebase';
import {
  doc,
  collection,
  addDoc,
  setDoc,
  getDocs,
  updateDoc,
  orderBy,
  query,
  onSnapshot,
  querySnapshot,
  where,
  serverTimestamp
} from 'firebase/firestore';
const backImage = require("../assets/backImage.png");

export default function Signup({ route }) {
  const { location, name, street, city, country, Latitude, Longitude } = route.params;
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');


  while(location === 'Wait, we are fetching your location...'){
  
 
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size='large' />
      </View>
    );
  }
  
  const q = collection(database, 'Community');


const onHandleSignup = async () => {

  let uid;
    let ComId = location;
    if (email !== '' && password !== '') {
  createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          const user = userCredential.user;
          uid = user.uid; // Get the UID
          console.log("Sign Up success. User UID: ", uid);
          console.log("Sign Up and Login success. You are in: ", name)

        const ftia3eTaPanta = async () => {
          try {
            let userCommunity = doc(database, "Community", ComId);
            const communityId = userCommunity.id;
            const querySnapshot = await getDocs(q);//
            let real;
            let real1=false;
            querySnapshot.forEach((doc) => {
              if (communityId === doc.id){
                  real = true;
              }
            });
            const checkIfUserBelonges = collection(database, 'Community', location, 'users');
      
            //τσεκαρει αν ο χρηστης εχει ξανασυνδεθεί στην συγκεκριμενη τοποθεσια
            //αν δεν εχει ξανασυνδεθει τοτε θετει το real1 ως false και αποθηκευει τον χρηστη υστερα απο ελεγχο
      
            //useEffect(() => {
              
              //const q = getDocs(countUsers);
              /*const unsubscribe = onSnapshot(checkIfUserBelonges, (querySnapshot) => {
                
                querySnapshot.forEach((doc) => {
                  if (doc.data().user === email){
                    real1 = true;
                    console.log('this user has logged in in the past in this location');
                }
                  //console.log('User data: ', doc.data().count);
                  
                });
               
              });
          
              // Stop listening for updates when no longer required
              unsubscribe();*/
            //}, []);
      
            const querySnapshot1 = await getDocs(query(checkIfUserBelonges));//
            
            querySnapshot1.forEach((doc) => {
              if (doc.data().user === email){
                  real1 = true;
                  console.log('this user has logged in in the past in this location');
              }
            });
            
            if (real === true){
      
              console.log("this community exists");
              console.log("Document written with ID: ", userCommunity.id);
      
              if (real1 == false){  
                console.log("hello");
                setDoc(doc(database, "Community", location, 'users', uid), {
                  user: email,
                  createdAt: serverTimestamp(),
                  isAdmin: false,
                  participateInElection: false,
                  hasVote: false,
                  description: null,
                });
              }else{
                let userId;
                const updateUserLogIn = query(collection(database, "Community", location, 'users'), where('user', '==', email));
                const querySnapshot2 = await getDocs(updateUserLogIn);//
                  querySnapshot2.forEach((doc) => {
                      
                      userId = doc.id;
                  });
                  console.log("trexeiiiiiii", uid);
                  const documentRef = doc(database, "Community", location, 'users', uid);
                  updateDoc(documentRef, {//
                      "createdAt": serverTimestamp(),
                  });
              }
            }else{
              
              console.log("this community doesn't exists, you create a new room");
      
               setDoc(doc(database, 'Community', location), {//
                  
                  postalCode: location,
                  name: name,
                  city: city,
                  country: country,
      
                });
      
              if (real1 == false){ 
                console.log("trexeiiiiiii", uid);
                setDoc(doc(database, "Community", location, 'users', uid), {
                  user: email,
                  createdAt: serverTimestamp(),
                  isAdmin: false,
                  participateInElection: false,
                  hasVote: false,
                  description: null,
                }, {merge: true});
              }
              console.log("Document written with ID: ", userCommunity.id);
            }

          } catch (e) {
            console.error("Error adding document: ", e);
          }}
          ftia3eTaPanta();
        })
        .catch((err) => Alert.alert("Login error", err.message));
        } else {
          Alert.alert("Please Enter Your Details");
        }
};
  
  return (
    <View style={styles.container}>
      <Image source={backImage} style={styles.backImage} />
      <View style={styles.whiteSheet} />
      <SafeAreaView style={styles.form}>
        <Text style={styles.title}>Sign Up</Text>
         <TextInput
        style={styles.input}
        placeholder="Enter email"
        autoCapitalize="none"
        keyboardType="email-address"
        textContentType="emailAddress"
        autoFocus={true}
        value={email}
        onChangeText={(text) => setEmail(text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Enter password"
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry={true}
        textContentType="password"
        value={password}
        onChangeText={(text) => setPassword(text)}
      />
      <TouchableOpacity style={styles.button} onPress={onHandleSignup}>
        <Text style={{fontWeight: 'bold', color: '#fff', fontSize: 18}}> Sign Up</Text>
      </TouchableOpacity>
      <View style={{marginTop: 20, flexDirection: 'row', alignItems: 'center', alignSelf: 'center'}}>
        <Text style={{color: 'gray', fontWeight: '600', fontSize: 14}}>Don't have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={{color: '#f57c00', fontWeight: '600', fontSize: 14}}> Log In</Text>
        </TouchableOpacity>
      </View>
      </SafeAreaView>
      <StatusBar barStyle="light-content" />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: "orange",
    alignSelf: "center",
    paddingBottom: 24,
  },
  input: {
    backgroundColor: "#F6F7FB",
    height: 58,
    marginBottom: 20,
    fontSize: 16,
    borderRadius: 10,
    padding: 12,
  },
  backImage: {
    width: "100%",
    height: 340,
    position: "absolute",
    top: 0,
    resizeMode: 'cover',
  },
  whiteSheet: {
    width: '100%',
    height: '75%',
    position: "absolute",
    bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 60,
  },
  form: {
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 30,
  },
  button: {
    backgroundColor: '#f57c00',
    height: 58,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
});