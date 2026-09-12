package com.rathodhub.android;

import android.accessibilityservice.AccessibilityServiceInfo;
import android.app.*; import android.content.*; import android.graphics.Color; import android.net.Uri; import android.os.Bundle; import android.provider.Settings; import android.view.*; import android.webkit.*; import android.widget.*;

public class MainActivity extends Activity {
  static final String HUB_URL = "https://teachnlogy7509-pixel.github.io/RATHOD-HUB/";
  android.content.SharedPreferences prefs;
  @Override public void onCreate(Bundle b){super.onCreate(b); prefs=getSharedPreferences("focus",0); build();}
  void build(){
    LinearLayout root=new LinearLayout(this); root.setOrientation(LinearLayout.VERTICAL); root.setBackgroundColor(Color.rgb(2,6,23));
    LinearLayout bar=new LinearLayout(this); bar.setPadding(12,8,12,8); bar.setGravity(Gravity.CENTER_VERTICAL);
    TextView title=new TextView(this); title.setText("RATHOD HUB"); title.setTextColor(Color.WHITE); title.setTextSize(16); title.setTypeface(null,1); bar.addView(title,new LinearLayout.LayoutParams(0,50,1));
    Button focus=new Button(this); focus.setText(prefs.getBoolean("enabled",false)?"Focus ON":"Focus Mode"); focus.setOnClickListener(v->toggleFocus()); bar.addView(focus,new LinearLayout.LayoutParams(-2,50)); root.addView(bar);
    WebView web=new WebView(this); web.setBackgroundColor(Color.rgb(2,6,23)); WebSettings s=web.getSettings(); s.setJavaScriptEnabled(true); s.setDomStorageEnabled(true); s.setMediaPlaybackRequiresUserGesture(false); web.setWebViewClient(new WebViewClient()); web.loadUrl(HUB_URL); root.addView(web,new LinearLayout.LayoutParams(-1,0,1)); setContentView(root);
  }
  void toggleFocus(){ boolean on=!prefs.getBoolean("enabled",false); prefs.edit().putBoolean("enabled",on).apply(); if(on){ Toast.makeText(this,"Focus Mode on करें और Accessibility permission दें",Toast.LENGTH_LONG).show(); startActivity(new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)); } else Toast.makeText(this,"Focus Mode off",Toast.LENGTH_SHORT).show(); build(); }
}
