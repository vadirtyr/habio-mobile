package co.ourorbit.wear;

import com.OurOrbit.app.R;

import android.Manifest;
import android.app.Activity;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.os.Build;
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
import java.util.ArrayList;
import java.util.Base64;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

public class MainActivity extends Activity {
    private static final String API_BASE = "https://api.habioapp.co/api";
    static final String ACTION_OPEN_ITEM = "co.ourorbit.wear.action.OPEN_ITEM";
    static final String ACTION_OPEN_SCREEN = "co.ourorbit.wear.action.OPEN_SCREEN";
    static final String EXTRA_SCREEN = "screen";
    static final String CHANNEL_REMINDERS = "ourorbit_reminders";
    private static final String PREFS = "ourorbit_wear";
    private static final String TOKEN_KEY = "encrypted_token";
    private static final String TOKEN_IV_KEY = "token_iv";
    private static final String LEGACY_TOKEN_KEY = "token";
    private static final String THEME_ID_KEY = "theme_id";
    private static final String KEY_ALIAS = "ourorbit_wear_token_key";

    private static MainActivity activeActivity;

    private LinearLayout root;
    private String token;
    private JSONObject summary;
    private String activeScreen = "today";
    private String activeMode = "list";
    private JSONObject selectedItem;
    private String selectedType;
    private String pendingOpenId;
    private String pendingOpenType;
    private WatchTheme theme;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        createNotificationChannel();
        requestNotificationPermission();
        theme = themeForId(getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(THEME_ID_KEY, "light"));
        token = readStoredToken();
        captureOpenIntent(getIntent());
        if (token == null || token.isEmpty()) {
            renderPairingScreen();
        } else {
            renderShell("Loading...");
            loadSummary();
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        activeActivity = this;
    }

    @Override
    protected void onPause() {
        if (activeActivity == this) activeActivity = null;
        super.onPause();
    }

    static void refreshOpenActivity() {
        MainActivity activity = activeActivity;
        if (activity == null) return;
        activity.runOnUiThread(activity::loadSummary);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        captureOpenIntent(intent);
        if (token == null || token.isEmpty()) {
            renderPairingScreen();
        } else if (summary == null) {
            loadSummary();
        } else {
            openPendingItemIfPossible();
        }
    }

    @Override
    public void onBackPressed() {
        if ("detail".equals(activeMode)) {
            activeMode = "list";
            selectedItem = null;
            selectedType = null;
            renderCurrent();
            return;
        }
        if (!"today".equals(activeScreen)) {
            activeScreen = "today";
            renderCurrent();
            return;
        }
        super.onBackPressed();
    }

    private void renderPairingScreen() {
        ComplicationUpdateHelper.requestAll(this);
        TileUpdateHelper.requestAll(this);
        root = baseRoot();
        TextView title = title("OurOrbit");
        TextView subtitle = muted("Generate a Wear OS pairing code in OurOrbit settings on your phone, then enter it here.");
        EditText input = new EditText(this);
        input.setHint("Pairing code");
        input.setSingleLine(true);
        input.setGravity(Gravity.CENTER);
        input.setTextColor(theme.text);
        input.setHintTextColor(theme.mutedText);
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
        if (message != null) root.addView(muted(message));
        root.addView(menu());
        setContentView(scroll(root));
    }

    private LinearLayout menu() {
        LinearLayout menu = new LinearLayout(this);
        menu.setOrientation(LinearLayout.VERTICAL);
        menu.addView(sectionTitle("Menu"));
        String[] screens = {"today", "habits", "tasks", "projects", "orbits", "notifications"};
        for (String screen : screens) {
            Button button = smallButton(screenLabel(screen));
            button.setOnClickListener(v -> {
                activeScreen = screen;
                activeMode = "list";
                selectedItem = null;
                selectedType = null;
                renderCurrent();
            });
            menu.addView(button);
        }
        return menu;
    }

