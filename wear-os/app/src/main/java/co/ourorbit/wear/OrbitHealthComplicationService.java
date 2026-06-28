package co.ourorbit.wear;

import org.json.JSONArray;
import org.json.JSONObject;

public class OrbitHealthComplicationService extends OurOrbitComplicationService {
    @Override
    ComplicationPayload buildPayload(JSONObject summary) {
        JSONArray orbits = summary.optJSONArray("orbits");
        JSONObject orbit = optObject(orbits, 0);
        if (orbit == null || orbit.isNull("health_score")) {
            return ComplicationPayload.screen("--%", "Orbit", "Orbit health unavailable", SCREEN_ORBITS);
        }

        int score = Math.max(0, Math.min(100, orbit.optInt("health_score", 0)));
        String title = shortText(sanitize(orbit.optString("name", "")), 10);
        if (title.isEmpty()) title = "Orbit";
        return ComplicationPayload
            .screen(score + "%", title, "Orbit health " + score + "%", SCREEN_ORBITS)
            .withRange(score, 0f, 100f);
    }

    @Override
    ComplicationPayload previewPayload() {
        return ComplicationPayload
            .screen("82%", "Orbit", "Orbit health 82%", SCREEN_ORBITS)
            .withRange(82f, 0f, 100f);
    }
}
