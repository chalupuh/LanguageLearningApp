import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
import * as calendar from '../lib/calendar.ts';
import {calendarHolidays,easterSunday,validHolidayRegion} from '../lib/calendar-holidays.ts';

test('every month from 1900–2199 is contiguous and aligned in both week-start modes',()=>{
 for(let year=1900;year<=2199;year++)for(let m=1;m<=12;m++)for(const start of [0,1]){
  const month=`${year}-${String(m).padStart(2,'0')}`,days=calendar.monthDays(month,start);
  assert.ok([28,35,42].includes(days.length));
  assert.equal(days.filter(date=>date.startsWith(month+'-')).length,new Date(Date.UTC(year,m,0)).getUTCDate());
  days.forEach((date,i)=>{assert.equal(calendar.dateFromKey(date).getUTCDay(),(i+start)%7);if(i)assert.equal(date,calendar.addDays(days[i-1],1))});
 }
});

test('date arithmetic stays stable across timezone extremes and DST changes',()=>{
 const script=`import {monthDays,weekStart,fullDateLabel} from './lib/calendar.ts'; console.log(JSON.stringify(['2026-03','2026-11','2024-02','2027-01'].map(m=>({days:monthDays(m,1),week:weekStart(m+'-01'),label:fullDateLabel(m+'-01')}))))`;
 const outputs=['UTC','America/New_York','Pacific/Honolulu','Pacific/Kiritimati','Europe/Paris'].map(TZ=>execFileSync(process.execPath,['--experimental-strip-types','--input-type=module','-e',script],{cwd:new URL('../',import.meta.url),env:{...process.env,TZ},encoding:'utf8'}));
 outputs.forEach(output=>assert.equal(output,outputs[0]));
});

test('US 2026 federal holiday dates and observed weekend dates match the published schedule',()=>{
 const list=calendarHolidays(2026,'us'),on=date=>list.filter(h=>h.date===date).map(h=>h.name);
 for(const [date,name] of Object.entries({'2026-01-01':'New Year’s Day','2026-01-19':'Martin Luther King Jr. Day','2026-02-16':'Presidents’ Day','2026-05-25':'Memorial Day','2026-06-19':'Juneteenth','2026-07-03':'Independence Day (observed)','2026-07-04':'Independence Day','2026-09-07':'Labor Day','2026-10-12':'Columbus Day / Indigenous Peoples’ Day','2026-11-11':'Veterans Day','2026-11-26':'Thanksgiving','2026-12-25':'Christmas Day'}))assert.ok(on(date).includes(name),`${date}: ${name}`);
 assert.ok(calendarHolidays(2021,'us').some(h=>h.date==='2021-12-31'&&h.name==='New Year’s Day (observed)'));
 assert.ok(calendarHolidays(2027,'us').some(h=>h.date==='2027-07-05'&&h.name==='Independence Day (observed)'));
 assert.equal(list.find(h=>h.name==='Halloween').kind,'observance');assert.equal(list.find(h=>h.name==='Mother’s Day').date,'2026-05-10');assert.equal(list.find(h=>h.name==='Father’s Day').date,'2026-06-21');
});

test('French movable holidays and Easter are correct across different leap-year patterns',()=>{
 for(const [year,date] of [[2024,'2024-03-31'],[2025,'2025-04-20'],[2026,'2026-04-05'],[2027,'2027-03-28'],[2038,'2038-04-25']])assert.equal(easterSunday(year),date);
 const list=calendarHolidays(2026,'fr');for(const [name,date] of [['Easter Monday','2026-04-06'],['Ascension Day','2026-05-14'],['Whit Monday','2026-05-25'],['Bastille Day','2026-07-14'],['All Saints’ Day','2026-11-01']])assert.equal(list.find(h=>h.name===name)?.date,date);
 assert.equal(list.filter(h=>h.kind==='holiday').length,11);assert.equal(list.some(h=>h.name.includes('observed')),false);
});

test('holiday annotations remain valid and unique throughout the supported range',()=>{
 assert.deepEqual(calendarHolidays(2026,'none'),[]);assert.deepEqual(calendarHolidays(NaN,'us'),[]);assert.deepEqual(calendarHolidays(2200,'us'),[]);assert.equal(validHolidayRegion('sv'),false);
 for(let year=1900;year<=2199;year++)for(const region of ['us','fr']){const list=calendarHolidays(year,region);assert.equal(new Set(list.map(h=>h.date+':'+h.name)).size,list.length);list.forEach(h=>{assert.equal(calendar.validDate(h.date),true);assert.ok(h.date.startsWith(year+'-'))})}
});

