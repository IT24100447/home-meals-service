import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SellerCardProps {
    seller: {
        id: string;
        name: string;
        description: string;
        image: string;
        rating: number;
    };
    onPress?: () => void;
}

const SellerCard = ({ seller, onPress }: SellerCardProps) => {
    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
            <Image 
                source={{ uri: seller.image || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=60' }} 
                style={styles.image} 
            />
            <View style={styles.content}>
                <Text style={styles.name}>{seller.name}</Text>
                <Text style={styles.description} numberOfLines={1}>{seller.description}</Text>
                <View style={styles.ratingInfo}>
                    <Ionicons name="star" size={14} color="#FFD700" />
                    <Text style={styles.ratingText}>{seller.rating}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        alignItems: 'center',
    },
    image: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#F5F6FA',
    },
    content: {
        flex: 1,
        marginLeft: 15,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1A1C1E',
        marginBottom: 2,
    },
    description: {
        fontSize: 12,
        color: '#7F8C8D',
        marginBottom: 5,
    },
    ratingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#1A1C1E',
        marginLeft: 4,
    },
});

export default SellerCard;
