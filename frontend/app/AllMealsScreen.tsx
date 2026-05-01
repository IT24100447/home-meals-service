import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import StudentMealCard from '../components/StudentMealCard';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import axios from 'axios';

const AllMealsScreen = () => {
    const router = useRouter();
    const { location } = useLocalSearchParams();
    const [searchQuery, setSearchQuery] = useState('');
    const [userData, setUserData] = useState<any>(null);
    const [meals, setMeals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [wishlistIds, setWishlistIds] = useState<string[]>([]);

    const fetchAllMeals = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/meals?city=${location}`);
            if (res.data.success) {
                const formattedMeals = res.data.meals.map((m: any) => ({
                    id: m._id,
                    mealName: m.mealName,
                    price: m.price,
                    image: m.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60',
                    rating: m.averageRating || 0,
                    sellerName: m.sellerId?.businessName || (m.sellerId?.firstName ? `${m.sellerId.firstName} ${m.sellerId.lastName}` : 'Home Cook'),
                    sellerImage: m.sellerId?.profileImage || 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=60'
                }));
                setMeals(formattedMeals);
            }
        } catch (err) {
            console.error("Error fetching all meals:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchWishlist = async () => {
        try {
            const token = Platform.OS === 'web' ? localStorage.getItem('userToken') : await SecureStore.getItemAsync('userToken');
            if (!token) return;
            const res = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/users/wishlist`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setWishlistIds(res.data.wishlist.map((m: any) => m._id));
            }
        } catch (err) {
            console.error("Error fetching wishlist:", err);
        }
    };

    useEffect(() => {
        const loadUser = async () => {
            try {
                let userStr;
                if (Platform.OS === 'web') {
                    userStr = localStorage.getItem('userData');
                } else {
                    userStr = await SecureStore.getItemAsync('userData');
                }
                if (userStr) {
                    setUserData(JSON.parse(userStr));
                }
            } catch (err) {
                console.error("Error loading user data:", err);
            }
        };

        loadUser();
        loadUser();
        fetchAllMeals();
        fetchWishlist();
    }, [location]);

    const handleToggleWishlist = async (mealId: string) => {
        try {
            const token = Platform.OS === 'web' ? localStorage.getItem('userToken') : await SecureStore.getItemAsync('userToken');
            if (!token) {
                Alert.alert("Login Required", "Please login to add items to your wishlist.");
                return;
            }

            // Optimistic update
            const isAdding = !wishlistIds.includes(mealId);
            if (isAdding) {
                setWishlistIds([...wishlistIds, mealId]);
            } else {
                setWishlistIds(wishlistIds.filter(id => id !== mealId));
            }

            const res = await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/users/wishlist/${mealId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.data.success) {
                fetchWishlist(); // Rollback
            }
        } catch (err) {
            console.error("Error toggling wishlist:", err);
            fetchWishlist(); // Rollback
        }
    };

    const filteredMeals = meals.filter(meal => 
        meal.mealName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        meal.sellerName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#1A1C1E" />
                </TouchableOpacity>
                <Text style={styles.title}>All Meals in {location || 'Nearby'}</Text>
            </View>

            <View style={styles.searchBar}>
                <Ionicons name="search-outline" size={20} color="#A0A0A0" />
                <TextInput 
                    placeholder="Search meals..." 
                    style={styles.searchInput}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#30C65A" />
                    <Text style={styles.loadingText}>Fetching meals...</Text>
                </View>
            ) : (
                <FlatList 
                    data={filteredMeals}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View style={styles.cardWrapper}>
                            <StudentMealCard 
                                meal={{
                                    ...item,
                                    isWishlisted: wishlistIds.includes(item.id)
                                }} 
                                onPress={() => router.push({
                                    pathname: '/MealDetailsScreen' as any,
                                    params: { id: item.id }
                                })}
                                onWishlistToggle={() => handleToggleWishlist(item.id)}
                            />
                        </View>
                    )}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>No meals found in this location.</Text>
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
    },
    backBtn: {
        marginRight: 15,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1A1C1E',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F7F8F9',
        marginHorizontal: 20,
        paddingHorizontal: 15,
        borderRadius: 15,
        height: 50,
        marginBottom: 20,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    cardWrapper: {
        marginBottom: 15,
        width: '100%',
        alignItems: 'center',
    },
    emptyText: {
        textAlign: 'center',
        color: '#A0A0A0',
        marginTop: 50,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 15,
        color: '#7F8C8D',
    }
});

export default AllMealsScreen;