    private void renderCurrent() {
        if ("detail".equals(activeMode) && selectedItem != null) {
            renderDetail();
            return;
        }

        root = baseRoot();
        root.addView(screenHeader(screenLabel(activeScreen)));
        if (summary == null) {
            root.addView(muted("No data loaded yet."));
            root.addView(menu());
            setContentView(scroll(root));
            return;
        }

        try {
            if ("habits".equals(activeScreen)) renderItems(summary.optJSONArray("habits"), "habit", "No habits");
            else if ("tasks".equals(activeScreen)) renderItems(summary.optJSONArray("tasks"), "task", "No tasks");
            else if ("projects".equals(activeScreen)) renderItems(summary.optJSONArray("projects"), "subtask", "No projects");
            else if ("orbits".equals(activeScreen)) renderOrbits();
            else if ("notifications".equals(activeScreen)) renderNotifications();
            else renderToday();
        } catch (JSONException ex) {
            root.addView(muted("Could not render watch data."));
        }
        root.addView(menu());
        setContentView(scroll(root));
    }

    private void renderToday() throws JSONException {
        renderItems(summary.optJSONArray("today_items"), null, "Nothing due");

        List<JSONObject> notifications = orderedNotifications(summary.optJSONArray("notifications"), true);
        if (!notifications.isEmpty()) {
            root.addView(sectionTitle("Urgent"));
            int count = Math.min(2, notifications.size());
            for (int i = 0; i < count; i++) {
                root.addView(notificationCard(notifications.get(i)));
            }
        }
    }

    private void renderItems(JSONArray items, String fallbackType, String emptyText) throws JSONException {
        if (items == null || items.length() == 0) {
            root.addView(empty(emptyText));
            return;
        }
        List<JSONObject> ordered = orderedItems(items, fallbackType);
        if (ordered.isEmpty()) {
            root.addView(empty(emptyText));
            return;
        }
        for (JSONObject item : ordered) {
            String type = safeString(item, "item_type", fallbackType == null ? "" : fallbackType);
            root.addView(itemCard(item, type));
        }
    }

    private void renderOrbits() throws JSONException {
        JSONArray items = summary.optJSONArray("orbits");
        if (items == null || items.length() == 0) {
            root.addView(empty("No Orbits"));
            return;
        }
        boolean rendered = false;
        for (int i = 0; i < items.length(); i++) {
            JSONObject orbit = items.optJSONObject(i);
            if (orbit == null) continue;
            LinearLayout card = card();
            card.addView(label(shortText(safeString(orbit, "name", "Orbit"), 28)));
            card.addView(muted("Level " + orbit.optInt("level", 1)));
            if (hasValue(orbit, "health_score")) card.addView(muted("Health " + orbit.optInt("health_score") + "/100"));
            JSONObject milestone = orbit.optJSONObject("current_milestone");
            if (milestone != null) {
                String milestoneTitle = safeString(milestone, "title", "");
                if (!milestoneTitle.isEmpty()) card.addView(muted("Milestone: " + shortText(milestoneTitle, 24)));
            }
            JSONArray recent = orbit.optJSONArray("recent_activity");
            card.addView(muted((recent == null ? 0 : recent.length()) + " recent"));
            Button open = actionButton("Open");
            open.setOnClickListener(v -> openDetail(orbit, "orbit"));
            card.addView(open);
            root.addView(card);
            rendered = true;
        }
        if (!rendered) root.addView(empty("No Orbits"));
    }
    private void renderNotifications() throws JSONException {
        JSONArray items = summary.optJSONArray("notifications");
        if (items == null || items.length() == 0) {
            root.addView(empty("No notifications"));
            return;
        }
        List<JSONObject> notifications = orderedNotifications(items, false);
        if (notifications.isEmpty()) {
            root.addView(empty("No notifications"));
            return;
        }
        for (JSONObject notification : notifications) {
            root.addView(notificationCard(notification));
        }
    }

    private LinearLayout itemCard(JSONObject item, String type) {
        LinearLayout card = card();
        card.setClickable(true);
        card.setOnClickListener(v -> openDetail(item, type));
        card.addView(label(shortText(itemTitle(item), 30)));
        String meta = itemMeta(item, type);
        if (!meta.isEmpty()) card.addView(muted(meta));

        String completePath = safeString(item, "complete_path", "");
        if (item.optBoolean("requires_phone") || completePath.isEmpty()) {
            card.addView(muted("Needs phone"));
            Button phone = actionButton("Open");
            phone.setOnClickListener(v -> toast("Open OurOrbit on your phone."));
            card.addView(phone);
        } else {
            Button complete = actionButton("Complete");
            complete.setOnClickListener(v -> postComplete(completePath));
            card.addView(complete);
        }
        return card;
    }

