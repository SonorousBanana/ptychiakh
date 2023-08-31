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
      padding: 16,
      backgroundColor: 'white',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    notificationIcon: {
      marginRight: 5,
    },
    notificationCount: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    notificationList: {
      flex: 1,
      marginBottom: 16,
    },
    notificationText: {
      fontSize: 16,
      marginBottom: 8,
    },
  });

export default Notifications;