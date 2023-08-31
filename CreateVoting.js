import React, { useState, useEffect } from 'react';
import { Alert, ScrollView, View, Text, TextInput, Button, StyleSheet, SafeAreaView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DatePicker from '@react-native-community/datetimepicker';
import TimePicker from '@react-native-community/datetimepicker';
import MapView, { Marker } from 'react-native-maps';
import { useNavigation } from "@react-navigation/native";
import { useNotifications, addNotification } from './NotificationsContext';
import { useRefreshContext } from './RefreshContext';
import { auth, database } from '../firebase';
import {
    doc,
    collection,
    addDoc,
    updateDoc,
    getDocs,
  } from 'firebase/firestore';
 

const CreatingVoting = ({ route }) => {
    const { location, name, street, city, country, Latitude, Longitude } = route.params;
    const navigation = useNavigation();
  const [selectedType, setSelectedType] = useState('event'); // Default value is 'event'
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [choices, setChoices] = useState(['', '']);
  const [customFields, setCustomFields] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [address, setAddress] = useState('');
  const { addNotification } = useNotifications();
  const { triggerRefresh } = useRefreshContext();


  useEffect(() => { //δοκιμη
    if (selectedLocation) {
      fetchAddress(selectedLocation);
    }
  }, [selectedLocation]);

  const fetchAddress = async (coordinate) => {
    const apiKey = 'AIzaSyD-jrw1E9HJ3RFQKEwHhw04qLvaI-cafOM';
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinate.latitude},${coordinate.longitude}&key=${apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        setAddress(data.results[0].formatted_address);
      }
    } catch (error) {
      console.error('Error fetching address:', error);
    }
  }; //δοκιμη


  const handleChoiceChange = (index, choice) => {
    const updatedChoices = [...choices];
    updatedChoices[index] = choice;
    setChoices(updatedChoices);
  };

  const addChoice = () => {
    setChoices([...choices, '']);
  };

  const removeChoice = (index) => {
    const updatedChoices = choices.filter((_, i) => i !== index);
    setChoices(updatedChoices);
  };


  const handleDateChange = (event, selected) => {
    const currentDate = selected || selectedDate;
    setShowDatePicker(false);
    setSelectedDate(currentDate);
  };

  const handleTimeChange = (event, selected) => {
    const currentTime = selected || selectedTime;
    setShowTimePicker(false);
    setSelectedTime(currentTime);
  };

  const handleCreate = async () => {
    try {
      if (selectedType === 'event') {
        // Save data to the 'events' collection
        const eventDocRef = await addDoc(collection(database, 'Community', location, 'event'), {
          
          type: selectedType,
          title,
          description,
          location: address, 
          date: selectedDate.toISOString().split('T')[0],
          time: selectedTime.toTimeString().split(' ')[0],
          // Add other fields as needed
        });
        console.log('Event created with ID: ', eventDocRef.id);
        Alert.alert("You plan " + title);
        addNotification('A new Event with title "' + title + '" has been created');
        triggerRefresh();
      } else if (selectedType === 'voting') {
        // Save data to the 'votings' collection
        const votingDocRef = await addDoc(collection(database, 'Community', location, 'voting'), {
          type: selectedType,
          title,
          description,
          choices,
          //resaults: choices,
          // Add other fields as needed
        });
        console.log('Voting created with ID: ', votingDocRef.id);
        Alert.alert("You plan " + title);

        const usersRef = collection(database, 'Community', location, 'users');
        const usersSnapshot = await getDocs(usersRef);

       // const batch = writeBatch(database);
        
        usersSnapshot.forEach((userDoc) => {
          const userRef = doc(usersRef, userDoc.id);
          updateDoc(userRef, {
            votedEvents: {
              [title]: false,
            },
          });
        });

      }
      
      // Add any success notification or navigation logic here
      
    } catch (error) {
      console.error('Error creating:', error);
    }
    navigation.navigate('Back')
  };

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        
    <ScrollView style={styles.container}>
    <SafeAreaView>
      <Text style={styles.label}>Choose the type:</Text>
      <Picker
        selectedValue={selectedType}
        onValueChange={(itemValue) => setSelectedType(itemValue)}
        style={styles.picker}
      >
        <Picker.Item label="Event" value="event" />
        <Picker.Item label="Voting for" value="voting" />
      </Picker>

      <Text style={styles.label}>Title:</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Enter title"
      />

      <Text style={styles.label}>Description:</Text>
      <TextInput
        style={styles.input}
        value={description}
        onChangeText={setDescription}
        placeholder="Enter description"
        multiline
      />

      {selectedType === 'voting' && (
        <React.Fragment>
          <Text style={styles.label}>Choices:</Text>
          {choices.map((choice, index) => (
            <View key={index} style={styles.choiceContainer}>
              <TextInput
                style={styles.input}
                value={choice}
                onChangeText={(text) => handleChoiceChange(index, text)}
                placeholder={`Choice ${index + 1}`}
              />
              <Button title="Remove" onPress={() => removeChoice(index)} />
            </View>
          ))}
          <Button title="Add Choice" onPress={addChoice} />
          <View style={styles.eButton}>
          <Button title="Create Voting" onPress={handleCreate} style={styles.buttonText} color= 'white'/>
          </View>
        </React.Fragment>
      )}

        {selectedType === 'event' && (
        <React.Fragment>
          <View style={styles.reactFr}>
          <Text style={styles.label}>Location:</Text>
          <MapView
            style={styles.map}
            initialRegion={{
                latitude: Latitude,
                longitude: Longitude,
                latitudeDelta: 0.0222,
                longitudeDelta: 0.0121,
            }}
            onPress={(e) => setSelectedLocation(e.nativeEvent.coordinate)}
          >
            {selectedLocation && (
              <Marker coordinate={selectedLocation} />
            )}
          </MapView>

        <Text style={styles.label}>Date:
        
            <DatePicker
              style={styles.dateTime}
              value={selectedDate}
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
       </Text>
          
          <Text style={styles.label}>Time:
          
            <TimePicker
             style={styles.dateTime}
              value={selectedTime}
              onChange={handleTimeChange}
              mode="time"
            />
          </Text>
          {/*customFields.map((field, index) => (
            <View key={index}>
              <Text style={styles.label}>{field.label}:</Text>
              <TextInput
                style={styles.input}
                value={field.value}
                onChangeText={(text) => handleCustomFieldChange(index, field.label, text)}
                placeholder={`Enter ${field.label}`}
              />
              <Button
                title="Remove"
                onPress={() => removeCustomField(index)}
                color="#FF5733"
            />
            </View>
          ))*/}
          {/*<Button title="Add Custom Field" onPress={addCustomField} />*/}
          <View style={styles.eButton}>
            <Button title="Create event" onPress={handleCreate} style={styles.buttonText} color= 'white'/>
          </View>
          </View>
        </React.Fragment>
        )}
      </SafeAreaView>
    </ScrollView>
    
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: '#fff',
      marginBottom: 0,
    },
    label: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 8,
      color: '#333',
    },
    picker: {
      marginBottom: 16,
      margin: 20,
    },
    input: {
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
      color: '#333',
    },
    choiceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    choiceInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 8,
      padding: 10,
      marginRight: 8,
      color: '#333',
    },
    
    map: {
        width: '100%',
        height: 300,
        marginTop: 10,
        borderRadius: 10,
      },
      
      reactFr: {
        marginBottom: 40,
      },
      eButton: {
        marginTop: 20,
        marginBottom: 20,
        backgroundColor: '#000080', // Choose your button color
        borderRadius: 30,
        paddingVertical: 5,
        paddingHorizontal: 0,
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 1.25,
        shadowRadius: 3.84,
        elevation: 5,
      },
      buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
        textAlign: 'center',
      },
  });
  

export default CreatingVoting;