    private LinearLayout notificationCard(JSONObject item) {
        LinearLayout card = card();
        card.setClickable(true);
        card.setOnClickListener(v -> openDetail(item, "notification"));
        card.addView(label(shortText(safeString(item, "title", "Notification"), 30)));
        String message = safeString(item, "message", "");
        if (!message.isEmpty()) card.addView(muted(shortText(message, 36)));
        Button open = actionButton("Open");
        open.setOnClickListener(v -> openDetail(item, "notification"));
        card.addView(open);
        return card;
    }

    private void renderDetail() {
        root = baseRoot();
        root.addView(backButton());

        if ("orbit".equals(selectedType)) renderOrbitDetail();
        else if ("notification".equals(selectedType)) renderNotificationDetail();
        else renderItemDetail();

        setContentView(scroll(root));
    }

    private void renderItemDetail() {
        String type = selectedType == null ? "" : selectedType;
        root.addView(sectionTitle(itemTypeLabel(type)));
        root.addView(label(itemTitle(selectedItem)));
        String description = safeString(selectedItem, "description", "");
        if (!description.isEmpty()) root.addView(muted(description));
        String meta = itemMeta(selectedItem, type);
        if (!meta.isEmpty()) root.addView(muted(meta));

        String completePath = safeString(selectedItem, "complete_path", "");
        if (selectedItem.optBoolean("requires_phone") || completePath.isEmpty()) {
            root.addView(muted("Needs phone"));
            Button open = actionButton("Open");
            open.setOnClickListener(v -> toast("Open OurOrbit on your phone."));
            root.addView(open);
        } else {
            Button complete = actionButton("Complete");
            complete.setOnClickListener(v -> postComplete(completePath));
            root.addView(complete);
        }

        Button later = smallButton("Later");
        later.setOnClickListener(v -> {
            activeMode = "list";
            renderCurrent();
        });
        root.addView(later);
    }

    private void renderOrbitDetail() {
        root.addView(sectionTitle("Orbit"));
        root.addView(label(safeString(selectedItem, "name", "Orbit")));
        root.addView(muted("Level " + selectedItem.optInt("level", 1)));
        if (hasValue(selectedItem, "health_score")) root.addView(muted("Health " + selectedItem.optInt("health_score") + "/100"));
        JSONObject milestone = selectedItem.optJSONObject("current_milestone");
        if (milestone != null) {
            String milestoneTitle = safeString(milestone, "title", "");
            String progress = milestoneProgress(milestone);
            if (!milestoneTitle.isEmpty()) root.addView(muted("Milestone: " + milestoneTitle + progress));
        }
        JSONArray recent = selectedItem.optJSONArray("recent_activity");
        root.addView(muted((recent == null ? 0 : recent.length()) + " recent activities"));
        Button later = smallButton("Later");
        later.setOnClickListener(v -> {
            activeMode = "list";
            renderCurrent();
        });
        root.addView(later);
    }

    private void renderNotificationDetail() {
        root.addView(sectionTitle("Notification"));
        root.addView(label(safeString(selectedItem, "title", "Notification")));
        String message = safeString(selectedItem, "message", "");
        if (!message.isEmpty()) root.addView(muted(message));
        Button later = actionButton("Later");
        later.setOnClickListener(v -> {
            activeMode = "list";
            renderCurrent();
        });
        root.addView(later);
    }

    private void openDetail(JSONObject item, String type) {
        selectedItem = item;
        selectedType = type;
        activeMode = "detail";
        renderDetail();
    }

    private void loadSummary() {
        if (summary == null) {
            renderShell("Loading...");
        }
        new ApiTask("GET", "/watch/summary", null, result -> {
            try {
                summary = new JSONObject(result);
                applyThemeFromSummary(summary);
                publishSummaryNotifications(summary);
                ComplicationUpdateHelper.requestAll(this);
                TileUpdateHelper.requestAll(this);
                renderCurrent();
                openPendingItemIfPossible();
            } catch (JSONException ex) {
                renderShell("Could not read summary.");
            }
        }).execute();
    }

