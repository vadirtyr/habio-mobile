package co.ourorbit.wear;

import org.json.JSONArray;
import org.json.JSONObject;

public class WeeklyTargetComplicationService extends OurOrbitComplicationService {
    @Override
    ComplicationPayload buildPayload(JSONObject summary) {
        JSONObject habit = findWeeklyTarget(summary.optJSONArray("today_items"));
        if (habit == null) habit = findWeeklyTarget(summary.optJSONArray("habits"));
        if (habit == null) {
            return ComplicationPayload.screen("No goal", "Weekly", "No weekly target", SCREEN_TODAY);
        }

        int target = Math.max(1, habit.optInt("weekly_target", 1));
        int completed = Math.max(0, Math.min(target, habit.optInt("weekly_completed_count", 0)));
        String title = shortText(habit.optString("title", "Goal"), 8);
        if (title.isEmpty()) title = "Goal";
        String text = shortText(title + " " + completed + "/" + target, 12);
        String itemId = sanitize(habit.optString("id", ""));
        String itemType = sanitize(habit.optString("item_type", "habit"));
        ComplicationPayload payload = itemId.isEmpty()
            ? ComplicationPayload.screen(text, "Weekly", "Weekly target progress", SCREEN_TODAY)
            : ComplicationPayload.item(text, "Weekly", "Weekly target progress", itemId, itemType.isEmpty() ? "habit" : itemType);
        return payload.withRange(completed, 0f, target);
    }

    @Override
    ComplicationPayload previewPayload() {
        return ComplicationPayload
            .screen("Gym 2/4", "Weekly", "Weekly target progress", SCREEN_TODAY)
            .withRange(2f, 0f, 4f);
    }

    private JSONObject findWeeklyTarget(JSONArray items) {
        if (items == null) return null;
        JSONObject fallback = null;
        for (int i = 0; i < items.length(); i++) {
            JSONObject item = items.optJSONObject(i);
            if (item == null) continue;
            int target = item.optInt("weekly_target", 1);
            if (target <= 1) continue;
            if (fallback == null) fallback = item;
            int remaining = item.optInt("weekly_remaining_count", 0);
            if (remaining > 0) return item;
        }
        return fallback;
    }
}
