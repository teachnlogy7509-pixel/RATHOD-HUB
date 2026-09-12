package com.rathodhub.android;

import android.accessibilityservice.AccessibilityService; import android.view.accessibility.AccessibilityEvent; import android.content.*; import android.graphics.Color; import android.graphics.PixelFormat; import android.view.*; import android.widget.*; import java.util.*;

public class FocusAccessibilityService extends AccessibilityService {
  View blocker; WindowManager wm;
  final Set<String> blocked=new HashSet<>(Arrays.asList("com.google.android.youtube","com.instagram.android","com.facebook.katana","com.snapchat.android","com.twitter.android","com.zhiliaoapp.musically"));
  @Override public void onAccessibilityEvent(AccessibilityEvent e){ if(e==null||e.getPackageName()==null)return; if(!getSharedPreferences("focus",0).getBoolean("enabled",false)){hide();return;} String p=e.getPackageName().toString(); if(blocked.contains(p))show(); else hide(); }
  void show(){if(blocker!=null)return; wm=(WindowManager)getSystemService(WINDOW_SERVICE); LinearLayout box=new LinearLayout(this); box.setOrientation(LinearLayout.VERTICAL); box.setGravity(Gravity.CENTER); box.setPadding(40,40,40,40); box.setBackgroundColor(Color.rgb(2,6,23)); TextView t=new TextView(this); t.setText("📚 Focus Mode\n\nRATHOD HUB ने इस app को study session के दौरान block किया है।"); t.setTextColor(Color.WHITE); t.setTextSize(20); t.setGravity(Gravity.CENTER); box.addView(t); Button b=new Button(this); b.setText("Back to RATHOD HUB"); b.setOnClickListener(v->{hide(); Intent i=getPackageManager().getLaunchIntentForPackage(getPackageName()); if(i!=null)startActivity(i);}); box.addView(b); blocker=box; WindowManager.LayoutParams lp=new WindowManager.LayoutParams(-1,-1,WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE|WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,PixelFormat.TRANSLUCENT); wm.addView(blocker,lp); }
  void hide(){if(blocker!=null&&wm!=null){wm.removeView(blocker);blocker=null;}}
  @Override public void onInterrupt(){} @Override public void onDestroy(){hide();super.onDestroy();}
}
