package co.ourorbit.wear;

import android.app.Activity;
import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Bundle;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.text.InputType;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Base64;
import java.util.Locale;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

public class MainActivity extends Activity {
    private static final String API_BASE = "https://api.habioapp.co/api";
    private static final String PREFS = "ourorbit_wear";
    private static final String TOKEN_KEY = "encrypted_token";
    private static final String TOKEN_IV_KEY = "token_iv";
    private static final String LEGACY_TOKEN_KEY = "token";
    private static final String KEY_ALIAS = "ourorbit_wear_token_key";

    private LinearLayout root;
    private String token;
    private JSONObject summary;
    private String activeScreen = "today";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        token = readStoredToken();
        if (token == null || token.isEmpty()) {
            renderPairingScreen();
        } else {
            renderShell("Loading...");
            loadSummary();
        }
    }

    private void renderPairingScreen() {
        root = baseRoot();
        TextView title = title("OurOrbit");
        TextView subtitle = muted("Generate a Wear OS pairing code in OurOrbit settings on your phone, then enter it here.");
        EditText input = new EditText(this);
        input.setHint("Pairing code");
        input.setSingleLine(true);
        input.setGravity(Gravity.CENTER);
        input.setTextColor(Color.WHITE);
        input.setHintTextColor(Color.rgb(203, 213, 225));
        input.setTextSize(20);
        input.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS);
        Button pair = actionButton("Pair Watch");
        pair.setOnClickListener(v -> {
            String value = input.getText().toString().trim().toUpperCase(Locale.US);
            if (value.length() < 6) {
                toast("Enter the pairing code");
                return;
            }
            renderShell("Pairing...");
            new PairTask(value).execute();
        });
        root.addView(title);
        root.addView(subtitle);
        root.addView(input);
        root.addView(pair);
        setContentView(scroll(root));
    }

    private void renderShell(String message) {
        root = baseRoot();
        root.addView(title("OurOrbit"));
        root.addView(nav());
        if (message != null) root.addView(muted(message));
        setContentView(scroll(root));
    }

    private LinearLayout nav() {
        LinearLayout nav = new LinearLayout(this);
        nav.setOrientation(LinearLayout.VERTICAL);
        String[] screens = {"today", "habits", "tasks", "projects", "orbits", "notifications"};
        for (String screen : screens) {
            Button button = smallButton(screen.substring(0, 1).toUpperCase() + screen.substring(1));
            button.setOnClickListener(v -> {
                activeScreen = screen;
                renderCurrent();
            });
            nav.addView(button);
        }
        Button refresh = smallButton("Refresh");
        refresh.setOnClickListener(v -> loadSummary());
        nav.addView(refresh);
        return nav;
    }

    private void renderCurrent() {
        root = baseRoot();
        root.addView(title("OurOrbit"));
        root.addView(nav());
        if (summary == null) {
            root.addView(muted("No data loaded yet."));
            setContentView(scroll(root));
            return;
        }

        try {
            if ("habits".equals(activeScreen)) renderItems("Habits", summary.optJSONArray("habits"), "habit");
            else if ("tasks".equals(activeScreen)) renderItems("Tasks", summary.optJSONArray("tasks"), "task");
            else if ("projects".equals(activeScreen)) renderItems("Projects", summary.optJSONArray("projects"), "subtask");
            else if ("orbits".equals(activeScreen)) renderOrbits();
            else if ("notifications".equals(activeScreen)) renderNotifications();
            else renderItems("Today", summary.optJSONArray("today_items"), null);
        } catch (JSONException ex) {
            root.addView(muted("Could not render watch data."));
        }
        setContentView(scroll(root));
    }

    private void renderItems(String heading, JSONArray items, String fallbackType) throws JSONException {
        root.addView(sectionTitle(heading));
        if (items == null || items.length() == 0) {
            root.addView(muted("Nothing waiting. Nice."));
            return;
        }
        for (int i = 0; i < items.length(); i++) {
            JSONObject item = items.getJSONObject(i);
            String type = item.optString("item_type", fallbackType == null ? "" : fallbackType);
            LinearLayout card = card();
            card.addView(label(item.optString("title", item.optString("project_title", "Item"))));
            if (item.has("orbit_name") && !item.optString("orbit_name").isEmpty()) {
                card.addView(muted("Orbit: " + item.optString("orbit_name")));
            }
            if ("habit".equals(type) && item.optInt("weekly_target", 1) > 1) {
                card.addView(muted(item.optInt("weekly_completed_count", 0) + "/" + item.optInt("weekly_target", 1) + " this week"));
            }
            if ("subtask".equals(type)) {
                card.addView(muted("Project: " + item.optString("project_title", "Project")));
            }
            if (item.optBoolean("requires_phone")) {
                Button phone = smallButton("Open on phone");
                phone.setOnClickListener(v -> toast("Proof required. Open OurOrbit on your phone."));
                card.addView(phone);
            } else {
                Button complete = actionButton("Complete");
                complete.setOnClickListener(v -> postComplete(item.optString("complete_path")));
                card.addView(complete);
            }
            root.addView(card);
        }
    }

    private void renderOrbits() throws JSONException {
        root.addView(sectionTitle("Orbit Summary"));
        JSONArray items = summary.optJSONArray("orbits");
        if (items == null || items.length() == 0) {
            root.addView(muted("No Orbits yet."));
            return;
        }
        for (int i = 0; i < items.length(); i++) {
            JSONObject orbit = items.getJSONObject(i);
            LinearLayout card = card();
            card.addView(label(orbit.optString("name", "Orbit")));
            card.addView(muted("Level " + orbit.optInt("level", 1) + " · " + orbit.optInt("xp", 0) + " XP"));
            if (!orbit.isNull("health_score")) card.addView(muted("Health " + orbit.optInt("health_score") + "/100"));
            JSONObject milestone = orbit.optJSONObject("current_milestone");
            if (milestone != null) {
                card.addView(muted("Next: " + milestone.optString("title", "Milestone")));
            }
            JSONArray recent = orbit.optJSONArray("recent_activity");
            if (recent != null && recent.length() > 0) {
                JSONObject latest = recent.optJSONObject(0);
                card.addView(muted("Latest: " + (latest == null ? "activity" : latest.optString("message", latest.optString("type", "activity")))));
            }
            root.addView(card);
        }
    }

    private void renderNotifications() throws JSONException {
        root.addView(sectionTitle("Notifications"));
        JSONArray items = summary.optJSONArray("notifications");
        if (items == null || items.length() == 0) {
            root.addView(muted("No notifications."));
            return;
        }
        for (int i = 0; i < items.length(); i++) {
            JSONObject item = items.getJSONObject(i);
            LinearLayout card = card();
            card.addView(label(item.optString("title", "Notification")));
            card.addView(muted(item.optString("message", "")));
            Button read = smallButton("Mark read");
            read.setOnClickListener(v -> postNotificationRead(item.optString("id")));
            card.addView(read);
            root.addView(card);
        }
    }

    private void loadSummary() {
        new ApiTask("GET", "/watch/summary", null, result -> {
            try {
                summary = new JSONObject(result);
                renderCurrent();
            } catch (JSONException ex) {
                renderShell("Could not read summary.");
            }
        }).execute();
    }

    private void postComplete(String path) {
        if (path == null || path.isEmpty()) {
            toast("No action available");
            return;
        }
        new ApiTask("POST", path, "{}", result -> {
            toast("Completed");
            loadSummary();
        }).execute();
    }

    private void postNotificationRead(String id) {
        if (id == null || id.isEmpty()) return;
        new ApiTask("POST", "/notifications/" + Uri.encode(id) + "/read", "{}", result -> {
            toast("Read");
            loadSummary();
        }).execute();
    }

    private LinearLayout baseRoot() {
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setPadding(18, 18, 18, 18);
        layout.setBackgroundColor(Color.rgb(2, 8, 23));
        return layout;
    }

    private ScrollView scroll(View child) {
        ScrollView scroll = new ScrollView(this);
        scroll.addView(child);
        return scroll;
    }

    private TextView title(String text) {
        TextView view = text(text, 22, Color.WHITE);
        view.setGravity(Gravity.CENTER);
        view.setPadding(0, 0, 0, 10);
        return view;
    }

    private TextView sectionTitle(String text) {
        TextView view = text(text, 18, Color.WHITE);
        view.setPadding(0, 18, 0, 8);
        return view;
    }

    private TextView label(String text) {
        return text(text, 16, Color.WHITE);
    }

    private TextView muted(String text) {
        return text(text, 13, Color.rgb(203, 213, 225));
    }

    private TextView text(String text, int sp, int color) {
        TextView view = new TextView(this);
        view.setText(text);
        view.setTextSize(sp);
        view.setTextColor(color);
        view.setPadding(0, 4, 0, 4);
        return view;
    }

    private LinearLayout card() {
        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setPadding(14, 12, 14, 12);
        card.setBackgroundColor(Color.rgb(17, 24, 39));
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        );
        params.setMargins(0, 0, 0, 10);
        card.setLayoutParams(params);
        return card;
    }

    private Button actionButton(String text) {
        Button button = smallButton(text);
        button.setTextColor(Color.rgb(2, 8, 23));
        button.setBackgroundColor(Color.rgb(96, 165, 250));
        return button;
    }

    private Button smallButton(String text) {
        Button button = new Button(this);
        button.setText(text);
        button.setAllCaps(false);
        button.setTextSize(13);
        return button;
    }

    private void toast(String text) {
        Toast.makeText(this, text, Toast.LENGTH_SHORT).show();
    }

    private String readStoredToken() {
        SharedPreferences prefs = getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String encrypted = prefs.getString(TOKEN_KEY, "");
        String iv = prefs.getString(TOKEN_IV_KEY, "");
        prefs.edit().remove(LEGACY_TOKEN_KEY).apply();

        if (encrypted == null || encrypted.isEmpty() || iv == null || iv.isEmpty()) {
            return "";
        }

        try {
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(
                Cipher.DECRYPT_MODE,
                getOrCreateSecretKey(),
                new GCMParameterSpec(128, Base64.getDecoder().decode(iv))
            );
            byte[] plain = cipher.doFinal(Base64.getDecoder().decode(encrypted));
            return new String(plain, StandardCharsets.UTF_8);
        } catch (Exception ex) {
            clearStoredToken();
            return "";
        }
    }

    private boolean writeStoredToken(String value) {
        try {
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, getOrCreateSecretKey());
            byte[] encrypted = cipher.doFinal(value.getBytes(StandardCharsets.UTF_8));
            getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit()
                .putString(TOKEN_KEY, Base64.getEncoder().encodeToString(encrypted))
                .putString(TOKEN_IV_KEY, Base64.getEncoder().encodeToString(cipher.getIV()))
                .remove(LEGACY_TOKEN_KEY)
                .apply();
            return true;
        } catch (Exception ex) {
            return false;
        }
    }

    private void clearStoredToken() {
        getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .remove(TOKEN_KEY)
            .remove(TOKEN_IV_KEY)
            .remove(LEGACY_TOKEN_KEY)
            .apply();
        token = "";
    }

    private SecretKey getOrCreateSecretKey() throws Exception {
        KeyStore keyStore = KeyStore.getInstance("AndroidKeyStore");
        keyStore.load(null);
        if (keyStore.containsAlias(KEY_ALIAS)) {
            return ((KeyStore.SecretKeyEntry) keyStore.getEntry(KEY_ALIAS, null)).getSecretKey();
        }

        KeyGenerator keyGenerator = KeyGenerator.getInstance(
            KeyProperties.KEY_ALGORITHM_AES,
            "AndroidKeyStore"
        );
        keyGenerator.init(
            new KeyGenParameterSpec.Builder(
                KEY_ALIAS,
                KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT
            )
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setRandomizedEncryptionRequired(true)
                .build()
        );
        return keyGenerator.generateKey();
    }

    private interface ApiCallback {
        void onSuccess(String result);
    }

    private class PairTask extends AsyncTask<Void, Void, String> {
        private final String code;
        private String error;

        PairTask(String code) {
            this.code = code;
        }

        @Override
        protected String doInBackground(Void... voids) {
            try {
                URL url = new URL(API_BASE + "/watch/pairing/exchange");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setConnectTimeout(12000);
                conn.setReadTimeout(12000);
                conn.setDoOutput(true);

                JSONObject body = new JSONObject();
                body.put("code", code);
                OutputStream output = conn.getOutputStream();
                output.write(body.toString().getBytes(StandardCharsets.UTF_8));
                output.close();

                int responseCode = conn.getResponseCode();
                BufferedReader reader = new BufferedReader(new InputStreamReader(
                    responseCode >= 200 && responseCode < 300 ? conn.getInputStream() : conn.getErrorStream()
                ));
                StringBuilder builder = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) builder.append(line);
                reader.close();

                if (responseCode < 200 || responseCode >= 300) {
                    error = pairingError(builder.toString(), responseCode);
                    return null;
                }

                JSONObject result = new JSONObject(builder.toString());
                String newToken = result.optString("token", "");
                if (newToken.isEmpty()) {
                    error = "Pairing failed. Try a new code.";
                    return null;
                }
                return newToken;
            } catch (Exception ex) {
                error = "Could not pair watch.";
                return null;
            }
        }

        @Override
        protected void onPostExecute(String result) {
            if (result == null) {
                toast(error == null ? "Invalid or expired code" : error);
                renderPairingScreen();
                return;
            }

            if (!writeStoredToken(result)) {
                toast("Could not save watch session.");
                renderPairingScreen();
                return;
            }

            token = result;
            activeScreen = "today";
            toast("Watch paired");
            renderShell("Loading...");
            loadSummary();
        }

        private String pairingError(String body, int responseCode) {
            try {
                JSONObject errorBody = new JSONObject(body);
                String detail = errorBody.optString("detail", "");
                if (!detail.isEmpty()) return detail;
            } catch (Exception ignored) {
            }
            if (responseCode == 404 || responseCode == 410) return "Code expired or already used.";
            return "Invalid pairing code.";
        }
    }

    private class ApiTask extends AsyncTask<Void, Void, String> {
        private final String method;
        private final String path;
        private final String body;
        private final ApiCallback callback;
        private String error;

        ApiTask(String method, String path, String body, ApiCallback callback) {
            this.method = method;
            this.path = path;
            this.body = body;
            this.callback = callback;
        }

        @Override
        protected String doInBackground(Void... voids) {
            try {
                URL url = new URL(API_BASE + path);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod(method);
                conn.setRequestProperty("Authorization", "Bearer " + token);
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setConnectTimeout(12000);
                conn.setReadTimeout(12000);
                if (body != null) {
                    conn.setDoOutput(true);
                    OutputStream output = conn.getOutputStream();
                    output.write(body.getBytes());
                    output.close();
                }
                int code = conn.getResponseCode();
                BufferedReader reader = new BufferedReader(new InputStreamReader(
                    code >= 200 && code < 300 ? conn.getInputStream() : conn.getErrorStream()
                ));
                StringBuilder builder = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) builder.append(line);
                reader.close();
                if (code == 401) {
                    clearStoredToken();
                    error = "Session expired. Pair again.";
                    return null;
                }
                if (code < 200 || code >= 300) {
                    error = "Request failed (" + code + ")";
                    return null;
                }
                return builder.toString();
            } catch (Exception ex) {
                error = ex.getMessage();
                return null;
            }
        }

        @Override
        protected void onPostExecute(String result) {
            if (result == null) {
                toast(error == null ? "Network error" : error);
                if (error != null && error.contains("Pair again")) renderPairingScreen();
                return;
            }
            callback.onSuccess(result);
        }
    }
}
