package com.rathodhub.android;

import android.Manifest;
import android.app.Activity;
import android.app.DownloadManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.ComponentName;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.text.TextUtils;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.URLUtil;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import java.util.ArrayList;
import java.util.List;

public class MainActivity extends Activity {
    private static final String START_URL = "file:///android_asset/index.html";
    private static final String PREFS = "focus";
    private static final String KEY_ENABLED = "enabled";
    private static final String KEY_UNTIL = "focus_until";
    private static final String NOTIFICATION_CHANNEL = "rathod_hub_updates";
    private static final int REQUEST_WEB_PERMISSIONS = 201;
    private static final int REQUEST_NOTIFICATIONS = 202;
    private static final int REQUEST_FILE = 203;

    private SharedPreferences prefs;
    private WebView webView;
    private ValueCallback<Uri[]> fileCallback;
    private PermissionRequest pendingWebPermission;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        prefs = getSharedPreferences(PREFS, MODE_PRIVATE);
        getWindow().setStatusBarColor(Color.rgb(7, 9, 13));
        getWindow().setNavigationBarColor(Color.rgb(7, 9, 13));
        createNotificationChannel();
        buildWebApp();
    }

    private void buildWebApp() {
        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(7, 9, 13));
        webView.setOverScrollMode(WebView.OVER_SCROLL_NEVER);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(true);
        settings.setSupportMultipleWindows(false);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            webView.setRendererPriorityPolicy(WebView.RENDERER_PRIORITY_IMPORTANT, false);
        }

        webView.addJavascriptInterface(new AndroidNotificationsBridge(), "AndroidNotifications");
        webView.addJavascriptInterface(new FocusBridge(), "AndroidFocus");
        webView.setWebChromeClient(new PremiumChromeClient());
        webView.setWebViewClient(new PremiumWebClient());
        webView.setDownloadListener((url, userAgent, contentDisposition, mimeType, size) ->
                startDownload(url, userAgent, contentDisposition, mimeType));

        setContentView(webView);
        webView.loadUrl(START_URL);
    }

    private final class PremiumWebClient extends WebViewClient {
        @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            Uri uri = request.getUrl();
            String scheme = uri.getScheme();
            if ("http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme)
                    || "file".equalsIgnoreCase(scheme)) return false;
            try {
                startActivity(new Intent(Intent.ACTION_VIEW, uri));
                return true;
            } catch (Exception ignored) {
                return false;
            }
        }

        @Override public void onPageFinished(WebView view, String url) {
            super.onPageFinished(view, url);
            injectFocusBridge();
        }
    }

    private final class PremiumChromeClient extends WebChromeClient {
        @Override public void onPermissionRequest(PermissionRequest request) {
            runOnUiThread(() -> requestWebPermissions(request));
        }

        @Override public boolean onShowFileChooser(
                WebView view,
                ValueCallback<Uri[]> callback,
                FileChooserParams params) {
            if (fileCallback != null) fileCallback.onReceiveValue(null);
            fileCallback = callback;
            try {
                Intent chooser = params.createIntent();
                chooser.addCategory(Intent.CATEGORY_OPENABLE);
                startActivityForResult(chooser, REQUEST_FILE);
                return true;
            } catch (Exception error) {
                fileCallback = null;
                Toast.makeText(MainActivity.this,
                        "File picker open nahi hua.", Toast.LENGTH_SHORT).show();
                return false;
            }
        }
    }

    private void requestWebPermissions(PermissionRequest request) {
        pendingWebPermission = request;
        List<String> needed = new ArrayList<>();
        for (String resource : request.getResources()) {
            if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(resource)
                    && checkSelfPermission(Manifest.permission.CAMERA)
                    != PackageManager.PERMISSION_GRANTED) {
                needed.add(Manifest.permission.CAMERA);
            }
            if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(resource)
                    && checkSelfPermission(Manifest.permission.RECORD_AUDIO)
                    != PackageManager.PERMISSION_GRANTED) {
                needed.add(Manifest.permission.RECORD_AUDIO);
            }
        }
        if (needed.isEmpty()) {
            request.grant(request.getResources());
            pendingWebPermission = null;
        } else {
            requestPermissions(needed.toArray(new String[0]), REQUEST_WEB_PERMISSIONS);
        }
    }

    @Override public void onRequestPermissionsResult(
            int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQUEST_WEB_PERMISSIONS && pendingWebPermission != null) {
            boolean granted = true;
            for (int result : grantResults) {
                if (result != PackageManager.PERMISSION_GRANTED) {
                    granted = false;
                    break;
                }
            }
            if (granted) pendingWebPermission.grant(pendingWebPermission.getResources());
            else pendingWebPermission.deny();
            pendingWebPermission = null;
        }
        if (requestCode == REQUEST_NOTIFICATIONS) notifyPermissionResultToWeb();
    }

    @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != REQUEST_FILE || fileCallback == null) return;
        Uri[] result = WebChromeClient.FileChooserParams.parseResult(resultCode, data);
        fileCallback.onReceiveValue(result);
        fileCallback = null;
    }

    private void startDownload(
            String url, String userAgent, String contentDisposition, String mimeType) {
        try {
            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
            request.addRequestHeader("User-Agent", userAgent);
            String cookies = CookieManager.getInstance().getCookie(url);
            if (cookies != null) request.addRequestHeader("Cookie", cookies);
            request.setMimeType(mimeType);
            request.setTitle(URLUtil.guessFileName(url, contentDisposition, mimeType));
            request.setNotificationVisibility(
                    DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            ((DownloadManager) getSystemService(DOWNLOAD_SERVICE)).enqueue(request);
            Toast.makeText(this, "Download started", Toast.LENGTH_SHORT).show();
        } catch (Exception error) {
            try {
                startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
            } catch (Exception ignored) {
                Toast.makeText(this, "Download nahi hua.", Toast.LENGTH_SHORT).show();
            }
        }
    }

    private void injectFocusBridge() {
        String script = "(function(){"
                + "if(window.__rhNativeFocusHooked)return;window.__rhNativeFocusHooked=true;"
                + "window.__rhSyncNativeFocus=function(){try{"
                + "if(window.focusState&&focusState.status==='running'&&!focusState.break&&typeof focusRemaining==='function')"
                + "AndroidFocus.startFocus(Math.max(1,Math.ceil(focusRemaining()/60)));"
                + "else AndroidFocus.stopFocus();}catch(e){console.warn('Focus bridge',e)}};"
                + "['startFocusTimer'].forEach(function(n){var f=window[n];if(typeof f==='function')window[n]=function(){var r=f.apply(this,arguments);setTimeout(window.__rhSyncNativeFocus,0);return r;}});"
                + "['pauseFocusTimer','stopFocusTimer','resetFocusTimer','completeFocusTimer'].forEach(function(n){var f=window[n];if(typeof f==='function')window[n]=function(){AndroidFocus.stopFocus();return f.apply(this,arguments);}});"
                + "setTimeout(window.__rhSyncNativeFocus,700);"
                + "})();";
        webView.evaluateJavascript(script, value -> { });
    }

    private void startFocus(int minutes) {
        int safeMinutes = Math.max(1, Math.min(720, minutes));
        long until = System.currentTimeMillis() + safeMinutes * 60_000L;
        prefs.edit().putBoolean(KEY_ENABLED, true).putLong(KEY_UNTIL, until).apply();
        if (!isAccessibilityServiceEnabled()) {
            Toast.makeText(this,
                    "Accessibility me RATHOD HUB Focus Shield ON karein.",
                    Toast.LENGTH_LONG).show();
            startActivity(new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS));
        }
    }

    private void stopFocus() {
        prefs.edit().putBoolean(KEY_ENABLED, false).remove(KEY_UNTIL).apply();
    }

    private boolean isFocusActive() {
        return prefs.getBoolean(KEY_ENABLED, false)
                && prefs.getLong(KEY_UNTIL, 0L) > System.currentTimeMillis();
    }

    private boolean isAccessibilityServiceEnabled() {
        String expected = new ComponentName(this,
                FocusAccessibilityService.class).flattenToString();
        String enabled = Settings.Secure.getString(
                getContentResolver(), Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES);
        if (enabled == null) return false;
        TextUtils.SimpleStringSplitter splitter = new TextUtils.SimpleStringSplitter(':');
        splitter.setString(enabled);
        while (splitter.hasNext()) {
            if (expected.equalsIgnoreCase(splitter.next())) return true;
        }
        return false;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationChannel channel = new NotificationChannel(
                NOTIFICATION_CHANNEL,
                "RATHOD HUB Notifications",
                NotificationManager.IMPORTANCE_HIGH);
        channel.setDescription("Study timer, quiz, motivation and community updates");
        channel.enableVibration(true);
        getSystemService(NotificationManager.class).createNotificationChannel(channel);
    }

    private boolean hasNotificationPermission() {
        return Build.VERSION.SDK_INT < 33
                || checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)
                == PackageManager.PERMISSION_GRANTED;
    }

    private void requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= 33 && !hasNotificationPermission()) {
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS},
                    REQUEST_NOTIFICATIONS);
        } else notifyPermissionResultToWeb();
    }

    private void notifyPermissionResultToWeb() {
        if (webView == null) return;
        String state = hasNotificationPermission() ? "granted" : "denied";
        webView.evaluateJavascript(
                "if(window.__onAndroidNotificationPermissionResponse)"
                        + "window.__onAndroidNotificationPermissionResponse('" + state + "');",
                value -> { });
    }

    private void showNativeNotification(String title, String body, String tag) {
        if (!hasNotificationPermission()) {
            requestNotificationPermission();
            return;
        }
        Intent openApp = new Intent(this, MainActivity.class)
                .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this,
                0,
                openApp,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Notification.Builder builder = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? new Notification.Builder(this, NOTIFICATION_CHANNEL)
                : new Notification.Builder(this);
        builder.setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle(title == null || title.isEmpty() ? "RATHOD HUB" : title)
                .setContentText(body == null ? "" : body)
                .setStyle(new Notification.BigTextStyle().bigText(body == null ? "" : body))
                .setAutoCancel(true)
                .setContentIntent(pendingIntent);
        int id = tag == null || tag.isEmpty() ? (int) System.currentTimeMillis() : tag.hashCode();
        ((NotificationManager) getSystemService(NOTIFICATION_SERVICE)).notify(id, builder.build());
    }

    public final class AndroidNotificationsBridge {
        @JavascriptInterface public boolean isNotificationPermissionGranted() {
            return hasNotificationPermission();
        }

        @JavascriptInterface public void requestNotificationPermission() {
            runOnUiThread(MainActivity.this::requestNotificationPermission);
        }

        @JavascriptInterface public void showNotification(String title, String body, String tag) {
            runOnUiThread(() -> showNativeNotification(title, body, tag));
        }
    }

    public final class FocusBridge {
        @JavascriptInterface public void startFocus(int minutes) {
            runOnUiThread(() -> MainActivity.this.startFocus(minutes));
        }

        @JavascriptInterface public void stopFocus() {
            runOnUiThread(MainActivity.this::stopFocus);
        }

        @JavascriptInterface public boolean isFocusActive() {
            return MainActivity.this.isFocusActive();
        }
    }

    @Override public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }

    @Override protected void onDestroy() {
        if (webView != null) {
            webView.removeJavascriptInterface("AndroidNotifications");
            webView.removeJavascriptInterface("AndroidFocus");
            webView.stopLoading();
            webView.destroy();
        }
        super.onDestroy();
    }
}
