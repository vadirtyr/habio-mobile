package co.ourorbit.wear;

import com.OurOrbit.app.R;

import android.Manifest;
import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
import android.widget.Toast;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.util.Base64;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

public class NotificationActionReceiver extends BroadcastReceiver {
    static final String ACTION_COMPLETE = "co.ourorbit.wear.action.COMPLETE";
    static final String ACTION_SNOOZE = "co.ourorbit.wear.action.SNOOZE";
    static final String ACTION_SHOW_SNOOZED = "co.ourorbit.wear.action.SHOW_SNOOZED";

    static final String EXTRA_NOTIFICATION_ID = "notification_id";
    static final String EXTRA_ITEM_ID = "item_id";
    static final String EXTRA_ITEM_TYPE = "item_type";
    static final String EXTRA_TITLE = "title";
    static final String EXTRA_BODY = "body";
    static final String EXTRA_COMPLETE_PATH = "complete_path";
    static final String EXTRA_REQUIRES_PHONE = "requires_phone";

    private static final String API_BASE = "https://api.habioapp.co/api";
    private static final String PREFS = "ourorbit_wear";
    private static final String TOKEN_KEY = "encrypted_token";
    private static final String TOKEN_IV_KEY = "token_iv";
    private static final String KEY_ALIAS = "ourorbit_wear_token_key";
    private static final long SNOOZE_MS = 30L * 60L * 1000L;

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();
        if (ACTION_COMPLETE.equals(action)) {
            completeItem(context, intent);
        } else if (ACTION_SNOOZE.equals(action)) {
            snoozeItem(context, intent);
        } else if (ACTION_SHOW_SNOOZED.equals(action)) {
            showNotification(context, intent);
        }
    }

    private void completeItem(Context context, Intent intent) {
        String path = sanitize(intent.getStringExtra(EXTRA_COMPLETE_PATH));
        boolean requiresPhone = intent.getBooleanExtra(EXTRA_REQUIRES_PHONE, false);
        int notificationId = intent.getIntExtra(EXTRA_NOTIFICATION_ID, 0);
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);

        if (requiresPhone || path.isEmpty()) {
            openApp(context, intent);
            return;
        }

        String token = readStoredToken(context);
        if (token.isEmpty()) {
            toast(context, "Pair watch");
            openApp(context, intent);
            return;
        }

        if (manager != null) manager.cancel(notificationId);
        new Thread(() -> {
            int status = postComplete(path, token);
            boolean ok = status >= 200 && status < 300;
            if (status == 401) clearStoredToken(context);
            toast(context, ok ? "Completed" : "Unable to complete");
            if (ok) {
                ComplicationUpdateHelper.requestAll(context);
                TileUpdateHelper.requestAll(context);
                MainActivity.refreshOpenActivity();
            }
            if (!ok) openApp(context, intent);
        }).start();
    }

    private void snoozeItem(Context context, Intent intent) {
        int notificationId = intent.getIntExtra(EXTRA_NOTIFICATION_ID, 0);
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) manager.cancel(notificationId);

        Intent snoozed = new Intent(context, NotificationActionReceiver.class)
            .setAction(ACTION_SHOW_SNOOZED)
            .putExtras(intent);
        PendingIntent pendingIntent = PendingIntent.getBroadcast(
            context,
            notificationId + 30,
            snoozed,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager != null) {
            alarmManager.set(
                AlarmManager.RTC_WAKEUP,
                System.currentTimeMillis() + SNOOZE_MS,
                pendingIntent
            );
            toast(context, "Snoozed 30 min");
        } else {
            toast(context, "Snooze unavailable");
        }
    }

    private void showNotification(Context context, Intent intent) {
        if (Build.VERSION.SDK_INT >= 33 && context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            return;
        }
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return;
        createNotificationChannel(manager);

        int notificationId = intent.getIntExtra(EXTRA_NOTIFICATION_ID, 0);
        String title = sanitize(intent.getStringExtra(EXTRA_TITLE));
        String body = sanitize(intent.getStringExtra(EXTRA_BODY));
        boolean requiresPhone = intent.getBooleanExtra(EXTRA_REQUIRES_PHONE, false);
        String completePath = sanitize(intent.getStringExtra(EXTRA_COMPLETE_PATH));
        boolean canComplete = !requiresPhone && !completePath.isEmpty();

        PendingIntent openIntent = openPendingIntent(context, intent, notificationId);
        Notification.Builder builder = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            ? new Notification.Builder(context, MainActivity.CHANNEL_REMINDERS)
            : new Notification.Builder(context);
        builder
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title.isEmpty() ? "OurOrbit" : title)
            .setContentText(body.isEmpty() ? "Reminder" : body)
            .setContentIntent(openIntent)
            .setAutoCancel(true)
            .setShowWhen(true);

        if (canComplete) {
            builder.addAction(new Notification.Action.Builder(
                R.mipmap.ic_launcher,
                "Complete",
                actionPendingIntent(context, ACTION_COMPLETE, intent, notificationId)
            ).build());
        }
        builder.addAction(new Notification.Action.Builder(
            R.mipmap.ic_launcher,
            "Snooze",
            actionPendingIntent(context, ACTION_SNOOZE, intent, notificationId)
        ).build());
        builder.addAction(new Notification.Action.Builder(
            R.mipmap.ic_launcher,
            "Open",
            openIntent
        ).build());

        manager.notify(notificationId, builder.build());
    }

    private int postComplete(String path, String token) {
        try {
            URL url = new URL(API_BASE + path);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Authorization", "Bearer " + token);
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setConnectTimeout(12000);
            conn.setReadTimeout(12000);
            conn.setDoOutput(true);
            OutputStream output = conn.getOutputStream();
            output.write("{}".getBytes(StandardCharsets.UTF_8));
            output.close();
            int code = conn.getResponseCode();
            BufferedReader reader = new BufferedReader(new InputStreamReader(
                code >= 200 && code < 300 ? conn.getInputStream() : conn.getErrorStream()
            ));
            while (reader.readLine() != null) {
                // Drain the response without logging it.
            }
            reader.close();
            return code;
        } catch (Exception ex) {
            return 0;
        }
    }

    private PendingIntent actionPendingIntent(Context context, String action, Intent source, int notificationId) {
        Intent intent = new Intent(context, NotificationActionReceiver.class)
            .setAction(action)
            .putExtras(source);
        return PendingIntent.getBroadcast(
            context,
            notificationId + action.hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }

    private PendingIntent openPendingIntent(Context context, Intent source, int notificationId) {
        Intent intent = new Intent(context, MainActivity.class)
            .setAction(MainActivity.ACTION_OPEN_ITEM)
            .putExtra(EXTRA_ITEM_ID, sanitize(source.getStringExtra(EXTRA_ITEM_ID)))
            .putExtra(EXTRA_ITEM_TYPE, sanitize(source.getStringExtra(EXTRA_ITEM_TYPE)));
        return PendingIntent.getActivity(
            context,
            notificationId,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }

    private void openApp(Context context, Intent source) {
        Intent intent = new Intent(context, MainActivity.class)
            .setAction(MainActivity.ACTION_OPEN_ITEM)
            .putExtra(EXTRA_ITEM_ID, sanitize(source.getStringExtra(EXTRA_ITEM_ID)))
            .putExtra(EXTRA_ITEM_TYPE, sanitize(source.getStringExtra(EXTRA_ITEM_TYPE)))
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        context.startActivity(intent);
    }

    private void createNotificationChannel(NotificationManager manager) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationChannel channel = new NotificationChannel(
            MainActivity.CHANNEL_REMINDERS,
            "OurOrbit reminders",
            NotificationManager.IMPORTANCE_DEFAULT
        );
        manager.createNotificationChannel(channel);
    }

    private String readStoredToken(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String encrypted = prefs.getString(TOKEN_KEY, "");
        String iv = prefs.getString(TOKEN_IV_KEY, "");
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
            return "";
        }
    }

    private void clearStoredToken(Context context) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .remove(TOKEN_KEY)
            .remove(TOKEN_IV_KEY)
            .apply();
    }

    private SecretKey getSecretKey() throws Exception {
        KeyStore keyStore = KeyStore.getInstance("AndroidKeyStore");
        keyStore.load(null);
        if (!keyStore.containsAlias(KEY_ALIAS)) throw new IllegalStateException("Missing watch key");
        return ((KeyStore.SecretKeyEntry) keyStore.getEntry(KEY_ALIAS, null)).getSecretKey();
    }

    private String sanitize(String value) {
        if (value == null) return "";
        String clean = value.trim();
        if (clean.isEmpty()) return "";
        if ("null".equalsIgnoreCase(clean) || "undefined".equalsIgnoreCase(clean)) return "";
        return clean;
    }

    private void toast(Context context, String message) {
        Toast.makeText(context, message, Toast.LENGTH_SHORT).show();
    }
}