test('calendar data rejects invalid bounds, oversize input and duplicate IDs without mutating a good plan',()=>{
 const goal={id:'calendar-goal-00001',week:'2026-10-19',date:'2026-10-21',text:'Study',done:false,createdAt:1},plan={...calendar.emptyCalendar(),goals:[goal]};
 for(const patch of [{date:'2026-10-25',week:'2026-10-26'},{text:'x'.repeat(181)},{createdAt:-1},{done:'yes'},{date:null},{id:'short'}])assert.equal(calendar.validCalendar({...plan,goals:[{...goal,...patch}]}),false);
 assert.equal(calendar.validCalendar({...plan,goals:[goal,{...goal}]}),false);assert.equal(calendar.validCalendar({...plan,mainGoals:[{month:'2026-10',text:'x'.repeat(1001)}]}),false);
 assert.equal(calendar.validCalendar(plan),true);const before=JSON.stringify(plan);calendar.goalsOnDate(plan,goal.date);calendar.mergeCalendar(plan,plan,plan);assert.equal(JSON.stringify(plan),before);
});

test('daily drafts stay on their date, display preferences persist, and add/delete/undo keep one task identity',async()=>{
 const globals=Object.fromEntries(['__calendarView','localStorage','window','requestAnimationFrame'].map(key=>[key,globalThis[key]])),storage=new Map();let cells=[],cursor=0,effects=[],plan=calendar.emptyCalendar(),tree;
 const mocks={...calendar,calendarHolidays,validHolidayRegion,localToday:()=> '2026-10-19',languageName:()=> 'French',useLearningLanguage:()=> 'fr',useCalendar:()=>({plan,ready:true,user:'test:fr',status:'Saved',conflict:false,error:'',change(fn){const next=fn(plan);if(!calendar.validCalendar(next))return false;plan=next;return true}}),useRef:()=>({current:null}),useState(initial){const i=cursor++;if(!(i in cells))cells[i]=typeof initial==='function'?initial():initial;return[cells[i],value=>{cells[i]=typeof value==='function'?value(cells[i]):value}]},useEffect(fn,deps){const i=cursor++,old=cells[i];if(!old||deps.some((v,j)=>!Object.is(v,old.deps[j])))effects.push(()=>{cells[i]={deps};fn()})}};
 globalThis.__calendarView=mocks;globalThis.localStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)};globalThis.window={matchMedia:()=>({matches:false})};globalThis.requestAnimationFrame=()=>0;
 try{
  const page=await readFile(new URL('../app/my-calendar.tsx',import.meta.url),'utf8'),source=`const {${Object.keys(mocks).join(',')}}=globalThis.__calendarView;function GoalEditor(){}function GoalChecklist(){}\n`+page.slice(page.indexOf('export default function MyCalendar'));
  const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText.replace('"react/jsx-runtime"',JSON.stringify(import.meta.resolve('react/jsx-runtime'))),{default:View}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
  const render=()=>{cursor=0;effects=[];tree=View();effects.forEach(fn=>fn())},nodes=(n=tree)=>Array.isArray(n)?n.flatMap(v=>nodes(v)):n&&typeof n==='object'?[n,...nodes(n.props?.children??null)]:[],find=predicate=>nodes().find(predicate),select=date=>find(n=>n.props?.['data-calendar-day']===date).props.onClick();
  render();render();find(n=>n.props?.id==='calendar-day-item').props.onChange({target:{value:'Monday draft'}});render();select('2026-10-20');render();assert.equal(find(n=>n.props?.id==='calendar-day-item').props.value,'');find(n=>n.props?.id==='calendar-day-item').props.onChange({target:{value:'Tuesday task'}});render();select('2026-10-19');render();assert.equal(find(n=>n.props?.id==='calendar-day-item').props.value,'Monday draft');select('2026-10-20');render();find(n=>n.type==='form'&&n.props.className==='calendar-quick-add').props.onSubmit({preventDefault(){}});render();assert.equal(plan.goals[0].date,'2026-10-20');assert.equal(plan.goals[0].text,'Tuesday task');assert.equal(find(n=>n.props?.id==='calendar-day-item').props.value,'');
  const item=plan.goals[0],checklist=()=>find(n=>typeof n.type==='function'&&n.type.name==='GoalChecklist');checklist().props.onToggle(item,true);render();assert.equal(plan.goals[0].done,true);checklist().props.onDelete(plan.goals[0]);render();assert.equal(plan.goals.length,0);find(n=>n.type==='button'&&n.props.children==='Undo delete').props.onClick();render();assert.deepEqual(plan.goals,[{...item,done:true}]);assert.equal(find(n=>n.type==='button'&&n.props.children==='Undo delete'),undefined);
  const selects=nodes().filter(n=>n.type==='select');selects[0].props.onChange({target:{value:'1'}});render();nodes().filter(n=>n.type==='select')[1].props.onChange({target:{value:'fr'}});render();assert.deepEqual(JSON.parse(storage.get('a-loreille-calendar-display')),{startsOn:1,holidays:'fr'});assert.equal(find(n=>n.type==='th').props.children[0].props.children,'Mon');assert.equal(plan.goals.length,1);
  // A fresh mount restores display settings without modifying the saved plan.
  cells=[];render();render();assert.equal(nodes().filter(n=>n.type==='select')[0].props.value,1);assert.equal(nodes().filter(n=>n.type==='select')[1].props.value,'fr');
 }finally{for(const [key,value] of Object.entries(globals))if(value===undefined)delete globalThis[key];else globalThis[key]=value}
});
