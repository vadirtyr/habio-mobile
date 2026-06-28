package co.ourorbit.wear;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

class WearSummaryClient {
    private static final String API_BASE = "https://api.habioapp.co/api";
    private static final String PREFS = "ourorbit_wear";
    private static final String SUMMARY_CACHE_KEY = "watch_summary_cache";

    static JSONObject fetchSummary(Context context) {
        String token = WearStorage.readToken(context);
        if (token.isEmpty()) return null;

        try {
            URL url = new URL(API_BASE + "/watch/summary");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("Authorization", "Bearer " + token);
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(10000);

            int code = conn.getResponseCode();
            BufferedReader reader = new BufferedReader(new InputStreamReader(
                code >= 200 && code < 300 ? conn.getInputStream() : conn.getErrorStream()
            ));
            StringBuilder builder = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) builder.append(line);
            reader.close();

            if (code == 401) {
                WearStorage.clearToken(context);
                return null;
            }
            if (code < 200 || code >= 300) return null;
            JSONObject payload = new JSONObject(builder.toString());
            cacheSummary(context, payload);
            return payload;
        } catch (Exception ex) {
            return null;
        }
    }

    static JSONObject fetchSummaryOrCache(Context context) {
        JSONObject fresh = fetchSummary(context);
        if (fresh != null) return fresh;
        return cachedSummary(context);
    }

    static JSONObject cachedSummary(Context context) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            String cached = prefs.getString(SUMMARY_CACHE_KEY, "");
            if (cached == null || cached.isEmpty()) return null;
            return new JSONObject(cached);
        } catch (Exception ex) {
            return null;
        }
    }

    private static void cacheSummary(Context context, JSONObject payload) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .putString(SUMMARY_CACHE_KEY, payload.toString())
            .apply();
    }
}
