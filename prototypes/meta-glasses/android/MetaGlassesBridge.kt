package co.ourorbit.prototype.metaglasses

import android.Manifest
import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothManager
import android.content.Context
import android.content.pm.PackageManager
import androidx.core.content.ContextCompat

data class MetaGlassesCapabilities(
    val pairedDeviceDetected: Boolean,
    val display: Boolean,
    val input: Boolean,
    val camera: Boolean,
    val audio: Boolean,
)

data class MetaGlassesAction(
    val type: String,
    val payload: Map<String, String> = emptyMap(),
)

interface MetaGlassesListener {
    fun onAction(action: MetaGlassesAction)
    fun onDisconnected(reason: String)
}

class MetaGlassesBridge(
    private val context: Context,
    private val sdkAdapter: MetaSdkAdapter = MetaSdkAdapter(),
) {
    private var listener: MetaGlassesListener? = null

    fun setListener(listener: MetaGlassesListener?) {
        this.listener = listener
        sdkAdapter.setListener(listener)
    }

    fun getCapabilities(): MetaGlassesCapabilities {
        val sdkCapabilities = sdkAdapter.getCapabilities()
        val paired = hasPossibleMetaGlassesPairing()
        return MetaGlassesCapabilities(
            pairedDeviceDetected = paired,
            display = sdkCapabilities.display,
            input = sdkCapabilities.input,
            camera = sdkCapabilities.camera,
            audio = sdkCapabilities.audio,
        )
    }

    suspend fun connect(): Boolean {
        return sdkAdapter.connect()
    }

    suspend fun showCoachCard(title: String, message: String, actions: List<String>) {
        sdkAdapter.showCard(
            title = title.take(60),
            message = message.take(240),
            actions = actions.map { it.take(24) }.take(3),
        )
    }

    suspend fun showOrbitProgress(name: String, healthScore: Int?, level: Int?, milestone: String?) {
        val lines = listOfNotNull(
            healthScore?.let { "Health $it%" },
            level?.let { "Level $it" },
            milestone?.takeIf { it.isNotBlank() }?.let { "Next: ${it.take(48)}" },
        )
        sdkAdapter.showCard(
            title = name.take(60),
            message = lines.joinToString("\n"),
            actions = listOf("Open", "Refresh"),
        )
    }

    suspend fun clear() {
        sdkAdapter.clear()
    }

    @SuppressLint("MissingPermission")
    private fun hasPossibleMetaGlassesPairing(): Boolean {
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) {
            return false
        }
        val manager = context.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager ?: return false
        val adapter: BluetoothAdapter = manager.adapter ?: return false
        return adapter.bondedDevices.any { device ->
            val name = device.name.orEmpty().lowercase()
            name.contains("ray-ban") || name.contains("meta")
        }
    }
}

class MetaSdkAdapter {
    private var listener: MetaGlassesListener? = null

    data class SdkCapabilities(
        val display: Boolean = false,
        val input: Boolean = false,
        val camera: Boolean = false,
        val audio: Boolean = false,
    )

    fun setListener(listener: MetaGlassesListener?) {
        this.listener = listener
    }

    fun getCapabilities(): SdkCapabilities {
        // TODO: Replace with Meta Wearables Device Access Toolkit capability query.
        return SdkCapabilities()
    }

    suspend fun connect(): Boolean {
        // TODO: Replace with Meta toolkit device discovery/connect flow.
        return false
    }

    suspend fun showCard(title: String, message: String, actions: List<String>) {
        // TODO: Render text/list/buttons through the Meta display SDK.
    }

    suspend fun clear() {
        // TODO: Clear or dismiss the current glasses surface.
    }
}

