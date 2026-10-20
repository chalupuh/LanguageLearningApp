"""Local review snapshot only; never a deployment or Git mutation."""
import hashlib,json,pathlib,subprocess,tarfile
root=pathlib.Path.cwd().resolve()
def git(*args):return subprocess.check_output(['git',*args],cwd=root)
base=git('rev-parse','HEAD').decode().strip()
names=set(git('ls-files','-z').decode().split('\0')+git('ls-files','--others','--exclude-standard','-z').decode().split('\0'))-{''}
report=json.loads((root/'docs/french-audio-production-report.json').read_text(encoding='utf-8'))
for scene in report['scenes']:
    data=(root/('public'+scene['file'])).read_bytes()
    if hashlib.sha256(data).hexdigest()!=scene['sha256']:raise SystemExit('Final audio changed: '+scene['id'])
entries=[]
for name in sorted(names):
    path=root/name
    if not path.exists():continue
    if path.is_symlink() or not path.resolve().is_relative_to(root):raise SystemExit('Unsupported source link: '+name)
    if any(part in {'.git','.wrangler','work','node_modules','.sites-runtime'} for part in pathlib.PurePosixPath(name).parts) or pathlib.PurePosixPath(name).name.startswith('.env'):raise SystemExit('Excluded local state appeared in source list')
    data=path.read_bytes();entries.append({'path':name,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()})
destination=root/'work/french-release-candidate';destination.mkdir(parents=True,exist_ok=True)
archive=destination/'source-review.tar'
with tarfile.open(archive,'w',format=tarfile.PAX_FORMAT) as tar:
    for entry in entries:
        info=tar.gettarinfo(str(root/entry['path']),arcname=entry['path']);info.mtime=0;info.uid=info.gid=0;info.uname=info.gname=''
        with (root/entry['path']).open('rb') as source:tar.addfile(info,source)
expected={entry['path']:entry['sha256'] for entry in entries}
with tarfile.open(archive,'r') as tar:
    if set(tar.getnames())!=set(expected):raise SystemExit('Snapshot file list mismatch')
    for member in tar.getmembers():
        if hashlib.sha256(tar.extractfile(member).read()).hexdigest()!=expected[member.name]:raise SystemExit('Source changed while snapshotting: '+member.name)
inventory={'kind':'local review snapshot; not a Sites deployment artifact','baseCommit':base,'archive':archive.name,'archiveSha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'files':entries,'audioScenes':[{'id':s['id'],'sha256':s['sha256']} for s in report['scenes']],'humanListening':'pending','deployment':'not performed'}
(destination/'inventory.json').write_text(json.dumps(inventory,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'sourceFiles':len(entries),'sourceBytes':sum(e['bytes'] for e in entries),'archiveBytes':archive.stat().st_size,'archiveSha256':inventory['archiveSha256'],'baseCommit':base,'humanListening':'pending','deployment':'not performed'}))
