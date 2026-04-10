# Testing Guide - WaveFinder Milestone 4

## 🚀 Quick Start Testing

### Step 1: Verify Servers Are Running

**Check Terminal Output:**
- ✅ Client should show: `Local: http://localhost:5175/` (or similar port)
- ✅ Server should show: `🚀 Server running on http://localhost:3002`

**If servers aren't running:**
```powershell
npm run dev
```

### Step 2: Open the Application

1. Open your browser: **http://localhost:5175** (or the port shown in terminal)
2. You should see the **Landing Page** or be redirected to **Login**

---

## 🔐 Test 1: Login Functionality (Main Fix)

### Test Credentials

| Role | Email | Password |
|------|-------|----------|
| **User** | `user@wavefinder.com` | `User123!` |
| Admin | `admin@wavefinder.com` | `Admin123!` |
| Business | `business@wavefinder.com` | `Business123!` |
| WaveLeader | `waveleader@wavefinder.com` | `WaveLeader123!` |

### Steps:
1. Navigate to `/login` (or click "Login" on landing page)
2. Enter credentials:
   - Email: `user@wavefinder.com`
   - Password: `User123!`
3. Click "Sign In"
4. **Expected Result:**
   - ✅ No 404 errors in browser console
   - ✅ Successful login
   - ✅ Redirected to `/dashboard`
   - ✅ User dashboard loads

### Check Browser Console:
- ❌ Should NOT see: `Failed to load resource: 404 (Not Found)`
- ❌ Should NOT see: `ERR_CONNECTION_REFUSED`
- ✅ Should see successful API calls to `/api/auth/login`

---

## 📊 Test 2: User Dashboard

### What to Test:

1. **Dashboard Overview** (`/dashboard`)
   - ✅ Welcome message with user name
   - ✅ Four stat cards showing:
     - Total Check-ins
     - Reward Points
     - Bookings
     - Favorites
   - ✅ Map widget on the left showing nearby places
   - ✅ "Upcoming Bookings" card on the right
   - ✅ "Recent Activity" timeline at the bottom

2. **Sidebar Navigation**
   - ✅ All menu items visible:
     - Dashboard
     - Explore Map
     - My Places
     - Bookings
     - Digital Passport
     - Communities
     - Rewards
     - Settings
   - ✅ Active route is highlighted
   - ✅ Sidebar collapses/expands (desktop)
   - ✅ Mobile menu works (hamburger icon)

3. **Header**
   - ✅ Search bar visible
   - ✅ Notification bell with badge
   - ✅ User avatar dropdown menu

---

## 🗺️ Test 3: Explore Map

### Steps:
1. Click "Explore Map" in sidebar (or navigate to `/dashboard/map`)
2. **Expected:**
   - ✅ Full-screen map loads
   - ✅ Sidebar with tabs: Explore, My Places, WaveLeaders, Events
   - ✅ Business markers visible on map
   - ✅ Filters work (type, rating, verified)

3. **Test Map Interactions:**
   - ✅ Click a business marker → Popup appears
   - ✅ Popup shows:
     - Business name, type, rating
     - "View Details" button
     - "Get Directions" button
     - ❤️ Favorite button (heart icon)
     - 📍 Check In button

4. **Test Favorites:**
   - ✅ Click heart icon on a business popup
   - ✅ Heart fills (becomes favorite)
   - ✅ Click again → Heart unfills (removed from favorites)

5. **Test Sidebar Tabs:**
   - ✅ "My Places" tab shows your favorites
   - ✅ Can toggle favorite from sidebar list

---

## ❤️ Test 4: My Places (Favorites)

### Steps:
1. Navigate to `/dashboard/places`
2. **Expected Layout:**
   - ✅ Two-column layout (list left, map right)
   - ✅ Tabs: "Favorites" and "Visited"
   - ✅ Search bar at top
   - ✅ Sort dropdown (Recent, Name, Rating, Distance)
   - ✅ Filter by type

