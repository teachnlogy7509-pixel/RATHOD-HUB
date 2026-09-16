import re
from pathlib import Path

p=Path('index.html')
s=p.read_text()
# Replace an older cached mentor loader instead of appending a second loader;
# the mentor script has a one-time global guard, so the new version must load first.
s=re.sub(r'<script defer src="rathod-mentor-room\\?v=\\d+"></script>', '<script defer src="rathod-mentor-room?v=2"></script>', s)
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
