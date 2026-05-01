import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import StudentMealCard from '../components/StudentMealCard';
import BottomNavBar from '../components/BottomNavBar';

const WishlistScreen = () => {
    const router = useRouter();
    const [wishlist, setWishlist] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchWishlist = async () => {
        try {
            const token = Platform.OS === 'web' ? localStorage.getItem('userToken') : await SecureStore.getItemAsync('userToken');
            if (!token) {
                setLoading(false);
                return;
            }
            const res = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/users/wishlist`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                const formattedMeals = res.data.wishlist.map((m: any) => ({
                    id: m._id,
                    mealName: m.mealName,
                    price: m.price,
                    image: m.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60',
                    rating: m.averageRating || 4.8,
                    sellerName: m.sellerId?.businessName || (m.sellerId?.firstName ? `${m.sellerId.firstName} ${m.sellerId.lastName}` : 'Home Cook'),
                    sellerImage: m.sellerId?.profileImage || 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=60',
                    isWishlisted: true
                }));
                setWishlist(formattedMeals);
            }
        } catch (err) {
            console.error("Error fetching wishlist:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWishlist();
    }, []);

    const handleRemoveFromWishlist = async (mealId: string) => {
        try {
            const token = Platform.OS === 'web' ? localStorage.getItem('userToken') : await SecureStore.getItemAsync('userToken');
            
            // Optimistic update
            setWishlist(wishlist.filter(item => item.id !== mealId));

            const res = await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/users/wishlist/${mealId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.data.success) {
                fetchWishlist(); // Rollback
            }
        } catch (err) {
            console.error("Error removing from wishlist:", err);
            fetchWishlist(); // Rollback
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#1A1C1E" />
                </TouchableOpacity>
                <Text style={styles.title}>My Wishlist</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#30C65A" />
                </View>
            ) : wishlist.length > 0 ? (
                <FlatList
                    data={wishlist}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View style={styles.cardWrapper}>
                            <StudentMealCard 
                                meal={item} 
                                onPress={() => router.push({
                                    pathname: '/MealDetailsScreen' as any,
                                    params: { id: item.id }
                                })}
                                onWishlistToggle={() => handleRemoveFromWishlist(item.id)}
                            />
                        </View>
                    )}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            ) : (
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconContainer}>
                        <Ionicons name="heart-dislike-outline" size={80} color="#F0F0F0" />
                    </View>
                    <Text style={styles.emptyTitle}>Your Wishlist is Empty</Text>
                    <Text style={styles.emptySubtitle}>Tap the heart on any meal to save it for later!</Text>
                    <TouchableOpacity 
                        style={styles.browseBtn}
                        onPress={() => router.push('/StudentDashboard' as any)}
                    >
                        <Text style={styles.browseBtnText}>Browse Meals</Text>
                    </TouchableOpacity>
                </View>
            )}

            <BottomNavBar role="student" />
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
        justifyContent: 'space-between',
        padding: 20,
        backgroundColor: '#FFF',
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1A1C1E',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 20,
        paddingBottom: 100,
    },
    cardWrapper: {
        marginBottom: 20,
        width: '100%',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyIconContainer: {
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: '#FAFAFA',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 25,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1A1C1E',
        marginBottom: 10,
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#A0A0A0',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 30,
    },
    browseBtn: {
        backgroundColor: '#30C65A',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 15,
        shadowColor: '#30C65A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    browseBtnText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
    }
});

export default WishlistScreen;
