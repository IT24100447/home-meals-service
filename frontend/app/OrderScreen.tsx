import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';

const OrderScreen = () => {
    const router = useRouter();
    const { id, quantity } = useLocalSearchParams();
    const [meal, setMeal] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form states
    const [contactNumber, setContactNumber] = useState('');
    const [specialInstructions, setSpecialInstructions] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
    const [receiptImage, setReceiptImage] = useState<string>('');

    useEffect(() => {
        const fetchMeal = async () => {
            try {
                const res = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/meals/${id}`);
                if (res.data.success) {
                    setMeal(res.data.meal);
                }
            } catch (err) {
                console.error("Error fetching meal:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchMeal();
    }, [id]);

    const pickReceiptImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert("Permission Denied", "We need access to your gallery to upload receipt images.");
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
        });

        if (!result.canceled) {
            const uri = result.assets?.[0]?.uri;
            if (uri) setReceiptImage(uri);
        }
    };

    const handlePlaceOrder = async () => {
        if (!contactNumber) {
            Alert.alert("Error", "Please fill in contact number");
            return;
        }

        if (paymentMethod === 'card' && !receiptImage) {
            Alert.alert("Error", "Please upload your payment receipt for card payment.");
            return;
        }

        setSubmitting(true);
        try {
            const token = Platform.OS === 'web' ? localStorage.getItem('userToken') : await SecureStore.getItemAsync('userToken');
            const formData = new FormData();

            formData.append('sellerId', meal.sellerId._id || meal.sellerId);
            formData.append('items', JSON.stringify([{
                mealId: meal._id,
                quantity: Number(quantity)
            }]));
            formData.append('totalPayment', (meal.price * Number(quantity)).toString());
            formData.append('contactNumber', contactNumber);
            formData.append('paymentMethod', paymentMethod);
            formData.append('specialInstructions', specialInstructions || "");

            if (paymentMethod === 'card' && receiptImage) {
                const fileName = receiptImage.split('/').pop() || `receipt_${Date.now()}.jpg`;
                const match = /\.(\w+)$/.exec(fileName);
                const fileType = match ? `image/${match[1]}` : 'image/jpeg';
                formData.append('receiptImage', { uri: receiptImage, name: fileName, type: fileType } as any);
            }

            const res = await axios.post(
                `${process.env.EXPO_PUBLIC_API_URL}/api/v1/orders`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${token}`
                    },
                    timeout: 15000 // 15 seconds
                }
            );

            if (res.data.success) {
                Alert.alert("Success", "Order placed successfully! The seller has been notified.", [
                    { text: "OK", onPress: () => router.replace('/StudentOrders' as any) }
                ]);
            }
        } catch (err: any) {
            console.error("Error placing order:", err);
            Alert.alert("Error", err.response?.data?.message || "Failed to place order");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
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
                <Text style={styles.title}>Confirm Your Order</Text>
            </View>

            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {/* Meal Summary */}
                    <View style={styles.section}>
                        <View style={styles.mealCard}>
                            <Image source={{ uri: meal.image }} style={styles.mealImage} />
                            <View style={styles.mealInfo}>
                                <Text style={styles.mealName}>{meal.mealName}</Text>
                                <Text style={styles.sellerName}>by {meal.sellerId.businessName}</Text>
                                <View style={styles.priceRow}>
                                    <Text style={styles.qtyLabel}>{quantity} x RS.{meal.price.toFixed(2)}</Text>
                                    <Text style={styles.totalLabel}>RS.{(meal.price * Number(quantity)).toFixed(2)}</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Contact Info */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Contact</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="call-outline" size={20} color="#7F8C8D" style={styles.inputIcon} />
                            <TextInput 
                                style={styles.input}
                                placeholder="Contact Number"
                                value={contactNumber}
                                onChangeText={setContactNumber}
                                keyboardType="phone-pad"
                            />
                        </View>
                    </View>

                    {/* Special Instructions */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Special Instructions (Optional)</Text>
                        <TextInput 
                            style={styles.textArea}
                            placeholder="Add any instructions for the cook..."
                            value={specialInstructions}
                            onChangeText={setSpecialInstructions}
                            multiline
                            numberOfLines={4}
                        />
                    </View>

                    {/* Payment Method */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Payment Method</Text>
                        <View style={styles.paymentOptions}>
                            <TouchableOpacity 
                                style={[styles.paymentOption, paymentMethod === 'cash' && styles.activePayment]} 
                                onPress={() => setPaymentMethod('cash')}
                            >
                                <Ionicons name="cash-outline" size={24} color={paymentMethod === 'cash' ? '#30C65A' : '#7F8C8D'} />
                                <Text style={[styles.paymentText, paymentMethod === 'cash' && styles.activePaymentText]}>Cash on Delivery</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.paymentOption, paymentMethod === 'card' && styles.activePayment]} 
                                onPress={() => setPaymentMethod('card')}
                            >
                                <Ionicons name="card-outline" size={24} color={paymentMethod === 'card' ? '#30C65A' : '#7F8C8D'} />
                                <Text style={[styles.paymentText, paymentMethod === 'card' && styles.activePaymentText]}>Card Payment</Text>
                            </TouchableOpacity>
                        </View>
                        {paymentMethod === 'card' && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Upload Transfer Receipt</Text>
                                <TouchableOpacity style={styles.uploadContainer} onPress={pickReceiptImage}>
                                    <Ionicons name="cloud-upload-outline" size={28} color="#30C65A" />
                                    <Text style={styles.uploadText}>{receiptImage ? 'Receipt selected' : 'Upload payment receipt'}</Text>
                                </TouchableOpacity>
                                {receiptImage ? (
                                    <Image source={{ uri: receiptImage }} style={styles.receiptPreview} />
                                ) : null}
                            </View>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <View style={styles.footer}>
                <View style={styles.totalContainer}>
                    <Text style={styles.totalText}>Total Payment</Text>
                    <Text style={styles.totalAmount}>RS.{(meal.price * Number(quantity)).toFixed(2)}</Text>
                </View>
                <TouchableOpacity 
                    style={[styles.confirmBtn, submitting && styles.disabledBtn]} 
                    onPress={handlePlaceOrder}
                    disabled={submitting}
                >
                    {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.confirmBtnText}>Place Order</Text>}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    backBtn: { marginRight: 15 },
    title: { fontSize: 20, fontWeight: 'bold', color: '#1A1C1E' },
    scrollContent: { padding: 20 },
    section: { marginBottom: 25 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A1C1E', marginBottom: 15 },
    mealCard: {
        flexDirection: 'row',
        backgroundColor: '#F9FAFB',
        borderRadius: 20,
        padding: 12,
        alignItems: 'center',
    },
    mealImage: { width: 80, height: 80, borderRadius: 15 },
    mealInfo: { flex: 1, marginLeft: 15 },
    mealName: { fontSize: 16, fontWeight: 'bold', color: '#1A1C1E' },
    sellerName: { fontSize: 14, color: '#7F8C8D', marginBottom: 8 },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    qtyLabel: { fontSize: 14, color: '#7F8C8D' },
    totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#30C65A' },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F6FA',
        borderRadius: 15,
        paddingHorizontal: 15,
        marginBottom: 12,
        height: 55,
    },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, fontSize: 16, color: '#1A1C1E' },
    textArea: {
        backgroundColor: '#F5F6FA',
        borderRadius: 15,
        padding: 15,
        fontSize: 16,
        color: '#1A1C1E',
        height: 100,
        textAlignVertical: 'top',
    },
    uploadContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F6FA',
        borderRadius: 15,
        padding: 15,
        marginTop: 12,
    },
    uploadText: {
        marginLeft: 12,
        color: '#30C65A',
        fontSize: 15,
        fontWeight: 'bold',
    },
    receiptPreview: {
        width: '100%',
        height: 180,
        borderRadius: 15,
        marginTop: 12,
    },
    paymentOptions: { flexDirection: 'row', justifyContent: 'space-between' },
    paymentOption: {
        flex: 0.48,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        backgroundColor: '#FFF',
    },
    activePayment: { borderColor: '#30C65A', backgroundColor: '#E8F9EE' },
    paymentText: { marginTop: 8, fontSize: 12, color: '#7F8C8D', textAlign: 'center' },
    activePaymentText: { color: '#30C65A', fontWeight: 'bold' },
    footer: {
        padding: 20,
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        flexDirection: 'row',
        alignItems: 'center',
    },
    totalContainer: { flex: 1 },
    totalText: { fontSize: 12, color: '#A0A0A0' },
    totalAmount: { fontSize: 20, fontWeight: 'bold', color: '#1A1C1E' },
    confirmBtn: {
        backgroundColor: '#30C65A',
        paddingHorizontal: 30,
        height: 55,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    disabledBtn: { backgroundColor: '#A0A0A0' },
    confirmBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});

export default OrderScreen;
