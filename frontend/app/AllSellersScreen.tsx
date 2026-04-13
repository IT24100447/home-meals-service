import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import SellerCard from '../components/SellerCard';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import axios from 'axios';

const AllSellersScreen = () => {
    const router = useRouter();
    const { location } = useLocalSearchParams();
    const [searchQuery, setSearchQuery] = useState('');
    const [sellers, setSellers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAllSellers = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/users/sellers?city=${location}`);
            if (res.data.success) {
                const formattedSellers = res.data.sellers.map((s: any) => ({
                    id: s._id,
                    name: s.businessName || `${s.firstName} ${s.lastName}`,
                    description: s.description || 'Verified Home Cook',
                    image: s.profileImage || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=60',
                    rating: 4.8
                }));
                setSellers(formattedSellers);
            }
        } catch (err) {
            console.error("Error fetching all sellers:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllSellers();
    }, [location]);

    const filteredSellers = sellers.filter(seller => 
        seller.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        seller.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#1A1C1E" />
                </TouchableOpacity>
                <Text style={styles.title}>Sellers in {location || 'Nearby'}</Text>
            </View>

            <View style={styles.searchBar}>
                <Ionicons name="search-outline" size={20} color="#A0A0A0" />
                <TextInput 
                    placeholder="Search sellers..." 
                    style={styles.searchInput}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#30C65A" />
                    <Text style={styles.loadingText}>Finding best cooks...</Text>
                </View>
            ) : (
                <FlatList 
                    data={filteredSellers}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <SellerCard 
                            seller={item} 
                            onPress={() => router.push({
                                pathname: '/SellerDetailsScreen' as any,
                                params: { id: item.id }
                            })}
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>No sellers found in this location.</Text>
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

export default AllSellersScreen;
