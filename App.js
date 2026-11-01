import React, { useEffect, useMemo, useState, useRef } from "react";
import { Alert, Animated, FlatList, Image, Linking, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as XLSX from "xlsx";
import * as Location from "expo-location";

const logo = <Image source={require("./app-icon.png")} style={{width:42,height:42,borderRadius:21,marginRight:8}} />;
const C={bg:"#06151d",panel:"#0b2631",panel2:"#103540",green:"#27c653",green2:"#7ad64f",text:"#f4fbf6",muted:"#9bb2b9",line:"#1a414a",blue:"#38a4ff",orange:"#ffad42",red:"#ff5367"};
const CACHE="@jett_cache_v32", ROUTES="@jett_saved_v32", CURRENT="@jett_current_v32";
const clean=x=>x.trim().toUpperCase().replace(/\s+/g," ");
const valid=x=>/^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i.test(x.trim());
const distance=(a,b)=>{const r=n=>n*Math.PI/180, d1=r(b.lat-a.lat),d2=r(b.lon-a.lon),q=Math.sin(d1/2)**2+Math.cos(r(a.lat))*Math.cos(r(b.lat))*Math.sin(d2/2)**2;return 3958.8*2*Math.asin(Math.sqrt(q));};
const fmt=m=>!m?"—":`${Math.floor(m/60)?Math.floor(m/60)+"h ":""}${m%60}m`;
export default function App(){
 const [online,setOnline]=useState(true),[screen,setScreen]=useState("home"),[tab,setTab]=useState("Home");
 const [stops,setStops]=useState([]),[cache,setCache]=useState({}),[saved,setSaved]=useState([]);
 const [stockLoaded,setStockLoaded]=useState({wheelieBins:0,foodCaddies:0});
 const [wheelieQty,setWheelieQty]=useState("0"),[caddyQty,setCaddyQty]=useState("0");
 const [query,setQuery]=useState(""),[results,setResults]=useState([]),[busy,setBusy]=useState(false),[chosen,setChosen]=useState(null);
 const [label,setLabel]=useState(""),[town,setTown]=useState(""),[pc,setPc]=useState(""),[routeName,setRouteName]=useState("Jett Pal Delivery Route");
 const [mapChoice,setMapChoice]=useState("google");
 const [roadMetrics,setRoadMetrics]=useState(null);
 const [startPoint,setStartPoint]=useState(null);
 const [startQuery,setStartQuery]=useState("");
 const [startResults,setStartResults]=useState([]);
 const [returnToStart,setReturnToStart]=useState(false);
 const [googleSheetUrl,setGoogleSheetUrl]=useState("");
 const [selectedDeliveryId,setSelectedDeliveryId]=useState(null),[deliveryOutcome,setDeliveryOutcome]=useState("Delivered"),[actualWheelieQty,setActualWheelieQty]=useState("0"),[actualCaddyQty,setActualCaddyQty]=useState("0"),[deliveryNotes,setDeliveryNotes]=useState("");
const [splashVisible, setSplashVisible] = useState(true);
const splashOpacity = useRef(new Animated.Value(1)).current;
useEffect(() => {
  const timer = setTimeout(() => {
    Animated.timing(splashOpacity, {
      toValue: 0,
      duration: 650,
      useNativeDriver: true,
    }).start(() => setSplashVisible(false));
  }, 2600);

  return () => clearTimeout(timer);
}, [splashOpacity]);
 useEffect(()=>{(async()=>{try{const [c,r,s,m,l]=await Promise.all([AsyncStorage.getItem(CACHE),AsyncStorage.getItem(ROUTES),AsyncStorage.getItem(CURRENT),AsyncStorage.getItem("@jett_map_choice"),AsyncStorage.getItem("@jett_stock_loaded")]);if(c)setCache(JSON.parse(c));if(r)setSaved(JSON.parse(r));if(s)setStops(JSON.parse(s));if(m)setMapChoice(m);if(l)setStockLoaded(JSON.parse(l));}catch{}})();const u=NetInfo.addEventListener(x=>setOnline(!!x.isConnected));NetInfo.fetch().then(x=>setOnline(!!x.isConnected));return u;},[]);
 useEffect(()=>{AsyncStorage.setItem(CURRENT,JSON.stringify(stops)).catch(()=>{});},[stops]);
 useEffect(()=>{AsyncStorage.setItem("@jett_stock_loaded",JSON.stringify(stockLoaded)).catch(()=>{});},[stockLoaded]);
 const miles=useMemo(()=>{let n=0;for(let i=1;i<stops.length;i++){const a=cache[stops[i-1].key],b=cache[stops[i].key];if(a&&b)n+=distance(a,b);}return n;},[stops,cache]);
 const routeSignature=stops.map(x=>x.id).join("|")+"|"+(startPoint?.key||"first-stop")+"|"+(returnToStart?"return":"one-way");
 const currentRoadMetrics=roadMetrics&&roadMetrics.signature===routeSignature?roadMetrics:null;
async function search(){
  const q=query.trim();
  if(!q){setResults([]);return;}
  setBusy(true);
  setResults([]);
  if(!online){
    const norm=x=>(x||"").toLowerCase().replace(/[^a-z0-9]/g,"");
    const matches=Object.entries(cache)
      .filter(([k,v])=>norm(k+" "+(v.displayName||"")).includes(norm(q)))
      .map(([k,v])=>({display_name:v.displayName||k,lat:v.lat,lon:v.lon,cached:true}));
    setResults(matches);
    setBusy(false);
    if(!matches.length)Alert.alert("Offline","No matching saved address. Connect to the internet and try again.");
    return;
  }
  try{
    const response=await fetch("https://jett-address-api.mrmagixtoyou.workers.dev/search?q="+encodeURIComponent(q));
    const data=await response.json();
    if(!response.ok||!data.success)throw new Error(data.error||"Address search failed");
    const found=(data.results||[]).map(item=>({
      display_name:item.suggestion||"",
      udprn:item.udprn,
      address:{},
      source:"postio"
    })).filter(item=>item.display_name&&item.udprn);
    setResults(found);
    if(!found.length)Alert.alert("No address found","Postio did not return a matching UK address. Try including the postcode.");
  }catch(error){
    setResults([]);
    Alert.alert("Search unavailable",error.message||"Jett could not contact the UK address service. Please try again.");
  }finally{
    setBusy(false);
  }
}
async function choose(x){
  if(x.cached){
    const key=(x.display_name||query).toUpperCase();
    setChosen({...x,key});
    setLabel(x.display_name||query);
    setTown("");
    setPc("");
    setScreen("details");
    return;
  }
  if(!x.udprn)return Alert.alert("Address unavailable","This result has no UK address identifier.");
  setBusy(true);
  try{
    const response=await fetch("https://jett-address-api.mrmagixtoyou.workers.dev/resolve?udprn="+encodeURIComponent(String(x.udprn)));
    const data=await response.json();
    if(!response.ok||!data.success||!data.results?.length)throw new Error(data.error||"Could not retrieve full address");
    const a=data.results[0];
    const lat=Number(a.latitude),lon=Number(a.longitude);
    if(!Number.isFinite(lat)||!Number.isFinite(lon))throw new Error("The address record did not include usable coordinates.");
    const displayName=[a.building_name,a.address_line_1,a.address_line_2,a.post_town||a.district,a.postcode].filter(Boolean).join(", ");
    const key=displayName.toUpperCase();
    const coord={lat,lon,displayName};
    const c={...cache,[key]:coord};
    setCache(c);
    await AsyncStorage.setItem(CACHE,JSON.stringify(c));
    const selected={...x,display_name:displayName,lat,lon,address:{
      house_number:a.building_number||"",
      house_name:a.building_name||"",
      road:a.thoroughfare||"",
      city:a.post_town||a.district||"",
      postcode:a.postcode||""
    },key};
    setChosen(selected);
    setLabel([a.building_name,a.address_line_1].filter(Boolean).join(" "));
    setTown(a.post_town||a.district||"");
    setPc(a.postcode||"");
    setScreen("details");
  }catch(error){
    Alert.alert("Address lookup failed",error.message||"Could not retrieve this address. Please try again.");
  }finally{
    setBusy(false);
  }
}
function add(){if(!chosen)return;setStops([...stops,{id:Date.now().toString(),key:chosen.key,name:label.trim()||chosen.display_name,address:label.trim(),town:town.trim(),postcode:clean(pc),wheelieBins:Math.max(0,parseInt(wheelieQty,10)||0),foodCaddies:Math.max(0,parseInt(caddyQty,10)||0),done:false,deliveryOutcome:"Pending",deliveredWheelieBins:0,deliveredFoodCaddies:0,deliveryNotes:""}]);setWheelieQty("0");setCaddyQty("0");setChosen(null);setScreen("route");setTab("Route");}
 function openCompletion(stop){setSelectedDeliveryId(stop.id);setDeliveryOutcome(stop.deliveryOutcome&&stop.deliveryOutcome!=="Pending"?stop.deliveryOutcome:"Delivered");setActualWheelieQty(String(stop.deliveredWheelieBins??stop.wheelieBins??0));setActualCaddyQty(String(stop.deliveredFoodCaddies??stop.foodCaddies??0));setDeliveryNotes(stop.deliveryNotes||"");setScreen("completion");setTab("Home");}
 function saveCompletion(){const bins=Math.max(0,parseInt(actualWheelieQty,10)||0),caddies=Math.max(0,parseInt(actualCaddyQty,10)||0);const selected=stops.find(x=>x.id===selectedDeliveryId);if(!selected)return Alert.alert("Delivery not found","Please return to the delivery list and try again.");if(bins>Number(selected.wheelieBins||0)||caddies>Number(selected.foodCaddies||0))return Alert.alert("Check quantities","The delivered quantity cannot be greater than the quantity required for this property.");const successful=deliveryOutcome==="Delivered"||deliveryOutcome==="Partially delivered";setStops(current=>current.map(x=>x.id===selectedDeliveryId?{...x,done:successful,deliveryOutcome,deliveredWheelieBins:successful?bins:0,deliveredFoodCaddies:successful?caddies:0,deliveryNotes:deliveryNotes.trim(),completedAt:successful?new Date().toISOString():null}:x));setScreen("deliveries");setTab("Home");Alert.alert("Delivery report saved","The property outcome and actual delivered quantities have been recorded.");}

async function importDeliveryFile(){
  try{
    const picked=await DocumentPicker.getDocumentAsync({
      type:["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","application/vnd.ms-excel","text/csv","text/comma-separated-values"],
      copyToCacheDirectory:true,
      multiple:false
    });
    if(picked.canceled||!picked.assets?.length)return;
    const file=picked.assets[0];
    const base64=await FileSystem.readAsStringAsync(file.uri,{encoding:"base64"});
    const workbook=XLSX.read(base64,{type:"base64"});
    const firstSheet=workbook.Sheets[workbook.SheetNames[0]];
    if(!firstSheet)throw new Error("The selected file has no worksheet.");
    const rows=XLSX.utils.sheet_to_json(firstSheet,{header:1,defval:"",raw:false});
    if(!rows.length)throw new Error("The selected file is empty.");
    const norm=v=>String(v||"").toLowerCase().trim().replace(/[^a-z0-9]+/g," ");
    const aliases={
      address:["address","full address","delivery address","property address","house address","street address","address line 1","address1","location"],
      house:["house number","house no","house name","building number","building name","number"],
      street:["street","street name","road","thoroughfare"],
      town:["town","city","post town","locality","district"],
      postcode:["postcode","post code","postal code","zip","zip code"],
      wheelieBins:["wheelie bins","wheelie bin","bin quantity","bin qty","bins","black bins","refuse bins"],
      foodCaddies:["food caddies","food caddy","food waste caddies","caddies","caddy quantity","caddy qty"]
    };
    const header=rows[0].map(norm);
    const hasHeader=header.some(h=>Object.values(aliases).flat().includes(h));
    const findIndex=key=>header.findIndex(h=>aliases[key].includes(h));
    const indexes=hasHeader?{
      address:findIndex("address"),house:findIndex("house"),street:findIndex("street"),town:findIndex("town"),postcode:findIndex("postcode"),wheelieBins:findIndex("wheelieBins"),foodCaddies:findIndex("foodCaddies")
    }:{address:0,house:-1,street:-1,town:-1,postcode:-1,wheelieBins:-1,foodCaddies:-1};
    const data=rows.slice(hasHeader?1:0);
    const imported=data.map((row,i)=>{
      const cell=n=>indexes[n]>=0?String(row[indexes[n]]??"").trim():"";
      const house=cell("house"),street=cell("street");
      const address=cell("address")||[house,street].filter(Boolean).join(" ");
      const fallback=address||row.map(v=>String(v||"").trim()).filter(Boolean).join(", ");
      if(!fallback)return null;
      const id="import_"+Date.now()+"_"+i;
      const townValue=cell("town"),postcodeValue=cell("postcode").toUpperCase();
      return {id,key:id,name:fallback,address:fallback,town:townValue,postcode:postcodeValue,wheelieBins:Math.max(0,parseInt(cell("wheelieBins"),10)||0),foodCaddies:Math.max(0,parseInt(cell("foodCaddies"),10)||0),done:false};
    }).filter(Boolean);
    if(!imported.length)throw new Error("No delivery addresses were found. Check that your file has an Address column or address data in its first column.");
    setStops(current=>[...current,...imported]);
    setScreen("route");
    setTab("Route");
    Alert.alert("Delivery list imported",imported.length+" stops added from "+file.name+". Please check the addresses before navigating.");
  }catch(error){
    Alert.alert("Import failed",error.message||"Jett could not read that file. Please try an Excel .xlsx or CSV .csv file.");
  }
}


async function importGoogleSheet(){
  const link=googleSheetUrl.trim();
  if(!link)return Alert.alert("Paste a Google Sheets link","Copy the sharing link from Google Sheets and paste it here.");
  const match=link.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if(!match)return Alert.alert("Invalid Google Sheets link","Paste a link copied from a Google Sheets spreadsheet.");
  const sheetId=match[1];
  const gidMatch=link.match(/[?&#]gid=(\d+)/);
  const gid=gidMatch?gidMatch[1]:"0";
  try{
    setBusy(true);
    const url="https://docs.google.com/spreadsheets/d/"+sheetId+"/export?format=csv&gid="+gid;
    const response=await fetch(url);
    const csv=await response.text();
    if(!response.ok||!csv||csv.trim().startsWith("<!DOCTYPE")||csv.includes("accounts.google.com/ServiceLogin")){
      throw new Error("Google could not provide this sheet. In Google Sheets, set Share → General access → Anyone with the link → Viewer, then copy the link again.");
    }
    const workbook=XLSX.read(csv,{type:"string"});
    const sheet=workbook.Sheets[workbook.SheetNames[0]];
    const rows=XLSX.utils.sheet_to_json(sheet,{header:1,defval:"",raw:false});
    if(!rows.length)throw new Error("The Google Sheet is empty.");
    const norm=v=>String(v||"").toLowerCase().trim().replace(/[^a-z0-9]+/g," ");
    const aliases={
      address:["address","full address","delivery address","property address","house address","street address","address line 1","address1","location"],
      house:["house number","house no","house name","building number","building name","number"],
      street:["street","street name","road","thoroughfare"],
      town:["town","city","post town","locality","district"],
      postcode:["postcode","post code","postal code","zip","zip code"],
      wheelieBins:["wheelie bins","wheelie bin","bin quantity","bin qty","bins","black bins","refuse bins"],
      foodCaddies:["food caddies","food caddy","food waste caddies","caddies","caddy quantity","caddy qty"]
    };
    const header=rows[0].map(norm);
    const hasHeader=header.some(h=>Object.values(aliases).flat().includes(h));
    const findIndex=key=>header.findIndex(h=>aliases[key].includes(h));
    const indexes=hasHeader?{address:findIndex("address"),house:findIndex("house"),street:findIndex("street"),town:findIndex("town"),postcode:findIndex("postcode"),wheelieBins:findIndex("wheelieBins"),foodCaddies:findIndex("foodCaddies")}:{address:0,house:-1,street:-1,town:-1,postcode:-1,wheelieBins:-1,foodCaddies:-1};
    const imported=rows.slice(hasHeader?1:0).map((row,i)=>{
      const cell=n=>indexes[n]>=0?String(row[indexes[n]]??"").trim():"";
      const address=cell("address")||[cell("house"),cell("street")].filter(Boolean).join(" ");
      const name=address||row.map(v=>String(v||"").trim()).filter(Boolean).join(", ");
      if(!name)return null;
      const id="sheets_"+Date.now()+"_"+i;
      return {id,key:id,name,address:name,town:cell("town"),postcode:cell("postcode").toUpperCase(),wheelieBins:Math.max(0,parseInt(cell("wheelieBins"),10)||0),foodCaddies:Math.max(0,parseInt(cell("foodCaddies"),10)||0),done:false};
    }).filter(Boolean);
    if(!imported.length)throw new Error("No delivery addresses found. Add an Address column or put addresses in the first column.");
    setStops(current=>[...current,...imported]);
    setScreen("route");
    setTab("Route");
    Alert.alert("Google Sheet imported",imported.length+" delivery stops added. Please check the addresses before navigating.");
  }catch(error){
    Alert.alert("Google Sheets import failed",error.message||"Could not read this Google Sheet.");
  }finally{
    setBusy(false);
  }
}

 function saveRoute(){if(!stops.length)return Alert.alert("No stops","Add addresses before saving.");const item={id:Date.now().toString(),name:routeName,stops,miles,savedAt:new Date().toISOString()};const r=[item,...saved].slice(0,30);setSaved(r);AsyncStorage.setItem(ROUTES,JSON.stringify(r));Alert.alert("Route saved","Available offline on this phone.");}
 async function useCurrentStart(){
  try{
    setBusy(true);
    const permission=await Location.requestForegroundPermissionsAsync();
    if(permission.status!=="granted")throw new Error("Location permission was not granted. You can choose a starting address instead.");
    const position=await Location.getCurrentPositionAsync({accuracy:Location.Accuracy.Balanced});
    const point={lat:position.coords.latitude,lon:position.coords.longitude,displayName:"Current location",key:"current_location"};
    setStartPoint(point);
    setRoadMetrics(null);
    Alert.alert("Starting point set","Jett will start the route from your current location.");
  }catch(error){Alert.alert("Location unavailable",error.message||"Jett could not get your current location.");}
  finally{setBusy(false);}
 }
 async function searchStartAddress(){
  const q=startQuery.trim();
  if(!q)return Alert.alert("Enter a starting address","Type a postcode or address first.");
  if(!online)return Alert.alert("Internet required","Connect to the internet to search for a starting address.");
  setBusy(true);setStartResults([]);
  try{
    const response=await fetch("https://jett-address-api.mrmagixtoyou.workers.dev/search?q="+encodeURIComponent(q));
    const data=await response.json();
    if(!response.ok||!data.success)throw new Error(data.error||"Address search failed");
    const found=(data.results||[]).filter(x=>x.suggestion&&x.udprn).map(x=>({label:x.suggestion,udprn:x.udprn}));
    setStartResults(found);
    if(!found.length)Alert.alert("No address found","Try including the postcode.");
  }catch(error){Alert.alert("Address search failed",error.message||"Could not search for that address.");}
  finally{setBusy(false);}
 }
 async function chooseStartAddress(item){
  setBusy(true);
  try{
    const response=await fetch("https://jett-address-api.mrmagixtoyou.workers.dev/resolve?udprn="+encodeURIComponent(String(item.udprn)));
    const data=await response.json();
    if(!response.ok||!data.success||!data.results?.length)throw new Error(data.error||"Could not retrieve the address coordinates.");
    const a=data.results[0],lat=Number(a.latitude),lon=Number(a.longitude);
    if(!Number.isFinite(lat)||!Number.isFinite(lon))throw new Error("This address has no usable map coordinates.");
    const displayName=[a.building_name,a.address_line_1,a.address_line_2,a.post_town||a.district,a.postcode].filter(Boolean).join(", ");
    const point={lat,lon,displayName,key:"start_"+item.udprn};
    setStartPoint(point);setStartResults([]);setStartQuery(displayName);setRoadMetrics(null);
    Alert.alert("Starting address set",displayName);
  }catch(error){Alert.alert("Address lookup failed",error.message||"Could not set that starting address.");}
  finally{setBusy(false);}
 }
 async function optimise(){
  if(!online)return Alert.alert("Internet required","Connect to the internet to calculate real road routes.");
  if(stops.length<2)return Alert.alert("Add more stops","Add at least two delivery stops to optimise.");
  if(stops.some(x=>!cache[x.key]||!Number.isFinite(Number(cache[x.key].lat))||!Number.isFinite(Number(cache[x.key].lon))))return Alert.alert("Find locations first","Search each delivery address while online so Jett has coordinates for every stop.");
  setBusy(true);
  try{
    const points=startPoint?[startPoint,...stops.map(x=>cache[x.key])]:stops.map(x=>cache[x.key]);
    const stopOffset=startPoint?1:0;
    const coordinates=points.map(p=>Number(p.lon)+","+Number(p.lat)).join(";");
    const roundtrip=returnToStart?"true":"false";
    const destination=returnToStart?"":"&destination=any";
    const url="https://router.project-osrm.org/trip/v1/driving/"+coordinates+"?roundtrip="+roundtrip+"&source=first"+destination+"&overview=false&steps=false";
    const response=await fetch(url);
    const data=await response.json();
    if(!response.ok||data.code!=="Ok"||!data.trips?.length||!data.waypoints?.length)throw new Error(data.message||"The road-routing service could not calculate this route.");
    const ordered=[...data.waypoints].map((w,i)=>({w,i})).sort((a,b)=>a.w.waypoint_index-b.w.waypoint_index).map(x=>x.i).filter(i=>i>=stopOffset).map(i=>stops[i-stopOffset]);
    if(ordered.length!==stops.length)throw new Error("The routing service returned an incomplete stop order.");
    const trip=data.trips[0],signature=ordered.map(x=>x.id).join("|")+"|"+(startPoint?.key||"first-stop")+"|"+(returnToStart?"return":"one-way");
    const metrics={signature,miles:trip.distance/1609.344,minutes:Math.round(trip.duration/60)};
    setStops(ordered);setRoadMetrics(metrics);
    Alert.alert("Road route optimised","Start: "+(startPoint?.displayName||"first delivery")+"\\n"+(returnToStart?"Return to start included.":"One-way route.")+"\\nEstimated driving: "+metrics.miles.toFixed(1)+" miles · "+fmt(metrics.minutes)+".");
  }catch(error){Alert.alert("Route calculation failed",error.message||"Jett could not calculate the road route. Please try again.");}
  finally{setBusy(false);}
 }
 async function setMapPreference(choice){
  setMapChoice(choice);
  await AsyncStorage.setItem("@jett_map_choice",choice);
 }
 
function openNavigation(stop,routeStops=[stop]){
  const addressFor=x=>[x.address||x.name,x.town,x.postcode].filter(Boolean).join(", ");
  const startValue=startPoint?(Number.isFinite(Number(startPoint.lat))&&Number.isFinite(Number(startPoint.lon))?startPoint.lat+","+startPoint.lon:startPoint.displayName):addressFor(routeStops[0]);
  const origin=encodeURIComponent(startValue);
  const returning=!!(startPoint&&returnToStart);
  const destinationValue=returning?(Number.isFinite(Number(startPoint.lat))&&Number.isFinite(Number(startPoint.lon))?startPoint.lat+","+startPoint.lon:startPoint.displayName):addressFor(returning?routeStops[routeStops.length-1]:stop);
  const destination=encodeURIComponent(destinationValue);
  const intermediate=(startPoint?(returning?routeStops:routeStops.slice(0,-1)):routeStops.slice(1,-1)).map(addressFor).filter(Boolean);
  const waypoints=intermediate.length?"&waypoints="+encodeURIComponent(intermediate.join("|")):"";
  const googleUrl="https://www.google.com/maps/dir/?api=1&origin="+origin+"&destination="+destination+waypoints+"&travelmode=driving";
  Alert.alert(
    "Choose navigation app",
    "Google Maps will use your selected start, visit the delivery stops in order"+(returning?" and return to the start.":"."),
    [
      {text:"Google Maps",onPress:()=>{setMapPreference("google");if(routeStops.length>4)return Alert.alert("Split this route","Google Maps on phones supports up to 3 intermediate stops in one directions link. Please navigate in groups of 4 stops or fewer.");Linking.openURL(googleUrl).catch(()=>Alert.alert("Unable to open","Google Maps could not be opened."));}},
      {text:"Multi Stop Maps",onPress:()=>{setMapPreference("google");if(routeStops.length>4)return Alert.alert("Split this route","Google Maps on phones supports up to 3 intermediate stops in one directions link. Please navigate in groups of 4 stops or fewer.");Linking.openURL(googleUrl).catch(()=>Alert.alert("Unable to open maps","Android could not open the multi-stop directions link. Please check that a browser or Google Maps is installed."));}},
      {text:"Apple Maps",onPress:()=>{setMapPreference("apple");const appleUrl="https://maps.apple.com/?saddr="+origin+"&daddr="+destination+(intermediate.length?"&waypoints="+encodeURIComponent(intermediate.join("|")):"")+"&dirflg=d";Linking.openURL(appleUrl).catch(()=>Alert.alert("Unable to open","Apple Maps could not be opened on this device."));}},
      {text:"Cancel",style:"cancel"}
    ]
  );
}
 const Header=()=> <View style={s.header}><View style={s.brandRow}>{logo}<View><Text style={s.brand}>Jett</Text><Text style={s.brandSmall}>distribution</Text></View></View><View style={s.net}><View style={[s.dot,{backgroundColor:online?C.green:C.red}]}/><Text style={s.netText}>{online?"ONLINE":"OFFLINE"}</Text></View></View>;
 const Button=({title,onPress,outline=false})=><TouchableOpacity onPress={onPress} style={[s.button,outline&&s.outline]}><Text style={[s.buttonText,outline&&s.outlineText]}>{title}</Text></TouchableOpacity>;
 const Nav=()=> <View style={s.nav}>{[["Home","⌂","home"],["Deliveries","▣","deliveries"],["Route","↝","route"],["Map","⌖","map"],["Reports","▥","performance"],["Settings","⚙","settings"]].map(([t,i,target])=><TouchableOpacity key={t} style={s.navItem} onPress={()=>{setTab(t);setScreen(target);}}><Text style={[s.navIcon,tab===t&&s.active]}>{i}</Text><Text style={[s.navLabel,tab===t&&s.active]}>{t}</Text></TouchableOpacity>)}</View>;
 const home=()=>{
  const completed=stops.filter(x=>x.done).length;
  const visited=stops.filter(x=>x.deliveryOutcome&&x.deliveryOutcome!=="Pending").length;
  const remaining=Math.max(0,stops.length-visited);
  const unsuccessful=stops.filter(x=>x.deliveryOutcome&&x.deliveryOutcome!=="Pending"&&!x.done).length;
  const successRate=stops.length?Math.round(completed/stops.length*100):0;
  const routeMiles=currentRoadMetrics?currentRoadMetrics.miles:miles;
  const bins=stops.reduce((n,x)=>n+Number(x.done?(x.deliveredWheelieBins??x.wheelieBins??0):0),0);
  const caddies=stops.reduce((n,x)=>n+Number(x.done?(x.deliveredFoodCaddies??x.foodCaddies??0):0),0);
  return <ScrollView contentContainerStyle={s.content}>
   <Header/>
   <View style={s.homeHero}>
    <View style={s.homeHeroCopy}><Text style={s.homeHeroEyebrow}>JETT DISTRIBUTION</Text><Text style={s.homeHeroTitle}>Jett Pal Pro</Text><Text style={s.homeHeroSub}>Delivery & Operations Manager</Text><View style={s.homeOnline}><View style={[s.dot,{backgroundColor:online?C.green:C.red}]}/><Text style={s.homeOnlineText}>{online?"SYSTEM ONLINE":"OFFLINE MODE"}</Text></View></View>
    <Image source={require("./jett-van.jpg")} style={s.homeHeroVan} resizeMode="contain"/>
   </View>
   <View style={s.homeStats}>
    <View style={s.homeStatCard}><Text style={s.homeStatIcon}>✓</Text><Text style={s.homeStatValue}>{completed}</Text><Text style={s.homeStatLabel}>Completed</Text></View>
    <View style={s.homeStatCard}><Text style={[s.homeStatIcon,{color:C.orange}]}>◷</Text><Text style={s.homeStatValue}>{remaining}</Text><Text style={s.homeStatLabel}>Remaining</Text></View>
    <View style={s.homeStatCard}><Text style={[s.homeStatIcon,{color:C.blue}]}>⌂</Text><Text style={s.homeStatValue}>{stops.length}</Text><Text style={s.homeStatLabel}>Total Stops</Text></View>
    <View style={s.homeStatCard}><Text style={[s.homeStatIcon,{color:C.blue}]}>⌖</Text><Text style={s.homeStatValue}>{routeMiles.toFixed(1)}</Text><Text style={s.homeStatLabel}>Route Miles</Text></View>
    <View style={s.homeStatCard}><Text style={s.homeStatIcon}>◉</Text><Text style={s.homeStatValue}>{successRate}%</Text><Text style={s.homeStatLabel}>Success Rate</Text></View>
   </View>
   <View style={s.homeGrid}>
    <TouchableOpacity style={[s.homeProTile,s.homeProTilePrimary]} onPress={()=>{setScreen("deliveries");setTab("Deliveries");}}><Text style={s.homeProIcon}>▣</Text><Text style={s.homeProTitle}>Delivery Manager</Text><Text style={s.homeProSub}>Properties & job status</Text></TouchableOpacity>
    <TouchableOpacity style={s.homeProTile} onPress={()=>{setScreen("route");setTab("Route");}}><Text style={s.homeProIcon}>↝</Text><Text style={s.homeProTitle}>Route Planner</Text><Text style={s.homeProSub}>Plan and optimise stops</Text></TouchableOpacity>
    <TouchableOpacity style={s.homeProTile} onPress={()=>{setScreen("stock");setTab("Home");}}><Text style={s.homeProIcon}>▤</Text><Text style={s.homeProTitle}>Stock Control</Text><Text style={s.homeProSub}>Load & track stock</Text></TouchableOpacity>
    <TouchableOpacity style={s.homeProTile} onPress={()=>{setScreen("performance");setTab("Reports");}}><Text style={s.homeProIcon}>▥</Text><Text style={s.homeProTitle}>Reports & Performance</Text><Text style={s.homeProSub}>Daily delivery totals</Text></TouchableOpacity>
    <TouchableOpacity style={s.homeProTile} onPress={()=>{setScreen("search");setTab("Home");}}><Text style={s.homeProIcon}>⌕</Text><Text style={s.homeProTitle}>House Finder</Text><Text style={s.homeProSub}>Find UK addresses</Text></TouchableOpacity>
    <TouchableOpacity style={s.homeProTile} onPress={importDeliveryFile}><Text style={s.homeProIcon}>▧</Text><Text style={s.homeProTitle}>Import Delivery List</Text><Text style={s.homeProSub}>Excel / CSV spreadsheet</Text></TouchableOpacity>
    <TouchableOpacity style={s.homeProTile} onPress={()=>{setScreen("map");setTab("Map");}}><Text style={s.homeProIcon}>⌖</Text><Text style={s.homeProTitle}>Map & Navigation</Text><Text style={s.homeProSub}>View stops and directions</Text></TouchableOpacity>
    <TouchableOpacity style={s.homeProTile} onPress={()=>{setScreen("saved");setTab("Home");}}><Text style={s.homeProIcon}>▤</Text><Text style={s.homeProTitle}>Saved Routes</Text><Text style={s.homeProSub}>Open saved delivery routes</Text></TouchableOpacity>
   </View>
   <View style={s.homeInfoRow}>
    <View style={[s.card,s.homeInfoCard]}><Text style={s.cardTitle}>TODAY'S PROGRESS</Text><View style={s.progressTrack}><View style={[s.progressFill,{width:successRate+"%"}]}/></View><Text style={s.greenText}>{successRate}% successfully completed</Text><Text style={s.small}>Visited: {visited}</Text><Text style={s.small}>Successful: {completed}</Text><Text style={s.small}>Unsuccessful: {unsuccessful}</Text><Text style={s.small}>Not visited: {remaining}</Text></View>
    <View style={[s.card,s.homeInfoCard]}><Text style={s.cardTitle}>ITEMS DELIVERED</Text><View style={s.homeItemRow}><Text style={s.homeItemIcon}>▤</Text><View style={{flex:1}}><Text style={s.homeItemLabel}>Wheelie bins</Text></View><Text style={s.homeItemValue}>{bins}</Text></View><View style={s.homeItemRow}><Text style={s.homeItemIcon}>▣</Text><View style={{flex:1}}><Text style={s.homeItemLabel}>Food caddies</Text></View><Text style={s.homeItemValue}>{caddies}</Text></View></View>
   </View>
   <View style={s.homeQuickActions}><TouchableOpacity style={s.homeQuickPrimary} onPress={()=>{setScreen("deliveries");setTab("Deliveries");}}><Text style={s.homeQuickPrimaryText}>Open Today's Deliveries</Text></TouchableOpacity><TouchableOpacity style={s.homeQuickSecondary} onPress={()=>{setScreen("performance");setTab("Reports");}}><Text style={s.homeQuickSecondaryText}>View Reports</Text></TouchableOpacity></View>
   <Text style={s.homeFoot}>JETT DISTRIBUTION  ·  JETT PAL PRO</Text>
  </ScrollView>;
 };
 const searchScreen=()=> <ScrollView contentContainerStyle={s.content}><Header/><Text style={s.title}>House Name Finder</Text><Text style={s.small}>Search by house name, number, street, town or postcode.</Text><View style={s.search}><Text style={s.searchGlyph}>⌕</Text><TextInput style={s.searchInput} placeholder="e.g. Rose Cottage, High Street..." placeholderTextColor="#78939b" value={query} onChangeText={setQuery} onSubmitEditing={search}/><TouchableOpacity onPress={search}><Text style={s.searchGo}>GO</Text></TouchableOpacity></View><View style={s.chips}>{["HOUSE NAMES","ADDRESSES","STREETS","POSTCODES"].map(x=><View key={x} style={s.chip}><Text style={s.chipText}>{x}</Text></View>)}</View><Text style={s.small}>Examples: Rose Cottage · 25 High Street · NR30 1JJ</Text>{busy&&<Text style={s.small}>Searching addresses…</Text>}{results.map((x,i)=><TouchableOpacity key={i} style={s.result} onPress={()=>choose(x)}><View style={s.houseIcon}><Text style={{color:C.green,fontSize:22}}>⌂</Text></View><View style={{flex:1}}><Text style={s.resultTitle}>{x.address?.house_name||x.address?.house_number||"Address result"}</Text><Text style={s.small}>{x.display_name}</Text>{x.matchNote&&<Text style={s.small}>{x.matchNote}</Text>}{x.cached&&<Text style={s.greenText}>Cached for offline use</Text>}</View><Text style={s.arrow}>›</Text></TouchableOpacity>)}</ScrollView>;
 const details=()=> <ScrollView contentContainerStyle={s.content}><Header/><Text style={s.title}>Address Details</Text><View style={s.card}><Text style={s.bigHouse}>⌂</Text><Text style={s.cardTitle}>{label||chosen?.display_name}</Text><Text style={s.small}>{chosen?.display_name}</Text><TextInput style={s.input} placeholder="House name / number + street" placeholderTextColor="#78939b" value={label} onChangeText={setLabel}/><TextInput style={s.input} placeholder="Town / city" placeholderTextColor="#78939b" value={town} onChangeText={setTown}/><TextInput style={s.input} placeholder="Postcode" placeholderTextColor="#78939b" value={pc} onChangeText={setPc}/><TextInput style={s.input} placeholder="Wheelie bins to deliver" placeholderTextColor="#78939b" keyboardType="number-pad" value={wheelieQty} onChangeText={setWheelieQty}/><TextInput style={s.input} placeholder="Food waste caddies to deliver" placeholderTextColor="#78939b" keyboardType="number-pad" value={caddyQty} onChangeText={setCaddyQty}/><Button title="＋  Add to Route" onPress={add}/><Button title="Back to results" outline onPress={()=>setScreen("search")}/></View></ScrollView>;
 const route=()=> <ScrollView contentContainerStyle={s.content}><Header/><Text style={s.title}>Route Summary</Text><View style={s.stats}><View><Text style={s.stat}>{stops.length}</Text><Text style={s.small}>STOPS</Text></View><View><Text style={s.stat}>{currentRoadMetrics?currentRoadMetrics.miles.toFixed(1):miles.toFixed(1)}</Text><Text style={s.small}>{currentRoadMetrics?"ROAD MILES":"STRAIGHT MILES*"}</Text></View><View><Text style={s.stat}>{currentRoadMetrics?fmt(currentRoadMetrics.minutes):fmt(Math.round(miles/28*60))}</Text><Text style={s.small}>{currentRoadMetrics?"EST. DRIVE":"EST. DRIVE*"}</Text></View></View><Text style={s.foot}>{currentRoadMetrics?"Road distance and drive time estimated from OpenStreetMap road routing. Traffic and delivery time are not included.":"*Before road optimisation: approximate straight-line estimate from saved coordinates."}</Text><View style={s.card}><Text style={s.cardTitle}>ROUTE START</Text><Text style={s.small}>{startPoint?.displayName||"Not selected — Jett will start at the first delivery."}</Text><Button title="◎  Use My Current Location" onPress={useCurrentStart} outline disabled={busy}/><TextInput style={s.input} value={startQuery} onChangeText={setStartQuery} placeholder="Or enter depot / starting address" placeholderTextColor="#78939b"/><Button title="Find Starting Address" onPress={searchStartAddress} outline disabled={busy}/>{startResults.map((item)=><TouchableOpacity key={String(item.udprn)} style={s.result} onPress={()=>chooseStartAddress(item)}><Text style={s.resultTitle}>{item.label}</Text><Text style={s.action}>USE THIS START</Text></TouchableOpacity>)}<TouchableOpacity style={s.preference} onPress={()=>{setReturnToStart(!returnToStart);setRoadMetrics(null);}}><Text style={s.resultTitle}>{returnToStart?"☑":"□"} Return to starting point</Text></TouchableOpacity></View><Button title={busy?"Calculating road route…":"↝  Optimise Road Route"} onPress={optimise} disabled={busy}/><Button title="▤  Import Excel / CSV Delivery List" onPress={importDeliveryFile} outline/><TextInput style={s.input} value={googleSheetUrl} onChangeText={setGoogleSheetUrl} autoCapitalize="none" placeholder="Paste Google Sheets link here" placeholderTextColor="#78939b"/><Button title="Import Google Sheet" onPress={importGoogleSheet} outline/><View style={s.card}><Text style={s.cardTitle}>DELIVERY STOPS</Text>{stops.length===0&&<Text style={s.small}>No stops yet. Use House Name Finder to add an address.</Text>}{stops.map((x,i)=><View key={x.id} style={s.stop}><View style={s.number}><Text style={s.numberText}>{i+1}</Text></View><View style={{flex:1}}><Text style={s.resultTitle}>{x.name}</Text><Text style={s.small}>{x.town} {x.postcode}</Text><Text style={[s.small,{color:x.done?C.green:C.orange}]}>{x.done?"✓ Delivered":"● Pending"}</Text></View><TouchableOpacity onPress={()=>openCompletion(x)}><Text style={s.action}>{x.done?"REPORT":"DONE"}</Text></TouchableOpacity><TouchableOpacity onPress={()=>setStops(stops.filter(y=>y.id!==x.id))}><Text style={s.delete}>×</Text></TouchableOpacity></View>)}</View><TextInput style={s.input} value={routeName} onChangeText={setRouteName} placeholder="Route name" placeholderTextColor="#78939b"/><View style={s.two}><View style={{flex:1}}><Button title="▤  Save Route" onPress={saveRoute} outline/></View><View style={{flex:1}}><Button title="➤  Navigate" onPress={()=>{if(!stops.length)return;const x=stops[stops.length-1];openNavigation(x,stops);}}/></View></View></ScrollView>;
 const deliveryScreen=()=>{
  const completed=stops.filter(x=>x.done).length;
  return <ScrollView contentContainerStyle={s.content}><Header/><Text style={s.title}>Jett Delivery Manager</Text><Text style={s.small}>Your wheelie bin and food waste caddy delivery list.</Text>
   <View style={s.stats}><View><Text style={s.stat}>{stops.length}</Text><Text style={s.small}>PROPERTIES</Text></View><View><Text style={s.stat}>{completed}</Text><Text style={s.small}>COMPLETED</Text></View><View><Text style={s.stat}>{stops.length-completed}</Text><Text style={s.small}>REMAINING</Text></View></View>
   <Button title="Import Excel / CSV delivery sheet" onPress={importDeliveryFile} outline/>
   <TextInput style={s.input} value={googleSheetUrl} onChangeText={setGoogleSheetUrl} autoCapitalize="none" placeholder="Paste Google Sheets link" placeholderTextColor="#78939b"/>
   <Button title="Import Google Sheet" onPress={importGoogleSheet} outline/>
   <View style={s.card}><Text style={s.cardTitle}>TODAY'S PROPERTIES</Text>{stops.length===0?<Text style={s.small}>No delivery jobs loaded yet. Import a spreadsheet or add addresses using House Finder.</Text>:stops.map((x,i)=><View key={x.id} style={s.stop}><View style={s.number}><Text style={s.numberText}>{i+1}</Text></View><View style={{flex:1}}><Text style={s.resultTitle}>{x.name}</Text><Text style={s.small}>{x.town} {x.postcode}</Text><Text style={s.small}>Wheelie bins: {Number(x.wheelieBins||0)} · Food caddies: {Number(x.foodCaddies||0)}</Text><Text style={[s.small,{color:x.done?C.green:C.orange}]}>{x.deliveryOutcome&&x.deliveryOutcome!=="Pending"?x.deliveryOutcome:(x.done?"✓ Delivered":"● Pending")}</Text>{x.deliveryNotes?<Text style={s.small}>Note: {x.deliveryNotes}</Text>:null}</View><TouchableOpacity onPress={()=>openCompletion(x)}><Text style={s.action}>{x.done?"REPORT":"DELIVERED"}</Text></TouchableOpacity></View>)}</View>
   <Button title="Open Stock Control" onPress={()=>{setScreen("stock");setTab("Home");}}/>
   <Button title="Back to Home" onPress={()=>{setScreen("home");setTab("Home");}} outline/>
  </ScrollView>;
 };
 const stockScreen=()=>{
  const requiredBins=stops.reduce((n,x)=>n+Number(x.wheelieBins||0),0);
  const requiredCaddies=stops.reduce((n,x)=>n+Number(x.foodCaddies||0),0);
  const deliveredBins=stops.reduce((n,x)=>n+Number(x.done?(x.deliveredWheelieBins??x.wheelieBins??0):0),0);
  const deliveredCaddies=stops.reduce((n,x)=>n+Number(x.done?(x.deliveredFoodCaddies??x.foodCaddies??0):0),0);
  const loadedBins=Number(stockLoaded.wheelieBins||0),loadedCaddies=Number(stockLoaded.foodCaddies||0);
  return <ScrollView contentContainerStyle={s.content}><Header/><Text style={s.title}>Jett Stock Control</Text><Text style={s.small}>Work out what to load before leaving the depot and what remains after deliveries.</Text>
   <View style={s.card}><Text style={s.cardTitle}>WHEELIE BINS</Text><View style={s.stats}><View><Text style={s.stat}>{requiredBins}</Text><Text style={s.small}>REQUIRED</Text></View><View><Text style={s.stat}>{loadedBins}</Text><Text style={s.small}>LOADED</Text></View><View><Text style={s.stat}>{deliveredBins}</Text><Text style={s.small}>DELIVERED</Text></View></View><TextInput style={s.input} keyboardType="number-pad" value={String(stockLoaded.wheelieBins??0)} onChangeText={v=>setStockLoaded(p=>({...p,wheelieBins:Math.max(0,parseInt(v||"0",10)||0)}))} placeholder="Number of wheelie bins loaded" placeholderTextColor="#78939b"/><Text style={s.greenText}>Still to load: {Math.max(0,requiredBins-loadedBins)} · Remaining on van after deliveries: {Math.max(0,loadedBins-deliveredBins)}</Text></View>
   <View style={s.card}><Text style={s.cardTitle}>FOOD WASTE CADDIES</Text><View style={s.stats}><View><Text style={s.stat}>{requiredCaddies}</Text><Text style={s.small}>REQUIRED</Text></View><View><Text style={s.stat}>{loadedCaddies}</Text><Text style={s.small}>LOADED</Text></View><View><Text style={s.stat}>{deliveredCaddies}</Text><Text style={s.small}>DELIVERED</Text></View></View><TextInput style={s.input} keyboardType="number-pad" value={String(stockLoaded.foodCaddies??0)} onChangeText={v=>setStockLoaded(p=>({...p,foodCaddies:Math.max(0,parseInt(v||"0",10)||0)}))} placeholder="Number of food caddies loaded" placeholderTextColor="#78939b"/><Text style={s.greenText}>Still to load: {Math.max(0,requiredCaddies-loadedCaddies)} · Remaining on van after deliveries: {Math.max(0,loadedCaddies-deliveredCaddies)}</Text></View>
   <Text style={s.foot}>Stock figures are saved on this phone. Delivery totals are calculated from properties marked as delivered.</Text>
   <Button title="Open Delivery Manager" onPress={()=>{setScreen("deliveries");setTab("Home");}} outline/>
   <Button title="Back to Home" onPress={()=>{setScreen("home");setTab("Home");}} outline/>
  </ScrollView>;
 };
 const performanceScreen=()=>{
  const completed=stops.filter(x=>x.done).length;
  const visited=stops.filter(x=>x.deliveryOutcome&&x.deliveryOutcome!=="Pending").length;
  const failed=stops.filter(x=>x.deliveryOutcome&&x.deliveryOutcome!=="Pending"&&!x.done).length;
  const remaining=stops.length-visited;
  const binsDelivered=stops.reduce((n,x)=>n+Number(x.done?(x.deliveredWheelieBins??x.wheelieBins??0):0),0);
  const caddiesDelivered=stops.reduce((n,x)=>n+Number(x.done?(x.deliveredFoodCaddies??x.foodCaddies??0):0),0);
  const routeMiles=currentRoadMetrics?currentRoadMetrics.miles:miles;
  const weekAgo=Date.now()-7*24*60*60*1000;
  const recent=saved.filter(x=>x.savedAt&&new Date(x.savedAt).getTime()>=weekAgo);
  const savedStops=recent.reduce((n,x)=>n+(x.stops?.length||0),0);
  const savedMiles=recent.reduce((n,x)=>n+Number(x.miles||0),0);
  return <ScrollView contentContainerStyle={s.content}><Header/><Text style={s.title}>Delivery Performance</Text><Text style={s.small}>Your current delivery progress and saved route activity.</Text>
   <View style={s.stats}><View><Text style={s.stat}>{completed}</Text><Text style={s.small}>DELIVERED</Text></View><View><Text style={s.stat}>{remaining}</Text><Text style={s.small}>REMAINING</Text></View><View><Text style={s.stat}>{routeMiles.toFixed(1)}</Text><Text style={s.small}>ROUTE MILES</Text></View></View>
   <View style={s.card}><Text style={s.cardTitle}>END-OF-DAY DELIVERY SUMMARY</Text><View style={s.stats}><View><Text style={s.stat}>{visited}</Text><Text style={s.small}>VISITED</Text></View><View><Text style={s.stat}>{completed}</Text><Text style={s.small}>SUCCESSFUL</Text></View><View><Text style={s.stat}>{failed}</Text><Text style={s.small}>UNSUCCESSFUL</Text></View></View><View style={s.stats}><View><Text style={s.stat}>{remaining}</Text><Text style={s.small}>NOT VISITED</Text></View><View><Text style={s.stat}>{binsDelivered}</Text><Text style={s.small}>BINS DELIVERED</Text></View><View><Text style={s.stat}>{caddiesDelivered}</Text><Text style={s.small}>CADDIES DELIVERED</Text></View></View><View style={{height:10,backgroundColor:C.bg,borderRadius:8,overflow:"hidden",marginVertical:10}}><View style={{height:10,width:(stops.length?Math.round(completed/stops.length*100):0)+"%",backgroundColor:C.green,borderRadius:8}}/></View><Text style={s.greenText}>{stops.length?Math.round(completed/stops.length*100):0}% successfully completed</Text><Text style={s.small}>{completed} of {stops.length} stops successfully delivered. Failed or partially completed jobs remain visible below.</Text></View><View style={s.card}><Text style={s.cardTitle}>DELIVERY OUTCOMES</Text>{stops.length?stops.map(x=><View key={x.id} style={s.stop}><View style={{flex:1}}><Text style={s.resultTitle}>{x.name}</Text><Text style={s.small}>{x.postcode||x.town} · {x.deliveryOutcome|| (x.done?"Delivered":"Pending")}</Text>{x.done?<Text style={s.small}>Delivered: {Number(x.deliveredWheelieBins??x.wheelieBins??0)} bins · {Number(x.deliveredFoodCaddies??x.foodCaddies??0)} caddies</Text>:null}{x.deliveryNotes?<Text style={s.small}>Note: {x.deliveryNotes}</Text>:null}</View></View>):<Text style={s.small}>No delivery jobs on the current list yet.</Text>}</View>
   <View style={s.card}><Text style={s.cardTitle}>LAST 7 DAYS · SAVED ROUTES</Text><View style={s.stats}><View><Text style={s.stat}>{recent.length}</Text><Text style={s.small}>ROUTES SAVED</Text></View><View><Text style={s.stat}>{savedStops}</Text><Text style={s.small}>STOPS PLANNED</Text></View><View><Text style={s.stat}>{savedMiles.toFixed(1)}</Text><Text style={s.small}>MILES SAVED</Text></View></View><Text style={s.foot}>These figures are based on saved route snapshots, not confirmed completed deliveries.</Text></View>
   <View style={s.card}><Text style={s.cardTitle}>RECENT ROUTE HISTORY</Text>{recent.length?recent.slice(0,8).map(x=><View key={x.id} style={s.stop}><View style={{flex:1}}><Text style={s.resultTitle}>{x.name||"Jett Pal Route"}</Text><Text style={s.small}>{new Date(x.savedAt).toLocaleDateString()} · {x.stops?.length||0} stops</Text></View><Text style={s.action}>{Number(x.miles||0).toFixed(1)} mi</Text></View>):<Text style={s.small}>No routes saved in the last 7 days yet. Save a route and it will appear here.</Text>}</View>
   <Text style={s.foot}>Average delivery time will be available once Jett records delivery timestamps. It is not estimated from route data.</Text>
   <Button title="Back to Home" onPress={()=>{setScreen("home");setTab("Home");}} outline/>
  </ScrollView>;
 };
 const savedScreen=()=> <ScrollView contentContainerStyle={s.content}><Header/><Text style={s.title}>Saved Routes</Text>{saved.length===0?<View style={s.card}><Text style={s.small}>No saved routes yet. Save a route to keep it on your phone.</Text></View>:saved.map(r=><View key={r.id} style={s.card}><Text style={s.cardTitle}>{r.name}</Text><Text style={s.small}>{r.stops.length} stops · {Number(r.miles||0).toFixed(1)} miles</Text><Button title="Load Route" onPress={()=>{setStops(r.stops);setScreen("route");setTab("Route");}}/></View>)}</ScrollView>;
 const settingsScreen=()=> <ScrollView contentContainerStyle={s.content}><Header/><Text style={s.title}>Navigation Settings</Text><View style={s.card}><Text style={s.cardTitle}>Preferred map app</Text><Text style={s.small}>Choose which app to use when you start a route. You can also choose each time you navigate.</Text>{[["google","Google Maps"],["apple","Apple Maps"]].map(([v,t])=><TouchableOpacity key={v} style={s.preference} onPress={()=>setMapPreference(v)}><View style={[s.radio,{borderColor:mapChoice===v?C.green:C.muted}]}>{mapChoice===v&&<View style={s.radioInner}/>}</View><View style={{flex:1}}><Text style={s.resultTitle}>{t}</Text><Text style={s.small}>{v==="google"?"Works on Android and iPhone":"Available on Apple devices; on Android this may open in a browser or may not be supported"}</Text></View></TouchableOpacity>)}<Button title="Ask me every time" onPress={()=>setMapPreference("ask") } outline/><Text style={[s.small,{marginTop:10}]}>Note: Apple Maps is not normally installed on Android phones. On your Moto G17, Google Maps is the reliable option; Apple Maps links may open in a browser or may not work as expected.</Text></View></ScrollView>;
 const mapScreen=()=> <ScrollView contentContainerStyle={s.content}><Header/><Text style={s.title}>Route Map</Text><View style={s.mapPlaceholder}><Text style={s.mapPin}>⌖</Text><Text style={s.cardTitle}>{online?"Map preview":"Offline locations"}</Text><Text style={s.small}>{online?"Open the route in Google Maps for live map tiles and turn-by-turn directions.":"Map tiles need internet, but cached stop details remain available."}</Text><Button title="Open Google Maps" onPress={()=>{if(stops.length){const a=stops.map(x=>x.postcode||x.name).join("/");openNavigation(stops[stops.length-1],stops);}else Alert.alert("No stops","Add stops first.");}}/></View>{stops.map((x,i)=><Text key={x.id} style={s.feature}>{i+1}. {x.name} — {x.postcode||x.town}</Text>)}</ScrollView>;
 const completionScreen=()=>{const item=stops.find(x=>x.id===selectedDeliveryId);if(!item)return <ScrollView contentContainerStyle={s.content}><Header/><Text style={s.title}>Delivery Report</Text><Text style={s.small}>No property selected. Return to Delivery Manager.</Text><Button title="Back to Delivery Manager" onPress={()=>{setScreen("deliveries");setTab("Home");}}/></ScrollView>;return <ScrollView contentContainerStyle={s.content}><Header/><Text style={s.title}>Delivery Report</Text><View style={s.card}><Text style={s.cardTitle}>{item.name}</Text><Text style={s.small}>{item.town} {item.postcode}</Text><Text style={[s.small,{marginTop:8}]}>Required: {Number(item.wheelieBins||0)} wheelie bins · {Number(item.foodCaddies||0)} food caddies</Text></View><Text style={s.cardTitle}>DELIVERY OUTCOME</Text>{["Delivered","Partially delivered","No access","Wrong address","Damaged item","Customer not home"].map(v=><TouchableOpacity key={v} style={s.preference} onPress={()=>setDeliveryOutcome(v)}><View style={[s.radio,{borderColor:deliveryOutcome===v?C.green:C.muted}]}>{deliveryOutcome===v&&<View style={s.radioInner}/>}</View><Text style={s.resultTitle}>{v}</Text></TouchableOpacity>)}<View style={s.card}><Text style={s.cardTitle}>ACTUALLY DELIVERED</Text><Text style={s.small}>Wheelie bins (max {Number(item.wheelieBins||0)})</Text><TextInput style={s.input} keyboardType="number-pad" value={actualWheelieQty} onChangeText={setActualWheelieQty} placeholder="Bins delivered" placeholderTextColor="#78939b"/><Text style={s.small}>Food waste caddies (max {Number(item.foodCaddies||0)})</Text><TextInput style={s.input} keyboardType="number-pad" value={actualCaddyQty} onChangeText={setActualCaddyQty} placeholder="Caddies delivered" placeholderTextColor="#78939b"/><Text style={s.small}>Delivery notes / reason</Text><TextInput style={[s.input,{minHeight:100,textAlignVertical:"top"}]} multiline value={deliveryNotes} onChangeText={setDeliveryNotes} placeholder="Add details about the delivery or problem..." placeholderTextColor="#78939b"/></View><Button title="Save Delivery Report" onPress={saveCompletion}/><Button title="Cancel" outline onPress={()=>{setScreen("deliveries");setTab("Home");}}/></ScrollView>;};
 let body=screen==="home"?home():screen==="search"?searchScreen():screen==="details"?details():screen==="route"?route():screen==="deliveries"?deliveryScreen():screen==="completion"?completionScreen():screen==="stock"?stockScreen():screen==="saved"?savedScreen():screen==="performance"?performanceScreen():screen==="settings"?settingsScreen():mapScreen();
 return <SafeAreaView style={s.safe}>
  <StatusBar backgroundColor={C.bg} barStyle="light-content"/>
  <View style={{flex:1}}>
    {body}
  </View>
  <View style={{paddingBottom:Platform.OS==="android"?30:12,backgroundColor:C.bg}}>
    <Nav/>
  </View>
  {splashVisible && (
    <Animated.View
      pointerEvents="none"
      style={{
        position:"absolute",
        top:0,
        left:0,
        right:0,
        bottom:0,
        backgroundColor:"#000",
        opacity:splashOpacity,
        alignItems:"center",
        justifyContent:"center"
      }}
    >
      <Image
        source={require("./loading-screen.png")}
        resizeMode="contain"
        style={{width:"100%",height:"100%"}}
      />
    </Animated.View>
  )}
</SafeAreaView>
;
  }
const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:C.bg},content:{padding:16,paddingBottom:50},header:{height:55,flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginBottom:12},brandRow:{flexDirection:"row",alignItems:"center"},brand:{fontSize:22,color:C.text,fontWeight:"900",lineHeight:22},brandSmall:{fontSize:11,color:C.muted},net:{flexDirection:"row",alignItems:"center",gap:6},dot:{width:8,height:8,borderRadius:4},netText:{fontSize:10,color:C.muted,fontWeight:"900"},hero:{alignItems:"center",paddingVertical:18},logoMark:{width:94,height:94,borderRadius:47,borderWidth:6,borderColor:C.green,alignItems:"center",justifyContent:"center",backgroundColor:"#123a28"},logoGlyph:{color:C.green2,fontSize:57,lineHeight:61},uk:{color:C.text,fontSize:10,fontWeight:"900",position:"absolute",bottom:19},heroTitle:{fontSize:29,color:C.text,fontWeight:"900",marginTop:10},pill:{backgroundColor:C.green,paddingHorizontal:12,paddingVertical:5,borderRadius:15,color:"#062010",overflow:"hidden",fontSize:11,fontWeight:"900",marginTop:8},sub:{textAlign:"center",color:C.muted,lineHeight:19,marginTop:10},button:{backgroundColor:C.green,padding:15,borderRadius:13,alignItems:"center",justifyContent:"center",marginTop:10},buttonText:{color:"#062010",fontWeight:"900",fontSize:15},outline:{backgroundColor:"transparent",borderWidth:1,borderColor:C.green},outlineText:{color:C.green},two:{flexDirection:"row",gap:10,marginTop:10},tile:{flex:1,backgroundColor:C.panel,borderWidth:1,borderColor:C.line,borderRadius:14,padding:14},tileIcon:{fontSize:25,color:C.green},tileTitle:{color:C.text,fontWeight:"900",marginTop:4},small:{color:C.muted,fontSize:12,lineHeight:18},card:{backgroundColor:C.panel,borderWidth:1,borderColor:C.line,borderRadius:15,padding:15,marginTop:12},cardTitle:{color:C.text,fontSize:17,fontWeight:"900",marginBottom:8},feature:{color:C.text,paddingVertical:6,fontSize:13},notice:{backgroundColor:"#0b3025",padding:13,borderRadius:12,marginTop:12},greenText:{color:C.green,fontWeight:"900",fontSize:12},title:{color:C.text,fontSize:25,fontWeight:"900",marginBottom:8},search:{flexDirection:"row",alignItems:"center",borderColor:C.green,borderWidth:1,borderRadius:13,backgroundColor:C.panel,paddingHorizontal:12,marginVertical:12},searchGlyph:{fontSize:24,color:C.green},searchInput:{flex:1,color:C.text,padding:12},searchGo:{color:C.green,fontWeight:"900",padding:8},chips:{flexDirection:"row",flexWrap:"wrap",gap:6,marginBottom:10},chip:{borderRadius:20,borderWidth:1,borderColor:C.line,paddingHorizontal:9,paddingVertical:6},chipText:{color:C.muted,fontSize:9,fontWeight:"900"},result:{flexDirection:"row",alignItems:"center",gap:10,padding:12,backgroundColor:C.panel,borderWidth:1,borderColor:C.line,borderRadius:13,marginTop:8},houseIcon:{width:38,height:38,borderRadius:19,backgroundColor:"#123a28",alignItems:"center",justifyContent:"center"},resultTitle:{color:C.text,fontWeight:"900",fontSize:14},arrow:{fontSize:25,color:C.green},bigHouse:{fontSize:43,color:C.green,textAlign:"center"},input:{backgroundColor:C.bg,borderColor:C.line,borderWidth:1,borderRadius:10,padding:12,color:C.text,marginTop:9},stats:{flexDirection:"row",justifyContent:"space-around",backgroundColor:C.panel,borderRadius:14,padding:15,marginVertical:10},stat:{color:C.text,fontSize:23,fontWeight:"900",textAlign:"center"},foot:{color:C.muted,fontSize:10},stop:{flexDirection:"row",alignItems:"center",gap:9,paddingVertical:11,borderBottomWidth:1,borderBottomColor:C.line},number:{width:30,height:30,borderRadius:15,backgroundColor:C.green,alignItems:"center",justifyContent:"center"},numberText:{color:"#062010",fontWeight:"900"},action:{color:C.green,fontWeight:"900",fontSize:10},delete:{color:C.red,fontSize:23,paddingHorizontal:5},preference:{flexDirection:"row",alignItems:"center",gap:12,paddingVertical:13,borderBottomWidth:1,borderBottomColor:C.line},radio:{width:22,height:22,borderRadius:11,borderWidth:2,alignItems:"center",justifyContent:"center"},radioInner:{width:10,height:10,borderRadius:5,backgroundColor:C.green},welcomeCard:{backgroundColor:"#041a20",borderColor:C.green,borderWidth:2,borderRadius:24,padding:18,alignItems:"center",marginTop:14,marginBottom:18,minHeight:330,justifyContent:"center",overflow:"hidden"},vanStage:{width:"100%",height:190,alignItems:"center",justifyContent:"center",marginBottom:4},heroVan:{width:"100%",height:190},vanBrand:{position:"absolute",bottom:24,color:C.text,fontWeight:"900",fontSize:13,letterSpacing:1,backgroundColor:"#06151d",paddingHorizontal:10},welcomeTitle:{color:C.text,fontSize:27,fontWeight:"900",textAlign:"center",marginTop:6},welcomeUnderline:{height:4,width:"72%",backgroundColor:C.green,borderRadius:4,marginTop:12,marginBottom:16},welcomeSub:{color:C.muted,fontSize:15,lineHeight:22,textAlign:"center",paddingHorizontal:8},homeGrid:{flexDirection:"row",flexWrap:"wrap",justifyContent:"space-between",gap:12},homeTile:{width:"48%",minHeight:150,backgroundColor:C.panel,borderWidth:1,borderColor:C.line,borderRadius:20,padding:14,alignItems:"center",justifyContent:"center"},homeTileIcon:{fontSize:38,color:C.green,marginBottom:8},homeTileTitle:{fontSize:18,fontWeight:"900",color:C.text,textAlign:"center"},homeTileSub:{fontSize:12,color:C.muted,lineHeight:18,textAlign:"center",marginTop:8},homeFoot:{textAlign:"center",fontSize:10,color:C.muted,marginTop:16},homeHero:{minHeight:150,backgroundColor:"#041b20",borderWidth:1,borderColor:"#236b49",borderRadius:22,overflow:"hidden",padding:16,flexDirection:"row",alignItems:"center",marginTop:8,marginBottom:12},homeHeroCopy:{flex:1,zIndex:2},homeHeroEyebrow:{fontSize:10,fontWeight:"900",letterSpacing:2,color:C.green2},homeHeroTitle:{fontSize:27,fontWeight:"900",color:C.text,marginTop:5},homeHeroSub:{fontSize:12,color:"#d3e5df",fontWeight:"700",marginTop:2},homeOnline:{flexDirection:"row",alignItems:"center",gap:6,marginTop:12,backgroundColor:"#0a3027",paddingHorizontal:10,paddingVertical:6,borderRadius:20,alignSelf:"flex-start"},homeOnlineText:{fontSize:9,color:C.text,fontWeight:"900"},homeHeroVan:{width:"43%",height:120,marginLeft:-8},homeStats:{flexDirection:"row",flexWrap:"wrap",justifyContent:"space-between",gap:7,marginBottom:12},homeStatCard:{width:"19%",minWidth:58,flexGrow:1,backgroundColor:"#0a222b",borderWidth:1,borderColor:"#28505a",borderRadius:13,paddingVertical:10,paddingHorizontal:3,alignItems:"center",justifyContent:"center"},homeStatIcon:{fontSize:20,color:C.green,fontWeight:"900"},homeStatValue:{fontSize:19,color:C.text,fontWeight:"900",marginTop:2},homeStatLabel:{fontSize:9,color:C.muted,textAlign:"center",marginTop:2},homeProTile:{width:"48.5%",minHeight:112,backgroundColor:"#0a222b",borderWidth:1,borderColor:"#28505a",borderRadius:17,padding:12,alignItems:"center",justifyContent:"center"},homeProTilePrimary:{backgroundColor:"#103526",borderColor:C.green,borderWidth:1.5},homeProIcon:{fontSize:31,color:C.green,fontWeight:"900",marginBottom:4},homeProTitle:{fontSize:14,color:C.text,fontWeight:"900",textAlign:"center"},homeProSub:{fontSize:10,color:C.muted,textAlign:"center",marginTop:4},homeInfoRow:{flexDirection:"row",gap:9,alignItems:"stretch"},homeInfoCard:{flex:1,padding:11,marginTop:12,minWidth:0},progressTrack:{height:9,backgroundColor:C.bg,borderRadius:8,overflow:"hidden",marginVertical:9},progressFill:{height:9,backgroundColor:C.green,borderRadius:8},homeItemRow:{flexDirection:"row",alignItems:"center",gap:6,paddingVertical:11,borderBottomWidth:1,borderBottomColor:C.line},homeItemIcon:{fontSize:20,color:C.green},homeItemLabel:{fontSize:10,color:C.text,fontWeight:"800"},homeItemValue:{fontSize:18,color:C.green,fontWeight:"900"},homeQuickActions:{flexDirection:"row",gap:9,marginTop:12},homeQuickPrimary:{flex:1,backgroundColor:C.green,borderRadius:13,padding:14,alignItems:"center",justifyContent:"center"},homeQuickPrimaryText:{color:"#062010",fontSize:12,fontWeight:"900",textAlign:"center"},homeQuickSecondary:{paddingHorizontal:15,borderRadius:13,borderWidth:1,borderColor:C.green,alignItems:"center",justifyContent:"center"},homeQuickSecondaryText:{color:C.green,fontSize:11,fontWeight:"900"},mapPlaceholder:{backgroundColor:C.panel,borderColor:C.line,borderWidth:1,borderRadius:15,padding:24,alignItems:"center",marginVertical:12},mapPin:{color:C.green,fontSize:52},nav:{height:65,flexDirection:"row",backgroundColor:"#041019",borderTopWidth:1,borderTopColor:C.line},navItem:{flex:1,alignItems:"center",justifyContent:"center"},navIcon:{fontSize:22,color:C.muted},navLabel:{fontSize:10,color:C.muted,marginTop:3,fontWeight:"800"},active:{color:C.green}
});
