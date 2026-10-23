# Implementation Plan — Multi-Device Responsiveness, Custom Map Pin & Chat Theme Images, and Snap It Overhaul

Transform Love Link into an adaptive, multi-device experience (smartphone, tablet, desktop PC) with custom image uploads for Map Pins and Chat Themes, and an overhauled, fully working camera and gallery workflow for Snap It.

---

## 1. User Choices & Design Alignment

*   **Responsive Layout Architecture**: Full responsive adaptation. Instead of constraining the application to a narrow `max-w-md` mobile container on large displays, the layout will adapt into a desktop/tablet-optimized interface featuring an ergonomic navigation sidebar, multi-column grid dashboard, and wide-screen canvases for Chat, Maps, and Playhouse.
*   **Photo Capture & Upload Strategy**: Camera capture (`MediaDevices.getUserMedia` + HTML5 file input with `capture="environment"` fallback) and gallery selection with fast client-side canvas compression (~800×800 WebP/JPEG, ~50–80KB) for instant sync across devices.
*   **Chat Themes Engine**: Curated romantic preset wallpapers (Cloud Sunset, Starlight Constellation, Royal Rose Gold, Celestial Galaxy) plus custom couple photo background upload with adjustable opacity and blur.

---

## 2. Architecture & Key Changes

### Component 1: Multi-Device Responsive Layout System
*   **Layout Container in `src/App.tsx`**:
    *   Transition outer wrapper from static `max-w-md mx-auto` to responsive container (`w-full min-h-screen lg:flex lg:flex-row bg-[#FFF8FA] dark:bg-slate-950`).
    *   On desktop/tablet (`lg:`), introduce a responsive **Sidebar Navigation** (`src/components/SidebarNav.tsx`) with active theme styling, partner connection radar, quick actions, and route links.
    *   Maintain `BottomNav` on mobile (`<lg`), automatically hidden on desktop where `SidebarNav` is active.
    *   Update key views (`HomeScreen`, `ChatScreen`, `LoveMapScreen`, `MemoriesScreen`) with responsive grid/flex layouts (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3` where appropriate).

### Component 2: Custom Image Uploads for Map Pins
*   **In `src/screens/LoveMapScreen.tsx`**:
    *   Add **"Upload from Gallery"** and **"Take Photo"** buttons in the `Add Special Place` modal alongside existing preset choices.
    *   Implement client-side image compression via canvas utility (`compressImageFile`) producing clean, fast base64 image strings.
    *   Render custom uploaded photos in both the in-map `InfoWindow` and the interactive bottom preview tooltip.

### Component 3: Chat Themes & Custom Wallpaper Customization
*   **In `src/screens/ChatScreen.tsx` & `src/contexts/ThemeContext.tsx`**:
    *   Add a **Chat Appearance / Theme Sheet** accessed via the palette icon in the chat header.
    *   Provide romantic preset wallpapers (Blush Romance, Moonlight Sky, Royal Gold, Nebula Dreams) and an **"Upload Couple Wallpaper"** button (gallery/camera).
    *   Store the couple's active chat wallpaper persistently in couple space / local storage.
    *   Render message bubbles and timestamps with accessible contrast over wallpapers using subtle frosted glass backdrops.

### Component 4: Snap It UI/UX Overhaul & Camera/Gallery Fix
*   **In `src/components/widgets/QuickSnapModal.tsx` & `src/components/widgets/QuickSnapWidget.tsx`**:
    *   Refactor camera stream lifecycle: support front/back flip, graceful camera permission fallback, and instant device gallery picker (`<input type="file" accept="image/*">`).
    *   Streamlined interactive snap editor:
        *   Image preview with filters/stickers and caption text with contrast pill.
        *   Expiry timer selector (5m, 15m, 1h, 3h, 24h).
        *   Fast compression before saving to `coupleSpaces/{spaceId}/quickSnaps/active`.
    *   Responsive viewing modal supporting fullscreen touch on mobile and floating modal on tablet/desktop.

---

## 3. Verification & Validation Plan

### Verification Steps
1.  **TypeScript & Build Health**: Run `npm run lint` (`tsc --noEmit`) and `compile_applet` (`npm run build`) to ensure 0 type errors.
2.  **Multi-Device Viewport Testing**: Verify responsive styling across mobile (375px–430px), tablet (768px–1024px), and desktop (1280px–1920px).
3.  **Map Pin Image Upload Test**: Verify dropping a pin with custom gallery image compresses quickly and appears on the map.
4.  **Chat Wallpaper Test**: Verify selecting preset wallpapers or uploading a custom background renders cleanly in chat with readable text.
5.  **Snap It Workflow Test**: Open camera, switch to gallery, capture/select an image, add caption, and send to active widget.
