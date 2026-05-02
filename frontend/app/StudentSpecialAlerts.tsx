import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { useRouter, useLocalSearchParams } from 'expo-router';

const StudentSpecialAlerts = () => {
    const router = useRouter();
    const { city } = useLocalSearchParams();
    const [alerts, setAlerts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAlerts = async () => {
        try {
            const res = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/special-alerts/all?city=${city || ''}`);
            if (res.data.success) {
                setAlerts(res.data.alerts);
            }
        } catch (err) {
            console.error("Error fetching alerts:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAlerts();
    }, [city]);

    const handleOrder = (alert: any) => {
        router.push({
            pathname: '/OrderScreen' as any,
            params: { 
                id: alert.mealId._id, 
                quantity: 1,
                specialPrice: alert.specialPrice
            }
        });
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#30C65A" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#1A1C1E" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Special Meal Alerts</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {alerts.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="notifications-off-outline" size={80} color="#E0E0E0" />
                        <Text style={styles.emptyText}>No special alerts available right now.</Text>
                        <Text style={styles.emptySubText}>Check back later for delicious deals!</Text>
                    </View>
                ) : (
                    alerts.map(alert => {
                        const mealImage = alert.image || alert.mealId?.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60';
                        
                        return (
                            <View key={alert._id} style={styles.alertCard}>
                                {/* Meal Image */}
                                <Image source={{ uri: mealImage }} style={styles.mealImage} />
                                
                                {/* Offer Type Badge */}
                                <View style={styles.offerBadge}>
                                    <Text style={styles.offerBadgeText}>{alert.offerType}</Text>
                                </View>

                                <View style={styles.alertBody}>
                                    {/* Seller Info */}
                                    <View style={styles.sellerHeader}>
                                        <Image 
                                            source={{ uri: alert.sellerId?.profileImage || 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=60' }} 
                                            style={styles.sellerAvatar} 
                                        />
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.sellerName}>{alert.sellerId?.businessName || 'Home Cook'}</Text>
                                            <Text style={styles.cityName}>
                                                <Ionicons name="location" size={10} color="#7F8C8D" /> {alert.sellerId?.city}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Alert Info */}
                                    <Text style={styles.alertTitle}>{alert.title}</Text>
                                    <Text style={styles.alertDesc}>{alert.description}</Text>

                                    {/* Meal + Price + Order Button */}
                                    <View style={styles.bottomSection}>
                                        <View style={styles.priceSection}>
                                            <Text style={styles.mealName}>{alert.mealId?.mealName}</Text>
                                            <View style={styles.priceRow}>
                                                <Text style={styles.oldPrice}>RS.{alert.mealId?.price?.toFixed(2)}</Text>
                                                <Text style={styles.newPrice}>RS.{alert.specialPrice?.toFixed(2)}</Text>
                                            </View>
                                        </View>
                                        <TouchableOpacity style={styles.orderBtn} onPress={() => handleOrder(alert)}>
                                            <Text style={styles.orderBtnText}>Order Now</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        );
                    })
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: 20, 
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0'
    },
    backBtn: { padding: 5 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1A1C1E' },
    scrollContent: { padding: 20 },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { fontSize: 18, fontWeight: 'bold', color: '#1A1C1E', marginTop: 20, textAlign: 'center' },
    emptySubText: { fontSize: 14, color: '#7F8C8D', textAlign: 'center', marginTop: 10, paddingHorizontal: 40 },
    alertCard: { 
        backgroundColor: '#FFF', 
        borderRadius: 25, 
        marginBottom: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 15,
        elevation: 3
    },
    mealImage: {
        width: '100%',
        height: 180,
    },
    offerBadge: { 
        position: 'absolute', 
        top: 15, 
        left: 15, 
        backgroundColor: '#30C65A', 
        paddingHorizontal: 12, 
        paddingVertical: 5, 
        borderRadius: 20,
    },
    offerBadgeText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
    alertBody: { padding: 20 },
    sellerHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    sellerAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
    sellerName: { fontSize: 15, fontWeight: 'bold', color: '#1A1C1E' },
    cityName: { fontSize: 11, color: '#7F8C8D', marginTop: 2 },
    alertTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1C1E', marginBottom: 6 },
    alertDesc: { fontSize: 14, color: '#4A4A4A', marginBottom: 18, lineHeight: 20 },
    bottomSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F8F9FA',
        borderRadius: 15,
        padding: 15,
    },
    priceSection: { flex: 1, marginRight: 12 },
    mealName: { fontSize: 14, fontWeight: 'bold', color: '#1A1C1E', marginBottom: 4 },
    priceRow: { flexDirection: 'row', alignItems: 'center' },
    oldPrice: { fontSize: 12, color: '#A0A0A0', textDecorationLine: 'line-through', marginRight: 10 },
    newPrice: { fontSize: 18, fontWeight: 'bold', color: '#30C65A' },
    orderBtn: { 
        backgroundColor: '#30C65A', 
        paddingHorizontal: 20, 
        paddingVertical: 14, 
        borderRadius: 15,
    },
    orderBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
});

export default StudentSpecialAlerts;
