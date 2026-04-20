import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, Modal, TextInput, Alert, ActivityIndicator, Platform, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import BottomNavBar from '../components/BottomNavBar';

const StudentRequests = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [requests, setRequests] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);
    
    // Form States
    const [mealName, setMealName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Breakfast');
    const [mealType, setMealType] = useState('veg');
    const [budget, setBudget] = useState('');
    const [quantity, setQuantity] = useState('');
    const [date, setDate] = useState('');
    const [location, setLocation] = useState('');
    const [city, setCity] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const [sellers, setSellers] = useState<any[]>([]);
    const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);

    const fetchSellers = async (searchCity: string) => {
        try {
            if (!searchCity) return;
            const res = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/users/sellers?city=${searchCity}`);
            if (res.data.success) {
                setSellers(res.data.sellers);
            }
        } catch (err) {
            console.error("Error fetching sellers:", err);
        }
    };

    useEffect(() => {
        if (city.length > 2) {
            fetchSellers(city);
        }
    }, [city]);

    const fetchMyRequests = async () => {
        try {
            const token = Platform.OS === 'web' ? localStorage.getItem('userToken') : await SecureStore.getItemAsync('userToken');
            const res = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/meal-requests/my-requests`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setRequests(res.data.requests);
            }
        } catch (err) {
            console.error("Error fetching requests:", err);
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        fetchMyRequests();
    }, []);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert("Permission Denied", "We need access to your gallery.");
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const handleSubmit = async () => {
        if (!mealName || !budget || !quantity || !city) {
            Alert.alert("Error", "Please fill essential fields (Meal Name, Budget, Quantity, City)");
            return;
        }

        setLoading(true);
        try {
            const token = Platform.OS === 'web' ? localStorage.getItem('userToken') : await SecureStore.getItemAsync('userToken');
            const formData = new FormData();
            formData.append('requestedMealName', mealName);
            formData.append('description', description);
            formData.append('preferredCategory', category.toLowerCase());
            formData.append('preferredMealType', mealType);
            formData.append('budgetRange', budget);
            formData.append('quantityNeeded', quantity);
            formData.append('city', city);
            formData.append('deliveryLocation', location);
            if (date) {
                formData.append('neededDate', date);
            }
            if (selectedSellerId) {
                formData.append('matchedSellerId', selectedSellerId);
            }
            
            if (image) {
                if (Platform.OS === 'web') {
                    const response = await fetch(image);
                    const blob = await response.blob();
                    formData.append('prescriptionImage', blob, `request_${Date.now()}.jpg`);
                } else {
                    const filename = image.split('/').pop();
                    const match = /\.(\w+)$/.exec(filename || '');
                    const type = match ? `image/${match[1]}` : `image`;
                    formData.append('prescriptionImage', { uri: image, name: filename, type } as any);
                }
            }

            const res = await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/meal-requests`, formData, {
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}` 
                }
            });

            if (res.data.success) {
                Alert.alert("Success", "Meal request posted!");
                setShowModal(false);
                fetchMyRequests();
                // Reset form
                setMealName(''); setDescription(''); setBudget(''); setQuantity(''); setDate(''); setCity(''); setImage(null);
            }
        } catch (err: any) {
            Alert.alert("Error", err.response?.data?.message || "Failed to post request");
        } finally {
            setLoading(false);
        }
    };

    const renderRequestCard = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.cardTitle}>{item.requestedMealName}</Text>
                    <Text style={styles.cardSubtitle}>{item.preferredCategory} • {item.preferredMealType}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: item.status === 'pending' ? '#FFF9E6' : item.status === 'fulfilled' ? '#F0F0F0' : '#E8F9EE' }]}>
                    <Text style={[styles.statusText, { color: item.status === 'pending' ? '#F39C12' : item.status === 'fulfilled' ? '#7F8C8D' : '#30C65A' }]}>
                        {item.status.toUpperCase()}
                    </Text>
                </View>
            </View>

            <View style={styles.cardDetails}>
                <View style={styles.detailItem}>
                    <Ionicons name="cash-outline" size={16} color="#7F8C8D" />
                    <Text style={styles.detailText}>LKR {item.budgetRange} (for {item.quantityNeeded})</Text>
                </View>
                <View style={styles.detailItem}>
                    <Ionicons name="location-outline" size={16} color="#7F8C8D" />
                    <Text style={styles.detailText}>{item.city}</Text>
                </View>
                {item.neededDate && (
                    <View style={styles.detailItem}>
                        <Ionicons name="calendar-outline" size={16} color="#7F8C8D" />
                        <Text style={styles.detailText}>{new Date(item.neededDate).toLocaleDateString()}</Text>
                    </View>
                )}
            </View>

            {(item.status === 'accepted' || item.status === 'fulfilled') && item.matchedSellerId && (
                <View style={[styles.sellerInfo, item.status === 'fulfilled' && { backgroundColor: '#F8F9FA' }]}>
                    <Ionicons 
                        name={item.status === 'fulfilled' ? "checkbox" : "checkmark-circle"} 
                        size={24} 
                        color={item.status === 'fulfilled' ? "#7F8C8D" : "#30C65A"} 
                    />
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.sellerText, item.status === 'fulfilled' && { color: '#7F8C8D' }]}>
                            {item.status === 'fulfilled' ? 'Delivered by:' : 'Accepted by:'} <Text style={{ fontWeight: 'bold' }}>{item.matchedSellerId.businessName || item.matchedSellerId.firstName}</Text>
                        </Text>
                        {item.matchedSellerId.phoneNumber && (
                            <Text style={[styles.sellerText, { marginTop: 4, fontWeight: 'bold' }, item.status === 'fulfilled' && { color: '#7F8C8D' }]}>
                                Seller Contact: {item.matchedSellerId.phoneNumber}
                            </Text>
                        )}
                    </View>
                </View>
            )}

            {item.prescriptionImage && (
                <Image source={{ uri: item.prescriptionImage }} style={styles.requestImage} />
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Meal Requests</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
                    <Ionicons name="add" size={24} color="#FFF" />
                </TouchableOpacity>
            </View>

            {fetching ? (
                <ActivityIndicator size="large" color="#30C65A" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={requests}
                    renderItem={renderRequestCard}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="fast-food-outline" size={80} color="#F0F0F0" />
                            <Text style={styles.emptyText}>No special requests yet.</Text>
                            <TouchableOpacity style={styles.emptyAddBtn} onPress={() => setShowModal(true)}>
                                <Text style={styles.emptyAddBtnText}>Request a Specific Meal</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}

            <Modal visible={showModal} animationType="slide">
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setShowModal(false)}>
                            <Ionicons name="close" size={28} color="#1A1C1E" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>New Meal Request</Text>
                        <View style={{ width: 28 }} />
                    </View>

                    <ScrollView contentContainerStyle={styles.modalScroll}>
                        <Text style={styles.label}>What meal do you need?</Text>
                        <TextInput style={styles.input} value={mealName} onChangeText={setMealName} placeholder="e.g. Low spice vegetable soup" />

                        <Text style={styles.label}>Details (Optional)</Text>
                        <TextInput style={[styles.input, { height: 80 }]} value={description} onChangeText={setDescription} placeholder="Describe any special diet or needs..." multiline />

                        <View style={styles.row}>
                            <View style={styles.flex1}>
                                <Text style={styles.label}>Budget (LKR)</Text>
                                <TextInput style={styles.input} value={budget} onChangeText={setBudget} keyboardType="numeric" placeholder="500" />
                            </View>
                            <View style={styles.flex1}>
                                <Text style={styles.label}>Quantity</Text>
                                <TextInput style={styles.input} value={quantity} onChangeText={setQuantity} keyboardType="numeric" placeholder="1" />
                            </View>
                        </View>

                        <Text style={styles.label}>Date Needed (e.g. 2024-05-20)</Text>
                        <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />

                        <Text style={styles.label}>City (e.g. Colombo)</Text>
                        <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="Which city are you in?" />

                        <Text style={styles.label}>Category</Text>
                        <View style={styles.chipRow}>
                            {['Breakfast', 'Lunch', 'Dinner'].map(c => (
                                <TouchableOpacity key={c} style={[styles.chip, category === c && styles.activeChip]} onPress={() => setCategory(c)}>
                                    <Text style={[styles.chipText, category === c && styles.activeChipText]}>{c}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {sellers.length > 0 && (
                            <>
                                <Text style={styles.label}>Select a Seller (Optional)</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sellerChipRow}>
                                    {sellers.map(s => (
                                        <TouchableOpacity 
                                            key={s._id} 
                                            style={[styles.sellerChip, selectedSellerId === s._id && styles.activeSellerChip]} 
                                            onPress={() => setSelectedSellerId(selectedSellerId === s._id ? null : s._id)}
                                        >
                                            <Image source={{ uri: s.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100' }} style={styles.sellerMiniPic} />
                                            <Text style={[styles.sellerChipText, selectedSellerId === s._id && styles.activeSellerChipText]}>{s.businessName || s.firstName}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </>
                        )}

                        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                            {image ? (
                                <Image source={{ uri: image }} style={styles.previewImage} />
                            ) : (
                                <View style={{ alignItems: 'center' }}>
                                    <Ionicons name="camera" size={30} color="#A0A0A0" />
                                    <Text style={{ color: '#A0A0A0' }}>Upload Prescription/Photo</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
                            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Submit Request</Text>}
                        </TouchableOpacity>
                    </ScrollView>
                </SafeAreaView>
            </Modal>

            <BottomNavBar role="student" />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAFAFB' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#FFF' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1A1C1E' },
    addBtn: { backgroundColor: '#30C65A', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 20, paddingBottom: 100 },
    card: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 15, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1C1E' },
    cardSubtitle: { fontSize: 14, color: '#7F8C8D', marginTop: 2 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
    statusText: { fontSize: 10, fontWeight: 'bold' },
    cardDetails: { flexDirection: 'row', gap: 20, marginBottom: 15 },
    detailItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    detailText: { fontSize: 13, color: '#7F8C8D' },
    sellerInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F0FFF4', padding: 10, borderRadius: 10, marginTop: 5 },
    sellerText: { fontSize: 14, color: '#27AE60' },
    requestImage: { width: '100%', height: 150, borderRadius: 15, marginTop: 10 },
    modalContainer: { flex: 1, backgroundColor: '#FFF' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    modalTitle: { fontSize: 18, fontWeight: 'bold' },
    modalScroll: { padding: 20 },
    label: { fontSize: 14, fontWeight: '600', color: '#7F8C8D', marginBottom: 8, marginTop: 15 },
    input: { backgroundColor: '#F9F9F9', borderWidth: 1, borderColor: '#EEE', borderRadius: 12, padding: 15 },
    row: { flexDirection: 'row', gap: 15 },
    flex1: { flex: 1 },
    chipRow: { flexDirection: 'row', gap: 10, marginTop: 5 },
    chip: { paddingVertical: 8, paddingHorizontal: 15, borderRadius: 15, backgroundColor: '#F0F0F0' },
    activeChip: { backgroundColor: '#E8F9EE', borderColor: '#30C65A', borderWidth: 1 },
    chipText: { color: '#7F8C8D' },
    activeChipText: { color: '#30C65A', fontWeight: 'bold' },
    sellerChipRow: { flexDirection: 'row', marginTop: 5 },
    sellerChip: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 15, backgroundColor: '#F5F5F5', marginRight: 10, borderWidth: 1, borderColor: 'transparent' },
    activeSellerChip: { borderColor: '#30C65A', backgroundColor: '#E8F9EE' },
    sellerMiniPic: { width: 25, height: 25, borderRadius: 12.5, marginRight: 8 },
    sellerChipText: { fontSize: 13, color: '#7F8C8D' },
    activeSellerChipText: { color: '#30C65A', fontWeight: 'bold' },
    imagePicker: { height: 120, borderStyle: 'dashed', borderWidth: 1, borderColor: '#CCC', borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
    previewImage: { width: '100%', height: '100%', borderRadius: 15 },
    submitBtn: { backgroundColor: '#30C65A', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 30 },
    submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { marginTop: 20, fontSize: 16, color: '#A0A0A0' },
    emptyAddBtn: { marginTop: 20, backgroundColor: '#E8F9EE', padding: 15, borderRadius: 15 },
    emptyAddBtnText: { color: '#30C65A', fontWeight: 'bold' }
});

export default StudentRequests;
