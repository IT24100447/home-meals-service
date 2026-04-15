import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator, Platform, FlatList, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import BottomNavBar from '../components/BottomNavBar';

const SellerRequests = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [requests, setRequests] = useState<any[]>([]);

    const fetchAvailableRequests = async () => {
        try {
            const token = Platform.OS === 'web' ? localStorage.getItem('userToken') : await SecureStore.getItemAsync('userToken');
            const res = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/meal-requests/available`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setRequests(res.data.requests);
            }
        } catch (err) {
            console.error("Error fetching requests:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAvailableRequests();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchAvailableRequests();
    };

    const handleAccept = async (requestId: string) => {
        Alert.alert(
            "Accept Request",
            "Are you sure you want to accept this custom meal request?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Accept", 
                    onPress: async () => {
                        try {
                            const token = Platform.OS === 'web' ? localStorage.getItem('userToken') : await SecureStore.getItemAsync('userToken');
                            const res = await axios.put(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/meal-requests/accept/${requestId}`, {}, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            if (res.data.success) {
                                Alert.alert("Success", "Request accepted! Please contact the student.");
                                fetchAvailableRequests();
                            }
                        } catch (err: any) {
                            Alert.alert("Error", err.response?.data?.message || "Failed to accept");
                        }
                    }
                }
            ]
        );
    };

    const renderRequestCard = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>{item.userId?.firstName} {item.userId?.lastName}</Text>
                    <View style={styles.locationContainer}>
                        <Ionicons name="location-sharp" size={14} color="#30C65A" />
                        <Text style={styles.locationText}>{item.city}</Text>
                    </View>
                </View>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.preferredCategory?.toUpperCase()}</Text>
                </View>
            </View>

            <View style={styles.mealInfo}>
                <Text style={styles.mealName}>{item.requestedMealName}</Text>
                {item.description && <Text style={styles.description}>{item.description}</Text>}
            </View>

            <View style={styles.detailsRow}>
                <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>Budget</Text>
                    <Text style={styles.detailValue}>LKR {item.budgetRange}</Text>
                </View>
                <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>Quantity</Text>
                    <Text style={styles.detailValue}>{item.quantityNeeded}</Text>
                </View>
                <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>Type</Text>
                    <Text style={styles.detailValue}>{item.preferredMealType?.toUpperCase()}</Text>
                </View>
            </View>

            {item.prescriptionImage && (
                <View style={styles.prescriptionContainer}>
                    <Text style={styles.prescriptionLabel}>Diet/Prescription Image:</Text>
                    <Image source={{ uri: item.prescriptionImage }} style={styles.prescriptionImage} />
                </View>
            )}

            {item.status === 'pending' ? (
                <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(item._id)}>
                    <Text style={styles.acceptBtnText}>Accept Request</Text>
                </TouchableOpacity>
            ) : (
                <View style={styles.acceptedContainer}>
                    <Ionicons name="checkmark-circle" size={24} color="#30C65A" />
                    <View>
                        <Text style={styles.acceptedTitle}>Accepted by You</Text>
                        {item.userId?.phoneNumber && (
                            <Text style={styles.acceptedContact}>
                                Student Contact: {item.userId.phoneNumber}
                            </Text>
                        )}
                    </View>
                </View>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Student Meal Requests</Text>
                <Text style={styles.headerSubtitle}>Personalized meal needs in your area</Text>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#30C65A" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={requests}
                    renderItem={renderRequestCard}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="documents-outline" size={80} color="#F0F0F0" />
                            <Text style={styles.emptyText}>No requests in your city right now.</Text>
                        </View>
                    }
                />
            )}

            <BottomNavBar role="seller" />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAFAFB' },
    header: { padding: 25, backgroundColor: '#FFF', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 2 },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1A1C1E' },
    headerSubtitle: { fontSize: 13, color: '#7F8C8D', marginTop: 5 },
    listContent: { padding: 20, paddingBottom: 100 },
    card: { backgroundColor: '#FFF', borderRadius: 25, padding: 20, marginBottom: 20, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
    studentInfo: { flex: 1 },
    studentName: { fontSize: 16, fontWeight: 'bold', color: '#1A1C1E' },
    locationContainer: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    locationText: { fontSize: 12, color: '#7F8C8D' },
    badge: { backgroundColor: '#E8F9EE', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    badgeText: { fontSize: 10, color: '#30C65A', fontWeight: 'bold' },
    mealInfo: { marginBottom: 15 },
    mealName: { fontSize: 18, fontWeight: 'bold', color: '#1A1C1E' },
    description: { fontSize: 14, color: '#7F8C8D', marginTop: 5, fontStyle: 'italic' },
    detailsRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F8F9FA', padding: 15, borderRadius: 15, marginBottom: 15 },
    detailBox: { alignItems: 'center' },
    detailLabel: { fontSize: 10, color: '#A0A0A0', textTransform: 'uppercase' },
    detailValue: { fontSize: 14, fontWeight: 'bold', color: '#1A1C1E', marginTop: 2 },
    prescriptionContainer: { marginBottom: 15 },
    prescriptionLabel: { fontSize: 12, color: '#7F8C8D', marginBottom: 8 },
    prescriptionImage: { width: '100%', height: 180, borderRadius: 15 },
    acceptBtn: { backgroundColor: '#30C65A', padding: 16, borderRadius: 15, alignItems: 'center' },
    acceptBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
    acceptedContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F9EE', padding: 15, borderRadius: 15, gap: 10 },
    acceptedTitle: { color: '#30C65A', fontWeight: 'bold', fontSize: 15 },
    acceptedContact: { color: '#27AE60', fontSize: 14, marginTop: 4, fontWeight: '500' },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { marginTop: 20, fontSize: 16, color: '#A0A0A0' }
});

export default SellerRequests;
