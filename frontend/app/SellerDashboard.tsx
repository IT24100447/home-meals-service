import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Image, ActivityIndicator, RefreshControl, Platform, FlatList, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import BottomNavBar from '../components/BottomNavBar';

const SellerDashboard = () => {
    const router = useRouter();
    const [sellerData, setSellerData] = useState<any>(null);
    const [reviews, setReviews] = useState<any[]>([]);
    const [specialAlerts, setSpecialAlerts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    const fetchData = async () => {
        try {
            const token = Platform.OS === 'web' ? localStorage.getItem('userToken') : await SecureStore.getItemAsync('userToken');
            const sellerId = Platform.OS === 'web' ? localStorage.getItem('userId') : await SecureStore.getItemAsync('userId');

            // Fetch Seller Profile (to get average rating)
            const profileRes = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/users/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (profileRes.data.success) {
                setSellerData(profileRes.data.user);
            }

            // Fetch Reviews
            const reviewsRes = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/reviews/seller/${sellerId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReviews(reviewsRes.data);

            // Fetch Special Alerts
            const alertsRes = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/special-alerts/seller`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (alertsRes.data.success) {
                setSpecialAlerts(alertsRes.data.alerts);
            }
        } catch (err) {
            console.error("Error fetching dashboard data:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const renderReviewItem = ({ item }: { item: any }) => (
        <View style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
                <Image 
                    source={item.userId?.profileImage ? { uri: item.userId.profileImage } : require('../assets/images/react-logo.png')} 
                    style={styles.studentAvatar} 
                />
                <View style={styles.reviewInfo}>
                    <Text style={styles.studentName}>{item.userId?.firstName} {item.userId?.lastName}</Text>
                    <Text style={styles.reviewDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
                <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={14} color="#FFD700" />
                    <Text style={styles.ratingText}>{item.rating}</Text>
                </View>
            </View>
            
            <Text style={styles.mealMention}>Reviewed: <Text style={{ fontWeight: 'bold', color: '#30C65A' }}>{item.mealId?.mealName}</Text></Text>
            <Text style={styles.commentText}>{item.comment || "No comment provided."}</Text>
            
            {item.reviewPhoto && (
                <Image source={{ uri: item.reviewPhoto }} style={styles.reviewImage} />
            )}
        </View>
    );

    if (loading && !refreshing) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#30C65A" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView 
                style={styles.scrollView}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <View style={styles.header}>
                    <View>
                        <Text style={styles.welcomeText}>Welcome back,</Text>
                        <Text style={styles.sellerName}>{sellerData?.firstName} {sellerData?.lastName}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setShowProfileMenu(true)}>
                        <Image 
                            source={sellerData?.profileImage ? { uri: sellerData.profileImage } : require('../assets/images/react-logo.png')} 
                            style={styles.profilePic} 
                        />
                    </TouchableOpacity>
                </View>

                {/* Stats Section */}
                <View style={styles.statsContainer}>
                    <View style={styles.statBox}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="star" size={24} color="#FFD700" />
                        </View>
                        <Text style={styles.statValue}>{sellerData?.averageRating?.toFixed(1) || "0.0"}</Text>
                        <Text style={styles.statLabel}>Avg Rating</Text>
                    </View>
                    
                    <View style={styles.statBox}>
                        <View style={[styles.iconCircle, { backgroundColor: '#E8F5E9' }]}>
                            <Ionicons name="chatbubble-ellipses" size={24} color="#30C65A" />
                        </View>
                        <Text style={styles.statValue}>{sellerData?.totalReviews || 0}</Text>
                        <Text style={styles.statLabel}>Total Reviews</Text>
                    </View>
                </View>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Promotions & Alerts</Text>
                    <TouchableOpacity onPress={() => router.push('/SellerSpecialAlerts' as any)}>
                        <Text style={styles.manageText}>Manage</Text>
                    </TouchableOpacity>
                </View>

                {specialAlerts.length === 0 ? (
                    <View style={styles.emptyAlertsBox}>
                        <Text style={styles.emptyAlertsText}>No active special alerts.</Text>
                    </View>
                ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.alertsScroll}>
                        {specialAlerts.map(alert => (
                            <View key={alert._id} style={styles.dashboardAlertCard}>
                                <Text style={styles.dashAlertTitle}>{alert.title}</Text>
                                <Text style={styles.dashAlertBadge}>{alert.offerType}</Text>
                                <Text style={styles.dashAlertPrice}>RS.{alert.specialPrice}</Text>
                            </View>
                        ))}
                    </ScrollView>
                )}

                <View style={[styles.sectionHeader, { marginTop: 30 }]}>
                    <Text style={styles.sectionTitle}>Recent Reviews</Text>
                </View>

                {/* Special Highlight on top of reviews if any alert has showOnTop: true */}
                {specialAlerts.find(a => a.showOnTop) && (
                    <View style={styles.featuredAlertContainer}>
                         <View style={styles.featuredBadge}>
                            <Ionicons name="megaphone" size={14} color="#FFF" />
                            <Text style={styles.featuredText}>TOP PROMOTION</Text>
                         </View>
                         <Text style={styles.featuredTitle}>{specialAlerts.find(a => a.showOnTop)?.title}</Text>
                         <Text style={styles.featuredDesc}>{specialAlerts.find(a => a.showOnTop)?.description}</Text>
                    </View>
                )}

                {reviews.length === 0 ? (
                    <View style={styles.emptyReviews}>
                        <Ionicons name="star-outline" size={60} color="#DDD" />
                        <Text style={styles.emptyText}>No reviews received yet.</Text>
                    </View>
                ) : (
                    <View style={styles.reviewsList}>
                        {reviews.map((item) => (
                            <View key={item._id} style={{ marginBottom: 15 }}>
                                {renderReviewItem({ item })}
                            </View>
                        ))}
                    </View>
                )}
                
                <View style={{ height: 100 }} />
            </ScrollView>

            <Modal visible={showProfileMenu} transparent={true} animationType="fade" onRequestClose={() => setShowProfileMenu(false)}>
                <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setShowProfileMenu(false)}>
                    <View style={styles.profileMenu}>
                        <TouchableOpacity style={styles.menuItem} onPress={() => { setShowProfileMenu(false); router.push('/EditProfileScreen' as any); }}>
                            <Ionicons name="person-outline" size={20} color="#1A1C1E" />
                            <Text style={styles.menuItemText}>Edit Profile</Text>
                        </TouchableOpacity>
                        <View style={styles.menuDivider} />
                        <TouchableOpacity style={styles.menuItem} onPress={() => { 
                            setShowProfileMenu(false); 
                            if (Platform.OS === 'web') {
                                localStorage.removeItem('userToken');
                                localStorage.removeItem('userId');
                            } else {
                                SecureStore.deleteItemAsync('userToken'); 
                                SecureStore.deleteItemAsync('userId'); 
                            }
                            router.replace('/'); 
                        }}>
                            <Ionicons name="log-out-outline" size={20} color="#E74C3C" />
                            <Text style={[styles.menuItemText, { color: '#E74C3C' }]}>Sign Out</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            <BottomNavBar role="seller" />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAFAFB' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollView: { flex: 1 },
    header: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: 25,
        backgroundColor: '#FFF',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2
    },
    welcomeText: { fontSize: 14, color: '#7F8C8D' },
    sellerName: { fontSize: 22, fontWeight: 'bold', color: '#1A1C1E' },
    profilePic: { width: 55, height: 55, borderRadius: 27.5 },
    statsContainer: { 
        flexDirection: 'row', 
        justifyContent: 'space-around', 
        paddingHorizontal: 20, 
        marginTop: 20 
    },
    statBox: { 
        backgroundColor: '#FFF', 
        width: '45%', 
        padding: 20, 
        borderRadius: 20, 
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 5,
        elevation: 1
    },
    iconCircle: { 
        width: 50, 
        height: 50, 
        borderRadius: 25, 
        backgroundColor: '#FFF9E6', 
        justifyContent: 'center', 
        alignItems: 'center',
        marginBottom: 10
    },
    statValue: { fontSize: 20, fontWeight: 'bold', color: '#1A1C1E' },
    statLabel: { fontSize: 12, color: '#7F8C8D', marginTop: 5 },
    sectionHeader: { paddingHorizontal: 25, marginTop: 30, marginBottom: 15 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1C1E' },
    reviewsList: { paddingHorizontal: 20 },
    reviewCard: { 
        backgroundColor: '#FFF', 
        borderRadius: 20, 
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 5,
        elevation: 1
    },
    reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    studentAvatar: { width: 40, height: 40, borderRadius: 20 },
    reviewInfo: { flex: 1, marginLeft: 12 },
    studentName: { fontSize: 15, fontWeight: 'bold', color: '#1A1C1E' },
    reviewDate: { fontSize: 11, color: '#A0A0A0' },
    ratingBadge: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#FFF9E6', 
        paddingHorizontal: 8, 
        paddingVertical: 4, 
        borderRadius: 10 
    },
    ratingText: { marginLeft: 4, fontSize: 13, fontWeight: 'bold', color: '#FFD700' },
    mealMention: { fontSize: 13, color: '#7F8C8D', marginBottom: 5 },
    commentText: { fontSize: 14, color: '#4A4A4A', lineHeight: 20 },
    reviewImage: { width: '100%', height: 150, borderRadius: 15, marginTop: 12 },
    emptyReviews: { alignItems: 'center', marginTop: 50 },
    emptyText: { marginTop: 15, color: '#A0A0A0', fontSize: 16 },
    menuOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    profileMenu: {
        position: 'absolute',
        top: 80,
        right: 20,
        backgroundColor: '#FFF',
        borderRadius: 15,
        padding: 10,
        width: 160,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 10,
    },
    menuItemText: {
        fontSize: 16,
        color: '#1A1C1E',
        marginLeft: 10,
        fontWeight: '500',
    },
    menuDivider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginVertical: 5,
    },
    manageText: { color: '#30C65A', fontWeight: 'bold' },
    emptyAlertsBox: { marginHorizontal: 25, padding: 15, borderRadius: 15, backgroundColor: '#F0F0F0', alignItems: 'center' },
    emptyAlertsText: { color: '#7F8C8D', fontSize: 13 },
    alertsScroll: { paddingLeft: 25, marginTop: 10 },
    dashboardAlertCard: { 
        backgroundColor: '#E8F9EE', 
        padding: 15, 
        borderRadius: 15, 
        width: 150, 
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#30C65A50'
    },
    dashAlertTitle: { fontSize: 14, fontWeight: 'bold', color: '#1A1C1E', marginBottom: 5 },
    dashAlertBadge: { fontSize: 10, color: '#30C65A', fontWeight: 'bold', textTransform: 'uppercase' },
    dashAlertPrice: { fontSize: 16, fontWeight: 'bold', color: '#30C65A', marginTop: 8 },
    featuredAlertContainer: {
        marginHorizontal: 25,
        backgroundColor: '#1A1C1E',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5
    },
    featuredBadge: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#30C65A', 
        alignSelf: 'flex-start', 
        paddingHorizontal: 10, 
        paddingVertical: 5, 
        borderRadius: 20,
        marginBottom: 10
    },
    featuredText: { color: '#FFF', fontSize: 10, fontWeight: 'bold', marginLeft: 5 },
    featuredTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
    featuredDesc: { color: '#CDCDCD', fontSize: 13, lineHeight: 18 }
});

export default SellerDashboard;
