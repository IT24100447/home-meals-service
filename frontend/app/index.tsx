import { Link } from "expo-router";
import { Text, View, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  return (
    <SafeAreaView style={styles.container}>
      
      <View style={styles.optionsCard}>
        <Link href="/StudentLoginScreen" asChild>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>I am a Student</Text>
          </TouchableOpacity>
        </Link>

        <Link href="/SellerLoginScreen" asChild>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>I am a Seller</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F6FA",
    justifyContent: "center",
    padding: 20,
  },

  optionsCard: {
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 15,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
  },
  button: {
    backgroundColor: "#F79A19",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});

