import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity, Image, Modal, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import BottomNavBar from '../components/BottomNavBar';
import StudentMealCard from '../components/StudentMealCard';
import SellerCard from '../components/SellerCard';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import axios from 'axios';

const LOCATIONS = ['Colombo', 'Kandy', 'Galle', 'Negombo', 'Jaffna'];

const StudentDashboard = () => {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [location, setLocation] = useState('Colombo');
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [userData, setUserData] = useState<any>(null);
    const [meals, setMeals] = useState<any[]>([]);
    const [sellers, setSellers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [mealsRes, sellersRes] = await Promise.all([
                axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/meals?city=${location}`),
                axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/users/sellers?city=${location}`)
            ]);

            if (mealsRes.data.success) {
                // Map backend meal data to component props
                const formattedMeals = mealsRes.data.meals.map((m: any) => ({
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

            if (sellersRes.data.success) {
                // Map backend seller data to component props
                const formattedSellers = sellersRes.data.sellers.map((s: any) => ({
                    id: s._id,
                    name: s.businessName || `${s.firstName} ${s.lastName}`,
                    description: s.description || 'Verified Home Cook',
                    image: s.profileImage || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=60',
                    rating: 4.8 // Mock rating if not in DB
                }));
                setSellers(formattedSellers);
            }
        } catch (err) {
            console.error("Error fetching dashboard data:", err);
        } finally {
            setLoading(false);
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
        fetchData();
    }, [location]);

    const filteredMeals = meals.filter(meal =>
        meal.mealName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        meal.sellerName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredSellers = sellers.filter(seller =>
        seller.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        seller.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSeeAllMeals = () => {
        router.push({
            pathname: '/AllMealsScreen' as any,
            params: { location }
        });
    };

    const handleSeeAllSellers = () => {
        router.push({
            pathname: '/AllSellersScreen' as any,
            params: { location }
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Header Section */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.locationLabel}>Location</Text>
                        <TouchableOpacity
                            style={styles.locationSelector}
                            onPress={() => setShowLocationModal(true)}
                        >
                            <Ionicons name="location-sharp" size={20} color="#30C65A" />
                            <Text style={styles.locationText}>{location}</Text>
                            <Ionicons name="chevron-down" size={16} color="#A0A0A0" />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.profileBtn}>
                        <Image
                            source={{ uri: userData?.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60' }}
                            style={styles.profileImage}
                        />
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Ionicons name="search-outline" size={22} color="#A0A0A0" style={styles.searchIcon} />
                    <TextInput
                        placeholder="Search for meals, cooks..."
                        style={styles.searchInput}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#30C65A" />
                        <Text style={styles.loadingText}>Fetching delicious meals...</Text>
                    </View>
                ) : (
                    <>
                        {/* Meals Section */}
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Meals Around You</Text>
                            <TouchableOpacity onPress={handleSeeAllMeals}>
                                <Text style={styles.seeAllText}>See All</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.mealsList}
                        >
                            {filteredMeals.length > 0 ? (
                                filteredMeals.map(meal => (
                                    <StudentMealCard 
                                        key={meal.id} 
                                        meal={meal} 
                                        onPress={() => router.push({
                                            pathname: '/MealDetailsScreen' as any,
                                            params: { id: meal.id }
                                        })}
                                    />
                                ))
                            ) : (
                                <Text style={styles.noDataText}>No meals found in {location}</Text>
                            )}
                        </ScrollView>

                        {/* Sellers Section */}
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Sellers Near You</Text>
                            <TouchableOpacity onPress={handleSeeAllSellers}>
                                <Text style={styles.seeAllText}>See All</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.sellersList}>
                            {filteredSellers.length > 0 ? (
                                filteredSellers.map(seller => (
                                    <SellerCard 
                                        key={seller.id} 
                                        seller={seller} 
                                        onPress={() => router.push({
                                            pathname: '/SellerDetailsScreen' as any,
                                            params: { id: seller.id }
                                        })}
                                    />
                                ))
                            ) : (
                                <Text style={styles.noDataText}>No sellers found in {location}</Text>
                            )}
                        </View>
                    </>
                )}
            </ScrollView>

            {/* Location Selector Modal */}
            <Modal
                visible={showLocationModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowLocationModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Location</Text>
                        {LOCATIONS.map((loc) => (
                            <TouchableOpacity
                                key={loc}
                                style={[styles.locationItem, location === loc && styles.activeLocationItem]}
                                onPress={() => {
                                    setLocation(loc);
                                    setShowLocationModal(false);
                                }}
                            >
                                <Text style={[styles.locationItemText, location === loc && styles.activeLocationItemText]}>
                                    {loc}
                                </Text>
                                {location === loc && <Ionicons name="checkmark-circle" size={20} color="#30C65A" />}
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity
                            style={styles.closeModalBtn}
                            onPress={() => setShowLocationModal(false)}
                        >
                            <Text style={styles.closeModalBtnText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <BottomNavBar role="student" />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollContent: {
        paddingBottom: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        marginBottom: 25,
    },
    locationLabel: {
        fontSize: 12,
        color: '#A0A0A0',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    locationSelector: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1A1C1E',
        marginHorizontal: 5,
    },
    profileBtn: {
        width: 50,
        height: 50,
        borderRadius: 25,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#F0F0F0',
    },
    profileImage: {
        width: '100%',
        height: '100%',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F7F8F9',
        marginHorizontal: 20,
        paddingHorizontal: 15,
        borderRadius: 20,
        height: 55,
        marginBottom: 30,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#1A1C1E',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1A1C1E',
    },
    seeAllText: {
        fontSize: 14,
        color: '#30C65A',
        fontWeight: '600',
    },
    mealsList: {
        paddingLeft: 20,
        paddingBottom: 10,
        marginBottom: 20,
    },
    sellersList: {
        paddingHorizontal: 20,
    },
    noDataText: {
        textAlign: 'center',
        color: '#A0A0A0',
        marginTop: 20,
        fontSize: 14,
        fontStyle: 'italic',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '80%',
        backgroundColor: '#FFF',
        borderRadius: 25,
        padding: 20,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1A1C1E',
        marginBottom: 20,
    },
    locationItem: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 15,
        marginBottom: 10,
    },
    activeLocationItem: {
        backgroundColor: '#E8F9EE',
    },
    locationItemText: {
        fontSize: 16,
        color: '#1A1C1E',
    },
    activeLocationItemText: {
        color: '#30C65A',
        fontWeight: 'bold',
    },
    closeModalBtn: {
        marginTop: 10,
        paddingVertical: 10,
    },
    closeModalBtnText: {
        color: '#7F8C8D',
        fontSize: 16,
    },
    loadingContainer: {
        height: 300,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 15,
        color: '#7F8C8D',
        fontSize: 14,
    }
});

export default StudentDashboard;
