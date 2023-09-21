import React, { useState, useEffect, useLayoutEffect } from "react";
import { View, TouchableOpacity, Text, Image, StyleSheet, FlatList, Button } from "react-native";
import { NotificationsProvider, useNotifications } from './NotificationsContext';
import { Icon, Input } from 'react-native-elements';

const Notifications = () =>{
    const { notifications, newNotificationsCount, clearNotifications } = useNotifications();

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.notificationIcon}>
            <Icon name="notifications" size={24} color="black" />
          </View>
          <Text style={styles.notificationCount}>
            {newNotificationsCount > 0 ? newNotificationsCount : ''}
          </Text>
        </View>
  
        <FlatList
          data={notifications}
          renderItem={({ item }) => <Text style={styles.notificationText}>{item}</Text>}
          keyExtractor={(item, index) => index.toString()}
          style={styles.notificationList}
        />
  
        <Button title="Clear Notifications" onPress={clearNotifications} />
      </View>
    );
  };
  
  const styles = StyleSheet.create({
    
    container: {
      flex: 1,
      backgroundColor: 'white',
      paddingVertical: 16,
      paddingHorizontal: 20,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    notificationCount: {
      borderRadius: 12,
      width: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 10,
    },
    notificationCountText: {
      color: 'white',
      fontSize: 16,
      fontWeight: 'bold',
    },
    notificationList: {
      flex: 1,
      marginBottom: 20,
    },
    notificationItem: {
      backgroundColor: 'white',
      padding: 12,
      borderRadius: 8,
      marginBottom: 12,
      elevation: 3,
      borderWidth: 1,
      borderColor: '#ddd',
    },
    notificationText: {
      fontSize: 16,
      color: '#333',
    },
    clearButton: {
      backgroundColor: '#1877f2',
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    clearButtonText: {
      fontSize: 16,
      color: 'white',
      fontWeight: 'bold',
    },
  });

export default Notifications;