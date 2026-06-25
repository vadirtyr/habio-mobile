package co.ourorbit.wear;

import android.app.Activity;
import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Bundle;
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
import java.net.HttpURLConnection;
import java.net.URL;

public class MainActivity extends Activity {
    private static final String API_BASE = "https://api.habioapp.co/api";
    private static final String PREFS = "ourorbit_wear";
    private static final String TOKEN_KEY = "token";

    private LinearLayout root;
    private String token;
    private JSONObject summary;
    private String activeScreen = "today";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        token = getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(TOKEN_KEY, "");
        if (token == null || token.isEmpty()) {
            renderTokenScreen();
        } else {
            renderShell("Loading...");
            loadSummary();
        }
    }

    private void renderTokenScreen() {
        root = baseRoot();
        TextView title = title("OurOrbit");
        TextView subtitle = muted("Paste an API token from your phone session to pair this watch.");
        EditText input = new EditText(this);
        input.setHint("Bearer token");
        input.setSingleLine(false);
        input.setMinLines(2);
        input.setTextColor(Color.WHITE);
        input.setHintTextColor(Color.rgb(203, 213, 225));
        input.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS);
        Button save = actionButton("Pair Watch");
        save.setOnClickListener(v -> {
            String value = input.getText().toString().trim();
            if (value.startsWith("Bearer ")) value = value.substring(7).trim();
            if (value.length() < 10) {
                toast("Enter a valid token");
                return;
            }
            token = value;
            getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit()
                .putString(TOKEN_KEY, token)
                .apply();
            renderShell("Loading...");
            loadSummary();
        });
        root.addView(title);
        root.addView(subtitle);
        root.addView(input);
        root.addView(save);
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

    private interface ApiCallback {
        void onSuccess(String result);
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
                    getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().remove(TOKEN_KEY).apply();
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
                if (error != null && error.contains("Pair again")) renderTokenScreen();
                return;
            }
            callback.onSuccess(result);
        }
    }
}
