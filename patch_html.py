from pathlib import Path

p=Path('index.html')
s=p.read_text()
# Replace the old mentor loader rather than appending a second one.
s=s.replace('<script defer src="rathod-mentor-room.js?v=1"></script>', '<script defer src="rathod-mentor-room.js?v=2"></script>')
tags=[
    '<script defer src="telegram-score.js?v=1"></script>',
    '<script defer src="rathod-referral.js?v=1"></script>',
    '<script defer src="rathod-study-room-fix.js?v=2"></script>',
    '<script defer src="rathod-mentor-room.js?v=2"></script>',
    '<script defer src="rathod-archive-icon-fix.js?v=1"></script>',
]
missing=[tag for tag in tags if tag not in s]
if missing:
    if '</body>' not in s:
        raise SystemExit('body closing tag missing')
    s=s.replace('</body>','\n'.join(missing)+'\n</body>',1)
    p.write_text(s)
print('Telegram Score, Referral, Study Room, Mentor and archive icon loaders ready')
