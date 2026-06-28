package co.ourorbit.wear;

import org.json.JSONArray;
import org.json.JSONObject;

public class OrbitTileService extends OurOrbitTileService {
    @Override
    TilePayload buildPayload(JSONObject summary) {
        JSONArray orbits = summary.optJSONArray("orbits");
        JSONObject orbit = first(orbits);
        if (orbit == null) {
            return new TilePayload("Orbit", "No Orbit", "", "", "Open Orbit", SCREEN_ORBITS);
        }

        String name = shortText(sanitize(orbit.optString("name", "Orbit")), 18);
        if (name.isEmpty()) name = "Orbit";
        String health = orbit.isNull("health_score") ? "Health --%" : "Health " + orbit.optInt("health_score", 0) + "%";
        String level = "Level " + orbit.optInt("level", 1);
        JSONObject milestone = orbit.optJSONObject("current_milestone");
        String milestoneText = milestone == null ? "" : milestone(milestone);
        return new TilePayload("Orbit", name, health + " • " + level, milestoneText, "Open Orbit", SCREEN_ORBITS);
    }

    private String milestone(JSONObject milestone) {
        String title = shortText(sanitize(milestone.optString("title", "Milestone")), 15);
        if (title.isEmpty()) return "";
        if (!milestone.isNull("progress") && !milestone.isNull("target") && milestone.optInt("target", 0) > 0) {
            return title + " " + milestone.optInt("progress", 0) + "/" + milestone.optInt("target", 0);
        }
        return title;
    }
}
