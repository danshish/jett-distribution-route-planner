import React, { useEffect, useMemo, useState, useRef } from "react";
import { Alert, Animated, FlatList, Image, Linking, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase, isSupabaseConfigured } from "./lib/supabase";
import NetInfo from "@react-native-community/netinfo";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as XLSX from "xlsx";
import * as Location from "expo-location";
import * as Sharing from "expo-sharing";
import * as ImagePicker from "expo-image-picker";
import Svg, { Path } from "react-native-svg";
import { Map as MapLibreMap, Camera as MapCamera, GeoJSONSource, Layer } from "@maplibre/maplibre-react-native";

const logo = <Image source={require("./app-icon.png")} style={{width:42,height:42,borderRadius:21,marginRight:8}} />;
const C={bg:"#06151d",panel:"#0b2631",panel2:"#103540",green:"#27c653",green2:"#7ad64f",text:"#f4fbf6",muted:"#9bb2b9",line:"#1a414a",blue:"#38a4ff",orange:"#ffad42",red:"#ff5367"};
const CACHE="@jett_cache_v32", ROUTES="@jett_saved_v32", CURRENT="@jett_current_v32";
const clean=x=>x.trim().toUpperCase().replace(/\s+/g," ");
const valid=x=>/^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i.test(x.trim());
const distance=(a,b)=>{const r=n=>n*Math.PI/180, d1=r(b.lat-a.lat),d2=r(b.lon-a.lon),q=Math.sin(d1/2)**2+Math.cos(r(a.lat))*Math.cos(r(b.lat))*Math.sin(d2/2)**2;return 3958.8*2*Math.asin(Math.sqrt(q));};
const fmt=m=>!m?"—":`${Math.floor(m/60)?Math.floor(m/60)+"h ":""}${m%60}m`;
const bearingBetween=(lat1,lon1,lat2,lon2)=>{const r=n=>n*Math.PI/180,dLon=r(lon2-lon1),y=Math.sin(dLon)*Math.cos(r(lat2)),x=Math.cos(r(lat1))*Math.sin(r(lat2))-Math.sin(r(lat1))*Math.cos(r(lat2))*Math.cos(dLon);return (Math.atan2(y,x)*180/Math.PI+360)%360;};
const compassLabel=degrees=>["N","NE","E","SE","S","SW","W","NW"][Math.round((degrees%360)/45)%8];
export default function App(){
 const [online,setOnline]=useState(true),[screen,setScreen]=useState("home"),[tab,setTab]=useState("Home");
 const [authSession,setAuthSession]=useState(null),[authLoading,setAuthLoading]=useState(true);
 const [authMode,setAuthMode]=useState("signin"),[authEmail,setAuthEmail]=useState(""),[authPassword,setAuthPassword]=useState(""),[authConfirmPassword,setAuthConfirmPassword]=useState(""),[authName,setAuthName]=useState(""),[authBusy,setAuthBusy]=useState(false);
 const [showAuthPassword,setShowAuthPassword]=useState(false),[showConfirmPassword,setShowConfirmPassword]=useState(false),[showRecoveryPassword,setShowRecoveryPassword]=useState(false);
 const [profileName,setProfileName]=useState(""),[currentPassword,setCurrentPassword]=useState(""),[settingsNewPassword,setSettingsNewPassword]=useState(""),[settingsConfirmPassword,setSettingsConfirmPassword]=useState("");
 const [authRecovery,setAuthRecovery]=useState(false),[authNewPassword,setAuthNewPassword]=useState("");
 const [stops,setStops]=useState([]),[cache,setCache]=useState({}),[saved,setSaved]=useState([]);
 const [stockLoaded,setStockLoaded]=useState({wheelieBins:0,foodCaddies:0});
 const [drivers,setDrivers]=useState([]);
 const [activeDriverId,setActiveDriverId]=useState("");
 const [driverForm,setDriverForm]=useState({name:"",employeeId:"",phone:"",vehicle:"",shift:""});
 const [editingDriverId,setEditingDriverId]=useState(null);
 const [vehicleChecklistDraft,setVehicleChecklistDraft]=useState({});
 const [vehicleStartMiles,setVehicleStartMiles]=useState("");
 const [vehicleEndMiles,setVehicleEndMiles]=useState("");
 const [fuelStart,setFuelStart]=useState("");
 const [fuelEnd,setFuelEnd]=useState("");
 const [vehicleLogNotes,setVehicleLogNotes]=useState("");
 const [defectType,setDefectType]=useState("Vehicle fault");
 const [defectSeverity,setDefectSeverity]=useState("Needs attention");
 const [defectDescription,setDefectDescription]=useState("");
 const [defectLocation,setDefectLocation]=useState("");
 const [defectPhotoUri,setDefectPhotoUri]=useState(null);
 const [driverName,setDriverName]=useState("");
 const [signaturePath,setSignaturePath]=useState("");
 const [signatureWidth,setSignatureWidth]=useState(1);
 const [wheelieQty,setWheelieQty]=useState("0"),[caddyQty,setCaddyQty]=useState("0");
 const [query,setQuery]=useState(""),[results,setResults]=useState([]),[busy,setBusy]=useState(false),[chosen,setChosen]=useState(null);
 const [label,setLabel]=useState(""),[town,setTown]=useState(""),[pc,setPc]=useState(""),[routeName,setRouteName]=useState("Jett Pal Delivery Route");
 const [mapChoice,setMapChoice]=useState("google");
 const [offlineMapPath,setOfflineMapPath]=useState(null),[mapImportBusy,setMapImportBusy]=useState(false);
 const [valhallaArchivePath,setValhallaArchivePath]=useState(null),[valhallaImportBusy,setValhallaImportBusy]=useState(false),[valhallaArchiveStatus,setValhallaArchiveStatus]=useState("Not installed");
 const [mapLoadStatus,setMapLoadStatus]=useState("Waiting for map to load…");
 const [mapCameraReady,setMapCameraReady]=useState(false);
 const [offlineNavActive,setOfflineNavActive]=useState(false),[driverPosition,setDriverPosition]=useState(null),[gpsAccuracy,setGpsAccuracy]=useState(null),[gpsSpeed,setGpsSpeed]=useState(null),[gpsHeading,setGpsHeading]=useState(null);
 const mapCameraRef=useRef(null);
 const lastRerouteAt=useRef(0),reroutingRef=useRef(false);
 const [offlineMapExpanded,setOfflineMapExpanded]=useState(false),[mapViewMode,setMapViewMode]=useState("2d");
 const [navZoom,setNavZoom]=useState(19.2); const [mapZoomDelta,setMapZoomDelta]=useState(0);
 const [mapDownloadBusy,setMapDownloadBusy]=useState(false),[mapDownloadProgress,setMapDownloadProgress]=useState(0);
 const [roadMetrics,setRoadMetrics]=useState(null);
 const [routeGeoJSON,setRouteGeoJSON]=useState(null),[routeGeometryStatus,setRouteGeometryStatus]=useState("Route not calculated");
 const [routeSteps,setRouteSteps]=useState([]),[snappedDriverPosition,setSnappedDriverPosition]=useState(null);
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
 useEffect(()=>{(async()=>{try{const path=await AsyncStorage.getItem("@jett_valhalla_archive_path");if(path){const info=await FileSystem.getInfoAsync(path);if(info.exists){setValhallaArchivePath(path);setValhallaArchiveStatus((Number(info.size||0)/1e9).toFixed(2)+" GB · file found");}else{setValhallaArchiveStatus("Archive not found on this phone");}}}catch{setValhallaArchiveStatus("Could not check archive");}})();},[]);
 useEffect(()=>{
  const handleAuthUrl=async({url})=>{
   if(!url||!supabase)return;
   try{
    const query=url.includes("?")?url.split("?")[1].split("#")[0]:"";
    const fragment=url.includes("#")?url.split("#")[1]:"";
    const values={};
    [query,fragment].filter(Boolean).forEach(section=>{
     section.split("&").forEach(part=>{
      const bits=part.split("=");
      if(bits.length>1)values[decodeURIComponent(bits[0])]=decodeURIComponent(bits.slice(1).join("="));
     });
    });
    if(values.code){
     const {error}=await supabase.auth.exchangeCodeForSession(values.code);
     if(error)throw error;
     if(url.includes("/reset-password")||values.type==="recovery")setAuthRecovery(true);
     return;
    }
    if(values.access_token&&values.refresh_token){
     const {error}=await supabase.auth.setSession({access_token:values.access_token,refresh_token:values.refresh_token});
     if(error)throw error;
     if(url.includes("/reset-password")||values.type==="recovery")setAuthRecovery(true);
    }
   }catch(error){console.warn("Auth callback:",error.message);Alert.alert("Link could not be opened","This password reset link may have expired. Request a new one and try again.");}
  };
  Linking.getInitialURL().then(url=>{if(url)handleAuthUrl({url});});
  const subscription=Linking.addEventListener("url",handleAuthUrl);
  return ()=>subscription.remove();
 },[]);
 useEffect(()=>{
  if(!isSupabaseConfigured){setAuthLoading(false);return;}
  let mounted=true;
  supabase.auth.getSession().then(({data,error})=>{
    if(mounted){if(error)console.warn("Supabase session check:",error.message);setAuthSession(data?.session||null);setAuthLoading(false);}
  }).catch(error=>{if(mounted){console.warn("Supabase session check:",error.message);setAuthLoading(false);}});
  const {data:{subscription}}=supabase.auth.onAuthStateChange((event,session)=>{
    if(mounted){setAuthSession(session||null);if(event==="PASSWORD_RECOVERY")setAuthRecovery(true);}
  });
  return ()=>{mounted=false;subscription.unsubscribe();};
 },[]);
 async function submitAuth(){
  if(!isSupabaseConfigured||!supabase)return Alert.alert("Connection not configured","The Supabase project URL and publishable key are missing from this build.");
  const email=authEmail.trim().toLowerCase();
  if(!email||!authPassword)return Alert.alert("Complete the form","Enter your email address and password.");
  if(authPassword.length<8)return Alert.alert("Password too short","Use at least 8 characters.");
  if(authMode==="signup"&&authPassword!==authConfirmPassword)return Alert.alert("Passwords do not match","Enter the same password in both fields.");
  if(authMode==="signup"&&!authName.trim())return Alert.alert("Enter your name","Please enter your full name.");
  setAuthBusy(true);
  try{
   if(authMode==="signup"){
    const {data,error}=await supabase.auth.signUp({email,password:authPassword,options:{data:{full_name:authName.trim()},emailRedirectTo:"jettpal://auth/callback"}});
    if(error)throw error;
    if(data.session){setAuthSession(data.session);Alert.alert("Account created","Your Jett Pal account is ready. Your company workspace will be set up next.");}
    else Alert.alert("Check your email","Supabase has sent a confirmation link. Confirm your email, then return here and sign in.");
   }else{
    const {data,error}=await supabase.auth.signInWithPassword({email,password:authPassword});
    if(error)throw error;
    setAuthSession(data.session||null);
   }
  }catch(error){Alert.alert(authMode==="signup"?"Sign-up failed":"Sign-in failed",error.message||"Please try again.");}
  finally{setAuthBusy(false);}
 }
 async function requestPasswordReset(){
  if(!supabase)return Alert.alert("Connection not configured","Supabase is not configured in this build.");
  const email=authEmail.trim().toLowerCase();
  if(!email)return Alert.alert("Enter your email","Enter the email address for your Jett Pal account first.");
  setAuthBusy(true);
  try{
   const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:"jettpal://auth/reset-password"});
   if(error)throw error;
   Alert.alert("Reset email sent","Check your inbox and junk folder. Open the reset link on this phone to return to Jett Pal.");
  }catch(error){Alert.alert("Could not send reset email",error.message||"Please try again.");}
  finally{setAuthBusy(false);}
 }
 async function saveNewPassword(){
  if(!supabase)return;
  if(authNewPassword.length<8)return Alert.alert("Password too short","Use at least 8 characters.");
  setAuthBusy(true);
  try{
   const {error}=await supabase.auth.updateUser({password:authNewPassword});
   if(error)throw error;
   setAuthRecovery(false);setAuthNewPassword("");setAuthPassword("");
   Alert.alert("Password updated","Your password has been changed. You can now continue in Jett Pal.");
  }catch(error){Alert.alert("Could not update password",error.message||"Please try the reset link again.");}
  finally{setAuthBusy(false);}
 }
 async function signOut(){
  if(!supabase)return;
  const {error}=await supabase.auth.signOut();
  if(error)Alert.alert("Sign-out failed",error.message);
 }
 async function saveProfile(){
  if(!supabase||!authSession)return;
  const name=profileName.trim();
  if(!name)return Alert.alert("Enter your name","Please enter your full name.");
  setAuthBusy(true);
  try{
   const {data,error}=await supabase.auth.updateUser({data:{full_name:name}});
   if(error)throw error;
   setAuthSession(data.user?{...authSession,user:data.user}:authSession);
   Alert.alert("Profile updated","Your name has been saved.");
  }catch(error){Alert.alert("Could not update profile",error.message||"Please try again.");}
  finally{setAuthBusy(false);}
 }
 async function changeAccountPassword(){
  if(!supabase||!authSession?.user?.email)return;
  if(!currentPassword||!settingsNewPassword||!settingsConfirmPassword)return Alert.alert("Complete the form","Enter your current password and your new password twice.");
  if(settingsNewPassword.length<8)return Alert.alert("Password too short","Use at least 8 characters.");
  if(settingsNewPassword!==settingsConfirmPassword)return Alert.alert("Passwords do not match","The new passwords must match.");
  setAuthBusy(true);
  try{
   const {error:verifyError}=await supabase.auth.signInWithPassword({email:authSession.user.email,password:currentPassword});
   if(verifyError)throw new Error("Your current password was not accepted. Check it and try again.");
   const {error}=await supabase.auth.updateUser({password:settingsNewPassword});
   if(error)throw error;
   setCurrentPassword("");setSettingsNewPassword("");setSettingsConfirmPassword("");
   Alert.alert("Password changed","Your Jett Pal password has been updated.");
  }catch(error){Alert.alert("Could not change password",error.message||"Please try again.");}
  finally{setAuthBusy(false);}
 }
 useEffect(()=>{AsyncStorage.getItem("@jett_uk_pmtiles_path").then(p=>{if(p)setOfflineMapPath(p);}).catch(()=>{});},[]);
 useEffect(()=>{(async()=>{try{const raw=await AsyncStorage.getItem("@jett_drivers");if(raw){const data=JSON.parse(raw);setDrivers(data.drivers||[]);setActiveDriverId(data.activeDriverId||"");}}catch{}})();},[]);
 useEffect(()=>{AsyncStorage.setItem("@jett_drivers",JSON.stringify({drivers,activeDriverId})).catch(()=>{});},[drivers,activeDriverId]);
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
function add(){if(!chosen)return;setStops([...stops,{id:Date.now().toString(),key:chosen.key,name:label.trim()||chosen.display_name,address:label.trim(),town:town.trim(),postcode:clean(pc),lat:Number.isFinite(Number(chosen.lat))?Number(chosen.lat):null,lon:Number.isFinite(Number(chosen.lon))?Number(chosen.lon):null,wheelieBins:Math.max(0,parseInt(wheelieQty,10)||0),foodCaddies:Math.max(0,parseInt(caddyQty,10)||0),done:false,deliveryOutcome:"Pending",deliveredWheelieBins:0,deliveredFoodCaddies:0,deliveryNotes:""}]);setWheelieQty("0");setCaddyQty("0");setChosen(null);setScreen("route");setTab("Route");}
 function openCompletion(stop){setSelectedDeliveryId(stop.id);setDeliveryOutcome(stop.deliveryOutcome&&stop.deliveryOutcome!=="Pending"?stop.deliveryOutcome:"Delivered");setActualWheelieQty(String(stop.deliveredWheelieBins??stop.wheelieBins??0));setActualCaddyQty(String(stop.deliveredFoodCaddies??stop.foodCaddies??0));setDeliveryNotes(stop.deliveryNotes||"");setScreen("completion");setTab("Home");}
 function saveCompletion(){const bins=Math.max(0,parseInt(actualWheelieQty,10)||0),caddies=Math.max(0,parseInt(actualCaddyQty,10)||0);const selected=stops.find(x=>x.id===selectedDeliveryId);if(!selected)return Alert.alert("Delivery not found","Please return to the delivery list and try again.");if(bins>Number(selected.wheelieBins||0)||caddies>Number(selected.foodCaddies||0))return Alert.alert("Check quantities","The delivered quantity cannot be greater than the quantity required for this property.");const successful=deliveryOutcome==="Delivered"||deliveryOutcome==="Partially delivered";setStops(current=>current.map(x=>x.id===selectedDeliveryId?{...x,done:successful,deliveryOutcome,deliveredWheelieBins:successful?bins:0,deliveredFoodCaddies:successful?caddies:0,deliveryNotes:deliveryNotes.trim(),completedAt:successful?new Date().toISOString():null}:x));setScreen("deliveries");setTab("Home");Alert.alert("Delivery report saved","The property outcome and actual delivered quantities have been recorded.");}

