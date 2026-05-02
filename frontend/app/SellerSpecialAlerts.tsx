import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Modal, FlatList, ActivityIndicator, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';

const SellerSpecialAlerts = () => {
    const router = useRouter();
    const [alerts, setAlerts] = useState<any[]>([]);
    const [meals, setMeals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingAlert, setEditingAlert] = useState<any>(null);

    // Form settings
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedMeal, setSelectedMeal] = useState<any>(null);
    const [specialPrice, setSpecialPrice] = useState('');
    const [offerType, setOfferType] = useState('Special Offer');
    const [showOnTop, setShowOnTop] = useState(false);

    const fetchAlerts = async () => {
        try {
            const token = Platform.OS === 'web' ? localStorage.getItem('userToken') : await SecureStore.getItemAsync('userToken');
            const res = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/special-alerts/seller`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setAlerts(res.data.alerts);
            }
        } catch (err) {
            console.error("Error fetching alerts:", err);
        }
    };

    const fetchMeals = async () => {
        try {
            const token = Platform.OS === 'web' ? localStorage.getItem('userToken') : await SecureStore.getItemAsync('userToken');
            const res = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/meals/seller`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setMeals(res.data.meals);
            }
        } catch (err) {
            console.error("Error fetching meals:", err);
        }
    };

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            await Promise.all([fetchAlerts(), fetchMeals()]);
            setLoading(false);
        };
        load();
    }, []);

    const handleSave = async () => {
        if (!title || !description || !selectedMeal || !specialPrice) {
            Alert.alert("Error", "Please fill all fields");
            return;
        }

        try {
            const token = Platform.OS === 'web' ? localStorage.getItem('userToken') : await SecureStore.getItemAsync('userToken');
            const payload = {
                title,
                description,
                mealId: selectedMeal._id,
                specialPrice: Number(specialPrice),
                offerType,
                showOnTop
            };

            if (editingAlert) {
                await axios.put(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/special-alerts/${editingAlert._id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/special-alerts`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            setShowModal(false);
            resetForm();
            fetchAlerts();
            Alert.alert("Success", "Special alert saved successfully!");
        } catch (err) {
            console.error("Error saving alert:", err);
            Alert.alert("Error", "Failed to save special alert");
        }
    };

    const handleDelete = (id: string) => {
        Alert.alert("Confirm Delete", "Are you sure you want to delete this special alert?", [
            { text: "Cancel", style: "cancel" },
            { 
                text: "Delete", 
                style: "destructive", 
                onPress: async () => {
                    try {
                        const token = Platform.OS === 'web' ? localStorage.getItem('userToken') : await SecureStore.getItemAsync('userToken');
                        await axios.delete(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/special-alerts/${id}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        fetchAlerts();
                    } catch (err) {
                        console.error("Error deleting alert:", err);
                    }
                }
            }
        ]);
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setSelectedMeal(null);
        setSpecialPrice('');
        setOfferType('Special Offer');
        setShowOnTop(false);
        setEditingAlert(null);
    };

    const openEdit = (alert: any) => {
        setEditingAlert(alert);
        setTitle(alert.title);
        setDescription(alert.description);
        setSelectedMeal(alert.mealId);
        setSpecialPrice(alert.specialPrice.toString());
        setOfferType(alert.offerType);
        setShowOnTop(alert.showOnTop);
        setShowModal(true);
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
                <Text style={styles.headerTitle}>My Special Alerts</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
                    <Ionicons name="add" size={24} color="#FFF" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {alerts.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="megaphone-outline" size={80} color="#E0E0E0" />
                        <Text style={styles.emptyText}>No special alerts yet.</Text>
                        <Text style={styles.emptySubText}>Create promotional deals to attract more students!</Text>
                    </View>
                ) : (
                    alerts.map(alert => (
                        <View key={alert._id} style={styles.alertCard}>
                            <View style={styles.alertHeader}>
                                <View style={styles.statusBadge}>
                                    <Text style={styles.statusText}>{alert.offerType}</Text>
                                </View>
                                {alert.showOnTop && (
                                    <View style={[styles.statusBadge, { backgroundColor: '#FFF9E6' }]}>
                                        <Text style={[styles.statusText, { color: '#FFD700' }]}>Featured</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={styles.alertTitle}>{alert.title}</Text>
                            <Text style={styles.alertDesc}>{alert.description}</Text>
                            <View style={styles.mealInfo}>
                                <Text style={styles.mealName}>Meal: {alert.mealId?.mealName}</Text>
                                <Text style={styles.priceInfo}>
                                    Regular: RS.{alert.mealId?.price.toFixed(2)} → <Text style={styles.specialPriceText}>RS.{alert.specialPrice.toFixed(2)}</Text>
                                </Text>
                            </View>
                            <View style={styles.cardActions}>
                                <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(alert)}>
                                    <Ionicons name="create-outline" size={20} color="#30C65A" />
                                    <Text style={styles.editBtnText}>Edit</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(alert._id)}>
                                    <Ionicons name="trash-outline" size={20} color="#E74C3C" />
                                    <Text style={styles.deleteBtnText}>Delete</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>

            <Modal visible={showModal} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{editingAlert ? 'Edit Alert' : 'New Special Alert'}</Text>
                            <TouchableOpacity onPress={() => { setShowModal(false); resetForm(); }}>
                                <Ionicons name="close" size={24} color="#1A1C1E" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.label}>Title</Text>
                            <TextInput 
                                style={styles.input} 
                                placeholder="E.g. Weekend Flash Sale" 
                                value={title}
                                onChangeText={setTitle}
                            />

                            <Text style={styles.label}>Description</Text>
                            <TextInput 
                                style={[styles.input, { height: 80, textAlignVertical: 'top' }]} 
                                placeholder="Details about this offer..." 
                                multiline
                                value={description}
                                onChangeText={setDescription}
                            />

                            <Text style={styles.label}>Select Meal</Text>
                            <View style={styles.mealPicker}>
                                {meals.map(meal => (
                                    <TouchableOpacity 
                                        key={meal._id} 
                                        style={[styles.mealBadge, selectedMeal?._id === meal._id && styles.selectedMealBadge]}
                                        onPress={() => setSelectedMeal(meal)}
                                    >
                                        <Text style={[styles.mealBadgeText, selectedMeal?._id === meal._id && styles.selectedMealText]}>
                                            {meal.mealName}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.label}>Special Price (RS)</Text>
                            <TextInput 
                                style={styles.input} 
                                placeholder="0.00" 
                                keyboardType="numeric"
                                value={specialPrice}
                                onChangeText={setSpecialPrice}
                            />

                            <Text style={styles.label}>Offer Type</Text>
                            <View style={styles.offerTypes}>
                                {["Discount", "Buy 1 Get 1", "Special Offer", "Other"].map(type => (
                                    <TouchableOpacity 
                                        key={type} 
                                        style={[styles.typeBadge, offerType === type && styles.selectedTypeBadge]}
                                        onPress={() => setOfferType(type)}
                                    >
                                        <Text style={[styles.typeText, offerType === type && styles.selectedTypeText]}>{type}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TouchableOpacity 
                                style={styles.checkboxContainer} 
                                onPress={() => setShowOnTop(!showOnTop)}
                            >
                                <Ionicons 
                                    name={showOnTop ? "checkbox" : "square-outline"} 
                                    size={24} 
                                    color={showOnTop ? "#30C65A" : "#7F8C8D"} 
                                />
                                <Text style={styles.checkboxLabel}>Show on top of reviews</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                                <Text style={styles.saveBtnText}>{editingAlert ? 'Update Alert' : 'Create Alert'}</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAFAFB' },
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
    addBtn: { 
        backgroundColor: '#30C65A', 
        width: 40, 
        height: 40, 
        borderRadius: 20, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    scrollContent: { padding: 20 },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { fontSize: 18, fontWeight: 'bold', color: '#1A1C1E', marginTop: 20 },
    emptySubText: { fontSize: 14, color: '#7F8C8D', textAlign: 'center', marginTop: 10, paddingHorizontal: 40 },
    alertCard: { 
        backgroundColor: '#FFF', 
        borderRadius: 20, 
        padding: 15, 
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2
    },
    alertHeader: { flexDirection: 'row', marginBottom: 10 },
    statusBadge: { backgroundColor: '#E8F9EE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginRight: 8 },
    statusText: { fontSize: 11, color: '#30C65A', fontWeight: 'bold' },
    alertTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1C1E', marginBottom: 5 },
    alertDesc: { fontSize: 14, color: '#4A4A4A', marginBottom: 12 },
    mealInfo: { backgroundColor: '#F9FAFB', padding: 10, borderRadius: 12, marginBottom: 15 },
    mealName: { fontSize: 14, fontWeight: 'bold', color: '#1A1C1E' },
    priceInfo: { fontSize: 12, color: '#7F8C8D', marginTop: 2 },
    specialPriceText: { color: '#30C65A', fontWeight: 'bold', fontSize: 14 },
    cardActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 12 },
    editBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    editBtnText: { color: '#30C65A', marginLeft: 8, fontWeight: 'bold' },
    deleteBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    deleteBtnText: { color: '#E74C3C', marginLeft: 8, fontWeight: 'bold' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1A1C1E' },
    label: { fontSize: 14, fontWeight: 'bold', color: '#1A1C1E', marginBottom: 8, marginTop: 15 },
    input: { backgroundColor: '#F5F6FA', borderRadius: 12, padding: 12, fontSize: 16 },
    mealPicker: { flexDirection: 'row', flexWrap: 'wrap' },
    mealBadge: { backgroundColor: '#F5F6FA', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginRight: 10, marginBottom: 10 },
    selectedMealBadge: { backgroundColor: '#30C65A' },
    mealBadgeText: { fontSize: 13, color: '#4A4A4A' },
    selectedMealText: { color: '#FFF', fontWeight: 'bold' },
    offerTypes: { flexDirection: 'row', flexWrap: 'wrap' },
    typeBadge: { borderWidth: 1, borderColor: '#F0F0F0', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginRight: 8, marginBottom: 8 },
    selectedTypeBadge: { borderColor: '#30C65A', backgroundColor: '#E8F9EE' },
    typeText: { fontSize: 13, color: '#7F8C8D' },
    selectedTypeText: { color: '#30C65A', fontWeight: 'bold' },
    checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 20 },
    checkboxLabel: { marginLeft: 10, fontSize: 14, color: '#4A4A4A' },
    saveBtn: { backgroundColor: '#30C65A', borderRadius: 15, padding: 18, alignItems: 'center', marginTop: 30, marginBottom: 20 },
    saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});

export default SellerSpecialAlerts;
