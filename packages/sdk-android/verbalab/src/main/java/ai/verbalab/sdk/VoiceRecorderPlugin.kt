package ai.verbalab.sdk

import android.content.Context
import android.media.MediaRecorder
import android.os.Build
import java.io.File

/**
 * Phone plugin: record voice on device, upload to VerbaLab Echo STT, return transcript text.
 *
 * Requires RECORD_AUDIO permission in the host app.
 */
class VoiceRecorderPlugin(
    private val client: VerbaLabClient,
    private var tier: String = "standard",
) {
    var sessionId: String? = null
        private set
    var language: String? = null
        private set

    private var recorder: MediaRecorder? = null
    private var outputFile: File? = null

    suspend fun startSession(
        language: String? = null,
        platform: String = "android",
        label: String? = null,
    ): Map<String, Any?> {
        val body = mutableMapOf<String, Any?>(
            "platform" to platform,
            "tier" to tier,
        )
        if (language != null) body["language"] = language
        if (label != null) body["label"] = label
        val res = client.call("/v1/voice-recorder-plugin/sessions", "POST", jsonBody = body)
        val session = res["session"] as? Map<*, *>
        sessionId = session?.get("id") as? String
        this.language = language
        return res
    }

    /** Begin local microphone capture. Call [stopAndTranscribe] when done. */
    fun beginRecording(context: Context) {
        val file = File(context.cacheDir, "verbalab-rec-${System.currentTimeMillis()}.m4a")
        val mediaRecorder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            MediaRecorder(context)
        } else {
            @Suppress("DEPRECATION")
            MediaRecorder()
        }
        mediaRecorder.setAudioSource(MediaRecorder.AudioSource.MIC)
        mediaRecorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
        mediaRecorder.setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
        mediaRecorder.setAudioSamplingRate(16000)
        mediaRecorder.setAudioChannels(1)
        mediaRecorder.setOutputFile(file.absolutePath)
        mediaRecorder.prepare()
        mediaRecorder.start()
        recorder = mediaRecorder
        outputFile = file
    }

    suspend fun stopAndTranscribe(title: String? = null): Map<String, Any?> {
        val mediaRecorder = recorder ?: error("No active recording")
        mediaRecorder.stop()
        mediaRecorder.release()
        recorder = null
        val file = outputFile ?: error("No recording file")
        val bytes = file.readBytes()
        return transcribe(
            file = bytes,
            fileName = file.name,
            mimeType = "audio/mp4",
            title = title,
        )
    }

    /** Upload an already-recorded clip. */
    suspend fun transcribe(
        file: ByteArray,
        fileName: String = "recording.m4a",
        mimeType: String = "audio/mp4",
        title: String? = null,
        language: String? = null,
    ): Map<String, Any?> {
        if (sessionId == null) {
            startSession(language = language ?: this.language, platform = "android")
        }
        val fields = mutableMapOf(
            "tier" to tier,
        )
        sessionId?.let { fields["sessionId"] = it }
        (language ?: this.language)?.let { fields["language"] = it }
        title?.let { fields["title"] = it }
        return client.requestMultipart(
            "/v1/voice-recorder-plugin/transcribe",
            "file",
            fileName,
            file,
            mimeType,
            fields,
        )
    }

    suspend fun finalize(): Map<String, Any?> {
        val id = sessionId ?: error("sessionId missing — startSession first")
        return client.call(
            "/v1/voice-recorder-plugin/finalize",
            "POST",
            jsonBody = mapOf("sessionId" to id),
        )
    }

    suspend fun installManifest(): Map<String, Any?> =
        client.call("/v1/voice-recorder-plugin/manifest", "GET", query = mapOf("platform" to "android"))
}
