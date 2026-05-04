import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Image, ActivityIndicator, RefreshControl, Platform, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import BottomNavBar from '../components/BottomNavBar';

import * as ImagePicker from 'expo-image-picker';

const StudentOrders = () => {
    const router = useRouter();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelling, setCancelling] = useState(false);

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

    const handleUploadSlip = async (order: any) => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
            alert("Permission to access camera roll is required!");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.5,
        });

        if (!result.canceled) {
            setUploading(true);
            try {
                const token = Platform.OS === 'web' ? localStorage.getItem('userToken') : await SecureStore.getItemAsync('userToken');
                const studentId = Platform.OS === 'web' ? localStorage.getItem('userId') : await SecureStore.getItemAsync('userId');

                const formData = new FormData();
                formData.append('orderId', order._id);
                formData.append('studentId', studentId as string);
                formData.append('sellerId', order.sellerId._id);
                formData.append('amount', order.totalPayment.toString());

                // Handle file object based on platform
                const uri = result.assets[0].uri;
                const fileName = uri.split('/').pop();
                const fileType = fileName?.split('.').pop();

                formData.append('bankSlip', {
                    uri,
                    name: fileName,
                    type: `image/${fileType}`,
                } as any);

                await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/finance/upload-slip`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${token}`
                    }
                });

                alert("Success: Bank slip uploaded for verification!");
                fetchOrders();
            } catch (err) {
                console.error("Upload error:", err);
                alert("Failed to upload slip. Please try again.");
            } finally {
                setUploading(false);
            }
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchOrders();
    };

    const handleCancelOrder = async () => {
        if (!selectedOrderId) return;
        setCancelling(true);
        try {
            const token = Platform.OS === 'web'
                ? localStorage.getItem('userToken')
                : await SecureStore.getItemAsync('userToken');

            await axios.put(
                `${process.env.EXPO_PUBLIC_API_URL}/api/v1/orders/${selectedOrderId}/cancel`,
                { cancelReason: cancelReason.trim() || 'Cancelled by customer' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setShowCancelModal(false);
            setSelectedOrderId(null);
            setCancelReason('');
            fetchOrders();
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to cancel order. Please try again.';
            if (Platform.OS === 'web') {
                alert(msg);
            } else {
                const { Alert } = require('react-native');
                Alert.alert('Error', msg);
            }
        } finally {
            setCancelling(false);
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
            <View style={styles.orderHeader}>
                <View>
                    <Text style={styles.orderDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                    <Text style={styles.paymentMethodText}>
                        Method: {item.paymentMethod === 'bank_transfer' ? '🏦 Bank Transfer' : '💵 Cash on Delivery'}
                    </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.orderStatus) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.orderStatus) }]}>
                        {item.orderStatus.toUpperCase()}
                    </Text>
                </View>
            </View>

            {item.items.map((mealItem: any, idx: number) => (
                <View key={idx} style={styles.mealInfo}>
                    <Image source={{ uri: mealItem.mealId?.image || 'https://img.freepik.com/free-photo/fresh-delicious-meal-plate-with-vegetables_23-2148189874.jpg' }} style={styles.mealImage} />
                    <View style={styles.mealDetails}>
                        <Text style={styles.mealName}>{mealItem.mealId?.mealName || 'Deleted Meal'}</Text>
                        <Text style={styles.mealQty}>Quantity: {mealItem.quantity}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.mealPrice}>RS.{(item.totalPayment || 0).toFixed(2)}</Text>
                        {item.orderStatus === 'confirmed' && mealItem.mealId && (
                            <TouchableOpacity 
                                style={styles.reviewMiniBtn}
                                onPress={() => router.push({
                                    pathname: '/PostReviewScreen',
                                    params: { 
                                        mealId: mealItem.mealId._id,
                                        sellerId: item.sellerId?._id,
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
                <View style={styles.footerRow}>
                    <View style={styles.sellerRow}>
                        <Ionicons name="restaurant-outline" size={16} color="#7F8C8D" />
                        <Text style={styles.sellerName}>{item.sellerId?.businessName || 'Unknown Seller'}</Text>
                    </View>

                    {/* BANK SLIP UPLOAD BUTTON */}
                    {item.paymentMethod === 'bank_transfer' && item.paymentStatus === 'pending' && (
                        <TouchableOpacity
                            style={styles.uploadBtn}
                            onPress={() => handleUploadSlip(item)}
                            disabled={uploading}
                        >
                            <Ionicons name="cloud-upload" size={16} color="#FFF" />
                            <Text style={styles.uploadBtnText}>Upload Slip</Text>
                        </TouchableOpacity>
                    )}

                    {item.paymentMethod === 'bank_transfer' && item.paymentStatus === 'paid' && (
                        <View style={styles.paidBadge}>
                            <Ionicons name="checkmark-circle" size={14} color="#30C65A" />
                            <Text style={styles.paidBadgeText}>Payment Verified</Text>
                        </View>
                    )}
                </View>
                {item.orderStatus === 'ready' && item.sellerId?.phoneNumber && (
                    <View style={styles.contactRow}>
                        <Ionicons name="call-outline" size={16} color="#9B59B6" />
                        <Text style={styles.contactText}>{item.sellerId.phoneNumber}</Text>
                    </View>
                )}

                {item.orderStatus === 'cancelled' && item.cancelReason && (
                    <Text style={styles.cancelReason}>Reason: {item.cancelReason}</Text>
                )}
            </View>

            {/* Cancel Order button — only when pending */}
            {item.orderStatus === 'pending' && (
                <TouchableOpacity
                    style={styles.cancelOrderBtn}
                    onPress={() => {
                        setSelectedOrderId(item._id);
                        setShowCancelModal(true);
                    }}
                >
                    <Ionicons name="close-circle-outline" size={16} color="#E74C3C" />
                    <Text style={styles.cancelOrderBtnText}>Cancel Order</Text>
                </TouchableOpacity>
            )}
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
            
            {/* Cancel Order Modal */}
            <Modal
                visible={showCancelModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowCancelModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.cancelModal}>
                        <View style={styles.cancelModalHandle} />
                        <Text style={styles.cancelModalTitle}>Cancel Order</Text>
                        <Text style={styles.cancelModalSubtitle}>
                            Please tell us why you're cancelling (optional):
                        </Text>
                        <TextInput
                            style={styles.cancelReasonInput}
                            placeholder="e.g. Changed my mind, ordered by mistake..."
                            placeholderTextColor="#B0B0B0"
                            value={cancelReason}
                            onChangeText={setCancelReason}
                            multiline
                            numberOfLines={3}
                        />
                        <View style={styles.cancelModalBtns}>
                            <TouchableOpacity
                                style={styles.cancelModalDismiss}
                                onPress={() => { setShowCancelModal(false); setCancelReason(''); }}
                            >
                                <Text style={styles.cancelModalDismissText}>Go Back</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.cancelModalConfirm}
                                onPress={handleCancelOrder}
                                disabled={cancelling}
                            >
                                {cancelling
                                    ? <ActivityIndicator color="#FFF" size="small" />
                                    : <Text style={styles.cancelModalConfirmText}>Confirm Cancel</Text>
                                }
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

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
    contactRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
    contactText: { marginLeft: 5, fontSize: 14, color: '#9B59B6', fontWeight: 'bold' },
    uploadBtn: {
        backgroundColor: '#30C65A',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        gap: 5
    },
    uploadBtnText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
    paidBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F9EE',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        gap: 4
    },
    paidBadgeText: { color: '#30C65A', fontSize: 11, fontWeight: 'bold' },
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
    },
    paymentMethodText: {
        fontSize: 12,
        color: '#7F8C8D',
        marginTop: 2
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cancelOrderBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-end',
        marginTop: 10,
        backgroundColor: '#FFF0EF',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E74C3C',
        gap: 6,
    },
    cancelOrderBtnText: {
        color: '#E74C3C',
        fontSize: 12,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    cancelModal: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: 25,
        paddingTop: 15,
    },
    cancelModalHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#E0E0E0',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 18,
    },
    cancelModalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1A1C1E',
        marginBottom: 6,
    },
    cancelModalSubtitle: {
        fontSize: 14,
        color: '#7F8C8D',
        marginBottom: 16,
    },
    cancelReasonInput: {
        backgroundColor: '#F9F9F9',
        borderWidth: 1,
        borderColor: '#EEE',
        borderRadius: 14,
        padding: 14,
        fontSize: 14,
        textAlignVertical: 'top',
        marginBottom: 20,
        color: '#1A1C1E',
    },
    cancelModalBtns: {
        flexDirection: 'row',
        gap: 12,
        paddingBottom: 10,
    },
    cancelModalDismiss: {
        flex: 1,
        padding: 15,
        backgroundColor: '#F5F5F5',
        borderRadius: 14,
        alignItems: 'center',
    },
    cancelModalDismissText: {
        fontWeight: 'bold',
        color: '#7F8C8D',
        fontSize: 14,
    },
    cancelModalConfirm: {
        flex: 1,
        padding: 15,
        backgroundColor: '#E74C3C',
        borderRadius: 14,
        alignItems: 'center',
    },
    cancelModalConfirmText: {
        fontWeight: 'bold',
        color: '#FFF',
        fontSize: 14,
    },
});

export default StudentOrders;
