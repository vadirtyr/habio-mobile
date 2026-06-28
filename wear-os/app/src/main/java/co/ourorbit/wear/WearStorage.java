package co.ourorbit.wear;

import android.content.Context;
import android.content.SharedPreferences;

import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.util.Base64;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

class WearStorage {
    private static final String PREFS = "ourorbit_wear";
    private static final String TOKEN_KEY = "encrypted_token";
    private static final String TOKEN_IV_KEY = "token_iv";
    private static final String LEGACY_TOKEN_KEY = "token";
    private static final String KEY_ALIAS = "ourorbit_wear_token_key";

    static String readToken(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String encrypted = prefs.getString(TOKEN_KEY, "");
        String iv = prefs.getString(TOKEN_IV_KEY, "");
        prefs.edit().remove(LEGACY_TOKEN_KEY).apply();
        if (encrypted == null || encrypted.isEmpty() || iv == null || iv.isEmpty()) return "";

        try {
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(
                Cipher.DECRYPT_MODE,
                getSecretKey(),
                new GCMParameterSpec(128, Base64.getDecoder().decode(iv))
            );
            byte[] plain = cipher.doFinal(Base64.getDecoder().decode(encrypted));
            return new String(plain, StandardCharsets.UTF_8);
        } catch (Exception ex) {
            clearToken(context);
            return "";
        }
    }

    static void clearToken(Context context) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .remove(TOKEN_KEY)
            .remove(TOKEN_IV_KEY)
            .remove(LEGACY_TOKEN_KEY)
            .apply();
    }

    private static SecretKey getSecretKey() throws Exception {
        KeyStore keyStore = KeyStore.getInstance("AndroidKeyStore");
        keyStore.load(null);
        if (!keyStore.containsAlias(KEY_ALIAS)) throw new IllegalStateException("Missing watch key");
        return ((KeyStore.SecretKeyEntry) keyStore.getEntry(KEY_ALIAS, null)).getSecretKey();
    }
}
