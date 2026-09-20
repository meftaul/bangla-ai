import re,glob,sys,unicodedata
# One-line check for pass() notes and <Check praise>: prints any longer than LIM visible characters
# (combining marks not counted). About 34 fits the footer at 375px. Run from the repo root.
def vis(s):  # visible width proxy: drop combining marks / virama / ZWJ
    return sum(1 for c in s if unicodedata.category(c) not in ('Mn','Mc','Cf'))
LIM=int(sys.argv[1]) if len(sys.argv)>1 else 34
out=[]
for f in sorted(glob.glob('src/components/interactive/*-journey.tsx')):
    src=open(f).read()
    for m in re.finditer(r'\bpass\(\s*', src):
        i=m.end(); depth=1; j=i; q=None
        while j<len(src) and depth:
            c=src[j]
            if q:
                if c=='\\': j+=1
                elif c==q: q=None
            elif c in '"\'`': q=c
            elif c=='(': depth+=1
            elif c==')': depth-=1
            j+=1
        arg=src[i:j-1].strip()
        if not arg: continue
        ln=src[:m.start()].count('\n')+1
        t=re.sub(r'\s+',' ',arg)
        out.append((f.split('/')[-1],ln,vis(t),t))
for f in sorted(glob.glob('src/content/articles/math_for_ai/*.mdx')):
    src=open(f).read()
    for m in re.finditer(r'praise="([^"]*)"',src):
        ln=src[:m.start()].count('\n')+1
        out.append((f.split('/')[-1],ln,vis(m.group(1)),m.group(1)))
for o in out:
    if o[2]>LIM: print(f"{o[0]}:{o[1]} [{o[2]}] {o[3]}")
print(len(out), 'notes;', sum(1 for o in out if o[2]>LIM),'over',LIM, file=sys.stderr)
