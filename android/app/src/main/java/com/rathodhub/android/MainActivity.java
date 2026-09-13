package com.rathodhub.android;

import android.app.Activity;
import android.content.ComponentName;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.os.Bundle;
import android.provider.Settings;
import android.text.TextUtils;
import android.view.Gravity;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.Toast;

public class MainActivity extends Activity {
    private static final String HUB_URL = "https://teachnlogy7509-pixel.github.io/RATHOD-HUB/";
    private static final String PREFS = "focus";
    private static final String KEY_ENABLED = "enabled";
    private static final String KEY_UNTIL = "focus_until";

    private SharedPreferences prefs;
    private WebView webView;
    private Button focusButton;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        prefs = getSharedPreferences(PREFS, MODE_PRIVATE);
        buildUi();
    }

    private void buildUi() {
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.rgb(7, 9, 13));

        LinearLayout bar = new LinearLayout(this);
        bar.setPadding(12, 8, 12, 8);
        bar.setGravity(Gravity.CENTER_VERTICAL);

        Button homeButton = new Button(this);
        homeButton.setText("RATHOD HUB");
        homeButton.setOnClickListener(v -> webView.loadUrl(HUB_URL));
        bar.addView(homeButton, new LinearLayout.LayoutParams(0, 50, 1));

        focusButton = new Button(this);
        focusButton.setOnClickListener(v -> openWebFocusTimer());
        bar.addView(focusButton, new LinearLayout.LayoutParams(-2, 50));
        root.addView(bar);

        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(7, 9, 13));
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        webView.addJavascriptInterface(new FocusBridge(), "AndroidFocus");
        webView.setWebViewClient(new WebViewClient() {
            @Override public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                injectFocusBridge();
            }
        });
        webView.loadUrl(HUB_URL);
        root.addView(webView, new LinearLayout.LayoutParams(-1, 0, 1));

        setContentView(root);
        updateFocusButton();
    }

    private void injectFocusBridge() {
        String script = "(function(){"
                + "if(window.__rhNativeFocusHooked)return;window.__rhNativeFocusHooked=true;"
                + "window.__rhSyncNativeFocus=function(){try{"
                + "if(window.focusState&&focusState.status==='running'&&!focusState.break&&typeof focusRemaining==='function')"
                + "AndroidFocus.startFocus(Math.max(1,Math.ceil(focusRemaining()/60)));"
                + "else AndroidFocus.stopFocus();}catch(e){console.warn(e)}};"
                + "['startFocusTimer'].forEach(function(n){var f=window[n];if(typeof f==='function')window[n]=function(){var r=f.apply(this,arguments);setTimeout(window.__rhSyncNativeFocus,0);return r;}});"
                + "['pauseFocusTimer','stopFocusTimer','resetFocusTimer','completeFocusTimer'].forEach(function(n){var f=window[n];if(typeof f==='function')window[n]=function(){AndroidFocus.stopFocus();return f.apply(this,arguments);}});"
                + "setTimeout(window.__rhSyncNativeFocus,700);"
                + "})();";
        webView.evaluateJavascript(script, value -> { });
    }

    private void openWebFocusTimer() {
        webView.evaluateJavascript(
                "if(typeof switchTab==='function'){switchTab('focus');true}else{false}",
                value -> { });
        Toast.makeText(this,
                "Focus timer Start karte hi app blocking automatically on hogi.",
                Toast.LENGTH_SHORT).show();
    }

    private void startFocus(int minutes) {
        int safeMinutes = Math.max(1, Math.min(720, minutes));
        long until = System.currentTimeMillis() + safeMinutes * 60_000L;
        prefs.edit().putBoolean(KEY_ENABLED, true).putLong(KEY_UNTIL, until).apply();
        updateFocusButton();

        if (!isAccessibilityServiceEnabled()) {
            Toast.makeText(this,
                    "RATHOD HUB Focus Shield ko Accessibility me enable karein.",
                    Toast.LENGTH_LONG).show();
            startActivity(new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS));
        } else {
            Toast.makeText(this,
                    "Focus Shield ON — sirf PW aur RATHOD HUB allowed.",
                    Toast.LENGTH_SHORT).show();
        }
    }

    private void stopFocus() {
        prefs.edit().putBoolean(KEY_ENABLED, false).remove(KEY_UNTIL).apply();
        updateFocusButton();
    }

    private boolean isFocusActive() {
        long until = prefs.getLong(KEY_UNTIL, 0L);
        boolean active = prefs.getBoolean(KEY_ENABLED, false)
                && until > System.currentTimeMillis();
        if (!active && prefs.getBoolean(KEY_ENABLED, false)) stopFocus();
        return active;
    }

    private void updateFocusButton() {
        if (focusButton == null) return;
        focusButton.setText(isFocusActive() ? "Shield ON" : "Focus Timer");
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

    @Override protected void onResume() {
        super.onResume();
        updateFocusButton();
    }

    @Override public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
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
}
