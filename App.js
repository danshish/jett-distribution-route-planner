import React, { useEffect, useMemo, useState, useRef } from "react";
import { Alert, Animated, FlatList, Image, Linking, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as XLSX from "xlsx";

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
 const [query,setQuery]=useState(""),[results,setResults]=useState([]),[busy,setBusy]=useState(false),[chosen,setChosen]=useState(null);
 const [label,setLabel]=useState(""),[town,setTown]=useState(""),[pc,setPc]=useState(""),[routeName,setRouteName]=useState("Jett Delivery Route");
 const [mapChoice,setMapChoice]=useState("google");
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
 useEffect(()=>{(async()=>{try{const [c,r,s,m]=await Promise.all([AsyncStorage.getItem(CACHE),AsyncStorage.getItem(ROUTES),AsyncStorage.getItem(CURRENT),AsyncStorage.getItem("@jett_map_choice")]);if(c)setCache(JSON.parse(c));if(r)setSaved(JSON.parse(r));if(s)setStops(JSON.parse(s));if(m)setMapChoice(m);}catch{}})();const u=NetInfo.addEventListener(x=>setOnline(!!x.isConnected));NetInfo.fetch().then(x=>setOnline(!!x.isConnected));return u;},[]);
 useEffect(()=>{AsyncStorage.setItem(CURRENT,JSON.stringify(stops)).catch(()=>{});},[stops]);
 const miles=useMemo(()=>{let n=0;for(let i=1;i<stops.length;i++){const a=cache[stops[i-1].key],b=cache[stops[i].key];if(a&&b)n+=distance(a,b);}return n;},[stops,cache]);
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
function add(){if(!chosen)return;setStops([...stops,{id:Date.now().toString(),key:chosen.key,name:label.trim()||chosen.display_name,address:label.trim(),town:town.trim(),postcode:clean(pc),done:false}]);setChosen(null);setScreen("route");setTab("Route");}

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
      postcode:["postcode","post code","postal code","zip","zip code"]
    };
    const header=rows[0].map(norm);
    const hasHeader=header.some(h=>Object.values(aliases).flat().includes(h));
    const findIndex=key=>header.findIndex(h=>aliases[key].includes(h));
    const indexes=hasHeader?{
      address:findIndex("address"),house:findIndex("house"),street:findIndex("street"),town:findIndex("town"),postcode:findIndex("postcode")
    }:{address:0,house:-1,street:-1,town:-1,postcode:-1};
    const data=rows.slice(hasHeader?1:0);
    const imported=data.map((row,i)=>{
      const cell=n=>indexes[n]>=0?String(row[indexes[n]]??"").trim():"";
      const house=cell("house"),street=cell("street");
      const address=cell("address")||[house,street].filter(Boolean).join(" ");
      const fallback=address||row.map(v=>String(v||"").trim()).filter(Boolean).join(", ");
      if(!fallback)return null;
      const id="import_"+Date.now()+"_"+i;
      const townValue=cell("town"),postcodeValue=cell("postcode").toUpperCase();
      return {id,key:id,name:fallback,address:fallback,town:townValue,postcode:postcodeValue,done:false};
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

 function saveRoute(){if(!stops.length)return Alert.alert("No stops","Add addresses before saving.");const item={id:Date.now().toString(),name:routeName,stops,miles,savedAt:new Date().toISOString()};const r=[item,...saved].slice(0,30);setSaved(r);AsyncStorage.setItem(ROUTES,JSON.stringify(r));Alert.alert("Route saved","Available offline on this phone.");}
 function optimise(){if(stops.some(x=>!cache[x.key]))return Alert.alert("Find locations first","Search each address while online before optimising.");if(stops.length<3)return Alert.alert("Add more stops","Add at least three stops to optimise.");const left=[...stops],out=[left.shift()];while(left.length){const a=cache[out[out.length-1].key];let bi=0,best=Infinity;left.forEach((x,i)=>{const d=distance(a,cache[x.key]);if(d<best){best=d;bi=i;}});out.push(left.splice(bi,1)[0]);}setStops(out);}
 async function setMapPreference(choice){
  setMapChoice(choice);
  await AsyncStorage.setItem("@jett_map_choice",choice);
 }
 
function openNavigation(stop,routeStops=[stop]){
  const addressFor=x=>[x.address||x.name,x.town,x.postcode].filter(Boolean).join(", ");
  const destination=encodeURIComponent(addressFor(stop));
  const intermediate=routeStops.slice(0,-1).map(addressFor).filter(Boolean);
  const waypoints=intermediate.length?"&waypoints="+encodeURIComponent(intermediate.join("|")):"";
  Alert.alert(
    "Choose navigation app",
    "Google Maps will navigate all stops in order. Apple Maps will open the final stop only.",
    [
      {
        text:"Google Maps",
        onPress:()=>{
          setMapPreference("google");
          if(routeStops.length>4)return Alert.alert("Split this route","Google Maps on phones supports up to 3 intermediate stops in one directions link. Please navigate in groups of 4 stops or fewer.");
          Linking.openURL("https://www.google.com/maps/dir/?api=1&destination="+destination+waypoints+"&travelmode=driving")
            .catch(()=>Alert.alert("Unable to open","Google Maps could not be opened."));
        }
      },
      {
        text:"Multi Stop Maps",
        onPress:()=>{
          setMapPreference("google");
          if(routeStops.length>4)return Alert.alert("Split this route","Google Maps on phones supports up to 3 intermediate stops in one directions link. Please navigate in groups of 4 stops or fewer.");
          const browserUrl="https://www.google.com/maps/dir/?api=1&destination="+destination+waypoints+"&travelmode=driving";
          Linking.openURL(browserUrl)
            .catch(()=>Alert.alert("Unable to open maps","Android could not open the multi-stop directions link. Please check that a browser or Google Maps is installed."));
        }
      },
      {
        text:"Apple Maps",
        onPress:()=>{
          setMapPreference("apple");
          Linking.openURL("https://maps.apple.com/?daddr="+destination+"&dirflg=d")
            .catch(()=>Alert.alert("Unable to open","Apple Maps could not be opened on this device."));
        }
      },
      {text:"Cancel",style:"cancel"}
    ]
  );
}
 const Header=()=> <View style={s.header}><View style={s.brandRow}>{logo}<View><Text style={s.brand}>Jett</Text><Text style={s.brandSmall}>distribution</Text></View></View><View style={s.net}><View style={[s.dot,{backgroundColor:online?C.green:C.red}]}/><Text style={s.netText}>{online?"ONLINE":"OFFLINE"}</Text></View></View>;
 const Button=({title,onPress,outline=false})=><TouchableOpacity onPress={onPress} style={[s.button,outline&&s.outline]}><Text style={[s.buttonText,outline&&s.outlineText]}>{title}</Text></TouchableOpacity>;
 const Nav=()=> <View style={s.nav}>{[["Home","⌂"],["Route","↝"],["Map","⌖"],["Saved","▤"],["Settings","⚙"]].map(([t,i])=><TouchableOpacity key={t} style={s.navItem} onPress={()=>{setTab(t);setScreen(t.toLowerCase());}}><Text style={[s.navIcon,tab===t&&s.active]}>{i}</Text><Text style={[s.navLabel,tab===t&&s.active]}>{t}</Text></TouchableOpacity>)}</View>;
 const home=()=> <ScrollView contentContainerStyle={s.content}><Header/><View style={s.hero}><View style={s.logoMark}><Text style={s.logoGlyph}>↻</Text><Text style={s.uk}>UK</Text></View><Text style={s.heroTitle}>Route Planner</Text><Text style={s.pill}>VERSION 3.2</Text><Text style={s.sub}>Delivering, reusing & recycling{"\n"}for Local Authorities</Text></View><Button title="⌕   Find a House / Address" onPress={()=>{setScreen("search");setTab("Home");}}/><Button title="▤   Import Excel / CSV Delivery List" onPress={importDeliveryFile} outline/><View style={s.two}><TouchableOpacity style={s.tile} onPress={()=>{setScreen("route");setTab("Route");}}><Text style={s.tileIcon}>↝</Text><Text style={s.tileTitle}>Plan a Route</Text><Text style={s.small}>Manage delivery stops</Text></TouchableOpacity><TouchableOpacity style={s.tile} onPress={()=>{setScreen("saved");setTab("Saved");}}><Text style={s.tileIcon}>▤</Text><Text style={s.tileTitle}>Saved Routes</Text><Text style={s.small}>{saved.length} saved on phone</Text></TouchableOpacity></View><View style={s.card}><Text style={s.cardTitle}>YOUR DELIVERY TOOLS</Text>{["House name & full address finder","Automatic stop ordering","Delivery status tracking","Offline cached locations"].map(x=><Text key={x} style={s.feature}>✓  {x}</Text>)}</View>{!online&&<View style={s.notice}><Text style={s.greenText}>✓ Working offline</Text><Text style={s.small}>Saved routes and previously found addresses remain available.</Text></View>}</ScrollView>;
 const searchScreen=()=> <ScrollView contentContainerStyle={s.content}><Header/><Text style={s.title}>House Name Finder</Text><Text style={s.small}>Search by house name, number, street, town or postcode.</Text><View style={s.search}><Text style={s.searchGlyph}>⌕</Text><TextInput style={s.searchInput} placeholder="e.g. Rose Cottage, High Street..." placeholderTextColor="#78939b" value={query} onChangeText={setQuery} onSubmitEditing={search}/><TouchableOpacity onPress={search}><Text style={s.searchGo}>GO</Text></TouchableOpacity></View><View style={s.chips}>{["HOUSE NAMES","ADDRESSES","STREETS","POSTCODES"].map(x=><View key={x} style={s.chip}><Text style={s.chipText}>{x}</Text></View>)}</View><Text style={s.small}>Examples: Rose Cottage · 25 High Street · NR30 1JJ</Text>{busy&&<Text style={s.small}>Searching addresses…</Text>}{results.map((x,i)=><TouchableOpacity key={i} style={s.result} onPress={()=>choose(x)}><View style={s.houseIcon}><Text style={{color:C.green,fontSize:22}}>⌂</Text></View><View style={{flex:1}}><Text style={s.resultTitle}>{x.address?.house_name||x.address?.house_number||"Address result"}</Text><Text style={s.small}>{x.display_name}</Text>{x.matchNote&&<Text style={s.small}>{x.matchNote}</Text>}{x.cached&&<Text style={s.greenText}>Cached for offline use</Text>}</View><Text style={s.arrow}>›</Text></TouchableOpacity>)}</ScrollView>;
 const details=()=> <ScrollView contentContainerStyle={s.content}><Header/><Text style={s.title}>Address Details</Text><View style={s.card}><Text style={s.bigHouse}>⌂</Text><Text style={s.cardTitle}>{label||chosen?.display_name}</Text><Text style={s.small}>{chosen?.display_name}</Text><TextInput style={s.input} placeholder="House name / number + street" placeholderTextColor="#78939b" value={label} onChangeText={setLabel}/><TextInput style={s.input} placeholder="Town / city" placeholderTextColor="#78939b" value={town} onChangeText={setTown}/><TextInput style={s.input} placeholder="Postcode" placeholderTextColor="#78939b" value={pc} onChangeText={setPc}/><Button title="＋  Add to Route" onPress={add}/><Button title="Back to results" outline onPress={()=>setScreen("search")}/></View></ScrollView>;
 const route=()=> <ScrollView contentContainerStyle={s.content}><Header/><Text style={s.title}>Route Summary</Text><View style={s.stats}><View><Text style={s.stat}>{stops.length}</Text><Text style={s.small}>STOPS</Text></View><View><Text style={s.stat}>{miles.toFixed(1)}</Text><Text style={s.small}>MILES*</Text></View><View><Text style={s.stat}>{fmt(Math.round(miles/28*60))}</Text><Text style={s.small}>EST. DRIVE*</Text></View></View><Text style={s.foot}>*Approximate straight-line estimate from cached locations.</Text><Button title="↝  Optimise Stop Order" onPress={optimise}/><Button title="▤  Import Excel / CSV Delivery List" onPress={importDeliveryFile} outline/><View style={s.card}><Text style={s.cardTitle}>DELIVERY STOPS</Text>{stops.length===0&&<Text style={s.small}>No stops yet. Use House Name Finder to add an address.</Text>}{stops.map((x,i)=><View key={x.id} style={s.stop}><View style={s.number}><Text style={s.numberText}>{i+1}</Text></View><View style={{flex:1}}><Text style={s.resultTitle}>{x.name}</Text><Text style={s.small}>{x.town} {x.postcode}</Text><Text style={[s.small,{color:x.done?C.green:C.orange}]}>{x.done?"✓ Delivered":"● Pending"}</Text></View><TouchableOpacity onPress={()=>setStops(stops.map(y=>y.id===x.id?{...y,done:!y.done}:y))}><Text style={s.action}>{x.done?"UNDO":"DONE"}</Text></TouchableOpacity><TouchableOpacity onPress={()=>setStops(stops.filter(y=>y.id!==x.id))}><Text style={s.delete}>×</Text></TouchableOpacity></View>)}</View><TextInput style={s.input} value={routeName} onChangeText={setRouteName} placeholder="Route name" placeholderTextColor="#78939b"/><View style={s.two}><View style={{flex:1}}><Button title="▤  Save Route" onPress={saveRoute} outline/></View><View style={{flex:1}}><Button title="➤  Navigate" onPress={()=>{if(!stops.length)return;const x=stops[stops.length-1];openNavigation(x,stops);}}/></View></View></ScrollView>;
 const savedScreen=()=> <ScrollView contentContainerStyle={s.content}><Header/><Text style={s.title}>Saved Routes</Text>{saved.length===0?<View style={s.card}><Text style={s.small}>No saved routes yet. Save a route to keep it on your phone.</Text></View>:saved.map(r=><View key={r.id} style={s.card}><Text style={s.cardTitle}>{r.name}</Text><Text style={s.small}>{r.stops.length} stops · {Number(r.miles||0).toFixed(1)} miles</Text><Button title="Load Route" onPress={()=>{setStops(r.stops);setScreen("route");setTab("Route");}}/></View>)}</ScrollView>;
 const settingsScreen=()=> <ScrollView contentContainerStyle={s.content}><Header/><Text style={s.title}>Navigation Settings</Text><View style={s.card}><Text style={s.cardTitle}>Preferred map app</Text><Text style={s.small}>Choose which app to use when you start a route. You can also choose each time you navigate.</Text>{[["google","Google Maps"],["apple","Apple Maps"]].map(([v,t])=><TouchableOpacity key={v} style={s.preference} onPress={()=>setMapPreference(v)}><View style={[s.radio,{borderColor:mapChoice===v?C.green:C.muted}]}>{mapChoice===v&&<View style={s.radioInner}/>}</View><View style={{flex:1}}><Text style={s.resultTitle}>{t}</Text><Text style={s.small}>{v==="google"?"Works on Android and iPhone":"Available on Apple devices; on Android this may open in a browser or may not be supported"}</Text></View></TouchableOpacity>)}<Button title="Ask me every time" onPress={()=>setMapPreference("ask") } outline/><Text style={[s.small,{marginTop:10}]}>Note: Apple Maps is not normally installed on Android phones. On your Moto G17, Google Maps is the reliable option; Apple Maps links may open in a browser or may not work as expected.</Text></View></ScrollView>;
 const mapScreen=()=> <ScrollView contentContainerStyle={s.content}><Header/><Text style={s.title}>Route Map</Text><View style={s.mapPlaceholder}><Text style={s.mapPin}>⌖</Text><Text style={s.cardTitle}>{online?"Map preview":"Offline locations"}</Text><Text style={s.small}>{online?"Open the route in Google Maps for live map tiles and turn-by-turn directions.":"Map tiles need internet, but cached stop details remain available."}</Text><Button title="Open Google Maps" onPress={()=>{if(stops.length){const a=stops.map(x=>x.postcode||x.name).join("/");openNavigation(stops[stops.length-1],stops);}else Alert.alert("No stops","Add stops first.");}}/></View>{stops.map((x,i)=><Text key={x.id} style={s.feature}>{i+1}. {x.name} — {x.postcode||x.town}</Text>)}</ScrollView>;
 let body=screen==="home"?home():screen==="search"?searchScreen():screen==="details"?details():screen==="route"?route():screen==="saved"?savedScreen():screen==="settings"?settingsScreen():mapScreen();
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
 safe:{flex:1,backgroundColor:C.bg},content:{padding:16,paddingBottom:50},header:{height:55,flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginBottom:12},brandRow:{flexDirection:"row",alignItems:"center"},brand:{fontSize:22,color:C.text,fontWeight:"900",lineHeight:22},brandSmall:{fontSize:11,color:C.muted},net:{flexDirection:"row",alignItems:"center",gap:6},dot:{width:8,height:8,borderRadius:4},netText:{fontSize:10,color:C.muted,fontWeight:"900"},hero:{alignItems:"center",paddingVertical:18},logoMark:{width:94,height:94,borderRadius:47,borderWidth:6,borderColor:C.green,alignItems:"center",justifyContent:"center",backgroundColor:"#123a28"},logoGlyph:{color:C.green2,fontSize:57,lineHeight:61},uk:{color:C.text,fontSize:10,fontWeight:"900",position:"absolute",bottom:19},heroTitle:{fontSize:29,color:C.text,fontWeight:"900",marginTop:10},pill:{backgroundColor:C.green,paddingHorizontal:12,paddingVertical:5,borderRadius:15,color:"#062010",overflow:"hidden",fontSize:11,fontWeight:"900",marginTop:8},sub:{textAlign:"center",color:C.muted,lineHeight:19,marginTop:10},button:{backgroundColor:C.green,padding:15,borderRadius:13,alignItems:"center",justifyContent:"center",marginTop:10},buttonText:{color:"#062010",fontWeight:"900",fontSize:15},outline:{backgroundColor:"transparent",borderWidth:1,borderColor:C.green},outlineText:{color:C.green},two:{flexDirection:"row",gap:10,marginTop:10},tile:{flex:1,backgroundColor:C.panel,borderWidth:1,borderColor:C.line,borderRadius:14,padding:14},tileIcon:{fontSize:25,color:C.green},tileTitle:{color:C.text,fontWeight:"900",marginTop:4},small:{color:C.muted,fontSize:12,lineHeight:18},card:{backgroundColor:C.panel,borderWidth:1,borderColor:C.line,borderRadius:15,padding:15,marginTop:12},cardTitle:{color:C.text,fontSize:17,fontWeight:"900",marginBottom:8},feature:{color:C.text,paddingVertical:6,fontSize:13},notice:{backgroundColor:"#0b3025",padding:13,borderRadius:12,marginTop:12},greenText:{color:C.green,fontWeight:"900",fontSize:12},title:{color:C.text,fontSize:25,fontWeight:"900",marginBottom:8},search:{flexDirection:"row",alignItems:"center",borderColor:C.green,borderWidth:1,borderRadius:13,backgroundColor:C.panel,paddingHorizontal:12,marginVertical:12},searchGlyph:{fontSize:24,color:C.green},searchInput:{flex:1,color:C.text,padding:12},searchGo:{color:C.green,fontWeight:"900",padding:8},chips:{flexDirection:"row",flexWrap:"wrap",gap:6,marginBottom:10},chip:{borderRadius:20,borderWidth:1,borderColor:C.line,paddingHorizontal:9,paddingVertical:6},chipText:{color:C.muted,fontSize:9,fontWeight:"900"},result:{flexDirection:"row",alignItems:"center",gap:10,padding:12,backgroundColor:C.panel,borderWidth:1,borderColor:C.line,borderRadius:13,marginTop:8},houseIcon:{width:38,height:38,borderRadius:19,backgroundColor:"#123a28",alignItems:"center",justifyContent:"center"},resultTitle:{color:C.text,fontWeight:"900",fontSize:14},arrow:{fontSize:25,color:C.green},bigHouse:{fontSize:43,color:C.green,textAlign:"center"},input:{backgroundColor:C.bg,borderColor:C.line,borderWidth:1,borderRadius:10,padding:12,color:C.text,marginTop:9},stats:{flexDirection:"row",justifyContent:"space-around",backgroundColor:C.panel,borderRadius:14,padding:15,marginVertical:10},stat:{color:C.text,fontSize:23,fontWeight:"900",textAlign:"center"},foot:{color:C.muted,fontSize:10},stop:{flexDirection:"row",alignItems:"center",gap:9,paddingVertical:11,borderBottomWidth:1,borderBottomColor:C.line},number:{width:30,height:30,borderRadius:15,backgroundColor:C.green,alignItems:"center",justifyContent:"center"},numberText:{color:"#062010",fontWeight:"900"},action:{color:C.green,fontWeight:"900",fontSize:10},delete:{color:C.red,fontSize:23,paddingHorizontal:5},preference:{flexDirection:"row",alignItems:"center",gap:12,paddingVertical:13,borderBottomWidth:1,borderBottomColor:C.line},radio:{width:22,height:22,borderRadius:11,borderWidth:2,alignItems:"center",justifyContent:"center"},radioInner:{width:10,height:10,borderRadius:5,backgroundColor:C.green},mapPlaceholder:{backgroundColor:C.panel,borderColor:C.line,borderWidth:1,borderRadius:15,padding:24,alignItems:"center",marginVertical:12},mapPin:{color:C.green,fontSize:52},nav:{height:65,flexDirection:"row",backgroundColor:"#041019",borderTopWidth:1,borderTopColor:C.line},navItem:{flex:1,alignItems:"center",justifyContent:"center"},navIcon:{fontSize:22,color:C.muted},navLabel:{fontSize:10,color:C.muted,marginTop:3,fontWeight:"800"},active:{color:C.green}
});