function parseDeliveryRows(rows,sourceName){
  if(!Array.isArray(rows)||!rows.length)throw new Error("The selected "+sourceName+" is empty.");
  const norm=v=>String(v||"").toLowerCase().trim().replace(/[^a-z0-9]+/g," ").replace(/\s+/g," ");
  const aliases={
    address:["address","full address","delivery address","property address","house address","street address","address line 1","address line 1 delivery","address1","location","delivery location","property","destination","delivery point","site address","service address"],
    house:["house number","house no","house name","building number","building name","house"],
    street:["street","street name","road","thoroughfare"],
    town:["town","city","post town","locality","district"],
    postcode:["postcode","post code","postal code","zip","zip code"],
    wheelieBins:["wheelie bins","wheelie bin","bin quantity","bin qty","bins","black bins","refuse bins"],
    foodCaddies:["food caddies","food caddy","food waste caddies","caddies","caddy quantity","caddy qty"]
  };
  const headers=rows[0].map(norm);
  const headerAliases=Object.values(aliases).flat();
  const hasHeader=headers.some(h=>headerAliases.includes(h)||/address|delivery|property|destination|location/.test(h));
  const headerRow=hasHeader?headers:[];
  const findIndex=key=>headerRow.findIndex(h=>aliases[key].includes(h));
  let addressIndex=findIndex("address");
  if(addressIndex<0&&hasHeader){
    addressIndex=headerRow.findIndex(h=>/address|delivery location|property|destination|location/.test(h));
  }
  const data=rows.slice(hasHeader?1:0);
  // If the heading is unfamiliar, identify the most address-like data column
  // by checking its values for UK postcodes and house/street patterns.
  if(addressIndex<0&&data.length){
    const postcodePattern=/\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/i;
    const streetPattern=/\b(road|rd|street|st|avenue|ave|close|cl|drive|dr|lane|ln|way|crescent|gardens|place|pl|court|ct|terrace|walk|rise|row)\b/i;
    let best={index:-1,score:0};
    const width=Math.max(...data.map(row=>row.length),0);
    for(let col=0;col<width;col++){
      let score=0,nonEmpty=0;
      for(const row of data.slice(0,100)){
        const value=String(row[col]??"").trim();if(!value)continue;nonEmpty++;
        if(postcodePattern.test(value))score+=3;
        if(streetPattern.test(value))score+=2;
        if(/^\d+[A-Z]?(\s|,)/i.test(value))score+=1;
        if(value.includes(","))score+=1;
      }
      if(nonEmpty)score=score/nonEmpty;
      if(score>best.score)best={index:col,score};
    }
    if(best.score>=1.5)addressIndex=best.index;
  }
  if(addressIndex<0)throw new Error("Jett could not identify the address column. Please add a column heading such as Address, Delivery Address or Property Address.");
  const indexes=hasHeader?{
    house:findIndex("house"),street:findIndex("street"),town:findIndex("town"),postcode:findIndex("postcode"),wheelieBins:findIndex("wheelieBins"),foodCaddies:findIndex("foodCaddies")
  }:{house:-1,street:-1,town:-1,postcode:-1,wheelieBins:-1,foodCaddies:-1};
  const imported=data.map((row,i)=>{
    const cell=n=>indexes[n]>=0?String(row[indexes[n]]??"").trim():"";
    const address=String(row[addressIndex]??"").trim()||[cell("house"),cell("street")].filter(Boolean).join(" ");
    if(!address)return null;
    const id=sourceName.toLowerCase().includes("google")?"sheets_":"import_";
    return {id:id+Date.now()+"_"+i,key:id+Date.now()+"_"+i,name:address,address,town:cell("town"),postcode:cell("postcode").toUpperCase(),wheelieBins:Math.max(0,parseInt(cell("wheelieBins"),10)||0),foodCaddies:Math.max(0,parseInt(cell("foodCaddies"),10)||0),done:false};
  }).filter(Boolean);
  if(!imported.length)throw new Error("No addresses were found in the detected address column. Check the selected sheet and try again.");
  return {stops:imported,columnName:hasHeader?(rows[0][addressIndex]||"Address column "+(addressIndex+1)):"Column "+(addressIndex+1)};
}

async function importDeliveryFile(){
  setBusy(true);
  try{
    const picked=await DocumentPicker.getDocumentAsync({type:"*/*",copyToCacheDirectory:true,multiple:false});
    if(picked.canceled||!picked.assets?.length)return;
    const file=picked.assets[0];
    if(!file?.uri)throw new Error("Android did not provide a readable file location.");
    const fileName=String(file.name||"delivery-list").toLowerCase();
    if(!/\.(xlsx|xls|csv)$/i.test(fileName))throw new Error("Please choose an Excel .xlsx/.xls file or a .csv file. The selected file was: "+(file.name||"unknown"));
    const base64=await FileSystem.readAsStringAsync(file.uri,{encoding:"base64"});
    if(!base64)throw new Error("The selected file appears to be empty or Android could not read it.");
    const workbook=XLSX.read(base64,{type:"base64"});
    const firstSheet=workbook.Sheets[workbook.SheetNames[0]];
    if(!firstSheet)throw new Error("The selected file has no worksheet.");
    const rows=XLSX.utils.sheet_to_json(firstSheet,{header:1,defval:"",raw:false});
    const parsed=parseDeliveryRows(rows,file.name||"CSV / Excel file");
    setStops(current=>[...current,...parsed.stops]);
    setScreen("route");setTab("Route");
    Alert.alert("Delivery list imported",parsed.stops.length+" stops added. Address column detected: "+parsed.columnName+". Please check the addresses before navigating.");
  }catch(error){Alert.alert("Import failed",error?.message||"Jett could not read that file. Please try an Excel .xlsx or CSV .csv file.");}
  finally{setBusy(false);}
}