3. **Favorites Tab:**
   - ✅ Shows businesses you've favorited
   - ✅ Each place card shows:
     - Business image
     - Name and verified badge
     - Type badge
     - Rating
     - Distance (if location enabled)
     - Action buttons (Favorite, Check In, Directions)

4. **Test Actions:**
   - ✅ Click "Remove" (heart icon) → Removes from favorites
   - ✅ Click "Check In" → Opens check-in flow
   - ✅ Click "Get Directions" → Opens Google Maps

5. **Visited Tab:**
   - ✅ Shows businesses you've checked into
   - ✅ Shows "Last visited" date
   - ✅ Shows check-in count if visited multiple times

---

## 📍 Test 5: Check-In System

### Prerequisites:
- Enable location in browser when prompted
- Be physically near a business (or use browser dev tools to mock location)

### Steps:
1. Go to `/dashboard/map` or `/dashboard/places`
2. Find a business marker or card
3. Click "Check In" button
4. **Expected Flow:**

   **If location is enabled and you're in range:**
   - ✅ Button shows "Checking in..." (loading state)
   - ✅ Success modal appears with:
     - Stamp animation
     - Points earned (e.g., "+10 points")
     - Total points
     - Streak (if applicable)
   - ✅ "View Passport" button
   - ✅ "Continue Exploring" button

   **If too far away:**
   - ✅ Button shows distance (e.g., "150m away")
   - ✅ Button is disabled
   - ✅ Tooltip or message explains you need to be closer

   **If already checked in today:**
   - ✅ Button shows "Already Checked In"
   - ✅ Button is disabled

5. **After successful check-in:**
   - ✅ Dashboard stats update (check-ins count increases)
   - ✅ Points increase
   - ✅ New stamp appears in Digital Passport

---

## 🎫 Test 6: Digital Passport

### Steps:
1. Navigate to `/dashboard/passport`
2. **Expected Layout:**

   **Top Section (Two Columns):**
   - ✅ **Left:** Passport Card showing:
     - User avatar
     - Name
     - "Member Since" date
     - Passport ID (e.g., "WF-XXXX-XXXX")
     - QR code
     - Level badge (Bronze/Silver/Gold/Platinum)
     - Check-ins count
     - Total points
   
   - ✅ **Right:** Stats & Recent Stamps
     - Stats cards (Total Check-ins, Points, Level)
     - Recent stamps grid (last 6 check-ins)

   **Bottom Section:**
   - ✅ Full-width map showing all check-in locations
   - ✅ Custom "stamp" markers for each check-in
   - ✅ Timeline slider to filter by date range
   - ✅ "Your Journey" path connecting stamps chronologically

3. **Test Interactions:**
   - ✅ Click a stamp marker → Shows business info
   - ✅ Move timeline slider → Filters visible stamps
   - ✅ QR code is scannable (contains passport data)

---

## 👤 Test 7: Profile Page

### Steps:
1. Navigate to `/dashboard/profile`
2. **Expected Sections:**

   **Profile Header:**
   - ✅ Cover image (or placeholder)
   - ✅ Avatar with "Edit" button
   - ✅ User name (editable)
   - ✅ "Member Since" date
   - ✅ Level badge
   - ✅ "Edit Profile" button

   **Profile Sections (Cards):**
   - ✅ **Personal Information:**
     - First name, last name (editable)
     - Phone (editable)
     - Bio (editable)
     - Email (read-only with verified badge)
   
   - ✅ **Statistics:**
     - Check-ins count
     - Places visited
     - Reviews written
     - WaveLeader bookings
     - Points earned
     - Member level
   
   - ✅ **Communities:**
     - List of joined communities
     - Community badges
     - "Browse Communities" link
   
   - ✅ **Recent Reviews:**
     - Last 3 reviews
     - Star rating
     - Business name
     - Comment excerpt
     - "View All Reviews" link

3. **Test Editing:**
   - ✅ Click "Edit Profile"
   - ✅ Change name, phone, or bio
   - ✅ Click "Save"
   - ✅ Success toast appears
   - ✅ Changes are saved

