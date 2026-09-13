from pathlib import Path
p=Path('index.html');s=p.read_text();tag='<script defer src="telegram-score.js?v=1"></script>'
if tag not in s:
 if '</body>' not in s: raise SystemExit('body closing tag missing')
 s=s.replace('</body>',tag+'\n</body>',1);p.write_text(s)
print('web-only Telegram Score loader added')
