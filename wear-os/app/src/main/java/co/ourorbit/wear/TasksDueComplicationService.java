package co.ourorbit.wear;

import org.json.JSONArray;
import org.json.JSONObject;

public class TasksDueComplicationService extends OurOrbitComplicationService {
    @Override
    ComplicationPayload buildPayload(JSONObject summary) {
        JSONObject counts = summary.optJSONObject("counts");
        int tasks = optInt(counts, "tasks", -1);
        if (tasks < 0) {
            JSONArray items = summary.optJSONArray("tasks");
            tasks = items == null ? 0 : items.length();
        }
        return ComplicationPayload.screen(taskText(tasks), "Tasks", "Tasks due", SCREEN_TASKS);
    }

    @Override
    ComplicationPayload previewPayload() {
        return ComplicationPayload.screen("2 tasks", "Tasks", "Tasks due", SCREEN_TASKS);
    }

    private String taskText(int tasks) {
        return tasks == 1 ? "1 task" : tasks + " tasks";
    }
}
