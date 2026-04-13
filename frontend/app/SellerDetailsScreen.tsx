import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, ActivityIndicator, FlatList, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import axios from 'axios';

import BottomNavBar from '../components/BottomNavBar';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 60) / 2;

const SellerDetailsScreen = () => {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [seller, setSeller] = useState<any>(null);
    const [meals, setMeals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSellerData = async () => {
            try {
                const [sellerRes, mealsRes] = await Promise.all([
                    axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/users/sellers/${id}`),
                    axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/meals/seller/${id}`)
                ]);

                if (sellerRes.data.success) {
                    setSeller(sellerRes.data.seller);
                }

                if (mealsRes.data.success) {
                    setMeals(mealsRes.data.meals);
                }
            } catch (err) {
                console.error("Error fetching seller details:", err);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchSellerData();
        }
    }, [id]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#30C65A" />
            </View>
        );
    }

    if (!seller) {
        return (
            <View style={styles.errorContainer}>
                <Text>Seller not found</Text>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Header Profile Section */}
                <View style={styles.profileHeader}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="#1A1C1E" />
                    </TouchableOpacity>
                    
                    <View style={styles.profileInfo}>
                        <View style={styles.imageContainer}>
                            <Image 
                                source={{ uri: seller.profileImage || 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&auto=format&fit=crop&q=60' }} 
                                style={styles.profileImage} 
                            />
                        </View>
                        <Text style={styles.sellerName}>{seller.businessName || `${seller.firstName} ${seller.lastName}`}</Text>
                        
                        <View style={styles.ratingBadge}>
                            <Ionicons name="star" size={16} color="#FFD700" />
                            <Text style={styles.ratingText}>4.8</Text>
                        </View>
                        
                        <Text style={styles.description}>{seller.description || 'Authentic homemade meals prepared with love.'}</Text>
                    </View>
                </View>

                {/* Menu Section */}
                <View style={styles.menuSection}>
                    <Text style={styles.sectionTitle}>Menu ({meals.length})</Text>
                    
                    <View style={styles.mealsGrid}>
                        {meals.map((item) => (
                            <TouchableOpacity key={item._id} style={styles.mealCard}>
                                <Image source={{ uri: item.image }} style={styles.mealImage} />
                                <View style={styles.mealRatingBadge}>
                                    <Ionicons name="star" size={12} color="#FFD700" />
                                    <Text style={styles.mealRatingText}>4.9</Text>
                                </View>
                                <View style={styles.mealInfo}>
                                    <Text style={styles.mealName} numberOfLines={1}>{item.mealName}</Text>
                                    <Text style={styles.mealPrice}>Rs. {typeof item.price === 'number' ? item.price.toFixed(2) : item.price}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ScrollView>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backText: {
        color: '#30C65A',
        marginTop: 10,
        fontWeight: 'bold',
    },
    profileHeader: {
        paddingTop: 20,
        paddingHorizontal: 20,
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderBottomLeftRadius: 50,
        borderBottomRightRadius: 50,
        paddingBottom: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 5,
    },
    backButton: {
        alignSelf: 'flex-start',
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F5F6FA',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    profileInfo: {
        alignItems: 'center',
    },
    imageContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: '#E8F9EE',
        padding: 5,
        marginBottom: 15,
    },
    profileImage: {
        width: '100%',
        height: '100%',
        borderRadius: 55,
    },
    sellerName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1A1C1E',
        marginBottom: 10,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFBE6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#FFEEBA',
    },
    ratingText: {
        marginLeft: 5,
        fontSize: 14,
        fontWeight: 'bold',
        color: '#856404',
    },
    description: {
        fontSize: 14,
        color: '#7F8C8D',
        textAlign: 'center',
        paddingHorizontal: 40,
        lineHeight: 20,
    },
    menuSection: {
        padding: 20,
        paddingTop: 30,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1A1C1E',
        marginBottom: 20,
    },
    mealsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    mealCard: {
        width: COLUMN_WIDTH,
        backgroundColor: '#FFFFFF',
        borderRadius: 25,
        marginBottom: 20,
        padding: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    mealImage: {
        width: '100%',
        height: 120,
        borderRadius: 20,
    },
    mealRatingBadge: {
        position: 'absolute',
        top: 18,
        left: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
    },
    mealRatingText: {
        fontSize: 10,
        fontWeight: 'bold',
        marginLeft: 2,
    },
    mealInfo: {
        marginTop: 10,
        paddingHorizontal: 5,
    },
    mealName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1A1C1E',
        marginBottom: 4,
    },
    mealPrice: {
        fontSize: 14,
        color: '#E67E22',
        fontWeight: 'bold',
    },
});

export default SellerDetailsScreen;