    private void captureOpenIntent(Intent intent) {
        if (intent == null) return;
        String screen = sanitizeText(intent.getStringExtra(EXTRA_SCREEN));
        if (!screen.isEmpty()) {
            activeScreen = screen;
            activeMode = "list";
            selectedItem = null;
            selectedType = null;
            return;
        }
        if (ACTION_OPEN_SCREEN.equals(intent.getAction())) {
            return;
        }
        if (!ACTION_OPEN_ITEM.equals(intent.getAction())) return;
        pendingOpenId = sanitizeText(intent.getStringExtra(NotificationActionReceiver.EXTRA_ITEM_ID));
        pendingOpenType = sanitizeText(intent.getStringExtra(NotificationActionReceiver.EXTRA_ITEM_TYPE));
    }

    private void openPendingItemIfPossible() {
        if (summary == null || pendingOpenId == null || pendingOpenId.isEmpty()) return;
        JSONObject item = findSummaryItem(pendingOpenId, pendingOpenType);
        if (item == null) return;
        String type = safeString(item, "item_type", pendingOpenType);
        pendingOpenId = "";
        pendingOpenType = "";
        openDetail(item, type);
    }

    private JSONObject findSummaryItem(String itemId, String itemType) {
        String[] arrays = {"today_items", "habits", "tasks", "projects", "notifications", "orbits"};
        for (String arrayName : arrays) {
            JSONArray array = summary.optJSONArray(arrayName);
            if (array == null) continue;
            for (int i = 0; i < array.length(); i++) {
                JSONObject item = array.optJSONObject(i);
                if (item == null) continue;
                if (!itemId.equals(safeString(item, "id", ""))) continue;
                if (!itemType.isEmpty() && !itemType.equals(safeString(item, "item_type", itemType))) continue;
                return item;
            }
        }
        return null;
    }

    private void publishSummaryNotifications(JSONObject payload) {
        if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            return;
        }
        JSONArray items = payload.optJSONArray("today_items");
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return;
        manager.cancelAll();
        if (items == null) return;

