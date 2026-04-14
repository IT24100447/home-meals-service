import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const PostReviewScreen = () => {
    const router = useRouter();
    const { mealId, sellerId, orderId, mealName } = useLocalSearchParams();
    
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const pickImage = async () => {
        const result = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (result.granted === false) {
            alert("Permission to access camera roll is required!");
            return;
        }

        let pickerResult = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!pickerResult.canceled) {
            setImage(pickerResult.assets[0].uri);
        }
    };

    const handlePostReview = async () => {
        if (rating === 0) {
            Alert.alert("Required", "Please select a rating.");
            return;
        }
        if (!image) {
            Alert.alert("Required", "Please upload a photo of your meal to post a review.");
            return;
        }

        setLoading(true);
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
            formData.append('sellerId', sellerId as string || '');
            formData.append('mealId', mealId as string || '');
            formData.append('orderId', orderId as string || '');
            formData.append('rating', rating.toString());
            formData.append('comment', comment);
            
            // Handle image upload
            if (image) {
                const filename = image.split('/').pop();
                const match = /\.(\w+)$/.exec(filename || '');
                const type = match ? `image/${match[1]}` : `image`;
                
                // For web, we might need a different approach, but for mobile:
                if (Platform.OS !== 'web') {
                    formData.append('reviewPhoto', {
                        uri: image,
                        name: filename,
                        type,
                    } as any);
                } else {
                    // Web handling
                    const response = await fetch(image);
                    const blob = await response.blob();
                    formData.append('reviewPhoto', blob, filename);
                }
            }

            const response = await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/reviews/post-review`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 201) {
                Alert.alert("Success", "Review posted successfully!");
                router.back();
            }
        } catch (error: any) {
            console.error("Error posting review:", error);
            Alert.alert("Error", error.response?.data?.message || "Failed to post review. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const renderStars = () => {
        return (
            <View style={styles.starContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity key={star} onPress={() => setRating(star)}>
                        <Ionicons 
                            name={star <= rating ? "star" : "star-outline"} 
                            size={40} 
                            color={star <= rating ? "#FFD700" : "#D1D1D1"} 
                        />
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#1A1C1E" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Post Review</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.mealNameLabel}>{mealName}</Text>
                <Text style={styles.sectionTitle}>Rate your experience</Text>
                {renderStars()}

                <Text style={styles.sectionTitle}>Add a comment</Text>
                <TextInput
                    style={styles.commentInput}
                    placeholder="Tell us what you liked or how we can improve..."
                    multiline
                    numberOfLines={4}
                    value={comment}
                    onChangeText={setComment}
                />

                <Text style={styles.sectionTitle}>Upload Proof Photo (Required)</Text>
                <TouchableOpacity style={styles.uploadContainer} onPress={pickImage}>
                    {image ? (
                        <Image source={{ uri: image }} style={styles.previewImage} />
                    ) : (
                        <View style={styles.placeholderBox}>
                            <Ionicons name="camera-outline" size={40} color="#30C65A" />
                            <Text style={styles.uploadText}>Upload Meal Photo</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.postBtn, (!image || rating === 0) && styles.disabledBtn]} 
                    onPress={handlePostReview}
                    disabled={!image || rating === 0 || loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.postBtnText}>Post Review</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    header: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5'
    },
    backBtn: { padding: 5 },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    scrollContent: { padding: 20 },
    mealNameLabel: { fontSize: 20, fontWeight: '800', color: '#30C65A', marginBottom: 20, textAlign: 'center' },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1A1C1E', marginTop: 20, marginBottom: 10 },
    starContainer: { flexDirection: 'row', justifyContent: 'center', marginVertical: 10 },
    commentInput: {
        backgroundColor: '#F9F9F9',
        borderRadius: 15,
        padding: 15,
        fontSize: 14,
        color: '#1A1C1E',
        textAlignVertical: 'top',
        minHeight: 120,
        borderWidth: 1,
        borderColor: '#EEEEEE'
    },
    uploadContainer: {
        width: '100%',
        height: 200,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#30C65A',
        borderStyle: 'dashed',
        marginTop: 10,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5FFF7'
    },
    placeholderBox: { alignItems: 'center' },
    uploadText: { marginTop: 10, color: '#30C65A', fontWeight: 'bold' },
    previewImage: { width: '100%', height: '100%' },
    postBtn: {
        backgroundColor: '#30C65A',
        paddingVertical: 18,
        borderRadius: 15,
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 20,
        shadowColor: '#30C65A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5
    },
    disabledBtn: {
        backgroundColor: '#D1D1D1',
        shadowOpacity: 0
    },
    postBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});

export default PostReviewScreen;
