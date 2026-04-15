import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity, Image, Platform, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const LOCATIONS = ['Colombo', 'Kandy', 'Galle', 'Negombo', 'Jaffna'];

const EditProfileScreen = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [user, setUser] = useState<any>(null);
    
    // Form fields
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [city, setCity] = useState('');
    const [address, setAddress] = useState('');
    const [businessName, setBusinessName] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const [imageChanged, setImageChanged] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = Platform.OS === 'web' ? localStorage.getItem('userToken') : await SecureStore.getItemAsync('userToken');
                const res = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/users/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data.success) {
                    const u = res.data.user;
                    setUser(u);
                    setFirstName(u.firstName || '');
                    setLastName(u.lastName || '');
                    setPhoneNumber(u.phoneNumber || '');
                    setCity(u.city || '');
                    setAddress(u.address || '');
                    setBusinessName(u.businessName || '');
                    setDescription(u.description || '');
                    setImage(u.profileImage);
                }
            } catch (err) {
                console.error("Error fetching profile:", err);
            } finally {
                setFetching(false);
            }
        };
        fetchProfile();
    }, []);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert("Permission Required", "Please allow gallery access to change your picture.");
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
            setImageChanged(true);
        }
    };

    const handleSave = async () => {
        if (!firstName || !lastName || !phoneNumber || !city) {
            Alert.alert("Error", "Please fill out all required fields.");
            return;
        }

        setLoading(true);
        try {
            const token = Platform.OS === 'web' ? localStorage.getItem('userToken') : await SecureStore.getItemAsync('userToken');
            const formData = new FormData();
            
            formData.append('firstName', firstName);
            formData.append('lastName', lastName);
            formData.append('phoneNumber', phoneNumber);
            formData.append('city', city);
            formData.append('address', address);
            
            if (user?.role === 'seller') {
                formData.append('businessName', businessName);
                formData.append('description', description);
            }

            if (imageChanged && image) {
                if (Platform.OS === 'web') {
                    const response = await fetch(image);
                    const blob = await response.blob();
                    formData.append('profileImage', blob, `profile_${Date.now()}.jpg`);
                } else {
                    const filename = image.split('/').pop() || 'photo.jpg';
                    const match = /\.(\w+)$/.exec(filename);
                    const type = match ? `image/${match[1]}` : `image/jpeg`;
                    formData.append('profileImage', { uri: image, name: filename, type } as any);
                }
            }

            const res = await axios.put(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/users/profile`, formData, {
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}` 
                }
            });

            if (res.data.success) {
                // Update local storage
                const updatedUser = res.data.user;
                if (Platform.OS === 'web') {
                    localStorage.setItem('userData', JSON.stringify(updatedUser));
                } else {
                    await SecureStore.setItemAsync('userData', JSON.stringify(updatedUser));
                }
                Alert.alert("Success", "Profile updated successfully!");
                router.back();
            }
        } catch (err: any) {
            console.error(err);
            Alert.alert("Error", err.response?.data?.message || "Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#30C65A" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#1A1C1E" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.imageSection}>
                    <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
                        <Image 
                            source={{ uri: image || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=60' }} 
                            style={styles.profileImg} 
                        />
                        <View style={styles.cameraIcon}>
                            <Ionicons name="camera" size={20} color="#FFF" />
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={styles.form}>
                    <View style={styles.row}>
                        <View style={styles.flex1}>
                            <Text style={styles.label}>First Name</Text>
                            <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="First Name" />
                        </View>
                        <View style={styles.flex1}>
                            <Text style={styles.label}>Last Name</Text>
                            <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="Last Name" />
                        </View>
                    </View>

                    <Text style={styles.label}>Phone Number</Text>
                    <TextInput style={styles.input} value={phoneNumber} onChangeText={setPhoneNumber} placeholder="07XXXXXXXX" keyboardType="phone-pad" />

                    <Text style={styles.label}>City</Text>
                    <View style={styles.cityRow}>
                        {LOCATIONS.map(c => (
                            <TouchableOpacity key={c} style={[styles.cityChip, city === c && styles.activeCityChip]} onPress={() => setCity(c)}>
                                <Text style={[styles.cityChipText, city === c && styles.activeCityChipText]}>{c}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.label}>Address</Text>
                    <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Street Address" />

                    {user?.role === 'seller' && (
                        <>
                            <Text style={styles.label}>Business/Kitchen Name</Text>
                            <TextInput style={styles.input} value={businessName} onChangeText={setBusinessName} placeholder="E.g., Ama's Kitchen" />

                            <Text style={styles.label}>Short Description</Text>
                            <TextInput style={[styles.input, { height: 80 }]} value={description} onChangeText={setDescription} placeholder="Describe your cooking style..." multiline />
                        </>
                    )}

                    <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
                        {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
    backBtn: { width: 40, height: 40, justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1C1E' },
    content: { padding: 20, paddingBottom: 50 },
    imageSection: { alignItems: 'center', marginBottom: 30 },
    imageContainer: { position: 'relative' },
    profileImg: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#F0F0F0' },
    cameraIcon: { position: 'absolute', bottom: 5, right: 5, backgroundColor: '#30C65A', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#FFF' },
    form: { gap: 15 },
    row: { flexDirection: 'row', gap: 15 },
    flex1: { flex: 1 },
    label: { fontSize: 14, fontWeight: '600', color: '#7F8C8D', marginBottom: 5 },
    input: { backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#EEE', borderRadius: 12, padding: 15, fontSize: 15, color: '#1A1C1E' },
    cityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    cityChip: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, backgroundColor: '#F0F0F0' },
    activeCityChip: { backgroundColor: '#E8F9EE', borderWidth: 1, borderColor: '#30C65A' },
    cityChipText: { color: '#7F8C8D', fontSize: 14 },
    activeCityChipText: { color: '#30C65A', fontWeight: 'bold' },
    saveBtn: { backgroundColor: '#30C65A', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 20 },
    saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});

export default EditProfileScreen;
