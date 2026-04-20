import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Image, ActivityIndicator, RefreshControl, Modal, TextInput, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import BottomNavBar from '../components/BottomNavBar';

const SellerOrders = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [cancelReason, setCancelReason] = useState('');

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
            console.error("Error fetching seller orders:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleStatusUpdate = async (orderId: string, status: string, reason: string = '') => {
        try {
            const token = Platform.OS === 'web' ? localStorage.getItem('userToken') : await SecureStore.getItemAsync('userToken');
            const res = await axios.put(
                `${process.env.EXPO_PUBLIC_API_URL}/api/v1/orders/${orderId}/status`,
                { status, cancelReason: reason },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data.success) {
                Alert.alert("Success", `Order ${status} successfully`);
                fetchOrders();
                setShowCancelModal(false);
                setCancelReason('');
            }
        } catch (err: any) {
            Alert.alert("Error", err.response?.data?.message || "Failed to update status");
        }
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
            <View style={styles.cardHeader}>
                <View style={styles.studentInfo}>
                    <Image source={{ uri: item.userId?.profileImage || `https://ui-avatars.com/api/?name=${item.userId?.firstName || 'U'}&background=30C65A&color=fff` }} style={styles.studentImage} />
                    <View>
                        <Text style={styles.studentName}>{item.userId?.firstName || 'Unknown'} {item.userId?.lastName || 'User'}</Text>
                        <Text style={styles.orderTime}>{new Date(item.createdAt).toLocaleTimeString()} · {new Date(item.createdAt).toLocaleDateString()}</Text>
                    </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.orderStatus) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.orderStatus) }]}>
                        {item.orderStatus.toUpperCase()}
                    </Text>
                </View>
            </View>

            <View style={styles.divider} />

            {item.items.map((mealItem: any, idx: number) => (
                <View key={idx} style={styles.mealRow}>
                    <Text style={styles.mealName}>{mealItem.mealId?.mealName || 'Deleted Meal'} x {mealItem.quantity}</Text>
                    <Text style={styles.mealPrice}>RS.{((mealItem.mealId?.price || 0) * mealItem.quantity).toFixed(2)}</Text>
                </View>
            ))}

            <View style={styles.orderDetails}>
                <View style={styles.detailItem}>
                    <Ionicons name="location-outline" size={14} color="#7F8C8D" />
                    <Text style={styles.detailText}>{item.deliveryAddress}</Text>
                </View>
                <View style={styles.detailItem}>
                    <Ionicons name="call-outline" size={14} color="#7F8C8D" />
                    <Text style={styles.detailText}>{item.contactNumber}</Text>
                </View>
                {item.specialInstructions && (
                    <View style={styles.detailItem}>
                        <Ionicons name="chatbox-ellipses-outline" size={14} color="#FF6F00" />
                        <Text style={[styles.detailText, { color: '#FF6F00' }]}>{item.specialInstructions}</Text>
                    </View>
                )}
            </View>

            <View style={styles.actionRow}>
                {item.orderStatus === 'pending' && (
                    <>
                        <TouchableOpacity 
                            style={[styles.actionBtn, styles.declineBtn]}
                            onPress={() => {
                                setSelectedOrder(item);
                                setShowCancelModal(true);
                            }}
                        >
                            <Text style={styles.declineBtnText}>Decline</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.actionBtn, styles.acceptBtn]}
                            onPress={() => handleStatusUpdate(item._id, 'confirmed')}
                        >
                            <Text style={styles.acceptBtnText}>Accept Order</Text>
                        </TouchableOpacity>
                    </>
                )}
                {item.orderStatus === 'confirmed' && (
                    <TouchableOpacity 
                        style={[styles.actionBtn, styles.prepareBtn]}
                        onPress={() => handleStatusUpdate(item._id, 'preparing')}
                    >
                        <Text style={styles.prepareBtnText}>Start Preparing</Text>
                    </TouchableOpacity>
                )}
                {item.orderStatus === 'cancelled' && item.cancelReason && (
                    <Text style={styles.cancelMsg}>Cancelled: {item.cancelReason}</Text>
                )}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Customer Orders</Text>
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
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchOrders} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="clipboard-outline" size={80} color="#F0F0F0" />
                            <Text style={styles.emptyTitle}>No orders received</Text>
                            <Text style={styles.emptySubtitle}>When customers order your meals, they'll appear here.</Text>
                        </View>
                    }
                />
            )}

            {/* Declin Modal */}
            <Modal visible={showCancelModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Decline Order</Text>
                        <Text style={styles.modalLabel}>Please provide a reason for cancelling:</Text>
                        <TextInput 
                            style={styles.modalInput}
                            placeholder="e.g. Out of ingredients, too busy..."
                            value={cancelReason}
                            onChangeText={setCancelReason}
                            multiline
                        />
                        <View style={styles.modalBtns}>
                            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowCancelModal(false)}>
                                <Text style={styles.modalCancelText}>Back</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={styles.modalConfirm} 
                                onPress={() => handleStatusUpdate(selectedOrder._id, 'cancelled', cancelReason)}
                            >
                                <Text style={styles.modalConfirmText}>Confirm Decline</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <BottomNavBar role="seller" />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: { padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1A1C1E' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 15 },
    orderCard: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 1,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    studentInfo: { flexDirection: 'row', alignItems: 'center' },
    studentImage: { width: 45, height: 45, borderRadius: 22.5, marginRight: 12 },
    studentName: { fontSize: 16, fontWeight: 'bold', color: '#1A1C1E' },
    orderTime: { fontSize: 11, color: '#A0A0A0', marginTop: 2 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
    statusText: { fontSize: 10, fontWeight: 'bold' },
    divider: { height: 1, backgroundColor: '#F5F6FA', marginVertical: 15 },
    mealRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    mealName: { fontSize: 15, color: '#1A1C1E' },
    mealPrice: { fontSize: 15, fontWeight: 'bold', color: '#1A1C1E' },
    orderDetails: { marginTop: 10, backgroundColor: '#F9FAFB', padding: 12, borderRadius: 15 },
    detailItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    detailText: { marginLeft: 8, fontSize: 13, color: '#7F8C8D', flex: 1 },
    actionRow: { flexDirection: 'row', marginTop: 15, justifyContent: 'space-between' },
    actionBtn: { flex: 1, height: 48, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
    declineBtn: { backgroundColor: '#FEEBEB', marginRight: 10 },
    declineBtnText: { color: '#E74C3C', fontWeight: 'bold' },
    acceptBtn: { backgroundColor: '#30C65A' },
    acceptBtnText: { color: '#FFF', fontWeight: 'bold' },
    prepareBtn: { backgroundColor: '#E8F9EE', width: '100%', borderColor: '#30C65A', borderWidth: 1 },
    prepareBtnText: { color: '#30C65A', fontWeight: 'bold' },
    cancelMsg: { fontSize: 13, color: '#E74C3C', fontStyle: 'italic', flex: 1, textAlign: 'center' },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1C1E', marginTop: 20 },
    emptySubtitle: { fontSize: 14, color: '#A0A0A0', marginTop: 10, textAlign: 'center', paddingHorizontal: 40 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '85%', backgroundColor: '#FFF', borderRadius: 25, padding: 25 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1A1C1E', marginBottom: 15 },
    modalLabel: { fontSize: 14, color: '#7F8C8D', marginBottom: 10 },
    modalInput: { backgroundColor: '#F5F6FA', borderRadius: 15, padding: 15, height: 100, textAlignVertical: 'top', fontSize: 15 },
    modalBtns: { flexDirection: 'row', marginTop: 20 },
    modalCancel: { flex: 0.3, justifyContent: 'center', alignItems: 'center' },
    modalCancelText: { color: '#7F8C8D', fontWeight: 'bold' },
    modalConfirm: { flex: 0.7, backgroundColor: '#E74C3C', height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
    modalConfirmText: { color: '#FFF', fontWeight: 'bold' }
});

export default SellerOrders;
