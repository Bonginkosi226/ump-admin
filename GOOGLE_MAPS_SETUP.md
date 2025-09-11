# Google Maps Setup Guide

This application uses Google Maps to display interactive campus maps. To enable this functionality, you need to set up a Google Maps API key.

## Getting Your Free Google Maps API Key

Google provides **$200 worth of free monthly credit** (approximately 28,500 map loads per month) for Google Maps Platform.

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Create a new project or select an existing one
4. Note your project ID for later use

### Step 2: Enable the Maps JavaScript API

1. In the Google Cloud Console, go to **APIs & Services > Library**
2. Search for "Maps JavaScript API"
3. Click on it and press **Enable**
4. Optionally, also enable these APIs for enhanced functionality:
   - Places API (for location search)
   - Geocoding API (for address conversion)
   - Routes API (for directions)

### Step 3: Create an API Key

1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > API Key**
3. Copy the generated API key
4. **Important**: Restrict your API key for security:
   - Click on the API key to edit it
   - Under "Application restrictions", select "HTTP referrers"
   - Add your domain (e.g., `localhost:5173/*` for development)
   - Under "API restrictions", select "Restrict key" and choose the APIs you enabled

### Step 4: Configure the Application

1. Open `src/components/GoogleMap.jsx`
2. Find this line:
   ```javascript
   const googleMapsApiKey = apiKey || 'YOUR_GOOGLE_MAPS_API_KEY_HERE';
   ```
3. Replace `'YOUR_GOOGLE_MAPS_API_KEY_HERE'` with your actual API key:
   ```javascript
   const googleMapsApiKey = apiKey || 'AIzaSyBFw0Qbyq9zTFTd-tUY6dkS4oINtVKR3-g';
   ```

### Step 5: Test the Integration

1. Start the development server: `npm run dev`
2. Navigate to the Campus Map or Paths section
3. You should now see interactive Google Maps instead of error messages

## Security Best Practices

- **Never commit your API key to version control**
- Use environment variables for production deployments
- Set up proper API key restrictions
- Monitor your usage in the Google Cloud Console
- Set up billing alerts to avoid unexpected charges

## Alternative: Using Environment Variables

For better security, you can use environment variables:

1. Create a `.env` file in the project root:
   ```
   VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
   ```

2. Update `GoogleMap.jsx`:
   ```javascript
   const googleMapsApiKey = apiKey || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY_HERE';
   ```

3. Add `.env` to your `.gitignore` file

## Troubleshooting

- **"This page didn't load Google Maps correctly"**: Check your API key and ensure the Maps JavaScript API is enabled
- **Quota exceeded**: You've exceeded the free tier limits
- **Referer denied**: Your domain is not authorized in the API key restrictions
- **Maps not loading**: Check browser console for specific error messages

## Cost Information

- **Free tier**: $200 monthly credit (≈28,500 map loads)
- **After free tier**: $7 per 1,000 map loads
- **Dynamic Maps**: $7 per 1,000 loads
- **Static Maps**: $2 per 1,000 loads

For most small to medium applications, the free tier is sufficient.

## Support

For more detailed information, visit the [Google Maps Platform Documentation](https://developers.google.com/maps/documentation).