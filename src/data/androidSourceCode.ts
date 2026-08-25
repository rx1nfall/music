export interface AndroidProjectFile {
  path: string;
  name: string;
  category: "manifest" | "gradle" | "kotlin" | "ui";
  description: string;
  content: string;
}

export const ANDROID_PROJECT_FILES: AndroidProjectFile[] = [
  {
    path: "app/src/main/AndroidManifest.xml",
    name: "AndroidManifest.xml",
    category: "manifest",
    description: "App manifest with Foreground Service, Media3 playback, Network & Bluetooth permissions",
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Network permissions for streaming and desktop sync -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
    
    <!-- Background Audio Playback & Media3 Foreground Service -->
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    
    <!-- Bluetooth & Audio output routing -->
    <uses-permission android:name="android.permission.BLUETOOTH" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />

    <application
        android:name=".SyncWaveApplication"
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.SyncWave"
        android:usesCleartextTraffic="true">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTop"
            android:theme="@style/Theme.SyncWave">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
            
            <!-- Deep linking for desktop 6-digit sync pairing -->
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="syncwave" android:host="pair" />
            </intent-filter>
        </activity>

        <!-- AndroidX Media3 Background Audio Playback Service -->
        <service
            android:name=".service.MusicSyncPlaybackService"
            android:exported="false"
            android:foregroundServiceType="mediaPlayback">
            <intent-filter>
                <action android:name="androidx.media3.session.MediaSessionService" />
            </intent-filter>
        </service>

    </application>
</manifest>`,
  },
  {
    path: "app/build.gradle.kts",
    name: "app/build.gradle.kts",
    category: "gradle",
    description: "App Gradle dependencies for Jetpack Compose, Material 3, Media3 ExoPlayer, Retrofit",
    content: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.kotlin.serialization)
}

android {
    namespace = "com.syncwave.music"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.syncwave.music"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
    }
}

dependencies {
    // AndroidX & Core KTX
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.activity.compose)

    // Jetpack Compose & Material 3 Dynamic Theming
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.graphics)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.compose.material3)
    implementation(libs.androidx.compose.material.icons.extended)

    // AndroidX Media3 ExoPlayer (Gapless, FLAC 24-bit 96kHz, HTTP Range streaming)
    implementation(libs.androidx.media3.exoplayer)
    implementation(libs.androidx.media3.exoplayer.flac)
    implementation(libs.androidx.media3.session)
    implementation(libs.androidx.media3.ui)
    implementation(libs.androidx.media3.common)

    // Networking & Sync API (Retrofit, OkHttp, KotlinX Serialization)
    implementation(libs.retrofit)
    implementation(libs.retrofit.kotlinx.serialization)
    implementation(libs.okhttp)
    implementation(libs.okhttp.logging)
    implementation(libs.kotlinx.serialization.json)
    implementation(libs.kotlinx.coroutines.android)

    // Local Caching & Image Loading (Coil for Compose)
    implementation(libs.coil.compose)
    implementation(libs.androidx.room.runtime)
    implementation(libs.androidx.room.ktx)
}`,
  },
  {
    path: "app/src/main/java/com/syncwave/music/MainActivity.kt",
    name: "MainActivity.kt",
    category: "kotlin",
    description: "Main Activity with Material You dynamic color system and Jetpack Compose navigation",
    content: `package com.syncwave.music

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.viewmodel.compose.viewModel
import com.syncwave.music.ui.SyncWaveNavGraph
import com.syncwave.music.ui.viewmodel.MusicSyncViewModel

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            SyncWaveTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    val viewModel: MusicSyncViewModel = viewModel()
                    SyncWaveNavGraph(viewModel = viewModel)
                }
            }
        }
    }
}

@Composable
fun SyncWaveTheme(
    darkTheme: Boolean = true,
    dynamicColor: Boolean = true,
    content: @Composable () -> Unit
) {
    val context = LocalContext.current
    val colorScheme = when {
        dynamicColor && android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S -> {
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        else -> darkColorScheme()
    }

    MaterialTheme(
        colorScheme = colorScheme,
        content = content
    )
}`,
  },
  {
    path: "app/src/main/java/com/syncwave/music/service/MusicSyncPlaybackService.kt",
    name: "MusicSyncPlaybackService.kt",
    category: "kotlin",
    description: "Media3 MediaSession foreground service managing ExoPlayer & lockscreen notification",
    content: `package com.syncwave.music.service

import android.app.PendingIntent
import android.content.Intent
import androidx.annotation.OptIn
import androidx.media3.common.AudioAttributes
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.session.MediaSession
import androidx.media3.session.MediaSessionService
import com.syncwave.music.MainActivity

class MusicSyncPlaybackService : MediaSessionService() {

    private var mediaSession: MediaSession? = null
    private lateinit var player: ExoPlayer

    @OptIn(UnstableApi::class)
    override fun onCreate() {
        super.onCreate()

        // Initialize ExoPlayer with audiophile attributes & lossless FLAC support
        val audioAttributes = AudioAttributes.Builder()
            .setContentType(C.AUDIO_CONTENT_TYPE_MUSIC)
            .setUsage(C.USAGE_MEDIA)
            .build()

        player = ExoPlayer.Builder(this)
            .setAudioAttributes(audioAttributes, true)
            .setHandleAudioBecomingNoisy(true)
            .setWakeMode(C.WAKE_MODE_LOCAL)
            .build()

        val sessionActivityPendingIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE
        )

        mediaSession = MediaSession.Builder(this, player)
            .setSessionActivity(sessionActivityPendingIntent)
            .build()
    }

    override fun onGetSession(controllerInfo: MediaSession.ControllerInfo): MediaSession? {
        return mediaSession
    }

    override fun onDestroy() {
        mediaSession?.run {
            player.release()
            release()
            mediaSession = null
        }
        super.onDestroy()
    }
}`,
  },
  {
    path: "app/src/main/java/com/syncwave/music/network/SyncApiClient.kt",
    name: "SyncApiClient.kt",
    category: "kotlin",
    description: "Retrofit client communicating with SyncWave desktop server & streaming endpoints",
    content: `package com.syncwave.music.network

import kotlinx.serialization.Serializable
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import java.util.concurrent.TimeUnit
import kotlinx.serialization.json.Json

@Serializable
data class JoinSessionRequest(val sessionCode: String)

@Serializable
data class JoinSessionResponse(
    val success: Boolean,
    val sessionId: String,
    val sessionCode: String,
    val hostDevice: String,
    val tracks: List<SyncTrackDto>,
    val playbackState: RemotePlaybackStateDto? = null
)

@Serializable
data class SyncTrackDto(
    val id: String,
    val title: String,
    val artist: String,
    val album: String,
    val duration: Double,
    val format: String,
    val bitrate: String? = null,
    val sampleRate: String? = null,
    val isLossless: Boolean = false,
    val fileSize: Long = 0,
    val coverArtUrl: String? = null
)

@Serializable
data class RemotePlaybackStateDto(
    val currentTrackId: String? = null,
    val isPlaying: Boolean = false,
    val currentTime: Double = 0.0,
    val duration: Double = 0.0,
    val volume: Double = 1.0,
    val shuffle: Boolean = false,
    val repeatMode: String = "off"
)

@Serializable
data class SyncStateRequest(
    val sessionId: String,
    val playbackState: RemotePlaybackStateDto
)

interface SyncApiService {
    @POST("/api/sync/join-session")
    suspend fun joinSession(@Body body: JoinSessionRequest): JoinSessionResponse

    @GET("/api/sync/library/{sessionId}")
    suspend fun getLibrary(@Path("sessionId") sessionId: String): JoinSessionResponse

    @POST("/api/sync/state")
    suspend fun updatePlaybackState(@Body body: SyncStateRequest)

    @GET("/api/sync/state/{sessionId}")
    suspend fun getPlaybackState(@Path("sessionId") sessionId: String): RemotePlaybackStateDto
}

object SyncApiClient {
    private val json = Json { ignoreUnknownKeys = true; isLenient = true }

    fun create(baseUrl: String): SyncApiService {
        val okHttpClient = OkHttpClient.Builder()
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .addInterceptor(HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BASIC
            })
            .build()

        val contentType = okhttp3.MediaType.get("application/json")

        return Retrofit.Builder()
            .baseUrl(baseUrl)
            .client(okHttpClient)
            .addConverterFactory(json.asConverterFactory(contentType))
            .build()
            .create(SyncApiService::class.java)
    }
}`,
  },
  {
    path: "app/src/main/java/com/syncwave/music/ui/screens/PlayerScreen.kt",
    name: "PlayerScreen.kt",
    category: "ui",
    description: "Jetpack Compose Music Player UI with squiggly scrubber and Material 3 controls",
    content: `package com.syncwave.music.ui.screens

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.syncwave.music.network.SyncTrackDto
import com.syncwave.music.ui.viewmodel.MusicSyncViewModel

@Composable
fun PlayerScreen(
    viewModel: MusicSyncViewModel,
    onNavigateToEqualizer: () -> Unit,
    onNavigateToVault: () -> Unit,
    onNavigateToSync: () -> Unit
) {
    val currentTrack by viewModel.currentTrack.collectAsState()
    val isPlaying by viewModel.isPlaying.collectAsState()
    val currentProgress by viewModel.currentPositionSeconds.collectAsState()
    val durationSeconds by viewModel.durationSeconds.collectAsState()
    val isConnected by viewModel.isConnected.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(horizontal = 24.dp, vertical = 16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        // Top Header Bar
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onNavigateToSync) {
                Icon(
                    imageVector = Icons.Rounded.CloudSync,
                    contentDescription = "Sync",
                    tint = if (isConnected) Color(0xFF4ADE80) else MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = "PLAYING FROM DESKTOP",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    letterSpacing = 1.5.sp
                )
                Text(
                    text = if (isConnected) "Lossless Stream (WiFi)" else "Offline Cache",
                    style = MaterialTheme.typography.bodySmall,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
            }
            IconButton(onClick = onNavigateToEqualizer) {
                Icon(
                    imageVector = Icons.Rounded.GraphicEq,
                    contentDescription = "Equalizer",
                    tint = MaterialTheme.colorScheme.primary
                )
            }
        }

        // Album Art with Material You Glow
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .aspectRatio(1f)
                .padding(16.dp)
                .clip(RoundedCornerShape(28.dp))
                .background(MaterialTheme.colorScheme.surfaceVariant),
            contentAlignment = Alignment.Center
        ) {
            if (currentTrack?.coverArtUrl != null) {
                AsyncImage(
                    model = currentTrack?.coverArtUrl,
                    contentDescription = "Cover Art",
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize()
                )
            } else {
                Icon(
                    imageVector = Icons.Rounded.MusicNote,
                    contentDescription = null,
                    modifier = Modifier.size(96.dp),
                    tint = MaterialTheme.colorScheme.primary
                )
            }
        }

        // Metadata & Lossless Badge
        Column(
            modifier = Modifier.fillMaxWidth(),
            horizontalAlignment = Alignment.Start
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = currentTrack?.title ?: "Select a Track",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        text = currentTrack?.artist ?: "SyncWave Android Player",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
                
                // Lossless Badge
                if (currentTrack?.isLossless == true) {
                    SuggestionChip(
                        onClick = {},
                        label = { Text("FLAC 24-bit", style = MaterialTheme.typography.labelSmall) }
                    )
                }
            }
        }

        // Seeker Bar (Android 14 Squiggly Waveform Style)
        Column(modifier = Modifier.fillMaxWidth()) {
            Slider(
                value = if (durationSeconds > 0) (currentProgress / durationSeconds).toFloat() else 0f,
                onValueChange = { fraction ->
                    viewModel.seekTo(fraction * durationSeconds)
                },
                modifier = Modifier.fillMaxWidth()
            )
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = formatTime(currentProgress),
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = formatTime(durationSeconds),
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        // Main Playback Controls
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly,
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = { viewModel.toggleShuffle() }) {
                Icon(Icons.Rounded.Shuffle, contentDescription = "Shuffle")
            }
            IconButton(onClick = { viewModel.skipPrevious() }, modifier = Modifier.size(56.dp)) {
                Icon(Icons.Rounded.SkipPrevious, contentDescription = "Previous", modifier = Modifier.size(36.dp))
            }
            FloatingActionButton(
                onClick = { viewModel.togglePlayPause() },
                shape = CircleShape,
                modifier = Modifier.size(72.dp),
                containerColor = MaterialTheme.colorScheme.primaryContainer,
                contentColor = MaterialTheme.colorScheme.onPrimaryContainer
            ) {
                Icon(
                    imageVector = if (isPlaying) Icons.Rounded.Pause else Icons.Rounded.PlayArrow,
                    contentDescription = if (isPlaying) "Pause" else "Play",
                    modifier = Modifier.size(40.dp)
                )
            }
            IconButton(onClick = { viewModel.skipNext() }, modifier = Modifier.size(56.dp)) {
                Icon(Icons.Rounded.SkipNext, contentDescription = "Next", modifier = Modifier.size(36.dp))
            }
            IconButton(onClick = { viewModel.toggleRepeat() }) {
                Icon(Icons.Rounded.Repeat, contentDescription = "Repeat")
            }
        }
        
        Spacer(modifier = Modifier.height(8.dp))
    }
}

fun formatTime(seconds: Double): String {
    val totalSec = seconds.toInt()
    val min = totalSec / 60
    val sec = totalSec % 60
    return String.format("%d:%02d", min, sec)
}`,
  },
];
