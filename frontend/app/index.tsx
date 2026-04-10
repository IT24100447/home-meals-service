import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Edit app/index.tsx to edit screen.</Text>
      <Link href="/LoginScreen">Go To Login Screen</Link>
      <Link href="/RegisterScreen">Go to Register Screen</Link>
    </View>
  );
}
