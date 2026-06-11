// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
//
// Google Sign-In configuration + helper for the OurOrbit mobile app.
//
// Flow:
//  1. configureGoogleSignIn() is called once at app startup (see app/_layout.tsx).
//  2. signInWithGoogle() launches the native Google Sign-In sheet, retrieves an
//     ID token, and POSTs it to the backend at `/auth/google`.
//  3. The backend verifies the ID token, auto-creates the user if needed, and
//     returns `{ token, user }` which the caller passes to `AuthContext.login`.

import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { Platform } from "react-native";

import { api } from "./api";

// Public OAuth client IDs (safe to ship in the mobile binary – Google validates
// the audience server-side against the backend's allow-list).
export const GOOGLE_WEB_CLIENT_ID =
  "492365850026-7kom0bgo08pmpbnqto19r1ibkel4n56i.apps.googleusercontent.com";

export const GOOGLE_IOS_CLIENT_ID =
  "492365850026-q5lqeuuf2nntalar82bocakdalsk4n68.apps.googleusercontent.com";

let configured = false;

export function configureGoogleSignIn() {
  if (configured) return;

  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: Platform.OS === "ios" ? GOOGLE_IOS_CLIENT_ID : undefined,
    offlineAccess: false,
    scopes: ["profile", "email"],
  });

  configured = true;
}

function extractIdToken(result) {
  if (!result) return null;
  if (result.data?.idToken) return result.data.idToken;
  if (result.idToken) return result.idToken;
  if (result.data?.user?.idToken) return result.data.user.idToken;
  return null;
}

export async function signInWithGoogle() {
  configureGoogleSignIn();

  try {
    await GoogleSignin.hasPlayServices({
      showPlayServicesUpdateDialog: true,
    });

    try {
      await GoogleSignin.signOut();
    } catch {
      // ignore – nothing to sign out from
    }

    const result = await GoogleSignin.signIn();
    const idToken = extractIdToken(result);

    if (!idToken) {
      throw new Error("Google did not return an ID token. Please try again.");
    }

    const data = await api.post("/auth/google", { id_token: idToken });
    return { cancelled: false, data };
  } catch (error) {
    const code = error?.code;
    if (
      code === statusCodes.SIGN_IN_CANCELLED ||
      code === statusCodes.IN_PROGRESS
    ) {
      return { cancelled: true };
    }
    if (code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error("Google Play Services is not available on this device.");
    }
    throw error;
  }
}

export async function googleSignOut() {
  try {
    if (configured) {
      await GoogleSignin.signOut();
    }
  } catch {
    // best-effort – ignore failures
  }
}
