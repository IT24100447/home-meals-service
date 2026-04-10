import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useState } from 'react';
import { Link } from 'expo-router';
import  axios  from 'axios'


function LoginScreen(){

    const[email, setEmail] = useState('');
    const[password, setPassword] = useState('');
    const[loading, setLoading] = useState(false)

    const handleLogin = async () => {
        if(!email || !password){  //Validation
          Alert.alert("Please Fill in all the fields");
          return;
        }
    

    setLoading(true);

    try{
      const response = await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/api/user/login`, {
        email: email,
        password: password
      });

      if(response.status === 200){
        Alert.alert("Welcome!")
        console.log("User Data:",response.data);
      }
    }catch(err){
      console.log("Error Login: ",err);
      Alert.alert("Error Login","Invalid Email and Password");
    }finally{
      setLoading(false);
    }
    };

    return(
        <View style={styles.container}>
            <Text style={styles.logo}>Home Meal Bites</Text>

            <View style={styles.inputCard}>
                <Text style={styles.label}>Email</Text>
                <TextInput 
                style={styles.input}
                placeholder=''
                value={email}
                onChangeText={setEmail}/>

                <Text style={styles.label}>Password</Text>
                <TextInput
                placeholder=''
                secureTextEntry
                style={styles.input}
                value={password}
                onChangeText={setPassword}/>

                <TouchableOpacity style={styles.button} onPress={handleLogin}>
                    <Text style={styles.buttonText}>Log in</Text>
                </TouchableOpacity>

                 <Link href="/RegisterScreen" style={styles.registerLink}> No Acoount? Register Here</Link>

            </View>
        </View>
    )
}

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    backgroundColor: '#F5F6FA',
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    fontSize: 40,
    fontFamily: "sans-serif",
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
    color: '#CC1B1B', 
  },
  inputCard: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 15,
    elevation: 5, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
  },
  label: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DCDDE1',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#CC1B1B',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  registerLink: {
    textAlign: 'center',
    color:"#87CEEB",
    marginTop: 5, }
});

export default LoginScreen;