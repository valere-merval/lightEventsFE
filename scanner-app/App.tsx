import React, {useState} from 'react'
import {SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080/api'

export default function App() {
    const [token, setToken] = useState('')
    const [qrCode, setQrCode] = useState('')
    const [result, setResult] = useState('Scanner prêt. Collez un QR code ou branchez expo-barcode-scanner.')

    async function checkIn() {
        try {
            const res = await fetch(`${API_URL}/events/check-in`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json', 'X-LightEvents-Token': token},
                body: JSON.stringify({qrCode})
            })
            const body = await res.json()
            if (!res.ok) throw new Error(body.message ?? 'Erreur check-in')
            setResult(`✅ Check-in validé pour ${body.fullName}. Un QR déjà checked-in sera refusé par le backend.`)
        } catch (e: unknown) {
            setResult(`❌ ${e instanceof Error ? e.message : 'Erreur inconnue'}`)
        }
    }

    return <SafeAreaView style={styles.root}><Text style={styles.logo}>✦ LightEventsScann</Text><Text
        style={styles.text}>Application organisateur pour scanner les QR tickets et faire le check-in.</Text><TextInput
        style={styles.input} value={token} onChangeText={setToken} placeholder="Organizer token"/><TextInput
        style={styles.input} value={qrCode} onChangeText={setQrCode} placeholder="QR code ticket"/><TouchableOpacity
        style={styles.button} onPress={checkIn}><Text style={styles.buttonText}>Valider
        check-in</Text></TouchableOpacity><View style={styles.card}><Text>{result}</Text></View></SafeAreaView>
}
const styles = StyleSheet.create({
    root: {flex: 1, padding: 24, backgroundColor: '#080711', justifyContent: 'center'},
    logo: {fontSize: 28, fontWeight: '900', color: '#ffd166', marginBottom: 10},
    text: {color: '#e5e7eb', marginBottom: 24},
    input: {backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 12},
    button: {backgroundColor: '#ff7a1a', borderRadius: 999, padding: 16, alignItems: 'center'},
    buttonText: {fontWeight: '900', color: '#211000'},
    card: {marginTop: 18, padding: 16, borderRadius: 18, backgroundColor: '#fff'}
})
