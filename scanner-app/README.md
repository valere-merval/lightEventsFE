# LightEventsScann

React Native / Expo scanner app skeleton for organizers.

The backend endpoint `POST /api/events/check-in` prevents double check-in: a QR code already scanned returns a conflict.

## Next steps

```bash
npm install
EXPO_PUBLIC_API_URL=https://api.your-domain.com/api npm run android
```

Replace the manual QR input with `expo-barcode-scanner` camera flow when building the production mobile app.
