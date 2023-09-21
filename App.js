import React, { useState, createContext, useContext, useEffect, useMemo } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, database } from './firebase';
import Login from './screens/Login';
import Signup from './screens/Signup';
import Chat from './screens/Chat';
import Home from './screens/Home';
import Map from './screens/Map';
import Vote from './screens/Vote';
import Profile from './screens/Profile';
import Notifications from './screens/Notifications';
import CreateVoting from './screens/CreateVoting';
import VotingItem from './screens/VotingItem';
import History from './screens/History';
import { RefreshProvider } from './screens/RefreshContext';
import { NotificationsProvider, useNotifications } from './screens/NotificationsContext';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import LocationComponent from "./location";
import Ionic from 'react-native-vector-icons/Ionicons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  doc,
  collection,
  deleteDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';

const Stack = createStackNavigator();
const AuthenticatedUserContext = createContext({});
const Tab = createBottomTabNavigator();

const AuthenticatedUserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
return (
    <AuthenticatedUserContext.Provider value={{ user, setUser }}>
      {children}
    </AuthenticatedUserContext.Provider>
  );
};

const Home1 = ({ location, name, street, city, country, Latitude, Longitude }) => {
  return (
    <RefreshProvider>
    <NotificationsProvider>
    <Stack.Navigator defaultScreenOptions={Back}>
    <Stack.Screen name='Back' component={Back} options={{ headerShown: false }} initialParams={{ location, name, street, city, country, Latitude, Longitude }}/>
    <Stack.Screen name='Notifications' component={Notifications} initialParams={{ location, name, street, city, country, Latitude, Longitude }}/>
    <Stack.Screen name='CreateVoting' component={CreateVoting} initialParams={{ location, name, street, city, country, Latitude, Longitude }}/>
    <Stack.Screen name='VotingItem' component={VotingItem} initialParams={{ location, name, street, city, country, Latitude, Longitude }}/>
    <Stack.Screen name='History' component={History} initialParams={{ location, name, street, city, country, Latitude, Longitude }}/>
  </Stack.Navigator>
  </NotificationsProvider>
  </RefreshProvider>
  );
};

const Back = ({ route }) => {
  const { location, name, street, city, country, Latitude, Longitude } = route.params;
  return (
    <Tab.Navigator 
      screenOptions={({route}) => ({
        shadowLabel: false,
        tabBarIcon: ({focused, size, colour}) => {
          let iconName;
          if(route.name == 'Home'){
            iconName = focused ? 'home' : 'home-outline';
            size = focused ? size + 8 : size + 5;
          } else if(route.name == 'Map'){
            iconName = focused ? 'map-marker-multiple' : 'map-marker-multiple-outline';
            size = focused ? size + 8 : size + 5;
            return <MaterialCommunityIcons name={iconName} size={size} colour={colour}/>;
          } else if(route.name == 'Discussion'){
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
            size = focused ? size + 8 : size + 5;
          } else if(route.name == 'Vote'){
            iconName = focused ? 'vote' : 'vote-outline';
            size = focused ? size + 8 : size + 5;
            return <MaterialCommunityIcons name={iconName} size={size} colour={colour}/>;
          } else if(route.name == 'Profile'){
            iconName = focused ? 'clipboard-account' : 'clipboard-account-outline';
            size = focused ? size + 8 : size + 5;
            return <MaterialCommunityIcons name={iconName} size={size} colour={colour}/>;
          }
          return <Ionic name={iconName} size={size} colour={colour}/>;
          
        },
        tabBarActiveTintColor: 'black',
        tabBarInactiveTintColor: 'white',
        tabBarShadowLabel: false,
        tabBarStyle: {
          height: 85,
          ...styles.shadow,
        },
        
      })}
      

       defaultScreenOptions={Home}>
      <Tab.Screen name='Home' component={Home} initialParams = {{ location, name, street, city, country, Latitude, Longitude }}/>
      <Tab.Screen name='Map' component={Map} initialParams={{ location, name, street, Latitude, Longitude }}/>
      <Tab.Screen name='Vote' component={Vote} initialParams={{ location }}/>
      <Tab.Screen name='Discussion' component={Chat} initialParams={{ location }}/>
      <Tab.Screen name='Profile' component={Profile} initialParams={{ location }}/>
      
    </Tab.Navigator>
  );
}

function AuthStack({ location, name, street, city, country, Latitude, Longitude }) {
  return (
    
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name='Login' component={Login} initialParams={{ location, name, street, city, country, Latitude, Longitude }}/>
      <Stack.Screen name='Signup' component={Signup} initialParams={{ location, name, street, city, country, Latitude, Longitude }}/>
    </Stack.Navigator>
    
  );
}

function RootNavigator({ location, name, street, city, country, Latitude, Longitude }) {
  
  const { user, setUser } = useContext(AuthenticatedUserContext);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    
    const unsubscribeAuth = onAuthStateChanged(
      auth,
      async authenticatedUser => {
        authenticatedUser ? setUser(authenticatedUser) : setUser(null);
        setIsLoading(false);
      }
    );

    return unsubscribeAuth;
  }, [user]);
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size='large' />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <Home1 location = {location} name = {name} street={street} city={city} country={country} Latitude={Latitude} Longitude={Longitude}/> : <AuthStack location = {location} name = {name} city={city} country={country} Latitude={Latitude} Longitude={Longitude}/>}
    </NavigationContainer>
  );
}

export default function App() {
  const [ location, street, name, city, country, Latitude, Longitude ] = LocationComponent();
  console.log("Your current PostalCode is : ", location);


while(location === 'Wait, we are fetching your location...'){
  
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size='large' />
      </View>
    );
  }

  if(location !== 'Wait, we are fetching your location...'){


    if (location == null){
      location = 'uknown place';
       street = 'uknown place';
       name = 'uknown place';
       city = 'uknown place';
       country = 'uknown place';
    }

    // Function to delete inactive users
    async function deleteInactiveUsers() {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      // Query for users whose last login time is older than a week
      const q = query(collection(database, 'Community', location, 'users'), where('createdAt', '<', weekAgo));
      const inactiveUsersSnapshot = await getDocs(q);

      // Delete inactive users and their data
      inactiveUsersSnapshot.forEach(async (userDoc) => {
        const userId = userDoc.id;
        
        await deleteDoc(doc(database, 'Community', location, 'users', userId)); // Delete from Firestore
      });
      //console.log(weekAgo);
    }

    
      deleteInactiveUsers();
    
      /*async function deleteInactiveEvents() {
        const date = new Date();
        const dateString = date.toISOString().split('T')[0];
        
        const q = query(collection(database, 'Community', location, 'event'), where('date', '<', dateString));
        const inactiveEventsSnapshot = await getDocs(q);
  
        
        inactiveEventsSnapshot.forEach(async (eventDoc) => {
          const eventId = eventDoc.id;
          
          await deleteDoc(doc(database, 'Community', location, 'event', eventId)); // Delete from Firestore
        });
     
      }
    
      deleteInactiveEvents();*/
    
    console.log('Your Area is : ' + name);
    
  
  return (
    <AuthenticatedUserProvider>
      <RootNavigator location = {location} name = {name} street={street} city={city} country={country} Latitude={Latitude} Longitude={Longitude}/>
    </AuthenticatedUserProvider>
  );
}
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#7F5DF0',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    elevation: 5
  },
  
});


