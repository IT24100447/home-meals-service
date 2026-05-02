import { Link } from "expo-router";
import { Text, View, TouchableOpacity, StyleSheet, ScrollView, Image, ImageBackground } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function Index() {
  return (
    <ImageBackground source={require('../assets/images/background-doodles.png')} style={styles.container} imageStyle={styles.imagePattern} resizeMode="cover">
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Image source={require('../assets/images/homebites-logo.png')} style={styles.logoImage} />
              </View>
              <Text style={styles.title}>HomeBites</Text>
              <Text style={styles.subtitle}>Delicious homemade Meals</Text>
            </View>

            <View style={styles.optionsContainer}>
              <Text style={styles.selectionTitle}>Select your role</Text>

              <Link href="/StudentLoginScreen" asChild>
                <TouchableOpacity style={styles.primaryButton}>
                  <View style={styles.buttonContent}>
                    <Ionicons name="school-outline" size={24} color="#FFF" />
                    <Text style={styles.buttonText}>I am a Student</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={24} color="#FFF" />
                </TouchableOpacity>
              </Link>

              <View style={{ height: 20 }} />

              <Link href="/SellerLoginScreen" asChild>
                <TouchableOpacity style={styles.primaryButton}>
                  <View style={styles.buttonContent}>
                    <Ionicons name="storefront-outline" size={24} color="#FFF" />
                    <Text style={styles.buttonText}>I am a Seller</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={24} color="#FFF" />
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
        <Text style={styles.footerText}>Version 1.0.0</Text>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  safeArea: {
    flex: 1,
  },
  imagePattern: {
    opacity: 0.32,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  content: {
    padding: 30,
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  logoImage: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
  },
  title: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 38,
    color: "#28b851ff",
    marginBottom: 5,
  },
  subtitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: "#7F8C8D",
    textAlign: "center",
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  optionsContainer: {
    width: '100%',
    maxWidth: 400,
    paddingTop: 10,
  },
  selectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#A0A0A0",
    textAlign: "center",
    marginBottom: 25,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  primaryButton: {
    flexDirection: "row",
    backgroundColor: "#30C65A",
    paddingVertical: 20,
    paddingHorizontal: 25,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    shadowColor: "#30C65A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 18,
    marginLeft: 15,
  },
  footerText: {
    textAlign: "center",
    color: "#E0E0E0",
    marginBottom: 20,
    fontSize: 12,
  }
});

