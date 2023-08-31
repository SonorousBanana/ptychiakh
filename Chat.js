import React, {
    useState,
    useEffect,
    useLayoutEffect,
    useCallback
  } from 'react';
  import { View, Text } from 'react-native';
  import { GiftedChat } from 'react-native-gifted-chat';
  import {
    collection,
    addDoc,
    orderBy,
    query,
    onSnapshot
  } from 'firebase/firestore';
  import { auth, database } from '../firebase';
  import { useNavigation } from '@react-navigation/native';
  import DatePicker from '@react-native-community/datetimepicker';
  import TimePicker from '@react-native-community/datetimepicker';



  export default function Chat({ route }) {
    const { location } = route.params;
    const [userId, setUserId ] = useState(auth.currentUser?.uid);
    console.log(location);

    const [messages, setMessages] = useState([]);
    const navigation = useNavigation();

  

    useLayoutEffect(() => {

        const collectionRef = collection(database, 'Community', location, 'chat');
        const q = query(collectionRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, querySnapshot => {
        console.log('querySnapshot unsusbscribe');
          setMessages(
            querySnapshot.docs.map(doc => ({
              _id: doc.data()._id,
              createdAt: doc.data().createdAt.toDate(),
              text: doc.data().text,
              user: doc.data().user
            }))
          );
        });
    return unsubscribe;
      }, []);

    const onSend = useCallback((messages = []) => {
        setMessages(previousMessages =>
          GiftedChat.append(previousMessages, messages)
        );
        // setMessages([...messages, ...messages]);
        const { _id, createdAt, text, user } = messages[0];    
        addDoc(collection(database, 'Community', location, 'chat'), {
          _id,
          createdAt,
          text,
          user
        });
      }, []);

      return (

              <GiftedChat
                messages={messages}
                showAvatarForEveryMessage={false}
                showUserAvatar={true}
                onSend={messages => onSend(messages)}
                messagesContainerStyle={{
                  backgroundColor: '#fff'
                }}
                textInputStyle={{
                  backgroundColor: '#fff',
                  borderRadius: 20,
                }}
                user={{
                  _id: auth?.currentUser?.email,
                  avatar: 'https://i.pravatar.cc/300'
                }}
                renderMessage={({ currentMessage }) => (
                  <View style={{ marginVertical: 10 }}>
                    <Text style={{ 
                      marginLeft: currentMessage.user._id === auth?.currentUser?.email ? 0 : 20,
                      marginRight: currentMessage.user._id === auth?.currentUser?.email ? 20 : 0,
                      fontSize: 10,
                      color: currentMessage.user._id === auth?.currentUser?.email ? 'grey' : 'grey',
                      textAlign: currentMessage.user._id === auth?.currentUser?.email ? 'right' : 'left',
                      }}>
                      {currentMessage.user._id}
                      
                    </Text>
                    <Text style={{
                          fontSize: 7,
                          textAlign: currentMessage.user._id === auth?.currentUser?.email ? 'right' : 'left',
                          marginLeft: currentMessage.user._id === auth?.currentUser?.email ? 0 : 20,
                          marginRight: currentMessage.user._id === auth?.currentUser?.email ? 20 : 0,
                       }}>
                        {currentMessage.createdAt.toISOString().split('T')[0]}
                        
                        </Text>
                        
                    <View style={{ 
                      backgroundColor: currentMessage.user._id === auth?.currentUser?.email ? '#4169E1' : '#F0F0F0', // Dark gray background color
                      paddingVertical: 9,
                      paddingHorizontal: 13,
                      borderRadius: 20, // Larger border radius
                      margin: 4,
                      marginLeft: currentMessage.user._id === auth?.currentUser?.email ? 'auto' : 20,
                      marginRight: currentMessage.user._id === auth?.currentUser?.email ? 20 : 'auto',

                      
                      
                      
                      }}>
                        <Text style={{
                          fontSize: 15,
                          textAlign: currentMessage.user._id === auth?.currentUser?.email ? 'right' : 'left',
                        color: currentMessage.user._id === auth?.currentUser?.email ? 'white' : 'black',
                       }}>
                        {currentMessage.text}
                        
                        </Text>
                        <Text style={{
                          fontSize: 7,
                          color: currentMessage.user._id === auth?.currentUser?.email ? 'white' : 'black',
                          textAlign: 'center',
                          marginTop: 5,
                       }}>
                        {currentMessage.createdAt.toTimeString().split(' ')[0]}
                        </Text>
                      </View>
                      
                  </View>
                )}
              />
       
       
        
      );
}