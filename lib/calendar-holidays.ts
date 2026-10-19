import {addDays,dateFromKey,dateKey,validDate} from "./calendar.ts";

export type HolidayRegion="us"|"fr"|"none";
export type CalendarHoliday={date:string;name:string;kind:"holiday"|"observance"};
export const validHolidayRegion=(value:unknown):value is HolidayRegion=>value==="us"||value==="fr"||value==="none";

// Gregorian Easter (Meeus/Jones/Butcher), used for the French movable holidays.
export function easterSunday(year:number){
 const a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),n=h+l-7*m+114;
 return `${year}-${String(Math.floor(n/31)).padStart(2,"0")}-${String(n%31+1).padStart(2,"0")}`;
}
function nthWeekday(year:number,month:number,weekday:number,n:number){const first=`${year}-${String(month).padStart(2,"0")}-01`;return addDays(first,(weekday-dateFromKey(first).getUTCDay()+7)%7+7*(n-1))}
function lastWeekday(year:number,month:number,weekday:number){const last=dateKey(new Date(Date.UTC(year,month,0,12)));return addDays(last,-((dateFromKey(last).getUTCDay()-weekday+7)%7))}

// Actual holiday dates and US federal observed dates are separate annotations.
// Include adjacent years so New Year's observed on December 31 is not lost.
export function calendarHolidays(year:number,region:HolidayRegion):CalendarHoliday[]{
 if(region==="none"||!Number.isInteger(year)||year<1900||year>2199)return [];
 const out:CalendarHoliday[]=[];
 for(const y of [year-1,year,year+1]){
  const fixed=(month:number,day:number)=>`${y}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
  const add=(date:string,name:string,kind:CalendarHoliday["kind"]="holiday",observe=false)=>{out.push({date,name,kind});if(observe){const weekday=dateFromKey(date).getUTCDay();if(weekday===0||weekday===6)out.push({date:addDays(date,weekday===6?-1:1),name:name+" (observed)",kind})}};
  add(fixed(1,1),"New Year’s Day","holiday",region==="us");
  add(fixed(12,25),"Christmas Day","holiday",region==="us");
  add(fixed(2,14),"Valentine’s Day","observance");
  add(easterSunday(y),"Easter Sunday","observance");
  add(fixed(10,31),"Halloween","observance");
  add(fixed(12,31),"New Year’s Eve","observance");
  if(region==="us"){
   if(y>=1986)add(nthWeekday(y,1,1,3),"Martin Luther King Jr. Day");
   add(nthWeekday(y,2,1,3),"Presidents’ Day");
   add(lastWeekday(y,5,1),"Memorial Day");
   if(y>=2021)add(fixed(6,19),"Juneteenth","holiday",true);
   add(fixed(7,4),"Independence Day","holiday",true);
   add(nthWeekday(y,9,1,1),"Labor Day");
   add(nthWeekday(y,10,1,2),"Columbus Day / Indigenous Peoples’ Day");
   add(fixed(11,11),"Veterans Day","holiday",true);
   add(nthWeekday(y,11,4,4),"Thanksgiving");
   add(nthWeekday(y,5,0,2),"Mother’s Day","observance");
   add(nthWeekday(y,6,0,3),"Father’s Day","observance");
  }else{
   const easter=easterSunday(y);
   add(addDays(easter,1),"Easter Monday");add(fixed(5,1),"Labour Day");add(fixed(5,8),"Victory in Europe Day");
   add(addDays(easter,39),"Ascension Day");add(addDays(easter,50),"Whit Monday");
   add(fixed(7,14),"Bastille Day");add(fixed(8,15),"Assumption Day");add(fixed(11,1),"All Saints’ Day");add(fixed(11,11),"Armistice Day");
  }
 }
 return out.filter(item=>item.date.startsWith(year+"-")&&validDate(item.date)).sort((a,b)=>a.date.localeCompare(b.date)||a.name.localeCompare(b.name));
}
