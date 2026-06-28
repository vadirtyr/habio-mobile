package co.ourorbit.wear;

import org.json.JSONObject;

public class HabitsTileService extends OurOrbitTileService {
    @Override
    TilePayload buildPayload(JSONObject summary) {
        JSONObject progress = summary.optJSONObject("habit_progress");
        int completed = progress == null ? 0 : progress.optInt("completed", 0);
        int total = progress == null ? count(summary.optJSONArray("habits")) : progress.optInt("total", 0);
        JSONObject next = first(summary.optJSONArray("habits"));
        JSONObject weekly = findWeeklyTarget(summary.optJSONArray("habits"));
        if (weekly == null) weekly = findWeeklyTarget(summary.optJSONArray("today_items"));

        String primary = total == 0 ? "No habits" : completed + "/" + total;
        String secondary = next == null ? "" : "Next: " + shortText(title(next, "Habit"), 18);
        String tertiary = weekly == null ? "" : shortText(title(weekly, "Goal"), 12) + " " + weekly.optInt("weekly_completed_count", 0) + "/" + weekly.optInt("weekly_target", 1);
        return new TilePayload("Habits", primary, secondary, tertiary, "Open Habits", SCREEN_HABITS);
    }
}
