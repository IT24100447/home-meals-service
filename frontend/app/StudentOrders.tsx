import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Image, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import BottomNavBar from '../components/BottomNavBar';

const StudentOrders = () => {
    const router = useRouter();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchOrders = async () => {
        try {
            const token = Platform.OS === 'web' ? localStorage.getItem('userToken') : await SecureStore.getItemAsync('userToken');
            const res = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/orders/my-orders`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setOrders(res.data.orders);
            }
        } catch (err) {
            console.error("Error fetching orders:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchOrders();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return '#F39C12';
            case 'confirmed': return '#30C65A';
            case 'preparing': return '#2980B9';
            case 'cancelled': return '#E74C3C';
            default: return '#7F8C8D';
        }
    };

    const renderOrderItem = ({ item }: { item: any }) => (
        <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
                <Text style={styles.orderDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.orderStatus) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.orderStatus) }]}>
                        {item.orderStatus.toUpperCase()}
                    </Text>
                </View>
            </View>

            {item.items.map((mealItem: any, idx: number) => (
                <View key={idx} style={styles.mealInfo}>
                    <Image source={{ uri: mealItem.mealId.image }} style={styles.mealImage} />
                    <View style={styles.mealDetails}>
                        <Text style={styles.mealName}>{mealItem.mealId.mealName}</Text>
                        <Text style={styles.mealQty}>Quantity: {mealItem.quantity}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.mealPrice}>RS.{item.totalPayment.toFixed(2)}</Text>
                        {item.orderStatus === 'confirmed' && (
                            <TouchableOpacity 
                                style={styles.reviewMiniBtn}
                                onPress={() => router.push({
                                    pathname: '/PostReviewScreen',
                                    params: { 
                                        mealId: mealItem.mealId._id,
                                        sellerId: item.sellerId._id,
                                        orderId: item._id,
                                        mealName: mealItem.mealId.mealName
                                    }
                                } as any)}
                            >
                                <Text style={styles.reviewMiniBtnText}>Add Review</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            ))}

            <View style={styles.orderFooter}>
                <View style={styles.sellerRow}>
                    <Ionicons name="restaurant-outline" size={16} color="#7F8C8D" />
                    <Text style={styles.sellerName}>{item.sellerId.businessName}</Text>
                </View>
                {item.orderStatus === 'cancelled' && item.cancelReason && (
                    <Text style={styles.cancelReason}>Reason: {item.cancelReason}</Text>
                )}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>My Orders</Text>
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#30C65A" />
                </View>
            ) : (
                <FlatList
                    data={orders}
                    keyExtractor={(item) => item._id}
                    renderItem={renderOrderItem}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="fast-food-outline" size={80} color="#F0F0F0" />
                            <Text style={styles.emptyTitle}>No orders yet</Text>
                            <Text style={styles.emptySubtitle}>Hungry? Go place your first order!</Text>
                            <TouchableOpacity style={styles.shopBtn} onPress={() => router.replace('/StudentDashboard' as any)}>
                                <Text style={styles.shopBtnText}>Browse Meals</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}
            <BottomNavBar role="student" />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAFAFB' },
    header: { padding: 20, backgroundColor: '#FFF' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1A1C1E' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 20 },
    orderCard: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    orderDate: { fontSize: 13, color: '#A0A0A0' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
    statusText: { fontSize: 10, fontWeight: 'bold' },
    mealInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    mealImage: { width: 50, height: 50, borderRadius: 10 },
    mealDetails: { flex: 1, marginLeft: 12 },
    mealName: { fontSize: 15, fontWeight: 'bold', color: '#1A1C1E' },
    mealQty: { fontSize: 13, color: '#7F8C8D' },
    mealPrice: { fontSize: 16, fontWeight: '800', color: '#1A1C1E' },
    orderFooter: { borderTopWidth: 1, borderTopColor: '#F5F6FA', paddingTop: 10, marginTop: 5 },
    sellerRow: { flexDirection: 'row', alignItems: 'center' },
    sellerName: { marginLeft: 5, fontSize: 14, color: '#7F8C8D' },
    cancelReason: { marginTop: 5, fontSize: 12, color: '#E74C3C', fontStyle: 'italic' },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#1A1C1E', marginTop: 20 },
    emptySubtitle: { fontSize: 14, color: '#A0A0A0', marginTop: 10 },
    shopBtn: { marginTop: 30, backgroundColor: '#30C65A', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 15 },
    shopBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
    reviewMiniBtn: { 
        marginTop: 5, 
        backgroundColor: '#F5FFF7', 
        paddingHorizontal: 12, 
        paddingVertical: 6, 
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#30C65A'
    },
    reviewMiniBtnText: { 
        color: '#30C65A', 
        fontSize: 11, 
        fontWeight: 'bold' 
    }
});

export default StudentOrders;
