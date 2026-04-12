import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, SafeAreaView, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import MealCard from '../components/MealCard';
import BottomNavBar from '../components/BottomNavBar';

const SellerMenuScreen = () => {
    const router = useRouter();
    const [meals, setMeals] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchMeals = async () => {
        try {
            const storedToken = Platform.OS === 'web'
                ? localStorage.getItem('userToken')
                : await SecureStore.getItemAsync('userToken');

            const token = storedToken ? String(storedToken) : null;
            console.log("Fetching meals with token exists:", !!token);

            if (!token) {
                Alert.alert("Error", "Session expired. Please login again.");
                router.push('/SellerLoginScreen');
                return;
            }

            const response = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/meals/mine`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setMeals(response.data.meals);
            }
        } catch (err: any) {
            console.error("Error fetching meals:", err.response?.data || err.message);
            Alert.alert("Error", "Could not fetch your menu.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMeals();
    }, []);

    const handleDeleteMeal = (mealId: string) => {
        Alert.alert(
            "Delete Meal",
            "Are you sure to delete it?",
            [
                { text: "No", style: "cancel" },
                {
                    text: "Yes",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const storedToken = Platform.OS === 'web'
                                ? localStorage.getItem('userToken')
                                : await SecureStore.getItemAsync('userToken');

                            const token = storedToken ? String(storedToken) : null;
                            if (!token) return;

                            const response = await axios.delete(
                                `${process.env.EXPO_PUBLIC_API_URL}/api/v1/meals/${mealId}`,
                                { headers: { Authorization: `Bearer ${token}` } }
                            );

                            if (response.data.success) {
                                setMeals((prevMeals) => prevMeals.filter((m: any) => m._id !== mealId));
                                Alert.alert("Success", "Meal deleted successfully");
                            }
                        } catch (err: any) {
                            console.error("Error deleting meal:", err.response?.data || err.message);
                            Alert.alert("Error", "Could not delete the meal. Please try again.");
                        }
                    }
                }
            ]
        );
    };

    const renderMeal = ({ item }: { item: any }) => (
        <MealCard
            meal={item}
            onEdit={() => Alert.alert("Edit", "Edit functionality coming soon")}
            onDelete={() => handleDeleteMeal(item._id)}
        />
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Your Menu</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => router.push('/AddMealScreen')}
                >
                    <Ionicons name="add" size={30} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#30C65A" />
                </View>
            ) : (
                <FlatList
                    data={meals}
                    keyExtractor={(item) => item._id}
                    renderItem={renderMeal}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons name="fast-food-outline" size={80} color="#E0E0E0" />
                            <Text style={styles.emptyText}>You haven't added any meals yet.</Text>
                        </View>
                    }
                />
            )}

            <BottomNavBar />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9F9F9',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1A1C1E',
    },
    addButton: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: '#30C65A',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#30C65A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 20,
        paddingBottom: 100,
    },
    empty: {
        marginTop: 100,
        alignItems: 'center',
    },
    emptyText: {
        marginTop: 20,
        fontSize: 16,
        color: '#A0A0A0',
        textAlign: 'center',
    },
});

export default SellerMenuScreen;