4. **Test Avatar Upload:**
   - ✅ Click avatar "Edit" button
   - ✅ Select image file
   - ✅ Avatar updates
   - ✅ Success message appears

---

## ⚙️ Test 8: Settings Page

### Steps:
1. Navigate to `/dashboard/settings`
2. **Expected Tabs:**
   - ✅ Account
   - ✅ Privacy
   - ✅ Notifications
   - ✅ Preferences
   - ✅ Connected Accounts

3. **Test Each Tab:**

   **Account Tab:**
   - ✅ Change password form
   - ✅ Email preferences toggles
   - ✅ Delete account button (with confirmation)

   **Privacy Tab:**
   - ✅ Profile visibility (Public/Private)
   - ✅ Show check-in history toggle
   - ✅ Allow location tracking toggle
   - ✅ Data export request button

   **Notifications Tab:**
   - ✅ Email notification toggles:
     - Booking confirmations
     - Booking reminders
     - Promotional offers
     - Weekly digest
   - ✅ Push notification toggles:
     - Nearby deals
     - Check-in reminders
     - New WaveLeaders

   **Preferences Tab:**
   - ✅ Default map view (Map/Satellite/Hybrid)
   - ✅ Distance unit (Miles/Kilometers)
   - ✅ Theme (Dark/Light/System)
   - ✅ Language selector

4. **Test Saving:**
   - ✅ Change a setting
   - ✅ Settings are saved (no error)
   - ✅ Success message appears

---

## 🔍 Test 9: Browser Console Checks

### Open Browser DevTools (F12)

**Check for Errors:**
- ❌ No red errors in Console
- ❌ No 404 errors for API calls
- ❌ No CORS errors
- ❌ No React errors

**Check Network Tab:**
- ✅ API calls go to `/api/*` (not direct to port 3001)
- ✅ API responses are 200 (success) or 401 (unauthorized)
- ✅ No failed requests

**Check Application Tab:**
- ✅ LocalStorage has:
  - `accessToken`
  - `refreshToken`
  - `user` (user data)

---

## 🐛 Troubleshooting

### Issue: Login returns 404
**Solution:**
- ✅ Check server is running on port 3002
- ✅ Check Vite proxy config in `client/vite.config.ts`
- ✅ Hard refresh browser (Ctrl+Shift+R)

### Issue: Map doesn't load
**Solution:**
- ✅ Check Mapbox token in `client/.env`
- ✅ Check browser console for Mapbox errors
- ✅ Verify internet connection (Mapbox requires internet)

### Issue: Check-in doesn't work
**Solution:**
- ✅ Allow location permission in browser
- ✅ Check you're within 100m of business
- ✅ Check browser console for errors
- ✅ Verify check-in API endpoint is working

### Issue: Favorites don't save
**Solution:**
- ✅ Check you're logged in
- ✅ Check browser console for API errors
- ✅ Verify favorites API endpoint is working

---

## ✅ Success Criteria

All tests pass if:
- ✅ Login works without errors
- ✅ Dashboard loads with correct data
- ✅ Map displays and interactions work
- ✅ Favorites can be added/removed
- ✅ Check-ins work with geofencing
- ✅ Passport shows all check-ins
- ✅ Profile can be edited
- ✅ Settings can be changed
- ✅ No console errors
- ✅ All API calls succeed

---

## 📝 Quick Test Checklist

Print this checklist and check off as you test:

- [ ] Login works
- [ ] Dashboard loads
- [ ] Sidebar navigation works
- [ ] Explore Map loads
- [ ] Can add/remove favorites
- [ ] Check-in works (in range)
- [ ] Check-in shows "too far" when appropriate
- [ ] Digital Passport shows stamps
- [ ] Profile page loads
- [ ] Can edit profile
- [ ] Settings page loads
- [ ] Can change settings
- [ ] My Places shows favorites
- [ ] My Places shows visited places
- [ ] No console errors
- [ ] All API calls succeed

---

**Happy Testing! 🎉**

