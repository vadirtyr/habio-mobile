package co.ourorbit.wear;

import org.json.JSONArray;
import org.json.JSONObject;

public class TasksTileService extends OurOrbitTileService {
    @Override
    TilePayload buildPayload(JSONObject summary) {
        JSONObject counts = summary.optJSONObject("counts");
        int tasks = counts == null ? count(summary.optJSONArray("tasks")) : counts.optInt("tasks", 0);
        int subtasks = counts == null ? count(summary.optJSONArray("projects")) : counts.optInt("subtasks", 0);
        JSONObject next = first(summary.optJSONArray("tasks"));
        if (next == null) next = first(summary.optJSONArray("projects"));

        int total = tasks + subtasks;
        String primary = total == 0 ? "No tasks" : total + (total == 1 ? " item" : " items");
        String secondary = tasks + " tasks • " + subtasks + " subtasks";
        String tertiary = next == null ? "" : "Next: " + shortText(title(next, "Task"), 18);
        return new TilePayload("Tasks", primary, secondary, tertiary, "Open Tasks", SCREEN_TASKS);
    }
}
