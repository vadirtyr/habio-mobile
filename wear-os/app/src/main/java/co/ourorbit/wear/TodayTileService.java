package co.ourorbit.wear;

import org.json.JSONArray;
import org.json.JSONObject;

public class TodayTileService extends OurOrbitTileService {
    @Override
    TilePayload buildPayload(JSONObject summary) {
        int due = summary.optJSONObject("counts") == null ? count(summary.optJSONArray("today_items")) : summary.optJSONObject("counts").optInt("today_items", 0);
        JSONObject progress = summary.optJSONObject("habit_progress");
        int completed = progress == null ? 0 : progress.optInt("completed", 0);
        int total = progress == null ? count(summary.optJSONArray("habits")) : progress.optInt("total", 0);
        int tasks = summary.optJSONObject("counts") == null ? count(summary.optJSONArray("tasks")) : summary.optJSONObject("counts").optInt("tasks", 0);
        int subtasks = summary.optJSONObject("counts") == null ? count(summary.optJSONArray("projects")) : summary.optJSONObject("counts").optInt("subtasks", 0);
        JSONObject weekly = findWeeklyTarget(summary.optJSONArray("today_items"));

        String primary = due == 0 ? "Nothing due" : due + " due";
        String secondary = "Habits " + completed + "/" + total + " • Tasks " + (tasks + subtasks);
        String tertiary = weekly == null ? "" : shortText(title(weekly, "Goal"), 12) + " " + weekly.optInt("weekly_completed_count", 0) + "/" + weekly.optInt("weekly_target", 1);
        return new TilePayload("Today", primary, secondary, tertiary, "Open Today", SCREEN_TODAY);
    }
}
