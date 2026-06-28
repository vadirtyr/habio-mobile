package co.ourorbit.wear;

import android.content.Context;

import androidx.wear.tiles.TileService;

class TileUpdateHelper {
    static void requestAll(Context context) {
        request(context, TodayTileService.class);
        request(context, HabitsTileService.class);
        request(context, TasksTileService.class);
        request(context, OrbitTileService.class);
    }

    private static void request(Context context, Class<? extends TileService> serviceClass) {
        try {
            TileService.getUpdater(context).requestUpdate(serviceClass);
        } catch (Exception ignored) {
            // Tile refresh is best-effort and system controlled.
        }
    }
}