async function importGoogleSheet(){
  const link=googleSheetUrl.trim();
  if(!link)return Alert.alert("Paste a Google Sheets link","Copy the sharing link from Google Sheets and paste it here.");
  const match=link.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if(!match)return Alert.alert("Invalid Google Sheets link","Paste a link copied from a Google Sheets spreadsheet.");
  const sheetId=match[1],gidMatch=link.match(/[?&#]gid=(\d+)/),gid=gidMatch?gidMatch[1]:"0";
  try{
    setBusy(true);
    const response=await fetch("https://docs.google.com/spreadsheets/d/"+sheetId+"/export?format=csv&gid="+gid);
    const csv=await response.text();
    if(!response.ok||!csv||csv.trim().startsWith("<!DOCTYPE")||csv.includes("accounts.google.com/ServiceLogin"))throw new Error("Google could not provide this sheet. In Google Sheets, set Share → General access → Anyone with the link → Viewer, then copy the link again.");
    const workbook=XLSX.read(csv,{type:"string"});
    const sheet=workbook.Sheets[workbook.SheetNames[0]];
    const rows=XLSX.utils.sheet_to_json(sheet,{header:1,defval:"",raw:false});
    const parsed=parseDeliveryRows(rows,"Google Sheets");
    setStops(current=>[...current,...parsed.stops]);
    setScreen("route");setTab("Route");
    Alert.alert("Google Sheet imported",parsed.stops.length+" delivery stops added. Address column detected: "+parsed.columnName+". Please check the addresses before navigating.");
  }catch(error){Alert.alert("Google Sheets import failed",error.message||"Could not read this Google Sheet.");}
  finally{setBusy(false);}
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
 
async function locateRouteStops(){
  const pending=stops.filter(x=>x.lat==null||x.lon==null);
  if(!pending.length)return Alert.alert("All stops located","Every delivery stop already has map coordinates.");
  if(!online)return Alert.alert("Internet needed","Connect to the internet once to locate these addresses. Saved coordinates will then work with your offline map.");
  setBusy(true);let located=0;const failures=[];let updated=[...stops];
  try{
   for(const stop of pending){
    const q=[stop.address||stop.name,stop.town,stop.postcode].filter(Boolean).join(", ");
    try{
     const sr=await fetch("https://jett-address-api.mrmagixtoyou.workers.dev/search?q="+encodeURIComponent(q));const sd=await sr.json();const match=(sd.results||[]).find(x=>x.udprn);if(!sr.ok||!sd.success||!match)throw new Error(sd.error||"No matching UK address found");
     const rr=await fetch("https://jett-address-api.mrmagixtoyou.workers.dev/resolve?udprn="+encodeURIComponent(String(match.udprn)));const rd=await rr.json();const a=rd.results?.[0];const lat=Number(a?.latitude),lon=Number(a?.longitude);if(!rr.ok||!rd.success||!Number.isFinite(lat)||!Number.isFinite(lon))throw new Error(rd.error||"Address found, but coordinates were unavailable");
     updated=updated.map(x=>x.id===stop.id?{...x,lat,lon}:x);located++;
    }catch(error){failures.push({address:q||stop.name||"Unnamed stop",reason:error?.message||"Address lookup failed"});}
   }
   setStops(updated);await AsyncStorage.setItem(CURRENT,JSON.stringify(updated));
   const failureText=failures.length?"\n\nCould not locate:\n"+failures.map((x,i)=>(i+1)+". "+x.address+" — "+x.reason).join("\n"):"";
   Alert.alert("Address locating finished",located+" stops placed on the map"+(failures.length?", "+failures.length+" could not be matched.":".")+failureText);
  }finally{setBusy(false);}
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
      ...(offlineMapPath?[{text:"Jett Offline Map",onPress:()=>{setMapPreference("offline");setScreen("map");setTab("Map");}}]:[]),
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
  const unsuccessful=stops.filter(x=>x.deliveryOutcome&&x.deliveryOutcome!=="Pending"&&!x.done).length;
  const remaining=Math.max(0,stops.length-visited);
  const successRate=stops.length?Math.round(completed/stops.length*100):0;
  const routeMiles=currentRoadMetrics?currentRoadMetrics.miles:miles;
  const bins=stops.reduce((n,x)=>n+Number(x.done?(x.deliveredWheelieBins??x.wheelieBins??0):0),0);
  const caddies=stops.reduce((n,x)=>n+Number(x.done?(x.deliveredFoodCaddies??x.foodCaddies??0):0),0);
  return <ScrollView contentContainerStyle={s.content}>
   <Header/>
   <View style={s.proHero}>
    <View style={s.proHeroCopy}>
     <Text style={s.proEyebrow}>JETT DISTRIBUTION</Text>
     <Text style={s.proHeroTitle}>Jett Pal Pro</Text>
     <Text style={s.proHeroSubtitle}>Delivery & Operations Manager</Text>
     <View style={s.proOnline}><View style={[s.dot,{backgroundColor:online?C.green:C.red}]}/><Text style={s.proOnlineText}>{online?"ONLINE":"OFFLINE MODE"}</Text></View>
    </View>
    <Image source={require("./jett-van.jpg")} style={s.proHeroVan} resizeMode="cover"/>
   </View>
   <View style={s.proStats}>
    <View style={s.proStatCard}><Text style={s.proStatIcon}>✓</Text><Text style={s.proStatValue}>{completed}</Text><Text style={s.proStatLabel}>Completed</Text></View>
    <View style={s.proStatCard}><Text style={[s.proStatIcon,{color:C.orange}]}>◷</Text><Text style={s.proStatValue}>{remaining}</Text><Text style={s.proStatLabel}>Remaining</Text></View>
    <View style={s.proStatCard}><Text style={[s.proStatIcon,{color:C.blue}]}>⌂</Text><Text style={s.proStatValue}>{stops.length}</Text><Text style={s.proStatLabel}>Total Stops</Text></View>
    <View style={s.proStatCard}><Text style={[s.proStatIcon,{color:C.blue}]}>⌖</Text><Text style={s.proStatValue}>{routeMiles.toFixed(1)}</Text><Text style={s.proStatLabel}>Route Miles</Text></View>
    <View style={[s.proStatCard,s.proRateCard]}><Text style={s.proRateValue}>{successRate}%</Text><Text style={s.proStatLabel}>Success Rate</Text></View>
   </View>
   <View style={s.proTileGrid}>
    <TouchableOpacity style={[s.proTile,s.proTileFeatured]} onPress={()=>{setScreen("deliveries");setTab("Deliveries");}}><Text style={s.proTileIcon}>▣</Text><Text style={s.proTileTitle}>Delivery Manager</Text><Text style={s.proTileSub}>Properties & job status</Text></TouchableOpacity>
    <TouchableOpacity style={s.proTile} onPress={()=>{setScreen("route");setTab("Route");}}><Text style={s.proTileIcon}>↝</Text><Text style={s.proTileTitle}>Route Planner</Text><Text style={s.proTileSub}>Plan and optimise stops</Text></TouchableOpacity>
    <TouchableOpacity style={s.proTile} onPress={()=>{setScreen("stock");setTab("Home");}}><Text style={s.proTileIcon}>▤</Text><Text style={s.proTileTitle}>Stock Control</Text><Text style={s.proTileSub}>Load & track stock</Text></TouchableOpacity>
    <TouchableOpacity style={s.proTile} onPress={()=>{setScreen("performance");setTab("Reports");}}><Text style={s.proTileIcon}>▥</Text><Text style={s.proTileTitle}>Reports & Performance</Text><Text style={s.proTileSub}>Daily delivery totals</Text></TouchableOpacity>
    <TouchableOpacity style={s.proTile} onPress={()=>{setScreen("drivers");setTab("Home");}}><Text style={s.proTileIcon}>♙</Text><Text style={s.proTileTitle}>Driver Management</Text><Text style={s.proTileSub}>{drivers.length} driver profiles</Text></TouchableOpacity>
    <TouchableOpacity style={s.proTile} onPress={()=>{setScreen("search");setTab("Home");}}><Text style={s.proTileIcon}>⌕</Text><Text style={s.proTileTitle}>House Finder</Text><Text style={s.proTileSub}>Find UK addresses</Text></TouchableOpacity>
    <TouchableOpacity style={s.proTile} onPress={importDeliveryFile}><Text style={s.proTileIcon}>▧</Text><Text style={s.proTileTitle}>Import Delivery List</Text><Text style={s.proTileSub}>Excel / CSV spreadsheet</Text></TouchableOpacity>
    <TouchableOpacity style={s.proTile} onPress={()=>{setScreen("map");setTab("Map");}}><Text style={s.proTileIcon}>⌖</Text><Text style={s.proTileTitle}>Map & Navigation</Text><Text style={s.proTileSub}>View stops & directions</Text></TouchableOpacity>
    <TouchableOpacity style={s.proTile} onPress={()=>{setScreen("saved");setTab("Home");}}><Text style={s.proTileIcon}>▤</Text><Text style={s.proTileTitle}>Saved Routes</Text><Text style={s.proTileSub}>Open saved delivery routes</Text></TouchableOpacity>
   </View>
   <View style={s.proInfoGrid}>
    <View style={[s.proInfoCard,{flex:1.02}]}>
     <Text style={s.proInfoTitle}>▦  TODAY'S PROGRESS</Text>
     <View style={s.proProgressTrack}><View style={[s.proProgressFill,{width:successRate+"%"}]}/></View>
     <Text style={s.proProgressLabel}>{successRate}% successfully completed</Text>
     <View style={s.proProgressRow}><Text style={s.proBulletDone}>●</Text><Text style={s.proInfoLine}>Visited: {visited}</Text></View>
     <View style={s.proProgressRow}><Text style={s.proBulletDone}>●</Text><Text style={s.proInfoLine}>Successful: {completed}</Text></View>
     <View style={s.proProgressRow}><Text style={s.proBulletMuted}>×</Text><Text style={s.proInfoLine}>Unsuccessful: {unsuccessful}</Text></View>
     <View style={s.proProgressRow}><Text style={s.proBulletMuted}>×</Text><Text style={s.proInfoLine}>Not visited: {remaining}</Text></View>
    </View>
    <View style={[s.proInfoCard,{flex:0.98}]}>
     <Text style={s.proInfoTitle}>▣  ITEMS DELIVERED</Text>
     <View style={s.proItemRow}><Text style={s.proItemIcon}>▤</Text><View style={{flex:1}}><Text style={s.proItemLabel}>Wheelie Bins</Text></View><Text style={s.proItemValue}>{bins}</Text></View>
     <View style={s.proItemRow}><Text style={s.proItemIcon}>▣</Text><View style={{flex:1}}><Text style={s.proItemLabel}>Food Waste Caddies</Text></View><Text style={s.proItemValue}>{caddies}</Text></View>
    </View>
   </View>
   <View style={s.proActions}>
    <TouchableOpacity style={s.proMainAction} onPress={()=>{setScreen("deliveries");setTab("Deliveries");}}><Text style={s.proMainActionText}>▣   Open Today's Deliveries</Text></TouchableOpacity>
    <TouchableOpacity style={s.proSecondaryAction} onPress={()=>{setScreen("performance");setTab("Reports");}}><Text style={s.proSecondaryActionText}>View Reports</Text></TouchableOpacity>
   </View>
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
   <View style={s.card}><Text style={s.cardTitle}>TODAY'S PROPERTIES</Text>{stops.length===0?<Text style={s.small}>No delivery jobs loaded yet. Import a spreadsheet or add addresses using House Finder.</Text>:stops.map((x,i)=><View key={x.id} style={s.stop}><View style={s.number}><Text style={s.numberText}>{i+1}</Text></View><View style={{flex:1}}><Text style={s.resultTitle}>{x.name}</Text><Text style={s.small}>{x.town} {x.postcode}</Text><Text style={s.small}>Wheelie bins: {Number(x.wheelieBins||0)} · Food caddies: {Number(x.foodCaddies||0)}</Text><Text style={[s.small,{color:x.done?C.green:C.orange}]}>{x.deliveryOutcome&&x.deliveryOutcome!=="Pending"?x.deliveryOutcome:(x.done?"✓ Delivered":"● Pending")}</Text>{x.deliveryNotes?<Text style={s.small}>Note: {x.deliveryNotes}</Text>:null}</View><TouchableOpacity onPress={()=>openCompletion(x)}><Text style={s.action}>{x.done?"REPORT":"UPDATE"}</Text></TouchableOpacity></View>)}</View>
   <Button title="Open Stock Control" onPress={()=>{setScreen("stock");setTab("Home");}}/>
   <Button title="Vehicle Defects & Incident Log" onPress={()=>{setScreen("defects");setTab("Home");}} outline/>
   <Button title="Vehicle Mileage & Fuel Log" onPress={()=>{setScreen("vehicleLog");setTab("Home");}} outline/>
   <Button title="Daily Vehicle Safety Checklist" onPress={()=>{setVehicleChecklistDraft(stockLoaded.vehicleChecklist?.items||{});setScreen("vehicleChecklist");setTab("Home");}} outline/>
   <Button title="Back to Home" onPress={()=>{setScreen("home");setTab("Home");}} outline/>
  </ScrollView>;
 };
 async function takeDefectPhoto(){
  try{
   const permission=await ImagePicker.requestCameraPermissionsAsync();
   if(!permission.granted)return Alert.alert("Camera permission needed","Allow Jett Pal to use the camera to photograph the fault or incident.");
   const result=await ImagePicker.launchCameraAsync({mediaTypes:["images"],quality:0.75});
   if(result.canceled||!result.assets?.length)return;
   const target=FileSystem.documentDirectory+"jett_defect_"+Date.now()+".jpg";
   await FileSystem.copyAsync({from:result.assets[0].uri,to:target});
   setDefectPhotoUri(target);
   Alert.alert("Photo saved","The photograph has been attached to this report on this phone.");
  }catch(error){Alert.alert("Photo unavailable",error.message||"Jett could not take or save the photo.");}
 }
 function saveDefectReport(){
  if(!defectDescription.trim())return Alert.alert("Description required","Describe the fault, damage or incident before saving.");
  const item={id:"defect_"+Date.now(),type:defectType,severity:defectSeverity,description:defectDescription.trim(),location:defectLocation.trim(),photoUri:defectPhotoUri,reportedAt:new Date().toISOString(),status:"Open"};
  setStockLoaded(p=>({...p,defectReports:[item,...(p.defectReports||[])].slice(0,100)}));
  setDefectDescription("");setDefectLocation("");setDefectPhotoUri(null);
  setDefectType("Vehicle fault");setDefectSeverity("Needs attention");
  Alert.alert("Report saved","The vehicle defect or incident has been recorded on this phone.");
 }
 function updateDefectStatus(id,status){
  setStockLoaded(p=>({...p,defectReports:(p.defectReports||[]).map(x=>x.id===id?{...x,status}:x)}));
 }
 function saveDriverProfile(){
  if(!driverForm.name.trim())return Alert.alert("Driver name required","Enter the driver's full name.");
  const record={id:editingDriverId||"driver_"+Date.now(),name:driverForm.name.trim(),employeeId:driverForm.employeeId.trim(),phone:driverForm.phone.trim(),vehicle:driverForm.vehicle.trim(),shift:driverForm.shift.trim()};
  setDrivers(p=>editingDriverId?p.map(x=>x.id===editingDriverId?record:x):[...p,record]);
  if(!activeDriverId)setActiveDriverId(record.id);
  setDriverForm({name:"",employeeId:"",phone:"",vehicle:"",shift:""});setEditingDriverId(null);
  Alert.alert("Driver saved",`${record.name} has been ${editingDriverId?"updated":"added"} to Driver Management.`);
 }
 function editDriverProfile(driver){
  setEditingDriverId(driver.id);
  setDriverForm({name:driver.name||"",employeeId:driver.employeeId||"",phone:driver.phone||"",vehicle:driver.vehicle||"",shift:driver.shift||""});
 }
 function removeDriverProfile(id){
  Alert.alert("Remove driver?","This removes the profile from this device. Existing reports are not deleted.",[{text:"Cancel",style:"cancel"},{text:"Remove",style:"destructive",onPress:()=>{setDrivers(p=>p.filter(x=>x.id!==id));if(activeDriverId===id)setActiveDriverId("");if(editingDriverId===id){setEditingDriverId(null);setDriverForm({name:"",employeeId:"",phone:"",vehicle:"",shift:""});}}}]);
 }
 const driverManagementScreen=()=>{
  const active=drivers.find(x=>x.id===activeDriverId);
  return <ScrollView contentContainerStyle={s.content}><Header/><Text style={s.title}>Driver Management</Text><Text style={s.small}>Create driver profiles and select who is working the current shift. Profiles are stored on this phone.</Text>
   <View style={s.card}><Text style={s.cardTitle}>CURRENT SHIFT DRIVER</Text>{active?<><Text style={s.resultTitle}>{active.name}</Text><Text style={s.small}>{active.employeeId||"No employee ID"} · {active.vehicle||"No vehicle assigned"}</Text><Text style={s.small}>{active.shift||"Shift not specified"}</Text></>:<Text style={s.small}>No driver selected. Choose a driver below.</Text>}</View>
   <View style={s.card}><Text style={s.cardTitle}>{editingDriverId?"EDIT DRIVER PROFILE":"ADD DRIVER PROFILE"}</Text>
    <Text style={s.small}>Full name *</Text><TextInput style={s.input} value={driverForm.name} onChangeText={v=>setDriverForm(p=>({...p,name:v}))} placeholder="Driver's full name" placeholderTextColor="#78939b"/>
    <Text style={s.small}>Employee / driver ID</Text><TextInput style={s.input} value={driverForm.employeeId} onChangeText={v=>setDriverForm(p=>({...p,employeeId:v}))} placeholder="e.g. JETT-001" placeholderTextColor="#78939b"/>
    <Text style={s.small}>Contact phone</Text><TextInput style={s.input} keyboardType="phone-pad" value={driverForm.phone} onChangeText={v=>setDriverForm(p=>({...p,phone:v}))} placeholder="Contact number" placeholderTextColor="#78939b"/>
    <Text style={s.small}>Allocated vehicle / registration</Text><TextInput style={s.input} value={driverForm.vehicle} onChangeText={v=>setDriverForm(p=>({...p,vehicle:v}))} placeholder="e.g. Van AB12 CDE" placeholderTextColor="#78939b"/>
    <Text style={s.small}>Usual shift</Text><TextInput style={s.input} value={driverForm.shift} onChangeText={v=>setDriverForm(p=>({...p,shift:v}))} placeholder="e.g. 07:00–15:00" placeholderTextColor="#78939b"/>
    <Button title={editingDriverId?"Save driver changes":"Add driver"} onPress={saveDriverProfile}/>
    {editingDriverId?<Button title="Cancel editing" outline onPress={()=>{setEditingDriverId(null);setDriverForm({name:"",employeeId:"",phone:"",vehicle:"",shift:""});}}/>:null}
   </View>
   <View style={s.card}><Text style={s.cardTitle}>DRIVER PROFILES ({drivers.length})</Text>{drivers.length?drivers.map(driver=><View key={driver.id} style={{paddingVertical:12,borderBottomWidth:1,borderBottomColor:C.line}}>
    <Text style={s.resultTitle}>{driver.name} {driver.id===activeDriverId?"· CURRENT":""}</Text>
    <Text style={s.small}>ID: {driver.employeeId||"—"} · Phone: {driver.phone||"—"}</Text><Text style={s.small}>Vehicle: {driver.vehicle||"Not allocated"} · Shift: {driver.shift||"Not set"}</Text>
    <View style={{flexDirection:"row",gap:8,marginTop:8}}><View style={{flex:1}}><Button title={driver.id===activeDriverId?"Selected":"Set as current driver"} outline={driver.id===activeDriverId} onPress={()=>{setActiveDriverId(driver.id);setDriverName(driver.name);}}/></View><View style={{flex:1}}><Button title="Edit" outline onPress={()=>editDriverProfile(driver)}/></View><View style={{flex:1}}><Button title="Remove" outline onPress={()=>removeDriverProfile(driver.id)}/></View></View>
   </View>):<Text style={s.small}>No drivers added yet. Add your first driver above.</Text>}</View>
   <Text style={s.foot}>Driver profiles are currently stored locally on this device. They are not yet shared or synchronised between different phones.</Text>
   <Button title="Back to Home" outline onPress={()=>{setScreen("home");setTab("Home");}}/>
  </ScrollView>;
 };
 const vehicleChecklistItems=[
  ["tyres","Tyres and wheels (condition, tread and pressure)"],
  ["lights","Lights, indicators and hazard lights"],
  ["mirrors","Mirrors and visibility"],
  ["windscreen","Windscreen, windows and wipers"],
  ["brakes","Brakes and parking brake"],
  ["horn","Horn"],
  ["seatbelts","Seatbelts and seats"],
  ["fluids","Fluid levels and visible leaks"],
  ["bodywork","Vehicle bodywork, doors and number plates"],
  ["load","Load secured safely"],
  ["safety","Safety equipment and first-aid kit"]
 ];
 function setChecklistAnswer(key,value){
  setVehicleChecklistDraft(p=>({...p,[key]:value}));
 }
 function saveVehicleChecklist(){
  const unanswered=vehicleChecklistItems.filter(([key])=>!vehicleChecklistDraft[key]);
  if(unanswered.length)return Alert.alert("Checklist incomplete",`Please record a result for all ${unanswered.length} remaining item(s).`);
  const issues=vehicleChecklistItems.filter(([key])=>vehicleChecklistDraft[key]==="Issue").map(([key,label])=>label);
  const record={items:{...vehicleChecklistDraft},issues,completedAt:new Date().toISOString(),driver:stockLoaded.driverSignoff?.name||""};
  setStockLoaded(p=>({...p,vehicleChecklist:record}));
  Alert.alert(issues.length?"Checklist saved — issues found":"Checklist complete",issues.length?`Recorded ${issues.length} item(s) needing attention. Log each safety fault in Vehicle Defects & Incident Log and do not use an unsafe vehicle.`:"All checklist items were marked OK.");
 }
 const vehicleChecklistScreen=()=>{
  const saved=stockLoaded.vehicleChecklist;
  const answered=vehicleChecklistItems.filter(([key])=>!!vehicleChecklistDraft[key]).length;
  return <ScrollView contentContainerStyle={s.content}><Header/><Text style={s.title}>Daily Vehicle Safety Checklist</Text><Text style={s.small}>Complete these checks before starting the delivery shift. Choose one result for every item.</Text>
   <View style={s.card}><Text style={s.cardTitle}>PRE-USE CHECK · {answered}/{vehicleChecklistItems.length} COMPLETED</Text>
    {vehicleChecklistItems.map(([key,label],i)=><View key={key} style={{paddingVertical:12,borderBottomWidth:1,borderBottomColor:C.line}}>
     <Text style={s.resultTitle}>{i+1}. {label}</Text>
     <View style={{flexDirection:"row",gap:7,marginTop:9}}>
      {["OK","Issue","N/A"].map(value=><TouchableOpacity key={value} onPress={()=>setChecklistAnswer(key,value)} style={{flex:1,paddingVertical:10,borderRadius:9,alignItems:"center",backgroundColor:vehicleChecklistDraft[key]===value?(value==="Issue"?C.orange:value==="OK"?C.green:C.muted):C.panel,borderWidth:1,borderColor:vehicleChecklistDraft[key]===value?C.text:C.line}}><Text style={{color:C.text,fontWeight:"700"}}>{value}</Text></TouchableOpacity>)}
     </View>
    </View>)}
    <Button title="Save daily vehicle checklist" onPress={saveVehicleChecklist}/>
   </View>
   <View style={s.card}><Text style={s.cardTitle}>LAST SAVED CHECK</Text>{saved?<><Text style={s.resultTitle}>{new Date(saved.completedAt).toLocaleString()}</Text><Text style={s.small}>{saved.issues?.length? `${saved.issues.length} item(s) marked Issue`:"No issues reported"}</Text>{saved.issues?.map((v,i)=><Text key={i} style={s.small}>• {v}</Text>)}</>:<Text style={s.small}>No checklist saved yet for this shift.</Text>}</View>
   <Text style={s.foot}>If a safety-critical item fails, do not take the vehicle on the road until it has been assessed and made safe. Record faults in the Vehicle Defects & Incident Log and follow company procedures.</Text>
   <Button title="Open Vehicle Defects & Incident Log" outline onPress={()=>setScreen("defects")}/><Button title="Back to Home" outline onPress={()=>{setScreen("home");setTab("Home");}}/>
  </ScrollView>;
 };
 const vehicleLogScreen=()=>{
  const saved=stockLoaded.vehicleLog;
  function saveVehicleLog(){
   const start=Number(vehicleStartMiles),end=Number(vehicleEndMiles);
   if(vehicleStartMiles.trim()===""||vehicleEndMiles.trim()===""||!Number.isFinite(start)||!Number.isFinite(end)||start<0||end<start)return Alert.alert("Check mileage","Enter valid start and end odometer readings. End mileage must not be lower than start mileage.");
   const record={startMileage:start,endMileage:end,milesDriven:end-start,fuelStart:fuelStart.trim(),fuelEnd:fuelEnd.trim(),notes:vehicleLogNotes.trim(),recordedAt:new Date().toISOString()};
   setStockLoaded(p=>({...p,vehicleLog:record}));
   Alert.alert("Vehicle log saved",`Today's mileage: ${end-start}. The record is saved on this phone.`);
  }
  return <ScrollView contentContainerStyle={s.content}><Header/><Text style={s.title}>Vehicle Mileage & Fuel Log</Text><Text style={s.small}>Record the odometer and fuel level at the start and end of each shift.</Text>
   <View style={s.card}><Text style={s.cardTitle}>START OF SHIFT</Text><Text style={s.small}>Starting odometer (miles)</Text><TextInput style={s.input} keyboardType="decimal-pad" value={vehicleStartMiles} onChangeText={setVehicleStartMiles} placeholder="e.g. 42560" placeholderTextColor="#78939b"/><Text style={s.small}>Starting fuel level</Text><TextInput style={s.input} value={fuelStart} onChangeText={setFuelStart} placeholder="e.g. Full, 3/4, half" placeholderTextColor="#78939b"/></View>
   <View style={s.card}><Text style={s.cardTitle}>END OF SHIFT</Text><Text style={s.small}>Ending odometer (miles)</Text><TextInput style={s.input} keyboardType="decimal-pad" value={vehicleEndMiles} onChangeText={setVehicleEndMiles} placeholder="e.g. 42615" placeholderTextColor="#78939b"/><Text style={s.small}>Ending fuel level</Text><TextInput style={s.input} value={fuelEnd} onChangeText={setFuelEnd} placeholder="e.g. Half, 1/4, Full" placeholderTextColor="#78939b"/><Text style={s.small}>Notes (fuel purchased, warning lights, etc.)</Text><TextInput style={[s.input,{minHeight:85,textAlignVertical:"top"}]} multiline value={vehicleLogNotes} onChangeText={setVehicleLogNotes} placeholder="Add any vehicle or fuel notes..." placeholderTextColor="#78939b"/><Button title="Save vehicle log" onPress={saveVehicleLog}/></View>
   <View style={s.card}><Text style={s.cardTitle}>SAVED SHIFT RECORD</Text>{saved?<><Text style={s.resultTitle}>{saved.milesDriven} miles driven</Text><Text style={s.small}>Start: {saved.startMileage} miles · End: {saved.endMileage} miles</Text><Text style={s.small}>Fuel: {saved.fuelStart||"Not entered"} → {saved.fuelEnd||"Not entered"}</Text><Text style={s.small}>Saved: {new Date(saved.recordedAt).toLocaleString()}</Text>{saved.notes?<Text style={s.small}>Notes: {saved.notes}</Text>:null}</>:<Text style={s.small}>No vehicle mileage record saved for this shift yet.</Text>}</View>
   <Text style={s.foot}>Enter readings from the vehicle dashboard. This is an operational log, not a replacement for statutory vehicle records.</Text><Button title="Back to Home" outline onPress={()=>{setScreen("home");setTab("Home");}}/>
  </ScrollView>;
 };
 const defectsScreen=()=>{
  const reports=stockLoaded.defectReports||[];
  return <ScrollView contentContainerStyle={s.content}><Header/><Text style={s.title}>Vehicle Defects & Incidents</Text><Text style={s.small}>Record vehicle faults, damage, accidents and other shift incidents. Reports are saved on this phone.</Text>
   <View style={s.card}><Text style={s.cardTitle}>NEW REPORT</Text><Text style={s.small}>Type of report</Text>
    {["Vehicle fault","Vehicle damage","Accident / collision","Load damage","Near miss","Other incident"].map(v=><TouchableOpacity key={v} style={s.preference} onPress={()=>setDefectType(v)}><View style={[s.radio,{borderColor:defectType===v?C.green:C.muted}]}>{defectType===v&&<View style={s.radioInner}/>}</View><Text style={s.resultTitle}>{v}</Text></TouchableOpacity>)}
    <Text style={[s.small,{marginTop:12}]}>Severity</Text>
    {["Informational","Needs attention","Vehicle unsafe — do not use"].map(v=><TouchableOpacity key={v} style={s.preference} onPress={()=>setDefectSeverity(v)}><View style={[s.radio,{borderColor:defectSeverity===v?C.green:C.muted}]}>{defectSeverity===v&&<View style={s.radioInner}/>}</View><Text style={s.resultTitle}>{v}</Text></TouchableOpacity>)}
    <Text style={s.small}>Vehicle registration / location</Text><TextInput style={s.input} value={defectLocation} onChangeText={setDefectLocation} placeholder="e.g. Van registration or where it happened" placeholderTextColor="#78939b"/>
    <Text style={s.small}>What happened? Include any action taken</Text><TextInput style={[s.input,{minHeight:100,textAlignVertical:"top"}]} multiline value={defectDescription} onChangeText={setDefectDescription} placeholder="Describe the fault, damage or incident..." placeholderTextColor="#78939b"/>
    <Button title="Take photograph" onPress={takeDefectPhoto} outline/>
    {defectPhotoUri?<Image source={{uri:defectPhotoUri}} resizeMode="cover" style={{width:"100%",height:190,borderRadius:12,marginTop:12}}/>:null}
    <Button title="Save defect / incident report" onPress={saveDefectReport}/>
   </View>
   <View style={s.card}><Text style={s.cardTitle}>REPORT HISTORY ({reports.length})</Text>
    {reports.length?reports.map(item=><View key={item.id} style={{paddingVertical:12,borderBottomWidth:1,borderBottomColor:C.line}}>
     <Text style={s.resultTitle}>{item.type} · {item.severity}</Text><Text style={s.small}>{new Date(item.reportedAt).toLocaleString()} · {item.location||"No location entered"}</Text><Text style={[s.small,{marginTop:6}]}>{item.description}</Text>
     {item.photoUri?<Image source={{uri:item.photoUri}} resizeMode="cover" style={{width:"100%",height:160,borderRadius:10,marginTop:8}}/>:null}
     <Text style={[s.greenText,{marginTop:8}]}>Status: {item.status}</Text>
     {item.status==="Open"?<View style={{flexDirection:"row",gap:8}}><View style={{flex:1}}><Button title="Mark actioned" onPress={()=>updateDefectStatus(item.id,"Actioned")}/></View><View style={{flex:1}}><Button title="Close report" outline onPress={()=>updateDefectStatus(item.id,"Closed")}/></View></View>:<Button title="Reopen report" outline onPress={()=>updateDefectStatus(item.id,"Open")}/>}
    </View>):<Text style={s.small}>No faults or incidents have been reported yet.</Text>}
   </View>
   <Text style={s.foot}>If a vehicle is unsafe, stop using it and follow your company's breakdown, accident and safety procedures. This log does not replace formal reporting.</Text>
   <Button title="Back to Home" outline onPress={()=>{setScreen("home");setTab("Home");}}/>
  </ScrollView>;
 }
 async function takeLoadPhoto(){
  try{
   const permission=await ImagePicker.requestCameraPermissionsAsync();
   if(!permission.granted)return Alert.alert("Camera permission needed","Allow Jett Pal to use the camera to photograph the vehicle load.");
   const result=await ImagePicker.launchCameraAsync({mediaTypes:["images"],quality:0.75});
   if(result.canceled||!result.assets?.length)return;
   const source=result.assets[0].uri;
   const target=FileSystem.documentDirectory+"jett_vehicle_load_"+Date.now()+".jpg";
   await FileSystem.copyAsync({from:source,to:target});
   setStockLoaded(p=>({...p,loadPhotoUri:target,checkedAt:null}));
   Alert.alert("Load photo saved","The vehicle load photo is saved on this phone. Confirm the load again after checking the quantities.");
  }catch(error){Alert.alert("Photo unavailable",error.message||"Jett could not take or save the photo.");}
 }
 const signoffScreen=()=>{
  const addSignaturePoint=(event,move=false)=>{
   const x=Math.max(0,Math.min(320,event.nativeEvent.locationX/signatureWidth*320));
   const y=Math.max(0,Math.min(160,event.nativeEvent.locationY));
   const point=(move?" L ":" M ")+x.toFixed(1)+" "+y.toFixed(1);
   setSignaturePath(p=>p+point);
  };
  const saveDriverSignoff=()=>{
   if(!driverName.trim())return Alert.alert("Driver name required","Enter the driver's full name before signing off.");
   if(!signaturePath.trim())return Alert.alert("Signature required","Please sign in the box before saving.");
   if(!stockLoaded.checkedAt)return Alert.alert("Vehicle load not confirmed","Complete the vehicle load check first.");
   if(!stockLoaded.returnedAt)return Alert.alert("Return check required","Save the unused stock return check before signing off.");
   const record={name:driverName.trim(),signature:signaturePath,signedAt:new Date().toISOString()};
   setStockLoaded(p=>({...p,driverSignoff:record}));
   Alert.alert("Driver sign-off saved","The driver's name, signature and check time have been saved on this phone.");
  };
  const existing=stockLoaded.driverSignoff;
  return <ScrollView contentContainerStyle={s.content}><Header/><Text style={s.title}>Driver Sign-off</Text><Text style={s.small}>Complete the vehicle load and depot return checks, then sign to confirm the shift records.</Text>
   <View style={s.card}><Text style={s.cardTitle}>SHIFT CHECKS</Text>
    <Text style={stockLoaded.checkedAt?s.greenText:{color:C.orange,fontWeight:"900"}}>{stockLoaded.checkedAt?"✓ Vehicle load confirmed":"• Vehicle load check still required"}</Text>
    <Text style={stockLoaded.returnedAt?s.greenText:{color:C.orange,fontWeight:"900",marginTop:8}}>{stockLoaded.returnedAt?"✓ Return-to-depot check saved":"• Return-to-depot check still required"}</Text>
   </View>
   <View style={s.card}><Text style={s.cardTitle}>DRIVER DETAILS</Text><Text style={s.small}>Full name</Text><TextInput style={s.input} value={driverName} onChangeText={setDriverName} placeholder="Enter driver's full name" placeholderTextColor="#78939b"/>
    <Text style={[s.small,{marginTop:14}]}>Driver signature</Text>
    <View onLayout={e=>setSignatureWidth(Math.max(1,e.nativeEvent.layout.width))} onStartShouldSetResponder={()=>true} onMoveShouldSetResponder={()=>true} onResponderGrant={e=>addSignaturePoint(e,false)} onResponderMove={e=>addSignaturePoint(e,true)} style={{height:160,backgroundColor:"#f7faf8",borderRadius:10,marginTop:8,overflow:"hidden"}}>
     <Svg width="100%" height="160" viewBox="0 0 320 160"><Path d={signaturePath} stroke="#102d27" strokeWidth="2.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></Svg>
     {!signaturePath?<Text pointerEvents="none" style={{position:"absolute",left:0,right:0,bottom:12,textAlign:"center",color:"#80918b",fontSize:12}}>Sign here with your finger</Text>:null}
    </View>
    <Button title="Clear signature" outline onPress={()=>setSignaturePath("")}/>
    <Button title="Save driver sign-off" onPress={saveDriverSignoff}/>
   </View>
   {existing?<View style={s.card}><Text style={s.cardTitle}>LATEST SIGN-OFF</Text><Text style={s.greenText}>✓ Signed by {existing.name}</Text><Text style={s.small}>{new Date(existing.signedAt).toLocaleString()}</Text><View style={{height:120,backgroundColor:"#f7faf8",borderRadius:10,marginTop:10,overflow:"hidden"}}><Svg width="100%" height="120" viewBox="0 0 320 160"><Path d={existing.signature} stroke="#102d27" strokeWidth="2.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></Svg></View></View>:null}
   <Button title="Back to Vehicle Stock" outline onPress={()=>setScreen("stock")}/>
  </ScrollView>;
 };
 const stockScreen=()=>{
  const requiredBins=stops.reduce((n,x)=>n+Number(x.wheelieBins||0),0);
  const requiredCaddies=stops.reduce((n,x)=>n+Number(x.foodCaddies||0),0);
  const deliveredBins=stops.reduce((n,x)=>n+Number(x.done?(x.deliveredWheelieBins??x.wheelieBins??0):0),0);
  const deliveredCaddies=stops.reduce((n,x)=>n+Number(x.done?(x.deliveredFoodCaddies??x.foodCaddies??0):0),0);
  const loadedBins=Number(stockLoaded.wheelieBins||0),loadedCaddies=Number(stockLoaded.foodCaddies||0);
  const binsShort=Math.max(0,requiredBins-loadedBins),caddiesShort=Math.max(0,requiredCaddies-loadedCaddies);
  const stockReady=binsShort===0&&caddiesShort===0;
  const returnedBins=Number(stockLoaded.returnedWheelieBins||0),returnedCaddies=Number(stockLoaded.returnedFoodCaddies||0);
  const updateStock=(key,value)=>setStockLoaded(p=>({...p,[key]:Math.max(0,parseInt(value||"0",10)||0),checkedAt:null}));
  const confirmVehicleLoad=()=>{
   if(!stockReady)return Alert.alert("Vehicle stock is short","Load the missing "+binsShort+" wheelie bins and "+caddiesShort+" food caddies before confirming.");
   if(!stockLoaded.loadPhotoUri)return Alert.alert("Take a load photo first","Photograph the loaded vehicle before confirming the vehicle check.");
   setStockLoaded(p=>({...p,checkedAt:new Date().toISOString()}));
   Alert.alert("Vehicle load confirmed","The quantities and load photo have been saved on this phone.");
  };
  const saveReturnCheck=()=>{
   setStockLoaded(p=>({...p,returnedAt:new Date().toISOString()}));
   Alert.alert("Return check saved","The unused stock returned to the depot has been recorded.");
  };
  return <ScrollView contentContainerStyle={s.content}><Header/><Text style={s.title}>Vehicle Stock & Return Check</Text><Text style={s.small}>Check the load before leaving the depot, photograph it, then record unused stock when the vehicle returns.</Text>
   <View style={[s.card,{borderColor:stockReady?C.green:C.orange,borderWidth:1.5}]}>
    <Text style={s.cardTitle}>{stockReady?"STOCK QUANTITIES COVER THE ROUTE":"MORE STOCK REQUIRED"}</Text>
    <Text style={stockReady?s.greenText:{color:C.orange,fontWeight:"900",fontSize:12}}>{stockReady?"Quantities are sufficient for today's delivery list.":"Short by "+binsShort+" wheelie bins and "+caddiesShort+" food caddies."}</Text>
    {stockLoaded.checkedAt?<Text style={s.greenText}>✓ Load checked {new Date(stockLoaded.checkedAt).toLocaleString()}</Text>:<Text style={s.small}>Vehicle load not yet confirmed.</Text>}
   </View>
   <View style={s.card}><Text style={s.cardTitle}>WHEELIE BINS</Text><View style={s.stats}><View><Text style={s.stat}>{requiredBins}</Text><Text style={s.small}>REQUIRED</Text></View><View><Text style={s.stat}>{loadedBins}</Text><Text style={s.small}>LOADED</Text></View><View><Text style={s.stat}>{deliveredBins}</Text><Text style={s.small}>DELIVERED</Text></View></View><TextInput style={s.input} keyboardType="number-pad" value={String(stockLoaded.wheelieBins??0)} onChangeText={v=>updateStock("wheelieBins",v)} placeholder="Number of wheelie bins loaded" placeholderTextColor="#78939b"/><Text style={s.greenText}>Still to load: {binsShort} · Estimated remaining after deliveries: {Math.max(0,loadedBins-deliveredBins)}</Text></View>
   <View style={s.card}><Text style={s.cardTitle}>FOOD WASTE CADDIES</Text><View style={s.stats}><View><Text style={s.stat}>{requiredCaddies}</Text><Text style={s.small}>REQUIRED</Text></View><View><Text style={s.stat}>{loadedCaddies}</Text><Text style={s.small}>LOADED</Text></View><View><Text style={s.stat}>{deliveredCaddies}</Text><Text style={s.small}>DELIVERED</Text></View></View><TextInput style={s.input} keyboardType="number-pad" value={String(stockLoaded.foodCaddies??0)} onChangeText={v=>updateStock("foodCaddies",v)} placeholder="Number of food caddies loaded" placeholderTextColor="#78939b"/><Text style={s.greenText}>Still to load: {caddiesShort} · Estimated remaining after deliveries: {Math.max(0,loadedCaddies-deliveredCaddies)}</Text></View>
   <View style={s.card}><Text style={s.cardTitle}>VEHICLE LOAD PHOTOGRAPH</Text><Text style={s.small}>Take a picture showing the bins and caddies loaded in the van. The photo stays on this phone.</Text><Button title="Take photo of vehicle load" onPress={takeLoadPhoto}/>
    {stockLoaded.loadPhotoUri?<Image source={{uri:stockLoaded.loadPhotoUri}} resizeMode="cover" style={{width:"100%",height:210,borderRadius:12,marginTop:12}}/>:<Text style={s.small}>No load photo taken yet.</Text>}
    <Button title={stockLoaded.checkedAt?"Load confirmed":"Confirm vehicle is loaded"} onPress={confirmVehicleLoad}/>
   </View>
   <View style={s.card}><Text style={s.cardTitle}>RETURN TO DEPOT — UNUSED STOCK</Text><Text style={s.small}>At the end of the shift, count the unused stock physically returned to the depot.</Text>
    <Text style={s.small}>Wheelie bins returned</Text><TextInput style={s.input} keyboardType="number-pad" value={String(stockLoaded.returnedWheelieBins??0)} onChangeText={v=>updateStock("returnedWheelieBins",v)} placeholder="Wheelie bins returned" placeholderTextColor="#78939b"/>
    <Text style={s.small}>Food waste caddies returned</Text><TextInput style={s.input} keyboardType="number-pad" value={String(stockLoaded.returnedFoodCaddies??0)} onChangeText={v=>updateStock("returnedFoodCaddies",v)} placeholder="Food caddies returned" placeholderTextColor="#78939b"/>
    <Text style={s.small}>Recorded returned: {returnedBins} wheelie bins · {returnedCaddies} food caddies</Text>
    {stockLoaded.returnedAt?<Text style={s.greenText}>Last return check: {new Date(stockLoaded.returnedAt).toLocaleString()}</Text>:null}
    <Button title="Save return-to-depot check" onPress={saveReturnCheck}/>
   </View>
   <Text style={s.foot}>Stock counts, load photo and depot return record are saved on this phone. A load photo and quantity confirmation are required for the pre-departure check.</Text>
   <Button title="Driver sign-off & signature" onPress={()=>{setDriverName(stockLoaded.driverSignoff?.name||drivers.find(x=>x.id===activeDriverId)?.name||"");setSignaturePath("");setScreen("signoff");}}/>
   <Button title="Open Delivery Manager" onPress={()=>{setScreen("deliveries");setTab("Home");}} outline/>
   <Button title="Back to Home" onPress={()=>{setScreen("home");setTab("Home");}} outline/>
  </ScrollView>;
 };
 async function exportDeliverySheet(){
  if(!stops.length)return Alert.alert("No delivery data","Load or add delivery stops before exporting a sheet.");
  try{
   const csvCell=value=>'"'+String(value??"").replace(/"/g,'""')+'"';
   const rows=[
    ["Jett Pal Daily Delivery Sheet"],
    ["Exported",new Date().toLocaleString()],
    [],
    ["Stop","Property / Address","Town","Postcode","Wheelie bins required","Food caddies required","Outcome","Wheelie bins delivered","Food caddies delivered","Delivery notes","Completed at"],
    ...stops.map((x,i)=>[
     i+1,x.name||x.address||"",x.town||"",x.postcode||"",
     Number(x.wheelieBins||0),Number(x.foodCaddies||0),
     x.deliveryOutcome||(x.done?"Delivered":"Pending"),
     x.done?Number(x.deliveredWheelieBins??x.wheelieBins??0):0,
     x.done?Number(x.deliveredFoodCaddies??x.foodCaddies??0):0,
     x.deliveryNotes||"",
     x.completedAt?new Date(x.completedAt).toLocaleString():""
    ])
   ];
   const csv="\\uFEFF"+rows.map(row=>row.map(csvCell).join(",")).join("\\r\\n");
   const filename="Jett_Delivery_Sheet_"+new Date().toISOString().slice(0,10)+".csv";
   const uri=FileSystem.documentDirectory+filename;
   await FileSystem.writeAsStringAsync(uri,csv,{encoding:FileSystem.EncodingType.UTF8});
   const available=await Sharing.isAvailableAsync();
   if(!available)throw new Error("Sharing is not available on this device.");
   await Sharing.shareAsync(uri,{mimeType:"text/csv",dialogTitle:"Share Jett daily delivery sheet",UTI:"public.comma-separated-values-text"});
  }catch(error){
   Alert.alert("Export failed",error.message||"Jett could not create the delivery sheet.");
  }
 }
 async function exportHandoverReport(){
  if(!stops.length)return Alert.alert("No delivery data","Add or import today's delivery stops before creating a handover report.");
  try{
   const visited=stops.filter(x=>x.deliveryOutcome&&x.deliveryOutcome!=="Pending").length;
   const completed=stops.filter(x=>x.done).length;
   const unsuccessful=stops.filter(x=>x.deliveryOutcome&&x.deliveryOutcome!=="Pending"&&!x.done).length;
   const pending=stops.length-visited;
   const bins=stops.reduce((n,x)=>n+Number(x.done?(x.deliveredWheelieBins??x.wheelieBins??0):0),0);
   const caddies=stops.reduce((n,x)=>n+Number(x.done?(x.deliveredFoodCaddies??x.foodCaddies??0):0),0);
   const cell=value=>'"'+String(value??"").replace(/"/g,'""')+'"';
   const rows=[
    ["JETT PAL — DAILY SHIFT HANDOVER"],
    ["Report created",new Date().toLocaleString()],
    ["Route",routeName],
    ["Driver",stockLoaded.driverSignoff?.name||"Not signed off"],
    ["Driver signed at",stockLoaded.driverSignoff?.signedAt?new Date(stockLoaded.driverSignoff.signedAt).toLocaleString():"Not signed off"],
    [],
    ["SHIFT SUMMARY","Count / quantity"],
    ["Total properties",stops.length],
    ["Visited",visited],
    ["Successfully delivered",completed],
    ["Unsuccessful / issue",unsuccessful],
    ["Not visited / pending",pending],
    ["Wheelie bins delivered",bins],
    ["Food caddies delivered",caddies],
    [],
    ["VEHICLE STOCK CHECK","Recorded value"],
    ["Wheelie bins loaded",Number(stockLoaded.wheelieBins||0)],
    ["Food caddies loaded",Number(stockLoaded.foodCaddies||0)],
    ["Vehicle load confirmed",stockLoaded.checkedAt?new Date(stockLoaded.checkedAt).toLocaleString():"No"],
    ["Load photograph",stockLoaded.loadPhotoUri?"Saved on device":"Not taken"],
    ["Wheelie bins returned to depot",Number(stockLoaded.returnedWheelieBins||0)],
    ["Food caddies returned to depot",Number(stockLoaded.returnedFoodCaddies||0)],
    ["Depot return check",stockLoaded.returnedAt?new Date(stockLoaded.returnedAt).toLocaleString():"Not saved"],
    [],
    ["VEHICLE MILEAGE & FUEL"],
    ["Start mileage",stockLoaded.vehicleLog?.startMileage??"Not recorded"],
    ["End mileage",stockLoaded.vehicleLog?.endMileage??"Not recorded"],
    ["Miles driven",stockLoaded.vehicleLog?.milesDriven??"Not recorded"],
    ["Fuel at start",stockLoaded.vehicleLog?.fuelStart||"Not recorded"],
    ["Fuel at end",stockLoaded.vehicleLog?.fuelEnd||"Not recorded"],
    ["Vehicle log notes",stockLoaded.vehicleLog?.notes||""],
    ["Vehicle log saved",stockLoaded.vehicleLog?.recordedAt?new Date(stockLoaded.vehicleLog.recordedAt).toLocaleString():"Not recorded"],
    [],
    ["DAILY VEHICLE SAFETY CHECKLIST"],
    ["Checklist completed",stockLoaded.vehicleChecklist?.completedAt?new Date(stockLoaded.vehicleChecklist.completedAt).toLocaleString():"Not recorded"],
    ["Checklist driver",stockLoaded.vehicleChecklist?.driver||"Not recorded"],
    ["Items marked issue",(stockLoaded.vehicleChecklist?.issues||[]).join("; ")||"None recorded"],
    ...vehicleChecklistItems.map(([key,label])=>[label,stockLoaded.vehicleChecklist?.items?.[key]||"Not checked"]),
    [],
    ["DELIVERY-BY-DELIVERY HANDOVER"],
    ["Stop","Property / Address","Town","Postcode","Outcome","Bins required","Bins delivered","Caddies required","Caddies delivered","Issue / notes","Completed at"],
    ...stops.map((x,i)=>[
     i+1,x.name||x.address||"",x.town||"",x.postcode||"",
     x.deliveryOutcome||(x.done?"Delivered":"Pending"),
     Number(x.wheelieBins||0),x.done?Number(x.deliveredWheelieBins??x.wheelieBins??0):0,
     Number(x.foodCaddies||0),x.done?Number(x.deliveredFoodCaddies??x.foodCaddies??0):0,
     x.deliveryNotes||"",x.completedAt?new Date(x.completedAt).toLocaleString():""
    ])
   ];
   const csv="\\uFEFF"+rows.map(row=>row.map(cell).join(",")).join("\\r\\n");
   const filename="Jett_Shift_Handover_"+new Date().toISOString().slice(0,10)+".csv";
   const uri=FileSystem.documentDirectory+filename;
   await FileSystem.writeAsStringAsync(uri,csv,{encoding:FileSystem.EncodingType.UTF8});
   if(!await Sharing.isAvailableAsync())throw new Error("Sharing is not available on this device.");
   await Sharing.shareAsync(uri,{mimeType:"text/csv",dialogTitle:"Share Jett shift handover report",UTI:"public.comma-separated-values-text"});
  }catch(error){
   Alert.alert("Handover export failed",error.message||"Jett could not create the handover report.");
  }
 }
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
   <Button title="Export daily delivery sheet (Excel / CSV)" onPress={exportDeliverySheet} outline/>
   <Button title="Export daily shift handover report" onPress={exportHandoverReport}/>
   <View style={s.card}><Text style={s.cardTitle}>END-OF-DAY DELIVERY SUMMARY</Text><View style={s.stats}><View><Text style={s.stat}>{visited}</Text><Text style={s.small}>VISITED</Text></View><View><Text style={s.stat}>{completed}</Text><Text style={s.small}>SUCCESSFUL</Text></View><View><Text style={s.stat}>{failed}</Text><Text style={s.small}>UNSUCCESSFUL</Text></View></View><View style={s.stats}><View><Text style={s.stat}>{remaining}</Text><Text style={s.small}>NOT VISITED</Text></View><View><Text style={s.stat}>{binsDelivered}</Text><Text style={s.small}>BINS DELIVERED</Text></View><View><Text style={s.stat}>{caddiesDelivered}</Text><Text style={s.small}>CADDIES DELIVERED</Text></View></View><View style={{height:10,backgroundColor:C.bg,borderRadius:8,overflow:"hidden",marginVertical:10}}><View style={{height:10,width:(stops.length?Math.round(completed/stops.length*100):0)+"%",backgroundColor:C.green,borderRadius:8}}/></View><Text style={s.greenText}>{stops.length?Math.round(completed/stops.length*100):0}% successfully completed</Text><Text style={s.small}>{completed} of {stops.length} stops successfully delivered. Failed or partially completed jobs remain visible below.</Text></View><View style={s.card}><Text style={s.cardTitle}>DELIVERY OUTCOMES</Text>{stops.length?stops.map(x=><View key={x.id} style={s.stop}><View style={{flex:1}}><Text style={s.resultTitle}>{x.name}</Text><Text style={s.small}>{x.postcode||x.town} · {x.deliveryOutcome|| (x.done?"Delivered":"Pending")}</Text>{x.done?<Text style={s.small}>Delivered: {Number(x.deliveredWheelieBins??x.wheelieBins??0)} bins · {Number(x.deliveredFoodCaddies??x.foodCaddies??0)} caddies</Text>:null}{x.deliveryNotes?<Text style={s.small}>Note: {x.deliveryNotes}</Text>:null}</View></View>):<Text style={s.small}>No delivery jobs on the current list yet.</Text>}</View>
   <View style={s.card}><Text style={s.cardTitle}>LAST 7 DAYS · SAVED ROUTES</Text><View style={s.stats}><View><Text style={s.stat}>{recent.length}</Text><Text style={s.small}>ROUTES SAVED</Text></View><View><Text style={s.stat}>{savedStops}</Text><Text style={s.small}>STOPS PLANNED</Text></View><View><Text style={s.stat}>{savedMiles.toFixed(1)}</Text><Text style={s.small}>MILES SAVED</Text></View></View><Text style={s.foot}>These figures are based on saved route snapshots, not confirmed completed deliveries.</Text></View>
   <View style={s.card}><Text style={s.cardTitle}>RECENT ROUTE HISTORY</Text>{recent.length?recent.slice(0,8).map(x=><View key={x.id} style={s.stop}><View style={{flex:1}}><Text style={s.resultTitle}>{x.name||"Jett Pal Route"}</Text><Text style={s.small}>{new Date(x.savedAt).toLocaleDateString()} · {x.stops?.length||0} stops</Text></View><Text style={s.action}>{Number(x.miles||0).toFixed(1)} mi</Text></View>):<Text style={s.small}>No routes saved in the last 7 days yet. Save a route and it will appear here.</Text>}</View>
   <Text style={s.foot}>Average delivery time will be available once Jett records delivery timestamps. It is not estimated from route data.</Text>
   <Button title="Back to Home" onPress={()=>{setScreen("home");setTab("Home");}} outline/>
  </ScrollView>;
 };
 const savedScreen=()=> <ScrollView contentContainerStyle={s.content}><Header/><Text style={s.title}>Saved Routes</Text>{saved.length===0?<View style={s.card}><Text style={s.small}>No saved routes yet. Save a route to keep it on your phone.</Text></View>:saved.map(r=><View key={r.id} style={s.card}><Text style={s.cardTitle}>{r.name}</Text><Text style={s.small}>{r.stops.length} stops · {Number(r.miles||0).toFixed(1)} miles</Text><Button title="Load Route" onPress={()=>{setStops(r.stops);setScreen("route");setTab("Route");}}/></View>)}</ScrollView>;
 const settingsScreen=()=> <ScrollView contentContainerStyle={s.content}><Header/><Text style={s.title}>Settings</Text><View style={s.card}><Text style={s.cardTitle}>Jett Pal Account</Text>{authSession?<><Text style={s.small}>Signed in as {authSession.user?.email||"Jett Pal user"}</Text><Text style={s.small}>Full name</Text><TextInput style={s.input} value={profileName||authSession.user?.user_metadata?.full_name||""} onChangeText={setProfileName} placeholder="Your full name" placeholderTextColor="#78939b" autoCapitalize="words"/><Button title="Save profile" onPress={saveProfile} disabled={authBusy}/><Text style={[s.cardTitle,{marginTop:20}]}>Change password</Text><Text style={s.small}>Confirm your current password, then enter your new password twice.</Text><TextInput style={s.input} value={currentPassword} onChangeText={setCurrentPassword} placeholder="Current password" placeholderTextColor="#78939b" secureTextEntry autoCapitalize="none"/><TextInput style={s.input} value={settingsNewPassword} onChangeText={setSettingsNewPassword} placeholder="New password (at least 8 characters)" placeholderTextColor="#78939b" secureTextEntry autoCapitalize="none"/><TextInput style={s.input} value={settingsConfirmPassword} onChangeText={setSettingsConfirmPassword} placeholder="Confirm new password" placeholderTextColor="#78939b" secureTextEntry autoCapitalize="none"/><Button title="Update password" onPress={changeAccountPassword} disabled={authBusy}/><Button title="Sign out" outline onPress={()=>Alert.alert("Sign out?","You will need to sign in again to access Jett Pal.",[{text:"Cancel",style:"cancel"},{text:"Sign out",style:"destructive",onPress:signOut}])}/></>:<><Text style={s.small}>You are not signed in. Sign in to access your Jett Pal account.</Text><Button title="Go to sign in" onPress={()=>{setAuthMode("signin");setScreen("home");}}/></>}</View><Text style={[s.title,{marginTop:18}]}>Offline Road Routing Data</Text><View style={s.card}><Text style={s.cardTitle}>VALHALLA ROUTING ARCHIVE</Text><Text style={s.small}>Import the extracted valhalla_tiles.tar archive used for offline road routing. This is separate from the UK street map (uk.pmtiles).</Text><Text style={[s.greenText,{marginTop:10}]}>Status: {valhallaArchiveStatus}</Text>{valhallaArchivePath?<Text style={s.small}>Saved as valhalla_tiles.tar on this phone.</Text>:null}<Button title={valhallaImportBusy?"Importing archive…":valhallaArchivePath?"Replace Valhalla routing archive":"Import Valhalla routing .tar file"} disabled={valhallaImportBusy} onPress={importValhallaArchive}/><Button title="Check routing archive" outline onPress={checkValhallaArchive}/><Text style={s.foot}>The existing archive is kept until a replacement has been copied and passed the file-size check. Keep at least 3.5 GB of free space while replacing it.</Text></View><Text style={[s.title,{marginTop:18}]}>Navigation Settings</Text><View style={s.card}><Text style={s.cardTitle}>Preferred map app</Text><Text style={s.small}>Choose which app to use when you start a route. You can also choose each time you navigate.</Text>{[["google","Google Maps"],["apple","Apple Maps"]].map(([v,t])=><TouchableOpacity key={v} style={s.preference} onPress={()=>setMapPreference(v)}><View style={[s.radio,{borderColor:mapChoice===v?C.green:C.muted}]}>{mapChoice===v&&<View style={s.radioInner}/>}</View><View style={{flex:1}}><Text style={s.resultTitle}>{t}</Text><Text style={s.small}>{v==="google"?"Works on Android and iPhone":"Available on Apple devices; on Android this may open in a browser or may not be supported"}</Text></View></TouchableOpacity>)}<Button title="Ask me every time" onPress={()=>setMapPreference("ask") } outline/><Text style={[s.small,{marginTop:10}]}>Note: Apple Maps is not normally installed on Android phones. On your Moto G17, Google Maps is the reliable option; Apple Maps links may open in a browser or may not work as expected.</Text></View></ScrollView>;
 async function checkValhallaArchive(){
  try{
   const path=valhallaArchivePath||await AsyncStorage.getItem("@jett_valhalla_archive_path");
   if(!path){setValhallaArchiveStatus("Not installed");return Alert.alert("No routing archive","Import your extracted valhalla_tiles.tar file first.");}
   const info=await FileSystem.getInfoAsync(path);
   if(!info.exists){setValhallaArchivePath(null);setValhallaArchiveStatus("Archive not found on this phone");return Alert.alert("Archive missing","The saved Valhalla archive could not be found. Import it again.");}
   const size=Number(info.size||0);
   if(size<2500000000){setValhallaArchiveStatus("File incomplete · "+(size/1e9).toFixed(2)+" GB");return Alert.alert("Archive looks incomplete","The archive is "+(size/1e9).toFixed(2)+" GB. The known UK archive is approximately 2.9 GB. Keep the current file and check the source file.");}
   setValhallaArchivePath(path);setValhallaArchiveStatus((size/1e9).toFixed(2)+" GB · file check passed");
   Alert.alert("Archive file check passed","Jett Pal can find the Valhalla archive on this phone. This checks the saved file, not a live route calculation.");
  }catch(error){Alert.alert("Archive check failed",error.message||"Could not check the Valhalla archive.");}
 }
 async function importValhallaArchive(){
  try{
   const picked=await DocumentPicker.getDocumentAsync({type:["application/x-tar","application/octet-stream","*/*"],copyToCacheDirectory:false,multiple:false});
   if(picked.canceled||!picked.assets?.length)return;
   const file=picked.assets[0];
   if(!String(file.name||"").toLowerCase().endsWith(".tar"))return Alert.alert("Choose the extracted archive","Select valhalla_tiles.tar. Do not select the ZIP file.");
   setValhallaImportBusy(true);setValhallaArchiveStatus("Copying and checking archive…");
   const target=FileSystem.documentDirectory+"valhalla_tiles.tar";
   const temp=FileSystem.documentDirectory+"valhalla_tiles.importing.tar";
   const backup=FileSystem.documentDirectory+"valhalla_tiles.previous.tar";
   await FileSystem.deleteAsync(temp,{idempotent:true});
   await FileSystem.copyAsync({from:file.uri,to:temp});
   const info=await FileSystem.getInfoAsync(temp);
   const size=Number(info.size||0);
   if(!info.exists||size<2500000000){await FileSystem.deleteAsync(temp,{idempotent:true});throw new Error("The selected TAR is only "+(size/1e9).toFixed(2)+" GB. The known UK archive is approximately 2.9 GB. Your existing archive has not been changed.");}
   const old=await FileSystem.getInfoAsync(target);
   if(old.exists){await FileSystem.deleteAsync(backup,{idempotent:true});await FileSystem.moveAsync({from:target,to:backup});}
   try{await FileSystem.moveAsync({from:temp,to:target});}
   catch(error){const b=await FileSystem.getInfoAsync(backup);if(b.exists)await FileSystem.moveAsync({from:backup,to:target});throw error;}
   await FileSystem.deleteAsync(backup,{idempotent:true});
   setValhallaArchivePath(target);await AsyncStorage.setItem("@jett_valhalla_archive_path",target);
   setValhallaArchiveStatus((size/1e9).toFixed(2)+" GB · file check passed");
   Alert.alert("Valhalla archive imported","The routing archive has been saved on this phone. The existing UK street map was not changed.");
  }catch(error){setValhallaArchiveStatus(valhallaArchivePath?"Previous archive retained":"Import not completed");Alert.alert("Valhalla import failed",error.message||"Jett Pal could not import the routing archive.");}
  finally{setValhallaImportBusy(false);}
 }
 async function saveOfflineMapFile(fromUri){
  const target=FileSystem.documentDirectory+"uk.pmtiles";
  const existing=await FileSystem.getInfoAsync(target);
  if(existing.exists)await FileSystem.deleteAsync(target,{idempotent:true});
  await FileSystem.copyAsync({from:fromUri,to:target});
  const info=await FileSystem.getInfoAsync(target);
  if(!info.exists||Number(info.size||0)<1000000000)throw new Error("The UK map file appears incomplete. Please try again.");
  setOfflineMapPath(target);
  await AsyncStorage.setItem("@jett_uk_pmtiles_path",target);
 }
 async function importOfflineUKMap(){
  try{
   const picked=await DocumentPicker.getDocumentAsync({type:["application/octet-stream","*/*"],copyToCacheDirectory:true,multiple:false});
   if(picked.canceled||!picked.assets?.length)return;
   const file=picked.assets[0];
   if(!String(file.name||"").toLowerCase().endsWith(".pmtiles"))return Alert.alert("Choose the UK map file","Please select uk.pmtiles.");
   setMapImportBusy(true);
   await saveOfflineMapFile(file.uri);
   Alert.alert("UK map added","Jett Pal has saved the UK map on this phone.");
  }catch(error){Alert.alert("Map import failed",error.message||"Jett could not copy the map file.");}
  finally{setMapImportBusy(false);}
 }
 async function downloadOfflineUKMap(){
  if(!online)return Alert.alert("Internet needed","Connect to Wi-Fi or mobile data before downloading the UK map.");
  Alert.alert("Download whole UK map?","The UK street map is approximately 1.6 GB. Use Wi-Fi and make sure you have at least 3 GB of free storage.",[
   {text:"Not now",style:"cancel"},
   {text:"Download map",onPress:async()=>{
    setMapDownloadBusy(true);setMapDownloadProgress(0);
    try{
     const target=FileSystem.documentDirectory+"uk.pmtiles";
     const url="https://www.quarrymapserver.com/downloads/current/uk.pmtiles";
     const task=FileSystem.createDownloadResumable(url,target,{},progress=>{
      const total=progress.totalBytesExpectedToWrite||0;
      if(total>0)setMapDownloadProgress(Math.min(100,Math.round(progress.totalBytesWritten/total*100)));
     });
     const result=await task.downloadAsync();
     if(!result||result.status<200||result.status>=300)throw new Error("The map server did not provide the UK file. Try importing your existing map instead.");
     const info=await FileSystem.getInfoAsync(target);
     if(!info.exists||Number(info.size||0)<1000000000){if(info.exists)await FileSystem.deleteAsync(target,{idempotent:true});throw new Error("The downloaded file is smaller than expected. Try again later or import your existing uk.pmtiles file.");}
     setOfflineMapPath(target);
     await AsyncStorage.setItem("@jett_uk_pmtiles_path",target);
     setMapDownloadProgress(100);
     Alert.alert("UK map downloaded","Jett Pal has saved the whole UK map for offline use.");
    }catch(error){Alert.alert("Download unavailable",error.message||"Try importing your downloaded uk.pmtiles file.");}
    finally{setMapDownloadBusy(false);}
   }}
  ]);
 }
 const mapStyle=offlineMapPath?{
  version:8,
  glyphs:"https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf",
  sources:{uk:{type:"vector",url:"pmtiles://"+offlineMapPath,attribution:"© OpenStreetMap contributors · Quarry / Protomaps"}},
  layers:[
   {id:"background",type:"background",paint:{"background-color":"#e9eee8"}},
   {id:"earth",type:"fill",source:"uk","source-layer":"earth",paint:{"fill-color":"#e9eee8"}},
   {id:"landuse",type:"fill",source:"uk","source-layer":"landuse",paint:{"fill-color":"#dce8d6","fill-opacity":0.8}},
   {id:"water",type:"fill",source:"uk","source-layer":"water",paint:{"fill-color":"#a9d4e8"}},
   {id:"buildings",type:"fill",source:"uk","source-layer":"buildings",minzoom:13,paint:{"fill-color":"#d5cfc4","fill-outline-color":"#c3bcae"}},
   {id:"buildings-3d",type:"fill-extrusion",source:"uk","source-layer":"buildings",minzoom:14,layout:{"visibility":mapViewMode==="3d"?"visible":"none"},paint:{"fill-extrusion-color":"#c9bda9","fill-extrusion-height":["coalesce",["to-number",["get","render_height"]],["to-number",["get","height"]],["*",["to-number",["coalesce",["get","building:levels"],3]],3]],"fill-extrusion-base":0,"fill-extrusion-opacity":0.92,"fill-extrusion-vertical-gradient":true}},
   {id:"roads",type:"line",source:"uk","source-layer":"roads",paint:{"line-color":"#ffffff","line-width":["interpolate",["linear"],["zoom"],5,0.5,10,1.2,14,3,16,5],"line-opacity":0.95}},
   {id:"place-labels",type:"symbol",source:"uk","source-layer":"places",minzoom:5,layout:{"text-field":["coalesce",["get","name:en"],["get","name"]],"text-font":["Noto Sans Regular"],"text-size":["interpolate",["linear"],["zoom"],5,10,10,13,14,16],"text-max-width":8,"text-allow-overlap":false},paint:{"text-color":"#344b48","text-halo-color":"#ffffff","text-halo-width":1.5}},
   {id:"road-labels",type:"symbol",source:"uk","source-layer":"roads",minzoom:11,layout:{"symbol-placement":"line","text-field":["coalesce",["get","name:en"],["get","name"]],"text-font":["Noto Sans Regular"],"text-size":["interpolate",["linear"],["zoom"],11,10,14,12,17,14],"text-max-angle":30,"text-max-width":8,"text-keep-upright":true,"text-allow-overlap":false},paint:{"text-color":"#52615e","text-halo-color":"#ffffff","text-halo-width":1.5}}
  ]
 }:null;
 const locatedMapStops=stops.filter(x=>x.lat!==null&&x.lon!==null&&Number.isFinite(Number(x.lat))&&Number.isFinite(Number(x.lon)));
 const mapBounds=locatedMapStops.length?locatedMapStops.reduce((b,x)=>({minLon:Math.min(b.minLon,Number(x.lon)),maxLon:Math.max(b.maxLon,Number(x.lon)),minLat:Math.min(b.minLat,Number(x.lat)),maxLat:Math.max(b.maxLat,Number(x.lat))}),{minLon:Number(locatedMapStops[0].lon),maxLon:Number(locatedMapStops[0].lon),minLat:Number(locatedMapStops[0].lat),maxLat:Number(locatedMapStops[0].lat)}):null;
 const mapCenter=mapBounds?[(mapBounds.minLon+mapBounds.maxLon)/2,(mapBounds.minLat+mapBounds.maxLat)/2]:[1.7,52.6];
 const mapSpan=mapBounds?Math.max(mapBounds.maxLon-mapBounds.minLon,(mapBounds.maxLat-mapBounds.minLat)*1.4,0.008):1;
 const mapZoom=mapBounds?Math.max(5,Math.min(14,Math.floor(Math.log2(360/mapSpan))-1)):11;
 const nextOfflineStop=stops.find(x=>!x.done);
 const navigationStepData=useMemo(()=>{
  if(!routeSteps.length)return null;
  const metres=(a,b)=>{const rad=v=>v*Math.PI/180,dLat=rad(b[1]-a.latitude),dLon=rad(b[0]-a.longitude),q=Math.sin(dLat/2)**2+Math.cos(rad(a.latitude))*Math.cos(rad(b[1]))*Math.sin(dLon/2)**2;return 6371000*2*Math.atan2(Math.sqrt(q),Math.sqrt(1-q));};
  if(!driverPosition)return {step:routeSteps[0],nextStep:routeSteps[1]||null,distanceMeters:null};
  let bestIndex=0,bestDistance=Infinity;
  routeSteps.forEach((step,index)=>{if(!step.location)return;const d=metres(driverPosition,step.location);if(d<bestDistance){bestDistance=d;bestIndex=index;}});
  if(bestDistance<22&&bestIndex<routeSteps.length-1)bestIndex++;
  const step=routeSteps[bestIndex]||routeSteps[0];
  return {step,nextStep:routeSteps[bestIndex+1]||null,distanceMeters:step?.location?metres(driverPosition,step.location):null};
 },[routeSteps,driverPosition]);
 const distanceToNext=driverPosition&&nextOfflineStop&&nextOfflineStop.lat!=null&&nextOfflineStop.lon!=null?(()=>{const rad=v=>v*Math.PI/180;const dLat=rad(Number(nextOfflineStop.lat)-driverPosition.latitude),dLon=rad(Number(nextOfflineStop.lon)-driverPosition.longitude);const a=Math.sin(dLat/2)**2+Math.cos(rad(driverPosition.latitude))*Math.cos(rad(Number(nextOfflineStop.lat)))*Math.sin(dLon/2)**2;return 6371*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));})():null;
 async function startOfflineRoute(){if(!offlineMapPath)return Alert.alert("Offline map required","Download or import the UK map first.");if(!stops.length)return Alert.alert("No stops","Import a delivery list first.");if(stops.some(x=>x.lat==null||x.lon==null))return Alert.alert("Locate stops first","Connect to the internet and find coordinates for every stop.");try{const p=await Location.requestForegroundPermissionsAsync();if(p.status!=="granted")return Alert.alert("Location permission needed","Allow location access while using Jett Pal.");const pos=await Location.getCurrentPositionAsync({accuracy:Location.Accuracy.High});if(pos.coords.accuracy&&pos.coords.accuracy>100)Alert.alert("GPS signal is weak","Move somewhere with a clearer view of the sky. Jett will keep trying to improve the GPS fix.");setMapCameraReady(false);setDriverPosition(pos.coords);setGpsAccuracy(pos.coords.accuracy??null);setGpsSpeed(pos.coords.speed??null);setGpsHeading(pos.coords.heading>=0?pos.coords.heading:null);setOfflineNavActive(true);setOfflineMapExpanded(true);setTab("Map");setScreen("map");}catch(e){Alert.alert("Location unavailable",e.message||"Check that phone location is switched on.");}}
 useEffect(()=>{let active=true;(async()=>{
  const valid=stops.filter(x=>Number.isFinite(Number(x.lat))&&Number.isFinite(Number(x.lon)));
  if(valid.length<1){setRouteGeoJSON(null);setRouteGeometryStatus("Add at least one located address");return;}
  let routePoints=valid;
  if(valid.length===1){if(!offlineNavActive||!driverPosition){setRouteGeoJSON(null);setRouteGeometryStatus("Ready — start navigation to route from your GPS to this address");return;}routePoints=[{id:"current-gps",lat:driverPosition.latitude,lon:driverPosition.longitude},valid[0]];}
  const signature=routePoints.map(x=>x.id+":"+Number(x.lat).toFixed(5)+","+Number(x.lon).toFixed(5)).join("|");
  try{const saved=await AsyncStorage.getItem("@jett_route_geojson");if(active&&saved){const parsed=JSON.parse(saved);if(parsed.signature===signature&&parsed.geometry){setRouteGeoJSON(parsed.geometry);setRouteSteps(Array.isArray(parsed.steps)?parsed.steps:[]);setRouteGeometryStatus("Saved road route");return;}}}catch{}
  if(!online){if(active)setRouteGeometryStatus("Offline — using saved route if available");return;}
  try{
   setRouteGeometryStatus("Calculating road route…");
   const coords=routePoints.map(p=>Number(p.lon)+","+Number(p.lat)).join(";");
   const response=await fetch("https://router.project-osrm.org/route/v1/driving/"+coords+"?overview=full&geometries=geojson&steps=true");
   const data=await response.json();
   if(!response.ok||data.code!=="Ok"||!data.routes?.[0]?.geometry?.coordinates?.length)throw new Error(data.message||"Road route unavailable");
   const geometry={type:"Feature",properties:{},geometry:data.routes[0].geometry};
   const steps=(data.routes[0].legs||[]).flatMap(leg=>(leg.steps||[]).map(step=>({instruction:[step.maneuver?.modifier,step.name].filter(Boolean).join(" onto ")||step.maneuver?.type||"Continue",type:step.maneuver?.type||"turn",modifier:step.maneuver?.modifier||"",distance:Number(step.distance)||0,location:step.maneuver?.location||null}))).filter(step=>step.location);
   if(active){setRouteGeoJSON(geometry);setRouteSteps(steps);setRouteGeometryStatus("Road route loaded");await AsyncStorage.setItem("@jett_route_geojson",JSON.stringify({signature,geometry,steps}));}
  }catch(error){if(active)setRouteGeometryStatus(error.message||"Could not calculate road route");}
 })();return()=>{active=false;};},[stops,online,offlineNavActive]);
 async function rerouteFromPosition(position){
  if(!online||reroutingRef.current||!position)return;
  const now=Date.now();if(now-lastRerouteAt.current<20000)return;
  const remaining=stops.filter(x=>!x.done&&Number.isFinite(Number(x.lat))&&Number.isFinite(Number(x.lon)));
  if(!remaining.length)return;
  reroutingRef.current=true;lastRerouteAt.current=now;setRouteGeometryStatus("Driver off route — recalculating…");
  try{
   const points=[{lat:position.latitude,lon:position.longitude},...remaining];
   const coords=points.map(p=>Number(p.lon)+","+Number(p.lat)).join(";");
   const response=await fetch("https://router.project-osrm.org/route/v1/driving/"+coords+"?overview=full&geometries=geojson&steps=true");
   const data=await response.json();
   if(!response.ok||data.code!=="Ok"||!data.routes?.[0]?.geometry?.coordinates?.length)throw new Error(data.message||"New road route unavailable");
   const geometry={type:"Feature",properties:{},geometry:data.routes[0].geometry};
   const steps=(data.routes[0].legs||[]).flatMap(leg=>(leg.steps||[]).map(step=>({instruction:[step.maneuver?.modifier,step.name].filter(Boolean).join(" onto ")||step.maneuver?.type||"Continue",type:step.maneuver?.type||"turn",modifier:step.maneuver?.modifier||"",distance:Number(step.distance)||0,location:step.maneuver?.location||null}))).filter(step=>step.location);
   setRouteGeoJSON(geometry);setRouteSteps(steps);setRouteGeometryStatus("Rerouted from current GPS position");
   await AsyncStorage.setItem("@jett_route_geojson",JSON.stringify({signature:"live-reroute:"+points.map(p=>Number(p.lat).toFixed(5)+","+Number(p.lon).toFixed(5)).join("|"),geometry,steps}));
  }catch(error){setRouteGeometryStatus("Reroute failed — "+(error.message||"try again"));}
  finally{reroutingRef.current=false;}
 }
 useEffect(()=>{if(!driverPosition||!routeGeoJSON?.geometry?.coordinates?.length){setSnappedDriverPosition(null);return;}const coords=routeGeoJSON.geometry.coordinates;const lat0=driverPosition.latitude*Math.PI/180;const scaleX=111320*Math.cos(lat0),scaleY=110540;let best=null,bestDistance=Infinity;for(let i=0;i<coords.length-1;i++){const ax=(coords[i][0]-driverPosition.longitude)*scaleX,ay=(coords[i][1]-driverPosition.latitude)*scaleY,bx=(coords[i+1][0]-driverPosition.longitude)*scaleX,by=(coords[i+1][1]-driverPosition.latitude)*scaleY;const dx=bx-ax,dy=by-ay,len=dx*dx+dy*dy;const t=len?Math.max(0,Math.min(1,-(ax*dx+ay*dy)/len)):0;const px=ax+t*dx,py=ay+t*dy,d=Math.hypot(px,py);if(d<bestDistance){bestDistance=d;best=[coords[i][0]+t*(coords[i+1][0]-coords[i][0]),coords[i][1]+t*(coords[i+1][1]-coords[i][1])];}}if(best&&bestDistance<=60)setSnappedDriverPosition({longitude:best[0],latitude:best[1]});else setSnappedDriverPosition(null);},[driverPosition,routeGeoJSON]);
 useEffect(()=>{if(!offlineNavActive||!mapCameraReady||!driverPosition)return;let first=null,second=null;const moveCamera=()=>{const camera=mapCameraRef.current;if(!camera||typeof camera.easeTo!=="function")return;try{camera.easeTo({center:[driverPosition.longitude,driverPosition.latitude],zoom:navZoom,bearing:gpsHeading!=null?gpsHeading:0,pitch:mapViewMode==="3d"?58:42,duration:700,easing:"ease"});}catch(error){console.warn("Jett offline navigation camera failed",error);}};first=setTimeout(moveCamera,350);second=setTimeout(moveCamera,1100);return()=>{if(first)clearTimeout(first);if(second)clearTimeout(second);};},[offlineNavActive,mapCameraReady,driverPosition,gpsHeading,mapViewMode,navZoom]);
 useEffect(()=>{if(!offlineNavActive)return;let subscription=null;let active=true;(async()=>{try{subscription=await Location.watchPositionAsync({accuracy:Location.Accuracy.BestForNavigation,timeInterval:1000,distanceInterval:2},position=>{if(!active)return;const c=position.coords;if(!Number.isFinite(c.latitude)||!Number.isFinite(c.longitude))return;if(c.accuracy!=null&&c.accuracy>80)return;setDriverPosition(c);setGpsAccuracy(c.accuracy??null);setGpsSpeed(c.speed!=null&&c.speed>=0?c.speed:null);setGpsHeading(c.heading!=null&&c.heading>=0?c.heading:null);if(routeGeoJSON?.geometry?.coordinates?.length){const coords=routeGeoJSON.geometry.coordinates;let nearest=Infinity;for(const point of coords){const dx=(Number(point[0])-c.longitude)*111320*Math.cos(c.latitude*Math.PI/180),dy=(Number(point[1])-c.latitude)*110540;nearest=Math.min(nearest,Math.hypot(dx,dy));}if(nearest>80)rerouteFromPosition(c);}});}catch(error){Alert.alert("Live GPS unavailable",error.message||"Jett could not start continuous location tracking.");setOfflineNavActive(false);}})();return()=>{active=false;if(subscription)subscription.remove();};},[offlineNavActive,routeGeoJSON,stops,online]);
 function changeMapZoom(delta){const next=offlineNavActive?Math.max(14,Math.min(21,navZoom+delta)):Math.max(3,Math.min(20,mapZoom+mapZoomDelta+delta));if(offlineNavActive)setNavZoom(next);else setMapZoomDelta(mapZoomDelta+delta);const center=offlineNavActive&&driverPosition?[driverPosition.longitude,driverPosition.latitude]:mapCenter;try{mapCameraRef.current?.easeTo({center,zoom:next,bearing:offlineNavActive&&gpsHeading!=null?gpsHeading:0,pitch:offlineNavActive?(mapViewMode==="3d"?58:42):(mapViewMode==="3d"?50:0),duration:350,easing:"ease"});}catch(error){console.warn("Map zoom control failed",error);}}
 async function recenterMap(){try{let position=driverPosition;if(!position){const fix=await Location.getCurrentPositionAsync({accuracy:Location.Accuracy.High});position=fix.coords;setDriverPosition(position);}mapCameraRef.current?.easeTo({center:[position.longitude,position.latitude],zoom:offlineNavActive?navZoom:Math.max(14,mapZoom+mapZoomDelta),bearing:offlineNavActive&&gpsHeading!=null?gpsHeading:0,pitch:offlineNavActive?(mapViewMode==="3d"?58:42):(mapViewMode==="3d"?50:0),duration:600,easing:"ease"});}catch(error){Alert.alert("Location unavailable",error.message||"Could not get your current GPS position.");}}
 async function completeOfflineStop(){const current=stops.find(x=>!x.done);if(!current)return;const updated=stops.map(x=>x.id===current.id?{...x,done:true}:x);setStops(updated);await AsyncStorage.setItem(CURRENT,JSON.stringify(updated));}
 const offlineMapPanel=()=> <View style={offlineMapExpanded?{flex:1,backgroundColor:C.bg}:{height:470,borderRadius:15,overflow:"hidden",marginTop:12,borderWidth:1,borderColor:C.line}}>
   <MapLibreMap style={{flex:1}} mapStyle={mapStyle}
    onWillStartLoadingMap={()=>{setMapCameraReady(false);setMapLoadStatus("Loading map style…")}}
    onDidFinishLoadingMap={()=>{setMapCameraReady(true);setMapLoadStatus("Map style loaded. Checking map tiles…")}}
    onDidFailLoadingMap={()=>setMapLoadStatus("Map style failed to load. Check that the imported map contains building and road layers.")}
    onDidFinishRenderingMapFully={()=>setMapLoadStatus("Map rendered successfully.")}>
    <MapCamera ref={mapCameraRef} key={offlineNavActive?"live-navigation":"route-overview"} center={offlineNavActive&&driverPosition?[driverPosition.longitude,driverPosition.latitude]:mapCenter} zoom={offlineNavActive?navZoom:Math.max(3,Math.min(20,mapZoom+mapZoomDelta))} pitch={offlineNavActive?(mapViewMode==="3d"?58:42):(mapViewMode==="3d"?50:0)} bearing={offlineNavActive&&gpsHeading!=null?gpsHeading:0} duration={offlineNavActive?700:0} easing="ease" initialViewState={{center:offlineNavActive&&driverPosition?[driverPosition.longitude,driverPosition.latitude]:mapCenter,zoom:offlineNavActive?navZoom:Math.max(3,Math.min(20,mapZoom+mapZoomDelta)),pitch:offlineNavActive?(mapViewMode==="3d"?58:42):(mapViewMode==="3d"?50:0),bearing:offlineNavActive&&gpsHeading!=null?gpsHeading:0}} />
     {routeGeoJSON?<GeoJSONSource id="delivery-road-route" data={routeGeoJSON} maxzoom={22} tolerance={0}><Layer id="delivery-road-route-casing" type="line" layerIndex={900} layout={{"line-cap":"round","line-join":"round"}} paint={{"line-color":"#ffffff","line-width":13,"line-opacity":1}}/><Layer id="delivery-road-route-line" type="line" layerIndex={901} layout={{"line-cap":"round","line-join":"round"}} paint={{"line-color":"#0878ff","line-width":8,"line-opacity":1}}/><Layer id="delivery-road-route-arrows" type="symbol" layerIndex={902} layout={{"symbol-placement":"line","symbol-spacing":90,"text-field":"▶","text-font":["Noto Sans Regular"],"text-size":13,"text-keep-upright":true,"text-rotation-alignment":"map","text-allow-overlap":true,"text-ignore-placement":true}} paint={{"text-color":"#064fa8","text-halo-color":"#ffffff","text-halo-width":2}}/></GeoJSONSource>:null}
     <GeoJSONSource id="delivery-stops" data={{type:"FeatureCollection",features:stops.filter(x=>x.lat!=null&&x.lon!=null).map((stop,index)=>({type:"Feature",id:String(stop.id||index),properties:{order:String(index+1)},geometry:{type:"Point",coordinates:[Number(stop.lon),Number(stop.lat)]}}))}}>
      <Layer id="delivery-stop-circles" type="circle" paint={{"circle-radius":15,"circle-color":C.green,"circle-stroke-color":"#ffffff","circle-stroke-width":2}}/>
      <Layer id="delivery-stop-numbers" type="symbol" layout={{"text-field":["get","order"],"text-font":["Noto Sans Regular"],"text-size":12,"text-allow-overlap":true}} paint={{"text-color":"#062010"}}/>
     </GeoJSONSource>
     {(snappedDriverPosition||driverPosition)?<GeoJSONSource id="driver-location" data={{type:"Feature",geometry:{type:"Point",coordinates:[(snappedDriverPosition||driverPosition).longitude,(snappedDriverPosition||driverPosition).latitude]},properties:{heading:gpsHeading??0}}}>
      <Layer id="driver-location-halo" type="circle" paint={{"circle-radius":13,"circle-color":"#ffffff","circle-opacity":0.95}}/>
      <Layer id="driver-location-dot" type="circle" paint={{"circle-radius":8,"circle-color":"#168cff","circle-stroke-color":"#ffffff","circle-stroke-width":2}}/>
      {gpsHeading!=null?<Layer id="driver-direction-arrow" type="symbol" layout={{"text-field":"▲","text-font":["Noto Sans Regular"],"text-size":23,"text-rotate":["get","heading"],"text-rotation-alignment":"map","text-allow-overlap":true,"text-ignore-placement":true}} paint={{"text-color":"#0757b8","text-halo-color":"#ffffff","text-halo-width":2}}/>:null}
     </GeoJSONSource>:null}
   </MapLibreMap>
   {offlineNavActive&&navigationStepData?.step?<View pointerEvents="none" style={{position:"absolute",top:108,left:10,right:10,backgroundColor:"rgba(4,16,25,0.96)",borderRadius:14,borderWidth:1.5,borderColor:C.green,paddingHorizontal:14,paddingVertical:12}}>
    <View style={{flexDirection:"row",alignItems:"center",gap:12}}>
     <View style={{width:54,height:54,borderRadius:12,backgroundColor:C.green,alignItems:"center",justifyContent:"center"}}>
      <Text style={{fontSize:29,color:"#062010",fontWeight:"900"}}>{navigationStepData.step.modifier==="left"?"↰":navigationStepData.step.modifier==="right"?"↱":navigationStepData.step.modifier==="uturn"?"↶":"↑"}</Text>
     </View>
     <View style={{flex:1}}>
      <Text style={{color:C.green2,fontSize:10,fontWeight:"900",letterSpacing:1}}>NEXT DIRECTION</Text>
      <Text numberOfLines={2} style={{color:"#ffffff",fontSize:18,fontWeight:"900",marginTop:3}}>{navigationStepData.step.instruction}</Text>
      <Text style={{color:"#d5e3e7",fontSize:12,marginTop:3}}>{navigationStepData.distanceMeters==null?"Calculating distance…":navigationStepData.distanceMeters>=1000?(navigationStepData.distanceMeters/1000).toFixed(1)+" km":Math.max(0,Math.round(navigationStepData.distanceMeters))+" m"} to manoeuvre</Text>
     </View>
    </View>
    {navigationStepData.nextStep?<Text numberOfLines={1} style={{color:"#b7c8cd",fontSize:11,marginTop:9}}>THEN: {navigationStepData.nextStep.instruction}</Text>:<Text style={{color:C.green2,fontSize:11,fontWeight:"900",marginTop:9}}>FINAL ROUTE INSTRUCTION</Text>}
   </View>:offlineNavActive?<View pointerEvents="none" style={{position:"absolute",top:108,left:10,right:10,backgroundColor:"rgba(4,16,25,0.96)",borderRadius:12,padding:13,borderWidth:1,borderColor:C.orange}}><Text style={{color:"#ffffff",fontWeight:"900"}}>Directions not ready</Text><Text style={{color:"#d5e3e7",fontSize:11,marginTop:4}}>{routeGeometryStatus}. Connect to the internet once to calculate and save road directions for offline use.</Text></View>:null}
   <View style={{position:"absolute",top:offlineNavActive?48:10,left:10,right:10,flexDirection:"row",justifyContent:"space-between",alignItems:"center"}}>
    <View style={{flexDirection:"row",backgroundColor:"rgba(4,16,25,0.92)",borderRadius:10,padding:4}}>
     {["2d","3d"].map(mode=><TouchableOpacity key={mode} onPress={()=>setMapViewMode(mode)} style={{paddingHorizontal:15,paddingVertical:10,borderRadius:7,backgroundColor:mapViewMode===mode?C.green:"transparent"}}><Text style={{fontWeight:"900",color:mapViewMode===mode?"#062010":"#ffffff"}}>{mode.toUpperCase()}</Text></TouchableOpacity>)}
    </View>
    <TouchableOpacity onPress={()=>setOfflineMapExpanded(v=>!v)} style={{backgroundColor:"rgba(4,16,25,0.94)",paddingHorizontal:14,paddingVertical:11,borderRadius:9}}><Text style={{color:"#ffffff",fontWeight:"900"}}>{offlineMapExpanded?"CLOSE MAP":"⛶ ENLARGE"}</Text></TouchableOpacity>
   </View>
   {offlineNavActive?<View pointerEvents="none" style={{position:"absolute",right:14,top:360,backgroundColor:"rgba(4,16,25,0.94)",borderWidth:1,borderColor:"#ffffff",borderRadius:24,paddingHorizontal:12,paddingVertical:8,flexDirection:"row",alignItems:"center",gap:7}}><Text style={{color:"#ffffff",fontSize:19,fontWeight:"900",transform:[{rotate:(-(gpsHeading??0))+"deg"}]}}>↑</Text><View><Text style={{color:C.green2,fontSize:11,fontWeight:"900"}}>NORTH</Text><Text style={{color:"#ffffff",fontSize:10}}>{gpsHeading!=null?Math.round(gpsHeading)+"° heading":"Compass waiting"}</Text></View></View>:null}
   <View style={{position:"absolute",right:12,bottom:92,alignItems:"center",gap:9}}>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Zoom in" onPress={()=>changeMapZoom(1)} style={{width:50,height:50,borderRadius:12,backgroundColor:"rgba(4,16,25,0.96)",borderWidth:1,borderColor:"#ffffff",alignItems:"center",justifyContent:"center"}}><Text style={{color:"#ffffff",fontSize:29,fontWeight:"900"}}>+</Text></TouchableOpacity>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Zoom out" onPress={()=>changeMapZoom(-1)} style={{width:50,height:50,borderRadius:12,backgroundColor:"rgba(4,16,25,0.96)",borderWidth:1,borderColor:"#ffffff",alignItems:"center",justifyContent:"center"}}><Text style={{color:"#ffffff",fontSize:29,fontWeight:"900"}}>−</Text></TouchableOpacity>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Centre map on my location" onPress={recenterMap} style={{width:50,height:50,borderRadius:12,backgroundColor:C.green,borderWidth:1,borderColor:"#ffffff",alignItems:"center",justifyContent:"center"}}><Text style={{color:"#062010",fontSize:24,fontWeight:"900"}}>◎</Text></TouchableOpacity>
   </View>
   <View style={{position:"absolute",left:8,right:8,bottom:8,backgroundColor:"rgba(255,255,255,0.94)",paddingHorizontal:8,paddingVertical:7,borderRadius:6}}><Text style={{fontSize:10,color:"#18313a"}}>{mapLoadStatus} · {mapViewMode.toUpperCase()} view · {routeGeometryStatus}</Text><Text style={{fontSize:9,color:"#18313a",marginTop:3}}>Building outlines appear where included in the offline map. 3D height depends on available building data.</Text></View>
  </View>;
 const mapScreen=()=> offlineMapExpanded?<View style={{flex:1,backgroundColor:C.bg}}>{offlineMapPanel()}</View>:<ScrollView contentContainerStyle={s.content}><Header/><Text style={s.title}>Jett Offline UK Map</Text>
  <View style={s.card}>
   <Text style={s.cardTitle}>OFFLINE NAVIGATION — FIRST STAGE</Text>
   {offlineNavActive&&nextOfflineStop?<><Text style={s.resultTitle}>NEXT STOP: {nextOfflineStop.name||nextOfflineStop.address}</Text><Text style={s.small}>{[nextOfflineStop.town,nextOfflineStop.postcode].filter(Boolean).join(" ")}</Text><Text style={[s.greenText,{marginTop:8}]}>{distanceToNext!=null?distanceToNext.toFixed(2)+" km direct distance":"GPS position updating…"}</Text>{driverPosition&&Number.isFinite(Number(nextOfflineStop.lat))&&Number.isFinite(Number(nextOfflineStop.lon))?<Text style={s.small}>Direction to stop: {compassLabel(bearingBetween(driverPosition.latitude,driverPosition.longitude,Number(nextOfflineStop.lat),Number(nextOfflineStop.lon)))} · {Math.round(bearingBetween(driverPosition.latitude,driverPosition.longitude,Number(nextOfflineStop.lat),Number(nextOfflineStop.lon)))}°</Text>:null}<Text style={s.small}>GPS accuracy: {gpsAccuracy!=null?Math.round(gpsAccuracy)+" m":"waiting"} · Speed: {gpsSpeed!=null?Math.max(0,gpsSpeed*3.6).toFixed(0)+" km/h":"—"} · Heading: {gpsHeading!=null?Math.round(gpsHeading)+"°":"—"}</Text><Text style={s.small}>Live GPS updates are active. The blue GPS marker snaps to the saved route when within 60 metres. {routeSteps.length?"Road instructions are available while the saved route is loaded.":"Road instructions are not available until a road route is calculated."}</Text>{routeSteps.length>0?<View style={[s.card,{marginTop:10}]}><Text style={s.cardTitle}>NEXT ROAD INSTRUCTION</Text><Text style={s.resultTitle}>{routeSteps[0].instruction}</Text><Text style={s.small}>{routeSteps[0].distance>=1000?(routeSteps[0].distance/1000).toFixed(1)+" km":Math.round(routeSteps[0].distance)+" m"}</Text></View>:null}<Button title="Mark this stop complete" onPress={completeOfflineStop}/><Button title="Stop offline route" outline onPress={()=>{setOfflineNavActive(false);setOfflineMapExpanded(false);}}/></>:<><Text style={s.small}>Start a delivery session using your saved map and stop coordinates. Live GPS tracking works without mobile data when location services are available.</Text><Button title="Start Offline Route" onPress={startOfflineRoute}/></>}
  </View>
  <View style={s.card}>
   <Text style={s.cardTitle}>CURRENT DELIVERY ROUTE</Text>
   <Text style={s.small}>{stops.length} imported stops · numbered in delivery order</Text>
   {stops.length?stops.map((stop,index)=><View key={stop.id} style={s.stop}>
    <View style={s.number}><Text style={s.numberText}>{index+1}</Text></View>
    <View style={{flex:1}}><Text style={s.resultTitle}>{stop.name||stop.address}</Text><Text style={s.small}>{[stop.town,stop.postcode].filter(Boolean).join(" ")}</Text></View>
    <Text style={[s.small,{color:stop.done?C.green:C.orange}]}>{stop.done?"Done":"Pending"}</Text>
   </View>):<Text style={s.small}>Import a delivery list or add addresses to see your stops here.</Text>}
   <Text style={[s.small,{marginTop:10}]}>Located stops: {stops.filter(x=>x.lat!=null&&x.lon!=null).length} of {stops.length}</Text><Button title={busy?"Locating addresses…":"Find coordinates for delivery stops"} disabled={busy||!stops.length} onPress={locateRouteStops} outline/>
  </View>
  <View style={s.card}>
   <Text style={s.cardTitle}>WHOLE UK STREET MAP</Text>
   <Text style={s.small}>{offlineMapPath?"Your UK map is saved on this phone and available offline.":"Download the whole UK street map inside Jett Pal, or import a file you already have."}</Text>
   <Button title={mapDownloadBusy?"Downloading UK map…":offlineMapPath?"Download map update":"Download UK map (about 1.6 GB)"} disabled={mapDownloadBusy||mapImportBusy} onPress={downloadOfflineUKMap}/>
   {mapDownloadBusy?<View style={{marginTop:12}}><Text style={s.greenText}>{mapDownloadProgress}% downloaded</Text><View style={{height:9,backgroundColor:C.bg,borderRadius:8,overflow:"hidden",marginTop:7}}><View style={{height:9,width:mapDownloadProgress+"%",backgroundColor:C.green}}/></View><Text style={s.small}>Keep Jett open while the download finishes.</Text></View>:null}
   <Button title={mapImportBusy?"Importing map…":"I already downloaded the map — Import file"} disabled={mapDownloadBusy||mapImportBusy} onPress={importOfflineUKMap} outline/>
   {offlineMapPath?<Text style={[s.greenText,{marginTop:8}]}>✓ UK offline map installed in Jett Pal</Text>:null}
  </View>
  {offlineMapPath?offlineMapPanel():<View style={s.mapPlaceholder}><Text style={s.mapPin}>⌖</Text><Text style={s.cardTitle}>Your UK map is ready to import</Text><Text style={s.small}>Once imported, Jett will display the saved UK map here.</Text></View>}
  <Button title="Navigate — choose Google Maps or offline map" onPress={()=>{if(stops.length)openNavigation(stops[stops.length-1],stops);else Alert.alert("No stops","Add stops first.");}} outline/>
  {stops.map((x,i)=><Text key={x.id} style={s.feature}>{i+1}. {x.name} — {x.postcode||x.town}</Text>)}
 </ScrollView>;
 const completionScreen=()=>{const item=stops.find(x=>x.id===selectedDeliveryId);if(!item)return <ScrollView contentContainerStyle={s.content}><Header/><Text style={s.title}>Delivery Report</Text><Text style={s.small}>No property selected. Return to Delivery Manager.</Text><Button title="Back to Delivery Manager" onPress={()=>{setScreen("deliveries");setTab("Home");}}/></ScrollView>;return <ScrollView contentContainerStyle={s.content}><Header/><Text style={s.title}>Delivery Report</Text><View style={s.card}><Text style={s.cardTitle}>{item.name}</Text><Text style={s.small}>{item.town} {item.postcode}</Text><Text style={[s.small,{marginTop:8}]}>Required: {Number(item.wheelieBins||0)} wheelie bins · {Number(item.foodCaddies||0)} food caddies</Text></View><Text style={s.cardTitle}>DELIVERY OUTCOME</Text>{["Delivered","Partially delivered","No access","Wrong address","Damaged item","Customer not home"].map(v=><TouchableOpacity key={v} style={s.preference} onPress={()=>setDeliveryOutcome(v)}><View style={[s.radio,{borderColor:deliveryOutcome===v?C.green:C.muted}]}>{deliveryOutcome===v&&<View style={s.radioInner}/>}</View><Text style={s.resultTitle}>{v}</Text></TouchableOpacity>)}<View style={s.card}><Text style={s.cardTitle}>ACTUALLY DELIVERED</Text><Text style={s.small}>Wheelie bins (max {Number(item.wheelieBins||0)})</Text><TextInput style={s.input} keyboardType="number-pad" value={actualWheelieQty} onChangeText={setActualWheelieQty} placeholder="Bins delivered" placeholderTextColor="#78939b"/><Text style={s.small}>Food waste caddies (max {Number(item.foodCaddies||0)})</Text><TextInput style={s.input} keyboardType="number-pad" value={actualCaddyQty} onChangeText={setActualCaddyQty} placeholder="Caddies delivered" placeholderTextColor="#78939b"/><Text style={s.small}>Delivery notes / reason</Text><TextInput style={[s.input,{minHeight:100,textAlignVertical:"top"}]} multiline value={deliveryNotes} onChangeText={setDeliveryNotes} placeholder="Add details about the delivery or problem..." placeholderTextColor="#78939b"/></View><Button title="Save Delivery Report" onPress={saveCompletion}/><Button title="Cancel" outline onPress={()=>{setScreen("deliveries");setTab("Home");}}/></ScrollView>;};
 const authScreen=()=> <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={{flexGrow:1,justifyContent:"center",padding:22}}><View style={{alignItems:"center",marginBottom:28}}>{logo}<Text style={{color:C.text,fontSize:29,fontWeight:"900",marginTop:12}}>Jett Pal</Text><Text style={{color:C.muted,marginTop:5}}>Jett Distribution operations</Text></View><View style={s.card}><Text style={s.cardTitle}>{authRecovery?"Choose a new password":authMode==="signup"?"Create your account":"Welcome back"}</Text><Text style={s.small}>{authRecovery?"Enter a new password for your Jett Pal account.": "Sign in to access your company's Jett Pal workspace."}</Text>{authRecovery?<><View style={s.passwordRow}><TextInput style={[s.input,s.passwordInput]} value={authNewPassword} onChangeText={setAuthNewPassword} placeholder="New password (at least 8 characters)" placeholderTextColor="#78939b" secureTextEntry={!showRecoveryPassword} autoCapitalize="none"/><TouchableOpacity style={s.passwordToggle} onPress={()=>setShowRecoveryPassword(v=>!v)} accessibilityRole="button" accessibilityLabel={showRecoveryPassword?"Hide password":"Show password"}><Text style={s.passwordToggleText}>{showRecoveryPassword?"Hide":"Show"}</Text></TouchableOpacity></View><TouchableOpacity style={[s.button,{opacity:authBusy?0.6:1}]} disabled={authBusy} onPress={saveNewPassword}><Text style={s.buttonText}>{authBusy?"Please wait…":"Update password"}</Text></TouchableOpacity></>:<>{authMode==="signup"? <TextInput style={s.input} value={authName} onChangeText={setAuthName} placeholder="Full name" placeholderTextColor="#78939b" autoCapitalize="words"/>:null}<TextInput style={s.input} value={authEmail} onChangeText={setAuthEmail} placeholder="Email address" placeholderTextColor="#78939b" keyboardType="email-address" autoCapitalize="none" autoCorrect={false}/><View style={s.passwordRow}><TextInput style={[s.input,s.passwordInput]} value={authPassword} onChangeText={setAuthPassword} placeholder="Password (at least 8 characters)" placeholderTextColor="#78939b" secureTextEntry={!showAuthPassword} autoCapitalize="none"/><TouchableOpacity style={s.passwordToggle} onPress={()=>setShowAuthPassword(v=>!v)} accessibilityRole="button" accessibilityLabel={showAuthPassword?"Hide password":"Show password"}><Text style={s.passwordToggleText}>{showAuthPassword?"Hide":"Show"}</Text></TouchableOpacity></View>{authMode==="signup"?<View style={s.passwordRow}><TextInput style={[s.input,s.passwordInput]} value={authConfirmPassword} onChangeText={setAuthConfirmPassword} placeholder="Confirm password" placeholderTextColor="#78939b" secureTextEntry={!showConfirmPassword} autoCapitalize="none"/><TouchableOpacity style={s.passwordToggle} onPress={()=>setShowConfirmPassword(v=>!v)} accessibilityRole="button" accessibilityLabel={showConfirmPassword?"Hide password":"Show password"}><Text style={s.passwordToggleText}>{showConfirmPassword?"Hide":"Show"}</Text></TouchableOpacity></View>:null}<TouchableOpacity style={[s.button,{opacity:authBusy?0.6:1}]} disabled={authBusy} onPress={submitAuth}><Text style={s.buttonText}>{authBusy?"Please wait…":authMode==="signup"?"Create account":"Sign in"}</Text></TouchableOpacity>{authMode==="signin"?<TouchableOpacity style={{padding:12,alignItems:"center"}} disabled={authBusy} onPress={requestPasswordReset}><Text style={{color:C.green,fontWeight:"900"}}>Forgot password?</Text></TouchableOpacity>:null}<TouchableOpacity style={{padding:14,alignItems:"center"}} onPress={()=>setAuthMode(authMode==="signup"?"signin":"signup")}><Text style={{color:C.green,fontWeight:"900"}}>{authMode==="signup"?"Already registered? Sign in":"New to Jett Pal? Create an account"}</Text></TouchableOpacity><Text style={[s.small,{textAlign:"center",marginTop:8}]}>Email and password sign-in is available now. Phone and Google sign-in will be added after the core account flow is tested.</Text></>}</View></ScrollView></SafeAreaView>;
 let body=authLoading&&isSupabaseConfigured?<SafeAreaView style={s.safe}><View style={{flex:1,alignItems:"center",justifyContent:"center"}}><Text style={{color:C.text,fontWeight:"900"}}>Loading Jett Pal account…</Text></View></SafeAreaView>:isSupabaseConfigured&&authRecovery?authScreen():isSupabaseConfigured&&!authSession?authScreen():screen==="home"?home():screen==="search"?searchScreen():screen==="details"?details():screen==="route"?route():screen==="deliveries"?deliveryScreen():screen==="completion"?completionScreen():screen==="stock"?stockScreen():screen==="defects"?defectsScreen():screen==="vehicleLog"?vehicleLogScreen():screen==="vehicleChecklist"?vehicleChecklistScreen():screen==="drivers"?driverManagementScreen():screen==="signoff"?signoffScreen():screen==="saved"?savedScreen():screen==="performance"?performanceScreen():screen==="settings"?settingsScreen():mapScreen();
 return <SafeAreaView style={s.safe}>
  <StatusBar backgroundColor={C.bg} barStyle="light-content"/>
  <View style={{flex:1}}>
    {body}
  </View>
  {!offlineMapExpanded?<View style={{paddingBottom:Platform.OS==="android"?30:12,backgroundColor:C.bg}}>
    <Nav/>
  </View>:null}
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
 safe:{flex:1,backgroundColor:C.bg},content:{padding:16,paddingBottom:50},header:{height:55,flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginBottom:12},brandRow:{flexDirection:"row",alignItems:"center"},brand:{fontSize:22,color:C.text,fontWeight:"900",lineHeight:22},brandSmall:{fontSize:11,color:C.muted},net:{flexDirection:"row",alignItems:"center",gap:6},dot:{width:8,height:8,borderRadius:4},netText:{fontSize:10,color:C.muted,fontWeight:"900"},hero:{alignItems:"center",paddingVertical:18},logoMark:{width:94,height:94,borderRadius:47,borderWidth:6,borderColor:C.green,alignItems:"center",justifyContent:"center",backgroundColor:"#123a28"},logoGlyph:{color:C.green2,fontSize:57,lineHeight:61},uk:{color:C.text,fontSize:10,fontWeight:"900",position:"absolute",bottom:19},heroTitle:{fontSize:29,color:C.text,fontWeight:"900",marginTop:10},pill:{backgroundColor:C.green,paddingHorizontal:12,paddingVertical:5,borderRadius:15,color:"#062010",overflow:"hidden",fontSize:11,fontWeight:"900",marginTop:8},sub:{textAlign:"center",color:C.muted,lineHeight:19,marginTop:10},button:{backgroundColor:C.green,padding:15,borderRadius:13,alignItems:"center",justifyContent:"center",marginTop:10},buttonText:{color:"#062010",fontWeight:"900",fontSize:15},outline:{backgroundColor:"transparent",borderWidth:1,borderColor:C.green},outlineText:{color:C.green},two:{flexDirection:"row",gap:10,marginTop:10},tile:{flex:1,backgroundColor:C.panel,borderWidth:1,borderColor:C.line,borderRadius:14,padding:14},tileIcon:{fontSize:25,color:C.green},tileTitle:{color:C.text,fontWeight:"900",marginTop:4},small:{color:C.muted,fontSize:12,lineHeight:18},card:{backgroundColor:C.panel,borderWidth:1,borderColor:C.line,borderRadius:15,padding:15,marginTop:12},cardTitle:{color:C.text,fontSize:17,fontWeight:"900",marginBottom:8},feature:{color:C.text,paddingVertical:6,fontSize:13},notice:{backgroundColor:"#0b3025",padding:13,borderRadius:12,marginTop:12},greenText:{color:C.green,fontWeight:"900",fontSize:12},title:{color:C.text,fontSize:25,fontWeight:"900",marginBottom:8},search:{flexDirection:"row",alignItems:"center",borderColor:C.green,borderWidth:1,borderRadius:13,backgroundColor:C.panel,paddingHorizontal:12,marginVertical:12},searchGlyph:{fontSize:24,color:C.green},searchInput:{flex:1,color:C.text,padding:12},searchGo:{color:C.green,fontWeight:"900",padding:8},chips:{flexDirection:"row",flexWrap:"wrap",gap:6,marginBottom:10},chip:{borderRadius:20,borderWidth:1,borderColor:C.line,paddingHorizontal:9,paddingVertical:6},chipText:{color:C.muted,fontSize:9,fontWeight:"900"},result:{flexDirection:"row",alignItems:"center",gap:10,padding:12,backgroundColor:C.panel,borderWidth:1,borderColor:C.line,borderRadius:13,marginTop:8},houseIcon:{width:38,height:38,borderRadius:19,backgroundColor:"#123a28",alignItems:"center",justifyContent:"center"},resultTitle:{color:C.text,fontWeight:"900",fontSize:14},arrow:{fontSize:25,color:C.green},bigHouse:{fontSize:43,color:C.green,textAlign:"center"},input:{backgroundColor:C.bg,borderColor:C.line,borderWidth:1,borderRadius:10,padding:12,color:C.text,marginTop:9},passwordRow:{flexDirection:"row",alignItems:"center",marginTop:9},passwordInput:{flex:1,marginTop:0},passwordToggle:{marginLeft:7,minWidth:58,paddingHorizontal:10,paddingVertical:13,backgroundColor:C.panel2,borderRadius:10,alignItems:"center",justifyContent:"center"},passwordToggleText:{color:C.green,fontWeight:"900",fontSize:12},stats:{flexDirection:"row",justifyContent:"space-around",backgroundColor:C.panel,borderRadius:14,padding:15,marginVertical:10},stat:{color:C.text,fontSize:23,fontWeight:"900",textAlign:"center"},foot:{color:C.muted,fontSize:10},stop:{flexDirection:"row",alignItems:"center",gap:9,paddingVertical:11,borderBottomWidth:1,borderBottomColor:C.line},number:{width:30,height:30,borderRadius:15,backgroundColor:C.green,alignItems:"center",justifyContent:"center"},numberText:{color:"#062010",fontWeight:"900"},action:{color:C.green,fontWeight:"900",fontSize:10},delete:{color:C.red,fontSize:23,paddingHorizontal:5},preference:{flexDirection:"row",alignItems:"center",gap:12,paddingVertical:13,borderBottomWidth:1,borderBottomColor:C.line},radio:{width:22,height:22,borderRadius:11,borderWidth:2,alignItems:"center",justifyContent:"center"},radioInner:{width:10,height:10,borderRadius:5,backgroundColor:C.green},welcomeCard:{backgroundColor:"#041a20",borderColor:C.green,borderWidth:2,borderRadius:24,padding:18,alignItems:"center",marginTop:14,marginBottom:18,minHeight:330,justifyContent:"center",overflow:"hidden"},vanStage:{width:"100%",height:190,alignItems:"center",justifyContent:"center",marginBottom:4},heroVan:{width:"100%",height:190},vanBrand:{position:"absolute",bottom:24,color:C.text,fontWeight:"900",fontSize:13,letterSpacing:1,backgroundColor:"#06151d",paddingHorizontal:10},welcomeTitle:{color:C.text,fontSize:27,fontWeight:"900",textAlign:"center",marginTop:6},welcomeUnderline:{height:4,width:"72%",backgroundColor:C.green,borderRadius:4,marginTop:12,marginBottom:16},welcomeSub:{color:C.muted,fontSize:15,lineHeight:22,textAlign:"center",paddingHorizontal:8},homeGrid:{flexDirection:"row",flexWrap:"wrap",justifyContent:"space-between",gap:12},homeTile:{width:"48%",minHeight:150,backgroundColor:C.panel,borderWidth:1,borderColor:C.line,borderRadius:20,padding:14,alignItems:"center",justifyContent:"center"},homeTileIcon:{fontSize:38,color:C.green,marginBottom:8},homeTileTitle:{fontSize:18,fontWeight:"900",color:C.text,textAlign:"center"},homeTileSub:{fontSize:12,color:C.muted,lineHeight:18,textAlign:"center",marginTop:8},homeFoot:{textAlign:"center",fontSize:10,color:C.muted,marginTop:16},proHero:{minHeight:156,backgroundColor:"#03151c",borderWidth:1.5,borderColor:"#27714d",borderRadius:22,overflow:"hidden",padding:14,flexDirection:"row",alignItems:"center",marginTop:7,marginBottom:10},proHeroCopy:{flex:1.06,zIndex:2},proEyebrow:{fontSize:10,fontWeight:"900",letterSpacing:2.2,color:C.green2},proHeroTitle:{fontSize:28,fontWeight:"900",color:C.text,marginTop:6},proHeroSubtitle:{fontSize:11,color:"#d6e4e1",fontWeight:"800",marginTop:3},proOnline:{flexDirection:"row",alignItems:"center",gap:6,marginTop:12,backgroundColor:"#0a3027",paddingHorizontal:10,paddingVertical:6,borderRadius:18,alignSelf:"flex-start"},proOnlineText:{fontSize:9,color:C.text,fontWeight:"900"},proHeroVan:{width:"43%",height:128,borderRadius:12,marginLeft:4},proStats:{flexDirection:"row",justifyContent:"space-between",gap:5,marginBottom:11},proStatCard:{flex:1,minWidth:0,minHeight:86,backgroundColor:"#091f28",borderWidth:1,borderColor:"#294c56",borderRadius:15,paddingVertical:9,paddingHorizontal:2,alignItems:"center",justifyContent:"center"},proStatIcon:{fontSize:19,color:C.green,fontWeight:"900"},proStatValue:{fontSize:20,color:C.text,fontWeight:"900",marginTop:3},proStatLabel:{fontSize:9,color:C.muted,textAlign:"center",marginTop:3},proRateCard:{borderColor:"#34785c"},proRateValue:{fontSize:20,color:C.green,fontWeight:"900",marginBottom:4},proTileGrid:{flexDirection:"row",flexWrap:"wrap",justifyContent:"space-between",gap:9},proTile:{width:"48.5%",minHeight:117,backgroundColor:"#0a222b",borderWidth:1,borderColor:"#31545e",borderRadius:18,padding:10,alignItems:"center",justifyContent:"center",elevation:2},proTileFeatured:{backgroundColor:"#0c3428",borderColor:C.green,borderWidth:1.5},proTileIcon:{fontSize:31,color:C.green,fontWeight:"900",marginBottom:5},proTileTitle:{fontSize:14,color:C.text,fontWeight:"900",textAlign:"center"},proTileSub:{fontSize:10,color:C.muted,textAlign:"center",marginTop:5,lineHeight:14},proInfoGrid:{flexDirection:"row",gap:9,alignItems:"stretch",marginTop:2},proInfoCard:{backgroundColor:"#091f28",borderColor:"#294c56",borderWidth:1,borderRadius:17,padding:11,marginTop:11,minWidth:0},proInfoTitle:{fontSize:12,color:C.text,fontWeight:"900",marginBottom:5},proProgressTrack:{height:9,backgroundColor:C.bg,borderRadius:8,overflow:"hidden",marginVertical:8},proProgressFill:{height:9,backgroundColor:C.green,borderRadius:8},proProgressLabel:{fontSize:10,color:C.green,fontWeight:"900",marginBottom:5},proProgressRow:{flexDirection:"row",alignItems:"center",gap:6,marginTop:5},proBulletDone:{fontSize:11,color:C.green},proBulletMuted:{fontSize:13,color:"#78939b",fontWeight:"900",width:11,textAlign:"center"},proInfoLine:{fontSize:10,color:C.text},proItemRow:{flexDirection:"row",alignItems:"center",gap:5,paddingVertical:12,borderBottomWidth:1,borderBottomColor:C.line},proItemIcon:{fontSize:21,color:C.green},proItemLabel:{fontSize:10,color:C.text,fontWeight:"800"},proItemValue:{fontSize:18,color:C.green,fontWeight:"900",backgroundColor:"#06171d",borderWidth:1,borderColor:C.green,borderRadius:9,paddingHorizontal:10,paddingVertical:2},proActions:{flexDirection:"row",gap:9,marginTop:12},proMainAction:{flex:1,backgroundColor:C.green,borderRadius:13,padding:14,alignItems:"center",justifyContent:"center"},proMainActionText:{fontSize:11,color:"#061c10",fontWeight:"900",textAlign:"center"},proSecondaryAction:{borderRadius:13,borderWidth:1.5,borderColor:C.green,paddingHorizontal:15,alignItems:"center",justifyContent:"center"},proSecondaryActionText:{fontSize:10,color:C.green,fontWeight:"900"},homeWelcome:{backgroundColor:"#061f25",borderWidth:1.5,borderColor:C.green,borderRadius:22,padding:16,alignItems:"center",marginTop:8,marginBottom:14},homeWelcomeImage:{width:"78%",height:175,borderRadius:4,marginBottom:16},homeWelcomeTitle:{fontSize:27,fontWeight:"900",color:C.text,textAlign:"center"},homeWelcomeDivider:{height:5,width:"72%",backgroundColor:C.green,borderRadius:8,marginTop:15,marginBottom:14},homeWelcomeSub:{fontSize:14,lineHeight:22,color:C.muted,textAlign:"center",maxWidth:330},homeClassicGrid:{flexDirection:"row",flexWrap:"wrap",justifyContent:"space-between",gap:12},homeClassicTile:{width:"48%",minHeight:150,backgroundColor:"#0b2730",borderWidth:1.5,borderColor:"#21434d",borderRadius:22,paddingHorizontal:12,paddingVertical:16,alignItems:"center",justifyContent:"center"},homeClassicIcon:{fontSize:30,color:C.green,fontWeight:"700",marginBottom:10},homeClassicTitle:{fontSize:17,color:C.text,fontWeight:"900",textAlign:"center"},homeClassicSub:{fontSize:12,color:C.muted,textAlign:"center",lineHeight:19,marginTop:7},homeHouseFinder:{flexDirection:"row",alignItems:"center",gap:12,backgroundColor:"#0b2730",borderWidth:1.5,borderColor:"#21434d",borderRadius:18,padding:15,marginTop:12},homeHouseArrow:{fontSize:30,color:C.green,fontWeight:"700"},homeOperationsRow:{flexDirection:"row",gap:10,marginTop:12},homeOperationsTile:{flex:1,backgroundColor:"#071f27",borderWidth:1,borderColor:"#21434d",borderRadius:15,padding:13},homeOperationsTitle:{fontSize:13,color:C.text,fontWeight:"900"},homeOperationsSub:{fontSize:10,color:C.muted,marginTop:5,lineHeight:15},homeHero:{minHeight:150,backgroundColor:"#041b20",borderWidth:1,borderColor:"#236b49",borderRadius:22,overflow:"hidden",padding:16,flexDirection:"row",alignItems:"center",marginTop:8,marginBottom:12},homeHeroCopy:{flex:1,zIndex:2},homeHeroEyebrow:{fontSize:10,fontWeight:"900",letterSpacing:2,color:C.green2},homeHeroTitle:{fontSize:27,fontWeight:"900",color:C.text,marginTop:5},homeHeroSub:{fontSize:12,color:"#d3e5df",fontWeight:"700",marginTop:2},homeOnline:{flexDirection:"row",alignItems:"center",gap:6,marginTop:12,backgroundColor:"#0a3027",paddingHorizontal:10,paddingVertical:6,borderRadius:20,alignSelf:"flex-start"},homeOnlineText:{fontSize:9,color:C.text,fontWeight:"900"},homeHeroVan:{width:"43%",height:120,marginLeft:-8},homeStats:{flexDirection:"row",flexWrap:"wrap",justifyContent:"space-between",gap:7,marginBottom:12},homeStatCard:{width:"19%",minWidth:58,flexGrow:1,backgroundColor:"#0a222b",borderWidth:1,borderColor:"#28505a",borderRadius:13,paddingVertical:10,paddingHorizontal:3,alignItems:"center",justifyContent:"center"},homeStatIcon:{fontSize:20,color:C.green,fontWeight:"900"},homeStatValue:{fontSize:19,color:C.text,fontWeight:"900",marginTop:2},homeStatLabel:{fontSize:9,color:C.muted,textAlign:"center",marginTop:2},homeProTile:{width:"48.5%",minHeight:112,backgroundColor:"#0a222b",borderWidth:1,borderColor:"#28505a",borderRadius:17,padding:12,alignItems:"center",justifyContent:"center"},homeProTilePrimary:{backgroundColor:"#103526",borderColor:C.green,borderWidth:1.5},homeProIcon:{fontSize:31,color:C.green,fontWeight:"900",marginBottom:4},homeProTitle:{fontSize:14,color:C.text,fontWeight:"900",textAlign:"center"},homeProSub:{fontSize:10,color:C.muted,textAlign:"center",marginTop:4},homeInfoRow:{flexDirection:"row",gap:9,alignItems:"stretch"},homeInfoCard:{flex:1,padding:11,marginTop:12,minWidth:0},progressTrack:{height:9,backgroundColor:C.bg,borderRadius:8,overflow:"hidden",marginVertical:9},progressFill:{height:9,backgroundColor:C.green,borderRadius:8},homeItemRow:{flexDirection:"row",alignItems:"center",gap:6,paddingVertical:11,borderBottomWidth:1,borderBottomColor:C.line},homeItemIcon:{fontSize:20,color:C.green},homeItemLabel:{fontSize:10,color:C.text,fontWeight:"800"},homeItemValue:{fontSize:18,color:C.green,fontWeight:"900"},homeQuickActions:{flexDirection:"row",gap:9,marginTop:12},homeQuickPrimary:{flex:1,backgroundColor:C.green,borderRadius:13,padding:14,alignItems:"center",justifyContent:"center"},homeQuickPrimaryText:{color:"#062010",fontSize:12,fontWeight:"900",textAlign:"center"},homeQuickSecondary:{paddingHorizontal:15,borderRadius:13,borderWidth:1,borderColor:C.green,alignItems:"center",justifyContent:"center"},homeQuickSecondaryText:{color:C.green,fontSize:11,fontWeight:"900"},mapPlaceholder:{backgroundColor:C.panel,borderColor:C.line,borderWidth:1,borderRadius:15,padding:24,alignItems:"center",marginVertical:12},mapPin:{color:C.green,fontSize:52},nav:{height:65,flexDirection:"row",backgroundColor:"#041019",borderTopWidth:1,borderTopColor:C.line},navItem:{flex:1,alignItems:"center",justifyContent:"center"},navIcon:{fontSize:22,color:C.muted},navLabel:{fontSize:10,color:C.muted,marginTop:3,fontWeight:"800"},active:{color:C.green}
});
