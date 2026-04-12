import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, SafeAreaView, Image, ActivityIndicator, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';

const EditMealScreen = () => {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    // Form states
    const [mealName, setMealName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Lunch');
    const [mealType, setMealType] = useState('non-veg');
    const [price, setPrice] = useState('');
    const [portionSize, setPortionSize] = useState('Normal');
    const [availableQuantity, setAvailableQuantity] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const [existingImage, setExistingImage] = useState<string | null>(null);

    useEffect(() => {
        const fetchMealDetails = async () => {
            try {
                const storedToken = Platform.OS === 'web'
                    ? localStorage.getItem('userToken')
                    : await SecureStore.getItemAsync('userToken');

                const token = storedToken ? String(storedToken) : null;

                if (!token) {
                    Alert.alert("Error", "Session expired.");
                    router.push('/SellerLoginScreen');
                    return;
                }


                const response = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/meals/mine`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (response.data.success) {
                    const meal = response.data.meals.find((m: any) => m._id === id);
                    if (meal) {
                        setMealName(meal.mealName);
                        setDescription(meal.description);
                        setCategory(meal.category);
                        setMealType(meal.mealType);
                        setPrice(meal.price.toString());
                        setPortionSize(meal.portionSize);
                        setAvailableQuantity(meal.availableQuantity.toString());
                        setExistingImage(meal.image);
                    } else {
                        Alert.alert("Error", "Meal not found.");
                        router.back();
                    }
                }
            } catch (err) {
                console.error("Error fetching meal:", err);
                Alert.alert("Error", "Failed to load meal details.");
            } finally {
                setFetching(false);
            }
        };

        if (id) fetchMealDetails();
    }, [id]);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert("Permission Denied", "We need access to your gallery to upload images.");
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const handleUpdateMeal = async () => {
        if (!mealName || !description || !price || !availableQuantity) {
            Alert.alert("Error", "Please fill in all required fields.");
            return;
        }

        setLoading(true);

        try {
            const storedToken = Platform.OS === 'web'
                ? localStorage.getItem('userToken')
                : await SecureStore.getItemAsync('userToken');

            const token = storedToken ? String(storedToken) : null;

            if (!token) {
                Alert.alert("Error", "Session expired.");
                router.push('/SellerLoginScreen');
                return;
            }

            const formData = new FormData();
            formData.append('mealName', mealName);
            formData.append('description', description);
            formData.append('category', category);
            formData.append('mealType', mealType);
            formData.append('price', price);
            formData.append('portionSize', portionSize);
            formData.append('availableQuantity', availableQuantity);

            if (image) {
                if (Platform.OS === 'web') {
                    const response = await fetch(image);
                    const blob = await response.blob();
                    formData.append('image', blob, `meal_${Date.now()}.jpg`);
                } else {
                    const filename = image.split('/').pop();
                    const match = /\.(\w+)$/.exec(filename || '');
                    const type = match ? `image/${match[1]}` : `image`;
                    formData.append('image', { uri: image, name: filename, type } as any);
                }
            }

            const response = await axios.put(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/meals/${id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data.success) {
                Alert.alert("Success", "Meal updated successfully!", [
                    { text: "OK", onPress: () => router.push('/SellerMenuScreen') }
                ]);
            }
        } catch (err: any) {
            console.error("Error updating meal:", err);
            Alert.alert("Error", err.response?.data?.message || "Failed to update meal.");
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#30C65A" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#1A1C1E" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Meal</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                    {image ? (
                        <Image source={{ uri: image }} style={styles.previewImage} />
                    ) : existingImage ? (
                        <Image source={{ uri: existingImage }} style={styles.previewImage} />
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <Ionicons name="camera-outline" size={40} color="#A0A0A0" />
                            <Text style={styles.imageText}>Change Meal Photo</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <View style={styles.form}>
                    <Text style={styles.label}>Meal Name</Text>
                    <TextInput
                        style={styles.input}
                        value={mealName}
                        onChangeText={setMealName}
                    />

                    <Text style={styles.label}>Description</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={description}
                        onChangeText={setDescription}
                        multiline
                    />

                    <View style={styles.row}>
                        <View style={styles.flex1}>
                            <Text style={styles.label}>Price (LKR)</Text>
                            <TextInput
                                style={styles.input}
                                value={price}
                                onChangeText={setPrice}
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={styles.flex1}>
                            <Text style={styles.label}>Quantity</Text>
                            <TextInput
                                style={styles.input}
                                value={availableQuantity}
                                onChangeText={setAvailableQuantity}
                                keyboardType="numeric"
                            />
                        </View>
                    </View>

                    <Text style={styles.label}>Category</Text>
                    <View style={styles.chipRow}>
                        {['Breakfast', 'Lunch', 'Dinner'].map(item => (
                            <TouchableOpacity
                                key={item}
                                style={[styles.chip, category === item && styles.activeChip]}
                                onPress={() => setCategory(item)}
                            >
                                <Text style={[styles.chipText, category === item && styles.activeChipText]}>{item}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.label}>Meal Type</Text>
                    <View style={styles.chipRow}>
                        {['veg', 'non-veg'].map(item => (
                            <TouchableOpacity
                                key={item}
                                style={[styles.chip, mealType === item && styles.activeChip]}
                                onPress={() => setMealType(item)}
                            >
                                <Text style={[styles.chipText, mealType === item && styles.activeChipText]}>{item}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.label}>Portion Size</Text>
                    <View style={styles.chipRow}>
                        {['Normal', 'Large'].map(item => (
                            <TouchableOpacity
                                key={item}
                                style={[styles.chip, portionSize === item && styles.activeChip]}
                                onPress={() => setPortionSize(item)}
                            >
                                <Text style={[styles.chipText, portionSize === item && styles.activeChipText]}>{item}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity
                        style={styles.submitButton}
                        onPress={handleUpdateMeal}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.submitButtonText}>Update Meal</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1A1C1E',
    },
    scrollContent: {
        padding: 20,
    },
    imagePicker: {
        width: '100%',
        height: 200,
        borderRadius: 20,
        backgroundColor: '#F5F6FA',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderStyle: 'dashed',
        marginBottom: 20,
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        alignItems: 'center',
    },
    imageText: {
        marginTop: 10,
        color: '#A0A0A0',
        fontSize: 14,
    },
    form: {
        marginTop: 10,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#7F8C8D',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#FAFAFA',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        padding: 15,
        fontSize: 16,
        marginBottom: 20,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    row: {
        flexDirection: 'row',
        gap: 15,
    },
    flex1: {
        flex: 1,
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 25,
    },
    chip: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        backgroundColor: '#F5F6FA',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    activeChip: {
        backgroundColor: '#E8F9EE',
        borderColor: '#30C65A',
    },
    chipText: {
        color: '#7F8C8D',
        fontWeight: '500',
    },
    activeChipText: {
        color: '#30C65A',
    },
    submitButton: {
        backgroundColor: '#30C65A',
        padding: 18,
        borderRadius: 15,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#30C65A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export default EditMealScreen;
