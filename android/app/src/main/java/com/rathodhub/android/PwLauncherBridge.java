package com.rathodhub.android;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.webkit.JavascriptInterface;
import android.widget.Toast;

/** Opens only trusted pw.live links outside the RATHOD HUB WebView. */
public final class PwLauncherBridge {
    private static final String[] PW_PACKAGES = {
            "xyz.penpencil.physicswala",
            "com.pw.live"
    };

    private final Activity activity;

    public PwLauncherBridge(Activity activity) {
        this.activity = activity;
    }

    @JavascriptInterface public void open(String url) {
        activity.runOnUiThread(() -> openTrustedUrl(url));
    }

    private void openTrustedUrl(String url) {
        Uri uri;
        try {
            uri = Uri.parse(url);
        } catch (Exception error) {
            return;
        }
        String scheme = uri.getScheme();
        String host = uri.getHost();
        if (!"https".equalsIgnoreCase(scheme) || host == null
                || !("pw.live".equalsIgnoreCase(host)
                || host.toLowerCase().endsWith(".pw.live"))) return;

        for (String packageName : PW_PACKAGES) {
            try {
                Intent appIntent = new Intent(Intent.ACTION_VIEW, uri);
                appIntent.setPackage(packageName);
                appIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                activity.startActivity(appIntent);
                return;
            } catch (Exception ignored) { }
        }

        try {
            Intent fallback = new Intent(Intent.ACTION_VIEW, uri);
            fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            activity.startActivity(fallback);
        } catch (Exception error) {
            Toast.makeText(activity, "PW link open nahi hua.", Toast.LENGTH_SHORT).show();
        }
    }
}