        int posted = 0;
        for (int i = 0; i < items.length() && posted < 8; i++) {
            JSONObject item = items.optJSONObject(i);
            if (item == null) continue;
            if (!isSupportedNotificationItem(item)) continue;
            postItemNotification(manager, item);
            posted++;
        }
    }

    private boolean isSupportedNotificationItem(JSONObject item) {
        String type = safeString(item, "item_type", "");
        return "habit".equals(type) || "task".equals(type) || "subtask".equals(type);
    }

    private void postItemNotification(NotificationManager manager, JSONObject item) {
        String itemId = safeString(item, "id", "");
        String type = safeString(item, "item_type", "");
        if (itemId.isEmpty() || type.isEmpty()) return;

        String title = shortText(itemTitle(item), 34);
        String body = notificationBody(item, type);
        String completePath = safeString(item, "complete_path", "");
        boolean canComplete = !item.optBoolean("requires_phone") && !completePath.isEmpty();
        int notificationId = notificationId(itemId, type);

        Intent openIntent = new Intent(this, MainActivity.class)
            .setAction(ACTION_OPEN_ITEM)
            .putExtra(NotificationActionReceiver.EXTRA_ITEM_ID, itemId)
            .putExtra(NotificationActionReceiver.EXTRA_ITEM_TYPE, type);
        PendingIntent openPendingIntent = PendingIntent.getActivity(
            this,
            notificationId,
            openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Notification.Builder builder = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            ? new Notification.Builder(this, CHANNEL_REMINDERS)
            : new Notification.Builder(this);

        builder
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(body)
            .setContentIntent(openPendingIntent)
            .setAutoCancel(true)
            .setShowWhen(true);

        if (canComplete) {
            builder.addAction(new Notification.Action.Builder(
                R.mipmap.ic_launcher,
                "Complete",
                actionPendingIntent(NotificationActionReceiver.ACTION_COMPLETE, item, notificationId)
            ).build());
        }

        builder.addAction(new Notification.Action.Builder(
            R.mipmap.ic_launcher,
            "Snooze",
            actionPendingIntent(NotificationActionReceiver.ACTION_SNOOZE, item, notificationId)
        ).build());

        builder.addAction(new Notification.Action.Builder(
            R.mipmap.ic_launcher,
            "Open",
            openPendingIntent
        ).build());

        Notification notification = builder.build();
        manager.notify(notificationId, notification);
    }

    private PendingIntent actionPendingIntent(String action, JSONObject item, int notificationId) {
        Intent intent = new Intent(this, NotificationActionReceiver.class)
            .setAction(action)
            .putExtra(NotificationActionReceiver.EXTRA_NOTIFICATION_ID, notificationId)
            .putExtra(NotificationActionReceiver.EXTRA_ITEM_ID, safeString(item, "id", ""))
            .putExtra(NotificationActionReceiver.EXTRA_ITEM_TYPE, safeString(item, "item_type", ""))
            .putExtra(NotificationActionReceiver.EXTRA_TITLE, shortText(itemTitle(item), 34))
            .putExtra(NotificationActionReceiver.EXTRA_BODY, notificationBody(item, safeString(item, "item_type", "")))
            .putExtra(NotificationActionReceiver.EXTRA_COMPLETE_PATH, safeString(item, "complete_path", ""))
            .putExtra(NotificationActionReceiver.EXTRA_REQUIRES_PHONE, item.optBoolean("requires_phone"));
        return PendingIntent.getBroadcast(
            this,
            notificationId + action.hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }

    private String notificationBody(JSONObject item, String type) {
        if (item.optBoolean("requires_phone")) return "Needs phone";
        if ("habit".equals(type) && item.optInt("weekly_target", 1) > 1) return "Weekly habit";
        if ("task".equals(type)) return "Task due";
        if ("subtask".equals(type)) return "Subtask due";
        return "Due now";
    }

    private int notificationId(String itemId, String type) {
        return Math.abs((type + ":" + itemId).hashCode());
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return;
        NotificationChannel channel = new NotificationChannel(
            CHANNEL_REMINDERS,
            "OurOrbit reminders",
            NotificationManager.IMPORTANCE_DEFAULT
        );
        channel.setDescription("Habit, task, and subtask reminders");
        manager.createNotificationChannel(channel);
    }

    private void requestNotificationPermission() {
        if (Build.VERSION.SDK_INT < 33) return;
        if (checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED) return;
        requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, 1001);
    }

    private void renderLoadError() {
        root = baseRoot();
        root.addView(title("Unable to load"));
        root.addView(muted("Refresh to try again"));
        Button refresh = actionButton("Refresh");
        refresh.setOnClickListener(v -> loadSummary());
        root.addView(refresh);
        if (summary != null) root.addView(menu());
        setContentView(scroll(root));
    }

    private void postComplete(String path) {
        path = sanitizeText(path);
        if (path.isEmpty()) {
            toast("No action available");
            return;
        }
        new ApiTask("POST", path, "{}", result -> {
            toast("Completed");
            activeMode = "list";
            selectedItem = null;
            selectedType = null;
            ComplicationUpdateHelper.requestAll(this);
            TileUpdateHelper.requestAll(this);
            loadSummary();
        }).execute();
    }

    private void postNotificationRead(String id) {
        id = sanitizeText(id);
        if (id.isEmpty()) return;
        new ApiTask("POST", "/notifications/" + Uri.encode(id) + "/read", "{}", result -> {
            toast("Read");
            activeMode = "list";
            selectedItem = null;
            selectedType = null;
            loadSummary();
        }).execute();
    }

    private LinearLayout screenHeader(String heading) {
        LinearLayout header = new LinearLayout(this);
        header.setOrientation(LinearLayout.VERTICAL);
        header.addView(title(heading));
        Button refresh = smallButton("Refresh");
        refresh.setOnClickListener(v -> loadSummary());
        header.addView(refresh);
        return header;
    }

    private Button backButton() {
        Button back = smallButton("Back");
        back.setOnClickListener(v -> onBackPressed());
        return back;
    }

    private TextView empty(String text) {
        TextView view = muted(text);
        view.setGravity(Gravity.CENTER);
        view.setPadding(0, 14, 0, 14);
        return view;
    }

    private List<JSONObject> orderedNotifications(JSONArray items, boolean unreadOnly) {
        List<JSONObject> result = new ArrayList<>();
        if (items == null) return result;
        for (int i = 0; i < items.length(); i++) {
            JSONObject item = items.optJSONObject(i);
            if (item == null) continue;
            if (unreadOnly && !isUnreadNotification(item)) continue;
            result.add(item);
        }
        result.sort(Comparator.comparingInt(this::notificationPriority));
        return result;
    }

    private int notificationPriority(JSONObject item) {
        String priority = safeString(item, "priority", "").toLowerCase(Locale.US);
        String type = safeString(item, "type", "").toLowerCase(Locale.US);
        if ("urgent".equals(priority) || "high".equals(priority) || type.contains("urgent")) return 0;
        if (isUnreadNotification(item)) return 1;
        return 2;
    }

    private boolean isUnreadNotification(JSONObject item) {
        if (item.optBoolean("unread", false)) return true;
        if (!item.optBoolean("read", false) && !item.optBoolean("is_read", false)) {
            return !hasValue(item, "read_at") && !hasValue(item, "readAt");
        }
        return false;
    }

    private List<JSONObject> orderedItems(JSONArray items, String fallbackType) throws JSONException {
        List<JSONObject> result = new ArrayList<>();
        for (int i = 0; i < items.length(); i++) {
            JSONObject item = items.optJSONObject(i);
            if (item != null) result.add(item);
        }
        result.sort(Comparator.comparingInt(item -> itemPriority(item, fallbackType)));
        return result;
    }

    private int itemPriority(JSONObject item, String fallbackType) {
        String type = safeString(item, "item_type", fallbackType == null ? "" : fallbackType);
        if ("habit".equals(type) && item.optInt("weekly_target", 1) > 1) return 1;
        if ("habit".equals(type)) return 0;
        if ("task".equals(type)) return 2;
        if ("subtask".equals(type)) return 3;
        return 4;
    }

    private String itemMeta(JSONObject item, String type) {
        if ("habit".equals(type) && item.optInt("weekly_target", 1) > 1) {
            return item.optInt("weekly_completed_count", 0) + "/" + item.optInt("weekly_target", 1) + " this week";
        }
        if ("subtask".equals(type)) {
            String project = safeString(item, "project_title", "");
            if (!project.isEmpty()) return "Project: " + shortText(project, 24);
            return "";
        }
        String orbit = safeString(item, "orbit_name", "");
        if (!orbit.isEmpty()) return shortText(orbit, 28);
        return "";
    }

    private String itemTitle(JSONObject item) {
        String title = safeString(item, "title", "");
        if (!title.isEmpty()) return title;
        String projectTitle = safeString(item, "project_title", "");
        if (!projectTitle.isEmpty()) return projectTitle;
        String name = safeString(item, "name", "");
        if (!name.isEmpty()) return name;
        return "Item";
    }

    private String milestoneProgress(JSONObject milestone) {
        if (!hasValue(milestone, "progress") || !hasValue(milestone, "target")) return "";
        int progress = milestone.optInt("progress", -1);
        int target = milestone.optInt("target", -1);
        if (progress < 0 || target <= 0) return "";
        return " " + progress + "/" + target;
    }

    private String itemTypeLabel(String type) {
        if ("habit".equals(type)) return "Habit";
        if ("task".equals(type)) return "Task";
        if ("subtask".equals(type)) return "Subtask";
        return "Item";
    }

    private String screenLabel(String screen) {
        if ("today".equals(screen)) return "Today";
        if ("habits".equals(screen)) return "Habits";
        if ("tasks".equals(screen)) return "Tasks";
        if ("projects".equals(screen)) return "Projects";
        if ("orbits".equals(screen)) return "Orbits";
        if ("notifications".equals(screen)) return "Notifications";
        return "Today";
    }

    private String shortText(String value, int max) {
        String clean = sanitizeText(value);
        if (clean.length() <= max) return clean;
        return clean.substring(0, Math.max(0, max - 3)).trim() + "...";
    }

    private String safeString(JSONObject object, String key, String fallback) {
        if (object == null || key == null || object.isNull(key)) {
            return sanitizeText(fallback);
        }
        return sanitizeText(object.optString(key, fallback));
    }

    private boolean hasValue(JSONObject object, String key) {
        return !safeString(object, key, "").isEmpty();
    }

    private String sanitizeText(String value) {
        if (value == null) return "";
        String clean = value.trim();
        if (clean.isEmpty()) return "";
        if ("null".equalsIgnoreCase(clean)) return "";
        if ("undefined".equalsIgnoreCase(clean)) return "";
        return clean;
    }

    private void applyThemeFromSummary(JSONObject payload) {
        String themeId = safeString(payload, "selected_theme", "");
        if (themeId.isEmpty()) return;
        theme = themeForId(themeId);
        getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .putString(THEME_ID_KEY, theme.id)
            .apply();
    }

    private WatchTheme themeForId(String rawThemeId) {
        String id = sanitizeText(rawThemeId).toLowerCase(Locale.US);
        WatchTheme mapped;
        switch (id) {
            case "dark":
            case "midnight orbit":
                mapped = new WatchTheme("dark", "#050816", "#0F172A", "#22D3EE", "#172033", "#F8FAFC", "#CBD5E1");
                break;
            case "nature":
            case "evergreen":
                mapped = new WatchTheme("nature", "#F0FDF4", "#FFFFFF", "#16A34A", "#DCFCE7", "#14532D", "#4B8063");
                break;
            case "focus":
            case "slate":
                mapped = new WatchTheme("focus", "#F5F5F4", "#FFFFFF", "#44403C", "#E7E5E4", "#1C1917", "#625C57");
                break;
            case "amoled":
                mapped = new WatchTheme("amoled", "#000000", "#080808", "#22C55E", "#141414", "#FAFAFA", "#D4D4D4");
                break;
            case "ocean":
            case "tidal":
                mapped = new WatchTheme("ocean", "#EFF6FF", "#FFFFFF", "#0284C7", "#DBEAFE", "#0F172A", "#1D4ED8");
                break;
            case "coffee":
            case "ember":
                mapped = new WatchTheme("coffee", "#FAF3E7", "#FFFAF2", "#8B5E34", "#E7D3B5", "#2B1A10", "#654B32");
                break;
            case "solsticestore":
            case "solstice":
            case "solstice crown":
                mapped = new WatchTheme("solstice", "#FFF7ED", "#FFFFFF", "#F97316", "#FED7AA", "#431407", "#7C2D12");
                break;
            case "forestnight":
            case "forest night":
                mapped = new WatchTheme("forestNight", "#071A12", "#10291D", "#34D399", "#173A2A", "#ECFDF5", "#A7F3D0");
                break;
            case "aurora":
                mapped = new WatchTheme("aurora", "#0B1020", "#141B34", "#06B6D4", "#1C2547", "#F3F7FF", "#C7D2FE");
                break;
            case "midnightgold":
            case "obsidian gold":
                mapped = new WatchTheme("midnightGold", "#09090B", "#18181B", "#EAB308", "#27272A", "#FAFAFA", "#E4E4E7");
                break;
            case "oceanbreeze":
            case "ocean breeze":
                mapped = new WatchTheme("oceanBreeze", "#F0FDFF", "#FFFFFF", "#06B6D4", "#DDF7FA", "#164E63", "#0F766E");
                break;
            case "rosegarden":
            case "rose garden":
                mapped = new WatchTheme("roseGarden", "#FFF1F2", "#FFFFFF", "#E11D48", "#FFE4E6", "#881337", "#9F1239");
                break;
            case "comet":
                mapped = new WatchTheme("comet", "#06131F", "#0F1E2D", "#22D3EE", "#183041", "#E0F7FF", "#BAE6FD");
                break;
            case "nebula":
                mapped = new WatchTheme("nebula", "#140B2D", "#1F1147", "#A855F7", "#2B1761", "#F8F5FF", "#DDD6FE");
                break;
            case "eclipse":
                mapped = new WatchTheme("eclipse", "#020617", "#0F172A", "#2563EB", "#172554", "#F8FAFC", "#BFDBFE");
                break;
            case "cosmicgold":
            case "cosmic gold":
                mapped = new WatchTheme("cosmicGold", "#09090B", "#18181B", "#EAB308", "#27272A", "#FAFAFA", "#FEF3C7");
                break;
            case "light":
            case "daylight":
            default:
                mapped = new WatchTheme("light", "#F4F7FB", "#FFFFFF", "#132238", "#EEF3F8", "#122033", "#56657A");
                break;
        }
        return readableTheme(mapped);
    }

    private WatchTheme readableTheme(WatchTheme candidate) {
        if (
            contrast(candidate.text, candidate.background) < 4.5 ||
            contrast(candidate.text, candidate.card) < 4.5 ||
            contrast(candidate.mutedText, candidate.background) < 3.0 ||
            contrast(candidate.mutedText, candidate.card) < 3.0
        ) {
            return safeDarkTheme();
        }
        candidate.buttonText = bestTextColor(candidate.primary);
        return candidate;
    }

    private WatchTheme safeDarkTheme() {
        WatchTheme fallback = new WatchTheme("dark", "#050816", "#0F172A", "#22D3EE", "#172033", "#F8FAFC", "#CBD5E1");
        fallback.buttonText = bestTextColor(fallback.primary);
        return fallback;
    }

    private int color(String hex, int fallback) {
        try {
            return Color.parseColor(hex);
        } catch (Exception ex) {
            return fallback;
        }
    }

    private int bestTextColor(int background) {
        return contrast(Color.WHITE, background) >= contrast(Color.BLACK, background)
            ? Color.WHITE
            : Color.BLACK;
    }

    private double contrast(int colorA, int colorB) {
        double lighter = Math.max(luminance(colorA), luminance(colorB));
        double darker = Math.min(luminance(colorA), luminance(colorB));
        return (lighter + 0.05) / (darker + 0.05);
    }

    private double luminance(int color) {
        double r = colorChannel(Color.red(color));
        double g = colorChannel(Color.green(color));
        double b = colorChannel(Color.blue(color));
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    private double colorChannel(int channel) {
        double value = channel / 255.0;
        return value <= 0.03928
            ? value / 12.92
            : Math.pow((value + 0.055) / 1.055, 2.4);
    }

    private class WatchTheme {
        final String id;
        final int background;
        final int card;
        final int primary;
        final int secondary;
        final int text;
        final int mutedText;
        int buttonText;

        WatchTheme(String id, String background, String card, String primary, String secondary, String text, String mutedText) {
            this.id = id;
            this.background = color(background, Color.rgb(5, 8, 22));
            this.card = color(card, Color.rgb(15, 23, 42));
            this.primary = color(primary, Color.rgb(34, 211, 238));
            this.secondary = color(secondary, Color.rgb(23, 32, 51));
            this.text = color(text, Color.WHITE);
            this.mutedText = color(mutedText, Color.rgb(203, 213, 225));
            this.buttonText = bestTextColor(this.primary);
        }
    }

    private LinearLayout baseRoot() {
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setPadding(14, 12, 14, 12);
        layout.setBackgroundColor(theme.background);
        return layout;
    }

    private ScrollView scroll(View child) {
        ScrollView scroll = new ScrollView(this);
        scroll.addView(child);
        return scroll;
    }

    private TextView title(String text) {
        TextView view = text(text, 22, theme.text);
        view.setGravity(Gravity.CENTER);
        view.setPadding(0, 0, 0, 6);
        return view;
    }

    private TextView sectionTitle(String text) {
        TextView view = text(text, 18, theme.text);
        view.setPadding(0, 12, 0, 6);
        return view;
    }

    private TextView label(String text) {
        return text(text, 16, theme.text);
    }

    private TextView muted(String text) {
        return text(text, 13, theme.mutedText);
    }

    private TextView text(String text, int sp, int color) {
        TextView view = new TextView(this);
        view.setText(sanitizeText(text));
        view.setTextSize(sp);
        view.setTextColor(color);
        view.setPadding(0, 4, 0, 4);
        return view;
    }

    private LinearLayout card() {
        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setPadding(14, 10, 14, 10);
        card.setBackgroundColor(theme.card);
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        );
        params.setMargins(0, 0, 0, 8);
        card.setLayoutParams(params);
        return card;
    }

    private Button actionButton(String text) {
        Button button = smallButton(text);
        button.setTextColor(theme.buttonText);
        button.setBackgroundColor(theme.primary);
        return button;
    }

    private Button smallButton(String text) {
        Button button = new Button(this);
        button.setText(sanitizeText(text));
        button.setAllCaps(false);
        button.setTextSize(14);
        button.setMinHeight(44);
        button.setPadding(10, 6, 10, 6);
        button.setTextColor(theme.text);
        button.setBackgroundColor(theme.secondary);
        return button;
    }

    private void toast(String text) {
        String clean = sanitizeText(text);
        Toast.makeText(this, clean.isEmpty() ? "Something went wrong" : clean, Toast.LENGTH_SHORT).show();
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
                String detail = sanitizeText(errorBody.optString("detail", ""));
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
                if ("GET".equals(method) && "/watch/summary".equals(path)) {
                    renderLoadError();
                }
                if (error != null && error.contains("Pair again")) renderPairingScreen();
                return;
            }
            callback.onSuccess(result);
        }
    }
}
