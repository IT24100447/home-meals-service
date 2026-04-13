import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import BottomNavBar from '../components/BottomNavBar';

const StudentRequests = () => {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Custom Requests</Text>
                <Text style={styles.subtitle}>Request special meals from your favorite cooks.</Text>
            </View>
            <BottomNavBar role="student" />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1A1C1E', marginBottom: 10 },
    subtitle: { fontSize: 16, color: '#7F8C8D' }
});

export default StudentRequests;
