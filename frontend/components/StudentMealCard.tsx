import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StudentMealCardProps {
    meal: {
        id: string;
        mealName: string;
        price: number;
        image: string;
        rating: number;
        sellerName: string;
        sellerImage: string;
        isWishlisted?: boolean;
    };
    onPress?: () => void;
    onWishlistToggle?: () => void;
}

const StudentMealCard = ({ meal, onPress, onWishlistToggle }: StudentMealCardProps) => {
    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
            <View style={styles.imageContainer}>
                <Image source={{ uri: meal.image }} style={styles.image} />
                <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={12} color="#FFD700" />
                    <Text style={styles.ratingText}>{meal.rating}</Text>
                </View>
                <TouchableOpacity 
                    style={styles.wishlistHeart} 
                    onPress={(e) => {
                        e.stopPropagation();
                        onWishlistToggle?.();
                    }}
                >
                    <Ionicons 
                        name={meal.isWishlisted ? "heart" : "heart-outline"} 
                        size={20} 
                        color={meal.isWishlisted ? "#E74C3C" : "#A0A0A0"} 
                    />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <Text style={styles.title} numberOfLines={1}>{meal.mealName}</Text>

                <View style={styles.footer}>
                    <View style={styles.sellerInfo}>
                        <Image
                            source={{ uri: meal.sellerImage || 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=60' }}
                            style={styles.sellerImage}
                        />
                        <Text style={styles.sellerName} numberOfLines={1}>{meal.sellerName}</Text>
                    </View>
                    <Text style={styles.price}>Rs.{meal.price.toFixed(2)}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 25,
        width: 220,
        marginRight: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        overflow: 'hidden',
    },
    imageContainer: {
        width: '100%',
        height: 150,
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    ratingBadge: {
        position: 'absolute',
        top: 10,
        left: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 4,
        color: '#1A1C1E',
    },
    wishlistHeart: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    content: {
        padding: 15,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1A1C1E',
        marginBottom: 10,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sellerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    sellerImage: {
        width: 28,
        height: 28,
        borderRadius: 14,
        marginRight: 8,
    },
    sellerName: {
        fontSize: 14,
        color: '#676767',
        flex: 1,
    },
    price: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#30C65A',
    },
});

export default StudentMealCard;
