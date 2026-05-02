import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, ActivityIndicator, RefreshControl, Platform, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import BottomNavBar from '../components/BottomNavBar';
import { useRouter } from 'expo-router';

const SellerAlerts = () => {
    const router = useRouter();
    const [alerts, setAlerts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchAlerts = async () => {
        try {
            const token = Platform.OS === 'web' ? localStorage.getItem('userToken') : await SecureStore.getItemAsync('userToken');
            const res = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/alerts`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setAlerts(res.data.alerts);
            }
        } catch (err) {
            console.error("Error fetching seller alerts:", err); //Test Comment
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAlerts();
    }, []);

    const markAsRead = async (id: string, relatedId?: string) => {
        try {
            const token = Platform.OS === 'web' ? localStorage.getItem('userToken') : await SecureStore.getItemAsync('userToken');
            await axios.put(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/alerts/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAlerts(alerts.map(a => a._id === id ? { ...a, isRead: true } : a));

            if (relatedId) {
                router.push('/SellerOrders' as any);
            }
        } catch (err) {
            console.error("Error marking alert as read:", err);
        }
    };

    const deleteAlert = async (id: string) => {
        try {
            const token = Platform.OS === 'web' ? localStorage.getItem('userToken') : await SecureStore.getItemAsync('userToken');
            await axios.delete(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/alerts/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAlerts(alerts.filter(a => a._id !== id));
        } catch (err) {
            console.error("Error deleting alert:", err);
        }
    };

    const markAllRead = async () => {
        try {
            const token = Platform.OS === 'web' ? localStorage.getItem('userToken') : await SecureStore.getItemAsync('userToken');
            await axios.put(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/alerts/mark-all-read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAlerts(alerts.map(a => ({ ...a, isRead: true })));
        } catch (err) {
            console.error("Error marking all read:", err);
        }
    };

    const renderAlertItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[styles.alertCard, !item.isRead && styles.unreadCard]}
            onPress={() => markAsRead(item._id, item.relatedId)}
        >
            <View style={[styles.iconWrapper, { backgroundColor: item.title.includes('New Order') ? '#E8F9EE' : '#F5F6FA' }]}>
                <Ionicons
                    name={item.title.includes('New Order') ? "cart" : "notifications"}
                    size={24}
                    color={item.title.includes('New Order') ? "#30C65A" : "#7F8C8D"}
                />
            </View>
            <View style={styles.alertContent}>
                <View style={styles.alertHeader}>
                    <Text style={styles.alertTitle}>{item.title}</Text>
                    <Text style={styles.alertTime}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
                <Text style={styles.alertMessage} numberOfLines={2}>{item.message}</Text>
            </View>
            <View style={styles.rightActions}>
                {!item.isRead && <View style={styles.unreadDot} />}
                <TouchableOpacity onPress={() => deleteAlert(item._id)} style={styles.deleteButton}>
                    <Ionicons name="trash-outline" size={20} color="#E74C3C" />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <Text style={styles.title}>Seller Notifications</Text>
                    {alerts.length > 0 && (
                        <TouchableOpacity onPress={markAllRead}>
                            <Text style={styles.markAllReadText}>Mark all as read</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#30C65A" />
                </View>
            ) : (
                <FlatList
                    data={alerts}
                    keyExtractor={(item) => item._id}
                    renderItem={renderAlertItem}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchAlerts} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="notifications-off-outline" size={80} color="#F0F0F0" />
                            <Text style={styles.emptyTitle}>No notifications</Text>
                            <Text style={styles.emptySubtitle}>You'll see alerts for new orders and system updates here.</Text>
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
    header: { padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1A1C1E' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 15 },
    alertCard: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 15,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.02,
        shadowRadius: 10,
        elevation: 1,
    },
    unreadCard: { borderLeftWidth: 4, borderLeftColor: '#30C65A' },
    iconWrapper: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    alertContent: { flex: 1 },
    alertHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
    alertTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A1C1E' },
    alertTime: { fontSize: 11, color: '#A0A0A0' },
    alertMessage: { fontSize: 13, color: '#7F8C8D', lineHeight: 18 },
    unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#30C65A', marginLeft: 10 },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1C1E', marginTop: 20 },
    emptySubtitle: { fontSize: 14, color: '#A0A0A0', marginTop: 10, textAlign: 'center' },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    markAllReadText: { color: '#30C65A', fontWeight: '600', fontSize: 14 },
    rightActions: { alignItems: 'center', justifyContent: 'center', gap: 10 },
    deleteButton: { padding: 5 }
});

export default SellerAlerts;
