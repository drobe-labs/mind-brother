# Mind Brother QA Testing Checklist

**Version:** 1.0  
**Last Updated:** December 5, 2024  
**Test Environment:** iOS / Android / Web

---

## 🔐 Authentication & Onboarding

### Sign Up Flow
- [ ] Email/password registration works
- [ ] Validation errors display correctly (weak password, invalid email)
- [ ] Confirmation email sends (if enabled)
- [ ] User redirected to dashboard after signup
- [ ] Profile created in database

### Login Flow
- [ ] Email/password login works
- [ ] "Remember me" persists session
- [ ] Incorrect password shows error
- [ ] Forgot password flow works
- [ ] Session persists on app restart

### Logout
- [ ] Logout button works
- [ ] User redirected to login screen
- [ ] Session cleared (can't access protected routes)

---

## 🏠 Dashboard

### Mood Check-In
- [ ] All mood options display (Great, Good, Okay, Not Great, Struggling)
- [ ] Selecting mood saves to database
- [ ] Mood history displays correctly
- [ ] Visual feedback on selection

### Quick Actions
- [ ] "Chat with Amani" navigates correctly
- [ ] "Breathing Exercise" opens module
- [ ] "Quick Workout" opens module
- [ ] All cards are tappable/clickable

### Welcome Message
- [ ] Personalized greeting shows user's name
- [ ] Time-appropriate greeting (morning/afternoon/evening)

---

## 💬 Chat with Amani (Chatbot)

### Basic Conversation
- [ ] Can send a message
- [ ] Response received from Claude AI
- [ ] Response displays in chat bubble
- [ ] Typing indicator shows while waiting
- [ ] Messages scroll to bottom automatically

### Voice Features
- [ ] Voice toggle button visible
- [ ] Enable voice shows play buttons on messages
- [ ] Clicking play button triggers ElevenLabs TTS
- [ ] Audio plays correctly (Amani's voice, not robotic)
- [ ] Audio stops when new audio starts
- [ ] Voice disabled state hides play buttons

### Intent Detection
- [ ] Anxiety-related messages get appropriate responses
- [ ] Depression-related messages handled sensitively
- [ ] Crisis messages trigger safety resources
- [ ] General conversation flows naturally

### Conversation History
- [ ] Messages persist after leaving screen
- [ ] New conversation button clears chat
- [ ] History loads on return to chat

### Error Handling
- [ ] Network error shows friendly message
- [ ] Server timeout handled gracefully
- [ ] Offline state detected and displayed

---

## 🧘 Guided Breathing Module

### Exercise Selection
- [ ] All 8 breathing exercises display
- [ ] Each shows name, description, emoji
- [ ] Cards are square (2x2 grid layout)
- [ ] Brand colors applied correctly

### Breathing Exercise Flow
- [ ] Tap exercise to start
- [ ] Countdown timer accurate
- [ ] Visual breathing circle animates smoothly
- [ ] Circle syncs with inhale/hold/exhale phases
- [ ] Cycle counter increments correctly
- [ ] Phase label changes (Inhale → Hold → Exhale)

### Voice Guidance
- [ ] Voice announces each phase
- [ ] Voice timing matches visual
- [ ] Voice is clear and understandable
- [ ] Volume appropriate

### Completion
- [ ] Exercise completes after set cycles
- [ ] Completion screen shows
- [ ] Can return to exercise selection
- [ ] Stats recorded (if applicable)

---

## 🏋️ Guided Workout Module

### Workout Selection
- [ ] Multiple workouts available
- [ ] Each shows name, duration, intensity
- [ ] Difficulty indicators clear

### Workout Flow
- [ ] Tap workout to start
- [ ] Get ready countdown (3-2-1)
- [ ] Exercise name displays
- [ ] Rep counter counts down correctly
- [ ] Timer accurate and fluid
- [ ] Visual animations smooth

### Voice Guidance
- [ ] Voice announces exercise name
- [ ] Voice counts reps in sync with display
- [ ] "Rest" announcement at break
- [ ] Voice not blocking timer updates
- [ ] Encouragement phrases play

### Rest Periods
- [ ] Rest countdown appears between exercises
- [ ] Rest duration appropriate
- [ ] "Next up" preview shows

### Completion
- [ ] Workout completion screen shows
- [ ] Summary stats display
- [ ] Can return to workout selection

---

## 📊 Progress & Stats

### Daily Streak
- [ ] Streak counter displays
- [ ] Increments on daily check-in
- [ ] Resets after missed day (if applicable)

### Mood History
- [ ] Chart shows past moods
- [ ] Date range selector works
- [ ] Trends visible

### Activity Log
- [ ] Breathing sessions logged
- [ ] Workout sessions logged
- [ ] Chat sessions logged

---

## 👤 Profile Screen

### User Info
- [ ] Name displays correctly
- [ ] Email displays correctly
- [ ] Avatar/photo shows (if uploaded)

### Settings
- [ ] Edit profile works
- [ ] Notification preferences save
- [ ] Theme/appearance settings work
- [ ] Privacy settings accessible

### Account Actions
- [ ] Change password works
- [ ] Delete account (if available)
- [ ] Logout button works

---

## 🔔 Notifications

### Permission Request
- [ ] App requests notification permission on first launch
- [ ] Permission denial handled gracefully

### Scheduled Notifications
- [ ] Daily reminder sends at set time
- [ ] Notification opens app to correct screen
- [ ] Badge count updates

### Push Notifications
- [ ] Real-time notifications receive (if applicable)
- [ ] Notification sound plays
- [ ] Tap navigates to relevant screen

---

## 📱 Platform-Specific Testing

### iOS
- [ ] Safe area insets respected (notch/Dynamic Island)
- [ ] Keyboard doesn't cover input fields
- [ ] Back gestures work
- [ ] App icon displays correctly
- [ ] Splash screen shows

### Android
- [ ] Back button works correctly
- [ ] Keyboard behavior correct
- [ ] Status bar styling correct
- [ ] App icon displays correctly
- [ ] Splash screen shows

### Web
- [ ] Responsive on mobile viewport
- [ ] Responsive on tablet viewport
- [ ] Responsive on desktop viewport
- [ ] Keyboard navigation works

---

## 🌐 Network & Offline

### Connectivity
- [ ] App works on WiFi
- [ ] App works on cellular (mobile)
- [ ] Slow network shows loading states
- [ ] Fast network feels responsive

### Offline Behavior
- [ ] Offline indicator shows
- [ ] Cached content accessible
- [ ] Queue actions for sync (if applicable)
- [ ] Graceful degradation

---

## 🔒 Security & Privacy

### Data Protection
- [ ] Passwords not visible in inputs
- [ ] Sensitive data not logged to console
- [ ] HTTPS used for all API calls
- [ ] Auth tokens stored securely

### Session Security
- [ ] Session expires appropriately
- [ ] Can't access protected routes without auth
- [ ] Token refresh works

---

## ⚡ Performance

### Load Times
- [ ] App launches in < 3 seconds
- [ ] Dashboard loads in < 2 seconds
- [ ] Chat response in < 5 seconds
- [ ] Voice audio starts in < 2 seconds

### Animations
- [ ] 60fps on breathing animations
- [ ] No jank on scrolling
- [ ] Smooth page transitions

### Memory
- [ ] No memory leaks on navigation
- [ ] App doesn't crash after extended use
- [ ] Background/foreground transitions smooth

---

## 🐛 Edge Cases

### Empty States
- [ ] No messages shows placeholder
- [ ] No mood history shows placeholder
- [ ] No workouts completed shows placeholder

### Long Content
- [ ] Long messages wrap correctly
- [ ] Long usernames truncate
- [ ] Scrolling works with lots of content

### Rapid Actions
- [ ] Double-tap send doesn't duplicate
- [ ] Rapid navigation doesn't break state
- [ ] Multiple voice plays don't overlap

---

## ✅ Sign-Off

| Tester | Platform | Date | Status |
|--------|----------|------|--------|
| | iOS Simulator | | |
| | iPhone (physical) | | |
| | Android Emulator | | |
| | Android (physical) | | |
| | Web (Chrome) | | |
| | Web (Safari) | | |
| | Web (Firefox) | | |

---

## 📝 Bug Report Template

**Title:** [Brief description]

**Environment:**
- Platform: iOS / Android / Web
- Device: [e.g., iPhone 15, Pixel 7, Chrome 120]
- App Version: [version number]

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Result:**

**Actual Result:**

**Screenshots/Video:**

**Console Errors:**
```
[paste any errors here]
```

---

## 🚀 Release Checklist

### Pre-Release
- [ ] All critical bugs fixed
- [ ] All QA tests passing
- [ ] Performance benchmarks met
- [ ] Security review complete

### App Store (iOS)
- [ ] App icon (1024x1024)
- [ ] Screenshots (all device sizes)
- [ ] App description written
- [ ] Privacy policy URL
- [ ] App Review information

### Play Store (Android)
- [ ] App icon (512x512)
- [ ] Feature graphic (1024x500)
- [ ] Screenshots (phone + tablet)
- [ ] App description
- [ ] Privacy policy URL
- [ ] Content rating questionnaire


