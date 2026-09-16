from pathlib import Path

p=Path('index.html')
s=p.read_text()
tags=[
    '<script defer src="telegram-score.js?v=1"></script>',
    '<script defer src="rathod-referral.js?v=1"></script>',
    '<script defer src="rathod-study-room-fix.js?v=2"></script>',
]
missing=[tag for tag in tags if tag not in s]
if missing:
    if '</body>' not in s:
        raise SystemExit('body closing tag missing')
    s=s.replace('</body>','\n'.join(missing)+'\n</body>',1)
    p.write_text(s)
print('Telegram Score, Referral and Study Room loaders ready')
