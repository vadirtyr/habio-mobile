package co.ourorbit.wear;

import android.content.ComponentName;
import android.content.Context;

import androidx.wear.watchface.complications.datasource.ComplicationDataSourceUpdateRequester;

class ComplicationUpdateHelper {
    static void requestAll(Context context) {
        request(context, HabitProgressComplicationService.class);
        request(context, TasksDueComplicationService.class);
        request(context, OrbitHealthComplicationService.class);
        request(context, WeeklyTargetComplicationService.class);
    }

    private static void request(Context context, Class<?> serviceClass) {
        try {
            ComplicationDataSourceUpdateRequester.create(
                context,
                new ComponentName(context, serviceClass)
            ).requestUpdateAll();
        } catch (Exception ignored) {
            // Complication refresh is best-effort and watch-face dependent.
        }
    }
}
