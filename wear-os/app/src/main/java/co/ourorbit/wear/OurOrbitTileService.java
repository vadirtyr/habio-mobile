package co.ourorbit.wear;

import com.google.common.util.concurrent.ListenableFuture;

import org.json.JSONArray;
import org.json.JSONObject;

import androidx.concurrent.futures.CallbackToFutureAdapter;
import androidx.wear.protolayout.ActionBuilders;
import androidx.wear.protolayout.ColorBuilders;
import androidx.wear.protolayout.DimensionBuilders;
import androidx.wear.protolayout.LayoutElementBuilders;
import androidx.wear.protolayout.ModifiersBuilders;
import androidx.wear.protolayout.ResourceBuilders;
import androidx.wear.protolayout.TimelineBuilders;
import androidx.wear.tiles.RequestBuilders;
import androidx.wear.tiles.TileBuilders;
import androidx.wear.tiles.TileService;

abstract class OurOrbitTileService extends TileService {
    static final String SCREEN_TODAY = "today";
    static final String SCREEN_HABITS = "habits";
    static final String SCREEN_TASKS = "tasks";
    static final String SCREEN_ORBITS = "orbits";

    private static final long FRESHNESS_MS = 30L * 60L * 1000L;
    private static final int BACKGROUND = 0xFF050816;
    private static final int CARD = 0xFF101827;
    private static final int PRIMARY = 0xFF22D3EE;
    private static final int TEXT = 0xFFF8FAFC;
    private static final int MUTED = 0xFFCBD5E1;
    private static final int BUTTON_TEXT = 0xFF031018;

    @Override
    protected ListenableFuture<TileBuilders.Tile> onTileRequest(RequestBuilders.TileRequest requestParams) {
        return CallbackToFutureAdapter.getFuture(completer -> {
            new Thread(() -> {
                JSONObject summary = WearSummaryClient.fetchSummaryOrCache(this);
                TilePayload payload = summary == null ? pairPayload() : buildPayload(summary);
                completer.set(tile(payload));
            }).start();
            return "OurOrbitTile";
        });
    }

    @Override
    protected ListenableFuture<ResourceBuilders.Resources> onTileResourcesRequest(RequestBuilders.ResourcesRequest requestParams) {
        return CallbackToFutureAdapter.getFuture(completer -> {
            completer.set(new ResourceBuilders.Resources.Builder().setVersion("1").build());
            return "OurOrbitTileResources";
        });
    }

    abstract TilePayload buildPayload(JSONObject summary);

    TilePayload pairPayload() {
        return new TilePayload("OurOrbit", "Pair OurOrbit", "", "", "Open", SCREEN_TODAY);
    }

    TileBuilders.Tile tile(TilePayload payload) {
        LayoutElementBuilders.Layout layout = new LayoutElementBuilders.Layout.Builder()
            .setRoot(root(payload))
            .build();
        TimelineBuilders.Timeline timeline = new TimelineBuilders.Timeline.Builder()
            .addTimelineEntry(new TimelineBuilders.TimelineEntry.Builder().setLayout(layout).build())
            .build();
        return new TileBuilders.Tile.Builder()
            .setResourcesVersion("1")
            .setTileTimeline(timeline)
            .setFreshnessIntervalMillis(FRESHNESS_MS)
            .build();
    }

    private LayoutElementBuilders.LayoutElement root(TilePayload payload) {
        LayoutElementBuilders.Column.Builder column = new LayoutElementBuilders.Column.Builder()
            .setWidth(DimensionBuilders.expand())
            .setHeight(DimensionBuilders.wrap())
            .setHorizontalAlignment(LayoutElementBuilders.HORIZONTAL_ALIGN_CENTER)
            .setModifiers(padded(14));

        column.addContent(text(payload.title, 15, MUTED, 1, false));
        column.addContent(spacer(5));
        column.addContent(text(payload.primary, 24, TEXT, 1, true));
        addOptional(column, payload.secondary);
        addOptional(column, payload.tertiary);
        column.addContent(spacer(8));
        column.addContent(button(payload.action, payload.screen));

        return new LayoutElementBuilders.Box.Builder()
            .setWidth(DimensionBuilders.expand())
            .setHeight(DimensionBuilders.expand())
            .setHorizontalAlignment(LayoutElementBuilders.HORIZONTAL_ALIGN_CENTER)
            .setVerticalAlignment(LayoutElementBuilders.VERTICAL_ALIGN_CENTER)
            .setModifiers(new ModifiersBuilders.Modifiers.Builder()
                .setBackground(background(BACKGROUND))
                .setClickable(clickable("tile-" + payload.screen, payload.screen))
                .build())
            .addContent(column.build())
            .build();
    }

    private void addOptional(LayoutElementBuilders.Column.Builder column, String value) {
        String clean = sanitize(value);
        if (clean.isEmpty()) return;
        column.addContent(text(clean, 15, MUTED, 1, false));
    }

