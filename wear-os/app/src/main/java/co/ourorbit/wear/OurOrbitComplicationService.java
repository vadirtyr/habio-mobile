package co.ourorbit.wear;

import com.OurOrbit.app.R;

import android.app.PendingIntent;
import android.content.Intent;
import android.graphics.drawable.Icon;
import android.os.RemoteException;

import org.json.JSONArray;
import org.json.JSONObject;

import androidx.wear.watchface.complications.data.ComplicationData;
import androidx.wear.watchface.complications.data.ComplicationText;
import androidx.wear.watchface.complications.data.ComplicationType;
import androidx.wear.watchface.complications.data.MonochromaticImage;
import androidx.wear.watchface.complications.data.PlainComplicationText;
import androidx.wear.watchface.complications.data.RangedValueComplicationData;
import androidx.wear.watchface.complications.data.ShortTextComplicationData;
import androidx.wear.watchface.complications.datasource.ComplicationDataSourceService;
import androidx.wear.watchface.complications.datasource.ComplicationRequest;

abstract class OurOrbitComplicationService extends ComplicationDataSourceService {
    static final String SCREEN_TODAY = "today";
    static final String SCREEN_TASKS = "tasks";
    static final String SCREEN_ORBITS = "orbits";

    @Override
    public void onComplicationRequest(
        ComplicationRequest request,
        ComplicationDataSourceService.ComplicationRequestListener listener
    ) {
        new Thread(() -> {
            JSONObject summary = WearSummaryClient.fetchSummary(this);
            ComplicationPayload payload = summary == null ? pairPayload() : buildPayload(summary);
            try {
                listener.onComplicationData(toData(request.getComplicationType(), payload));
            } catch (RemoteException ignored) {
                // The requesting watch face can disappear before async data returns.
            }
        }).start();
    }

    @Override
    public ComplicationData getPreviewData(ComplicationType type) {
        return toData(type, previewPayload());
    }

    abstract ComplicationPayload buildPayload(JSONObject summary);

    abstract ComplicationPayload previewPayload();

    ComplicationPayload pairPayload() {
        return ComplicationPayload.screen("Pair", "", "Pair watch", SCREEN_TODAY);
    }

    ComplicationData toData(ComplicationType type, ComplicationPayload payload) {
        if (type == ComplicationType.RANGED_VALUE && payload.hasRange()) {
            RangedValueComplicationData.Builder builder = new RangedValueComplicationData.Builder(
                payload.value,
                payload.min,
                payload.max,
                text(payload.contentDescription())
            );
            builder.setText(text(payload.text));
            if (!payload.title.isEmpty()) builder.setTitle(text(payload.title));
            builder.setMonochromaticImage(complicationIcon());
            builder.setTapAction(tapAction(payload));
            return builder.build();
        }

        ShortTextComplicationData.Builder builder = new ShortTextComplicationData.Builder(
            text(payload.text),
            text(payload.contentDescription())
        );
        if (!payload.title.isEmpty()) builder.setTitle(text(payload.title));
        builder.setMonochromaticImage(complicationIcon());
        builder.setTapAction(tapAction(payload));
        return builder.build();
    }

    private PendingIntent tapAction(ComplicationPayload payload) {
        Intent intent = new Intent(this, MainActivity.class);
        if (!payload.itemId.isEmpty()) {
            intent.setAction(MainActivity.ACTION_OPEN_ITEM)
                .putExtra(NotificationActionReceiver.EXTRA_ITEM_ID, payload.itemId)
                .putExtra(NotificationActionReceiver.EXTRA_ITEM_TYPE, payload.itemType);
        } else {
            intent.setAction(MainActivity.ACTION_OPEN_SCREEN)
                .putExtra(MainActivity.EXTRA_SCREEN, payload.screen);
        }
        return PendingIntent.getActivity(
            this,
            payload.requestCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }

    private MonochromaticImage complicationIcon() {
        return new MonochromaticImage.Builder(
            Icon.createWithResource(this, R.drawable.ic_complication)
        ).build();
    }

    static ComplicationText text(String value) {
        return new PlainComplicationText.Builder(sanitize(value)).build();
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
        if (max <= 1) return clean.substring(0, max);
        return clean.substring(0, max - 1).trim() + "...";
    }

    static int optInt(JSONObject item, String key, int fallback) {
        if (item == null || !item.has(key) || item.isNull(key)) return fallback;
        return item.optInt(key, fallback);
    }

    static JSONObject optObject(JSONArray array, int index) {
        if (array == null || index < 0 || index >= array.length()) return null;
        return array.optJSONObject(index);
    }

    static class ComplicationPayload {
        final String text;
        final String title;
        final String description;
        final String screen;
        final String itemId;
        final String itemType;
        final float value;
        final float min;
        final float max;

        private ComplicationPayload(
            String text,
            String title,
            String description,
            String screen,
            String itemId,
            String itemType,
            float value,
            float min,
            float max
        ) {
            this.text = sanitize(text);
            this.title = sanitize(title);
            this.description = sanitize(description);
            this.screen = sanitize(screen).isEmpty() ? SCREEN_TODAY : sanitize(screen);
            this.itemId = sanitize(itemId);
            this.itemType = sanitize(itemType);
            this.value = value;
            this.min = min;
            this.max = max;
        }

        static ComplicationPayload screen(String text, String title, String description, String screen) {
            return new ComplicationPayload(text, title, description, screen, "", "", 0f, 0f, 0f);
        }

        static ComplicationPayload item(String text, String title, String description, String itemId, String itemType) {
            return new ComplicationPayload(text, title, description, SCREEN_TODAY, itemId, itemType, 0f, 0f, 0f);
        }

        ComplicationPayload withRange(float value, float min, float max) {
            return new ComplicationPayload(text, title, description, screen, itemId, itemType, value, min, max);
        }

        boolean hasRange() {
            return max > min;
        }

        String contentDescription() {
            if (!description.isEmpty()) return description;
            if (!title.isEmpty()) return title + " " + text;
            return text.isEmpty() ? "OurOrbit" : text;
        }

        int requestCode() {
            int hash = (screen + ":" + itemId + ":" + itemType + ":" + text).hashCode();
            return Math.abs(hash == Integer.MIN_VALUE ? 0 : hash);
        }
    }
}
