package com.rathodhub.android;

import android.accessibilityservice.AccessibilityService;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.view.accessibility.AccessibilityEvent;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

public class FocusAccessibilityService extends AccessibilityService {
    private static final String PREFS = "focus";
    private static final String KEY_ENABLED = "enabled";
    private static final String KEY_UNTIL = "focus_until";
    private static final String KEY_ALLOWED_PACKAGE = "allowed_study_package";
    private static final String KEY_ALLOWED_LABEL = "allowed_study_label";

    private final Set<String> essentialPackages = new HashSet<>(Arrays.asList(
            "com.android.systemui",
            "com.android.settings",
            "com.android.permissioncontroller",
            "com.google.android.permissioncontroller",
            "com.android.packageinstaller",
            "com.google.android.packageinstaller",
            "com.google.android.apps.nexuslauncher",
            "com.android.launcher",
            "com.android.launcher2",
            "com.android.launcher3",
            "com.sec.android.app.launcher",
            "com.miui.home",
            "com.oppo.launcher",
            "com.vivo.launcher"
    ));

    private final Handler handler = new Handler(Looper.getMainLooper());
    private WindowManager windowManager;
    private View blocker;
    private TextView blockerMessage;
    private String blockedAppLabel = "This app";

    private final Runnable expiryTicker = new Runnable() {
        @Override public void run() {
            if (!isFocusActive()) {
                disableExpiredFocus();
                hideBlocker();
                return;
            }
            updateBlockerMessage();
            handler.postDelayed(this, 1000);
        }
    };

    @Override public void onServiceConnected() {
        super.onServiceConnected();
        scheduleExpiryTicker();
    }

    @Override public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event == null || event.getPackageName() == null) return;
        if (!isFocusActive()) {
            disableExpiredFocus();
            hideBlocker();
            return;
        }

        scheduleExpiryTicker();
        String packageName = event.getPackageName().toString();
        if (isAllowed(packageName)) {
            hideBlocker();
        } else {
            blockedAppLabel = getApplicationLabel(packageName);
            showBlocker();
        }
    }

    private boolean isFocusActive() {
        long until = getSharedPreferences(PREFS, MODE_PRIVATE).getLong(KEY_UNTIL, 0L);
        return getSharedPreferences(PREFS, MODE_PRIVATE).getBoolean(KEY_ENABLED, false)
                && until > System.currentTimeMillis();
    }

    private void disableExpiredFocus() {
        getSharedPreferences(PREFS, MODE_PRIVATE).edit()
                .putBoolean(KEY_ENABLED, false)
                .remove(KEY_UNTIL)
                .apply();
        handler.removeCallbacks(expiryTicker);
    }

    private String selectedPackage() {
        String selected = getSharedPreferences(PREFS, MODE_PRIVATE)
                .getString(KEY_ALLOWED_PACKAGE, "");
        if (!selected.isEmpty()) return selected;
        if (isPackageInstalled("xyz.penpencil.physicswala")) return "xyz.penpencil.physicswala";
        if (isPackageInstalled("com.pw.live")) return "com.pw.live";
        return "";
    }

    private String selectedLabel() {
        String label = getSharedPreferences(PREFS, MODE_PRIVATE)
                .getString(KEY_ALLOWED_LABEL, "");
        if (!label.isEmpty()) return label;
        String packageName = selectedPackage();
        return packageName.isEmpty() ? "No study app selected" : getApplicationLabel(packageName);
    }

    private boolean isAllowed(String packageName) {
        if (packageName == null || packageName.isEmpty()) return true;
        if (packageName.equals(getPackageName())) return true;
        if (packageName.equals(selectedPackage())) return true;
        if (essentialPackages.contains(packageName)) return true;
        String inputMethod = Settings.Secure.getString(
                getContentResolver(), Settings.Secure.DEFAULT_INPUT_METHOD);
        return inputMethod != null && inputMethod.startsWith(packageName + "/");
    }

    private void showBlocker() {
        if (blocker != null) {
            updateBlockerMessage();
            return;
        }

        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setGravity(Gravity.CENTER);
        box.setPadding(48, 48, 48, 48);
        box.setBackgroundColor(Color.rgb(7, 9, 13));

        blockerMessage = new TextView(this);
        blockerMessage.setTextColor(Color.WHITE);
        blockerMessage.setTextSize(20);
        blockerMessage.setGravity(Gravity.CENTER);
        blockerMessage.setPadding(0, 0, 0, 28);
        box.addView(blockerMessage, new LinearLayout.LayoutParams(-1, -2));

        Button openStudy = new Button(this);
        openStudy.setText("Open selected study app");
        openStudy.setOnClickListener(v -> openSelectedStudyApp());
        box.addView(openStudy, new LinearLayout.LayoutParams(-1, -2));

        Button backToHub = new Button(this);
        backToHub.setText("Back to RATHOD HUB");
        backToHub.setOnClickListener(v -> openRathodHub());
        LinearLayout.LayoutParams backParams = new LinearLayout.LayoutParams(-1, -2);
        backParams.topMargin = 12;
        box.addView(backToHub, backParams);

        blocker = box;
        updateBlockerMessage();
        WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
                WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
                PixelFormat.TRANSLUCENT);
        windowManager.addView(blocker, params);
    }

    private void updateBlockerMessage() {
        if (blockerMessage == null) return;
        long until = getSharedPreferences(PREFS, MODE_PRIVATE).getLong(KEY_UNTIL, 0L);
        long seconds = Math.max(0L, (until - System.currentTimeMillis() + 999L) / 1000L);
        long hours = seconds / 3600L;
        long minutes = (seconds % 3600L) / 60L;
        long secs = seconds % 60L;
        blockerMessage.setText(String.format(Locale.US,
                "🚫 %s blocked\n\nFocus Shield ON\n\nSirf %s aur RATHOD HUB allowed hain.\n\n%02d:%02d:%02d remaining",
                blockedAppLabel, selectedLabel(), hours, minutes, secs));
    }

    private void openSelectedStudyApp() {
        String packageName = selectedPackage();
        if (!packageName.isEmpty()) {
            Intent launch = getPackageManager().getLaunchIntentForPackage(packageName);
            if (launch != null) {
                hideBlocker();
                launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(launch);
                return;
            }
        }
        openRathodHub();
    }

    private void openRathodHub() {
        hideBlocker();
        Intent launch = getPackageManager().getLaunchIntentForPackage(getPackageName());
        if (launch != null) {
            launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            startActivity(launch);
        }
    }

    private boolean isPackageInstalled(String packageName) {
        try {
            getPackageManager().getPackageInfo(packageName, 0);
            return true;
        } catch (Exception ignored) {
            return false;
        }
    }

    private String getApplicationLabel(String packageName) {
        try {
            return getPackageManager().getApplicationLabel(
                    getPackageManager().getApplicationInfo(packageName, 0)).toString();
        } catch (Exception ignored) {
            return packageName;
        }
    }

    private void scheduleExpiryTicker() {
        handler.removeCallbacks(expiryTicker);
        if (isFocusActive()) handler.post(expiryTicker);
    }

    private void hideBlocker() {
        if (blocker != null && windowManager != null) {
            windowManager.removeView(blocker);
            blocker = null;
            blockerMessage = null;
        }
    }

    @Override public void onInterrupt() { }

    @Override public void onDestroy() {
        handler.removeCallbacks(expiryTicker);
        hideBlocker();
        super.onDestroy();
    }
}