    private LayoutElementBuilders.LayoutElement button(String label, String screen) {
        return new LayoutElementBuilders.Box.Builder()
            .setWidth(DimensionBuilders.wrap())
            .setHeight(DimensionBuilders.wrap())
            .setHorizontalAlignment(LayoutElementBuilders.HORIZONTAL_ALIGN_CENTER)
            .setVerticalAlignment(LayoutElementBuilders.VERTICAL_ALIGN_CENTER)
            .setModifiers(new ModifiersBuilders.Modifiers.Builder()
                .setBackground(background(PRIMARY))
                .setPadding(new ModifiersBuilders.Padding.Builder()
                    .setStart(DimensionBuilders.dp(14))
                    .setEnd(DimensionBuilders.dp(14))
                    .setTop(DimensionBuilders.dp(8))
                    .setBottom(DimensionBuilders.dp(8))
                    .build())
                .setClickable(clickable("open-" + screen, screen))
                .build())
            .addContent(text(label, 15, BUTTON_TEXT, 1, true))
            .build();
    }

    private LayoutElementBuilders.LayoutElement text(String value, int sp, int color, int maxLines, boolean bold) {
        LayoutElementBuilders.FontStyle.Builder style = new LayoutElementBuilders.FontStyle.Builder()
            .setSize(DimensionBuilders.sp(sp))
            .setColor(ColorBuilders.argb(color));
        if (bold) style.setWeight(LayoutElementBuilders.FONT_WEIGHT_BOLD);
        return new LayoutElementBuilders.Text.Builder()
            .setText(shortText(value, 32))
            .setFontStyle(style.build())
            .setMaxLines(maxLines)
            .setOverflow(LayoutElementBuilders.TEXT_OVERFLOW_ELLIPSIZE_END)
            .setMultilineAlignment(LayoutElementBuilders.TEXT_ALIGN_CENTER)
            .build();
    }

    private LayoutElementBuilders.LayoutElement spacer(float height) {
        return new LayoutElementBuilders.Spacer.Builder()
            .setHeight(DimensionBuilders.dp(height))
            .build();
    }

    private ModifiersBuilders.Modifiers padded(float padding) {
        return new ModifiersBuilders.Modifiers.Builder()
            .setPadding(new ModifiersBuilders.Padding.Builder()
                .setAll(DimensionBuilders.dp(padding))
                .build())
            .setBackground(background(CARD))
            .build();
    }

    private ModifiersBuilders.Background background(int color) {
        return new ModifiersBuilders.Background.Builder()
            .setColor(ColorBuilders.argb(color))
            .build();
    }

    private ModifiersBuilders.Clickable clickable(String id, String screen) {
        return new ModifiersBuilders.Clickable.Builder()
            .setId(id)
            .setMinimumClickableWidth(DimensionBuilders.dp(48))
            .setMinimumClickableHeight(DimensionBuilders.dp(48))
            .setOnClick(new ActionBuilders.LaunchAction.Builder()
                .setAndroidActivity(new ActionBuilders.AndroidActivity.Builder()
                    .setPackageName(getPackageName())
                    .setClassName(MainActivity.class.getName())
                    .addKeyToExtraMapping(
                        MainActivity.EXTRA_SCREEN,
                        new ActionBuilders.AndroidStringExtra.Builder().setValue(screen).build()
                    )
                    .build())
                .build())
            .build();
    }

    static String sanitize(String value) {
        if (value == null) return "";
        String clean = value.trim();
        if (clean.isEmpty()) return "";
        if ("null".equalsIgnoreCase(clean) || "undefined".equalsIgnoreCase(clean)) return "";
        return clean;
    }

    static String shortText(String value, int max) {
        String clean = sanitize(value);
        if (clean.length() <= max) return clean;
        if (max <= 3) return clean.substring(0, max);
        return clean.substring(0, max - 3).trim() + "...";
    }

    static int count(JSONArray array) {
        return array == null ? 0 : array.length();
    }

    static JSONObject first(JSONArray array) {
        if (array == null || array.length() == 0) return null;
        return array.optJSONObject(0);
    }

    static String title(JSONObject item, String fallback) {
        if (item == null) return fallback;
        String title = sanitize(item.optString("title", ""));
        if (!title.isEmpty()) return title;
        title = sanitize(item.optString("name", ""));
        if (!title.isEmpty()) return title;
        title = sanitize(item.optString("project_title", ""));
        return title.isEmpty() ? fallback : title;
    }

    static JSONObject findWeeklyTarget(JSONArray items) {
        if (items == null) return null;
        JSONObject fallback = null;
        for (int i = 0; i < items.length(); i++) {
            JSONObject item = items.optJSONObject(i);
            if (item == null || item.optInt("weekly_target", 1) <= 1) continue;
            if (fallback == null) fallback = item;
            if (item.optInt("weekly_remaining_count", 0) > 0) return item;
        }
        return fallback;
    }

    static class TilePayload {
        final String title;
        final String primary;
        final String secondary;
        final String tertiary;
        final String action;
        final String screen;

        TilePayload(String title, String primary, String secondary, String tertiary, String action, String screen) {
            this.title = sanitize(title);
            this.primary = sanitize(primary);
            this.secondary = sanitize(secondary);
            this.tertiary = sanitize(tertiary);
            this.action = sanitize(action).isEmpty() ? "Open" : sanitize(action);
            this.screen = sanitize(screen).isEmpty() ? SCREEN_TODAY : sanitize(screen);
        }
    }
}
