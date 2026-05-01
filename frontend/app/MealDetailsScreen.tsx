import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, ActivityIndicator, TextInput, Modal, Alert, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import BottomNavBar from '../components/BottomNavBar';

const { width } = Dimensions.get('window');

const MealDetailsScreen = () => {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [meal, setMeal] = useState<any>(null);
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [reviewText, setReviewText] = useState('');
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewImage, setReviewImage] = useState<string | null>(null);
    const [postingReview, setPostingReview] = useState(false);
    const [isWishlisted, setIsWishlisted] = useState(false);

    useEffect(() => {
        const fetchMealDetails = async () => {
            try {
                const res = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/meals/${id}`);
                if (res.data.success) {
                    setMeal(res.data.meal);
                    setReviews(res.data.reviews || []);
                }
            } catch (err) {
                console.error("Error fetching meal details:", err);
            } finally {
                setLoading(false);
            }
        };

        const fetchWishlistStatus = async () => {
            try {
                const token = Platform.OS === 'web' ? localStorage.getItem('userToken') : await SecureStore.getItemAsync('userToken');
                if (!token) return;
                const res = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/users/wishlist`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data.success) {
                    const isFav = res.data.wishlist.some((m: any) => m._id === id);
                    setIsWishlisted(isFav);
                }
            } catch (err) {
                console.error("Error fetching wishlist status:", err);
            }
        };

        if (id) {
            fetchMealDetails();
            fetchWishlistStatus();
        }
    }, [id]);

    const handleToggleWishlist = async () => {
        try {
            const token = Platform.OS === 'web' ? localStorage.getItem('userToken') : await SecureStore.getItemAsync('userToken');
            if (!token) {
                Alert.alert("Login Required", "Please login to add items to your wishlist.");
                return;
            }

            // Optimistic update
            setIsWishlisted(!isWishlisted);

            const res = await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/users/wishlist/${id}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.data.success) {
                setIsWishlisted(isWishlisted); // Rollback
            }
        } catch (err) {
            console.error("Error toggling wishlist:", err);
            setIsWishlisted(isWishlisted); // Rollback
        }
    };

    const handleOrder = async () => {
        try {
            // Here you would normally call your order API
            // For now, let's just show success
            Alert.alert("Success", `Placed order for ${quantity} x ${meal.mealName}`);
            setShowOrderModal(false);
        } catch (err) {
            Alert.alert("Error", "Failed to place order");
        }
    };

    const pickReviewImage = async () => {
        const result = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (result.granted === false) {
            Alert.alert("Permission Required", "Permission to access camera roll is required!");
            return;
        }

        let pickerResult = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!pickerResult.canceled) {
            setReviewImage(pickerResult.assets[0].uri);
        }
    };

    const handlePostReview = async () => {
        if (reviewRating === 0) {
            Alert.alert("Required", "Please select a rating.");
            return;
        }
        if (!reviewImage) {
            Alert.alert("Required", "Please upload a photo of the meal to add a review.");
            return;
        }

        setPostingReview(true);
        try {
            const token = Platform.OS === 'web' ? localStorage.getItem('userToken') : await SecureStore.getItemAsync('userToken');
            let userId = Platform.OS === 'web' ? localStorage.getItem('userId') : await SecureStore.getItemAsync('userId');
            
            // Fallback if userId not saved separately
            if (!userId) {
                const userData = Platform.OS === 'web' ? localStorage.getItem('userData') : await SecureStore.getItemAsync('userData');
                if (userData) {
                    const parsed = JSON.parse(userData);
                    userId = parsed.id;
                }
            }

            const formData = new FormData();
            formData.append('userId', userId || '');
            formData.append('sellerId', meal.sellerId._id);
            formData.append('mealId', meal._id);
            formData.append('rating', reviewRating.toString());
            formData.append('comment', reviewText);
            
            if (reviewImage) {
                const filename = reviewImage.split('/').pop();
                const match = /\.(\w+)$/.exec(filename || '');
                const type = match ? `image/${match[1]}` : `image`;
                
                if (Platform.OS !== 'web') {
                    formData.append('reviewPhoto', {
                        uri: reviewImage,
                        name: filename,
                        type,
                    } as any);
                } else {
                    const response = await fetch(reviewImage);
                    const blob = await response.blob();
                    formData.append('reviewPhoto', blob, filename);
                }
            }

            const res = await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/reviews/post-review`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.status === 201) {
                Alert.alert("Success", "Review posted successfully!");
                setReviewText('');
                setReviewRating(0);
                setReviewImage(null);
                // Refresh reviews
                const reviewFetch = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/meals/${id}`);
                if (reviewFetch.data.success) setReviews(reviewFetch.data.reviews);
            }
        } catch (error: any) {
            console.error("Error posting review:", error);
            Alert.alert("Error", error.response?.data?.message || "Failed to post review.");
        } finally {
            setPostingReview(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#30C65A" />
            </View>
        );
    }

    if (!meal) {
        return (
            <View style={styles.errorContainer}>
                <Text>Meal not found</Text>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Hero Image */}
                <View style={styles.imageContainer}>
                    <Image source={{ uri: meal.image }} style={styles.heroImage} />
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.wishlistBtn} onPress={handleToggleWishlist}>
                        <Ionicons 
                            name={isWishlisted ? "heart" : "heart-outline"} 
                            size={26} 
                            color={isWishlisted ? "#E74C3C" : "#FFF"} 
                        />
                    </TouchableOpacity>
                </View>

                {/* Meal Details */}
                <View style={styles.detailsContainer}>
                    <View style={styles.headerRow}>
                        <View style={styles.titleInfo}>
                            <Text style={styles.mealName}>{meal.mealName}</Text>
                            <View style={styles.metaInfo}>
                                <View style={styles.ratingBadge}>
                                    <Ionicons name="star" size={16} color="#FFD700" />
                                    <Text style={styles.ratingText}>{meal.averageRating || 4.9}</Text>
                                </View>
                                <View style={[styles.typeBadge, { backgroundColor: meal.mealType === 'veg' ? '#E8F9EE' : '#FEEBEB' }]}>
                                    <Text style={[styles.typeText, { color: meal.mealType === 'veg' ? '#30C65A' : '#E74C3C' }]}>
                                        {meal.mealType?.toUpperCase()}
                                    </Text>
                                </View>
                            </View>
                        </View>
                        <View style={styles.priceContainer}>
                            <Text style={styles.priceLabel}>Price</Text>
                            <Text style={styles.priceValue}>Rs.{meal.price.toFixed(2)}</Text>
                        </View>
                    </View>

                    {/* Meal Configuration */}
                    <View style={styles.configContainer}>
                        <View style={styles.configItem}>
                            <Ionicons name="restaurant-outline" size={18} color="#7F8C8D" />
                            <Text style={styles.configText}>{meal.category}</Text>
                        </View>
                        <View style={styles.configItem}>
                            <Ionicons name="fitness-outline" size={18} color="#7F8C8D" />
                            <Text style={styles.configText}>{meal.portionSize}</Text>
                        </View>
                        <View style={styles.configItem}>
                            <Ionicons name="layers-outline" size={18} color="#7F8C8D" />
                            <Text style={styles.configText}>{meal.availableQuantity} Left</Text>
                        </View>
                    </View>

                    <Text style={styles.sectionTitle}>About this meal</Text>
                    <Text style={styles.description}>{meal.description || 'No description available for this meal.'}</Text>

                    {/* Seller Card */}
                    <TouchableOpacity 
                        style={styles.sellerCard}
                        onPress={() => router.push({ pathname: '/SellerDetailsScreen', params: { id: meal.sellerId?._id } })}
                    >
                        <Image 
                            source={{ uri: meal.sellerId?.profileImage || 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=60' }} 
                            style={styles.sellerImage} 
                        />
                        <View style={styles.sellerInfo}>
                            <Text style={styles.sellerName}>{meal.sellerId?.businessName || (meal.sellerId?.firstName ? `${meal.sellerId.firstName} ${meal.sellerId.lastName}` : 'Home Cook')}</Text>
                            <Text style={styles.sellerCity}>{meal.sellerId?.city}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#A0A0A0" />
                    </TouchableOpacity>

                    {/* Reviews */}
                    <View style={styles.reviewsHeader}>
                        <Text style={styles.sectionTitle}>Reviews ({reviews.length})</Text>
                    </View>
                    
                    {reviews.length > 0 ? (
                        reviews.map((review, index) => (
                            <View key={index} style={styles.reviewCard}>
                                <Image source={{ uri: review.userId?.profileImage }} style={styles.reviewerImage} />
                                <View style={styles.reviewContent}>
                                    <View style={styles.reviewMain}>
                                        <Text style={styles.reviewerName}>{review.userId?.firstName} {review.userId?.lastName}</Text>
                                        <View style={styles.reviewRating}>
                                            <Ionicons name="star" size={12} color="#FFD700" />
                                            <Text style={styles.reviewRatingText}>{review.rating}</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.reviewComment}>{review.comment}</Text>
                                    {review.reviewPhoto && (
                                        <Image source={{ uri: review.reviewPhoto }} style={styles.reviewPhoto} />
                                    )}
                                </View>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.noReviews}>No reviews yet. Be the first to review!</Text>
                    )}

                    {/* Add Review */}
                    <Text style={styles.sectionTitle}>Add a Review</Text>
                    
                    {/* Star Rating Selection */}
                    <View style={styles.starRow}>
                        {[1,2,3,4,5].map(star => (
                            <TouchableOpacity key={star} onPress={() => setReviewRating(star)}>
                                <Ionicons 
                                    name={star <= reviewRating ? "star" : "star-outline"} 
                                    size={30} 
                                    color={star <= reviewRating ? "#FFD700" : "#D1D1D1"} 
                                />
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.addReviewContainer}>
                        <TextInput 
                            style={styles.reviewInput}
                            placeholder="Write a review..."
                            value={reviewText}
                            onChangeText={setReviewText}
                            multiline
                        />
                    </View>

                    {/* Image Upload for Review */}
                    <TouchableOpacity style={styles.reviewImagePicker} onPress={pickReviewImage}>
                        {reviewImage ? (
                            <Image source={{ uri: reviewImage }} style={styles.reviewImagePreview} />
                        ) : (
                            <View style={styles.pickerPlaceholder}>
                                <Ionicons name="camera" size={24} color="#30C65A" />
                                <Text style={styles.pickerText}>Add Meal Photo</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.postButton, (!reviewImage || reviewRating === 0) && styles.disabledPostButton]}
                        onPress={handlePostReview}
                        disabled={postingReview || !reviewImage || reviewRating === 0}
                    >
                        {postingReview ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={styles.postButtonText}>Post Review</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Bottom Order Bar */}
            <View style={styles.bottomBar}>
                <View style={styles.quantityContainer}>
                    <TouchableOpacity 
                        style={styles.qtyBtn}
                        onPress={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                        <Ionicons name="remove" size={20} color="#1A1C1E" />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{quantity}</Text>
                    <TouchableOpacity 
                        style={styles.qtyBtn}
                        onPress={() => setQuantity(Math.min(meal.availableQuantity, quantity + 1))}
                    >
                        <Ionicons name="add" size={20} color="#1A1C1E" />
                    </TouchableOpacity>
                </View>
                <TouchableOpacity 
                    style={styles.orderButton}
                    onPress={() => router.push({
                        pathname: '/OrderScreen' as any,
                        params: { 
                            id: meal._id,
                            quantity: quantity
                        }
                    })}
                >
                    <Text style={styles.orderButtonText}>Order Now</Text>
                </TouchableOpacity>
            </View>

            {/* Order Confirmation Modal */}
            <Modal
                visible={showOrderModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowOrderModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalIcon}>
                            <Ionicons name="cart" size={40} color="#30C65A" />
                        </View>
                        <Text style={styles.modalTitle}>Confirm Order</Text>
                        <Text style={styles.modalMessage}>
                            Are you sure you want to order {quantity} portion(s) of {meal.mealName}?
                        </Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity 
                                style={[styles.modalBtn, styles.cancelBtn]} 
                                onPress={() => setShowOrderModal(false)}
                            >
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalBtn, styles.confirmBtn]} 
                                onPress={handleOrder}
                            >
                                <Text style={styles.confirmBtnText}>Confirm</Text>
                            </TouchableOpacity>
                        </View>
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
    scrollContent: {
        paddingBottom: 100,
    },
    imageContainer: {
        width: '100%',
        height: 300,
        backgroundColor: '#F5F6FA',
    },
    heroImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    backButton: {
        position: 'absolute',
        top: 20,
        left: 20,
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    wishlistBtn: {
        position: 'absolute',
        top: 20,
        right: 20,
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailsContainer: {
        padding: 20,
        marginTop: -30,
        backgroundColor: '#FFF',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    titleInfo: {
        flex: 1,
        marginRight: 15,
    },
    mealName: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#1A1C1E',
        marginBottom: 8,
    },
    metaInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F7F8F9',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        marginRight: 10,
    },
    ratingText: {
        marginLeft: 4,
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1A1C1E',
    },
    typeBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    typeText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    priceContainer: {
        alignItems: 'flex-end',
    },
    priceLabel: {
        fontSize: 12,
        color: '#A0A0A0',
        marginBottom: 2,
    },
    priceValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FF6F00',
    },
    configContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#FBFBFC',
        padding: 15,
        borderRadius: 20,
        marginBottom: 25,
    },
    configItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    configText: {
        marginLeft: 8,
        fontSize: 13,
        color: '#7F8C8D',
        fontWeight: '500',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1A1C1E',
        marginBottom: 12,
        marginTop: 10,
    },
    description: {
        fontSize: 15,
        color: '#7F8C8D',
        lineHeight: 24,
        marginBottom: 25,
    },
    sellerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 15,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#FFEEDD',
        marginBottom: 30,
        shadowColor: '#FF6F00',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    sellerImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    sellerInfo: {
        flex: 1,
        marginLeft: 15,
    },
    sellerName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1A1C1E',
    },
    sellerCity: {
        fontSize: 14,
        color: '#A0A0A0',
    },
    reviewsHeader: {
        marginTop: 10,
    },
    reviewCard: {
        flexDirection: 'row',
        padding: 15,
        backgroundColor: '#F9FAFB',
        borderRadius: 20,
        marginBottom: 15,
    },
    reviewerImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    reviewContent: {
        flex: 1,
        marginLeft: 12,
    },
    reviewMain: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    reviewerName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1A1C1E',
    },
    reviewRating: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    reviewRatingText: {
        marginLeft: 3,
        fontSize: 12,
        fontWeight: 'bold',
        color: '#1A1C1E',
    },
    reviewComment: {
        fontSize: 14,
        color: '#7F8C8D',
        lineHeight: 20,
    },
    reviewPhoto: {
        width: '100%',
        height: 150,
        borderRadius: 15,
        marginTop: 10,
    },
    noReviews: {
        textAlign: 'center',
        color: '#A0A0A0',
        fontStyle: 'italic',
        marginVertical: 10,
    },
    addReviewContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    reviewInput: {
        flex: 1,
        backgroundColor: '#F7F8F9',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        marginRight: 10,
        fontSize: 14,
        maxHeight: 100,
    },
    postButton: {
        backgroundColor: '#FF6F00',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 15,
    },
    postButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    disabledPostButton: {
        backgroundColor: '#D1D1D1',
    },
    starRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginVertical: 10,
    },
    reviewImagePicker: {
        width: '100%',
        height: 150,
        backgroundColor: '#F5FFF7',
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#30C65A',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        overflow: 'hidden',
    },
    reviewImagePreview: {
        width: '100%',
        height: '100%',
    },
    pickerPlaceholder: {
        alignItems: 'center',
    },
    pickerText: {
        marginTop: 5,
        color: '#30C65A',
        fontWeight: 'bold',
        fontSize: 12,
    },
    bottomBar: {
        position: 'absolute',
        bottom: 100,
        left: 20,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 15,
        borderRadius: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F6FA',
        borderRadius: 15,
        padding: 5,
        marginRight: 15,
    },
    qtyBtn: {
        width: 35,
        height: 35,
        borderRadius: 10,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    qtyText: {
        paddingHorizontal: 15,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1A1C1E',
    },
    orderButton: {
        flex: 1,
        backgroundColor: '#FF6F00',
        height: 50,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    orderButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '85%',
        backgroundColor: '#FFF',
        borderRadius: 30,
        padding: 25,
        alignItems: 'center',
    },
    modalIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#E8F9EE',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1A1C1E',
        marginBottom: 10,
    },
    modalMessage: {
        fontSize: 16,
        color: '#7F8C8D',
        textAlign: 'center',
        marginBottom: 25,
        lineHeight: 22,
    },
    modalButtons: {
        flexDirection: 'row',
        width: '100%',
    },
    modalBtn: {
        flex: 1,
        height: 55,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelBtn: {
        backgroundColor: '#F5F6FA',
        marginRight: 10,
    },
    confirmBtn: {
        backgroundColor: '#30C65A',
        marginLeft: 10,
    },
    cancelBtnText: {
        color: '#7F8C8D',
        fontWeight: 'bold',
        fontSize: 16,
    },
    confirmBtnText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default MealDetailsScreen;
