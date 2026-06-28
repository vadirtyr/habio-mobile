package co.ourorbit.wear;

import org.json.JSONArray;
import org.json.JSONObject;

public class HabitProgressComplicationService extends OurOrbitComplicationService {
    @Override
    ComplicationPayload buildPayload(JSONObject summary) {
        JSONObject progress = summary.optJSONObject("habit_progress");
        int total = optInt(progress, "total", -1);
        int completed = optInt(progress, "completed", -1);

        if (total < 0 || completed < 0) {
            JSONArray habits = summary.optJSONArray("habits");
            total = habits == null ? 0 : habits.length();
            completed = 0;
        }

        String value = total == 0 ? "0/0" : completed + "/" + total;
        return ComplicationPayload
            .screen(value, "Habits", "Today habit progress", SCREEN_TODAY)
            .withRange(Math.max(0, completed), 0f, Math.max(1, total));
    }

    @Override
    ComplicationPayload previewPayload() {
        return ComplicationPayload
            .screen("3/5", "Habits", "Today habit progress", SCREEN_TODAY)
            .withRange(3f, 0f, 5f);
    }
}
